const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright-core');
const source=path.resolve(process.env.ZHIXU_PREVIEW_ROOT||'');
if(!process.env.ZHIXU_PREVIEW_ROOT)throw Error('ZHIXU_PREVIEW_ROOT is required');
const mime={'.html':'text/html;charset=utf-8','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'};
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://localhost'),f=path.resolve(source,'.'+decodeURIComponent(u.pathname)+(u.pathname.endsWith('/')?'index.html':''));
 if(!f.startsWith(source+path.sep))return res.writeHead(403).end();
 fs.readFile(f,(err,b)=>err?res.writeHead(404).end(u.pathname):res.writeHead(200,{'content-type':mime[path.extname(f)]||'application/octet-stream'}).end(b));
});
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
async function run(engine,name,width){
 const browser=name==='edge'?await engine.launch({channel:'msedge',headless:true}):await engine.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width,height:844},hasTouch:width<701});
  const errs=[],missing=[];page.on('pageerror',e=>errs.push(e.message));page.on('response',r=>{if(r.status()===404)missing.push(r.url())});
  await page.goto('http://127.0.0.1:'+server.address().port+'/zhixu-ai-academy/apple-editions/ai-academy-v5/',{waitUntil:'domcontentloaded',timeout:16000});
  await page.waitForFunction(()=>window.ZHIXU_V4_DEBUG?.().ready,{timeout:18000});
  // Normal navigation creates a real old DOM layer while the new Settings page arrives.
  const first=await page.evaluate(()=>{
   const button=document.querySelector('.toolbar-trailing [data-route="settings"]');
   button.click();
   const ghost=document.querySelector('#screen .zx-nav-ghost');
   const row=document.querySelector('#screen .setting-row');
   return {route:document.querySelector('#screen')?.dataset.page,ghost:!!ghost,
    hidden:ghost?.getAttribute('aria-hidden'),inert:ghost?.inert,ids:ghost?.querySelectorAll('[id]').length||0,
    icon:row?getComputedStyle(row,'::before').content:null};
  });
  assert.equal(first.route,'settings');
  assert.equal(first.ghost,true,'previous page must be retained for the outgoing animation');
  assert.equal(first.hidden,'true');assert.equal(first.inert,true);assert.equal(first.ids,0,'ghost must not keep duplicate DOM IDs');
  assert.ok(first.icon&&first.icon!=='none','Settings has real grouped visual affordances');
  await page.waitForFunction(()=>!document.querySelector('#screen .zx-nav-ghost'),null,{timeout:1600});
  assert.equal(await page.locator('#screen[data-page=settings] .setting-group').count(),3);
  // Open BYOK without a key. It must never make an API call.
  await page.locator('#screen [data-action=open-ai-config]').click();
  await page.locator('.zx-api-shade.zx-surface-open').waitFor({timeout:8000});
  const closeStart=await page.evaluate(()=>{
   const el=document.querySelector('.zx-api-shade');
   el.querySelector('.zx-api-close').click();
   return {stillHere:el.isConnected,inert:el.inert,open:el.classList.contains('zx-surface-open')};
  });
  assert.equal(closeStart.stillHere,true,'closing UI must remain mounted for the exit transition');
  assert.equal(closeStart.inert,true);assert.equal(closeStart.open,false);
  await page.locator('.zx-api-shade').waitFor({state:'detached',timeout:1800});
  // Data deletion confirmation must use the same reversible sheet; cancel preserves records.
  await page.locator('#screen [data-action=clear-data]').click();
  await page.locator('#dialog-layer .zx-surface-open #cancel-confirm').waitFor({timeout:7000});
  const confirmClose=await page.evaluate(()=>{
   const sh=document.querySelector('#dialog-layer .zx-surface');sh.querySelector('#cancel-confirm').click();
   return {inert:sh.inert,present:sh.isConnected};
  });
  assert.deepEqual(confirmClose,{inert:true,present:true});
  await page.locator('#cancel-confirm').waitFor({state:'detached',timeout:1800});
  // Return Settings to its origin, verifying directional pop (no instant removal).
  const returnResult=await page.evaluate(()=>{
   document.querySelector('.toolbar-trailing [data-route=settings]').click();
   const ghost=document.querySelector('#screen .zx-nav-ghost');
   return {route:document.querySelector('#screen')?.dataset.page,ghost:!!ghost,old:ghost?.dataset.from};
  });
  assert.equal(returnResult.route,'today');assert.equal(returnResult.ghost,true);assert.equal(returnResult.old,'settings');
  await page.waitForFunction(()=>!document.querySelector('#screen .zx-nav-ghost'),null,{timeout:1600});
  // Doctor panel scales up while the underlying reading content recedes, both reversible.
  const opened=await page.evaluate(()=>{
   document.querySelector('#doctor-launch').click();
   return {expanded:document.querySelector('#doctor-launch').getAttribute('aria-expanded'),
    body:document.body.classList.contains('doctor-open'),panelHidden:document.querySelector('#doctor-panel').hidden};
  });
  assert.deepEqual(opened,{expanded:'true',body:true,panelHidden:false});
  await page.waitForTimeout(110);
  const midway=await page.evaluate(()=>{
   const panel=document.querySelector('#doctor-panel');
   return {panelTransform:getComputedStyle(panel).transform,scale:getComputedStyle(document.querySelector('#screen')).scale};
  });
  assert.notEqual(midway.panelTransform,'none','Doctor has an intermediate spatial transform');
  assert.notEqual(midway.scale,'1','background softly recedes as sheet arrives');
  await page.waitForTimeout(360);
  const shutting=await page.evaluate(()=>{
   document.querySelector('#doctor-close').click();
   const panel=document.querySelector('#doctor-panel');
   return {mounted:!panel.hidden,expanded:document.querySelector('#doctor-launch').getAttribute('aria-expanded')};
  });
  assert.equal(shutting.mounted,true,'Doctor should not vanish on close click');
  assert.equal(shutting.expanded,'false');
  await page.waitForFunction(()=>document.querySelector('#doctor-panel')?.hidden===true,null,{timeout:1800});
  const dir=path.resolve('evidence/browser');fs.mkdirSync(dir,{recursive:true});
  if(width===390){
   await page.evaluate(()=>document.querySelector('.toolbar-trailing [data-route=settings]').click());
   await page.waitForTimeout(490);
   await page.screenshot({path:path.join(dir,'v6-ref-settings-'+name+'.png'),fullPage:true});
   await page.evaluate(()=>document.querySelector('.toolbar-trailing [data-route=settings]').click());
   await page.waitForTimeout(490);
  }
  await page.emulateMedia({reducedMotion:'reduce'});
  const rm=await page.evaluate(()=>{
   document.querySelector('.toolbar-trailing [data-route=settings]').click();
   return {route:document.querySelector('#screen').dataset.page,ghost:!!document.querySelector('#screen .zx-nav-ghost')};
  });
  assert.equal(rm.route,'settings');assert.equal(rm.ghost,false,'reduced motion must disable double-layer exit');
  assert.deepEqual(errs,[]);assert.deepEqual(missing,[]);
  console.log('V6_SPATIAL_OK',name,width,'settings+BYOK+confirm+doctor+return+reduced');
  await page.close();
 }finally{await browser.close()}
}
(async()=>{await new Promise(done=>server.listen(0,'127.0.0.1',done));try{
 const opts=[['edge',chromium],['webkit',webkit]].filter(([n])=>!process.env.QA_ENGINE||n===process.env.QA_ENGINE);
 for(const [name,engine] of opts){for(const width of [390,1440].filter(w=>!process.env.QA_WIDTH||w===Number(process.env.QA_WIDTH)))await run(engine,name,width)}
}catch(e){console.error('V6_SPATIAL_FAIL',e.stack);process.exitCode=1}finally{server.close()}})();
