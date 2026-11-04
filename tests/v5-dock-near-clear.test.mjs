import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const src=(name)=>readFileSync(new URL('../apple-editions/ai-academy-v5/'+name,import.meta.url),'utf8');
test('newer Xiaoya near-Dock CSS loads after the inherited full-height fade',()=>{
 const html=src('index.html'),needle='v5-dock-near-clear.css';
 assert.match(html,/v5-dock-near-clear\.css/);
 assert.ok(html.indexOf('v5-xiaoya-dock.css')<html.indexOf(needle),'near-Dock corrections should win the cascade');
});
test('the 196px blurred band is narrowed to Xiaoya 114px and the top is transparent',()=>{
 const css=src('v5-dock-near-clear.css');
 assert.match(css,/height:calc\(114px \+ env\(safe-area-inset-bottom,0px\)\)!important/);
 assert.match(css,/\.zx-blur-layer:nth-child\(1\)/);
 assert.match(css,/--zx-blur:2px/);
 assert.match(css,/transparent 13%,rgba\(0,0,0,\.16\) 23%/);
 assert.match(css,/transparent 0%,transparent 35%,rgba\(var\(--zx-dock-ground\),\.014\) 48%/);
});
test('blur grows under the Dock through all four layers, retaining safe-area, dark and accessibility fallback',()=>{
 const css=src('v5-dock-near-clear.css');
 for(const amount of [2,6,12,20])assert.match(css,new RegExp('--zx-blur:'+amount+'px'));
 assert.match(css,/#000 100%/);
 assert.match(css,/prefers-color-scheme:dark/);
 assert.match(css,/prefers-reduced-transparency:reduce/);
 assert.match(css,/prefers-contrast:more/);
 assert.doesNotMatch(css,/body::after/);
});
