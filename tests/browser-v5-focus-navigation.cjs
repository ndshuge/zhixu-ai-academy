const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_CORE_PATH||'playwright-core');
const root=path.resolve(process.env.ZHIXU_PREVIEW_ROOT||'');
if(!process.env.ZHIXU_PREVIEW_ROOT)throw Error('ZHIXU_PREVIEW_ROOT required');
const mime={'.html':'text/html;charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{const u=new URL(req.url,'http://localhost'),file=path.resolve(root,'.'+decodeURIComponent(u.pathname)+(u.pathname.endsWith('/')?'index.html':''));
if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
fs.readFile(file,(e,b)=>e?res.writeHead(404).end(u.pathname):res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'}).end(b));});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));let passed=0;
try{for(const [engineName,engine] of [['edge',chromium],['webkit',webkit]].filter(([x])=>!process.env.ZHIXU_QA_ENGINE||process.env.ZHIXU_QA_ENGINE===x)){
const browser=engineName==='edge'?await engine.launch({channel:'msedge',headless:true}):await engine.launch({headless:true});
try{for(const width of [195,390,1440]){
const page=await browser.newPage({viewport:{width,height:844}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
const base='http://127.0.0.1:'+server.address().port+'/zhixu-ai-academy/apple-editions/ai-academy-v5/';
await page.goto(base+'#courses',{waitUntil:'domcontentloaded'});
await page.locator('#screen[data-page="today"]').waitFor({timeout:16000});
await page.waitForFunction(()=>location.hash==='#today',null,{timeout:9000});
assert.equal(await page.locator('button[data-route="courses"]').count(),0);
const buttons=await page.locator('#mobile-tabs button[data-route]').count();
assert.equal(buttons,4,'exactly four primary Dock tabs');
const start=page.locator('#screen [data-action=enter-evo]');
await start.click();
await page.locator('#screen[data-page="learn"] [data-action=exit-focus]').waitFor({timeout:10000});
assert.equal(await page.evaluate(()=>document.body.dataset.focus),'true');
assert.equal(await page.locator('#screen .experiment-tabs').count(),0,'experiment chooser is outside focus mode');
assert.equal(await page.evaluate(()=>window.ZHIXU_V4_DEBUG().lesson.experiment),'evo-pair');
assert.ok(await page.locator('#screen [data-action=exit-focus]').isVisible());
if(width<=700){
await page.waitForFunction(()=>parseFloat(getComputedStyle(document.querySelector('#mobile-tabs')).opacity)<.02,null,{timeout:3500});
const state=await page.evaluate(()=>{const dock=document.querySelector('#mobile-tabs');const css=getComputedStyle(dock);
return {inert:dock.inert,aria:dock.getAttribute('aria-hidden'),visibility:css.visibility,opacity:css.opacity,
 transform:new DOMMatrixReadOnly(css.transform).m42,underlay:getComputedStyle(document.querySelector('.zx-progressive-underlay')).display}});
assert.equal(state.inert,true);assert.equal(state.aria,'true');assert.ok(parseFloat(state.opacity)<.02,'Dock must be fully transparent after exit animation');
assert.ok(state.transform>=70,'Dock must slide downward outside viewport');
assert.equal(state.underlay,'none','no costly dock blur while studying');
}else{
assert.equal(await page.locator('.master-sidebar').isVisible(),false);
assert.equal(await page.locator('.outline-sidebar').isVisible(),false);
}
await page.locator('#screen [data-action=exit-focus]').click();
await page.locator('#screen[data-page=today]').waitFor({timeout:10000});
await page.waitForTimeout(420);
assert.equal(await page.evaluate(()=>document.body.dataset.focus),'false');
if(width<=700){
const back=await page.evaluate(()=>({nav:document.querySelector('#mobile-tabs').inert,hidden:getComputedStyle(document.querySelector('#mobile-tabs')).visibility,underlay:getComputedStyle(document.querySelector('.zx-progressive-underlay')).display}));
assert.equal(back.nav,false);assert.equal(back.hidden,'visible');assert.equal(back.underlay,'block','Dock blur restores after exit');
}
await page.locator('#screen [data-action=enter-logistic]').click();
await page.locator('#screen[data-page="learn"] [data-action=exit-focus]').waitFor({timeout:10000});
assert.equal(await page.evaluate(()=>window.ZHIXU_V4_DEBUG().lesson.experiment),'logistic','the third experiment is still reachable');
await page.locator('.toolbar-trailing button[data-route=settings]').click();
await page.locator('#screen[data-page=settings]').waitFor({timeout:10000});
assert.equal(await page.evaluate(()=>document.body.dataset.focus),'false');
await page.locator('.toolbar-trailing button[data-route=settings]').click();
await page.locator('#screen[data-page=learn]').waitFor({timeout:10000});
assert.equal(await page.evaluate(()=>document.body.dataset.focus),'true');
assert.deepEqual(errors,[]);
console.log('V5_FOCUS_OK',engineName,width,'four-tabs,legacy-hash,exit,logistic,settings');
passed++;
}finally{await page.close()}
} }finally{await browser.close()}
}console.log('V5_FOCUS_TOTAL',passed);
}catch(e){console.error('V5_FOCUS_FAILED',e.stack);process.exitCode=1}finally{server.close()}
})();