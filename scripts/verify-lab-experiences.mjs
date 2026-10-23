import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
const p=JSON.parse(await readFile('adapters/lab-experience-provenance.json','utf8'));
const sha=b=>createHash('sha256').update(b).digest('hex');
for(const lab of p.labs){
 for(const file of lab.files){const b=await readFile(join('public/labs',lab.id,file.path));if(sha(b)!==file.sha256)throw Error('Installed presentation drift: '+file.path);
 const src=await readFile(join(lab.upstream,'dist',file.path)).catch(()=>null);if(src&&sha(src)!==file.sourceSha256)throw Error('Upstream dist changed: '+file.path)}
 const git=execFileSync('git',['-C',lab.upstream,'status','--porcelain'],{encoding:'utf8'}).trim();if(git)throw Error('Upstream dirty');
 const head=execFileSync('git',['-C',lab.upstream,'rev-parse','HEAD'],{encoding:'utf8'}).trim();if(head!==lab.head)throw Error('Upstream HEAD changed');
 console.log('LAB_EXPERIENCE_SHA_OK',lab.id,lab.files.length,lab.head,lab.installedDigest);
}
const baseline=JSON.parse(await readFile('evidence/rc-20261012/preserved-baseline.json','utf8'));
for(const f of baseline.filter(x=>x.path.startsWith('adapters/')||x.path.startsWith('submission/'))){if(sha(await readFile(f.path))!==f.sha256)throw Error('Protected historical asset changed: '+f.path)}
console.log('PROTECTED_BASELINE_OK scientific adapters + all old submission files');
