import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {isAbsolute,join,resolve,relative,sep} from 'node:path';

const sha256 = value => createHash('sha256').update(value).digest('hex');

/**
 * Verify bundled PFL evidence independently of its original source checkout.
 * Bundle authenticity is mandatory; post-snapshot upstream drift is reported
 * separately. This supports independent Git worktrees and judge ZIP archives.
 */
export async function verifyPflProvenance({root=process.cwd()}={}){
 const project=resolve(root);
 const evidence=JSON.parse(await readFile(join(project,'adapters/pfl-provenance.json'),'utf8'));
 const actual=sha256(await readFile(join(project,'adapters/pfl-engine.mjs')));
 if(actual!==evidence.bundleSha256)throw new Error('PFL adapter SHA256 mismatch: stored artifact does not match its pinned provenance');
 const source=typeof evidence.source==='string'&&isAbsolute(evidence.source)?resolve(evidence.source):null;
 const changed=[],missingUpstream=[];
 for(const item of evidence.dependencies??[]){
  const dep=item.path.replace(/\\/g,'/');
  let candidate;
  if(dep==='adapters/pfl.entry.ts'){
   candidate=resolve(project,dep);
  }else if(/^\.\.\/physics-frontier-lab\/src\/[a-zA-Z0-9_./-]+\.(?:ts|tsx)$/.test(dep)&&source){
   const sub=dep.slice('../physics-frontier-lab/'.length);
   candidate=resolve(source,sub);
   const walk=relative(source,candidate);
   if(walk==='..'||walk.startsWith('..'+sep)||isAbsolute(walk))throw new Error('Untrusted PFL provenance dependency path');
  }else{
   throw new Error('Untrusted PFL provenance dependency path: '+dep);
  }
  let bytes;
  try{bytes=await readFile(candidate)}catch(error){
   if(error?.code==='ENOENT'){missingUpstream.push(dep);continue}
   throw error;
  }
  if(sha256(bytes)!==item.sha256)changed.push(dep);
 }
 return {bundleSha256:actual,changed,missingUpstream,dependencies:evidence.dependencies?.length??0};
}
