# 知序双科学实验｜可视化证据与高参与度 AI 功能交接
_2026-11-04 / 功能分支 feature/zhixu-learning-core-br-20261104_

## 合并与设计决策

**UI 设计、导航、Dock、动效和布局，以另一个 UI 对话当时的最新版参考及工程源码为准。** 本分支只提供状态、真实实验数据、科学对照关系、导师提示与审批接口。无须照搬历史 V4/V5 UI，不能为集成功能而重置最新 UI 工程。

本轮只做两个实验：
- PFL / Logistic 初值敏感性：`experiment='sensitivity'`。
- EvoWorld / 配对生态世界：`experiment='evo-pair'`。

实验内保留独立判断、事前预测、明确实验授权、真实运行、证据观察、反思、原版迁移检查。**没有独立错题本、额外复习页面、伪学习效率或生成式假成绩。** 学生的实验预测与结果不一致，不算错题。

## 施工资产

新增或更新：

| 文件 | 职责 |
|---|---|
| `apple-editions/ai-academy-v5/learning-core/visual-evidence.mjs` | 真实实验结果转纯数据可视化接口；PFL 双轨、误差与选点；Evo 实际配对数据、真实 tick 采样与不确定性提示 |
| `apple-editions/ai-academy-v5/learning-core/interactive-lesson.mjs` | 实验教学阶段、证据选取、博士导师、学生批准二次对照 |
| `apple-editions/ai-academy-v5/learning-core/v5-adapter.mjs` | 连接真实 ScienceBridge / V2；选点转原版 /api/mentor；目标转原版 /api/agent/plan |
| `pages-overlay/pages-evo-pair.mjs` | 原版 EvoWorld 浏览器搬运版本，每20 tick 从实际 World.step 采样世界种群。未更改世界演化规则 |
| `tests/visual-evidence.test.mjs` | 真实轨迹、配对、源标识、数据缺损，不允许凭空补曲线 |
| `tests/visual-lesson-integration.test.mjs` | 点选科学证据、导师、科学计划与第二次用户审批 |
| `tests/stage-coaching.test.mjs` | 实验前和实验后 AI 追问、逐次授权、数据隔离及规则回退 |
| `tests/evo-pages-telemetry.test.mjs` | 构建后的真实 Pages Evo World.step 200 tick 抽样与接口 |
| `tests/real-science-visualization.test.mjs` | PFL/EvoWorld 服务端科学计算与可视化适配 |
| `tests/real-learning-bridge-journey.test.mjs` | 真实本机 Node 科学 API、原版 ScienceBridge、原版 V2 同时跑两门实验完整闭环 |

注意：`pages-overlay` 是原版 Pages 适配层（来自独立功能工作树的修改）；`adapters/evo-snapshot` 和 PFL 原始快照不可改动或重新生成。GitHub Pages 发布依旧由独立发布流程负责。

## 使用示例

```js
import {createV5InteractiveLesson} from './learning-core/v5-adapter.mjs';

// 仅在 await bridge.connect() 成功且学习事件 store 已加载后构造。
// 不得在组件 render() / 每次状态刷新时重新构造，否则丢失正在进行的阶段。
const lab = createV5InteractiveLesson(bridge,{experiment:'sensitivity'}); // 或 'evo-pair'

// 1. 前测和个人预测
await lab.start();
await lab.submitPre(selectedIndex);                 // 初始 selected:null
lab.setPrediction({
  text:'我预计在固定规则下，微小的初值差异随迭代会逐渐放大。',
  params:{r:3.9,x0:0.217,steps:150,logDelta:-10}
});
// EvoWorld 的 params = {seed:12023}

// 2. 学生单独点击批准运行，返回真实 runId / visualization
await lab.runExperiment();
const view=lab.snapshot();
const {experiment,visualization}=view;

// 3. UI 使用 visualization.views[].kind === 'line' / 'grouped-bar' 自由设计。
// PFL 图表真实点：[x,y]。可以选点，直接与博士谈“这个点”。
lab.selectEvidence({plotIndex:0,seriesIndex:0,pointIndex:50});

// EvoWorld 按相同随机种子配对，先展示真实结果和描述差，再选一对
// lab.selectWorldPair(12023);

// 4a. 阶段式导师：实验前形成可检验预测；实验后基于真实结果回答。
// 默认规则导师，shareApproved:true 必须用户每次明确授权，且已验证 BYOK。
await lab.requestStageCoach({question:'我的预测可以怎么检验？',shareApproved:false});

// 4b. 原版实验导师（有后续二次规划时必须实际调用）：
await lab.requestMentor({note:'为什么我选的曲线点有这样的差异？',shareApproved:false});

// 5. 原版科学 Agent 提议，但不会运行。
await lab.proposeComparison({goal:'只改变初值扰动量，检验轨迹分离是否延后。'});
const plan=lab.snapshot().comparisonPlan;  // approvalRequired:true,autoExecuted:false
// UI 必须显著展示 plan.changes/fixedVariables，要求学生重新预测。
await lab.approveComparison({prediction:'更小的扰动可能使两条轨迹稍晚分离。'});
const second=lab.snapshot().comparison; // 真实新 runId、parentRunId、visualization

// 6. 完成本轮观察与原版迁移（不另加错题复习页）
await lab.submitReflection('我观察到两次实验...；原因还需要更多证据。');
await lab.loadTransfer();
await lab.submitTransfer(selectedIndex);
```

