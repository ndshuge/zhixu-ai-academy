# 知序 AI 学院 V6｜双科学实验功能整合与连续 UI 正式交接（2026-11-04）

## 权威源与发布边界

- 仓库：`ndshuge/zhixu-ai-academy`；正式站点：`https://ndshuge.github.io/zhixu-ai-academy/`，URL 不变。
- 本次施工基于已发布的 `main` `02f04cc68f6690c73b2297349fa4005b389d440e`，隔离工作树：`E:/CHATGPT/work/zhixu-v6-ui-core-motion-20261104`，分支 `feature/zhixu-v6-ui-core-motion-20261104`。
- 功能源（只读）：`E:/CHATGPT/work/zhixu-learning-core-br-20261104`，功能原 HEAD `a3e2bcdb6d3681bd8f7287b99934b7d6b3b116c5`；**只选择性集成独立的学习核、真实数据验证脚本和 EvoWorld 遥测扩展**，没有 cherry-pick 覆盖 V5 UI，也没有改动源功能工作树。
- 知序 V5 已发布的 UI 设计合同、Bottom Dock 原有材质/样式/位置/标签/选中逻辑、Original/R3/V4、原版科学引擎和 V2 学习证据均应保留。**本次改变的是 Dock 外部的专注内容和邻近背景退出/返回协同动画，没有重做 Dock。**
- 本次实现引用真实录屏与源代码审计：`docs/SHUGE_MOTION_REFERENCE_AND_VIDEO_20261104.md`（约 32.53 秒，512×1112 视频；`python.html` 视图栈/设置页；`design/apple-ui-动效实验室.html` 物理动画和边缘返回）。
- 最新 UI 根 URL 仍重定向到 `apple-editions/ai-academy-v5/`，内部控制器命名 `v4.js` **只是历史文件名，仍属于当前 V5 单页 UI**，不能回退成旧 V4。

## 新增的真实教学流程

| 阶段 | 执行源与证据 | 视觉承载 |
|---|---|---|
| 1. 前测 | 原版 `/api/learning/questions`、`/api/learning/grade`，选项初始全空；未给出前测标准答案 | `v5-core-ui.js` 选择控件 |
| 2. 独立预测 | 用户保存文字及经过校验的真实实验参数 | `v5-core-binding.js` 仅分发操作；学习核负责校验与状态 |
| 3. 正式科学实验 | **学生明确点击批准**后，通过同源 `ScienceBridge` 的 Original API 真正运行 | PFL 原始轨迹、非插值断点、可点选观测值；EvoWorld 独立随机种子配对与真实采样 |
| 4. AI/规则导师追问 | `requestStageCoach` 和 `requestMentor`，未验证模型时诚实回退**规则导师**；AI 使用需逐次明确同意 | 内容区的可读追问与标注，不生成假模型回答 |
| 5. 第二次单变量实验 | 学生提出目标→原版提出计划→填写第二次预测→**本人批准**，才运行真实对照，重复批准被阻止 | 对照计划及第二次真实 Run ID 与可视化 |
| 6. 反思与迁移 | V2 真实反思事件、原版迁移题评分和完成反馈；不伪造“已掌握” | 原版答案证据、真实判断、可继续或重新开始 |

独立模块源码：`apple-editions/ai-academy-v5/learning-core/`，从功能分支整合，包含 `v5-adapter.mjs`、`interactive-lesson.mjs`、`visual-evidence.mjs`、`stage-coaching.mjs`、`comparison.mjs`、`lesson-config.mjs` 等。扩展 `pages-overlay/pages-evo-pair.mjs` 仅增加 World 的实际步长人口采样，没有更改模型算法和上游验证哈希。

**状态边界**：原版科学证据仍写入 V2 学习存储；页面内临时学习步骤由 `makeCoreHost(bridge)` 驱动，切换首页可返回当前状态。刷新页面会**重新开始尚未持久化的交互步骤**，但不会删除原版 V2 真实历史事件；页面已明确提示。不得把临时 UI 状态冒充原版持久证据。

## 交互设计：鼠哥学院参考 → 知序真实实现

