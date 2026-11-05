const fs=require('fs'),path=require('path'),http=require('http'),assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright-core');
const root=path.resolve(process.env.ZHIXU_PREVIEW_ROOT);
const types={'.html':'text/html;charset=utf8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'};
const server=http.createServer((req,res)=>{const u=new URL(req.url,'http://local'),f=path.resolve(root,'.'+decodeURIComponent(u.pathname)+(u.pathname.endsWith('/')?'index.html':''));if(!f.startsWith(root+path.sep))return res.writeHead(403).end();fs.readFile(f,(e,b)=>e?res.writeHead(404).end(u.pathname):res.writeHead(200,{'content-type':types[path.extname(f)]||'application/octet-stream'}).end(b))});
async function check(browser,name,width){
 const context=await browser.newContext({viewport:{width,height:844},hasTouch:width<=700});
 const page=await context.newPage(),errors=[],missing=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()===404)missing.push(r.url())});
 const sleep=t=>page.waitForTimeout(t);
 const rect=()=>page.locator('.modal-shade.zx-surface .modal').evaluate(el=>({y:el.getBoundingClientRect().top,h:el.getBoundingClientRect().height,transform:getComputedStyle(el).transform}));
 try{
  const target=process.env.ZHIXU_PUBLIC_URL?(process.env.ZHIXU_PUBLIC_URL+'?v64='+Date.now()):('http://127.0.0.1:'+server.address().port+'/zhixu-ai-academy/apple-editions/ai-academy-v5/');
  await page.goto(target,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.ZHIXU_V4_DEBUG?.().ready,{timeout:22000});
  await page.evaluate(()=>window.ZHIXU_V4_NAVIGATE('settings'));
  await page.waitForFunction(()=>document.querySelector('#screen')?.dataset.page==='settings');
  await sleep(670);
  const colors=await page.evaluate(()=>({ground:getComputedStyle(document.querySelector('.reading-column')).backgroundColor,css:getComputedStyle(document.querySelector('#screen')).backgroundColor,root:getComputedStyle(document.documentElement).getPropertyValue('--ground').trim()}));
  // Ensure page surface and paired page planes do not flash white on grayscale app background.
  await page.evaluate(()=>window.ZHIXU_V4_NAVIGATE('today'));
  const colorPair=await page.evaluate(()=>{const a=document.querySelector('#screen>.zx-route-incoming');return a&&getComputedStyle(a).backgroundColor});
  assert.equal(colorPair,colors.root.startsWith('#')?'rgb(246, 246, 248)':colors.ground,'paired layer uses app ground');
  await sleep(560);
  await page.evaluate(()=>window.ZHIXU_V4_NAVIGATE('settings'));
  await sleep(570);
  const sw=page.locator('#screen [data-action=toggle-reduced]');
  assert.equal(await sw.count(),1);
  await sw.evaluate(el=>{el.dataset.instance='v64-original'});
  const getKnob=()=>sw.evaluate(el=>({value:el.getAttribute('aria-checked'),x:(new DOMMatrix(getComputedStyle(el,'::before').transform)).m41,inst:el.dataset.instance}));
  const first=await getKnob();await sw.click();await sleep(75);const during=await getKnob();await sleep(280);const after=await getKnob();
  assert.equal(during.inst,'v64-original');assert.equal(after.inst,'v64-original');
  assert.notEqual(after.value,first.value);
  const expected=after.value==='true'?19:0;
  assert.ok(Math.abs(after.x-expected)<1,'toggle target pos: '+JSON.stringify({first,during,after}));
  assert.ok(Math.abs(during.x-first.x)>0.1&&Math.abs(during.x-expected)>0.1,'knob should interpolate, not snap: '+JSON.stringify({first,during,after}));
  await sw.click();await sleep(390);
  const scale=page.locator('#screen [data-action=set-type-scale][data-scale="115"]');
  await scale.evaluate(el=>el.dataset.instance='v64-original-scale');
  await scale.click();
  assert.equal(await scale.getAttribute('data-instance'),'v64-original-scale');
  assert.equal(await scale.getAttribute('aria-pressed'),'true');
  await page.locator('#screen [data-action=set-type-scale][data-scale="100"]').click();
  // Open the real DeepSeek sheet but never submit a model request or paid call.
  await page.locator('#screen [data-action=open-ai-config]').click();
  await page.locator('#dialog-layer .zx-api-shade.zx-surface-open').waitFor({timeout:9000});
  const beginning=await rect();await sleep(130);const midd=await rect();await sleep(550);const end=await rect();
  assert.ok(beginning.y>midd.y&&midd.y>end.y-3,'BYOK must rise from bottom: '+JSON.stringify({beginning,midd,end}));
  await page.locator('.zx-api-close').click();
  await sleep(65);const exiting=await rect();
  assert.ok(exiting.y>end.y+.5,'BYOK exit must descend: '+JSON.stringify({end,exiting}));
  await sleep(600);assert.equal(await page.locator('.zx-api-shade').count(),0);
  await page.locator('#screen [data-action=open-ai-config]').click();await sleep(190);
  await page.locator('.zx-api-close').click();await sleep(80);
  await page.locator('#screen [data-action=open-ai-config]').click();await sleep(650);
  assert.equal(await page.locator('.zx-api-shade').count(),1,'reopen interrupt reuses same dialog');
  await page.locator('.zx-api-close').click();await sleep(620);
  assert.equal(await page.locator('.zx-api-shade').count(),0);
  await page.locator('#screen [data-action=clear-data]').click();
  await page.locator('#dialog-layer .modal-shade.zx-surface-open').waitFor({timeout:9000});
  const c1=await rect();await sleep(140);const c2=await rect();await sleep(440);
  assert.ok(c1.y>c2.y,'confirmation rises from below');
  await page.locator('#cancel-confirm').click();await sleep(630);
  assert.equal(await page.locator('#cancel-confirm').count(),0);
  assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
  console.log('V64_BROWSER_OK',name,width,JSON.stringify({knob:{first,during,after},sheet:{beginning,midd,end},no404:true,jsErrors:0}));
 }finally{await context.close()}
}
(async()=>{await new Promise(done=>server.listen(0,'127.0.0.1',done));try{for(const [name,engine] of [['edge',chromium],['webkit',webkit]].filter(([n])=>!process.env.QA_ENGINE||process.env.QA_ENGINE===n)){const browser=name==='edge'?await engine.launch({channel:'msedge',headless:true}):await engine.launch({headless:true});try{for(const w of [390,1440].filter(w=>!process.env.QA_WIDTH||Number(process.env.QA_WIDTH)===w))await check(browser,name,w)}finally{await browser.close()}}}catch(e){console.error('V64_BROWSER_FAIL',e.stack);process.exitCode=1}finally{server.close()}})();
