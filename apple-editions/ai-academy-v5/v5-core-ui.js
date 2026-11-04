/* UI-only renderer for the separately verified PFL/EvoWorld teaching core.
   All numeric observations originate in core.snapshot().visualization.
   No model calls, scoring, persistence or Dock behavior are implemented here. */
const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const action=(name,label,primary=false,attrs='')=>'<button type="button" data-core-action="'+name+'" class="'+(primary?'primary':'quiet-button')+'" '+attrs+'>'+label+'</button>';
const note=s=>s?'<p class="quiet-note">'+esc(s)+'</p>':'';
const PHASE={idle:'准备实验',pretest:'独立判断',predict:'提出预测',ready:'批准实验',evidence:'观察证据',reflected:'迁移理解',transfer:'迁移验证',complete:'探究完成'};
const CORE_PHASE_STEPS={idle:0,pretest:0,predict:1,ready:1,evidence:2,reflected:3,transfer:3,complete:3};
export function coreStep(snapshot){return CORE_PHASE_STEPS[snapshot?.phase]??0}
const validPoint=p=>Array.isArray(p)&&p.length===2&&p.every(v=>typeof v==='number'&&Number.isFinite(v));
function lineGraph(view){
 const list=(view.series||[]).flatMap(s=>(s.points||[]).filter(validPoint));
 if(!list.length)return '<p class="quiet-note">本次原版数据没有可绘制的轨迹点，未生成模拟曲线。</p>';
 const minX=Math.min(...list.map(p=>p[0])),maxX=Math.max(...list.map(p=>p[0]));
 const minY=Math.min(...list.map(p=>p[1])),maxY=Math.max(...list.map(p=>p[1]));
 const toX=v=>20+360*(v-minX)/(maxX-minX||1),toY=v=>165-145*(v-minY)/(maxY-minY||1);
 const lines=(view.series||[]).map((s,si)=>{
  let d='',active=false;
  (s.points||[]).forEach(p=>{if(!validPoint(p)){active=false;return}d+=(active?'L':'M')+toX(p[0]).toFixed(2)+','+toY(p[1]).toFixed(2)+' ';active=true});
  return '<path d="'+esc(d.trim())+'" class="core-line-'+(si%4)+'" fill="none" stroke-width="2" stroke-linejoin="round"/>';
 }).join('');
 const picks=(view.series||[]).slice(0,3).map(s=>{
  const all=s.points||[],indices=[0,Math.floor(all.length/4),Math.floor(all.length/2),Math.floor(all.length*3/4),all.length-1];
  return [...new Set(indices)].filter(i=>validPoint(all[i])).map(i=>action('point',esc(s.label||'轨迹')+' · 第 '+i+' 步',false,'data-plot="'+view.plotIndex+'" data-series="'+s.seriesIndex+'" data-point="'+i+'"')).join('');
 }).join('');
 return '<figure class="core-figure"><figcaption>'+esc(view.title||'真实运行轨迹')+'</figcaption><svg class="core-line" viewBox="0 0 400 188" role="img" aria-label="'+esc(view.title||'原版实际轨迹')+'"><path d="M20 18V165H380" class="core-axis"/>'+lines+'</svg><p class="quiet-note">横轴：'+esc(view.xLabel||'迭代步')+' · 纵轴：'+esc(view.yLabel||'观测值')+'。缺失点保留空隙，不插值。</p><div class="core-point-actions" aria-label="选择原版轨迹点">'+picks+'</div></figure>';
}
function bars(view){
 const pairs=view.categories||[],series=view.series||[];
 const cols=pairs.slice(0,16).map((name,i)=>'<div class="core-bar-group"><strong>'+esc(name)+'</strong>'+series.map((s,k)=>{
  const n=Number(s.points?.[i]?.[1]),safe=Number.isFinite(n)?n:0;
  const max=Math.max(1,...series.flatMap(v=>v.points||[]).map(p=>Number(p?.[1])||0));
  return '<div class="core-bar-row"><span>'+esc(s.label)+'</span><i class="core-bar core-bar-'+(k%2)+'" style="--core-bar-width:'+Math.max(0,Math.min(100,safe/max*100)).toFixed(2)+'%"></i><b>'+esc(Number.isFinite(n)?n.toFixed(2):'无数据')+'</b></div>';
 }).join('')+'</div>').join('');
 return '<section class="core-bars" aria-label="'+esc(view.title||'真实世界对照')+'"><h3>'+esc(view.title)+'</h3>'+cols+'</section>';
}
function realEvidence(s){
 const vis=s.visualization;
 if(!vis?.evidence||!vis.sourceRunId)return '<p class="quiet-note">等待原版科学引擎返回有来源的结果。</p>';
 const metrics=(vis.metrics||[]).slice(0,12).map(m=>'<div class="core-metric"><strong>'+esc(m.label)+'</strong><span>'+esc(m.value)+' '+esc(m.unit||'')+'</span></div>').join('');
 const views=(vis.views||[]).map(v=>v.kind==='line'?lineGraph(v):v.kind==='grouped-bar'?bars(v):'').join('');
 const pairs=(vis.pairs||[]).map(p=>action('pair','种子 '+esc(p.seed)+' · 开启 '+esc(p.cooperationOn?.meanPopulation)+' / 关闭 '+esc(p.cooperationOff?.meanPopulation),false,'data-seed="'+esc(p.seed)+'"')).join('');
 const selected=s.selection||s.selectedPair;
 return '<section class="core-evidence" aria-label="原版真实科学数据"><p class="core-kicker">原版科学引擎 · 真实记录</p><p class="quiet-note">Run ID：'+esc(vis.sourceRunId)+'。所有点和配对均来自本次运算。</p><div class="core-metrics">'+metrics+'</div>'+views+(pairs?'<h3>观察一个真实配对世界</h3><div class="core-point-actions">'+pairs+'</div>':'')+(selected?'<div class="core-selection" role="status">已选择真实观察：'+esc(selected.seriesLabel||selected.seed||'实验点')+' · '+esc(selected.x??selected.deltaMeanPopulation??'')+' / '+esc(selected.y??'')+'</div>':'')+(vis.limitations||[]).map(v=>note('实验限制：'+v)).join('')+'</section>';
}
const fields=(s)=>s.experimentId==='evo-pair'?'<label class="field">真实随机种子<input name="seed" type="number" min="1" max="99999999" value="12023" required></label>':'<div class="core-params"><label class="field">增长参数 r<input name="r" type="number" min="0" max="4" step=".01" value="3.9" required></label><label class="field">初值 x₀<input name="x0" type="number" min="0" max="1" step=".000001" value=".217" required></label><label class="field">步数<input name="steps" type="number" min="20" max="600" value="150" required></label><label class="field">微小扰动 logDelta<input name="logDelta" type="number" min="-14" max="-2" value="-10" required></label></div>';
function question(s,kind){
 const q=s.question;
 if(!q)return '<p>原版题目正在加载。</p>';
 return '<h2>'+esc(q.prompt)+'</h2><form data-core-form="'+kind+'"><fieldset class="answer-group"><legend>先独立作答，默认不选</legend>'+(q.options||[]).map((o,i)=>'<label class="answer-option"><input name="answer" type="radio" value="'+i+'" required><span>'+esc(o)+'</span></label>').join('')+'</fieldset><div class="form-actions"><button class="primary" type="submit" disabled>提交我的判断</button></div></form>'+note(kind==='pre'?'前测提交后不公开标准答案。':'迁移题由原版科学题库真实评分。');
}
function coaching(s){
 return '<section class="core-guide"><h3>知序博士 · 实验追问</h3><p class="quiet-note">可以先用规则引导；发送真实模型需要你本次勾选授权，并且此前已验证连接。</p><form data-core-form="coach"><label class="field">我想追问的科学问题<textarea name="question" minlength="2" maxlength="300" required placeholder="哪些观察最有助于检验我的预测？"></textarea></label><label class="core-check"><input type="checkbox" name="shareApproved"> 我本次同意向已验证模型发送必要学习上下文</label><button class="secondary" type="submit">向博士追问</button></form>'+(s.coaching?'<div class="core-coaching"><strong>'+(s.coaching.mode==='llm'?'经验证的真实 AI':'规则引导')+'</strong><p>'+esc(s.coaching.reply||'')+'</p>'+(s.coaching.fallbackReason?note('模型不可用，本次已回退规则引导。'):'')+'</div>':'')+'</section>';
}
function evidenceStage(s){
 return realEvidence(s)+
 '<section class="core-guide"><h3>解释这一轮观察</h3><form data-core-form="mentor"><label class="field">我想追问原版导师<textarea name="note" minlength="2" maxlength="500" required placeholder="我观察到……，这个现象说明什么？"></textarea></label><label class="core-check"><input type="checkbox" name="shareApproved"> 本次允许已验证模型使用实验上下文</label><button class="secondary" type="submit">请求实验导师</button></form>'+(s.mentor?'<div class="core-coaching"><strong>'+(s.mentor.mode==='llm'?'经验证的 AI 导师':'原版规则导师')+'</strong><p>'+esc(s.mentor.reply||s.mentor.question||s.mentor.observed||'')+'</p></div>':'')+
 (s.mentor&&!s.comparison?'<form data-core-form="propose"><label class="field">第二次实验要检验的问题<input name="goal" minlength="4" maxlength="300" required placeholder="只改变一个变量，检验稳定性"></label><button class="quiet-button" type="submit">设计单变量对照</button></form>':'')+
 (s.comparisonPlan?'<div class="core-approval"><p>'+esc(s.comparisonPlan.studyQuestion||s.comparisonPlan.goal)+'</p><p>计划仅供审核，未经批准不会执行。</p><form data-core-form="approve"><label class="field">第二次独立预测<textarea name="prediction" minlength="8" maxlength="500" required></textarea></label><button class="primary" type="submit">批准并运行一次对照实验</button></form></div>':'')+
 (s.comparison?'<div class="core-selection"><strong>第二次真实实验已执行</strong>'+note('Run ID：'+s.comparison.runId)+((s.comparison.visualization)?'<p>第二次观察：</p>'+realEvidence({visualization:s.comparison.visualization}):'')+'</div>':'')+
 (s.comparisonApprovalUncertain?'<p class="core-warning">请求结果不确定，已禁止自动重试。请先核对原版记录。</p>':'')+
 '</section><section class="core-guide"><h3>写下独立观察</h3><form data-core-form="reflection"><label class="field">实验数据与原来的预测有什么关系？<textarea name="reflection" minlength="8" maxlength="500" required placeholder="原本我预计……，实际数据让我发现……"></textarea></label><button type="submit" class="primary">保存反思，继续迁移</button></form></section>'+coaching(s);
}
function view(s){
 switch(s.phase){
  case 'pretest':return question(s,'pre');
  case 'predict':return '<h2>先提出能够被验证的猜想</h2><form data-core-form="prediction"><label class="field">我的独立预测<textarea name="prediction" required minlength="8" maxlength="500" placeholder="我预计……因为……"></textarea></label>'+fields(s)+'<button type="submit" class="primary">保存预测，检查实验条件</button></form>'+coaching(s);
  case 'ready':return '<h2>确认真实科学实验</h2><div class="core-approval"><p>'+esc(s.prediction?.text||'')+'</p>'+note('参数：'+JSON.stringify(s.prediction?.params||{}))+'<p>只有你点击下方按钮才会运行正式科学引擎。</p>'+action('run','我批准运行本次实验',true)+'</div>'+coaching(s);
  case 'evidence':return evidenceStage(s);
  case 'reflected':return realEvidence(s)+'<div class="core-coaching"><p>独立反思已'+(s.reflection?.saved?'写入 V2 原版学习事件':'完成')+'。</p>'+action('transfer','进入迁移问题',true)+'</div>'+ (s.mentor?'<div class="core-coaching">'+esc(s.mentor.reply||'')+'</div>':'')+coaching(s);
  case 'transfer':return '<h2>换个情境，自己判断</h2>'+question(s,'transfer');
  case 'complete':return '<h2>本次探究已记录</h2><div class="core-coaching"><strong>原版迁移判定：'+esc(s.transfer?.gradedResult||'已提交')+'</strong><p>'+esc(s.transfer?.feedback||'')+'</p></div>'+note('记录源自原版科学引擎和真实作答，不能直接证明学习效果或知识状态。')+action('restart','开始下一轮独立探究');
  default:return '<h2>准备连接原版科学引擎</h2><p class="quiet-note">连接中或暂时不可用时，可主动重试；不会生成模拟实验结果。</p><button type="button" class="secondary" data-action="retry-core">重新连接实验</button>';
 }
}
export function renderCore(snapshot){
 const s=snapshot||{phase:'idle'};
 const phase=PHASE[s.phase]||'科学探究',name=s.experimentId==='evo-pair'?'EvoWorld · 独立重复':'PFL · 初值敏感性';
 return '<div class="learning-page core-learning" data-core-phase="'+esc(s.phase)+'"><div class="learning-header"><span class="eyebrow">'+name+'</span><button class="quiet-button" type="button" data-action="exit-focus">退出学习</button></div><header class="page-intro"><h1>'+phase+'</h1><p>前测 → 预测 → 真实科学计算 → 独立观察 → 迁移验证</p></header><div class="progress-strip" role="progressbar" aria-label="科学探究阶段" aria-valuemin="0" aria-valuemax="3" aria-valuenow="'+Math.max(0,Math.min(3,coreStep(s)))+'" aria-valuetext="'+esc(phase)+'">'+[0,1,2,3].map(i=>'<span class="'+(i<=coreStep(s)?'done':'')+'"></span>').join('')+'</div><article class="learning-paper">'+view(s)+'</article></div>';
}
export function coreOutline(s){
 const step=coreStep(s);
 return ['独立判断','提出预测','真实观察','迁移验证'].map((title,i)=>'<div class="outline-row '+(step===i?'is-active':'')+'"><strong>'+String(i+1).padStart(2,'0')+' '+title+'</strong><small>'+(step===i?'正在进行':step>i?'已完成':'尚未开始')+'</small></div>').join('');
}
