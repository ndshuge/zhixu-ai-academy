import test from 'node:test';
import assert from 'node:assert/strict';
import {createAcademyServer} from '../server.mjs';
import {ProviderRegistry} from '../model-provider.mjs';
import {buildSafeProposalChoices,parseChoice,selectModelProposal} from '../llm-science-planner.mjs';
import {verifyProposalAgainstRun} from '../agent-planner.mjs';

const prior=(experiment,condition)=>({result:{experiment,condition,metrics:[{label:'首次 Δ≥0.01',value:43}],results:[
 {condition:'合作开启',seed:42,meanPopulation:12},{condition:'合作关闭',seed:42,meanPopulation:10}]},
 prediction:'我认为初始微小差异的轨迹永远不会分开',depth:0,mentored:true});
const models=[
 ()=>prior('sensitivity',{r:3.9,x0:.217,logDelta:-10,steps:150}),
 ()=>prior('logistic',{r:3.9,x0:.217,steps:150}),
 ()=>prior('evo-pair',{baseSeed:73129})
];
test('60 fixed boundary cases create two distinct science-validated candidates',()=>{
 const conditions=[];
 for(let k=-14;k<=-3;k++)conditions.push(prior('sensitivity',{r:3.9,x0:.217,logDelta:k,steps:150}));
 for(let k=0;k<=14;k++)conditions.push(prior('logistic',{r:Number((3.3+k*.05).toFixed(2)),x0:.217,steps:150}));
 for(const seed of [0,1,42,100,200,73129,999,2000,3000,5000,9000,50000,100000,1000000,2000000000,4000000000,4293999800,4293999999,4294000000,73130])conditions.push(prior('evo-pair',{baseSeed:seed}));
 for(let i=0;i<13;i++)conditions.push(prior('sensitivity',{r:3.9,x0:.217,logDelta:-10,steps:100+i}));
 assert.equal(conditions.length,60);
 for(const p of conditions){
  const c=buildSafeProposalChoices(p,{goal:'检验科学假设'});
  assert.equal(c.length,2);
  assert.notEqual(c[0].proposal.changes[0].to,c[1].proposal.changes[0].to);
  assert.equal(c.every(x=>verifyProposalAgainstRun(p,x.proposal)),true);
  assert.equal(c.every(x=>x.proposal.approvalRequired===true&&x.proposal.autoExecuted===false),true);
 }
});
test('strict model parser rejects tool calls, extra keys and arbitrary narrative',()=>{
 assert.equal(parseChoice('{"choice":"A"}'),'A');
 for(const s of ['{"choice":"A","command":"curl"}','{"choice":"C"}','sure: B',
  '{"choice":"B","toolId":"shell.run"}','```json\n{"choice":"A"}\n```',
  'not json','[]','{"choice":3}',JSON.stringify({choice:'A',secret:'ignore'})]){
  assert.throws(()=>parseChoice(s));
 }
});
test('authorized stub model chooses candidate B and never executes science tools',async()=>{
 const p=models[0]();let calls=0;
 const provider={generate:async()=>{calls++;return {text:'{"choice":"B"}',provider:'local-mock',model:'mock',usage:{totalTokens:15}}}};
 const q=await selectModelProposal(p,{goal:'验证更小扰动',provider});
 assert.equal(calls,1);assert.equal(q.plannerMode,'llm-constrained');
 assert.equal(q.modelDecision.choice,'B');
 assert.equal(q.autoExecuted,false);assert.equal(q.approvalRequired,true);
 assert.equal(verifyProposalAgainstRun(p,q),true);
});
test('ill-formed model output causes refusal rather than unsafe proposal',async()=>{
 const p=models[1]();
 await assert.rejects(()=>selectModelProposal(p,{provider:{generate:async()=>({text:'{"choice":"B","exec":"whoami"}'})}}));
});
async function runServerWithProvider(provider,fn){
 const server=createAcademyServer({providerRegistry:provider});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port;
 const post=async(path,p)=>{
  const r=await fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(p)});
  return {status:r.status,data:await r.json()};
 };
 try{await fn({post,base})}finally{await new Promise(resolve=>server.close(resolve))}
}
function mockProvider(reply){
 let calls=0;
 const provider=new ProviderRegistry({env:{},allowLocal:true,adminToken:'mock-admin',
  fetchImpl:async()=>{
   calls++;
   return new Response(JSON.stringify({choices:[{message:{content:reply}}],usage:{total_tokens:16}}),
    {status:200,headers:{'Content-Type':'application/json'}});
  }});
 provider.configure({provider:'custom',baseUrl:'http://127.0.0.1:1/v1',model:'mock',apiKey:'local-test-no-secret',dailyLimit:10});
 return {provider,calls:()=>calls};
}
const startAndMentor=async post=>{
 const run=await post('/api/run',{experiment:'sensitivity',params:{r:3.9,x0:.217,steps:150,logDelta:-10},prediction:'同一规律下我猜不会出现明显的数值分离'});
 assert.equal(run.status,200);
 const tutor=await post('/api/mentor',{runId:run.data.runId,shareApproved:false,note:'如何设计控制变量'});
 assert.equal(tutor.status,200);assert.equal(tutor.data.mode,'rules');
 return run.data.runId;
};
test('no student consent means model is never contacted and rules continue',async()=>{
 const m=mockProvider('{"choice":"B"}');
 await runServerWithProvider(m.provider,async({post})=>{
  const runId=await startAndMentor(post);
  const unauth=await post('/api/agent/plan',{runId,mode:'llm',shareApproved:false});
  assert.equal(unauth.status,403);
  assert.equal(m.calls(),0);
  const normal=await post('/api/agent/plan',{runId});
  assert.equal(normal.status,200);assert.equal(normal.data.plannerMode,'rules');
  assert.equal(m.calls(),0);
 });
});
test('consented model selection remains server-side and needs new approval',async()=>{
 const m=mockProvider('{"choice":"B"}');
 await runServerWithProvider(m.provider,async({post})=>{
  const runId=await startAndMentor(post);
  const proposal=await post('/api/agent/plan',{runId,mode:'llm',shareApproved:true,goal:'我想检查扰动是否改变分离时间'});
  assert.equal(proposal.status,200);assert.equal(proposal.data.plannerMode,'llm-constrained');
  assert.equal(m.calls(),1);assert.equal(proposal.data.autoExecuted,false);
  const bad=await post('/api/agent/approve',{planId:proposal.data.planId,prediction:' '});
  assert.equal(bad.status,400);
  const approved=await post('/api/agent/approve',{planId:proposal.data.planId,prediction:'我预测使用这个对照实验后，分离阈值到达时刻会出现变化'});
  assert.equal(approved.status,200);assert.equal(approved.data.studentApproval,'explicit');
  assert.equal(approved.data.lineage.plannerMode,'llm-constrained');
  assert.equal(m.calls(),1);
 });
});
test('unsafe model choice automatically falls back and still requires approval',async()=>{
 const m=mockProvider('{"choice":"B","arbitraryCommand":"cmd.exe"}');
 await runServerWithProvider(m.provider,async({post})=>{
  const runId=await startAndMentor(post);
  const proposal=await post('/api/agent/plan',{runId,mode:'llm',shareApproved:true});
  assert.equal(proposal.status,200);
  assert.equal(proposal.data.plannerMode,'rules');
  assert.equal(proposal.data.fallbackReason,'CONSTRAINED_MODEL_FAILED');
  assert.equal(proposal.data.autoExecuted,false);
  assert.equal(m.calls(),1);
 });
});
