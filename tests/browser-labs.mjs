import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import {createAcademyServer} from '../server.mjs';
import {ProviderRegistry} from '../model-provider.mjs';
import assert from 'node:assert/strict';
const {chromium}=createRequire('E:/CHATGPT/projects/physics-frontier-lab/package.json')('playwright');
const out='evidence/rc-20261012';await mkdir(out,{recursive:true});
const app=createAcademyServer({providerRegistry:new ProviderRegistry({env:{}})});await new Promise(r=>app.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+app.address().port;
let browser;const checks=[],errors=[],external=[],http=[];
try{
 browser=await chromium.launch({channel:'msedge',headless:true});
 for(const width of [1440,390]){
  const context=await browser.newContext({viewport:{width,height:width===390?844:960},hasTouch:width===390});const page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)http.push({url:r.url(),status:r.status()})});
  page.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(base))external.push(r.url())});
  await page.goto(base+'/',{waitUntil:'networkidle'});assert.equal(await page.locator('#pre-check-root input:checked').count(),0);
  await page.screenshot({path:out+'/rc-home-'+width+'.png',fullPage:true});
  for(const lab of ['evo','pfl']){
   await page.goto(base+'/explore?lab='+lab,{waitUntil:'networkidle'});
   assert.equal(await page.locator('#open-lab').isDisabled(),true);assert.equal(await page.locator('#lab-frame').getAttribute('src'),null);
   await page.locator('#explore-prediction').fill(lab==='evo'?'我预测同一生命能量会变化，单个世界不能证明合作优势。':'我预测相同方程下初值变化会影响长期轨道，需要控制参数。');await page.locator('#open-lab').click();
   const frame=page.frameLocator('#lab-frame');
   if(lab==='evo'){
    await frame.locator('#world-loading').waitFor({state:'hidden'});
    await page.waitForFunction(()=>document.getElementById('lab-frame').contentWindow.evoEvidence?.tick>10);
    await frame.locator('#play-pause').click();await page.waitForFunction(()=>document.getElementById('lab-frame').contentWindow.evoEvidence?.running===false);
    const tick=await page.locator('#lab-frame').evaluate(el=>el.contentWindow.evoEvidence.tick);
    await frame.locator('#single-step').click();await page.waitForFunction(t=>document.getElementById('lab-frame').contentWindow.evoEvidence.tick>t,tick);
    const options=await frame.locator('#agent-select option').count();assert.ok(options>1);await frame.locator('#agent-select').selectOption({index:1});await frame.locator('#focus-selected').click();
   }else{
    await frame.getByTestId('stage-canvas').waitFor();await frame.getByTestId('stage-canvas').focus();await frame.getByTestId('stage-canvas').press('ArrowRight');
    await page.waitForFunction(()=>!!JSON.parse(document.getElementById('lab-frame').contentDocument.querySelector('[data-testid="visual-stage"]').getAttribute('data-scene')).row);
   }
   await page.locator('#capture-observation').click();assert.match(await page.locator('#observation-output').innerText(),lab==='evo'?/"tick":/:/"scene":/);
   await page.locator('#observation-reflection').fill('当前观测来自真实模型，仍需固定条件并做独立重复，不能据此断言普遍优势。');await page.locator('#save-observation').click();assert.match(await page.locator('#explore-status').innerText(),/已保存到本机/);
   await page.locator('#lab-frame').scrollIntoViewIfNeeded();await page.screenshot({path:out+'/rc-'+lab+'-'+width+'.png'});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'wrapper overflow');
   assert.equal(await page.locator('#lab-frame').evaluate(el=>el.contentDocument.documentElement.scrollWidth>el.contentWindow.innerWidth+1),false,'lab overflow');
   await page.locator('#close-lab').click();assert.equal(await page.locator('#lab-frame').getAttribute('src'),'about:blank');
   await page.locator('#continue-lesson').click();await page.locator('#exploration-resume').waitFor({state:'visible'});
   assert.equal(await page.locator('#run').isDisabled(),true);if(lab==='evo')assert.match(await page.locator('.module.selected').innerText(),/数字生命/);
   checks.push(width+' '+lab+' prediction gate / Worker / interaction / live capture / persistent evidence / return / no overflow');
  }
  await page.goto(base+'/learning');await page.locator('#timeline .lab-evidence').first().waitFor();assert.equal(await page.locator('#stat-incorrect').innerText(),'0');
  const events=await page.evaluate(()=>JSON.parse(localStorage.getItem('ai-academy-learning-v02')).events);assert.equal(events.filter(x=>x.kind==='lab_observation').length,2);
  await page.locator('#timeline .lab-evidence summary').first().click();await page.screenshot({path:out+'/rc-evidence-'+width+'.png',fullPage:true});checks.push(width+' evidence survives route; no fabricated grade');
  await context.close();
 }
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);assert.deepEqual(http,[]);
 await writeFile(out+'/lab-browser.json',JSON.stringify({status:'passed',checks,errors,http,external,scope:'Edge desktop + touch viewport emulation, automated product checks, not human or physical-phone acceptance'},null,2));console.log('LAB_BROWSER_OK',checks.length,'scenario groups');
}catch(e){console.error(e.stack);await writeFile(out+'/lab-browser-failure.json',JSON.stringify({errors,http,external,message:e.message},null,2));process.exitCode=1}
finally{await browser?.close();await new Promise(r=>app.close(r))}
