# 知序 Apple Edition｜真实验收与 Skill 使用记录

日期：2026-10-28。运行环境：Windows Microsoft Edge Headless，Node 本机预览服务器 + 正式 GitHub Pages 原版业务接口。

## 原版保护

原版产品源文件在 `E:\CHATGPT\projects\ai-academy`；原版线上入口：`https://ndshuge.github.io/zhixu-ai-academy/`。本次 Git 改动范围限定 `little-works/ai-academy-apple/` 与 `little-works/catalog.json` 新增一条目录记录。原版比赛链接、原代码、原版路由不改变。

## 功能自动化

- **基础测试 30/30 PASS**（`qa/browser-report.json`）。覆盖 320、390、768、1024、1440px；Original 同源 API adapter、原版 V2 数据模块、真实题库加载、未预选选项、真实评分和记录、学生预测、Logistic 数学运行、两条实际数据曲线、规则导师、原版两道独立前测题与两道独立迁移题（敏感性课程）、刷新后的学习证据、真实 Motion 加载、Liquid Glass SVG filter 创建、无页面 JS 抛错与资源 404。
- **深入测试 20/20 PASS**（`qa/extended-report.json`）。覆盖 390px 六大页面、AI BYOK 原版连接界面开关、原生 `lg-segmented` 与学科切换、答题提交未选择时禁用、真实 EvoWorld 运行、导师规划和学生审批后第二轮真实运行、V2 实验记录由一次增加为两次、课程长按与取消、减少动态效果模式、原版/新版并排对照。
- 后续视觉审计发现生态实验此前只显示空指标，已补充真实 EvoWorld `results` 四行对照表并重新进行最终回归；原生分段控件对齐亦调整。

**说明：** 以上是自动化测试断言数，不能替代设计审美评分，也不等于 Apple 原生应用质量认证。真实 DeepSeek 模型因未由用户提供验证凭证而未进行带费用调用，默认规则反馈已验证。

## 已实装的 Skill 引擎

| 来源 | 实际应用 | 运行证明 |
|---|---|---|
| SHUGE Apple Design — Fidelity First | 设计方向、对比、信息组织与品质门槛 | `design-studies/` 3 套高保真方案及 3 张真实浏览器截图 |
| Apple Web Design | 真实 Apple Books、Music、Notes、Health、Settings 研究与阅读优先的布局 | 5 个断点截图、独立学习/资料/课程/进度/设置 |
| Apple Liquid Glass | 统一材质和 Token、控件优先而非内容卡片泛玻璃 | `assets/apple-tokens.css` 已导入页面 |
| Liquid Glass for the Web | 复用现成光学与 Web Components，未重写折射 | `assets/liquid-glass.js` / `components.js`，原生 `lg-navbar`、`lg-lens`、`lg-segmented`，SVG filter 真实产生 |
| Motion | `animate`、`motionValue`、Spring、`getVelocity`、可中断按压/反弹 | 本地 `assets/motion.bundle.js` 来自 Motion v14.7.1；浏览器验证引擎确实加载 |
| Design Taste Frontend、finesse、Impeccable、Prism、Frontend Dual Source | 设计审计、交互间距、动效语义、审美和复用边界 | 作为研究与评审规则，不宣称这些资源引擎全部被实际编入代码 |

**真实材料类型：** 当前使用 SVG displacement/filter 和可复用 Web Component 光学材质；不是以普通 CSS blur 冒充所有 L2。没有实现新的 WebGL Shader，也没有验证 iOS 真实 GPU 120Hz。

## 可视化证据

- 三种候选方案：`qa/direction-clean-390.png`、`qa/direction-immersive-390.png`、`qa/direction-hybrid-390.png`（选择阅读优先 Hybrid）。
- 主页面：`qa/apple-home-320.png`、`apple-home-390.png`、`apple-home-768.png`、`apple-home-1024.png`、`apple-home-1440.png`。
- 移动学习：`qa/extended-learn-390.png`、`qa/extended-evolution-experiment-390.png`、`qa/extended-courses-390.png`、`qa/extended-library-390.png`、`qa/extended-growth-390.png`、`qa/extended-settings-390.png`。
- 原版比较：`qa/original-edition-390.png`、`qa/original-edition-1440.png`、`compare.html`。

