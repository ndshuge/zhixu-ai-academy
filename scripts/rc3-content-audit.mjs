/** Limited content leak scan of this G2/G4 delivery's explicitly listed text artifacts.
 * Never walks or reads personal configuration, credential catalogs, agent sessions,
 * model auth headers, private student records or arbitrary sibling projects.
 */
import {readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const paths=[
 'docs/RC3_G2_CODINGPLAN_REAL_AB_20261012.md',
 'docs/RC3_G4_FIELD_PILOT_PACK_20261012.md',
 'scripts/rc3-prepare-live-test.mjs',
 'scripts/rc3-live-pi-once.mjs',
 'scripts/rc3-score-live-v1.mjs',
 'scripts/rc3-verify-live-evidence.mjs',
 'evidence/rc3-20261012/g2-live/frozen-cases.json',
 'evidence/rc3-20261012/g2-live/live-prompt.txt',
 'evidence/rc3-20261012/g2-live/live-real-vs-rules-results.json',
 'evidence/rc3-20261012/g2-live/postcall-no-network-audit.json',
 'evidence/rc3-20261012/g2-live/live-request-ack.json'
];
const patterns=[
 /(?:sk-|token[_-]|Bearer\s+)[A-Za-z0-9_\-.]{28,}/i,
 /(?:apiKey|api_key|password|client_secret)\s*[=:]\s*['"][A-Za-z0-9_\-.]{15,}['"]/i,
 /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/
];
const found=[];let total=0;
for(const relative of paths){
 const body=await readFile(join(root,relative),'utf8');total+=Buffer.byteLength(body,'utf8');
 if(patterns.some(p=>p.test(body)))found.push(relative);
}
const receipt={scope:'only eleven G2/G4 public-facing delivery text artifacts; not entire project/history/media',
 scannedCount:paths.length,totalBytes:total,secretPatternMatchesFound:found.length,filesWithMatches:found,
 status:found.length?'FAIL':'PASS',limitations:'Regex-based spot check cannot prove no sensitive information exists in any other file or image'};
await writeFile(join(root,'evidence','rc3-20261012','g2-live','content-audit.json'),JSON.stringify(receipt,null,2)+'\n');
console.log('RC3_G2_G4_DELIVERY_CONTENT_SPOT_CHECK',receipt.status,'checked='+receipt.scannedCount,'matchingFiles='+found.length);
if(found.length)process.exitCode=1;
