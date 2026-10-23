from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import ImageReader
from PIL import Image
import json
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'submission/rc2-20261012';EV=ROOT/'evidence/rc2-20261012'
pdfmetrics.registerFont(TTFont('YaHei',r'C:\Windows\Fonts\msyh.ttc'))
pdfmetrics.registerFont(TTFont('YaHeiBold',r'C:\Windows\Fonts\msyhbd.ttc'))
pdfmetrics.registerFontFamily('YaHei',normal='YaHei',bold='YaHeiBold',italic='YaHei',boldItalic='YaHeiBold')
W,H=A4;M=43;PW=W-2*M
C=canvas.Canvas(str(OUT/'AI学院-作品介绍-RC2审核候选.pdf'),pagesize=A4)
C.setTitle('AI学院 作品介绍 技术发布候选');C.setAuthor('AI学院项目')
style=ParagraphStyle('body',fontName='YaHei',fontSize=11,leading=19,textColor='#263c35',spaceAfter=12)
captionStyle=ParagraphStyle('caption',parent=style,fontSize=9,leading=15,textColor='#526b61')
def txt(text,y,small=False):
 p=Paragraph(text,captionStyle if small else style);_,height=p.wrap(PW,H);p.drawOn(C,M,y-height);return y-height-12
def start(n,title,sub):
 C.setFillColorRGB(.96,.98,.965);C.rect(0,0,W,H,fill=1,stroke=0)
 C.setFillColorRGB(.07,.24,.22);C.setFont('YaHeiBold',26);C.drawString(M,H-68,title)
 C.setFont('YaHei',10);C.setFillColorRGB(.25,.4,.34);C.drawString(M,H-93,sub)
 C.setFont('YaHei',9);C.drawString(M,28,'AI学院 · RC2 0.4.1 · 2026-10-12 · 软件证据 / 非真人教学成效');C.drawRightString(W-M,28,f'{n} / 8')
 return H-122
def figure(name,box,y,desc):
 im=Image.open(EV/name).crop(box);width,height=im.size;dh=PW*height/width
 if y-dh<78:raise ValueError('Figure overflow '+name)
 C.drawImage(ImageReader(im),M,y-dh,width=PW,height=dh)
 return txt(desc,y-dh-10,True)
