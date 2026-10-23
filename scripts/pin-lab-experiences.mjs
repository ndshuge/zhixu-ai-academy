import {readFile,writeFile,mkdir,readdir,copyFile,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {join,resolve} from 'node:path';
const root=resolve('.'),sha=b=>createHash('sha256').update(b).digest('hex');
async function files(dir,prefix='') {const out=[];for(const e of await readdir(dir,{withFileTypes:true})){if(e.isSymbolicLink())throw Error('Symlink forbidden');const rel=prefix+e.name;if(e.isDirectory())out.push(...await files(join(dir,e.name),rel+'/'));else out.push(rel)}return out.sort()}
const baseline=[];
if(!await access('evidence/rc-20261012/preserved-baseline.json').then(()=>true).catch(()=>false)){
for(const dir of ['public','adapters','submission'])for(const rel of await files(join(root,dir))){const b=await readFile(join(root,dir,rel));baseline.push({path:dir+'/'+rel,sha256:sha(b),bytes:b.length});if(dir==='public'){const dst=join(root,'evidence/rc-20261012/baseline-source/public',rel);await mkdir(resolve(dst,'..'),{recursive:true});await writeFile(dst,b)}}
await writeFile('evidence/rc-20261012/preserved-baseline.json',JSON.stringify(baseline,null,2));
}
const labs=[];
for(const [id,upstream,kernel] of [['pfl','physics-frontier-lab','pfl-kernel-1.0.0'],['evo','evo-world','evoworld-0.1.1']]){
 const src=resolve(root,'..',upstream),dest=join(root,'public/labs',id);
 const head=execFileSync('git',['-C',src,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
 const status=execFileSync('git',['-C',src,'status','--porcelain'],{encoding:'utf8'}).trim();if(status)throw Error('Upstream not clean: '+id);
 const manifest=[];
 for(const rel of await files(join(src,'dist'))){const before=await readFile(join(src,'dist',rel));let after=before;
  if(/\.(html|css|mjs|js)$/.test(rel))after=Buffer.from(before.toString('utf8').replace(/\/(assets|src|results)\//g,(_,part)=>'/labs/'+id+'/'+part+'/'));
  const dst=join(dest,rel);await mkdir(resolve(dst,'..'),{recursive:true});await writeFile(dst,after);
  manifest.push({path:rel,sourceSha256:sha(before),sha256:sha(after),bytes:after.length,relocated:sha(before)!==sha(after)});
 }
 if(id==='pfl')for(const rel of await files(join(src,'licenses'))){await mkdir(join(dest,'licenses'),{recursive:true});await copyFile(join(src,'licenses',rel),join(dest,'licenses',rel));}
 labs.push({id,upstream:src,head,productVersion:'0.4.0',kernel,files:manifest,sourceDigest:sha(manifest.map(x=>x.path+':'+x.sourceSha256).join('\n')),installedDigest:sha(manifest.map(x=>x.path+':'+x.sha256).join('\n'))});
}
await writeFile('adapters/lab-experience-provenance.json',JSON.stringify({createdAt:new Date().toISOString(),scope:'Local fixed presentation copies; scientific adapters unchanged',labs},null,2)+'\n');
console.log('PINNED_LABS_OK',labs.map(x=>x.id+':'+x.files.length).join(' '));
