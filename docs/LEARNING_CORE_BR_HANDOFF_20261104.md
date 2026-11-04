# 知序 V5｜Brilliant 式教学功能核交接（2026-11-04）

## 身份与接线边界

本工作由“知序功能”独立对话施工；另一个对话负责 Apple V5 UI。**本分支未改动任何 V5 页面、Dock、CSS、交互路由或 Original/R3/V4。不要把尚未接线的功能核宣称已在正式线上首页开放。**

- 本机独立工作树：`E:\CHATGPT\work\zhixu-learning-core-br-20261104`
- Git 分支：`feature/zhixu-learning-core-br-20261104`
- 基线：远程 `origin/main` 的 `9c8071319ef23d0b75064b9ced6facd59140fd47`（2026-11-04 接管时）
- UI 并行树（只读参考）：`E:\CHATGPT\work\zhixu-design-vnext-20261104`
- 施工范围：仅新建 `apple-editions/ai-academy-v5/learning-core/`、独立 tests 与本交接文档。
- GitHub Pages Workflow 会复制整个 `apple-editions` 目录，功能核 colocate 于 V5 后无需变更工作流。

## 功能文件与用途

| 文件 | 用途 |
|---|---|
| `apple-editions/ai-academy-v5/learning-core/interactive-lesson.mjs` | 单概念教学状态机、学生预测、明确批准真实实验、反思、迁移、三级规则提示、可供 UI 直接渲染的安全快照 |
| `apple-editions/ai-academy-v5/learning-core/logistic-model.mjs` | 可互动的纯 Logistic 公式预览；只在真实实验之后开放；`evidence:false`，永远不写入 V2 |
| `apple-editions/ai-academy-v5/learning-core/v5-adapter.mjs` | 对接现有 `ScienceBridge`、原版 V2 `appendLearningEvent`；原版批改与 PFL 实验路径完全复用 |
| `tests/interactive-lesson.test.mjs` | Node 单测：顺序/不泄题/错误/重试/反重复/科学预览/真实错因/持久化事务 |
| `docs/superpowers/specs/...`、`docs/superpowers/plans/...` | 施工设计与计划 |

## 对 UI 组的稳定最小接口

```js
// 在 apple-editions/ai-academy-v5/v4.js 中，和原 ScienceBridge 同目录：
import {createV5InteractiveLesson} from './learning-core/v5-adapter.mjs';

// 必须等 await bridge.connect() 成功，且 bridge.store / bridge.lib 已连接：
// 只创建一个 controller，不要放在 render() 内重复创建。
const lessonCore = createV5InteractiveLesson(bridge);

// 独立前测
let view = await lessonCore.start();
view = await lessonCore.submitPre(selectedIndex); // 0-based，不允许预选，UI 不展示前测结果

// 在“预测”界面读取控件内容，阶段从 predict -> ready：
view = lessonCore.setPrediction({
  text: studentPrediction,
  params: {r:3.9, x0:0.217, steps:150, logDelta:-10}
});
// 明确的独立点击批准，不可随 slider 修改自动调用：
view = await lessonCore.runExperiment(); // 内部复用 bridge.run('sensitivity',...)

// 此时才可以展示理论公式预览，需加“非学习证据”标签：
const preview = lessonCore.formulaPreview(); // {kind:'formula-preview',evidence:false,series:[...]}

// 观察与学生反思 -> V2 learning_reflection
view = await lessonCore.submitReflection(studentReflection);

// 迁移题由原版题库提供，真实评分由原版 bridge.grade 处理：
view = await lessonCore.loadTransfer();
view = await lessonCore.submitTransfer(selectedIndex);

// 教师提示，level 为 1/2/3，只使用规则与原版可信的后测错因：
const guide = lessonCore.hint(1);
// 任意阶段可重取不含正确答案和 attemptToken 的 UI 数据：
view = lessonCore.snapshot();
```

### `snapshot()` 字段及 UI 绑定

