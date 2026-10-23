import {readFile,writeFile} from 'node:fs/promises';
let s=await readFile('scripts/record-rc-demo.mjs','utf8');
s=s.replace("{mkdir,writeFile}","{mkdir,writeFile,readFile}").replaceAll('rc-20261012','rc2-20261012').replaceAll('0.4.1-rc.1','0.4.1-rc.2');
s=s.replace("const app=createAcademyServer({providerRegistry:new ProviderRegistry({env:{}})});",`const registry=new ProviderRegistry({env:{},fetchImpl:async()=>{await new Promise(r=>setTimeout(r,650));return {ok:true,json:async()=>({choices:[{message:{content:'本段是模拟模型的软件演示。请先核对实际初值与参数，再解释两组轨道差；Float32舍入是独立对照。一次只改变一个变量，写下新预测并由本人批准。'}}]})}}});
registry.configure({provider:'custom',displayName:'本机模拟供应方（非DeepSeek直播）',baseUrl:'https://example.edu/v1',model:'mock-teaching',apiKey:'ONLY-FAKE-VIDEO-KEY',dailyLimit:20});
const app=createAcademyServer({providerRegistry:registry});`);
const a=s.indexOf('let frames='),b=s.indexOf('async function snap');
s=s.slice(0,a)+`const natural=JSON.parse(await readFile('submission/rc-20261012/natural-narration.json','utf8'));
let narrativeIndex=0,cdp,encoder=null,timer=null,started=0,captures=[],pending=[];
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function cue(title,text,seconds=16){
 const voiceIndex=narrativeIndex++,n=natural[voiceIndex];title=n.title;text=n.text;
 await page.evaluate(title=>{let bar=document.getElementById('rc-demo-caption');if(!bar){bar=document.createElement('aside');bar.id='rc-demo-caption';document.body.append(bar)}Object.assign(bar.style,{position:'fixed',zIndex:2147483647,left:'0',bottom:'0',right:'0',padding:'18px 38px',background:'#102d2bf5',color:'#fff',font:'25px Microsoft YaHei',lineHeight:'1.6',pointerEvents:'none'});bar.textContent=title;},title);
 const c={title,text,voiceIndex,start:(performance.now()-started)/1000,end:null};cues.push(c);console.log('RC2_SCENE',title);
 await pause(Math.max(seconds,16)*1000);c.end=(performance.now()-started)/1000;
}
`+s.slice(b);
const encodeStart=s.indexOf(" lastFrame=await page.screenshot"),encodeEnd=s.indexOf(" await cue('AI学院",encodeStart);
s=s.slice(0,encodeStart)+` await mkdir(out+'/capture-frames',{recursive:true});started=performance.now();
 cdp=await context.newCDPSession(page);cdp.on('Page.screencastFrame',e=>{
  const index=captures.length,at=(performance.now()-started)/1000,filename='capture-frames/'+String(index).padStart(6,'0')+'.jpg';
  captures.push({filename,at});cdp.send('Page.screencastFrameAck',{sessionId:e.sessionId}).catch(()=>{});
  pending.push(writeFile(out+'/'+filename,Buffer.from(e.data,'base64')));
 });
 await cdp.send('Page.startScreencast',{format:'jpeg',quality:92,maxWidth:1600,maxHeight:1000,everyNthFrame:1});
`+s.slice(encodeEnd);
s=s.replaceAll("await page.locator('#ask').click();","await page.locator('#shareApproved').check();await page.locator('#ask').click();");
s=s.replace("#post-check-root input[value=\"1\"]","#post-check-root input[value=\"2\"]");
const nextMarker=" await page.locator('#request-plan').click();";
s=s.replace(nextMarker,` await page.locator('#mentor-output').scrollIntoViewIfNeeded();const returnY=await page.evaluate(()=>scrollY);
 const imageData=(await readFile('evidence/rc2-20261012/inherited-deepseek-detail.png')).toString('base64');
 await page.setContent('<html lang="zh"><meta charset="utf-8"><body style="margin:0;background:#f7f9f8;font-family:Microsoft YaHei;padding:38px"><h1>既有真实 DeepSeek 教学证据</h1><p style="font-size:24px">2026-10-12 授权后的真实网页截图 · 不是实时生成录像</p><img src="data:image/png;base64,'+imageData+'" style="display:block;width:1150px;max-height:665px;object-fit:contain;margin:auto"><p style="font-size:23px;color:#78561d">审阅发现：43步指标属于Float64初值差。截图中的Float32归因未获科学支持；RC2已补检查与安全回退。</p></body></html>');
 const proof={title:'历史真实调用证据与科学复核',text:'既有授权截图，非连续生成录像；43步属于Float64初值扰动，历史模型Float32归因存在问题，已增加有界检查。',voiceIndex:null,start:(performance.now()-started)/1000};cues.push(proof);await pause(18000);proof.end=(performance.now()-started)/1000;
 // The original product page state remains in the same browser; restore its DOM via history navigation is avoided.
 await page.goto(base+'/');await page.locator('#prediction-input').fill('我预测轨道最终会分离，公式保持不变。');await page.locator('#run').click();await page.locator('#results').waitFor({state:'visible'});await page.locator('#shareApproved').check();await page.locator('#ask').click();await page.locator('#mentor-output').waitFor({state:'visible'});
`+nextMarker);
const finishStart=s.indexOf(' clearInterval(timer);timer=null;'),finishEnd=s.indexOf("}catch(e){console.error",finishStart);
s=s.slice(0,finishStart)+` await cdp.send('Page.stopScreencast');await Promise.all(pending);const duration=(performance.now()-started)/1000;
 let concat='ffconcat version 1.0\\n';for(let i=0;i<captures.length;i++){concat+="file '"+captures[i].filename+"'\\n";concat+='duration '+Math.max(.001,(captures[i+1]?.at??duration)-captures[i].at).toFixed(6)+'\\n';}concat+="file '"+captures.at(-1).filename+"'\\n";
 await writeFile(out+'/capture.ffconcat',concat);
 const enc=spawn('ffmpeg',['-y','-loglevel','error','-f','concat','-safe','0','-i',out+'/capture.ffconcat','-vf','fps=30','-t',String(duration),'-c:v','libx264','-preset','veryfast','-crf','19','-pix_fmt','yuv420p',out+'/rc2-screen.mp4'],{stdio:['ignore','ignore','pipe']});let encodeError='';enc.stderr.on('data',d=>encodeError+=d);await new Promise((r,j)=>enc.once('close',c=>c===0?r():j(Error(encodeError))));
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);await writeFile(out+'/demo-narration.json',JSON.stringify(cues,null,2));
 await writeFile(ev+'/demo-recording.json',JSON.stringify({kind:'AUTOMATED_PRODUCT_VIDEO_WITH_MOCK_MODEL_AND_LABELED_HISTORICAL_REAL_PROOF',version:'0.4.1-rc.2',duration,sourceFrames:captures.length,outputFPS:30,captureTiming:'real wall-time VFR captures resampled to 30fps, static frames held',cues,errors,external,extraRealCalls:0,humanParticipants:0},null,2));console.log('RC2_RECORD_OK',duration,captures.length);
`+s.slice(finishEnd);
await writeFile('scripts/record-rc2-demo.mjs',s);
console.log('RC2_RECORD_SCRIPT_READY');
