# 知序 AI 学院｜最新版 UI 发布与功能集成交接（2026-11-04）

> **唯一权威 UI 基线**：`329d21fb4052b625edcde7cf98d52fa71cbb6eb1`（此前 UI 改造 `7947d26`、`e5b060a` 均包含在内）。这是本次上线候选 UI **代码**的确切 SHA。后续发布文档提交不替代此 UI 基线；发布时请另外核对远程 `main` 的最终提交和 Actions 部署日志。

## 1. 工程权威、角色与严格边界

- 生产仓库：`https://github.com/ndshuge/zhixu-ai-academy`
- 正式评委入口：`https://ndshuge.github.io/zhixu-ai-academy/`（路径不变）。
- 当前 UI 唯一设计来源：`E:/CHATGPT/work/zhixu-design-vnext-20261104`，分支 `feature/zhixu-design-vnext-20261104`，UI CODE HEAD `329d21fb4052b625edcde7cf98d52fa71cbb6eb1`。
- 目标发布分支：远程 `main`，由上述 UI 工作树**非强制快进推送**；禁止对已有 57+ 工作文件的旧 `E:/CHATGPT/projects/zhixu-academy-pages` checkout 执行 reset/clean/checkout/pull。
- **另一条功能分支完全未纳入 UI 发布**：`E:/CHATGPT/work/zhixu-learning-core-br-20261104`，`feature/zhixu-learning-core-br-20261104`，核验时 HEAD `a3e2bcdb6d3681bd8f7287b99934b7d6b3b116c5`，比双方共同基线 `9c80713` 多五个功能提交；后续功能开发以 UI CODE HEAD 为设计/交互合同，对该功能分支进行**有选择的模块集成**，不能整体覆盖 `v4.js`、`views.js`、`index.html`、V5 样式。
- Root `AGENTS.md` 及既有 UI 交接 `docs/handoffs/zhixu-design-vnext.md`、`docs/zhixu-vnext-g4-g6-acceptance-20261104.md` 为限制/验收来源。独立 `STATUS.md` 在本 UI Git 工作树中未发现，以 Git SHA、这份文档及真实源码为准，不根据其他项目的 STATUS 猜测本项目状态。

**冻结项（对 UI 与功能对话都生效）**：整套底部 Dock 的 DOM、选中反馈、材质、玻璃、渐变模糊、向上区域清晰度、触控/长按/弹簧、显隐和导航策略；Original/R3/V4 历史版本；原始 PFL/EvoWorld 科学源和 SHA、V2 学习记录、BYOK 授权。任何整合必须保留这些能力；不要重建旧 Courses 页，不要把知序改造成生活管理/仪表盘产品。

## 2. 当前界面与路线图（真实 V5）

**部署入口**：`docs/index.html` 在正式根 URL 中优先重定向到 `/zhixu-ai-academy/apple-editions/ai-academy-v5/`；带 `?edition=original` 跳 Original，`?edition=r3/v4` 可访问归档。科学 iframe 依赖**同源**的 `/zhixu-ai-academy/learning.html?zhixu-v5-session=1`，不能把 Apple V5 独立迁到别的路径。

**真实 SPA hash**（`views.js` 中 `titles` / `screens` 是权威）：
| hash | 页面 | 用户操作 |
|---|---|---|
| `#today` | 今天 | 继续上次真实进度、交互式 Logistic 预览、选择科学世界（`sensitivity`、`logistic`、`evo-pair`）、最近学习数据 |
| `#learn` | 专注学习 | 单任务四阶段：独立判断→预测→真实实验/导师→迁移验证；退出后返回今天、可继续或返回已解锁阶段 |
| `#library` | 资料 | 真实待复习任务、作答记录、待核实误区。侧栏纯统计是**不可点击**的静态行 |
| `#growth` | 进度 | 真实事件、知识状态、实验/回答计数；禁止虚构掌握率和时长 |
| `#settings` | 设置工具页 | 字号（100/115/130/150%）、减少动态效果、课程重置、DeepSeek BYOK 连接、真实 V2 记录导出/清空、Original 回退；正文多余的「设置」标题视觉隐藏，保留语义 H1 |

