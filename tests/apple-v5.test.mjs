import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const edition=n=>join(root,'apple-editions',n);
const page=(n,f)=>readFileSync(join(edition(n),f),'utf8');
test('V4 snapshot is byte-identical to Git release a23bce1',()=>{
 for(const p of ['index.html','v4.js','views.js','bridge.js','v4.css','v4-kinetic.css']){
  const expected=execFileSync('git',['show','a23bce1:apple-editions/ai-academy-v4/'+p],{cwd:root});
  const actual=readFileSync(join(edition('ai-academy-v4'),p));
  // Windows Git checkout can adjust line endings, so compare normalized UTF-8.
  const normal=b=>b.toString('utf8').replace(/\r\n/g,'\n');
  assert.equal(createHash('sha256').update(normal(actual)).digest('hex'),createHash('sha256').update(normal(expected)).digest('hex'),p);
 }
});
test('V5 is a separate working copy preserving scientific adapter',()=>{
 assert.ok(existsSync(join(edition('ai-academy-v5'),'index.html')));
 assert.ok(existsSync(join(edition('ai-academy-v5'),'bridge.js')));
 assert.match(page('ai-academy-v5','bridge.js'),/const ORIGINAL='\/zhixu-ai-academy\/'/);
});
test('V5 home presents two working paths and evidence-based flow',()=>{
 const src=page('ai-academy-v5','views.js');
 for(const phrase of ['跟着知序博士学习','进入科学实验室','独立判断','提出预测','真实验证','迁移理解'])
  assert.ok(src.includes(phrase),phrase);
 assert.match(src,/data-action="enter-sensitivity"/);
 assert.match(src,/data-action="enter-evo"/);
});

test('V5 live graph follows the genuine Logistic recurrence, with separate series',async()=>{
 const {logisticPair}=await import('../apple-editions/ai-academy-v5/v5-lab-preview.js');
 const {first,second}=logisticPair(3.9,.412,.00001,4);
 assert.equal(first.length,4);
 assert.equal(first[0][1],.412);
 assert.equal(second[0][1],.41201);
 assert.ok(Math.abs(first[1][1]-(3.9*.412*(1-.412)))<1e-12);
 assert.notEqual(first[3][1],second[3][1]);
});

test('V5 has its own theme, responsive lab and reduced-motion rule',()=>{
 const html=page('ai-academy-v5','index.html');
 assert.match(html,/v5-workshop.css/);
 assert.match(html,/PERSONAL LEARNING STUDIO/,'first paint should be V5, even before JavaScript hydrates');
 const css=page('ai-academy-v5','v5-workshop.css');
 assert.match(css,/workshop-hero/);
 assert.match(css,/prefers-reduced-motion/);
 assert.doesNotMatch(css,/opacity:\s*\.001/,'first paint must not hide primary CTA while animations initialize');
 assert.match(css,/@media\s*\(max-width:\s*700px\)/);
});
