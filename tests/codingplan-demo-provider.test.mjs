import test from 'node:test';
import assert from 'node:assert/strict';
import {CodingPlanDemoProvider,DEMO_IDENTITY} from '../codingplan-demo-provider.mjs';

const sample=[{role:'system',content:'只返回 JSON'}, {role:'user',content:'合成数据：r=3.9'}];
const syntheticRpc=({tool=false,text='{"choice":"B"}',wrongModel=false}={})=>{
 const calls=[];const rpc=async(action,args=[])=>{
  calls.push({action,args});
  if(action==='state')return {data:{model:{provider:'opencode-go',id:wrongModel?'unknown':DEMO_IDENTITY.model}}};
  if(action==='events')return args?.[0]==='0'?{latest:9,data:[]}:
   {latest:11,data:tool?[{type:'tool_execution_start'}]:[]};
  if(action==='prompt')return {disposition:'started'};
  if(action==='wait')return {completed:true,text};
  if(action==='last')return {text};
  throw Error('unexpected '+action);
 };
 return {rpc,calls};
};
test('development-only provider accurately reports isolated mode and no credential interface',()=>{
 const p=new CodingPlanDemoProvider({rpc:syntheticRpc().rpc});
 const s=p.summary({admin:true});
 assert.equal(s.source,'isolated-Pi-RPC');
 assert.equal(s.configured,true);
 assert.equal(s.keyPresent,false);
 assert.throws(()=>p.requireAdmin('any'),/不可在网页配置/);
});
test('provider forwards one prompt to Pi and rejects mismatched model before making a request',async()=>{
 const fake=syntheticRpc();
 const p=new CodingPlanDemoProvider({rpc:fake.rpc,limit:1});
 const a=await p.generate(sample);
 assert.equal(a.text,'{"choice":"B"}');
 assert.equal(a.executionTools,0);
 assert.equal(p.summary().usedToday,1);
 await assert.rejects(p.generate(sample),/QUOTA_EXHAUSTED/);
 assert.equal(fake.calls.filter(x=>x.action==='prompt').length,1);
 const second=syntheticRpc({wrongModel:true});
 const q=new CodingPlanDemoProvider({rpc:second.rpc});
 await assert.rejects(q.generate(sample),/WRONG_MODEL_IDENTITY/);
 assert.equal(second.calls.filter(x=>x.action==='prompt').length,0);
});
test('unsafe tool execution or empty response fails closed',async()=>{
 for(const options of [{tool:true},{text:''}]){
  const fake=syntheticRpc(options),p=new CodingPlanDemoProvider({rpc:fake.rpc});
  await assert.rejects(p.generate(sample),/MODEL_ATTEMPTED_TOOL_CALLS|EMPTY_OR_OVERLONG_RESPONSE/);
  assert.equal(p.summary({admin:true}).failedToday,1);
 }
});
test('oversized prompt and unsupported role never reach external service',async()=>{
 const fake=syntheticRpc(),p=new CodingPlanDemoProvider({rpc:fake.rpc});
 await assert.rejects(p.generate([{role:'assistant',content:'x'}]),/INVALID_DEMO_MESSAGES/);
 await assert.rejects(p.generate([{role:'user',content:'x'.repeat(10000)}]),/INVALID_DEMO_MESSAGES/);
 assert.equal(fake.calls.length,0);
});
