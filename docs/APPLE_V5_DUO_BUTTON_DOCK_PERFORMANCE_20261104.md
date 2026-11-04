# 知序 V5：博士按钮按压、学习按钮反馈与 iPhone 底部 Dock 模糊（2026-11-04）

## 输入与既有基线
用户提供 `ScreenRecording_11-04-2026 11-29-05_1.mp4`（iPhone Safari），反馈多次切页卡顿、博士和学习按钮缺乏多邻国式下沉按压，Dock 下方到浏览器地址栏之前出现清晰内容和视觉断层。基线 `4d9289a`，隔离分支 `feature/zhixu-v5-duolingo-performance-20261104`。

## 设计和工程变更
- 学习与博士两类控制采用知序配色的 **raised-button** 视觉：4px 底部厚度、pointerdown 下沉约 3px、阴影收缩、pointerup 回弹；用 CSS transform / box-shadow 呈现，不复制多邻国图标、商标或素材。触控状态由新的轻量 `v5-duo-touch.js` 管理，处理取消、手指移出边界及失焦。不会通过逐帧 JS 写入动画值。系统和应用的减少动态效果会禁用位移动画；原控件点击、面板关闭和学习跳转逻辑不变。
- 移动端不再实例化 `createGlass` 动态 Dock 折射运行时，使用保留的 CSS 背景材质。桌面仍保留原有 Motion 导航动画与折射插件功能。
- 针对用户提出的「断层」：以 `v5-duo-perf.css` 对原有 Dock scroll-edge 再覆盖，羽化高度 215px（含底部 safe-area）、12px 背景模糊与多段色彩浓度渐变，到底部接近不透明，确保底边的网页文字完全融入底色。Dock 自身 9px 背景模糊，避免两个昂贵的高半径 blur 重复渲染。
- 移动端页面切换从前四个内容组依次 320ms 进入，改为仅首组约 180ms 的轻滑入；降低 WebKit 需同时合成的动画图层数。
- 深色模式增加相匹配的按钮材质、底层厚度；高对比/减少透明度与减少动态效果保留原有可访问降级。
- 不改 Original/R3/V4、学习数据、科学引擎、BYOK 逻辑。

## Skill / 验收
- 实际读取了 `shuge-apple-product-audit`、`motion/best-practices/css-or-motion.md`、`motion/best-practices/index.md`、`liquid-glass-web`、`systematic-debugging`、`test-driven-development`。依据：触控后视觉反馈应稳定且可中断；高代价光学运行时不应滥用，不能声称 L1 模糊为原生 L2 折射。
- 单测 `tests/v5-duo-performance.test.mjs` 三项约束先失败后通过。旧 `browser-v5-ios-motion-dock.cjs` 按当前实际 blur 与轻量切页策略修改预期；旧 `browser-v5-gesture-blur.cjs` 检查本轮的最终样式而非过期 16px/14px 数值。
- 新 `browser-v5-duo-perf.cjs` 使用 Edge/WebKit × 390/1440：博士控件深度阴影、下沉 transform、原面板开合、学习主按钮下沉、手机 Dock 底边 opacity/mask/background blur、手机静态光学滤镜状态、无 JS 运行错误。
- 合成浏览器不等于真实 iPhone Safari 全链路 GPU 帧时间；发布后需从同一台 iPhone 回看实际卡顿与视觉连续性。网页不能让渐变穿入 Safari 自身的系统底部地址栏。
