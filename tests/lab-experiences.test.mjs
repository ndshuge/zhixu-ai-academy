import test from 'node:test';
import assert from 'node:assert/strict';
import {createAcademyServer} from '../server.mjs';
import {loadLearning,appendLearningEvent,summarizeLearning} from '../public/learning-store.js';
test('fixed lab routes serve modules and Worker with same-origin CSP and reject traversal',async()=>{
 const app=createAcademyServer();await new Promise(r=>app.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+app.address().port;
 try{
  for(const path of ['/labs/pfl/','/labs/evo/','/labs/evo/src/web/worker.mjs','/labs/evo/src/web/experiment-worker.mjs','/labs/evo/results/cooperation.json']){const r=await fetch(base+path);assert.equal(r.status,200,path);assert.match(r.headers.get('content-security-policy'),/connect-src 'self'/)}
  for(const path of ['/labs/evo/%2e%2e%2fserver.mjs','/labs/evo/%5cserver.mjs','/labs/evo/unknown.mjs'])assert.equal((await fetch(base+path)).status,404);
 }finally{await new Promise(r=>app.close(r))}
});
test('exploration prediction and observation persist without changing graded learning metrics',()=>{
 const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};const s=loadLearning(storage);
 const first=appendLearningEvent(s,'lab_prediction',{lab:'evo',prediction:'我预测能量会变化。'},{sessionId:'demo'},storage);
 appendLearningEvent(s,'lab_observation',{lab:'evo',tick:20,predictionEventId:first.eventId,reflection:'一个世界不能证明普遍结论。'},{sessionId:'demo'},storage);
 const restored=loadLearning(storage);assert.equal(restored.events.length,2);assert.equal(restored.events[1].payload.predictionEventId,first.eventId);
 const summary=summarizeLearning(restored);assert.equal(summary.answered,0);assert.equal(summary.incorrect,0);assert.equal(summary.explorations,0);
});
