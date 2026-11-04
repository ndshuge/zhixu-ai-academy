const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_CORE_PATH||'playwright-core');
const root=path.resolve(process.env.ZHIXU_PREVIEW_ROOT||'');
if(!process.env.ZHIXU_PREVIEW_ROOT)throw Error('ZHIXU_PREVIEW_ROOT required');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json'};
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://localhost'),dest=path.resolve(root,'.'+decodeURIComponent(u.pathname)+(u.pathname.endsWith('/')?'index.html':''));
 if(!dest.startsWith(root+path.sep))return res.writeHead(403).end();
 fs.readFile(dest,(error,data)=>error?res.writeHead(404).end(u.pathname):res.writeHead(200,{'content-type':mime[path.extname(dest)]||'application/octet-stream'}).end(data));
});
(async()=>{
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 let success=0;
 try{
 for(const [name,engine] of [['edge',chromium],['webkit',webkit]].filter(([name])=>!process.env.ZHIXU_QA_ENGINE||process.env.ZHIXU_QA_ENGINE===name)){
  const browser=name==='edge'?await engine.launch({channel:'msedge',headless:true}):await engine.launch({headless:true});
  try{
   for(const width of (process.env.ZHIXU_QA_SMALL? [195,320,768]:[390,1440])){
    const page=await browser.newPage({viewport:{width,height:844},reducedMotion:'reduce'});
    const errors=[],missing=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('response',r=>{if(r.status()===404)missing.push(r.url())});
    await page.route('https://api.deepseek.com/**',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({model:'deepseek-flash',choices:[{message:{content:'连接成功'}}],usage:{total_tokens:8}})}));
    await page.route('https://**/*',route=>{if(route.request().url().includes('api.deepseek.com'))return route.continue();return route.abort()});
    const url='http://127.0.0.1:'+server.address().port+'/zhixu-ai-academy/apple-editions/ai-academy-v5/#settings';
    await page.addInitScript(()=>{try{localStorage.setItem('zhixu-ai-academy-deepseek-key-v1',JSON.stringify({provider:'deepseek',model:'deepseek-flash',key:'sk-FAKESESSIONONLYKEY0000000000'}))}catch{}});
    await page.goto(url,{waitUntil:'domcontentloaded'});
    await page.locator('.type-scale-control button[data-scale="100"]').waitFor({timeout:12000});
    const label=page.locator('#screen .setting-row strong').first();
    await page.waitForFunction(()=>{const e=document.querySelector('#screen .setting-row strong');return e&&parseFloat(getComputedStyle(e).fontSize)>0},{timeout:6000});
    const beforeRaw=await label.evaluate(el=>getComputedStyle(el).fontSize);
    console.log('TYPE_BEFORE',name,width,beforeRaw);
    const sizeBefore=parseFloat(beforeRaw);
    await page.locator('.type-scale-control button[data-scale="150"]').click();
    const sizeAfter=parseFloat(await label.evaluate(el=>getComputedStyle(el).fontSize));

    assert.ok(sizeAfter>sizeBefore*1.35,'actual reading text size must scale');
    assert.equal(await page.locator('.type-scale-control button[data-scale="150"]').getAttribute('aria-pressed'),'true');
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'large text overflows');
    await page.reload({waitUntil:'domcontentloaded'});
    await page.locator('.type-scale-control button[data-scale="150"]').waitFor();
    assert.equal(await page.locator('.type-scale-control button[data-scale="150"]').getAttribute('aria-pressed'),'true');
    await page.locator('button[data-action="toggle-reduced"]').click();
    assert.ok(await page.locator('button[data-action="toggle-reduced"]').evaluate(el=>document.activeElement===el),'motion preference focus must survive rerender');
    await page.waitForTimeout(80);
    const animation=await page.locator('#mobile-tabs .tab-lens').evaluate(el=>getComputedStyle(el).transitionDuration);
    assert.ok(animation.split(',').every(n=>parseFloat(n)<0.01),'reduced motion must stop transitions');
    await page.waitForFunction(()=>!!window.ZHIXU_NATIVE_API && document.querySelector('#original-engine')?.contentWindow?.ZHIXU_BROWSER_ADAPTER,{timeout:14000});
    assert.equal(await page.evaluate(()=>window.ZHIXU_NATIVE_API.status()),false,'V5 does not restore plaintext keys');
    assert.equal(await page.locator('#pages-ai-card').count(),0,'legacy setup is not visible');
    assert.equal(await page.locator('#original-engine').getAttribute('src'),'/zhixu-ai-academy/learning.html?zhixu-v5-session=1');
    assert.deepEqual(errors,[]);
    assert.deepEqual(missing,[]);
    console.log('TYPE_MOTION_API_OK',name,width,'font',sizeBefore,sizeAfter);
    success++;
    await page.close();
   }
  }finally{await browser.close()}
 }
 console.log('TYPE_MOTION_API_TOTAL',success+'/'+((process.env.ZHIXU_QA_ENGINE?1:2)*(process.env.ZHIXU_QA_SMALL?3:2)));
 }catch(e){console.error('TYPE_MOTION_API_FAIL',e.stack);process.exitCode=1}finally{server.close()}
})();