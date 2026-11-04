import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../apple-editions/ai-academy-v5/'+p,import.meta.url),'utf8');
test('settings toggles back to the route it was opened from',()=>{
 const src=read('v4.js');
 assert.match(src,/settingsReturnRoute/);
 assert.match(src,/route==='settings'\s*&&\s*state\.route==='settings'/);
});
test('settings control supports held spring feedback and cancellation',()=>{
 const src=read('v5-settings-touch.js'),css=read('v5-ios-continuity.css');
 assert.match(read('index.html'),/v5-settings-touch\.js/);
 assert.match(src,/\.toolbar-trailing button\[data-route="settings"\]/);
 assert.match(src,/dataset\.holding/);
 assert.match(src,/pointercancel.*settle/s);
 assert.match(css,/data-holding/);
});
test('single static smooth scroll edge avoids per-scroll JS and expensive GPU radius',()=>{
 const html=read('index.html'),css=read('v5-ios-continuity.css');
 assert.doesNotMatch(html,/src="\.\/v5-scroll-edge\.js/);
 assert.match(css,/blur\(1[268]px\)/);
 assert.match(css,/mask-image/);
 assert.match(css,/linear-gradient/);
 assert.match(css,/keyboard-visible/);
});