导航：桌面使用 `master-sidebar` + 按需出现的 `outline-sidebar` + `reading-column`；窄屏使用已冻结的 `#mobile-tabs`，超窄屏有 `#zoom-more-menu`。设置是工具页，不应伪装成选中某个 Dock tab。进入学习模式时，既有专注行为将导航从视野中移开，退出后恢复，不要再叠额外的学习页顶栏。

## 3. UI 组件及不可回退的行为

主要源文件：
- `apple-editions/ai-academy-v5/index.html`：语义外壳、悬浮 Dock、博士弹层、toast、对话层、后台 iframe，以及所有 UI CSS/JS 的引用。不要以旧 `index.html` 替换。
- `views.js`：`screens={today,learn,library,growth,settings}`、`outline()`、课程选择卡、`quiz()`、`predict()`、`scienceRun()`、`resultsPlot()`、`esc()`，返回页面 HTML 字符串。数据只能通过明确传入的 `bridge/lesson/prefs` 渲染，模型文本/科学数据先转义。
- `v4.js`（**尽管文件叫 v4.js，这是当前 V5 的 SPA 控制器**）：`state={route,lesson,busy,chat}`、`goto`、`render`、`act`、`submit`、会话持久化、博士弹层；用户操作通过已有 `data-action` 和 `data-route` 分发。不可用历史 V4 脚本整体覆盖。
- `v5-learning-continuity.css`：续学卡、答题状态、无障碍视觉、仅内容级设置页重复标题处理；禁止写 Dock 选择器。
- `v5-lesson-motion.js`：`settleLessonStep(stage,{before,after,reduced,scrollTop})`，**只**为 `.learning-paper` 做短促方向性 WAAPI 进入，支持返回方向与 reduced motion；步骤改变移至顶部并将焦点交给新阶段标题，不动画整页/Dock。
- `v5-route-focus.js`：真实 SPA 路由变化将阅读焦点移到 `#screen`，同路由内容刷新**不抢焦点**。
- `v5-native-api.js`：V5 原生 DeepSeek 设置对话框、`nativeApi={open,close,revoke,status,ask}`，密钥仅在页面内存，连接测试和费用需要用户明确操作。
- `v5-lab-preview.js`：首页公式交互预览，不得当作真正的学习运行数据。
- `v5-focus-navigation.css`：学习专注模式，禁止在实验流程重新显示常驻 Dock。
- `v5-system-appearance.css`、`v5-type-motion.css`：亮/暗色、对比度、字体缩放与减少动态效果；不引入额外整页雾化层。
- `v5-doctor-motion.css`：博士弹层的 CSS 生命周期；不叠加另一个 WAAPI/Motion transform，确保中途反转能从当前视觉状态继续。
- 现有 `v5-xiaoya-dock.css`、`v5-dock-near-clear.css`、`v5-bottom-shade.css`、`v5-ios-continuity.css`、`v5-duo-perf.css`、`v5-press-feedback.js`、`v5-apple-swipe.css` 共同构成已验收的已有交互/材质，其中 **Dock 部分完整冻结**。
- 依赖仓库内已有 MIT Motion bundle 与 Liquid Glass；不得无依据添加 Skia/CanvasKit。CSS `backdrop-filter` 只算模糊，不宣称原生 iOS L2 折射或完整 Magic Move。

视觉要求：学习任务优先、页面清晰专注、主要动作可达、非仪表盘；不增加多余星芒、伪平台 chrome、重复标题/辅助说明。用户明确认可 Dock 上方保持清晰、仅 Dock 邻近渐进模糊，禁用不透明大面积白雾。用户此前明确表示**底栏无需改动**。移动端触控至少约 44px、避免键盘遮挡/长文横溢；桌面阅读宽度适中。

## 4. 实验与功能适配点（下一对话的工程合同）

