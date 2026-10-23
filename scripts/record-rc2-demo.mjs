import {createRequire} from 'node:module';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {createAcademyServer} from '../server.mjs';
import {ProviderRegistry} from '../model-provider.mjs';
import assert from 'node:assert/strict';
const {chromium}=createRequire('E:/CHATGPT/projects/physics-frontier-lab/package.json')('playwright');
const out='submission/rc2-20261012',ev='evidence/rc2-20261012';await mkdir(out,{recursive:true});
const registry=new ProviderRegistry({env:{},fetchImpl:async()=>{await new Promise(r=>setTimeout(r,650));return {ok:true,json:async()=>({choices:[{message:{content:'本段是模拟模型的软件演示。请先核对实际初值与参数，再解释两组轨道差；Float32舍入是独立对照。一次只改变一个变量，写下新预测并由本人批准。'}}]})}}});
registry.configure({provider:'custom',displayName:'本机模拟供应方（非DeepSeek直播）',baseUrl:'https://example.edu/v1',model:'mock-teaching',apiKey:'ONLY-FAKE-VIDEO-KEY',dailyLimit:20});
const app=createAcademyServer({providerRegistry:registry});await new Promise(r=>app.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+app.address().port;
const browser=await chromium.launch({channel:'msedge',headless:true});const context=await browser.newContext({viewport:{width:1600,height:1000},deviceScaleFactor:1});const page=await context.newPage();
const errors=[],external=[],cues=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(base))external.push(r.url())});
const natural=JSON.parse(await readFile('submission/rc-20261012/natural-narration.json','utf8'));
let narrativeIndex=0,cdp,encoder=null,timer=null,started=0,captures=[],pending=[];
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function cue(title,text,seconds=16){
 const voiceIndex=narrativeIndex++,n=natural[voiceIndex];title=n.title;text=n.text;
 await page.evaluate(title=>{let bar=document.getElementById('rc-demo-caption');if(!bar){bar=document.createElement('aside');bar.id='rc-demo-caption';document.body.append(bar)}Object.assign(bar.style,{position:'fixed',zIndex:2147483647,left:'0',bottom:'0',right:'0',padding:'18px 38px',background:'#102d2bf5',color:'#fff',font:'25px Microsoft YaHei',lineHeight:'1.6',pointerEvents:'none'});bar.textContent=title;},title);
 const c={title,text,voiceIndex,start:(performance.now()-started)/1000,end:null};cues.push(c);console.log('RC2_SCENE',title);
 await pause(Math.max(seconds,16)*1000);c.end=(performance.now()-started)/1000;
}
async function snap(name,locator){if(locator)await locator.scrollIntoViewIfNeeded();await page.screenshot({path:ev+'/'+name+'.png'});}
try{
 await page.goto(base+'/',{waitUntil:'networkidle'});
 await mkdir(out+'/capture-frames',{recursive:true});started=performance.now();
 cdp=await context.newCDPSession(page);cdp.on('Page.screencastFrame',e=>{
  const index=captures.length,at=(performance.now()-started)/1000,filename='capture-frames/'+String(index).padStart(6,'0')+'.jpg';
  captures.push({filename,at});cdp.send('Page.screencastFrameAck',{sessionId:e.sessionId}).catch(()=>{});
  pending.push(writeFile(out+'/'+filename,Buffer.from(e.data,'base64')));
 });
 await cdp.send('Page.startScreencast',{format:'jpeg',quality:92,maxWidth:1600,maxHeight:1000,everyNthFrame:1});
 await cue('AI学院｜从猜想到可复核的学习证据','面向高校科学概念学习，连接前测、预测、实验、诊断和迁移复习。下面是产品真实自动操作，使用本机规则导师；讲解采用离线合成语音。',16);
 await page.locator('#pre-check').scrollIntoViewIfNeeded();assert.equal(await page.locator('#pre-check-root input:checked').count(),0);
 await cue('第一步｜独立概念前测','题目没有预选答案。这里主动提交一个测试错误，用于演示客观错题记录。科学猜想被推翻，与概念题答错是两类不同的证据。',14);
 await page.locator('#pre-check-root input[value="0"]').check();await page.locator('#pre-check-root button').click();await page.locator('#pre-check-root .feedback').waitFor();
 await page.locator('#prediction-input').fill('我预测微小初值差的两条轨道会一直保持相近，演化规则相同。');await page.locator('#run').click();await page.locator('#results').waitFor({state:'visible'});await page.locator('.chart').first().click({position:{x:220,y:100}});await snap('demo-pfl-evidence',page.locator('#results'));
 await cue('第二步｜固定科学内核真实计算','曲线由 Physics Frontier Lab 内核实际计算。点击曲线读取一个真实数据点，保存参数、预测和运行来源。轨道分离并不意味着两次实验使用不同方程。',17);
 await page.locator('#reflection').fill('我看见轨道分离，原预测未获支持。我想检查扰动大小怎样影响分离时间。');await page.locator('#shareApproved').check();await page.locator('#ask').click();await page.locator('#mentor-output').waitFor({state:'visible'});await page.locator('#mentor-output').scrollIntoViewIfNeeded();
 await cue('第三步｜引用证据的规则追问','导师依据本次真实计算及选中的数据追问。当前明确显示规则引导，没有接入真实大模型。模型建议不能自动修改参数，也不能代替科学数值验证。',16);
 await page.locator('#mentor-output').scrollIntoViewIfNeeded();const returnY=await page.evaluate(()=>scrollY);
 const imageData=(await readFile('evidence/rc2-20261012/inherited-deepseek-detail.png')).toString('base64');
 await page.setContent('<html lang="zh"><meta charset="utf-8"><body style="margin:0;background:#f7f9f8;font-family:Microsoft YaHei;padding:38px"><h1>既有真实 DeepSeek 教学证据</h1><p style="font-size:24px">2026-10-12 授权后的真实网页截图 · 不是实时生成录像</p><img src="data:image/png;base64,'+imageData+'" style="display:block;width:1150px;max-height:665px;object-fit:contain;margin:auto"><p style="font-size:23px;color:#78561d">审阅发现：43步指标属于Float64初值差。截图中的Float32归因未获科学支持；RC2已补检查与安全回退。</p></body></html>');
 const proof={title:'历史真实调用证据与科学复核',text:'既有授权截图，非连续生成录像；43步属于Float64初值扰动，历史模型Float32归因存在问题，已增加有界检查。',voiceIndex:null,start:(performance.now()-started)/1000};cues.push(proof);await pause(18000);proof.end=(performance.now()-started)/1000;
 // The original product page state remains in the same browser; restore its DOM via history navigation is avoided.
 await page.goto(base+'/');await page.locator('#prediction-input').fill('我预测轨道最终会分离，公式保持不变。');await page.locator('#run').click();await page.locator('#results').waitFor({state:'visible'});await page.locator('#shareApproved').check();await page.locator('#ask').click();await page.locator('#mentor-output').waitFor({state:'visible'});
 await page.locator('#request-plan').click();await page.locator('#plan-preview').waitFor({state:'visible'});assert.equal(await page.locator('#approve-plan').isDisabled(),true);await page.locator('#plan-preview').scrollIntoViewIfNeeded();
 await cue('第四步｜先预测，再审批单变量对照','方案只改变初值扰动，保持其它条件。执行按钮在新预测提交前不可用。学生检查变化、写下新判断，并明确批准后，才运行第二次实验。',16);
 await page.locator('#approval-prediction').fill('新预测：增大扰动以后，达到相同分离阈值会更早，但方程保持不变。');await page.locator('#approve-plan').click();await page.locator('#experiment-comparison').waitFor({state:'visible'});await snap('demo-comparison',page.locator('#experiment-comparison'));
 await cue('对照结果｜两次运行都有来源','已执行的变化与父实验记录相连。这是科学模型中的实验结果，不是真人教育效果，也不能证明所有现实系统都满足同一结论。',13);
 await page.locator('#shareApproved').check();await page.locator('#ask').click();await page.locator('#mentor-output').waitFor({state:'visible'});await page.locator('#post-check').waitFor({state:'visible'});assert.equal(await page.locator('#post-check-root input:checked').count(),0);await page.locator('#post-check').scrollIntoViewIfNeeded();
 await cue('第五步｜不同题干的独立迁移','迁移题与前测不同，仍然不预选、不提前揭示答案。提交后才返回确定性评分。新题表现与长期掌握分开记录。',14);
 await page.locator('#post-check-root input[value="2"]').check();await page.locator('#post-check-root button').click();await page.locator('#post-check-root .feedback').waitFor();
 await page.goto(base+'/learning',{waitUntil:'networkidle'});await page.locator('#mistake-list').scrollIntoViewIfNeeded();await snap('demo-learning',page.locator('#mistake-list'));
 await cue('第六步｜客观错题与可否认的误区','错题保存原答案、题号、评分依据和时间。误区只是规则提出的候选，学生可以否认。这个决定会新增记录，不会抹去原始证据。',16);
 await page.locator('#misconception-list button.danger').first().click();await page.locator('#review-list button').filter({hasText:'用新变式检验'}).first().click();await page.locator('#review-workspace').waitFor({state:'visible'});assert.equal(await page.locator('#review-quiz input:checked').count(),0);await page.locator('#review-quiz input[value="1"]').check();await page.locator('#review-quiz button').click();await page.locator('#review-quiz .feedback').waitFor();await snap('demo-review',page.locator('#review-workspace'));
 await cue('复习｜一次新题正确，仍待巩固','复习使用新变式，答对只记作一次复测正确，并安排延迟巩固。个人分析展示真实作答数量和依据，数据保存在本机，可主动导出或清除。',15);
 await page.goto(base+'/explore?lab=pfl',{waitUntil:'networkidle'});await page.locator('#explore-prediction').fill('我预测同一Logistic映射在不同参数下会出现不同有限时间轨道，需要控制条件。');await page.locator('#open-lab').click();let lab=page.frameLocator('#lab-frame');await lab.getByTestId('stage-canvas').waitFor();await page.locator('#lab-frame').scrollIntoViewIfNeeded();await lab.getByRole('button',{name:'重播计算点',exact:true}).click();
 await cue('V0.4 拓展｜真实物理主舞台','最新物理实验室随学院同源加载，不用再启动上游服务。离散点、蛛网和探针读取真实计算。这里是分层拓展探索，学院原有受控计算仍是教学主线。',17);
 await page.locator('#capture-observation').click();await page.locator('#observation-reflection').fill('实际重播读取有限样本。改变显示并不改变方程；应返回学院控制参数并验证。');await page.locator('#save-observation').click();assert.match(await page.locator('#explore-status').innerText(),/已保存/);
 await page.goto(base+'/explore?lab=evo',{waitUntil:'networkidle'});await page.locator('#explore-prediction').fill('我预测一只生命的能量和行动会随tick变化，但一次自由世界不证明合作优势。');await page.locator('#open-lab').click();lab=page.frameLocator('#lab-frame');await lab.locator('#world-loading').waitFor({state:'hidden'});await page.waitForFunction(()=>document.getElementById('lab-frame').contentWindow.evoEvidence.tick>10);await lab.locator('#agent-select').selectOption({index:1});await lab.locator('#focus-selected').click();await page.locator('#lab-frame').scrollIntoViewIfNeeded();await snap('demo-evo-world');
 await cue('V0.4 拓展｜追踪真实数字生命','生态箱中的资源、能量和生命事件来自实际模拟。选择一只生命并跟踪它。动画造型是显示装饰，局部历史叠加当前地表，不是完整世界录像。',18);
 await lab.locator('#play-pause').click();await page.waitForFunction(()=>document.getElementById('lab-frame').contentWindow.evoEvidence.running===false);await page.locator('#capture-observation').click();await page.locator('#observation-reflection').fill('记录真实tick、种群与生命能量。一个世界不能推广为普遍规律；需要独立种子对照。');await page.locator('#save-observation').click();assert.match(await page.locator('#explore-status').innerText(),/已保存/);await page.goto(base+'/learning');await page.locator('#timeline .lab-evidence summary').first().click();await page.locator('#timeline').scrollIntoViewIfNeeded();await snap('demo-exploration-evidence');
 await cue('探索承接｜保存预测、观测、反思和版本','自由探索记录带时间、版本、真实读数和事前预测事件引用，可展开核验。它不计入客观题成绩，也不把单次世界当配对实验。返回课程继续受控实验和迁移题。',16);
 await page.goto(base+'/study',{waitUntil:'networkidle'});assert.match(await page.locator('#study-records').innerText(),/尚无真实参与者/);await page.locator('#study-records').scrollIntoViewIfNeeded();
 await cue('成果与边界｜本机技术发布候选','科学与教学软件回归通过，真实学生样本仍为零，不能宣称提分。真实模型权限、实体手机验收、官方资格、本人签字和平台提交，仍需人类亲自办理。',18);
 await cdp.send('Page.stopScreencast');await Promise.all(pending);const duration=(performance.now()-started)/1000;
 let concat='ffconcat version 1.0\n';for(let i=0;i<captures.length;i++){concat+="file '"+captures[i].filename+"'\n";concat+='duration '+Math.max(.001,(captures[i+1]?.at??duration)-captures[i].at).toFixed(6)+'\n';}concat+="file '"+captures.at(-1).filename+"'\n";
 await writeFile(out+'/capture.ffconcat',concat);
 const enc=spawn('ffmpeg',['-y','-loglevel','error','-f','concat','-safe','0','-i',out+'/capture.ffconcat','-vf','fps=30','-t',String(duration),'-c:v','libx264','-preset','veryfast','-crf','19','-pix_fmt','yuv420p',out+'/rc2-screen.mp4'],{stdio:['ignore','ignore','pipe']});let encodeError='';enc.stderr.on('data',d=>encodeError+=d);await new Promise((r,j)=>enc.once('close',c=>c===0?r():j(Error(encodeError))));
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);await writeFile(out+'/demo-narration.json',JSON.stringify(cues,null,2));
 await writeFile(ev+'/demo-recording.json',JSON.stringify({kind:'AUTOMATED_PRODUCT_VIDEO_WITH_MOCK_MODEL_AND_LABELED_HISTORICAL_REAL_PROOF',version:'0.4.1-rc.2',duration,sourceFrames:captures.length,outputFPS:30,captureTiming:'real wall-time VFR captures resampled to 30fps, static frames held',cues,errors,external,extraRealCalls:0,humanParticipants:0},null,2));console.log('RC2_RECORD_OK',duration,captures.length);
}catch(e){console.error(e.stack);process.exitCode=1}
finally{if(timer)clearInterval(timer);encoder?.stdin.end();await context.close();await browser.close();await new Promise(r=>app.close(r))}
