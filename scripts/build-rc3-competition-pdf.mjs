// AI学院 RC3: 9-page judge-facing presentation PDF from actual G5 screenshots.
// Run: node scripts/build-rc3-competition-pdf.mjs. Browser print-to-PDF offline.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require('../video-studio/node_modules/playwright-core');
const root=process.cwd(),target=path.join(root,'submission','rc3-20261013');
fs.mkdirSync(target,{recursive:true});
const shotDir=path.join(root,'video-studio','capture','assets');
const evidence=JSON.parse(fs.readFileSync(path.join(shotDir,'REAL_DEMO_EVIDENCE.json'),'utf8'));
const bench=JSON.parse(fs.readFileSync('evidence/rc3-20261012/g2-benchmark/result-p5-60.json','utf8'));
const live=JSON.parse(fs.readFileSync('evidence/rc3-20261012/g2-live/live-real-vs-rules-results.json','utf8'));
const movie=JSON.parse(fs.readFileSync('video-studio/output/FULL_FILM_ACCEPTANCE_20261013.json','utf8'));
if(evidence.status!=='PASS'||evidence.scenes.length!==11||evidence.humanStudents!==0||evidence.remoteLLMCalls!==0||
 bench.count!==60||bench.actualPflRecomputations!==120||bench.blockedMaliciousSelections!==20||
 live.realModelCalls!==1||live.testedCases!==8||live.modelTargetAlignedCount!==8||live.ruleTargetAlignedCount!==4||
 movie.status!=='PASS')throw Error('Evidence contract failed');
