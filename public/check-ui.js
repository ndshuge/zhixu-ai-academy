import {loadLearning,recordQuestionAttempt,recordHypothesis,appendLearningEvent,exportLearning} from './learning-store.js';
const byId=id=>document.getElementById(id);
const itemsFor=(stage,experiment)=>{
 if(experiment==='evo-pair')return [stage==='pre'?'evo.independence.pre.01':'evo.inference.transfer.01'];
 if(experiment==='logistic')return [stage==='pre'?'chaos.control.pre.01':'chaos.control.transfer.01'];
 return stage==='pre'
  ?['chaos.same-rule.pre.01','chaos.control.pre.01']
  :['chaos.same-rule.transfer.01','chaos.control.transfer.01'];
};
const sessionId=crypto.randomUUID();
let store=null,sourceExperiment='sensitivity',currentRunId=null,quizGeneration=0;
try{store=loadLearning()}catch(e){
 // Failed migration is never silently overwritten; experiment rendering continues.
 queueMicrotask(()=>{if(byId('learning-store-warning'))byId('learning-store-warning').textContent=
  '学习记录没有自动迁移：'+e.message+'。旧数据保留，请先手动备份。'});
}
const p=(cls,value)=>{const e=document.createElement('p');e.className=cls;e.textContent=value;return e};
async function mountCheck(stage,experiment,runId,index=0){
 const mount=byId(stage==='pre'?'pre-check-root':'post-check-root');
 if(!mount)return;
 const serial=++quizGeneration; // races are also guarded by displayed stage metadata
 const items=itemsFor(stage,experiment),itemId=items[index];
 if(index===0)mount.replaceChildren(p('muted','正在载入有版本记录的概念题…'));
 else mount.append(p('muted','正在载入第二道独立题目…'));
 try{
  const response=await fetch('/api/learning/item?itemId='+encodeURIComponent(itemId),{cache:'no-store'});
  const question=await response.json();
  if(!response.ok)throw Error(question.error||'题目不可用');
  if(serial!==quizGeneration)return;
  if(sourceExperiment!==experiment)return;
  const card=document.createElement('div');card.className='check-form';
  card.dataset.questionId=itemId;card.dataset.stage=stage;card.dataset.index=String(index);
  const progress=p('tiny-evidence',(stage==='pre'?'概念前测':'独立迁移')+' · '+(index+1)+' / '+items.length+' 道');
  const prompt=p('check-question',question.prompt);
  const options=document.createElement('div');options.className='quiz';
  const feedback=document.createElement('div');feedback.className='feedback hidden';feedback.setAttribute('role','status');
  const submit=document.createElement('button');submit.type='button';submit.className='secondary';
  submit.textContent=stage==='pre'?'提交前测判断':'提交独立迁移题';
  submit.disabled=true;
  const line=document.createElement('div');line.className='run-row';
  const hint=p('muted',stage==='pre'?'请主动选择。前测阶段锁定原答，不展示正确答案或解析。':'请选择，提交后才会显示评分解释。');
  line.append(hint,submit);
  question.options.forEach((label,i)=>{
   const wrapper=document.createElement('label');wrapper.className='choice';
   const input=document.createElement('input');input.type='radio';input.name='academy-'+stage+'-'+question.itemId;input.value=String(i);
   input.addEventListener('change',()=>{submit.disabled=false});
   wrapper.append(input,document.createTextNode(label));options.append(wrapper);
  });
  submit.addEventListener('click',async()=>{
   const selected=options.querySelector('input:checked');
   if(!selected)return;
   submit.disabled=true;
   try{
    const res=await fetch('/api/learning/grade',{method:'POST',headers:{'Content-Type':'application/json'},
     body:JSON.stringify({itemId:question.itemId,attemptToken:question.attemptToken,answer:Number(selected.value)})});
    const graded=await res.json();if(!res.ok)throw Error(graded.error||'判分失败');
    for(const input of options.querySelectorAll('input'))input.disabled=true;
    const event=store?recordQuestionAttempt(store,graded,{sessionId,sourceRunId:runId}):null;
    feedback.classList.remove('hidden');
    if(stage==='pre'){
     // Keep baseline responses locked without disclosing answers before learning.
     feedback.classList.remove('wrong');
     feedback.replaceChildren(p('grade-status','本题已锁定；前测阶段暂不公布正确答案和讲解。'),
      p('tiny-evidence',event?'本机证据编号：'+event.eventId.slice(0,8):'本机存储不可用'));
    }else{
     feedback.classList.toggle('wrong',!graded.correct);
     feedback.replaceChildren(p('grade-status',graded.correct?'这次概念判断正确':'已记录这道客观错题'),
      p('',graded.feedback),p('tiny-evidence',
       '知识点：'+graded.conceptIds.join('、')+' · 评分规则：'+graded.rubricVersion+
       (event?' · 证据编号：'+event.eventId.slice(0,8):' · 本机学习存储不可用')));
     if(!graded.correct&&graded.nextStep){
      feedback.append(p('teacher-next-step','根据你选的这一项，下一步建议：'+graded.nextStep),
       p('tiny-evidence','针对本题错误选项的规则引导；不等于已确认学生的长期概念误区。'));
     }
     const link=document.createElement('a');link.href='/learning';link.className='learning-link';
     link.textContent='查看错题档案与个人学习分析 →';feedback.append(link);
    }
    if(index+1<items.length){
     const next=document.createElement('button');next.type='button';next.className='secondary';
     next.textContent='继续第 '+(index+2)+' 道'+(stage==='pre'?'前测':'迁移')+'题 →';
     next.addEventListener('click',()=>{next.disabled=true;mountCheck(stage,experiment,runId,index+1)});
     feedback.append(next);
    }else{
     feedback.append(p('tiny-evidence','本组 '+items.length+' 道独立题目已提交。'+
      (stage==='pre'?'带着原始想法进入实验，暂不透露标准答案。':'到学习证据页复核原始作答与解释。')));
    }
    submit.textContent='本题已提交';submit.disabled=true;
    const signal=byId('learning-check-status');
    if(signal)signal.textContent='已提交'+(stage==='pre'?'前测':'迁移题')+' '+(index+1)+'/'+items.length+'；'+(store?'原始证据已保存在本机。':'本机存储不可用，请备份原记录。');
   }catch(e){
    hint.textContent='无法保存或判分：'+e.message;
    // A one-time token may have been consumed; keep button disabled to avoid fake resubmission.
   }
  });
  card.append(progress,prompt,options,line,feedback);
  if(index===0)mount.replaceChildren(card);
  else {const waiting=mount.lastElementChild;if(waiting?.classList.contains('muted'))waiting.remove();mount.append(card)}
 }catch(e){mount.replaceChildren(p('warning','题目暂不可用：'+e.message))}
}
export function initializeLearningChecks(){
 sourceExperiment='sensitivity';
 mountCheck('pre',sourceExperiment,null);
}
export function switchLearningExperiment(experiment){
 sourceExperiment=experiment;currentRunId=null;
 if(byId('post-check'))byId('post-check').classList.add('hidden');
 mountCheck('pre',sourceExperiment,null);
}
export function afterScientificObservation(result,prediction){
 currentRunId=result.runId;
 if(!store)return;
 try{recordHypothesis(store,result.runId,{
  experiment:result.experiment,prediction,engineVersion:result.engineVersion,
  condition:result.condition,metrics:result.metrics,results:result.results,lineage:result.lineage
 },{sessionId})}
 catch(e){const signal=byId('learning-check-status');if(signal)signal.textContent='学习证据保存失败：'+e.message}
}
export function afterMentorResponse(mentor,note){
 if(store&&currentRunId){
  try{appendLearningEvent(store,'learning_reflection',{
   mode:mentor.mode||'rules',studentReflection:String(note||'').slice(0,500),
   observed:mentor.observed,question:mentor.question
  },{sessionId,sourceRunId:currentRunId})}catch{}
 }
 const post=byId('post-check');
 if(post){post.classList.remove('hidden');mountCheck('transfer',sourceExperiment,currentRunId)}
}
export function resetLearningEvidence(){
 localStorage.removeItem('ai-academy-learning-v02');
 localStorage.removeItem('ai-academy-learning-v01');
 try{store=loadLearning()}catch(e){store=null;const s=byId('learning-store-warning');if(s)s.textContent='数据已清除，但存储重建失败：'+e.message}
}
export function exportLearningEvidence(){
 if(!store)throw Error('学习证据记录不可用；请先备份旧数据并修复存储。');
 const blob=new Blob([exportLearning(store)],{type:'application/json'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='ai-academy-learning-evidence-v2.json';a.click();
 setTimeout(()=>URL.revokeObjectURL(url),250);
}
