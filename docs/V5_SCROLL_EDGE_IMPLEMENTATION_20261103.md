# 知序 Apple V5 · Scroll Edge 材质补充（2026-11-03）

## 设计依据（确实打开的官方资料）
- Apple HIG / Scroll views (2026-06-08 更新): https://developer.apple.com/design/human-interface-guidelines/scroll-views
  - 滚动内容与浮动工具栏之间应使用滚动边缘效果维持信息可读性，软边缘与硬边缘用途不同。
- WWDC25 / Meet Liquid Glass: https://developer.apple.com/videos/play/wwdc2025/219/
  - 玻璃控件是一层独立导航材质；scroll-edge effect 用于减弱控件底层的滚动文字，避免 UI 与内容竞争。
- Apple HIG / Tab bars: https://developer.apple.com/design/human-interface-guidelines/tab-bars
  - tab 语义长期稳定，保留原有五栏信息架构，不因视觉调整随意改变访问路径。

## 本轮确实加载的 Chat 插件 Skill
- `shuge-apple-design`：移动端/桌面端对齐、功能与视觉分开验收。
- `apple-web-design` + `apple-liquid-glass`：阅读层保持实体背景，玻璃只放在浮动导航层；44px 触控与 reduce-transparency。
- `liquid-glass-web`：读取 pattern D 兼容性规则；现有 `createGlass(...,{mode:'backdrop'})` 是真实加载的引擎，但 WebKit 在任意滚动 DOM 上只能退回 L1 blur。未声称 L2 原生折射。
- `motion`：保留现有 Motion 弹簧选中胶囊，滚动边缘只更新单一 CSS 属性，不重算几何，也不新增另一个弹簧引擎。
- `finesse-ui` 与 `impeccable`：延续上一笔 V5 字号与按钮规范，本轮只修正底栏遮罩状态，避免再次堆叠玻璃组件。

## 修改
- `apple-editions/ai-academy-v5/v5-scroll-edge.js`：计算内容剩余可滚动距离，将 0–1 的强度写入 `--zx-edge-opacity`；滚动事件 + ResizeObserver + 课程内容渲染事件安排在单帧中更新，避免无用的同步布局读写。
- `v5-scroll-edge.css`：把原渐变遮罩与透明度变量连接；由已有 `backdrop-filter` 提供柔和 scroll edge，保留 reduced-transparency 高对比回退。
- `v4.js`：每次切换页面或更新学习内容后发送 `zhixu:content-rendered`，只通知边缘层更新；科学题库、计算、错题事件完全不变。
- V4、R3、Original 未改，原评委 URL 与路径兼容。

## 证据
- TDD 先失败后通过：新增 `tests/zhixu-v5-scroll-reactive.test.mjs`。
- Edge 与 Playwright WebKit 分别在 320px、390px 测试：有可滚动内容时渐变正常；滚动到底淡出；连续切换四个 tab 后状态正常；无 404 与 JS 错误。
- `npm test` 107/107；`npm run audit:filenames` 通过（注意该工具仅核验文件名）。
- **未进行 iPhone Safari 真机、VoiceOver、L2 光学折射或 120Hz 帧率实测**，不能等同于 Apple 系统原生材质。
