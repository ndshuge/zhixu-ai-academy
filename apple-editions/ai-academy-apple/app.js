/* Zhixu AI Academy — Apple Edition.
   This frontend calls the live, unchanged Original Pages science engine in a same-origin
   iframe. Learning state is handled by Original's unchanged version-2 learning-store.
   No science, rubric, or API key implementation is copied into this edition.
*/
import './assets/components.js';
import { decorateZhixuR2 } from './r2-present.js';
import { nativeLogisticPlot } from './native-proof.js';
const ORIGINAL='/zhixu-ai-academy/';
const $=(sel,scope=document)=>scope.querySelector(sel);
const $$=(sel,scope=document)=>Array.from(scope.querySelectorAll(sel));
const main=$('#main'), frame=$('#original-engine');
const PREF_KEY='zx-apple-preferences-v1';
const views={today:'今天',learn:'私人教师',courses:'课程',library:'资料与错题',growth:'学习进度',settings:'设置'};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon=(name)=>'<svg aria-hidden="true"><use href="#i-'+name+'"></use></svg>';
const button=(label,act,cls='primary',extra='')=>'<button class="'+cls+'" data-action="'+act+'" '+extra+'>'+label+'</button>';
const link=(label,path)=>'<a class="inline-link" href="'+esc(path)+'" target="_blank" rel="noopener noreferrer">'+esc(label)+' ↗</a>';
let lib,store,summary,frameWin,modelState=null,ready=false,currentView='today',busy=false,engineReadyPromise=null;
let pref={effect:true};
try{const p=JSON.parse(localStorage.getItem(PREF_KEY)||'null');if(p&&typeof p.effect==='boolean')pref=p;}catch{}
const freshLesson=()=>({exp:'sensitivity',step:0,highest:0,question:null,graded:null,prediction:'',run:null,mentor:null,transfer:null,transferGrade:null,plan:null,approvedRun:null,preQueue:[],preIndex:0,transferQueue:[],transferIndex:0,preResults:[],transferResults:[]});
let lesson=freshLesson();
try{const saved=JSON.parse(sessionStorage.getItem('zx-apple-lesson-v1')||'null');if(saved&&typeof saved==='object'&&['sensitivity','logistic','evo-pair'].includes(saved.exp)&&Number.isInteger(saved.step))lesson={...freshLesson(),...saved};}catch{}
const loadSummary=()=>{if(!lib||!store)return;summary=lib.summarizeLearning(store);};
const showToast=(message)=>{const node=$('#toast');node.textContent=message;node.classList.add('show');clearTimeout(node._timer);node._timer=setTimeout(()=>node.classList.remove('show'),3300);};
function infoMessage(t,kind=''){return '<div class="feedback '+kind+'" role="status">'+esc(t)+'</div>';}
function intro(kicker,title,sub=''){return '<div class="eyebrow">'+esc(kicker)+'</div><h1 class="large-title">'+esc(title)+'</h1>'+(sub?'<p class="text-muted">'+esc(sub)+'</p>':'');}
const groups=(rows)=>'<div class="unified">'+rows.join('')+'</div>';
function row(label,desc,act,glyph='book',detail=''){
return '<div class="list-row"><span class="list-icon">'+icon(glyph)+'</span><button data-action="'+act+'"><strong>'+esc(label)+'</strong><small>'+esc(desc)+'</small></button>'+(detail?'<span class="pill">'+esc(detail)+'</span>':'<span class="list-end">›</span>')+'</div>';
}
function eventDate(str){if(!str)return '时间未记录';const d=new Date(str);return Number.isNaN(+d)?'日期不可用':d.toLocaleString('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});}
function protectNumber(v){return Number.isFinite(Number(v))?String(v):'—';}
function baseFoot(){return '<p class="original-note">'+icon('check')+' 学习证据使用知序原版 V2 数据结构 · 数据仅保存在当前浏览器</p>';}
let byokLoadPromise=null;
function loadOriginalModelModule(w){
 if(w.ZHIXU_PAGES_AI)return Promise.resolve(true);
 if(!byokLoadPromise){
   byokLoadPromise=new Promise(resolve=>{
     const script=w.document.createElement('script');
     script.src=ORIGINAL+'original-pages-byok.js'; // exactly the unchanged Original model module.
     script.onload=()=>resolve(!!w.ZHIXU_PAGES_AI);
     script.onerror=()=>resolve(false);
     w.document.body.appendChild(script);
   });
 }
 return byokLoadPromise;
}
async function attachOriginal(){
 const start=Date.now();
 while(Date.now()-start<16000){
  try{
   const w=frame.contentWindow;
   if(w&&w.ZHIXU_BROWSER_ADAPTER&&typeof w.fetch==='function'){
     frameWin=w;
     const modelModule=await loadOriginalModelModule(w);
     const s=await api('/api/status');modelState=s;ready=true;
     window.ZHIXU_APPLE_ENGINE_INFO={mode:'same-origin-original-learning',originalAdapter:!!w.ZHIXU_BROWSER_ADAPTER,originalBYOK:!!modelModule};
     $('#bridge-state').textContent='科学引擎已连接 · '+(s.mentorMode==='llm-configured'?'可选模型已验证':'规则引导模式')+(modelModule?'':' · 模型设置暂不可用');
     return true;
   }
  }catch{}
  await new Promise(r=>setTimeout(r,380));
 }
 $('#bridge-state').textContent='当前科学引擎未连接。请检查网络并重试。';
 return false;
}
async function api(path,body){
 if(!frameWin)throw new Error('原版科学引擎尚未就绪，请检查网络并重试');
 const options=body===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)};
 const r=await frameWin.fetch(path,options);
 const value=await r.json().catch(()=>({error:'原版接口返回无法解析的数据'}));
 if(!r.ok)throw new Error(value?.error||'接口错误 '+r.status);
 return value;
}
function setView(view,opt={}){
 if(!views[view])view='today';
 currentView=view;location.hash=view;
 $$('.nav-link[data-view],.dock-link[data-view]').forEach(el=>{
   const active=el.dataset.view===view;el.classList.toggle('selected',active);
   if(active)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');
 });
 $('#crumb').textContent=views[view];
 if(view!=='learn')lesson.maxStep=lesson.highest;
 // No double document snapshots: old page leaves immediately, only new content animates.
 renderView();
 window.scrollTo({top:0,behavior:'instant'});
 if(opt.focus)main.focus({preventScroll:true});
 if(!opt.initial&&!matchMedia('(prefers-reduced-motion:reduce)').matches){
   const page=main.firstElementChild;
   const animate=window.ZHIXU_APPLE_MOTION?.animate;
   if(page&&animate)animate(page,{opacity:[.95,1],y:[4,0]},{duration:.17,ease:[.22,.73,.21,1]});
 }
}
window.ZHIXU_APPLE_NAVIGATE=(view)=>setView(view,{focus:true});
function renderView(){
 try{sessionStorage.setItem('zx-apple-lesson-v1',JSON.stringify(lesson));}catch{}
 loadSummary();
 if(currentView==='today')main.innerHTML=home();
 if(currentView==='courses')main.innerHTML=courses();
 if(currentView==='learn')main.innerHTML=learn();
 if(currentView==='library')main.innerHTML=library();
 if(currentView==='growth')main.innerHTML=growth();
 if(currentView==='settings')main.innerHTML=settings();
 decorateZhixuR2(main);
}
function home(){
 const answered=summary?.answered||0;
 const recommended=summary?.recommended;
 return `<div class="page zx-home">
  <header class="zx-page-heading"><div class="zx-context">我的学习空间</div><h1>今天</h1><p>从自己的判断开始，发现更多可能。</p></header>
  <section class="zx-feature" aria-labelledby="zx-feature-title">
   <div class="zx-feature-copy"><span class="zx-kicker"><span class="zx-kicker-dot"></span> 正在学习 · 科学探究</span>
    <h2 id="zx-feature-title">微小的不同，<br>为什么会改变结果？</h2>
    <p>先作出预测，再用真实计算观察两条轨迹怎样分离。</p>
    <div class="zx-feature-actions">${button('继续探索 '+icon('arrow'),'enter-sensitivity','primary')}<span>初值敏感性 · Logistic</span></div>
   </div>
   <div class="zx-feature-graphic">${nativeLogisticPlot()}</div>
  </section>
  <section class="zx-home-grid" aria-label="学习概览">
   <div class="zx-section zx-continue">
    <div class="zx-section-heading"><h2>接着学</h2><span>循序渐进</span></div>
    <div class="zx-task-list">
     <button type="button" data-action="enter-sensitivity" class="zx-task-row">
      <span class="zx-task-icon zx-teal">${icon('brain')}</span><span class="zx-task-text"><strong>完成一次科学探究</strong><small>预测 → 实验 → 导师 → 迁移</small></span><span class="zx-chevron" aria-hidden="true">›</span>
     </button>
     <button type="button" data-action="go-library" class="zx-task-row">
      <span class="zx-task-icon zx-orange">${icon('pages')}</span><span class="zx-task-text"><strong>复习与错因</strong><small>${recommended?'有待巩固的概念':'根据真实作答生成复习建议'}</small></span><span class="zx-chevron" aria-hidden="true">›</span>
     </button>
     <button type="button" data-action="go-growth" class="zx-task-row">
      <span class="zx-task-icon zx-blue">${icon('chart')}</span><span class="zx-task-text"><strong>查看学习记录</strong><small>你的预测、证据与成长轨迹</small></span><span class="zx-chevron" aria-hidden="true">›</span>
     </button>
    </div>
   </div>
   <div class="zx-section zx-progress-panel">
    <div class="zx-section-heading"><h2>学习记录</h2><span>保存在此浏览器</span></div>
    <div class="zx-progress-summary"><strong>${answered}</strong><span>次题目作答</span></div>
    <p>${answered?'每一次独立判断，都是理解的证据。':'从第一道预测题开始，你的学习证据会留在这里。'}</p>
    ${button('查看我的进度 '+icon('arrow'),'go-growth','zx-quiet-link')}
   </div>
  </section>
  <section class="zx-section zx-course-section">
   <div class="zx-section-heading"><h2>探索课程</h2>${button('全部课程 '+icon('arrow'),'go-courses','zx-quiet-link')}</div>
   <div class="zx-course-grid">
    <button class="zx-course-card" data-action="enter-sensitivity" type="button"><span class="zx-course-art zx-chaos"><span class="zx-course-glyph">∿</span></span><span class="zx-course-info"><strong>混沌与非线性</strong><small>从微小初值到复杂变化</small></span><span class="zx-chevron">›</span></button>
    <button class="zx-course-card" data-action="enter-evo" type="button"><span class="zx-course-art zx-evo"><span class="zx-bio-cells" aria-hidden="true"><i></i><i></i><i></i></span></span><span class="zx-course-info"><strong>生命与演化</strong><small>在独立模拟中寻找证据</small></span><span class="zx-chevron">›</span></button>
   </div>
  </section>${baseFoot()}</div>`;
}
function courses(){
 const cs=summary?.concepts||[];
 const status=(key)=>cs.find(x=>x.id===key)?.status||'尚未评估';
 return `<div class="page zx-courses">
  <header class="zx-page-heading"><div class="zx-context">科学探究</div><h1>课程</h1><p>真正的理解，来自亲自验证。</p></header>
  <section class="zx-catalog" aria-label="已开放课程">
   <div class="zx-section-heading"><h2>开始探索</h2><span>2 个科学世界</span></div>
   <div class="zx-catalog-grid">
    <article class="zx-catalog-card zx-catalog-chaos"><div class="zx-catalog-art"><div class="zx-orbits" aria-hidden="true"><i></i><i></i><i></i></div><span>物理 · 动力系统</span></div>
     <div class="zx-catalog-copy"><h3>混沌与初值敏感性</h3><p>从一次猜测开始，观察相同方程下的两条轨迹。</p>
      <span class="zx-course-state">概念状态 · ${esc(status('chaos.sensitivity'))}</span>${button('开始这门课 '+icon('arrow'),'enter-sensitivity','primary')}</div></article>
    <article class="zx-catalog-card zx-catalog-evo"><div class="zx-catalog-art"><div class="zx-cell-field" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><span>生命 · 生态模拟</span></div>
     <div class="zx-catalog-copy"><h3>生命与演化</h3><p>比较真实运行的模拟，理解独立重复与推断边界。</p>
      <span class="zx-course-state">概念状态 · ${esc(status('evolution.inference'))}</span>${button('开始这门课 '+icon('arrow'),'enter-evo','primary')}</div></article>
   </div>
  </section>
  <section class="zx-section zx-knowledge"><div class="zx-section-heading"><h2>知识与进度</h2><span>根据真实学习记录</span></div>
   ${cs.length?groups(cs.map(x=>'<div class="list-row"><span class="list-icon">'+icon('brain')+'</span><div class="list-copy"><strong>'+esc(conceptName(x.id))+'</strong><small>'+esc(x.status)+' · '+x.attempts+' 次作答</small></div></div>')):infoMessage('完成第一次课程后，这里会显示真实的概念学习记录。')}
   <p class="quiet-note">知识状态以原版作答证据为准，不是自动生成的掌握度估计。</p>
  </section>${baseFoot()}</div>`;
}
function conceptName(id){
 return ({'chaos.same-rule':'相同规则下的变化','chaos.sensitivity':'初值敏感性','inquiry.control-variable':'控制变量与科学验证','evolution.independence':'独立重复','evolution.inference':'演化模拟的推断边界'})[id]||id;
}
function studyNav(){
 const labels=['先作判断','提出预测','实验与导师','独立迁移'];
 return '<aside class="study-rail" aria-label="学习步骤"><h3>本课学习路径</h3>'+labels.map((x,i)=>'<button class="study-stage" data-action="study-step" data-index="'+i+'" '+(i>lesson.highest?'disabled':'')+' data-current="'+(i===lesson.step?'true':'false')+'"><span class="stage-num">'+String(i+1).padStart(2,'0')+'</span>'+x+'</button>').join('')+'</aside>';
}
function learn(){
 const top=lesson.exp==='evo-pair'?'生命与演化':'混沌与初值敏感性';
 return '<div class="page zx-learning"><div class="eyebrow">知序私人教师 · '+top+'</div><h1 class="large-title">从判断开始，亲自验证</h1>'+
 '<div class="experiment-picker"><span class="subline">实验世界</span><lg-segmented id="experiment-segment" label="选择实验世界" value="'+lesson.exp+'" refraction="8" chroma="0.1"><button value="sensitivity">敏感性</button><button value="logistic">非线性</button><button value="evo-pair">生态演化</button></lg-segmented></div><div class="study-layout">'+studyNav()+
 '<article class="lesson-paper" id="lesson-paper">'+
 '<div class="inline-progress" aria-label="四阶段学习进度">'+[0,1,2,3].map(x=>'<span class="'+(x<=lesson.step?'active':'')+'"></span>').join('')+'</div>'+
 (lesson.step===0?stepPre():lesson.step===1?stepPredict():lesson.step===2?stepExperiment():stepTransfer())+
 '</article></div>'+baseFoot()+'</div>';
}
function stepPre(){
 if(!lesson.question){
 return '<div class="eyebrow">第一步 · 先独立思考</div><h2>关于这个世界，你已经知道什么？</h2><p class="lead">两道问题将帮助你建立初始判断。所有选项保持未选择；提交前不会揭示标准答案。</p>'+
 '<div class="math" aria-label="Logistic 迭代公式">xₙ₊₁ = r xₙ (1 − xₙ)</div>'+
 '<div class="callout"><p>这里的 xₙ 是第 n 次迭代时的状态，r 控制迭代规则。你不需要先背结论，先说出直觉。</p></div>'+
 '<div class="form-actions">'+button('加载原版真实前测题 '+icon('arrow'),'load-question')+'</div>';
 }
 return questionForm('pre',lesson.question,lesson.graded);
}
function questionForm(stage,q,graded){
 const opts=Array.isArray(q.options)?q.options:[];
 const title=q.prompt||q.question||q.text||'请回答当前问题';
 const questionIndex=stage==='pre'?lesson.preIndex:lesson.transferIndex;
 const totalQuestions=stage==='pre'?lesson.preQueue.length:lesson.transferQueue.length;
 const moreQuestions=questionIndex+1<totalQuestions;
 const nextAction=stage==='pre'?(moreQuestions?'next-pre':'next-prediction'):(moreQuestions?'next-transfer-question':'go-growth');
 const nextLabel=stage==='pre'?(moreQuestions?'继续下一道前测':'继续到科学预测'):(moreQuestions?'继续下一道迁移':'查看学习证据');

 return '<div class="eyebrow">'+(stage==='pre'?'第一步 · 独立前测':'第四步 · 独立迁移')+'</div>'+
 '<h2>'+esc(stage==='pre'?'先作出判断':'把理解迁移到新问题')+'</h2>'+'<div class="assessment-counter" aria-live="polite">第 '+((stage==='pre'?lesson.preIndex:lesson.transferIndex)+1)+' / '+Math.max(1,(stage==='pre'?lesson.preQueue:lesson.transferQueue).length)+' 题 · 真实题库</div>'+
 '<p class="lead">'+esc(title)+'</p>'+
 '<form id="quiz-form" data-stage="'+stage+'"><fieldset style="border:0;padding:0;margin:0" '+(graded?'disabled':'')+'>'+
 '<legend class="subline" style="margin:12px 0">请选择一项；默认不选</legend>'+
 opts.map((o,i)=>'<label class="answer"><input type="radio" name="answer" value="'+i+'" required '+(graded?.studentAnswer===i?'checked':'')+'><span>'+esc(o)+'</span></label>').join('')+
 '</fieldset>'+
 (graded?(stage==='pre'?'<div class="feedback"><strong>初始判断已记录</strong><p>答案暂不揭示。先做实验，再尝试独立迁移。</p></div>':'<div class="feedback '+(graded.gradedResult==='correct'?'success':'warning')+'"><strong>'+(graded.gradedResult==='correct'?'回答正确':'这道题还需要复习')+'</strong><p>'+esc(graded.feedback||graded.explanation||'已按原版标准完成评分。')+'</p></div>')+
 '<div class="form-actions">'+button(nextLabel+' '+icon('arrow'),nextAction)+'</div>'
 :'<div class="form-actions"><button class="primary" type="submit" disabled>提交独立答案 '+icon('arrow')+'</button></div>')+
 '</form><p class="quiet-note">原版真实题库评分，结果保存到同源 V2 学习记录。前测评分延迟反馈，避免提前透题。</p>';
}
function stepPredict(){
 return '<div class="eyebrow">第二步 · 提出自己的假设</div><h2>差一点点，结果会有多不同？</h2>'+
 '<p class="lead">'+(lesson.exp==='evo-pair'?'同样的演化模型，改变随机种子之后，合作策略的观测结果会稳定吗？':'对 Logistic 公式使用相同的参数 r，改变几乎看不见的初始值差异。你的预测是什么？')+'</p>'+
 (lesson.exp!=='evo-pair'?'<div class="math">xₙ₊₁ = r · xₙ · (1 − xₙ)</div><p>例如 r = 3.9、x₀ = 0.217，初始差值 δ = 10<sup>−10</sup>。这是真实计算的输入，不是预设的结果。</p>':'<div class="callout"><p>每次不同的随机种子是独立实验的关键；200 个时间步不能被当成 200 组独立样本。</p></div>')+
 '<form id="prediction-form">'+
 '<label class="field" for="prediction">先写下你的预测（必须填写）</label><textarea id="prediction" name="prediction" minlength="8" maxlength="500" placeholder="我认为……，因为……" required>'+esc(lesson.prediction)+'</textarea>'+
 (lesson.exp==='evo-pair'?'<label class="field" for="seed">起始种子</label><input type="number" name="seed" id="seed" value="12023" min="1" max="99999999">'
 :'<div class="two-col"><div><label class="field" for="r">参数 r</label><input type="number" id="r" name="r" min="3.3" max="4" step=".01" value="3.9"></div><div><label class="field" for="logdelta">log₁₀(δ)</label><input type="number" id="logdelta" name="logDelta" min="-14" max="-3" step="1" value="-10"></div></div>'+
 '<div class="two-col"><div><label class="field" for="x0">初值 x₀</label><input type="number" id="x0" name="x0" min=".0001" max=".9999" step="any" value=".217"></div><div><label class="field" for="steps">迭代次数</label><input type="number" id="steps" name="steps" min="20" max="300" step="1" value="150"></div></div>')+
 '<div class="form-actions"><button class="primary" type="submit">提交预测并真实计算 '+icon('arrow')+'</button></div></form>'+
 '<p class="quiet-note">只有完成预测后，才会真正调用原版科学计算引擎。预测被反例推翻不属于答题错误。</p>';
}
function drawPlot(plots){
 if(!Array.isArray(plots)||!plots.length)return '';
 const p=plots[0],series=(p.series||[]).slice(0,2),all=series.flatMap(s=>(s.points||[]).filter(pt=>Array.isArray(pt)&&pt.length>=2&&Number.isFinite(+pt[1])));
 if(!all.length)return '';
 const xmin=Math.min(...all.map(p=>+p[0])),xmax=Math.max(...all.map(p=>+p[0])),
 ymin=Math.min(...all.map(p=>+p[1])),ymax=Math.max(...all.map(p=>+p[1])),dx=xmax-xmin||1,dy=ymax-ymin||1;
 const path=pts=>pts.filter(pt=>Array.isArray(pt)&&Number.isFinite(+pt[1])).map(pt=>[(35+350*(+pt[0]-xmin)/dx).toFixed(2),(16+180*(1-(+pt[1]-ymin)/dy)).toFixed(2)].join(',')).join(' ');
 return '<div class="section-head"><h3>'+esc(p.title||'真实观测曲线')+'</h3></div>'+
 '<svg class="plot" viewBox="0 0 405 230" preserveAspectRatio="xMidYMid meet" role="img" aria-label="根据实际科学引擎数据绘制的实验曲线"><line x1="35" y1="199" x2="385" y2="199"></line><line x1="35" y1="16" x2="35" y2="199"></line>'+
 series.map((s,i)=>'<polyline class="'+(i?'alt':'')+'" points="'+path(s.points||[])+'"></polyline>').join('')+'</svg><div class="plot-label">'+series.map((s,i)=>(i?'橙色':'蓝色')+'：'+esc(s.label||'观测序列')).join('　·　')+'</div>';
}
function metricHtml(run){
 const metrics=(run?.metrics||[]).filter(x=>x.label);
 return '<div class="metrics-list">'+metrics.map(x=>'<div><strong>'+esc(typeof x.value==='number'&&Math.abs(x.value)<.0001?x.value.toExponential(2):String(x.value??'—').slice(0,20))+'</strong><span>'+esc(x.label)+' '+esc(x.unit||'')+'</span></div>').join('')+'</div>';
}
function evoHtml(run){
 if(run?.experiment!=='evo-pair'||!Array.isArray(run.results))return '';
 const num=n=>Number.isFinite(Number(n))?Number(n).toFixed(2):'—';
 return '<div class="section-head"><h3 class="section-title">两组独立种子的真实模拟结果</h3></div>'+
 '<div class="evo-table-wrap"><table class="data-table"><thead><tr><th>种子</th><th>合作条件</th><th>平均个体数</th><th>末次个体数</th></tr></thead><tbody>'+
 run.results.map(r=>'<tr><td>'+esc(r.seed)+'</td><td>'+esc(r.condition)+'</td><td>'+num(r.meanPopulation)+'</td><td>'+esc(r.endingPopulation)+'</td></tr>').join('')+
 '</tbody></table></div><div class="callout"><p>'+esc(run.warning||'仅能讨论这个模拟世界中的独立实验，不能推广为普遍生态规律。')+'</p></div>';
}
function evoResultsHtml(run){
 const rows=Array.isArray(run?.results)?run.results.filter(x=>x&&typeof x==='object'):[];
 if(!rows.length)return '';
 return '<div class="section-head"><h3 class="section-title">独立世界的实际观测</h3></div>'+
 '<p>这些数字由原版 EvoWorld 浏览器计算返回。随机种子区分独立模拟世界；一条轨迹中的200步不等于200个独立样本。</p>'+
 '<div class="table-scroll" tabindex="0" aria-label="生态演化观测表，可横向滚动"><table class="data-table"><thead><tr><th>随机种子</th><th>条件</th><th>平均个体数</th><th>结束时个体数</th></tr></thead><tbody>'+
 rows.map(x=>'<tr><td>'+esc(x.seed)+'</td><td>'+esc(x.condition)+'</td><td>'+esc(x.meanPopulation)+'</td><td>'+esc(x.endingPopulation)+'</td></tr>').join('')+
 '</tbody></table></div><p class="quiet-note">'+esc(run.warning||'模拟结果仅在当前条件成立，不直接证明普遍规律。')+'</p>';
}

