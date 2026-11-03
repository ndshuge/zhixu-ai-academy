import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../apple-editions/ai-academy-v5/',import.meta.url);
const js=readFileSync(new URL('v4.js',root),'utf8');
const html=readFileSync(new URL('index.html',root),'utf8');
test('Doctor panel uses one interruptible visual state, not competing WAAPI animations',()=>{
 assert.match(js,/panel\.classList\.add\('doctor-visible'\)/);
 assert.match(js,/panel\.classList\.remove\('doctor-visible'\)/);
 assert.doesNotMatch(js,/motion\.animate\(panel/);
 assert.doesNotMatch(js,/panel\.animate\(/);
});
test('Doctor panel waits for exit completion and checks desired state before hiding',()=>{
 assert.match(js,/addEventListener\('transitionend'/);
 assert.match(js,/function finishDoctorClose\(/);
 assert.match(js,/launch\.getAttribute\('aria-expanded'\)!=='false'/);
 assert.match(js,/clearTimeout\(doctorCloseTimer\)/);
});
test('V5 loads a single modal transition surface; reduced motion supported',()=>{
 assert.match(html,/v5-doctor-motion\.css/);
 const css=readFileSync(new URL('v5-doctor-motion.css',root),'utf8');
 assert.match(css,/#doctor-panel\.doctor-visible/);
 assert.match(css,/transition:/);
 assert.match(css,/prefers-reduced-motion/);
});
test('Doctor focus and keyboard privacy remain',()=>{
 assert.match(js,/\$\('#doctor-close'\)\.focus\(\{preventScroll:true\}\)/);
 assert.doesNotMatch(js,/question\.focus\(/);
});
