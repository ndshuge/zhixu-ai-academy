import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {join} from 'node:path';
import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const root=fileURLToPath(new URL('../',import.meta.url));
const dir=join(root,'evidence','rc3-20261012','g2-demo-20261014','live-ui');
const require=createRequire('E:/CHATGPT/projects/physics-frontier-lab/package.json');
const {chromium}=require('playwright');
const report=JSON.parse(await readFile(join(dir,'REAL_CODINGPLAN_BROWSER_VIDEO_ACCEPTANCE.json'),'utf8'));
assert.equal(report.externalCalls,2);
assert.equal(report.mentorRealModel,true);
assert.equal(report.constrainedPlanRealModel,true);
assert.equal(report.humanStudentParticipants,0);
assert.equal(report.steps.at(-1).step,'full-synthetic-learning-chain-complete');
let browser;
try{
 browser=await chromium.launch({channel:'msedge',headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(join(dir,'watch_codingplan_live_demo.html')).href,{waitUntil:'load'});
 assert.match(await page.locator('h1').textContent(),/AI导师实时参与/);
 const film=page.locator('video');
 await film.evaluate(async node=>{
  await new Promise((resolve,reject)=>{
   if(node.readyState>=1)return resolve();
   const t=setTimeout(()=>reject(Error('video metadata timeout')),8000);
   node.addEventListener('loadedmetadata',()=>{clearTimeout(t);resolve()},{once:true});
   node.load();
  });
 });
 const details=await film.evaluate(node=>({
  duration:node.duration,width:node.videoWidth,height:node.videoHeight,src:node.currentSrc}));
 assert.ok(Math.abs(details.duration-32.72)<.3);
 assert.equal(details.width,1600);assert.equal(details.height,900);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
 await page.screenshot({path:join(dir,'FILM_REVIEW_DESKTOP.png'),fullPage:true});
 await page.setViewportSize({width:390,height:844});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
 await page.screenshot({path:join(dir,'FILM_REVIEW_MOBILE.png'),fullPage:true});
 assert.deepEqual(errors,[]);
 const out={status:'PASS',date:new Date().toISOString(),
  source:'independent Edge video metadata + media file + synthetic lesson evidence',
  videoMetadata:details,checks:['actual MP4 loaded in Edge','1600x900 32.72s footage',
   '2 real consented requests and no personal learner','desktop and mobile player no overflow','no script errors'],
  screenshots:['FILM_REVIEW_DESKTOP.png','FILM_REVIEW_MOBILE.png'],
  realPeopleTested:0};
 await writeFile(join(dir,'FILM_REVIEW_ACCEPTANCE.json'),JSON.stringify(out,null,2)+'\n');
 console.log('CODINGPLAN_LIVE_FILM_REVIEW_PASS',details.duration+'s',details.width+'x'+details.height);
}catch(e){console.error('CODINGPLAN_LIVE_FILM_REVIEW_FAIL',e.stack||e);process.exitCode=1}
finally{await browser?.close()}
