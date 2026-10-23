/**
 * G4 local-only evaluation summary. No mock "learning gains".
 * CLI: node scripts/evaluate-study.mjs [consented-export-1.json ... consented-export-n.json]
 * Uses volunteer self-reports and shows limitations; makes NO causal claim.
 */
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const CONDITIONS=['academy','chat-ai','raw-simulator'];
export function analyzeStudyPayload(payload){
 if(!payload||payload.fileType!=='ai-academy-student-study-records'||!Array.isArray(payload.records))
  throw new Error('非AI学院试测导出文件，拒绝分析');
 const codes=new Set(),groups=Object.fromEntries(CONDITIONS.map(c=>[c,[]]));
 for(const [i,r] of payload.records.entries()){
  if(!r||!CONDITIONS.includes(r.condition)||r.protocolVersion!=='G4-student-inquiry-1.0'||
   r.questionSet!=='chaos-form-a-v1'||r.rubricVersion!=='concept-rubric-1.0'||
   r.voluntaryConsent!==true||r.confirmedRealSession!==true||r.origin!=='self-reported-real-student')
   throw new Error('第'+(i+1)+'条记录缺失自愿同意或正式试测信息');
  if(typeof r.participantCode!=='string'||!/^[A-Z]-[0-9A-F]{8}$/.test(r.participantCode)||
   codes.has(r.participantCode))throw new Error('匿名编号格式错误或重复');
  codes.add(r.participantCode);
  const ints=['preCorrect','preTotal','transferCorrect','transferTotal','durationMinutes'];
  if(ints.some(k=>!Number.isInteger(r[k]))||
   r.preCorrect<0||r.preCorrect>r.preTotal||r.preTotal>2||
   r.transferCorrect<0||r.transferCorrect>r.transferTotal||r.transferTotal>2||
   r.durationMinutes<1||r.durationMinutes>240||
   typeof r.completed!=='boolean'||typeof r.neededHelp!=='boolean'||
   (r.completed&&(r.preTotal===0||r.transferTotal===0)))
   throw new Error('第'+(i+1)+'条记录数值或完成状态不一致');
  // A local event-link is still editable browser data, not proof of a human session.
  if(r.localEvidence!==undefined&&r.localEvidence!==null){
   const l=r.localEvidence;
   if(r.condition!=='academy'||!l||typeof l.sessionId!=='string'||
     !Array.isArray(l.evidenceEventIds)||l.evidenceEventIds.length!==5||
     new Set(l.evidenceEventIds).size!==5||
     l.evidenceEventIds.some(x=>typeof x!=='string'||x.length<4)||
     typeof l.labRunId!=='string'||l.labRunId.length<4||
     l.kind!=='local-event-cross-checked-not-person-verified')
    throw new Error('第'+(i+1)+'条本机证据关联格式不完整或被篡改');
  }
  groups[r.condition].push(r);
 }
 const summary=CONDITIONS.map(condition=>{
  const a=groups[condition],n=a.length;
  const completed=a.filter(x=>x.completed);
  const total=(key,rows=a)=>rows.reduce((s,x)=>s+x[key],0);
  const preAnswers=total('preTotal'),postAnswers=total('transferTotal');
  return {condition,n,completed:completed.length,neededHelp:a.filter(x=>x.neededHelp).length,
   locallyEventLinked:a.filter(x=>x.localEvidence?.kind==='local-event-cross-checked-not-person-verified').length,
   preCorrect:total('preCorrect'),preAttempted:preAnswers,
   transferCorrect:total('transferCorrect'),transferAttempted:postAnswers,
   observedDurationMinutesTotal:total('durationMinutes'),
   note:'The pre/transfer questions differ; raw counts are not an independently established gain or causal effect.'};
 });
 return {
  status:codes.size?'SELF_REPORTED_UNVERIFIED':'NO_REAL_FIELD_DATA',
  participantCount:codes.size,groups:summary,
  limitations:[
   'Raw counts describe self-reported volunteers only; no independent audit of responses or consent.',
   'Do not infer causal improvement, significance, mastery percentages or broad generalizability.',
   'Requires genuine group comparability, anonymization review and independent scoring to discuss educational effects.',
   'Local event-linked results originate from user-editable browser data; cross-check does not prove participant identity.',
   'Software test fixtures and browser automation are not student evidence.'
  ]
 };
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
 const filenames=process.argv.slice(2);
 if(!filenames.length){
  console.log(JSON.stringify({status:'NO_REAL_FIELD_DATA',participantCount:0,
   message:'尚未提供获得参与者同意的试测导出文件。软件测试不能替代真人效果证据。'},null,2));
 }else{
  const merged={fileType:'ai-academy-student-study-records',records:[]};
  for(const filename of filenames){
   const raw=JSON.parse(await readFile(filename,'utf8'));
   // Validate file structure before merging; never quietly swallow malformed consent.
   analyzeStudyPayload(raw);
   merged.records.push(...raw.records);
  }
  console.log(JSON.stringify({...analyzeStudyPayload(merged),sourceFileCount:filenames.length},null,2));
 }
}
