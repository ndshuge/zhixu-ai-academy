import { stream } from './config.mjs';
export const mean = v => v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
export function summary(values) {
  const m = mean(values), n = values.length;
  return { n, mean: m, sd: n > 1 ? Math.sqrt(values.reduce((s,x) => s + (x-m)**2, 0) / (n-1)) : 0,
    min: n ? Math.min(...values) : 0, max: n ? Math.max(...values) : 0 };
}
export function pairedInference(a, b, seed = 1, bootstrapCount = 4000) {
  if (a.length !== b.length || a.length < 2 || a.some(x => !Number.isFinite(x)) || b.some(x => !Number.isFinite(x))) throw new Error('Paired inference requires >=2 finite matched pairs');
  const diffs = a.map((v,i) => v-b[i]), n = diffs.length, observed = Math.abs(mean(diffs)), rng = stream(seed,'statistics');
  const boots = [];
  for (let k = 0; k < bootstrapCount; k++) { let s = 0; for (let i = 0; i < n; i++) s += diffs[Math.floor(rng.next() * n)]; boots.push(s/n); }
  boots.sort((a,b) => a-b);
  let extreme = 0, draws;
  if (n <= 16) {
    draws = 2 ** n;
    for (let mask=0; mask<draws; mask++) { let s=0; for (let i=0;i<n;i++) s += (mask & 2**i ? 1 : -1) * diffs[i]; if (Math.abs(s/n) >= observed - 1e-12) extreme++; }
  } else {
    draws = 20000;
    for (let k=0;k<draws;k++) { let s=0; for (const d of diffs) s += (rng.next()<0.5?1:-1)*d; if (Math.abs(s/n) >= observed-1e-12) extreme++; }
  }
  return { n, difference:mean(diffs), ci95:[boots[Math.floor(0.025*bootstrapCount)],boots[Math.floor(0.975*bootstrapCount)]],
    p: n<=16 ? extreme/draws : (extreme+1)/(draws+1), method:n<=16?'exact paired sign-flip + percentile paired bootstrap':'Monte Carlo paired sign-flip + percentile paired bootstrap', bootstrapCount, signFlipDraws:draws };
}
export function holm(contrasts) {
  const sorted = contrasts.map((x,i) => ({...x,index:i})).sort((a,b)=>a.p-b.p); let last=0;
  sorted.forEach((c,i)=> { c.pHolm = Math.min(1, Math.max(last, c.p*(sorted.length-i))); last=c.pHolm; });
  return sorted.sort((a,b)=>a.index-b.index).map(({index,...c})=>c);
}
export function toCSV(rows) {
  if (!rows.length) return '';
  const keys = [...new Set(rows.flatMap(r=>Object.keys(r)))];
  const encode = v => { const s=v==null?'':typeof v==='object'?JSON.stringify(v):String(v); return /[",\n\r]/.test(s)?`"${s.replaceAll('"','""')}"`:s; };
  return [keys.map(encode).join(','), ...rows.map(r=>keys.map(k=>encode(r[k])).join(','))].join('\n');
}
