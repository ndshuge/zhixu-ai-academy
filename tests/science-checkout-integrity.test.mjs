import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
test('EvoWorld pinned snapshots survive Windows Git checkout byte-for-byte',async()=>{
 const ev=JSON.parse(await readFile('adapters/evo-provenance.json','utf8'));
 for(const {relative,sha256,bytes}of ev.files){
  const data=await readFile('adapters/evo-snapshot/'+relative);
  assert.equal(hash(data),sha256,'snapshot drift: '+relative);
  assert.equal(data.length,bytes,'snapshot length drift: '+relative);
 }
});
test('PFL and Evo snapshots are declared byte-stable in Git attributes',async()=>{
 const attributes=await readFile('.gitattributes','utf8');
 assert.match(attributes,/^adapters\/pfl-engine\.mjs\s+-text/m);
 assert.match(attributes,/^adapters\/pfl\.entry\.ts\s+-text/m);
 assert.match(attributes,/^adapters\/evo-snapshot\/\*\*\s+-text/m);
});