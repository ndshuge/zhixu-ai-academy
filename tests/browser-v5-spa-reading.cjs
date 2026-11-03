const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const pw=require(process.env.PLAYWRIGHT_CORE_PATH||'playwright-core');
const root=path.resolve(process.env.ZHIXU_PREVIEW_ROOT);
const mime={'.html':'text/html;charset=utf-8','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://local'),file=path.resolve(root,'.'+decodeURIComponent(u.pathname)+(u.pathname.endsWith('/')?'index.html':''));
 if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
 fs.readFile(file,(e,b)=>e?res.writeHead(404).end(u.pathname):res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'}).end(b))
});
(async()=>{await new Promise(done=>server.listen(0,'127.0.0.1',done));let count=0;
try{for(const [name,engine] of [['edge',pw.chromium],['webkit',pw.webkit]]){
 const browser=name==='edge'?await engine.launch({channel:'msedge',headless:true}):await engine.launch({headless:true});
 try{for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:844},hasTouch:width<700});
  const errors=[],missing=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()===404)missing.push(r.url())});
  await page.goto('http://127.0.0.1:'+server.address().port+'/zhixu-ai-academy/apple-editions/ai-academy-v5/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!window.ZHIXU_V4_NAVIGATE);
  await page.evaluate(()=>window.ZHIXU_V4_NAVIGATE('settings'));
  assert.equal(await page.locator('#screen').getAttribute('data-page'),'settings');
  assert.ok(await page.locator('#screen').evaluate(e=>document.activeElement===e),'route change should transfer focus to main');
  assert.match(await page.title(),/设置/);
  await page.evaluate(()=>window.ZHIXU_V4_NAVIGATE('learn'));
  assert.ok(await page.locator('#screen').evaluate(e=>document.activeElement===e),'learning route focus');
  assert.match(await page.title(),/学习/);
  const progress=page.locator('#screen [role=progressbar]');
  assert.equal(await progress.getAttribute('aria-valuemin'),'1');
  assert.equal(await progress.getAttribute('aria-valuemax'),'4');
  assert.equal(await progress.getAttribute('aria-valuenow'),'1');
  assert.match(await progress.getAttribute('aria-valuetext'),/1.*独立判断/);
  const btn=page.locator('#screen [data-action=load-question]');
  await btn.evaluate(e=>e.focus());await page.evaluate(()=>window.dispatchEvent(new Event('zhixu:content-rendered')));
  assert.ok(await btn.evaluate(e=>document.activeElement===e),'same-route render must not steal keyboard focus');
  if(name==='edge'&&width===390){
   const advance=async(next)=>{
    const inputs=page.locator('#quiz-form input[name=answer]');
    await inputs.first().waitFor({state:'visible',timeout:13000});
    await inputs.first().check();
    await page.locator('#quiz-form button[type=submit]').click();
    await page.locator('#screen [data-action='+next+']').first().waitFor({state:'visible',timeout:13000});
    await page.locator('#screen [data-action='+next+']').first().click();
   };
   await page.locator('#screen [data-action=load-question]').click();
   await advance('next-pre');
   await advance('next-prediction');
   assert.equal(await progress.getAttribute('aria-valuenow'),'2','prediction stage');
   await page.locator('#prediction').fill('我预测两个近似初始值会随迭代显示可辨别差异');
   await page.locator('#prediction-form button[type=submit]').click();
   await page.waitForFunction(()=>!!document.querySelector('#screen [data-action=mentor]')&&!document.querySelector('#screen [data-action=mentor]').disabled,null,{timeout:30000});
   assert.equal(await progress.getAttribute('aria-valuenow'),'3','experiment stage');
   await page.locator('#screen [data-action=mentor]').click();
   await page.locator('#screen [data-action=next-transfer]').click();
   assert.equal(await progress.getAttribute('aria-valuenow'),'4','transfer stage');
  }
  await page.goBack({waitUntil:'domcontentloaded'}).catch(()=>null);
  await page.waitForTimeout(120);
  assert.deepEqual(errors,[]);
  assert.deepEqual(missing,[]);
  console.log('A11Y_SEMANTICS_PASS',name,width);
  count++;await page.close()
 }}finally{await browser.close()}}
 console.log('A11Y_SEMANTICS_TOTAL',count);
}catch(e){console.error('A11Y_SEMANTICS_FAIL',e.stack);process.exitCode=1}finally{server.close()}})();