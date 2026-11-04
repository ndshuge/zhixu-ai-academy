# 知序 VNext 三层设计与动效来源（2026-11-04）

## 第一层：真实产品目标
知序是“前测→独立预测→科学实验与导师→迁移验证→复习”的深度理解学伴，必须能恢复原题、提交记录、下一步，而不能变成仅展示漂亮课程卡片的网站。真实 AI 需用户配置/验证；无授权仍可走规则科学流程。

### 鼠哥学院源码证据
来源：`ndshuge/ndshuge-academy` 的 `3adf3a8`，只读克隆于 `E:/CHATGPT/work/zhixu-design-reference-academy-20261104`。
- `calculus.html` 微积分、`python.html`、`c.html`、`chip.html`、`phys.html` 五学院确实存在，分别可见“下一站”、章节状态/进度、错题反馈等模块。提取“下一步与当前状态相邻”“交卷后反馈区不跳跃”交互原则，不照抄密集视觉或与知序无关的章节数据。
- `design/apple-ui-动效实验室.html` 含 `springTo(x0,target,fn,onDone)`（约第453行）及中断/回弹（约第667/671行），视图转场通过 `document.startViewTransition`（约第437–439行），`popstate`（443行），CSS `view-transition-name:mv-hero`（235行）。
- `design/apple-ui-效果演示.html` 含 `popstate` 方向性变化；此前实验偏视觉示范，迁到知序需加持久化/无障碍与真实异步题目回显。

### 其它参考及用途
- Apple Human Interface Guidelines, Layout, Motion, Accessibility: https://developer.apple.com/design/human-interface-guidelines/
- Apple Books 阅读: https://support.apple.com/guide/iphone/read-books-iphc1af7c57/ios  —— 继续阅读、主内容优先。
- Apple Notes: https://support.apple.com/guide/iphone/get-started-with-notes-iph9e04f3be2/ios —— 清楚的内容层级与最少工具控件。
- Apple Shortcuts: https://support.apple.com/guide/shortcuts/welcome/ios —— 逐步流程与上下文操作。
- Duolingo: https://www.duolingo.com/ —— 明确小步与即时反馈；不使用夸张全局按钮缩放。
- Brilliant: https://brilliant.org/ —— 优先主动交互验证概念。
- Khan Academy: https://www.khanacademy.org/ —— 解释/练习/订正的清晰分段。
- MDN View Transitions API: https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API  —— 只在有功能支持、可回退、不会误伤 Dock 时渐进采用。

> 以上官方/产品网址与已读旧代码为研究线索，**未访问到的产品内深层交互不能作为动态参数来源**。此前项目 `docs/APPLE_V5_RESEARCH_AND_SKILLS_20261103.md` 已有较深入的 Apple 官方与开源 Motion 调研，不重复安装依赖。

## 第二层：源码诊断、方案与拒绝项
| 目标 | V5 现状 | 实施方向 | 不采用 |
|---|---|---|---|
| 下一站学习 | 首页静态英雄和世界入口，进入同世界总重置 lesson | 由真实 `state.lesson` 派生可恢复的继续入口 | 假进度、恢复课程页 |
| 作答状态 | 原始 radio 初始未选，提交后正确/错误在下方统一反馈 | 明确 `unselected/selected/submitted/correct/incorrect/analysis`；前测不泄漏答案 | 预选答案、改科学评分 |
| 状态恢复 | `sessionStorage` 保存 lesson，但离开再点击实验会重置 | 同实验继续，跨实验有意识重开，下一题清理选择 | 修改 V2 真实证据或 Original |
| Magic Move | 有简化路由方向动画 | 后续仅在学习内容层增量试验 View Transitions，兼容回退 | 动画整个页面使 Dock 被动更改 |
| 弹簧 | 现成 Motion runtime 已绑定导航与按压 | 保持既有 Motion，不叠第二物理控制器；先解决语义反馈 | 大型图形依赖或全站大幅缩放 |
| 返回/弹窗 | Hash History API 和可中断 Doctor 弹层已有 | 保留已验收行为，专项检查连续返回与浏览器焦点 | 重写导航/改 Dock |

Skio 未找到与本需求直接相关的工程依赖。若指 Skia/CanvasKit，当前知序使用 DOM/SVG 科学图表，不需要增加 WebAssembly/CanvasKit。维持原技术栈。

## 第三层：质量与验收
- 稳定的标题/说明/按钮层级；radio 无默认值、选中时有真实且可访问反馈；提交后讲清结果，提供可展开解析但前测不泄答案。
- CSS 仅局限 `#screen` 阅读内容，用户已验收的 Dock 不得动。
- 320 / 390 / 768 / 1440 宽；Edge 与 WebKit；深色、高对比、reduced motion；重复点击、返回恢复；真机 Safari 未连接则明确 NOT_RUN。
- 先改实测 P0/P1（恢复与练习），动画按明确问题逐项增强，不以数量作为质量。

## 插件技能及依赖
FOUND + READ（2026-11-04）：`shuge-apple-product-audit`、`AUDIT_MATRIX`、`apple-web-design`、`motion`。旧项目此前已有 Motion bundle、Apple Web Design 流程。APPLIED 与 VERIFIED 必须对应实际 commit/浏览器结果，不自动推断。本阶段新增第三方依赖：无。