def finish():C.showPage()
y=start(1,'AI学院','AI+高等教育 / AI+教学 · 作品介绍正式候选')
y=txt('让学生留下自己的判断，再用真实科学模型检验它。AI学院把前测、预测、实验、证据解释、错因诊断和迁移复习连接在一个本机工作台中。',y)
y=txt('<b>关键词</b>：科学探究 · 证据学习 · 概念迁移 · 规则导师 · 数字生命',y)
y=figure('rc-home-1440.png',(350,65,1340,514),y,'图1 真实Edge页面。以原有森林绿工作台为基础，教学步骤与个人学习入口集中呈现；新版实验室由同一服务加载。')
y=txt('<b>适用场景</b>：高校新生的非线性动力学概念练习、科学探究课堂演示，以及经知情同意的匿名可用性试测。当前是本机RC2候选；已完成授权DeepSeek教学接口演示，默认无密钥时规则模式，真人样本0。',y);finish()
y=start(2,'从概念判断到真实数据','痛点与旗舰教学场景')
y=txt('学习者可能把“轨道不同”误判为“规律不同”。仅得到解释，无法确认原先怎样理解、怎样验证，以及是否能在新情境中迁移。学院保留原答案与事前预测，用实际数据推动下一步判断。',y)
y=figure('demo-pfl-evidence.png',(470,40,1390,625),y,'图2 固定PFL内核计算的真实轨道；点选结果回到服务器保存的原始数据核验。截图为隔离浏览器脚本演示。')
y=txt('<b>已实现的链路</b>：未预选前测 → 事前预测锁定 → 实际运行 → 曲线选点 → 规则追问 → 新预测与明确审批 → 单变量复算。计算的方程、条件、指标与来源一起留证。',y)
y=txt('科学假设未获支持不等于答错概念题；数值模拟也不等于现实实验。原G1-G4教学功能和科学快照保留，没有因视觉升级重建内核。',y);finish()
y=start(3,'让诊断可以被检查和否认','教学创新与个人证据')
y=txt('客观题在主动提交后才由服务器确定性评分。错题记录保留题号、原答、规则版本和时间；规则产生的概念误区只是候选，学生可以认可或否认。',y)
y=figure('demo-learning.png',(320,280,1285,638),y,'图3 客观错题的原始选择、评分依据与关联知识点。自动输入用于软件演示，不构成真人学习成果。')
y=txt('<b>新题迁移与延迟复习</b>：迁移题和复习变式均未预选，题干与前测不同。一次复测正确只记录本次表现，并安排三日后巩固，不显示虚构掌握率。',y)
y=txt('<b>学生控制权</b>：本机学习证据可展开、导出与清除；否认误区新增事件，保留原始依据。浏览器localStorage可编辑，因此不是防篡改的学校审计数据库。',y);finish()
y=start(4,'接入新版真实探索体验','V0.4呈现升级与科学保护')
y=txt('Physics Frontier Lab 0.4.0与EvoWorld 0.4.0固定静态产物随学院同源交付，无需另开两座上游服务。资源、字体和Worker子路由经过真实Edge测试。PFL主舞台读取真实离散点与探针；Evo生态箱可暂停、单步、选择与跟踪生命。',y)
y=figure('demo-evo-world.png',(143,375,1457,895),y,'图4 EvoWorld实际模拟的就近生命卡。形态与地表装饰不改科学模型；局部历史不是完整世界录像。')
y=txt('<b>至少一条可核验的承接</b>：探索页先保存独立预测，再加载实验室；读取真实tick、种群、能量、所选生命或PFL舞台条件指纹，连同反思、版本和预测事件引用保存到个人时间线。',y)
y=txt('自由探索与学院对照是不同运行，观察不计入题目成绩。回到学院继续权威内核的受控实验、导师追问与迁移题；没有虚构跨应用的数值同一性。',y);finish()
y=start(5,'真实模型与科学复核','DeepSeek成功调用与规则回退的区别')
y=txt('既有证据显示：DeepSeek V4.1 Flash在学生勾选授权后返回了中文教学回答。截图与JSON可复核，操作由自动浏览器执行，不是真人教学研究。未再次使用个人订阅凭据。',y)
y=figure('inherited-deepseek-detail.png',(0,0,895,425),y,'图5 2026-10-12既有真实网页截图的局部裁剪，不是连续生成录像。原截图、JSON及旧视频全部保留。')
y=txt('<b>保留真实失败案例</b>：历史回答将“43步达到0.01”归到了Float32对照。科学源核对显示，该指标属于两组Float64初值轨道差。连接成功不能证明模型解释全部正确。',y)
y=txt('<b>RC2可靠性增量</b>：提示明确提供指标语义；有限规则检查拦截阈值误报、Float32误归因、跳过审批、多变量建议与无依据的现实或提分主张，异常退回规则导师。此检查不是通用语义证明。',y)
y=txt('<b>视频证据边界</b>：新片连续录制当前产品操作，模型反馈段为明确标识的本机模拟；真实DeepSeek以历史截图另列并标出上述问题。配音继承13段Kokoro，不宣称新增真实AI直播或自治工具执行。',y);finish()
y=start(6,'本机运行与安全边界','技术架构与可复核来源')
for text in [
'<b>浏览器</b>：学习工作台、个人证据、匿名试测；固定同源实验室通过iframe按需加载。主动保存观测，收起实验室即卸载页面与Worker。',
'<b>学院服务</b>：Node本机HTTP服务、固定科学适配器、题目与确定性评分、规则导师、事前预测和单次审批令牌。真实科学结果由服务器保存，审批请求不能替换计算参数。',
'<b>来源锁定</b>：PFL HEAD 6b7174e；Evo HEAD 45abe82。PFL原有10项依赖与Evo原有11份科学文件匹配最新版上游。固定呈现53文件逐SHA校验；原G5文件保持。',
'<b>科学版本</b>：pfl-kernel-1.0.0 / evoworld-0.1.1没有变化。PB仅热平衡，MOS/CMOS为教学近似；每条件2个生态世界只示范方法，tick与个体不是独立重复单位。',
'<b>隐私与模型</b>：授权DeepSeek教学接口此前已在本机真实成功；默认无密钥时rules模式。本轮不新增真实模型调用，也不读取私人凭据。新探索路径无外部请求；实验室CSP限制连接同源。学校BYOK接口有真实演示及本机异常模拟测试，已有真实教学调用证据；不等于教学语义全面正确或公开服务许可已确认。',
'<b>运行门槛</b>：安装Node后双击START_AI_ACADEMY.cmd，打开127.0.0.1:4386。日常运行无需上游源码、Python、联网或npm安装。打包版保留本机启动与完整内核。']:
 y=txt(text,y)
