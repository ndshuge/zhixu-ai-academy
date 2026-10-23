import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {ProviderRegistry} from '../model-provider.mjs';
import {createAcademyServer} from '../server.mjs';

test('judge BYOK sessions isolate API keys, usage and school configuration',async t=>{
 const incoming=[];
 const fake=createServer(async(req,res)=>{
  let raw='';for await(const c of req)raw+=c;
  const body=JSON.parse(raw);incoming.push({authorization:req.headers.authorization,body});
  res.writeHead(body.model==='denied-model'?401:200,{'Content-Type':'application/json'});
  res.end(body.model==='denied-model'?JSON.stringify({error:'never echo upstream errors'}):
   JSON.stringify({choices:[{message:{content:'科学观测来源于真实计算，请解释这个现象并设计单变量对照实验。'}}],usage:{total_tokens:18}}));
 });
 await new Promise(r=>fake.listen(0,'127.0.0.1',r));
 t.after(()=>new Promise(r=>fake.close(r)));
 const fakeURL='http://127.0.0.1:'+fake.address().port+'/v1';
 const school=new ProviderRegistry({env:{},allowLocal:true,adminToken:'school-test-only'});
 school.configure({provider:'custom',displayName:'校方独立模型',baseUrl:fakeURL,model:'school-model',apiKey:'SCHOOL-FAKE-KEY'});
 const app=createAcademyServer({providerRegistry:school,judgeRegistryFactory:()=>new ProviderRegistry({env:{},allowLocal:true})});
 await new Promise(r=>app.listen(0,'127.0.0.1',r));
 t.after(()=>new Promise(r=>app.close(r)));
 const base='http://127.0.0.1:'+app.address().port;
 const post=async(path,body,cookie)=>{
  const r=await fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},body:JSON.stringify(body)});
  return {status:r.status,body:await r.json(),cookie:r.headers.get('set-cookie')};
 };
 const get=async(path,cookie)=>{
  const r=await fetch(base+path,{headers:cookie?{Cookie:cookie}:{}});return r.json();
 };
 const before=await get('/api/status');
 assert.equal(before.provider,'校方独立模型');
 const make=async(label,key,model)=>{
  const save=await post('/api/connect/provider',{
   provider:'custom',displayName:label,baseUrl:fakeURL,model,apiKey:key,dailyLimit:3,maxOutputTokens:150
  });
  assert.equal(save.status,200);
  assert.equal(save.body.scope,'browser-session');
  assert.ok(save.cookie?.includes('HttpOnly; SameSite=Strict'));
  assert.equal(save.body.keyPresent,true);
  assert.ok(!JSON.stringify(save.body).includes(key));
  return save.cookie.split(';')[0];
 };
 const a=await make('评委 A','ONLY-FAKE-A','first-model');
 const b=await make('评委 B','ONLY-FAKE-B','second-model');
 assert.notEqual(a,b);
 const aStatus=await get('/api/status',a),bStatus=await get('/api/status',b);
 assert.equal(aStatus.provider,'评委 A');assert.equal(aStatus.providerSource,'judge-session');
 assert.equal(bStatus.provider,'评委 B');assert.equal(bStatus.providerSource,'judge-session');
 assert.equal((await get('/api/status')).provider,'校方独立模型');
 assert.ok(!JSON.stringify(aStatus).includes('ONLY-FAKE-A'));
 assert.ok(!JSON.stringify(bStatus).includes('ONLY-FAKE-B'));
 const unapproved=await post('/api/run',{experiment:'sensitivity',prediction:'初始条件差异会在时间中放大',params:{r:3.9,x0:0.217,steps:60,logDelta:-10}},a);
 assert.equal(unapproved.status,200);
 const count=incoming.length;
 const noConsent=await post('/api/mentor',{runId:unapproved.body.runId,shareApproved:false},a);
 assert.equal(noConsent.body.mode,'rules');assert.equal(incoming.length,count);
 const testedA=await post('/api/connect/provider/test',{},a);
 assert.equal(testedA.status,200);assert.equal(incoming.at(-1).authorization,'Bearer ONLY-FAKE-A');
 assert.equal(incoming.at(-1).body.model,'first-model');
 const testedB=await post('/api/connect/provider/test',{},b);
 assert.equal(testedB.status,200);assert.equal(incoming.at(-1).authorization,'Bearer ONLY-FAKE-B');
 assert.equal(incoming.at(-1).body.model,'second-model');
 const consented=await post('/api/mentor',{runId:unapproved.body.runId,shareApproved:true,note:'试着控制一个变量'},a);
 assert.equal(consented.status,200);assert.equal(incoming.at(-1).authorization,'Bearer ONLY-FAKE-A');
 assert.equal((await get('/api/connect/provider',a)).usedToday,2);
 assert.equal((await get('/api/connect/provider',b)).usedToday,1);
 const rejected=await post('/api/connect/provider',{provider:'custom',displayName:'bad',baseUrl:'http://10.0.0.1/v1',model:'bad',apiKey:'no'},b);
 assert.equal(rejected.status,400);
 assert.equal((await get('/api/status',b)).provider,'评委 B');
 const cleared=await post('/api/connect/provider/clear',{},a);
 assert.equal(cleared.status,200);
 assert.match(cleared.cookie,/Max-Age=0/);
 assert.equal((await get('/api/status',a)).provider,'校方独立模型');
 assert.equal((await get('/api/status',b)).provider,'评委 B');
 assert.equal((await get('/api/status')).provider,'校方独立模型');
 const bad=await make('错误演示','ONLY-FAKE-C','denied-model');
 const denied=await post('/api/connect/provider/test',{},bad);
 assert.equal(denied.status,502);
 assert.match(denied.body.error,/API Key|401/);
 assert.ok(!JSON.stringify(denied.body).includes('ONLY-FAKE-C'));
});
