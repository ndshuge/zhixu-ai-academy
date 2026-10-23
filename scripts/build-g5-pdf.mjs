import {createRequire} from 'node:module';
import {readFile,mkdir,writeFile,stat} from 'node:fs/promises';
import {join} from 'node:path';
const require=createRequire('E:/CHATGPT/projects/physics-frontier-lab/package.json');
const {chromium}=require('playwright');
const root=process.cwd(),out=join(root,'submission'),pics=join(root,'evidence','g5','pdf-crops');
await mkdir(out,{recursive:true});
const image=async filename=>'data:image/png;base64,'+(await readFile(join(pics,filename))).toString('base64');
const [pre,experiment,learning,review,study,agent]=await Promise.all([
 'pretest-crop.png','science-crop.png','learning-crop.png',
 'review-crop.png','study-crop.png','approval-crop.png'].map(image));
const css=`<style>
@page {size:A4;margin:0}
*{box-sizing:border-box}html,body{margin:0;padding:0}body{color:#15304a;font-family:"Microsoft YaHei","PingFang SC",sans-serif;line-height:1.52;background:white}
.page{width:210mm;height:297mm;break-after:page;page-break-after:always;padding:17mm 18mm 17mm;position:relative;overflow:hidden;background:#fff}
.page:last-child{break-after:auto;page-break-after:auto}
h1{font-size:36px;line-height:1.28;margin:18px 0;color:#092b43}
h2{font-size:23px;color:#123a54;margin:0 0 14px}h3{font-size:16px;margin:0 0 8px;color:#145774}
p,li{font-size:12.3px;margin:7px 0}ul{padding-left:20px}
.kicker{letter-spacing:2px;color:#0b7896;font-size:12px;font-weight:bold}
.rule{width:54px;height:5px;background:#00a4aa;margin:18px 0}
.hero{background:linear-gradient(120deg,#0b2b45,#126c83);color:white;margin:-17mm -18mm 20mm;padding:29mm 19mm 25mm}
.hero h1{font-size:51px;color:white}.hero p{color:#def5fb;font-size:17px}
.note{padding:12px 15px;background:#eaf4f6;border-left:4px solid #119baa;border-radius:4px;margin:12px 0;font-size:12px}
.warning{background:#fff3df;border-left-color:#ec9c32}
.cols{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.tile{background:#f1f6f9;border-radius:11px;padding:14px;margin-bottom:10px}
.tile strong{color:#0c5674;font-size:15px}.tile p{font-size:11.5px}
.steps{display:grid;gap:11px;margin:24px 0}
.step{border:1px solid #cfe1e6;border-radius:8px;padding:11px 14px}
.step b{font-size:14px;color:#006681}
.step p{margin:3px 0;font-size:12px}
table{width:100%;border-collapse:collapse;margin-top:12px;font-size:11.5px}
td,th{border-bottom:1px solid #d2dce2;padding:9px 7px;text-align:left;vertical-align:top}
th{background:#edf5f7;color:#0d5571}
.screen{width:100%;height:240px;object-fit:cover;object-position:top;border:1px solid #b7cdd6;border-radius:7px}
.caption{font-size:10.5px;color:#526e7a;margin:4px 0 14px}
.footer{position:absolute;bottom:10mm;left:18mm;right:18mm;border-top:1px solid #cfdee2;padding-top:6px;font-size:9px;color:#637e88;display:flex;justify-content:space-between}
.big-num{font-size:31px;font-weight:bold;color:#087b91}
.banner{background:#092f49;color:white;padding:17px;border-radius:10px;margin:14px 0}
.banner b{color:#9df1eb}
.sub{font-size:11px;color:#4b6472}
</style>`;
const footer=n=>`<div class="footer"><span>AI学院 · 西安交通大学2026 T.A杯 · 参赛介绍草案</span><span>${n} / 7 · 规则模式 / 真人研究待完成</span></div>`;
const html=`<!DOCTYPE html><html lang="zh"><head><meta charset="utf-8">${css}</head><body>
<section class="page">
 <div class="hero"><div style="font-size:15px;letter-spacing:3px">AI + 高等教育 · AI + 教学</div>
 <h1>AI学院</h1><p>让学生从一次错误猜想，走向可检验、可追溯的理解</p>
 <div style="font-size:14px;border-top:1px solid #73a9ba;padding-top:20px;margin-top:38px">2026 西安交通大学 T.A 杯参赛作品 · 技术原型</div></div>
 <div class="kicker">PROJECT INTRODUCTION / 作品介绍</div>
 <h2>关键词</h2><p>探究式学习 · 科学计算 · 错因诊断 · 学习证据 · 迁移测评</p>
 <div class="rule"></div>
 <h2>项目概要</h2>
 <p>AI学院以大学生理解抽象科学概念的真实难点为起点，让学生先独立预测，再使用可复现的科学计算验证，用基于证据的规则导师追问、受控变量比较、错题与新变式复习形成学习闭环。</p>
 <div class="note warning"><b>成果状态声明：</b>软件功能已完成自动化验收；当前导师为规则教师，不是联网LLM。真实学生样本截至本材料制作时为0，尚不能声称提分或学习效果因果提升。</div>
 <p class="sub">作品负责人：待本人填写并核实 ｜ 所属学校：西安交通大学 ｜ 作品介绍草案，尚未签署与提交</p>
 ${footer(1)}
</section>
<section class="page">
 <div class="kicker">01 / EDUCATIONAL PROBLEM</div><h2>不是又一个通用问答窗口</h2>
 <p>学生能看懂答案，不代表能在新题中区分科学定律、初始条件与参数；通用聊天窗口里的一次答对，也无法证明学生独立理解。</p>
 <div class="cols"><div class="tile"><strong>传统学习的断点</strong><p>看完答案就结束；实验图、错误原答、后续复习分散；难判断学生究竟改变了什么理解。</p></div>
 <div class="tile"><strong>我们的可检验方案</strong><p>保留前测原答、事前预测、真实运行证据、独立迁移题与复习记录，逐项展示证据来源和局限。</p></div></div>
 <h2 style="margin-top:18px">旗舰情境：初值敏感性</h2>
 <div class="steps">
 <div class="step"><b>① 先预测</b><p>新生对“相同演化规则下，两条接近轨道会如何变化”给出自发答案；未作答前不揭答案。</p></div>
 <div class="step"><b>② 真正运行</b><p>使用固定快照PFL数值引擎，观察轨道分离；点选曲线获取实际原始数据。</p></div>
 <div class="step"><b>③ 追问与审批</b><p>规则导师引用实验条件提出问题；二次实验需先写独立新预测，明确审批后执行。</p></div>
 <div class="step"><b>④ 错因与迁移</b><p>客观错题可以查评分依据；概念候选可否认；新题复测不重复前测题干。</p></div>
 <div class="step"><b>⑤ 复习仍谨慎</b><p>一次复测正确只记作阶段证据，不自动推断长期掌握或给出虚假的百分比。</p></div></div>
 ${footer(2)}
</section>
<section class="page">
 <div class="kicker">02 / INNOVATION & SAFETY</div><h2>技术创新与边界</h2>
 <table><tr><th>关键设计</th><th>实现及可核验内容</th></tr>
 <tr><td>证据绑定</td><td>计算来自固定PFL内核与EvoWorld模块快照，可验证哈希；教师不凭图像编造数值</td></tr>
 <tr><td>先预测后揭示</td><td>未提交前无答案；原始预测与事件记录保留在本机，不能用科学猜想失败冒充客观错题</td></tr>
 <tr><td>学生可纠错</td><td>误区候选可以被学生否认并保留状态，不把一次答案变为人格/能力标签</td></tr>
 <tr><td>可控实验规划</td><td>规则生成单变量计划、独立预测与人工授权双重门槛，运行后保存对照证据</td></tr>
 <tr><td>真实模型分界</td><td>校方自带API（BYOK）仅具配置架构；未使用真实模型供应商API验证教学质量</td></tr>
 <tr><td>隐私与局限</td><td>浏览器本地证据可导出和清空；没有学校级SSO、不可篡改审计或教育效果结论</td></tr></table>
 <div class="banner"><b>区别于普通问答的主张</b><br/>可检验的科学证据链 + 学生自主判断 + 独立迁移题，而不是由模型对学习效果自我打分。</div>
 <h3>第二类教学迁移：EvoWorld</h3><p>配对独立模拟世界用于解释控制变量与随机波动。每条件只有少数独立重复，不能推断广泛的现实生态因果关系。</p>
 <div class="note warning">当前准确宣传语：规则教师与真实数值工具支撑的探究式教育原型。不可写成“已部署自主LLM导师”“已证明提高学生成绩”。</div>
 ${footer(3)}
</section>
<section class="page">
 <div class="kicker">03 / RUNNING PRODUCT</div><h2>真实界面：从预测到科学实验</h2>
 <img class="screen" src="${pre}"/><div class="caption">图1 · 前测未选状态（独立Edge自动化截图，非真人教育数据）</div>
 <img class="screen" src="${experiment}"/><div class="caption">图2 · 实际PFL计算后的曲线及可点击数据（非绘制的虚拟样例）</div>
 <img class="screen" src="${agent}"/><div class="caption">图3 · 经过学生第二次新预测及明确批准的单变量对照</div>
 <p class="sub">来源：项目内 evidence/browser/ 的真实浏览器验收截图；场景操作由隔离自动化测试驱动。</p>
 ${footer(4)}
</section>
<section class="page">
 <div class="kicker">04 / FEEDBACK & TRANSFER</div><h2>真实界面：错误记录与复习证据</h2>
 <img class="screen" src="${learning}"/><div class="caption">图4 · 本机个人证据：原答案、评分依据、候选误区与事件来源</div>
 <img class="screen" src="${review}"/><div class="caption">图5 · 新变式复测和下一次安排；一次正确不是“永久掌握”</div>
 <img class="screen" src="${study}"/><div class="caption">图6 · 试测工具当前空状态，无任何真实志愿者结果</div>
 ${footer(5)}
</section>
<section class="page">
 <div class="kicker">05 / IMPLEMENTATION EVIDENCE</div><h2>把软件验收与教学效果分开</h2>
 <div class="cols"><div class="tile"><div class="big-num">46/46</div><p>既有Node/API自动测试通过，验证科学与业务规则；不表示有46名学生</p></div>
 <div class="tile"><div class="big-num">43</div><p>既有5组Edge真实浏览器回归检查，覆盖教学页面与授权路径</p></div>
 <div class="tile"><div class="big-num">2</div><p>使用固定科学计算场景：PFL混沌模型与EvoWorld配对实验</p></div>
 <div class="tile"><div class="big-num">0</div><p>当前经核验的真人学习效果样本、真实供应商LLM联网试验</p></div></div>
 <h3>试测计划（不是已取得的效果）</h3><p>计划邀请6–10名自愿学生，完成不重复题干的前测、真实探究、独立迁移、匿名问卷，记录用时、求助和失败点；与普通AI或原模拟器公平比较。没有对照时仅报告单组可用性。</p>
 <table><tr><th>能够据实宣称</th><th>现阶段不能宣称</th></tr><tr><td>真实科学计算、被测试的教学交互、可解释错题与复习</td><td>真实LLM教师已经完成调用或自治规划</td></tr><tr><td>研究采集工具就绪；可在同意后匿名导出</td><td>学生成绩提高X%、因果显著、样本已收齐</td></tr><tr><td>纯规则模式，不需要个人付费API</td><td>已拥有学校生产级合规、多租户或不可篡改记录</td></tr></table>
 <div class="note">复核入口：docs/G1_G4_DELIVERY_20261010.md、docs/G4_RESEARCH_PLAYBOOK.md、evidence/browser/ 和 evidence/g5/。</div>
 ${footer(6)}
</section>
<section class="page">
 <div class="kicker">06 / DEPLOYMENT AND DELIVERY</div><h2>实施价值、推广路径与待办</h2>
 <h3>核心展示场景</h3><p>大学工科新生围绕初值敏感性展开10–15分钟短时探究，并用迁移题而不是复读原题验证认知变化。第二类可讲随机性与控制变量。</p>
 <h3>推广设想（非已完成交付）</h3><p>学校可在获得授权和完善隐私保护后使用自有模型API，逐步扩展真实教学；本次仅验证本地原型和BYOK管理框架，不声称已在高校生产部署。</p>
 <h3>赛前真实工作与人类签署关口</h3>
 <table><tr><th>项目</th><th>当前状态</th></tr>
 <tr><td>软件运行与自动化操作证据</td><td>已有测试脚本和留存截图，G5另录真实浏览器自动化演示</td></tr>
 <tr><td>志愿试测</td><td>待真实参与者知情同意与核验；可诚实报告零样本</td></tr>
 <tr><td>正式平台材料</td><td>本文件为作品介绍草案；需要负责人实名核对后命名</td></tr>
 <tr><td>简介模板与承诺书</td><td>必须使用官方模板，由参赛者/指导教师依法亲自填写、签名或签章</td></tr>
 <tr><td>资格与提交</td><td>核对个人/团队教师规定，赛方平台完成报名和正式上传并保留回执</td></tr></table>
 <div class="note warning">官方归档提交日期为2026-10-25；未核实具体截止小时，不假定当日23:59。演示视频≤10分钟/≤500MB，作品简介案例≤300字。</div>
 <p style="font-size:12px;margin-top:22px"><b>产品与资料真实边界：</b>这是可运行的教学技术原型和参赛材料草案，不含未取得同意的学生数据，不包含真实API密钥，不代签，也不是已正式提交的回执。</p>
 ${footer(7)}
</section></body></html>`;
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage();
 await page.setContent(html,{waitUntil:'load'});
 await page.pdf({path:join(out,'AI学院-作品介绍-参赛草案-v2.pdf'),printBackground:true,preferCSSPageSize:true});
 await writeFile(join(out,'作品简介-供填写官方模板.md'),`# AI学院 · 供官方作品简介模板使用的文字（≤300字）\n\nAI学院是一款面向大学生抽象科学概念学习的探究式教育原型。学生先独立完成概念前测与科学预测，再使用真实数值引擎观察轨道、点选数据，由规则导师依据实验条件追问，并在学生明确审批后开展单变量对照。客观错题、可否认的概念误区候选、独立新题与轻量复习记录构成可追溯学习证据链。现已完成本地科学计算及浏览器自动化软件验证，并提供自愿匿名试测工具。当前未接入真实LLM API，真实学生研究尚未开展，不宣称已经提升学习成绩。\n\n**注意**：此文件不是官方模板，不含身份信息，不构成签名或正式申报。请将正文复制到官方DOCX模板，核对资格后由本人填写签署。\n`);
 console.log('G5_PDF_DRAFT_OK',join(out,'AI学院-作品介绍-参赛草案-v2.pdf'));
}catch(e){console.error('G5_PDF_DRAFT_FAIL',e.stack||e);process.exitCode=1}
finally{await browser.close()}
