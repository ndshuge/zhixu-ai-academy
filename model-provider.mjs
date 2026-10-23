import {randomBytes,randomUUID,timingSafeEqual} from 'node:crypto';

const defaults={
  deepseek:{name:'DeepSeek',baseUrl:'https://api.deepseek.com/v1',model:'deepseek-chat'},
  glm:{name:'智谱 GLM',baseUrl:'https://open.bigmodel.cn/api/paas/v4',model:'glm-4-flash'},
  qwen:{name:'通义千问',baseUrl:'https://dashscope.aliyuncs.com/compatible-mode/v1',model:'qwen-plus'},
  custom:{name:'学校自有兼容模型',baseUrl:'',model:''}
};
export const PROVIDERS=Object.freeze(defaults);
const own=(obj,key)=>Object.prototype.hasOwnProperty.call(obj,key);
const requireString=(v,label,max)=>{if(typeof v!=='string'||!v.trim()||v.length>max)throw invalid(label+'不能为空或超过长度限制');return v.trim()};
const invalid=msg=>Object.assign(new Error(msg),{status:400});
const blocked=(msg,status=403)=>Object.assign(new Error(msg),{status});
const hostIsPrivate=(host)=>{
 const h=host.toLowerCase().replace(/^\[|\]$/g,'');
 if(['localhost','127.0.0.1','::1'].includes(h))return true;
 if(h.endsWith('.localhost')||h.endsWith('.local')||h.endsWith('.internal'))return true;
 if(/^\d+\.\d+\.\d+\.\d+$/.test(h)){
  const p=h.split('.').map(Number);
  return p[0]===10||p[0]===127||p[0]===0||p[0]===169&&p[1]===254||
   p[0]===192&&p[1]===168||p[0]===172&&p[1]>=16&&p[1]<=31||p[0]>=224;
 }
 return h.includes(':') || h==='::ffff:127.0.0.1';
};
function normalizeBase(v,{allowLocal=false}={}){
 const source=requireString(v,'模型 API 地址',300);
 let url;
 try{url=new URL(source)}catch{throw invalid('请输入有效的模型 API URL')}
 if(url.username||url.password||url.search||url.hash)throw invalid('API地址中不得含账号、密码、查询参数或fragment');
 if(url.protocol!=='https:'&&!(allowLocal&&url.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(url.hostname)))
  throw invalid('远程学校API必须使用HTTPS');
 if(hostIsPrivate(url.hostname)&&!allowLocal)throw invalid('本机/内网地址需在学校安全部署中单独允许');
 if(url.pathname.endsWith('/chat/completions'))url.pathname=url.pathname.slice(0,-'/chat/completions'.length);
 const u=new URL(url.toString());u.pathname=u.pathname.replace(/\/+$/,'');
 return u.toString().replace(/\/$/,'');
}
function validateProvider(input,old=null,options={}){
 if(!input||typeof input!=='object'||Array.isArray(input))throw invalid('配置对象无效');
 const kind=requireString(input.provider,'供应方',30).toLowerCase();
 if(!own(defaults,kind))throw invalid('供应方不受支持');
 const preset=defaults[kind];
 const model=requireString(input.model||preset.model,'模型名称',120);
 if(!/^[A-Za-z0-9._:/+-]+$/.test(model))throw invalid('模型名称包含非法字符');
 const baseUrl=normalizeBase(input.baseUrl||preset.baseUrl,options);
 const displayName=requireString(input.displayName||preset.name,'显示名称',64);
 const oldMatching=old&&old.provider===kind&&old.baseUrl===baseUrl;
 const apiKey=typeof input.apiKey==='string'&&input.apiKey.trim()?input.apiKey.trim():(oldMatching?old.apiKey:'');
 if(!apiKey||apiKey.length>512||/[\r\n]/.test(apiKey))throw invalid('需要合法API Key（仅服务端内存保存）');
 const dailyLimit=Number(input.dailyLimit??old?.dailyLimit??30);
 if(!Number.isInteger(dailyLimit)||dailyLimit<1||dailyLimit>2000)throw invalid('每日请求配额应在1至2000之间');
 const maxOutputTokens=Number(input.maxOutputTokens??old?.maxOutputTokens??400);
 if(!Number.isInteger(maxOutputTokens)||maxOutputTokens<16||maxOutputTokens>1024)throw invalid('单次输出令牌上限为16至1024');
 return {provider:kind,displayName,baseUrl,model,apiKey,dailyLimit,maxOutputTokens};
}
function equalToken(a,b){
 if(typeof a!=='string'||typeof b!=='string')return false;
 const x=Buffer.from(a),y=Buffer.from(b);
 return x.length===y.length && timingSafeEqual(x,y);
}
export class ProviderRegistry {
 constructor({env=process.env,fetchImpl=fetch,allowLocal=false,adminToken,requestTimeoutMs=16000}={}){
  this.fetchImpl=fetchImpl;this.allowLocal=allowLocal;this.demoSessionId=randomUUID();this.adminToken=adminToken||env.ACADEMY_ADMIN_TOKEN||randomBytes(24).toString('hex');
  if(!Number.isInteger(requestTimeoutMs)||requestTimeoutMs<10||requestTimeoutMs>16000)throw invalid('模型超时必须在10至16000毫秒之间');
  this.requestTimeoutMs=requestTimeoutMs;
  this.generatedToken=!adminToken&&!env.ACADEMY_ADMIN_TOKEN;
  this.config=null;this.source='none';this.verified=false;this.callsToday=0;this.failedToday=0;this.tokensToday=0;this.day=new Date().toISOString().slice(0,10);
  if(env.ACADEMY_LLM_API_KEY&&env.ACADEMY_LLM_BASE_URL&&env.ACADEMY_LLM_MODEL){
   try{
    this.config=validateProvider({
      provider:'custom',displayName:env.ACADEMY_LLM_DISPLAY_NAME||'演示方自有API',
      baseUrl:env.ACADEMY_LLM_BASE_URL,model:env.ACADEMY_LLM_MODEL,apiKey:env.ACADEMY_LLM_API_KEY,
      dailyLimit:Number(env.ACADEMY_LLM_DAILY_LIMIT||30)},null,{allowLocal:this.allowLocal});
    this.source='environment';
   }catch{this.config=null;this.source='invalid-environment';}
  }
 }
 requireAdmin(token){if(!equalToken(token,this.adminToken))throw blocked('管理员身份验证失败');}
 rollover(){const now=new Date().toISOString().slice(0,10);if(now!==this.day){this.day=now;this.callsToday=0;this.failedToday=0;this.tokensToday=0}}
 summary({admin=false}={}){
  this.rollover();const c=this.config;
  const summary={configured:!!c,verified:this.verified,mode:c?'llm-configured':'rules',provider:c?.displayName||null,
   model:c?.model||null,source:this.source,usedToday:this.callsToday,
   tokensToday:this.tokensToday,limit:c?.dailyLimit||0};
  if(admin){
   return {...summary,baseUrl:c?.baseUrl||'',providerCode:c?.provider||'deepseek',
    keyPresent:!!c?.apiKey,dailyLimit:c?.dailyLimit||30,maxOutputTokens:c?.maxOutputTokens||400,
    failedToday:this.failedToday,credentialStorage:'server-memory-only',
    help:'此本机验证版的密钥只存于服务器进程内存，重启即丢失。学校正式部署必须配置身份管理、密钥保险库、TLS、配额和审计。'};
  }
  return summary;
 }
 configure(input){
  this.config=validateProvider(input,this.config,{allowLocal:this.allowLocal});
  this.verified=false;this.source='administrator-memory';return this.summary({admin:true});
 }
 clear(){this.config=null;this.verified=false;this.source='none';this.callsToday=0;this.failedToday=0;this.tokensToday=0;return this.summary({admin:true})}
 async generate(messages,{maxTokens,temperature=0.2,testOnly=false}={}){
  if(!this.config)throw blocked('本机尚未配置学校或演示方的模型API',503);
  this.rollover();
  if(this.callsToday>=this.config.dailyLimit)throw blocked('今日模型调用配额已用完，请联系管理员',429);
  if(!Array.isArray(messages)||messages.length<1||messages.length>5)throw invalid('消息结构不合法');
  // Reasoning models can spend the first tokens on hidden reasoning; reserve enough for visible teaching text.
  const isGoReasoning=this.config.baseUrl.startsWith('https://opencode.ai/zen/go/v1')&&this.config.model.startsWith('deepseek-');
  const amount=isGoReasoning?Math.max(768,Math.min(1024,Number(maxTokens)||350)):Math.min(this.config.maxOutputTokens,Math.max(16,Number(maxTokens)||350));
  const url=this.config.baseUrl+'/chat/completions';
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),Math.min(this.requestTimeoutMs,testOnly?11000:16000));
  this.callsToday++;
  try{
   const headers={Authorization:'Bearer '+this.config.apiKey,'Content-Type':'application/json'};
   // OpenCode Go requires stable per-conversation affinity; never publish this ID or a token.
   const endpoint=new URL(this.config.baseUrl);
   if(endpoint.hostname==='opencode.ai'&&endpoint.pathname.startsWith('/zen/go/v1')){
    headers['x-opencode-session']=this.demoSessionId;
    headers['User-Agent']='AI-Academy-Local-Demo/0.4';
   }
   const response=await this.fetchImpl(url,{method:'POST',
    headers,
    body:JSON.stringify({model:this.config.model,messages,temperature,max_tokens:amount,...(isGoReasoning?{thinking:{type:'disabled'}}:{})}),
    redirect:'error',signal:controller.signal});
   if(!response.ok)throw Object.assign(new Error('模型服务返回 HTTP '+response.status),{safeCode:'UPSTREAM_HTTP_'+response.status});
   const raw=await response.json();
   const reply=raw?.choices?.[0]?.message?.content;
   if(typeof reply!=='string'||!reply.trim())throw Object.assign(new Error('模型没有返回可用正文'),{safeCode:'EMPTY_RESPONSE'});
   const total=Number(raw.usage?.total_tokens);
   if(Number.isFinite(total)&&total>=0)this.tokensToday+=total;
   this.verified=true;
   return {text:reply.trim().slice(0,1800),provider:this.config.displayName,
    model:this.config.model,usage:{totalTokens:Number.isFinite(total)?total:null},
    testOnly,successful:true};
  }catch(err){
   this.failedToday++;
   const code=controller.signal.aborted?'TIMEOUT':err?.safeCode||'NETWORK_OR_FORMAT';
   const diagnoses={UPSTREAM_HTTP_400:'请求参数不兼容，请确认模型 ID 和接口格式',
    UPSTREAM_HTTP_401:'API Key 无效或已过期（HTTP 401）',
    UPSTREAM_HTTP_403:'密钥缺少模型访问权限（HTTP 403）',
    UPSTREAM_HTTP_404:'模型或 API 路径不存在（HTTP 404）',
    UPSTREAM_HTTP_429:'模型配额或速率限制（HTTP 429）',
    UPSTREAM_HTTP_402:'账户余额或计费状态异常（HTTP 402）'};
   const message=code==='TIMEOUT'?'模型请求超时，请检查网络与服务状态':
    code==='EMPTY_RESPONSE'?'模型没有返回可用正文':
    diagnoses[code]||(code.startsWith('UPSTREAM_HTTP_')?'模型服务返回 HTTP '+code.slice(14):'网络连接或响应格式异常，请检查代理、证书和服务地址');
   throw Object.assign(blocked(message,502),{code});
  }finally{clearTimeout(timeout)}
 }
 async checkConnection(){
  return this.generate([{role:'user',content:'请只回答：连接成功'}],{maxTokens:20,temperature:0,testOnly:true});
 }
}
