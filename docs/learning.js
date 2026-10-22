import {loadLearning,STORAGE_KEY,LEGACY_KEY,recordQuestionAttempt,getMisconceptions,
 getReviewTasks,reviewAction,decideMisconception,summarizeLearning,exportLearning} from './learning-store.js';
const $=id=>document.getElementById(id);
const names={
 'chaos.same-rule':'同一方程与不同轨道','chaos.sensitivity':'初值敏感性',
 'inquiry.control-variable':'控制变量与可重复实验',
 'evolution.independence':'独立随机种子与重复','evolution.inference':'模拟结论的推断边界'
};
const tags={
 'same-rule-confusion':'把轨道分离误判为规则变化',
 'parameter-vs-initial':'模型参数和初值概念混淆',
 'control-variable':'对照实验未控制单一变量',
 'simulation-overclaim':'把有限模拟推广为普遍因果',
 'pseudoreplication':'将时间步/个体当成独立世界',
 'needs-review':'存在需要进一步核验的概念差异'
};
let store,publicItems={},currentTaskId=null;
try{store=loadLearning()}catch(e){
 $('evidence-overview').textContent='学习记录出现结构冲突，原数据没有被删除：'+e.message;
 // Keep records untouched; no writes until manually recovered.
}
const elem=(tag,cls,text)=>{
 const x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=String(text);return x;
};
const time=iso=>{try{return new Date(iso).toLocaleString('zh-CN')}catch{return '未知时间'}};
const human=id=>names[id]||id;
function empty(node,msg){
 node.replaceChildren(elem('div','learning-empty',msg));
}
function makeButton(label,fn,cls=''){
 const b=elem('button',cls,label);b.type='button';b.addEventListener('click',fn);return b;
}
function message(msg){$('learning-data-message').textContent=msg}
function render(){
 if(!store)return;
 const data=summarizeLearning(store);
 $('stat-experiments').textContent=String(data.explorations);
 $('stat-answered').textContent=String(data.answered);
 $('stat-incorrect').textContent=String(data.incorrect);
 $('stat-pending').textContent=String(data.pendingConcepts);
 $('evidence-overview').textContent=data.answered===0&&data.explorations===0?
  '目前没有可证明掌握程度的独立题目或实验记录。先从科学实验工作台的无预选前测开始。':
  '这是可追溯的个人学习证据，而不是算法猜测的掌握百分比。你的每次真实作答与实验都有独立来源；'
  +(data.recommended?'下一步建议复习「'+human(data.recommended.conceptId)+'」，因为曾有错误的独立作答。':
   '目前没有未取消的复习任务，可继续挑战不同场景的概念题。');
 const concepts=$('concept-list');concepts.replaceChildren();
 for(const row of data.concepts){
  const item=elem('div','concept-record');
  const header=elem('div','concept-top');
  const name=elem('strong','',human(row.id));
  const status=elem('span','concept-state'+(row.reviewDue?' needs':''),row.status);
  header.append(name,status);
  const details=elem('div','concept-evidence','题目证据 '+row.attempts+' 次 · 错误 '+row.incorrect+' 次'+
    (row.reviewDue?' · 待复习：'+time(row.reviewDue):''));
  item.append(header,details);concepts.append(item);
 }
 renderMistakes();renderMisconceptions();renderReviews();renderTimeline();
}
function renderMistakes(){
 const root=$('mistake-list');root.replaceChildren();
 const mistakes=store.events.filter(x=>x.kind==='question_attempt'&&x.payload.gradedResult==='incorrect').reverse();
 if(!mistakes.length){empty(root,'还没有被客观评分确认的错题。科学实验预测即使不成立，也不会出现在这里。');return}
 for(const e of mistakes){
  const q=publicItems[e.payload.itemId]||{},p=e.payload;
  const card=elem('article','mistake-record');
  // Don't reveal the pre-test explanation in the dashboard before this same session has attempted transfer.
  const canExplain=p.stage!=='pre'||store.events.some(x=>
   x.kind==='question_attempt'&&x.sessionId===e.sessionId&&x.payload.stage==='transfer');
  card.append(elem('strong','',q.prompt||e.payload.itemId),
   elem('p','','我的原答案：'+(p.studentAnswerText||String(p.studentAnswer))),
   elem('p','',canExplain?'确定性评分依据：'+p.feedback:'前测原答已锁定；请先完成实验与独立迁移题，再查看评分解释。'),
   elem('p','evidence-meta','知识点：'+e.conceptIds.map(human).join('、')+' · 题号：'+p.itemId+
    ' · 版本：'+p.rubricVersion+' · 时间：'+time(e.occurredAt)+
    ' · 证据 '+e.eventId.slice(0,8)));
  if(canExplain&&p.nextStep)card.append(elem('p','teacher-next-step','针对这次错误选项的下一步：'+p.nextStep));
  const task=getReviewTasks(store).find(t=>t.linkedAttemptIds?.includes(e.eventId)&&t.status!=='dismissed');
  const actions=elem('div','record-actions');
  if(task)actions.append(makeButton('针对这题练新变式 →',()=>practice(task)));
  else actions.append(elem('span','learning-hint','复习任务已取消或题目尚未分配变式'));
  card.append(actions);root.append(card);
 }
}
function renderMisconceptions(){
 const root=$('misconception-list');root.replaceChildren();
 const candidates=getMisconceptions(store).slice().reverse();
 if(!candidates.length){empty(root,'尚无待核验的概念误区。系统不能在没有学习证据时替你贴标签。');return}
 for(const c of candidates){
  const card=elem('article','mistake-record');
  card.append(elem('strong','',tags[c.payload.hypothesisCode]||c.payload.hypothesisCode));
  card.append(elem('p','','状态：'+(c.status==='pending'?'待学生核验':c.status==='confirmed'?'学生认可的候选':'学生已否认此项诊断')));
  card.append(elem('p','','来自客观题：'+(c.sourceQuestionId||'')+'；原回答：'+c.payload.studentAnswer));
  card.append(elem('p','evidence-meta','来源事件：'+c.payload.evidenceEventId+
   ' · 记录时间：'+time(c.occurredAt)));
  const actions=elem('div','record-actions');
  if(c.status!=='confirmed')actions.append(makeButton('这条候选解释符合我的理解',()=>{
   try{decideMisconception(store,c.eventId,'confirmed');render()}catch(e){message(e.message)}
  }));
  if(c.status!=='rejected')actions.append(makeButton('诊断不准确，否认标签',()=>{
   try{decideMisconception(store,c.eventId,'rejected','用户指出该推测不能代表本人整体理解');render()}catch(e){message(e.message)}
  },'danger'));
  card.append(actions);root.append(card);
 }
}
function renderReviews(){
 const root=$('review-list');root.replaceChildren();
 const tasks=getReviewTasks(store).filter(x=>x.status!=='dismissed').sort((a,b)=>a.dueAt.localeCompare(b.dueAt));
 if(!tasks.length){empty(root,'暂时没有待复习任务。完成一个有明确评分规则的错误题目后，才会生成可解释的复习建议。');return}
 for(const task of tasks){
  const card=elem('article','review-record');
  card.append(elem('strong','',human(task.conceptId)));
  card.append(elem('p','','建议复习：'+time(task.dueAt)+' · '+(task.lastReason||task.reason)));
  if(task.lastOutcome==='correct')card.append(elem('p','','上次复测已答对一次，但仍需要延迟巩固。'));
  const action=elem('div','record-actions');
  action.append(makeButton('用新变式检验 →',()=>practice(task)),
   makeButton('推迟一天',()=>{
    try{reviewAction(store,task.reviewId,'defer');render()}catch(e){message(e.message)}
   }),
   makeButton('取消该任务',()=>{
    if(!confirm('只取消这项复习计划，不会删除已有答题历史。确定吗？'))return;
    try{reviewAction(store,task.reviewId,'dismiss');render()}catch(e){message(e.message)}
   },'danger'));
  card.append(action);root.append(card);
 }
}
async function practice(task){
 currentTaskId=task.reviewId;
 const space=$('review-workspace');space.classList.remove('hidden');
 const mount=$('review-quiz');empty(mount,'正在获取独立变式题目…');
 $('review-title').textContent='针对性复习：'+human(task.conceptId);
 space.scrollIntoView({behavior:'smooth',block:'center'});
 const itemId=task.nextItemId||'chaos.same-rule.review.01';
 try{
  const r=await fetch('/api/learning/item?itemId='+encodeURIComponent(itemId),{cache:'no-store'});
  const q=await r.json();if(!r.ok)throw Error(q.error||'题目不可用');
  if(currentTaskId!==task.reviewId)return;
  mount.replaceChildren(elem('p','check-question',q.prompt));
  const options=elem('div','quiz');let choice=null;
  const submit=makeButton('提交复习判断',async()=>{
   if(choice===null)return;
   submit.disabled=true;
   try{
    const response=await fetch('/api/learning/grade',{method:'POST',headers:{'Content-Type':'application/json'},
     body:JSON.stringify({itemId:q.itemId,attemptToken:q.attemptToken,answer:choice})});
    const result=await response.json();if(!response.ok)throw Error(result.error||'判分失败');
    recordQuestionAttempt(store,result,{sessionId:'review-'+task.reviewId});
    mount.append(elem('div','feedback'+(result.correct?'':' wrong'),
     (result.correct?'这次独立复测答对了。':'这次独立复测仍有错误。')+
     result.feedback+' · 证据已保存，不据此单次断言掌握。'));
    for(const input of options.querySelectorAll('input'))input.disabled=true;
    submit.textContent='已记录结果';render();
   }catch(e){mount.append(elem('p','warning','复习未完成：'+e.message))}
  });
  submit.disabled=true;
  q.options.forEach((text,i)=>{
   const label=elem('label','choice');
   const input=elem('input');input.type='radio';input.name='independent-review';input.value=String(i);
   input.addEventListener('change',()=>{choice=i;submit.disabled=false});
   label.append(input,document.createTextNode(text));options.append(label);
  });
  mount.append(options,submit,elem('p','learning-hint','本题未预选答案，回答后才会看到正确解释。'));
 }catch(e){empty(mount,'题目载入失败：'+e.message)}
}
function renderTimeline(){
 const root=$('timeline');root.replaceChildren();
 const events=store.events.slice(-12).reverse();
 if(!events.length){empty(root,'尚无学习事件；旧版记录会作为无评分的历史证据导入。');return}
 const description={
  'question_attempt':'独立概念作答','hypothesis_test':'科学预测与模型内实验',
  'learning_reflection':'导师引导与学生反思','misconception_candidate':'误区候选提出',
  'misconception_decision':'学生核验误区','review_task':'新建复习任务',
  'review_action':'调整复习计划','legacy_import':'保留V0.3历史记录',
  'study_record':'参与者自行填写的研究记录',
  'lab_prediction':'V0.4拓展探索事前预测','lab_observation':'V0.4真实观测与反思（不计成绩）'
 };
 for(const e of events){
  const detail=e.kind==='question_attempt'?(' · '+e.payload.itemId+' · '+e.payload.gradedResult):
   e.kind==='hypothesis_test'?(' · '+e.payload.experimentId):'';
  root.append(elem('div','timeline-entry',time(e.occurredAt)+' · '+
   (description[e.kind]||e.kind)+detail));
  if(e.kind==='lab_observation'||e.kind==='lab_prediction'){
   const expanded=elem('details','lab-evidence');expanded.append(elem('summary','', '展开探索证据 · '+e.eventId));
   expanded.append(elem('pre','',JSON.stringify(e.payload,null,2)));root.append(expanded);
  }
 }
}
function download(content,filename){
 const url=URL.createObjectURL(new Blob([content],{type:'application/json'})),link=elem('a');
 link.href=url;link.download=filename;link.click();setTimeout(()=>URL.revokeObjectURL(url),250);
}
$('export-evidence').addEventListener('click',()=>{
 if(!store)return;
 download(exportLearning(store),'AI学院-个人学习证据-v2.json');
 message('学习证据已在浏览器生成导出文件。包括个人答题及科学预测，不包含 API Key。');
});
$('clear-evidence').addEventListener('click',()=>{
 if(!store)return;
 if(!confirm('将清除这个浏览器的V2学习证据与V0.3旧版学习记录。请先导出备份。确定执行吗？'))return;
 localStorage.removeItem(STORAGE_KEY);localStorage.removeItem(LEGACY_KEY);
 try{store=loadLearning();currentTaskId=null;$('review-workspace').classList.add('hidden');render();message('本机学习数据已清空。')}
 catch(e){message(e.message)}
});
async function initialize(){
 if(!store)return;
 try{
  const response=await fetch('/api/learning/questions',{cache:'no-store'});
  const body=await response.json();
  if(response.ok)publicItems=Object.fromEntries(body.questions.map(x=>[x.itemId,x]));
 }catch{}
 render();
 const wanted=new URLSearchParams(location.search).get('review');
 if(wanted){const task=getReviewTasks(store).find(x=>x.reviewId===wanted);if(task)practice(task)}
}
initialize();
