/**
 * Local-only, temporary development bridge. This adapter never reads credentials.
 * A separately running trusted Pi RPC controller owns the existing OpenCode login.
 * Do not use for students, deployment or publicly hosted websites.
 */
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';

const execFileAsync=promisify(execFile);
const ROOT=fileURLToPath(new URL('.',import.meta.url));
const CTRL_DIR=resolve(ROOT,'../agent-orchestrator-evaluation-20261009');
const CONTROLLER=join(CTRL_DIR,'pi-rpc-control.mjs');
const INSTANCE='zhixu-live-ui-20261014';
const MODEL='deepseek-v4.1-flash';
export const DEMO_IDENTITY=Object.freeze({
 provider:'opencode-go',model:MODEL,instance:INSTANCE,
 type:'development-only-live-ai',protocol:'native-Pi-RPC'});
export const demoEnvironment=({parent=process.env}={})=>({
 ...parent,PI_INSTANCE_ID:INSTANCE,PI_WORKDIR:join(ROOT,'evidence','runtime','codingplan-live-ui'),
 PI_WORKER_MODE:'direct',PI_WORKER_PROVIDER:'opencode-go',PI_WORKER_MODEL:MODEL
});
const pause=ms=>new Promise(r=>setTimeout(r,ms));
export async function demoRpc(action,args=[],{timeoutMs=24000,env=demoEnvironment()}={}){
 const allowed=['health','state','events','prompt','wait','last','stop'];
 if(!allowed.includes(action))throw Error('RPC operation not approved for teaching demo');
 const {stdout}=await execFileAsync(process.execPath,[CONTROLLER,action,...args],{
  cwd:CTRL_DIR,env,timeout:timeoutMs,windowsHide:true,maxBuffer:90000,
  encoding:'utf8'});
 let result;
 try{result=JSON.parse(stdout)}catch{throw Error('Pi controller response invalid')}
 if(result.status!==200||result.data?.ok!==true)
  throw Error('Pi control operation unavailable: '+action);
 return result.data;
}
const fail=(code)=>Object.assign(Error(code),{code});
export class CodingPlanDemoProvider{
 constructor({rpc=demoRpc,limit=6,requestTimeoutMs=90000}={}){
  this.rpc=rpc;this.limit=limit;this.used=0;this.failed=0;this.verified=false;
  this.busy=false;this.timeout=requestTimeoutMs;this.recentEventSeq=0;
 }
 summary({admin=false}={}){
  const value={configured:true,verified:this.verified,mode:'llm-configured',
   provider:'OpenCode Go · 研发演示专用',model:MODEL,source:'isolated-Pi-RPC',
   usedToday:this.used,tokensToday:0,limit:this.limit};
  return admin?{...value,baseUrl:'',providerCode:'custom',keyPresent:false,
   dailyLimit:this.limit,maxOutputTokens:350,failedToday:this.failed,
   credentialStorage:'opaque-existing-Pi-process',help:'研发临时桥接，密钥不由AI学院管理；禁止公网和常规学生使用。'}:value;
 }
 // Demo mode does not permit provider changes or reveal any credential material.
 requireAdmin(){throw Object.assign(Error('Coding Plan研发演示不可在网页配置'),{status:403})}
 configure(){throw Error('Coding Plan研发演示不允许修改提供方')}
 clear(){throw Error('Coding Plan研发演示不允许修改提供方')}
 async generate(messages,{maxTokens=350}={}){
  if(this.busy)throw fail('DEMO_BUSY');
  if(this.used>=this.limit)throw fail('QUOTA_EXHAUSTED');
  if(!Array.isArray(messages)||messages.length<1||messages.length>5||
    messages.some(m=>!['system','user'].includes(m.role)||typeof m.content!=='string'||
     m.content.length>8800))throw fail('INVALID_DEMO_MESSAGES');
  // Once a request is sent, consume the quota even if it times out.
  this.busy=true;
  const start=Date.now();
  try{
   const state=await this.rpc('state');
   if(state.data?.model?.provider!==DEMO_IDENTITY.provider||
      state.data?.model?.id!==MODEL)throw fail('WRONG_MODEL_IDENTITY');
   const baseline=await this.rpc('events',['0']);
   const lastSeq=Number(baseline.latest)||0;
   const payload=messages.map(m=>m.role.toUpperCase()+':\n'+m.content).join('\n\n');
   // The prompt is a coding-agent validation task and has no permission to use editor tools.
   const prompt='你正作为编程 Agent 对一个教学网页的模型推理接口进行研发验收。'+
    '这是开发测试，以下学习数据全部是合成样例，不得进行文件读写、命令、搜索、工具调用。'+
    '严格按 SYSTEM 要求生成最终可直接被程序解析的输出，不要前言或Markdown。\n\n'+payload;
   if(prompt.length>11500)throw fail('PROMPT_TOO_LARGE');
   this.used++;
   const ack=await this.rpc('prompt',[prompt],{timeoutMs:24000});
   if(!ack?.disposition)throw fail('PROMPT_NO_ACK');
   let answer='',finished=false;
   for(let i=0;i<7;i++){
    if(Date.now()-start>this.timeout)break;
    const w=await this.rpc('wait',[],{timeoutMs:23000});
    if(w.completed){answer=w.text||'';finished=true;break}
    await pause(300);
   }
   if(!finished)throw fail('MODEL_TIMEOUT');
   if(!answer.trim())answer=(await this.rpc('last')).text||'';
   const events=await this.rpc('events',[String(lastSeq)]);
   const toolCalls=(events.data||[]).filter(e=>e.type==='tool_execution_start').length;
   if(toolCalls!==0)throw fail('MODEL_ATTEMPTED_TOOL_CALLS');
   if(!answer.trim()||answer.length>4500)throw fail('EMPTY_OR_OVERLONG_RESPONSE');
   this.verified=true;
   return {text:answer.trim(),provider:'OpenCode Go · development',model:MODEL,
    usage:{totalTokens:null},testOnly:false,successful:true,
    experimental:true,executionTools:0};
  }catch(e){this.failed++;throw e}
  finally{this.busy=false}
 }
}
