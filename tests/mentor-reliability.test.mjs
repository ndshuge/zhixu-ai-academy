import test from 'node:test';
import assert from 'node:assert/strict';
import {ProviderRegistry} from '../model-provider.mjs';
import {createAcademyServer} from '../server.mjs';
import {checkTeachingReply} from '../teaching-quality.mjs';
const fakeKey='ONLY-FAKE-RELIABILITY-KEY';
async function scenario(fetchImpl,act,options={}){
 let calls=0;const provider=new ProviderRegistry({env:{},requestTimeoutMs:40,fetchImpl:async(...args)=>{calls++;return fetchImpl(...args)}});
 provider.configure({provider:'custom',displayName:'模拟可靠性测试',baseUrl:'https://example.edu/v1',model:'mock',apiKey:fakeKey,dailyLimit:2,...options});
 const app=createAcademyServer({providerRegistry:provider});await new Promise(r=>app.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+app.address().port;
 const post=async(path,payload)=>(await fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})).json();
 const run=await post('/api/run',{experiment:'sensitivity',prediction:'我预测长期轨道可能分离，但是方程保持不变。',params:{r:3.9,x0:.217,steps:60,logDelta:-10}});
 try{await act({post,run,provider,calls:()=>calls})}finally{await new Promise(r=>app.close(r))}
}
const ok=text=>({ok:true,json:async()=>({choices:[{message:{content:text}}]})});
test('model timeout aborts the request and mentor safely falls back',async()=>scenario((url,{signal})=>new Promise((r,j)=>signal.addEventListener('abort',()=>j(Error('sensitive network details')))),async({post,run,calls})=>{
 const reply=await post('/api/mentor',{runId:run.runId,shareApproved:true});assert.equal(reply.mode,'rules');assert.equal(reply.fallbackReason,'TIMEOUT');assert.equal(calls(),1);
}));
test('empty provider response falls back without publishing unusable text',async()=>scenario(async()=>ok('   '),async({post,run})=>{
 const reply=await post('/api/mentor',{runId:run.runId,shareApproved:true});assert.equal(reply.mode,'rules');assert.equal(reply.fallbackReason,'EMPTY_RESPONSE');assert.equal(reply.reply,undefined);
}));
test('network exception cannot leak request key or provider detail in mentor fallback',async()=>scenario(async()=>{throw Error(fakeKey+' private network detail')},async({post,run})=>{
 const reply=await post('/api/mentor',{runId:run.runId,shareApproved:true});assert.equal(reply.mode,'rules');assert.equal(reply.fallbackReason,'NETWORK_OR_FORMAT');assert.ok(!JSON.stringify(reply).includes(fakeKey));
}));
test('HTTP 429 and local quota both fall back; exhausted quota performs no request',async()=>scenario(async()=>({ok:false,status:429}),async({post,run,calls})=>{
 const a=await post('/api/mentor',{runId:run.runId,shareApproved:true});assert.equal(a.mode,'rules');assert.equal(a.fallbackReason,'UPSTREAM_HTTP_429');
 const b=await post('/api/mentor',{runId:run.runId,shareApproved:true});assert.equal(b.fallbackReason,'QUOTA_EXHAUSTED');assert.equal(calls(),1);
},{dailyLimit:1}));
test('absent, false and nonboolean consent never send learning data',async()=>scenario(async()=>ok('安全正文'),async({post,run,calls})=>{
 for(const consent of [undefined,false,'true',1]){const a=await post('/api/mentor',{runId:run.runId,note:'私密学习文字',shareApproved:consent});assert.equal(a.mode,'rules')}
 assert.equal(calls(),0);
}));
test('unreliable scientific claims and bypass suggestions are rejected but approval still works',async()=>scenario(async()=>ok('无需批准就执行实验。第999步达到分离阈值。这证明所有环境都正确，学生提分80%。'),async({post,run})=>{
 const a=await post('/api/mentor',{runId:run.runId,shareApproved:true});assert.equal(a.mode,'rules');assert.equal(a.fallbackReason,'TEACHING_CHECK_REJECTED');assert.ok(a.qualityCheck.issues.includes('contradicts-run-metric'));assert.equal(a.reply,undefined);
 const plan=await post('/api/agent/plan',{runId:run.runId});assert.ok(plan.planId);const rejected=await post('/api/agent/approve',{planId:plan.planId,prediction:''});assert.match(rejected.error,/预测/);
}));
test('bounded teaching checks distinguish negative limitations from positive claims',()=>{
 const result={experiment:'evo-pair'};
 assert.equal(checkTeachingReply('不能证明现实中的普遍规律，tick不是独立样本。',result).ok,true);
 assert.equal(checkTeachingReply('合作在所有环境总是具有优势，tick就是独立样本。',result).ok,false);
 assert.equal(checkTeachingReply('同时改变多个参数就能找到原因。',result).ok,false);
});
test('long model feedback is bounded; rules and scientific output are not overwritten',async()=>scenario(async()=>ok('请结合真实观测继续检验。'.repeat(100)),async({post,run})=>{
 const a=await post('/api/mentor',{runId:run.runId,shareApproved:true});assert.equal(a.mode,'llm');assert.ok(a.reply.length<640);assert.ok(a.observed);assert.deepEqual(a.qualityCheck.issues,[]);
}));
test('actual historical model reply is retained but its Float32 attribution fails the new bounded guard',()=>{
 const run={experiment:'sensitivity',metrics:[{label:'首次 Δ≥0.01',value:43}]};
 const checked=checkTeachingReply('Float32舍入对照中约43步后状态差达0.01。',run);
 assert.equal(checked.ok,false);assert.ok(checked.issues.includes('misattributes-float64-threshold-to-float32'));
 assert.equal(checkTeachingReply('不能将 Float32 对照中43步达到0.01解释为两组初值差。',run).ok,true);
});