y=txt('来源清单：adapters/pfl-provenance.json、evo-provenance.json、lab-experience-provenance.json。完整性核验与安装包收据随支撑材料提供。',y,True);finish()
y=start(7,'实测结果与未验证事项','应用成效严格限定在软件层')
for text in [
'<b>Node / API</b>：58/58通过，包括原49项科学、教学、审批、隐私及虚拟模型测试；新增超时、空正文、限额、网络失败、未授权、错误建议及Float32误归因回退检查。',
'<b>原有Edge回归</b>：5套共43项全部通过；新V0.4测试覆盖桌面1440px和390px触控视口的6组场景，Worker、真实交互、观测保存、返回课程与无横向溢出通过。',
'<b>来源与保留</b>：科学快照SHA无漂移；两座上游Git仍干净，HEAD未变；旧PDF v2与57.6秒MP4保留。原Node/浏览器日志及新截图可复核。',
'<b>材料候选</b>：8页作品介绍；新版连续产品演示约4分钟，1600×1000、H.264 / AAC、30fps输出，含继承Kokoro神经配音与讲解与烧录字幕。产品真实自动操作按讲解节奏剪辑，输出帧率不等于原生动画或物理显示帧率。',
'<b>真人研究</b>：真实学生样本0。已有匿名同意、导出、分析与观察手册，但尚无经人类核验的前后测、对照或学习提升证据。',
'<b>设备与长期运行</b>：390px为Windows Edge响应式与触控仿真，不是实体手机；Safari、Firefox、长期耐久和真人独立体验尚未验收。']:
 y=txt(text,y)
y=txt('技术回归通过只能支持“功能可运行”，不能支持“学生提分”或“优于普通AI”。推广前先实施有同意的真实课堂可用性试点，并保留失败、求助与退出情况。',y);finish()
y=start(8,'审核与正式提交前的办理事项','可交付候选与人类关口')
for text in [
'<b>审核候选材料</b>：打开作品介绍PDF与MP4，检查教学表述、字幕、旁白、来源和局限。源码/静态运行包与SHA清单可供现场复核。候选材料不构成正式上传回执。',
'<b>资格与身份</b>：用户已确认报名成功，仍需亲自核对报名回执、团队成员和指导教师要求。负责人姓名与所在学校未擅填；最终按赛道、作品名、负责人、学校命名。',
'<b>本人签署</b>：使用官方模板候选补全真实信息；逐条审核承诺内容，尤其知识产权与原文关于知识库的描述。负责人、成员按官方要求亲自签名，再生成扫描PDF。',
'<b>真实教学试点</b>：由人类招募自愿参与者、确认同意与学校规则，按既有手册独立评分和核验。没有数据就继续如实报告零，不以自动录像冒充真人。',
'<b>模型权限</b>：已有授权真实教学演示；若拟再次调用真实LLM，需另获服务商、费用与隐私范围授权。本候选默认规则模式，未携带个人订阅凭据。',
'<b>正式平台提交</b>：官网目前公布作品提交日2026-10-25，具体小时未明确。视频需≤10分钟、≤500MB；支撑材料≤100MB。本人完成平台上传并保存回执。']:
 y=txt(text,y)
y=txt('官网：agent.xjtu.edu.cn/aiic/cszn/csyq.htm（2026-10-12实时核对）。工程证据：docs/STATUS.md、docs/RC2_DELIVERY_20261012.md、evidence/rc2-20261012。原研究规范与G1-G4报告继续有效。',y,True)
finish();C.save();print('RC2_PDF_OK 8 pages')
