import test from 'node:test';
import assert from 'node:assert/strict';
import {createAcademyServer} from '../server.mjs';
import {ProviderRegistry} from '../model-provider.mjs';
test('a clean public checkout exposes evidence provenance without HTTP 500 or revealing case-level prompts',async()=>{
 const app=createAcademyServer({providerRegistry:new ProviderRegistry({env:{}})});
 await new Promise(resolve=>app.listen(0,'127.0.0.1',resolve));
 try{
  const res=await fetch('http://127.0.0.1:'+app.address().port+'/api/evidence/summary');
  assert.equal(res.status,200,'Synthetic technical evidence summary should use a verified public aggregate in a source checkout');
  const x=await res.json();
  assert.equal(x.scope,'VERIFIED_SYNTHETIC_TECHNICAL_TESTS_NOT_STUDENT_LEARNING');
  assert.equal(x.actualStudentParticipants,0);
  assert.ok(x.offline.situations>=50);
  assert.equal(x.remote.syntheticSituations,8);
  assert.ok(x.offline.hash?.length>=32);
  const raw=JSON.stringify(x);
  assert.doesNotMatch(raw,/apiKey|authorization|questionPrompt|rawResponse|participantName/i);
 }finally{await new Promise(resolve=>app.close(resolve))}
});