| 字段 | 含义 |
|---|---|
| `phase` | `idle → pretest → predict → ready → evidence → reflected → transfer → complete` |
| `question` | 仅在 `pretest` / `transfer` 返回 `{itemId,prompt,options,selected:null}`；初始不选任何选项 |
| `needsApproval` | `ready` 为 true；应展示明确的“批准并运行实验”操作 |
| `prediction` | 学生提交的文字与参数，不包含答案 |
| `experiment` | 原版科学返回的 runId、版本、指标、原版 plot 系列的**白名单字段** |
| `reflection` | `{text,saved}`；仅 adapter 持久化成功时 saved=true |
| `transfer` | **只有迁移题完成后**才包含 `{gradedResult,feedback,misconception,nextStep}` |
| `formulaPreviewAvailable` | 正式实验完成后才为 true；本地公式演示始终标记不是正式科学证据 |
| `busy` | 异步操作中可用于 UI 禁用按钮；不要在重绘时重建 controller |
| `progress` | 阶段索引与总阶段数，UI 可以映射自己的进度条 |

前测调用 `bridge.grade` 是为了原版 V2 事件，不把 grade 或标准答案返回 UI。真实迁移结果才可以显示原版评分。前测题/迁移题目前每轮取原版题组的第一个项目；这是**单概念样板课**，不是全学科课程覆盖。

### 与现有 V5 的冲突防护

- **UI 设计以另一对话的最新版设计参考与当前源码为准**，本功能分支不对视觉、Dock、导航、布局、动效提出保留或回退要求；唯一约束是学习证据真实性、操作授权和接口契约。
- 接入学习页时，应明确切换到新控制器，禁止旧 `v4.js` 路径和新控制器**各自再执行一次** `bridge.grade/run`，否则 V2 会重复记账。
- 不要以 `formulaPreview` 的轨迹覆盖真实 `experiment.plots`；分别清楚标注。
- 当前控制器只保留内存中的当次阶段。V5 旧 `zx-v4-lesson` 的序列化与本模块尚未打通；UI 合并时要确定中断恢复策略，不能默认“刷新永不丢状态”。
- 当前模块未自动调用 DeepSeek 或替学生执行实验；若 UI 想引入真实 AI 追问，须沿用现有 BYOK 验证与本次授权边界。
- 原版分数、真实 PFL 运行、V2 证据仍来自 ScienceBridge，不通过本模块推断掌握率或学习效果。

## 验证事实与待联调

- 用户范围纠正后复验：`npm test` **197/197 PASS**，其中教学核专项 **22/22 PASS**；`npm run verify` PFL/Evo 哈希无变化、`npm run audit:filenames` 名称检查通过、`git diff --check` 通过。这些都是本地软件验证，不代替真实 UI 和 Safari 联调。
- UI 接线代码是接口示例，另一个对话可按**最新 UI 设计**决定组件位置、动画、导航和事件绑定；不要求继续使用旧版本 `v4.js` 的具体视觉结构。

- `node --test tests/interactive-lesson.test.mjs`：13 项专项测试；包括重复点击、失败重试、存储回滚与可信错因提示。
- `npm test`：全量基线 175 项，加入 13 项后应为 188 项（以最终执行输出为准）。
- `npm run verify`：必须核对 PFL/Evo SHA 原样通过。
- `npm run audit:filenames`：只是名称安全检查，不能代表内容或密钥审计。
- 浏览器端真实 ScienceBridge / Pages / 真机 Safari 与 UI 接线后需要**重新做完整 E2E**：原版题库读取、评分、真实实验、反思存储、迁移、刷新恢复、网络失败、移动端键盘/手势、历史数据不丢。
- 此处测试使用合成题目、模拟科学 API 与真实 V2 store，并没有发生付费 AI 调用或真人教育研究。

## 第二阶段新增功能（2026-11-04）

