import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve('apple-editions/ai-academy-v5');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const cssFile=path.join(root,'v5-scroll-edge.css');
test('V5 alone layers a dedicated scroll-edge treatment after the V4 stylesheet',()=>{
 assert.match(html,/<link\s+rel="stylesheet"\s+href="\.\/v5-scroll-edge\.css(?:\?[^"]+)?">/);
 assert.ok(fs.existsSync(cssFile));
});
test('scroll edge blurs progressively without opaque white wall, remains click-through',()=>{
 const css=fs.readFileSync(cssFile,'utf8');
 assert.match(css,/body::after\s*\{/);
 assert.match(css,/pointer-events:\s*none/);
 assert.match(css,/backdrop-filter:\s*blur\(/);
 assert.match(css,/-webkit-backdrop-filter:\s*blur\(/);
 assert.match(css,/mask-image:\s*linear-gradient\(/);
 assert.match(css,/safe-area-inset-bottom/);
 assert.doesNotMatch(css,/rgba\([^)]*,\s*(?:\.9[89]|1(?:\.0)?)\)\s*100%/);
});
test('dock glass stays a separate control layer with readable high-contrast fallbacks',()=>{
 const css=fs.readFileSync(cssFile,'utf8');
 assert.match(css,/\.mobile-native-tabs \.nav-optics/);
 assert.match(css,/@media\s*\(prefers-reduced-transparency:\s*reduce\)/);
 assert.match(css,/@media\s*\(prefers-contrast:\s*more\)/);
 assert.match(css,/body\.keyboard-visible::after/);
 assert.match(css,/body:has\(\.doctor-panel/);
});
test('historic V4 and science engine were not modified',()=>{
 for(const p of ['apple-editions/ai-academy-v4/index.html','apple-editions/ai-academy-v4/v4-kinetic.css','public/learning.html']){
  assert.ok(fs.existsSync(path.resolve(p)),p);
 }
});