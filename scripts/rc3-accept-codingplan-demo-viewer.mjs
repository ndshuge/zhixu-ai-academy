import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
const project=fileURLToPath(new URL('../',import.meta.url));
const root=join(project,'evidence','rc3-20261012','g2-demo-20261014');
const require=createRequire('E:/CHATGPT/projects/physics-frontier-lab/package.json');
const {chromium}=require('playwright');
let browser;
try{
 browser=await chromium.launch({channel:'msedge',headless:true});
 const p=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
 const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(pathToFileURL(join(root,'WATCH_CODINGPLAN_TUTOR_DEMO.html')).href,{waitUntil:'load'});
 assert.match(await p.title(),/知序AI学院/);
 assert.match(await p.locator('h1').innerText(),/学生重新理解自己的错误/);
 assert.equal(await p.locator('svg polyline').count(),2);
 assert.match(await p.locator('svg').textContent(),/第43步/);
 assert.match(await p.locator('body').innerText(),/1 次/);
 assert.match(await p.locator('body').innerText(),/0 次/);
 assert.match(await p.locator('body').innerText(),/合成学生的错误直觉/);
 assert.match(await p.locator('body').innerText(),/DeepSeek V4.1 Flash/i);
 assert.match(await p.locator('body').innerText(),/苏格拉底追问/);
 assert.match(await p.locator('body').innerText(),/尚未执行/);
 assert.equal((await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)),false);
 await p.screenshot({path:join(root,'CODINGPLAN_DEMO_REVIEW_DESKTOP.png'),fullPage:true});
 await p.setViewportSize({width:390,height:844});
 assert.equal((await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)),false);
 await p.screenshot({path:join(root,'CODINGPLAN_DEMO_REVIEW_MOBILE.png'),fullPage:true});
 assert.deepEqual(errors,[]);
 const acceptance=JSON.parse(await readFile(join(root,'CODINGPLAN_DEMO_VIEWER_ACCEPTANCE.json'),'utf8'));
 acceptance.browserReview='PASS';acceptance.desktopAnd390pxNoOverflow=true;
 acceptance.pageErrors=0;acceptance.screenshots=['CODINGPLAN_DEMO_REVIEW_DESKTOP.png','CODINGPLAN_DEMO_REVIEW_MOBILE.png'];
 await writeFile(join(root,'CODINGPLAN_DEMO_VIEWER_ACCEPTANCE.json'),JSON.stringify(acceptance,null,2)+'\n');
 console.log('CODINGPLAN_DEMO_VIEWER_PASS 2 sizes 0 errors');
}catch(e){console.error('CODINGPLAN_DEMO_VIEWER_FAIL',e.stack||e);process.exitCode=1}
finally{await browser?.close()}
