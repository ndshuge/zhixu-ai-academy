/**
 * Scope-limited RC3 premedia public artifact text spot-check.
 * Only explicitly listed new product files and generated synthetic evidence.
 * Never traverses or reads credentials, Pi session files or student data.
 */
import {readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const files=[
 'docs/RC3_PREMEDIA_P0_P5_IMPLEMENTATION_20261012.md',
 'docs/RC3_PREMEDIA_DELIVERY_20261012.md','README.md','AGENTS.md',
 'public/index.html','public/premedia-ui.js','public/premedia.css',
 'science-safety-demo.mjs','server.mjs','scripts/rc3-science-benchmark.mjs',
 'tests/rc3-premedia-safety.test.mjs','tests/browser-premedia.mjs',
 'evidence/rc3-20261012/g2-benchmark/result-p5-60.json',
 'evidence/rc3-20261012/g2-benchmark/cases-p5-60.json',
 'evidence/rc3-20261012/premedia/acceptance.json'
];
const sensitive=[
 /(?:sk-[a-z0-9_-]{25,})/i,
 /(?:ghp_[a-z0-9]{30,})/i,
 /(?:Bearer\s+[A-Za-z0-9._~-]{30,})/,
 /(?:apiKey|api_key|client_secret|password)\s*[:=]\s*['"][a-z0-9._~-]{24,}['"]/i,
 /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/
];
let bytes=0;const findings=[];
for(const file of files){
 const data=await readFile(join(root,file),'utf8');bytes+=Buffer.byteLength(data,'utf8');
 if(sensitive.some(regex=>regex.test(data)))findings.push(file);
}
const result={status:findings.length?'FAIL':'PASS',scannedTextFiles:files.length,scannedBytes:bytes,
 potentialCredentialPatternsFound:findings.length,affectedFiles:findings,
 scope:'PREMEDIA explicit allowlist; does not check all history or binary/screenshots',
 actualRemoteModelCallsFromThisScan:0,checkedAt:new Date().toISOString()};
await writeFile(join(root,'evidence','rc3-20261012','premedia','text-safety-audit.json'),JSON.stringify(result,null,2)+'\n');
console.log('PREMEDIA_TEXT_SPOT_AUDIT',result.status,'files='+files.length,'hits='+findings.length);
if(findings.length)process.exitCode=1;