function stepExperiment(){
 const run=lesson.approvedRun||lesson.run;
 if(!run)return '<div class="eyebrow">第三步 · 实验</div><h2>请先完成自己的预测</h2>'+button('返回预测','study-predict');
 const explain=lesson.mentor;
 return '<div class="eyebrow">第三步 · 观察真实科学证据</div>'+
 '<h2>实验，给出了怎样的答案？</h2>'+
 '<div class="callout"><p>这是原版计算引擎真实返回的观测，而不是 AI 编造的数据。实验记录已保存在本地学习事件中。</p></div>'+
 metricHtml(run)+drawPlot(run.plots)+evoResultsHtml(run)+evoHtml(run)+
 '<div class="section-head"><h3 class="section-title">知序博士 · 从证据到问题</h3></div>'+
 (!explain?'<p>现在可以让导师基于刚刚算出的数据继续追问。未授权真实模型时，默认只使用本地规则引导。</p>'+
 '<label class="answer"><input type="checkbox" id="mentor-authorize" value="1"><span>如果本会话已验证 AI 模型，我明确授权发送本次实验摘要（可能产生 API 费用）</span></label>'+
 '<label class="field" for="reflection">我的观察或疑问（可选）</label><textarea id="reflection" maxlength="500" placeholder="哪一点和你的原始预测不同？"></textarea>'+
 '<div class="form-actions">'+button('请导师引导我 '+icon('arrow'),'mentor')+'</div>'
 :'<div class="feedback"><strong>导师追问'+(explain.mode==='llm'?' · 实际 AI 回复':' · 规则引导')+'</strong>'+
 '<p>'+esc(explain.reply||explain.question||explain.observed||'')+'</p>'+
 (explain.suggestion?'<p><strong>下一步建议：</strong>'+esc(explain.suggestion)+'</p>':'')+
 (explain.fallbackReason?'<p>'+esc(explain.fallbackReason)+'</p>':'')+'</div>'+
 '<div class="form-actions">'+button('进行独立迁移 '+icon('arrow'),'next-transfer')+button('规划第二轮实验','propose-second','secondary')+'</div>')+
 (lesson.plan?'<div class="callout"><strong>候选实验 · 需批准</strong><p>'+esc(lesson.plan.studyQuestion||'')+'</p><p>'+esc(lesson.plan.why||'')+'</p>'+
 '<label class="field" for="second-prediction">对第二轮实验作出新的预测（至少八字，不能与首次相同）</label><textarea id="second-prediction" minlength="8" placeholder="第二轮我认为……"></textarea>'+
 '<div class="form-actions">'+button('批准并执行第二轮','approve-second')+'</div></div>':'')+
 (lesson.approvedRun?'<div class="feedback success"><strong>已批准、执行并验证第二轮计算</strong><p>真实第二轮实验结果已保存。对照结果来自原版相同科学引擎。</p></div>':'');
}
function stepTransfer(){
 if(!lesson.transfer)return '<div class="eyebrow">第四步 · 独立迁移</div><h2>离开刚才的参数，你还能作出判断吗？</h2>'+
 '<p class="lead">独立迁移题使用原版标准题库与评分依据，和前测一样只保存独立作答证据。</p>'+
 '<div class="form-actions">'+button('加载原版迁移题 '+icon('arrow'),'load-transfer')+'</div>';
 return questionForm('transfer',lesson.transfer,lesson.transferGrade);
}
function library(){
 const attempts=summary?.recentAttempts||[], tasks=(summary?.recommended?[summary.recommended]:[]),
 misconceptions=summary?.misconceptions||[];
 const due=lib?.getReviewTasks(store).filter(x=>x.status!=='dismissed')||[];
 return '<div class="page zx-library">'+intro('我的学习资料','资料与错题','这里显示真实的学习事件与自动生成的复习计划；完整的 AI 笔记生成尚未在原版上线。')+
 '<div class="section-head"><h2 class="section-title">待复习</h2><span class="subline">'+due.length+' 条真实任务</span></div>'+
 (due.length?groups(due.map((x,i)=>'<div class="list-row"><span class="list-icon">'+icon('pages')+'</span><div class="list-copy"><strong>'+esc(conceptName(x.conceptId))+'</strong><small>计划日期：'+esc(eventDate(x.dueAt))+' · '+esc(x.lastReason||x.reason)+'</small></div><button class="inline-link" data-action="review-task" data-review-index="'+i+'">开始</button></div>')):groups(['<div class="empty">还没有需要复习的题目。完成一次独立作答后，会根据真实结果给出建议。</div>']))+
 '<div class="section-head"><h2 class="section-title">最近的作答</h2><span class="subline">仅展示已评分题目</span></div>'+
 (attempts.length?groups(attempts.map(x=>'<div class="list-row"><span class="list-icon">'+icon('check')+'</span><div class="list-copy"><strong>'+esc(x.payload?.studentAnswerText||x.sourceQuestionId||'独立作答')+'</strong><small>'+esc(eventDate(x.occurredAt))+' · '+(x.payload?.gradedResult==='correct'?'正确':'需继续练习')+'</small></div></div>')):groups(['<div class="empty">暂无作答记录。学习开始后，你的真实答题会自动出现在这里。</div>']))+
 '<div class="section-head"><h2 class="section-title">可能的理解误区</h2><span class="subline">需要由你本人确认</span></div>'+
 (misconceptions.length?groups(misconceptions.slice(-10).reverse().map(x=>'<div class="list-row"><div class="list-copy"><strong>'+esc(x.payload?.reason||'一种待确认的理解假设')+'</strong><small>状态：'+esc(x.status)+' · '+esc(eventDate(x.occurredAt))+'</small></div>'+(x.status==='pending'?'<button class="inline-link" data-action="misconfirm" data-event="'+esc(x.eventId)+'">确认</button><button class="inline-link" data-action="misreject" data-event="'+esc(x.eventId)+'">不认同</button>':'')+'</div>')):groups(['<div class="empty">尚未形成误区候选。科学预测被实验反驳，不会自动变为错题。</div>']))+
 baseFoot()+'</div>';
}
function growth(){
 const s=summary||{explorations:0,answered:0,transfers:0,concepts:[],pendingConcepts:0};
 const events=(store?.events||[]).filter(x=>['question_attempt','hypothesis_test','review_action','lab_observation'].includes(x.kind)).slice(-12).reverse();
 return '<div class="page zx-growth">'+intro('学习成长','学习进度','所有数字来自本浏览器的实际学习事件，不是假设的掌握率、学习时长或学生效果数据。')+
 '<div class="data-metrics">'+
 '<div class="metric"><span>真实科学探索</span><strong>'+s.explorations+'</strong><p>有记录的独立实验</p></div>'+
 '<div class="metric"><span>独立作答</span><strong>'+s.answered+'</strong><p>前测、迁移与复习</p></div>'+
 '<div class="metric"><span>迁移尝试</span><strong>'+s.transfers+'</strong><p>完成的迁移作答</p></div></div>'+
 '<div class="section-head"><h2 class="section-title">知识状态</h2><span class="subline">基于作答证据，不等于掌握率</span></div>'+
 groups((s.concepts||[]).map(x=>'<div class="list-row"><div class="list-copy"><strong>'+esc(conceptName(x.id))+'</strong><small>'+esc(x.status)+'</small></div><span class="pill">'+x.attempts+' 次作答</span></div>'))+
 '<div class="section-head"><h2 class="section-title">最近的学习轨迹</h2></div>'+
 (events.length?'<div class="unified timeline">'+events.map(x=>'<div class="timeline-row"><strong>'+esc(eventTitle(x.kind))+'</strong><small>'+esc(eventDate(x.occurredAt))+'</small><p>'+esc(eventDescription(x))+'</p></div>').join('')+'</div>':groups(['<div class="empty">尚无学习事件。开始科学探究后，学习轨迹会自动出现。</div>']))+
 '<p class="quiet-note">原版 V2 本地学习记录可由你本人查看和导出；不是防篡改的学校考核数据库。</p></div>';
}
function eventTitle(type){return ({question_attempt:'完成独立题目',hypothesis_test:'预测与科学实验',review_action:'复习计划处理',lab_observation:'实验观测'})[type]||type;}
function eventDescription(e){
 if(e.kind==='question_attempt')return (e.payload?.gradedResult==='correct'?'题目正确':'需要复习')+' · '+(e.payload?.stage||'');
 if(e.kind==='hypothesis_test')return (e.payload?.predictionText||'真实预测').slice(0,85);
 return (e.payload?.reason||'学习过程已记录').slice(0,100);
}
function settings(){
 return '<div class="page zx-settings">'+intro('个人中心','设置','将学习空间调整为更适合你的节奏。')+
 '<div class="section-head"><h2 class="section-title">学习空间</h2></div>'+
 '<div class="unified settings-group">'+
 '<div class="setting-row"><div><strong>减少装饰性光学效果</strong><small>关闭封面动态光效和装饰，阅读内容保持清晰</small></div><button class="toggle" role="switch" aria-label="启用装饰性光学效果" aria-checked="'+pref.effect+'" data-action="toggle-effect"></button></div>'+
 '<div class="setting-row"><div><strong>重新开始课堂</strong><small>重置本次页面流程，不清空持久学习记录</small></div>'+button('重新开始','reset-lesson','inline-link')+'</div></div>'+
 '<div class="section-head"><h2 class="section-title">AI 与个人数据</h2></div>'+
 '<div class="unified settings-group">'+
 '<div class="setting-row"><div><strong>原版 DeepSeek 模型设置</strong><small>在原版安全配置界面自行填写并验证，绝不在本版展示 Key</small></div>'+button('在此连接','open-ai-config','inline-link')+'</div>'+
 '<div class="setting-row"><div><strong>当前导师方式</strong><small>'+(modelState?.mentorMode==='llm-configured'?'本会话已验证模型':'默认本地规则引导；在线模型必须每次单独授权')+'</small></div></div>'+
 '<div class="setting-row"><div><strong>导出原始学习事件</strong><small>下载 V2 JSON；保留可验证的事件结构</small></div>'+button('导出','export-data','inline-link')+'</div>'+
 '<div class="setting-row"><div><strong>清除本版学习记录</strong><small>仅删除 V2 数据，保留旧版 V1 备份；不可撤销</small></div>'+button('清除…','clear-data','inline-link')+'</div></div>'+
 '<div class="section-head"><h2 class="section-title">版本</h2></div>'+
 '<div class="unified settings-group"><div class="setting-row"><div><strong>知序 · Apple Edition</strong><small>视觉与交互层独立；共用原版业务能力和同源个人学习数据</small></div><span class="pill">Apple</span></div>'+
 '<div class="setting-row"><div><strong>Original Edition</strong><small>比赛版网页完整保留，没有被替换</small></div>'+link('查看原版','https://ndshuge.github.io/zhixu-ai-academy/original.html')+'</div></div>'+
 '<p class="quiet-note">隐私：学习记录存储在当前浏览器 localStorage。网页无法保证永久保留；请定期导出。此版本未增加服务器或用户账户。</p></div>';
}
async function handleAction(el){
 const action=el.dataset.action;
 if(['load-question','load-transfer','mentor','propose-second','approve-second','open-ai-config'].includes(action)&&!ready){
   showToast('正在连接原版科学引擎…');
   await engineReadyPromise;
   if(!ready)throw Error('科学引擎连接失败，可先阅读课程或返回原版学习');
 }
 if(action?.startsWith('go-')){setView(action.slice(3),{focus:true});return;}
 if(action==='enter-sensitivity'||action==='enter-evo'||action==='enter-logistic'){
   lesson=freshLesson();lesson.exp=action==='enter-evo'?'evo-pair':action==='enter-logistic'?'logistic':'sensitivity';
   setView('learn',{focus:true});return;
 }
 if(action==='reset-lesson'){lesson=freshLesson();setView('learn',{focus:true});return;}
 if(action==='study-step'){const n=Number(el.dataset.index);if(n<=lesson.highest){lesson.step=n;renderView();}return;}
 if(action==='study-predict'){lesson.step=1;renderView();return;}
 if(action==='next-pre'||action==='next-transfer-question'){
   const pre=action==='next-pre',ids=pre?lesson.preQueue:lesson.transferQueue;
   const index=pre?lesson.preIndex:lesson.transferIndex;
   if(index+1>=ids.length)throw Error('没有更多原版题目');
   const obj=await api('/api/learning/item?itemId='+encodeURIComponent(ids[index+1]));
   if(pre){lesson.preIndex++;lesson.question=obj;lesson.graded=null;}
   else{lesson.transferIndex++;lesson.transfer=obj;lesson.transferGrade=null;}
   renderView();return;
 }
 if(action==='next-prediction'){
   if(lesson.preQueue.length>1&&lesson.preResults.length<lesson.preQueue.length)throw Error('请先完成两道独立前测题');
   lesson.step=1;lesson.highest=Math.max(lesson.highest,1);renderView();return;
 }
 if(action==='next-transfer'){lesson.step=3;lesson.highest=Math.max(lesson.highest,3);renderView();return;}
 if(action==='load-question'||action==='load-transfer'){
   const stage=action==='load-question'?'pre':'transfer';
   const questions=await api('/api/learning/questions?stage='+stage+'&experiment='+encodeURIComponent(lesson.exp));
   const qs=(questions.questions||[]).slice(0,2);
   if(!qs.length)throw Error('原版题库没有这个阶段的题目，请选择其他实验。');
   const ids=qs.map(q=>q.itemId||q.id);
   const obj=await api('/api/learning/item?itemId='+encodeURIComponent(ids[0]));
   if(stage==='pre'){
     lesson.preQueue=ids;lesson.preIndex=0;lesson.preResults=[];lesson.question=obj;lesson.graded=null;
   }else{
     lesson.transferQueue=ids;lesson.transferIndex=0;lesson.transferResults=[];lesson.transfer=obj;lesson.transferGrade=null;
   }
   renderView();return;
 }
 if(action==='open-ai-config'){
   if(!ready||!frameWin||!frameWin.ZHIXU_PAGES_AI)throw new Error('原版模型连接界面尚未就绪');
   document.body.classList.add('show-original-engine');
   $('#modal-root').innerHTML='<div id="ai-config-shade" class="modal-backdrop"><button class="secondary" id="close-ai-config">完成配置并返回 Apple 版</button></div>';
   const dialog=frameWin.document.querySelector('#pages-ai-dialog');
   const opener=frameWin.document.querySelector('#pages-ai-open');
   if(opener)opener.click();else if(dialog)dialog.dataset.open='true';
   const done=async()=>{
    if(dialog)dialog.dataset.open='false';
    document.body.classList.remove('show-original-engine');
    $('#modal-root').replaceChildren();
    try{modelState=await api('/api/status');renderView();}catch{}
   };
   $('#close-ai-config').onclick=done;
   $('#ai-config-shade').onclick=e=>{if(e.target.id==='ai-config-shade')done();};
   return;
 }

 if(action==='mentor'){
   if(!lesson.run)throw Error('必须先完成真实实验');
   const auth=$('#mentor-authorize')?.checked===true;
   const note=$('#reflection')?.value?.trim()||'';
   lesson.mentor=await api('/api/mentor',{runId:(lesson.approvedRun||lesson.run).runId,note,shareApproved:auth});
   renderView();return;
 }
 if(action==='propose-second'){
   if(!lesson.run||!lesson.mentor)throw Error('先完成导师提问');
   lesson.plan=await api('/api/agent/plan',{runId:lesson.run.runId,goal:'仅改变一个变量，检验原有观察是否稳定。',mode:'rules'});
   renderView();return;
 }
 if(action==='approve-second'){
   const p=$('#second-prediction')?.value.trim();
   if(!p||p.length<8||p===lesson.prediction)throw Error('第二轮预测需至少8字，并且与第一次不同');
   lesson.approvedRun=await api('/api/agent/approve',{planId:lesson.plan.planId,prediction:p});
   if(lib){lib.recordHypothesis(store,lesson.approvedRun.runId,{experiment:lesson.exp,prediction:p,engineVersion:lesson.approvedRun.engineVersion,condition:lesson.approvedRun.condition,metrics:lesson.approvedRun.metrics,results:lesson.approvedRun.results,lineage:lesson.approvedRun.lineage},{sessionId});loadSummary();}
   lesson.plan=null;renderView();showToast('第二轮已运行并记录');return;
 }
 if(action==='export-data'){
   if(!lib)throw Error('原版数据模块尚未加载');
   const blob=new Blob([lib.exportLearning(store)],{type:'application/json'});
   const a=document.createElement('a'),href=URL.createObjectURL(blob);a.href=href;a.download='zhixu-learning-v2-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(href),2000);showToast('学习记录已导出');return;
 }
 if(action==='toggle-effect'){
   pref.effect=!pref.effect;localStorage.setItem(PREF_KEY,JSON.stringify(pref));
   document.documentElement.dataset.effect=pref.effect?'on':'off';renderView();return;
 }
 if(action==='clear-data'){modalConfirm('清除学习记录？','将删除当前浏览器知序 V2 学习事件。旧版 V1 历史备份不会删除。此操作不能撤销。',()=>{
    lib.clearLearning(localStorage);store=lib.loadLearning(localStorage);loadSummary();renderView();showToast('V2 学习记录已清除');
   });return;
 }
 if(action==='misconfirm'||action==='misreject'){
   if(!lib)return;lib.decideMisconception(store,el.dataset.event,action==='misconfirm'?'confirmed':'rejected');
   loadSummary();renderView();showToast('已记录你的判断');return;
 }
 if(action==='review-task'){
   const tasks=lib.getReviewTasks(store).filter(x=>x.status!=='dismissed'),t=tasks[Number(el.dataset.reviewIndex)];
   if(!t)throw Error('复习任务不存在');
   lesson=freshLesson();lesson.exp=t.conceptId.startsWith('evolution.')?'evo-pair':'sensitivity';
   setView('learn',{focus:true});showToast('已进入相关知识课程；请从独立题目开始');return;
 }
}
const sessionId=sessionStorage.getItem('zx-apple-session-v1')||crypto.randomUUID();
sessionStorage.setItem('zx-apple-session-v1',sessionId);
async function handleSubmit(form){
 if(!ready){showToast('正在连接原版科学引擎…');await engineReadyPromise;
   if(!ready)throw Error('原版业务引擎尚不可用，学习数据未提交');
 }
 if(form.id==='quiz-form'){
   const chosen=new FormData(form).get('answer');
   if(chosen===null)throw Error('请先选择一个答案');
   const q=form.dataset.stage==='transfer'?lesson.transfer:lesson.question;
   const g=await api('/api/learning/grade',{attemptToken:q.attemptToken,itemId:q.itemId||q.id,answer:Number(chosen)});
   if(form.dataset.stage==='transfer'){
     lesson.transferGrade=g;
     lesson.transferResults.push({itemId:q.itemId||q.id,gradedResult:g.gradedResult});
   }else{
     lesson.graded=g;
     lesson.preResults.push({itemId:q.itemId||q.id,gradedResult:g.gradedResult});
   }
   if(lib){lib.recordQuestionAttempt(store,g,{sessionId});loadSummary();}
   renderView();return;
 }
 if(form.id==='prediction-form'){
   const fd=new FormData(form),prediction=String(fd.get('prediction')||'').trim();
   if(prediction.length<8)throw Error('请用至少8字写下你的独立预测');
   const exp=lesson.exp;
   const params=exp==='evo-pair'?{seed:Number(fd.get('seed'))}:
     {r:Number(fd.get('r')),x0:Number(fd.get('x0')),steps:Number(fd.get('steps')),logDelta:Number(fd.get('logDelta'))};
   // Evo engine takes seed as top-level value; preserve original's contract.
   const payload=exp==='evo-pair'?{experiment:exp,prediction,seed:params.seed}:{experiment:exp,prediction,params};
   const run=await api('/api/run',payload);
   lesson.prediction=prediction;lesson.run=run;lesson.mentor=null;
   if(lib){lib.recordHypothesis(store,run.runId,{experiment:exp,prediction,engineVersion:run.engineVersion,condition:run.condition,metrics:run.metrics,results:run.results,lineage:run.lineage},{sessionId});loadSummary();}
   lesson.step=2;lesson.highest=Math.max(lesson.highest,2);renderView();showToast('已完成真实科学计算');return;
 }
 if(form.id==='transfer-form'){
   const chosen=new FormData(form).get('answer');if(chosen===null)throw Error('请先选择答案');
   const g=await api('/api/evaluate',{runId:lesson.run.runId,answer:Number(chosen)});
   lesson.transferGrade=g;
   // The original /api/evaluate returns just correctness/explanation, not a versioned rubric,
   // so it MUST NOT be passed to recordQuestionAttempt (which requires original grade contract).
   renderView();showToast('迁移题已按原版评分');return;
 }
}
function modalConfirm(title,body,yes){
 $('#modal-root').innerHTML='<div class="modal-backdrop"><section class="modal-card" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><h2 id="dialog-title">'+esc(title)+'</h2><p>'+esc(body)+'</p><div class="modal-actions"><button class="secondary" id="cancel-modal">取消</button><button class="primary" id="confirm-modal">确定</button></div></section></div>';
 const old=document.activeElement;
 $('#cancel-modal').focus();
 const close=()=>{$('#modal-root').replaceChildren();old?.focus?.();};
 $('#cancel-modal').onclick=close;
 $('#confirm-modal').onclick=()=>{close();yes();};
 $('.modal-backdrop').onclick=e=>{if(e.target.classList.contains('modal-backdrop'))close();};
}
document.addEventListener('click',async e=>{
 const b=e.target?.closest?.('[data-view],[data-action]');
 if(!b)return;
 e.preventDefault();
 if(b.dataset.view){setView(b.dataset.view,{focus:true});return;}
 if(busy)return;
 busy=true;b.disabled=true;
 try{await handleAction(b);}
 catch(err){showToast(err.message||'操作失败');console.error('[Zhixu Apple action]',err);}
 finally{busy=false;if(b.isConnected)b.disabled=false;}
});
document.addEventListener('submit',async e=>{
 if(!e.target?.matches?.('#quiz-form,#prediction-form,#transfer-form'))return;
 e.preventDefault();if(busy)return;busy=true;
 const b=e.submitter;if(b)b.disabled=true;
 try{await handleSubmit(e.target);}catch(err){showToast(err.message||'操作失败');console.error('[Zhixu Apple form]',err);}
 finally{busy=false;if(b?.isConnected)b.disabled=false;}
});
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&$('.modal-backdrop'))$('#cancel-modal')?.click();
 if(e.key==='Enter'&&e.target?.matches?.('button[data-action]'))e.target.click();
});
document.addEventListener('change',e=>{
 if(e.target?.matches('#quiz-form input[name=answer]')){const b=document.querySelector("#quiz-form button[type=submit]");if(b)b.disabled=!document.querySelector("#quiz-form input[name=answer]:checked");}
 if(e.target?.id==='experiment-segment'){
   const next=e.detail?.value;
   if(!['sensitivity','logistic','evo-pair'].includes(next)||next===lesson.exp)return;
   lesson=freshLesson();lesson.exp=next;renderView();showToast('已切换实验世界');
 }
});


