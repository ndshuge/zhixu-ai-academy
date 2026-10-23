import { clamp } from './config.mjs';
import { tanhApprox } from './math.mjs';
export const INPUTS = ['食物方向 X','食物方向 Y','食物接近度','能量 / 120','信号方向 X','信号方向 Y','信号可信度','邻居密度','协作资源','寿命比例','探索方向 X','探索方向 Y'];
export const OUTPUTS = ['移动 X','移动 Y','休息','发送信息','分享能量'];
export const SHAPE = [12, 8, 5];
export const WEIGHT_COUNT = 12 * 8 + 8 + 8 * 5 + 5;
export const MACS = 12 * 8 + 8 * 5;
export function newGenome(rng, guided = true) {
  const traits = { speed: 0.8 + rng.next() * 0.4, sense: 3.5 + rng.next() * 2,
    metabolism: 0.85 + rng.next() * 0.3, cooperation: rng.next(), lifespan: 650 + rng.next() * 500 };
  const weights = Array.from({length: WEIGHT_COUNT}, () => rng.signed() * (guided ? 0.06 : 0.75));
  if (guided) {
    // Explicit heuristic initialization; all behavior still passes through the matrix operations.
    for (let h = 0; h < 8; h++) weights[h * 12 + [0,1,4,5,3,2,8,7][h]] += h < 4 ? 1.8 : 1;
    weights[0 * 12 + 10] += 0.65; weights[1 * 12 + 11] += 0.65;
    const o = 104;
    weights[o + 0 * 8 + 0] += 2; weights[o + 0 * 8 + 2] += 1.6;
    weights[o + 1 * 8 + 1] += 2; weights[o + 1 * 8 + 3] += 1.6;
    weights[o + 2 * 8 + 5] += 1.8; weights[144 + 2] -= 0.7;
    weights[o + 3 * 8 + 5] += 1.5; weights[144 + 3] += 0.1;
    weights[o + 4 * 8 + 4] += 2; weights[144 + 4] -= 0.55;
  }
  return { traits, weights };
}
export function mutateGenome(genome, rng, rate, scale) {
  const g = structuredClone(genome);
  const bounds = { speed: [0.5, 1.5], sense: [2, 7], metabolism: [0.65, 1.4], cooperation: [0, 1], lifespan: [450, 1500] };
  for (const [k, [lo, hi]] of Object.entries(bounds)) if (rng.next() < rate)
    g.traits[k] = clamp(g.traits[k] + rng.signed() * scale * (hi - lo), lo, hi);
  g.weights = g.weights.map(w => rng.next() < rate ? clamp(w + rng.signed() * scale, -4, 4) : w);
  return g;
}
export function forward(weights, inputs) {
  if (weights.length !== WEIGHT_COUNT || inputs.length !== 12) throw new Error('Invalid neural shape');
  const hidden = new Array(8), outputs = new Array(5);
  for (let h = 0; h < 8; h++) {
    let z = weights[96 + h];
    for (let i = 0; i < 12; i++) z += weights[h * 12 + i] * inputs[i];
    hidden[h] = tanhApprox(z);
  }
  for (let o = 0; o < 5; o++) {
    let z = weights[144 + o];
    for (let h = 0; h < 8; h++) z += weights[104 + o * 8 + h] * hidden[h];
    outputs[o] = tanhApprox(z);
  }
  return { inputs: [...inputs], hidden, outputs };
}
export function decide(agent, sensory, pad = false) {
  let brain = agent.controller === 'neural' || pad ? forward(agent.genome.weights, sensory.inputs) : null;
  let outputs;
  if (agent.controller === 'neural') outputs = brain.outputs;
  else {
    const i = sensory.inputs;
    const food = i[2] > 0, message = i[6] > 0;
    outputs = [food ? i[0] : message ? i[4] : i[10], food ? i[1] : message ? i[5] : i[11],
      i[2] > 0.9 ? 1 : -1, food ? 1 : -1, i[3] > 0.67 ? 1 : -1];
    brain = { inputs: [...i], hidden: [], outputs };
  }
  return { x: outputs[0], y: outputs[1], rest: outputs[2] > 0.5, signal: outputs[3] > 0,
    share: outputs[4] > 0.2, brain };
}

