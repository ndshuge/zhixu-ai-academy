/**
 * AI学院 local-first learning evidence, schemaVersion=2.
 * User-readable, user-exportable; NOT a tamper-proof audit system.
 * A disconfirmed scientific hypothesis is NOT a graded mistake.
 */
export const STORAGE_KEY='ai-academy-learning-v02';
export const LEGACY_KEY='ai-academy-learning-v01';
const CURRENT_VERSION=2;
const uuid=()=>globalThis.crypto?.randomUUID?.()||('local-'+Date.now()+'-'+Math.random().toString(36).slice(2));
const now=()=>new Date().toISOString();
const plusDays=(iso,days)=>{
 const x=new Date(iso);x.setUTCDate(x.getUTCDate()+days);return x.toISOString();
};
const newStore=()=>({schemaVersion:2,learnerId:uuid(),createdAt:now(),events:[]});
const safeJson=v=>JSON.parse(JSON.stringify(v));
export function loadLearning(storage=localStorage){
 const current=storage.getItem(STORAGE_KEY);
 if(current!==null){
  try{
   const value=JSON.parse(current);
   if(!value||value.schemaVersion!==CURRENT_VERSION||!Array.isArray(value.events)||typeof value.learnerId!=='string')throw Error('无效结构');
   return value;
  }catch{throw Error('学习记录V2格式无法识别。旧数据未修改，请先备份并检查，不能自动覆盖。')}
 }
 const store=newStore();
 const old=storage.getItem(LEGACY_KEY);
 if(old!==null){
  let legacy;
  try{legacy=JSON.parse(old);if(!Array.isArray(legacy))throw Error('不是数组')}
  catch{throw Error('旧版学习记录无法解析，原数据未修改。请先备份；当前不会清空它。')}
  // Original raw JSON remains unmodified at ai-academy-learning-v01.
  for(const [i,row] of legacy.entries()){
   if(!row||typeof row!=='object')continue;
   const summary={
    legacyId:String(row.id||i),experiment:String(row.experiment||'unknown'),
    prediction:typeof row.prediction==='string'?row.prediction:'',step:String(row.step||'unknown'),
    createdAt:String(row.createdAt||''),
    engineVersion:String(row.result?.engineVersion||''),
    hasMentor:!!row.mentor,hasTransfer:!!row.transfer,
    note:'V0.3历史记录无可独立评分的标准化题目，请勿推断掌握程度或错因'
   };
   store.events.push({schemaVersion:2,eventId:uuid(),sessionId:'legacy-'+String(i),
    kind:'legacy_import',occurredAt:row.createdAt||now(),sourceRunId:row.id||null,
    conceptIds:[],payload:summary,visibility:'private'});
  }
 }
 storage.setItem(STORAGE_KEY,JSON.stringify(store));
 return store;
}
export function saveLearning(store,storage=localStorage){
 if(!store||store.schemaVersion!==2||!Array.isArray(store.events))throw Error('只能保存V2学习证据');
 storage.setItem(STORAGE_KEY,JSON.stringify(store));
 return store;
}
export function appendLearningEvent(store,kind,payload,{sessionId,conceptIds=[],sourceRunId=null,sourceQuestionId=null}={},storage=localStorage){
 if(!['question_attempt','hypothesis_test','learning_reflection','misconception_candidate','misconception_decision',
  'review_task','review_action','study_record','lab_prediction','lab_observation'].includes(kind))throw Error('未知学习事件类型');
 const event={schemaVersion:2,eventId:uuid(),sessionId:sessionId||uuid(),kind,occurredAt:now(),
  sourceRunId,sourceQuestionId,conceptIds:conceptIds.slice(0,6),payload:safeJson(payload),visibility:'private'};
 if(JSON.stringify(event).length>16000)throw Error('学习事件过大');
 store.events.push(event);
 try{saveLearning(store,storage)}
 catch(err){store.events.pop();throw err}
 return event;
}
export function recordQuestionAttempt(store,graded,{sessionId,sourceRunId=null}={},storage=localStorage){
 if(!graded||!['correct','incorrect'].includes(graded.gradedResult)||
    !Number.isInteger(graded.studentAnswer)||!graded.itemId||
    !['pre','transfer','post','review'].includes(graded.stage))throw Error('无法记录未获真实服务器评分的答案');
 const event=appendLearningEvent(store,'question_attempt',{
  itemId:graded.itemId,stage:graded.stage,studentAnswer:graded.studentAnswer,
  studentAnswerText:graded.studentAnswerText,gradedResult:graded.gradedResult,
  rubricVersion:graded.rubricVersion,questionVersion:graded.questionVersion,
  correctAnswerText:graded.correctAnswerText,feedback:graded.feedback,
  nextStep:graded.stage==='pre'?null:(graded.nextStep||null),
  submittedAt:now(),revealedAt:graded.stage==='pre'?null:now()},{
  sessionId,sourceRunId,sourceQuestionId:graded.itemId,conceptIds:graded.conceptIds
 },storage);
 if(graded.gradedResult==='incorrect'){
  const code=graded.misconception?.code;
  if(code){
   appendLearningEvent(store,'misconception_candidate',{
    hypothesisCode:code,proposedBy:'rule',status:'pending',
    evidenceEventId:event.eventId,studentAnswer:graded.studentAnswerText,
    reason:graded.misconception?.reason||'题目错误选项支持该候选诊断，请学生核验'
   },{sessionId:event.sessionId,sourceQuestionId:graded.itemId,conceptIds:graded.conceptIds},storage);
  }
  if(graded.stage!=='review'){
   const conceptId=graded.conceptIds?.[0];
   if(conceptId)appendLearningEvent(store,'review_task',{
    reviewId:uuid(),linkedAttemptIds:[event.eventId],conceptId,
    dueAt:plusDays(now(),1),status:'planned',nextItemId:graded.suggestedReviewItem||null,
    reason:'这道题的独立作答有误，建议通过新变式巩固，而不是重复背原题。'
   },{sessionId:event.sessionId,conceptIds:[conceptId],sourceQuestionId:graded.itemId},storage);
  }
 }
 if(graded.stage==='review')closeReviewsAfterAttempt(store,event,storage);
 return event;
}
function closeReviewsAfterAttempt(store,attempt,storage){
 const related=new Set(attempt.conceptIds);
 for(const task of getReviewTasks(store).filter(x=>related.has(x.conceptId)&&x.status!=='dismissed')){
  appendLearningEvent(store,'review_action',{
   reviewId:task.reviewId,action:'completed',attemptEventId:attempt.eventId,
   gradedResult:attempt.payload.gradedResult,
   nextDueAt:plusDays(now(),attempt.payload.gradedResult==='correct'?3:1),
   status:'planned',
   reason:attempt.payload.gradedResult==='correct'?'一次独立复测正确，三天后再巩固；不宣称已掌握。':'复测仍有误，明天继续换题练习。'
  },{sessionId:attempt.sessionId,conceptIds:[task.conceptId],sourceQuestionId:attempt.payload.itemId},storage);
 }
}
export function recordHypothesis(store,runId,{experiment,prediction,engineVersion,condition,metrics,results,lineage},{sessionId}={},storage=localStorage){
 if(!runId||typeof prediction!=='string'||!experiment)throw Error('缺少科学实验的事前记录');
 const ids=experiment==='evo-pair'?['evolution.inference']:['chaos.sensitivity'];
 return appendLearningEvent(store,'hypothesis_test',{
  experimentId:experiment,predictionText:prediction,engineVersion,params:safeJson(condition||{}),
  resultDigest:experiment==='evo-pair'
   ?safeJson((results||[]).slice(0,4).map(x=>({seed:x.seed,meanPopulation:x.meanPopulation})))
   :safeJson((metrics||[]).slice(0,6)),
  lineage:lineage?{parentRunId:lineage.parentRunId,toolId:lineage.toolId,changed:lineage.changed}:null,
  note:'科学假设与实际数据可以不一致；本事件不是题目错误，也不生成错题。'
 },{sessionId,conceptIds:ids,sourceRunId:runId},storage);
}
export function decideMisconception(store,candidateEventId,status,note='',storage=localStorage){
 const candidate=store.events.find(x=>x.eventId===candidateEventId&&x.kind==='misconception_candidate');
 if(!candidate||!['confirmed','rejected'].includes(status))throw Error('无效的误区候选或状态');
 return appendLearningEvent(store,'misconception_decision',{
  candidateEventId,status,studentNote:String(note).slice(0,280)
 },{sessionId:candidate.sessionId,conceptIds:candidate.conceptIds,
  sourceQuestionId:candidate.sourceQuestionId},storage);
}
export function getMisconceptions(store){
 const candidates=store.events.filter(x=>x.kind==='misconception_candidate');
 return candidates.map(c=>{
  const decision=store.events.filter(x=>x.kind==='misconception_decision'&&x.payload.candidateEventId===c.eventId).at(-1);
  return {...c,status:decision?.payload.status||'pending',decisionEventId:decision?.eventId||null};
 });
}
export function getReviewTasks(store){
 const created=store.events.filter(x=>x.kind==='review_task').map(e=>({...e.payload,sourceEventId:e.eventId}));
 const actions=store.events.filter(x=>x.kind==='review_action');
 return created.map(task=>{
  const related=actions.filter(x=>x.payload.reviewId===task.reviewId);
  const latest=related.at(-1)?.payload;
  return {...task,status:latest?.status||task.status,dueAt:latest?.nextDueAt||task.dueAt,
   lastOutcome:latest?.gradedResult||null,lastReason:latest?.reason||task.reason,actions:related.length};
 });
}
export function reviewAction(store,reviewId,action,storage=localStorage){
 const task=getReviewTasks(store).find(x=>x.reviewId===reviewId);
 if(!task||!['defer','dismiss'].includes(action))throw Error('复习任务不存在或不允许操作');
 return appendLearningEvent(store,'review_action',{
  reviewId,action,status:action==='dismiss'?'dismissed':'planned',
  nextDueAt:action==='defer'?plusDays(now(),1):task.dueAt,
  reason:action==='defer'?'学生主动推迟一天':'学生主动取消复习任务'
 },{conceptIds:[task.conceptId]},storage);
}
export function summarizeLearning(store){
 const e=store.events,attempts=e.filter(x=>x.kind==='question_attempt');
 const experiments=e.filter(x=>x.kind==='hypothesis_test');
 const tasks=getReviewTasks(store).filter(x=>x.status!=='dismissed');
 const concepts=['chaos.same-rule','chaos.sensitivity','inquiry.control-variable',
  'evolution.independence','evolution.inference'].map(id=>{
   const related=attempts.filter(x=>x.conceptIds.includes(id));
   const wrong=related.filter(x=>x.payload.gradedResult==='incorrect');
   const distinctCorrect=new Set(related.filter(x=>x.payload.gradedResult==='correct').map(x=>x.payload.itemId));
   const reviewCorrect=related.some(x=>x.payload.stage==='review'&&x.payload.gradedResult==='correct');
   const remaining=tasks.some(x=>x.conceptId===id);
   let status='未评估';
   if(related.length){
    status=reviewCorrect&&remaining?'一次变式复测正确·仍待巩固':remaining?'有待复习证据':reviewCorrect?'已经过一次变式复测':
     distinctCorrect.size>=2?'多个独立题目表现正确':'已有一次作答证据';
   }
   return {id,status,attempts:related.length,incorrect:wrong.length,distinctCorrect:distinctCorrect.size,
    evidenceIds:related.map(x=>x.eventId),reviewDue:tasks.find(x=>x.conceptId===id)?.dueAt||null};
  });
 const recommended=tasks.sort((a,b)=>a.dueAt.localeCompare(b.dueAt))[0]||null;
 return {schemaVersion:2,learnerId:store.learnerId,
  explorations:new Set(experiments.map(x=>x.sessionId+'#'+x.sourceRunId)).size,
  answered:attempts.length,incorrect:attempts.filter(x=>x.payload.gradedResult==='incorrect').length,
  transfers:attempts.filter(x=>x.payload.stage==='transfer').length,
  reviewed:attempts.filter(x=>x.payload.stage==='review').length,
  pendingConcepts:new Set(tasks.map(x=>x.conceptId)).size,
  concepts,recommended,recentAttempts:attempts.slice(-10).reverse(),
  misconceptions:getMisconceptions(store)};
}
export function clearLearning(storage=localStorage){
 storage.removeItem(STORAGE_KEY); // Do not silently erase the legacy backup.
}
export function exportLearning(store){return JSON.stringify({...store,exportedAt:now(),
  notice:'个人浏览器学习记录，可由学生编辑；不是防篡改的学校审计数据'},null,2)}
