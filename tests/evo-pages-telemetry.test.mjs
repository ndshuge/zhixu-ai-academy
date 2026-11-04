import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createInteractiveLesson} from '../apple-editions/ai-academy-v5/learning-core/interactive-lesson.mjs';

test('published Pages EvoWorld runner samples actual population every 20 ticks without inventing frames',async()=>{
 const repo=resolve(fileURLToPath(import.meta.url),'..','..');
 const temporary=await mkdtemp(join(tmpdir(),'zhixu-evo-real-'));
 const out=join(temporary,'pages');
 try{
  execFileSync('python',['scripts/build_pages_from_source.py','--root',repo,'--out',out],{cwd:repo,stdio:'pipe',timeout:30000});
  const {runEvoPair}=await import(pathToFileURL(join(out,'pages-evo-pair.mjs')).href);
  const result=await runEvoPair(12023);
  assert.equal(result.results.length,4);
  assert.deepEqual(result.condition,{compare:'cooperation',repeats:2,ticks:200,baseSeed:12023});
  for(const row of result.results){
   assert.equal(row.populationSamples.length,11);
   assert.deepEqual(row.populationSamples[0],[0,24]);
   assert.deepEqual(row.populationSamples.at(-1),[200,row.endingPopulation]);
   assert.deepEqual(row.populationSamples.map(p=>p[0]),[0,20,40,60,80,100,120,140,160,180,200]);
   assert.ok(row.populationSamples.every(p=>p.length===2&&p.every(Number.isFinite)));
  }
  assert.notDeepEqual(result.results[0].populationSamples,result.results[1].populationSamples);
  const science={
   async questionSet(stage){return {question:{itemId:stage+'-1',prompt:'独立世界',options:['是','否']}}},
   async grade(q,answer){return {itemId:q.itemId,studentAnswer:answer,gradedResult:'correct',stage:'pre'}},
   async run(){return {runId:'pages-evo-real-run',...result}}
  };
  const c=createInteractiveLesson({science,experiment:'evo-pair'});
  await c.start();await c.submitPre(1);
  c.setPrediction({text:'我预测合作机制在独立的世界模拟里可能改变种群变化。',params:{seed:12023}});
  await c.runExperiment();
  const visual=c.snapshot().visualization;
  const timeline=visual.views.find(v=>v.kind==='line');
  assert.ok(timeline);
  assert.equal(timeline.series.length,4);
  assert.deepEqual(timeline.series[0].points,result.results[0].populationSamples);
  assert.equal(timeline.source,'official-engine-samples');

 }finally{await rm(temporary,{recursive:true,force:true})}
},{timeout:45000});