## 可视化数据契约（不指定画法）

`snapshot().visualization` 在原版科学实验确实返回真实数据后才出现：
- `schemaVersion` / `experimentId` / `sourceRunId` / `engineVersion` / `source:'official-engine-result'` / `evidence:true`。
- `views[]`：数组，仅支持 `line`（真实采样时间序列）或 `grouped-bar`（独立样本配对结果）。`line` 携带 `series[].points=[[x,y],...]`、`xLabel`、`yLabel`；`grouped-bar` 携带 `categories` 和各处理条件的 `series`。
- PFL 不补任何真实轨迹之外的帧；`selectEvidence` 使用三维索引绑定原版 `/api/mentor`，博士可引用真正点坐标。
- EvoWorld `pairs[]` 以**随机种子**作为独立实验单位；每对包含合作开/关的真实 `meanPopulation`、`endingPopulation` 及明确标注 `derived:true` 的差值。
- EvoWorld Pages 实际时序采样：按 tick 0、20、40……200 记录真实世界个体数，从 `World.step` 取得，不插值、不复用结束值。**独立 Node 服务端的 EvoWorld 当前只返回均值/末值，不带时序；在此路径只给配对柱状对照，绝不能虚构动画时间曲线。**
- `limitations[]`：模型局限、样本不足、缺失过程采样等；UI 需始终可见。两颗种子只是演示配对方法，不能宣称统计显著或普遍生态优势。
- `snapshot().comparison.visualization` 是**第二个真实 runId** 的独立证据，不能拿公式预览或未批准的计划伪装成已执行。

## AI 协作与真实权威边界

- 博士三个入口：`hint(1..3)` 为静态分层规则；`requestStageCoach()` 可在实验前后经用户授权使用已验证的 DeepSeek；`requestMentor()` 调用原版科学后端与已有规则/可授权模型导师，能为二次审批生成条件。
- **规则导师不标记为大模型。** `coaching.mode='rules'|'llm'`、`coaching.source='lesson-rules'|'verified-model'`；网络错误退回规则并显示 `fallbackReason`。
- 未经用户本次授权不得调用收费模型或外传预测/实验值；接口没有修改或缓存原版 API Key。任何 AI 解释都是建议，不能替代科学数值，不自动替学生批准运行实验。
- `proposeComparison` 要在真实实验和原版导师调用之后；`approveComparison` 只能显式、单次消费计划，新的预测必须不同于旧预测。网络不确定时 `comparisonApprovalUncertain:true` 并禁止盲重试，避免重复消耗计算。
- 预测不一致是探究证据，并非错题；迁移评分仍由原版题库负责。原版 V2 记录包含实验来源和后续对照 lineage。

## 本地验收记录（2026-11-04）

- `npm test`：**224/224 通过**，包含两门课真实科学引擎计算、真实本机 ScienceBridge / 科学 API / V2 事件链、Pages EvoWorld 实际采样、导师授权、真实曲线数据选择、缺失时间轴警告以及二次审批安全检查。
- `npm run verify`：**通过**；PFL SHA256 `88f7c1a189aeb1870ae522a6e90d0de0eb00e893ad467dae9c6743e40a6c4a92`，Evo SHA256 `45466224cc6ce12510cb301ccfffbef653a9704bb6e18cf4e2937521162e1263`，上游改动均为零。
- `npm run audit:filenames`：通过；仅检查名称，不能替代内容安全审计。
- 未执行付费 AI 请求、没有真人样本；未在最新 UI 分支接线，也未进行 iPhone Safari 真机或正式线上验收。

## UI 合并边界与待办

1. UI 对话必须先检查其**最新工作树与 Git HEAD**；功能树只提供数据/业务接口。另起合并候选工作树，禁止用旧 UI 覆盖新设计。
2. 以最新 UI 参考自行设计轨迹播放/缩放、EvoWorld 种群动态、博士对话触发和授权界面；**不可把功能树内部的状态机当成 UI 样式规范**。
3. 页面接线必须验证独立 click/tap→数据出现、前测无预选、图表点选、授权 BYOK、AI 失败回退、二次实验不重复、V2 历史数据不丢；真机 Safari 和移动端触控需单独实测。
4. 浏览器端深度集成、iPhone 真机 Safari、真实 DeepSeek 外网/费用、正式线上 Pages 发布、两对话代码合并均**未由本分支完成**；不要声称 UI 已上线此功能。
5. 所有本地测试使用真实原版科学引擎或模拟 API 的无付费例子；没有真人学习提升样本，不能宣称实验改善学业效果。
