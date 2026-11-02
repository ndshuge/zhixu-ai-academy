/* V4 independently authored view templates: Books-like library and Notes-like reading. */
import {conceptNames} from './bridge.js';
export const titles={today:'今天',courses:'课程',learn:'私人教师',library:'资料与错题',growth:'学习进度',settings:'设置'};
export const esc=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const glyph=id=>'<svg aria-hidden="true"><use href="#i-'+id+'"/></svg>';
const click=(label,action,primary=false,extra='')=>'<button type="button" data-action="'+action+'" class="'+(primary?'primary':'quiet-button')+'" '+extra+'>'+label+'</button>';
const next=glyph('arrow');
const heading=(micro,title,sub='')=>'<header class="page-intro"><div class="eyebrow">'+esc(micro)+'</div><h1>'+esc(title)+'</h1>'+(sub?'<p>'+esc(sub)+'</p>':'')+'</header>';
const shelf=()=>'<div class="shelf"><button class="book-tile" data-action="enter-sensitivity"><div class="book-cover chaos"><i class="cover-shape"></i><span>混沌<br>与非线性</span></div><span class="book-copy"><strong>混沌与初值敏感性</strong><span>一个微小的差异，如何引发不同的轨迹？</span><small>物理 · 动力系统</small></span></button><button class="book-tile" data-action="enter-evo"><div class="book-cover evolution"><i class="cover-shape"></i><span>生命<br>与演化</span></div><span class="book-copy"><strong>生命与演化</strong><span>用独立实验理解模拟能告诉我们的事。</span><small>生物 · 演化模型</small></span></button></div>';
export function logisticChart(){
 let a=.41200,b=.41201;const A=[],B=[];for(let i=0;i<66;i++){A.push(a);B.push(b);a=3.9*a*(1-a);b=3.9*b*(1-b)}
 const path=xs=>xs.map((v,i)=>(i?'L':'M')+(16+i*5.45).toFixed(1)+' '+(153-v*135).toFixed(1)).join(' ');
 return '<div class="preview-paper"><div class="preview-label"><strong>初值敏感性</strong><span>Logistic · r=3.9</span></div><svg class="mini-chart" viewBox="0 0 390 178" aria-label="真实公式计算的六十六轮 Logistic 对照轨迹" role="img"><line class="gridline" x1="16" y1="52" x2="370" y2="52"/><line class="gridline" x1="16" y1="105" x2="370" y2="105"/><line class="gridline" x1="16" y1="153" x2="370" y2="153"/><path class="line-a" d="'+path(A)+'"/><path class="line-b" d="'+path(B)+'"/></svg><div class="chart-legend"><span><i></i>x₀=0.41200</span><span><i></i>x₀=0.41201</span></div></div>';
}
const countRow=(num,label)=>'<div class="metric"><strong>'+esc(num)+'</strong><span>'+esc(label)+'</span></div>';
export function today({bridge}){
 const s=bridge.summary||{},answered=s.answered||0,explorations=s.explorations||0;
 return heading('我的学习空间','今天','从一个问题开始，亲自发现答案。')+
 '<div class="section-bar first-section"><h2>继续学习</h2><span>上次读到这里</span></div>'+
 '<section class="reading-feature"><div class="reading-book" aria-hidden="true"><div class="reading-book-curve"><i></i><i></i><i></i></div><span>混沌<br>与非线性</span></div>'+
 '<div class="reading-feature-copy"><div class="eyebrow">科学探究 · 第一章</div><h2>微小的不同，<br>为什么会改变结果？</h2><p>先给出你的预测，再用真实计算探索初值敏感性。</p>'+
 click('继续阅读 '+next,'enter-sensitivity',true)+'</div></section>'+
 '<div class="section-bar"><h2>探索课程</h2>'+click('查看全部 '+next,'nav-courses')+'</div>'+shelf()+
 '<div class="section-bar"><h2>今天的发现</h2><span>一个真实的科学问题</span></div>'+
 '<button class="discovery-row" data-action="enter-sensitivity"><div class="discovery-content"><span class="eyebrow">观察与猜想</span><strong>为什么几乎相同的初值，会产生不同的结果？</strong><small>Logistic 模型 · 独立预测之后验证</small></div><span class="discovery-arrow">'+next+'</span></button>'+
 '<div class="section-bar"><h2>学习记录</h2><span>真实学习事件</span></div><div class="metrics">'+countRow(explorations,'独立实验')+countRow(answered,'已作答题目')+countRow(s.transfers||0,'迁移尝试')+'</div>'+
 '<p class="quiet-note">知序记录真实的判断与验证，不用虚构学习时长或掌握率装饰界面。</p>';
}
export function courses({bridge}){
 const s=bridge.summary||{},concepts=s.concepts||[];
 return heading('科学探究','课程','选择一个科学世界，从真实问题开始。')+
 shelf()+
 '<div class="section-bar"><h2>知识目录</h2><span>按照学习证据更新</span></div>'+
 (concepts.length?'<div class="simple-rows">'+concepts.map(c=>'<div class="simple-row"><div class="row-meta"><strong>'+esc(conceptNames[c.id]||c.id)+'</strong><small>'+esc(c.status)+'</small></div><span class="count-number">'+esc(c.attempts)+' 次</span></div>').join('')+'</div>':'<div class="empty-state"><strong>你的课程从这里开始</strong>第一次作答后，这里会显示真实的概念学习状态。</div>');
}
const steps=['独立判断','提出预测','实验与导师','迁移验证'];
const controls=l=>'<div class="progress-strip" aria-label="四阶段学习进度">'+steps.map((x,i)=>'<span class="'+(i<=l.step?'done':'')+'" title="'+x+'"></span>').join('')+'</div>';
const selected=x=>Number.isFinite(x)?x:undefined;
function quiz(stage,l){
 const isPre=stage==='pre',q=isPre?l.question:l.transfer,g=isPre?l.grade:l.transferGrade,queue=isPre?l.preIds:l.transferIds,index=isPre?l.preIndex:l.transferIndex;
 if(!q)return '<p>从原版题库抽取真实题目，提交前不揭示标准答案。</p>'+click('加载原版'+(isPre?'前测':'迁移')+'题 '+next,isPre?'load-question':'load-transfer',true);
 const opts=Array.isArray(q.options)?q.options:[];
 const submitted=g!==null;
 const feedback= !submitted?'':isPre?'<div class="feedback"><strong>初始判断已记录</strong><p>答案将在后续实验与迁移中再验证，不在前测阶段提前泄露。</p></div>':
 '<div class="feedback '+(g.gradedResult==='correct'?'':'warn')+'"><strong>'+(g.gradedResult==='correct'?'回答正确':'这道题需要复习')+'</strong><p>'+esc(g.feedback||g.explanation||'已由原版科学题库判定。')+'</p></div>';
 const more=index+1<queue.length;
 return '<p class="lesson-eyebrow">第 '+(index+1)+' / '+queue.length+' 道 · 原版科学题库</p><h2>'+esc(q.prompt||q.question||q.text||'请作出判断')+'</h2>'+
 '<form id="quiz-form" data-stage="'+stage+'"><fieldset class="answer-group" '+(submitted?'disabled':'')+'><legend>请选择一个答案，默认不选</legend>'+
 opts.map((o,i)=>'<label class="answer-option"><input type="radio" name="answer" value="'+i+'" required '+((submitted&&selected(g.studentAnswer)===i)?'checked':'')+'><span>'+esc(o)+'</span></label>').join('')+'</fieldset>'+
 feedback+(submitted?'<div class="form-actions">'+click(more?'下一道题 '+next:isPre?'提出自己的预测 '+next:'查看学习证据 '+next,more?(isPre?'next-pre':'next-transfer-question'):(isPre?'next-prediction':'nav-growth'),true)+'</div>':
 '<div class="form-actions"><button class="primary" type="submit" disabled>提交我的判断 '+next+'</button></div>')+'</form><p class="quiet-note">原版题目与令牌单次有效；前测不提供即时标准答案。</p>';
}
function predict(l){
 return '<p class="lesson-eyebrow">02 · 提出预测</p><h2>你认为会发生什么？</h2>'+
 '<p>先独立写下想法，再交给真实科学引擎计算。不能跳过预测直接看答案。</p>'+
 (l.experiment==='evo-pair'?'<div class="callout"><p>生态模拟每次改变随机种子，观察独立重复如何影响结果。</p></div>':'<div class="math-card">xₙ₊₁ = r xₙ (1 − xₙ)</div>')+
 '<form id="prediction-form"><label class="field" for="prediction">我的预测 · 至少 8 个字</label><textarea id="prediction" name="prediction" required minlength="8" maxlength="500" placeholder="我认为……因为……">'+esc(l.prediction)+'</textarea>'+
 (l.experiment==='evo-pair'?'<label class="field" for="seed">实验种子</label><input id="seed" type="number" name="seed" value="12023" min="1" max="99999999" required>':
 '<div class="two-cols"><div><label class="field" for="r">增长参数 r</label><input id="r" type="number" name="r" value="3.9" min="3.3" max="4" step=".01"></div><div><label class="field" for="logDelta">log₁₀(初值差异)</label><input id="logDelta" type="number" name="logDelta" value="-10" min="-14" max="-3"></div><div><label class="field" for="x0">初值 x₀</label><input id="x0" type="number" name="x0" value=".217" min=".0001" max=".9999" step="any"></div><div><label class="field" for="steps">迭代轮数</label><input id="steps" type="number" name="steps" value="150" min="20" max="300"></div></div>')+
 '<div class="form-actions"><button class="primary" type="submit">提交预测并运行实验 '+next+'</button></div></form>';
}
function resultsPlot(run){
 const plots=run?.plots;if(!plots?.length)return '';
 const groups=(plots[0].series||[]).slice(0,2).map(g=>({...g,points:(g.points||[]).slice(0,88)}));
 const points=groups.flatMap(g=>(g.points||[]).filter(p=>Array.isArray(p)&&Number.isFinite(+p[1])));
 if(!points.length)return '';
 const x0=Math.min(...points.map(p=>+p[0])),x1=Math.max(...points.map(p=>+p[0])),y0=Math.min(...points.map(p=>+p[1])),y1=Math.max(...points.map(p=>+p[1])),dx=x1-x0||1,dy=y1-y0||1;
 const line=pts=>(pts||[]).filter(p=>Array.isArray(p)&&Number.isFinite(+p[1])).map(p=>(35+370*(+p[0]-x0)/dx).toFixed(1)+','+(12+173*(1-(+p[1]-y0)/dy)).toFixed(1)).join(' ');
 return '<div class="plot-chart"><strong>'+esc(plots[0].title||'科学观测曲线')+'</strong><svg viewBox="0 0 435 212" role="img" aria-label="原版科学引擎计算的实际观测曲线"><line x1="35" y1="194" x2="410" y2="194"/>'+groups.map((g,i)=>'<polyline class="'+(i?'alt':'')+'" points="'+line(g.points)+'"/>').join('')+'</svg><div class="chart-legend">'+groups.map(g=>'<span>'+esc(g.label||'观测系列')+'</span>').join('　')+'</div><p class="plot-note">仅展示前 88 次迭代，以便观察分离；原版实验数据完整保留。</p></div>';
}
function scienceRun(l){
 const run=l.approvedRun||l.run;
 if(!run)return '<p>请先提出预测再运行科学实验。</p>'+click('返回预测','step-predict',true);
 const metrics=run.metrics||[];
 const formatMetric=v=>typeof v==='number'?(Math.abs(v)>0&&Math.abs(v)<.0001?v.toExponential(2):Number(v.toPrecision(5)).toLocaleString('zh-CN')):String(v??'—');
 return '<p class="lesson-eyebrow">03 · 观察科学证据</p><h2>实验已经给出结果</h2><p>以下数据来自原版科学引擎的实际执行，而不是 AI 生成的观察。</p>'+
 (metrics.length?'<div class="simple-rows">'+metrics.map(m=>'<div class="simple-row"><div class="row-meta"><strong>'+esc(m.label)+'</strong><small>'+esc(m.unit||'')+'</small></div><span class="count-number">'+esc(formatMetric(m.value))+'</span></div>').join('')+'</div>':'')+
 resultsPlot(run)+ (run.results?.length?'<div class="simple-rows">'+run.results.slice(0,10).map(x=>'<div class="simple-row"><div class="row-meta"><strong>实验种子 '+esc(x.seed)+'</strong><small>'+esc(x.condition||'独立实验')+'</small></div><span class="count-number">'+esc(x.endingPopulation||'—')+'</span></div>').join('')+'</div>':'')+
 '<div class="section-bar"><h2>向知序博士追问</h2></div>'+
 (!l.mentor?'<p>规则导师默认可用。若已经验证 DeepSeek 且明确授权，才能发送当前实验摘要给真实模型。</p>'+
 '<label class="answer-option"><input id="mentor-authorize" type="checkbox"><span>我明确同意本次向已验证的 AI 模型发送实验摘要（可能产生 API 费用）</span></label><label class="field" for="reflection">我的观察或疑问（可选）</label><textarea id="reflection" maxlength="500" placeholder="为什么我的预测与观测不同？"></textarea><div class="form-actions">'+click('让导师追问 '+next,'mentor',true)+'</div>':
 '<div class="feedback"><strong>'+(l.mentor.mode==='llm'?'已验证的 AI 导师':'规则导师')+'</strong><p>'+esc(l.mentor.reply||l.mentor.question||l.mentor.observed||'')+'</p>'+(l.mentor.suggestion?'<p>'+esc(l.mentor.suggestion)+'</p>':'')+'</div><div class="form-actions">'+click('迁移到新问题 '+next,'next-transfer',true)+click('设计第二次实验','propose-second')+'</div>')+
 (l.plan?'<div class="callout"><p>'+esc(l.plan.studyQuestion||l.plan.why||'修改一个变量重新实验')+'</p></div><label class="field" for="second-prediction">第二次的独立预测</label><textarea id="second-prediction" minlength="8" placeholder="这次我认为……"></textarea>'+click('批准并运行第二次实验','approve-second',true):'');
}
export function learn({lesson}){
 const l=lesson;
 const expLabels={sensitivity:'敏感性',logistic:'非线性', 'evo-pair':'生态演化'};
 return '<div class="learning-page">'+
 '<div class="learning-header"><span class="eyebrow">知序私人教师 · 科学探究</span>'+click('重新开始','reset-lesson')+'</div>'+
 '<header class="page-intro"><h1>从判断开始，亲自验证</h1><p>每次只完成一个学习阶段。真实计算，真实记录。</p></header>'+
 '<div class="experiment-tabs" aria-label="切换实验">'+Object.entries(expLabels).map(([id,label])=>'<button data-experiment="'+id+'" class="'+(l.experiment===id?'is-active':'')+'" aria-pressed="'+(l.experiment===id)+'">'+label+'</button>').join('')+'</div>'+
 controls(l)+
 '<article class="learning-paper">'+(l.step===0?'<p class="lesson-eyebrow">01 · 独立判断</p><h2>关于这个世界，你已经知道什么？</h2>'+quiz('pre',l):l.step===1?predict(l):l.step===2?scienceRun(l):'<p class="lesson-eyebrow">04 · 独立迁移</p><h2>换一种情境，你还会判断吗？</h2>'+quiz('transfer',l))+
 '</article><p class="quiet-note">学习过程受原版科学、题库及版本化学习证据记录约束。此界面不改变评分方式。</p></div>';
}
const formatTime=s=>{if(!s)return '未记录日期';const d=new Date(s);return Number.isFinite(+d)?d.toLocaleString('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}):'日期未知';};
export function library({bridge}){
 const s=bridge.summary||{},due=bridge.tasks(),attempts=s.recentAttempts||[],mis=s.misconceptions||[];
 return heading('学习档案','资料与错题','复习计划由真实作答生成；未经核实的误解需要你确认。')+
 '<div class="section-bar"><h2>待复习</h2><span>'+due.length+' 项任务</span></div>'+
 (due.length?'<div class="simple-rows">'+due.map((t,i)=>'<button class="simple-row" data-action="review-task" data-index="'+i+'"><span class="row-meta"><strong>'+esc(conceptNames[t.conceptId]||t.conceptId)+'</strong><small>'+esc(t.lastReason||t.reason||'需要巩固')+' · '+formatTime(t.dueAt)+'</small></span>'+glyph('i-chevron'.replace('i-',''))+'</button>').join('')+'</div>':'<div class="empty-state"><strong>暂时没有需要复习的题目</strong>完成独立作答后，这里会根据真实记录生成建议。</div>')+
 '<div class="section-bar"><h2>最近的作答</h2></div>'+
 (attempts.length?'<div class="simple-rows">'+attempts.map(a=>'<div class="simple-row"><span class="row-meta"><strong>'+esc(a.payload?.studentAnswerText||a.sourceQuestionId||'已提交作答')+'</strong><small>'+formatTime(a.occurredAt)+'</small></span></div>').join('')+'</div>':'<div class="empty-state">还没有作答记录。从第一道题开始。</div>')+
 '<div class="section-bar"><h2>可能的理解误区</h2></div>'+
 (mis.length?mis.slice(-12).reverse().map(m=>'<div class="review-item"><strong>'+esc(m.payload?.reason||'需要核实的误解')+'</strong><small>状态：'+esc(m.status||'待核实')+'</small>'+(m.status==='pending'?'<div class="form-actions">'+click('确认','misconfirm',false,'data-event="'+esc(m.eventId)+'"')+click('不认同','misreject',false,'data-event="'+esc(m.eventId)+'"')+'</div>':'')+'</div>').join(''):'<div class="empty-state">尚无待确认误区；科学预测被否定不等于学生犯错。</div>');
}
export function growth({bridge}){
 const s=bridge.summary||{},events=(bridge.store?.events||[]).filter(e=>['question_attempt','hypothesis_test','review_action','lab_observation'].includes(e.kind)).slice(-12).reverse();
 const names={question_attempt:'完成题目作答',hypothesis_test:'独立预测与实验',review_action:'复习记录',lab_observation:'科学观察'};
 return heading('个人进度','学习进度','只统计本浏览器中有证据支持的学习行为。')+
 '<div class="metrics">'+countRow(s.explorations||0,'独立实验')+countRow(s.answered||0,'已作答题目')+countRow(s.transfers||0,'迁移尝试')+'</div>'+
 '<div class="section-bar"><h2>知识状态</h2><span>不等同于掌握率</span></div>'+
 '<div class="simple-rows">'+(s.concepts||[]).map(c=>'<div class="simple-row"><span class="row-meta"><strong>'+esc(conceptNames[c.id]||c.id)+'</strong><small>'+esc(c.status)+'</small></span><span class="count-number">'+esc(c.attempts)+' 次</span></div>').join('')+'</div>'+
 '<div class="section-bar"><h2>最近的学习轨迹</h2></div>'+
 (events.length?'<div class="simple-rows">'+events.map(e=>'<div class="simple-row"><span class="row-meta"><strong>'+esc(names[e.kind]||e.kind)+'</strong><small>'+formatTime(e.occurredAt)+'</small></span></div>').join('')+'</div>':'<div class="empty-state">还没有学习事件。开始一次实验后，时间线会自动出现。</div>')+
 '<p class="quiet-note">数据仅来自原版 V2 学习记录，绝不展示模拟学习时长、AI 估算成绩或伪造的“掌握率”。</p>';
}
export function settings({bridge,prefs}){
 return heading('个人中心','设置','把学习空间调整为适合你自己的节奏。')+
 '<div class="section-bar"><h2>学习空间</h2></div><section class="setting-group">'+
 '<div class="setting-row"><div><strong>减少动态效果</strong><p>系统偏好减少动态时自动遵循；也可主动选择。</p></div><button role="switch" aria-label="减少动态效果" aria-checked="'+prefs.reduceMotion+'" class="switch" data-action="toggle-reduced"></button></div>'+
 '<div class="setting-row"><div><strong>重新开始当前课程</strong><p>重置课程步骤，不删除已经形成的学习事件。</p></div>'+click('重新开始','reset-lesson')+'</div>'+
 '</section><div class="section-bar"><h2>模型与数据</h2></div><section class="setting-group">'+
 '<div class="setting-row"><div><strong>DeepSeek 真实模型连接</strong><p>'+(bridge.modelLoaded?'原版 BYOK 配置面板；仅用户授权请求。':'原版模型配置暂不可用。')+'</p></div>'+click('连接','open-ai-config')+'</div>'+
 '<div class="setting-row"><div><strong>导师运行模式</strong><p>'+esc(bridge.status?.mentorMode==='llm-configured'?'模型已配置，调用仍需逐次同意':'本地规则导师 · 不自动调用付费 API')+'</p></div></div>'+
 '<div class="setting-row"><div><strong>导出学习记录</strong><p>使用原版 V2 JSON 数据结构，文件保存在你的设备上。</p></div>'+click('导出 '+glyph('download'),'export-data')+'</div>'+
 '<div class="setting-row"><div><strong>清空 V2 学习记录</strong><p>清空前请先导出备份；保留原 V1 数据备份。</p></div><button class="link-action danger" data-action="clear-data">清空</button></div>'+
 '</section><div class="section-bar"><h2>版本与隐私</h2></div><section class="setting-group"><div class="setting-row"><div><strong>知序 V4 · Native Rebuild</strong><p>与 R3 相互独立的全新页面结构；科学引擎和证据数据来自原版。</p></div></div>'+
 '<div class="setting-row"><div><strong>Original Edition</strong><p>原版始终可用，可随时回退。</p></div><a class="link-action" href="/zhixu-ai-academy/original.html" target="_blank" rel="noopener noreferrer">打开原版</a></div></section>'+
 '<p class="quiet-note">数据默认存储在当前浏览器的 localStorage，未启用云端账号同步。</p>';
}
export function outline(route,bridge,lesson){
 if(route==='today')return '<div class="outline-caption">今日继续</div><button class="outline-row is-active" data-action="enter-sensitivity"><strong>初值敏感性</strong><small>继续科学探究</small></button><div class="outline-caption">我的空间</div><button class="outline-row" data-route="growth"><strong>学习记录</strong><small>基于真实事件</small></button>';
 if(route==='courses')return '<div class="outline-caption">科学世界</div><button class="outline-row is-active" data-action="enter-sensitivity"><strong>混沌与非线性</strong><small>物理 · 初值敏感性</small></button><button class="outline-row" data-action="enter-evo"><strong>生命与演化</strong><small>生态模拟 · 独立重复</small></button>';
 if(route==='learn')return '<div class="outline-caption">当前课程</div>'+steps.map((name,i)=>'<button class="outline-row '+(lesson.step===i?'is-active':'')+'" data-action="study-step" data-index="'+i+'" '+(i>lesson.highest?'disabled':'')+'><strong>'+String(i+1).padStart(2,'0')+' '+name+'</strong><small>'+(i===lesson.step?'正在进行':i<=lesson.highest?'可返回此阶段':'完成上一步解锁')+'</small></button>').join('');
 if(route==='library')return '<div class="outline-caption">资料分类</div><button class="outline-row is-active"><strong>待复习</strong><small>'+bridge.tasks().length+' 项任务</small></button><button class="outline-row"><strong>最近作答</strong><small>真实评分记录</small></button>';
 if(route==='growth')return '<div class="outline-caption">成长记录</div><div class="outline-empty">学习记录会随每次真实作答、科学实验和复习自动更新。</div>';
 return '<div class="outline-caption">设置</div><div class="outline-empty">原版科学引擎及学习数据存储方式保持不变。</div>';
}
export const screens={today,courses,learn,library,growth,settings};
