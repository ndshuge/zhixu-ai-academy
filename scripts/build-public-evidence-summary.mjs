import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join,resolve,dirname} from 'node:path';
// Reproduce a public AGGREGATE from private benchmark material, never publish items or raw LLM output.
// Usage: node scripts/build-public-evidence-summary.mjs <verified-evidence/rc3-20261012 path>
const src=process.argv[2]&&resolve(process.argv[2]);
if(!src)throw new Error('Source benchmark directory is required. No private dataset is bundled.');
const paths=['g2-benchmark/result-p5-60.json','g2-benchmark/cases-p5-60.json','g2-live/live-real-vs-rules-results.json'];
const inputs=[];
for(const p of paths){const raw=await readFile(join(src,p));inputs.push({data:JSON.parse(raw.toString('utf8')),hash:createHash('sha256').update(raw).digest('hex')})}
const [offline,detailed,live]=inputs.map(x=>x.data);
if(offline.status!=='PASS'||offline.cases<50||offline.actualPflRecomputations<100||
 detailed.caseCount!==offline.cases||detailed.sourceHash!==offline.testSetHash||
 !Array.isArray(detailed.items)||!detailed.items.every(x=>x.scienceVerified===true)||
 detailed.items.filter(x=>x.ruleGoalAligned).length!==offline.ruleTargetAligned||
 detailed.items.filter(x=>x.localPolicyGoalAligned).length!==offline.deterministicPolicyTargetAligned||
 live.status!=='PASS'||live.realModelCalls!==1||live.testedCases!==8)
 throw new Error('BENCHMARK_INPUT_VALIDATION_FAILED: refusing public aggregate');
const result={
 scope:'VERIFIED_SYNTHETIC_TECHNICAL_TESTS_NOT_STUDENT_LEARNING',
 offline:{situations:offline.cases,recomputations:offline.actualPflRecomputations,blockedUnsafeOutputs:offline.blockedMaliciousSelections,goalAlignedRule:offline.ruleTargetAligned,goalAlignedDeterministicPolicy:offline.deterministicPolicyTargetAligned,modelCalls:offline.realRemoteLLMCalls,hash:offline.testSetHash,noSuitableDirectionCases:detailed.noSuitableDirectionCases.length},
 remote:{syntheticSituations:live.testedCases,goalAlignedModel:live.modelTargetAlignedCount,goalAlignedRule:live.ruleTargetAlignedCount,remoteCalls:live.realModelCalls,modelName:'DeepSeek V4.1 Flash',toolCalls:live.toolCalls},
 actualStudentParticipants:0,
 caution:'60 synthetic offline situations; one real remote model call covers 8 synthetic inputs. These results are not student learning efficacy.',
 provenance:{kind:'sha256-pinned-synthetic-benchmark-aggregate',files:Object.fromEntries(paths.map((p,i)=>[p,inputs[i].hash]))}
};
const target=join(resolve('.'),'evidence/public-synthetic-technical-summary.json');
await mkdir(dirname(target),{recursive:true});
await writeFile(target,JSON.stringify(result,null,2)+'\n','utf8');
console.log('VERIFIED_PUBLIC_SYNTHETIC_AGGREGATE',result.offline.situations,result.remote.syntheticSituations,target);
