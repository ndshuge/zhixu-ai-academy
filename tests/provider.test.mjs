import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {ProviderRegistry} from '../model-provider.mjs';
import {createAcademyServer} from '../server.mjs';

let fakeApi,academy,upstream,base,registry,calls=[];
const token='local-integration-test-admin-token';
before(async()=>{
 fakeApi=createServer(async(req,res)=>{
  assert.equal(req.url,'/compatible/v1/chat/completions');
  assert.equal(req.headers.authorization,'Bearer ONLY-FAKE-TEST-KEY');
  const body=await new Promise(resolve=>{let text='';req.on('data',x=>text+=x);req.on('end',()=>resolve(JSON.parse(text)))});
  calls.push(body);
  res.writeHead(200,{'Content-Type':'application/json'});
  res.end(JSON.stringify({choices:[{message:{content:'模型已收到真实观测，请学生进一步验证。'}}],usage:{total_tokens:13}}));
 });
 await new Promise(resolve=>fakeApi.listen(0,'127.0.0.1',resolve));
 upstream='http://127.0.0.1:'+fakeApi.address().port+'/compatible/v1';
 registry=new ProviderRegistry({env:{},adminToken:token,allowLocal:true});
 academy=createAcademyServer({providerRegistry:registry});
 await new Promise(resolve=>academy.listen(0,'127.0.0.1',resolve));
 base='http://127.0.0.1:'+academy.address().port;
});
after(async()=>{
 if(academy)await new Promise(r=>academy.close(r));
 if(fakeApi)await new Promise(r=>fakeApi.close(r));
});
async function post(path,payload,headers={}){
 const r=await fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(payload||{})});
 return {status:r.status,body:await r.json()};
}
test('BYOK public status is safe, admin endpoint requires token',async()=>{
 const s=await (await fetch(base+'/api/status')).json();
 assert.equal(s.mentorMode,'rules');assert.equal(s.provider,null);
 assert.ok(!JSON.stringify(s).includes('ADMIN'));
 const forbidden=await fetch(base+'/api/admin/provider');
 assert.equal(forbidden.status,403);
 const wrong=await fetch(base+'/api/admin/provider',{headers:{'X-Academy-Admin':'bad'}});
 assert.equal(wrong.status,403);
});
test('reject insecure model URL by default and blank key',()=>{
 const locked=new ProviderRegistry({env:{},adminToken:'test-admin'});
 assert.throws(()=>locked.configure({provider:'custom',baseUrl:'http://127.0.0.1:9000/v1',
   displayName:'fake',model:'mock-model',apiKey:'x'}),/HTTPS|内网/);
 assert.throws(()=>locked.configure({provider:'custom',baseUrl:'https://example.edu/v1',
   displayName:'school',model:'mock-model',apiKey:''}),/API Key/);
});
test('admin configures own provider in memory; student cannot see API Key or endpoint',async()=>{
 const saved=await post('/api/admin/provider',{
  provider:'custom',displayName:'示范学校自带API',baseUrl:upstream,
  model:'mock-science-model',apiKey:'ONLY-FAKE-TEST-KEY',dailyLimit:2,maxOutputTokens:100
 },{'X-Academy-Admin':token});
 assert.equal(saved.status,200);assert.equal(saved.body.configured,true);assert.equal(saved.body.verified,false);
 assert.equal(saved.body.credentialStorage,'server-memory-only');
 const publicState=await (await fetch(base+'/api/status')).json();
 assert.equal(publicState.mentorMode,'llm-configured');
 assert.equal(publicState.provider,'示范学校自带API');
 assert.ok(!JSON.stringify(publicState).includes('ONLY-FAKE'));
 assert.ok(!JSON.stringify(publicState).includes(upstream));
 const admin=await (await fetch(base+'/api/admin/provider',{headers:{'X-Academy-Admin':token}})).json();
 assert.equal(admin.keyPresent,true);
 assert.ok(!JSON.stringify(admin).includes('ONLY-FAKE'));
});
test('admin test is a real minimal API request and tracks usage',async()=>{
 const v=await post('/api/admin/provider/test',{}, {'X-Academy-Admin':token});
 assert.equal(v.status,200);assert.equal(v.body.reply,'模型已收到真实观测，请学生进一步验证。');assert.equal(registry.verified,true);
 assert.equal(v.body.usage.totalTokens,13);
 assert.equal(registry.callsToday,1);
 assert.equal(calls.length,1);
 assert.equal(calls[0].max_tokens,20);
});
test('without student consent, mentor does not transmit private learning context',async()=>{
 const run=await post('/api/run',{experiment:'sensitivity',
  prediction:'我认为两条轨道最终会分离',params:{r:3.9,x0:.217,steps:60,logDelta:-10}});
 assert.equal(run.status,200);
 registry.__lastTestRunId=run.body.runId;
 const before=calls.length;
 const answer=await post('/api/mentor',{runId:run.body.runId,note:'我的私人学习反思',shareApproved:false});
 assert.equal(answer.status,200);assert.equal(answer.body.mode,'rules');
 assert.equal(calls.length,before);
 assert.match(answer.body.availability,/没有授权/);
});
test('consented student response passes evidence to actual configured provider',async()=>{
 const before=calls.length;
 const reply=await post('/api/mentor',{runId:registry.__lastTestRunId,
  note:'我还想知道如何设计一个反例实验',shareApproved:true});
 assert.equal(reply.status,200);assert.equal(reply.body.mode,'llm');
 assert.match(reply.body.reply,/模型已收到真实观测/);
 assert.equal(reply.body.provider,'示范学校自带API');
 assert.equal(calls.length,before+1);
 assert.ok(JSON.stringify(calls.at(-1)).includes('真实科学数据'));
 assert.equal(registry.callsToday,2);
});
test('quota reached falls back to local rules without external requests',async()=>{
 const before=calls.length;
 const answer=await post('/api/mentor',{runId:registry.__lastTestRunId,shareApproved:true});
 assert.equal(answer.status,200);assert.equal(answer.body.mode,'rules');
 assert.equal(calls.length,before);
 assert.match(answer.body.availability,/配额/);
 const status=await (await fetch(base+'/api/status')).json();
 assert.equal(status.usage.today,2);
 assert.equal(status.usage.limit,2);
});
test('admin can disable API, all future student traffic returns to local rules',async()=>{
 const r=await post('/api/admin/provider/clear',{}, {'X-Academy-Admin':token});
 assert.equal(r.status,200);assert.equal(r.body.configured,false);
 const publicState=await (await fetch(base+'/api/status')).json();
 assert.equal(publicState.mentorMode,'rules');
});
