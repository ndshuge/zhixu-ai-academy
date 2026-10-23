/**
 * Freeze only the owned EvoWorld scientific engine modules inside AI Academy.
 * This script READS the upstream project, and WRITES only AI Academy adapters/.
 * Never run this automatically on startup; a maintainer must opt in.
 */
import {readdir,readFile,mkdir,writeFile,rename,rm,stat} from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';
import {resolve,join} from 'node:path';
const ROOT=resolve('E:/CHATGPT/projects/ai-academy');
const SOURCE=resolve('E:/CHATGPT/projects/evo-world/src');
const TARGET=join(ROOT,'adapters','evo-snapshot');
const PROVENANCE=join(ROOT,'adapters','evo-provenance.json');
const refresh=process.argv.includes('--refresh');
const sha=b=>createHash('sha256').update(b).digest('hex');
const files=[];
for(const dir of ['core','science']){
 const children=await readdir(join(SOURCE,dir),{withFileTypes:true});
 for(const c of children){
  if(c.isSymbolicLink())throw new Error('Symlinks not permitted in science source snapshot');
  if(!c.isFile()||!c.name.endsWith('.mjs'))continue;
  const relative=dir+'/'+c.name;
  const value=await readFile(join(SOURCE,dir,c.name));
  files.push({relative,bytes:value.length,sha256:sha(value),value});
 }
}
files.sort((a,b)=>a.relative.localeCompare(b.relative,'en'));
if(files.length<8)throw new Error('Unexpected source module count');
const current=await stat(TARGET).then(()=>true,()=>false);
if(current&&!refresh)throw new Error('Existing snapshot left unchanged. To intentionally upgrade run: node scripts/snapshot-evo.mjs --refresh');
const staging=join(ROOT,'adapters','.evo-staging-'+randomUUID());
await mkdir(staging,{recursive:true});
try{
 for(const f of files){
  const [folder,name]=f.relative.split('/');
  await mkdir(join(staging,folder),{recursive:true});
  await writeFile(join(staging,folder,name),f.value,{flag:'wx'});
 }
 const payload={schemaVersion:1,createdAt:new Date().toISOString(),sourcePath:'E:/CHATGPT/projects/evo-world/src',
  rule:'Only core/science .mjs files; bundled scientific snapshot; original EvoWorld files unchanged',
  files:files.map(({relative,bytes,sha256})=>({relative,bytes,sha256})),
  snapshotHash:sha(Buffer.from(files.map(f=>f.relative+':'+f.sha256).join('\n')))};
 // Avoid replacing an existing snapshot or provenance without the explicit refresh.
 if(current){
  const old=join(ROOT,'adapters','.evo-previous-'+randomUUID());
  await rename(TARGET,old);
  try{await rename(staging,TARGET)}
  catch(e){await rename(old,TARGET);throw e}
  await rm(old,{recursive:true,force:true});
 }else{
  await rename(staging,TARGET);
 }
 await writeFile(PROVENANCE,JSON.stringify(payload,null,2)+'\n');
 console.log('EVO_SNAPSHOT_READY modules='+files.length+' total_bytes='+files.reduce((s,x)=>s+x.bytes,0)+
 ' manifest_sha256='+payload.snapshotHash);
}catch(e){
 await rm(staging,{recursive:true,force:true});
 throw e;
}
