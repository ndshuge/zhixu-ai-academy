import test from 'node:test';
import assert from 'node:assert/strict';
import {createInteractiveLesson} from '../apple-editions/ai-academy-v5/learning-core/interactive-lesson.mjs';
import {createV5InteractiveLesson} from '../apple-editions/ai-academy-v5/learning-core/v5-adapter.mjs';
import * as v2 from '../public/learning-store.js';

const q=stage=>({itemId:'evo.'+stage+'.01',attemptToken:'private-'+stage,
 prompt:stage==='pre'?'200 ticks 意味着 200 个独立重复吗？':'重复模型可以证明真实自然界的规律吗？',
 options:['是','不一定','无法探究'],correctAnswerIndex:1});
function fixture(experiment='evo-pair'){
 const calls={sets:[],grades:[],runs:[],mentor:[],reflections:[],status:0};
 let active=true;
 const science={
  async questionSet(stage,tag){calls.sets.push([stage,tag]);return {ids:['evo.'+stage+'.01'],question:q(stage)}},
  async grade(question,answer){calls.grades.push([question.itemId,answer]);return {stage:question.itemId.includes('.pre.')?'pre':'transfer',
   itemId:question.itemId,gradedResult:answer===1?'correct':'incorrect',studentAnswer:answer,
   feedback:'真实题库判分',misconception:answer===1?null:{code:'pseudoreplication',reason:'把时间步误作独立重复'}}},
  async run(tag,text,params){calls.runs.push({tag,text,params});return {runId:'evo-run-real-1',engineVersion:'evo-fixture',
   results:[{seed:12023,condition:'合作开启',endingPopulation:45,meanPopulation:33},{seed:12023,condition:'合作关闭',endingPopulation:20,meanPopulation:15},
   {seed:116752,condition:'合作开启',endingPopulation:29,meanPopulation:22},{seed:116752,condition:'合作关闭',endingPopulation:24,meanPopulation:20}],
   metrics:[{label:'重复世界',value:2}],secret:'must-not-leak'}},
  async mentor(run,note,approved){calls.mentor.push({run,note,approved});
   return {mode:approved?'llm':'rules',reply:approved?'经授权的导师建议':'先观察两种种子的差异，再说明为何是独立重复',secretKey:'must-not-leak',usage:{total_tokens:5}};
  },
  async modelStatus(){calls.status++;return active},
 };
 const controller=createInteractiveLesson({science,experiment,recordReflection:async row=>calls.reflections.push(row)});
 return {controller,science,calls,setModelActive:value=>{active=value}};
}
async function evidence(c,params={seed:12023}){
 await c.start();await c.submitPre(0);
 c.setPrediction({text:'我认为种子不同，模拟的种群变化可能也不同。',params});
 return c.runExperiment();
}
test('EvoWorld lesson takes original pre/transfer questions, real seed run, and independent reflection',async()=>{
 const {controller:c,calls}=fixture();
 assert.equal(c.snapshot().lessonId,'evo-independence-v1');
 assert.equal(c.snapshot().experimentId,'evo-pair');
 await evidence(c);
 assert.deepEqual(calls.sets,[['pre','evo-pair']]);
 assert.deepEqual(calls.runs,[{tag:'evo-pair',text:'我认为种子不同，模拟的种群变化可能也不同。',params:{seed:12023}}]);
 assert.equal(c.snapshot().experiment.results.length,4);
 assert.equal(c.snapshot().visualization.pairs.length,2);
 assert.equal(JSON.stringify(c.snapshot()).includes('must-not-leak'),false);
 assert.equal(c.snapshot().formulaPreviewAvailable,false);
 assert.throws(()=>c.formulaPreview(),/EvoWorld/);
 await c.submitReflection('不同种子代表独立世界，每个世界内200 tick不是重复200次。');
 assert.equal(calls.reflections[0].experimentId,'evo-pair');
 await c.loadTransfer();await c.submitTransfer(0);
 assert.deepEqual(calls.sets,[['pre','evo-pair'],['transfer','evo-pair']]);
 assert.equal(c.snapshot().transfer.misconception.code,'pseudoreplication');
 assert.match(c.hint(1).text,/时间步/);
});
test('invalid experiment, invalid EvoWorld seed and extra params cannot start scientific runs',async()=>{
 assert.throws(()=>fixture('evo'),/不支持/);
 const {controller:c,calls}=fixture();
 await c.start();await c.submitPre(0);
 for(const params of [{seed:0},{seed:-1},{seed:100000000},{seed:2.3},{seed:'12023'},{seed:12023,r:3.9},{}])
  assert.throws(()=>c.setPrediction({text:'我预计不同种子的模拟结果会不同，需要独立对照。',params}));
 assert.equal(c.snapshot().phase,'predict');
 assert.equal(calls.runs.length,0);
});
test('EvoWorld three-level rule hints reflect the independent-repeat and simulation boundary',async()=>{
 const {controller:c}=fixture();
 await c.start();assert.match(c.hint(1).text,/独立|种子|tick/i);
 await c.submitPre(0);
 c.setPrediction({text:'我认为改变种子会影响独立模拟的种群变化情况。',params:{seed:12023}});
 await c.runExperiment();
 assert.match(c.hint(2).text,/种子|重复|独立|模拟/);
 await c.submitReflection('一段模拟包含很多 tick，但需要多个世界才能做独立对照。');
 await c.loadTransfer();assert.match(c.hint(1).text,/模拟|种子|独立/);
});
test('V5 adapter records EvoWorld reflection under the correct concept and source run',async()=>{
 const {science}=fixture();const data=new Map();
 const storage={getItem:key=>data.get(key)??null,setItem:(key,v)=>data.set(key,v)};
 const bridge={...science,lib:v2,store:v2.loadLearning(storage),sessionId:'evo-session',refresh:()=>{}};
 const c=createV5InteractiveLesson(bridge,{storage,experiment:'evo-pair'});
 await evidence(c);await c.submitReflection('模型中变化是模拟证据，还不足以证明自然界有相同规律。');
 const event=bridge.store.events.at(-1);
 assert.equal(event.kind,'learning_reflection');assert.equal(event.sourceRunId,'evo-run-real-1');
 assert.deepEqual(event.conceptIds,['evolution.inference']);
 assert.equal(event.payload.experimentId,'evo-pair');
});
test('mentor requires a real experiment and defaults to rules with no model authorization',async()=>{
 const {controller:c,calls}=fixture();
 await assert.rejects(()=>c.requestMentor({note:'我想知道为什么'}));
 await evidence(c);
 await c.requestMentor({note:'200 tick 是否可算成200次重复？'});
 assert.equal(calls.mentor.length,1);
 assert.equal(calls.mentor[0].approved,false);
 assert.equal(calls.mentor[0].run.runId,'evo-run-real-1');
 assert.equal(calls.status,0);
 assert.equal(c.snapshot().mentor.mode,'rules');
 assert.equal(JSON.stringify(c.snapshot().mentor).includes('secretKey'),false);
 assert.equal(c.snapshot().phase,'evidence');
 assert.equal(calls.runs.length,1);
});
test('mentor cannot use a verified model without per-request consent and verified connection',async()=>{
 const {controller:c,calls,setModelActive}=fixture();
 await evidence(c);
 setModelActive(false);
 await assert.rejects(()=>c.requestMentor({note:'请指导我推理。',shareApproved:true}),/验证|连接/);
 assert.equal(calls.mentor.length,0);
 setModelActive(true);
 await c.requestMentor({note:'我明确同意本次发送这段实验疑问。',shareApproved:true});
 assert.equal(calls.mentor.length,1);
 assert.equal(calls.mentor[0].approved,true);
 assert.equal(c.snapshot().mentor.mode,'llm');
 assert.equal(c.snapshot().mentor.source,'verified-model');
 assert.equal(c.snapshot().mentor.reply,'经授权的导师建议');
});
test('unexpected LLM answer during rules-only request is rejected',async()=>{
 const {controller:c,science}=fixture();await evidence(c);
 science.mentor=async()=>({mode:'llm',reply:'未经授权的真实模型内容'});
 await assert.rejects(()=>c.requestMentor({note:'只用规则导师'}),/未经授权/);
 assert.equal(c.snapshot().mentor,null);
});
test('two-experiment scope stops at transfer; no independent mistake-review workflow is exposed',async()=>{
 const {controller:c}=fixture();
 assert.equal(typeof c.startReview,'undefined');
 assert.equal(typeof c.submitReview,'undefined');
 await evidence(c);
 await c.submitReflection('这里的科学预测要与原版模拟结果对照，而不是判作错题。');
 await c.loadTransfer();
 await c.submitTransfer(1);
 const result=c.snapshot();
 assert.equal(result.phase,'complete');
 assert.equal(Object.hasOwn(result,'review'),false);
 assert.equal(Object.hasOwn(result,'reviewAvailable'),false);
});

test('mentor errors leave evidence intact and allow retry without extra science runs',async()=>{
 const {controller:c,science,calls}=fixture();await evidence(c);
 science.mentor=async()=>{throw Error('offline')};
 await assert.rejects(()=>c.requestMentor({note:'解释我当前观察到的现象'}),/offline/);
 assert.equal(c.snapshot().mentor,null);
 assert.equal(c.snapshot().phase,'evidence');
 science.mentor=async()=>({mode:'rules',reply:'再次观察真实数据'});
 await c.requestMentor({note:'解释我当前观察到的现象'});
 assert.equal(c.snapshot().mentor.reply,'再次观察真实数据');
 assert.equal(calls.runs.length,1);
});
