import {readFile,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {resolve,join} from 'node:path';
const root=resolve('.');
const evidence=JSON.parse(await readFile('adapters/pfl-provenance.json','utf8'));
const actual=createHash('sha256').update(await readFile('adapters/pfl-engine.mjs')).digest('hex');
if(actual!==evidence.bundleSha256)throw new Error('PFL adapter SHA256 mismatch');
let changed=[];
for(const item of evidence.dependencies){
 const path=resolve(root,item.path);
 const hash=createHash('sha256').update(await readFile(path)).digest('hex');
 if(hash!==item.sha256)changed.push(item.path);
}
if(changed.length)console.warn('WARNING_UPSTREAM_CHANGED_SINCE_BUNDLE',changed.join(';'));
const evo=JSON.parse(await readFile('adapters/evo-provenance.json','utf8'));
if(evo.files.length<8)throw new Error('EvoWorld snapshot is unexpectedly small');
const snapshotFiles=[];let evoSourceChanges=0;
for(const item of evo.files){
 if(!/^(core|science)\/[a-z0-9._-]+\.mjs$/i.test(item.relative))throw new Error('Untrusted Evo snapshot path');
 const snap=await readFile(join('adapters','evo-snapshot',item.relative));
 const hash=createHash('sha256').update(snap).digest('hex');
 if(hash!==item.sha256||snap.length!==item.bytes)throw new Error('Evo snapshot has drifted: '+item.relative);
 snapshotFiles.push(item.relative+':'+hash);
 const upstream=await readFile(join('E:/CHATGPT/projects/evo-world/src',item.relative)).catch(()=>null);
 if(upstream&&createHash('sha256').update(upstream).digest('hex')!==hash)evoSourceChanges++;
}
const evoHash=createHash('sha256').update(snapshotFiles.join('\n')).digest('hex');
if(evoHash!==evo.snapshotHash)throw new Error('Evo snapshot manifest hash mismatch');
if(evoSourceChanges)console.warn('EVO_UPSTREAM_NEWER_THAN_PINNED='+evoSourceChanges+'; source unchanged by this verification');
for(const path of ['public/index.html','public/app.js','public/style.css','public/admin.html','public/admin.js','model-provider.mjs','agent-planner.mjs','quiz-bank.mjs','public/check-ui.js','public/learning-store.js','public/learning.html','public/learning.js','public/study.html','public/study.js','scripts/evaluate-study.mjs','docs/PRODUCT_BRIEF.md','docs/ACCEPTANCE.md','docs/SCHOOL_API_BYOK.md']){
 if((await stat(path)).size<100)throw new Error('Missing or undersized product asset: '+path);
}
for(const file of ['server.mjs','model-provider.mjs','teaching-quality.mjs','agent-planner.mjs','quiz-bank.mjs','public/app.js','public/admin.js','public/check-ui.js','public/learning-store.js','public/learning.js','public/study.js','public/explore.js','public/rc-ui.js','tests/browser-labs.mjs','tests/browser-labs-rc2.mjs','scripts/evaluate-study.mjs','scripts/build-pfl-adapter.mjs','scripts/snapshot-evo.mjs']){
 execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
}
console.log('AI_ACADEMY_VERIFY_OK','pflSha256='+actual,'evoSha256='+evoHash,
 'evoModules='+evo.files.length,'pflUpstreamChanges='+changed.length,'evoUpstreamChanges='+evoSourceChanges);
