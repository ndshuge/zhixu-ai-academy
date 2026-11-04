const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_CORE_PATH||'playwright-core');
const root=path.resolve(process.env.ZHIXU_PREVIEW_ROOT||'');
if(!process.env.ZHIXU_PREVIEW_ROOT)throw Error('ZHIXU_PREVIEW_ROOT required');
const mime={'.html':'text/html;charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{const u=new URL(req.url,'http://localhost'),f=path.resolve(root,'.'+decodeURIComponent(u.pathname)+(u.pathname.endsWith('/')?'index.html':''));
if(!f.startsWith(root+path.sep))return res.writeHead(403).end();fs.readFile(f,(e,b)=>e?res.writeHead(404).end(u.pathname):res.writeHead(200,{'content-type':mime[path.extname(f)]||'application/octet-stream'}).end(b))});
(async()=>{await new Promise(ok=>server.listen(0,'127.0.0.1',ok));let passed=0;
 try{for(const [name,engine] of [['edge',chromium],['webkit',webkit]].filter(([k])=>!process.env.ZHIXU_QA_ENGINE||process.env.ZHIXU_QA_ENGINE===k)){
 const browser=name==='edge'?await engine.launch({channel:'msedge',headless:true}):await engine.launch({headless:true});
 try{for(const width of [390,1440]){
 const page=await browser.newPage({viewport:{width,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 let mode='success',calls=0;await page.route('https://api.deepseek.com/chat/completions',async route=>{calls++;if(mode==='network')return route.abort('failed');
 let status=mode==='success'?200:mode==='401'?401:mode==='402'?402:429;
 return route.fulfill({status,contentType:'application/json',body:JSON.stringify(status===200?{model:'deepseek-flash',choices:[{message:{content:'连接成功'}}],usage:{total_tokens:7}}:{error:{message:'synthetic test failure'}})})});
 try{
  await page.goto('http://127.0.0.1:'+server.address().port+'/zhixu-ai-academy/apple-editions/ai-academy-v5/#today',{waitUntil:'domcontentloaded'});
  await page.locator('#screen[data-page="today"] [data-action=enter-evo]').click();
  await page.locator('#screen[data-page="learn"] [data-action=exit-focus]').waitFor({timeout:13000});
  assert.equal(await page.locator('#screen .experiment-tabs').count(),0,'focused learning has no global experiment tabs');
  assert.equal(await page.evaluate(()=>window.ZHIXU_V4_DEBUG().lesson.experiment),'evo-pair');
  assert.equal(await page.evaluate(()=>document.querySelector('#mobile-tabs').inert),true);
  await page.locator('#screen [data-action="exit-focus"]').click();
  await page.locator('#screen[data-page="today"]').waitFor({timeout:13000});
  if(width<701){
   const material=await page.evaluate(()=>{const c=document.querySelector('.zx-progressive-underlay'),layers=[...c.querySelectorAll('.zx-blur-layer')];
   return {bottom:getComputedStyle(c).bottom,height:parseFloat(getComputedStyle(c).height),
   blur:layers.map(el=>getComputedStyle(el).backdropFilter||getComputedStyle(el).webkitBackdropFilter)}});
   assert.equal(material.bottom,'0px');assert.ok(material.height>=114&&material.height<=160);
   assert.deepEqual(material.blur.map(x=>x.match(/blur\((\d+)px\)/)?.[1]),['2','6','12','20']);
  }
  await page.locator('.toolbar-trailing button[data-route="settings"]').click();
  await page.locator('#screen[data-page="settings"] [data-action="open-ai-config"]').click();
  await page.locator('.zx-api-panel').waitFor({timeout:12000});
  assert.equal(await page.locator('#original-engine').evaluate(el=>getComputedStyle(el).opacity),'0','Original engine remains hidden');
  assert.equal(await page.locator('#pages-ai-card').count(),0,'old modal must not exist on V5 surface');
  assert.match(await page.locator('.zx-api-panel').innerText(),/连接 DeepSeek/);
  const key='sk-'+'a'.repeat(24);
  await page.locator('#zx-native-key').fill(key);
  await page.locator('.zx-api-connect').click();
  await page.locator('.zx-api-status[data-state="ok"]').getByText(/连接成功/).waitFor({timeout:9000});
  assert.equal(calls,1);
  assert.equal(await page.evaluate(()=>window.ZHIXU_NATIVE_API.status()),true);
  assert.equal(await page.locator('#zx-native-key').inputValue(),'');
  assert.equal(await page.evaluate(key=>JSON.stringify(localStorage).includes(key),key),false,'key is not persisted');
  await page.locator('.zx-api-close').click();
  await page.locator('.zx-api-panel').waitFor({state:'detached',timeout:8000});
  // The Doctor consumes the exact same native API state.
  await page.locator('.toolbar-trailing .doctor-launch').click();
  await page.locator('#doctor-panel.doctor-visible').waitFor({timeout:9000});
  assert.equal(await page.locator('#doctor-send').isDisabled(),false,'Doctor uses native verified model');
  await page.locator('#doctor-close').click();await page.locator('#doctor-panel').waitFor({state:'hidden',timeout:9000});
  await page.locator('#screen [data-action="open-ai-config"]').click();await page.locator('.zx-api-panel').waitFor();
  mode='401';await page.locator('#zx-native-model').selectOption('deepseek-v4-pro');
  await page.locator('.zx-api-connect').click();
  await page.locator('.zx-api-status[data-state="error"]').getByText(/401/).waitFor({timeout:9000});
  assert.equal(await page.evaluate(()=>window.ZHIXU_NATIVE_API.status()),false);
  mode='402';await page.locator('.zx-api-connect').click();
  await page.locator('.zx-api-status').getByText(/402/).waitFor({timeout:9000});
  mode='429';await page.locator('.zx-api-connect').click();
  await page.locator('.zx-api-status').getByText(/429/).waitFor({timeout:9000});
  mode='network';await page.locator('.zx-api-connect').click();
  await page.locator('.zx-api-status').getByText(/网络请求未成功/).waitFor({timeout:9000});
  await page.locator('.zx-api-revoke').click();
  assert.equal(await page.evaluate(()=>window.ZHIXU_NATIVE_API.status()),false);
  assert.deepEqual(errors,[]);
  console.log('NATIVE_SEGMENT_OK',name,width,'focused-study','cases='+calls);
  passed++;
 }finally{await page.close()}
 } }finally{await browser.close()}
 }
 console.log('NATIVE_SEGMENT_TOTAL',passed);
 }catch(e){console.error('NATIVE_SEGMENT_FAIL',e.stack);process.exitCode=1}finally{server.close()}
})();