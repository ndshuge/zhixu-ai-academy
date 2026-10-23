import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {createAcademyServer} from '../server.mjs';
import {ProviderRegistry} from '../model-provider.mjs';
const require=createRequire('E:/CHATGPT/projects/physics-frontier-lab/package.json');
const {chromium}=require('playwright');
const provider=new ProviderRegistry({env:{},allowLocal:true,adminToken:'rc3-only-mock',
 fetchImpl:async()=>new Response(JSON.stringify({choices:[{message:{content:'{"choice":"B"}'}}],usage:{total_tokens:16}}),{status:200,
  headers:{'Content-Type':'application/json'}})});
provider.configure({provider:'custom',baseUrl:'http://127.0.0.1:1/v1',model:'rc3-test-stub',
 apiKey:'mock-do-not-use',dailyLimit:10});
const output=join(process.cwd(),'evidence','rc3-20261012');
await mkdir(output,{recursive:true});
const app=createAcademyServer({providerRegistry:provider});
await new Promise(r=>app.listen(0,'127.0.0.1',r));
const origin='http://127.0.0.1:'+app.address().port;
let browser;
try{
 browser=await chromium.launch({channel:'msedge',headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 const pageErrors=[];page.on('pageerror',e=>pageErrors.push(e.message));
 await page.goto(origin+'/',{waitUntil:'networkidle'});
 assert.match(await page.locator('#lens-evidence').innerText(),/尚未运行/);
 assert.equal(await page.locator('#plan-model-consent-wrap').isVisible(),false);
 assert.equal(await page.locator('#plan-model-consent').isChecked(),false);
 await page.locator('#prediction-input').fill('我认为很小的初始偏差可能使两条曲线后期显著分离');
 await page.locator('#run').click();
 await page.locator('#results').waitFor({state:'visible'});
 assert.match(await page.locator('#lens-hypothesis').innerText(),/已锁定/);
 assert.match(await page.locator('#lens-evidence').innerText(),/Physics Frontier Lab/);
 await page.locator('#ask').click(); // Mentor deliberately local; no data-sharing checkbox checked.
 await page.locator('#agent-planning').waitFor({state:'visible'});
 assert.equal(await page.locator('#plan-model-consent-wrap').isVisible(),true);
 assert.equal(provider.callsToday,0);
 await page.locator('#plan-model-consent').check();
 await page.locator('#planning-goal').fill('我想知道减小扰动后分离是否推迟');
 await page.locator('#request-plan').click();
 await page.locator('#plan-preview').waitFor({state:'visible'});
 assert.match(await page.locator('#plan-hint').innerText(),/真实模型已在两种安全实验中选择/);
 assert.equal(await page.locator('#explain-mode').getAttribute('data-mode'),'llm');
 assert.match(await page.locator('#explain-evidence').innerText(),/模型只从服务器验证的两方案中选择一个/);
 assert.match(await page.locator('#explain-approval').innerText(),/没有执行/);
 assert.match(await page.locator('#lens-next').innerText(),/模型选择的受约束实验/);
 assert.match(await page.locator('#plan-limits').innerText(),/真实模型仅选择|经授权的真实模型/);
 assert.equal(provider.callsToday,1);
 assert.equal(await page.locator('#approve-plan').isDisabled(),true);
 assert.match(await page.locator('#raw-output').textContent(),/logDelta": -10/);
 await page.screenshot({path:join(output,'rc3-consented-model-plan-desktop.png'),fullPage:true});
 await page.locator('#approval-prediction').fill('我预期进一步缩小初值扰动，达到分离阈值的时刻可能推迟');
 await page.locator('#approve-plan').click();
 await page.locator('#experiment-comparison').waitFor({state:'visible'});
 assert.match(await page.locator('#explain-approval').innerText(),/已明确批准/);
 assert.equal(await page.locator('#plan-model-consent').isChecked(),false);
 assert.match(await page.locator('#lens-hypothesis').innerText(),/已锁定/);
 assert.equal(provider.callsToday,1);
 await page.setViewportSize({width:390,height:844});
 await page.goto(origin+'/',{waitUntil:'networkidle'});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
 await page.screenshot({path:join(output,'rc3-model-plan-mobile-390.png'),fullPage:true});
 assert.deepEqual(pageErrors,[]);
 const receipt={status:'PASS',time:new Date().toISOString(),scenario:'local mock model only: no real external API',
  checks:['independent plan consent off by default','mentor works without outbound call',
   'explicit model plan selection after consent','plan is displayed before any execution',
   'separate approval and new prediction required','approval uses safe plan',
   'consent reset after approval','three evidence cards update across stages',
   '390px no horizontal overflow','no page errors'],
  actualModelCalls:provider.callsToday,realRemoteModelCalls:0};
 await writeFile(join(output,'rc3-browser-acceptance.json'),JSON.stringify(receipt,null,2)+'\n');
 console.log('RC3_BROWSER_MODEL_PLAN_OK',receipt.checks.length,'checks','outbound_mock_calls',provider.callsToday);
}catch(err){console.error('RC3_BROWSER_MODEL_PLAN_FAIL',err.stack||err);process.exitCode=1}
finally{await browser?.close();await new Promise(r=>app.close(r))}
