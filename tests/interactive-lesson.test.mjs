import test from 'node:test';
import assert from 'node:assert/strict';
import {createInteractiveLesson} from '../apple-editions/ai-academy-v5/learning-core/interactive-lesson.mjs';
import {createV5InteractiveLesson} from '../apple-editions/ai-academy-v5/learning-core/v5-adapter.mjs';
import * as v2 from '../public/learning-store.js';

const originalPre={itemId:'pre-chaos-01',attemptToken:'secret-token-pre',prompt:'同一规则和近似初值，结果一定相同吗？',options:['一定相同','未必相同','无法研究'],correctAnswerIndex:1};
const originalTransfer={itemId:'transfer-chaos-01',attemptToken:'secret-token-transfer',prompt:'换一个初值，如何验证敏感性？',options:['只跑一遍','独立重复对照','只看答案'],correctAnswerIndex:1};
function fixture(){
  const calls={questions:[],grades:[],runs:[],reflections:[]};
  const science={
    async questionSet(stage,experiment){calls.questions.push([stage,experiment]);return {ids:[stage==='pre'?'pre-chaos-01':'transfer-chaos-01'],question:structuredClone(stage==='pre'?originalPre:originalTransfer)};},
    async grade(question,answer){
      calls.grades.push([question.itemId,answer]);
      return {gradedResult:answer===1?'correct':'incorrect',stage:question.itemId.startsWith('pre')?'pre':'transfer',itemId:question.itemId,studentAnswer:answer,feedback:answer===1?'证据支持':'注意控制变量',correctAnswerIndex:1,misconception:answer===1?null:{code:'chaos.control',reason:'未控制其他条件'}};
    },
    async run(experiment,prediction,params){
      calls.runs.push({experiment,prediction,params});
      return {runId:'real-pfl-101',engineVersion:'PFL-fixture',metrics:[{label:'首次分离',value:43}],plots:[{title:'轨迹',series:[{label:'A',points:[[0,0.2],[1,0.65]]}]}],someSecret:'should-never-be-in-view'};
    }
  };
  const controller=createInteractiveLesson({science,recordReflection:async row=>calls.reflections.push(row)});
  return {controller,calls,science};
}
const input={text:'我认为很小的初值差异会不断被放大，因为系统会迭代。',params:{r:3.9,x0:0.217,steps:150,logDelta:-10}};
async function reachEvidence(controller){
  await controller.start();
  await controller.submitPre(0);
  controller.setPrediction(input);
  await controller.runExperiment();
}
test('lesson starts with a clean, sanitized original question and hides pretest grading',async()=>{
 const {controller,calls}=fixture();
 assert.equal(controller.snapshot().phase,'idle');
 await controller.start();
 const start=controller.snapshot();
 assert.equal(start.phase,'pretest');assert.equal(start.busy,false);assert.equal(start.question.itemId,'pre-chaos-01');
 assert.equal(start.question.selected,null);
 assert.equal(JSON.stringify(start).includes('attemptToken'),false);
 assert.equal(JSON.stringify(start).includes('correctAnswerIndex'),false);
 await controller.submitPre(0);
 assert.equal(controller.snapshot().phase,'predict');
 assert.equal(calls.grades.length,1);
 assert.equal(JSON.stringify(controller.snapshot()).includes('incorrect'),false);
 assert.equal(JSON.stringify(controller.snapshot()).includes('correctAnswerIndex'),false);
});
test('pretest rejects empty or out-of-range selections without grading',async()=>{
 const {controller,calls}=fixture();await controller.start();
 for(const value of [null,-1,99,'1',1.2])await assert.rejects(()=>controller.submitPre(value));
 assert.equal(calls.grades.length,0);assert.equal(controller.snapshot().phase,'pretest');
});
test('prediction text and valid parameters are required, and experiments need explicit approval',async()=>{
 const {controller,calls}=fixture();await controller.start();await controller.submitPre(0);
 assert.throws(()=>controller.setPrediction({text:'随便',params:input.params}));
 assert.throws(()=>controller.setPrediction({text:input.text,params:{...input.params,r:99}}));
 assert.equal(calls.runs.length,0);
 assert.equal(controller.snapshot().phase,'predict');
 controller.setPrediction(input);
 assert.equal(controller.snapshot().phase,'ready');assert.equal(calls.runs.length,0);
 const state=await controller.runExperiment();
 assert.equal(state.phase,'evidence');assert.equal(state.busy,false);assert.equal(calls.runs.length,1);
 assert.equal(calls.runs[0].experiment,'sensitivity');assert.equal(calls.runs[0].prediction,input.text);
 assert.equal(state.experiment.runId,'real-pfl-101');
 assert.equal(JSON.stringify(state).includes('someSecret'),false);
});
test('cannot jump past prediction, experiment and reflection',async()=>{
 const {controller,calls}=fixture();
 await assert.rejects(()=>controller.submitPre(0));
 await assert.rejects(()=>controller.runExperiment());
 await assert.rejects(()=>controller.loadTransfer());
 await controller.start();
 await assert.rejects(()=>controller.loadTransfer());
 await controller.submitPre(1);
 await assert.rejects(()=>controller.runExperiment());
 controller.setPrediction(input);
 await assert.rejects(()=>controller.loadTransfer());
 await controller.runExperiment();
 await assert.rejects(()=>controller.loadTransfer());
 assert.equal(calls.questions.length,1);
});
test('concurrent approvals do not duplicate a real science run',async()=>{
 const {controller,science,calls}=fixture();await controller.start();await controller.submitPre(0);controller.setPrediction(input);
 let resolveRun;science.run=async(...args)=>{calls.runs.push(args);return await new Promise(resolve=>{resolveRun=resolve})};
 const first=controller.runExperiment();
 await assert.rejects(()=>controller.runExperiment(),/进行中/);
 assert.equal(calls.runs.length,1);
 resolveRun({runId:'real-pfl-101',metrics:[]});await first;
 assert.equal(controller.snapshot().phase,'evidence');
 await assert.rejects(()=>controller.runExperiment());
 assert.equal(calls.runs.length,1);
});
test('network failure retains prediction for an explicit retry',async()=>{
 const {controller,science}=fixture();await controller.start();await controller.submitPre(0);controller.setPrediction(input);
 science.run=async()=>{throw new Error('offline')};
 await assert.rejects(()=>controller.runExperiment(),/offline/);
 assert.equal(controller.snapshot().phase,'ready');
 science.run=async()=>({runId:'verified-run-2',metrics:[]});
 await controller.runExperiment();assert.equal(controller.snapshot().phase,'evidence');
});
test('reflection is recorded before the real transfer question; grade is server sourced',async()=>{
 const {controller,calls}=fixture();await reachEvidence(controller);
 await assert.rejects(()=>controller.submitReflection('短'));
 assert.equal(calls.reflections.length,0);
 await controller.submitReflection('我发现轨迹后期分开，说明初值差异可能被放大。');
 assert.equal(calls.reflections.length,1);
 assert.equal(calls.reflections[0].sourceRunId,'real-pfl-101');
 assert.equal(controller.snapshot().phase,'reflected');
 await controller.loadTransfer();
 const transfer=controller.snapshot();assert.equal(transfer.question.selected,null);
 assert.equal(transfer.phase,'transfer');
 assert.equal(JSON.stringify(transfer).includes('correctAnswerIndex'),false);
 await controller.submitTransfer(0);
 const done=controller.snapshot();
 assert.equal(done.phase,'complete');assert.equal(done.transfer.gradedResult,'incorrect');
 assert.equal(done.transfer.misconception.code,'chaos.control');
 assert.equal(calls.grades.length,2);
});
test('reflection recording failure cannot advance the lesson',async()=>{
 const {controller,science}=fixture();
 // Use a separate injected callback and the real controller pipeline.
 const c=createInteractiveLesson({science,recordReflection:async()=>{throw Error('storage-full')}});
 await reachEvidence(c);
 await assert.rejects(()=>c.submitReflection('这是一次有效的独立观察，值得保存。'),/storage-full/);
 assert.equal(c.snapshot().phase,'evidence');
});

