/* Browser contract: page height + first content position must not jump on cleanup;
   Settings owns glass lens; Doctor enters from top and reverses uninterrupted. */
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright-core');
const root=path.resolve(process.env.ZHIXU_PREVIEW_ROOT||'');
if(!root||!process.env.ZHIXU_PREVIEW_ROOT)throw Error('ZHIXU_PREVIEW_ROOT required');
const mime={'.html':'text/html;charset=utf8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png'};
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://localhost'),f=path.resolve(root,'.'+decodeURIComponent(u.pathname)+(u.pathname.endsWith('/')?'index.html':''));
 if(!f.startsWith(root+path.sep))return res.writeHead(403).end();
 fs.readFile(f,(e,b)=>e?res.writeHead(404).end(u.pathname):res.writeHead(200,{'content-type':mime[path.extname(f)]||'application/octet-stream'}).end(b));
});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function one(engine,name){
 const browser=name==='edge'?await engine.launch({channel:'msedge',headless:true}):await engine.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/zhixu-ai-academy/apple-editions/ai-academy-v5/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.ZHIXU_V4_DEBUG?.().ready,{timeout:20000});
  const sample=()=>page.evaluate(()=>{
   const s=document.querySelector('#screen'),pair=s.querySelector(':scope > .zx-route-incoming');
   const lens=document.querySelector('#mobile-tabs .tab-lens');
   const heading=s.querySelector(':scope > .page-intro,:scope > .zx-route-incoming > .page-intro');
   return {page:s.dataset.page,paired:!!pair,height:s.getBoundingClientRect().height,scrollHeight:document.documentElement.scrollHeight,
    lens:+getComputedStyle(lens).opacity,
    headingVisible:heading&&getComputedStyle(heading).display!=='none',
    headingY:heading&&heading.getBoundingClientRect().top,
    docTop:document.querySelector('#doctor-panel').getBoundingClientRect().top,
    docVisible:!document.querySelector('#doctor-panel').hidden,
    docOpen:document.querySelector('#doctor-launch').getAttribute('aria-expanded')};
  });
  for(const route of ['settings','today','growth','settings','today']){
   await page.evaluate(r=>window.ZHIXU_V4_NAVIGATE(r),route);
   await sleep(route==='learn'?380:310);
   const before=await sample();
   assert.equal(before.paired,true,'route must still be moving at 310ms');
   if(route==='settings'){
    assert.equal(before.lens,1,'settings must retain the glass Dock lens');
    assert.equal(before.headingVisible,false,'settings heading must remain hidden during push');
   }
   await sleep(460);
   const after=await sample();
   assert.equal(after.paired,false,'animation layer must eventually clean');
   const delta=Math.abs(before.height-after.height);
   assert.ok(delta<=2,'screen jumps '+delta.toFixed(2)+'px after '+route+': '+JSON.stringify({before,after}));
  }
  await page.locator('#doctor-launch').click();
  await sleep(30);
  let before=await sample();
  assert.equal(before.docVisible,true);
  assert.equal(before.docOpen,'true');
  assert.ok(before.docTop<0,'doctor sheet should originate above viewport: '+JSON.stringify(before));
  await sleep(580);
  let after=await sample();
  assert.ok(after.docTop>=40,'doctor should settle below toolbar: '+JSON.stringify(after));
  await page.locator('#doctor-close').click();
  await sleep(60);
  const retreat=await sample();
  assert.ok(retreat.docTop<after.docTop-20,'doctor sheet should travel back up before unmount: '+JSON.stringify({after,retreat}));
  await sleep(550);
  assert.equal((await sample()).docVisible,false);
  // Reopen while the prior exit is still interpolating: the same sheet must
  // reverse seamlessly and not mount a second panel or wipe chat state.
  await page.locator('#doctor-launch').click();await sleep(135);
  await page.locator('#doctor-close').click();await sleep(85);
  await page.locator('#doctor-launch').click();await sleep(590);
  const reopened=await sample();
  assert.equal(reopened.docOpen,'true');
  assert.equal(reopened.docVisible,true);
  assert.ok(reopened.docTop>=40,'interrupted doctor transition must settle normally');
  assert.equal(await page.locator('#doctor-panel').count(),1);
  await page.locator('#doctor-close').click();await sleep(550);
  assert.equal((await sample()).docVisible,false);
  assert.deepEqual(errors,[]);
  console.log('V63_MOTION_OK',name,JSON.stringify({routes:5,doctor:'top-reversible',errors:errors.length}));
 }finally{await browser.close()}
}
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));try{
 for(const [name,engine] of [['edge',chromium],['webkit',webkit]].filter(([n])=>!process.env.QA_ENGINE||process.env.QA_ENGINE===n))await one(engine,name);
}catch(e){console.error('V63_MOTION_FAIL',e.stack);process.exitCode=1}finally{server.close()}})();
