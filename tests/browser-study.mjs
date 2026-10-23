import {createRequire} from 'node:module';
import {createAcademyServer} from '../server.mjs';
import {ProviderRegistry} from '../model-provider.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import assert from 'node:assert/strict';
// This test uses an isolated ephemeral browser, never real participant data.
const require=createRequire('E:/CHATGPT/projects/physics-frontier-lab/package.json');
const {chromium}=require('playwright');
const out=join(process.cwd(),'evidence','browser');await mkdir(out,{recursive:true});
const app=createAcademyServer({providerRegistry:new ProviderRegistry({env:{}})});
await new Promise(resolve=>app.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+app.address().port;
let browser;
try{
 browser=await chromium.launch({channel:'msedge',headless:true});
 const context=await browser.newContext({viewport:{width:1365,height:950},acceptDownloads:true});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/study',{waitUntil:'networkidle'});
 assert.match(await page.locator('#study-records').innerText(),/尚无真实参与者/);
 assert.equal((await page.evaluate(()=>JSON.parse(localStorage.getItem('ai-academy-learning-v02')).events)).length,0);
 await page.locator('#make-code').click();
 assert.match(await page.locator('#study-code').innerText(),/^S-[A-F0-9]{8}$/);
 await page.locator('#study-condition').selectOption('academy');
 await page.locator('#study-question-set').selectOption('chaos-form-a-v1');
 await page.locator('#study-completed').selectOption('yes');
 await page.locator('#study-pre-correct').fill('2');
 await page.locator('#study-pre-total').fill('1');
 await page.locator('#study-transfer-correct').fill('1');
 await page.locator('#study-transfer-total').fill('2');
 await page.locator('#study-minutes').fill('17');
 await page.locator('#study-help').selectOption('no');
 await page.locator('#study-notes').fill('TEST ONLY synthetic automated fixture; not a real human participant.');
 await page.locator('#study-consent').check();
 await page.locator('#study-real').check();
 const invalidBefore=await page.locator('#study-form').evaluate(f=>[...f.elements].filter(e=>e.validity&&!e.validity.valid).map(e=>e.id));
 assert.deepEqual(invalidBefore,[]);
 await page.locator('#study-save').click();
 assert.match(await page.locator('#study-form-result').innerText(),/不一致/);
 assert.match(await page.locator('#study-records').innerText(),/尚无真实参与者/);
 // Correct data to exercise the instrument while retaining only ephemeral synthetic fixture.
 await page.locator('#study-pre-correct').fill('0');
 await page.locator('#study-save').click();
 assert.match(await page.locator('#study-form-result').innerText(),/已将一位/);
 assert.match(await page.locator('#study-records').innerText(),/人工输入/);
 const record=await page.evaluate(()=>JSON.parse(localStorage.getItem('ai-academy-learning-v02')).events.find(x=>x.kind==='study_record'));
 assert.equal(record.payload.questionSet,'chaos-form-a-v1');
 assert.equal(record.payload.transferCorrect,1);
 assert.equal(record.payload.preCorrect,0);
 assert.ok(record.payload.notes.includes('TEST ONLY'));
 const awaiting=page.waitForEvent('download');
 await page.locator('#study-export').click();
 const download=await awaiting;
 assert.match(download.suggestedFilename(),/G4/);
 const fixture=JSON.parse(await (await import('node:fs/promises')).readFile(await download.path(),'utf8'));
 assert.equal(fixture.records.length,1);
 assert.equal(fixture.records[0].participantCode,record.payload.participantCode);
 // Before screenshot add a persistent test-only watermark on the isolated browser page.
 await page.evaluate(()=>{
  const label=document.createElement('div');
  label.textContent='自动化合成测试 / SYNTHETIC TEST ONLY — NOT A REAL STUDENT';
  label.style.cssText='position:fixed;z-index:99999;top:0;left:0;right:0;padding:12px;background:#802b2b;color:white;font-size:14px;text-align:center;font-weight:bold';
  document.body.append(label);
 });
 await page.screenshot({path:join(out,'19-g4-synthetic-form-test-watermarked.png'),fullPage:true});
 assert.deepEqual(errors,[]);
 await context.close();
 await writeFile(join(out,'g4-synthetic-browser-test.json'),JSON.stringify({
  status:'passed',checks:7,kind:'SYNTHETIC_TEST_ONLY',
  warning:'Synthetic browser fixture on isolated disposable browser context. Not actual student consent or learning data.',
  screenshot:'19-g4-synthetic-form-test-watermarked.png'
 },null,2));
 console.log('G4_RESEARCH_BROWSER_SYNTHETIC_OK 7 checks, one WATERMARKED synthetic screenshot');
}catch(e){console.error('G4_RESEARCH_BROWSER_FAIL',e.stack||e);process.exitCode=1}
finally{if(browser)await browser.close();await new Promise(r=>app.close(r))}
