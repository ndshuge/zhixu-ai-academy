import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const {createAcademyServer}=await import(pathToFileURL(resolve('evidence/rc-20261012/package-extracted/server.mjs')));
const {ProviderRegistry}=await import(pathToFileURL(resolve('evidence/rc-20261012/package-extracted/model-provider.mjs')));
const {chromium}=createRequire('E:/CHATGPT/projects/physics-frontier-lab/package.json')('playwright');
const server=createAcademyServer({providerRegistry:new ProviderRegistry({env:{}})});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
let browser;const errors=[];
try{
 browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:1440,height:900}});page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/');assert.equal(await page.locator('#pre-check-root input:checked').count(),0);
 await page.locator('#prediction-input').fill('我预测轨道会分离，但控制条件相同时方程并未变化。');await page.locator('#run').click();await page.locator('#results').waitFor({state:'visible'});assert.match(await page.locator('#raw-output').textContent(),/pfl-kernel-1.0.0/);
 await page.locator('[data-exp="evo-pair"]').click();await page.locator('#prediction-input').fill('合作开关可能改变世界均值，但两个种子不足以证明普遍优势。');await page.locator('#run').click();await page.locator('#results').waitFor({state:'visible'});assert.match(await page.locator('#raw-output').textContent(),/evoworld-0.1.1/);
 for(const lab of ['pfl','evo']){
  await page.goto(base+'/explore?lab='+lab);await page.locator('#explore-prediction').fill('这是独立解压包的实际运行测试，不是真人研究。');await page.locator('#open-lab').click();
  if(lab==='evo')await page.waitForFunction(()=>document.getElementById('lab-frame').contentWindow.evoEvidence?.tick>1);else await page.frameLocator('#lab-frame').getByTestId('stage-canvas').waitFor();
 }
 assert.deepEqual(errors,[]);await writeFile('evidence/rc-20261012/package-runtime.json',JSON.stringify({status:'passed',scope:'Actual extracted ZIP runtime, Edge and both local Worker products; test harness browser dependency is development-only',version:'0.4.1-rc.1',checks:['PFL academy compute','Evo academy compute','local PFL stage Worker','local Evo live Worker','no page errors'],errors},null,2));console.log('RC_EXTRACTED_RUNTIME_OK 5 checks');
}finally{await browser?.close();await new Promise(r=>server.close(r))}
