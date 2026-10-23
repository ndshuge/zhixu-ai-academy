import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire('E:/CHATGPT/projects/physics-frontier-lab/package.json');
const {chromium}=require('playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4386/',{waitUntil:'networkidle'});
 const check=async state=>{
  await page.waitForFunction(x=>{let i=document.querySelector('#doctor-art');return document.querySelector('.zhixu-doctor')?.dataset.expression===x&&i?.complete&&i.naturalWidth>0},state,{timeout:6000});
  assert.ok((await page.locator('#doctor-art').getAttribute('src')).startsWith('data:image/webp;base64,'));
 };
 await page.waitForTimeout(900);
 await page.evaluate(()=>document.dispatchEvent(new CustomEvent('academy:model-status',{detail:{mentorMode:'rules'}})));
 await page.waitForTimeout(100);
 console.log('DOCTOR_DEBUG',await page.evaluate(()=>({expression:document.querySelector('.zhixu-doctor')?.dataset.expression,src:document.querySelector('#doctor-art')?.src.slice(0,45),naturalWidth:document.querySelector('#doctor-art')?.naturalWidth,completed:document.querySelector('#doctor-art')?.complete,connected:document.querySelector('.zhixu-doctor')?.dataset.connected,status:document.querySelector('#doctor-status')?.textContent,count:document.querySelectorAll('.zhixu-doctor').length,requested:document.querySelector('.zhixu-doctor')?.dataset.requestedArt,known:document.querySelector('.zhixu-doctor')?.dataset.knownArt})));
 await check('welcome');
 await page.evaluate(()=>document.dispatchEvent(new CustomEvent('academy:model-status',{detail:{mentorMode:'llm-configured',provider:'DeepSeek',model:'deepseek-chat',providerVerified:true}})));
 await check('idle');
 for(const [kind,ai,whileState,doneState] of [['mentor',true,'thinking','teaching'],['plan',true,'planning','success'],['mentor',false,'explaining','explaining'],['plan',false,'analyzing','encouraging']]){
   await page.evaluate(([kind,ai])=>document.dispatchEvent(new CustomEvent('academy:ai-start',{detail:{kind,ai}})),[kind,ai]);
   console.log('STEP_DEBUG',kind,ai,await page.locator('.zhixu-doctor').evaluate(n=>({expression:n.dataset.expression,requested:n.dataset.requestedArt,known:n.dataset.knownArt})));
   await check(whileState);
   await page.evaluate(([kind,ai])=>document.dispatchEvent(new CustomEvent('academy:ai-end',{detail:{kind,ai}})),[kind,ai]);
   await check(doneState);
 }
 await page.evaluate(()=>document.dispatchEvent(new CustomEvent('academy:ai-start',{detail:{kind:'mentor',ai:true}})));
 await page.evaluate(()=>document.dispatchEvent(new CustomEvent('academy:ai-end',{detail:{fallback:true}})));
 await check('fallback');
 await page.evaluate(()=>document.dispatchEvent(new CustomEvent('academy:ai-start',{detail:{kind:'mentor',ai:true}})));
 await page.evaluate(()=>document.dispatchEvent(new CustomEvent('academy:ai-end',{detail:{error:true}})));
 await check('warning');
 const width=await page.locator('#doctor-art').evaluate(img=>img.naturalWidth);
 assert.ok(width>=250);
 await page.screenshot({path:'evidence/browser/zhixu-doctor-11-desktop.png',fullPage:false});
 await page.setViewportSize({width:390,height:844});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
 await page.screenshot({path:'evidence/browser/zhixu-doctor-11-mobile.png',fullPage:false});
 assert.deepEqual(errors,[]);
 console.log('DOCTOR_ELEVEN_STATES_PASS',width,'image states');
}finally{await browser.close()}