**UI 本轮所用实验 ID**：`sensitivity`（初值敏感性）、`logistic`（非线性增长）、`evo-pair`（生命与演化）。入口来自 `today()` 的 `data-action=enter-sensitivity|enter-logistic|enter-evo`；学习页 `learn({lesson})` 由 `state.lesson.step` 控制阶段 0/1/2/3。四阶段任务的 `preIds/preIndex/question/grade/preChoice`、`prediction`、`run/approvedRun/mentor/plan`、`transferIds/transferIndex/transfer/transferGrade/transferChoice` 由现有 `newLesson()` 和 `v4.js` 消费；`step/highest` 确保只能回退到已解锁阶段。

**科学边界**：`apple-editions/ai-academy-v5/bridge.js` 定义 `ScienceBridge`，经同源隐藏 `#original-engine` iframe 的 `contentWindow.fetch` 请求原版接口，并通过 `/zhixu-ai-academy/learning-store.js` 记录 V2 事件。不改该隐藏 iframe 的 URL/协议、安全授权、存储兼容性。

已有接口（兼容合并前先核对真实返回结构）：
- `questionSet(stage,experiment)` → `/api/learning/questions?stage=...&experiment=...`；`getQuestion(itemId)` → `/api/learning/item`；
- `grade(question,answer)` → `/api/learning/grade`，通过 `recordQuestionAttempt` 写入真实学习事件；
- `run(experiment,prediction,form)` → `/api/run`，初值敏感性参数 `r,x0,steps,logDelta`；Evo `seed`；通过 `recordHypothesis` 记录 V2 证据；
- `mentor(run,note,approved)` → `/api/mentor`（`shareApproved` 仅经明确用户授权）；`propose(run)` → `/api/agent/plan`；`approve(plan,prediction,experiment)` → `/api/agent/approve`；
- `tasks/decide/refresh/export/clear` → 原版学习数据，不得用模拟计数冒充真实成长。
- `ScienceBridge.modelStatus/modelAsk` 转交独立的 `nativeApi.status/ask`，不能让未验证或失败的 Key 自动进入“已连接”状态。

**下一对话模块接入规则**：功能分支 `a3e2bcd...` 的 PFL 真实轨迹/逐点采样、EvoWorld 真实种群比较、AI 提问、第二次实验学生批准等，请作为独立数据/组件模块接入 `scienceRun()`、`resultsPlot()` 或适当的学习阶段子组件；优先为已有 `bridge` 新增非破坏性的 adapter 方法，向 `views.js` 显式注入真实科学结果，不得改动 `views.js` 全站路由、`v4.js` 的 Dock 控制或全量覆盖 V5 CSS。PFL/Evo 的 chart/观察必须标注真实原版数据来源、采样范围和伦理边界；如模块要求跨页面历史，要先设计存储迁移并测 `sessionStorage`/V2 证据兼容。**不要 cherry-pick 整条功能分支或直接复制旧 UI 文件**。

## 5. 知序博士的真实状态管理

- 全局按钮 `#doctor-launch`、面板 `#doctor-panel`、聊天 `#doctor-log`、输入 `#doctor-question`、表单 `#doctor-form`；开关仅使用 `aria-expanded`、`doctor-visible` 与关闭超时/transitionend 收尾；Esc 关闭并将焦点返回头像，弹层中途开关可逆。
- 对话缓存仅 `state.chat` 当前 JS 内存（最多保留约 10 条消息），**刷新/关闭不会保证永久保留聊天**；不擅自写 localStorage 或把 Key 放进对话。
- `doctorStatus()` 按真实 `bridge.modelStatus()` 状态启用/禁用输入与发送；未验证模型时博士可在实验阶段经原版 `bridge.mentor(...)` 提供**规则导师**，独立自由输入对话不伪造付费 AI 回复。
- `#doctor-form` 经 `bridge.modelAsk()` 请求经验证的用户自有 API 连接，成功追加经过 textContent 处理的消息，失败显示错误，不添加假答案；`#doctor-setup` 进入 `#settings` 的安全配置。
- 功能对话可提升实验阶段的追问质量、上下文证据与学生批准流程，但要区分 **规则/真实模型/未验证** 状态，不能绕过明确同意和网络故障保护。

