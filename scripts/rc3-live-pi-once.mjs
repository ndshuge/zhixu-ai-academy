/**
 * One and only one approved OpenCode Go model prompt for AI Academy G2.
 * Uses the ALREADY AUTHENTICATED Pi RPC adapter as an opaque credential broker:
 * this file never opens credential catalogs, auth files or connection tokens.
 * Max one provider prompt, no retries; run-specific irreversible sentry.
 */
import {open,readFile,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const controller=join(root,'..','agent-orchestrator-evaluation-20261009','pi-rpc-control.mjs');
const serviceRoot=join(root,'..','agent-orchestrator-evaluation-20261009');
const folder=join(root,'evidence','rc3-20261012','g2-live');
const prompt=(await readFile(join(folder,'live-prompt.txt'),'utf8')).trim();
const frozen=JSON.parse(await readFile(join(folder,'frozen-cases.json'),'utf8'));
if(frozen.inputHash!=='7491158f42622309ad3379292b290099a5393d9b17a5b0e4631476b52704bbcd')
 throw Error('Frozen benchmark changed: refuse charge');
if(prompt.length<3000||prompt.length>5500)throw Error('Unexpected size: refuse charge');
if(frozen.modelCallsBudgetMax!==1||frozen.externalSpendingLimitCNY!==5||frozen.realParticipants!==0)
 throw Error('Invalid authorization scope');
const sentry=await open(join(folder,'LIVE_EXTERNAL_CALL_ISSUED.json'),'wx').catch(e=>{
 if(e.code==='EEXIST')throw Error('A live request was already attempted. Never auto-retry or exceed budget.');
 throw e;
});
await sentry.writeFile(JSON.stringify({when:new Date().toISOString(),maxExternalCalls:1,
 model:'opencode-go/deepseek-v4.1-flash',realPeople:0,budgetCeilingCNY:5,
 subscriptionUse:'included plan only; paid balance overage not authorized',
 requestStatus:'attempted (presence of this sentry blocks repeats)'},null,2));
await sentry.close();
const child=spawn(process.execPath,[controller,'prompt',prompt],{
 cwd:serviceRoot,windowsHide:true,env:{...process.env,PI_INSTANCE_ID:'rc3-aiacademy'},
 stdio:['ignore','pipe','pipe']});
let result='',error='';
child.stdout.on('data',chunk=>{if(result.length<10000)result+=chunk.toString().slice(0,10000-result.length)});
child.stderr.on('data',chunk=>{if(error.length<800)error+=chunk.toString().slice(0,800-error.length)});
const rc=await new Promise(resolve=>child.on('close',resolve));
let accepted=false;
try{const ack=JSON.parse(result);accepted=rc===0&&ack.status===200&&ack.data?.ok===true}catch{}
await writeFile(join(folder,'live-request-ack.json'),JSON.stringify({
  attempted:true,accepted,exitCode:rc,when:new Date().toISOString(),
  errorClass:accepted?null:'NO_ACK_OR_REQUEST_FAILURE',
  outputSafeOnly:'RPC control response parsed but not exposed',
  actualChargeCNY:'not exposed by subscription service'
},null,2));
console.log('RC3_ONE_AUTHORIZED_LIVE_REQUEST',accepted?'ACCEPTED':'NOT_ACCEPTED',
 'model=opencode-go/deepseek-v4.1-flash','request_count=1','budget_ceiling_cny=5');
if(!accepted)process.exitCode=1;
