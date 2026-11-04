/* Real-science V5 browser QA; no fake scores, no API keys.
 * Optional external dependencies: PLAYWRIGHT_CORE_PATH and ZHIXU_PREVIEW_ROOT.
 * Examples:
 *   PLAYWRIGHT_CORE_PATH=/path/to/node_modules/playwright-core ZHIXU_PREVIEW_ROOT=/tmp/zhixu-site node tests/browser-v5-full-journey.cjs
 *   QA_ENGINE=webkit QA_EXPERIMENT=evo-pair node tests/browser-v5-full-journey.cjs
 */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const assert=require('node:assert/strict');
let engines;
try{engines=require(process.env.PLAYWRIGHT_CORE_PATH||'playwright-core')}
catch(error){console.error('Install Playwright or set PLAYWRIGHT_CORE_PATH to a trusted playwright-core module.');process.exit(2)}
const engineName=process.env.QA_ENGINE||'edge';
const experiment=process.env.QA_EXPERIMENT||'sensitivity';
assert.ok(['edge','webkit'].includes(engineName));
assert.ok(['sensitivity','evo-pair'].includes(experiment));
const siteRoot=process.env.ZHIXU_PREVIEW_ROOT?path.resolve(process.env.ZHIXU_PREVIEW_ROOT):null;
const mime={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'};
const server=siteRoot?http.createServer((req,res)=>{
 const url=new URL(req.url,'http://local'),dest=path.resolve(siteRoot,'.'+decodeURIComponent(url.pathname)+(url.pathname.endsWith('/')?'index.html':''));
 if(!dest.startsWith(siteRoot+path.sep))return res.writeHead(403).end();
 fs.readFile(dest,(err,bytes)=>err?res.writeHead(404).end():res.writeHead(200,{'content-type':mime[path.extname(dest)]||'application/octet-stream'}).end(bytes));
}):null;
async function run(){
 if(server)await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 const url=siteRoot?'http://127.0.0.1:'+server.address().port+'/zhixu-ai-academy/apple-editions/ai-academy-v5/':'https://ndshuge.github.io/zhixu-ai-academy/apple-editions/ai-academy-v5/';
 const browser=engineName==='webkit'?await engines.webkit.launch({headless:true}):await engines.chromium.launch({headless:true,channel:'msedge'});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,acceptDownloads:true});
  const page=await context.newPage(),errors=[],notFound=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()===404)notFound.push(r.url())});
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:20000});
  await page.waitForFunction(()=>document.querySelector('#screen')?.dataset.page==='today',null,{timeout:15000});
  await page.locator('#mobile-tabs [data-route=learn]').click();
  if(experiment==='evo-pair')await page.locator('#screen [data-experiment=evo-pair]').click();
  const action=async a=>{await page.locator('#screen [data-action="'+a+'"]').first().click({timeout:9000});await page.waitForTimeout(260)};
  const grade=async()=>{
   const inputs=page.locator('#quiz-form input[name=answer]');
   await inputs.first().waitFor({state:'visible',timeout:14000});
   assert.equal(await page.locator('#quiz-form input[name=answer]:checked').count(),0,'quiz must start unselected');
   await inputs.first().check();
   await page.locator('#quiz-form button[type=submit]').click();
   await page.waitForFunction(()=>!!document.querySelector('#screen [data-action=next-pre],#screen [data-action=next-prediction],#screen [data-action=next-transfer-question],#screen [data-action=nav-growth]'),null,{timeout:12000});
  };
  await action('load-question');await grade();
  if(await page.locator('#screen [data-action=next-pre]').count()){await action('next-pre');await grade()}
  await action('next-prediction');
  await page.locator('#prediction').fill('我预测两次独立实验结果会有差异，但需要保持其他条件一致');
  await page.locator('#prediction-form button[type=submit]').click();
  await page.waitForFunction(()=>!!document.querySelector('#screen [data-action=mentor]')&&!document.querySelector('#screen [data-action=mentor]').disabled,null,{timeout:35000});
  assert.match(await page.locator('#screen').innerText(),/实际|观察|实验/);
  await action('mentor');
  assert.match(await page.locator('#screen').innerText(),/规则导师/,'BYOK must stay optional');
  await action('next-transfer');await action('load-transfer');await grade();
  if(await page.locator('#screen [data-action=next-transfer-question]').count()){await action('next-transfer-question');await grade()}
  await action('nav-growth');
  const state=await page.evaluate(()=>{
   const store=JSON.parse(localStorage.getItem('ai-academy-learning-v02')||'{}');
   return{events:store.events||[],size:localStorage.getItem('ai-academy-learning-v02')?.length||0,route:document.querySelector('#screen')?.dataset.page};
  });
  assert.ok(state.events.some(x=>x.kind==='hypothesis_test'),'must contain real run evidence');
  assert.ok(state.events.filter(x=>x.kind==='question_attempt').length>=(experiment==='evo-pair'?2:4));
  assert.equal(state.route,'growth');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('#screen')?.dataset.page==='growth',null,{timeout:15000});
  assert.equal(await page.evaluate(()=>localStorage.getItem('ai-academy-learning-v02')?.length||0),state.size,'refresh must retain evidence');
  await page.evaluate(()=>[...document.querySelectorAll('[data-route=settings]')].find(x=>x.getClientRects().length)?.click());
  const promise=page.waitForEvent('download',{timeout:8000});
  await page.locator('#screen [data-action=export-data]').click();
  const download=await promise;assert.match(download.suggestedFilename(),/^zhixu-learning-v2-\d{4}-\d{2}-\d{2}\.json$/);
  await page.locator('#screen [data-action=clear-data]').click();
  await page.locator('#cancel-confirm').click();
  assert.equal(await page.evaluate(()=>localStorage.getItem('ai-academy-learning-v02')?.length||0),state.size,'canceling clear must preserve evidence');
  assert.deepEqual(errors,[],'browser script errors');
  assert.deepEqual(notFound,[],'404 resources');
  console.log('V5_STUDENT_JOURNEY_OK',JSON.stringify({engine:engineName,experiment,events:state.events.length,answers:state.events.filter(x=>x.kind==='question_attempt').length,runs:state.events.filter(x=>x.kind==='hypothesis_test').length,export:download.suggestedFilename(),persisted:true,errors:0,resourcesMissing:0}));
  await context.close();
 }finally{await browser.close()}
}
run().catch(e=>{console.error('V5_STUDENT_JOURNEY_FAIL',e.stack);process.exitCode=1}).finally(()=>server?.close());