import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {createAcademyServer,computePfl} from '../server.mjs';
import {SCIENCE_TOOLS,buildRuleProposal,verifyProposalAgainstRun} from '../agent-planner.mjs';

let server,base;
before(async()=>{
 server=createAcademyServer();
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 base='http://127.0.0.1:'+server.address().port;
});
after(async()=>{await new Promise(r=>server.close(r))});
const post=async(path,body,extra={})=>{
 const r=await fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',...extra},body:JSON.stringify(body)});
 return {status:r.status,data:await r.json()};
};
const start=async(experiment='sensitivity')=>{
 const body=experiment==='evo-pair'?{seed:73129}:
  experiment==='logistic'?{params:{r:3.9,x0:.217,steps:120}}:
  {params:{r:3.9,x0:.217,steps:150,logDelta:-10}};
 const response=await post('/api/run',{experiment,prediction:'我预测这组实验中会出现不同的数值现象',...body});
 assert.equal(response.status,200);
 return response.data;
};
const tutor=async runId=>{
 const r=await post('/api/mentor',{runId,note:'我希望控制变量再做一次对照',shareApproved:false});
 assert.equal(r.status,200);assert.equal(r.data.mode,'rules');
};
test('science tool manifest contains only allowed bounded read-only tools',async()=>{
 const r=await fetch(base+'/api/agent/tools');
 assert.equal(r.status,200);
 const body=await r.json();
 assert.equal(body.plannerMode,'rules');
 assert.equal(body.approvalRequired,true);
 assert.deepEqual(body.tools.map(t=>t.id),['pfl.sensitivity','pfl.logistic','evo.paired']);
 assert.equal(JSON.stringify(body).includes('powershell'),false);
});
test('agent plans require a real executed experiment',async()=>{
 const bad=await post('/api/agent/plan',{runId:'not-real',goal:'改变初值'});
 assert.equal(bad.status,404);
 const run=await start();
 const premature=await post('/api/agent/plan',{runId:run.runId});
 assert.equal(premature.status,409);
 assert.match(premature.data.error,/导师反馈/);
});
test('sensitivity plan is exactly one variable and does not run the tool yet',async()=>{
 const run=await start();await tutor(run.runId);
 const plan=await post('/api/agent/plan',{runId:run.runId,goal:'初值扰动增大后，会更早分开吗？'});
 assert.equal(plan.status,200);
 assert.equal(plan.data.autoExecuted,false);
 assert.equal(plan.data.approvalRequired,true);
 assert.equal(plan.data.plannerMode,'rules');
 assert.equal(plan.data.toolId,'pfl.sensitivity');
 assert.deepEqual(plan.data.changes,[{field:'logDelta',from:-10,to:-7}]);
 assert.equal(plan.data.params.r,run.condition.r);
 assert.equal(plan.data.params.steps,run.condition.steps);
 assert.equal(plan.data.round,2);
 assert.ok(Date.parse(plan.data.expiresAt)>Date.now());
 // An unapproved plan does not create a new run, nor does it alter the old one.
 const original=await post('/api/mentor',{runId:run.runId,shareApproved:false});
 assert.equal(original.status,200);
 assert.equal(original.data.mode,'rules');
});
test('approval rejects arbitrary client tool arguments and requires a distinct prior prediction',async()=>{
 const run=await start();await tutor(run.runId);
 const {data:plan}=await post('/api/agent/plan',{runId:run.runId});
 const blank=await post('/api/agent/approve',{planId:plan.planId,prediction:''});
 assert.equal(blank.status,400);
 const copied=await post('/api/agent/approve',{planId:plan.planId,prediction:'我预测这组实验中会出现不同的数值现象'});
 assert.equal(copied.status,400);
 const extra=await post('/api/agent/approve',{planId:plan.planId,prediction:'我认为结果会提前分开',params:{r:4},experiment:'evil'});
 assert.equal(extra.status,400);
 const forged=await post('/api/agent/approve',{planId:'forged-plan',prediction:'我认为实验会产生差异'});
 assert.equal(forged.status,404);
});
test('genuine approval runs the PFL engine with server-owned parameters and evidence lineage',async()=>{
 const run=await start();await tutor(run.runId);
 const {data:plan}=await post('/api/agent/plan',{runId:run.runId});
 const approved=await post('/api/agent/approve',{planId:plan.planId,prediction:'我预计增大扰动以后会提前分离'});
 assert.equal(approved.status,200);
 assert.equal(approved.data.studentApproval,'explicit');
 assert.equal(approved.data.planConsumed,true);
 assert.notEqual(approved.data.runId,run.runId);
 assert.equal(approved.data.condition.logDelta,-7);
 assert.equal(approved.data.condition.r,run.condition.r);
 assert.deepEqual(approved.data.lineage.changed,[{field:'logDelta',from:-10,to:-7}]);
 const control=computePfl({experiment:'sensitivity',params:approved.data.condition});
 assert.deepEqual(approved.data.metrics,control.metrics);
 assert.deepEqual(approved.data.plots,JSON.parse(JSON.stringify(control.plots)));
 const replay=await post('/api/agent/approve',{planId:plan.planId,prediction:'我预计再次批准后的轨道会分离'});
 assert.equal(replay.status,409);
 const premature=await post('/api/agent/plan',{runId:approved.data.runId});
 assert.equal(premature.status,409);
});
test('Logistic planning changes r and preserves all other parameters',async()=>{
 const run=await start('logistic');await tutor(run.runId);
 const {data:plan}=await post('/api/agent/plan',{runId:run.runId,goal:'不同r下会出现什么变化'});
 assert.equal(plan.toolId,'pfl.logistic');
 assert.deepEqual(plan.changes,[{field:'r',from:3.9,to:3.7}]);
 assert.equal(plan.params.x0,run.condition.x0);
 assert.equal(plan.params.steps,run.condition.steps);
 const approved=await post('/api/agent/approve',{planId:plan.planId,prediction:'我预测更小的r会导致不同演化轨迹'});
 assert.equal(approved.status,200);
 assert.equal(approved.data.condition.r,3.7);
 assert.equal(approved.data.condition.x0,run.condition.x0);
});
test('EvoWorld planner uses pinned scientific engine and a new paired seed',async()=>{
 const run=await start('evo-pair');await tutor(run.runId);
 const {data:plan}=await post('/api/agent/plan',{runId:run.runId,goal:'换种子做一次配对重复'});
 assert.equal(plan.experiment,'evo-pair');
 assert.equal(plan.toolId,'evo.paired');
 assert.deepEqual(plan.changes,[{field:'seed',from:73129,to:73230}]);
 assert.equal(plan.params,null);
 assert.equal(plan.seed,73230);
 const approved=await post('/api/agent/approve',{planId:plan.planId,prediction:'第二个种子可能出现方向不同的效应'});
 assert.equal(approved.status,200);
 assert.equal(approved.data.engine,'EvoWorld');
 assert.equal(approved.data.condition.baseSeed,73230);
 assert.equal(approved.data.results.length,4);
 assert.ok(typeof approved.data.adapterSha256==='string');
 assert.ok(approved.data.results.every(x=>Math.abs(x.balanceError)<1e-5));
});
test('planner reject malformed proposal even if sourced from a future LLM',()=>{
 const previous={result:{experiment:'sensitivity',condition:{r:3.9,x0:.217,steps:150,logDelta:-10}},depth:0};
 const normal=buildRuleProposal(previous);
 assert.equal(verifyProposalAgainstRun(previous,normal),true);
 assert.equal(verifyProposalAgainstRun(previous,{...normal,experiment:'evo-pair'}),false);
 assert.equal(verifyProposalAgainstRun(previous,{...normal,changes:[{field:'r',from:3.9,to:4}]}),false);
 assert.equal(verifyProposalAgainstRun(previous,{...normal,params:{...normal.params,r:4}}),false);
 assert.equal(verifyProposalAgainstRun(previous,{...normal,params:{...normal.params,steps:1000}}),false);
 assert.equal(verifyProposalAgainstRun(previous,{...normal,params:{...normal.params,exec:'curl secret'}}),false);
});
test('experimental chain has a maximum depth and needs mentor review at every round',async()=>{
 let run=await start();
 for(let depth=0;depth<4;depth++){
  await tutor(run.runId);
  const {data:plan,status}=await post('/api/agent/plan',{runId:run.runId});
  assert.equal(status,200);
  const res=await post('/api/agent/approve',{
   planId:plan.planId,prediction:'第'+(depth+2)+'轮，我预计单变量改动将改变曲线分离时间'
  });
  assert.equal(res.status,200);
  run=res.data;
 }
 await tutor(run.runId);
 const denied=await post('/api/agent/plan',{runId:run.runId});
 assert.equal(denied.status,422);
 assert.match(denied.data.error,/轮数/);
});
test('cross-origin POST rejected for student tools, with no execution',async()=>{
 const run=await start();
 const denied=await post('/api/mentor',{runId:run.runId},{Origin:'https://malicious.example'});
 assert.equal(denied.status,403);
});
test('malformed large planning goal rejected without side effects',async()=>{
 const run=await start();await tutor(run.runId);
 const tooLong=await post('/api/agent/plan',{runId:run.runId,goal:'x'.repeat(301)});
 assert.equal(tooLong.status,422);
});
test('parallel EvoWorld approvals cannot execute same plan twice',async()=>{
 const run=await start('evo-pair');await tutor(run.runId);
 const {data:plan}=await post('/api/agent/plan',{runId:run.runId});
 const body={planId:plan.planId,prediction:'我预计换种子后合作对照结果会有所变化'};
 const [a,b]=await Promise.all([post('/api/agent/approve',body),post('/api/agent/approve',body)]);
 assert.deepEqual([a.status,b.status].sort((x,y)=>x-y),[200,409]);
});
test('two independent academy instances cannot read each other student run IDs',async()=>{
 const run=await start();
 const second=createAcademyServer();
 await new Promise(r=>second.listen(0,'127.0.0.1',r));
 try{
  const url='http://127.0.0.1:'+second.address().port;
  const r=await fetch(url+'/api/mentor',{method:'POST',headers:{'Content-Type':'application/json'},
   body:JSON.stringify({runId:run.runId})});
  assert.equal(r.status,404);
 }finally{await new Promise(r=>second.close(r))}
});

