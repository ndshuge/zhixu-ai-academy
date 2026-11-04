# 知序 AI 学院｜Apple 横向滚动、多邻国式触控与单层 Dock 渐变

日期：2026-11-04；正式版施工基线 `28f301e`，分支 `feature/zhixu-v5-apple-swipe-unified-edge-20261104`。

## 真实参考及采用边界
- Apple Scroll views HIG：`https://developer.apple.com/design/human-interface-guidelines/scroll-views`。优先原生触摸惯性、允许垂直区域内嵌水平滚动、减少相同方向嵌套。Apple WWDC25 “Get to know the new design system” `https://developer.apple.com/videos/play/wwdc2025/356/` 强调每个视图一套 Soft Scroll Edge Effect；避免叠加多个模糊与不连续边界。本工程是网页模拟，不是 UIKit 原生 ScrollEdgeEffect。
- Apple Segmented controls：`https://developer.apple.com/design/human-interface-guidelines/segmented-controls`。标签必须明确、选中状态与可访问状态一致，不要通过错误的点击目标和动画制造错选。
- 多邻国内部动画数据并无公开可核验的官方时序表。对照第三方复现 `https://github.com/nexu-io/open-design/blob/main/design-systems/duolingo/DESIGN.md`（约 4px 硬厚度、约 180ms 按压、320ms 较大状态变化与轻超调）；另检视 MIT/开源风格按压实现 `https://animata.design/docs/button/duolingo`。这些数据均**不宣称** Duolingo 官方实现。知序采用自有绿色、90ms 下压＋240ms 带微超调回弹，保留原 3px 下沉与 4px 厚底，无常驻动画；优先触摸立即响应。
- 实际读取 ChatGPT 安装的 `shuge-apple-product-audit` + `references/AUDIT_MATRIX.md`、`shuge-apple-design`、`motion` + `best-practices/index.md` / `css-or-motion.md` / `css-spring/index.md`、`liquid-glass-web`、`systematic-debugging`、`test-driven-development` 与 `verification-before-completion`。读取不等于调用付费 MotionScore，也不等于引入 UIKit API。

## 已定位的真实问题
1. `#screen .experiment-tabs` 在窄屏下原为三个等分的固定按钮，无法在文本放大或较窄设备中自然左右浏览；`.shelf` 的 `x mandatory` 强制吸附较硬。改为原生 `overflow-x:auto`、`-webkit-overflow-scrolling:touch`、`scroll-snap-type:x proximity`、`scroll-padding-inline`、可见下一个选项的控制宽度。手指起始于按钮组时保留垂直页面滚动能力。
2. 实验标签点击后整段学习界面会重新渲染，导致新标签组滚动位置归零，选中第三项被裁掉。现只移动行内 scrollLeft，保持选中按钮可见并恢复键盘焦点；不滚动整页，也不保存/覆盖学习实验结果。
3. Dock 原已有 `body::after` 12px 模糊（带 mask），同时 `.nav-optics` 9px 模糊、不同半透明渐变在 Dock 范围叠加。最后单独加深底部会形成局部模糊不同步。新 `v5-apple-swipe.css` 将**唯一一次背景采样**放在全宽 `body::after`，统一 14px blur、210px 羽化高度、连续遮罩及颜色渐变，下方透明度近 1；Dock 控件自身取消第二次 backdrop-filter，只保留半透明高亮/边缘轮廓。底部地址栏是 Safari 系统 UI，网页无法修改其渲染。
4. 博士按钮及主要学习 CTA 的按下行程统一为 90ms、释放回弹 240ms，按压与松开用同一 CSS transform/阴影关系，减少动态效果时保留无位移动效降级。此数值是本地调校值，不是从多邻国客户端代码取得。

## 验收
- RED → GREEN：`tests/v5-apple-swipe-material.test.mjs`；实际 UI：`tests/browser-v5-apple-swipe.cjs`。
- Edge / WebKit 分别 320、390、1440 CSS px，验证滚动宽度、动量滚动 CSS、吸附、真实 scrollLeft 改变、实验标签选中后保持可见+焦点、页面无横向溢出。
- 渲染计算样式验证手机 Dock 仅有一层背景采样：`body::after blur(14px)`、`.nav-optics backdrop-filter:none`、连续 mask、页底 alpha、滚动到最后仍存在。
- 回归 `browser-v5-ios-motion-dock.cjs`、`browser-v5-gesture-blur.cjs`、`browser-v5-duo-perf.cjs` 已更新以适配最新物理材质，并由 Edge/WebKit 运行。不能将这些模拟浏览器视为真实 iPhone Safari 光学帧率验收。
- 未涉及 Original、R3、V4，PFL / EvoWorld 与 BYOK API。
