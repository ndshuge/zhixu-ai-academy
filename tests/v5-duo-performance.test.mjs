import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=f=>readFileSync(new URL('../apple-editions/ai-academy-v5/'+f,import.meta.url),'utf8');
test('doctor and learning CTA use a single tactile raised surface with no perpetual animation',()=>{
 const css=src('v5-duo-perf.css');
 assert.match(css,/\.toolbar-trailing \.doctor-launch/);
 assert.match(src('index.html'),/v6-press-clock\.js/);
 assert.match(src('v6-press-clock.js'),/pointercancel/);
 assert.match(css,/\[data-duo-press="true"\]/);
 assert.match(css,/\.workshop-actions \.primary/);
 assert.match(css,/translate3d\(0,3px,0\)/);
 assert.match(css,/box-shadow/);
 assert.match(css,/prefers-reduced-motion:\s*reduce/);
 assert.doesNotMatch(css,/infinite/);
});
test('mobile uses static CSS glass, no runtime optical lens for mobile',()=>{
 const js=src('v4.js');
 assert.match(js,/matchMedia\('\(max-width:700px\)'\)/);
 assert.match(js,/if\(!mobileGlass\)navGlass=createGlass/);
 assert.doesNotMatch(js,/selector='[^']*doctor-launch/);
});
test('dock blur fades all text out at viewport bottom without hard cutoff',()=>{
 const css=src('v5-duo-perf.css');
 const html=src('index.html');
 assert.match(html,/v5-duo-perf\.css/);
 assert.match(css,/body::after/);
 assert.match(css,/rgba\(var\(--zx-dock-ground\),\.98\)/);
 assert.match(css,/backdrop-filter:blur\(12px\)/);
 assert.match(css,/mask-image:linear-gradient/);
 assert.match(css,/bottom:-1px/);
});
