const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_CORE_PATH||'playwright-core');
const root=path.resolve(process.env.ZHIXU_PREVIEW_ROOT||'');
if(!process.env.ZHIXU_PREVIEW_ROOT)throw Error('ZHIXU_PREVIEW_ROOT required');
const mime={'.html':'text/html;charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.mjs':'text/javascript','.webp':'image/webp'};
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://localhost'),dest=path.resolve(root,'.'+decodeURIComponent(u.pathname)+(u.pathname.endsWith('/')?'index.html':''));
 if(!dest.startsWith(root+path.sep))return res.writeHead(403).end();
 fs.readFile(dest,(error,data)=>error?res.writeHead(404).end(u.pathname):res.writeHead(200,{'content-type':mime[path.extname(dest)]||'application/octet-stream'}).end(data));
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let count=0;
 try{
 for(const [name,engine] of [['edge',chromium],['webkit',webkit]].filter(([k])=>!process.env.ZHIXU_QA_ENGINE||process.env.ZHIXU_QA_ENGINE===k)){
  const browser=name==='edge'?await engine.launch({channel:'msedge',headless:true}):await engine.launch({headless:true});
  try{
   for(const width of [390,1440]){
    const page=await browser.newPage({viewport:{width,height:844}});
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    try{
     await page.goto('http://127.0.0.1:'+server.address().port+'/zhixu-ai-academy/apple-editions/ai-academy-v5/#growth',{waitUntil:'domcontentloaded'});
     await page.locator('#screen[data-page="growth"] h1').waitFor({timeout:10000});
     await page.waitForFunction(()=>typeof window.ZHIXU_V4_DEBUG==='function',null,{timeout:8000});
     const gear=page.locator('.toolbar-trailing button[data-route="settings"]');
     await gear.click();await page.locator('#screen[data-page="settings"] h1').waitFor();
     assert.equal(await gear.getAttribute('aria-label'),'返回进度');
     const box=await gear.boundingBox();assert.ok(box&&box.width>=43);
     const x=box.x+box.width/2,y=box.y+box.height/2;
     await page.mouse.move(x,y);
     await page.mouse.down();
     assert.equal(await gear.getAttribute('data-pressing'),'true');
     await page.waitForTimeout(250);
     assert.equal(await gear.getAttribute('data-holding'),'true');
     const pressedScale=await gear.evaluate(el=>new DOMMatrixReadOnly(getComputedStyle(el).transform).a);
     assert.ok(pressedScale<1,'holding should depress button');
     await page.mouse.up();
     await page.locator('#screen[data-page="growth"] h1').waitFor();
     assert.equal(await gear.getAttribute('aria-label'),'设置');
     assert.equal(await gear.getAttribute('data-holding'),null);
     await page.waitForTimeout(260);
     const restedScale=await gear.evaluate(el=>new DOMMatrixReadOnly(getComputedStyle(el).transform).a);
     if(restedScale<=.97)await page.waitForFunction(()=>{const b=document.querySelector('.toolbar-trailing button[data-route="settings"]');return new DOMMatrixReadOnly(getComputedStyle(b).transform).a>.97},null,{timeout:1200});
     await gear.click();await page.locator('#screen[data-page="settings"] h1').waitFor();
     await gear.click();await page.locator('#screen[data-page="growth"] h1').waitFor();
     if(width===390){
      const layers=await page.evaluate(()=>{
       const dock=getComputedStyle(document.querySelector('.nav-optics'));
       const edge=document.querySelector('.zx-progressive-underlay');
       const layers=[...edge.querySelectorAll('.zx-blur-layer')];
       return {blur:layers.at(-1).style.backdropFilter||getComputedStyle(layers.at(-1)).backdropFilter,
        mask:getComputedStyle(layers.at(-1)).maskImage,opacity:getComputedStyle(edge).opacity,height:parseFloat(getComputedStyle(edge).height),
        dockBlur:dock.backdropFilter||dock.webkitBackdropFilter,hasRuntimeEdge:!!document.querySelector('script[src*="v5-scroll-edge.js"]')};
      });
      assert.ok(layers.blur.includes('blur(20px)'),layers.blur);
      assert.ok(layers.dockBlur==='none',layers.dockBlur);
      assert.match(layers.mask,/linear-gradient/);
      assert.equal(layers.opacity,'1');
      assert.ok(layers.height>=114&&layers.height<=160,'extended bottom shade must cover behind browser toolbar');
      assert.equal(layers.hasRuntimeEdge,false);
      await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));
      assert.equal(await page.evaluate(()=>getComputedStyle(document.querySelector('.zx-progressive-underlay')).opacity),'1');
     }
     assert.deepEqual(errors,[]);
     console.log('GESTURE_BLUR_OK',name,width,'pressedScale='+pressedScale.toFixed(3),'settled');
     count++;
    }finally{await page.close()}
   }
  }finally{await browser.close()}
 }
 console.log('GESTURE_BLUR_TOTAL',count);
 }catch(error){console.error('GESTURE_BLUR_FAIL',error.stack);process.exitCode=1}finally{server.close()}
})();