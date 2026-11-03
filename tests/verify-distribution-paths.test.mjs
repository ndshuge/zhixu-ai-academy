import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
test('science verification validates actually shipped V5 documents, not legacy-only paths',async()=>{
 const verify=await readFile('scripts/verify.mjs','utf8');
 for(const missing of ['docs/PRODUCT_BRIEF.md','docs/ACCEPTANCE.md','docs/SCHOOL_API_BYOK.md']){
  assert.equal(verify.includes("'"+missing+"'"),false,'Verifier references an unshipped document: '+missing);
 }
 for(const current of ['README.md','docs/APPLE_V5_FULL_AUDIT_QA_20261103.md','docs/APPLE_V5_RESEARCH_AND_SKILLS_20261103.md']){
  assert.equal(verify.includes("'"+current+"'"),true,'Verifier must require shipped document: '+current);
  assert.ok((await stat(current)).size>100);
 }
});