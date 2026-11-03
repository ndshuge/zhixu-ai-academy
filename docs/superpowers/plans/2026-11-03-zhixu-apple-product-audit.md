# 知序 V5 Apple 全站审计第一轮 Implementation Plan
> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task, RED→GREEN.

**Goal:** 修复实际复现的学习重置和设置控件问题，简化桌面静态中间栏；建立完整可追溯设计审计证据。
**Architecture:** 维持 Vanilla JS、V5 CSS 后置覆盖、原版教学 iframe 桥；只修改 V5；保持移动 dock 与 Motion 引擎。
**Tech Stack:** Vanilla JS, CSS, Node test, Playwright Edge/WebKit, GitHub Pages.
**Spec:** docs/superpowers/specs/2026-11-03-zhixu-apple-product-audit.md

## Global Constraints
- 修改仅落在 `apple-editions/ai-academy-v5/` 和本轮 docs/tests，V4/R3/Original 不动。
- 当前工作树初始基线 `44fbf75`；不得覆盖其他工作树未提交改动。
- 真机 Safari / L2 折射 / AI BYOK 验证未做时需标记 UNVERIFIED。
- 保留五 tab、独立记录与授权安全边界。

## Review Focus
1. 切换路由后重置，与当前学习页重置应一致。
2. 320px 长文本设置应不压垮按钮区。
3. 侧栏移除后桌面正文保持 65–75ch 可读性。
4. Reduce Motion 不引入新的动态路径。
5. 滑块的点击目标和滑动值联动不回归。

### Task 1: 现状清点 / 引用证据
- [x] 研究 Chat-native Skills、Apple 官方、GitHub 实现。
- [x] 24 张基线截图和六路由/组件 JSON 清单生成至隔离审计目录（未发布原始学习数据）。
- [x] 将引用与真实证据写进仓库设计审计文档。

### Task 2: 学习页重新开始（P0）
- [x] 写 RED 测试复现同路由不重绘。
- [x] 修复 `v4.js` 的 `reset-lesson` 分支。
- [x] 浏览器 Edge/WebKit 操作证据和 npm test。

### Task 3: 设置页控件与滑块（P1）
- [x] 写 RED 测试覆盖按钮 44px、中文不竖排、滑块 hit area。
- [x] V5-only CSS 修复。
- [x] 320/390/768/1440 截图对比，检查操作实际生效。

### Task 4: 桌面静态侧栏（P1）
- [x] 写 RED 测试约束三个无用二级栏的可见性。
- [x] V5 CSS 隐藏 settings/library/growth 不必要列，保持 courses/learn 目录。
- [x] 桌面 UI/路由/历史测试。

### Task 5: 验收、报告、长期约束
- [x] 首轮 119/119 Node tests、Edge/WebKit ×4 视口布局与重新开始 8/8、开关持久化/Logistic 图表/确认弹窗 4/4；已记录 PFL SHA 失败。
- [ ] 真正 iPhone Safari、VoiceOver、200% 放大、全部真实 AI BYOK 路径及 PFL 科学封包单独验收。
- [x] 在 docs 发布研究、Skill 实际调用表、矩阵、修订、验收与 OPEN；AGENTS 增加稳定设计约束。
- [ ] git diff --check，提交独立分支；完成证据前不得声称上线。
