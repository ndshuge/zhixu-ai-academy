import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {createAcademyServer} from '../server.mjs';
import {ProviderRegistry} from '../model-provider.mjs';
const require=createRequire('E:/CHATGPT/projects/physics-frontier-lab/package.json');
const {chromium}=require('playwright');
const dir=join(process.cwd(),'evidence','browser','rc4-model-connect');
await mkdir(dir,{recursive:true});
const calls=[];
const mock=createServer(async(req,res)=>{
 const authorization=req.headers.authorization;
 let raw='';for await(const chunk of req)raw+=chunk;
 calls.push({authorization,model:JSON.parse(raw).model});
 res.writeHead(200,{'Content-Type':'application/json'});
 res.end(JSON.stringify({choices:[{message:{content:'连接成功'}}],usage:{total_tokens:12}}));
});
await new Promise(r=>mock.listen(0,'127.0.0.1',r));
const mockURL='http://127.0.0.1:'+mock.address().port+'/v1';
const app=createAcademyServer({
 providerRegistry:new ProviderRegistry({env:{}}),
 judgeRegistryFactory:()=>new ProviderRegistry({env:{},allowLocal:true})
});
await new Promise(r=>app.listen(0,'127.0.0.1',r));
const url='http://127.0.0.1:'+app.address().port;
let browser;
try{
 browser=await chromium.launch({channel:'msedge',headless:true});
 const contextA=await browser.newContext({viewport:{width:1440,height:900}});
 const page=await contextA.newPage(),pageErrors=[];
 page.on('pageerror',e=>pageErrors.push(e.message));
 await page.goto(url+'/',{waitUntil:'networkidle'});
 assert.equal(await page.locator('a[href="/connect"]').count()>=1,true);
 await page.locator('.institution-banner a[href="/connect"]').click();
 assert.match(await page.title(),/连接 AI 模型/);
 await page.screenshot({path:join(dir,'01-connect-desktop.png'),fullPage:true});
 await page.locator('#provider').selectOption('deepseek');
 assert.equal(await page.locator('#model').inputValue(),'deepseek-chat');
 assert.equal(await page.locator('#base-url').inputValue(),'https://api.deepseek.com/v1');
 await page.locator('#provider').selectOption('custom');
 await page.locator('#display-name').fill('个人示范模型');
 await page.locator('#model').fill('test-tutor');
 await page.locator('#base-url').fill(mockURL);
 await page.locator('#api-key').fill('ONLY-FAKE-INTEGRATION-KEY');
 await page.locator('#save').click();
 await page.getByText('配置已保存',{exact:false}).waitFor();
 assert.equal(await page.locator('#api-key').inputValue(),'');
 assert.ok(!(await page.locator('body').innerText()).includes('ONLY-FAKE-INTEGRATION-KEY'));
 page.on('dialog',dialog=>dialog.accept());
 await page.locator('#test').click();
 await page.getByText('连接成功',{exact:false}).first().waitFor();
 assert.equal(calls.length,1);
 assert.equal(calls[0].authorization,'Bearer ONLY-FAKE-INTEGRATION-KEY');
 await page.screenshot({path:join(dir,'02-connected-success.png'),fullPage:true});
 await page.locator('#start-learning').click();
 await page.waitForFunction(()=>document.getElementById('model-state')?.textContent?.includes('个人示范模型'),null,{timeout:10000});
 assert.match(await page.locator('#model-state').innerText(),/我的 AI/);
 const differentContext=await browser.newContext({viewport:{width:1200,height:900}});
 const other=await differentContext.newPage();
 await other.goto(url+'/connect',{waitUntil:'networkidle'});
 assert.match(await other.locator('#connection-state').innerText(),/尚未配置/);
 await page.goto(url+'/connect',{waitUntil:'networkidle'});
 await page.setViewportSize({width:390,height:844});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
 await page.screenshot({path:join(dir,'03-connected-mobile.png'),fullPage:true});
 await page.locator('#clear').click();
 await page.getByText('尚未配置',{exact:false}).first().waitFor();
 assert.deepEqual(pageErrors,[]);
 const report={status:'PASS',scope:'local-mock-no-billed-api',checks:[
  'home link to BYOK','DeepSeek official preset','masked key','mock connected call',
  'session model on student homepage','separate contexts','cleared key','390px mobile no overflow','no page errors'
 ],screenshots:['01-connect-desktop.png','02-connected-success.png','03-connected-mobile.png']};
 await writeFile(join(dir,'browser-acceptance.json'),JSON.stringify(report,null,2));
 console.log('RC4_MODEL_CONNECT_BROWSER_PASS',report.checks.length,'checks');
 await contextA.close();await differentContext.close();
}finally{if(browser)await browser.close();await new Promise(r=>app.close(r));await new Promise(r=>mock.close(r));}
