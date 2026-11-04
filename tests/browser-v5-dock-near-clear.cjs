const assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_CORE_PATH||'playwright-core');
const root=path.resolve(process.env.ZHIXU_PREVIEW_ROOT||'');
if(!process.env.ZHIXU_PREVIEW_ROOT)throw Error('ZHIXU_PREVIEW_ROOT required');
const mime={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.webp':'image/webp','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://localhost'),f=path.resolve(root,'.'+decodeURIComponent(u.pathname)+(u.pathname.endsWith('/')?'index.html':''));
 if(!f.startsWith(root+path.sep))return res.writeHead(403).end();
 fs.readFile(f,(err,data)=>err?res.writeHead(404).end():res.writeHead(200,{'content-type':mime[path.extname(f)]||'application/octet-stream'}).end(data));
});
(async()=>{await new Promise(ok=>server.listen(0,'127.0.0.1',ok));let count=0;
 try{
 for(const [name,engine] of [['edge',chromium],['webkit',webkit]].filter(([k])=>!process.env.ZHIXU_QA_ENGINE||process.env.ZHIXU_QA_ENGINE===k)){
  const browser=name==='edge'?await engine.launch({channel:'msedge',headless:true}):await engine.launch({headless:true});
  try{
   for(const [width,height] of [[320,700],[390,844],[430,932],[768,844]]){
    const page=await browser.newPage({viewport:{width,height}});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    try{
     await page.goto('http://127.0.0.1:'+server.address().port+'/zhixu-ai-academy/apple-editions/ai-academy-v5/#growth',{waitUntil:'domcontentloaded'});
     await page.locator('#screen[data-page="growth"] h1').waitFor({timeout:12000});
     const styles=await page.evaluate(()=>{
      const underlay=document.querySelector('.zx-progressive-underlay'),
            old=getComputedStyle(document.body,'::after'),
            dock=document.querySelector('#mobile-tabs'),
            layers=[...underlay.querySelectorAll('.zx-blur-layer')],scrim=underlay.querySelector('.zx-blur-scrim');
      return {height:underlay.getBoundingClientRect().height,top:underlay.getBoundingClientRect().top,dockTop:dock.getBoundingClientRect().top,
       display:getComputedStyle(underlay).display,oldDisplay:old.display,oldFilter:old.backdropFilter||old.webkitBackdropFilter,
       blur:layers.map(el=>getComputedStyle(el).backdropFilter||getComputedStyle(el).webkitBackdropFilter),
       mask:layers.map(el=>getComputedStyle(el).maskImage||getComputedStyle(el).webkitMaskImage),
       scrim:getComputedStyle(scrim).backgroundImage,docWidth:document.documentElement.scrollWidth,winWidth:innerWidth};
     });
     if(width<=700){
      assert.equal(styles.display,'block');
      assert.ok(styles.height>=114&&styles.height<=160,JSON.stringify(styles));
      assert.ok(styles.dockTop-styles.top>15&&styles.dockTop-styles.top<65,'strong blur should start close to dock; the preceding text remains clear');
      assert.deepEqual(styles.blur.map(x=>x.match(/blur\((\d+)px\)/)?.[1]),['2','6','12','20']);
      assert.match(styles.mask[0],/13%/);
      assert.match(styles.scrim,/rgba\(0, 0, 0, 0\) 35%/,'computed transparent stays transparent through the upper 35%');
      assert.equal(styles.oldDisplay,'none','no competing blur body pseudo-element');
     }else assert.equal(styles.display,'none','desktop should not render mobile underlay');
     assert.ok(styles.docWidth<=styles.winWidth+1,'no unintended horizontal overflow');
     assert.deepEqual(errors,[]);
     console.log('DOCK_NEAR_CLEAR_OK',name,width,'height='+styles.height.toFixed(1),'dockGap='+(styles.dockTop-styles.top).toFixed(1));
     count++;
    }finally{await page.close()}
   }
  }finally{await browser.close()}
 }
 console.log('DOCK_NEAR_CLEAR_TOTAL',count);
 }catch(err){console.error('DOCK_NEAR_CLEAR_FAIL',err.stack);process.exitCode=1}finally{server.close()}
})();