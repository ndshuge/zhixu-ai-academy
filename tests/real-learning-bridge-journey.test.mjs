import test from 'node:test';
import assert from 'node:assert/strict';
import {createAcademyServer} from '../server.mjs';
import * as v2 from '../public/learning-store.js';
import {createV5InteractiveLesson} from '../apple-editions/ai-academy-v5/learning-core/v5-adapter.mjs';

const p={r:3.9,x0:0.217,steps:150,logDelta:-10};
function memoryStorage(){
 const data=new Map();
 return {getItem:k=>data.has(k)?data.get(k):null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)};
}
test('real local server + actual V5 ScienceBridge complete two scientific lessons with human-approved follow-up',async()=>{
 const oldWin=globalThis.window,oldStore=globalThis.localStorage;
 globalThis.window={addEventListener(){}};
 const storage=memoryStorage();globalThis.localStorage=storage;
 const server=createAcademyServer();
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 const base='http://127.0.0.1:'+server.address().port;
 try{
  const {ScienceBridge}=await import('../apple-editions/ai-academy-v5/bridge.js');
  for(const experiment of ['sensitivity','evo-pair']){
   const requests=[];
   const bridge=Object.create(ScienceBridge.prototype);
   bridge.win={fetch:async(path,opts)=>{requests.push({path,opts});return fetch(base+path,opts)}};
   bridge.lib=v2;
   bridge.store=v2.loadLearning(storage);
   bridge.sessionId='integration-'+experiment;
   bridge.notify=()=>{};
   const controller=createV5InteractiveLesson(bridge,{storage,experiment});
   await controller.start();
   const pre=controller.snapshot().question;
   assert.ok(pre.itemId);assert.equal(pre.selected,null);
   await controller.submitPre(0);
   controller.setPrediction({text:'我认为只改变一个实验参数可以得到有意义的可对照结果。',params:experiment==='evo-pair'?{seed:12023}:p});
   await controller.runExperiment();
   const snapshot=controller.snapshot();
   assert.ok(snapshot.experiment.runId);
   assert.equal(snapshot.visualization.sourceRunId,snapshot.experiment.runId);
   if(experiment==='evo-pair')assert.equal(snapshot.visualization.pairs.length,2);
   else assert.equal(snapshot.visualization.views[0].series[0].points.length,151);
   await controller.requestMentor({note:'请只根据真实实验结果提出一个有意义的追问。'});
   assert.equal(controller.snapshot().mentor.mode,'rules');
   await controller.proposeComparison({goal:'只改变一个变量，检验本次实验观察是否依旧成立。'});
   const plan=controller.snapshot().comparisonPlan;
   assert.ok(plan.planId);
   assert.equal(plan.autoExecuted,false);
   assert.equal(requests.filter(r=>r.path==='/api/agent/approve').length,0);
   await controller.approveComparison({prediction:'我预计第二轮对照实验与首轮的实际观察不会完全一样。'});
   const compared=controller.snapshot();
   assert.ok(compared.comparison.runId);
   assert.equal(compared.comparison.parentRunId,snapshot.experiment.runId);
   assert.ok(compared.comparison.visualization);
   assert.equal(requests.filter(r=>r.path==='/api/agent/approve').length,1);
   await controller.submitReflection('本次实际实验结果与我的预测需要逐项对比，模型结论仍有边界。');
   await controller.loadTransfer();
   assert.equal(controller.snapshot().question.selected,null);
   await controller.submitTransfer(0);
   assert.equal(controller.snapshot().phase,'complete');
   assert.equal(typeof controller.startReview,'undefined');
   const scientific=bridge.store.events.filter(e=>e.kind==='hypothesis_test');
   assert.equal(scientific.length,experiment==='sensitivity'?2:4); // V2 events accumulate in shared storage
   assert.ok(scientific.some(e=>e.sourceRunId===compared.comparison.runId));
  }
 }finally{
  await new Promise(ok=>server.close(ok));
  if(oldWin===undefined)delete globalThis.window;else globalThis.window=oldWin;
  if(oldStore===undefined)delete globalThis.localStorage;else globalThis.localStorage=oldStore;
 }
},{timeout:60000});