| 指定要求 | 已实现位置 | 物理/安全行为 |
|---|---|---|
| 左右滑动与跟手过渡 | `v5-page-continuity.js` | 手机主页面边缘横向拖动预览、方向判定、阻止垂直滚动和表单/图表误触；松手导航或者弹簧恢复；浏览器 History 支持返回。打开“减少动态效果”仍允许手势导航，只关闭视觉位移动画。 |
| 页面之间连续不闪切 | `v5-page-continuity.js` + `v4.js` | 保留旧阅读 DOM 的 `aria-hidden+inert` 短暂退场层，新视图分层推入；所有克隆 ID 移除，不截取/冻结 Dock，旧层结束或兜底定时自动清理；WebKit WAAPI 动画 Promise 不结束也不会留下幽灵页。 |
| 设置页分组与按钮细节 | `v5-spatial-continuity.css`、`v5-press-feedback.js` | 安静分组、44px 以上控制、动作回弹、无错误的无动作按钮；不把设置加到 Dock。 |
| DeepSeek API Sheet 连续进入/退出 | `v5-surface-continuity.js` + `v5-native-api.js` | 触发控件附近作为变换起点，背景渐变，Sheet 可逆退场、延迟卸载；用户 API Key 仍仅在本页内存，输入不会自动唤起移动键盘。 |
| 确认弹层 / 撤销 | `v5-surface-continuity.js` + `v4.js` | 取消/确认均反向退出后移除，用户必须主动确认清空 V2，点击遮罩或 Esc 关闭；焦点按需返回触发按钮。 |
| 知序博士对话 | `v5-doctor-motion.css` / `v5-spatial-continuity.css` + `v4.js` | 博士弹层位置和缩放连续转场、正文微幅后撤、关闭至完成才卸载，快速重复切换可反转；无可验证 API 时不伪造回复。 |
| 专注学习与 Dock 协调 | `v5-focus-navigation.css` + `v5-focus-smoothing.css` | **保持现有 Dock 的下滑动画和材质**；外围模糊渐退、顶工具栏高度/透明度平滑缩回，隐藏后 inert；学习页明确退出按钮，恢复时反向播放。 |

**注意**：视觉相似性来自实际录屏/原源码的动效机制映射，不宣称已实现完整跨任意元素的原生 Apple Magic Move、Skia L2 折射或 iPhone 真机 120FPS 验收。设计上的全局可退场连续性已由真实双引擎模拟浏览器回归覆盖。

## 工程接口与组件位置

- 入口与默认版：`docs/index.html` → `apple-editions/ai-academy-v5/index.html`。Production 由 `.github/workflows/deploy-pages.yml` 的 `scripts/build_pages_from_source.py` 生成 artifact；保留 `original.html`。
- 页面路由：`#today`、`#learn`、`#library`、`#growth`、`#settings`，其中 Courses 独立页已删除、不可复活。入口选择 `sensitivity`、`logistic`、`evo-pair`；PFL 和 Evo 接入新核，Logistic 继续走原版兼容流程。
- 真实功能主机：`v5-core-binding.js` 的 `makeCoreHost(bridge)`：`start(experiment,{restart})`、`snapshot()`、`action(button)`、`submit(form)`。不得将原版 API Key 或科学数据直接写进 CSS/全局动画状态。
- 数据展示：`v5-core-ui.js` 导出 `renderCore(snapshot)`、`coreOutline(snapshot)`、`coreStep(snapshot)`，仅消费新核快照渲染，HTML 字符串经过 `esc()`，不模拟数值；视觉限制在 `#screen .core-learning`。
- 原版适配：`bridge.js` 的 `ScienceBridge` 与 `#original-engine` 同源 `/zhixu-ai-academy/learning.html?zhixu-v5-session=1`，不改变 Origin、V2 Schema 和模型安全授权。
- 博士浮层 `#doctor-panel` / `#doctor-launch` 由 `v4.js` 的 `state.chat` 和 `bridge.modelStatus/modelAsk` 控制；私有聊天仅当前 JS 内存，不应在合并时存 Key、伪造回复或假装会话永久同步。
- 源文件缓存标识 `20261104-integrate-b` 用于已变化的 `v4.js`→`bridge.js`→`v5-native-api.js`、`views.js`、`v5-press-feedback.js`；新增 CSS/模块有独立版本参数，确保最新 UI 不被旧缓存覆盖。

