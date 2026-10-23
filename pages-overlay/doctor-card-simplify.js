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
".zhixu-doctor.doctor-has-art .doctor-art{object-fit:cover!important;object-position:center 15%!important}"+
".zhixu-doctor[data-collapsed=true]{width:226px!important;padding:14px!important}"+
".zhixu-doctor[data-collapsed=true] .doctor-profile{display:flex!important;flex-direction:column!important;align-items:stretch!important;padding:0!important}"+
".zhixu-doctor[data-collapsed=true] .doctor-portrait{width:100%!important;height:142px!important}"+
".zhixu-doctor[data-collapsed=true] .doctor-heading strong{font-size:20px!important}"+
".zhixu-doctor[data-collapsed=true] .doctor-state{display:flex!important}"+
"@media(max-width:1099px){.zhixu-doctor,.zhixu-doctor[data-collapsed=true]{top:auto!important;bottom:14px!important;right:14px!important;width:218px!important;padding:11px!important}.zhixu-doctor.doctor-has-art .doctor-profile,.zhixu-doctor[data-collapsed=true] .doctor-profile{display:grid!important;grid-template-columns:54px minmax(0,1fr)!important;align-items:center!important;gap:10px!important}.zhixu-doctor .doctor-portrait,.zhixu-doctor.doctor-has-art .doctor-portrait,.zhixu-doctor[data-collapsed=true] .doctor-portrait{width:54px!important;height:61px!important;border-radius:12px!important}.zhixu-doctor .doctor-heading,.zhixu-doctor.doctor-has-art .doctor-heading{text-align:left!important}.zhixu-doctor .doctor-heading strong,.zhixu-doctor[data-collapsed=true] .doctor-heading strong{font-size:16px!important}.zhixu-doctor .doctor-state{margin:8px 0 10px!important}}"+
"@media(max-width:560px){.zhixu-doctor,.zhixu-doctor[data-collapsed=true]{right:9px!important;bottom:8px!important;width:218px!important;max-width:calc(100vw - 18px)!important}}";
document.head.appendChild(css);
function setStatus(root,detail){const ai=window.ZHIXU_PAGES_AI;let connected=ai?.status?.()===true;if(typeof detail==='object'&&detail)connected=detail.mentorMode==='llm-configured'&&!!detail.providerVerified;const label=root.querySelector('#doctor-status'),light=root.querySelector('#doctor-light');if(label)label.textContent=connected?'AI 已连接':ai?.state?.()==='saved-unverified'?'AI 待验证':'AI 未连接';if(light)light.classList.toggle('live',connected);root.dataset.connected=String(connected)}
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
   const input=document.getElementById('zx-input');
   if(input) input.focus();
  } else {
   const avatar=root.querySelector('.doctor-portrait');
   if(avatar) avatar.click();
  }
 });
 setStatus(root);
 document.addEventListener('academy:model-status',e=>setStatus(root,e.detail));
 document.addEventListener('academy:pages-provider-updated',()=>setStatus(root));
 const label=root.querySelector('#doctor-status');
 if(label){
  const observer=new MutationObserver(()=>{
   const ai=window.ZHIXU_PAGES_AI;
   if(ai && typeof ai.status==='function' && ai.status()===true){
    if(label.textContent!=='AI 已连接') setStatus(root);
   } else {
    const expected=ai && typeof ai.state==='function' && ai.state()==='saved-unverified'?'AI 待验证':'AI 未连接';
    if(label.textContent!==expected) setStatus(root);
   }
  });
  observer.observe(label,{childList:true,characterData:true,subtree:true});
 }
}
const find=()=>{const root=document.querySelector('.zhixu-doctor');if(root){bind(root);return true}return false};if(!find()){const obs=new MutationObserver(()=>{if(find())obs.disconnect()});obs.observe(document.documentElement,{childList:true,subtree:true})}
})();