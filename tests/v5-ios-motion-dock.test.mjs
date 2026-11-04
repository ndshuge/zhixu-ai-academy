import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=(name)=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const product=read('apple-editions/ai-academy-v5/v5-product-design.css');
const runtime=read('apple-editions/ai-academy-v5/v4.js');
const page=read('apple-editions/ai-academy-v5/index.html');

test('settings toolbar control stays visible and identifies current route',()=>{
 assert.doesNotMatch(product,/\.toolbar-trailing button\[data-route="settings"\]\s*\{\s*display:\s*none/);
 assert.match(runtime,/data-route="settings"\][^\n]*aria-current/);
});
test('directional route entry is interruptible and supports reduced motion',()=>{
 assert.match(runtime,/dataset\.direction/);
 assert.match(page,/v5-ios-continuity\.css/);
 const css=read('apple-editions/ai-academy-v5/v5-ios-continuity.css');
 assert.match(css,/data-entering="true"/);
 assert.match(css,/data-direction="backward"/);
 assert.match(css,/prefers-reduced-motion:\s*reduce/);
});
test('bottom scroll edge stays blurred even when scroll remaining is zero',()=>{
 const css=read('apple-editions/ai-academy-v5/v5-ios-continuity.css');
 assert.match(css,/backdrop-filter:\s*blur\(2[48]px\)/);
 assert.match(css,/body::after/);
 assert.match(css,/opacity:\s*1\s*!important/);
 assert.match(css,/mask-image/);
 assert.match(css,/keyboard-visible/);
});