- 新增 `learning-core/lesson-config.mjs` 课程配置，支持 `sensitivity` 与 `evo-pair` 两种真实科学实验；其它实验明确拒绝，不伪造空课程。
- 通过 `createV5InteractiveLesson(bridge, {experiment:'evo-pair'})` 进入 EvoWorld 教学流程（唯一种子参数 `{seed:12023}`）；其前测、实验、迁移调用原版 ScienceBridge 和 EvoWorld 引擎。
- `snapshot()` 新增 `experimentId`（原版实验 ID）和 `mentor`（真实来源白名单）；保留第一阶段旧字段。不同课程均不预选任何选项。
- `lessonCore.requestMentor({note:'我想知道如何解释观测', shareApproved:false})` 默认使用原版规则导师；只有调用者**逐次明确设置 `shareApproved:true`**，且 `bridge.modelStatus()` 已验证时，才能调用带授权参数的原版导师；不会从本模块读取或保存任何 Key。
- **用户最新范围纠正：只做 PFL 与 EvoWorld 两个实验。** 本轮曾额外加入独立 `startReview`/`submitReview` 错题复习入口，经用户指出已撤回。教学核在迁移检查后以 `complete` 结束，不暴露独立复习 API。原版 V2 学习记录及其历史能力保持原样，不对学习预测设定错题性质。
- `lessonCore.hint(1|2|3)` 现按学科上下文调整；实验指标有真实 `metrics` 时，可引用原版指标做引导；未评分前不会披露题目正确答案或服务器原始 token。
- Logistic 公式预览仅限 `sensitivity`，EvoWorld 严禁展示虚构的 Logistic 或演化轨迹；科学证据来自真正的 `experiment`。
- 新增专项测试 `tests/interactive-lesson-phase2.test.mjs`，并设置范围守卫：课程完成后不出现独立复习接口或页面状态。要求全量测试、科学校验通过后再整合。
- **兼容边界：** 当前控制器仍只保留内存状态，刷新恢复、真实 BYOK 付费网络、Edge/WebKit/iPhone Safari 学习 E2E、UI 新设计接线都未宣称完成。不能把未来 UI 提案当作本分支已合并。

## 第三阶段：真实可视化证据与更高参与度的导师（2026-11-04）

**功能方向以用户最新要求为准**：仅 PFL 初值敏感性和 EvoWorld 独立世界两种实验；重点强化真实过程、学生观察、科学解释和 AI 追问。UI 设计与动画表现**完全服从并行 UI 对话的最新参考与工程**，此分支不设任何 Dock、排版、材质、动效或视觉样式要求。

### 新增模块和真实数据

- `apple-editions/ai-academy-v5/learning-core/visual-evidence.mjs`：`buildExperimentVisualization(run,experimentId)` 统一返回 `schemaVersion,evidence:true,source:'official-engine-result',sourceRunId,engineVersion,views,metrics,limitations`。PFL `views[].kind='line'` 带真实坐标轴和原始点，`pickEvidencePoint(view,{plotIndex,seriesIndex,pointIndex})` 从原版曲线精确取点，不做平滑或伪插值。
- EvoWorld `views[].kind='grouped-bar'` 按随机种子配对显示“合作开启/关闭”的平均与结束种群，`pairs[].deltaMeanPopulation` 是**真实指标导出的描述性差值**；`summary.independentSeeds` 表示独立世界的种子数（而非 tick 数）。`pickEvoWorldPair(visualization,seed)` 只能选取已经观察到的种子。
- `pages-overlay/pages-evo-pair.mjs` 非算法性增强：在每一个真实 `World.step()` 后，每 20 tick 采样人口，保留 tick=0 和 tick=200，返回各 `results[].populationSamples=[[tick,population],...]`；不改变 World 算法、世界种子/配置/总步数或计算出的指标。
- `visual-evidence.mjs` 仅当**四组世界均有真实采样**时提供 Evo `views[].kind='line'`（`source:'official-engine-samples',derived:false`）。原版本机服务器 `computeEvo()` 目前只提供汇总指标，故相应图表只显示真实柱状比较，不生成时间曲线或动画。
- V5 `interactive-lesson.mjs` 的 `snapshot().visualization` 从正式实验后出现，`sourceRunId` 与本次原版科学调用一致。实验开始前不展示任何真实结果。缺失/不可绘制的科学轨迹点一律保留为 `null` 间隙，不删除原位索引、不凭空连线；点击缺失点必须拒绝，不能把用户选点错位交给导师。

### 可供任何新版 UI 直接接入的调用

