import test from 'node:test';
import assert from 'node:assert/strict';
import {candidateStudySessions,crossCheckStudyEvidence,STUDY_FORM_A} from '../public/study-evidence.js';
function fixture(){
 const sessionId='classroom-1',start=Date.parse('2026-10-12T12:00:00.000Z');
 const names=[...STUDY_FORM_A.pre,...STUDY_FORM_A.transfer];
 const events=[];
 for(let i=0;i<names.length;i++){
  const stage=i<2?'pre':'transfer';
  const e={eventId:'question-'+i,sessionId,kind:'question_attempt',
   sourceQuestionId:names[i],sourceRunId:i<2?null:'science-run-1',
   occurredAt:new Date(start+(i<2?i:(i+2))*60000).toISOString(),
   payload:{itemId:names[i],stage,rubricVersion:STUDY_FORM_A.rubric,
    gradedResult:i===0?'incorrect':'correct',studentAnswer:i%3}};
  events.push(e);
 }
 events.push({eventId:'lab-1',sessionId,kind:'hypothesis_test',
  sourceRunId:'science-run-1',occurredAt:new Date(start+2*60000).toISOString(),
  payload:{experimentId:'sensitivity'}});
 return {schemaVersion:2,events};
}
test('real local events build an internally consistent 2+2 evidence packet without participant claims',()=>{
 const s=fixture(),p=candidateStudySessions(s);
 assert.equal(p.length,1);
 assert.deepEqual([p[0].preCorrect,p[0].preTotal,p[0].transferCorrect,p[0].transferTotal],[1,2,2,2]);
 assert.equal(p[0].evidenceEventIds.length,5);
 assert.equal(crossCheckStudyEvidence(s,p[0]),true);
 assert.match(p[0].integrity,/user-editable/);
});
test('no scientific lab event cannot claim a complete flagship learning sequence',()=>{
 const s=fixture();s.events.pop();
 assert.deepEqual(candidateStudySessions(s),[]);
});
test('unsubmitted second independent pre or transfer cannot create a full evidence packet',()=>{
 for(const id of ['question-1','question-3']){
  const s=fixture();s.events=s.events.filter(e=>e.eventId!==id);
  assert.deepEqual(candidateStudySessions(s),[]);
 }
});
test('duplicate or out-of-order attempts are not silently collapsed',()=>{
 const s=fixture();s.events.push({...s.events[0],eventId:'duplicate'});
 assert.deepEqual(candidateStudySessions(s),[]);
 const t=fixture();t.events.find(e=>e.eventId==='question-2').occurredAt='2026-10-12T11:59:00.000Z';
 assert.deepEqual(candidateStudySessions(t),[]);
});
test('tampered or outdated study result cannot pass local crosscheck',()=>{
 const s=fixture(),p=candidateStudySessions(s)[0];
 assert.equal(crossCheckStudyEvidence(s,{...p,transferCorrect:0}),false);
 assert.equal(crossCheckStudyEvidence(s,{...p,evidenceEventIds:['fake']}),false);
 s.events.find(e=>e.eventId==='question-1').payload.gradedResult='incorrect';
 assert.equal(crossCheckStudyEvidence(s,p),false);
});
