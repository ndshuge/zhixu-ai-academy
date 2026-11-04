/* Real Edge/WebKit mobile checks for interrupted content motion, edge drag,
   focus Dock exit transition and per-button spring feedback. */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright-core');
const root=path.resolve(process.env.ZHIXU_PREVIEW_ROOT||'');
if(!process.env.ZHIXU_PREVIEW_ROOT)throw Error('ZHIXU_PREVIEW_ROOT required');
const mime={'.html':'text/html;charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://localhost'),file=path.resolve(root,'.'+decodeURIComponent(u.pathname)+(u.pathname.endsWith('/')?'index.html':''));
 if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
 fs.readFile(file,(e,b)=>e?res.writeHead(404).end():res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'}).end(b));
});
const ptr=async(page,event,x,y,id=7)=>await page.dispatchEvent('#screen',event,{pointerType:'touch',pointerId:id,button:0,clientX:x,clientY:y,bubbles:true});
async function swipe(page,startX,finishX){
 await ptr(page,'pointerdown',startX,360);
 await ptr(page,'pointermove',(startX+finishX)/2,360);
 const moved=await page.locator('#screen').evaluate(e=>e.firstElementChild?.style.transform||'');
 await ptr(page,'pointerup',finishX,360);
 return moved;
}
async function run(browser,name){
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true}),page=await context.newPage();
 const errors=[],missing=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()===404)missing.push(r.url())});
 try{
  await page.goto('http://127.0.0.1:'+server.address().port+'/zhixu-ai-academy/apple-editions/ai-academy-v5/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.ZHIXU_V4_DEBUG?.().ready);
  const dock=()=>page.locator('#mobile-tabs').evaluate(el=>({opacity:Number(getComputedStyle(el).opacity),visibility:getComputedStyle(el).visibility,inert:el.inert}));
  assert.equal((await dock()).inert,false);
  await page.locator('#screen [data-action=enter-sensitivity]').first().click();
  await page.locator('#screen [data-core-phase=pretest]').waitFor({timeout:14000});
  const enterFrames=await page.evaluate(async()=>{const el=document.querySelector('#mobile-tabs'),frames=[];for(let i=0;i<9;i++){frames.push(Number(getComputedStyle(el).opacity));await new Promise(done=>setTimeout(done,25))}return frames});
  assert.ok(enterFrames.some(v=>v>0&&v<1),'entering study visibly eases Dock opacity instead of cutting immediately: '+JSON.stringify(enterFrames));
  await page.waitForFunction(()=>getComputedStyle(document.querySelector('#mobile-tabs')).visibility==='hidden',{timeout:1800});
  assert.deepEqual(await dock(),{opacity:0,visibility:'hidden',inert:true});
  await page.waitForFunction(()=>document.querySelector('.reading-column > .toolbar')?.getBoundingClientRect().height<=1,null,{timeout:1500});
  const toolbarHidden=await page.locator('.reading-column > .toolbar').evaluate(el=>({height:el.getBoundingClientRect().height,inert:el.inert,aria:el.getAttribute('aria-hidden')}));
  assert.equal(toolbarHidden.inert,true);assert.equal(toolbarHidden.aria,'true');assert.ok(toolbarHidden.height<=1);
  const press=page.locator('#screen form[data-core-form=pre] button[type=submit]');
  await page.locator('#screen form[data-core-form=pre] input[type=radio]').first().check();
  await press.dispatchEvent('pointerdown',{pointerType:'touch',pointerId:6,button:0,clientX:150,clientY:400,bubbles:true});
  const feedback=await press.getAttribute('data-zx-press');
  assert.equal(feedback,'down','core buttons receive the existing delegated press timeline');
  await press.dispatchEvent('pointerup',{pointerType:'touch',pointerId:6,button:0,clientX:150,clientY:400,bubbles:true});
  await page.locator('#screen [data-action=exit-focus]').click();
  await page.locator('#screen[data-page=today]').waitFor();
  const exitFrames=await page.evaluate(async()=>{const el=document.querySelector('#mobile-tabs'),frames=[];for(let i=0;i<9;i++){frames.push(Number(getComputedStyle(el).opacity));await new Promise(done=>setTimeout(done,25))}return frames});
  assert.ok(exitFrames.some(v=>v>0&&v<1),'exiting study smoothly restores the Dock: '+JSON.stringify(exitFrames));
  await page.waitForFunction(()=>getComputedStyle(document.querySelector('#mobile-tabs')).visibility==='visible',{timeout:1800});
  assert.equal((await dock()).inert,false);
  await page.waitForFunction(()=>document.querySelector('.reading-column > .toolbar')?.getBoundingClientRect().height>=55,null,{timeout:1500});
  assert.equal(await page.locator('.reading-column > .toolbar').evaluate(el=>el.inert),false);
  const moved=await swipe(page,374,224);
  assert.match(moved,/translate3d/,'edge gesture shows a live, finger-tracking content displacement');
  await page.waitForFunction(()=>document.querySelector('#screen')?.dataset.page==='learn',{timeout:14000});
  await page.waitForFunction(()=>document.querySelector('#screen [data-core-phase=pretest]')!==null);
  await page.waitForFunction(()=>getComputedStyle(document.querySelector('#mobile-tabs')).visibility==='hidden',{timeout:1800});
  await swipe(page,12,165);
  await page.waitForFunction(()=>document.querySelector('#screen')?.dataset.page==='today',{timeout:14000});
  // Vertical scrolling from the same left edge must not switch routes.
  await ptr(page,'pointerdown',12,220);
  await ptr(page,'pointermove',26,430);
  await ptr(page,'pointerup',26,570);
  assert.equal(await page.locator('#screen').getAttribute('data-page'),'today','vertical scroll preserves route');
  await page.emulateMedia({reducedMotion:'reduce'});
  await swipe(page,376,228);
  await page.waitForFunction(()=>document.querySelector('#screen')?.dataset.page==='learn',{timeout:14000});
  const activeAnimations=await page.locator('#screen').evaluate(e=>e.getAnimations().filter(a=>a.effect?.target===e).map(a=>({playState:a.playState,type:a.constructor.name,frames:a.effect?.getKeyframes?.()?.length,duration:a.effect?.getTiming?.().duration})));
  assert.equal(activeAnimations.filter(a=>a.type!=='CSSTransition'||a.duration>15).length,0,'reduced-motion skips substantive content motion; harmless sub-frame CSS transitions are allowed');
  assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
  console.log('V6_GESTURE_FOCUS_OK',name,'live-drag+spring-press+focus-dock+vertical-guard+reduced');
 }finally{await context.close();}
}
(async()=>{await new Promise(ok=>server.listen(0,'127.0.0.1',ok));try{
 for(const [name,engine] of [['edge',chromium],['webkit',webkit]].filter(([n])=>!process.env.QA_ENGINE||n===process.env.QA_ENGINE)){
  const browser=name==='edge'?await engine.launch({channel:'msedge',headless:true}):await engine.launch({headless:true});
  try{await run(browser,name)}finally{await browser.close()}
 }
}catch(e){console.error('V6_GESTURE_FOCUS_FAIL',e.stack);process.exitCode=1}finally{server.close()}})();
