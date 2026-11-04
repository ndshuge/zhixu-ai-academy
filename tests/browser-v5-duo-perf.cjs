const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_CORE_PATH||'playwright-core');
const root=path.resolve(process.env.ZHIXU_PREVIEW_ROOT||'');
if(!process.env.ZHIXU_PREVIEW_ROOT)throw Error('ZHIXU_PREVIEW_ROOT required');
const mime={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.mjs':'text/javascript'};
const srv=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost'),file=path.resolve(root,'.'+decodeURIComponent(url.pathname)+(url.pathname.endsWith('/')?'index.html':''));
 if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
 fs.readFile(file,(e,bytes)=>e?res.writeHead(404).end(url.pathname):res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'}).end(bytes));
});
(async()=>{
 await new Promise(ok=>srv.listen(0,'127.0.0.1',ok));
 let passed=0;
 try{
 for(const [name,engine] of [['edge',chromium],['webkit',webkit]].filter(([key])=>!process.env.ZHIXU_QA_ENGINE||process.env.ZHIXU_QA_ENGINE===key)){
  const browser=name==='edge'?await engine.launch({channel:'msedge',headless:true}):await engine.launch({headless:true});
  try{
   for(const width of [390,1440]){
    const page=await browser.newPage({viewport:{width,height:844}});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    try{
     await page.goto('http://127.0.0.1:'+srv.address().port+'/zhixu-ai-academy/apple-editions/ai-academy-v5/#today',{waitUntil:'domcontentloaded'});
     await page.locator('#screen[data-page="today"] h1').waitFor({timeout:13000});
     const doctor=page.locator('.toolbar-trailing .doctor-launch');
     const doctorStyle=await doctor.evaluate(el=>({shadow:getComputedStyle(el).boxShadow,filter:getComputedStyle(el).backdropFilter,rect:el.getBoundingClientRect().width}));
     assert.match(doctorStyle.shadow,/rgb/);assert.ok(doctorStyle.rect>=42);
     const pos=await doctor.boundingBox();await page.mouse.move(pos.x+pos.width/2,pos.y+pos.height/2);await page.mouse.down();await page.waitForTimeout(100);
     const pressedDoctor=await doctor.evaluate(el=>({transform:getComputedStyle(el).transform,shadow:getComputedStyle(el).boxShadow}));
     await page.waitForFunction(()=>new DOMMatrixReadOnly(getComputedStyle(document.querySelector('.toolbar-trailing .doctor-launch')).transform).m42>1.5,null,{timeout:1200});
     await page.mouse.up();
     await page.locator('#doctor-panel.doctor-visible').waitFor({timeout:8000});
     await page.locator('#doctor-close').click();
     await page.locator('#doctor-panel').waitFor({state:'hidden',timeout:8000});
     if(width===390){
      const fade=await page.evaluate(()=>{
       const edge=getComputedStyle(document.body,'::after'),nav=getComputedStyle(document.querySelector('#mobile-tabs .nav-optics'));
       return {blur:edge.backdropFilter||edge.webkitBackdropFilter,background:edge.backgroundImage,mask:edge.maskImage||edge.webkitMaskImage,height:edge.height,bottom:edge.bottom,navFilter:document.querySelector('#mobile-tabs .nav-optics').style.filter,navBlur:nav.backdropFilter||nav.webkitBackdropFilter};
      });
      assert.ok(fade.blur.includes('blur(24px)'),fade.blur);
      assert.match(fade.background,/0\.97/);
      assert.match(fade.mask,/linear-gradient/);
      assert.ok(fade.navBlur==='none',fade.navBlur);
      assert.equal(fade.navFilter,'','mobile lens should not run SVG refraction');
      await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
      assert.equal(await page.evaluate(()=>getComputedStyle(document.body,'::after').opacity),'1');
     }
     const cta=page.locator('#screen .workshop-actions .primary').first();
     await cta.scrollIntoViewIfNeeded();
     const ctaBefore=await cta.evaluate(el=>getComputedStyle(el).boxShadow);
     const bb=await cta.boundingBox();assert.ok(bb);
     await page.mouse.move(bb.x+bb.width/2,bb.y+bb.height/2);await page.mouse.down();await page.waitForTimeout(100);
     const pressed=await cta.evaluate(el=>getComputedStyle(el).transform);
     assert.ok(await cta.evaluate(el=>new DOMMatrixReadOnly(getComputedStyle(el).transform).m42)>1.5,'lesson button should physically depress');
     await page.mouse.up();
     await page.locator('#screen').evaluate(el=>el.scrollIntoView({block:'start'}));
     if(width===390){
      const dock=page.locator('#mobile-tabs button[data-route="growth"]');
      await dock.click();await page.locator('#screen[data-page="growth"] h1').waitFor();
     }
     await page.emulateMedia({colorScheme:'dark',reducedMotion:'reduce'});
     const dark=await doctor.evaluate(el=>getComputedStyle(el).backgroundColor);
     assert.equal(dark,'rgb(36, 58, 57)','Doctor button uses a dark raised material');
     const rb=await doctor.boundingBox();await page.mouse.move(rb.x+rb.width/2,rb.y+rb.height/2);await page.mouse.down();await page.waitForTimeout(35);
     const reducedY=await doctor.evaluate(el=>new DOMMatrixReadOnly(getComputedStyle(el).transform).m42);
     assert.ok(Math.abs(reducedY)<0.01,'reduced motion prevents pressed displacement');
     await page.mouse.up();
     assert.deepEqual(errors,[]);
     console.log('DUO_PERF_OK',name,width,'doctorShadow='+doctorStyle.shadow.slice(0,35),'CTA='+pressed);
     passed++;
    }finally{await page.close()}
   }
  }finally{await browser.close()}
 }
 console.log('DUO_PERF_TOTAL',passed);
 }catch(error){console.error('DUO_PERF_FAILED',error.stack);process.exitCode=1}finally{srv.close()}
})();