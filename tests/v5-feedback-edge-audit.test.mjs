import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const read=f=>readFileSync(new URL('../apple-editions/ai-academy-v5/'+f,import.meta.url),'utf8');
test('every actionable V5 button gets an interruptible press lifetime instead of limited hardcoded selectors',()=>{
 const js=read('v5-press-feedback.js');
 assert.match(js,/\[data-action\]/);
 assert.match(js,/\[data-route\]/);
 assert.match(js,/\[data-experiment\]/);
 assert.match(js,/\[type="submit"\]/);
 assert.match(js,/pointercancel/);
 assert.match(js,/stopImmediatePropagation/);
 assert.match(js,/setTimeout/);
 assert.match(js,/150/);
 assert.match(read('index.html'),/v5-press-feedback\.js/);
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
