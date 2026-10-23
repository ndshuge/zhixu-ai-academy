/**
 * RC3 pre-media product experience:
 *  - visual cognition trace from ACTUAL DOM events
 *  - source-constrained explanation for a server-approved plan
 *  - on-demand fixed, local safety validation (never calls a model)
 * No credentials, no telemetry and no fabricated learning states.
 */
const $=id=>document.getElementById(id);
const nodes=Object.fromEntries([...document.querySelectorAll('[data-arc]')]
 .map(node=>[node.dataset.arc,node]));
function completed(selector){return !!document.querySelector(selector)}
function stageReady(stage){
 if(stage==='hypothesis')return $('lens-hypothesis')?.dataset.state==='ready';
 if(stage==='evidence')return $('lens-evidence')?.dataset.state==='ready';
 if(stage==='plan')return !$('plan-preview')?.classList.contains('hidden') ||
   !$('experiment-comparison')?.classList.contains('hidden');
 if(stage==='transfer')return !$('post-check')?.classList.contains('hidden')&&
   completed('#post-check-root .check-form[data-index="1"] .feedback:not(.hidden)');
 return false;
}
function paint(){
 let done=0;
 for(const [key,node] of Object.entries(nodes)){
  const ready=stageReady(key);if(ready)done++;
  node.classList.toggle('complete',ready);
  const message={
   hypothesis:'已锁定原始预测',
   evidence:'真实科学引擎已返回',
   plan:!$('experiment-comparison')?.classList.contains('hidden')?'已批准并运行':'安全计划待独立批准',
   transfer:'已提交两道新题'
  };
  node.querySelector('small').textContent=ready?message[key]:{
   hypothesis:'等待本人预测',evidence:'等待真实科学计算',
   plan:'等待生成并审核',transfer:'等待两道独立新题'}[key];
 }
 $('arc-progress').textContent=done+' / 4 已见证';
 $('arc-notice').textContent=done===4
  ?'本次已形成可追溯的学习事件；这并不代表科学掌握率或真实教学效果研究。'
  :'本次进度只根据页面实际生成的学习和科学事件更新；不会猜测学生是否已经掌握。';
}
for(const selector of ['#lens-hypothesis','#lens-evidence','#plan-preview','#experiment-comparison','#post-check-root']){
 const element=document.querySelector(selector);
 if(element)new MutationObserver(paint).observe(element,{
  subtree:true,childList:true,attributes:true,characterData:true,
  attributeFilter:['class','data-state']});
}
paint();
const explanation=$('explain-plan');
const mode=$('explain-mode'),evidence=$('explain-evidence'),
 variable=$('explain-variable'),limitation=$('explain-limit'),
 approval=$('explain-approval');
