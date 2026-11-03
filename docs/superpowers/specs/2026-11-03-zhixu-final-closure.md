# 知序 AI 学院 Apple V5｜收口设计与科学证据修复（2026-11-03）

目标：让 `ndshuge/zhixu-ai-academy` 原评委入口继续使用 V5，完成可以在本轮客观验收的科学证据、学习链路、按钮/文案、交互错误/空状态和浏览器可访问性工作。Original/R3/V4 完全保留。

已核实：
- `npm run verify` 在 `scripts/verify.mjs:8` 因 PFL bundle SHA 失败；现跟踪适配器 SHA 是 `6dcc8289...`，2026-10-10 证据锁定 SHA 是 `88f7c1a1...`。
- 相同证据 SHA 的原始二进制适配器仍保存在 `E:\CHATGPT\projects\ai-academy\adapters\pfl-engine.mjs` 和 2026-10-24 官方比赛材料中，且两份一致。不会改 manifest 的记录来假装修复。
- Git worktree 的 `../physics-frontier-lab` 不能解析到 PFL 工程源码，原 `verify.mjs` 对外部源码使用相对 `process.cwd()` 的方式不适应 Git worktree。差异检查须用可信 `provenance.source` 指定的源码路径，区分快照完整性（必须严格）和当前上游源码新旧（警告）。
- 软件测试通过并不等于真人学习效果提升，也不等于真机 iPhone Safari 性能验收。

Apple 原则：直接操控、信息优先、反馈可访问、焦点稳定。参照 Apple 官方 HIG Scroll views/Layout/Motion；不添加假的 Liquid Glass L2。V5 文本/控件功能回归优先。

分组：
1. P0 科学证据 bundle 恢复 + manifest 与 source 路径真正校验；
2. P1 真实学习流程 browser E2E，覆盖前测 → 假设 → 实验 → 迁移 → 导出，离线/错误提示与刷新状态；
3. P1 无障碍、布局与性能的自动化矩阵；发现问题才落实小范围修改；
4. 构建、测试、Pages、线上评委入口闭环。

User skill source: ChatGPT `skills__read`，Mice Hole 仅工程执行桥。未经运行不得宣称 Skill 组件已执行。
