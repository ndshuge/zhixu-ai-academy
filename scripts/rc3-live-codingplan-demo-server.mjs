/**
 * Starts a loopback-only, isolated Coding Plan research demo for human review/video.
 * No student production API. No plaintext credential handling by this script.
 * Stop with Ctrl+C or process.stop; both app and its isolated Pi broker shut down.
 */
import {spawn} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createAcademyServer} from '../server.mjs';
import {CodingPlanDemoProvider,demoEnvironment,demoRpc,DEMO_IDENTITY} from '../codingplan-demo-provider.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const ctrl=join(root,'..','agent-orchestrator-evaluation-20261009');
const port=Number(process.env.ACADEMY_DEMO_PORT||4396);
if(!Number.isInteger(port)||port<1024||port>65535)throw Error('invalid demo port');
await mkdir(join(root,'evidence','runtime','codingplan-live-ui'),{recursive:true});
const env=demoEnvironment();
let broker,server,closed=false;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function shutdown(){
 if(closed)return;
 closed=true;
 await new Promise(r=>server?.close(()=>r())||r());
 try{await demoRpc('stop',[],{env,timeoutMs:14000})}catch{}
 if(broker?.exitCode===null)broker.kill();
}
for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>{shutdown().finally(()=>process.exit(0))});
try{
 broker=spawn(process.execPath,[join(ctrl,'pi-rpc-control.mjs'),'serve'],{
  cwd:ctrl,env,windowsHide:true,stdio:['ignore','pipe','pipe']});
 let brokerErr='';
 broker.stderr.on('data',chunk=>{if(brokerErr.length<800)brokerErr+=chunk.toString().slice(0,800-brokerErr.length)});
 let ready=false;
 for(let i=0;i<22;i++){
  if(broker.exitCode!==null)throw Error('Pi broker terminated before ready: '+brokerErr.slice(-160));
  await sleep(1000);
  try{await demoRpc('health',[],{env,timeoutMs:3500});ready=true;break}catch{}
 }
 if(!ready)throw Error('isolated Pi session did not become ready; no academy model enabled');
 const model=await demoRpc('state',[],{env,timeoutMs:8000});
 if(model.data?.model?.provider!==DEMO_IDENTITY.provider||
  model.data?.model?.id!==DEMO_IDENTITY.model)
  throw Error('wrong account model; refuse demo');
 const provider=new CodingPlanDemoProvider({limit:6});
 server=createAcademyServer({providerRegistry:provider});
 await new Promise((res,rej)=>{server.once('error',rej);server.listen(port,'127.0.0.1',res)});
 console.log(JSON.stringify({status:'DEMO_READY',url:'http://127.0.0.1:'+port+'/?focus=1',
  provider:DEMO_IDENTITY.provider,model:DEMO_IDENTITY.model,
  isolatedInstance:DEMO_IDENTITY.instance,maxRealCalls:6,
  usageCaution:'unknown billed balance; account use balance must be reviewed separately',
  noCredentialsInApp:true,realStudentDataForbidden:true}));
}catch(e){console.error('DEMO_FAILED',e.message.slice(0,350));await shutdown();process.exitCode=1}
