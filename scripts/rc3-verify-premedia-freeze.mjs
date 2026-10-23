/** Verify RC3 premedia snapshot and current source identity; no modifications. */
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const base=join(root,'evidence','rc3-20261012','premedia','release-source-snapshot');
const manifest=JSON.parse(await readFile(join(base,'manifest.json'),'utf8'));
const invalid=[];
for(const entry of manifest.entries){
 for(const [type,file] of [['frozen',join(base,'files',entry.path)],['current',join(root,entry.path)]]){
  const source=await readFile(file).catch(()=>null);
  const sha=source&&createHash('sha256').update(source).digest('hex');
  if(!source||sha!==entry.sha256||source.length!==entry.bytes)invalid.push({type,file:entry.path});
 }
}
console.log('RC3_PREMEDIA_FREEZE',invalid.length?'FAIL':'PASS',
 'files='+manifest.entries.length,
 'snapshot_and_current_agree='+String(invalid.length===0));
if(invalid.length){console.error(JSON.stringify(invalid));process.exitCode=1}
