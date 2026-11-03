import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../apple-editions/ai-academy-v5/v4.js',import.meta.url),'utf8');
test('rapid Doctor click toggles desired expanded state even if exit animation is unfinished',()=>{
 const open=src.match(/launch\.onclick=\(\)=>\{([\s\S]*?)\n\};/);
 assert.ok(open);
 assert.match(open[1],/launch\.getAttribute\('aria-expanded'\)==='true'/);
 assert.doesNotMatch(open[1],/if\(!panel\.hidden\)\{closeDoctor\(\);return;/);
});
test('canceled Doctor close never hides a re-opened panel',()=>{
 const close=src.match(/function closeDoctor\(\)\{([\s\S]*?)\n\}/);
 assert.ok(close);
 assert.match(close[1],/\.catch\(\(\)=>\{if\(launch\.getAttribute\('aria-expanded'\)==='false'\)panel\.hidden=true;/);
 assert.doesNotMatch(close[1],/\.catch\(\(\)=>\{panel\.hidden=true\}/);
});