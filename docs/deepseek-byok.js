(function(){
'use strict';
const $=id=>document.getElementById(id);
let sessionKey='',validated=false,requests=0,busy=false;
const endpoint='https://api.deepseek.com/v1/chat/completions';
const safetyText='模型输出仅作学习建议，不代替真实科学计算，不自动批准或执行实验。';
function text(id,v){$(id).textContent=v}
async function ask(messages,limit=330){
 if(!sessionKey)throw Error('当前会话没有 API Key');
 if(busy)throw Error('已有请求进行中');
 if(requests>=12)throw Error('本页最多 12 次请求，请刷新后重新配置');
 busy=true;
 const aborter=new AbortController();const timer=setTimeout(()=>aborter.abort(),22000);
 try{
  const response=await fetch(endpoint,{method:'POST',mode:'cors',headers:{'Content-Type':'application/json','Authorization':'Bearer '+sessionKey},
   body:JSON.stringify({model:'deepseek-chat',messages,max_tokens:limit,temperature:.35}),signal:aborter.signal,cache:'no-store'});
  if(!response.ok)throw Error('DeepSeek 返回 HTTP '+response.status+'；检查密钥、账户权限和网络');
  const json=await response.json();
  const answer=json.choices?.[0]?.message?.content;
  if(!answer)throw Error('模型未返回可读内容');
  requests++;return {answer,model:json.model||'deepseek-chat',usage:json.usage?.total_tokens??null};
 }finally{clearTimeout(timer);busy=false}
}
$('ds-connect').onclick=async()=>{
 const key=$('ds-key').value.trim();
 if(!key){text('ds-status','请先填写你的 DeepSeek Key。');return}
 sessionKey=key;$('ds-key').value='';validated=false;
 text('ds-status','正在向 DeepSeek 官方 API 发起真实连通测试……');
 try{
  const result=await ask([{role:'user',content:'请回复四个字：连接成功'}],20);
  validated=true;
  text('ds-status','真实连接成功 · '+result.model+' · 本次消耗 Token：'+(result.usage??'未提供')+'。密钥仅保留在此标签页内存。');
  $('ds-use').disabled=false;
  $('ai-mentor').classList.remove('hidden');
  $('ds-model-tag').textContent='DeepSeek · 已通过真实请求测试';
 }catch(err){sessionKey='';text('ds-status','连接失败：'+String(err.message));$('ds-use').disabled=true}
};
$('ds-clear').onclick=()=>{sessionKey='';validated=false;$('ds-key').value='';$('ds-use').disabled=true;text('ds-status','此标签页的密钥已清除；不保存到本地存储。');text('ds-model-tag','DeepSeek · 当前未接入')};
$('ds-use').onclick=async()=>{
 if(!validated||!sessionKey){text('ds-response','请先成功测试连接。');return}
 const refl=$('reflection-text').value.trim(),prediction=$('prediction-text').value.trim();
 if(!refl||!prediction||!window.ZHIXU_SCIENCE_RESULT){text('ds-response','请先实际完成预测、实验和反思。');return}
 if(!$('ds-consent').checked){text('ds-response','必须勾选本次授权，才会将必要的学习摘要发给 DeepSeek。');return}
 const result=window.ZHIXU_SCIENCE_RESULT;
 const payload={kind:'simulated-student-science',prediction,reflection:refl,
  parameters:result.params,n43Diff:result.n43};
 text('ds-response','正在等待 DeepSeek 的真实回复……');
 $('ds-use').disabled=true;
 try{
  const x=await ask([{role:'system',content:'你是大学理工科苏格拉底式科学导师。根据提供的真实实验数据指出预测与证据差异，提出一个可由学生批准的下一步验证建议，不允许声称你已自动执行实验。输出120字以内中文。'},
  {role:'user',content:JSON.stringify(payload)}],290);
  text('ds-response',x.answer+'\n\n模型：'+x.model+'；Token：'+(x.usage??'未提供')+'。'+safetyText);
 }catch(err){text('ds-response','AI 请求失败：'+err.message+'。本地科学结果不受影响。')}
 finally{$('ds-use').disabled=false;$('ds-consent').checked=false}
};
window.addEventListener('pagehide',()=>{sessionKey='';validated=false});
})();