test('formula preview is hidden until real science evidence exists and never marked as evidence',async()=>{
 const {controller,calls}=fixture();
 await controller.start();await controller.submitPre(0);
 assert.throws(()=>controller.formulaPreview(input.params),/必须先预测/);
 controller.setPrediction(input);
 assert.throws(()=>controller.formulaPreview(),/必须先预测/);
 await controller.runExperiment();
 const preview=controller.formulaPreview();
 assert.equal(preview.evidence,false);assert.equal(preview.kind,'formula-preview');
 assert.equal(preview.series.length,2);assert.equal(preview.series[0].points.length,151);
 assert.equal(preview.series[0].points[0][1],0.217);
 assert.ok(Math.abs(preview.series[1].points[0][1]-0.217)<1e-9);
 assert.equal(calls.runs.length,1);
 assert.throws(()=>controller.formulaPreview({...input.params,steps:10000}));
});
test('tiered guidance never leaks pretest grading and uses trustworthy misconception after transfer',async()=>{
 const {controller}=fixture();await controller.start();await controller.submitPre(0);
 for(let level=1;level<=3;level++){
  const hint=controller.hint(level);
  assert.equal(hint.mode,'rules');assert.equal(hint.revealsAnswer,false);
  assert.equal(hint.text.includes('未控制其他条件'),false);
 }
 await controller.setPrediction(input);await controller.runExperiment();
 await controller.submitReflection('我看到随着迭代次数增加，两条轨迹逐渐分开。');
 await controller.loadTransfer();await controller.submitTransfer(0);
 assert.match(controller.hint(1).text,/未控制其他条件/);
 assert.throws(()=>controller.hint(4));
});