## 性能与降级

`qa/perf-report.json`，仅为本机 Headless Edge + 回环预览数据，不是公网或 iPhone 真机结果：

| 指标 | 390px | 1440px |
|---|---:|---:|
| 同源原版业务引擎准备好 | 1176ms | 636ms |
| DOMContentLoaded | 294ms | 128ms |
| FCP | 564ms | 180ms |
| 当前页面报告 JS Heap（不是含 iframe 全量内存） | 3.67MB | 3.17MB |
| SVG optical filter 个数 | 3 | 3 |

减少动态效果媒体查询已测试为 true，按钮微动效降到 0.01ms。缺口：没有完成真实 Safari/iPhone/iPad 手势手感测试、耗电检测、设备 60/120Hz 稳态帧率及公网指标，也未量化对真实 Apple 应用的视觉相似度。

## 2026-10-28 · 继续施工增量

- 首次空白修复：主文档直接包含可阅读的真实课程入口与原版后备链接，等待 JavaScript / iframe 时不再是空页面。主动阻断 Apple Edition 脚本，在 390px 与 1440px 验证 **6/6 PASS**（`qa/first-paint.mjs`、`qa/first-paint-report.json` 及两张屏幕截图）。
- 真正复用原版当前阶段题库：对于敏感性课程按原版提供的两道前测与两道迁移完成题目领取、独立选项、逐题评分与 V2 本地事件；生态课程按实际可用题目数量运行，不杜撰第二题。前测继续延迟显示答案，不把实验猜想误记成错题。`qa/test.mjs` 新增全部题目覆盖测试。
- 所有选择题初始 radio 均为空，必须主动选择才能提交；切换到下一道题后重新获取原版的答题令牌，不复用上一题。
- 异步 UX：Motion 与原版连接并行加载；科学引擎准备前提交或加载题目会等待真实连接而不是突然报错。数据与模型密钥的权限边界保持不变。
- 复验：基础 **30/30 PASS**、扩展 **20/20 PASS**、首屏回退 **6/6 PASS**、无页面未捕获异常。此前报告 25/25 是本次修复前基线。
- 性能报告按本轮 `qa/perf-report.json` 更新：将隐藏原版完整首页改为原版轻量学习页，动态载入未改动的原版 BYOK 模型模块。同环境轻量版 390px 为 1.176 秒、1440px 为 0.636 秒；此前完整首页测试在网络波动时曾达 9.08 秒。这是一次本机 Edge 对比样本，不能当作稳定线上速度承诺。外部网络性能与真实 iPhone Safari **未验证**。

## 已知限制

1. 原版仍不具备完整自动学科知识图谱、学校成绩接口、真正全学科自主教师，Apple Edition 未伪装。
2. 新版以同源 iframe 复用原版：优点是比赛业务逻辑完全不分叉、共享 V2 数据；代价是原版资源必须可访问且隐藏 iframe 装载成本较高。长期理想路线是业务 SDK / 稳定 API 契约，必须另行低风险项目。
3. 用户必须亲自配置原版模型并且对每次发送实验摘要授权。无 Key 时为真实规则导师，不冒充大模型。
4. 这是一套经过真实浏览器回归的独立产品前端，不代表 Apple 官方认证或真实 iOS 原生应用。

## 复验命令

在仓库根目录，先运行 `node little-works/ai-academy-apple/qa/serve-dev.mjs`，再运行 `node little-works/ai-academy-apple/qa/test.mjs`、`node little-works/ai-academy-apple/qa/extended.mjs`、`node little-works/ai-academy-apple/qa/perf.mjs`。脚本通过单独测试环境中的 Playwright 在 headless Edge 运行，不是产品线上依赖。


## 2026-10-29｜R3 Apple 学习工作台重构与验收

**实施边界**：只修改鼠哥星系的 Apple Edition（`little-works/ai-academy-apple/`）；`/zhixu-ai-academy/original.html` 原版、原版科学引擎和用户数据格式保持不变。基于新建、与生产 main 隔离的 Git worktree 施工。

