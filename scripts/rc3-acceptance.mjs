/**
 * RC3 reproducible local validation with redacted, bounded text logs.
 * Fixed command allowlist; no API credentials, real user data or source files
 * are enumerated. Browser checks create their own isolated loopback servers.
 */
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const dir=join(root,'evidence','rc3-20261012','acceptance');
await mkdir(dir,{recursive:true});
const cmds=[
 ['baseline','node scripts/rc3-verify-freeze.mjs'],
 ['node','npm test'],
 ['scientific-source','npm run verify'],
 ['scientific-planning-benchmark','npm run bench:rc3'],
 ['science-labs','npm run verify:labs'],
 ['filename-only','npm run audit:filenames'],
 ['human-field-empty','npm run study:analyze'],
 ['browser-rc3','npm run test:rc3'],
 ['browser-premedia','npm run test:premedia'],
 ['browser-classic','npm run test:browser'],
 ['browser-labs','npm run test:labs']
];
function execute(command){
 return new Promise((resolve)=>{
  const started=Date.now();
  const child=spawn(command,{cwd:root,shell:true,windowsHide:true,
   stdio:['ignore','pipe','pipe']});
  let output='',size=0;
  const capture=data=>{
   const text=data.toString('utf8');size+=text.length;
   if(output.length<150000)output+=text.slice(0,150000-output.length);
  };
  child.stdout.on('data',capture);child.stderr.on('data',capture);
  child.on('error',error=>resolve({exitCode:-1,elapsedMs:Date.now()-started,log:'PROCESS_FAILED '+error.code}));
  child.on('close',code=>resolve({exitCode:code??-1,elapsedMs:Date.now()-started,log:output,
   truncated:size>150000}));
 });
}
const results=[];
for(const [name,command] of cmds){
 const r=await execute(command);
 await writeFile(join(dir,name+'.log'),r.log,'utf8');
 results.push({name,command,exitCode:r.exitCode,elapsedMs:r.elapsedMs,truncated:!!r.truncated,
  note:name==='human-field-empty'?'n=0 expected, not human learning evidence':name==='filename-only'?'filename-only scan, not full content scan':undefined});
 console.log('RC3_CHECK',name,r.exitCode===0?'PASS':'FAIL',r.elapsedMs+'ms');
}
const report={date:new Date().toISOString(),project:'AI学院 RC3 staged local pilot',
 realLLMPlanningCallsDuringThisOfflineAcceptance:0,
 separateG2RealModelEvidence:'evidence/rc3-20261012/g2-live/live-real-vs-rules-results.json',
 actualParticipants:0,results,allPass:results.every(x=>x.exitCode===0),
 limits:['Browser tests use Microsoft Edge headless, not a physical iPhone.',
  'This regression does not perform another real model call; the one-call separate G2 authentic model pilot is documented in separate evidence.',
  'A real LLM choosing from safe candidates is not unrestricted autonomous tool execution.',
  'Human field data are absent and cannot be replaced by synthetic data.',
  'Filename scan does not certify file contents, bundles, screenshots or repository history.']};
await writeFile(join(dir,'summary.json'),JSON.stringify(report,null,2),'utf8');
console.log('RC3_ACCEPTANCE',report.allPass?'PASS':'FAIL',results.filter(x=>x.exitCode===0).length+'/'+results.length);
if(!report.allPass)process.exitCode=1;
