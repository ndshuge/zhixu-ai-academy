# 知序 Apple V5｜按钮全域触感与底部材质视觉审计

日期：2026-11-04；基线 `c39552e`；隔离工作树 `feature/zhixu-v5-feedback-edge-audit-20261104`。

## 输入：真实 iPhone Safari 录屏
`ScreenRecording_11-04-2026 13-19-05_1(1).mp4`，16.47 秒，512×1112，30 fps；检查了第 2/4/6/8/10/12/14 秒的界面。浏览器为 iPhone 内的 Safari 网页视图，底部存在 Safari 自带工具栏。观察：设置、课程、资料、学习页切换很快；部分按钮仅在 pointerdown 短暂变化，pointerup 时页面已重绘，回弹看不到；Dock 及浏览器原生底部工具栏的模糊/色彩过渡有可见边界。原生工具栏属于 WebKit/系统 UI，网页 CSS 无法统一重绘其材质。

## 真正根因
1. `v5-duo-touch.js` 只覆盖博士头像与部分主 CTA；`v5-settings-touch.js` 单独负责齿轮；其他路由按钮、安静操作、实验按钮、弹层关闭和表单动作没有统一按压生命周期。网页 `v4.js` 在 click 同步切换/重绘，弹簧在松开前被拆卸。
2. 已发布 V5 Dock 经过去层后保留一层 `body::after`（14px）以及 Dock 的固有轮廓/透明填色，但底端在真实 Safari 中与系统工具栏不同；旧遮罩高度/透明度使较密的文字从网页下部逐渐变清晰的视觉观感不理想。
3. 新增通用点击延迟后，API 端到端测试暴露了**真正竞态**：原先单一 scheduled 定时器在普通关闭弹层→打开博士的连续操作中会取消关闭动作，使原版 iframe 保持 `.show-original-engine` 并挡住发送按钮。修复为仅取消互斥路由/实验选择，普通保存、关闭、提交等操作各自独立执行；同一按钮的重复等待只保留最新一次。

## 修正
- 新增 `v5-press-feedback.js`：所有 `button` 的 pointerdown→hold→release/cancel 使用统一 `data-zx-press` 状态。可操作路由和数据 action 在触摸松开后保留约 190ms 的反馈再执行，水平实验/课程选择约 120ms，其它普通按钮约 150ms。视觉压下 80ms、弹簧型回弹 250ms。保持键盘/辅助技术/脚本点击即时执行；系统减少动态效果同样不增加延迟。
- 保留设置齿轮原有 190ms 进入深按状态与缩至 .90 的独立动作。平面横向滚动控制仅轻微缩放/变色，不使用 3D raised-button；课程卡片不对滑动产生抖动。博士、学习 CTA、普通按钮得到一致的基础触感。
- 移除 V5 HTML 对旧 `v5-duo-touch.js` 的引用（源码留存）。其余 Apple 原版、R3、V4 和科学数据不变。
- 新增 `v5-visual-audit.css`：移动端唯一一层 backdrop blur(24px) 的 fixed feather 遮罩，从内容到网页视口底端 250px 渐进混色；Dock 的 `.nav-optics` 不进行第二次背景采样，只保留与背景一致的玻璃高光填色与边框。考虑安全区、输入法、博士弹层、减少透明度/提升对比度与深色模式。
- 该网页方案是 L1 WebKit frosted backdrop，不是 iOS 原生 SwiftUI `ScrollEdgeEffectStyle.soft` 或 L2 折射。用户录屏最底部 Safari 工具栏光学层不可由网页统一覆盖，因此**不能宣称真机系统栏与网页零缝隙**。

## 真实参考与 Skill
Apple 2025 官方 `https://developer.apple.com/videos/play/wwdc2025/356/`、`https://developer.apple.com/documentation/swiftui/scrolledgeeffectstyle`、`https://developer.apple.com/design/human-interface-guidelines/motion` 对 soft-edge 按渐变消隐内容与直接反馈的原则提供参考。多邻国确切内部 spring 参数并未公开，本轮 80ms/250ms/190ms 为知序自测调校值，不当作其官方数值。
已实际读取 `shuge-apple-product-audit`、`AUDIT_MATRIX.md`、`motion/best-practices/css-or-motion.md`、`liquid-glass-web`、`systematic-debugging`、`verification-before-completion`。

## 视觉检查
- 旧版 390×844 Edge 网页截图 vs 本地新版本同宽截图（进度页）：新版渐变从较高处以更平滑的透明度过渡进入 Dock，背景模糊由一个材质控制。
- 另制作**未入库的纯诊断 fixture**，在移动视口底部滚动多行高对比黑色文字/横线，分别截图 `edge-before-diagnostic.html` 与 `edge-after-diagnostic.html`。确认并排时横线属于测试文字布局自身，Dock 内的模糊不会跳回另一半径；同源设计仍需 iPhone 真机再次验收，单凭 Chromium 截图不能证明 WebKit 内核的实际 120Hz 帧耗时。
- 用户录屏与诊断截图只保存在本地临时目录，不上传到公开仓库。

## 验收门禁
- `tests/v5-feedback-edge-audit.test.mjs` 3 项 RED→GREEN；`tests/browser-v5-press-feedback.cjs` Edge/WebKit × 390/1440：按住、松开、原页面保留、延迟执行、设置往返、博士弹层、快速双点路由、键盘即时激活、减少动态效果。测到按钮 computed transition 80ms/250ms。
- 既有 Dock/手势/横向滑动测试更新与最终有效 blur 样式一致，不削弱功能断言。
- 全仓单测、科学 SHA 校验和真实浏览器完整学生学习流程、模拟 BYOK 200/401/429/断网全部在发布前重新执行并记录真实通过数。
- 物理 iPhone Safari 的分帧/浏览器底部 chrome 材质仍**UNVERIFIED**，需用户对新版实机录屏复查；不要宣称已完全消除卡顿。
