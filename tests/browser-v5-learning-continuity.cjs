const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_CORE_PATH||'playwright-core');
const root=path.resolve(process.env.ZHIXU_PREVIEW_ROOT||'');
if(!process.env.ZHIXU_PREVIEW_ROOT)throw Error('ZHIXU_PREVIEW_ROOT required');
const mime={'.html':'text/html;charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://localhost');
 const prefix='/zhixu-ai-academy/';
 const relative=u.pathname.startsWith(prefix)?u.pathname.slice(prefix.length):u.pathname.replace(/^\/+/, '');
 const source=path.resolve(root,'zhixu-ai-academy');
 const inEdition=relative.startsWith('apple-editions/');
 const base=inEdition?source:path.join(source,'docs');
 const file=path.resolve(base,decodeURIComponent(relative||'index.html')+(u.pathname.endsWith('/')?'index.html':''));
 if(!file.startsWith(source+path.sep))return res.writeHead(403).end();
 fs.readFile(file,(e,b)=>e?res.writeHead(404).end(u.pathname):res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'}).end(b));
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 let passed=0;
 try{
  const selected=[['edge',chromium],['webkit',webkit]].filter(([n])=>!process.env.ZHIXU_QA_ENGINE||n===process.env.ZHIXU_QA_ENGINE);
  for(const [engineName,engine] of selected){
   const browser=engineName==='edge'?await engine.launch({channel:'msedge',headless:true}):await engine.launch({headless:true});
   try{
    for(const width of [390,1440]){
     const page=await browser.newPage({viewport:{width,height:844}});
     const errors=[];page.on('pageerror',e=>errors.push(e.message));
     try{
      const url='http://127.0.0.1:'+server.address().port+'/zhixu-ai-academy/apple-editions/ai-academy-v5/#today';
      await page.goto(url,{waitUntil:'domcontentloaded'});
      await page.locator('#screen[data-page="today"] .world-card').first().waitFor({timeout:16000});
      assert.equal(await page.locator('#screen .zx-next-lesson').count(),0,'fresh session has no fake progress');
      await page.locator('#screen [data-action="enter-sensitivity"]').first().click();
      await page.locator('#screen[data-page="learn"]').waitFor();
      await page.locator('#screen [data-action="load-question"]').click();
      await page.locator('#quiz-form input[type="radio"]').first().waitFor({timeout:18000});
      assert.equal(await page.locator('#quiz-form').getAttribute('data-quiz-state'),'unselected');
      assert.equal(await page.locator('#quiz-form input[type="radio"]:checked').count(),0);
      assert.equal(await page.locator('#quiz-form button[type="submit"]').isDisabled(),true);
      await page.locator('#quiz-form input[type="radio"]').first().check();
      assert.equal(await page.locator('#quiz-form').getAttribute('data-quiz-state'),'selected');
      assert.equal(await page.locator('#quiz-form button[type="submit"]').isEnabled(),true);
      await page.locator('#screen [data-action="exit-focus"]').click();
      await page.locator('#screen[data-page="today"] .zx-next-lesson').waitFor();
      assert.match(await page.locator('#screen .zx-next-lesson').innerText(),/下一站学习/);
      await page.goBack({waitUntil:'domcontentloaded'});
      await page.locator('#screen[data-page="learn"] #quiz-form').waitFor();
      assert.equal(await page.locator('#quiz-form input[type="radio"]:checked').count(),1,'Back restores draft answer');
      await page.locator('#screen [data-action="exit-focus"]').click();
      await page.locator('#screen [data-action="resume-learning"]').click();
      await page.locator('#screen[data-page="learn"] #quiz-form').waitFor();
      assert.equal(await page.locator('#quiz-form input[type="radio"]:checked').count(),1,'resume restores draft answer');
      assert.equal(await page.locator('#quiz-form button[type="submit"]').isEnabled(),true);
      await page.locator('#quiz-form button[type="submit"]').click();
      await page.locator('#quiz-form[data-quiz-state="submitted"]').waitFor({timeout:12000});
      assert.equal(await page.locator('#quiz-form .quiz-explanation').count(),0,'pretest cannot leak answer');
      assert.match(await page.locator('#quiz-form .feedback').innerText(),/初始判断已记录/);
      if(await page.locator('#screen [data-action="next-pre"]').count()){
       await page.locator('#screen [data-action="next-pre"]').click();
       await page.locator('#quiz-form[data-quiz-state="unselected"]').waitFor();
       assert.equal(await page.locator('#quiz-form input[type="radio"]:checked').count(),0,'new question begins empty');
      }
      assert.deepEqual(errors,[],'no uncaught application errors');
      console.log('VNEXT_LEARNING_OK',engineName,width,'draft-back-resume-pre-submit-next-empty');
      passed++;
     }finally{await page.close()}
    }
   }finally{await browser.close()}
  }
  console.log('VNEXT_LEARNING_TOTAL',passed);
 }catch(e){console.error('VNEXT_LEARNING_FAILED',e.stack);process.exitCode=1}
 finally{server.close()}
})();
