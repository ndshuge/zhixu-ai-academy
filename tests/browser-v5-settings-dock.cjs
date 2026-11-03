const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_CORE_PATH||'playwright-core');
const root=path.resolve(process.env.ZHIXU_PREVIEW_ROOT||'');
if(!process.env.ZHIXU_PREVIEW_ROOT)throw Error('ZHIXU_PREVIEW_ROOT is required');
const mime={'.html':'text/html; charset=utf-8','.css':'text/css','.mjs':'text/javascript','.js':'text/javascript','.svg':'image/svg+xml','.json':'application/json'};
const server=http.createServer((req,res)=>{const u=new URL(req.url,'http://localhost'),dest=path.resolve(root,'.'+decodeURIComponent(u.pathname)+(u.pathname.endsWith('/')?'index.html':''));if(!dest.startsWith(root+path.sep))return res.writeHead(403).end();fs.readFile(dest,(e,b)=>e?res.writeHead(404).end(u.pathname):res.writeHead(200,{'content-type':mime[path.extname(dest)]||'application/octet-stream'}).end(b))});
(async()=>{await new Promise(ok=>server.listen(0,'127.0.0.1',ok));let passed=0;try{
for(const [name,engine]of [['edge',chromium],['webkit',webkit]]){
 const browser=name==='edge'?await engine.launch({channel:'msedge',headless:true}):await engine.launch({headless:true});
 try{for(const width of [195,390])for(const theme of ['light','dark']){
  const page=await browser.newPage({viewport:{width,height:844},colorScheme:theme,reducedMotion:'reduce'});
  const errors=[],missing=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()===404)missing.push(r.url())});
  await page.goto('http://127.0.0.1:'+server.address().port+'/zhixu-ai-academy/apple-editions/ai-academy-v5/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!window.ZHIXU_V4_NAVIGATE);
  const snapshot=()=>page.evaluate(()=>{
    const nav=document.getElementById('mobile-tabs'),lens=nav.querySelector('.tab-lens');
    return{page:document.querySelector('#screen').dataset.page,neutral:nav.classList.contains('has-no-tab'),
      current:[...nav.querySelectorAll('button[aria-current=page]')].filter(b=>getComputedStyle(b).display!=='none').map(b=>b.dataset.route||b.id),
      active:[...nav.querySelectorAll('button.is-active')].filter(b=>getComputedStyle(b).display!=='none').map(b=>b.dataset.route||b.id),
      navBackground:getComputedStyle(nav).backgroundColor,
      matchesNew:!!document.querySelector('html body #mobile-tabs.mobile-native-tabs.has-no-tab button.tab-item'),
      buttonDebug:[...nav.querySelectorAll('button.tab-item')].filter(b=>getComputedStyle(b).display!=='none').slice(0,2).map(b=>({style:b.getAttribute('style'),transition:getComputedStyle(b).transition,anim:b.getAnimations().map(a=>({state:a.playState,time:a.currentTime}))})),
      lens:getComputedStyle(lens).opacity,
      neutralColors:[...nav.querySelectorAll('button.tab-item')].filter(b=>getComputedStyle(b).display!=='none').map(b=>getComputedStyle(b).color),
      iconStrokes:[...nav.querySelectorAll('button.tab-item svg')].filter(svg=>getComputedStyle(svg.parentElement).display!=='none').map(svg=>getComputedStyle(svg).stroke),
      overflow:document.documentElement.scrollWidth>innerWidth};
  });
  await page.evaluate(()=>window.ZHIXU_V4_NAVIGATE('growth'));
  let growth=await snapshot();
  assert.equal(growth.page,'growth');assert.equal(growth.neutral,false);assert.equal(growth.current[0],width<=260?'zoom-more':'growth');
  await page.evaluate(()=>window.ZHIXU_V4_NAVIGATE('settings'));
  await page.waitForTimeout(260);
  let settings=await snapshot();
  assert.equal(settings.page,'settings');assert.equal(settings.neutral,true);
  assert.deepEqual(settings.current,[]);assert.deepEqual(settings.active,[]);
  assert.equal(settings.lens,'0','Dock lens must not falsely highlight another tab');
  assert.equal(new Set(settings.neutralColors).size,1,'all unselected navigation buttons must have the same muted color');
  if(new Set(settings.iconStrokes).size!==1)console.log('STROKE_DEBUG',name,width,theme,JSON.stringify(settings));
  assert.equal(new Set(settings.iconStrokes).size,1,'no navigation icon may retain a highlighted stroke on Settings');
if(theme==='dark'&&name==='edge'&&width===195){
    const matched=await page.evaluate(()=>{
      const el=document.querySelector('#mobile-tabs button.tab-item');
      const list=[];
      const scan=(rules,src)=>{for(const r of rules){
        if(r.cssRules){if(!r.conditionText||matchMedia(r.conditionText).matches)scan(r.cssRules,src);continue}
        if(!r.selectorText||!r.style?.getPropertyValue('color'))continue;
        try{if(el.matches(r.selectorText))list.push({src,selector:r.selectorText,color:r.style.getPropertyValue('color'),important:r.style.getPropertyPriority('color')})}catch{}
      }};
      for(const s of document.styleSheets){try{scan(s.cssRules,s.href?.split('/').pop())}catch{}}
      return list.slice(-25);
    });
    console.log('RULES_DEBUG',JSON.stringify(matched));
  }
  if(theme==='dark')console.log('DARK_DEBUG',name,width,JSON.stringify(settings));
  if(theme==='dark'){
    const luminance=value=>{
      const rgb=(value.match(/\d+/g)||[]).slice(0,3).map(Number).map(x=>{
        const v=x/255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;
      });return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;
    };
    const fg=luminance(settings.neutralColors[0]),bg=luminance(settings.navBackground);
    assert.ok((Math.max(fg,bg)+.05)/(Math.min(fg,bg)+.05)>=3,'dark Dock icons must meet 3:1 non-text contrast');
  }
  if(process.env.ZHIXU_QA_SHOTS&&name==='edge'&&width===390){
    fs.mkdirSync(process.env.ZHIXU_QA_SHOTS,{recursive:true});
    await page.screenshot({path:path.join(process.env.ZHIXU_QA_SHOTS,theme+'-settings-neutral-dock.png')});
  }
  await page.evaluate(()=>window.ZHIXU_V4_NAVIGATE('today'));
  let restored=await snapshot();
  assert.equal(restored.neutral,false);assert.equal(restored.current[0],'today');assert.notEqual(restored.lens,'0');
  assert.equal(settings.overflow,false);assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
  console.log('SETTINGS_DOCK_OK',name,width,theme,JSON.stringify({settings,restored}));
  passed++;await page.close();
 }}finally{await browser.close()}}
console.log('SETTINGS_DOCK_TOTAL',passed+'/8');
}catch(e){console.error('SETTINGS_DOCK_FAILED',e.stack);process.exitCode=1}finally{server.close()}})();
