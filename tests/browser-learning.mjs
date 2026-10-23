import {createRequire} from 'node:module';
import {createAcademyServer} from '../server.mjs';
import {ProviderRegistry} from '../model-provider.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import assert from 'node:assert/strict';

const require=createRequire('E:/CHATGPT/projects/physics-frontier-lab/package.json');
const {chromium}=require('playwright');
const dir=join(process.cwd(),'evidence','browser');await mkdir(dir,{recursive:true});
const server=createAcademyServer({providerRegistry:new ProviderRegistry({env:{}})});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base='http://127.0.0.1:'+server.address().port;
let browser;
try{
 browser=await chromium.launch({channel:'msedge',headless:true});
 const context=await browser.newContext({viewport:{width:1380,height:900}});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/',{waitUntil:'networkidle'});
 await page.locator('#pre-check-root .check-question').waitFor({timeout:10000});
 assert.equal(await page.locator('#pre-check-root input[type=radio]:checked').count(),0);
 assert.equal(await page.locator('#pre-check-root button').isDisabled(),true);
 const publicRequest=await page.request.get(base+'/api/learning/questions');
 assert.ok(!JSON.stringify(await publicRequest.json()).includes('correctAnswer'));
 await page.screenshot({path:join(dir,'13-learning-pretest-unanswered.png'),fullPage:true});
 await page.locator('#pre-check-root input[value="0"]').check();
 await page.locator('#pre-check-root button').click();
 await page.locator('#pre-check-root .feedback').waitFor({state:'visible'});
 assert.match(await page.locator('#pre-check-root .feedback').innerText(),/已锁定/);
 assert.doesNotMatch(await page.locator('#pre-check-root .feedback').innerText(),/演化规则和 r 均未变化/);
 assert.equal(await page.locator('#pre-check-root .check-form').first().locator('button').first().isDisabled(),true);
 await page.locator('#pre-check-root .feedback button').click();
 await page.locator('#pre-check-root .check-form').nth(1).waitFor({state:'visible'});
 await page.locator('#pre-check-root .check-form').nth(1).locator('input[value="0"]').check();
 await page.locator('#pre-check-root .check-form').nth(1).locator('button').first().click();
 await page.locator('#pre-check-root .check-form').nth(1).locator('.feedback').waitFor({state:'visible'});
 assert.match(await page.locator('#pre-check-root .check-form').nth(1).locator('.feedback').innerText(),/已锁定/);
 await page.screenshot({path:join(dir,'14-learning-scored-mistake.png'),fullPage:true});
 // A second tab must not show the blinded pre-test explanation before an independent transfer attempt.
 const earlyDashboard=await context.newPage();
 await earlyDashboard.goto(base+'/learning',{waitUntil:'networkidle'});
 assert.match(await earlyDashboard.locator('#mistake-list').innerText(),/前测原答已锁定/);
 assert.doesNotMatch(await earlyDashboard.locator('#mistake-list').innerText(),/演化规则和 r 均未变化/);
 await earlyDashboard.close();
 // A hypothesis that proves wrong is not automatically an objective wrong-answer.
 await page.locator('#prediction-input').fill('我预测两条轨道会一直靠近，即使初始差异存在，也不会分开。');
 await page.locator('#run').click();
 await page.locator('#results').waitFor({state:'visible',timeout:12000});
 assert.match(await page.locator('#source-label').innerText(),/Physics Frontier Lab/);
 await page.locator('#reflection').fill('我观察到长期偏离，说明刚才的科学猜想不成立。');
 await page.locator('#ask').click();
 await page.locator('#post-check').waitFor({state:'visible',timeout:10000});
 await page.locator('#post-check-root .check-question').waitFor();
 assert.equal(await page.locator('#post-check-root input:checked').count(),0);
 assert.equal(await page.locator('#post-check-root button').isDisabled(),true);
 assert.notEqual(await page.locator('#pre-check-root .check-question').first().innerText(),
   await page.locator('#post-check-root .check-question').first().innerText());
 await page.locator('#post-check-root input[value="2"]').check();
 await page.locator('#post-check-root button').click();
 await page.locator('#post-check-root .feedback').waitFor({state:'visible'});
 assert.match(await page.locator('#post-check-root .feedback').innerText(),/正确/);
 await page.locator('#post-check-root .feedback button').click();
 await page.locator('#post-check-root .check-form').nth(1).waitFor({state:'visible'});
 await page.locator('#post-check-root .check-form').nth(1).locator('input[value="0"]').check();
 await page.locator('#post-check-root .check-form').nth(1).locator('button').first().click();
 await page.locator('#post-check-root .check-form').nth(1).locator('.feedback').waitFor({state:'visible'});
 assert.match(await page.locator('#post-check-root .check-form').nth(1).locator('.feedback').innerText(),/正确/);
 await page.screenshot({path:join(dir,'15-learning-transfer-evidence.png'),fullPage:true});
 // Another page reuses the same user-owned, event-based evidence.
 await page.goto(base+'/learning',{waitUntil:'networkidle'});
 assert.equal((await page.locator('#stat-experiments').innerText()).trim(),'1');
 assert.equal((await page.locator('#stat-answered').innerText()).trim(),'4');
 assert.equal((await page.locator('#stat-incorrect').innerText()).trim(),'1');
 assert.equal((await page.locator('#stat-pending').innerText()).trim(),'1');
 assert.match(await page.locator('#mistake-list').innerText(),/我的原答案/);
 assert.match(await page.locator('#mistake-list').innerText(),/评分依据/);
 assert.match(await page.locator('#misconception-list').innerText(),/待学生核验/);
 await page.screenshot({path:join(dir,'16-personal-evidence-dashboard.png'),fullPage:true});
 await page.locator('#misconception-list button.danger').first().click();
 assert.match(await page.locator('#misconception-list').innerText(),/已否认/);
 await page.reload({waitUntil:'networkidle'});
 assert.match(await page.locator('#misconception-list').innerText(),/已否认/);
 assert.equal((await page.locator('#stat-incorrect').innerText()).trim(),'1');
 // Student may review early; question is genuinely a new variant.
 await page.locator('#review-list button').filter({hasText:'用新变式检验'}).first().click();
 await page.locator('#review-workspace').waitFor({state:'visible'});
 assert.equal(await page.locator('#review-quiz input:checked').count(),0);
 assert.equal(await page.locator('#review-quiz button').isDisabled(),true);
 await page.locator('#review-quiz input[value="1"]').check();
 await page.locator('#review-quiz button').click();
 await page.locator('#review-quiz .feedback').waitFor({state:'visible'});
 assert.match(await page.locator('#review-quiz .feedback').innerText(),/答对/);
 assert.match(await page.locator('#review-list').innerText(),/三天后/);
 assert.equal((await page.locator('#stat-answered').innerText()).trim(),'5');
 await page.screenshot({path:join(dir,'17-review-and-progress.png'),fullPage:true});
 // G4 never claims gains without human volunteers and explicit consent.
 await page.goto(base+'/study',{waitUntil:'networkidle'});
 assert.match(await page.locator('#study-empty-status').innerText(),/暂无经核验/);
 assert.match(await page.locator('#study-records').innerText(),/尚无真实参与者/);
 await page.locator('#study-condition').selectOption('academy');
 await page.locator('#study-link-evidence').click();
 assert.match(await page.locator('#study-link-status').innerText(),/已根据同一会话/);
 assert.equal(await page.locator('#study-pre-total').inputValue(),'2');
 assert.equal(await page.locator('#study-transfer-total').inputValue(),'2');
 assert.equal(await page.locator('#study-pre-correct').inputValue(),'1');
 assert.equal(await page.locator('#study-transfer-correct').inputValue(),'2');
 assert.equal(await page.locator('#study-pre-correct').getAttribute('readonly'),'');
 assert.match(await page.locator('#study-records').innerText(),/尚无真实参与者/);
 const storedBefore=await page.evaluate(()=>localStorage.getItem('ai-academy-learning-v02'));
 assert.ok(!JSON.parse(storedBefore).events.some(x=>x.kind==='study_record'));
 await page.locator('#study-save').click();
 assert.match(await page.locator('#study-records').innerText(),/尚无真实参与者/);
 await page.screenshot({path:join(dir,'18-g4-real-study-consent-and-empty.png'),fullPage:true});
 // Verify a truly wrong transfer answer produces a choice-specific next action on both screens.
 const coachingContext=await browser.newContext({viewport:{width:1280,height:860}});
 const coachingPage=await coachingContext.newPage();
 await coachingPage.goto(base+'/',{waitUntil:'networkidle'});
 await coachingPage.locator('#prediction-input').fill('微小初值差异可能导致两条曲线后期分离。');
 await coachingPage.locator('#run').click();
 await coachingPage.locator('#results').waitFor({state:'visible',timeout:12000});
 await coachingPage.locator('#reflection').fill('根据真实曲线，我要核对公式与初值差异。');
 await coachingPage.locator('#ask').click();
 await coachingPage.locator('#post-check-root .check-form').first().waitFor({state:'visible',timeout:10000});
 await coachingPage.locator('#post-check-root .check-form').first().locator('input[value="0"]').check();
 await coachingPage.locator('#post-check-root .check-form').first().locator('button').first().click();
 const coachHint=coachingPage.locator('#post-check-root .check-form').first().locator('.teacher-next-step');
 await coachHint.waitFor({state:'visible'});
 assert.match(await coachHint.innerText(),/PFL|公式/);
 await coachingPage.goto(base+'/learning',{waitUntil:'networkidle'});
 assert.match(await coachingPage.locator('#mistake-list .teacher-next-step').first().innerText(),/PFL|公式/);
 await coachingPage.screenshot({path:join(dir,'19-targeted-coaching-evidence.png'),fullPage:true});
 await coachingContext.close();
 // Mobile real-browser responsive checks, not a physical iPhone.
 await page.setViewportSize({width:390,height:844});
 for(const route of ['/','/learning','/study']){
  await page.goto(base+route,{waitUntil:'networkidle'});
  const report=await page.evaluate(()=>({width:innerWidth,doc:document.documentElement.scrollWidth,wide:[...document.querySelectorAll('*')].filter(x=>x.getBoundingClientRect().right>innerWidth+1).slice(0,12).map(x=>({tag:x.tagName,id:x.id,cls:String(x.className).slice(0,90),left:x.getBoundingClientRect().left,right:x.getBoundingClientRect().right,scroll:x.scrollWidth}))}));
  if(report.doc>report.width+1)console.log('MOBILE_OVERFLOW_DIAGNOSTIC',route,JSON.stringify(report));
  assert.equal(report.doc>report.width+1,false,'mobile horizontal overflow at '+route);
 }
 assert.deepEqual(errors,[]);
 const receipt={
  status:'passed',
  checks:['pretest unselected','server-side no answer key','pretest locked without early answer leak','two independent pre-items',
   'real PFL hypothesis distinct from error','different transfer item unselected',
   'transfer graded independently','two distinct transfer items','dashboard evidence count from stored events',
   'candidate rejection survives refresh','novel review question initially blank',
   'review outcome updates planned due date','G4 requires real volunteer consent',
   'no synthetic participant automatically recorded','wrong-option coaching visible in transfer and learning dashboard',
   '390px home/dashboard/study layout','no browser page errors'],
  screenshots:['13-learning-pretest-unanswered.png','14-learning-scored-mistake.png',
   '15-learning-transfer-evidence.png','16-personal-evidence-dashboard.png',
   '17-review-and-progress.png','18-g4-real-study-consent-and-empty.png','19-targeted-coaching-evidence.png'],
  source:'automated Edge browser, ephemeral test context, NOT a real student'
 };
 await writeFile(join(dir,'learning-g1-g4-browser.json'),JSON.stringify(receipt,null,2)+'\n');
 console.log('G1_G4_BROWSER_ACCEPTANCE_OK',receipt.checks.length,'checks',receipt.screenshots.length,'screenshots');
}catch(e){console.error('G1_G4_BROWSER_ACCEPTANCE_FAIL',e.stack||e);process.exitCode=1}
finally{if(browser)await browser.close();await new Promise(r=>server.close(r))}