/* Long-press / context-menu on real course tiles, with drag cancellation and keyboard alternative. */
let courseHold=null;
function openCourseContext(article){
 const selected=article.querySelector('[data-action^="enter-"]');
 if(!selected)return;
 const action=selected.dataset.action;
 const label=article.querySelector('h3')?.textContent||'当前课程';
 modalConfirm('课程快捷操作',label+'：是否进入这节真实科学探究课？',()=>handleAction({dataset:{action}}).catch(e=>showToast(e.message)));
}
function cancelCourseHold(){if(courseHold){clearTimeout(courseHold.timer);courseHold=null;}}
document.addEventListener('pointerdown',e=>{
 const tile=e.target?.closest?.('.course-world');
 if(!tile||e.target?.closest?.('button,a')||e.button!==0)return;
 cancelCourseHold();
 const item={tile,x:e.clientX,y:e.clientY,timer:null};
 item.timer=setTimeout(()=>{if(courseHold===item){courseHold=null;openCourseContext(tile);}},580);
 courseHold=item;
},{passive:true});
document.addEventListener('pointermove',e=>{
 if(courseHold&&(Math.abs(e.clientX-courseHold.x)>9||Math.abs(e.clientY-courseHold.y)>9))cancelCourseHold();
},{passive:true});
document.addEventListener('pointerup',cancelCourseHold,{passive:true});
document.addEventListener('pointercancel',cancelCourseHold,{passive:true});
document.addEventListener('contextmenu',e=>{
 const tile=e.target?.closest?.('.course-world');
 if(!tile)return;e.preventDefault();cancelCourseHold();openCourseContext(tile);
});
document.addEventListener('keydown',e=>{
 if(e.key==='F10'&&e.shiftKey){const tile=document.activeElement.closest('.course-world');if(tile){e.preventDefault();openCourseContext(tile);}}
});

