/* Live DOM test for the requested static side-by-side page choreography.
   The incoming/outgoing planes must move together, and Dock stays visible
   even while learning. No real BYOK model calls. */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright-core');
const root=path.resolve(process.env.ZHIXU_PREVIEW_ROOT||'');
if(!process.env.ZHIXU_PREVIEW_ROOT)throw Error('ZHIXU_PREVIEW_ROOT required');
const type={'.html':'text/html;charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'};
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://localhost');
 const f=path.resolve(root,'.'+decodeURIComponent(u.pathname)+(u.pathname.endsWith('/')?'index.html':''));
 if(!f.startsWith(root+path.sep))return res.writeHead(403).end();
 fs.readFile(f,(e,b)=>e?res.writeHead(404).end(u.pathname):res.writeHead(200,{'content-type':type[path.extname(f)]||'application/octet-stream'}).end(b));
});
async function one(browser,name,width){
 const context=await browser.newContext({viewport:{width,height:844},hasTouch:width<701});
 const page=await context.newPage(),errors=[],missing=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400)missing.push(r.status()+' '+r.url())});
 const dock=()=>page.locator('#mobile-tabs').evaluate(el=>({visible:getComputedStyle(el).visibility,opacity:parseFloat(getComputedStyle(el).opacity),inert:el.inert,aria:el.getAttribute('aria-hidden'),size:el.getBoundingClientRect().width}));
 async function waitPage(route){await page.waitForFunction(r=>document.querySelector('#screen')?.dataset.page===r,route,{timeout:15000})}
 async function planes(){
  return page.evaluate(()=>{
   const stage=document.querySelector('#screen'),out=stage.querySelector(':scope > .zx-route-outgoing'),incoming=stage.querySelector(':scope > .zx-route-incoming');
   if(!out||!incoming)return null;
   const a=out.getBoundingClientRect(),b=incoming.getBoundingClientRect();
   return {leftOut:a.left,rightOut:a.right,leftIn:b.left,width:a.width,gap:b.left<a.left?a.left-b.right:b.left-a.right,same:Math.abs(a.width-b.width)<2,animations:stage.getAnimations().length};
  });
 }
 try{
  await page.goto('http://127.0.0.1:'+server.address().port+'/zhixu-ai-academy/apple-editions/ai-academy-v5/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.ZHIXU_V4_DEBUG?.().ready,{timeout:18000});
  assert.equal(await page.locator('.toolbar-trailing button[data-route=settings]').count(),0);
  assert.equal(await page.locator('#mobile-tabs button[data-route=settings]').count(),1);
  if(width<=700)await page.locator('#mobile-tabs button[data-route=learn]').click();
  else await page.locator('#screen [data-action=enter-sensitivity]').first().click();
  await waitPage('learn');
  await page.locator('#screen .core-learning').waitFor({timeout:18000});
  if(width<=700){
   const check=await dock();assert.equal(check.visible,'visible');assert.equal(check.inert,false);assert.equal(check.aria,null);assert.equal(check.opacity,1);
   const toolbar=await page.locator('.reading-column > .toolbar').evaluate(el=>({height:el.getBoundingClientRect().height,visible:getComputedStyle(el).visibility,inert:el.inert}));
   assert.ok(toolbar.height>=45,'learning toolbar must remain stable');assert.equal(toolbar.visible,'visible');assert.equal(toolbar.inert,false);
  }
  if(width<=700)await page.locator('#mobile-tabs button[data-route=library]').click();
  else await page.evaluate(()=>window.ZHIXU_V4_NAVIGATE('library'));
  await waitPage('library');
  let panel=await planes();
  assert.ok(panel,'two full-page planes present during navigation');
  assert.equal(panel.same,true,'width mismatch: '+JSON.stringify(panel));
  assert.ok(Math.abs(panel.gap)<4,'the two planes must touch with no overlap/gap: '+JSON.stringify(panel));
  await page.waitForTimeout(125);
  panel=await planes();
  assert.ok(panel&&Math.abs(panel.gap)<5,'the planes must keep same time/easing: '+JSON.stringify(panel));
  await page.waitForFunction(()=>!document.querySelector('#screen .zx-route-incoming'),null,{timeout:1200});
  assert.equal(await page.locator('#screen .zx-route-outgoing').count(),0);
  for(const route of ['growth','settings','today','settings','library']){
   if(width<=700)await page.locator('#mobile-tabs button[data-route='+route+']').click({force:true});
   else await page.evaluate(r=>window.ZHIXU_V4_NAVIGATE(r),route);
   await waitPage(route);
   await page.waitForTimeout(70);
  }
  await page.waitForTimeout(620);
  assert.equal(await page.locator('#screen .zx-route-outgoing').count(),0,'rapid routing cannot strand old pages');
  assert.equal(await page.locator('#screen .zx-route-incoming').count(),0);
  if(width<=700){
   assert.equal((await dock()).visible,'visible');
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
   assert.ok(overflow<=2,'horizontal overflow = '+overflow);
   // Verify a vertical movement from the edge does not switch pages.
   const ptr=async(kind,x,y,id=33)=>page.dispatchEvent('#screen',kind,{pointerId:id,pointerType:'touch',button:0,clientX:x,clientY:y,bubbles:true});
   await ptr('pointerdown',12,220);await ptr('pointermove',28,425);await ptr('pointerup',29,580);
   assert.equal(await page.locator('#screen').getAttribute('data-page'),'library','edge vertical scroll must not navigate');
   await ptr('pointerdown',12,300);await ptr('pointermove',90,303);await ptr('pointerup',156,305);
   await waitPage('learn');
   const pairedSwipe=await planes();
   assert.ok(pairedSwipe&&Math.abs(pairedSwipe.gap)<5,'swipe push/pop must remain synchronized: '+JSON.stringify(pairedSwipe));
   await page.waitForFunction(()=>!document.querySelector('#screen .zx-route-incoming'),null,{timeout:1200});
   await page.emulateMedia({reducedMotion:'reduce'});
   await page.locator('#mobile-tabs button[data-route=settings]').click();
   await waitPage('settings');
   assert.equal(await page.locator('#screen .zx-route-outgoing').count(),0);
  }
  assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
  console.log('V6_PAIRED_OK',name,width,JSON.stringify({dock:width<=700?await dock():null,errors:errors.length,missing:missing.length}));
 }finally{await context.close()}
}
(async()=>{await new Promise(done=>server.listen(0,'127.0.0.1',done));try{
 for(const [name,engine] of [['edge',chromium],['webkit',webkit]].filter(([n])=>!process.env.QA_ENGINE||process.env.QA_ENGINE===n)){
  const browser=name==='edge'?await engine.launch({channel:'msedge',headless:true}):await engine.launch({headless:true});
  try{for(const width of [390,1440].filter(w=>!process.env.QA_WIDTH||Number(process.env.QA_WIDTH)===w))await one(browser,name,width)}finally{await browser.close()}
 }
}catch(e){console.error('V6_PAIRED_FAIL',e.stack);process.exitCode=1}finally{server.close()}})();
