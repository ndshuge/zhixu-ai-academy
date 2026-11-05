const fs=require('fs'),path=require('path'),http=require('http'),assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright-core');
const root=path.resolve(process.env.ZHIXU_PREVIEW_ROOT);
const types={'.html':'text/html;charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.webp':'image/webp'};
const server=http.createServer((req,res)=>{const u=new URL(req.url,'http://local'),file=path.resolve(root,'.'+decodeURIComponent(u.pathname)+(u.pathname.endsWith('/')?'index.html':''));if(!file.startsWith(root+path.sep))return res.writeHead(403).end();fs.readFile(file,(err,buf)=>err?res.writeHead(404).end(u.pathname):res.writeHead(200,{'content-type':types[path.extname(file)]||'application/octet-stream'}).end(buf))});
async function run(engine,name,width){
 const browser=name==='edge'?await engine.launch({channel:'msedge',headless:true}):await engine.launch({headless:true});
 const context=await browser.newContext({viewport:{width,height:844},hasTouch:width<=700,isMobile:width<=700});
 const page=await context.newPage(),errors=[],missing=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()===404)missing.push(r.url())});
 try{
  const url=process.env.ZHIXU_PUBLIC_URL?(process.env.ZHIXU_PUBLIC_URL+'?v66_smoke='+Date.now()):'http://127.0.0.1:'+server.address().port+'/zhixu-ai-academy/apple-editions/ai-academy-v5/';
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.ZHIXU_V4_DEBUG?.().ready,{timeout:22000});
  const test=await page.evaluate(()=>{
   const dispatch=(type,extra={})=>{
    const e=new Event(type,{cancelable:true,bubbles:true});
    for(const [k,v] of Object.entries(extra))Object.defineProperty(e,k,{value:v});
    document.dispatchEvent(e);return e.defaultPrevented;
   };
   const guard={
    gestureStart:dispatch('gesturestart'),
    gestureChange:dispatch('gesturechange'),
    oneTouch:dispatch('touchmove',{touches:[{identifier:1}]}),
    twoTouches:dispatch('touchmove',{touches:[{identifier:1},{identifier:2}]}),
    regularWheel:dispatch('wheel',{ctrlKey:false}),
    zoomWheel:dispatch('wheel',{ctrlKey:true}),
   };
   const sizeBefore=visualViewport?.scale;
   const action=getComputedStyle(document.documentElement).touchAction;
   return {guard,action,sizeBefore};
  });
  assert.deepEqual(test.guard,{gestureStart:true,gestureChange:true,oneTouch:false,twoTouches:true,regularWheel:false,zoomWheel:true});
  if(width<=700) assert.match(test.action,/pan-x pan-y/);
  // Inputs may not induce Safari focus magnification: at least 16 CSS pixels.
  await page.evaluate(()=>window.ZHIXU_V4_NAVIGATE('settings'));
  await page.waitForFunction(()=>document.querySelector('#screen')?.dataset.page==='settings');
  await page.waitForTimeout(570);
  // Actually open the secure DeepSeek sheet and inspect real, focusable inputs.
  await page.locator('#screen [data-action=open-ai-config]').click();
  await page.locator('#dialog-layer .zx-api-panel').waitFor({timeout:10000});
  const text=await page.locator('#dialog-layer input').evaluateAll(els=>els.filter(el=>el.type!=='checkbox'&&el.type!=='radio').map(el=>({font:parseFloat(getComputedStyle(el).fontSize),type:el.type})));
  assert.ok(text.length>0,'expected real DeepSeek input fields');
  if(width<=700)assert.ok(text.every(t=>t.font>=16),'input should be >=16px: '+JSON.stringify(text));
  await page.locator('.zx-api-close').click();
  await page.waitForTimeout(540);
  await page.evaluate(()=>window.ZHIXU_V4_NAVIGATE('today'));
  await page.waitForTimeout(550);
  // Multi-touch during an edge drag must NOT trigger a route.
  if(width<=700){
   const events=await page.evaluate(()=>{
    const stage=document.querySelector('#screen'),ptr=(type,id,x,y,primary=true)=>{
     stage.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,pointerId:id,pointerType:'touch',button:0,clientX:x,clientY:y,isPrimary:primary}));
    };
    ptr('pointerdown',19,12,310,true);
    ptr('pointermove',19,65,313,true);
    ptr('pointerdown',20,19,315,false);
    ptr('pointerup',19,153,314,true);
    ptr('pointerup',20,19,315,false);
    return {route:stage.dataset.page,transform:stage.firstElementChild?.style.transform};
   });
   assert.equal(events.route,'today','multitouch should cancel edge route');
   assert.ok(!events.transform||events.transform==='none','finger release clears visual drag');
  }
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  assert.ok(overflow<=2,'horizontal page overflow '+overflow);
  assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
  console.log('V66_GESTURE_OK',name,width,JSON.stringify({guard:test.guard,action:test.action,viewportScale:test.sizeBefore,inputs:text.length,overflow,errors:errors.length}));
 }finally{await context.close();await browser.close()}
}
(async()=>{await new Promise(done=>server.listen(0,'127.0.0.1',done));try{
 for(const [n,e] of [['edge',chromium],['webkit',webkit]].filter(([n])=>!process.env.QA_ENGINE||process.env.QA_ENGINE===n))
 for(const w of [390,1440].filter(w=>!process.env.QA_WIDTH||Number(process.env.QA_WIDTH)===w))await run(e,n,w);
}catch(e){console.error('V66_GESTURE_FAIL',e.stack);process.exitCode=1}finally{server.closeAllConnections?.();server.close()}})();
