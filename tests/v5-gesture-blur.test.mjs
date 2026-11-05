import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../apple-editions/ai-academy-v5/'+p,import.meta.url),'utf8');
test('settings is a stable fifth Dock destination',()=>{
 const src=read('v4.js');
 assert.match(src,/moreRoutes=\/\^\(library\|growth\|settings\)\$\//);
 assert.doesNotMatch(src,/route==='settings' && state\.route==='settings'/);
 assert.match(read('index.html'),/<button data-route="settings" class="tab-item"/);
});
test('buttons have one native-click feedback clock; the lens remains delegated to Motion',()=>{
 const press=read('v6-press-clock.js');
 assert.match(read('index.html'),/v6-press-clock\.js/);
 assert.match(press,/pointercancel/);
 assert.match(press,/#mobile-tabs button/);
 assert.doesNotMatch(press,/target\.click\(\)|stopImmediatePropagation/);
});
test('single static smooth scroll edge avoids per-scroll JS and expensive GPU radius',()=>{
 const html=read('index.html'),css=read('v5-ios-continuity.css');
 assert.doesNotMatch(html,/src="\.\/v5-scroll-edge\.js/);
 assert.match(css,/blur\(1[268]px\)/);
 assert.match(css,/mask-image/);
 assert.match(css,/linear-gradient/);
 assert.match(css,/keyboard-visible/);
});
