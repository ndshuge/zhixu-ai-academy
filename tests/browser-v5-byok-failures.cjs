/* V5 BYOK privacy / controlled failure regression.
   Uses only a synthetic sk- test token. ALL DeepSeek requests are intercepted
   in Playwright; no real API, billing, or secrets involved. */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const pw=require(process.env.PLAYWRIGHT_CORE_PATH||'playwright-core');
const root=process.env.ZHIXU_PREVIEW_ROOT&&path.resolve(process.env.ZHIXU_PREVIEW_ROOT);
const mime={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'};
const server=root?http.createServer((req,res)=>{
 const u=new URL(req.url,'http://local'),target=path.resolve(root,'.'+decodeURIComponent(u.pathname)+(u.pathname.endsWith('/')?'index.html':''));
 if(!target.startsWith(root+path.sep))return res.writeHead(403).end();
 fs.readFile(target,(error,data)=>error?res.writeHead(404).end(u.pathname):res.writeHead(200,{'content-type':mime[path.extname(target)]||'application/octet-stream'}).end(data));
}):null;
// Deliberately assemble this nonworking token; no static credential-like secret.
const fakeKey=['sk','SYNTHETIC_PLACEHOLDER_NOT_REAL_123456'].join('-');
async function run(){
 if(server)await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let pass=0;
 try{for(const [name,engine] of [['edge',pw.chromium],['webkit',pw.webkit]].filter(x=>!process.env.QA_ENGINE||x[0]===process.env.QA_ENGINE)){
  let browser;
  try{
   browser=name==='edge'?await engine.launch({channel:'msedge',headless:true}):await engine.launch({headless:true});
   const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true});
   let responseKind='success',count=0,errors=[],missing=[];
   // Deny any unexpected external endpoint. Only the explicitly mocked
   // DeepSeek route below may be requested, and it never uses the network.
   await context.route('**/*',route=>{
    const url=new URL(route.request().url());
    if(url.hostname==='127.0.0.1'||url.hostname==='localhost')return route.continue();
    return route.abort('blockedbyclient');
   });
   await context.route('https://api.deepseek.com/**',async route=>{
    count++;
    const req=route.request();
    assert.equal(req.method(),'POST');
    assert.equal(req.headers().authorization,'Bearer '+fakeKey);
    if(responseKind==='offline'){await route.abort('failed');return;}
    if(responseKind==='rate'){await route.fulfill({status:429,contentType:'application/json',body:JSON.stringify({error:{message:'synthetic rate limit'}})});return;}
    if(responseKind==='unauthorized'){await route.fulfill({status:401,contentType:'application/json',body:JSON.stringify({error:{message:'fake error'}})});return;}
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({model:'deepseek-flash',choices:[{message:{content:'连接成功，虚拟回复'}}],usage:{total_tokens:5}})});
   });
   const page=await context.newPage();page.setDefaultTimeout(5000);console.log('BYOK_STEP',name,'context');
   page.on('pageerror',e=>errors.push(e.message));
   page.on('response',r=>{if(r.status()===404&&r.url().startsWith('http://127.'))missing.push(r.url())});
   const uri=root?'http://127.0.0.1:'+server.address().port+'/zhixu-ai-academy/apple-editions/ai-academy-v5/':'https://ndshuge.github.io/zhixu-ai-academy/apple-editions/ai-academy-v5/';
   console.log('BYOK_STEP',name,'navigate');await page.goto(uri,{waitUntil:'domcontentloaded',timeout:13000});
   await page.waitForFunction(()=>document.querySelector('#screen')?.dataset.page==='today'&&!!document.querySelector('#original-engine')?.contentWindow?.ZHIXU_PAGES_AI,null,{timeout:14000});
   const state=()=>page.evaluate(()=>document.querySelector('#original-engine').contentWindow.ZHIXU_PAGES_AI.status());
   assert.equal(await state(),false);
   assert.equal(count,0,'must not call model without user action');
   await page.locator('.toolbar [data-route=settings]').click();
   await page.locator('#screen[data-page="settings"] [data-action=open-ai-config]').waitFor({timeout:9000});
   await page.locator('#screen [data-action=open-ai-config]').click();
   const frame=page.frameLocator('#original-engine');
   console.log('BYOK_STEP',name,'type key');await frame.locator('#pages-ai-key').fill(fakeKey);
   const savedUnchecked=await frame.locator('#pages-ai-save').isChecked();
   assert.equal(savedUnchecked,false,'plain text localStorage must require opt-in');
   await frame.locator('#pages-ai-test').click();
   await page.waitForFunction(()=>document.querySelector('#original-engine').contentWindow.ZHIXU_PAGES_AI.status(),null,{timeout:10000});
   assert.equal(count,1,'one explicit test request');
   let storage=await page.evaluate(()=>localStorage.getItem('zhixu-ai-academy-deepseek-key-v1'));
   assert.equal(storage,null);
   const inputAfter=await frame.locator('#pages-ai-key').inputValue();
   assert.equal(inputAfter,'','password input should be cleared');
   assert.equal((await page.content()).includes(fakeKey),false,'fake token must not appear in outer DOM');
   await page.locator('#close-config').click();
   await page.locator('#doctor-launch').click();
   await page.locator('#doctor-panel.doctor-visible').waitFor({timeout:9000});
   await page.locator('#doctor-question').fill('请解释这个科学实验的真实结果');
   responseKind='rate';
   console.log('BYOK_STEP',name,'send 429');await page.locator('#doctor-send').click();
   await page.waitForFunction(()=>!document.querySelector('#original-engine').contentWindow.ZHIXU_PAGES_AI.status(),null,{timeout:10000});
   assert.equal(count,2,'one additional explicit question request');
   assert.equal(await page.locator('#doctor-send').isDisabled(),true,'doctor must disable after upstream rate limit');
   assert.match(await page.locator('#doctor-log').innerText(),/429|失[败效]|失败/);
   await page.locator('#doctor-close').click();
   await page.waitForTimeout(450);
   assert.equal(await page.locator('#screen').getAttribute('data-page'),'settings','closing Doctor should retain Settings route');
   await page.locator('#screen [data-action=open-ai-config]').click();
   responseKind='unauthorized';
   await frame.locator('#pages-ai-test').click();
   await page.waitForFunction(()=>document.querySelector('#original-engine').contentWindow.document.querySelector('#pages-ai-status')?.textContent?.includes('401'),null,{timeout:10000});
   assert.equal(await state(),false,'401 must never claim connected');
   assert.equal(count,3);
   responseKind='offline';
   await frame.locator('#pages-ai-test').click();
   await page.waitForFunction(()=>{const text=document.querySelector('#original-engine').contentWindow.document.querySelector('#pages-ai-status')?.textContent||'';return text.includes('连接失败')||text.includes('网络')},null,{timeout:10000});
   assert.equal(await state(),false,'network failure must not show a verified model');
   assert.equal(count,4,'network failure must be one explicit request');
   storage=await page.evaluate(()=>localStorage.getItem('zhixu-ai-academy-deepseek-key-v1'));
   assert.equal(storage,null);
   assert.deepEqual(errors,[],'browser script errors');
   assert.deepEqual(missing,[],'missing same-origin assets');
   console.log('V5_BYOK_FAILURES_OK '+name+' '+JSON.stringify({requests:count,unauthorized:true,rateLimited:true,noCredentialPersisted:true,scriptErrors:errors.length}));
   pass++;
   await context.close();
  }finally{await browser?.close()}
 }
 console.log('V5_BYOK_FAILURES_TOTAL '+pass+'/'+(process.env.QA_ENGINE?1:2));
 }finally{server?.close()}
}
run().catch(e=>{console.error('V5_BYOK_FAILURES_FAIL',e.stack);process.exitCode=1});
