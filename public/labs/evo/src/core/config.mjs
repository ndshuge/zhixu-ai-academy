export const ENGINE_VERSION = 'evoworld-0.1.1';
export const DEFAULTS = Object.freeze({ seed: 42, width: 48, height: 32, initialPopulation: 80, maxPopulation: 500,
  controller: 'mixed', neuralInit: 'guided', mutationRate: 0.04, mutationScale: 0.16,
  regeneration: 0.024, resourceDensity: 0.7, hardResources: true, cooperation: true,
  communication: 'local', communicationRadius: 6, dropout: 0, environment: 'seasonal', seasonLength: 400,
  reproduction: true, lifespanScale: 1, padControllerBudget: false, historyLimit: 1200, lineageLimit: 20000,
  sampleEvery: 10, unitsPerCell: 1, secondsPerTick: 0.1 });
const numeric = { seed: [0, 4294967295], width: [12, 96], height: [12, 72], initialPopulation: [0, 2048],
  maxPopulation: [1, 2048], mutationRate: [0, 1], mutationScale: [0, 1], regeneration: [0, 0.2],
  resourceDensity: [0, 1], communicationRadius: [1, 15], dropout: [0, 1], seasonLength: [40, 10000],
  lifespanScale: [0.05, 20], historyLimit: [1, 10000], lineageLimit: [1, 100000], sampleEvery: [1, 1000],
  unitsPerCell: [0.01, 100], secondsPerTick: [0.001, 10] };
const integer = new Set(['seed','width','height','initialPopulation','maxPopulation','seasonLength','historyLimit','lineageLimit','sampleEvery']);
export function validateConfig(input = {}) {
  for (const k of Object.keys(input)) if (!(k in DEFAULTS)) throw new Error(`Unknown parameter: ${k}`);
  const c = { ...DEFAULTS, ...input };
  for (const [k, [lo, hi]] of Object.entries(numeric)) {
    if (!Number.isFinite(c[k]) || c[k] < lo || c[k] > hi || (integer.has(k) && !Number.isInteger(c[k])))
      throw new Error(`${k} must be ${integer.has(k) ? 'an integer ' : ''}in [${lo}, ${hi}]`);
  }
  if (c.initialPopulation > c.maxPopulation) throw new Error('Initial population exceeds population cap');
  for (const [k, options] of Object.entries({ controller: ['rule','neural','mixed'], neuralInit: ['random','guided'],
    communication: ['none','local','central'], environment: ['stable','seasonal','shifting'] }))
    if (!options.includes(c[k])) throw new Error(`Invalid ${k}`);
  for (const k of ['hardResources','cooperation','reproduction','padControllerBudget']) if (typeof c[k] !== 'boolean') throw new Error(`${k} must be boolean`);
  if (c.padControllerBudget && c.reproduction) throw new Error('Matched controller budget requires a fixed founder cohort (reproduction=false)');
  return c;
}
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export function hash32(text) {
  let h = 2166136261;
  for (let i = 0; i < String(text).length; i++) h = Math.imul(h ^ String(text).charCodeAt(i), 16777619);
  return h >>> 0;
}
export class RNG {
  constructor(seed) { this.root = seed >>> 0; this.state = seed >>> 0; }
  next() {
    this.state = (this.state + 0x6D2B79F5) >>> 0;
    let t = this.state; t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
  signed() { return this.next() * 2 - 1; }
  derive(label) { return new RNG(hash32(`${this.root}:${label}`)); }
}
export const stream = (seed, label) => new RNG(hash32(`${seed}:${label}`));
export function noise(seed, id, epoch) {
  let n = Math.imul((seed ^ id ^ Math.imul(epoch, 374761393)) >>> 0, 668265263);
  n = Math.imul(n ^ n >>> 13, 1274126177);
  return ((n ^ n >>> 16) >>> 0) / 4294967296;
}
