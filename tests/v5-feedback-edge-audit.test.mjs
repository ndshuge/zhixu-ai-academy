import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const read=f=>readFileSync(new URL('../apple-editions/ai-academy-v5/'+f,import.meta.url),'utf8');
test('active feedback script uses native click and cancels touch gestures cleanly',()=>{
 const js=read('v6-press-clock.js');
 assert.match(js,/pointerdown/);
 assert.match(js,/pointerup/);
 assert.match(js,/pointercancel/);
 assert.match(js,/dataset\.zxPress='down'/);
 assert.match(js,/dataset\.zxPress='release'/);
 assert.doesNotMatch(js,/target\.click\(\)|stopImmediatePropagation/);
 assert.match(read('index.html'),/v6-press-clock\.js/);
});
test('release and press have separate timings and scrolling controls do not receive raised-button styling',()=>{
 const css=read('v5-visual-audit.css');
 assert.match(css,/data-zx-press="down"/);
 assert.match(css,/data-zx-press="release"/);
 assert.match(css,/\.experiment-tabs button/);
 assert.match(css,/\.shelf \.book-tile/);
 assert.match(css,/prefers-reduced-motion:\s*reduce/);
});
test('continuous bottom edge uses one optical sample and viewport-filling variable alpha instead of stacked hard cutoff',()=>{
 const css=read('v5-visual-audit.css');
 assert.match(css,/body::after/);
 assert.match(css,/backdrop-filter:\s*blur\(2[04]px\)/);
 assert.match(css,/\.mobile-native-tabs \.nav-optics/);
 assert.match(css,/backdrop-filter:none!important/);
 assert.match(css,/linear-gradient/);
 assert.match(css,/mask-image/);
 assert.match(css,/safe-area-inset-bottom/);
});