## 6. 本地证据、发布工作流和待办

- 本 UI 完整工程：`npm test` **195/195 PASS**，`npm run verify` **PASS**；PFL SHA256 `88f7c1a189aeb1870ae522a6e90d0de0eb00e893ad467dae9c6743e40a6c4a92`；Evo SHA256 `45466224cc6ce12510cb301ccfffbef653a9704bb6e18cf4e2937521162e1263`。
- 既有 Edge + Playwright WebKit：`tests/browser-v5-stage-focus.cjs`、`browser-v5-route-matrix.cjs` 覆盖 320/390/768/1440、五路由、前进/回退、Reduced Motion、焦点、水平溢出与死按钮；`browser-v5-learning-continuity.cjs`、`browser-v5-focus-navigation.cjs`、`browser-v5-byok-failures.cjs`、`browser-v5-full-journey.cjs` 校验恢复、导航、授权与科学完整链路。**这些是本地技术验收，不等于 iPhone 真机。**
- 部署工作流 `.github/workflows/deploy-pages.yml` 从 `main` 触发 `scripts/build_pages_from_source.py`，复制 `docs/index.html` 为 Apple 首页、完整 `apple-editions/` 静态资源，并保留 `original.html`；通过 GitHub Pages artifact 部署到固定 URL。本次本地模拟完整流水线生成 198 个资源文件，含新版 `v5-lesson-motion.js` 和历史备份。
- V5 入口和资源的缓存版本已更新至 `20261104-ui-release-a`；**Dock 资源标识未修改**。可直接检索该版本字符串确认线上加载了此次 UI。

**尚未完成/不能夸大**：真机 iPhone Safari、VoiceOver、真实 60/120fps、全部物理手势帧级视觉验收、正式 Magic Move/shared element、付费 API 运营网络测试、真实学生效果研究；这些需后续独立验证。新的功能模块本次不集成。

## 7. 正式上线状态登记

> 本节在提交交接文件时写入的事实：最新 UI 已通过本地预发布打包和测试；**正式推送、Actions 与线上验证数据需以真实后续部署结果更新，不能把预发布构建当作正式上线**。

| 项目 | 状态 |
|---|---|
| UI 功能代码不可变基线 | `329d21fb4052b625edcde7cf98d52fa71cbb6eb1` |
| UI 工作树与分支 | `E:/CHATGPT/work/zhixu-design-vnext-20261104` · `feature/zhixu-design-vnext-20261104` |
| 预发布构建 | 通过，`E:/CHATGPT/work/zhixu-ui-release-artifact-20261104` |
| GitHub Pages workflow | `.github/workflows/deploy-pages.yml` |
| 生产 URL | `https://ndshuge.github.io/zhixu-ai-academy/` |
| 真正发布 commit / Actions Run / 线上验证 | **待真实发布完成后回填** |

## 8. 功能对话开工顺序

1. 只读核验远程 `main` 的最终 UI SHA、正式 Pages 的 `20261104-ui-release-a` 资源，以及本文件。
2. 在**新的安全整合 worktree** 比较 UI 发布 main 与功能 `a3e2bcd`；不要在两个原工作树直接覆盖。
3. 提取功能分支的纯科学模块/契约，列出对 `bridge.js`、`views.js` 的最小整合补丁，先写数据契约和浏览器测试。
4. 保留 V5 专注学习、Dock、博士弹层、答案默认未选、迁移解析、前后退方向、减弱动态、原版 V2 事件/BYOK；完成全量 Node + Edge + WebKit 科学路由回归。
5. UI 对话最终负责视觉与动作验收；功能对话只负责真实教学逻辑与原始证据。新功能最终合并需新的明确发布流程，不能回退本次 UI。
