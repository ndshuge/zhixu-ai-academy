import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {createAcademyServer} from '../server.mjs';
import {getPublicQuestion,listPublicQuestions,gradeQuestion} from '../quiz-bank.mjs';
import {loadLearning,LEGACY_KEY,STORAGE_KEY,appendLearningEvent,recordQuestionAttempt,
 recordHypothesis,getMisconceptions,decideMisconception,getReviewTasks,reviewAction,
 summarizeLearning,exportLearning,clearLearning} from '../public/learning-store.js';
import {analyzeStudyPayload} from '../scripts/evaluate-study.mjs';

function mockStorage(seed={}){
 const m=new Map(Object.entries(seed));return {
  getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,v),
  removeItem:k=>m.delete(k),dump:()=>Object.fromEntries(m)
 };
}
let server,base;
before(async()=>{
 server=createAcademyServer();
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 base='http://127.0.0.1:'+server.address().port;
});
after(async()=>{await new Promise(r=>server.close(r))});
const post=async(path,data)=>{
 const r=await fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json'},
  body:JSON.stringify(data)});return {status:r.status,data:await r.json()};
};
test('distinct pre/transfer/review item IDs; public endpoints never reveal answer',async()=>{
 const qs=listPublicQuestions();
 assert.ok(qs.length>=9);
 assert.ok(qs.filter(q=>q.stage==='pre').length>=3);
 assert.ok(qs.filter(q=>q.stage==='transfer').length>=3);
 assert.ok(qs.filter(q=>q.stage==='review').length>=3);
 const pre=getPublicQuestion('chaos.same-rule.pre.01');
 const transfer=getPublicQuestion('chaos.same-rule.transfer.01');
 assert.notEqual(pre.prompt,transfer.prompt);
 for(const q of qs){
  const text=JSON.stringify(q);
  assert.ok(!text.includes('correctAnswer'));
  assert.ok(!text.includes('explanation'));
  assert.ok(!Object.hasOwn(q,'answer'));
 }
 const response=await fetch(base+'/api/learning/questions');
 const body=await response.json();
 assert.ok(!JSON.stringify(body).includes('answer":'));
 assert.ok(!JSON.stringify(body).includes('explanation'));
});
test('new grading token is one-use, refuses empty/invalid responses',async()=>{
 const received=await (await fetch(base+'/api/learning/item?itemId=chaos.same-rule.pre.01')).json();
 assert.equal(received.stage,'pre');
 assert.ok(received.attemptToken);
 assert.ok(!Object.hasOwn(received,'answer'));
 const bad=await post('/api/learning/grade',{itemId:received.itemId,attemptToken:received.attemptToken,answer:''});
 assert.equal(bad.status,400);
 const invalid=await post('/api/learning/grade',{itemId:received.itemId,attemptToken:received.attemptToken,answer:15});
 assert.equal(invalid.status,400);
 const answer=await post('/api/learning/grade',{itemId:received.itemId,attemptToken:received.attemptToken,answer:0});
 assert.equal(answer.status,200);
 assert.equal(answer.data.gradedResult,'incorrect');
 assert.equal(answer.data.misconception.status,'pending');
 assert.equal(answer.data.suggestedReviewItem,'chaos.same-rule.review.01');
 const replay=await post('/api/learning/grade',{itemId:received.itemId,attemptToken:received.attemptToken,answer:1});
 assert.equal(replay.status,409);
});
test('targeted remediation follows the wrong option and never appears during pre-test',()=>{
 const pre=gradeQuestion('chaos.same-rule.pre.01',0);
 assert.equal(pre.nextStep,null,'blinded pre-test should not receive a teaching hint');
 const overclaim=gradeQuestion('evo.inference.transfer.01',0);
 const wrongN=gradeQuestion('evo.inference.transfer.01',2);
 const correct=gradeQuestion('evo.inference.transfer.01',1);
 assert.match(overclaim.nextStep,/模型内|仿真/);
 assert.match(wrongN.nextStep,/随机世界|tick/);
 assert.notEqual(overclaim.nextStep,wrongN.nextStep,'wrong choices must get different follow-ups');
 assert.equal(correct.nextStep,null);
 assert.equal(overclaim.misconception.status,'pending','error hypothesis stays contestable');
});
test('forged and cross-question tokens cannot grade',async()=>{
 const received=await (await fetch(base+'/api/learning/item?itemId=chaos.control.pre.01')).json();
 assert.equal((await post('/api/learning/grade',{itemId:received.itemId,attemptToken:'fake',answer:0})).status,400);
 assert.equal((await post('/api/learning/grade',{itemId:'chaos.same-rule.pre.01',attemptToken:received.attemptToken,answer:0})).status,400);
 assert.equal((await post('/api/learning/grade',{itemId:received.itemId,attemptToken:received.attemptToken,answer:0})).status,200);
});
test('legacy v01 migration preserves original bytes and avoids arbitrary grade labels',()=>{
 const original=JSON.stringify([{id:'old-run',experiment:'sensitivity',
  createdAt:'2026-10-10T03:00:00.000Z',prediction:'可能分离',
  step:'complete',transfer:{choice:0,correct:false}}]);
 const storage=mockStorage({[LEGACY_KEY]:original});
 const s=loadLearning(storage);
 assert.equal(s.schemaVersion,2);
 assert.equal(s.events.length,1);
 assert.equal(s.events[0].kind,'legacy_import');
 assert.equal(s.events[0].payload.hasTransfer,true);
 assert.ok(!Object.hasOwn(s.events[0].payload,'gradedResult'));
 assert.equal(storage.getItem(LEGACY_KEY),original);
 assert.equal(loadLearning(storage).events.length,1);
});
test('corrupted V02 never overwrites old records and does not silently reset',()=>{
 const storage=mockStorage({[STORAGE_KEY]:'{BROKEN JSON',[LEGACY_KEY]:'[]'});
 assert.throws(()=>loadLearning(storage),/无法识别/);
 assert.equal(storage.getItem(STORAGE_KEY),'{BROKEN JSON');
 const badOld=mockStorage({[LEGACY_KEY]:'{"wrong":"type"}'});
 assert.throws(()=>loadLearning(badOld),/旧版学习记录无法解析/);
 assert.equal(badOld.getItem(STORAGE_KEY),null);
});
test('objective wrong answer logs candidate and review while scientific hypothesis is not an error',()=>{
 const mem=mockStorage(),s=loadLearning(mem);
 const experiment=recordHypothesis(s,'run-real',{experiment:'sensitivity',
  prediction:'两个初值可能分开',engineVersion:'pfl-kernel-1.0.0',
  condition:{r:3.9,x0:.217,logDelta:-10},metrics:[{label:'first',value:35}]},{sessionId:'A'},mem);
 assert.equal(experiment.kind,'hypothesis_test');
 assert.equal(summarizeLearning(s).incorrect,0);
 const grade=gradeQuestion('chaos.same-rule.pre.01',0);
 grade.suggestedReviewItem='chaos.same-rule.review.01';
 const answer=recordQuestionAttempt(s,grade,{sessionId:'A'},mem);
 assert.equal(answer.kind,'question_attempt');
 assert.equal(summarizeLearning(s).incorrect,1);
 const candidates=getMisconceptions(s);
 assert.equal(candidates.length,1);
 assert.equal(candidates[0].payload.evidenceEventId,answer.eventId);
 assert.equal(candidates[0].status,'pending');
 assert.equal(getReviewTasks(s).length,1);
 assert.equal(getReviewTasks(s)[0].nextItemId,'chaos.same-rule.review.01');
 assert.equal(s.events.filter(x=>x.kind==='question_attempt').length,1);
});
test('candidate rejection is append-only and remains traceable',()=>{
 const mem=mockStorage(),s=loadLearning(mem);
 const grade=gradeQuestion('chaos.same-rule.pre.01',0);
 recordQuestionAttempt(s,grade,{sessionId:'s'},mem);
 const target=getMisconceptions(s)[0];
 decideMisconception(s,target.eventId,'rejected','诊断过于笼统',mem);
 assert.equal(getMisconceptions(s)[0].status,'rejected');
 assert.equal(s.events.filter(x=>x.kind==='misconception_candidate').length,1);
 assert.equal(s.events.filter(x=>x.kind==='misconception_decision').length,1);
 decideMisconception(s,target.eventId,'confirmed','我愿意再验证',mem);
 assert.equal(getMisconceptions(s)[0].status,'confirmed');
});
test('review wrong/success changes due date but never claims 100 percent mastery',()=>{
 const mem=mockStorage(),s=loadLearning(mem);
 const g=gradeQuestion('chaos.same-rule.pre.01',0);g.suggestedReviewItem='chaos.same-rule.review.01';
 recordQuestionAttempt(s,g,{sessionId:'s'},mem);
 const task=getReviewTasks(s)[0];assert.ok(task.dueAt);
 reviewAction(s,task.reviewId,'defer',mem);
 assert.equal(getReviewTasks(s)[0].actions,1);
 const next=gradeQuestion('chaos.same-rule.review.01',1);
 recordQuestionAttempt(s,next,{sessionId:'review'},mem);
 const result=summarizeLearning(s);
 assert.equal(result.reviewed,1);
 assert.equal(getReviewTasks(s)[0].lastOutcome,'correct');
 assert.equal(result.concepts.find(x=>x.id==='chaos.same-rule').distinctCorrect,1);
 assert.ok(!JSON.stringify(result).includes('masteryPercentage'));
});
test('export is user-controlled; clearing v02 preserves legacy backup',()=>{
 const mem=mockStorage({[LEGACY_KEY]:'[]'}),s=loadLearning(mem);
 const payload=exportLearning(s);assert.ok(payload.includes('schemaVersion'));
 clearLearning(mem);
 assert.equal(mem.getItem(STORAGE_KEY),null);
 assert.equal(mem.getItem(LEGACY_KEY),'[]');
});
test('G4 no participant input returns no claimed learning gain',()=>{
 const payload={fileType:'ai-academy-student-study-records',records:[]};
 const analysis=analyzeStudyPayload(payload);
 assert.equal(analysis.status,'NO_REAL_FIELD_DATA');
 assert.equal(analysis.participantCount,0);
 assert.ok(!JSON.stringify(analysis).includes('significant_gain'));
});
test('G4 only aggregates consented, internally consistent volunteer reports',()=>{
 const base={protocolVersion:'G4-student-inquiry-1.0',
  voluntaryConsent:true,confirmedRealSession:true,origin:'self-reported-real-student',
  questionSet:'chaos-form-a-v1',rubricVersion:'concept-rubric-1.0',
  completed:true,preCorrect:0,preTotal:2,transferCorrect:1,transferTotal:2,
  durationMinutes:19,neededHelp:false};
 const syntheticInput={fileType:'ai-academy-student-study-records',records:[
  {...base,participantCode:'S-ABCDEF12',condition:'academy'},
  {...base,participantCode:'S-ABCDEF13',condition:'chat-ai',transferCorrect:0}
 ]};
 const analysis=analyzeStudyPayload(syntheticInput);
 assert.equal(analysis.status,'SELF_REPORTED_UNVERIFIED');
 assert.equal(analysis.participantCount,2);
 assert.equal(analysis.groups.find(g=>g.condition==='academy').completed,1);
 assert.throws(()=>analyzeStudyPayload({...syntheticInput,records:[
  {...base,participantCode:'S-ABCDEF12',condition:'academy'},
  {...base,participantCode:'S-ABCDEF12',condition:'academy'}
 ]}),/重复/);
 assert.throws(()=>analyzeStudyPayload({...syntheticInput,records:[
  {...base,participantCode:'S-ABCDEF12',condition:'academy',voluntaryConsent:false}
 ]}),/自愿同意/);
});
test('study data rejected if fabricated numeric counts or invalid protocol',()=>{
 const row={participantCode:'S-AABBCCDD',condition:'academy',completed:true,
  protocolVersion:'G4-student-inquiry-1.0',voluntaryConsent:true,confirmedRealSession:true,
  origin:'self-reported-real-student',questionSet:'chaos-form-a-v1',rubricVersion:'concept-rubric-1.0',preCorrect:3,preTotal:2,transferCorrect:0,transferTotal:2,
  durationMinutes:15,neededHelp:false};
 assert.throws(()=>analyzeStudyPayload({fileType:'ai-academy-student-study-records',records:[row]}),/数值/);
});
