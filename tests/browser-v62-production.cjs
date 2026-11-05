const assert=require('node:assert/strict'),{chromium,webkit}=require('playwright-core');
const url='https://ndshuge.github.io/zhixu-ai-academy/';
async function run(name,width){
 const engine=name==='edge'?chromium:webkit;
 const browser=name==='edge'?await engine.launch({channel:'msedge',headless:true}):await engine.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width,height:844},hasTouch:width<=700});
  const errors=[],bad=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)bad.push(r.status()+' '+r.url())});
  await page.goto(url+'?release='+Date.now(),{waitUntil:'domcontentloaded',timeout:35000});
  await page.waitForURL(/ai-academy-v5\//,{timeout:22000});
  await page.waitForFunction(()=>window.ZHIXU_V4_DEBUG?.().ready,{timeout:23000});
  const installed=await page.evaluate(async()=>{
   const html=document.documentElement.outerHTML;
   const js=await (await fetch('./v4.js?v=verify_'+Date.now(),{cache:'no-store'})).text();
   return {html:html.includes('v6-paired-pages.css?v=20261105-paired-a'),
    js:js.includes('v6-paired-pages.js'),
    dock:!!document.querySelector('#mobile-tabs [data-route=settings]'),
    noToolbarSettings:!document.querySelector('.toolbar-trailing [data-route=settings]')};
  });
  assert.deepEqual(installed,{html:true,js:true,dock:true,noToolbarSettings:true},'production cache/asset mismatch');
  if(width<=700){
   await page.locator('#mobile-tabs button[data-route=learn]').click();
   await page.waitForFunction(()=>document.querySelector('#screen')?.dataset.page==='learn');
   await page.waitForFunction(()=>!!document.querySelector('#screen .core-learning'),null,{timeout:20000});
   const d=await page.locator('#mobile-tabs').evaluate(el=>({visibility:getComputedStyle(el).visibility,inert:el.inert,opacity:getComputedStyle(el).opacity}));
   assert.deepEqual(d,{visibility:'visible',inert:false,opacity:'1'});
   await page.locator('#mobile-tabs button[data-route=settings]').click();
  }else {
   await page.locator('.sidebar-bottom [data-route=settings]').click();
  }
  await page.waitForFunction(()=>document.querySelector('#screen')?.dataset.page==='settings');
  assert.ok((await page.locator('#screen').innerText()).includes('设置'));
  assert.deepEqual(errors,[]);assert.deepEqual(bad,[]);
  console.log('V62_PRODUCTION_OK',name,width,JSON.stringify({newAssets:installed,errors:errors.length,failedRequests:bad.length}));
  await page.close();
 }finally{await browser.close()}
}
(async()=>{try{for(const name of ['edge','webkit'].filter(n=>!process.env.QA_ENGINE||process.env.QA_ENGINE===n))for(const width of [390,1440].filter(n=>!process.env.QA_WIDTH||Number(process.env.QA_WIDTH)===n))await run(name,width)}catch(e){console.error('V62_PRODUCTION_FAIL',e.stack);process.exitCode=1}})();
