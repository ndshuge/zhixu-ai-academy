import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join,resolve} from 'node:path';
const pfl=resolve('..','physics-frontier-lab');
const root=resolve('.');
const require=createRequire(join(pfl,'package.json'));
const {build}=require('esbuild');
const src=join(root,'adapters','pfl.entry.ts');
const output=join(root,'adapters','pfl-engine.mjs');
const meta=await build({entryPoints:[src],bundle:true,write:true,outfile:output,format:'esm',platform:'node',target:'node22',metafile:true,logLevel:'warning'});
const dependencies=[];
for(const key of Object.keys(meta.metafile.inputs)){
  const path=resolve(root,key);
  const raw=await readFile(path);
  dependencies.push({path:key,sha256:createHash('sha256').update(raw).digest('hex')});
}
const artifact=await readFile(output);
const proof={timestamp:new Date().toISOString(),source:"E:/CHATGPT/projects/physics-frontier-lab",engine:"PFL v0.2 source",note:"Read-only bundled snapshot; upstream may have uncommitted changes; do not claim independent numeric validation.",bundleSha256:createHash('sha256').update(artifact).digest('hex'),dependencies};
await writeFile(join(root,'adapters','pfl-provenance.json'),JSON.stringify(proof,null,2));
console.log('PFL_ADAPTER_BUILT',proof.bundleSha256,dependencies.length);
