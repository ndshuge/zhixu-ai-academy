/* V5 system-appearance browser QA. Set PLAYWRIGHT_CORE_PATH + ZHIXU_PREVIEW_ROOT for isolated local build. */
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('node:assert/strict');
const pw=require(process.env.PLAYWRIGHT_CORE_PATH||'playwright-core');
const root=process.env.ZHIXU_PREVIEW_ROOT&&path.resolve(process.env.ZHIXU_PREVIEW_ROOT);
const mime={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.webp':'image/webp','.svg':'image/svg+xml'};
const server=root?http.createServer((req,res)=>{
 const u=new URL(req.url,'http://local'),p=path.resolve(root,'.'+decodeURIComponent(u.pathname)+(u.pathname.endsWith('/')?'index.html':''));
 if(!p.startsWith(root+path.sep))return res.writeHead(403).end();
 fs.readFile(p,(e,b)=>e?res.writeHead(404).end():res.writeHead(200,{'content-type':mime[path.extname(p)]||'application/octet-stream'}).end(b))
}):null;
const out=process.env.ZHIXU_QA_SHOTS;
const rgb=c=>(c.match(/\d+(?:\.\d+)?/g)||[]).slice(0,3).map(Number);
const lum=c=>{const v=rgb(c).map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4});return v.length===3?(v[0]*.2126+v[1]*.7152+v[2]*.0722):1};
const contrast=(a,b)=>{const A=lum(a),B=lum(b);return (Math.max(A,B)+.05)/(Math.min(A,B)+.05)};
(async()=>{if(server)await new Promise(ok=>server.listen(0,'127.0.0.1',ok));let total=0;
try{for(const [engineName,engine]of [['edge',pw.chromium],['webkit',pw.webkit]].filter(x=>!process.env.QA_ENGINE||x[0]===process.env.QA_ENGINE)){
 const browser=engineName==='edge'?await engine.launch({headless:true,channel:'msedge'}):await engine.launch({headless:true});
 try{for(const scheme of ['light','dark'].filter(x=>!process.env.QA_SCHEME||x===process.env.QA_SCHEME))for(const width of [390,1440].filter(x=>!process.env.QA_WIDTH||String(x)===process.env.QA_WIDTH)){
  const page=await browser.newPage({viewport:{width,height:844},colorScheme:scheme,hasTouch:width<700,reducedMotion:'reduce',contrast:process.env.QA_CONTRAST==='more'?'more':'no-preference'});
  const errors=[],miss=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()===404)miss.push(r.url())});
  const base=root?'http://127.0.0.1:'+server.address().port+'/zhixu-ai-academy/apple-editions/ai-academy-v5/':'https://ndshuge.github.io/zhixu-ai-academy/apple-editions/ai-academy-v5/';
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:18000});
  await page.waitForFunction(()=>document.querySelector('#screen')?.dataset.page==='today',null,{timeout:14000});
  for(const route of ['today','courses','learn','library','growth','settings']){
   await page.evaluate(route=>window.ZHIXU_V4_NAVIGATE?.(route),route);await page.waitForTimeout(65);
   const info=await page.evaluate(()=>{
    const bg=getComputedStyle(document.querySelector('.reading-column')).backgroundColor,htmlBg=getComputedStyle(document.documentElement).backgroundColor;
    const css=[...document.styleSheets].some(x=>x.href?.includes('v5-system-appearance.css'));
    const highContrast=matchMedia('(prefers-contrast: more)').matches;
    const testSel=(containerSel,textSel)=>{const a=document.querySelector(containerSel),b=document.querySelector(textSel);return a&&b?{bg:getComputedStyle(a).backgroundColor,fg:getComputedStyle(b).color}:null};
    let pair=null;switch(document.querySelector('#screen').dataset.page){
     case 'settings':pair=testSel('.setting-group','.setting-row strong');break;
     case 'courses':pair=testSel('.book-tile','.book-copy strong');break;
     case 'learn':pair=testSel('.learning-paper','.learning-paper h2');break;
     case 'growth':pair=testSel('.metrics','.metric strong');break;
    }
    const gear=document.querySelector('.toolbar button[data-route=settings]');const gearBg=gear?getComputedStyle(gear).backgroundColor:null;return{bg,htmlBg,css,pair,gearBg,highContrast,overflow:document.documentElement.scrollWidth>innerWidth,route:document.querySelector('#screen').dataset.page};
   });
   assert.ok(info.css,'appearance stylesheet missing');
   if(process.env.QA_CONTRAST==='more')assert.equal(info.highContrast,true,'system higher-contrast preference not honored');
   assert.equal(info.route,route,'wrong route');
   assert.equal(info.overflow,false,'horizontal overflow '+JSON.stringify({engineName,scheme,width,route}));
   if(scheme==='dark')assert.ok(lum(info.bg)<.05,'dark appearance still light '+JSON.stringify({engineName,width,route,info}));
   else assert.ok(lum(info.bg)>.7,'light appearance changed '+JSON.stringify({engineName,width,route,info}));
   if(scheme==='dark'&&route==='today'&&info.gearBg)assert.ok(lum(info.gearBg)<.14,'bright light-appearance settings button on dark toolbar '+info.gearBg);
   if(info.pair){
    const score=contrast(info.pair.fg,info.pair.bg);
    assert.ok(score>=4.5,'low surface/label contrast '+JSON.stringify({route,scheme,width,score,pair:info.pair}));
   }
   if(out&&width===390&&['settings','today','learn','courses'].includes(route)){
     fs.mkdirSync(out,{recursive:true});
     await page.screenshot({path:path.join(out,engineName+'-'+scheme+'-'+route+'.png')});
   }
   console.log('PASS',engineName,scheme,width,route,info.pair?contrast(info.pair.fg,info.pair.bg).toFixed(2):'n/a');
   total++;
  }
  assert.deepEqual(errors,[]);assert.deepEqual(miss,[]);
  await page.close();
 }}finally{await browser.close()}}
 console.log('APPEARANCE_QA_PASS '+total+'/48');
}catch(e){console.error('APPEARANCE_QA_FAIL '+e.stack);process.exitCode=1}finally{server?.close()}})();