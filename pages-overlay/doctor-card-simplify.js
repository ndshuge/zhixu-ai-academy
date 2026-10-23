(()=>{'use strict';if(window.__ZHIXU_DOCTOR_CARD_SIMPLE)return;window.__ZHIXU_DOCTOR_CARD_SIMPLE=true;
const css=document.createElement('style');css.textContent=
"#pages-ai-open{display:none!important}"+
".zhixu-doctor .doctor-toggle,.zhixu-doctor .doctor-heading small,.zhixu-doctor .doctor-heading span,.zhixu-doctor #doctor-message,.zhixu-doctor #doctor-timer,.zhixu-doctor .doctor-model,.zhixu-doctor #doctor-connect{display:none!important}"+
".zhixu-doctor{top:auto!important;bottom:18px!important;width:226px!important;padding:14px!important;gap:0}"+
".zhixu-doctor .doctor-heading{display:grid!important;gap:0!important;text-align:center!important}"+
".zhixu-doctor .doctor-heading strong{font-size:20px!important;color:#173f38!important}"+
".zhixu-doctor .doctor-state{display:flex!important;justify-content:center!important;align-items:center!important;margin:8px 0 12px!important;font-size:12px!important;color:#24694e!important}"+
".zhixu-doctor .doctor-state strong{font-size:12px!important;font-weight:750!important}"+
".zhixu-doctor .doctor-chat-cta{display:block!important;width:100%!important;min-height:43px!important;border:0!important;border-radius:11px!important;padding:11px 12px!important;background:linear-gradient(135deg,#16896b,#106856)!important;color:#fff!important;font:750 14px/1.3 system-ui,sans-serif!important;text-align:center!important;cursor:pointer!important;box-shadow:0 5px 14px #16785b26!important}"+
".zhixu-doctor .doctor-chat-cta:hover{filter:brightness(1.07);transform:translateY(-1px)}"+
".zhixu-doctor .doctor-chat-cta:focus-visible{outline:3px solid #70c7a7;outline-offset:3px}"+
".zhixu-doctor.doctor-has-art .doctor-profile{display:flex!important;flex-direction:column!important;align-items:stretch!important;gap:8px!important;padding:0!important}"+
".zhixu-doctor.doctor-has-art .doctor-portrait{width:100%!important;height:142px!important;border-radius:14px!important}"+
".zhixu-doctor.doctor-has-art .doctor-art{object-fit:cover!important;object-position:center 15%!important;transition:opacity .22s ease,transform .35s ease!important}"+
"#zx-doctor-speech{position:absolute;right:0;bottom:calc(100% + 12px);width:min(270px,calc(100vw - 24px));box-sizing:border-box;padding:13px 15px;border:1px solid #c8e1d3;border-radius:15px;background:#fbfffc;color:#214b3f;box-shadow:0 10px 30px #123a2420;font:600 14px/1.65 system-ui,sans-serif;opacity:0;visibility:hidden;transform:translateY(7px);transition:opacity .2s ease,transform .2s ease,visibility .2s;pointer-events:none}"+
"#zx-doctor-speech.visible{opacity:1;visibility:visible;transform:translateY(0)}"+
"#zx-doctor-speech:after{content:'';position:absolute;right:25px;bottom:-7px;width:12px;height:12px;background:#fbfffc;border-right:1px solid #c8e1d3;border-bottom:1px solid #c8e1d3;transform:rotate(45deg)}"+

".zhixu-doctor[data-collapsed=true]{width:226px!important;padding:14px!important}"+
".zhixu-doctor[data-collapsed=true] .doctor-profile{display:flex!important;flex-direction:column!important;align-items:stretch!important;padding:0!important}"+
".zhixu-doctor[data-collapsed=true] .doctor-portrait{width:100%!important;height:142px!important}"+
".zhixu-doctor[data-collapsed=true] .doctor-heading strong{font-size:20px!important}"+
".zhixu-doctor[data-collapsed=true] .doctor-state{display:flex!important}"+
"@media(max-width:1099px){.zhixu-doctor,.zhixu-doctor[data-collapsed=true]{top:auto!important;bottom:14px!important;right:14px!important;width:218px!important;padding:11px!important}.zhixu-doctor.doctor-has-art .doctor-profile,.zhixu-doctor[data-collapsed=true] .doctor-profile{display:grid!important;grid-template-columns:54px minmax(0,1fr)!important;align-items:center!important;gap:10px!important}.zhixu-doctor .doctor-portrait,.zhixu-doctor.doctor-has-art .doctor-portrait,.zhixu-doctor[data-collapsed=true] .doctor-portrait{width:54px!important;height:61px!important;border-radius:12px!important}.zhixu-doctor .doctor-heading,.zhixu-doctor.doctor-has-art .doctor-heading{text-align:left!important}.zhixu-doctor .doctor-heading strong,.zhixu-doctor[data-collapsed=true] .doctor-heading strong{font-size:16px!important}.zhixu-doctor .doctor-state{margin:8px 0 10px!important}}"+
"@media(max-width:560px){.zhixu-doctor,.zhixu-doctor[data-collapsed=true]{right:9px!important;bottom:8px!important;width:218px!important;max-width:calc(100vw - 18px)!important}}";
document.head.appendChild(css);
function applyDoctorExpression(state){
 const valid=new Set(['analyzing','encouraging','explaining','fallback','idle','planning','success','teaching','thinking','warning','welcome']);
 const root=document.querySelector('.zhixu-doctor'),art=root?.querySelector('#doctor-art');
 if(!root||!art||!valid.has(state))return;
 if(art.dataset.chatExpression===state&&root.dataset.expression===state)return;
 root.dataset.chatMood=state;root.dataset.expression=state;art.dataset.chatExpression=state;
 const next='./assets/zhixu-doctor/'+state+'.webp';
 art.style.opacity='0';
 const probe=new Image();probe.onload=()=>{art.src=next;requestAnimationFrame(()=>{art.style.opacity='1'})};probe.onerror=()=>{art.style.opacity='1'};probe.src=next;
}
let doctorSpeechTimer=0,doctorSpeechCount=0,lastSpeechKey='',lastSpeechAt=0;
function doctorCue(){
 const visible=e=>!!e&&!e.hidden&&!e.classList.contains('hidden')&&e.getClientRects().length>0;
 const home=document.getElementById('zx-home-screen'),step=document.querySelector('.rail .nav-item.active')?.dataset.step||'1';
 if(home&&!home.hidden)return {key:'home',text:'选择「新手引导」或「自由探索」，直接开始。',mood:'welcome'};
 if(step==='4'||visible(document.getElementById('transfer'))||visible(document.getElementById('post-check')))return {key:'transfer',text:'换一道新题检验你的解释，别只复述刚才的答案。',mood:'planning'};
 if(visible(document.getElementById('results')))return {key:'results',text:'先找出两条轨迹开始分离的位置，再解释原因。',mood:'analyzing'};
 const prediction=document.getElementById('prediction-input');
 if(prediction?.value?.trim())return {key:'prediction-written',text:'预测已经写下。运行实验后，再根据证据修正想法。',mood:'encouraging'};
 if(step==='1')return {key:'pretest',text:'先独立完成前测，不必急着寻找标准答案。',mood:'welcome'};
 return {key:'prediction',text:'先写下预测，再运行实验。',mood:'encouraging'};
}
function hideDoctorSpeech(){
 const bubble=document.getElementById('zx-doctor-speech');if(bubble)bubble.classList.remove('visible');
 clearTimeout(doctorSpeechTimer);
}
function showDoctorSpeech(root,cue,force=false){
 const chat=document.getElementById('zx-chat');
 if(chat?.classList.contains('open'))return;
 if(document.getElementById('zx-intro')?.classList.contains('open'))return;
 let bubble=document.getElementById('zx-doctor-speech');
 if(!bubble){bubble=document.createElement('div');bubble.id='zx-doctor-speech';bubble.setAttribute('role','status');bubble.setAttribute('aria-live','polite');root.appendChild(bubble);}
 if(cue.key===lastSpeechKey)return;
 if(bubble.classList.contains('visible')&&!force)return;
 if(!force&&Date.now()-lastSpeechAt<2500)return;
 lastSpeechKey=cue.key;lastSpeechAt=Date.now();doctorSpeechCount++;
 bubble.textContent=cue.text;bubble.classList.add('visible');applyDoctorExpression(cue.mood);
 clearTimeout(doctorSpeechTimer);
 doctorSpeechTimer=setTimeout(()=>{bubble.classList.remove('visible');if(!chat?.classList.contains('open'))applyDoctorExpression('idle')},7600);
}
function scheduleDoctorSpeech(root,force=false){if(doctorSpeechCount>=5)return;showDoctorSpeech(root,doctorCue(),force)}
document.addEventListener('academy:doctor-expression',e=>{
 if(document.getElementById('zx-chat')?.classList.contains('open'))hideDoctorSpeech();
 applyDoctorExpression(e.detail?.state);
});


function setStatus(root,detail){const ai=window.ZHIXU_PAGES_AI;let connected=ai?.status?.()===true,brand=detail?.provider||'DeepSeek';if(typeof detail==='object'&&detail){connected=detail.mentorMode==='llm-configured'&&!!detail.providerVerified;brand=detail.provider||'DeepSeek'}const label=root.querySelector('#doctor-status'),light=root.querySelector('#doctor-light'),pending=ai?.state?.()==='saved-unverified',next=connected?'AI 已连接 · '+brand:pending?'AI 待验证 · '+brand:'AI 未连接（'+brand+'）';if(label&&label.textContent!==next)label.textContent=next;if(light)light.classList.toggle('live',connected);root.dataset.connected=String(connected);root.dataset.provider=brand}
function bind(root){
 if(root.dataset.simpleDoctorBound==='true') return;
 root.dataset.simpleDoctorBound='true';
 const state=root.querySelector('.doctor-state');
 if(!state) return;
 const button=document.createElement('button');
 button.type='button';
 button.className='doctor-chat-cta';
 button.textContent='和博士对话  →';
 button.setAttribute('aria-haspopup','dialog');
 button.setAttribute('aria-label','打开知序博士对话框');
 state.insertAdjacentElement('afterend',button);
 button.addEventListener('click',()=>{
  const panel=document.getElementById('zx-chat');
  if(panel){
   panel.classList.add('open');
   document.dispatchEvent(new CustomEvent('academy:doctor-expression',{detail:{state:'welcome'}}));
   const input=document.getElementById('zx-input');
   if(input) input.focus();
  } else {
   const avatar=root.querySelector('.doctor-portrait');
   if(avatar) avatar.click();
  }
 });
 setStatus(root);
 root.addEventListener('pointerenter',()=>{if(!document.getElementById('zx-chat')?.classList.contains('open')&&!document.getElementById('zx-doctor-speech')?.classList.contains('visible'))applyDoctorExpression('welcome')});
 root.addEventListener('pointerleave',()=>{if(!document.getElementById('zx-chat')?.classList.contains('open')&&!document.getElementById('zx-doctor-speech')?.classList.contains('visible'))applyDoctorExpression('idle')});
 const cueClick='#zx-intro-go,#zx-guided,#zx-free,#run,#grade,#focus-next,#approve-plan';
 document.addEventListener('click',e=>{if(e.target.closest?.(cueClick))setTimeout(()=>scheduleDoctorSpeech(root,true),1200)});
 document.addEventListener('input',e=>{if(e.target?.id==='prediction-input'&&e.target.value.trim())setTimeout(()=>scheduleDoctorSpeech(root,true),900)});
 setTimeout(()=>scheduleDoctorSpeech(root),3600);
 document.addEventListener('academy:model-status',e=>setStatus(root,e.detail));
 document.addEventListener('academy:pages-provider-updated',()=>setStatus(root));
 // Idle art stays calm; meaningful interactions and short teaching cues drive expression changes.
 const label=root.querySelector('#doctor-status');
 if(label){
  const observer=new MutationObserver(()=>{
   const ai=window.ZHIXU_PAGES_AI;
   if(ai && typeof ai.status==='function' && ai.status()===true){
    if(label.textContent!=='AI 已连接 · '+(root.dataset.provider||'DeepSeek')) setStatus(root);
   } else {
    const brand=root.dataset.provider||'DeepSeek';const expected=ai && typeof ai.state==='function' && ai.state()==='saved-unverified'?'AI 待验证 · '+brand:'AI 未连接（'+brand+'）';
    if(label.textContent!==expected) setStatus(root);
   }
  });
  observer.observe(label,{childList:true,characterData:true,subtree:true});
 }
}
const find=()=>{const root=document.querySelector('.zhixu-doctor');if(root){bind(root);return true}return false};if(!find()){const obs=new MutationObserver(()=>{if(find())obs.disconnect()});obs.observe(document.documentElement,{childList:true,subtree:true})}
})();