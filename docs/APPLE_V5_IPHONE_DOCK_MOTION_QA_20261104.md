# 知序 V5｜iPhone 录屏指出的设置按钮、转场与 Dock 下沿修复

基线：`cadf9fc`；日期：2026-11-04。用户提供 iPhone 实机截图 `IMG_9047.jpeg` 和约 20 秒的 `ScreenRecording_11-04-2026 10-16-30_1.mp4`。录屏显示设置页、进度页、资料页之间的切换，以及 Dock 下方文字仍能辨认的情况。

## 根因与修正
1. **设置按钮消失**：`v5-product-design.css` 曾特意对 Settings 路由下 `toolbar-trailing ... settings` 设置 `display:none!important`，使同一顶部工具栏图标在导航后突然消失。移除隐藏规则，始终维持 44px 目标位置；`v4.js` 维护齿轮的 `aria-current=page`，而 Settings 仍不伪装成底部第六个 Tab。
2. **页面转场生硬**：保留原 Motion JS 单层弹簧 Tab 指示器，V5 新增由原/目标路由顺序决定的 `forward/backward` 方向；头部与首几组内容以最多 12px、320ms 的分层轻滑入，不对整个屏幕截图或全屏变暗。结束计时器保留 420ms，避免最后一组延迟动画未结束便被截断；快速切换重新指定新方向；减少动态效果直接清除进入状态。设置齿轮有轻微按压尺寸反馈。
3. **Dock 下方失去模糊**：原 `v5-scroll-edge.js` 在距页底剩余 0px 时设置 `--zx-edge-opacity=0`，会让 `body::after` 消失。V5 增加 `v5-ios-continuity.css`，让渐变材质在可滚动页面底部仍持续覆盖 Dock 与其下方浏览器内容区域，扩大到约 196px，底部 28px blur 与渐变混色。保留输入法和博士弹层时停用遮罩，以及减少透明度/提高对比度时的不透明替代。
4. 范围只有 V5 和相关测试、文档；Original、Apple R3、V4 均未更动。

## Skill 与参考
- **READ / APPLIED**: ChatGPT 插件 `shuge-apple-product-audit`（审计流程）、`motion` vanilla / CSS-or-Motion（共享弹簧与可中断变更）、`liquid-glass-web`（L1 WebKit 背景模糊支持边界）、`shuge-apple-design` 和 iOS gesture audit（交互优先级）。
- Apple 官方参考：`https://developer.apple.com/documentation/TechnologyOverviews/adopting-liquid-glass`，`https://developer.apple.com/design/human-interface-guidelines/tab-bars`，`https://developer.apple.com/design/human-interface-guidelines/motion`。采用固定导航控件、滚动边缘材质与动效连续性的设计原则；没有复制 Apple 私有资产、没有声称网站使用 iOS 系统原生 L2 refraction。

## 自动化验收
- 新增 `tests/v5-ios-motion-dock.test.mjs`，红后绿，三项语义和样式约束。
- 历史测试 `tests/v5-product-design-audit.test.mjs` 更新了原先“应隐藏齿轮”的错误预期。
- 新增 `tests/browser-v5-ios-motion-dock.cjs`：Playwright Edge/WebKit × 390/1440，验证点击设置齿轮前后仍显示，`aria-current`、forward/backward 方向、实际渲染 `zx-ios-page-enter` 动画、底部遮罩 28px blur / mask / 滚动底部仍保持 `opacity:1`；系统 Reduced Motion 下进入动画被移除，页面可继续导航。
- 全量 `npm test` 与 `npm run verify` 在提交和发布前重新运行，以实时输出为准；WebKit 模拟不能替代真实 iPhone Safari。
- 尚缺用户同一台 iPhone 的发布后录屏、60/120Hz 运动曲线及真机 Safari 色差审美确认；网站无法为 Safari 浏览器自己的原生工具栏实施页面 CSS 模糊。
