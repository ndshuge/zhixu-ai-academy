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
test('closed state is the only state that can hide the panel',()=>{
 const finish=src.match(/function finishDoctorClose\(\)\{([\s\S]*?)\n\}/);
 const close=src.match(/function closeDoctor\(\)\{([\s\S]*?)\n\}/);
 assert.ok(finish&&close);
 assert.match(finish[1],/launch\.getAttribute\('aria-expanded'\)!=='false'/);
 assert.match(finish[1],/panel\.hidden=true/);
 assert.match(close[1],/panel\.classList\.remove\('doctor-visible'\)/);
 assert.match(close[1],/clearTimeout\(doctorCloseTimer\)/);
});
