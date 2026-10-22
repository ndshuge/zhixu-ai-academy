const $=id=>document.getElementById(id);
const presets={
 deepseek:{displayName:'DeepSeek',baseUrl:'https://api.deepseek.com/v1',model:'deepseek-chat'},
 glm:{displayName:'智谱 GLM',baseUrl:'https://open.bigmodel.cn/api/paas/v4',model:'glm-4-flash'},
 qwen:{displayName:'通义千问',baseUrl:'https://dashscope.aliyuncs.com/compatible-mode/v1',model:'qwen-plus'},
 custom:{displayName:'学校自有模型',baseUrl:'',model:''}
};
let adminToken='';
$('provider').addEventListener('change',()=>{
 const p=presets[$('provider').value];$('display-name').value=p.displayName;
 $('base-url').value=p.baseUrl;$('model').value=p.model;$('api-key').value='';
});
async function adminFetch(path,body){
 if(!adminToken)throw new Error('请先验证本机管理员口令');
 const options={method:body===undefined?'GET':'POST',headers:{'X-Academy-Admin':adminToken}};
 if(body!==undefined){options.headers['Content-Type']='application/json';options.body=JSON.stringify(body)}
 const res=await fetch(path,options),data=await res.json();
 if(!res.ok)throw new Error(data.error||'请求失败');
 return data;
}
function show(message,level='neutral'){
 const output=$('admin-status');output.textContent=message;output.className='status-value '+level;
}
function describe(s){
 return [
   s.configured?'已配置模型API · '+(s.verified?'连通性已成功验证':'尚未验证真实连通性'):'当前无模型API · 默认规则引导',
   '展示名称：'+(s.provider||'未设置'),'模型ID：'+(s.model||'未设置'),
   '配置来源：'+s.source,'API Base URL：'+(s.baseUrl||'未设置'),
   '密钥是否存在：'+(s.keyPresent?'是（不回显）':'否'),
   '今日请求：'+s.usedToday+' / '+s.dailyLimit,
   '已报告 Token 数：'+s.tokensToday,
   '失败次数：'+s.failedToday,
   '持久化方式：'+(s.credentialStorage==='server-memory-only'?'只在服务端内存，重启清除':s.credentialStorage)
 ].join('\n');
}
function sync(s){
 $('test-provider').disabled=!s.configured;
 $('clear-provider').disabled=!s.configured;
 $('daily-limit').value=s.dailyLimit;
 $('max-tokens').value=s.maxOutputTokens;
 if(s.configured){
  $('provider').value=s.providerCode;
  $('display-name').value=s.provider;
  $('model').value=s.model;
  $('base-url').value=s.baseUrl;
 }
 $('api-key').value='';
 show(describe(s),s.configured?'':'neutral');
}
async function unlock(){
 adminToken=$('admin-token').value.trim();
 if(!adminToken){$('unlock-state').textContent='未输入管理员口令';return}
 try{
  const s=await adminFetch('/api/admin/provider');
  $('unlock-state').textContent='身份验证通过；可以设置校方或演示方的模型。';
  $('admin-token').value='';
  sync(s);
 }catch(e){adminToken='';$('unlock-state').textContent='验证失败：'+e.message;show('尚未授权访问管理设置','error')}
}
$('unlock').addEventListener('click',unlock);
$('admin-token').addEventListener('keydown',e=>{if(e.key==='Enter')unlock()});
$('save-provider').addEventListener('click',async()=>{
 const payload={
  provider:$('provider').value,displayName:$('display-name').value,
  baseUrl:$('base-url').value,model:$('model').value,apiKey:$('api-key').value,
  dailyLimit:Number($('daily-limit').value),maxOutputTokens:Number($('max-tokens').value)
 };
 $('save-provider').disabled=true;
 try{const s=await adminFetch('/api/admin/provider',payload);sync(s);show(describe(s)+'\n\n已保存到服务器内存。现在可以测试连接。')}
 catch(e){show('保存失败：'+e.message,'error')}
 finally{$('save-provider').disabled=false;$('api-key').value=''}
});
$('test-provider').addEventListener('click',async()=>{
 if(!confirm('即将通过学校或演示方的API实际调用一次模型，可能产生少量Token费用。是否继续？'))return;
 $('test-provider').disabled=true;
 show('正在通过服务器测试真实模型请求。密钥不会出现在网页响应中……');
 try{
  const result=await adminFetch('/api/admin/provider/test',{});
  show('真实请求已成功返回。\n服务商：'+result.provider+'\n模型：'+result.model+
   '\n模型简短回复：'+result.reply+'\n本次上报Tokens：'+(result.usage.totalTokens??'提供商未上报')+
   '\n当日已请求：'+result.limits.usedToday+'/'+result.limits.dailyLimit);
 }catch(e){show('连接测试未通过：'+e.message,'error')}
 finally{$('test-provider').disabled=false}
});
$('clear-provider').addEventListener('click',async()=>{
 if(!confirm('停用模型会立刻清除服务端内存中的API Key，学生端将回退到规则教学。确定继续吗？'))return;
 try{const s=await adminFetch('/api/admin/provider/clear',{});sync(s);show(describe(s)+'\n密钥已从当前模型配置中清除。')}
 catch(e){show('停用失败：'+e.message,'error')}
});
