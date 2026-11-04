import test from 'node:test';
import assert from 'node:assert/strict';
import {createInteractiveLesson} from '../apple-editions/ai-academy-v5/learning-core/interactive-lesson.mjs';
import {createV5InteractiveLesson} from '../apple-editions/ai-academy-v5/learning-core/v5-adapter.mjs';
import * as v2 from '../public/learning-store.js';

const params={r:3.9,x0:0.217,steps:150,logDelta:-10};
const data=runId=>({runId,experiment:'sensitivity',engineVersion:'PFL-test',engine:'Physics Frontier Lab',condition:params,
 metrics:[{label:'首次超过0.01',value:2,unit:'步'}],
 plots:[{title:'真实初值轨迹',xLabel:'迭代 n',yLabel:'状态 x',
 series:[{label:'初值 A',points:[[0,.217],[1,.66],[2,.87]]},{label:'初值 B',points:[[0,.217000001],[1,.661],[2,.88]]}]}]});
function fixture(){
 const calls={mentor:[],plans:[],approvals:[],runs:[]};
 let approvedReturn=()=>({...data('verified-run-2'),lineage:{parentRunId:'verified-run-1',changed:[{field:'logDelta',from:-10,to:-11}],toolId:'original-agent-rule'}});
 const science={
  async questionSet(stage){return {question:{itemId:stage+'1',attemptToken:'private',prompt:'问题',options:['A','B']}}},
  async grade(q,a){return {gradedResult:'correct',stage:'pre',itemId:q.itemId,studentAnswer:a}},
  async run(tag,text,p){calls.runs.push({tag,text,p});return data('verified-run-1')},
  async mentor(run,note,approved,selection){calls.mentor.push({run,note,approved,selection});return {mode:approved?'llm':'rules',
   question:'为什么同样的更新规则会出现不同曲线？',observed:'第2步的真实差异可观察',suggestion:'只改变扰动指数'}},
  async modelStatus(){return true},
  async propose(run){calls.plans.push(run);return {planId:'plan-original',studyQuestion:'减少一个数量级扰动会怎样？',
   goal:'验证差异是否仍出现',changes:[{field:'logDelta',from:-10,to:-11}],fixedVariables:['r','x0','steps'],
   plannerMode:'rules',params:{...params,logDelta:-11},approvalRequired:true,autoExecuted:false}},
  async approve(plan,prediction,experiment){calls.approvals.push({plan,prediction,experiment});return approvedReturn()}
 };
 const controller=createInteractiveLesson({science});
 return {controller,science,calls,setApprove:fn=>{approvedReturn=fn}};
}
async function start(c){await c.start();await c.submitPre(0);c.setPrediction({text:'我的预测是两条轨迹在多次迭代后逐渐分离。',params});return c.runExperiment()}
test('null source samples remain gaps through the teaching controller',async()=>{
 const {controller:c,science}=fixture();
 science.run=async()=>({runId:'real-gap-1',experiment:'sensitivity',plots:[{title:'观察曲线',
 series:[{label:'A',points:[[0,0.2],[1,null],[2,0.4]]}]}]});
 await start(c);
 const plot=c.snapshot().visualization.views[0].series[0];
 assert.equal(plot.points.length,3);
 assert.equal(plot.points[1],null);
 assert.equal(c.selectEvidence({plotIndex:0,seriesIndex:0,pointIndex:2}).y,0.4);
 assert.throws(()=>c.selectEvidence({plotIndex:0,seriesIndex:0,pointIndex:1}));
});

