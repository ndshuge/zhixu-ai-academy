const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_CORE_PATH||'playwright-core');
if(!process.env.ZHIXU_PREVIEW_ROOT)throw Error('ZHIXU_PREVIEW_ROOT required');
const root=path.resolve(process.env.ZHIXU_PREVIEW_ROOT);
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://local');
 const source=path.resolve(root,'zhixu-ai-academy');
 const rel=u.pathname.replace(/^\/zhixu-ai-academy\//,'');
 const base=rel.startsWith('apple-editions/')?source:path.resolve(source,'docs');
 const file=path.resolve(base,decodeURIComponent(rel)+(u.pathname.endsWith('/')?'index.html':''));
 if(!file.startsWith(base+path.sep))return res.writeHead(403).end();
 const ext=path.extname(file);
 fs.readFile(file,(err,b)=>err?res.writeHead(404).end(u.pathname):res.writeHead(200,{'content-type':{'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html;charset=utf-8','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'}[ext]||'application/octet-stream'}).end(b));
});
async function run(browser,width,name){
 const page=await browser.newPage({viewport:{width,height:844},hasTouch:width<700});
 const errors=[],missing=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()===404)missing.push(r.url())});
 try{
  await page.goto('http://127.0.0.1:'+server.address().port+'/zhixu-ai-academy/apple-editions/ai-academy-v5/#learn',{waitUntil:'domcontentloaded'});
  await page.locator('#screen[data-page="learn"] h1').waitFor();
  assert.equal(await page.locator('#screen .page-intro h1').textContent(),'从判断开始');
  await page.locator('#screen [data-action=load-question]').click();

  let attempts=0;
  while(attempts++<8){
   await page.locator('#quiz-form[data-quiz-state=unselected] input[type=radio]').first().waitFor({timeout:12000});
   await page.locator('#quiz-form input[type=radio]').first().check();
   assert.equal(await page.locator('#quiz-form button[type=submit]').isEnabled(),true,'selection enables submit');
   await page.locator('#quiz-form button[type=submit]').click();
   await page.locator('#quiz-form[data-quiz-state=submitted]').waitFor({timeout:12000});
   if(await page.locator('#screen [data-action=next-pre]').count()){
    await page.locator('#screen [data-action=next-pre]').click();
    await page.locator('#quiz-form[data-quiz-state=unselected]').waitFor({timeout:12000});
    continue;
   }
   await page.locator('#screen [data-action=next-prediction]').click();
   await page.locator('#screen .page-intro h1').filter({hasText:'写下你的预测'}).waitFor({timeout:12000});
   break;
  }
  assert.ok(attempts<8,'quiz progresses to prediction');
  assert.equal(await page.locator('#screen .page-intro h1').textContent(),'写下你的预测');
  assert.equal(await page.locator('#screen .learning-paper').getAttribute('data-step-direction'),'forward');
  assert.ok(await page.locator('#screen .page-intro h1').evaluate(el=>el===document.activeElement),'step focus handoff');
  assert.equal(await page.evaluate(()=>window.scrollY),0,'next lesson stage starts at document top');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no horizontal overflow');
  const dir=path.resolve('evidence/browser');fs.mkdirSync(dir,{recursive:true});
  if(name==='edge'&&[390,1440].includes(width))await page.screenshot({path:path.join(dir,'vnext-learning-prediction-'+width+'.png'),fullPage:true});
  await page.evaluate(()=>document.querySelector('#outline-content [data-action=study-step][data-index="0"]').click());
  assert.equal(await page.locator('#screen .page-intro h1').textContent(),'从判断开始');
  assert.equal(await page.locator('#screen .learning-paper').getAttribute('data-step-direction'),'backward');
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.evaluate(()=>document.querySelector('#outline-content [data-action=study-step][data-index="1"]').click());
  assert.equal(await page.locator('#screen .page-intro h1').textContent(),'写下你的预测');
  assert.equal(await page.locator('#screen .learning-paper').getAttribute('data-step-direction'),'forward');
  assert.equal(await page.locator('#screen .learning-paper').evaluate(el=>el.getAnimations().length),0,'reduced motion does not animate lesson content');
  assert.deepEqual(errors,[],'no JS errors');
  assert.deepEqual(missing,[],'no missing assets');
  console.log('VNEXT_STAGE_OK',name,width,'focus+forward+back+reduced+overflow');
 }finally{await page.close();}
}
(async()=>{await new Promise(ok=>server.listen(0,'127.0.0.1',ok));let count=0;
 try{
  for(const [name,engine] of [['edge',chromium],['webkit',webkit]].filter(([n])=>!process.env.ZHIXU_QA_ENGINE||process.env.ZHIXU_QA_ENGINE===n)){
   const browser=name==='edge'?await engine.launch({channel:'msedge',headless:true}):await engine.launch({headless:true});
   try{for(const width of (process.env.ZHIXU_QA_WIDTH?[Number(process.env.ZHIXU_QA_WIDTH)]:[320,390,768,1440])){await run(browser,width,name);count++;}}finally{await browser.close();}
  }
  console.log('VNEXT_STAGE_TOTAL',count);
 }catch(e){console.error('VNEXT_STAGE_FAIL',e.stack);process.exitCode=1}finally{server.close();}
})();
