/**
 * Builds a fully offline human-review page from real, already captured evidence.
 * Never calls a model. Does not embed credentials or hidden research data.
 */
import {readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {computePfl} from '../server.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const out=join(root,'evidence','rc3-20261012','g2-demo-20261014');
const record=JSON.parse(await readFile(join(out,'CODINGPLAN_TUTOR_DEMO_RESULT.json'),'utf8'));
const sentry=JSON.parse(await readFile(join(out,'CODINGPLAN_ONE_REAL_CALL_ATTEMPTED.json'),'utf8'));
const science=computePfl({experiment:'sensitivity',params:{r:3.9,x0:.217,logDelta:-10,steps:150}});
const result=record.reply;
const fields=['evidence','misconceptionCandidate','socraticQuestion','nextExperiment','scientificLimitation','source'];
assert.equal(record.schemaValid,true);
assert.equal(record.toolCalls,0);
assert.equal(record.scientificCheck.firstSeparationStep,43);
assert.equal(science.metrics.find(m=>String(m.label).includes('首次')).value,43);
assert.equal(sentry.maxRequests,1);
assert.equal(sentry.realStudents,0);
assert.equal(record.synthetic,true);
assert.equal(record.realParticipants,0);
assert.deepEqual(Object.keys(result).sort(),fields.sort());
assert.match(result.evidence,/43/);
assert.match(result.evidence,/3\.9/);
assert.match(result.evidence,/0\.217/);
assert.match(result.nextExperiment,/logDelta/);
assert.match(result.nextExperiment,/(先|之前|明确|批准)/);
assert.match(result.nextExperiment,/(尚未执行|未执行)/);
assert.match(result.scientificLimitation,/(有限|不能证明|精度|误差)/);
const dump=JSON.stringify(record);
assert.doesNotMatch(dump,/(authorization\s*[:=]|bearer\s+\w|api[_ -]?key\s*[:=])/i);
const h=x=>String(x).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const W=940,H=350,pad={l:38,t:20,r:20,b:38};
const sx=n=>pad.l+n/150*(W-pad.l-pad.r);
const sy=y=>pad.t+(1-y)*(H-pad.t-pad.b);
const source=science.plots[0];
const lines=source.series.slice(0,2).map((s,i)=>
 '<polyline fill="none" stroke="'+(i===0?'#5ae0d0':'#ffab78')+'" stroke-width="2.3" stroke-linejoin="round" stroke-linecap="round" opacity="'+(i===0?'.9':'.83')+'" points="'+
 s.points.map(([n,y])=>sx(n).toFixed(1)+','+sy(y).toFixed(1)).join(' ')+'"/>').join('');
const guides=[0,0.25,0.5,0.75,1].map(y=>
 '<line x1="'+pad.l+'" x2="'+(W-pad.r)+'" y1="'+sy(y)+'" y2="'+sy(y)+'" stroke="#243c45" stroke-width="1"/>'+
 '<text x="28" y="'+(sy(y)+4)+'" text-anchor="end" fill="#91a7ab" font-size="11">'+y.toFixed(2)+'</text>').join('');
const marks=[0,30,60,90,120,150].map(n=>'<text x="'+sx(n)+'" y="'+(H-11)+'" fill="#91a7ab" text-anchor="middle" font-size="12">'+n+'</text>').join('');
const html=`<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>知序AI学院 | Coding Plan 真实导师验证</title><style>
:root{color-scheme:dark;font-family:Inter,"Microsoft YaHei","PingFang SC",sans-serif}*{box-sizing:border-box}
body{margin:0;background:radial-gradient(circle at 68% -12%,#174452,transparent 36%),#08151b;color:#eaf3f2}
main{max-width:1180px;margin:auto;padding:34px 28px 80px}
nav{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:46px}
.brand{font-size:17px;font-weight:750;letter-spacing:.07em}.tag{font-size:11px;letter-spacing:.12em;font-weight:650;border:1px solid #37636b;border-radius:999px;padding:8px 12px;color:#90e1d2}
.eyebrow{color:#69cabc;letter-spacing:.18em;font-size:12px;font-weight:800;margin-bottom:20px}
h1{font-size:clamp(32px,4.4vw,60px);line-height:1.17;letter-spacing:-.03em;margin:0 0 20px;max-width:920px}
.lead{max-width:830px;line-height:1.85;color:#a6bcc1;font-size:15px;margin-bottom:34px}
.metrics{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:42px}.metrics span{background:#15282f;border:1px solid #284450;color:#cbdfdd;padding:10px 16px;border-radius:8px;font-size:13px}
.section-label{font-size:12px;letter-spacing:.15em;color:#73d2c0;font-weight:800;margin:0 0 14px}
.viz,.panel{background:linear-gradient(140deg,rgba(20,44,52,.93),rgba(10,29,36,.93));border:1px solid #2b4c51;border-radius:14px;padding:24px;margin-bottom:20px}
.viz-head{display:flex;flex-wrap:wrap;justify-content:space-between;gap:10px;margin-bottom:19px}
h2{font-size:22px;margin:0 0 10px}p{line-height:1.8;margin:0}.dim{font-size:13px;color:#91adb4}
.key{color:#6be1d2;font-size:14px;font-weight:700}.legend{display:flex;gap:18px;flex-wrap:wrap;font-size:12px;color:#d1e0e0}
.dot{display:inline-block;height:9px;width:9px;border-radius:50%;margin-right:8px;background:#5ae0d0}
.dot.alt{background:#ffab78}.chart{width:100%;height:auto;display:block;margin:2px auto 8px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}.wide{grid-column:1/-1}
.label{color:#6fd0bf;font-size:12px;text-transform:uppercase;letter-spacing:.13em;font-weight:800;margin-bottom:12px}
.quote{border-left:3px solid #69d7c0;padding:13px 18px;background:#123038;font-size:17px;line-height:1.9}
.emphasis{font-size:20px;line-height:1.8;font-weight:550}
.small{color:#aec3c7;font-size:14px}
.footer{margin-top:35px;border-top:1px solid #284049;padding-top:22px;color:#8fa8ad;font-size:12px;line-height:1.9}
@media(max-width:670px){main{padding:20px 14px 46px}nav{margin-bottom:30px;align-items:flex-start}.brand{font-size:14px}.tag{font-size:10px}.grid{grid-template-columns:1fr}.wide{grid-column:auto}.viz,.panel{padding:17px}.metrics span{font-size:11px}.lead{font-size:14px}.quote{font-size:15px}}
</style></head><body><main>
<nav><div class="brand">知序 AI 学院 <span style="color:#619b9b;font-size:12px">/ RESEARCH LAB</span></div><span class="tag">REAL MODEL · SYNTHETIC STUDENT</span></nav>
<div class="eyebrow">LIVE INFERENCE REVIEW · 2026.10.14</div>
<h1>不是直接给答案。<br/>让学生重新理解自己的错误。</h1>
<p class="lead">本页是一次已授权的 OpenCode Go / DeepSeek V4.1 Flash <b>真实模型请求结果回放</b>，不是正在运行的实时聊天，也不是学生试测。科学数据由独立的 Physics Frontier Lab 计算；未让模型执行科学工具。</p>
<div class="metrics"><span>远程真实模型请求：<b>1 次</b></span><span>模型工具执行：<b>0 次</b></span><span>真人参与者：<b>0 人</b></span><span>科学分离：<b>第 43 步</b></span></div>
<div class="section-label">01 / SCIENCE EVIDENCE · VERIFIED LOCALLY</div>
<section class="viz"><div class="viz-head"><div><h2>相同方程，微小初值扰动</h2><p class="dim">Logistic map · r=3.9 · x₀=0.217 · log₁₀(δ)=-10 · 150 steps</p></div><div class="legend"><span><i class="dot"></i>原始轨道</span><span><i class="dot alt"></i>微扰轨道</span></div></div>
<svg class="chart" viewBox="0 0 940 350" role="img" aria-label="真实PFL两轨道曲线，初值微扰后的差异">
${guides}${marks}
<line x1="${sx(43)}" x2="${sx(43)}" y1="${pad.t}" y2="${H-pad.b}" stroke="#f7d077" stroke-width="1.7" stroke-dasharray="6 6"/>
<text x="${sx(43)+8}" y="28" fill="#f9d77b" font-size="13" font-weight="700">第43步：|Δ|≥0.01</text>
${lines}
</svg><p class="dim">曲线逐点来自本机 PFL 科学计算。第 43 步只适用于此处参数；并非所有初值或参数都会在同一步分离。</p></section>
<div class="section-label">02 / SYNTHETIC LEARNER · FIXED INPUT</div><div class="panel"><div class="label">合成学生的错误直觉</div><div class="quote">“只要数学方程相同，即使初始值相差一点点，后来两条轨迹也一定相同。”</div></div>
<div class="section-label">03 / DEEPSEEK V4.1 FLASH · REAL ONE-SHOT OUTPUT</div>
<div class="grid">
<section class="panel wide"><div class="label">模型引用的科学证据</div><p>${h(result.evidence)}</p></section>
<section class="panel"><div class="label">候选误区 · 可由学生否认</div><p>${h(result.misconceptionCandidate)}</p></section>
<section class="panel"><div class="label">苏格拉底追问</div><p class="emphasis">${h(result.socraticQuestion)}</p></section>
<section class="panel"><div class="label">下一轮控制变量实验</div><p>${h(result.nextExperiment)}</p></section>
<section class="panel"><div class="label">科学推断限制</div><p>${h(result.scientificLimitation)}</p></section></div>
<div class="footer">模型：${h(record.model)} · 输出校验：${record.schemaValid?'结构合格':'需复核'} · 0次自动实验执行。<br/>本页不含任何API Key，不代表已在正式学生网页内持续接入 Coding Plan。不宣称真实学生学习提升；仅供用户审阅与参赛技术研发验证。若套餐超额回退到余额消费，本地模型元数据无法证明真实账单。<br/>追溯记录：CODINGPLAN_TUTOR_DEMO_RESULT.json</div>
</main></body></html>`;
await writeFile(join(out,'WATCH_CODINGPLAN_TUTOR_DEMO.html'),html,'utf8');
const acceptance={time:new Date().toISOString(),source:'offline rendering of one actual Pi RPC output',model:record.model,
 realRemoteCalls:1,realStudentParticipants:0,scientificRecomputation:43,toolCalls:record.toolCalls,
 scientificCitationConsistent:true,wrongChoiceRemediation:true,
 executionGuard:/未执行|尚未执行/.test(result.nextExperiment),schemaValid:true,
 browserReview:'pending'};
await writeFile(join(out,'CODINGPLAN_DEMO_VIEWER_ACCEPTANCE.json'),JSON.stringify(acceptance,null,2)+'\n');
console.log(JSON.stringify({status:'PASS',recomputedStep:43,view:join(out,'WATCH_CODINGPLAN_TUTOR_DEMO.html'),
 model:record.model,schemaValid:record.schemaValid,source:'real-single-request-replay'}));
