/**
 * Audit one real Coding Plan science-planning response with ZERO further
 * model requests. Replays recorded A/B output through production planner.
 * Reads only synthetic science evidence, never sessions, tokens or catalogs.
 */
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {computePfl} from '../server.mjs';
import {buildSafeProposalChoices,selectModelProposal} from '../llm-science-planner.mjs';
import {verifyProposalAgainstRun} from '../agent-planner.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const dir=join(root,'evidence','rc3-20261012','g2-live');
const fetchJson=async name=>JSON.parse(await readFile(join(dir,name),'utf8'));
const frozen=await fetchJson('frozen-cases.json'),live=await fetchJson('live-real-vs-rules-results.json');
const sentry=await fetchJson('LIVE_EXTERNAL_CALL_ISSUED.json');
const receipt=await fetchJson('live-request-ack.json');
const newHash=createHash('sha256').update(JSON.stringify({display:frozen.display,scoring:frozen.reference})).digest('hex');
if(newHash!==frozen.inputHash||newHash!==live.inputHash)throw Error('Frozen benchmark hash mismatch');
if(!sentry||sentry.maxExternalCalls!==1||!receipt.accepted||
 live.realModelCalls!==1||live.modelProvider!=='opencode-go'||live.modelId!=='deepseek-v4.1-flash'||live.toolCalls!==0||
 live.testedCases!==8||live.results.length!==8)
 throw Error('Provenance/model identity or request count failed');
const output=[];
for(const e of frozen.display){
 const record=live.results.find(x=>x.id===e.id);
 const original=computePfl({experiment:e.experiment,params:e.originalCondition});
 const previous={result:original,prediction:e.studentPrediction,depth:0};
 const choices=buildSafeProposalChoices(previous,{goal:e.goal});
 if(!record||choices.length!==2||!['A','B'].includes(record.modelChoice))throw Error('Missing live choice');
 const expected=frozen.reference.find(x=>x.id===e.id);
 const inferred=choices.find(x=>x.id===record.modelChoice)?.proposal;
 if(!inferred||!verifyProposalAgainstRun(previous,inferred))throw Error('Invalid model-derived candidate');
 const answer=await selectModelProposal(previous,{goal:e.goal,provider:{
  generate:async()=>({text:JSON.stringify({choice:record.modelChoice}),provider:'recorded-real-output-replay',
   model:'deepseek-v4.1-flash',usage:{totalTokens:0}})
 }});
 if(answer.changes[0].to!==inferred.changes[0].to||answer.autoExecuted!==false||
 answer.approvalRequired!==true||!verifyProposalAgainstRun(previous,answer))throw Error('Production planner replay failed');
 const delta=Math.sign(answer.changes[0].to-answer.changes[0].from);
 if((delta===expected.goalDirection)!==record.modelTargetAligned)throw Error('Target reference mismatch');
 output.push({case:e.id,chosen:record.modelChoice,goalAligned:record.modelTargetAligned,
  scienceValidated:true,approvalRequired:true,executed:false});
}
const result={status:'PASS',frozenInputHash:newHash,validatedCases:output.length,
 realRemoteModelCallsInThisAudit:0,authenticatedRemoteModelCallsPreviously:1,
 allProposalsScienceValidated:true,allRequireHumanApproval:true,anyToolExecution:false,
 extraUserBilledCNY:'not disclosed by provider',
 modelTargetAlignedCount:output.filter(x=>x.goalAligned).length,
 ruleTargetAlignedCount:live.ruleTargetAlignedCount,
 actualParticipants:0,
 limitations:'Real LLM decisions were replayed into production science planner without another API call. This validates plan bounds, not actual online classroom API transport or education effects.'};
await writeFile(join(dir,'postcall-no-network-audit.json'),JSON.stringify(result,null,2)+'\n');
console.log('RC3_REAL_MODEL_REPLAY_ACCEPTANCE',JSON.stringify({status:result.status,
 verified:result.validatedCases,needApproval:result.allRequireHumanApproval,
 scienceBounded:result.allProposalsScienceValidated,additionalPaidCalls:0}));