document.addEventListener('input',e=>{if(e.target?.id==='prediction'){lesson.prediction=e.target.value;try{sessionStorage.setItem('zx-apple-lesson-v1',JSON.stringify(lesson));}catch{}}});
const initMotion=async()=>{
 // User-visible content does not depend on Motion CDN availability.
 try{
 const {animate,motionValue}=await import('./assets/motion.bundle.js');
 const pressed=new WeakMap();
 document.addEventListener('pointerdown',e=>{
  if(matchMedia('(prefers-reduced-motion:reduce)').matches)return;
  const el=e.target?.closest?.('.reading-hero .primary,.zx-feature .primary,.zx-catalog .primary,.lesson-paper .primary');
  if(!el)return;
  let state=pressed.get(el);if(!state){const v=motionValue(1);v.on('change',n=>el.style.transform='scale('+n+')');state={v};pressed.set(el,state);}
  animate(state.v,.967,{type:'spring',stiffness:510,damping:37});
 },{passive:true});
 const release=e=>{
  const el=e.target?.closest?.('.reading-hero .primary,.zx-feature .primary,.zx-catalog .primary,.lesson-paper .primary');
  const state=el&&pressed.get(el);if(state)animate(state.v,1,{type:'spring',stiffness:440,damping:31,velocity:state.v.getVelocity()});
 };
 document.addEventListener('pointerup',release,{passive:true});
 document.addEventListener('pointercancel',release,{passive:true});
 document.addEventListener('pointerleave',release,{passive:true});
 window.ZHIXU_APPLE_MOTION={engine:'Motion',animate,motionValue,interactivePress:true};
 }catch(error){window.ZHIXU_APPLE_MOTION={engine:'CSS fallback',reason:String(error)};}
};
async function boot(){
 document.documentElement.dataset.effect=pref.effect?'on':'off';
 initMotion(); // Nonblocking: SSR fallback is already readable.
 engineReadyPromise=attachOriginal();
 try{
  lib=await import(ORIGINAL+'learning-store.js');
  store=lib.loadLearning(localStorage);
  loadSummary();
 }catch(error){
  console.error('[Zhixu Apple data]',error);
  showToast('原版学习数据读取失败：'+error.message);
 }
 setView(location.hash.replace('#','')||'today',{initial:true});
 const success=await engineReadyPromise;
 if(success)document.documentElement.dataset.engineReady='true'; // Status is already conveyed in #bridge-state; no floating overlay over study text.
 else showToast('当前网络无法连接原版，可查看已保存的学习记录');
}
frame.addEventListener('error',()=>$('#bridge-state').textContent='加载原版科学引擎失败');
boot();
