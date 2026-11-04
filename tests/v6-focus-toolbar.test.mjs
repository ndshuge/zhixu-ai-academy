import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const root=new URL('../apple-editions/ai-academy-v5/',import.meta.url);
const js=readFileSync(new URL('v4.js',root),'utf8'),css=readFileSync(new URL('v5-focus-smoothing.css',root),'utf8');
test('entering science study makes the top toolbar inert, not just visually hidden',()=>{
 assert.match(js,/reading-column > \.toolbar/);
 assert.match(js,/toolbar\.inert=route==='learn'/);
 assert.match(js,/toolbar\.setAttribute\('aria-hidden','true'\)/);
});
test('the top toolbar smoothly collapses rather than disappearing by display none',()=>{
 assert.match(css,/body\[data-focus="true"\] \.reading-column > \.toolbar/);
 assert.match(css,/height:0/);
 assert.match(css,/transition:.*height/s);
 assert.doesNotMatch(css,/display:none!important/);
});