test('V5 adapter records reflection in existing V2 store with source run and no preview pollution',async()=>{
 const {science}=fixture();
 const entries=new Map();
 const storage={getItem:key=>entries.get(key)??null,setItem:(key,value)=>entries.set(key,value),removeItem:key=>entries.delete(key)};
 const store=v2.loadLearning(storage);
 let refreshed=0;
 const bridge={...science,lib:v2,store,sessionId:'real-session-abc',refresh:()=>{refreshed++}};
 const controller=createV5InteractiveLesson(bridge,{storage});
 await reachEvidence(controller);
 controller.formulaPreview();
 assert.equal(store.events.length,0);
 await controller.submitReflection('我主动比较两条结果曲线，并重新思考初值差异。');
 assert.equal(store.events.length,1);
 const [event]=store.events;
 assert.equal(event.kind,'learning_reflection');
 assert.equal(event.sourceRunId,'real-pfl-101');
 assert.equal(event.sessionId,'real-session-abc');
 assert.equal(event.payload.lessonId,'logistic-sensitivity-v1');
 assert.equal(controller.snapshot().reflection.saved,true);
 assert.equal(refreshed,1);
 assert.equal(JSON.parse(entries.get(v2.STORAGE_KEY)).events.length,1);
});
test('V5 adapter leaves phase and store unchanged if storage rejects a reflection',async()=>{
 const {science}=fixture();
 const entries=new Map();let fail=false;
 const storage={getItem:key=>entries.get(key)??null,setItem:(key,value)=>{if(fail)throw Error('quota');entries.set(key,value)},removeItem:key=>entries.delete(key)};
 const store=v2.loadLearning(storage);
 const bridge={...science,lib:v2,store,sessionId:'real-session-def',refresh:()=>{}};
 const controller=createV5InteractiveLesson(bridge,{storage});
 await reachEvidence(controller);fail=true;
 await assert.rejects(()=>controller.submitReflection('我已经认真观察实验结果并提出解释。'),/quota/);
 assert.equal(controller.snapshot().phase,'evidence');
 assert.equal(store.events.length,0);
});

test('V2 persistence is committed once even if summary refresh fails',async()=>{
 const {science}=fixture();
 const entries=new Map();
 const storage={getItem:key=>entries.get(key)??null,setItem:(key,v)=>entries.set(key,v)};
 const store=v2.loadLearning(storage);
 const bridge={...science,lib:v2,store,sessionId:'real-session-xyz',refresh:()=>{throw Error('summary refresh unavailable')}};
 const c=createV5InteractiveLesson(bridge,{storage});
 await reachEvidence(c);
 await c.submitReflection('我已经完成预测、实验并写下了有依据的反思。');
 assert.equal(c.snapshot().phase,'reflected');
 assert.equal(store.events.length,1);
 await assert.rejects(()=>c.submitReflection('再次尝试保存同一观察'));
 assert.equal(store.events.length,1);
});
