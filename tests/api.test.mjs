import test,{after,before} from 'node:test';
import assert from 'node:assert/strict';
import {createAcademyServer,computePfl,computeEvo} from '../server.mjs';
import {computeExperiment} from '../adapters/pfl-engine.mjs';
let server,base;
before(async()=>{
 server=createAcademyServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 base='http://127.0.0.1:'+server.address().port;
});
after(async()=>{await new Promise(resolve=>server.close(resolve))});
const post=async(path,body)=>{const r=await fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});return {status:r.status,data:await r.json()}};
test('healthy application and no fake online AI',async()=>{
 const r=await fetch(base+'/api/status'),v=await r.json();
 assert.equal(r.status,200);assert.equal(v.ok,true);assert.equal(v.mentorMode,'rules');
 assert.deepEqual(v.experiments,['sensitivity','logistic','evo-pair']);
});
test('static HTML, JavaScript and CSS are served locally',async()=>{
 for(const p of ['/','/app.js','/style.css']){
  const r=await fetch(base+p);assert.equal(r.status,200);
  assert.ok((await r.text()).length>100);
 }
});
test('prediction required before experiment',async()=>{
 const r=await post('/api/run',{experiment:'sensitivity',prediction:'',params:{r:3.9,x0:0.217,steps:60,logDelta:-9}});
 assert.equal(r.status,400);assert.match(r.data.error,/预测/);
});
test('PFL real engine output matches its own scientific core',()=>{
 const p={r:3.9,x0:0.217,logDelta:-10,steps:130};
 const a=computePfl({experiment:'sensitivity',params:p});
 const b=computeExperiment('sensitivity',p);
 assert.deepEqual(a.metrics,b.metrics);assert.deepEqual(a.plots[0].series[0].points,b.plots[0].series[0].points);
 assert.equal(a.engineVersion,'pfl-kernel-1.0.0');
});
test('PFL sensitive trajectories respond to changing a single variable',()=>{
 const a=computePfl({experiment:'sensitivity',params:{r:3.9,x0:0.217,logDelta:-10,steps:120}});
 const b=computePfl({experiment:'sensitivity',params:{r:3.9,x0:0.217,logDelta:-7,steps:120}});
 assert.notDeepEqual(a.plots[0].series[1].points,b.plots[0].series[1].points);
});
test('PFL parameter validation rejects unknown and invalid inputs',()=>{
 assert.throws(()=>computePfl({experiment:'sensitivity',params:{r:8,x0:0.217,logDelta:-9,steps:60}}));
 assert.throws(()=>computePfl({experiment:'sensitivity',params:{r:3.9,x0:0.217,logDelta:-9,steps:60,evil:2}}));
});
test('PFL compute HTTP, server-recorded prediction, mentor and transfer quiz',async()=>{
 const result=await post('/api/run',{experiment:'sensitivity',prediction:'它们初期靠近，后期分离',params:{r:3.9,x0:0.217,logDelta:-10,steps:90}});
 assert.equal(result.status,200);assert.equal(result.data.engine,'Physics Frontier Lab');assert.ok(result.data.runId);
 assert.ok(result.data.plots[0].series[0].points.length===91);
 const ment=await post('/api/mentor',{runId:result.data.runId,note:'我还不理解浮点误差'});
 assert.equal(ment.status,200);assert.equal(ment.data.mode,'rules');assert.match(ment.data.observed,/轨道|PFL/);
 const quiz=await fetch(base+'/api/transfer?runId='+encodeURIComponent(result.data.runId));const q=await quiz.json();
 assert.equal(q.options.length,3);
 const unselected=await post('/api/evaluate',{runId:result.data.runId});
 assert.equal(unselected.status,400);
 const right=await post('/api/evaluate',{runId:result.data.runId,answer:1});
 const wrong=await post('/api/evaluate',{runId:result.data.runId,answer:0});
 assert.equal(right.data.correct,true);assert.equal(wrong.data.correct,false);
});
test('cannot inject false result into mentor with fake run ID',async()=>{
 const r=await post('/api/mentor',{runId:'fabricated',result:{experiment:'sensitivity',metrics:[{label:'伪造',value:12345}]}});
 assert.equal(r.status,404);
});
test('allow Logistic comparison using PFL source',async()=>{
 const r=await post('/api/run',{experiment:'logistic',prediction:'轨道变化',params:{r:3.9,x0:.217,steps:100}});
 assert.equal(r.status,200);assert.equal(r.data.experiment,'logistic');
 assert.ok(r.data.plots[0].series[0].points.length>50);
});
test('EvoWorld paired experiment has exact paired seeds and energy audit',async()=>{
 const r=await post('/api/run',{experiment:'evo-pair',prediction:'合作可能提高种群',seed:73129});
 assert.equal(r.status,200);assert.equal(r.data.engine,'EvoWorld');
 assert.equal(r.data.condition.repeats,2);assert.equal(r.data.results.length,4);
 const seeds=new Set(r.data.results.map(x=>x.seed));assert.equal(seeds.size,2);
 for(const x of r.data.results){assert.ok(Math.abs(x.balanceError)<1e-5)}
 assert.match(r.data.warning,/样本/);
 const m=await post('/api/mentor',{runId:r.data.runId});assert.equal(m.status,200);
 assert.match(m.data.suggestion,/种子/);
 const quiz=await fetch(base+'/api/transfer?runId='+encodeURIComponent(r.data.runId));
 const q=await quiz.json();assert.match(q.prompt,/随机种子/);
 const grade=await post('/api/evaluate',{runId:r.data.runId,answer:1});assert.equal(grade.data.correct,true);
});
test('EvoWorld repeated runs reproducible for identical parameters',async()=>{
 const a=await computeEvo({seed:73129}),b=await computeEvo({seed:73129});
 assert.deepEqual(a.results,b.results);
});
test('EvoWorld invalid seed is rejected',async()=>{
 const r=await post('/api/run',{experiment:'evo-pair',prediction:'预测',seed:-1});
 assert.equal(r.status,400);
});
test('unknown URLs return 404 with no directory traversal',async()=>{
 const r=await fetch(base+'/private-key.txt');assert.equal(r.status,404);
});
