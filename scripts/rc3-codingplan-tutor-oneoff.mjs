/**
 * One-shot, user-authorized Coding Plan developmental demo. NOT a provider for students.
 * No direct reading or output of credentials. A trusted, pre-existing Pi controller
 * owns auth in its isolated process. One synthetic request; no retries.
 */
import {spawn} from 'node:child_process';
import {open,mkdir,writeFile,readFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {computePfl} from '../server.mjs';
const project=fileURLToPath(new URL('../',import.meta.url));
const controlRoot=resolve(project,'../agent-orchestrator-evaluation-20261009');
const controller=join(controlRoot,'pi-rpc-control.mjs');
const dir=join(project,'evidence','rc3-20261012','g2-demo-20261014');
const scratch=join(project,'evidence','runtime','codingplan-demo-20261014');
const sentinel=join(dir,'CODINGPLAN_ONE_REAL_CALL_ATTEMPTED.json');
const env={...process.env,
  PI_INSTANCE_ID:'zhixu-tutor-demo-20261014',
  PI_WORKDIR:scratch,
  PI_WORKER_MODE:'direct',
  PI_WORKER_PROVIDER:'opencode-go',
  PI_WORKER_MODEL:'deepseek-v4.1-flash'
};
const run=(action,arg=[],timeout=22000)=>new Promise((res,rej)=>{
 const child=spawn(process.execPath,[controller,action,...arg],{
  cwd:controlRoot,env,windowsHide:true,stdio:['ignore','pipe','pipe']});
 let out='',err='';const timer=setTimeout(()=>{child.kill();rej(Error('controller '+action+' timed out'))},timeout);
 child.stdout.on('data',c=>{if(out.length<30000)out+=c.toString().slice(0,30000-out.length)});
 child.stderr.on('data',c=>{if(err.length<1400)err+=c.toString().slice(0,1400-err.length)});
 child.on('error',e=>{clearTimeout(timer);rej(e)});
 child.on('close',rc=>{
  clearTimeout(timer);
  if(rc!==0){rej(Error(action+' controller failed: '+err.slice(-450)));return}
  try{const obj=JSON.parse(out);if(obj.status!==200||obj.data?.ok!==true)throw Error(action+' returned non-OK');res(obj.data)}
  catch(e){rej(Error(action+' invalid response: '+e.message))}
 });
});
await mkdir(dir,{recursive:true});
await mkdir(scratch,{recursive:true});
const science=computePfl({experiment:'sensitivity',
 params:{r:3.9,x0:0.217,steps:150,logDelta:-10}});
const first=science.metrics.find(x=>String(x.label).includes('首次'))?.value;
if(first!==43)throw Error('scientific evidence changed: abort before external request');
const synthetic={
 origin:'SYNTHETIC_SOFTWARE_DEMO_NOT_A_REAL_STUDENT',
 topic:'同一方程与不同初值',
 studentPrediction:'只要数学方程相同，即使初始值相差一点点，后来两条轨迹也一定相同。',
 wrongIndependentTransferAnswer:'轨迹不同一定说明数学方程不同。',
 observation:{engine:science.engine,parameters:science.condition,
  threshold:0.01,firstSeparationStep:first,
  boundary:'仅在这些参数与有限迭代下观察到；不能推出所有参数都在第43步分离'},
 target:'简短而具体的误区引导和新对照实验的苏格拉底提问；禁止制造新数值'
};
const prompt=[
 '你正在辅助开发一个 Node.js AI教育产品的演示用「概念误区反馈器」JSON测试样本。',
 '只对下方合成用户事件返回机器可读的中文JSON。不得读写任何文件、不得调用工具或联网检索，不要Markdown。不是对真人做心理标签。',
 '只允许6个key: evidence, misconceptionCandidate, socraticQuestion, nextExperiment, scientificLimitation, source。',
 'evidence:准确引用真实PFL参数与首次分离步数，不凭空添加统计结果。',
 'misconceptionCandidate:针对这条错误回答的可撤销解释，不要说用户永久不会。',
 'socraticQuestion:1个引导学生自行观察和解释而非直接给答案的问题。',
 'nextExperiment:只改变logDelta一种变量，保留r、x0、steps，需学生事前预测并明确批准，不得宣称已执行。',
 'scientificLimitation:说清有限轨迹不能证明普遍规律及数值精度风险。',
 'source固定为 "codingplan-go-oneoff-synthetic-demo"。禁止提分承诺、真人数据、虚构的实验。每个字符串在150中文字符内。',
 JSON.stringify(synthetic)
].join('\n');
let serving;
let called=false;let stopped=false;
try{
 // Start existing opaque-credential controller in no-extension, restricted coding-worker mode.
 serving=spawn(process.execPath,[controller,'serve'],{cwd:controlRoot,env,windowsHide:true,stdio:['ignore','pipe','pipe']});
 let stderr='';
 serving.stderr.on('data',b=>{if(stderr.length<600)stderr+=b.toString().slice(0,600-stderr.length)});
 let healthy=false;
 for(let i=0;i<18;i++){
  await new Promise(r=>setTimeout(r,1000));
  if(serving.exitCode!==null)throw Error('Pi controller failed to start (no request issued): '+stderr.slice(-220));
  try{await run('health',[],3500);healthy=true;break}catch{}
 }
 if(!healthy)throw Error('authenticated Pi controller not ready; no request issued');
 const state=await run('state',[],7000);
 if(state.data?.model?.provider!=='opencode-go'||
    state.data?.model?.id!=='deepseek-v4.1-flash')
  throw Error('unexpected model identity; no request issued');
 // Fail closed. The sentry is written *before* the only actual external prompt.
 const f=await open(sentinel,'wx');
 await f.writeFile(JSON.stringify({date:new Date().toISOString(),userAuthorized:true,
  mode:'single synthetic Coding Plan developer demo',maxRequests:1,autoRetry:false,
  model:'opencode-go/deepseek-v4.1-flash',disclaimer:'Plan credits or overage not verified by this script',
  realStudents:0,credentialReadByThisScript:false,scienceFirstThresholdStep:first},null,2));
 await f.close();
 called=true;
 const ack=await run('prompt',[prompt],16000);
 if(!ack.disposition)throw Error('prompt acknowledgment missing');
 let settled=false, answer='';
 for(let i=0;i<10;i++){
  const w=await run('wait',[],22000);
  if(w.completed){settled=true;answer=w.text||'';break}
 }
 if(!settled)throw Error('model did not settle; do not retry');
 if(!answer)answer=(await run('last',[],9000)).text||'';
 const stats=await run('stats',[],10000).catch(()=>({}));
 const events=(await run('events',['0'],10000)).data||[];
 const toolCalls=events.filter(x=>x.type==='tool_execution_start').length;
 // Validation is intentionally narrow; no scientific facts may be supplied by the model.
 let parsed=null,valid=false,reason='not pure JSON';
 try{
  const clean=answer.trim().replace(/^\x60\x60\x60(?:json)?\s*/i,'').replace(/\s*\x60\x60\x60$/,'');
  parsed=JSON.parse(clean);
  valid=parsed&&typeof parsed==='object'&&!Array.isArray(parsed)&&
   ['evidence','misconceptionCandidate','socraticQuestion','nextExperiment','scientificLimitation','source']
    .every(k=>typeof parsed[k]==='string'&&parsed[k].length<=500)&&
   Object.keys(parsed).length===6&&
   parsed.source==='codingplan-go-oneoff-synthetic-demo'&&toolCalls===0;
  reason=valid?'schema-and-zero-tools-pass':'schema mismatch or model attempted tool use';
 }catch{}
 const evidence={completedAt:new Date().toISOString(),
  acceptedSingleModelPrompt:true,model:'opencode-go/deepseek-v4.1-flash',
  source:'real Pi RPC via trusted existing local broker',
  synthetic:true,realParticipants:0,realStudentRecordsSent:0,toolCalls,
  scientificCheck:{engine:science.engine,parameters:science.condition,firstSeparationStep:first},
  schemaValid:valid,reviewRequired:true,
  validationReason:reason,
  reply:valid?parsed:null,
  responseSha256:createHash('sha256').update(answer).digest('hex'),
  lastTextLength:answer.length,
  availableStats:stats?.data?{turnCount:stats.data.turnCount??null,totalCostReported:stats.data.cost?.total??null}:null,
  chargeAccounting:'Provider billing/overage cannot be verified by local Pi metadata.'};
 await writeFile(join(dir,'CODINGPLAN_TUTOR_DEMO_RESULT.json'),JSON.stringify(evidence,null,2)+'\n');
 console.log(JSON.stringify({success:valid,model:evidence.model,toolCalls,firstSeparationStep:first,
  requestCount:1,output:join(dir,'CODINGPLAN_TUTOR_DEMO_RESULT.json'),
  preview:valid?parsed:null,validation:reason}));
}finally{
 try{await run('stop',[],12000);stopped=true}catch{}
 if(!stopped&&serving&&!serving.killed){serving.kill()}
}