const images={};
for(const s of evidence.scenes){const b=fs.readFileSync(path.join(shotDir,s.file));
 if(crypto.createHash('sha256').update(b).digest('hex')!==s.sha256)throw Error('Screenshot SHA mismatch '+s.file);
 images[s.name]='data:image/png;base64,'+b.toString('base64');
}
const keyframe=fs.readFileSync('video-studio/output/Film_QA_67s.png');
images.curve='data:image/png;base64,'+keyframe.toString('base64');
const E=(x)=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const screenshot=(id,label)=>`<figure class="shot"><img src="${images[id]}" alt="${E(label)}"><figcaption>${E(label)} · 本机真实Edge页面／合成用户操作</figcaption></figure>`;
const metric=(n,t,s='')=>`<div class="metric"><b>${n}</b><strong>${t}</strong><small>${s}</small></div>`;
const page=(num,topic,body,cls='')=>`<section class="page ${cls}"><div class="top"><span class="brand">∑ AI ACADEMY <em>/ 2026</em></span><span class="section">${E(topic)}</span></div>${body}<div class="foot"><span>西安交通大学 · AI学院 · AI+高等教育 / AI+教学</span><span>本机证据可复核　/　真人试测 n = 0</span><span>${String(num).padStart(2,'0')} / 09</span></div></section>`;
const pages=[
page(1,'作品介绍 / OVERVIEW',`<div class="hero"><div class="eyebrow">SCIENCE INQUIRY / EVIDENCE-FIRST AI LEARNING</div>
<h1>AI学院</h1><h2>AI 给出答案之后，<br><i>学生真的理解了吗？</i></h2>
<p>把“预测 → 真实科学计算 → 受约束方案 → 本人审批 → 独立迁移”变成可以操作、可追溯的学习流程。</p>
<div class="chips"><span>智能学伴</span><span>科学探究</span><span>人类审批</span><span>证据溯源</span><span>概念迁移</span></div></div>
<div class="hero-visual"><img src="${images['01_home']}" alt="AI学院实际首页"></div>
<div class="hero-strip"><b>一套学习协议</b><b>两个科学实验世界</b><b>零虚构学习效果</b></div>`,'cover'),
page(2,'问题与教学价值 / WHY',`<div class="eyebrow">01 / THE PROBLEM</div><h2>会复述结论，不等于会独立推理。</h2>
<p class="intro">传统“提问—AI作答—学生接受”的流程，容易跳过原始判断、实验反证和迁移检验。AI学院把学习的关键动作交还给学生。</p>
<div class="cols two"><div class="panel pale"><h3>常见路径</h3><div class="steps"><div>提问</div><span>→</span><div>获得标准答案</div><span>→</span><div>结束</div></div><p>无法区分“知道答案”和“真正理解”，也很难记录直觉如何被证据改变。</p></div>
<div class="panel mint"><h3>AI学院路径</h3><div class="process"><span>独立前测</span><span>原始预测</span><span>真实实验</span><span>方案审查</span><span>迁移验证</span></div><p>先保存学生的想法，再展示模型证据；AI只能提供受限建议，不能替学生决定实验。</p></div></div>
<div class="bottom-note">定位：辅助高等教育科学探究和概念理解。当前证明的是产品流程与工程可用性，不是已证明学习成绩提升。</div>`),
page(3,'真实学习流程 / WORKFLOW',`<div class="eyebrow">02 / PRODUCT EXPERIENCE</div><h2>一次探究，留下完整的认知轨迹。</h2><p class="intro">两道独立前测、实验前预测、实验后新预测和两道独立迁移题，构成可追踪的学习链条。</p>
<div class="three-shots">${screenshot('02_pretest','01 · 两道独立前测')}${screenshot('03_prediction','02 · 原始预测')}${screenshot('07_transfer','03 · 两道独立迁移')}</div>
<div class="flowline"><span>先答</span><b>→</b><span>先猜</span><b>→</b><span>看证据</span><b>→</b><span>再猜</span><b>→</b><span>独立迁移</span></div>
<div class="bottom-note">截图中的答题和操作由自动化合成用户完成，未采集真人教学效果数据。</div>`),
page(4,'科学内核 / PHYSICS FRONTIER LAB',`<div class="eyebrow">03 / SCIENTIFIC EVIDENCE</div><h2>真正运行科学计算，而不是让模型编造曲线。</h2>
<p class="intro">Logistic映射：相同演化规则与参数，设置两个极近初值；通过真实PFL内核复算轨迹，观察有限迭代中差异如何演化。</p>
<div class="cols two science"><div>${screenshot('04_pfl_science','PFL实际运行页面')}<div class="params"><b>r = 3.9</b><b>x₀ = 0.217</b><b>150次迭代</b><b>初值差量 10⁻¹⁰</b></div></div>
<div><figure class="shot"><img src="${images.curve}" alt="真实PFL数据动画帧"><figcaption>正片实际镜头：真实PFL计算的双轨迹，2 × 151个采样点</figcaption></figure>
<div class="quote">证据边界：数值轨迹说明该次有限条件下的计算现象；不把单次模拟误称数学证明或学习成效。</div></div></div>`),
page(5,'安全规划 / HUMAN GATE',`<div class="eyebrow">04 / CONTROLLED PLANNING</div><h2>AI提出建议；科学规则与学生共同把关。</h2>
<p class="intro">候选实验先经过服务器白名单校验，只允许单变量变化。学生独立完成第二次预测，并明确批准后，才执行新一次PFL计算。</p>
<div class="cols two">${screenshot('05_plan_pending','未批准状态：不能执行')}${screenshot('06_approved_comparison','明确批准后：第二次真实计算')}</div>
<div class="security"><div><b>约束</b><span>受限A/B方案 · 服务器校验</span></div><div><b>控制</b><span>新预测 · 明确批准</span></div><div><b>复核</b><span>真实运行ID · 来源追踪</span></div></div>
<div class="bottom-note">本次视频中的规划为本机规则模式，不是实时DeepSeek请求。另有独立历史真实模型试验，见第7页。</div>`),
page(6,'双实验室 / SCIENCE WORLDS',`<div class="eyebrow">05 / CROSS-DISCIPLINARY</div><h2>一套探究协议，连接两个科学世界。</h2>
<div class="cols two labs"><div class="panel">${screenshot('09_world_lobby','统一实验室入口')}<h3>Physics Frontier Lab</h3><p>数学动力学与初值敏感性：预测、参数调整、复算与曲线证据。</p></div>
<div class="panel">${screenshot('11_evo_world','EvoWorld实际运行状态')}<h3>EvoWorld</h3><p>数字生命环境：观察演化、变化与有限模拟边界。两类实验均由实际科学引擎运行。</p></div></div>
<div class="bottom-note">可推广的是“学生先判断—模型后给证据—受约束再实验”的教学方法，不宣称跨学科教育效果已被真人试验验证。</div>`),
page(7,'技术证据 / VERIFIABLE RESULTS',`<div class="eyebrow">06 / ENGINEERING BENCHMARK</div><h2>用可复核的测试结果说明系统能力。</h2>
<div class="metrics">${metric('60','离线合成科学情境','不是60次LLM调用')}${metric('120','真实PFL候选复算','确定性科学内核')}${metric('20/20','恶意输出被拒绝','固定本地防护测试')}${metric('11/11','最新软件回归通过','Node / Edge / 科学来源')}</div>
<div class="split"><div class="panel dark"><h3>历史真实模型对照（单独实验）</h3><div class="comparison"><div><strong>8 / 8</strong><span>真实模型选择方向与预设目标一致</span></div><div><strong>4 / 8</strong><span>固定选A的基线方向一致</span></div></div><p>OpenCode Go / DeepSeek V4.1 Flash；仅1次真实模型请求，覆盖8组合成方向题；0次工具调用。不是实时网页规划，也不是学生成绩。</p></div>
<div class="panel"><h3>诚实保留失败边界</h3><p>在60组离线情境中，<b>5组</b>目标方向没有合适候选，不能包装成模型成功。</p><p>模型提供方实际人民币账单未核实；价格元数据0不能当作免费证明。</p><p>安全拦截来自本地固定案例，不是实际遭受过的模型攻击。</p></div></div>`),
page(8,'教学部署与可信边界 / DEPLOYMENT',`<div class="eyebrow">07 / IMPLEMENTATION</div><h2>能运行、能解释、能复核，也明确哪些还没有验证。</h2>
<div class="cols two"><div class="panel"><h3>现有可运行功能</h3><ul><li>真实科学引擎与浏览器交互工作台</li><li>两道独立前测和两道迁移题</li><li>规则/受约束科学方案、二次预测与审批</li><li>来源哈希、RunID、离线Benchmark与回归测试</li><li>真人自愿试测工具与匿名化流程材料</li></ul></div>
<div class="panel pale"><h3>当前不能宣称</h3><ul><li>没有真实参与者研究，<b>n = 0</b></li><li>没有教学提分、显著性或长期效果证据</li><li>录像没有实时调用远程LLM</li><li>固定安全样例不是实战攻击事故</li><li>本机审核候选尚不是官方已投稿作品</li></ul></div></div>
<div class="deploy"><div><b>运行</b><span>本机Node服务 + Edge浏览器</span></div><div><b>模型</b><span>受限建议 / 规则安全回退</span></div><div><b>教学</b><span>教师可据真实证据设计探究任务</span></div></div>`),
page(9,'作品总结 / NEXT STEP',`<div class="end"><div class="eyebrow">AI ACADEMY / CONCLUSION</div><h2>不是替学生得出结论，<br><i>而是让每个结论经得起验证。</i></h2>
<p>AI学院将原始判断、科学实验、人类审批和独立迁移连接成一条完整、可追溯的学习路径。</p>
<div class="closing"><div><strong>当前成果</strong><span>可运行RC3产品 · 两个科学实验室 · 4分钟真实素材演示 · 11/11回归</span></div><div><strong>下一步</strong><span>自愿真人试点、教师评审反馈、正式比赛附件审核与提交</span></div></div></div>
<div class="end-card">AI学院　/　AI+高等教育 · AI+教学<br><small>2026 T.A.杯 · 作品介绍审核候选 · 不代替官方签字及提交回执</small></div>`,'last')
];
const css=`
@page{size:320mm 180mm;margin:0}*{box-sizing:border-box}html,body{margin:0;padding:0;background:#e8eeea;color:#173d35;font-family:"Microsoft YaHei","PingFang SC","Noto Sans CJK SC",sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{position:relative;width:320mm;height:180mm;padding:16mm 19mm 15mm;overflow:hidden;page-break-after:always;background:#f6faf6}
.page:nth-child(2n){background:#f1f7f3}.top,.foot{display:flex;justify-content:space-between;align-items:center}.top{height:8mm;font-size:10pt;font-weight:850;letter-spacing:1.5px}.top em{font-style:normal;color:#759789}.section{color:#438268}.foot{position:absolute;left:19mm;right:19mm;bottom:9mm;border-top:1px solid #b9d1c3;padding-top:3mm;font-size:8pt;color:#769388;letter-spacing:.2px}
.eyebrow{font-size:11pt;color:#3c9a72;font-weight:900;letter-spacing:2px;margin:10mm 0 4mm}h1,h2,h3,p{margin-top:0}h2{font-size:29pt;letter-spacing:-1px;line-height:1.27;margin-bottom:6mm}h2 i{font-style:normal;color:#3a9870}.intro{font-size:13pt;line-height:1.72;color:#5d786a;max-width:270mm;margin-bottom:7mm}.cols{display:grid;gap:7mm}.two{grid-template-columns:1fr 1fr}.panel{background:white;border:1px solid #d7e8db;border-radius:5mm;padding:8mm;box-shadow:0 4px 14px #204a3410}.panel h3{font-size:17pt;margin:0 0 5mm}.panel p{font-size:12pt;color:#617d6d;line-height:1.6}.panel.pale{background:#eaf1ed}.panel.mint{background:#dcefe2}.panel.dark{background:#174a40;color:white}.panel.dark p{color:#c6e6d6}
.shot{margin:0;background:white;border:2px solid #d6e7da;border-radius:3mm;overflow:hidden;box-shadow:0 6px 18px #173b2c15}.shot img{display:block;width:100%;height:64mm;object-fit:cover;object-position:center top}.shot figcaption{padding:3mm 4mm;font-size:8.7pt;color:#648172;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bottom-note{background:#dceee2;border-left:4px solid #3d9970;color:#37664f;border-radius:2mm;padding:4mm 5mm;font-size:11pt;line-height:1.55;margin-top:7mm}
.cover{background:radial-gradient(ellipse at 83% 26%,#24665b,#0b3034 66%);color:white}.cover .top{color:#d3e6d9}.cover .foot{border-color:#56796e;color:#bbd5c8}.cover .section{color:#b1e2c8}
.hero{position:absolute;left:19mm;top:41mm;width:151mm;z-index:2}.hero h1{font-size:56pt;letter-spacing:-3px;margin:0 0 5mm}.hero h2{font-size:28pt;line-height:1.4}.hero h2 i{color:#f0ca96}.hero p{font-size:14pt;line-height:1.7;color:#cce2d7;width:145mm;margin-top:6mm}.hero .eyebrow{color:#b5e5cb;margin:0 0 7mm}.chips{display:flex;flex-wrap:wrap;gap:3mm;margin-top:8mm}.chips span{border:1px solid #75ac96;color:#d4e9db;border-radius:12mm;padding:2mm 4mm;font-size:9pt}
.hero-visual{position:absolute;right:17mm;top:37mm;width:132mm;height:99mm;overflow:hidden;border:2mm solid #5d948078;border-radius:7mm;box-shadow:0 15px 50px #0019}.hero-visual img{width:100%;height:100%;object-fit:cover;object-position:center top}
.hero-strip{position:absolute;left:19mm;right:19mm;bottom:23mm;display:flex;gap:12mm}.hero-strip b{font-size:11pt;color:#b5e7ce}
.steps{display:flex;align-items:center;gap:3mm;margin:11mm 0}.steps div{background:white;padding:4mm;border-radius:3mm;font-weight:800}.steps span{color:#9baf9e}.process{display:flex;flex-wrap:wrap;gap:3mm;margin:8mm 0}.process span{background:#b7dec5;padding:3mm 4mm;border-radius:3mm;font-weight:850;font-size:11pt}
.three-shots{display:grid;grid-template-columns:repeat(3,1fr);gap:5mm}.three-shots .shot img{height:71mm}.flowline{display:flex;align-items:center;justify-content:space-between;margin-top:8mm;padding:5mm 7mm;border-radius:3mm;background:#d8ebdd;font-weight:850;font-size:13pt}.flowline b{color:#61a17d}
.science .shot img{height:71mm}.science .quote{margin-top:6mm;padding:5mm;background:#dcefe5;border-radius:3mm;font-size:11pt;line-height:1.5}.params{display:flex;gap:2mm;flex-wrap:wrap;margin-top:4mm}.params b{font-size:10pt;background:#e1f0e5;padding:3mm;border-radius:2mm}
.security,.deploy{display:flex;gap:5mm;margin-top:7mm}.security div,.deploy div{flex:1;background:#dcefe4;border-radius:3mm;padding:4mm 5mm}.security b,.deploy b{display:block;font-size:13pt}.security span,.deploy span{display:block;color:#547c68;font-size:10pt;margin-top:2mm}
.labs .shot img{height:64mm}.labs .panel{padding:4mm}.labs h3{margin:5mm 2mm 3mm}.labs p{margin:0 2mm 2mm}
.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:4mm;margin:8mm 0}.metric{background:#dceee4;padding:6mm;border-radius:4mm;min-height:38mm}.metric b{display:block;font-size:30pt;color:#267955}.metric strong{display:block;font-size:11pt}.metric small{font-size:9pt;color:#63816f}.split{display:grid;grid-template-columns:1.1fr .9fr;gap:5mm}.comparison{display:flex;gap:4mm}.comparison div{flex:1;background:#ffffff1c;padding:4mm;border-radius:3mm}.comparison strong{display:block;font-size:24pt;color:#b9f0ce}.comparison span{font-size:9pt}.split .panel{padding:5mm}.split .panel h3{font-size:14pt}.split .panel p{font-size:10.5pt;margin:3mm 0}
ul{margin:0;padding-left:6mm}li{font-size:12pt;line-height:2;color:#567566}.end{position:absolute;top:43mm;left:20mm;right:20mm}.end h2{font-size:34pt;line-height:1.4}.end p{font-size:16pt;color:#5e796b;margin-top:9mm;max-width:235mm;line-height:1.6}.closing{display:flex;gap:10mm;margin-top:16mm}.closing div{flex:1;background:#dcefe4;padding:7mm;border-radius:4mm}.closing strong,.closing span{display:block}.closing strong{font-size:15pt}.closing span{margin-top:3mm;color:#60836e;font-size:12pt;line-height:1.6}.end-card{position:absolute;bottom:25mm;left:20mm;font-size:12pt;color:#2c7856}.end-card small{font-size:9pt;color:#799589}
`;
const compactCSS=`
.page:not(.cover):not(.last) .eyebrow{margin:5mm 0 2mm;font-size:9pt}
.page:not(.cover):not(.last) h2{font-size:24pt;line-height:1.16;margin-bottom:3mm}
.page:not(.cover):not(.last) .intro{font-size:11pt;line-height:1.45;margin-bottom:4mm}
.page:not(.cover):not(.last) .shot img{height:48mm}
.page:not(.cover):not(.last) .three-shots .shot img{height:56mm}
.page:not(.cover):not(.last) .science .shot img{height:50mm}
.page:not(.cover):not(.last) .labs .shot img{height:49mm}
.page:not(.cover):not(.last) .bottom-note{margin-top:4mm;padding:3mm;font-size:9.5pt}
.page:not(.cover):not(.last) .panel{padding:5mm}
.page:not(.cover):not(.last) .panel h3{font-size:14pt;margin-bottom:3mm}
.page:not(.cover):not(.last) .panel p{font-size:10pt;line-height:1.4}
.page:not(.cover):not(.last) .metrics{margin:4mm 0}
.page:not(.cover):not(.last) .metric{padding:4mm;min-height:28mm}
.page:not(.cover):not(.last) .metric b{font-size:25pt}
.page:not(.cover):not(.last) .split .panel{padding:4mm}
.page:not(.cover):not(.last) .split .panel p{font-size:9pt}
.page:not(.cover):not(.last) .flowline{margin-top:5mm;padding:4mm}
.page:not(.cover):not(.last) .params{margin-top:2mm}
.page:not(.cover):not(.last) .params b{padding:2mm}
.page:not(.cover):not(.last) .quote{margin-top:3mm;font-size:9.5pt}
.page:not(.cover):not(.last) .security{margin-top:4mm}
.page:not(.cover):not(.last) .security div{padding:3mm}
.page:not(.cover):not(.last) .deploy{margin-top:4mm}
.page:not(.cover):not(.last) .deploy div{padding:3mm}
.page:not(.cover):not(.last) li{font-size:10pt;line-height:1.7}
`;
const html='<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><style>'+css+compactCSS+'</style></head><body>'+pages.join('')+'</body></html>';
const htmlPath=path.join(target,'AI学院-RC3-作品介绍-审核候选.html');
fs.writeFileSync(htmlPath,html);
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--disable-gpu','--no-sandbox']});
try{const pg=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
 await pg.goto('file:///'+htmlPath.replaceAll('\\','/'),{waitUntil:'load'});
 await pg.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.complete?Promise.resolve():new Promise(r=>{i.onload=r;i.onerror=r})))});
 const pageCount=await pg.locator('.page').count();if(pageCount!==9)throw Error('Wrong page count '+pageCount);
 const overflow=await pg.evaluate(()=>[...document.querySelectorAll('.page')].map((p,i)=>({page:i+1,scrollWidth:p.scrollWidth,clientWidth:p.clientWidth,scrollHeight:p.scrollHeight,clientHeight:p.clientHeight})));
 if(overflow.some(x=>x.scrollWidth>x.clientWidth+2||x.scrollHeight>x.clientHeight+2))throw Error('Page overflow '+JSON.stringify(overflow));
 const pdf=path.join(target,'AI学院-RC3-作品介绍-9页-审核候选.pdf');
 await pg.pdf({path:pdf,printBackground:true,preferCSSPageSize:true,displayHeaderFooter:false});
 await pg.screenshot({path:path.join(target,'PDF_01_cover_preview.png')});
 await pg.locator('.page').nth(3).screenshot({path:path.join(target,'PDF_04_science_preview.png')});
 const bytes=fs.readFileSync(pdf);
 const manifest={status:'PASS',kind:'REVIEW_CANDIDATE_NOT_OFFICIAL_SUBMISSION',pageCount,bytes:bytes.length,
 sha256:crypto.createHash('sha256').update(bytes).digest('hex'),pdf:path.basename(pdf),sourceShots:evidence.scenes.length,
 bench:{syntheticCases:bench.count,actualRecomputations:bench.actualPflRecomputations,blocked:bench.blockedMaliciousSelections},
 llm:{realRequests:live.realModelCalls,syntheticChoices:live.testedCases,aligned:live.modelTargetAlignedCount,baseline:live.ruleTargetAlignedCount},
 humanParticipants:0,videoSha256:movie.sha256,overflow,createdAt:new Date().toISOString()};
 fs.writeFileSync(path.join(target,'PDF_ACCEPTANCE_20261013.json'),JSON.stringify(manifest,null,2)+'\n');
 console.log('RC3_PDF_PASS',JSON.stringify({pages:pageCount,bytes:bytes.length,sha256:manifest.sha256}));
}finally{await browser.close()}
