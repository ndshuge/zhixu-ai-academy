/* V4 independent application entry: no import of R2/R3 pages/CSS or old DOM.
   Only original MIT component engine + Motion, and the canonical Original science adapter. */
import '../ai-academy-apple/assets/components.js';
import {createGlass,engine as glassEngine} from '../ai-academy-apple/assets/liquid-glass.js';
import {ScienceBridge,newLesson} from './bridge.js';
import {screens,outline,titles,esc} from './views.js';
const $=q=>document.querySelector(q),$$=q=>Array.from(document.querySelectorAll(q));
const stage=$('#screen'),frame=$('#original-engine'),toast=$('#toast');
const notify=message=>{toast.textContent=String(message);toast.classList.add('show');clearTimeout(notify.timer);notify.timer=setTimeout(()=>toast.classList.remove('show'),3600)};
const bridge=new ScienceBridge(frame,notify);
const prefKey='zx-v4-preferences';
let prefs={reduceMotion:false};try{prefs={...prefs,...JSON.parse(localStorage.getItem(prefKey)||'{}')}}catch{}
document.documentElement.dataset.reduced=prefs.reduceMotion?'true':'false';
const state={route:'today',lesson:newLesson(),busy:false,chat:[]};
let navGlass=null,navResize=null,navAnimation=null,routeAnimation=null,doctorAnimation=null;
let lastRoute='today';
const nav=$('#mobile-tabs'),lens=nav.querySelector('.tab-lens');
try{const saved=JSON.parse(sessionStorage.getItem('zx-v4-lesson')||'null');if(saved&&['sensitivity','logistic','evo-pair'].includes(saved.experiment)&&Number.isInteger(saved.step))state.lesson={...newLesson(saved.experiment),...saved};}catch{}
const save=()=>{try{sessionStorage.setItem('zx-v4-lesson',JSON.stringify(state.lesson))}catch{}};
let motion=null;
const reduced=()=>prefs.reduceMotion||matchMedia('(prefers-reduced-motion:reduce)').matches;
function render(){
 const route=state.route;
 stage.dataset.page=route;
 $('#toolbar-title').textContent=titles[route];$('#outline-name').textContent=titles[route];
 $('#outline-content').innerHTML=outline(route,bridge,state.lesson);
 $$('.menu-item[data-route],.tab-item[data-route]').forEach(node=>{
  const active=node.dataset.route===route;node.classList.toggle('is-active',active);node.classList.toggle('selected',active);
  if(active)node.setAttribute('aria-current','page');else node.removeAttribute('aria-current');
 });
 stage.innerHTML=screens[route]({bridge,lesson:state.lesson,prefs});
 save();
 syncNavSelection();
}
function goto(route,{replace=false}={}){
 if(!titles[route])route='today';
 const previous=state.route,changed=previous!==route;
 state.route=route;
 if(replace)history.replaceState(null,'','#'+route);else history.pushState(null,'','#'+route);
 render();window.scrollTo({top:0,behavior:'instant'});
 if(changed)animateScreen(previous,route);
}
function syncNavSelection(immediate=false){
 const active=nav.querySelector('button[data-route="'+state.route+'"]');
 if(!active)return;
 const x=active.offsetLeft;
 const w=active.offsetWidth;
 lens.style.width=w+'px';
 if(!motion||reduced()||immediate||!nav.offsetWidth){
  navAnimation?.stop?.();
  lens.style.transform='translate3d('+x+'px,0,0)';
  return;
 }
 navAnimation?.stop?.();
 // Retarget from the actual current transform; Motion keeps the visual position.
 navAnimation=motion.animate(lens,{x},{
   type:'spring',stiffness:440,damping:39,mass:.82
 });
}
let routeRevealTimer=null;
function animateScreen(previous,next){
 if(reduced())return;
 // No frozen page screenshots: those cause ghost text in Blink and blank midframes in WebKit.
 // Keep navigation physical and only stage the first few content groups with small,
 // opacity-safe compositor transforms. Never fade the entire reading surface.
 if(routeAnimation){routeAnimation.stop();routeAnimation=null;}
 stage.style.willChange='auto';
 stage.style.removeProperty('transform');
 stage.style.removeProperty('opacity');
 stage.style.removeProperty('translate');
 stage.dataset.entering='true';
 clearTimeout(routeRevealTimer);
 routeRevealTimer=setTimeout(()=>{
  delete stage.dataset.entering;
 },340);
}
function study(experiment='sensitivity'){state.lesson=newLesson(experiment);goto('learn')}
function setStep(n){if(n<=state.lesson.highest){state.lesson.step=n;render()}}
const awaitReady=async()=>{if(bridge.ready)return;await connecting;if(!bridge.ready)throw Error('原版科学引擎暂时不可用，请检查网络后重试。')};
const updateLesson=(patch)=>{Object.assign(state.lesson,patch);render()};
const qid=obj=>obj?.itemId||obj?.id;
async function act(el){
 const a=el.dataset.action,l=state.lesson;
 if(a?.startsWith('nav-'))return goto(a.slice(4));
 if(a==='enter-sensitivity')return study('sensitivity');
 if(a==='enter-evo')return study('evo-pair');
 if(a==='reset-lesson'){state.lesson=newLesson(state.lesson.experiment);return goto('learn')}
 if(a==='study-step')return setStep(Number(el.dataset.index));
 if(a==='step-predict')return updateLesson({step:1});
 if(a==='load-question'||a==='load-transfer'){
  await awaitReady();
  const pre=a==='load-question',data=await bridge.questionSet(pre?'pre':'transfer',l.experiment);
  if(pre)Object.assign(l,{preIds:data.ids,preIndex:0,preResults:[],question:data.question,grade:null});
  else Object.assign(l,{transferIds:data.ids,transferIndex:0,transferResults:[],transfer:data.question,transferGrade:null});
  render();return;
 }
 if(a==='next-pre'||a==='next-transfer-question'){
  await awaitReady();const pre=a==='next-pre';const ids=pre?l.preIds:l.transferIds;const i=pre?l.preIndex:l.transferIndex;
  if(!ids[i+1])throw Error('没有更多原版题目。');
  const question=await bridge.getQuestion(ids[i+1]);
  if(pre)Object.assign(l,{preIndex:i+1,question,grade:null});
  else Object.assign(l,{transferIndex:i+1,transfer:question,transferGrade:null});
  render();return;
 }
 if(a==='next-prediction'){
  if(l.preResults.length<l.preIds.length)throw Error('请先提交所有前测题目。');
  l.step=1;l.highest=Math.max(l.highest,1);render();return;
 }
 if(a==='mentor'){
  await awaitReady();if(!l.run)throw Error('请先运行实验');
  l.mentor=await bridge.mentor(l.approvedRun||l.run,$('#reflection')?.value.trim()||'',!!$('#mentor-authorize')?.checked);render();return;
 }
 if(a==='next-transfer'){l.step=3;l.highest=Math.max(l.highest,3);render();return;}
 if(a==='propose-second'){
  await awaitReady();if(!l.run||!l.mentor)throw Error('请先完成实验和导师反馈');
  l.plan=await bridge.propose(l.run);render();return;
 }
 if(a==='approve-second'){
  await awaitReady();const prediction=$('#second-prediction')?.value.trim()||'';
  if(prediction.length<8||prediction===l.prediction)throw Error('第二次预测必须至少 8 字，且与上一次不同');
  l.approvedRun=await bridge.approve(l.plan,prediction,l.experiment);l.plan=null;render();notify('第二次科学实验已记录');return;
 }
 if(a==='export-data'){
  const blob=new Blob([bridge.export()],{type:'application/json'});const url=URL.createObjectURL(blob);const link=document.createElement('a');
  link.href=url;link.download='zhixu-learning-v2-'+new Date().toISOString().slice(0,10)+'.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1500);notify('学习记录已导出');return;
 }
 if(a==='review-task'){
  const t=bridge.tasks()[Number(el.dataset.index)];if(!t)throw Error('复习任务不存在');
  study(t.conceptId?.startsWith('evolution.')?'evo-pair':'sensitivity');notify('已进入对应课程，重新进行独立判断');return;
 }
 if(a==='misconfirm'||a==='misreject'){bridge.decide(el.dataset.event,a==='misconfirm');render();notify('已记录你的判断');return;}
 if(a==='toggle-reduced'){prefs.reduceMotion=!prefs.reduceMotion;localStorage.setItem(prefKey,JSON.stringify(prefs));document.documentElement.dataset.reduced=prefs.reduceMotion?'true':'false';render();return;}
 if(a==='clear-data')return confirmModal('清空学习记录？','将清空本浏览器 V2 学习事件，无法直接恢复。建议先导出备份；原 V1 数据不会被删除。',()=>{bridge.clear();render();notify('V2 学习记录已清空')});
 if(a==='open-ai-config'){
  await awaitReady();document.body.classList.add('show-original-engine');
  $('#dialog-layer').innerHTML='<div class="modal-shade" id="configure-shade"><div class="modal"><h2>原版 DeepSeek 设置</h2><p>请在原版面板里配置并真实验证连接。此页面不会读取或展示你的密钥。</p><div class="modal-actions"><button id="close-config" class="secondary">关闭并返回 V4</button></div></div></div>';
  const w=bridge.win;const d=w.document.querySelector('#pages-ai-dialog'),o=w.document.querySelector('#pages-ai-open');if(o)o.click();else if(d)d.dataset.open='true';
  $('#close-config').onclick=async()=>{if(d)d.dataset.open='false';document.body.classList.remove('show-original-engine');$('#dialog-layer').replaceChildren();try{bridge.status=await bridge.request('/api/status')}catch{}render()};
 }
}
async function submit(form){
 await awaitReady();const l=state.lesson;
 if(form.id==='quiz-form'){
  const chosen=new FormData(form).get('answer');if(chosen===null)throw Error('请先选择答案');
  const pre=form.dataset.stage==='pre',q=pre?l.question:l.transfer;
  const grade=await bridge.grade(q,Number(chosen));
  if(pre){l.grade=grade;l.preResults.push({itemId:qid(q),gradedResult:grade.gradedResult});}
  else{l.transferGrade=grade;l.transferResults.push({itemId:qid(q),gradedResult:grade.gradedResult});}
  render();return;
 }
 if(form.id==='prediction-form'){
  const f=Object.fromEntries(new FormData(form)),prediction=String(f.prediction||'').trim();
  if(prediction.length<8)throw Error('请先写下至少 8 个字的独立预测');
  const run=await bridge.run(l.experiment,prediction,f);
  Object.assign(l,{prediction,run,mentor:null,step:2,highest:Math.max(l.highest,2)});render();notify('原版科学引擎完成一次真实实验');return;
 }
}
function confirmModal(title,message,action){
 const shade=document.createElement('div');shade.className='modal-shade';shade.innerHTML='<div class="modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title"><h2 id="confirm-title">'+esc(title)+'</h2><p>'+esc(message)+'</p><div class="modal-actions"><button class="secondary" id="cancel-confirm">取消</button><button class="primary" id="accept-confirm">确认</button></div></div>';
 $('#dialog-layer').append(shade);const close=()=>shade.remove();$('#cancel-confirm').onclick=close;$('#accept-confirm').onclick=()=>{close();action()};shade.addEventListener('click',e=>{if(e.target===shade)close()});$('#cancel-confirm').focus();
}
document.addEventListener('click',async e=>{
 const b=e.target.closest?.('[data-route],[data-action],[data-experiment]');if(!b||state.busy||b.disabled)return;
 e.preventDefault();
 if(b.dataset.route){goto(b.dataset.route);return;}
 if(b.dataset.experiment){
  const exp=b.dataset.experiment;if(!['sensitivity','logistic','evo-pair'].includes(exp)||exp===state.lesson.experiment)return;
  state.lesson=newLesson(exp);render();return;
 }
 state.busy=true;b.disabled=true;
 try{await act(b)}catch(error){console.error('[V4 action]',error);notify(error.message||'操作失败')}
 finally{state.busy=false;if(b.isConnected)b.disabled=false}
});
document.addEventListener('change',e=>{
 if(e.target.matches('#quiz-form input[type=radio]')){
  const button=$('#quiz-form button[type=submit]');
  if(button)button.disabled=!$('#quiz-form input[type=radio]:checked');
 }
});
document.addEventListener('input',e=>{if(e.target.id==='prediction'){state.lesson.prediction=e.target.value;save()}});
document.addEventListener('submit',async e=>{
 if(!e.target.matches('#quiz-form,#prediction-form'))return;
 e.preventDefault();if(state.busy)return;state.busy=true;
 try{await submit(e.target)}catch(error){console.error('[V4 submit]',error);notify(error.message||'提交失败')}
 finally{state.busy=false}
});
window.addEventListener('popstate',()=>{const previous=state.route;const r=location.hash.slice(1);state.route=titles[r]?r:'today';render();animateScreen(previous,state.route)});
$('#outline-toggle').onclick=()=>document.documentElement.dataset.outline='collapsed';
$('#outline-reveal').onclick=()=>document.documentElement.dataset.outline='open';
const panel=$('#doctor-panel'),launch=$('#doctor-launch'),question=$('#doctor-question');
function syncVisibleViewport(){
 const vp=window.visualViewport;
 const h=vp?.height||innerHeight,top=vp?.offsetTop||0;
 document.documentElement.style.setProperty('--visible-height',Math.round(h)+'px');
 document.documentElement.style.setProperty('--visible-top',Math.round(top)+'px');
 const showing=!panel.hidden && document.activeElement===question && innerWidth<=700;
 document.body.classList.toggle('keyboard-visible',showing);
}
function closeDoctor(){
 question.blur();
 document.body.classList.remove('doctor-open','keyboard-visible');
 launch.setAttribute('aria-expanded','false');
 if(reduced()||!motion){panel.hidden=true;launch.focus({preventScroll:true});return;}
 doctorAnimation?.stop?.();
 doctorAnimation=motion.animate(panel,{opacity:[1,0],y:[0,10],scale:[1,.975]}, {duration:.18,ease:[.35,0,1,1]});
 doctorAnimation.finished.then(()=>{if(launch.getAttribute('aria-expanded')==='false')panel.hidden=true;launch.focus({preventScroll:true})}).catch(()=>{panel.hidden=true});
}
launch.onclick=()=>{
 if(!panel.hidden){closeDoctor();return;}
 doctorAnimation?.stop?.();
 panel.hidden=false;
 document.body.classList.add('doctor-open');
 launch.setAttribute('aria-expanded','true');
 doctorStatus();syncVisibleViewport();
 if(!reduced()&&motion){
   doctorAnimation=motion.animate(panel,{opacity:[0,1],y:[12,0],scale:[.972,1]}, {type:'spring',stiffness:395,damping:35,mass:1});
 }
 // Do not focus textarea: that unexpectedly invokes the iOS keyboard.
 $('#doctor-close').focus({preventScroll:true});
};
$('#doctor-close').onclick=closeDoctor;
$('#doctor-setup').onclick=()=>{closeDoctor();goto('settings')};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden)closeDoctor()});
question.addEventListener('focus',syncVisibleViewport);
question.addEventListener('blur',()=>{setTimeout(syncVisibleViewport,100)});
window.visualViewport?.addEventListener('resize',syncVisibleViewport,{passive:true});
window.visualViewport?.addEventListener('scroll',syncVisibleViewport,{passive:true});
window.addEventListener('resize',syncVisibleViewport,{passive:true});
async function doctorStatus(){
 const verified=await bridge.modelStatus();
 panel.classList.toggle('ai-ready',verified);
 $('#doctor-status').textContent=verified?'DeepSeek 已验证 · 逐次调用':'尚未验证模型 · 仅规则导师可用';
 $('#doctor-send').disabled=!verified;
 question.disabled=!verified;
 question.placeholder=verified?'向博士提问…':'先在设置中验证 DeepSeek';
}
$('#doctor-form').addEventListener('submit',async e=>{
 e.preventDefault();const input=$('#doctor-question'),query=input.value.trim();if(query.length<3)return;
 const verified=await bridge.modelStatus();if(!verified){notify('先到设置验证 DeepSeek，未验证时不会伪造回复');return}
 const log=$('#doctor-log');const item=(msg,cls='')=>{const p=document.createElement('p');p.className='chat-bubble '+cls;p.textContent=msg;log.append(p);log.scrollTop=log.scrollHeight;return p};
 item(query,'mine');input.value='';const placeholder=item('博士正在思考…');$('#doctor-send').disabled=true;
 try{
  const messages=[{role:'system',content:'你是知序 AI 学院的苏格拉底式私人教师。基于真实科学证据引导思考，不伪造实验结果，不直接替学生完成作业。'},...state.chat.slice(-8),{role:'user',content:query}];
  const result=await bridge.modelAsk(messages);if(!result?.reply)throw Error('原版模型未返回有效答案');
  placeholder.textContent=result.reply;
  state.chat.push({role:'user',content:query},{role:'assistant',content:result.reply});state.chat=state.chat.slice(-10);
 }catch(error){placeholder.textContent='真实 AI 连接未完成：'+error.message}finally{await doctorStatus()}
});
/* A proven MIT Motion runtime rather than a bespoke spring replacement. */
async function activateMotion(){
 try{
  motion=await import('../ai-academy-apple/assets/motion.bundle.js');
  window.ZHIXU_V4_ENGINES={motion:'Motion',glass:!!customElements.get('lg-navbar'),nav:'single-layer',optics:glassEngine};
  navGlass=createGlass(nav.querySelector('.nav-optics'),{
    mode:'backdrop',fit:true,refraction:12,bezel:.83,curvature:3.4,
    chroma:.08,blur:1.8,specular:.66,specularWidth:1.5,
    mapScale:1,fallback:'blur(22px) saturate(1.55)'
  });
  syncNavSelection(true);
  navResize=new ResizeObserver(()=>syncNavSelection(true));
  navResize.observe(nav);
  let tabPress=null,dragOrigin=null,dragging=false,tabHoldTimer=null,swallowClick=false;
  const navButtons=[...nav.querySelectorAll('button[data-route]')];
  nav.addEventListener('pointerdown',e=>{
   const button=e.target.closest('button[data-route]');
   if(!button||reduced())return;
   tabPress=button;dragOrigin={x:e.clientX,y:e.clientY,id:e.pointerId};
   dragging=false;clearTimeout(tabHoldTimer);
   motion.animate(lens,{scaleX:1.055,scaleY:.94},{type:'spring',stiffness:500,damping:37});
   tabHoldTimer=setTimeout(()=>{
    if(tabPress===button&&!dragging)
      motion.animate(lens,{scaleX:1.12,scaleY:.93},{type:'spring',stiffness:480,damping:32,mass:.75});
   },185);
  },{passive:true});
  document.addEventListener('pointermove',e=>{
   if(!tabPress||!dragOrigin||e.pointerId!==dragOrigin.id||reduced())return;
   const dx=e.clientX-dragOrigin.x,dy=e.clientY-dragOrigin.y;
   if(!dragging&&(Math.abs(dx)<16||Math.abs(dx)<Math.abs(dy)*1.35))return;
   dragging=true;clearTimeout(tabHoldTimer);
   const min=navButtons[0].offsetLeft,max=navButtons[navButtons.length-1].offsetLeft;
   const x=Math.max(min,Math.min(max,tabPress.offsetLeft+dx));
   navAnimation?.stop?.();
   navAnimation=motion.animate(lens,{x,scaleX:1.09,scaleY:.91},{duration:.09,ease:[.15,.8,.23,1]});
  },{passive:true});
  const restoreTab=e=>{
   if(!tabPress)return;
   clearTimeout(tabHoldTimer);
   if(dragging&&e?.type==='pointerup'){
    // Commit to the nearest target on release; never commit while dragging.
    const x=e?.clientX??(dragOrigin?.x||0);
    let nearest=navButtons[0],min=Infinity;
    for(const button of navButtons){
     const rect=button.getBoundingClientRect();
     const delta=Math.abs(x-(rect.left+rect.width/2));
     if(delta<min){nearest=button;min=delta;}
    }
    swallowClick=true;
    setTimeout(()=>{swallowClick=false},180);
    goto(nearest.dataset.route);
   }else{
    syncNavSelection();
   }
   dragging=false;tabPress=null;dragOrigin=null;
   motion.animate(lens,{scaleX:1,scaleY:1},{type:'spring',stiffness:390,damping:28});
  };
  nav.addEventListener('click',e=>{
   if(swallowClick){e.preventDefault();e.stopImmediatePropagation();swallowClick=false}
  },true);
  document.addEventListener('pointerup',restoreTab,{passive:true});
  document.addEventListener('pointercancel',restoreTab,{passive:true});
  window.addEventListener('blur',()=>restoreTab());
  const pressed=new WeakMap();let active=null,holdTimer=null;
  const selector='.primary,.book-tile,.menu-item,.simple-row,.doctor-launch';
  const settle=()=>{
   clearTimeout(holdTimer);const b=active;active=null;
   const entry=b&&pressed.get(b);
   if(entry)motion.animate(entry.value,1,{type:'spring',stiffness:380,damping:27,velocity:entry.value.getVelocity()});
  };
  document.addEventListener('pointerdown',e=>{
   if(reduced()||e.button!==0)return;
   const b=e.target.closest?.(selector);if(!b)return;
   if(active)settle();active=b;
   let entry=pressed.get(b);if(!entry){const value=motion.motionValue(1);value.on('change',v=>b.style.scale=String(v));entry={value};pressed.set(b,entry)}
   motion.animate(entry.value,.971,{type:'spring',stiffness:440,damping:34});
   holdTimer=setTimeout(()=>{if(active===b)motion.animate(entry.value,.955,{type:'spring',stiffness:290,damping:31})},340);
  },{passive:true});
  // Release is attached to document, not the original target: pointer cancellation and
  // dragging off a control cannot strand it in a compressed visual state.
  document.addEventListener('pointerup',settle,{passive:true});
  document.addEventListener('pointercancel',settle,{passive:true});
  window.addEventListener('blur',settle);
 }catch(err){window.ZHIXU_V4_ENGINES={motion:'CSS fallback',reason:String(err),glass:!!customElements.get('lg-navbar')}}
}
let connecting;
async function boot(){
 const hash=location.hash.slice(1);goto(titles[hash]?hash:'today',{replace:true});activateMotion();
 connecting=bridge.connect();const okay=await connecting;
 $('#connected-dot').classList.toggle('is-ready',okay);
 $('#engine-caption').textContent=okay?'科学引擎已连接 · 规则导师可用':'原版引擎暂未连接';
 await doctorStatus();render();
}
window.ZHIXU_V4_NAVIGATE=goto;window.ZHIXU_V4_DEBUG=()=>({route:state.route,ready:bridge.ready,motion:window.ZHIXU_V4_ENGINES,summary:bridge.summary,lesson:{step:state.lesson.step,experiment:state.lesson.experiment}});
boot();
