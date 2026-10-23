import {createRequire} from 'node:module';
import {createAcademyServer} from '../server.mjs';
import {ProviderRegistry} from '../model-provider.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';

const require=createRequire('E:/CHATGPT/projects/physics-frontier-lab/package.json');
const {chromium}=require('playwright');
const ROOT=process.cwd(),OUT=join(ROOT,'submission','g5-demo'),EVIDENCE=join(ROOT,'evidence','g5');
await Promise.all([mkdir(OUT,{recursive:true}),mkdir(EVIDENCE,{recursive:true})]);
const app=createAcademyServer({providerRegistry:new ProviderRegistry({env:{}})});
await new Promise(r=>app.listen(0,'127.0.0.1',r));
const base='http://127.0.0.1:'+app.address().port;
let browser,context,page,encoder,timer,activeCapture=Promise.resolve(),capturing=false,frames=0;
const steps=[],errors=[];
const movie=join(OUT,'AI学院-真实浏览器自动化演示-候选.mp4');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function banner(label,desc,ms=3200){
 await page.evaluate(({label,desc})=>{
  let bar=document.getElementById('g5-recording-caption');
  if(!bar){bar=document.createElement('div');bar.id='g5-recording-caption';document.body.append(bar)}
  Object.assign(bar.style,{position:'fixed',zIndex:'2147483646',bottom:'12px',left:'24px',right:'24px',padding:'12px 24px',border:'2px solid #9cd8ee',borderRadius:'12px',background:'rgba(6,22,44,.94)',color:'#fff',font:'bold 19px Microsoft YaHei, sans-serif',boxShadow:'0 4px 18px #0006',pointerEvents:'none'});
  bar.textContent=label+'｜'+desc+'｜自动化演示（非真人试测）';
 },{label,desc});
 steps.push({label,desc,at:new Date().toISOString()});await wait(ms);
}
try{
 browser=await chromium.launch({channel:'msedge',headless:true});
 context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1});
 page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));
 // Record actual isolated browser viewport frames, encoded only by system FFmpeg.
 // This avoids Playwright's missing private FFmpeg binary and never captures the Windows desktop.
 encoder=spawn('ffmpeg',['-y','-loglevel','error','-f','image2pipe','-framerate','5','-vcodec','mjpeg','-i','pipe:0','-an','-c:v','libx264','-preset','veryfast','-crf','25','-pix_fmt','yuv420p','-movflags','+faststart',movie],{stdio:['pipe','ignore','pipe']});
 let ffmpegError='';encoder.stderr.on('data',d=>ffmpegError+=d.toString().slice(0,3000));
 encoder.on('error',err=>errors.push('FFmpeg launch: '+err.message));
 const frame=()=>{if(capturing||!encoder||encoder.stdin.destroyed)return;capturing=true;activeCapture=page.screenshot({type:'jpeg',quality:76,animations:'disabled'}).then(bytes=>{encoder.stdin.write(bytes);frames++}).catch(()=>{}).finally(()=>{capturing=false});};
 timer=setInterval(frame,200);frame();
 await page.setContent('<html lang="zh"><meta charset="utf-8"><body style="margin:0;background:linear-gradient(120deg,#071c34,#155a79);display:grid;place-items:center;color:white;font-family:Microsoft YaHei"><div style="text-align:center"><div style="font-size:64px;font-weight:700">AI学院</div><div style="font-size:29px;margin:24px">预测 · 科学实验 · 证据 · 错因复习</div><div style="font-size:19px;margin:20px">西安交通大学 2026 T.A杯 · AI+高等教育</div><div style="font-size:17px;color:#f9cf8e">规则导师技术原型 / 无真实LLM / 无真人学习成效数据</div></div></body></html>');
 await wait(7000);
 await page.goto(base+'/',{waitUntil:'networkidle'});
 const status=await (await page.request.get(base+'/api/status')).json();
 assert.equal(status.mentorMode,'rules');
 assert.notEqual(status.realLLMPlanner,true);
 assert.equal(await page.locator('#pre-check-root input:checked').count(),0);
 await banner('1/6 先做概念前测','答题前不显示正确选项，原答留下证据',4800);
 await page.locator('#pre-check-root input[value="0"]').check();
 await page.locator('#pre-check-root button').click();
 await page.locator('#pre-check-root .feedback').waitFor({state:'visible'});
 assert.match(await page.locator('#pre-check-root .feedback').innerText(),/错题/);
 await banner('2/6 前测反馈','此处为软件脚本输入的测试答案，不是学生结果',4400);
 await page.locator('#prediction-input').fill('我预测轨道即使存在微小初值差，也会一直靠近。');
 await page.locator('#run').click();
 await page.locator('#results').waitFor({state:'visible',timeout:18000});
 await page.locator('.chart').first().click({position:{x:220,y:100}});
 assert.match(await page.locator('#point-selection').innerText(),/真实计算数据/);
 await banner('3/6 科学实验证据','真正运行固定PFL计算；可点击曲线原始数据',6200);
 await page.locator('#reflection').fill('初始差别的轨道出现分离，我想检验扰动大小是否影响时间。');
 await page.locator('#ask').click();
 await page.locator('#mentor-output').waitFor({state:'visible'});
 assert.match(await page.locator('#mentor-output').innerText(),/规则/);
 await banner('4/6 导师追问','采用规则教师，不冒充联网大模型',5200);
 await page.locator('#planning-goal').fill('把初值差异调大，检查达到分离阈值是否提前');
 await page.locator('#request-plan').click();
 await page.locator('#plan-preview').waitFor({state:'visible'});
 assert.equal(await page.locator('#approve-plan').isDisabled(),true);
 await banner('5/6 计划审批','必须另写新预测并批准后才运行对照',4800);
 await page.locator('#approval-prediction').fill('新预测：将扰动从10^-10调大为10^-7，分离发生得更早。');
 await page.locator('#approve-plan').click();
 await page.locator('#experiment-comparison').waitFor({state:'visible',timeout:18000});
 assert.match(await page.locator('#experiment-comparison').innerText(),/从 -10 改为 -7/);
 await banner('5/6 对照实验完成','修改一个变量，得到实际科学引擎计算',4800);
 await page.goto(base+'/learning',{waitUntil:'networkidle'});
 assert.equal((await page.locator('#stat-incorrect').innerText()).trim(),'1');
 assert.match(await page.locator('#mistake-list').innerText(),/我的原答案/);
 await banner('6/6 错因与个人证据','客观错题有原答案与评分依据',5200);
 await page.locator('#misconception-list button.danger').first().click();
 assert.match(await page.locator('#misconception-list').innerText(),/已否认/);
 await page.locator('#review-list button').filter({hasText:'用新变式检验'}).first().click();
 await page.locator('#review-workspace').waitFor({state:'visible'});
 assert.equal(await page.locator('#review-quiz input:checked').count(),0);
 await page.locator('#review-quiz input[value="1"]').check();
 await page.locator('#review-quiz button').click();
 await page.locator('#review-quiz .feedback').waitFor({state:'visible'});
 await banner('6/6 新变式与复习','一次答对仅表明当前复测正确，不能推断长期掌握',6400);
 await page.goto(base+'/study',{waitUntil:'networkidle'});
 assert.match(await page.locator('#study-records').innerText(),/尚无真实参与者/);
 await banner('研究结果：等待真人同意','目前真实样本为0；不报告提分和因果结论',6000);
 assert.deepEqual(errors,[]);
 await page.setContent('<html lang="zh"><meta charset="utf-8"><body style="margin:0;background:#071d35;display:grid;place-items:center;color:white;font-family:Microsoft YaHei"><div style="text-align:center;max-width:1080px"><h1 style="font-size:54px">AI学院 · 技术原型演示</h1><p style="font-size:29px">软件路径已实际跑通，真实教学效果仍待志愿者试测</p><p style="font-size:21px;color:#ffdb90">规则教师 ≠ 真实LLM；自动测试 ≠ 真人教育效果</p><p style="font-size:17px">录像为隔离浏览器的真实自动操作，不使用个人API。</p></div></body></html>');
 await wait(7000);
 clearInterval(timer);timer=null;
 await activeCapture;
 encoder.stdin.end();
 await new Promise((resolve,reject)=>{encoder.once('close',code=>code===0?resolve():reject(Error('FFmpeg exited '+code+', '+ffmpegError)));});
 await page.close();await context.close();
 await writeFile(join(EVIDENCE,'g5-journey.json'),JSON.stringify({status:'passed',kind:'AUTOMATED_PRODUCT_DEMO_NOT_HUMAN_STUDY',baseVersion:status.version,mentorMode:status.mentorMode,realLLMPlanner:status.realLLMPlanner??'not-exposed',steps,videoFrames:frames,assertions:['unselected pretest','actual wrong answer graded','PFL chart data selected','rule mentor labeled','approval gate','real engine comparison','traceable mistaken choice','user can reject misconception','novel review initially blank','zero human study record','zero page errors'],errors},null,2)+'\n');
 console.log('G5_REAL_BROWSER_DEMO_OK '+join(OUT,'AI学院-真实浏览器自动化演示-候选.mp4'));
}catch(e){console.error('G5_REAL_BROWSER_DEMO_FAIL',e.stack||e);process.exitCode=1}
finally{if(timer)clearInterval(timer);if(encoder&&!encoder.stdin.destroyed)encoder.stdin.end();if(context)await context.close().catch(()=>{});if(browser)await browser.close().catch(()=>{});await new Promise(r=>app.close(r))}
