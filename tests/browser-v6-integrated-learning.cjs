/* Verify genuinely integrated PFL + EvoWorld teaching flows against the static
   Original science iframe. Never uses a real API key or paid model. */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright-core');
const root=path.resolve(process.env.ZHIXU_PREVIEW_ROOT||'');
if(!process.env.ZHIXU_PREVIEW_ROOT)throw Error('Need ZHIXU_PREVIEW_ROOT');
const mime={'.html':'text/html;charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'};
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://localhost'),file=path.resolve(root,'.'+decodeURIComponent(u.pathname)+(u.pathname.endsWith('/')?'index.html':''));
 if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
 fs.readFile(file,(err,buf)=>err?res.writeHead(404).end(u.pathname):res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'}).end(buf));
});
const screenshot=async(page,label)=>{const dest=path.resolve('evidence/browser');fs.mkdirSync(dest,{recursive:true});await page.screenshot({path:path.join(dest,'v6-'+label+'.png'),fullPage:true})};
async function run(browser,name,experiment){
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true});
 const page=await context.newPage(),errors=[],miss=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()===404)miss.push(r.url())});
 try{
  await page.goto('http://127.0.0.1:'+server.address().port+'/zhixu-ai-academy/apple-editions/ai-academy-v5/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.ZHIXU_V4_DEBUG?.().ready,{timeout:17000});
  await page.locator('#screen [data-action='+(experiment==='evo-pair'?'enter-evo':'enter-sensitivity')+']').first().click();
  await page.locator('#screen .core-learning[data-core-phase=pretest]').waitFor({timeout:16000});
  assert.equal(await page.locator('form[data-core-form=pre] input:checked').count(),0,'start pretest unselected');
  await page.locator('form[data-core-form=pre] input[type=radio]').first().check();
  await page.locator('form[data-core-form=pre] button[type=submit]').click();
  await page.locator('#screen [data-core-phase=predict]').waitFor({timeout:13000});
  assert.ok(!(await page.locator('#screen').innerText()).includes('标准答案'));
  await page.locator('form[data-core-form=prediction] textarea[name=prediction]').fill('我预测独立实验会有变化，需要根据真实数据判断差异与模型限制。');
  await page.locator('form[data-core-form=prediction] button[type=submit]').click();
  await page.locator('#screen [data-core-phase=ready]').waitFor({timeout:13000});
  assert.equal(await page.locator('form[data-core-form=mentor]').count(),0);
  await page.locator('[data-core-action=run]').click();
  await page.locator('#screen [data-core-phase=evidence]').waitFor({timeout:35000});
  await page.locator('#screen .core-evidence').waitFor();
  assert.match(await page.locator('#screen .core-evidence').innerText(),/Run ID/);
  if(experiment==='sensitivity'){
   assert.ok(await page.locator('#screen svg.core-line').count()>0,'true PFL curve exists');
   await page.locator('[data-core-action=point]').first().click();
  }else{
   assert.ok(await page.locator('#screen [data-core-action=pair]').count()>0,'EvoWorld actual paired seed');
   await page.locator('[data-core-action=pair]').first().click();
  }
  await page.locator('#screen .core-selection').first().waitFor();
  if(name==='edge')await screenshot(page,name+'-'+experiment+'-evidence');
  // Asking for rules doesn't authorize a paid model; result must be labeled as rules.
  await page.locator('form[data-core-form=coach] textarea[name=question]').fill('我应该从这次真实数据中观察哪些差异？');
  assert.equal(await page.locator('form[data-core-form=coach] input[name=shareApproved]').isChecked(),false);
  await page.locator('form[data-core-form=coach] button[type=submit]').click();
  await page.locator('#screen .core-coaching').filter({hasText:'规则引导'}).first().waitFor({timeout:12000});
  await page.locator('form[data-core-form=mentor] textarea[name=note]').fill('这次实验结果中哪些是可直接观察到的？');
  await page.locator('form[data-core-form=mentor] button[type=submit]').click();
  await page.locator('#screen .core-coaching').filter({hasText:'原版规则导师'}).first().waitFor({timeout:14000});
  // The student explicitly proposes and approves one more authentic experiment.
  await page.locator('form[data-core-form=propose] input[name=goal]').fill('只调整一个实验条件，检查差异是否保持一致');
  await page.locator('form[data-core-form=propose] button[type=submit]').click();
  await page.locator('form[data-core-form=approve]').waitFor({timeout:14000});
  await page.locator('form[data-core-form=approve] textarea[name=prediction]').fill('我预测在新的单变量条件下，差异会有所变化，但还需要对比实际数值。');
  await page.locator('form[data-core-form=approve] button[type=submit]').click();
  await page.locator('#screen .core-selection').filter({hasText:'第二次真实实验已执行'}).waitFor({timeout:35000});
  assert.equal(await page.locator('form[data-core-form=approve]').count(),0,'cannot approve same plan twice');
  await page.locator('form[data-core-form=reflection] textarea[name=reflection]').fill('我观察到两组实际数值，不能把模拟结果直接推广为真实世界规律。');
  await page.locator('form[data-core-form=reflection] button[type=submit]').click();
  await page.locator('#screen [data-core-phase=reflected]').waitFor({timeout:14000});
  await page.locator('[data-core-action=transfer]').click();
  await page.locator('#screen [data-core-phase=transfer]').waitFor({timeout:12000});
  assert.equal(await page.locator('form[data-core-form=transfer] input:checked').count(),0);
  await page.locator('form[data-core-form=transfer] input[type=radio]').first().check();
  await page.locator('form[data-core-form=transfer] button[type=submit]').click();
  await page.locator('#screen [data-core-phase=complete]').waitFor({timeout:12000});
  const state=await page.evaluate(()=>{
   const data=JSON.parse(localStorage.getItem('ai-academy-learning-v02')||'{}');
   return {events:data.events||[],route:document.querySelector('#screen').dataset.page}
  });
  assert.equal(state.route,'learn');
  for(const type of ['hypothesis_test','question_attempt','learning_reflection'])assert.ok(state.events.some(e=>e.kind===type),'missing genuine '+type);
  await page.locator('#screen [data-action=exit-focus]').click();
  await page.locator('#screen[data-page=today] [data-action=resume-learning]').waitFor({timeout:13000});
  await page.locator('#screen [data-action=resume-learning]').click();
  await page.locator('#screen[data-page=learn] > .core-learning[data-core-phase=complete]').waitFor({timeout:13000});
  // A shared/deep-linked #learn URL must always open the current learning core,
  // not quietly return to the obsolete legacy controller after reload.
  await page.reload({waitUntil:'domcontentloaded'});
  try{await page.locator('#screen[data-page=learn] > .core-learning[data-core-phase=pretest]').waitFor({timeout:18000})}catch(error){const diag=await page.evaluate(()=>({hash:location.hash,debug:(()=>{const d=window.ZHIXU_V4_DEBUG?.();return {route:d?.route,ready:d?.ready,lesson:d?.lesson}})(),stored:JSON.parse(sessionStorage.getItem('zx-v4-lesson')||'null')?.experiment,toast:document.querySelector('#toast')?.textContent,screen:document.querySelector('#screen')?.textContent?.slice(0,320)}));console.error('RELOAD_DIAGNOSTIC',JSON.stringify(diag),'PAGEERRORS',JSON.stringify(errors));throw error}
  assert.deepEqual(errors,[],'browser errors');assert.deepEqual(miss,[],'missing assets');
  console.log('V6_LIVE_CORE_OK',JSON.stringify({engine:name,experiment,events:state.events.length,run:state.events.filter(e=>e.kind==='hypothesis_test').length,complete:true,errors:errors.length,missing:miss.length}));
 }finally{await context.close();}
}
(async()=>{await new Promise(done=>server.listen(0,'127.0.0.1',done));try{
 for(const [name,engine] of [['edge',chromium],['webkit',webkit]].filter(([n])=>!process.env.QA_ENGINE||process.env.QA_ENGINE===n)){
  const browser=name==='edge'?await engine.launch({headless:true,channel:'msedge'}):await engine.launch({headless:true});
  try{for(const exp of ['sensitivity','evo-pair'].filter(x=>!process.env.QA_EXPERIMENT||process.env.QA_EXPERIMENT===x))await run(browser,name,exp)}finally{await browser.close()}
 }
}catch(e){console.error('V6_LIVE_CORE_FAIL',e.stack);process.exitCode=1}finally{server.closeAllConnections?.();server.close()}})();
