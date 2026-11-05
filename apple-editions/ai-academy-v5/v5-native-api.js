/* Zhixu V5 native BYOK. No Original iframe UI, localStorage or cookie credentials. */
import {enterSurface,exitSurface} from './v5-surface-continuity.js?v=20261105-continuous-b';
const allowedModels=new Set(['deepseek-flash','deepseek-v4-pro']);
let key='',model='deepseek-flash',connected=false,inFlight=false,count=0;
let lastTrigger=null,dialog=null,stat=null,input=null,connectButton=null,closingDialog=false;
const endpoint='https://api.deepseek.com/chat/completions';
const describe=(status,err)=>{
 if(status===401)return '401 · API Key 无效或被撤销。请在 DeepSeek 开放平台重新生成。';
 if(status===402)return '402 · API 账户余额不足，请检查开放平台账户。';
 if(status===429)return '429 · 请求过于频繁，请稍后重试。';
 if(status===400||status===422)return status+' · 请求参数被拒绝，请检查模型与密钥。';
 if(status===500||status===503||status>=500)return status+' · DeepSeek 服务暂不可用，请稍后重试。';
 if(err?.name==='AbortError')return '连接超时（25 秒），请检查网络或代理。';
 if(err)return '网络请求未成功：'+(err.message||'连接中断')+'。可检查移动网络、代理和跨域设置。';
 return '尚未连接。请输入 DeepSeek 官方 API Key 并主动测试。';
};
function renderStatus(text,kind='neutral'){
 if(stat){stat.textContent=text;stat.dataset.state=kind;}
 if(connectButton)connectButton.disabled=inFlight;
}
async function request(messages,max_tokens=220){
 if(!key||!allowedModels.has(model))throw Error('尚未配置有效 API Key 和模型');
 if(inFlight)throw Error('已有一项模型请求正在执行');
 if(count>=12)throw Error('本页面模型请求已达 12 次，请刷新页面后重新授权');
 inFlight=true;if(connectButton)connectButton.disabled=true;
 const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),25000);
 try{
  const r=await fetch(endpoint,{method:'POST',mode:'cors',cache:'no-store',signal:ctrl.signal,
   headers:{'Content-Type':'application/json',Authorization:'Bearer '+key},
   body:JSON.stringify({model,messages,max_tokens,temperature:0.4})});
  if(!r.ok)throw Object.assign(new Error('HTTP '+r.status),{status:r.status});
  const json=await r.json();
  const reply=json.choices?.[0]?.message?.content;
  if(typeof reply!=='string'||!reply.trim())throw Error('响应缺少模型正文');
  count++;return {reply,model:json.model||model,usage:json.usage?.total_tokens??null};
 }catch(err){
  connected=false;
  renderStatus(describe(err.status||0,err),'error');
  throw err;
 }finally{clearTimeout(timer);inFlight=false;if(connectButton)connectButton.disabled=false}
}
function revoke(){
 key='';connected=false;
 if(input)input.value='';
 renderStatus('已断开连接；当前页面内存中的 API Key 已清除。','neutral');
}
function close(){
 if(!dialog||closingDialog)return;
 const leaving=dialog,returnFocus=lastTrigger;
 if(input)input.value='';
 closingDialog=true;
 exitSurface(leaving,{done:()=>{
  if(dialog!==leaving||!closingDialog)return;
  leaving.remove();dialog=null;stat=null;input=null;connectButton=null;
  closingDialog=false;
  if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});
 }});
}
function open(trigger){
 lastTrigger=trigger||document.activeElement;
 if(dialog){
  if(closingDialog){
   closingDialog=false;
   enterSurface(dialog);
   dialog.querySelector('.zx-api-close')?.focus({preventScroll:true});
  }else dialog.querySelector('.zx-api-close')?.focus({preventScroll:true});
  return;
 }
 const shade=document.createElement('div');shade.className='modal-shade zx-api-shade';
 shade.innerHTML=`<section class="modal zx-api-panel" role="dialog" aria-modal="true" aria-labelledby="zx-api-title" aria-describedby="zx-api-subtitle">
  <div class="zx-api-header"><div><p class="eyebrow">模型与数据</p><h2 id="zx-api-title">连接 DeepSeek</h2>
  <p id="zx-api-subtitle">仅使用 DeepSeek 开放平台 API Key。密钥仅存于本页内存；不会传入科学引擎或浏览器本地存储。</p></div><button type="button" class="zx-api-close" aria-label="关闭连接设置">×</button></div>
  <label class="zx-api-label" for="zx-native-key">官方 API Key</label>
  <input id="zx-native-key" type="password" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="sk-••••••••" />
  <label class="zx-api-label" for="zx-native-model">使用模型</label>
  <select id="zx-native-model"><option value="deepseek-flash">DeepSeek Flash · 响应更快</option><option value="deepseek-v4-pro">DeepSeek V4 Pro · 深度推理</option></select>
  <p class="zx-api-status" role="status" aria-live="polite"></p>
  <div class="zx-api-actions"><button type="button" class="primary zx-api-connect">连接并验证</button><button type="button" class="secondary zx-api-revoke">断开并清除</button></div>
  <p class="zx-api-help">测试连接会向 DeepSeek 发送一条简短请求，可能产生少量 Token 费用。<a href="https://platform.deepseek.com/" target="_blank" rel="noopener noreferrer">管理密钥与余额 ↗</a></p>
 </section>`;
 document.querySelector('#dialog-layer').appendChild(shade);dialog=shade;enterSurface(shade,lastTrigger);
 stat=shade.querySelector('.zx-api-status');input=shade.querySelector('#zx-native-key');connectButton=shade.querySelector('.zx-api-connect');
 shade.querySelector('#zx-native-model').value=model;
 renderStatus(connected?'已验证连接 · '+model+'。当前页面可向博士提问。':describe(0),'ok');
 if(innerWidth<=700)shade.querySelector('.zx-api-close').focus({preventScroll:true});else input.focus();
 shade.querySelector('.zx-api-close').addEventListener('click',close);
 shade.querySelector('.zx-api-revoke').addEventListener('click',revoke);
 shade.querySelector('#zx-native-model').addEventListener('change',e=>{model=e.target.value;connected=false;renderStatus('模型已切换，请重新验证连接。')});
 shade.querySelector('.zx-api-connect').addEventListener('click',async()=>{
  const entered=input.value.trim();
  if(entered){
   if(!/^sk-[A-Za-z0-9_-]{16,}$/.test(entered)){renderStatus('密钥格式不正确：请粘贴 sk- 开头的完整官方 API Key。','error');return}
   key=entered;input.value='';
  }
  if(!key){renderStatus('请先输入 DeepSeek 开放平台的 API Key。','error');return}
  connected=false;renderStatus('正在验证真实 DeepSeek 连接…');
  try{const result=await request([{role:'user',content:'请只回答：连接成功'}],48);connected=true;renderStatus('连接成功 · '+result.model+(result.usage===null?'':' · '+result.usage+' Token'),'ok')}
  catch{} // request() already renders sanitized, actionable error status.
 });
 shade.addEventListener('click',e=>{if(e.target===shade)close()});
 shade.addEventListener('keydown',e=>{
  if(e.key==='Escape'){e.preventDefault();close();return}
  if(e.key==='Tab'){
   const nodes=[...shade.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),a[href]')];
   const i=nodes.indexOf(document.activeElement);
   if(e.shiftKey&&i===0){e.preventDefault();nodes.at(-1)?.focus()}
   else if(!e.shiftKey&&i===nodes.length-1){e.preventDefault();nodes[0]?.focus()}
  }
 });
}
export const nativeApi={
 open,close,revoke,
 status:()=>connected,
 ask:async(messages,limit=430)=>{if(!connected)throw Error('请先在设置中验证 DeepSeek 连接');return request(messages,limit)}
};
window.ZHIXU_NATIVE_API=nativeApi;
window.addEventListener('pagehide',()=>{key='';connected=false});