## 实际执行与验收结论

- `npm test`：**262/262 PASS**，无失败；原先一次 `agent.test.mjs` 在自动选择随机本地端口时偶然碰到 Node/Undici 禁止端口，独立复跑 13/13 PASS，再跑全量 262/262 PASS。没有删除或放宽这项安全测试。
- `npm run verify`：**AI_ACADEMY_VERIFY_OK**；PFL SHA256 `88f7c1a189aeb1870ae522a6e90d0de0eb00e893ad467dae9c6743e40a6c4a92`，Evo SHA256 `45466224cc6ce12510cb301ccfffbef653a9704bb6e18cf4e2937521162e1263`，`pflUpstreamChanges=0`、`evoUpstreamChanges=0`。
- 本地 Edge + Playwright WebKit：`browser-v5-route-matrix.cjs` 五页×四宽度 320/390/768/1440 均通过（每浏览器 4/4）；`browser-v6-spatial-surfaces.cjs` 设置/博士/BYOK/确认/返回/reduced 在 390/1440 双引擎均通过；`browser-v6-gesture-focus.cjs` 两浏览器实测按压、边缘拖动、禁用垂直误切、Dock 显隐和减弱动态效果；`browser-v5-byok-failures.cjs` Edge/WebKit 390/1440 共四组模拟授权失败防护全部通过。
- `browser-v6-integrated-learning.cjs`：Edge PFL、Edge Evo、WebKit PFL、WebKit Evo **四组均完成真实流程**。包括从默认未选择的前测直到迁移、明确批准单变量第二次运行、PFL 原始点/Evo 真实配对观察、规则引导、V2 Event 写入、首页继续与重新加载后的安全课程入口。WebKit Evo 的长流程初次经有时间上限的 bounded bridge 会在输出成功后发生工具超时，改用 persistent process 等待最终 **exit code 0**，解决了证明不足的问题。
- 曾发现浏览器验收误把转场中的旧 DOM 克隆当成最新学习页，已将断言锁定 **`#screen[data-page=learn] > .core-learning`**，保留了真实回归检测而非删除它。
- WebKit 有一次退场克隆的 `WAAPI.finished` 未按时结束，现加了固定时限 650ms 清理兜底；双浏览器回归通过。
- 实际 Edge 390 截图 `evidence/browser/v6-ref-settings-edge.png` 已人工复核；核心和各页面浏览器截图在本地 `evidence/browser/`（ignored，不包含用户 API Key）。WebKit 内核 ≠ 真实 iPhone Safari，未实测 VoiceOver、真实设备帧率和在线付费模型 Key。

## 仍需后续/不属于这次代码完工的外部验收

- **真实 iPhone Safari / iPad Safari** 的逐帧卡顿/发热、VoiceOver、200% 字体、各种辅助技术人工验收；当前提供 Windows Edge/WebKit 的模拟与浏览器检查，不能伪称真机。
- 模型 API 正式调用会产生费用，此次仅模拟失败/权限路径、真实规则导师，**没有主动使用用户密钥请求付费模型**。
- 研究型真人学习效果、科学结果与实际自然系统之间的外部效度仍不能由浏览器自动化判定。
- 原版 V2 **真实证据永久保存**，但新功能核阶段草稿刷新后重新开始，当前页面有明确提示；如需跨刷新无损继续，应以 V2 权限/事件为事实源设计后续兼容迁移，不得直接伪造科学运行记录。
- 正式线上部署必须经过非强制 push、GitHub Actions 成功、再真实访问验证；本文件的本地测试事实不能替代线上成功状态。

## 安全发布命令与不可跨越边界

```powershell
cd E:/CHATGPT/work/zhixu-v6-ui-core-motion-20261104
git status -sb
git ls-remote origin refs/heads/main
npm test
npm run verify
# 本地构建由现有 .github/workflows/deploy-pages.yml 调用
# 确认 main 无外部新提交后，使用：
git push origin HEAD:refs/heads/main
# 禁止 --force；推送后必须检查 Actions + 正式 URL
```

**绝不修改**其它并行 UI / 功能工作树、比赛 Original/R3/V4 文件、原版 PFL/EvoWorld 核与既有 V2 学习数据。任何新的功能实现必须通过原版科学证据与现有设计契约。
