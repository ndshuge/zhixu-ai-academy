/**
 * RC3 G4 local evidence cross-check for the flagship two-question protocol.
 *
 * Computes counts from the learner's own V2 events, NOT from researcher-entered
 * numbers or model evaluations. The browser's localStorage is editable and this
 * never proves that a real person participated or consented.
 */
export const STUDY_FORM_A=Object.freeze({
 pre:['chaos.same-rule.pre.01','chaos.control.pre.01'],
 transfer:['chaos.same-rule.transfer.01','chaos.control.transfer.01'],
 rubric:'concept-rubric-1.0'
});
const isRecord=e=>e&&typeof e==='object'&&typeof e.eventId==='string'
 &&typeof e.sessionId==='string'&&e.payload&&typeof e.payload==='object';
const keyed=(rows,id,stage)=>rows.filter(e=>e.sourceQuestionId===id
 &&e.payload.itemId===id&&e.payload.stage===stage
 &&e.payload.rubricVersion===STUDY_FORM_A.rubric
 &&['correct','incorrect'].includes(e.payload.gradedResult));
export function candidateStudySessions(store){
 if(!store||store.schemaVersion!==2||!Array.isArray(store.events))return [];
 const rows=store.events.filter(isRecord);
 const sessions=new Set(rows.filter(x=>x.kind==='question_attempt'&&x.payload.stage==='pre').map(x=>x.sessionId));
 const found=[];
 for(const sessionId of sessions){
  const events=rows.filter(e=>e.sessionId===sessionId);
  const attempts=events.filter(e=>e.kind==='question_attempt');
  const pre=STUDY_FORM_A.pre.map(id=>keyed(attempts,id,'pre'));
  const transfer=STUDY_FORM_A.transfer.map(id=>keyed(attempts,id,'transfer'));
  const evidence=events.filter(x=>x.kind==='hypothesis_test'&&x.payload.experimentId==='sensitivity'
   &&typeof x.sourceRunId==='string'&&x.sourceRunId.length>0);
  const all=[...pre,...transfer];
  // No duplicate question IDs: do not interpret retries as independent answers.
  const unique=all.every(matches=>matches.length===1);
  const validEvents=all.flat().every(x=>Number.isFinite(Date.parse(x.occurredAt))
   &&Number.isInteger(x.payload.studentAnswer));
  const preTimes=pre.flat().map(e=>Date.parse(e.occurredAt));
  const transferTimes=transfer.flat().map(e=>Date.parse(e.occurredAt));
  const labTimes=evidence.map(e=>Date.parse(e.occurredAt));
  const ordered=unique&&evidence.length>0&&validEvents&&
    Math.max(...preTimes)<=Math.min(...labTimes)&&
    Math.max(...labTimes)<=Math.min(...transferTimes);
  if(!unique||pre.some(x=>x.length!==1)||transfer.some(x=>x.length!==1)||!ordered)continue;
  const chosen=all.flat(),ids=new Set(chosen.map(x=>x.eventId));
  if(ids.size!==4)continue;
  const lab=evidence.at(-1),refs=[...chosen.map(x=>x.eventId),lab.eventId];
  found.push({sessionId,form:'chaos-form-a-v1',
   rubricVersion:STUDY_FORM_A.rubric,preCorrect:pre.filter(x=>x[0].payload.gradedResult==='correct').length,
   preTotal:2,transferCorrect:transfer.filter(x=>x[0].payload.gradedResult==='correct').length,
   transferTotal:2,evidenceEventIds:refs,labRunId:lab.sourceRunId,
   latestAt:Math.max(...transferTimes),integrity:'user-editable-local-events-not-independent-verification'});
 }
 return found.sort((a,b)=>b.latestAt-a.latestAt);
}
export function crossCheckStudyEvidence(store,packet){
 if(!packet||typeof packet.sessionId!=='string')return false;
 const source=candidateStudySessions(store).find(x=>x.sessionId===packet.sessionId);
 if(!source)return false;
 return source.preCorrect===packet.preCorrect&&source.preTotal===packet.preTotal
  &&source.transferCorrect===packet.transferCorrect&&source.transferTotal===packet.transferTotal
  &&Array.isArray(packet.evidenceEventIds)
  &&packet.evidenceEventIds.length===source.evidenceEventIds.length
  &&packet.evidenceEventIds.every((id,i)=>id===source.evidenceEventIds[i]);
}