test('science visualization becomes available after user-approved experiment, no early evidence',async()=>{
 const {controller:c}=fixture();
 assert.equal(c.snapshot().visualization,null);
 await c.start();await c.submitPre(0);
 assert.equal(c.snapshot().visualization,null);
 c.setPrediction({text:'先预测出现差异，然后再对照观察。',params});
 assert.equal(c.snapshot().visualization,null);
 await c.runExperiment();
 const s=c.snapshot();assert.equal(s.visualization.views[0].xLabel,'迭代 n');
 assert.equal(s.visualization.views[0].series[0].points.length,3);
 assert.equal(s.visualization.sourceRunId,'verified-run-1');
 assert.equal(s.selection,null);
});
test('student can select authentic PFL point; tutor sees raw indices but no model is called implicitly',async()=>{
 const {controller:c,calls}=fixture();await start(c);
 const point=c.selectEvidence({plotIndex:0,seriesIndex:1,pointIndex:2});
 assert.equal(point.y,.88);
 assert.equal(c.snapshot().selection.selection.pointIndex,2);
 await c.requestMentor({note:'为什么这两个值开始分离？'});
 assert.deepEqual(calls.mentor[0].selection,{plotIndex:0,seriesIndex:1,pointIndex:2});
 assert.equal(calls.mentor[0].approved,false);
 assert.equal(c.snapshot().mentor.mode,'rules');
 assert.throws(()=>c.selectEvidence({plotIndex:0,seriesIndex:1,pointIndex:50}));
});
test('one science comparison requires first mentor and a separate plan/approval action',async()=>{
 const {controller:c,calls}=fixture();
 await assert.rejects(()=>c.proposeComparison({goal:'验证初值差异'}));
 await start(c);
 await assert.rejects(()=>c.proposeComparison({goal:'验证初值差异'}),/导师|追问/);
 await c.requestMentor({note:'请指导我如何设计第二轮对照。'});
 const first=await c.proposeComparison({goal:'仅改变初值扰动量，观察差异。'});
 assert.equal(first.comparisonPlan.planId,'plan-original');
 assert.equal(first.comparisonPlan.approvalRequired,true);
 assert.equal(calls.approvals.length,0);
 await assert.rejects(()=>c.approveComparison({prediction:'同原预测'}),/预测|至少/);
 const s=await c.approveComparison({prediction:'我预计缩小扰动后仍会分离，但分离更慢。'});
 assert.equal(calls.approvals.length,1);
 assert.equal(calls.approvals[0].experiment,'sensitivity');
 assert.equal(s.comparison.runId,'verified-run-2');
 assert.equal(s.comparison.parentRunId,'verified-run-1');
 assert.equal(s.comparison.visualization.sourceRunId,'verified-run-2');
 assert.equal(calls.runs.length,1); // second run was executed by official approval endpoint, not run().
 await assert.rejects(()=>c.approveComparison({prediction:'再次运行第二轮实验'}));
 assert.equal(c.snapshot().experiment.runId,'verified-run-1');
});
test('cannot fabricate a second science run if official approval throws',async()=>{
 const {controller:c,calls,setApprove}=fixture();await start(c);
 await c.requestMentor({note:'帮我规划一次单变量实验'});
 await c.proposeComparison({goal:'只改变扰动量'});
 setApprove(()=>{throw Error('network may have timed out')});
 await assert.rejects(()=>c.approveComparison({prediction:'新的预测是缩小扰动后曲线差异会晚一点出现。'}),/timed out/);
 assert.equal(c.snapshot().comparison,null);
 assert.equal(c.snapshot().comparisonPlan,null);
 await assert.rejects(()=>c.approveComparison({prediction:'再发一次批准'}),/状态|计划|重新/);
 assert.equal(calls.approvals.length,1);
 assert.equal(c.snapshot().experiment.runId,'verified-run-1');
});
test('EvoWorld shows paired evidence but rejects fake point-index selection',async()=>{
 const experiment={runId:'ev-1',experiment:'evo-pair',
 results:[{seed:100,condition:'合作开启',meanPopulation:20,endingPopulation:22},{seed:100,condition:'合作关闭',meanPopulation:14,endingPopulation:16}]};
 const science={async questionSet(stage){return {question:{itemId:stage+'1',prompt:'问',options:['甲','乙']}}},
 async grade(q,a){return {gradedResult:'correct',stage:'pre',itemId:q.itemId,studentAnswer:a}},
 async run(){return experiment}};
 const c=createInteractiveLesson({science,experiment:'evo-pair'});
 await c.start();await c.submitPre(0);c.setPrediction({text:'我预测合作会影响不同种子的平均种群数量。',params:{seed:100}});await c.runExperiment();
 assert.equal(c.snapshot().visualization.summary.independentSeeds,1);
 assert.throws(()=>c.selectEvidence({plotIndex:0,seriesIndex:0,pointIndex:0}),/PFL|仅限/);
});
test('Evo seed selection grounds authorized AI question in the observed matched worlds',async()=>{
 const experiment={runId:'ev-pair-4',experiment:'evo-pair',
  results:[
  {seed:100,condition:'合作开启',meanPopulation:24,endingPopulation:28},
  {seed:100,condition:'合作关闭',meanPopulation:20,endingPopulation:15},
  {seed:104829,condition:'合作开启',meanPopulation:18,endingPopulation:17},
  {seed:104829,condition:'合作关闭',meanPopulation:19,endingPopulation:21}
 ]};
 const calls=[];
 const science={
  async questionSet(stage){return {question:{itemId:stage+'-1',prompt:'问',options:['甲','乙']}}},
  async grade(q,a){return {gradedResult:'correct',stage:'pre',itemId:q.itemId,studentAnswer:a}},
  async run(){return experiment},
  async modelStatus(){return true},
  async modelAsk(messages){calls.push(messages);return {reply:'请看同一个随机种子的配对差异。',model:'test-model'}}
 };
 const c=createInteractiveLesson({science,experiment:'evo-pair'});
 await c.start();await c.submitPre(0);
 c.setPrediction({text:'我预测在同一随机种子的不同合作条件下平均种群会不同。',params:{seed:100}});
 await c.runExperiment();
 const selected=c.selectWorldPair(100);
 assert.equal(selected.deltaMeanPopulation,4);
 assert.equal(c.snapshot().selectedPair.seed,100);
 assert.throws(()=>c.selectWorldPair(999));
 await c.requestStageCoach({question:'请帮我解释选择的这组配对种子',shareApproved:true});
 const sent=JSON.stringify(calls[0]);
 assert.match(sent,/104829|100/);
 assert.match(sent,/24/);
 assert.match(sent,/20/);
 assert.match(sent,/ev-pair-4/);
});

