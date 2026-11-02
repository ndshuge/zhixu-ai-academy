/* Zhixu Doctor: original eleven user-provided portraits + existing verified Original BYOK.
 * This companion does not store credentials, call paid APIs automatically, or imitate AI replies.
 */
const doctorRoot = document.createElement('div');
doctorRoot.id = 'zx-doctor-host';
doctorRoot.innerHTML = `
 <button type="button" id="zx-doctor-open" aria-controls="zx-doctor-panel" aria-expanded="false" aria-label="和知序博士对话">
  <img id="zx-doctor-avatar" src="./assets/zhixu-doctor/idle.webp" alt="" width="55" height="70" loading="eager" fetchpriority="high" decoding="sync">
  <span class="zx-doctor-launch-copy"><strong>知序博士</strong><small id="zx-doctor-launch-status">AI 未连接</small><em>和博士对话 →</em></span>
 </button>
 <section id="zx-doctor-panel" role="dialog" aria-modal="false" aria-labelledby="zx-doctor-title" hidden>
  <header class="zx-doctor-header">
    <img id="zx-doctor-face" src="./assets/zhixu-doctor/welcome.webp" alt="" width="58" height="74" loading="eager" decoding="sync">
    <div><h2 id="zx-doctor-title">知序博士</h2><p id="zx-doctor-status">正在检查 AI 连接</p></div>
    <button type="button" id="zx-doctor-close" aria-label="关闭博士对话">×</button>
  </header>
  <div id="zx-doctor-log" role="log" aria-live="polite" aria-relevant="additions" aria-label="与知序博士的对话"><p class="zx-doctor-message zx-doctor-assistant">你好！先提出你的想法，我们一起找证据。需要真实 AI 回复时，请先配置并验证 DeepSeek。</p></div>
  <div class="zx-doctor-connection" id="zx-doctor-connection">
    <span id="zx-doctor-model-notice">未验证 AI 连接，博士不会假装生成模型回复。</span>
    <button type="button" id="zx-doctor-config">配置 DeepSeek</button>
  </div>
  <form id="zx-doctor-form">
   <label for="zx-doctor-question" class="sr-only">向知序博士提问</label>
   <textarea id="zx-doctor-question" rows="2" placeholder="向博士提出问题…" maxlength="1200"></textarea>
   <button type="submit" id="zx-doctor-send" disabled>发送</button>
  </form>
  <p class="zx-doctor-privacy">仅在你主动发送且已验证 AI 连接后请求 DeepSeek。对话暂存于当前页面内存。</p>
 </section>`;
document.body.append(doctorRoot);
const D = id => document.getElementById(id);
const launch=D('zx-doctor-open'), panel=D('zx-doctor-panel'), question=D('zx-doctor-question');
const form=D('zx-doctor-form'),send=D('zx-doctor-send'),log=D('zx-doctor-log');
const images=new Set(['welcome','idle','thinking','planning','analyzing','explaining','teaching','success','encouraging','warning','fallback']);
let busy=false, turns=[], activeMood='idle';
function mood(state){
 const next=images.has(state)?state:'fallback';
 if(activeMood===next)return;
 activeMood=next;
 const image='./assets/zhixu-doctor/'+next+'.webp';
 D('zx-doctor-avatar').src=image;
 D('zx-doctor-face').src=image;
}
function provider(){
 try{return D('original-engine')?.contentWindow?.ZHIXU_PAGES_AI || null;}catch{return null;}
}
function verified(){return provider()?.status?.()===true;}
function status(){
 const ok=verified();
 const p=provider();
 const state=p?.state?.();
 D('zx-doctor-launch-status').textContent=ok?'AI 已连接':state==='saved-unverified'?'AI 待验证':'AI 未连接';
 D('zx-doctor-status').textContent=ok?'DeepSeek 已验证 · 按次请求':state==='saved-unverified'?'DeepSeek 待验证':'规则导师可用 · AI 未连接';
 D('zx-doctor-model-notice').textContent=ok?'AI 连接已验证。只有按“发送”才调用模型。':state==='saved-unverified'?'已保存配置，但尚未通过真实连接验证。':'未验证 DeepSeek。可以在学习页使用规则导师，聊天需先验证 AI。';
 send.disabled=busy||!ok||question.value.trim().length<3;
 D('zx-doctor-config').hidden=ok;
}
function open(){
 panel.hidden=false;
 launch.setAttribute('aria-expanded','true');
 mood('welcome');status();
 question.focus({preventScroll:true});
}
function close(){
 panel.hidden=true;
 launch.setAttribute('aria-expanded','false');
 mood('idle');launch.focus({preventScroll:true});
}
launch.addEventListener('click',()=>panel.hidden?open():close());
D('zx-doctor-close').addEventListener('click',close);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden){e.preventDefault();close();}});
question.addEventListener('input',status);
question.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();if(!send.disabled)form.requestSubmit();}});
D('zx-doctor-config').addEventListener('click',()=>{
 close();
 window.ZHIXU_APPLE_NAVIGATE?.('settings');
 requestAnimationFrame(()=>{
   const entry=document.querySelector('[data-action="open-ai-config"]');
   if(entry)entry.click();
 });
});
function append(text,who){
 const node=document.createElement('p');
 node.className='zx-doctor-message '+(who==='user'?'zx-doctor-user':'zx-doctor-assistant');
 node.textContent=String(text);
 log.append(node);log.scrollTop=log.scrollHeight;
 return node;
}
form.addEventListener('submit',async e=>{
 e.preventDefault();
 const text=question.value.trim();
 if(busy||text.length<3)return;
 const model=provider();
 if(!model?.status?.()){status();append('请先完成 DeepSeek 真实连接验证；当前不会生成模拟 AI 回复。','assistant');mood('warning');return;}
 busy=true;status();
 question.value='';
 append(text,'user');
 const placeholder=append('知序博士正在思考…','assistant');
 mood('thinking');
 try{
   const system={role:'system',content:'你是知序 AI 学院的知序博士。以苏格拉底式方式帮助学生理解科学原理，先引导提出猜想与证据，数学与科学结论务必准确；未经验证不得假装运行实验；避免直接替学生完成所有作业。'};
   const messages=[system,...turns.slice(-8),{role:'user',content:text}];
   const result=await model.ask(messages,430);
   if(typeof result?.reply!=='string'||!result.reply.trim())throw Error('原版模型没有返回可显示的回复');
   placeholder.textContent=result.reply;
   turns.push({role:'user',content:text},{role:'assistant',content:result.reply});
   turns=turns.slice(-10);
   mood('explaining');
 }catch(error){
   placeholder.textContent='实际 AI 调用未完成：'+String(error?.message||error)+'。请检查连接配置；本次没有生成模拟答案。';
   mood('warning');
 }finally{busy=false;status();log.scrollTop=log.scrollHeight;}
});
D('zx-doctor-avatar').addEventListener('error',()=>mood('fallback'));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)status();});
setInterval(()=>{if(!document.hidden)status()},2200);
status();
