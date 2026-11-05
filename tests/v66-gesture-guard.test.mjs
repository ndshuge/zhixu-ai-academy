import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const p=new URL('../apple-editions/ai-academy-v5/',import.meta.url);
const read=n=>readFileSync(new URL(n,p),'utf8');
test('mobile interaction scope prevents pinch without disabling keyboard/accessible zoom',()=>{
 const html=read('index.html'),css=read('v6-gesture-guard.css'),js=read('v6-gesture-guard.js');
 assert.match(html,/v6-gesture-guard\.css\?v=/);
 assert.match(html,/v6-gesture-guard\.js\?v=/);
 assert.match(css,/touch-action:\s*pan-x pan-y/);
 assert.doesNotMatch(html,/user-scalable=no|maximum-scale=1/);
 assert.match(js,/gesturestart/);
 assert.match(js,/gesturechange/);
 assert.match(js,/touchmove/);
 assert.match(js,/touches\?\.length\s*>=\s*2/);
 assert.match(js,/wheel/);
 assert.match(js,/ctrlKey/);
 assert.match(js,/passive:\s*false/);
 assert.match(js,/e\.preventDefault\(\)/);
});
test('single finger navigation cancels as soon as second finger appears',()=>{
 const route=read('v6-paired-pages.js');
 assert.match(route,/!e\.isPrimary/);
 assert.match(route,/releaseDrag\(false\)/);
 assert.match(route,/swipe=null/);
});
test('course timeline and input fields remain operable',()=>{
 const css=read('v6-gesture-guard.css');
 assert.doesNotMatch(css,/touch-action:\s*none/);
 assert.doesNotMatch(css,/overflow:\s*hidden/);
 assert.doesNotMatch(css,/pointer-events:\s*none/);
});