```js
import {createV5InteractiveLesson} from './learning-core/v5-adapter.mjs';
await bridge.connect();
const core = createV5InteractiveLesson(bridge,{experiment:'sensitivity'}); // 或 'evo-pair'
await core.start();
// ... 保留原本 submitPre -> setPrediction -> runExperiment 明确批准。
// UI 可根据阶段、手势和信息架构自主决定入口，不需要搬旧 V5 视图。
const science = core.snapshot().visualization; // views/metrics/pairs/limitations

// 学生点选图上的原版数据（PFL）：
core.selectEvidence({plotIndex:0,seriesIndex:0,pointIndex:42});
// 或点选 EvoWorld 的一个真实配对种子：
core.selectWorldPair(12023);

// AI 导师可在预测阶段或实验后由学生主动请求：
await core.requestStageCoach({question:'我应该怎样检验这个假设？',shareApproved:false}); // 规则提示
await core.requestStageCoach({question:'我选中的这个数值说明什么？',shareApproved:true});  // 已验证模型且本次授权
// 结果可从 snapshot().coaching 读取，区分 mode:'rules'/'llm' 和 fallbackReason。

// 原版 runId 绑定的探究导师（已有真实实验后）：
await core.requestMentor({note:'解释本次实际观测',shareApproved:false});
// PFL 已选择点时由适配器把原版索引传给 /api/mentor。
// 必须得到导师反馈后才能提出同一实验的下一轮对照：
await core.proposeComparison({goal:'保持 r 和步数不变，只缩小初值扰动'});
// snapshot().comparisonPlan 是待批准、绝不自动执行的计划。
await core.approveComparison({prediction:'我预测缩小扰动后分离出现得更晚'});
// snapshot().comparison 只在原版 /api/agent/approve 成功后存在，含二次 runId 和真实图表。
```

**安全性约束**：UI 不可把滑块变化、滚动、页面切换、自动播放当作实验审批或付费模型调用；必须另设明显的批准操作。 `requestStageCoach` 即使选择真实 AI，仍需要 `science.modelStatus()===true`，同时逐次 `shareApproved:true`。若模型调用失败将显式降级为规则导师（`fallbackReason:'MODEL_REQUEST_FAILED'`），不能宣传为 AI 生成成功。任何科学指标均来自原版实际计算，不得据此宣称某学生已掌握知识或自然界存在普遍因果关系。

**重复执行防护**：单条课程最多审批一次续验；计划失败不会制造第二次真实运行；如果审批请求超时、服务器执行状态未知，`comparisonApprovalUncertain` 为 true，并清除可重放计划，不允许客户端无确认重复调用扣费/运行操作。完整 V2 假设与 lineage 仍由原版 `bridge.approve` 负责写入。

**测试验证**：`tests/visual-evidence.test.mjs`、`tests/visual-lesson-integration.test.mjs`、`tests/evo-pages-telemetry.test.mjs`、`tests/stage-coaching.test.mjs`、`tests/real-science-visualization.test.mjs`。后两套引擎的可视化还经过实际 `computePfl` / `computeEvo` 测试；Pages telemetry 测试从真实静态构建加载 EvoWorld，并完整跑四个世界 200 tick，检查采样是否与结束数值一致。

**本轮最终功能核验（2026-11-04）**：`npm test` **225/225 PASS**（当前工作树，含并行出现的未跟踪测试；独立功能提交另按已纳入的测试文件复核）；`npm run verify` PFL/Evo 上游哈希与模块一致性通过（`pflUpstreamChanges=0,evoUpstreamChanges=0`）；`npm run audit:filenames` 通过（仅名称检查）；`git diff --check` 通过。真实 `computePfl` 与 `computeEvo` 以及静态 Pages 构建下的 `runEvoPair` 均进入测试，不能误写成真实付费 AI 或真人学习测试。\n\n**未完成边界**：本分支没有实现最新 UI 视觉/渲染动画、浏览器真机端到端验收、用户付费模型的真实网络连接、融合发布、跨刷新恢复。未来完成 UI 融合后，必须进行浏览器联调和人工科学内容审查；功能模块测试不能替代真人学习效果评估。

## 第三阶段：真实可视化与 AI 探究（2026-11-04）

最新接口以 `docs/LEARNING_CORE_VISUAL_AI_HANDOFF_20261104.md` 为准。原文件保留前两轮开发记录；新增加的真实轨迹、EvoWorld 采样、AI 追问及二次审批等请使用第三阶段交接文件。UI 外观由另一个对话基于最新参考决定。

## 合并给另一对话

请先在各自工作树获取最新远程 main，再由单独整合工作树合入本功能分支的具体提交（或按明确文件白名单复制独立子目录与测试）。UI 组仅修改自己的 V5 文件并调用上述稳定接口。合并前确认最新 UI 也已带上它的真实 Git HEAD 和测试，不要直接用旧 checkout 覆盖别人改动；不 force push，不擅自切换评委入口。

**当前未合并也未发布。** 如果需要浏览器 E2E，先在单独功能＋UI 合并候选分支中实现，再由唯一发布负责人审核并发布。
