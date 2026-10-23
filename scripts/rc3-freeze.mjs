/**
 * RC3 kickoff: allowlisted, read-only source snapshot & hash manifest.
 * Never walk credential directories or copy personal keys. Existing snapshot is immutable.
 */
import {mkdir,readFile,writeFile,copyFile,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const out=join(root,'evidence','rc3-20261012','baseline');
const files=[
 'server.mjs','agent-planner.mjs','model-provider.mjs','teaching-quality.mjs',
 'quiz-bank.mjs','package.json','README.md','AGENTS.md',
 'public/app.js','public/index.html','public/style.css','public/learning-store.js',
 'tests/agent.test.mjs','tests/api.test.mjs','tests/learning.test.mjs',
 'docs/COORDINATOR_RC2_DELIVERY_20261012.md','docs/STATUS.md','docs/ROADMAP.md',
 'submission/rc2-20261012/AI学院-作品介绍-RC2审核候选.pdf',
 'submission/rc2-20261012/AI学院-RC2-Kokoro讲解与完整操作-审核候选.mp4',
 'submission/rc2-20261012/AI-Academy-RC2-Review-NOT-SUBMIT.zip'
];
await mkdir(out,{recursive:true});
const manifestPath=join(out,'manifest.json');
try{
 await stat(manifestPath);
 console.log('RC3_BASELINE_EXISTS: refused to overwrite');process.exit(0);
}catch(e){if(e.code!=='ENOENT')throw e;}
const records=[];
for(const relative of files){
 const src=resolve(root,relative);
 if(!src.startsWith(resolve(root)+'\\')&&!src.startsWith(resolve(root)+'/'))throw Error('path escaped');
 const bytes=await readFile(src);
 const sha256=createHash('sha256').update(bytes).digest('hex');
 const dest=join(out,'original',relative);
 await mkdir(dirname(dest),{recursive:true});
 await copyFile(src,dest);
 records.push({path:relative,size:bytes.length,sha256});
}
const data={createdAt:new Date().toISOString(),purpose:'RC2 immutable code + candidate artifact snapshot before RC3',sources:'explicit allowlist only',security:'no key/config/credentials copied',records};
await writeFile(manifestPath,JSON.stringify(data,null,2),'utf8');
console.log('RC3_BASELINE_FROZEN',records.length,'files',records.reduce((n,r)=>n+r.size,0),'bytes');
