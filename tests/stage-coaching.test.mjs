import test from 'node:test';
import assert from 'node:assert/strict';
import {createInteractiveLesson} from '../apple-editions/ai-academy-v5/learning-core/interactive-lesson.mjs';
const params={r:3.9,x0:0.217,steps:150,logDelta:-10};
function fixture(){
 const calls={models:[],status:0};
 let status=true,fail=false;
 const science={
  async questionSet(stage){return {question:{itemId:stage+'-1',attemptToken:'SECRET_DO_NOT_SEND',prompt:'轨迹?',options:['是','否'],correctAnswerIndex:1}}},
  async grade(q,a){return {itemId:q.itemId,studentAnswer:a,gradedResult:'correct',stage:'pre'}},
  async run(){return {experiment:'sensitivity',runId:'pfl-real-a',metrics:[{label:'首次超过0.01',value:42,unit:'步'}],
   plots:[{title:'实际两轨',xLabel:'n',yLabel:'x',series:[{label:'A',points:[[0,0.217],[1,0.6]]}]}]}},
  async modelStatus(){calls.status++;return status},
  async modelAsk(messages){calls.models.push(messages);if(fail)throw new Error('network failure');return {reply:'先思考为何改变了初值后轨迹可能分开。',model:'verified-deepseek-test'}}
 };
 const c=createInteractiveLesson({science});
 return {c,calls,setStatus:x=>status=x,setFail:x=>fail=x};
}
test('during prediction rule-based inquiry works without contacting a model',async()=>{
 const {c,calls}=fixture();
 await c.start();await c.submitPre(0);
 const result=await c.requestStageCoach({question:'我应该如何预测初值敏感性？'});
 assert.equal(result.coaching.mode,'rules');
 assert.equal(calls.status,0);assert.equal(calls.models.length,0);
 assert.equal(result.coaching.phase,'predict');
});
test('explicitly authorized DeepSeek teacher uses stage-specific context but never pretest answer or token',async()=>{
 const {c,calls}=fixture();
 await c.start();await c.submitPre(0);
 c.setPrediction({text:'我认为相近初值在长迭代后也可能出现很大差异。',params});
 const state=await c.requestStageCoach({question:'请帮我检查预测是否可检验',shareApproved:true});
 assert.equal(state.coaching.mode,'llm');
 assert.equal(state.coaching.phase,'ready');
 assert.equal(state.coaching.source,'verified-model');
 assert.equal(calls.models.length,1);
 const messages=JSON.stringify(calls.models[0]);
 assert.match(messages,/sensitivity|初值敏感/);
 assert.match(messages,/我认为相近初值/);
 assert.equal(messages.includes('SECRET_DO_NOT_SEND'),false);
 assert.equal(messages.includes('correctAnswerIndex'),false);
 assert.equal(messages.includes('42'),false); // experiment hasn't run
});
test('after experiment teacher receives real evidence, including selected observed point',async()=>{
 const {c,calls}=fixture();
 await c.start();await c.submitPre(0);
 c.setPrediction({text:'相近初始值将出现分离，需用计算验证。',params});await c.runExperiment();
 c.selectEvidence({plotIndex:0,seriesIndex:0,pointIndex:1});
 const state=await c.requestStageCoach({question:'请帮我解释选中的点',shareApproved:true});
 assert.equal(state.coaching.mode,'llm');
 const messages=JSON.stringify(calls.models[0]);
 assert.match(messages,/42/);
 assert.match(messages,/0.6/);
 assert.match(messages,/pfl-real-a/);
});
test('no verified model means no external request and no misleading success label',async()=>{
 const {c,calls,setStatus}=fixture();await c.start();await c.submitPre(1);
 setStatus(false);
 await assert.rejects(()=>c.requestStageCoach({question:'可以帮我吗',shareApproved:true}),/验证|连接/);
 assert.equal(calls.models.length,0);
 assert.equal(c.snapshot().coaching,null);
});
test('model failure falls back to honest rules without claiming verified AI',async()=>{
 const {c,calls,setFail}=fixture();await c.start();await c.submitPre(1);
 setFail(true);
 const state=await c.requestStageCoach({question:'为什么我的判断可能不完整？',shareApproved:true});
 assert.equal(calls.models.length,1);
 assert.equal(state.coaching.mode,'rules');
 assert.equal(state.coaching.source,'lesson-rules');
 assert.equal(state.coaching.fallbackReason,'MODEL_REQUEST_FAILED');
});