function resetExplanation(){
 mode.textContent='尚无方案';mode.dataset.mode='idle';
 evidence.textContent='等待本次真实实验结果与服务端安全方案。';
 variable.textContent='服务器尚未授权任何变量更改。';
 limitation.textContent='只提出可验证问题，不编造下一次结果。';
 approval.textContent='未批准 → 不执行任何额外科学实验';
 explanation.dataset.state='idle';
}
document.addEventListener('academy:plan-ready',({detail:plan})=>{
 if(!plan||!Array.isArray(plan.changes)||plan.changes.length!==1)return resetExplanation();
 const change=plan.changes[0];
 const fallback=!!plan.fallbackReason;
 const remote=plan.plannerMode==='llm-constrained'&&!fallback;
 mode.textContent=fallback?'AI 暂不可用 · 启用备用方案':remote?'AI 已选择实验方案':'科学对照方案';
 mode.dataset.mode=fallback?'fallback':remote?'llm':'rules';
 const label=plan.experiment==='evo-pair'?'EvoWorld数字生命':'Physics Frontier Lab';
 evidence.textContent='依据本次 '+label+' 实际计算记录；实验ID：'+String(plan.sourceRunId||'未提供').slice(0,12)+'…；'+
   (remote?'模型从服务器验证的两方案中选择一个。':'已通过单变量安全约束检查。');
 variable.textContent=change.field+'：'+change.from+' → '+change.to+
  '；其余控制变量不变。预算：'+String(plan.budget||'服务器审查');
 limitation.textContent=String(plan.studyQuestion||'')+'。限制：'+String(plan.limits||'仍需结合实际曲线。').slice(0,220);
 approval.textContent='计划已预览，但没有执行。请先写一条新的独立预测，再亲自批准。';
 explanation.dataset.state='proposed';
 paint();
});
document.addEventListener('academy:plan-reset',()=>{resetExplanation();paint()});
document.addEventListener('academy:plan-approved',({detail})=>{
 if(explanation.dataset.state==='proposed'){
  approval.textContent='学生已明确批准并执行该次真实科学实验；现在应重新比较科学曲线与实际观测。';
  explanation.dataset.state='approved';
 }
 paint();
});
resetExplanation();
// P5: only source numbers from validated, fixed, on-disk benchmark JSON.
async function showEvidenceLedger(){
 const label=$('ledger-status');
 try{
  const response=await fetch('/api/evidence/summary',{cache:'no-store'});
  if(!response.ok)throw Error('证据源尚未通过本机验证（HTTP '+response.status+'）');
  const report=await response.json();
  if(report.scope!=='VERIFIED_SYNTHETIC_TECHNICAL_TESTS_NOT_STUDENT_LEARNING')
   throw Error('证据分类不正确');
  const a=report.offline,b=report.remote;
  if(!Number.isInteger(a.situations)||a.situations<50||!Number.isInteger(b.syntheticSituations)||b.syntheticSituations!==8)
   throw Error('证据字段不完整');
  $('ledger-cases').textContent=String(a.situations);
  $('ledger-runs').textContent=String(a.recomputations);
  $('ledger-blocks').textContent=String(a.blockedUnsafeOutputs);
  $('ledger-live').textContent=b.goalAlignedModel+' / '+b.syntheticSituations;
  $('ledger-offline').textContent=a.goalAlignedDeterministicPolicy+' / '+a.situations+' · 技术基线；对照 '+a.goalAlignedRule+' / '+a.situations;
  $('ledger-compare').textContent=b.goalAlignedModel+' / '+b.syntheticSituations+' · AI 模型；离线对照 '+b.goalAlignedRule+' / '+b.syntheticSituations;
  $('ledger-foot').textContent='研发技术验证，属于合成测试情境，不代表真人学习效果。研究参与者：'+report.actualStudentParticipants+' 人；记录指纹：'+a.hash.slice(0,16)+'…';
  label.textContent='来源已核验 · 仅技术/合成数据';
  label.dataset.state='verified';
 }catch(error){
  label.textContent='证据未就绪';
  label.dataset.state='error';
  $('ledger-foot').textContent=String(error.message||'本机证据无法校验')+'；不可声称已通过或显示虚构的指标。';
 }
}
showEvidenceLedger();
const caseButtons=[...document.querySelectorAll('[data-safety-case]')];
const caseResult=$('safety-outcome');
for(const button of caseButtons){
 button.addEventListener('click',async()=>{
  const id=button.dataset.safetyCase;
  caseButtons.forEach(x=>x.disabled=true);
  $('safety-state').textContent='正在执行本机真实校验…';
  caseResult.replaceChildren();
  const heading=document.createElement('strong'),body=document.createElement('p');
  heading.textContent='校验中';body.textContent='尚未允许任何模型或科学引擎执行。';
  caseResult.append(heading,body);
  try{
   const response=await fetch('/api/safety/check?id='+encodeURIComponent(id),{cache:'no-store'});
   if(!response.ok)throw Error('安全案例服务不可用：HTTP '+response.status);
   const data=await response.json();
   const trulyRejected=data.blocked===true&&data.decision==='REJECTED'&&
    data.modelCalls===0&&data.scientificExecutions===0;
   $('safety-state').textContent=trulyRejected?'已拦截':'审查未通过';
   $('safety-state').dataset.result=trulyRejected?'blocked':'error';
   heading.textContent=data.name+(trulyRejected?' · 已被真实规则拒绝':' · 需要排查');
   body.textContent=String(data.summary||'')+' 校验规则：'+String(data.protectedBy||'')+
    '；本轮远程模型调用 '+data.modelCalls+' 次、实验自动执行 '+data.scientificExecutions+' 次。';
  }catch(err){
   $('safety-state').textContent='校验失败，请排查';
   $('safety-state').dataset.result='error';
   heading.textContent='没有取得有效安全结论';
   body.textContent=String(err.message||'网络或服务端失败');
  }finally{caseButtons.forEach(x=>x.disabled=false)}
 });
}
