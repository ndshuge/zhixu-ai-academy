# 知序 V5：深色外观、确认弹层与原版浏览器验证计划

**目标**：修复旧版浏览器脚本在持续网络活动下的死等、未携带私有 benchmark 数据导致的 API 500，提供 V5 系统深色与键盘可访问性的工程级证据。

**架构**：在独立 worktree 基于 `08cbe6e`，将 `v5-system-appearance.css` 挂载在 V5 末尾，重用现有 Vanilla JS / CSS / Motion，不引入 React 或额外图形库。后台证据汇总由经来源约束的脚本生成，只发布合成技术汇总和 SHA，保留 0 真人样本事实。Modal 明确保存触发按钮用于 WebKit 焦点恢复。

## 任务与验收
- [x] 读 AGENTS.md、在线参赛地址及 Chat Skills，梳理待收口项并隔离新的 worktree。
- [x] 复现 `browser-learning.mjs` 的 `networkidle` 超时与 `browser.mjs` `/api/evidence/summary` 500。
- [x] RED-GREEN 修复正式五个旧版浏览器脚本的页面等待条件，完整 `npm run test:browser` 五套通过。
- [x] RED-GREEN 修复“公开源码没有原始 benchmark 明细”导致的接口故障，验证源文件后只导出安全统计数据和 SHA 来源指纹；浏览器 500 消失。
- [x] RED-GREEN 加入 V5 系统深色、高对比、减少透明度规则；Edge/WebKit × 2 视口 × 2 外观 × 6 页面 48/48 通过；WebKit 提高对比度 6/6 通过。
- [x] RED-GREEN 修复清空确认框的 Esc / Tab 循环与 WebKit 焦点恢复；Edge/WebKit × 390/1440 4/4 通过。
- [x] 浅色界面默认保持原样，V4/R3/Original 教学核心代码不更改。
- [x] 旧浏览器截图 `evidence/browser/` 全部加入 .gitignore 并清理此分支自身生成的 25 项临时测试产物。
- [x] `npm test` 143/143；`npm run verify` PASS；V5 Logistic/Evo 科学流程回归 PASS；文件名安全检查 PASS。
- [ ] 归档本轮截图和报告、diff 检查、提交、新检出验证、受保护推送、Pages 与线上评委 URL 验收。
- [ ] 真机 iPhone Safari / VoiceOver / BYOK 实际 Key / 真人教学试测均依赖用户授权或物理设备，保持 UNVERIFIED。

**失效策略**：不能用新生成的公开合成汇总冒充真人教学效果；不能把 Playwright WebKit 叫作真实 iPhone Safari。守护原始评委 URL，不使用 force push。
