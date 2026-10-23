const $=id=>document.getElementById(id);
const presets={
 deepseek:{displayName:'DeepSeek',baseUrl:'https://api.deepseek.com/v1',model:'deepseek-chat'},
 glm:{displayName:'智谱 GLM',baseUrl:'https://open.bigmodel.cn/api/paas/v4',model:'glm-4-flash'},
 qwen:{displayName:'通义千问',baseUrl:'https://dashscope.aliyuncs.com/compatible-mode/v1',model:'qwen-plus'},
 custom:{displayName:'自定义模型',baseUrl:'',model:''}
};
function show(message,state='neutral'){
 $('connection-state').textContent=message;$('connection-state').dataset.state=state;
}
function sync(s){
 $('test').disabled=!s.configured;$('clear').disabled=!s.configured;
 if(s.configured){
  $('provider').value=s.providerCode;
  $('display-name').value=s.provider;
  $('model').value=s.model;
  $('base-url').value=s.baseUrl;
  $('daily-limit').value=s.dailyLimit;
  $('max-tokens').value=s.maxOutputTokens;
 }
 $('api-key').value='';
 show(s.configured?
  (s.verified?'连接已验证':'配置已保存，等待真实连接测试')+
  '\n服务商：'+s.provider+'\n模型：'+s.model+
  '\n已调用：'+s.usedToday+' / '+s.dailyLimit+
  '\n已用 Token：'+s.tokensToday+
  '\nAPI 密钥：保存在本次服务端会话内，不回显':
  '本浏览器尚未配置个人模型。\n你可以使用 DeepSeek 官方 API，或返回课堂体验科学实验。');
}
async function api(path,body){
 const options={cache:'no-store',credentials:'same-origin'};
 if(body!==undefined){options.method='POST';options.headers={'Content-Type':'application/json'};options.body=JSON.stringify(body)}
 const res=await fetch(path,options),data=await res.json();
 if(!res.ok)throw new Error(data.error||'请求失败（HTTP '+res.status+'）');
 return data;
}
$('provider').addEventListener('change',()=>{
 const p=presets[$('provider').value];
 $('display-name').value=p.displayName;$('base-url').value=p.baseUrl;
 $('model').value=p.model;$('api-key').value='';
});
$('save').addEventListener('click',async()=>{
 const btn=$('save');btn.disabled=true;
 try{
  const info=await api('/api/connect/provider',{
   provider:$('provider').value,displayName:$('display-name').value,
   baseUrl:$('base-url').value,model:$('model').value,
   apiKey:$('api-key').value,dailyLimit:Number($('daily-limit').value),
   maxOutputTokens:Number($('max-tokens').value)
  });
  sync(info);
 }catch(e){show('保存失败：'+e.message,'error');$('api-key').value=''}
 finally{btn.disabled=false}
});
$('test').addEventListener('click',async()=>{
 if(!confirm('即将真实调用一次所选模型的 API，可能产生少量费用。确认测试？'))return;
 $('test').disabled=true;show('正在向模型提供商发送最小连通性请求……');
 try{
  const data=await api('/api/connect/provider/test',{});
  show('连接成功\n服务商：'+data.provider+'\n模型：'+data.model+
    '\n模型回复：'+data.reply+
    '\n本次 Token：'+(data.usage.totalTokens??'提供商未报告')+
    '\n今日调用：'+data.limits.usedToday+' / '+data.limits.dailyLimit);
 }catch(e){show('连接失败：'+e.message+'\n请核对密钥、模型权限、服务余额和网络连接。','error')}
 finally{$('test').disabled=false}
});
$('clear').addEventListener('click',async()=>{
 if(!confirm('清除本浏览器的模型配置与服务端密钥？此操作不会清除学校管理员配置。'))return;
 try{await api('/api/connect/provider/clear',{});sync({configured:false})}
 catch(e){show('清除失败：'+e.message,'error')}
});
api('/api/connect/provider').then(sync).catch(e=>show('状态获取失败：'+e.message,'error'));
