# 知序 Apple V5 · 博士弹层可逆动效设计（2026-11-03）

## 现状与约束
- 本轮只改 `ndshuge/zhixu-ai-academy` 正式 V5。V4、R3、Original、科学实验和比赛 URL 保留。
- 已审核源码：目前打开时 Motion 每次生成 opacity:[0,1]、y:[12,0]、scale:[.972,1]，关闭时生成另一组动画并停止旧动画。WebKit 中途取消旧 WAAPI/Motion 动画时可能把 opacity 瞬间复位到 0；这是待修复的 P1。
- 最新远程 1a953c6 已修复同路由重开课程、设置页可点区域和桌面空目录；不重复改动。
- 设计选择：保留博士头像和面板视觉、保留浮动定位；面板自身使用 **单个 Web Animations API Animation**，开关时直接 reverse，在 0%、25%、50%、75%、100% 插帧可观察；Motion 继续服务既有 dock/导航动画，不新引库。不使用同时控制 opacity 的 CSS transition / 双 WAAPI。较弱平台和 reduce-motion 使用无动画状态切换。
- 语义与焦点：打开后关闭键接管焦点，不自动打开 iOS 键盘；Esc/关闭后返回头像；快速重开不能触发旧关闭回调隐藏页面，不能清除原聊天消息或授权状态。
- QA：Edge / Playwright WebKit、320/390/768/1440；至少 0/25/50/75/100% 帧、快速 close→open→close、Esc、Reduce Motion、Toast/dock、无 pageerrors；所有历史页面静态对比。iPhone 真机未验收需注明。

## Apple 和 Chat Skills
- 官方：WWDC25 Meet Liquid Glass; Apple HIG Sidebars; HIG Buttons（移动控制推荐 44pt）。只提炼空间连续、控件独立分层、操作反馈克制。
- Chat 插件已读取：shuge-apple-product-audit / AUDIT_MATRIX；shuge-apple-design；motion；finesse-ui；apple-web-design；frontend-dual-source。Skills 由 ChatGPT 当前会话加载，Mice Hole 只执行本机项目动作。
- 不接入新玻璃依赖：`liquid-glass-web` 的 iOS 真实光学效果要求背景采样和兼容降级，这不解决单个弹层的取消竞态；不将 L1 blur 称为 L2。

## Ruling 2026-11-03：替换初版单 WAAPI 方案（覆盖上方架构选择）
- TDD 中先尝试单 `Animation.reverse()`，又尝试 `updatePlaybackRate` / 保存 `currentTime`；Edge 和 WebKit 的高频点击实验出现时间轴跳回零或停顿。
- 最终方案使用一个 CSS 过渡状态 `doctor-visible`；首次打开仅在隐藏时提交一次初始布局，重开不重置初始位置；CSS 自动从实际计算值过渡。关闭过渡结束才 hidden，含 380ms 备用关闭；Esc/focus 和 Reduced Motion 保持。
- 该方案已通过 6/6 Edge/WebKit 320/390/1440 高频操作与 6/6 Reduced Motion；不是 Apple 系统原生动画，不宣称真机 Safari 完成。
