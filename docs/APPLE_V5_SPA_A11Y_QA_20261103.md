# 知序 Apple V5：学习进度语义与单页导航焦点收口（2026-11-03）

## 产品、范围与约束
- 项目：知序 AI 学院。评委固定入口仍为 `https://ndshuge.github.io/zhixu-ai-academy/`，最终页面为同仓库 Apple V5。
- 从 `origin/main@18089ca` 独立工作树推进；不修改小芽、Original、R3、V4、PFL/EvoWorld 核心证据。
- 本轮只涉及 `apple-editions/ai-academy-v5/{views.js,index.html,v5-route-focus.js}` 与自动化测试。其他施工分支正在调整 V5 设置导航，避免改动它们正在写的 `v4.js`、`v5-product-design.css`、`v5-system-appearance.css`。

## 发现和依据
1. 原有四段学习进度标记在 `views.js` 是只有 `aria-label` 的普通 `div`，视觉上有四条线，但没有标准进度条角色、最小值/最大值、当前值与阶段文本。依照 WAI-ARIA：
   - https://www.w3.org/WAI/ARIA/apg/practices/range-related-properties/
   - https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/progressbar_role
2. SPA 的 `goto()` 重绘 `#screen` 但没有向屏幕阅读器交接新页面内容焦点，浏览器文档标题始终为 V5，不反映当前页面。参考：
   - https://developer.chrome.com/docs/lighthouse/accessibility/managed-focus
   - https://dev-design.va.gov/6161/accessibility/focus-management
3. 每次表单作答与学习阶段内部重绘会触发 `zhixu:content-rendered`；如不区分“路由改变”和“同页刷新”，容易造成输入过程焦点抖动。只对真实的 `data-page` 变化执行一次 `screen.focus({preventScroll:true})`。

## 实施
- `views.js`：以同一四步进度数据生成 `role=progressbar`，值范围 `1..4`，并通过 `aria-valuetext` 描述阶段。保留原视觉进度线，无新增依赖。
- `v5-route-focus.js`：监听现有 `zhixu:content-rendered` 事件，识别路由真正变化后更新 `document.title` 和主内容焦点；同页重绘不动作。
- `index.html`：仅 V5 加载独立导航焦点模块；不侵入其他版本或科学引擎。

## 验收
- 先写失败测试：`tests/v5-spa-reading-semantics.test.mjs`，RED 2/2，修改后 GREEN 2/2。
- 真浏览器测试：`tests/browser-v5-spa-reading.cjs`，Edge/WebKit × 390/1440，4/4 PASS；检查阅读焦点、标题更新、same-route 不抢焦点、progressbar 数值。Edge 390 的真实 Logistic 前测→预测→科学实验→迁移路径进一步覆盖 1/2/3/4 阶段变更。
- 尚需：提交并从全新工作树验证，再检查正式 Pages 对应的线上脚本；真实 VoiceOver、iPhone Safari 和高缩放设备未由本轮模拟证明。

## 诚实边界
ARIA 属性与程序化焦点验证是工程层面的证据，**不等于已在实体 iPhone 上完成 VoiceOver 朗读验证**。尚未经过真人无障碍用户试测；真人教育成效样本仍为 0。
