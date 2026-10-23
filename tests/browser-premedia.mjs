/**
 * P0–P4 pre-media independent Edge acceptance. Every student is synthetic
 * Playwright automation; no external model service, identity or billing.
 */
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createAcademyServer} from '../server.mjs';
import {ProviderRegistry} from '../model-provider.mjs';
const require=createRequire('E:/CHATGPT/projects/physics-frontier-lab/package.json');
const {chromium}=require('playwright');
const out=join(process.cwd(),'evidence','rc3-20261012','premedia');
await mkdir(out,{recursive:true});
const registry=new ProviderRegistry({env:{}});
const server=createAcademyServer({providerRegistry:registry});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port;
let browser;
const checks=[];
function ok(label){checks.push(label)}
try{
 browser=await chromium.launch({channel:'msedge',headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/',{waitUntil:'networkidle'});
 assert.match(await page.locator('h1').innerText(),/错误的直觉/);ok('homepage flagship thesis');
 assert.equal(await page.locator('.arc-node').count(),4);
 assert.match(await page.locator('#arc-progress').innerText(),/0 \/ 4/);ok('cognitive zero-state is real, not synthetic');
 assert.equal(await page.locator('.universe-card').count(),2);
 assert.equal(await page.locator('.universe-card.physics a').getAttribute('href'),'/explore?lab=pfl');
 assert.equal(await page.locator('.universe-card.biology a').getAttribute('href'),'/explore?lab=evo');ok('shared lobby with two real labs');
 const entries=[['pfl','Physics Frontier Lab'],['evo','EvoWorld']];
 for(const [key,name] of entries){
  const view=await browser.newPage({viewport:{width:1440,height:900}});
  await view.goto(base+'/explore?lab='+key,{waitUntil:'domcontentloaded'});
  assert.match(await view.locator('#lab-title').innerText(),new RegExp(name));
  await view.close();ok('live '+key+' navigation');
 }
 for(const [id,label] of [['extra-field','extra field'],['tool-injection','tool injection'],['change-unapproved-variable','tampered science variable']]){
  await page.locator('[data-safety-case="'+id+'"]').click();
  // The status flag updates just before the detail text; wait for both to avoid reading a transient loading frame.
  await page.waitForFunction(()=>{
   const state=document.getElementById('safety-state');
   const outcome=document.getElementById('safety-outcome');
   return state?.dataset.result==='blocked' && outcome?.textContent.includes('已被真实规则拒绝');
  },null,{timeout:6000});
  assert.match(await page.locator('#safety-outcome').innerText(),/已被真实规则拒绝/);
  assert.match(await page.locator('#safety-outcome').innerText(),/远程模型调用 0 次、实验自动执行 0 次/);
  ok('blocked '+label+' without model/API/tool');
 }
 await page.screenshot({path:join(out,'premedia-desktop-1440.png'),fullPage:true});
 const before=await page.locator('#arc-progress').innerText();
 assert.match(before,/0 \/ 4/);
 await page.locator('#prediction-input').fill('初始条件只是轻微差别，我猜两条轨迹始终会保持近似');
 await page.locator('#run').click();
 await page.locator('#results').waitFor({state:'visible'});
 await page.waitForFunction(()=>document.querySelector('[data-arc="hypothesis"]').classList.contains('complete'),{timeout:6000});
 assert.equal(await page.locator('[data-arc].complete').count(),2);ok('real prediction and PFL result mark first 2 stages only');
 assert.match(await page.locator('#lens-evidence').innerText(),/Physics Frontier Lab/);
 await page.locator('#reflection').fill('我观察到了轨迹发生分离，想继续改变一个变量验证');
 await page.locator('#ask').click();
 await page.locator('#agent-planning').waitFor({state:'visible'});
 await page.locator('#planning-goal').fill('固定其他条件，尝试改变初值扰动');
 await page.locator('#request-plan').click();
 await page.locator('#plan-preview').waitFor({state:'visible'});
 await page.waitForFunction(()=>document.getElementById('explain-mode')?.dataset.mode==='rules',{timeout:6000});
 assert.match(await page.locator('#explain-evidence').innerText(),/Physics Frontier Lab/);
 assert.match(await page.locator('#explain-variable').innerText(),/logDelta/);
 assert.match(await page.locator('#explain-approval').innerText(),/没有执行/);
 assert.equal(await page.locator('[data-arc].complete').count(),3);
 assert.equal(await page.locator('#approve-plan').isDisabled(),true);ok('explainable rule proposal and no unauthorized execution');
 await page.screenshot({path:join(out,'premedia-proposal-audit-1440.png'),fullPage:true});
 await page.locator('#approval-prediction').fill('改变扰动大小后我预计达到固定分离阈值的时刻会改变');
 await page.locator('#approve-plan').click();
 await page.locator('#experiment-comparison').waitFor({state:'visible'});
 await page.waitForFunction(()=>document.getElementById('explain-approval').textContent.includes('已明确批准'),{timeout:6000});
 assert.equal(await page.locator('[data-arc].complete').count(),3);ok('independent approval and actual second experiment');
 await page.locator('#reflection').fill('对比上一轮和本轮的实验结果后我发现差异');
 await page.locator('#ask').click();
 await page.locator('#post-check').waitFor({state:'visible'});
 await page.locator('#post-check-root .check-form').first().waitFor({state:'visible'});
 await page.locator('#post-check-root .check-form').first().locator('input[value="2"]').check();
 await page.locator('#post-check-root .check-form').first().locator('button').first().click();
 await page.locator('#post-check-root .check-form').first().locator('.feedback').waitFor({state:'visible'});
 await page.locator('#post-check-root .check-form').first().locator('.feedback button').click();
 await page.locator('#post-check-root .check-form').nth(1).waitFor({state:'visible'});
 await page.locator('#post-check-root .check-form').nth(1).locator('input[value="0"]').check();
 await page.locator('#post-check-root .check-form').nth(1).locator('button').first().click();
 await page.waitForFunction(()=>document.querySelector('[data-arc="transfer"]').classList.contains('complete'),{timeout:6000});
 assert.match(await page.locator('#arc-progress').innerText(),/4 \/ 4/);ok('transfer must be submitted, never prefilled');
 await page.locator('.module[data-exp="evo-pair"]').click();
 await page.waitForFunction(()=>document.getElementById('arc-progress').textContent.includes('0 / 4'),{timeout:6000});
 assert.match(await page.locator('#explain-mode').innerText(),/尚无方案/);
 ok('changing scientific domain clears prior learner-stage evidence rather than fabricating carryover');
 assert.deepEqual(errors,[]);ok('no page execution errors');
 await page.setViewportSize({width:390,height:844});
 await page.goto(base+'/',{waitUntil:'networkidle'});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1),false);
 assert.equal(await page.locator('.arc-node').count(),4);
 assert.equal(await page.locator('.universe-card').count(),2);
 assert.equal(await page.locator('.safety-examples button').count(),3);
 await page.screenshot({path:join(out,'premedia-mobile-390.png'),fullPage:true});
 ok('390px responsive, no horizontal overflow');
 const all={status:'PASS',checks,assertionGroups:checks.length,
  time:new Date().toISOString(),realStudentParticipants:0,remoteLLMCalls:0,
  actor:'synthetic Playwright Edge, NOT real students',
  screenshots:['premedia-desktop-1440.png','premedia-proposal-audit-1440.png','premedia-mobile-390.png']};
 await writeFile(join(out,'acceptance.json'),JSON.stringify(all,null,2)+'\n');
 console.log('PREMEDIA_BROWSER_PASS',checks.length,'groups; desktop+390px, 0 LLM calls');
}catch(err){console.error('PREMEDIA_BROWSER_FAIL',err.stack||err);process.exitCode=1}
finally{await browser?.close();await new Promise(resolve=>server.close(resolve))}
