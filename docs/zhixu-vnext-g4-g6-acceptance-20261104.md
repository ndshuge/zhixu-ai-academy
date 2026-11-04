# 知序 AI 学院 VNext｜G4–G6 局部验收与未闭环清单（2026-11-04）

## 授权边界与工作树
- 唯一当前 UI 施工：`E:/CHATGPT/work/zhixu-design-vnext-20261104`，分支 `feature/zhixu-design-vnext-20261104`。
- 正式 `origin/main`、GitHub Pages 评委入口、其它正在施工的工作树保持原状；本报告不等于发布许可。
- **完整 Dock 冻结**：无底栏 HTML、图标、选中状态、玻璃/模糊/渐变、动画、焦点、显隐控制的改动；不借本报告为 Dock 施工解禁。
- Original / Apple R3 / Apple V4 / 科学引擎 PFL、EvoWorld 证据、BYOK 密钥授权边界均不修改。已移除的 Courses 路由不恢复。

## 本次真实实现
| 对象 | 缺陷/动机 | 改造范围 | 状态 |
|---|---|---|---|
| 四步科学学习 | 已进入预测、验证或迁移但大标题仍是「从判断开始」 | `views.js` 针对真实 `lesson.step` 显示四个阶段准确标题/副标题 | IMPLEMENTED + BROWSER_VERIFIED |
| 学习内容冗余层级 | 页面标题、四段进度条与正文「01/02/03/04」重复 | 删除四处重复正文阶段编号；保留题目「第 n / m 道」信息 | IMPLEMENTED + UNIT_VERIFIED |
| 迁移测验 | 迁移题底部误显示前测不公布答案的提示 | 分别标注前测和迁移，原版评分结果保持真实 | IMPLEMENTED + UNIT_VERIFIED |
| 学习步骤切换 | 切换步骤时正文瞬间换内容，长页滚动位置及阅读焦点不连续 | 新增独立 `v5-lesson-motion.js`，仅对 `.learning-paper` 做 300 ms 轻量 WAAPI 进入；向前/向后方向相反；步骤切换将文档滚到顶部及新标题接管焦点 | IMPLEMENTED + EDGE_WEBKIT_VERIFIED |
| 系统减少动态效果 | 正文切换要尊重系统和用户偏好 | 在 `reduced=true` 时无正文动画，保持焦点和滚动处理 | IMPLEMENTED + EDGE_WEBKIT_VERIFIED |
| 资料页侧栏 | 两行纯统计内容被伪装成点击后无反应的按钮 | 仅把 `outline('library')` 中两个无处理器的 button 改为静态 div，保留原有文字与排版 | IMPLEMENTED + UNIT_BROWSER_VERIFIED |
| 设置页重复标题 | 工具栏与正文连续两次显示「设置」 | 只在 `#screen[data-page=settings]` 把正文标题视觉裁切，保留 H1 无障碍语义和原工具栏 | IMPLEMENTED + UNIT_BROWSER_VERIFIED |

**技术选择**：针对被替换的学习正文做本地 WAAPI；没有尝试全屏 View Transitions 或共享元素快照，因为它们会捕获用户已冻结的 Dock 或带来 WebKit 兼容性风险。未引入 Skia、CanvasKit、新运行时或付费依赖。现阶段**不能宣称已实现 Apple Magic Move 或原生 L2 玻璃折射**。

## 真实执行证据
- `npm test`：**193/193 PASS**（2026-11-04 复跑；原先 G3 为 181/181）。
- `npm run verify`：**AI_ACADEMY_VERIFY_OK**；PFL SHA256 `88f7c1a189aeb1870ae522a6e90d0de0eb00e893ad467dae9c6743e40a6c4a92`、Evo SHA256 `45466224cc6ce12510cb301ccfffbef653a9704bb6e18cf4e2937521162e1263`，原始证据没有改动。
- `tests/browser-v5-stage-focus.cjs`：**Edge 4/4 + WebKit 4/4**，320/390/768/1440 宽度，覆盖首题→预测、返回阶段、步骤方向、焦点、顶部滚动、Reduced Motion、水平溢出、异常/404。
- `tests/browser-v5-route-matrix.cjs`：**Edge 4/4 + WebKit 4/4**，每档检查今天/学习/资料/进度/设置，共 40 个 route×browser×width 组合，检查无 dead button、无横向溢出、路由后主内容焦点、异常/404。
- `tests/browser-v5-learning-continuity.cjs`：Edge 390/1440、WebKit 390/1440 均通过；选择草稿、Back、首页继续、前测隐私、下一题默认不选。
- `tests/browser-v5-focus-navigation.cjs`：Edge 与 WebKit 的 195/390/1440 检查通过（既有已验证脚本）。
- `tests/browser-v5-byok-failures.cjs`：Edge 与 WebKit 的 390/1440 模拟 BYOK 失败状态通过；无真实 Key 或付费 API 调用。
- `tests/browser-v5-full-journey.cjs`：**Edge 和 WebKit 均通过真实敏感性科学实验**，9 条事件、4 次作答、1 次原版科学运行、V2 JSON 导出持久化、0 JS 异常、0 缺失资源。
- `tests/browser-v5-system-appearance.cjs`：两浏览器的 390/1440 light/dark 全站已有检查通过；脚本自身显示 `40/48`，剩余是统计中的不适用项，不冒充额外 8 个通过。
- 截图存于本地 ignored `evidence/browser/`，包括 `vnext-learning-prediction-390.png`、`-1440.png` 及 `vnext-route-{today,library,growth,settings}-390.png`。已实际打开、查看手机预测和桌面预测以及资料、进度手机页面；不能以「截图存在」替代视觉检查。截图不包含真实密钥。

## G4–G6 状态分级
| 项目 | 实施 | 技术证据 | 尚需验收 |
|---|---|---|---|
| G4 目的明确的非 Dock 步骤动效及 reduced motion | 是 | Node + Edge + WebKit | 真实 60fps、滚动中断/多次连续交互的物理细节；**全站共享元素 Magic Move 未实现** |
| G5 可读性/信息层级与路由控件审计 | 本轮重点完成学习、资料页和设置页 | Node + 5 路由 4 宽双浏览器 + 部分截图实看 | 细粒度全状态视觉逐像素对照、真实 200% 字体/VoiceOver、完整动效录屏艺术评价 |
| G6 科学数据/API/发布前保护 | 本地科学/BYOK 回归通过 | `npm test` + `verify` + Edge/WebKit 完整科学路由 | **真实 iPhone Safari、VoiceOver、实机功耗/60fps、真人学习效果、用户审美签收未验证** |

**结论**：本轮改动具备**本地技术合格证据**；整个高质量 Apple 级产品任务尚不能宣称全部完成。禁止用浏览器模拟器冒充真机。正式 GitHub/Pages 未发布，后续与功能分支集成需处理并行差异，不能覆盖别人的工作树。

## 独立复现命令
```powershell
cd E:/CHATGPT/work/zhixu-design-vnext-20261104
npm test
npm run verify
$env:ZHIXU_PREVIEW_ROOT='E:/CHATGPT/work/zhixu-design-vnext-pages-preview-20261104'
$env:ZHIXU_QA_ENGINE='edge'    # 或 webkit，分别重复
node tests/browser-v5-stage-focus.cjs
node tests/browser-v5-route-matrix.cjs
node tests/browser-v5-learning-continuity.cjs
node tests/browser-v5-focus-navigation.cjs
node tests/browser-v5-byok-failures.cjs
$env:QA_ENGINE=$env:ZHIXU_QA_ENGINE
node tests/browser-v5-full-journey.cjs
```
