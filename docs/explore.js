import {loadLearning,appendLearningEvent} from './learning-store.js';
const $=id=>document.getElementById(id),lab=new URLSearchParams(location.search).get('lab')==='evo'?'evo':'pfl';
const info=lab==='evo'?{name:'EvoWorld · 一座正在生活的生态箱',kernel:'evoworld-0.1.1',question:'固定环境中，同一只生命的能量、行动与种群会怎样变化？一次世界观察能够证明普遍规律吗？',experiment:'evo-pair'}:{name:'Physics Frontier Lab · 物理前沿实验室',kernel:'pfl-kernel-1.0.0',question:'同一个 Logistic 映射，改变初值后会看到什么？先观察，再回到学院做单变量对照。',experiment:'sensitivity'};
let prediction='',sessionId=crypto.randomUUID(),snapshot=null,saved=false,predictionEvent=null;
let loadingTimer=null;
function loadLab(){
 clearInterval(loadingTimer);const started=Date.now();$('lab-loading').hidden=false;$('lab-loading').textContent='正在加载固定版本实验室与计算Worker…';$('retry-lab').hidden=true;$('capture-observation').disabled=true;
 $('lab-frame').src='./labs/'+lab+'/';
 loadingTimer=setInterval(()=>{try{
  const doc=$('lab-frame').contentDocument,win=$('lab-frame').contentWindow;
  const scene=doc?.querySelector('[data-testid="visual-stage"][data-scene]');
  let ready=false;
  if(lab==='evo')ready=Number(win.evoEvidence?.tick)>0;
  else if(doc?.querySelector('canvas')&&scene&&doc.body?.innerText?.trim().length>200){
   try{ready=!!JSON.parse(scene.getAttribute('data-scene'))?.row}catch{ready=false}
  }
  if(ready){clearInterval(loadingTimer);$('lab-loading').textContent='实验室已就绪；可操作并记录真实观测。';$('capture-observation').disabled=false;}
  else if(Date.now()-started>15000){clearInterval(loadingTimer);$('lab-loading').textContent='加载尚未完成。请确认学院服务仍在运行，随后重新加载。';$('retry-lab').hidden=false;}
 }catch{}},250);
}
$('retry-lab').addEventListener('click',loadLab);
$('lab-title').textContent=info.name;
$('lab-source').textContent='产品 V0.4.0 · 科学内核 '+info.kernel+' · 本机固定呈现，不需要另外启动上游服务。';
$('explore-question').textContent=info.question;
for(const id of ['return-lesson','continue-lesson'])$(id).href='./index.html?experiment='+info.experiment;
$('explore-prediction').addEventListener('input',()=>{$('open-lab').disabled=$('explore-prediction').value.trim().length<8});
$('open-lab').addEventListener('click',()=>{
 try{
  prediction=$('explore-prediction').value.trim();if(prediction.length<8)throw Error('请先填写至少8字的预测。');
  predictionEvent=appendLearningEvent(loadLearning(),'lab_prediction',{lab,productVersion:'0.4.0',kernel:info.kernel,prediction,scope:'extension-not-graded'},{sessionId});
  $('explore-prediction').disabled=true;$('explore-gate').hidden=true;$('explore-active').hidden=false;
  $('locked-prediction').textContent='已保存事前预测：'+prediction;
  loadLab();$('open-lab').disabled=true;
 }catch(e){$('explore-status').textContent=e.message}
});
function capture(){
 const win=$('lab-frame').contentWindow,doc=win.document;
 if(!doc||!doc.querySelector('canvas'))throw Error('实验室尚未加载完毕，请稍后重试。');
 if(lab==='evo'){
  const ev=win.evoEvidence;if(!ev||!Number.isFinite(ev.tick)||ev.tick<1)throw Error('世界尚未推进，请先运行真实模拟。');
  const value=id=>doc.getElementById(id)?.textContent?.trim()||'';
  const config={};for(const [key,value] of new win.FormData(doc.getElementById('world-form')))config[key]=String(value);
  for(const input of doc.querySelectorAll('#world-form input[type=checkbox]'))config[input.name]=input.checked;
  return {lab,productVersion:'0.4.0',kernel:info.kernel,observedAt:new Date().toISOString(),source:'same-origin V0.4 live UI + evoEvidence',tick:ev.tick,running:ev.running,formInputs:config,configurationStatus:'这些是当前界面输入，可能尚未应用；完整运行配置以实验室导出报告为准。',readouts:{population:value('population'),generation:value('generation'),meanEnergy:value('mean-energy'),selectedLife:value('life-now'),time:value('tick'),seedTag:value('seed-tag')},limits:'一个自由观察世界；不替代配对世界；历史显示不是全世界录像。'};
 }
 const scene=doc.querySelector('[data-testid="visual-stage"]')?.getAttribute('data-scene');
 if(!scene)throw Error('PFL还未返回真实舞台数据，请等待计算完成。');
 const parsed=JSON.parse(scene);if(!parsed.row)throw Error('请先选择主舞台的一个真实样本。');
 const text=doc.body.innerText.trim();
 if(text.length<200)throw Error('PFL还未显示数据，请先选择实验并计算。');
 return {lab,productVersion:'0.4.0',kernel:info.kernel,observedAt:new Date().toISOString(),source:'same-origin V0.4 data-scene + visible instrument readout',scene:parsed,visibleReadout:text.slice(0,7000),limits:'自由探索运行及条件指纹，仅作过程证据；科学结论应回到学院用固定内核重新计算。'};
}
$('capture-observation').addEventListener('click',()=>{try{snapshot=capture();saved=false;$('observation-output').textContent=JSON.stringify(snapshot,null,2);$('save-observation').disabled=false;$('explore-status').textContent='已读取实验室当前状态。写下反思后保存；记录不会自动判为错题。'}catch(e){$('explore-status').textContent=e.message}});
$('close-lab').addEventListener('click',()=>{clearInterval(loadingTimer);$('lab-frame').src='about:blank';$('explore-active').hidden=true;$('explore-status').textContent='实验室已卸载，Worker随页面停止。已有观测仍可保存；再次探索请重新打开本页。'});
$('save-observation').addEventListener('click',()=>{try{
 const reflection=$('observation-reflection').value.trim();if(!snapshot||saved)throw Error('请先记录当前真实观测。');if(reflection.length<8)throw Error('请填写至少8字的观测解释与局限。');
 const event=appendLearningEvent(loadLearning(),'lab_observation',{...snapshot,prediction,reflection,predictionEventId:predictionEvent.eventId},{sessionId,conceptIds:lab==='evo'?['evolution.inference']:['chaos.sensitivity']});
 saved=true;$('save-observation').disabled=true;$('explore-status').textContent='已保存到本机学习记录。证据ID：'+event.eventId+'。进入“我的学习证据”可展开核验、导出或清除。';
}catch(e){$('explore-status').textContent=e.message}});
