const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const assert=require('node:assert/strict');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_CORE_PATH||'playwright-core');
if(!process.env.ZHIXU_PREVIEW_ROOT)throw Error('ZHIXU_PREVIEW_ROOT is required');
const root=path.resolve(process.env.ZHIXU_PREVIEW_ROOT);
const mime={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.svg':'image/svg+xml','.json':'application/json'};
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://127.0.0.1');
 const dest=path.resolve(root,'.'+decodeURIComponent(url.pathname)+(url.pathname.endsWith('/')?'index.html':''));
 if(!dest.startsWith(root+path.sep))return res.writeHead(403).end();
 fs.readFile(dest,(err,bytes)=>err?res.writeHead(404).end(url.pathname):res.writeHead(200,{'content-type':mime[path.extname(dest)]||'application/octet-stream'}).end(bytes));
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let passed=0;
 try{
  for(const [engineName,engine] of [['edge',chromium],['webkit',webkit]]){
   const browser=engineName==='edge'?await engine.launch({channel:'msedge',headless:true}):await engine.launch({headless:true});
   try{
    for(const width of [390,1440]){
     const page=await browser.newPage({viewport:{width,height:844}});
     try{
      const errors=[],missing=[];
      page.on('pageerror',error=>errors.push(error.message));
      page.on('response',response=>{if(response.status()===404)missing.push(response.url())});
      await page.goto('http://127.0.0.1:'+server.address().port+'/zhixu-ai-academy/apple-editions/ai-academy-v5/#today',{waitUntil:'domcontentloaded'});
      await page.locator('#v5-r-control').waitFor();
      const labelBefore=await page.locator('#v5-preview-plot').getAttribute('aria-label');
      assert.match(labelBefore,/r=3\.90/);
      await page.locator('#v5-r-control').evaluate(input=>{input.value='3.72';input.dispatchEvent(new Event('input',{bubbles:true}))});
      const labelAfter=await page.locator('#v5-preview-plot').getAttribute('aria-label');
      assert.match(labelAfter,/r=3\.72/);
      assert.equal(await page.locator('#v5-r-value').textContent(),'3.72');
      assert.notEqual(labelAfter,labelBefore);
      assert.match(labelAfter,/0\.41200.*0\.41201/);
      assert.deepEqual(errors,[]);
      assert.deepEqual(missing,[]);
      passed++;
      console.log('LAB_DESCRIPTION_OK',engineName,width);
     }finally{await page.close()}
    }
   }finally{await browser.close()}
  }
  console.log('LAB_DESCRIPTION_TOTAL',passed+'/4');
 }catch(error){console.error('LAB_DESCRIPTION_FAILED',error.stack);process.exitCode=1}finally{server.close()}
})();
