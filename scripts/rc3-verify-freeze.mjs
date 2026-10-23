/**
 * RC3 immutable baseline integrity verification. Does not alter sources.
 * This checks the copied snapshot, not whether the actively edited working
 * files still match RC2.
 */
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const base=join(root,'evidence','rc3-20261012','baseline');
const manifest=JSON.parse(await readFile(join(base,'manifest.json'),'utf8'));
let total=0,bytes=0;const mismatches=[];
for(const row of manifest.records){
 const content=await readFile(join(base,'original',row.path)).catch(()=>null);
 if(!content){mismatches.push({file:row.path,error:'missing snapshot'});continue}
 const hash=createHash('sha256').update(content).digest('hex');
 if(hash!==row.sha256||content.length!==row.size)mismatches.push({file:row.path,error:'checksum mismatch'});
 total++;bytes+=content.length;
}
if(mismatches.length){console.error('RC3_BASELINE_INTEGRITY_FAILED',JSON.stringify(mismatches));process.exitCode=1}
else console.log('RC3_BASELINE_INTEGRITY_OK files='+total+' bytes='+bytes);
