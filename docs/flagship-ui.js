/**
 * RC3 flagship classroom: a focused presentation of the EXISTING scientific
 * and consent-aware learning workflow. Does not grade, fabricate data, or
 * bypass human approval; everything it exposes is sourced from other modules.
 */
const $=id=>document.getElementById(id);
const root=$('focus-controls'),toggle=$('focus-toggle'),next=$('focus-next');
const buttons=[...root.querySelectorAll('[data-focus-target]')];
const stageOrder=['pre','predict','observe','transfer'];
const sectionFor={pre:$('pre-check'),predict:document.querySelector('section[aria-labelledby="question-title"]'),
 observe:$('results'),transfer:$('transfer')};
let active='pre',enabled=false,lastResult=false;
const isDone=(stage)=>{
 if(stage==='pre')return !!document.querySelector('#pre-check-root .check-form[data-index="1"] .feedback:not(.hidden)');
 if(stage==='predict')return !$('results').classList.contains('hidden');
 if(stage==='observe')return !$('post-check').classList.contains('hidden');
 return !!document.querySelector('#post-check-root .check-form[data-index="1"] .feedback:not(.hidden)');
};
function available(stage){
 const index=stageOrder.indexOf(stage);
 return index===0||index===1&&isDone('pre')||index===2&&isDone('predict')||
  index===3&&isDone('observe');
}
function update(){
 document.body.classList.toggle('focus-course',enabled);
 document.body.dataset.focusStage=enabled?active:'off';
 toggle.textContent=enabled?'退出聚焦模式':'进入旗舰课 →';
 toggle.setAttribute('aria-pressed',String(enabled));
 for(const button of buttons){
  const stage=button.dataset.focusTarget;
  button.disabled=!available(stage);
  button.classList.toggle('active',stage===active);
  button.setAttribute('aria-current',stage===active?'step':'false');
 }
 const texts={
  pre:'先完成两道前测。正确答案在实验前不会显示；预测失败不属于客观错题。',
  predict:'写下自己的原始判断，再运行固定版本的真实科学模型。',
  observe:'核对真实科学数据，向导师追问，审查新方案并写下第二次预测。',
  transfer:'完成两道不同情境的新题，并核对原始学习记录。'
 };
 $('focus-status').textContent=texts[active]+
  (isDone(active)?' 本阶段已达到进入下一步的条件。':'');
 next.disabled=!isDone(active);
 next.textContent=active==='transfer'?'查看个人学习证据 →':'进入下一阶段 →';
}
function goto(stage){
 if(!available(stage))return;
 active=stage;update();
 sectionFor[stage]?.scrollIntoView({behavior:'smooth',block:'start'});
}
toggle.addEventListener('click',()=>{
 enabled=!enabled;if(enabled&&!available(active))active='pre';
 update();
 if(enabled)root.scrollIntoView({behavior:'smooth',block:'start'});
});
buttons.forEach(button=>button.addEventListener('click',()=>goto(button.dataset.focusTarget)));
next.addEventListener('click',()=>{
 if(!isDone(active))return;
 if(active==='transfer'){location.assign('./learning.html');return}
 goto(stageOrder[stageOrder.indexOf(active)+1]);
});
const observer=new MutationObserver(()=>{
 const visible=isDone('predict');
 // Automatically show the result when a learner runs a genuine scientific experiment.
 if(enabled&&active==='predict'&&!lastResult&&visible){active='observe';update();sectionFor.observe.scrollIntoView({behavior:'smooth',block:'start'})}
 lastResult=visible;update();
});
for(const selector of ['#pre-check-root','#results','#mentor-output','#post-check','#post-check-root']){
 const node=document.querySelector(selector);
 if(node)observer.observe(node,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
}
const params=new URLSearchParams(location.search);
if(params.get('focus')==='1'){enabled=true;active='pre'}
update();
