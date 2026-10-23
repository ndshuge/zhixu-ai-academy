import {createRequire} from 'node:module';
import {createAcademyServer} from '../server.mjs';
import {ProviderRegistry} from '../model-provider.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const require=createRequire('E:/CHATGPT/projects/physics-frontier-lab/package.json');
const {chromium}=require('playwright');
const dir=join(process.cwd(),'evidence','browser');await mkdir(dir,{recursive:true});
const token='BROWSER-ADMIN-TEST-ONLY-NOT-REAL';
const registry=new ProviderRegistry({env:{},adminToken:token});
const app=createAcademyServer({providerRegistry:registry});
await new Promise(resolve=>app.listen(0,'127.0.0.1',resolve));
const url='http://127.0.0.1:'+app.address().port;
let browser;
try{
 browser=await chromium.launch({channel:'msedge',headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 const pageErrors=[];
 page.on('pageerror',e=>pageErrors.push(String(e.message)));
 await page.goto(url+'/admin',{waitUntil:'networkidle'});
 assert.match(await page.title(),/学校模型配置/);
 assert.equal(await page.locator('#save-provider').isEnabled(),true);
 const bad=await page.request.get(url+'/api/admin/provider');
 assert.equal(bad.status(),403);
 await page.screenshot({path:join(dir,'06-school-api-admin.png'),fullPage:true});
 await page.locator('#admin-token').fill(token);
 await page.locator('#unlock').click();
 await page.locator('#unlock-state').getByText('身份验证通过',{exact:false}).waitFor({timeout:5000});
 await page.locator('#provider').selectOption('glm');
 assert.equal(await page.locator('#base-url').inputValue(),'https://open.bigmodel.cn/api/paas/v4');
 await page.locator('#provider').selectOption('custom');
 await page.locator('#display-name').fill('某高校专属教学模型');
 await page.locator('#base-url').fill('https://example.edu/openai/v1');
 await page.locator('#model').fill('school-science-model');
 await page.locator('#api-key').fill('FAKE-INTEGRATION-KEY');
 await page.locator('#daily-limit').fill('5');
 await page.locator('#save-provider').click();
 await page.locator('#admin-status').getByText('已配置模型API',{exact:false}).waitFor({timeout:5000});
 assert.equal(await page.locator('#api-key').inputValue(),'');
 assert.equal(await page.locator('#test-provider').isEnabled(),true);
 assert.equal(await page.locator('#admin-status').innerText().then(x=>x.includes('FAKE-INTEGRATION-KEY')),false);
 await page.screenshot({path:join(dir,'07-school-model-connected.png'),fullPage:true});
 const student=await browser.newPage({viewport:{width:1200,height:900}});
 await student.goto(url+'/',{waitUntil:'networkidle'});
 // Module scripts and the async provider-status fetch may settle after page navigation.
 // Wait for the actual state, not the initial DOM placeholder under load.
 await student.waitForFunction(()=>document.getElementById('model-state')?.textContent?.includes('某高校专属教学模型'),null,{timeout:15000});
 assert.match(await student.locator('#model-state').innerText(),/某高校专属教学模型/);
 assert.match(await student.locator('#institution-provider').innerText(),/school-science-model/);
 assert.equal(await student.locator('#privacy-consent').getAttribute('hidden'),null);
 assert.equal(await student.locator('#shareApproved').isChecked(),false);
 assert.ok(!(await student.content()).includes('FAKE-INTEGRATION-KEY'));
 await student.locator('#prediction-input').fill('我预测两条轨道最后会分离');
 await student.locator('#run').click();
 await student.locator('#results').waitFor({state:'visible'});
 await student.locator('#ask').click();
 await student.locator('#mentor-output').waitFor({state:'visible'});
 assert.match(await student.locator('#mentor-output').innerText(),/没有授权/);
 assert.equal(registry.callsToday,0);
 await student.screenshot({path:join(dir,'08-student-school-consent.png'),fullPage:true});
 assert.deepEqual(pageErrors,[]);
 const record={status:'passed',checks:['admin authentication','admin provider presets','credentials never returned',
  'school model status student-side','student consent initially unchecked','no LLM call without consent'],
  screenshots:['06-school-api-admin.png','07-school-model-connected.png','08-student-school-consent.png']};
 await writeFile(join(dir,'school-api-browser.json'),JSON.stringify(record,null,2));
 console.log('SCHOOL_API_BROWSER_OK',record.checks.length,'checks',record.screenshots.length,'screenshots');
}finally{
 if(browser)await browser.close();
 await new Promise(resolve=>app.close(resolve));
}
