import test from 'node:test';
import assert from 'node:assert/strict';
import {SAFETY_CASES,runSafetyExample} from '../science-safety-demo.mjs';
import {createAcademyServer} from '../server.mjs';
import {ProviderRegistry} from '../model-provider.mjs';
test('three fixed guardrail failures use production parser and verifyProposalAgainstRun',()=>{
 assert.equal(SAFETY_CASES.length,3);
 const ids=new Set();
 for(const example of SAFETY_CASES){
  assert.equal(ids.has(example.id),false);ids.add(example.id);
  const result=runSafetyExample(example.id);
  assert.equal(result.blocked,true);
  assert.equal(result.decision,'REJECTED');
  assert.equal(result.modelCalls,0);
  assert.equal(result.scientificExecutions,0);
  assert.equal(result.approvalRequired,true);
  assert.equal(result.scope,'FIXED_LOCAL_SIMULATION_NOT_REAL_MODEL_INCIDENT');
 }
});
test('safety demo fails closed for unregistered payloads',()=>{
 for(const id of ['','/../','make-me-a-command','A',undefined,null]){
  assert.throws(()=>runSafetyExample(id),{status:400});
 }
});
test('safety endpoint is fixed local demo and exposes no model/secret or execution endpoint',async()=>{
 const provider=new ProviderRegistry({env:{}});
 const server=createAcademyServer({providerRegistry:provider});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const root='http://127.0.0.1:'+server.address().port;
 try{
  const list=await fetch(root+'/api/safety/cases').then(r=>r.json());
  assert.equal(list.cases.length,3);
  for(const item of list.cases){
   const response=await fetch(root+'/api/safety/check?id='+encodeURIComponent(item.id));
   assert.equal(response.status,200);
   const data=await response.json();
   assert.equal(data.blocked,true);
   assert.equal(data.scientificExecutions,0);
  }
  const forged=await fetch(root+'/api/safety/check?id=execute-code');
  assert.equal(forged.status,400);
  assert.equal(provider.summary().configured,false);
 }finally{await new Promise(resolve=>server.close(resolve))}
});
