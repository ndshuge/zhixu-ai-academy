import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

for(const name of ['browser.mjs','browser-learning.mjs','browser-admin.mjs','browser-agent.mjs','browser-study.mjs']){
 test(name+' waits on named controls rather than networkidle for a long-running science page',()=>{
  const src=readFileSync(new URL(name,import.meta.url),'utf8');
  assert.doesNotMatch(src,/waitUntil:\s*['"]networkidle['"]/);
  assert.match(src,/waitUntil:'domcontentloaded'/);
 });
}
