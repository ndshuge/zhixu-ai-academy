# 知序 Apple V5｜前端与 Apple 对照审查（2026-11-03）

## 范围、事实及目标
- 唯一产品：知序 AI 学院 `ndshuge/zhixu-ai-academy`；唯一正式评委 URL `https://ndshuge.github.io/zhixu-ai-academy/`；新施工仅触及 V5 源码，V4/R3/Original 不动。
- 本次使用真实 V5 本地静态 Pages 构建及 Original 学习科学桥。截图记录在本机 `E:\CHATGPT\_tmp\zhixu-ui-audit-20261103\` 和 `...-after\`，共前后各 15 张，宽度 390/768/1440，覆盖今天、课程、学习、资料、进度。
- 审查方向：学习优先的 Apple App Hybrid 材质，实验数据与真实记录优先，技术细节不挤占正文。不在页面上伪装 iOS 系统原生 Liquid Glass。

## ChatGPT 挂载 Skill 处理声明
- 已在 Chat GPT 使用 `skills__list` 检索，并通过 `skills__read` 读取 Chat 侧安装的 `apple-web-design`、`apple-liquid-glass`、`liquid-glass-web`、`motion`、`design-taste-frontend`、`frontend-dual-source`、`finesse-ui`、`impeccable`、`shuge-apple-design`、`prism` 及关联审查规则。
- **上述技能并非本机安装的插件。** Mice Hole 只提供文件/浏览器/命令执行；旧本地技能目录不是 Chat 插件的调用记录。完整规则在根目录 `AGENTS.md` 及项目 `E:\CHATGPT\projects\ai-academy\AGENTS.md`。
- APPLIED：Apple Web Design 的信息架构、Finesse / Impeccable 的字号与文案校正、Motion 的稳定按钮与同路由不重复重绘、Liquid Glass/Scroll Edge 的控制层级（CSS L1 fallback）。原版 Glass 与 Motion 运行时直接复用，未重新导入 React/Prism 或新 WebGL 引擎。仅 LOADED 而未 APPLIED 的 Skill 不计为执行。
- 官方参考：Apple `https://developer.apple.com/design/human-interface-guidelines/materials`、`https://developer.apple.com/design/human-interface-guidelines/tab-bars`、`https://developer.apple.com/videos/play/wwdc2025/219/`、`https://developer.apple.com/design/tips/`。参考内容不代表 web 能复现私有系统着色器。

## 先前实际截图的问题与本次代码
| 审计点 | 改前实际缺陷 | 改后与文件 |
|---|---|---|
| 手机/桌面首页 | 双重大标题、7 组英文大写技术标签、图例/脚注 9–11px | `views.js` 删除无用途英文、唯一主问题作 H1；`v5-ui-polish.css` 控制标题与图表说明字阶 |
| 手机版 dock | 大面积近乎不透明灰白底，滚动文字被一片白雾挡住 | `v5-scroll-edge.css` 渐进 blur+mask、保留独立 tab material 与安全区；轮廓仅 L1，不冒称系统 L2 |
| 手机版操作区 | 小按钮/标签 34–42px，原版文案像测试工具 | `v5-ui-polish.css` 触控目标扩大至 44px，`views.js` “开始前测”“开始迁移练习”等操作语义 |
| 桌面端 | 左栏“私人教师”、手机“学习”不一致，窄正文，顶部/中间目录标题重复 | `index.html` + `views.js` 统一短名称；`v5-ui-polish.css` 缩小中间栏、扩大阅读区域 |
| 切页/实验按钮 | 同一主导航重复点击会重建页面并重设滚动；“进入科学实验室”实际切到生命演化课程 | `v4.js` 同路由跳过重绘；首页按钮改为“亲手调节参数”并真实滚动聚焦可调的 Logistic 滑杆 |
| 学习页脚 | 重复的“此界面不改变评分方式”等工程说明干扰读题 | 去除主学习页开发者式解释，保留模型授权与数据边界在设置/操作位置 |

## 实际验证边界
- Node 原有与新增自动化：执行 `npm test`；版本路由、科学计算与前测均应回归。
- 浏览器：Edge + WebKit @320/390（dock）与 @390/1440（预览跳转→当前导航重复点击→前测试题真实加载），均基于本地 Pages 静态构建。
- 布局：390/768/1440 五个主要页面，截图无横向溢出、没有 JS page error；动态内容里的英文杂讯和 <12px 技术微字已消除。真实 iPhone Safari、VoiceOver、200% Zoom、帧率/光学折射 L2 尚未作为本轮验收结论。
- 不影响原版科学引擎、题库、AI 密钥连接授权、本地学习证据和原提交 ZIP 快照。
