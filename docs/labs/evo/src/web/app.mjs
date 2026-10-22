import { installWorldInteraction } from './world-interaction.mjs';
import { installExperienceUI } from './experience-ui.mjs';
import { EcologyRenderer } from './ecology.mjs';
import { installScienceUI } from './science-ui.mjs';
import { DEFAULTS,validateConfig } from '../core/config.mjs';
import { INPUTS, OUTPUTS } from '../core/controllers.mjs';
import { PROTOCOLS } from '../core/experiments.mjs';
import { toCSV } from '../core/statistics.mjs';
import { setupCanvas, lineChart, intervalPlot } from './charts.mjs';
const $=id=>document.getElementById(id),esc=s=>String(s).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const fmt=(n,d=0)=>Number(n).toLocaleString('zh-CN',{maximumFractionDigits:d,minimumFractionDigits:d});
const worldWorker=new Worker(new URL('./worker.mjs',import.meta.url),{type:'module'}),experimentWorker=new Worker(new URL('./experiment-worker.mjs',import.meta.url),{type:'module'});
let view=null,running=true,selectedId=null,report=null,tab='world',lastInspector=0,agentSignature='',inspectorKey='',noticeTimer,jobBusy=false;
const camera={zoom:1,x:0,y:0},canvas=$('world-canvas');let transform={scale:1,x:0,y:0},pointer=null;
const renderTimes=[];let lastPaint=0,paintFrames=0,paintFPS=0,paintStart=performance.now(),paintWindow=0;
const frameDeltas=[];let lastFrame=performance.now(),fpsStart=lastFrame,frames=0,fps=0,totalFrames=0;
window.evoEvidence={tick:0,fps:0,frameDeltas,actualSpeed:0,running:true,totalFrames:0,version:'0.4.0'};
function notify(message,error=false){$('notification').textContent=message;$('notification').classList.toggle('danger',error);$('notification').hidden=false;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>$('notification').hidden=true,6000);}
function download(name,data,type='application/json'){const blob=new Blob([typeof data==='string'?data:JSON.stringify(data,null,2)],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function send(type,data={}){worldWorker.postMessage({type,...data});}
let experienceUI=null;
let worldUI=null;
function selectLife(id){selectedId=id;lastInspector=0;lastScience=0;send('select',{id});document.dispatchEvent(new CustomEvent('life-selected',{detail:{id}}));worldUI?.openLife(id);}
const ecology=new EcologyRenderer();let lastScience=0,lastChart=0;
const scienceUI=installScienceUI({$,send,resetWorld,getView:()=>view,getSelected:()=>selectedId,select:selectLife,download,notify,activate,experimentWorker,setBusy:value=>busy(value)});
experienceUI=installExperienceUI({$,send,resetWorld,getView:()=>view,select:selectLife,activate,download,notify});
worldUI=installWorldInteraction({$,camera,ecology,getView:()=>view,getTransform:()=>transform,getSelected:()=>selectedId,select:selectLife,send,notify});
if(new URL(location.href).searchParams.get('tools')==='expanded'){$('observer-toggle').click();for(const el of document.querySelectorAll('.visual-controls,.file-menu,.world-data'))el.open=true;}
if(new URL(location.href).searchParams.get('tools')==='expanded')for(const el of document.querySelectorAll('.deep-inspector,.deep-timeline,.observation-tools,.formal-tools'))el.open=true;
if(matchMedia('(max-width:560px)').matches){camera.zoom=2.3;ecology.cameraMotion.reset(camera);};
for(const [id,key]of [['show-trails','trails'],['show-communication','communication'],['show-effects','effects'],['follow-selected','follow'],['show-animation','animation'],['show-atmosphere','atmosphere']])$(id).onchange=e=>ecology.options[key]=e.target.checked;
$('visual-mode').onchange=e=>ecology.options.mode=e.target.value;
if(matchMedia('(prefers-reduced-motion:reduce)').matches){ecology.options.effects=false;ecology.options.animation=false;ecology.options.atmosphere=false;$('show-effects').checked=false;$('show-animation').checked=false;$('show-atmosphere').checked=false;}

function activate(name){tab=name;for(const t of document.querySelectorAll('[data-tab]')){const active=t.dataset.tab===name;t.classList.toggle('active',active);t.setAttribute('aria-pressed',String(active));}for(const name2 of ['world','experiments','learning'])$(`${name2}-panel`).hidden=name2!==name;location.hash=name;if(name==='experiments'&&report)setTimeout(()=>renderReport(report),0);}
for(const button of document.querySelectorAll('[data-tab]'))button.addEventListener('click',()=>activate(button.dataset.tab));
if(['world','experiments','learning'].includes(location.hash.slice(1)))activate(location.hash.slice(1));
window.addEventListener('hashchange',()=>{const next=location.hash.slice(1);if(['world','experiments','learning'].includes(next)&&next!==tab)activate(next);});
function syncForm(config){const form=$('world-form');for(const [key,value]of Object.entries(config)){const el=form.elements.namedItem(key);if(!el)continue;if(el.type==='checkbox')el.checked=value;else el.value=value;}}
function resetWorld(config){config=validateConfig(config);scienceUI.reset();experienceUI?.reset();ecology.previousConfig=null;camera.zoom=matchMedia('(max-width:560px)').matches?2.3:1;camera.x=0;camera.y=0;selectedId=null;agentSignature='';inspectorKey='';worldUI.reset();send('reset',{config});send('running',{value:true});syncForm({...DEFAULTS,...config});}
$('play-pause').onclick=()=>send('running',{value:!running});$('single-step').onclick=()=>send('step');$('speed').onchange=e=>send('speed',{value:Number(e.target.value)});
$('world-form').onsubmit=e=>{e.preventDefault();const data=new FormData(e.currentTarget),c={};for(const [k,v]of data)c[k]=['controller','neuralInit','environment','communication'].includes(k)?v:Number(v);for(const [k,v]of Object.entries(DEFAULTS))if(typeof v==='boolean')c[k]=e.currentTarget.elements.namedItem(k).checked;try{resetWorld(c);}catch(error){notify(error.message,true);}};
$('save-snapshot').onclick=()=>send('snapshot');$('export-history').onclick=()=>send('history');
$('load-snapshot').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>12*1024*1024)throw new Error('存档大于 12 MiB，本版不接受');const data=JSON.parse(await file.text());send('restore',{data});}catch(error){notify(`载入失败：${error.message}`,true);}e.target.value='';};
$('agent-select').onchange=e=>selectLife(Number(e.target.value)||null);
worldWorker.onmessage=e=>{const m=e.data;if(m.type==='exploration-complete'){scienceUI.renderExplanation(m.record.report);experienceUI.renderExplanation(m.record.report);experienceUI.complete(m.record);return;}if(m.type==='explanation'){scienceUI.renderExplanation(m.report);experienceUI.renderExplanation(m.report);return;}if(m.type==='local-record'){download('evoworld-local-record-tick'+m.data.endTick+'.json',m.data);return;}if(m.type==='error'){experienceUI.fail(m.message);notify(`模拟错误：${m.message}。可重新播种后重试。`,true);return;}
  if(m.type==='restored'){scienceUI.reset();experienceUI.reset();ecology.previousConfig=null;selectedId=null;agentSignature='';inspectorKey='';lastInspector=0;view=null;camera.zoom=1;camera.x=0;camera.y=0;worldUI.reset();notify('世界已载入，模拟已暂停。观察器已重新选择存活个体。');return;}
  if(m.type==='snapshot'){download(`evoworld-seed${m.data.config.seed}-tick${m.data.tick}.json`,m.data);return;}
  if(m.type==='history'){download(`evoworld-history-${view?.config.seed??0}.csv`,toCSV(m.data),'text/csv;charset=utf-8');return;}
  if(m.type!=='view')return;const oldConfig=view?.config;view=m.view;running=m.running;ecology.update(view,{running});experienceUI.update(view);worldUI.update(view);window.evoEvidence={...window.evoEvidence,tick:view.tick,population:view.metrics.population,actualSpeed:m.actualSpeed,running,selectedId,inspectedId:view.selected?.id??null};
  $('world-loading').hidden=true;$('play-pause').textContent=running?'暂停':'继续';$('play-pause').setAttribute('aria-label',running?'暂停模拟':'继续模拟');$('single-step').disabled=running;$('speed').value=m.speed;
  if(JSON.stringify(oldConfig)!==JSON.stringify(view.config))syncForm(view.config);
  const metrics=view.metrics;$('population').textContent=fmt(metrics.population);$('population-split').textContent=`规则 ${metrics.rule} · 神经 ${metrics.neural}`;$('generation').textContent=`G${metrics.generation}`;$('mean-energy').textContent=fmt(metrics.meanEnergy,1);$('tick').textContent=fmt(view.tick);$('climate').textContent=`${view.climate.label} · ${fmt(view.tick*view.config.secondsPerTick,1)} 模拟秒`;
  $('seed-tag').textContent=`Seed ${view.config.seed} · CPU`;$('world-size').textContent=`${view.config.width} × ${view.config.height} 环面 · ${view.config.unitsPerCell} 单位/格`;$('birth-death').textContent=`出生 ${fmt(metrics.births)} · 死亡 ${fmt(metrics.deaths)}`;
  $('performance').textContent=running?`${paintFPS.toFixed(0)} 画面绘制/s · 实际 ${m.actualSpeed.toFixed(1)}× / 目标 ${m.speed}×`:`暂停 · ${paintFPS.toFixed(0)} 画面绘制/s · 目标 ${m.speed}×`;
  const sig=view.agents.map(a=>a.id).join(',');if(sig!==agentSignature){agentSignature=sig;$('agent-select').innerHTML='<option value="">选择一个个体</option>'+view.agents.map(a=>`<option value="${a.id}">#${a.id} · ${a.controller==='rule'?'规则':'神经'} · G${a.generation}</option>`).join('');}
  if(!selectedId&&view.agents.length){selectedId=(view.agents.find(a=>a.controller==='neural')??view.agents[0]).id;send('select',{id:selectedId});}
  $('agent-select').value=selectedId??'';
  const now=performance.now();if(now-lastScience>450){scienceUI.update(view);lastScience=now;}if(now-lastInspector>200){renderInspector();lastInspector=now;}
  $('energy-values').innerHTML=[['光能输入（累计）',metrics.sunlight],['植物 + 协作资源',metrics.food+metrics.hard],['个体储能',metrics.agentEnergy],['可回收残体',metrics.detritus],['耗散热（累计）',metrics.heat]].map(([k,v])=>`<div><dt>${k}</dt><dd>${fmt(v,1)}</dd></div>`).join('');
  $('energy-balance').textContent=`守恒残差 ${metrics.balanceError.toExponential(2)} · ${Math.abs(metrics.balanceError)<1e-5?'通过':'需检查'}`;$('energy-balance').classList.toggle('danger',Math.abs(metrics.balanceError)>=1e-5);
  $('chart-description').textContent=`蓝色：规则 · 琥珀色：神经。显示最近 ${view.history.length} 个采样点；累计移除 ${view.historyDropped} 点。单次轨迹不能替代重复实验。`;
  $('events').innerHTML=view.events.slice(-12).reverse().map(event=>`<li>tick ${event.tick} · #${event.id} ${event.type==='birth'?(event.related?`由 #${event.related} 繁殖`:'创始个体出生'):event.type==='death'?'死亡':`向 #${event.related} 分享 ${event.amount} 能量`}</li>`).join('');
};
worldWorker.onerror=e=>notify(`模拟线程无法启动：${e.message}。请通过 npm start 的 HTTP 地址访问。`,true);
function networkSVG(a){const brain=a.brain;if(!brain||a.controller!=='neural')return '';const values=[brain.inputs,brain.hidden,brain.outputs],layers=[12,8,5],xs=[22,139,256],node=(l,i)=>({x:xs[l],y:14+i*150/(layers[l]-1)});const edges=[];
  for(let h=0;h<8;h++)for(let i=0;i<12;i++)edges.push({from:node(0,i),to:node(1,h),weight:a.genome.weights[h*12+i],label:`输入 ${i+1} → 隐藏 ${h+1}`});
  for(let o=0;o<5;o++)for(let h=0;h<8;h++)edges.push({from:node(1,h),to:node(2,o),weight:a.genome.weights[104+o*8+h],label:`隐藏 ${h+1} → 输出 ${o+1}`});
  const lines=edges.sort((a,b)=>Math.abs(b.weight)-Math.abs(a.weight)).slice(0,30).map(e=>`<line x1="${e.from.x}" y1="${e.from.y}" x2="${e.to.x}" y2="${e.to.y}" stroke="${e.weight>=0?'#166c64':'#b8722d'}" stroke-opacity=".27" stroke-width="${Math.min(2,Math.abs(e.weight))}"><title>${e.label}：w = ${e.weight.toFixed(4)}</title></line>`).join('');
  const nodes=layers.flatMap((size,l)=>Array.from({length:size},(_,i)=>{const p=node(l,i),v=values[l]?.[i]??0,label=l===0?INPUTS[i]:l===2?OUTPUTS[i]:`隐藏神经元 ${i+1}`;return `<circle cx="${p.x}" cy="${p.y}" r="4.5" fill="${v>=0?'#166c64':'#b8722d'}" fill-opacity="${.25+.75*Math.abs(v)}" stroke="white" stroke-width="1"><title>${label} = ${v.toFixed(4)}</title></circle>`;})).join('');return `<svg class="neural-graph" viewBox="0 0 280 178" role="img" aria-label="真实的十二输入、八隐藏、五输出神经网络；展示绝对值最大的三十条连接">${lines}${nodes}</svg>`;
}
// Retain DOM identity for the same organism: disclosures and focused controls
// survive updates. Only values, attributes and changed list entries are patched.
function updateInspector(markup,key){const root=$('organism-inspector'),fresh=document.createElement('div');fresh.innerHTML=markup;
  if(key!==inspectorKey){root.replaceChildren(...fresh.childNodes);inspectorKey=key;return;}
  function patchChildren(before,after){const old=[...before.childNodes],next=[...after.childNodes];for(let i=0;i<Math.max(old.length,next.length);i++){
    if(!old[i]){before.append(next[i].cloneNode(true));continue;}if(!next[i]){old[i].remove();continue;}
    const a=old[i],b=next[i];if(a.nodeType!==b.nodeType||a.nodeName!==b.nodeName){a.replaceWith(b.cloneNode(true));continue;}
    if(a.nodeType===Node.TEXT_NODE){if(a.data!==b.data)a.data=b.data;continue;}if(a.nodeType!==Node.ELEMENT_NODE)continue;
    for(const attr of [...a.attributes])if(!(a.tagName==='DETAILS'&&attr.name==='open')&&!b.hasAttribute(attr.name))a.removeAttribute(attr.name);
    for(const attr of [...b.attributes])if(a.getAttribute(attr.name)!==attr.value)a.setAttribute(attr.name,attr.value);
    patchChildren(a,b);
  }}patchChildren(root,fresh);
}
function renderInspector(){const a=view?.selected;if(!a){updateInspector(`<p class="empty">${selectedId?'选中的个体已离开当前存活种群。选择另一个个体继续观察。':'选择一个个体，查看实际决策。'}</p>`,`empty:${selectedId}`);return;}
  const g=a.genome.traits;const pairs=[['能量',fmt(a.energy,1)],['年龄',`${a.age} tick`],['速度基因',fmt(g.speed,2)],['感知范围',fmt(g.sense,2)],['合作基因',fmt(g.cooperation,2)],['后代数',a.children]];
  updateInspector(`<div class="organism-title"><strong>#${a.id} <small>G${a.generation}</small></strong><span class="tag">${esc(a.action)}</span></div><dl class="organism-stats">${pairs.map(([k,v])=>`<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl><div class="energy-meter" aria-label="能量 ${a.energy.toFixed(1)} / 120"><span style="transform:scaleX(${a.energy/120})"></span></div><h3>${a.controller==='neural'?'神经控制器 · 12 → 8 → 5':'规则控制器'}</h3><div class="neural-container">${a.controller==='neural'?networkSVG(a):'<p class="neural-caption">优先觅食，其次利用收到的信息，再探索；进入资源格后休息。</p>'}</div><p class="neural-caption">${a.controller==='neural'?`${view.config.neuralInit==='guided'?'创始权重来自显式启发式先验':'创始权重随机初始化'}。后代继承并可能突变；个体没有反向传播或强化学习。显示最强 30 条连接。`:'共享相同的感知与动作接口；规则的遗传性状也接受自然选择。'}</p><details><summary>输入与行为输出（实际值）</summary><div class="input-values">${INPUTS.map((name,i)=>`<span>${name}<b>${a.brain?fmt(a.brain.inputs[i],2):'—'}</b></span>`).join('')}${OUTPUTS.map((name,i)=>`<span>${name}<b>${a.brain?fmt(a.brain.outputs[i],2):'—'}</b></span>`).join('')}</div></details><details><summary>跨代谱系 · 保留范围内 ${a.ancestry.length} 代</summary><ol class="lineage-list">${a.ancestry.map(l=>`<li>#${l.id} · G${l.generation} · ${l.deathTick===null?'存活':'已亡'}</li>`).join('')}</ol><p class="neural-caption">子代：${a.childrenRecords.map(l=>`#${l.id}`).join('、')||'尚无'}。累计淘汰旧记录 ${view.lineageDropped} 条。</p></details><button class="weight-export" id="export-genome">导出 ${a.controller==='neural'?'149 个参数与激活值':'遗传性状与决策输入'}</button>`,`${a.id}:${a.controller}`);
  $('export-genome').onclick=()=>{const current=view?.selected;if(current)download(`organism-${current.id}-tick${view.tick}.json`,{tick:view.tick,seed:view.config.seed,organism:current});};
}
function drawWorld(now){if(!view)return;const start=performance.now(),{ctx,width:w,height:h}=setupCanvas(canvas);if(w<=0||h<=0)return;transform=ecology.draw(ctx,w,h,view,camera,selectedId,$('show-sensors').checked,now);worldUI.frame();renderTimes.push(performance.now()-start);if(renderTimes.length>300)renderTimes.shift();paintFrames++;paintWindow++;if(now-paintStart>=1000){paintFPS=paintWindow*1000/(now-paintStart);paintWindow=0;paintStart=now;}}
function frame(now){const dt=now-lastFrame;lastFrame=now;frames++;totalFrames++;if(dt<500){frameDeltas.push(dt);if(frameDeltas.length>600)frameDeltas.shift();}if(now-fpsStart>1000){fps=frames/(now-fpsStart)*1000;frames=0;fpsStart=now;}if(tab==='world'){if(now-lastPaint>=1000/60){drawWorld(now);lastPaint=now;}if(view&&now-lastChart>120&&document.querySelector('.observation-tools').open){lastChart=now;lineChart($('population-chart'),view.history,[{key:'rule',color:'#327ba4'},{key:'neural',color:'#b8722d'}]);lineChart($('energy-chart'),view.history,[{key:r=>r.food+r.hard+r.detritus,color:'#639d73'},{key:'agentEnergy',color:'#327ba4'},{key:'heat',color:'#b8722d'}]);}}
  window.evoEvidence={...window.evoEvidence,fps,totalFrames,frameDeltas,paintFrames,paintFPS,renderTimes,camera:{...camera},transform:{...transform}};requestAnimationFrame(frame);}
requestAnimationFrame(frame);
for(const p of PROTOCOLS)$('protocol').add(new Option(p.title,p.id));
function showProtocol(){const p=PROTOCOLS.find(p=>p.id===$('protocol').value);$('protocol-detail').innerHTML=`<h3>可检验假设</h3><p>${p.hypothesis}</p><h3>变量与边界</h3><p>自变量：${p.independent}</p><p>因变量：${p.dependent}</p><p>${p.confounds}</p><p>${p.limits}</p>`;}
$('protocol').onchange=showProtocol;showProtocol();
function busy(value){jobBusy=value;$('pair-start').disabled=value;$('start-experiment').disabled=value;$('cancel-experiment').disabled=!value;$('load-formal').disabled=value;for(const el of $('experiment-form').elements)if(!['submit','button'].includes(el.type))el.disabled=value;}
$('experiment-form').onsubmit=e=>{e.preventDefault();const data=new FormData(e.currentTarget);send('running',{value:false});busy(true);report=null;$('download-experiment-json').disabled=true;$('download-experiment-csv').disabled=true;$('batch-progress').value=0;$('experiment-progress').textContent='正在创建配对世界…';$('experiment-results').innerHTML='<p class="empty">实验进行中；完整重复结束后计算统计区间。</p>';experimentWorker.postMessage({type:'run',id:data.get('id'),options:{repeats:Number(data.get('repeats')),ticks:Number(data.get('ticks')),baseSeed:Number(data.get('baseSeed'))}});};
$('cancel-experiment').onclick=()=>experimentWorker.postMessage({type:'cancel'});
experimentWorker.onmessage=e=>{const m=e.data;if(scienceUI.pairMessage(m))return;if(m.type==='progress'){$('batch-progress').value=(m.completed+m.within)/m.total;$('experiment-progress').textContent=`已完成 ${m.completed}/${m.total} 个世界 · ${m.arm} · seed ${m.seed}`;}if(m.type==='result'){busy(false);report=m.report;$('batch-progress').value=1;$('experiment-progress').textContent=`完成 ${report.runs.length} 个独立世界。以下数据来自本次真实模拟。`;renderReport(report);}if(m.type==='cancelled'){busy(false);$('experiment-progress').textContent='本次实验已停止。未完成批次不会生成科研结论。';}if(m.type==='error'){busy(false);notify(`实验失败：${m.message}`,true);$('experiment-progress').textContent=`实验失败：${m.message}`;}};
experimentWorker.onerror=e=>{busy(false);notify(`实验线程错误：${e.message}`,true);};
$('load-formal').onclick=async()=>{try{const response=await fetch(`/labs/evo/results/${$('protocol').value}.json`);if(!response.ok)throw new Error('该正式结果尚未生成；可运行 npm run experiments 或开始新的实验');report=await response.json();$('experiment-progress').textContent=`已读取正式结果 · ${report.plan.repeats} 个种子 · 每臂 ${report.plan.ticks} tick · ${report.evidence?.generatedAt??'浏览器批次'}`;$('batch-progress').value=1;renderReport(report);}catch(error){notify(error.message,true);}};
$('download-experiment-json').onclick=()=>report&&download(`evoworld-experiment-${report.plan.id}.json`,report);$('download-experiment-csv').onclick=()=>report&&download(`evoworld-experiment-${report.plan.id}.csv`,toCSV(report.runs),'text/csv;charset=utf-8');
function renderReport(r){const sig=c=>c.pHolm<.05?'此批次有统计差异':'此批次证据不足';$('experiment-results').innerHTML=`<h3>${r.plan.protocol.title}</h3><p class="result-summary">主指标：${r.plan.primaryMetric==='traitDiversity'?'感知范围方差':'种群积分 / tick（平均种群）'}。统计单位为世界；各条件按种子配对。</p><div class="table-scroll"><table><thead><tr><th>条件</th><th>独立 n</th><th>均值</th><th>标准差</th></tr></thead><tbody>${r.groups.map(g=>`<tr><td>${esc(g.label)}</td><td>${g.n}</td><td>${fmt(g.mean,3)}</td><td>${fmt(g.sd,3)}</td></tr>`).join('')}</tbody></table></div><h3>差值与不确定性</h3><canvas id="ci-chart" class="ci-plot" role="img" aria-label="配对条件差值及百分之九十五 bootstrap 置信区间"></canvas><div class="table-scroll"><table><thead><tr><th>比较</th><th>Δ</th><th>95% 区间</th><th>p Holm</th><th>判断</th></tr></thead><tbody>${r.contrasts.map(c=>`<tr><td>${esc(c.a)} − ${esc(c.b)}</td><td>${fmt(c.difference,3)}</td><td>[${c.ci95.map(x=>fmt(x,3)).join(', ')}]</td><td>${c.pHolm.toFixed(4)}</td><td>${sig(c)}</td></tr>`).join('')}</tbody></table></div><p class="uncertainty-note">${esc(r.plan.protocol.limits)}</p><h3>逐次记录（前 12 行 / 共 ${r.runs.length} 行）</h3><div class="table-scroll"><table><thead><tr><th>条件</th><th>seed</th><th>平均种群</th><th>最终种群</th><th>出生</th><th>残差</th></tr></thead><tbody>${r.runs.slice(0,12).map(row=>`<tr><td>${esc(row.label)}</td><td>${row.seed}</td><td>${fmt(row.meanPopulation,2)}</td><td>${row.finalPopulation}</td><td>${row.births}</td><td>${row.balanceError.toExponential(1)}</td></tr>`).join('')}</tbody></table></div>`;$('download-experiment-json').disabled=false;$('download-experiment-csv').disabled=false;intervalPlot($('ci-chart'),r.contrasts);}
const lessons=[
 ['确定性与时间','种子固定的是随机序列。模拟每次只走一个固定步骤，绘图帧率与播放速度不会参与生命决策。','状态ₜ₊₁ = F(状态ₜ, 随机流ₜ)','改变速度后，走到相同 tick，世界的状态应该一致。',{seed:42},'重新播种 seed 42','src/core/config.mjs · World.step'],
 ['能量与守恒','资源采集把能量从环境转给个体；移动和代谢变为热；死亡的剩余能量进入残体。光能是显式的外部输入。','E初始 + E光能 = E资源 + E个体 + E残体 + E热','关闭再生后，个体能暂时恢复，但全世界总账不应凭空增长。',{regeneration:0,environment:'stable'},'关闭外部光能输入','World.regenerate / spend / stepOnce'],
 ['繁殖与遗传','生得更多的策略自然留下更多后代。每个性状和每个神经参数独立以 μ 的概率突变；父代不因为孩子突变而改变。','子代基因 = 父代基因 + 伯努利(μ) × 有界扰动','μ = 0 时，亲代与子代的遗传参数相同；种群仍会受选择改变组成。',{mutationRate:0},'观察零突变的谱系','controllers.mjs · mutateGenome'],
 ['一个真实神经网络','输入向量经过两次矩阵乘法和 tanh 的可复现有理近似（测试误差 < 10⁻⁴）。权重决定输出；随机权重没有天然智能。','h = φ(W₁x + b₁)　u = φ(W₂h + b₂)，φ ≈ tanh','将创始权重改为随机，然后与规则组做重复实验。',{controller:'neural',neuralInit:'random'},'观察随机神经控制器','controllers.mjs · forward / decide'],
 ['合作与群体','个体发布自己看到的资源；局部接收只在通信半径内。两名合作个体同格才可采集协作资源。群体结构来自实际移动与结算。','局部信息 + 成本 + 资源竞争 → 群体结果','关闭通信后比较共享信息的效应。协作收益由模型定义，不能直接宣称现实中的合作必然有利。',{communication:'none'},'做一次通信消融','World.sense / routeCentral / stepOnce'],
 ['证据与不确定性','同一条曲线中的很多点并非很多独立实验。独立种子提供独立世界；同种子条件配对可以减小初始差异。','Δᵢ = 指标A(seedᵢ) − 指标B(seedᵢ)','到科学实验页先选择主指标，完成所有重复，再解释配对区间。',null,'打开科学实验','statistics.mjs · pairedInference / holm']
];
$('learning-content').innerHTML=lessons.map(([title,intuition,math,operation,preset,label,code],i)=>`<section class="learning-mechanism"><h2>${title}</h2><div><p>${intuition}</p><div class="formula">${math}</div><p>${operation}</p><p><code>${code}</code></p><button data-lesson="${i}">${label}</button></div></section>`).join('');
for(const button of document.querySelectorAll('[data-lesson]'))button.onclick=()=>{const lesson=lessons[Number(button.dataset.lesson)];if(!lesson[4])activate('experiments');else{resetWorld({...view?.config,...lesson[4]});activate('world');notify('已重新播种并应用该实验变量。其他参数保持当前设置。');}};
$('quiz-form').onsubmit=e=>{e.preventDefault();const answer=Number($('quiz-answer').value);$('quiz-feedback').textContent=answer===69?'预测正确。100 − 28 − 3 = 69；子代的 28 与耗散的 3 都有去向，总账仍是 100。':answer===72?'你计算了给子代的能量，还需要扣除繁殖耗散的 3 单位。修改预测后再次提交。':'把转给子代的能量与耗散分开记账：父代剩余 = 原有能量 − 子代所得 − 耗散。再试一次。';};
window.addEventListener('resize',()=>{if(tab==='experiments'&&report)intervalPlot($('ci-chart'),report.contrasts);});

