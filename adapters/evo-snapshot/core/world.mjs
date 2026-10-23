import { ENGINE_VERSION, validateConfig, stream, noise, clamp, hash32 } from './config.mjs';
import { newGenome, mutateGenome, decide, forward, MACS } from './controllers.mjs';
import { norm, sinCos } from './math.mjs';
const sum = a => a.reduce((s, v) => s + v, 0);
const wrap = (x, size) => ((x % size) + size) % size;
const delta = (a, b, size) => { let d = b - a; if (d > size / 2) d -= size; if (d < -size / 2) d += size; return d; };
export class World {
  constructor(config = {}) {
    this.config = validateConfig(config); const c = this.config;
    this.tick = 0; this.nextId = 1; this.rng = stream(c.seed, 'mutation');
    this.agents = []; this.lineage = []; this.events = []; this.history = []; this.messages = [];
    this.founderWeights = []; this.lineageDropped = 0; this.historyDropped = 0;
    this.stats = { births: 0, deaths: 0, eaten: 0, shared: 0, cooperativeHarvest: 0, messagesSent: 0,
      messagesDelivered: 0, controllerCalls: 0, neuralEvaluations: 0, routingChecks: 0, cappedBirths: 0 };
    this.ledger = { initial: 0, sunlight: 0, heat: 0 };
    const n = c.width * c.height, env = stream(c.seed, 'environment');
    this.food = new Float64Array(n); this.hard = new Float64Array(n); this.detritus = new Float64Array(n);
    this.foodCap = new Float64Array(n); this.hardCap = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      this.foodCap[i] = env.next() < 0.62 ? 4 + 4 * env.next() : 0;
      this.hardCap[i] = env.next() < 0.045 ? 12 + 12 * env.next() : 0;
      this.food[i] = this.foodCap[i] * c.resourceDensity * (0.3 + 0.7 * env.next());
      this.hard[i] = (c.hardResources ? this.hardCap[i] : 0) * c.resourceDensity;
    }
    const placement = stream(c.seed, 'placement');
    for (let j = 0; j < c.initialPopulation; j++) {
      const genome = newGenome(stream(c.seed, `founder:${j}`), c.neuralInit === 'guided');
      if (!c.cooperation) genome.traits.cooperation = 0;
      const ctrl = c.controller === 'mixed' ? (j % 2 ? 'neural' : 'rule') : c.controller;
      const a = this.createAgent(placement.next() * c.width, placement.next() * c.height, 58, genome, ctrl);
      this.founderWeights.push([...genome.weights]); this.agents.push(a);
    }
    this.ledger.initial = this.storedEnergy(); this.sample();
  }
  createAgent(x, y, energy, genome, controller, parent = null) {
    const id = this.nextId++, generation = parent ? parent.generation + 1 : 0;
    const a = { id, parentId: parent?.id ?? null, generation, birthTick: this.tick, x, y, energy, age: 0,
      genome, controller, children: 0, cooldown: 0, harvested: 0, action: '出生', brain: null, target: null };
    this.lineage.push({ id, parentId: a.parentId, generation, birthTick: this.tick, deathTick: null, controller });
    if (this.lineage.length > this.config.lineageLimit) { this.lineage.shift(); this.lineageDropped++; }
    this.event('birth', id, parent?.id ?? null); return a;
  }
  event(type, id, related = null, amount = null) {
    this.events.push({ tick: this.tick, type, id, related, amount });
    if (this.events.length > 160) this.events.shift();
  }
  cell(x, y) { return Math.floor(wrap(y, this.config.height)) * this.config.width + Math.floor(wrap(x, this.config.width)); }
  distance(a, b) { return norm(delta(a.x, b.x, this.config.width), delta(a.y, b.y, this.config.height)); }
  storedEnergy() { return sum(this.food) + sum(this.hard) + sum(this.detritus) + this.agents.reduce((s, a) => s + a.energy, 0); }
  energyBalance() { return this.storedEnergy() + this.ledger.heat - this.ledger.initial - this.ledger.sunlight; }
  spend(a, amount) { const spent = Math.min(a.energy, Math.max(0, amount)); a.energy -= spent; this.ledger.heat += spent; return spent; }
  climate() {
    const c = this.config, phase = Math.floor(this.tick / c.seasonLength);
    if (c.environment === 'stable') return { phase: 0, label: '稳定', growth: 1, left: 1, right: 1 };
    if (c.environment === 'shifting') return { phase, label: phase % 2 ? '资源向东迁移' : '资源向西迁移', growth: 1,
      left: phase % 2 ? 0.18 : 1.8, right: phase % 2 ? 1.8 : 0.18 };
    return { phase, label: phase % 2 ? '旱季' : '丰季', growth: phase % 2 ? 0.24 : 1.35, left: 1, right: 1 };
  }
  regenerate() {
    const c = this.config, climate = this.climate();
    for (let i = 0; i < this.food.length; i++) {
      if (this.foodCap[i] > 0) {
        const room = this.foodCap[i] - this.food[i], recycle = Math.min(this.detritus[i], room, 0.025);
        this.detritus[i] -= recycle; this.food[i] += recycle;
        const sun = Math.min(Math.max(0, room - recycle), c.regeneration * climate.growth * (i % c.width < c.width / 2 ? climate.left : climate.right));
        this.food[i] += sun; this.ledger.sunlight += sun;
      }
      if (c.hardResources && this.hardCap[i] > 0) {
        const sun = Math.min(this.hardCap[i] - this.hard[i], c.regeneration * 0.65 * climate.growth);
        this.hard[i] += sun; this.ledger.sunlight += sun;
      }
    }
  }
  buildIndex() {
    this.bins = new Map(); this.binSize = 3;
    this.binCols = Math.ceil(this.config.width / 3); this.binRows = Math.ceil(this.config.height / 3);
    for (const a of this.agents) {
      const key = Math.floor(a.y / 3) * this.binCols + Math.floor(a.x / 3);
      if (!this.bins.has(key)) this.bins.set(key, []); this.bins.get(key).push(a);
    }
  }
  neighbors(a, radius) {
    const result = [], seen = new Set(), bx = Math.floor(a.x / 3), by = Math.floor(a.y / 3), r = Math.ceil(radius / 3) + 1;
    for (let y = by - r; y <= by + r; y++) for (let x = bx - r; x <= bx + r; x++) {
      const key = wrap(y, this.binRows) * this.binCols + wrap(x, this.binCols);
      if (seen.has(key)) continue; seen.add(key);
      for (const b of this.bins.get(key) ?? []) if (b.id !== a.id && this.distance(a, b) <= radius) result.push(b);
    }
    return result;
  }
  foodTarget(a) {
    const c = this.config, radius = a.genome.traits.sense, cx = Math.floor(a.x), cy = Math.floor(a.y);
    let best = null, bestDist = Infinity;
    for (let r = 0; r <= Math.ceil(radius); r++) {
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        if (r && Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
        const x = wrap(cx + dx, c.width), y = wrap(cy + dy, c.height), cell = y * c.width + x;
        const hard = c.cooperation && a.genome.traits.cooperation > 0.5 && this.hard[cell] > 1;
        if (this.food[cell] < 0.3 && !hard) continue;
        const dist = this.distance(a, {x:x+0.5,y:y+0.5});
        if (dist <= radius && dist < bestDist) { bestDist = dist; best = { x:x+0.5, y:y+0.5, cell, hard: this.food[cell] < 0.3 }; }
      }
      if (best && bestDist < r - 0.75) break;
    }
    return best ? { ...best, distance: bestDist } : null;
  }
  sense(a, messages, centralTarget = null) {
    const c = this.config, food = this.foodTarget(a), neighbors = this.neighbors(a, c.communicationRadius);
    let signal = centralTarget;
    if (c.communication === 'local') {
      let score = Infinity;
      for (const b of neighbors) {
        this.stats.routingChecks++;
        const m = messages.get(b.id);
        if (!m || this.tick - m.tick > 12 || noise(c.seed, a.id ^ b.id, this.tick) < c.dropout) continue;
        const d = this.distance(a, m);
        if (d < score) { signal = m; score = d; }
      }
    }
    if (signal) this.stats.messagesDelivered++;
    const fDist = food?.distance ?? 1, mDist = signal ? this.distance(a, signal) : 1;
    const epoch = Math.floor(this.tick / 22);
    if (a.exploration?.epoch !== epoch) a.exploration = {epoch, vector: sinCos(noise(c.seed, a.id, epoch) * 6.283185307179586)};
    const [wanderX,wanderY] = a.exploration.vector;
    const inputs = [food ? delta(a.x, food.x, c.width) / Math.max(0.5, fDist) : 0,
      food ? delta(a.y, food.y, c.height) / Math.max(0.5, fDist) : 0,
      food ? (food.cell === this.cell(a.x, a.y) ? 1 : 0.7 * (1 - Math.min(1, fDist / a.genome.traits.sense))) : 0, clamp(a.energy / 120, 0, 1),
      signal ? delta(a.x, signal.x, c.width) / Math.max(0.5, mDist) : 0,
      signal ? delta(a.y, signal.y, c.height) / Math.max(0.5, mDist) : 0, signal ? 1 - (this.tick - signal.tick) / 13 : 0,
      Math.min(1, neighbors.length / 6), food?.hard ? 1 : 0,
      Math.min(1, a.age / (a.genome.traits.lifespan * c.lifespanScale)), wanderX, wanderY];
    return { inputs, food, neighbors };
  }
  routeCentral() {
    const out = new Map(), c = this.config;
    if (c.communication !== 'central' || noise(c.seed, 991, this.tick) < c.dropout) return out;
    const pool = [...this.messages].filter(m => this.tick - m.tick <= 12), used = new Set();
    for (let j = 0; j < this.agents.length; j++) {
      const a = this.agents[(j + this.tick) % this.agents.length]; let best = null, d = Infinity;
      for (const m of pool) {
        this.stats.routingChecks++;
        if (used.has(m.cell)) continue;
        const dist = this.distance(a, m); if (dist < d) { best = m; d = dist; }
      }
      if (best) { out.set(a.id, best); used.add(best.cell); }
    }
    return out;
  }
  step(count = 1) {
    if (!Number.isInteger(count) || count < 0 || count > 1000000) throw new Error('Invalid step count');
    for (let i = 0; i < count; i++) this.stepOnce(); return this;
  }
  stepOnce() {
    const c = this.config; this.tick++; this.regenerate(); this.buildIndex();
    const previous = new Map(this.messages.map(m => [m.id, m])), central = this.routeCentral(), decisions = new Map();
    for (const a of this.agents) {
      const sensory = this.sense(a, previous, central.get(a.id)), action = decide(a, sensory, c.padControllerBudget);
      decisions.set(a.id, { sensory, action });
      a.brain = action.brain; a.target = sensory.food; this.stats.controllerCalls++;
      if (a.controller === 'neural' || c.padControllerBudget) this.stats.neuralEvaluations++;
    }
    if (c.padControllerBudget) for (let i = 0; i < c.initialPopulation - this.agents.length; i++) {
      forward(this.founderWeights[i], Array(12).fill(0)); this.stats.neuralEvaluations++;
    }
    const foodClaims = new Map(), hardClaims = new Map(), messages = [];
    for (const a of this.agents) {
      const { sensory, action } = decisions.get(a.id);
      a.age++; a.cooldown = Math.max(0, a.cooldown - 1);
      const g = a.genome.traits;
      let length = norm(action.x, action.y), movement = action.rest ? 0 : 0.32 * g.speed * Math.min(1, length);
      // Energy must pay for movement. Zero-energy agents cannot move before dying.
      const base = (action.rest ? 0.025 : 0.045) * g.metabolism + 0.002;
      movement = Math.min(movement, Math.max(0, (a.energy - base) / 0.1));
      this.spend(a, base + movement * 0.1);
      if (length > 1e-12 && movement > 0) { a.x = wrap(a.x + action.x / length * movement, c.width); a.y = wrap(a.y + action.y / length * movement, c.height); }
      a.action = movement > 0.001 ? '移动' : '休息';
      const cell = this.cell(a.x, a.y);
      if (a.energy > 0 && a.energy < 120) { if (!foodClaims.has(cell)) foodClaims.set(cell, []); foodClaims.get(cell).push(a); }
      if (c.cooperation && g.cooperation > 0.5 && a.energy > 0) {
        if (!hardClaims.has(cell)) hardClaims.set(cell, []); hardClaims.get(cell).push(a);
      }
      if (c.communication !== 'none' && action.signal && sensory.food && a.energy > 0.015) {
        this.spend(a, 0.015); messages.push({ id: a.id, tick: this.tick, x: sensory.food.x, y: sensory.food.y, cell: sensory.food.cell });
        this.stats.messagesSent++;
      }
    }
    this.messages = messages;
    const harvest = (claims, resource, rate, cooperative) => {
      for (const [cell, group] of claims) {
        if (cooperative && group.length < 2) continue;
        // Proportional settlement is independent of individual iteration order.
        const requests = group.map(a => Math.min(rate, Math.max(0, 120 - a.energy))), demand = sum(requests);
        const total = Math.min(resource[cell], demand), fraction = demand > 0 ? total / demand : 0;
        resource[cell] -= total;
        for (let j = 0; j < group.length; j++) {
          const e = requests[j] * fraction, a = group[j]; a.energy += e; a.harvested += e;
          if (e > 0.001) a.action = cooperative ? '协作采集' : '觅食';
        }
        this.stats.eaten += total; if (cooperative) this.stats.cooperativeHarvest += total;
      }
    };
    harvest(foodClaims, this.food, 0.65, false); harvest(hardClaims, this.hard, 1.6, true);
    this.buildIndex();
    if (c.cooperation) for (let j = 0; j < this.agents.length; j++) {
      const a = this.agents[(j + this.tick) % this.agents.length];
      if (a.energy < 80 || a.genome.traits.cooperation < 0.5 || !decisions.get(a.id).action.share) continue;
      const b = this.neighbors(a, 1.6).filter(b => b.energy < 30 && b.energy > 0).sort((u, v) => u.energy - v.energy || u.id - v.id)[0];
      if (b) { a.energy -= 0.8; b.energy += 0.8; this.stats.shared += 0.8; this.spend(a, 0.01); this.event('share', a.id, b.id, 0.8); }
    }
    const survivors = [], births = [];
    const dead = this.agents.filter(a => a.energy <= 1e-10 || a.age >= a.genome.traits.lifespan * c.lifespanScale);
    const deathIds = new Set(dead.map(a => a.id));
    const availableSlots = c.maxPopulation - (this.agents.length - dead.length);
    // Rotate access to limited reproduction slots; no fixed low-ID privilege.
    const candidates = this.agents.length ? [...this.agents.slice(this.tick % this.agents.length), ...this.agents.slice(0, this.tick % this.agents.length)] : [];
    for (const a of candidates) {
      if (deathIds.has(a.id)) {
        this.detritus[this.cell(a.x, a.y)] += a.energy; a.energy = 0; this.stats.deaths++;
        const record = this.lineage.find(l => l.id === a.id); if (record) record.deathTick = this.tick;
        this.event('death', a.id); continue;
      }
      if (c.reproduction && a.energy >= 88 && a.age >= 60 && a.cooldown === 0) {
        if (births.length < availableSlots) {
          const genome = mutateGenome(a.genome, this.rng, c.mutationRate, c.mutationScale);
          if (!c.cooperation) genome.traits.cooperation = 0;
          this.spend(a, 3); a.energy -= 28;
          const child = this.createAgent(wrap(a.x + this.rng.signed() * 0.6, c.width), wrap(a.y + this.rng.signed() * 0.6, c.height), 28, genome, a.controller, a);
          births.push(child); a.children++; a.cooldown = 65; this.stats.births++;
        } else this.stats.cappedBirths++;
      }
      survivors.push(a);
    }
    // Stable ID order forms the next synchronous snapshot.
    this.agents = [...survivors, ...births].sort((a, b) => a.id - b.id);
    if (this.tick % c.sampleEvery === 0) this.sample();
  }
  metrics() {
    const population = this.agents.length, mean = k => population ? this.agents.reduce((s,a) => s + a.genome.traits[k], 0) / population : 0;
    const energy = this.agents.reduce((s, a) => s + a.energy, 0), sense = mean('sense');
    const traitDiversity = population ? this.agents.reduce((s, a) => s + (a.genome.traits.sense - sense) ** 2, 0) / population : 0;
    const generation = this.agents.reduce((m,a) => Math.max(m, a.generation), 0);
    const neural = this.agents.filter(a => a.controller === 'neural').length;
    return { tick: this.tick, population, rule: population - neural, neural, meanEnergy: population ? energy / population : 0,
      generation, food: sum(this.food), hard: sum(this.hard), detritus: sum(this.detritus), agentEnergy: energy,
      sunlight: this.ledger.sunlight, heat: this.ledger.heat, balanceError: this.energyBalance(), traitDiversity,
      meanCooperation: mean('cooperation'), meanSpeed: mean('speed'), ...this.stats, neuralMACs: this.stats.neuralEvaluations * MACS };
  }
  sample() { this.history.push(this.metrics()); if (this.history.length > this.config.historyLimit) { this.history.shift(); this.historyDropped++; } }
  ancestry(id, limit = 24) {
    const out = []; let record = this.lineage.find(l => l.id === id);
    while (record && out.length < limit) { out.push(record); record = this.lineage.find(l => l.id === record.parentId); }
    return out;
  }
  inspect(id) { const a = this.agents.find(a => a.id === id); return a ? { ...structuredClone(a), ancestry: this.ancestry(id), childrenRecords: this.lineage.filter(l => l.parentId === id).slice(-24) } : null; }
  view(selectedId = null) {
    return { version: ENGINE_VERSION, config: this.config, tick: this.tick, metrics: this.metrics(), climate: this.climate(),
      food: this.food, hard: this.hard, detritus: this.detritus, foodCap: this.foodCap, hardCap: this.hardCap,
      agents: this.agents.map(a => ({ id:a.id, x:a.x, y:a.y, energy:a.energy, generation:a.generation, controller:a.controller, action:a.action, target:a.target })),
      selected: selectedId ? this.inspect(selectedId) : null, history: this.history, events: this.events,
      lineageDropped: this.lineageDropped, historyDropped: this.historyDropped };
  }
  snapshot() {
    return { version: ENGINE_VERSION, config: this.config, tick: this.tick, nextId: this.nextId, rng: this.rng.state,
      agents: structuredClone(this.agents), lineage: structuredClone(this.lineage), history: structuredClone(this.history),
      events: structuredClone(this.events), messages: structuredClone(this.messages), ledger: {...this.ledger}, stats:{...this.stats},
      founderWeights: structuredClone(this.founderWeights), lineageDropped:this.lineageDropped, historyDropped:this.historyDropped,
      fields: Object.fromEntries(['food','hard','detritus','foodCap','hardCap'].map(k => [k, Array.from(this[k])])) };
  }
  static restore(data) {
    if (data?.version !== ENGINE_VERSION) throw new Error('Snapshot version mismatch');
    const w = new World(data.config), n = w.config.width * w.config.height;
    if (!Number.isInteger(data.tick) || data.tick < 0 || !Array.isArray(data.agents) || data.agents.length > w.config.maxPopulation) throw new Error('Invalid snapshot');
    if (!Number.isInteger(data.nextId) || data.nextId < 1 || !Number.isInteger(data.rng) || data.rng < 0 || data.rng > 4294967295) throw new Error('Invalid snapshot counters');
    for (const [k, cap] of [['lineage', w.config.lineageLimit], ['history', w.config.historyLimit], ['events', 160], ['messages', w.config.maxPopulation], ['founderWeights', w.config.initialPopulation]])
      if (!Array.isArray(data[k]) || data[k].length > cap) throw new Error(`Invalid bounded snapshot collection: ${k}`);
    for (const k of ['lineageDropped', 'historyDropped']) if (!Number.isInteger(data[k]) || data[k] < 0) throw new Error('Invalid snapshot truncation count');
    for (const k of Object.keys(w.ledger)) if (!Number.isFinite(data.ledger?.[k]) || data.ledger[k] < 0) throw new Error('Invalid snapshot ledger');
    for (const k of Object.keys(w.stats)) if (!Number.isFinite(data.stats?.[k]) || data.stats[k] < 0) throw new Error('Invalid snapshot statistics');
    const ids = new Set();
    for (const k of ['food','hard','detritus','foodCap','hardCap']) {
      const a = data.fields?.[k]; if (!Array.isArray(a) || a.length !== n || a.some(v => !Number.isFinite(v) || v < 0)) throw new Error(`Invalid field: ${k}`);
      w[k] = Float64Array.from(a);
    }
    for (const a of data.agents) {
      if (!Number.isInteger(a.id) || a.id < 1 || !['rule','neural'].includes(a.controller) || !Number.isFinite(a.energy) || a.energy < 0 || a.energy > 120 || !Number.isFinite(a.x) || !Number.isFinite(a.y) || a.x < 0 || a.x >= w.config.width || a.y < 0 || a.y >= w.config.height || a.genome?.weights?.length !== 149 || a.genome.weights.some(v => !Number.isFinite(v))) throw new Error('Invalid agent in snapshot');
      if (ids.has(a.id) || a.id >= data.nextId) throw new Error('Duplicate or invalid agent identity'); ids.add(a.id);
      for (const k of ['age','generation','birthTick','children','cooldown']) if (!Number.isInteger(a[k]) || a[k] < 0) throw new Error('Invalid agent lifecycle');
      if (!Number.isFinite(a.harvested) || a.harvested < 0 || a.genome.weights.some(v => Math.abs(v) > 4)) throw new Error('Invalid genome or harvest value');
      for (const [k, lo, hi] of [['speed',.5,1.5],['sense',2,7],['metabolism',.65,1.4],['cooperation',0,1],['lifespan',450,1500]])
        if (!Number.isFinite(a.genome.traits?.[k]) || a.genome.traits[k] < lo || a.genome.traits[k] > hi) throw new Error('Invalid heritable trait');
      if (a.parentId !== null && (!Number.isInteger(a.parentId) || a.parentId < 1 || a.parentId >= a.id)) throw new Error('Invalid parent identity');
    }
    for (const weights of data.founderWeights) if (!Array.isArray(weights) || weights.length !== 149 || weights.some(v => !Number.isFinite(v) || Math.abs(v) > 4)) throw new Error('Invalid founder genome');
    for (const h of data.history) for (const k of Object.keys(w.history[0])) if (!Number.isFinite(h[k])) throw new Error('Invalid snapshot history');
    for (const r of data.lineage) if (!Number.isInteger(r.id) || r.id < 1 || r.id >= data.nextId || !Number.isInteger(r.generation) || r.generation < 0 || !Number.isInteger(r.birthTick) || r.birthTick < 0 || (r.parentId !== null && (!Number.isInteger(r.parentId) || r.parentId < 1 || r.parentId >= r.id))) throw new Error('Invalid lineage record');
    for (const m of data.messages) if (!Number.isFinite(m.x) || !Number.isFinite(m.y) || !Number.isInteger(m.id) || !Number.isInteger(m.tick) || !Number.isInteger(m.cell) || m.cell < 0 || m.cell >= n) throw new Error('Invalid published message');
    for (const k of ['agents','lineage','history','events','messages','ledger','stats','founderWeights','lineageDropped','historyDropped','tick','nextId']) w[k] = structuredClone(data[k]);
    w.rng.state = data.rng >>> 0;
    if (!Number.isFinite(w.energyBalance()) || Math.abs(w.energyBalance()) > 0.0001) throw new Error('Snapshot energy ledger inconsistent');
    return w;
  }
  digest() { return hash32(JSON.stringify(this.snapshot())).toString(16).padStart(8, '0'); }
}

