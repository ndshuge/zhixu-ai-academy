const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_CORE_PATH||'playwright-core');
const root=path.resolve(process.env.ZHIXU_PREVIEW_ROOT||'');
if(!process.env.ZHIXU_PREVIEW_ROOT)throw Error('ZHIXU_PREVIEW_ROOT required');
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://local');
 const source=path.resolve(root,'zhixu-ai-academy');
 const relative=u.pathname.replace(/^\/zhixu-ai-academy\//,'');
 const base=relative.startsWith('apple-editions/')?source:path.join(source,'docs');
 const file=path.resolve(base,decodeURIComponent(relative)+(u.pathname.endsWith('/')?'index.html':''));
 if(!file.startsWith(source+path.sep))return res.writeHead(403).end();
 fs.readFile(file,(err,bytes)=>err?res.writeHead(404).end(u.pathname):res.writeHead(200,{'content-type':{'.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.html':'text/html;charset=utf-8','.svg':'image/svg+xml','.json':'application/json'}[path.extname(file)]||'application/octet-stream'}).end(bytes));
});
async function inspect(browser,name,width){
 const page=await browser.newPage({viewport:{width,height:844},hasTouch:width<700});
 const errors=[],missing=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()===404)missing.push(r.url())});
 try{
  await page.goto('http://127.0.0.1:'+server.address().port+'/zhixu-ai-academy/apple-editions/ai-academy-v5/#today',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof window.ZHIXU_V4_NAVIGATE==='function');
  const routes=['today','learn','library','growth','settings'];
  for(const route of routes){
   await page.evaluate(r=>window.ZHIXU_V4_NAVIGATE(r),route);
   await page.locator('#screen[data-page="'+route+'"]').waitFor();
   const state=await page.evaluate(()=>{
    const root=document.getElementById('screen'),heading=root.querySelector('h1');
    const naked=[...root.querySelectorAll('button')].filter(b=>!b.disabled&&!b.dataset.action&&!b.dataset.route&&!b.dataset.experiment&&b.type!=='submit').map(b=>b.outerHTML.slice(0,130));
    const navNaked=[...document.querySelectorAll('#outline-content button')].filter(b=>!b.disabled&&!b.dataset.action&&!b.dataset.route).map(b=>b.outerHTML.slice(0,130));
    const horizontal=document.documentElement.scrollWidth-innerWidth;
    return {heading:heading?.textContent,focus:document.activeElement===root,horizontal,naked,navNaked};
   });
   assert.ok(state.heading,'route must have heading: '+route);
   if(route==='settings'){
    const headingWidth=await page.locator('#screen > .page-intro').evaluate(e=>e.getBoundingClientRect().width);
    assert.ok(headingWidth<=2,'duplicate visual settings title must be clipped, while heading remains available to readers');
   }
   assert.ok(state.horizontal<=1,route+' overflows by '+state.horizontal+'px at '+width);
   assert.deepEqual(state.naked,[],route+' exposes a dead button');
   assert.deepEqual(state.navNaked,[],route+' exposes a dead outline button');
   if(route!=='today')assert.ok(state.focus,'SPA should move reading focus on route: '+route);
   if(name==='edge'&&width===390&&['today','library','growth','settings'].includes(route)){
    const dir=path.resolve('evidence/browser');fs.mkdirSync(dir,{recursive:true});
    await page.waitForTimeout(470);
    await page.screenshot({path:path.join(dir,'vnext-route-'+route+'-390.png'),fullPage:true});
   }
  }
  assert.deepEqual(errors,[],name+' '+width+' has runtime errors');
  assert.deepEqual(missing,[],name+' '+width+' has missing assets');
  console.log('VNEXT_ROUTE_OK',name,width,routes.join(','),'no-overflow/dead-buttons/focus');
 }finally{await page.close();}
}
(async()=>{await new Promise(done=>server.listen(0,'127.0.0.1',done));let count=0;
 try{
  for(const [name,engine] of [['edge',chromium],['webkit',webkit]].filter(([n])=>!process.env.ZHIXU_QA_ENGINE||n===process.env.ZHIXU_QA_ENGINE)){
   const browser=name==='edge'?await engine.launch({channel:'msedge',headless:true}):await engine.launch({headless:true});
   try{for(const width of [320,390,768,1440]){await inspect(browser,name,width);count++;}}finally{await browser.close();}
  }
  console.log('VNEXT_ROUTE_TOTAL',count);
 }catch(error){console.error('VNEXT_ROUTE_FAIL',error.stack);process.exitCode=1}finally{server.close();}
})();