test('V5 adapter keeps original bridge as state owner when grading updates its summary',async()=>{
 const rows=new Map(),storage={getItem:k=>rows.get(k)??null,setItem:(k,v)=>rows.set(k,v)};
 const bridge={store:v2.loadLearning(storage),lib:v2,sessionId:'bridge-state',
  summary:'before',
  async questionSet(stage){return {question:{itemId:stage+'-1',prompt:'判断',options:['甲','乙']}}},
  async grade(){this.summary='after';return {gradedResult:'correct'}},
  async run(){return data('r1')},refresh(){}};
 const c=createV5InteractiveLesson(bridge,{storage});
 await c.start();await c.submitPre(0);
 assert.equal(bridge.summary,'after');
});

test('V5 comparison planning forwards the student goal to the original science planner without executing',async()=>{
 const calls=[],rows=new Map(),storage={getItem:k=>rows.get(k)??null,setItem:(k,v)=>rows.set(k,v)};
 const bridge={
  store:v2.loadLearning(storage),lib:v2,sessionId:'goal-test',refresh(){},
  async questionSet(stage){return {question:{itemId:stage+'-1',prompt:'问题',options:['A','B']}}},
  async grade(q,a){return {itemId:q.itemId,studentAnswer:a,gradedResult:'correct',stage:'pre'}},
  async run(){return data('official-experiment-42')},
  async mentor(){return {mode:'rules',question:'请说明验证目标'}},
  async propose(){throw Error('default plan ignores student goal, should not be used')},
  async request(path,body){calls.push({path,body});return {planId:'goal-plan-1',approvalRequired:true,autoExecuted:false,
   studyQuestion:'只改一个变量',changes:[{field:'logDelta',from:-10,to:-11}]}}
 };
 const c=createV5InteractiveLesson(bridge,{storage});await start(c);
 await c.requestMentor({note:'请帮助我检验初值扰动'});
 const goal='保持 r 不变，仅改变初值扰动指数。';
 await c.proposeComparison({goal});
 assert.equal(calls.length,1);
 assert.equal(calls[0].path,'/api/agent/plan');
 assert.equal(calls[0].body.runId,'official-experiment-42');
 assert.equal(calls[0].body.goal,goal);
 assert.equal(calls[0].body.mode,'rules');
 assert.equal(c.snapshot().comparison,null);
});

test('V5 adapter sends selected authentic point to original mentor request endpoint',async()=>{
 const log=[];const cells=new Map();
 const store=v2.loadLearning({getItem:k=>cells.get(k)??null,setItem:(k,v)=>cells.set(k,v)});
 const bridge={
  store,lib:v2,sessionId:'s1',
  async questionSet(stage){return {question:{itemId:stage+'-1',prompt:'问',options:['甲','乙']}}},
  async grade(q,a){return {gradedResult:'correct',stage:'pre',itemId:q.itemId,studentAnswer:a}},
  async run(){return data('ui-1')},
  async mentor(){throw Error('selection must not get lost in bridge.mentor')},
  async request(path,body){log.push({path,body});return {mode:'rules',observed:'原版反馈'}},
  async modelStatus(){return false},
  refresh(){}
 };
 const c=createV5InteractiveLesson(bridge,{storage:{getItem:k=>cells.get(k)??null,setItem:(k,v)=>cells.set(k,v)}});
 await start(c);c.selectEvidence({plotIndex:0,seriesIndex:0,pointIndex:1});
 await c.requestMentor({note:'解释这条数据'});
 assert.equal(log.length,1);
 assert.equal(log[0].path,'/api/mentor');
 assert.equal(log[0].body.runId,'ui-1');
 assert.deepEqual(log[0].body.selection,{plotIndex:0,seriesIndex:0,pointIndex:1});
 assert.equal(log[0].body.shareApproved,false);
});
