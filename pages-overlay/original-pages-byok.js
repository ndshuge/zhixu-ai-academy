(()=>{'use strict';
const style=document.createElement('style');style.textContent=`
#pages-ai-open{position:fixed;right:22px;bottom:20px;z-index:9997;background:#126568;color:#fff;border:2px solid #b4f4dc;border-radius:14px;padding:12px 18px;font:700 14px "Microsoft YaHei",sans-serif;box-shadow:0 8px 28px #0004;cursor:pointer}
#pages-ai-dialog{position:fixed;z-index:9998;inset:0;display:none;background:#05141aba;align-items:center;justify-content:center;padding:15px}
#pages-ai-dialog[data-open=true]{display:flex}
#pages-ai-card{width:min(680px,100%);max-height:94vh;overflow:auto;background:#f6faf8;border:2px solid #317a7b;border-radius:19px;padding:24px;color:#183b43;box-shadow:0 30px 70px #0008;font:15px/1.7 "Microsoft YaHei",sans-serif}
#pages-ai-card select{display:block;width:100%;padding:10px;border:1px solid #6c999d;border-radius:9px;background:#fff;color:#12343a;font:inherit;margin:9px 0}#pages-ai-card input[type=password],#pages-ai-card textarea{display:block;width:100%;box-sizing:border-box;min-height:44px;padding:12px;background:#fff;color:#122f34;border:1px solid #6c999d;border-radius:9px;margin:10px 0;font:inherit}
#pages-ai-card textarea{min-height:72px}
#pages-ai-card button{margin:6px;padding:9px 13px;border-radius:8px;border:1px solid #186c6e;background:#166f6b;color:white;font:inherit;cursor:pointer}
#pages-ai-status,#pages-ai-reply{white-space:pre-wrap;background:#e1eeeb;border-radius:8px;padding:12px;margin-top:10px;max-height:300px;overflow:auto}
#pages-ai-card h2{margin:0 0 10px;font-size:23px}
#pages-ai-card label{display:block;font-size:14px;margin:12px 0 5px}
`;document.head.appendChild(style);
const launch=document.createElement('button');launch.id='pages-ai-open';launch.textContent='连接 DeepSeek API';launch.type='button';
const modal=document.createElement('div');modal.id='pages-ai-dialog';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-label','DeepSeek API 设置');
modal.innerHTML=`<div id="pages-ai-card"><h2>知序 AI 学院 · DeepSeek</h2>
<p>你可以在这里填入自己的官方 DeepSeek API Key，进行真实在线模型测试，并在明确授权后请求导师建议。默认仅在当前页面内存使用；只有你主动勾选「记住 API Key」时才会以明文形式存入此浏览器 localStorage。密钥不会提交到 GitHub 或知序自己的服务器。</p>
<label for="pages-ai-key">DeepSeek 官方 API Key</label><input id="pages-ai-key" type="password" placeholder="在这里填 Key" autocomplete="off" spellcheck="false">
<label for="pages-ai-model">DeepSeek 模型</label>
<select id="pages-ai-model" aria-label="选择 DeepSeek 模型"><option value="deepseek-flash">DeepSeek Flash（推荐，快速）</option><option value="deepseek-v4-pro">DeepSeek V4 Pro（更强推理）</option></select>
<label id="pages-ai-save-row"><input id="pages-ai-save" type="checkbox"> 在此浏览器记住 API Key（仅在个人受信任的设备勾选）</label>
<small id="pages-ai-save-warning">保存后密钥会以可读取形式留在此站点的浏览器本地存储（localStorage），关闭浏览器后仍存在。浏览器扩展、同源脚本及能使用此浏览器的人可能访问它；不要在公共电脑勾选。下次进入仍需点击“测试真实连接”才能启用 AI，不会自动产生费用。</small>
<button id="pages-ai-test" type="button">连接并启用 AI</button><button id="pages-ai-clear" type="button">清除密钥及浏览器保存</button><button id="pages-ai-close" type="button">关闭</button>
<div id="pages-ai-status" role="status">尚未接入 · 本页保留原版 UI 和知序博士。GitHub Pages 不运行原版 Node API，原版后台功能需单独部署。</div>
<div id="pages-ai-mentor" hidden><h3>真实 DeepSeek 导师答疑</h3><textarea id="pages-ai-question" placeholder="输入你要问博士的科学问题；建议先完成页面上的科学实验。"></textarea>
<p id="pages-ai-data-note">点「请博士解答」或「规划验证」时，才会将本次输入直接发送给 DeepSeek；不会发给 GitHub。关闭 AI 连接后不再调用模型。</p>
<button id="pages-ai-plan" type="button">请博士规划下一轮验证</button><button id="pages-ai-ask" type="button">请博士分析</button><div id="pages-ai-reply">等待提问。</div></div>
<small>使用浏览器直连方式。公共设备、恶意浏览器扩展或浏览器开发工具可能读取输入的密钥；避免在不信任的设备上使用。</small></div>`;
document.body.append(launch,modal);
const $=id=>document.getElementById(id);let key='',verified=false,busy=false,requestCount=0;
let lastFailure='';
function modelState(){return verified?'verified':key?'saved-unverified':'unconfigured'}
const STORE_KEY='zhixu-ai-academy-deepseek-key-v1';
function storedKey(){
 try{const v=JSON.parse(localStorage.getItem(STORE_KEY)||'null');
  return v?.provider==='deepseek'&&typeof v.key==='string'&&v.key.length>=8?v:''}
 catch{return ''}
}
function persistChoice(){
 try{
  if($('pages-ai-save').checked&&key){
   localStorage.setItem(STORE_KEY,JSON.stringify({version:1,provider:'deepseek',model:$('pages-ai-model').value,key,savedAt:new Date().toISOString()}));
  }else localStorage.removeItem(STORE_KEY);
  return true;
 }catch{
  $('pages-ai-save').checked=false;
  set('pages-ai-status','此浏览器无法安全完成本地保存。当前会话仍可使用 Key。');
  return false;
 }
}
const restoredKey=storedKey();
const allowedModels=new Set(['deepseek-flash','deepseek-v4-pro']);
if(restoredKey){
 key=restoredKey.key;
 if(allowedModels.has(restoredKey.model))$('pages-ai-model').value=restoredKey.model;
 $('pages-ai-save').checked=true;
 $('pages-ai-status').textContent='已保存 DeepSeek Key，但尚未在本次页面验证连接。点击「连接并启用 AI」后才能使用，当前并非 AI 已接入。';
}
$('pages-ai-save').addEventListener('change',()=>{
 if($('pages-ai-save').checked){
  if(key&&verified){if(persistChoice())set('pages-ai-status','已将当前有效 Key 保存在此浏览器。其它同源脚本或扩展可能读取，请仅在受信任设备使用。')}
  else set('pages-ai-status','勾选后，待连接测试成功才会保存；若这是公共电脑，请取消勾选。');
 }else{
  try{localStorage.removeItem(STORE_KEY)}catch{}
  set('pages-ai-status',verified?'已停止保存并清除之前保存的 Key；本标签页的已验证连接仍可使用至离开。':'已取消浏览器保存。');
 }
});
const maxRequestsPerTab=12;
let activeModel='deepseek-flash';
$('pages-ai-model').addEventListener('change',()=>{
 verified=false;activeModel=$('pages-ai-model').value;
 announceStatus();
 $('pages-ai-mentor').hidden=true;
 launch.textContent='连接 DeepSeek API';
 set('pages-ai-status','已切换模型，请重新点击“测试真实连接”确认此模型可用。');
});
function announceStatus(){
 window.dispatchEvent(new Event('focus'));
 document.dispatchEvent(new CustomEvent('academy:pages-provider-updated',{detail:{verified,state:modelState(),provider:verified?'DeepSeek':null,used:requestCount,model:verified?activeModel:null}}));
}
launch.onclick=()=>{modal.dataset.open='true';$('pages-ai-key').focus()};$('pages-ai-close').onclick=()=>{modal.dataset.open='false'};modal.addEventListener('click',e=>{if(e.target===modal)modal.dataset.open='false'});
const set=(id,t)=>{$(id).textContent=t};
async function call(messages,max_tokens=200){
 if(key&&!/^sk-[A-Za-z0-9_-]{16,}$/.test(key))throw Error('密钥格式包含无效字符，请清除并粘贴正确的 sk- Key');
 if(!key)throw Error('未填写 API Key');if(busy)throw Error('正在请求');if(requestCount>=maxRequestsPerTab)throw Error('本标签页真实模型请求已达12次，请重新打开标签页');busy=true;
 const ctrl=new AbortController(),clock=setTimeout(()=>ctrl.abort(),25000);
 try{const r=await fetch('https://api.deepseek.com/chat/completions',{method:'POST',mode:'cors',cache:'no-store',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},signal:ctrl.signal,body:JSON.stringify({model:$('pages-ai-model').value,messages,max_tokens,temperature:.4})});if(!r.ok)throw Error('HTTP '+r.status+'，请检查密钥、额度和网络');const j=await r.json();const reply=j.choices?.[0]?.message?.content;if(!reply)throw Error('响应中没有模型文字');requestCount++;return {reply,model:j.model||$('pages-ai-model').value,usage:j.usage?.total_tokens??null}}catch(e){if(verified){verified=false;lastFailure=String(e.message||e);announceStatus();launch.textContent='连接 DeepSeek API';$('pages-ai-mentor').hidden=true;set('pages-ai-status','模型请求失败，已停止展示 AI 已连通。请重新验证连接：'+lastFailure);}throw e}finally{clearTimeout(clock);busy=false}
}
function doctor(mode,message){const art=$('doctor-art'),st=$('doctor-status'),msg=$('doctor-message'),model=$('doctor-model-name');if(art)art.src='./assets/zhixu-doctor/'+(mode==='success'?'success':mode==='thinking'?'thinking':'warning')+'.webp';if(st)st.textContent=mode==='success'?'DeepSeek 已验证':'DeepSeek 正在分析';if(msg)msg.textContent=message;if(model)model.textContent='DeepSeek / '+activeModel}
$('pages-ai-test').onclick=async()=>{
 const rawEntered=$('pages-ai-key').value.trim()||key;
 // Never construct an Authorization header from arbitrary clipboard prose.
 const tokens=[...rawEntered.matchAll(/(?:^|[^A-Za-z0-9_-])(sk-[A-Za-z0-9_-]{16,})(?=$|[^A-Za-z0-9_-])/g)].map(x=>x[1]);
 const entered=rawEntered.startsWith('sk-')&&/^sk-[A-Za-z0-9_-]{16,}$/.test(rawEntered)?rawEntered:(tokens.length===1?tokens[0]:'');
 if(!entered&&rawEntered){set('pages-ai-status','粘贴内容不是有效格式的 DeepSeek Key（应为英文 sk- 开头）。请只复制 API Key 本身，勿包含中文或说明文字。');return}
 if(!entered){set('pages-ai-status','请先输入 DeepSeek Key，或使用本浏览器此前保存的密钥');return}
 key=entered;$('pages-ai-key').value='';verified=false;announceStatus();set('pages-ai-status','正在请求 DeepSeek 官方模型……');
 try{const a=await call([{role:'user',content:'请只回答：连接成功'}],256);verified=true;activeModel=a.model;persistChoice();announceStatus();$('pages-ai-mentor').hidden=false;set('pages-ai-status','真实模型连接成功\n模型：'+a.model+'\n回复：'+a.reply+'\nToken：'+(a.usage??'未提供'));doctor('success','真实 DeepSeek 已连通。你可以授权发送问题让我分析。');launch.textContent='DeepSeek 已连通'}catch(e){verified=false;lastFailure=String(e.message||e);announceStatus();launch.textContent='连接 DeepSeek API';$('pages-ai-mentor').hidden=true;set('pages-ai-status','连接失败：'+(e.message||String(e))+'。密钥没有发送到 GitHub，可重试或清除本地保存。')}
};
$('pages-ai-ask').onclick=async()=>{if(!verified)return;const q=$('pages-ai-question').value.trim();if(q.length<3){set('pages-ai-reply','请先写下问题');return}
set('pages-ai-reply','博士正在请求 DeepSeek……');doctor('thinking','正在分析你的问题');
try{const a=await call([{role:'system',content:'你是知序 AI 学院的科学探究博士，解释简洁准确，必须区分数学事实与假说，绝不伪称已经运行实验。'}, {role:'user',content:q}],450);set('pages-ai-reply',a.reply+'\n\n真实模型：'+a.model+' · Token '+(a.usage??'未提供'));doctor('success','已完成真实 DeepSeek 在线答疑。')}catch(e){set('pages-ai-reply','请求失败：'+e.message)}finally{}
};
$('pages-ai-clear').onclick=()=>{key='';verified=false;try{localStorage.removeItem(STORE_KEY)}catch{}
 $('pages-ai-save').checked=false;announceStatus();$('pages-ai-key').value='';$('pages-ai-mentor').hidden=true;set('pages-ai-status','本标签页内存与此站点浏览器保存的 DeepSeek Key 均已清除。');launch.textContent='连接 DeepSeek API'};
document.getElementById('pages-ai-plan').onclick=async()=>{if(!verified){set('pages-ai-reply','请先完成模型连接测试');return;}const q=document.getElementById('pages-ai-question').value.trim();if(q.length<8){set('pages-ai-reply','请先输入至少八个字的验证目标');return;}set('pages-ai-reply','博士正在向 DeepSeek 生成科学验证方案……');doctor('thinking','正在规划下一步实验');try{const a=await call([{role:'system',content:'你是知序 AI 学院的科学博士。针对学生验证目标，仅提供候选对照实验方案，须包含目标、一个控制变量、可观测量、科学边界、学生批准要求。不能声称已执行任何实验。用中文简洁回答。'},{role:'user',content:q}],450);set('pages-ai-reply',a.reply+'\\n\\n此方案仅供审阅，未经学生批准绝不执行实验。\\n模型：'+a.model);doctor('success','已生成候选验证方案，等待学生审阅和批准。')}catch(e){set('pages-ai-reply','AI 规划失败：'+e.message)}finally{}};
if(new URLSearchParams(location.search).get('connect')==='1'){modal.dataset.open='true';}
window.ZHIXU_PAGES_AI={status:()=>verified,state:modelState,model:()=>activeModel,usage:()=>({used:requestCount,limit:maxRequestsPerTab}),ask:async(messages,limit=320)=>{if(!verified)throw new Error('必须先验证 DeepSeek 连接');try{return await call(messages,limit)}catch(e){verified=false;lastFailure=String(e.message||e);announceStatus();launch.textContent='连接 DeepSeek API';$('pages-ai-mentor').hidden=true;set('pages-ai-status','真实模型调用失败，已暂停 AI 并切回本地规则。请重新验证连接：'+lastFailure);throw e}}};
window.addEventListener('pagehide',()=>{key='';verified=false});
})();