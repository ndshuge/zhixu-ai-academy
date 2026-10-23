/**
 * REAL MODEL video capture, synthetic user only. Records the actual Edge page
 * doing pre-test -> PFL -> consented mentor -> consented A/B plan -> explicit
 * approval -> independent transfer. Never substitutes a prerecorded model reply.
 */
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {mkdir,writeFile,copyFile} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const require=createRequire('E:/CHATGPT/projects/physics-frontier-lab/package.json');
const {chromium}=require('playwright');
const dir=join(root,'evidence','rc3-20261012','g2-demo-20261014','live-ui');
await mkdir(dir,{recursive:true});
const origin='http://127.0.0.1:4396';
const steps=[], errors=[];
let browser,context,page,rawVideo=null,attemptedMentor=false,attemptedPlan=false;
const nap=ms=>new Promise(r=>setTimeout(r,ms));
async function shot(name,delay=550){
 await page.waitForTimeout(delay);
 await page.screenshot({path:join(dir,name),fullPage:false});
}
function mark(step,data={}){steps.push({step,time:new Date().toISOString(),...data});console.log('DEMO_STAGE',step,JSON.stringify(data))}
const readStatus=async()=>{
 const r=await fetch(origin+'/api/status',{signal:AbortSignal.timeout(6000)});
 if(!r.ok)throw Error('academy server unavailable');return r.json()
};
try{
 const before=await readStatus();
 assert.equal(before.providerSource,'isolated-Pi-RPC');
 assert.equal(before.mentorMode,'llm-configured');
 assert.equal(before.usage.today,0,'do not mix prior test calls with this capture');
 browser=await chromium.launch({channel:'msedge',headless:true,args:['--disable-infobars']});
 context=await browser.newContext({
  viewport:{width:1600,height:900},deviceScaleFactor:1,
  recordVideo:{dir,size:{width:1600,height:900}},colorScheme:'light'});
 page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));
 const timeStarted=Date.now();
 await page.goto(origin+'/',{waitUntil:'networkidle'});
 assert.match(await page.locator('#codingplan-demo-notice').innerText(),/真实 Coding Plan/);
 assert.equal(await page.locator('#shareApproved').isChecked(),false);
 assert.equal(await page.locator('#plan-model-consent').isChecked(),false);
 await shot('01-initial-blank.png',1200);
 mark('empty-state-no-consent');
 // The synthetic student deliberately chooses wrong pre-test options.
 await page.locator('#pre-check-root .check-form').first().waitFor();
 await page.locator('#pre-check-root .check-form').first().locator('input[value="0"]').check();
 await page.locator('#pre-check-root .check-form').first().locator('button').first().click();
 await page.locator('#pre-check-root .check-form').first().locator('.feedback').waitFor({state:'visible'});
 await page.locator('#pre-check-root .check-form').first().locator('.feedback button').click();
 await page.locator('#pre-check-root .check-form').nth(1).waitFor({state:'visible'});
 await page.locator('#pre-check-root .check-form').nth(1).locator('input[value="1"]').check();
 await page.locator('#pre-check-root .check-form').nth(1).locator('button').first().click();
 await page.locator('#pre-check-root .check-form').nth(1).locator('.feedback').waitFor({state:'visible'});
 await shot('02-synthetic-pretest-locked.png',900);
 mark('pretest-two-items-locked');
 await page.locator('#prediction-input').fill('我原本以为方程一样，两条曲线的结果永远相同；即使初始条件差得非常小也不会产生明显分离。');
 await shot('03-prediction-before-science.png',850);
 await page.locator('#run').click();
 await page.locator('#results').waitFor({state:'visible',timeout:15000});
 assert.match(await page.locator('#source-label').innerText(),/Physics Frontier Lab/);
 assert.match(await page.locator('#raw-output').textContent(),/43/);
 await page.locator('#results').scrollIntoViewIfNeeded();
 await shot('04-real-PFL-science.png',1750);
 mark('PFL-actual-observation',{thresholdStep:43});
 // First genuine external model call; consent is not preselected.
 await page.locator('#reflection').fill('我发现同一个公式在后期出现了两条不同的轨迹。我还不理解为什么它们可以分离，能结合真实数据来追问我吗？');
 await page.locator('#shareApproved').check();
 assert.equal(await page.locator('#shareApproved').isChecked(),true);
 await shot('05-consent-to-real-mentor.png',650);
 attemptedMentor=true;mark('real-mentor-request-start');
 await page.locator('#ask').click();
 await page.locator('#mentor-output').waitFor({state:'visible',timeout:160000});
 const mentorText=await page.locator('#mentor-output').innerText();
 await shot('06-real-mentor-answer.png',1300);
 if(!mentorText.includes('远程 AI 导师')||!mentorText.includes('AI引导')){
  mark('mentor-fallback-or-invalid',{excerpt:mentorText.slice(0,550)});
  throw Error('real mentor reply not shown; do not mislabel video');
 }
 const middle=await readStatus();
 assert.equal(middle.providerVerified,true);
 assert.equal(middle.usage.today,1);
 mark('real-mentor-returned',{provider:middle.provider,model:middle.model,modelCalls:middle.usage.today});
 // One separate explicit consent for constrained LLM choice.
 await page.locator('#planning-goal').fill('固定方程与其余参数，只减小初值扰动，检查出现分离的时间是否推迟。');
 assert.equal(await page.locator('#plan-model-consent').isChecked(),false);
 await page.locator('#plan-model-consent').check();
 await shot('07-independent-plan-consent.png',700);
 attemptedPlan=true;mark('real-constrained-plan-request-start');
 await page.locator('#request-plan').click();
 await page.locator('#plan-preview').waitFor({state:'visible',timeout:160000});
 const planMode=await page.locator('#explain-mode').getAttribute('data-mode');
 await shot('08-model-proposal-awaiting-approval.png',1650);
 if(planMode!=='llm'){
  mark('plan-fallback',{mode:planMode,details:(await page.locator('#plan-hint').innerText()).slice(0,450)});
  throw Error('constrained real LLM selection not shown; do not mislabel film');
 }
 const planText=await page.locator('#plan-change').innerText();
 assert.match(planText,/logDelta|log₁₀/);
 assert.equal(await page.locator('#approve-plan').isDisabled(),true);
 assert.match(await page.locator('#explain-approval').innerText(),/没有执行/);
 const afterPlanning=await readStatus();
 assert.equal(afterPlanning.usage.today,2);
 mark('real-model-safe-proposal',{mode:planMode,planText:planText.slice(0,120),modelCalls:afterPlanning.usage.today});
 await page.locator('#approval-prediction').fill('如果这次只减小初值扰动而其他参数都不变，我猜两条轨迹达到同样分离阈值可能需要更多迭代步数。');
 await shot('09-student-independent-new-prediction.png',650);
 await page.locator('#approve-plan').click();
 await page.locator('#experiment-comparison').waitFor({state:'visible',timeout:18000});
 const comparison=await page.locator('#experiment-comparison').innerText();
 assert.match(comparison,/已实际执行/);
 assert.match(await page.locator('#explain-approval').innerText(),/已明确批准/);
 await shot('10-authorized-PFL-next-run.png',1500);
 mark('human-approved-real-science-recomputed',{comparison:comparison.slice(0,280)});
 // No additional external request: use rule mentor to unlock independent transfer.
 assert.equal(await page.locator('#shareApproved').isChecked(),false);
 await page.locator('#reflection').fill('第二次实验保持方程与其他参数不变，只修改了初值扰动。我想用没有见过的新题检验自己的理解。');
 await page.locator('#ask').click();
 await page.locator('#post-check-root .check-form').first().waitFor({state:'visible',timeout:15000});
 await page.locator('#post-check-root .check-form').first().locator('input[value="2"]').check();
 await page.locator('#post-check-root .check-form').first().locator('button').first().click();
 await page.locator('#post-check-root .check-form').first().locator('.feedback').waitFor({state:'visible'});
 await page.locator('#post-check-root .check-form').first().locator('.feedback button').click();
 await page.locator('#post-check-root .check-form').nth(1).waitFor({state:'visible'});
 await page.locator('#post-check-root .check-form').nth(1).locator('input[value="0"]').check();
 await page.locator('#post-check-root .check-form').nth(1).locator('button').first().click();
 await page.locator('#arc-progress').waitFor({state:'visible'});
 assert.match(await page.locator('#arc-progress').innerText(),/4 \/ 4/);
 await shot('11-independent-transfer-closed-loop.png',2100);
 mark('full-synthetic-learning-chain-complete');
 const finalStatus=await readStatus();
 assert.equal(finalStatus.usage.today,2);
 assert.deepEqual(errors,[]);
 const report={status:'PASS',date:new Date().toISOString(),
  actor:'synthetic Playwright-operated student; no human participant',
  externalCalls:2,model:finalStatus.model,provider:finalStatus.provider,
  humanStudentParticipants:0,scienceEngine:'Physics Frontier Lab',
  evidenceStep43:43,studentPredictionBeforeEvidence:true,
  mentorRealModel:true,constrainedPlanRealModel:true,independentStudentConsent:true,
  secondScienceRunRequiresHumanApproval:true,
  transferTwoNovelQuestions:true,syntheticScenarioNotLearningOutcome:true,
  pageErrors:errors,elapsedSeconds:Number(((Date.now()-timeStarted)/1000).toFixed(1)),
  steps,recordingFormat:'actual Edge Playwright video; no prerecorded model frames; audio not supplied'};
 await writeFile(join(dir,'REAL_CODINGPLAN_BROWSER_VIDEO_ACCEPTANCE.json'),JSON.stringify(report,null,2)+'\n');
 console.log('REAL_CODINGPLAN_BROWSER_VIDEO_PASS',report.elapsedSeconds,'seconds', 'real_calls',report.externalCalls);
}catch(e){
 const reason=String(e.stack||e).slice(0,4000);
 console.error('REAL_CODINGPLAN_BROWSER_VIDEO_FAIL',reason);
 const status=await readStatus().catch(()=>null);
 await writeFile(join(dir,'REAL_CODINGPLAN_BROWSER_VIDEO_FAILURE.json'),JSON.stringify({
  date:new Date().toISOString(),reason,attemptedMentor,attemptedPlan,steps,
  callsReportedByApp:status?.usage?.today??null,
  lesson:'failure evidence, not a successful real AI demo',pageErrors:errors},null,2)+'\n');
 process.exitCode=1;
}finally{
 if(context){
  rawVideo=page?.video();
  await context.close().catch(()=>{});
  if(rawVideo){try{await copyFile(await rawVideo.path(),join(dir,'REAL_CODINGPLAN_EDGE_UNCUT.webm'));}catch(e){console.error('VIDEO_SAVE_FAILED',e.message)}}
 }
 await browser?.close().catch(()=>{});
}
