// V3.9 one extra consented *real* Coding Plan call for legible film insert.
import {createRequire} from 'node:module';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {open,mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const root=fileURLToPath(new URL('../',import.meta.url));
const out=join(root,'evidence','rc3-20261012','g2-demo-20261014','live-ui');
await mkdir(out,{recursive:true});
const before=await fetch('http://127.0.0.1:4396/api/status').then(x=>x.json());
const flag=await open(join(out,'V39_MENTOR_CLOSEUP_ONCE.json'),'wx');
await flag.writeFile(JSON.stringify({issuedAt:new Date().toISOString(),
 action:'one consented synthetic student live model mentor request; no retries',
 expectedUsedBefore:before.usage.today,model:before.model},null,2));await flag.close();
assert.equal(before.providerSource,'isolated-Pi-RPC');
assert.ok(before.usage.today<=4,'request budget exhausted');
const require=createRequire('E:/CHATGPT/projects/physics-frontier-lab/package.json');
const {chromium}=require('playwright');
let browser;
const pages=[];
try{
 browser=await chromium.launch({channel:'msedge',headless:true});
 const page=await browser.newPage({viewport:{width:1600,height:900},deviceScaleFactor:1});pages.push(page);
 await page.goto('http://127.0.0.1:4396/',{waitUntil:'networkidle'});
 await page.locator('#prediction-input').fill('我原来猜想同一公式会让极其相近的初值始终保持接近，但后面的数据似乎推翻了这个想法。');
 await page.locator('#run').click();
 await page.locator('#results').waitFor({state:'visible'});
 await page.locator('#reflection').fill('相同映射公式却出现了两条轨道不同的结果。我希望你引用第43步的数值证据，而不是给出一段泛泛的答案。');
 await page.locator('#shareApproved').check();
 await page.locator('#ask').click();
 await page.waitForFunction(()=>document.querySelector('#mentor-output')?.innerText.includes('远程 AI 导师'),{timeout:160000}).catch(()=>{});
 const displayed=await page.locator('#mentor-output').innerText();
 const status=await fetch('http://127.0.0.1:4396/api/status').then(x=>x.json());
 assert.equal(status.usage.today,before.usage.today+1);
 assert.match(displayed,/远程 AI 导师/);
 assert.match(displayed,/AI引导/);
 assert.match(displayed,/第43步|43步/);
 await page.locator('#mentor-output').scrollIntoViewIfNeeded();
 await page.screenshot({path:join(out,'12-real-mentor-closeup-for-v39.png'),fullPage:false});
 await page.locator('#agent-planning').scrollIntoViewIfNeeded();
 await page.screenshot({path:join(out,'13-real-mentor-plan-entry-for-v39.png'),fullPage:false});
 const artifact={pass:true,time:new Date().toISOString(),
  realModelRequests:1,model:status.model,user:'synthetic Playwright learner',
  toolExecution:0,renderedText:displayed,providerStatus:status.provider,
  screenshots:['12-real-mentor-closeup-for-v39.png','13-real-mentor-plan-entry-for-v39.png']};
 await writeFile(join(out,'V39_MENTOR_CLOSEUP_EVIDENCE.json'),JSON.stringify(artifact,null,2)+'\n');
 console.log('V39_REAL_MENTOR_CLOSEUP_PASS',JSON.stringify({used:status.usage.today,characters:displayed.length}));
}catch(e){console.error('V39_REAL_MENTOR_CLOSEUP_FAIL',String(e.stack||e).slice(0,1100));process.exitCode=1}
finally{await browser?.close()}
