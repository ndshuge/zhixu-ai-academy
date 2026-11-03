import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const base=new URL('../apple-editions/ai-academy-v5/',import.meta.url);
const read=f=>readFileSync(new URL(f,base),'utf8');
test('four-stage inquiry progress publishes ARIA numeric and human-readable stage',()=>{
 const src=read('views.js');
 assert.match(src,/class="progress-strip" role="progressbar"/);
 assert.match(src,/aria-valuemin="1" aria-valuemax="4"/);
 assert.match(src,/aria-valuenow="/);
 assert.match(src,/aria-valuetext="/);
 assert.match(src,/esc\(steps\[current\]\)/);
});
test('SPA route changes transfer reading focus and page title; intra-page form rerenders do not steal focus',()=>{
 const html=read('index.html'),mod=read('v5-route-focus.js');
 assert.match(html,/src="\.\/v5-route-focus\.js/);
 assert.match(mod,/zhixu:content-rendered/);
 assert.match(mod,/if\(next===previous\)return/);
 assert.match(mod,/document\.title=/);
 assert.match(mod,/screen\.focus\(\{preventScroll:true\}\)/);
});
