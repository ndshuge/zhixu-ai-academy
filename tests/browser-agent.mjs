import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {createAcademyServer} from '../server.mjs';
import {ProviderRegistry} from '../model-provider.mjs';
const require=createRequire('E:/CHATGPT/projects/physics-frontier-lab/package.json');
const {chromium}=require('playwright');
const output=join(process.cwd(),'evidence','browser');await mkdir(output,{recursive:true});
const app=createAcademyServer({providerRegistry:new ProviderRegistry({env:{}})});
await new Promise(resolve=>app.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+app.address().port;
let browser;
try{
 browser=await chromium.launch({channel:'msedge',headless:true});
 const page=await browser.newPage({viewport:{width:1366,height:900}});
 const errors=[];page.on('pageerror',err=>errors.push(err.message));
 await page.goto(base+'/',{waitUntil:'networkidle'});
 assert.equal(await page.locator('#agent-planning').isVisible(),false);
 assert.equal(await page.locator('#run').isDisabled(),true);
 await page.locator('#prediction-input').fill('第一次预测：初值很接近的轨道会逐渐分离。');
 await page.locator('#run').click();
 await page.locator('#results').waitFor({state:'visible',timeout:10000});
 assert.match(await page.locator('#raw-output').textContent(),/logDelta": -10/);
 assert.equal(await page.locator('#agent-planning').isVisible(),false);
 await page.locator('#reflection').fill('我想把初值差异改大一些，再看分离时间。');
 await page.locator('#ask').click();
 await page.locator('#agent-planning').waitFor({state:'visible',timeout:10000});
 assert.match(await page.locator('#mentor-output').innerText(),/规则/);
 await page.locator('#planning-goal').fill('更大的初值扰动会使分离时间提前吗？');
 await page.locator('#request-plan').click();
 await page.locator('#plan-preview').waitFor({state:'visible',timeout:10000});
 const planText=await page.locator('#plan-change').innerText();
 assert.match(planText,/logDelta|log₁₀/);
 assert.match(planText,/-10/);
 assert.match(planText,/-7/);
 assert.equal(await page.locator('#approve-plan').isDisabled(),true);
 assert.match(await page.locator('#raw-output').textContent(),/logDelta": -10/);
 await page.screenshot({path:join(output,'09-plan-review-before-approval.png'),fullPage:true});
 await page.locator('#approval-prediction').fill('新的预测：把扰动扩大一千倍之后，达到分离阈值的时刻会提前。');
 assert.equal(await page.locator('#approve-plan').isEnabled(),true);
 await page.locator('#approve-plan').click();
 await page.locator('#experiment-comparison').waitFor({state:'visible',timeout:12000});
 assert.equal(await page.locator('#agent-planning').isVisible(),false);
 assert.equal(await page.locator('#approval-prediction').isVisible(),false);
 assert.equal(await page.locator('#prediction-input').isDisabled(),true);
 assert.equal(await page.locator('#delta').inputValue(),'-7');
 assert.match(await page.locator('#raw-output').textContent(),/logDelta": -7/);
 assert.match(await page.locator('#experiment-comparison').innerText(),/从 -10 改为 -7/);
 assert.equal(await page.locator('#transfer').isVisible(),false);
 await page.screenshot({path:join(output,'10-approved-real-comparison.png'),fullPage:true});
 await page.locator('#ask').click();
 await page.locator('#agent-planning').waitFor({state:'visible',timeout:10000});
 await page.locator('#request-plan').click();
 await page.locator('#plan-preview').waitFor({state:'visible',timeout:10000});
 await page.locator('#discard-plan').click();
 assert.equal(await page.locator('#plan-preview').isVisible(),false);
 assert.match(await page.locator('#plan-hint').innerText(),/没有运行/);
 await page.locator('[data-exp="evo-pair"]').click();
 await page.locator('#prediction-input').fill('我认为不同的独立随机种子将导致配对世界的种群统计发生变化。');
 await page.locator('#run').click();
 await page.locator('#results').waitFor({state:'visible',timeout:12000});
 const evoBefore=JSON.parse((await page.locator('#raw-output').textContent())).condition.baseSeed;
 assert.equal(evoBefore,73129);
 await page.locator('#ask').click();
 await page.locator('#agent-planning').waitFor({state:'visible',timeout:10000});
 await page.locator('#request-plan').click();
 await page.locator('#plan-preview').waitFor({state:'visible',timeout:10000});
 assert.match(await page.locator('#plan-change').innerText(),/seed|随机种子/);
 await page.locator('#approval-prediction').fill('新的预测：第二批独立种子可能得到方向不同的种群差。');
 await page.locator('#approve-plan').click();
 await page.locator('#experiment-comparison').waitFor({state:'visible',timeout:15000});
 assert.equal(JSON.parse((await page.locator('#raw-output').textContent())).condition.baseSeed,73230);
 assert.match(await page.locator('#experiment-comparison').innerText(),/73230/);
 await page.screenshot({path:join(output,'11-approved-evo-paired-run.png'),fullPage:true});
 await page.setViewportSize({width:390,height:844});
 await page.goto(base+'/',{waitUntil:'networkidle'});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
 assert.deepEqual(errors,[]);
 await page.screenshot({path:join(output,'12-mobile-agent.png'),fullPage:true});
 const receipt={status:'passed',checks:[
  'requires initial prediction','teacher must answer before planning',
  'plan displays exactly one changed variable',
  'no engine execution before separate prediction and approval',
  'approved real PFL engine follows server-owned plan',
  'new experiment needs fresh mentor call',
  'discarding proposal has no scientific side effect',
  'approved EvoWorld paired experiment uses new seed',
  'no accidental responsive overflow at 390px',
  'no browser pageerrors'
 ],screenshots:[
  '09-plan-review-before-approval.png','10-approved-real-comparison.png',
  '11-approved-evo-paired-run.png','12-mobile-agent.png'
 ],apiMode:'offline-rules',testApiKeyUsed:false};
 await writeFile(join(output,'agent-approval-browser.json'),JSON.stringify(receipt,null,2)+'\n');
 console.log('AGENT_BROWSER_APPROVAL_OK',receipt.checks.length,'checks',receipt.screenshots.length,'screenshots');
}catch(e){console.error('AGENT_BROWSER_APPROVAL_FAIL',e.stack||e);process.exitCode=1}
finally{if(browser)await browser.close();await new Promise(resolve=>app.close(resolve))}
