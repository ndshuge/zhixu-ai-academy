/**
 * RC3 pre-media checkpoint: explicit allowlist, immutable once created.
 * This is a source/evidence checkpoint, not a stand-alone deployable release
 * or official submission ZIP. No private credentials/participants copied.
 */
import {readFile,writeFile,copyFile,mkdir,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const out=join(root,'evidence','rc3-20261012','premedia','release-source-snapshot');
const paths=[
 'package.json','server.mjs','science-safety-demo.mjs','agent-planner.mjs','llm-science-planner.mjs',
 'public/index.html','public/app.js','public/check-ui.js','public/explore.html','public/explore.js',
 'public/flagship-ui.js','public/premedia-ui.js','public/premedia.css','public/style.css',
 'tests/browser-premedia.mjs','tests/browser-rc3.mjs','tests/browser-flagship.mjs',
 'tests/rc3-premedia-safety.test.mjs','scripts/rc3-science-benchmark.mjs',
 'scripts/rc3-premedia-freeze.mjs','scripts/rc3-premedia-content-audit.mjs',
 'docs/RC3_PREMEDIA_P0_P5_IMPLEMENTATION_20261012.md',
 'docs/RC3_PREMEDIA_DELIVERY_20261012.md',
 'evidence/rc3-20261012/g2-benchmark/result-p5-60.json',
 'evidence/rc3-20261012/g2-benchmark/cases-p5-60.json',
 'evidence/rc3-20261012/premedia/acceptance.json',
 'evidence/rc3-20261012/acceptance/summary.json'
];
const manifest=join(out,'manifest.json');
try{await stat(manifest);console.log('RC3_PREMEDIA_FREEZE_ALREADY_EXISTS (not overwritten)');process.exit(0)}
catch(e){if(e.code!=='ENOENT')throw e}
const entries=[];
for(const relative of paths){
 const data=await readFile(join(root,relative));
 if(data.length>1_500_000)throw Error('Unusually large source artifact in snapshot: '+relative);
 const target=join(out,'files',relative);
 await mkdir(dirname(target),{recursive:true});
 await copyFile(join(root,relative),target);
 entries.push({path:relative,bytes:data.length,sha256:createHash('sha256').update(data).digest('hex')});
}
await writeFile(manifest,JSON.stringify({
 title:'AI学院 RC3 P0-P5 source checkpoint, not official submission',
 date:new Date().toISOString(),copies:entries.length,
 security:'allowlist only; excludes credentials, Pi sessions and real participant data',
 appVersion:'0.4.1-rc.3',allAcceptance:'11/11',
 docs:'docs/RC3_PREMEDIA_DELIVERY_20261012.md',entries
},null,2)+'\n');
console.log('RC3_PREMEDIA_RELEASE_SOURCE_FROZEN',entries.length,'files');
