const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_CORE_PATH||'playwright-core');
const root=path.resolve(process.env.ZHIXU_PREVIEW_ROOT||'');
if(!process.env.ZHIXU_PREVIEW_ROOT)throw Error('ZHIXU_PREVIEW_ROOT required');
const mime={'.html':'text/html;charset=utf-8','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.webp':'image/webp','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://localhost'),file=path.resolve(root,'.'+decodeURIComponent(u.pathname)+(u.pathname.endsWith('/')?'index.html':''));
 if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
 fs.readFile(file,(err,bytes)=>err?res.writeHead(404).end(u.pathname):res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'}).end(bytes));
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let pass=0;
 try{
  const choices=[['edge',chromium],['webkit',webkit]].filter(([name])=>!process.env.ZHIXU_QA_ENGINE||process.env.ZHIXU_QA_ENGINE===name);
  for(const [name,engine] of choices){
   const browser=name==='edge'?await engine.launch({channel:'msedge',headless:true}):await engine.launch({headless:true});
   try{
    for(const width of [320,390,1440]){
     const page=await browser.newPage({viewport:{width,height:844}});
     const errors=[];page.on('pageerror',error=>errors.push(error.message));
     try{
      await page.goto('http://127.0.0.1:'+server.address().port+'/zhixu-ai-academy/apple-editions/ai-academy-v5/#learn',{waitUntil:'domcontentloaded'});
      const row=page.locator('#screen .experiment-tabs');
      await row.waitFor({timeout:12000});
      await page.waitForFunction(()=>{const r=document.querySelector('#screen .experiment-tabs');return r && r.clientWidth>0 && [...r.querySelectorAll('button')].every(b=>b.getBoundingClientRect().height>=44) && getComputedStyle(r).overflowX==='auto' || (innerWidth>700 && r?.clientWidth>0)},{timeout:12000});
      const state=await row.evaluate(el=>({
       scrollWidth:el.scrollWidth,width:el.clientWidth,
       snap:getComputedStyle(el).scrollSnapType,overflow:getComputedStyle(el).overflowX,
       buttons:[...el.querySelectorAll('button')].map(b=>({minHeight:b.getBoundingClientRect().height,pressed:b.getAttribute('aria-pressed')}))
      }));
      assert.equal(state.buttons.length,3);
      assert.ok(state.buttons.every(b=>b.minHeight>=44));
      if(width<701){
       assert.ok(state.scrollWidth>state.width+4,'horizontal chip row should be draggable');
       assert.match(state.snap,/^x(?: proximity)?$/,'computed snap may omit default proximity');
       assert.equal(state.overflow,'auto');
       await row.evaluate(el=>el.scrollTo({left:el.scrollWidth,behavior:'instant'}));
       await page.waitForTimeout(90);
       assert.ok(await row.evaluate(el=>el.scrollLeft)>12,'chips can move horizontally');
      }
      await page.locator('#screen .experiment-tabs button[data-experiment="evo-pair"]').click();
      const selected=page.locator('#screen .experiment-tabs button.is-active');
      await selected.waitFor();
      await page.waitForFunction(()=>document.querySelector('#screen .experiment-tabs .is-active')?.dataset.experiment==='evo-pair',{timeout:6000});
      assert.equal(await selected.getAttribute('data-experiment'),'evo-pair');
      if(width<701){
       await page.waitForTimeout(260);
       const visibility=await selected.evaluate(el=>{
        const parent=el.closest('.experiment-tabs').getBoundingClientRect(),box=el.getBoundingClientRect();
        return {visible:box.left>=parent.left-2 && box.right<=parent.right+2,focused:document.activeElement===el};
       });
       assert.ok(visibility.visible,'chosen chip must stay visible after rerender');
       assert.ok(visibility.focused,'keyboard focus should follow chosen chip');
      }
      await page.locator('#screen').evaluate(el=>el.scrollIntoView({block:'start',behavior:'instant'}));
      if(width<701){
       const result=await page.evaluate(()=>{
        const edge=getComputedStyle(document.body,'::after'),dock=getComputedStyle(document.querySelector('.mobile-native-tabs .nav-optics'));
        return {edge:edge.backdropFilter||edge.webkitBackdropFilter,
                dock:dock.backdropFilter||dock.webkitBackdropFilter,
                parent:getComputedStyle(document.querySelector('#mobile-tabs')).backdropFilter||getComputedStyle(document.querySelector('#mobile-tabs')).webkitBackdropFilter,
                mask:edge.maskImage||edge.webkitMaskImage,
                background:edge.backgroundImage,opacity:edge.opacity,
                height:parseFloat(edge.height),htmlOverflow:document.documentElement.scrollWidth-innerWidth};
       });
       assert.ok(result.edge.includes('blur(24px)'),result.edge);
       assert.equal(result.dock,'none','one scroll edge backdrop, no second dock blur');
       assert.equal(result.parent,'none','Dock container must not add an extra blur boundary');
       assert.ok(result.mask.includes('linear-gradient'));
       assert.match(result.background,/0\.97/);
       assert.equal(result.opacity,'1');
       assert.ok(result.htmlOverflow<=1,'no document horizontal overflow');
       await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
       assert.equal(await page.evaluate(()=>getComputedStyle(document.body,'::after').opacity),'1');
      }
      assert.deepEqual(errors,[]);
      console.log('APPLE_SWIPE_OK',name,width,'scroll='+state.scrollWidth+'/'+state.width);
      pass++;
     }finally{await page.close()}
    }
   }finally{await browser.close()}
  }
  console.log('APPLE_SWIPE_TOTAL',pass);
 }catch(error){console.error('APPLE_SWIPE_FAILED',error.stack);process.exitCode=1}
 finally{server.close()}
})();