**产品方向与对照**：使用 SHUGE Apple Design、Apple Web Design、Liquid Glass for the Web、Motion、Frontend Dual Source、Taste-Skill（app 模式）的 ChatGPT 原生 Skill 指导；查阅 Apple Human Interface Guidelines 的 Materials、Tab Bars、Sidebars；实际浏览 Designeer Components/Inspiration、Motion Primitives / Minimal Gallery 条目及 Motion Primitives 原站。Taste 原版 `draw.mjs --app --kind workspace` 抽取两种方向，采用 `editorial-greeting` 的信息优先方式，但以 Apple 系统字体替代外部英文字体，拒绝给所有卡片加玻璃或渐变。Motion Primitives React 组件未引入，因为当前应用为原生 JS；仅采用与已授权、已有代码兼容的操作原则。

**实际改动**：
- `app.js`：将「今天」「课程」重写为原生式学习工作台与真实两课程分组；学习、资料、成长、设置保留既有逻辑，统一原生分组视觉；新首屏「继续探索」进入真实原版科学探究流程，课程卡继续绑定 `enter-sensitivity` / `enter-evo`；将新 R3 主按钮纳入已有 Motion 真实弹性按压选择器。
- `native-proof.js`：由固定 Logistic 方程本地计算、只用于视觉预览的两条曲线，绝不参与题目评分。
- `native-r3.css`：真正改动版式与内容层级；移动端内容先于曲线、简化图标、修复 768px 侧栏挤压；iPhone 底部沿用已集成的 `<lg-navbar>` 折射 Web Component，缩小悬浮博士入口，保持可展开会话和键盘关闭。
- `index.html`：CSS 在首帧已生效，原有旧版无 JS shell 改为与新版几何布局一致的静态后备。避免旧卡片先闪现。

**已真正执行的第三方资源（不是仅阅读 Skill）**：现有 `assets/components.js`、`assets/liquid-glass.js` 与 `assets/motion.bundle.js` 被应用加载。独立 Headless Edge 运行检测：`lg-navbar` 已注册，`feDisplacementMap` 为 2 个，浏览器计算式 `filter:url(...)` 为 1 个，`window.ZHIXU_APPLE_NAV_SCRUB` 有值，Motion 引擎实际返回 `Motion`。MIT 授权随原项目保留，没有新增私有 Apple 资产。

**真实命令、测试结果**：
- `node _native_r3_test.mjs`（工作区本地测试）：24/24 PASS；0 页面异常、0 HTTP 资源错误；320/390/768/1440 不横向溢出；课程入口、五页面、底部导航、博士弹出/ESC、空 radio、同源原版桥与 BYOK 模块均核验。
- `node _flow_probe.mjs`：原版真实第一题通过同源科学接口加载，3 个 radio 全部初始未选择；本次未调用任何付费模型或读取用户密钥。
- `node _optics_check.mjs`：验证上述原版折射引擎与 Motion 真正执行。
- `node _first_paint_test.mjs`：禁用 JS 与动态版的 390px 科学卡片坐标及尺寸完全一致（x=39、y=219.4375、width=312、height=495.75）；没有旧 `reading-hero`。
- 原版 Taste Inspector `inspect.mjs --app --widths 1440,768,390`：先四项 FAIL，经两轮 look→fix→look 达到 **0 FAIL**、剩余 3 WARN（图表/边框判读、小屏 11–12px 导航/图表辅助标注比例、34px iOS 风格大标题）。这三个警告不会被宣称为自动审美认可。
- 真实截图与 JSON 放在本机独立工作区 `E:/CHATGPT/work/zhixu-native-rebuild-20261029/evidence-native-r3/`，含首页宽度四档、五个功能页、静态首帧与 Taste 三档截图。

**验收边界**：上述均为 Windows Edge/模拟视口与同源原版浏览器测试；真实 iPhone Safari 触摸帧率、GPU 折射性能及人类艺术签收未获实机证据，不得标记为已测。生产替换必须重新获取最新 main 并使用普通非强制 Git 推送，发布后再次检查公共 URL；保持 Original 版回退入口。
