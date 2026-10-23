/** 
 * Parse the one authenticated Pi RPC response without opening any credential
 * or session file. Only the adapter retrieves its own loopback auth internally.
 * No further model prompt is issued here.
 */
import {readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
const root=fileURLToPath(new URL('../',import.meta.url));
const controllerDir=join(root,'..','agent-orchestrator-evaluation-20261009');
const controller=join(controllerDir,'pi-rpc-control.mjs');
const out=join(root,'evidence','rc3-20261012','g2-live');
function execute(action){
 return new Promise((resolve,reject)=>{
  const proc=spawn(process.execPath,[controller,action],{cwd:controllerDir,windowsHide:true,
   env:{...process.env,PI_INSTANCE_ID:'rc3-aiacademy'},stdio:['ignore','pipe','pipe']});
  let buf='';
  proc.stdout.on('data',chunk=>{if(buf.length<20000)buf+=chunk.toString('utf8').slice(0,20000-buf.length)});
  proc.on('close',code=>{
   if(code!==0)return reject(Error('Pi RPC '+action+' failed'));
   try{
    const ack=JSON.parse(buf);
    if(ack.status!==200||ack.data?.ok!==true)throw Error('Unverified RPC reply');
    resolve(ack.data)
   }catch(e){reject(e)}
  });
 });
}
const scope=JSON.parse(await readFile(join(out,'frozen-cases.json'),'utf8'));
const issued=JSON.parse(await readFile(join(out,'LIVE_EXTERNAL_CALL_ISSUED.json'),'utf8'));
const receipt=JSON.parse(await readFile(join(out,'live-request-ack.json'),'utf8'));
if(!issued||issued.maxExternalCalls!==1||!receipt.accepted)throw Error('No authorized successful request acknowledgment');
const [final,state,stats]=await Promise.all([execute('last'),execute('state'),execute('stats')]);
const model=state.data?.model,usage=stats.data;
if(model?.provider!=='opencode-go'||model?.id!=='deepseek-v4.1-flash'||usage?.userMessages!==1||usage?.assistantMessages!==1)
 throw Error('Model identity or one-request budget constraint violated');
if(usage.toolCalls!==0)throw Error('Model attempted tools: do not accept output');
let response;
try{response=JSON.parse(final.text)}catch{throw Error('The real model response was not strict JSON')}
if(!response||Object.keys(response).length!==1||!Array.isArray(response.choices)||response.choices.length!==scope.reference.length)
 throw Error('Malformed number of science decisions');
const expected=new Map(scope.reference.map(x=>[x.id,x]));
const ids=new Set();
const results=[];
for(const item of response.choices){
 if(!item||Object.keys(item).sort().join()!=='choice,id'||typeof item.id!=='string'||!['A','B'].includes(item.choice)||
    !expected.has(item.id)||ids.has(item.id))
  throw Error('Duplicate, unknown or malformed model decision');
 ids.add(item.id);
 const ref=expected.get(item.id);
 results.push({id:item.id,modelChoice:item.choice,ruleChoice:ref.ruleChoice,
  targetDirection:ref.goalDirection,referenceChoice:ref.expectedChoice,
  modelTargetAligned:item.choice===ref.expectedChoice,ruleTargetAligned:ref.ruleChoice===ref.expectedChoice});
}
const result={status:'PASS',modelProvider:model.provider,modelId:model.id,
 validatedRealModel:true,realModelCalls:usage.userMessages,
 participantCount:0,inputHash:scope.inputHash,referenceFrozenBeforeCall:true,
 testedCases:results.length,validStructuredResponses:results.length,
 modelTargetAlignedCount:results.filter(x=>x.modelTargetAligned).length,
 ruleTargetAlignedCount:results.filter(x=>x.ruleTargetAligned).length,
 toolCalls:usage.toolCalls,actualInputTokens:usage.tokens?.input,
 actualOutputTokens:usage.tokens?.output,
 modelMetadataCostUSD:usage.cost,
 actualBilledCNY:'NOT_AVAILABLE_FROM_PI_STATS',
 noAdditionalPaidBalanceVerified:false,
 budgetCeilingCNY:5,modelPromptsThisRun:1,
 results,
 limitations:[
  'All 8 tasks are synthetic, goal direction is predefined, not actual student learning.',
  'This small holdout test checks whether chosen experiment parameter moves in requested direction.',
  'The rule policy always chooses A; its 4/8 is task-direction alignment, not a general science quality score.',
  'Pi price metadata reporting 0 is not an actual billing receipt; OpenCode Go includes subscription quota and may allow pay-as-you-go fallback based on account settings.',
  'No personal student records, credentials, or proprietary projects were sent to the model.',
  'No second prompt was submitted; failures are not silently rerun.'
 ]};
await writeFile(join(out,'live-real-vs-rules-results.json'),JSON.stringify(result,null,2)+'\n');
console.log('G2_AUTHENTIC_MODEL_PILOT',JSON.stringify({
 status:result.status,model:result.modelId,cases:result.testedCases,
 modelDirection:result.modelTargetAlignedCount,ruleDirection:result.ruleTargetAlignedCount,
 modelCalls:result.realModelCalls,toolCalls:result.toolCalls,
 inputTokens:result.actualInputTokens,outputTokens:result.actualOutputTokens,
 actualBilledCNY:result.actualBilledCNY
}));
