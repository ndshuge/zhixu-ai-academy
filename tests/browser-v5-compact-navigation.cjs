/* Verify accessible compact navigation at 200% zoom equivalent reflow.
   Requires PLAYWRIGHT_CORE_PATH and optionally ZHIXU_PREVIEW_ROOT. */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const pw=require(process.env.PLAYWRIGHT_CORE_PATH||'playwright-core');
const root=process.env.ZHIXU_PREVIEW_ROOT&&path.resolve(process.env.ZHIXU_PREVIEW_ROOT);
const mime={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.svg':'image/svg+xml','.webp':'image/webp','.json':'application/json'};
const server=root?http.createServer((req,res)=>{
 const u=new URL(req.url,'http://local'),p=path.resolve(root,'.'+decodeURIComponent(u.pathname)+(u.pathname.endsWith('/')?'index.html':''));
 if(!p.startsWith(root+path.sep))return res.writeHead(403).end();
 fs.readFile(p,(err,b)=>err?res.writeHead(404).end(u.pathname):res.writeHead(200,{'content-type':mime[path.extname(p)]||'application/octet-stream'}).end(b));
}):null;
const out=process.env.ZHIXU_QA_SHOTS;
(async()=>{
 if(server)await new Promise(done=>server.listen(0,'127.0.0.1',done));
 const base=root?'http://127.0.0.1:'+server.address().port+'/zhixu-ai-academy/apple-editions/ai-academy-v5/':'https://ndshuge.github.io/zhixu-ai-academy/apple-editions/ai-academy-v5/';
 let count=0;try{
 for(const [name,engine] of [['edge',pw.chromium],['webkit',pw.webkit]].filter(x=>!process.env.QA_ENGINE||x[0]===process.env.QA_ENGINE)){
  const browser=name==='edge'?await engine.launch({headless:true,channel:'msedge'}):await engine.launch({headless:true});
  try{
   for(const width of [195,320,390]){
    const p=await browser.newPage({viewport:{width,height:844},hasTouch:true,reducedMotion:'reduce'});
    const errors=[],missing=[];p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()===404)missing.push(r.url())});
    await p.goto(base,{waitUntil:'domcontentloaded',timeout:18000});
    await p.waitForFunction(()=>document.querySelector('#screen')?.dataset.page==='today',null,{timeout:14000});
    await p.waitForTimeout(250);
    const initial=await p.evaluate(()=>{
     const buttons=[...document.querySelectorAll('#mobile-tabs button')].filter(x=>getComputedStyle(x).display!=='none'&&x.getBoundingClientRect().width>0);
     return{buttons:buttons.map(x=>({id:x.dataset.route||x.id,w:Math.round(x.getBoundingClientRect().width),h:Math.round(x.getBoundingClientRect().height)})),overflow:document.documentElement.scrollWidth>innerWidth,zoomCSS:[...document.styleSheets].some(x=>x.href?.includes('v5-zoom-navigation.css'))};
    });
    assert.ok(initial.zoomCSS,'zoom CSS missing');
    assert.equal(initial.overflow,false,'horizontal overflow at '+width);
    if(width===195){
     assert.deepEqual(initial.buttons.map(x=>x.id),['today','learn','zoom-more']);
     for(const button of initial.buttons)assert.ok(button.w>=44&&button.h>=44,'small target '+JSON.stringify(button));
     if(out){fs.mkdirSync(out,{recursive:true});await p.screenshot({path:path.join(out,name+'-195-before.png')});}
     await p.locator('#zoom-more').click();
     assert.equal(await p.locator('#zoom-more').getAttribute('aria-expanded'),'true');
     assert.equal(await p.locator('#zoom-more-menu').evaluate(e=>e.hidden),false);
     assert.equal(await p.locator('#zoom-more-menu [role=menuitem]').count(),3);
     if(out)await p.screenshot({path:path.join(out,name+'-195-more.png')});
     await p.keyboard.press('ArrowDown');
     await p.keyboard.press('Escape');
     assert.equal(await p.locator('#zoom-more-menu').evaluate(e=>e.hidden),true);
     assert.ok(await p.locator('#zoom-more').evaluate(e=>document.activeElement===e),'Escape must restore More focus');
     await p.locator('#zoom-more').click();
     await p.locator('#zoom-more-menu [data-route=library]').click();
     await p.waitForTimeout(120);
     assert.equal(await p.locator('#screen').getAttribute('data-page'),'library');
     assert.equal(await p.locator('#zoom-more').getAttribute('aria-current'),'page');
     assert.equal(await p.locator('#zoom-more-menu').evaluate(e=>e.hidden),true);
     await p.locator('#zoom-more').click();
     assert.equal(await p.locator('#zoom-more-menu [data-route=library]').getAttribute('aria-current'),'page');
     await p.keyboard.press('Escape');
     await p.goBack({waitUntil:'domcontentloaded'}).catch(()=>null);
    }else{
     assert.equal(initial.buttons.filter(x=>x.id==='zoom-more').length,0,'More should not appear at '+width);
     assert.equal(initial.buttons.filter(x=>x.id!=='zoom-more').length,5,'five tabs expected at '+width);
     for(const button of initial.buttons)assert.ok(button.w>=44&&button.h>=44,'small regular nav target '+JSON.stringify(button));
    }
    assert.deepEqual(errors,[],'page errors');assert.deepEqual(missing,[],'404 resources');
    console.log('COMPACT_NAV_PASS',name,width,JSON.stringify(initial.buttons));count++;await p.close();
   }
  }finally{await browser.close()}
 }
 console.log('COMPACT_NAV_TOTAL '+count+'/6');
 }catch(e){console.error('COMPACT_NAV_FAIL',e.stack);process.exitCode=1}finally{server?.close()}
})();