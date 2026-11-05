import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=(name)=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const product=read('apple-editions/ai-academy-v5/v5-product-design.css');
const runtime=read('apple-editions/ai-academy-v5/v4.js');
const page=read('apple-editions/ai-academy-v5/index.html');

test('settings is selected in the Dock and the toolbar gear is removed',()=>{
 assert.match(page,/<button data-route="settings" class="tab-item"/);
 assert.doesNotMatch(page,/class="icon-button" data-route="settings"/);
 assert.match(runtime,/node\.dataset\.route===route/);
});
test('directional route entry is interruptible and supports reduced motion',()=>{
 assert.match(runtime,/dataset\.direction/);
 assert.match(page,/v6-paired-pages\.css/);
 const css=read('apple-editions/ai-academy-v5/v5-ios-continuity.css');
 assert.match(css,/data-entering="true"/);
 assert.match(css,/data-direction="backward"/);
 assert.match(css,/prefers-reduced-motion:\s*reduce/);
});
test('bottom scroll edge stays blurred even when scroll remaining is zero',()=>{
 const css=read('apple-editions/ai-academy-v5/v5-ios-continuity.css');
 assert.match(css,/backdrop-filter:\s*blur\(16px\)/);
 assert.match(css,/body::after/);
 assert.match(css,/opacity:\s*1\s*!important/);
 assert.match(css,/mask-image/);
 assert.match(css,/keyboard-visible/);
});
