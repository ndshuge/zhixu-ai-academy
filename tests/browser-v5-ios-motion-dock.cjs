const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_CORE_PATH||'playwright-core');
const root=path.resolve(process.env.ZHIXU_PREVIEW_ROOT||'');
if(!process.env.ZHIXU_PREVIEW_ROOT)throw Error('ZHIXU_PREVIEW_ROOT is required');
const mime={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.json':'application/json','.webp':'image/webp'};
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://localhost');
 const file=path.resolve(root,'.'+decodeURIComponent(u.pathname)+(u.pathname.endsWith('/')?'index.html':''));
 if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
 fs.readFile(file,(err,data)=>err?res.writeHead(404).end(u.pathname):res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'}).end(data));
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const tests=[];
 try{
 const engines=[['edge',chromium],['webkit',webkit]].filter(([name])=>!process.env.ZHIXU_QA_ENGINE||process.env.ZHIXU_QA_ENGINE===name);
 for(const [name,engine] of engines){
  const browser=name==='edge'?await engine.launch({channel:'msedge',headless:true}):await engine.launch({headless:true});
  try{
   for(const width of [390,1440]){
    const page=await browser.newPage({viewport:{width,height:844},reducedMotion:'no-preference'});
    try{
     const errors=[];page.on('pageerror',e=>errors.push(e.message));
     await page.goto('http://127.0.0.1:'+server.address().port+'/zhixu-ai-academy/apple-editions/ai-academy-v5/#growth',{waitUntil:'domcontentloaded'});
     await page.locator('#screen[data-page="growth"] h1').waitFor({timeout:12000});
     const gear=page.locator('.toolbar-trailing button[data-route="settings"]');
     assert.equal(await gear.isVisible(),true,'gear visible before navigating');
     await gear.click();
     await page.locator('#screen[data-page="settings"] h1').waitFor();
     assert.equal(await gear.isVisible(),true,'gear must remain present on settings');
     assert.equal(await gear.getAttribute('aria-current'),'page');
     const state=await page.evaluate(()=>{
      const overlay=getComputedStyle(document.querySelector('.zx-progressive-underlay .zx-blur-layer:nth-child(4)'));
      const first=document.querySelector('#screen > :first-child');
      return {direction:document.querySelector('#screen').dataset.direction,
        animation:first?getComputedStyle(first).animationName:'',
        overlayOpacity:overlay.opacity,blur:overlay.backdropFilter||overlay.webkitBackdropFilter,
        mask:overlay.maskImage||overlay.webkitMaskImage,
        htmlWidth:document.documentElement.scrollWidth,windowWidth:innerWidth};
     });
     assert.equal(state.direction,'forward');
     assert.match(state.animation,width===390?/zx-duo-fast-enter/:/zx-ios-page-enter/,'navigation should animate content rather than only swapping markup');
     assert.ok(state.htmlWidth<=state.windowWidth,'no horizontal overflow');
     if(width===390){
      assert.equal(state.overlayOpacity,'1','edge remains active at scroll end');
      assert.match(state.blur,/blur\(20px\)/);
      assert.match(state.mask,/linear-gradient/);
     }
     await page.waitForTimeout(360);
     if(width===390){
      const tab=page.locator('#mobile-tabs button[data-route="library"]');
      await tab.click();
     }else{
      await page.locator('.primary-menu button[data-route="library"]').click();
     }
     await page.locator('#screen[data-page="library"] h1').waitFor();
     assert.equal(await gear.isVisible(),true);
     assert.equal(await gear.getAttribute('aria-current'),null);
     assert.equal(await page.locator('#screen').getAttribute('data-direction'),'backward');
     await page.emulateMedia({reducedMotion:'reduce'});
     await gear.click();
     await page.locator('#screen[data-page="settings"] h1').waitFor();
     assert.equal(await gear.isVisible(),true);
     assert.equal(await page.locator('#screen').getAttribute('data-entering'),null,'reduce motion should not strand active page transitions');
     assert.equal(await page.locator('#screen > :first-child').evaluate(el=>getComputedStyle(el).animationName),'none');
     await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
     if(width===390)assert.equal(await page.evaluate(()=>getComputedStyle(document.querySelector('.zx-progressive-underlay')).opacity),'1');
     assert.deepEqual(errors,[],'no frontend script crashes');
     console.log('IOS_MOTION_DOCK_OK',name,width,state.direction,'backward');
     tests.push(name+':'+width);
    }finally{await page.close()}
   }
  }finally{await browser.close()}
 }
 console.log('IOS_MOTION_DOCK_TOTAL',tests.length);
 }catch(e){console.error('IOS_MOTION_DOCK_FAILED',e.stack);process.exitCode=1}finally{server.close()}
})();