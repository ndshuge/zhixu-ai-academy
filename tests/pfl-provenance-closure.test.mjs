import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, mkdtemp, mkdir, writeFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';

const sha = b => createHash('sha256').update(b).digest('hex');

test('the pinned PFL artifact matches the recorded provenance SHA, not a new hash', async()=>{
 const manifest=JSON.parse(await readFile('adapters/pfl-provenance.json','utf8'));
 const artifact=await readFile('adapters/pfl-engine.mjs');
 assert.equal(sha(artifact),manifest.bundleSha256,'Committed PFL bytes must equal original evidence');
});

test('PFL verifier accepts a sealed bundle when optional upstream source is not mounted',async()=>{
 const {verifyPflProvenance}=await import('../scripts/pfl-provenance-verifier.mjs');
 const root=await mkdtemp(join(tmpdir(),'zhixu-pfl-'));
 try{
  await mkdir(join(root,'adapters'));
  const bytes=Buffer.from('export const test = 17;');
  await writeFile(join(root,'adapters','pfl-engine.mjs'),bytes);
  await writeFile(join(root,'adapters','pfl-provenance.json'),JSON.stringify({
   source:join(root,'unmounted-upstream'),bundleSha256:sha(bytes),
   dependencies:[{path:'../physics-frontier-lab/src/catalog.ts',sha256:sha(Buffer.from('old'))}]
  }));
  const result=await verifyPflProvenance({root});
  assert.equal(result.bundleSha256,sha(bytes));
  assert.equal(result.missingUpstream.length,1);
  assert.equal(result.changed.length,0);
 }finally{await rm(root,{recursive:true,force:true})}
});

test('PFL verifier blocks path traversal and never skips artifact tampering',async()=>{
 const {verifyPflProvenance}=await import('../scripts/pfl-provenance-verifier.mjs');
 const root=await mkdtemp(join(tmpdir(),'zhixu-pfl-tamper-'));
 try{
  await mkdir(join(root,'adapters'));
  await writeFile(join(root,'adapters','pfl-engine.mjs'),'TAMPERED');
  await writeFile(join(root,'adapters','pfl-provenance.json'),JSON.stringify({
   source:join(root,'unmounted-upstream'),bundleSha256:sha(Buffer.from('untampered')),
   dependencies:[{path:'../../../../outside.ts',sha256:'aaaa'}]
  }));
  await assert.rejects(verifyPflProvenance({root}),/PFL adapter SHA256 mismatch|untrusted/i);
 }finally{await rm(root,{recursive:true,force:true})}
});