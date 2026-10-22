import {loadLearning,appendLearningEvent} from './learning-store.js';
import {candidateStudySessions,crossCheckStudyEvidence} from './study-evidence.js';
const $=id=>document.getElementById(id),note=(message)=>$('study-form-result').textContent=message;
let store=null,code=null,linkedPacket=null;
try{store=loadLearning()}catch(e){note('学习记录保护已启用，不能覆盖原数据：'+e.message)}
const records=()=>store?.events.filter(e=>e.kind==='study_record')||[];
const studyCode=()=>('S-'+crypto.randomUUID().slice(0,8).toUpperCase());
$('make-code').addEventListener('click',()=>{
 code=studyCode();$('study-code').textContent=code;
 note('编号已生成，但尚未收集任何作答。请仅记录实际发生的自愿试测。');
});
function resetStudyLink(){
 linkedPacket=null;
 $('study-link-status').textContent='未关联本机证据；提交时成绩仍须人工核验。';
 for(const id of ['study-pre-correct','study-pre-total','study-transfer-correct','study-transfer-total'])
  $(id).readOnly=false;
}
$('study-condition').addEventListener('change',resetStudyLink);
$('study-link-evidence').addEventListener('click',()=>{
 if(!store)return $('study-link-status').textContent='本机学习数据不可用；没有自动填充。';
 if($('study-condition').value!=='academy')
  return $('study-link-status').textContent='只有AI学院课程支持本机评分联查；其他条件请人工核验。';
 const packet=candidateStudySessions(store)[0];
 if(!packet)
  return $('study-link-status').textContent='没有找到同一学习会话内2道前测→实际PFL实验→2道独立迁移的完整证据。请先完成真实课程；不会自动制造试测样本。';
 linkedPacket=packet;
 for(const id of ['preCorrect','preTotal','transferCorrect','transferTotal']){
  const name='study-'+id.replace(/[A-Z]/g,c=>'-'+c.toLowerCase());
  $(name).value=String(packet[id]);$(name).readOnly=true;
 }
 $('study-question-set').value='chaos-form-a-v1';
 $('study-link-status').textContent='已根据同一会话中四道不同题的确定性评分填充结果，含实际PFL运行事件；仍需真人知情同意与研究者审核。';
});
function render(){
 const root=$('study-records');root.replaceChildren();
 const list=records();
 if(!list.length){
  const empty=document.createElement('div');empty.className='learning-empty';
  empty.textContent='本机尚无真实参与者的试测记录。自动测试不会在这里添加虚假样本。';
  root.append(empty);return;
 }
 const headline=document.createElement('div');headline.className='learning-callout';
 headline.textContent='本机现有 '+list.length+' 份经填写者声明的自愿试测记录。'+
  '这些都是自报信息，未经独立人工核验；不得直接当成因果效果证明。';
 root.append(headline);
 for(const e of list.slice(-12).reverse()){
  const item=document.createElement('article');item.className='review-record';
  const header=document.createElement('strong');header.textContent=e.payload.participantCode+' · '+
   ({academy:'AI学院','chat-ai':'普通聊天AI','raw-simulator':'仅科学模拟器'}[e.payload.condition]||'未知条件');
  const details=document.createElement('p');
  details.textContent='题组A · 任务完成：'+(e.payload.completed?'是':'否')+
   ' · 前测 '+e.payload.preCorrect+'/'+e.payload.preTotal+
   ' · 新题 '+e.payload.transferCorrect+'/'+e.payload.transferTotal+
   ' · '+e.payload.durationMinutes+' 分钟';
  const description=document.createElement('p');description.className='evidence-meta';
  description.textContent=(e.payload.localEvidence?'本机答题事件交叉核对/仍待真人核验':'人工输入/待外部核验')+' · '+new Date(e.occurredAt).toLocaleString('zh-CN')+
   ' · 证据 '+e.eventId.slice(0,8);
  item.append(header,details,description);root.append(item);
 }
}
$('study-form').addEventListener('submit',ev=>{
 ev.preventDefault();
 if(!store)return note('浏览器学习数据不可用；未保存');
 if(!code)return note('请先点击“生成新的匿名试测编号”，不得用姓名代替');
 if(!$('study-consent').checked||!$('study-real').checked)return note('没有得到自愿同意或并非真人试测，不得保存为真实教育数据。');
 if(!$('study-form').reportValidity())return;
 const n=id=>Number($(id).value);
 const preCorrect=n('study-pre-correct'),preTotal=n('study-pre-total'),
 transferCorrect=n('study-transfer-correct'),transferTotal=n('study-transfer-total'),
 durationMinutes=n('study-minutes'),completed=$('study-completed').value==='yes',
 condition=$('study-condition').value,questionSet=$('study-question-set').value;
 if(questionSet!=='chaos-form-a-v1'||
  !['academy','chat-ai','raw-simulator'].includes(condition)||
  !['yes','no'].includes($('study-completed').value)||
  !Number.isInteger(preCorrect)||!Number.isInteger(preTotal)||
  !Number.isInteger(transferCorrect)||!Number.isInteger(transferTotal)||
  preCorrect<0||preCorrect>preTotal||preTotal<0||preTotal>2||
  transferCorrect<0||transferCorrect>transferTotal||transferTotal<0||transferTotal>2||
  !Number.isInteger(durationMinutes)||durationMinutes<1||durationMinutes>240||
  (completed&&(preTotal===0||transferTotal===0))){
  return note('成绩或任务条件不一致：答对数不得超过实际作答数；完成者必须有前测与不同迁移题。');
 }
 if(records().some(x=>x.payload.participantCode===code))return note('此匿名编号已保存过；避免重复计入同一人。');
 if(linkedPacket&&(!crossCheckStudyEvidence(store,linkedPacket)||condition!=='academy'||
  preCorrect!==linkedPacket.preCorrect||preTotal!==linkedPacket.preTotal||
  transferCorrect!==linkedPacket.transferCorrect||transferTotal!==linkedPacket.transferTotal))
  return note('本机事件已改变或录入值不一致：请重新执行学习证据核对，不能以旧成绩提交。');
 const record={
  protocolVersion:'G4-student-inquiry-1.0',participantCode:code,condition,completed,
  questionSet,rubricVersion:'concept-rubric-1.0',
  preCorrect,preTotal,transferCorrect,transferTotal,durationMinutes,
  neededHelp:$('study-help').value==='yes',notes:$('study-notes').value.slice(0,400),
  localEvidence:linkedPacket?{sessionId:linkedPacket.sessionId,evidenceEventIds:linkedPacket.evidenceEventIds,
   labRunId:linkedPacket.labRunId,kind:'local-event-cross-checked-not-person-verified'}:null,
  voluntaryConsent:true,confirmedRealSession:true,origin:'self-reported-real-student',
  evidenceType:linkedPacket?'local-event-linked-self-report':'unverified-local-participant-report',analysisPolicy:
   'Small volunteer sample; no statistical significance, no causal claim'
 };
 try{
  appendLearningEvent(store,'study_record',record,{sessionId:'study-'+code});
  note('已将一位自愿参与者的自报研究记录保存在本机。它尚未经第三人验证，不代表已完成教育效果证明。');
  $('study-form').reset();resetStudyLink();code=null;$('study-code').textContent='请为下位参与者生成新编号';render();
 }catch(e){note('未保存：'+e.message)}
});
$('study-export').addEventListener('click',()=>{
 if(!store)return;
 const payload={
  fileType:'ai-academy-student-study-records',
  schemaVersion:1,generatedAt:new Date().toISOString(),
  warning:'These are local, self-reported volunteer records; not independently verified and not causal evidence.',
  protocolVersion:'G4-student-inquiry-1.0',
  records:records().map(e=>({eventId:e.eventId,occurredAt:e.occurredAt,...e.payload}))
 };
 const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));
 const a=document.createElement('a');a.href=url;a.download='AI学院-G4-真实试测原始记录.json';a.click();
 setTimeout(()=>URL.revokeObjectURL(url),250);
 note('已导出原始自报记录；请先征得参与者同意，再交给研究者使用。');
});
render();
