const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_CORE_PATH||'playwright-core');
const root=path.resolve(process.env.ZHIXU_PREVIEW_ROOT||'');
if(!process.env.ZHIXU_PREVIEW_ROOT)throw Error('ZHIXU_PREVIEW_ROOT required');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://localhost'),f=path.resolve(root,'.'+decodeURIComponent(u.pathname)+(u.pathname.endsWith('/')?'index.html':''));
 if(!f.startsWith(root+path.sep))return res.writeHead(403).end();
 fs.readFile(f,(err,body)=>err?res.writeHead(404).end(u.pathname):res.writeHead(200,{'content-type':mime[path.extname(f)]||'application/octet-stream'}).end(body));
});
(async()=>{
 await new Promise(done=>server.listen(0,'127.0.0.1',done));let cases=0;
 try{
  for(const [name,engine] of [['edge',chromium],['webkit',webkit]].filter(([n])=>!process.env.ZHIXU_QA_ENGINE||process.env.ZHIXU_QA_ENGINE===n)){
   const browser=name==='edge'?await engine.launch({channel:'msedge',headless:true}):await engine.launch({headless:true});
   try{
    for(const width of [390,1440]){
     const page=await browser.newPage({viewport:{width,height:844},reducedMotion:'no-preference'});
     const errors=[];page.on('pageerror',e=>errors.push(e.message));
     try{
      await page.goto('http://127.0.0.1:'+server.address().port+'/zhixu-ai-academy/apple-editions/ai-academy-v5/#today',{waitUntil:'domcontentloaded'});
      const hero=page.locator('#screen .workshop-actions .primary').first();await hero.waitFor({state:'visible',timeout:16000});
      await page.waitForFunction(()=>{const b=document.querySelector('#screen[data-page="today"] .workshop-actions .primary');return b&&b.getBoundingClientRect().width>0&&b.getBoundingClientRect().height>=40},null,{timeout:16000});
      await page.waitForTimeout(160);
      let b=await hero.boundingBox();if(!b){await page.waitForTimeout(160);b=await hero.boundingBox()};assert.ok(b,'stable primary action must exist');
      await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();
      await page.waitForTimeout(100);
      assert.equal(await hero.getAttribute('data-zx-press'),'down','press feedback is visible during hold');
      assert.match(await hero.evaluate(el=>getComputedStyle(el).transitionDuration),/0\.08s/,'physical downstroke uses 80ms');
      await page.mouse.up();
      assert.equal(await hero.getAttribute('data-zx-press'),'release','feedback survives pointer release');
      assert.match(await hero.evaluate(el=>getComputedStyle(el).transitionDuration),/0\.25s/,'elastic release keeps 250ms');
      assert.equal(await page.locator('#screen').getAttribute('data-page'),'today','route must not switch immediately at pointerup');
      await page.waitForTimeout(90);
      assert.equal(await page.locator('#screen').getAttribute('data-page'),'today','route must remain until the release is perceptible');
      await page.locator('#screen[data-page="learn"] .experiment-tabs').waitFor({timeout:8000});
      const active=page.locator('#screen .experiment-tabs .is-active');
      assert.equal(await active.getAttribute('data-experiment'),'sensitivity');
      const last=page.locator('#screen .experiment-tabs button[data-experiment="evo-pair"]');
      await last.click();
      assert.equal(await active.getAttribute('data-experiment'),'sensitivity','segmented selection must show release before rerender');
      await page.waitForFunction(()=>document.querySelector('#screen .experiment-tabs .is-active')?.dataset.experiment==='evo-pair',{timeout:5000});
      const gear=page.locator('.toolbar-trailing button[data-route="settings"]');
      await gear.click();
      assert.equal(await page.locator('#screen').getAttribute('data-page'),'learn','settings route transition should not be immediate');
      await page.locator('#screen[data-page="settings"]').waitFor({timeout:7000});
      await gear.click();
      await page.locator('#screen[data-page="learn"]').waitFor({timeout:7000});
      const doctor=page.locator('.toolbar-trailing .doctor-launch');
      await doctor.click();
      assert.equal(await doctor.getAttribute('aria-expanded'),'false','Doctor opens after press release is visible');
      await page.locator('#doctor-panel.doctor-visible').waitFor({timeout:7000});
      await page.locator('#doctor-close').click();
      assert.equal(await doctor.getAttribute('aria-expanded'),'true','close must also honor release feedback');
      await page.locator('#doctor-panel').waitFor({state:'hidden',timeout:7000});
      await gear.focus();await page.keyboard.press('Enter');
      assert.equal(await page.locator('#screen').getAttribute('data-page'),'settings','keyboard activation stays immediate');
      await gear.focus();await page.keyboard.press('Enter');
      assert.equal(await page.locator('#screen').getAttribute('data-page'),'learn');
      const navSelector=width<701?'#mobile-tabs ':'.primary-menu ';
      await page.locator(navSelector+'button[data-route="courses"]').click();
      await page.locator(navSelector+'button[data-route="growth"]').click();
      assert.equal(await page.locator('#screen').getAttribute('data-page'),'learn','rapid taps defer re-render until the last choice');
      await page.locator('#screen[data-page="growth"]').waitFor({timeout:7000});
      await page.emulateMedia({reducedMotion:'reduce'});
      await gear.click();
      assert.equal(await page.locator('#screen').getAttribute('data-page'),'settings','reduced motion click remains immediate');
      assert.deepEqual(errors,[]);
      console.log('PRESS_TIMELINE_OK',name,width);
      cases++;
     }finally{await page.close()}
    }
   }finally{await browser.close()}
  }
  console.log('PRESS_TIMELINE_TOTAL',cases);
 }catch(e){console.error('PRESS_TIMELINE_FAILED',e.stack);process.exitCode=1}finally{server.close()}
})();