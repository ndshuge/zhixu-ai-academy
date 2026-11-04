# 知序 AI 学院 V5：原生 API 设置、横向分段滑块与小芽式连续底部模糊

2026-11-04。施工源：`origin/main 53458c6`，隔离分支 `feature/zhixu-v5-segment-press-20261104`。

## 需求还原
用户明确要求：
1. 横向的三枚实验选择不能突然重建/滚走，需与 Apple Dock 一样平行滑移。
2. Dock 选项点击响应略加快，独立按钮和原生 API 配置内的按钮均应有反馈。
3. 原有科学实验、评级与记录后端可以复用，但 V5 API 的所有用户界面必须是 V5，不得跳出原版配置弹层。
4. Dock 模糊效果**直接研究小芽最新提交**并移植，不能继续猜多组渐变数值。

## 独立审计和真实来源
小芽仓库现有正式远端 `origin/main dc234ed07e995c0b6426b49b86c307316420784e`（2026-11-04 15:55 中国时间）。明确读取文件：
`little-works/xiaoya-apple/native-v4/unified-dock-and-press.css`、
`little-works/xiaoya-apple/native-v4/index.html`。

正式原型利用单个 `.xy-progressive-underlay` 容器、四个重叠背景模糊层（3 / 7 / 13 / 22px）和渐变 scrim；禁用旧 `.app-frame::after` 和 `.bottom-nav::after` 的二次背景采样。未把另一开发树中**未提交**的 `dock-near-blur-press.css` 当作已发布基线。

知序从该正式实现移植 `.zx-progressive-underlay` 与 4 层模糊遮罩至 `v5-xiaoya-dock.css`，但保留知序色彩变量、固定 Dock 的原生导航以及键盘/博士弹层的遮挡降级。原本 `body::after` 通过 `content:none;display:none` 禁用，避免同一处叠加两套透视。无需修改小芽仓库。对 Safari 原生浏览器地址栏没有控制能力；桌面 WebKit 只能模拟网页可见视口。

## 交互、架构变更
- `views.js` 的实验选择改为语义 `tablist`/tab，三等分原位按钮，唯一 `experiment-lens` 指示器在容器内做 transform X 平移。支持 44px 触控区和 reduce-motion。另在 `v4.js` 学习路由重渲染时**保留同一个按钮组 DOM**，只更换选中状态与实验内容，避免选择第三项时控件被销毁造成的跳变。同步 `zhixu:content-rendered` 触发滑块位置更新。
- Dock 导航从之前约 190ms commit 改为 105ms；其余原有较长主 CTA/表单按压反馈不减。通用按钮捕获扩展至 `a.primary`（首页的链接式按钮此前是漏网项）；横向分段按钮保持平面反馈。
- V5 过去的 `open-ai-config` 调用 `show-original-engine` 直接显示一个 iframe，源为旧 `pages-ai-card`（Microsoft YaHei、大面积旧面板）。新版本使用 **V5 原生** `v5-native-api.js` + `v5-native-api.css`，全部 UI 在当前顶层页面 `#dialog-layer`；底层 Original `learning.html` 只作为科学实验引擎，保留其指纹与本地持久记录，不再承担模型用户界面。
- `ScienceBridge.modelStatus/modelAsk` 改为 V5 `nativeApi`，请求仍是原有浏览器直连 DeepSeek 官方 API；没有修改后端科学评分协议。官方 API Key 仅保存在 V5 模块的内存变量里，不写 localStorage/cookie、iframe 或 GitHub。用户主动授权触发少量有成本的连接测试；关停即清除。明确 401/402/429、网络和超时错误分类，并保证没有凭据泄漏至页面调试日志。未使用真实付费 Key。

## 验证（发布前）
- `npm test`：169/169 PASS；`npm run verify` 科学指纹无变化。
- `tests/browser-v5-native-segment.cjs`：Edge/WebKit × 390px / 1440px 4 场景，检查同一 `experiment-tabs` 元素保持不变，滑块实际从第一段向第三段平移、焦点正确；DeepSeek V5 原生弹层可见且旧 iframe 不显示，模拟 200 / 401 / 402 / 429 / 网络失败；成功后博士共享同一状态，默认不落地 Key。实测 4/4 PASS。
- 现有回归 `browser-v5-full-journey.cjs` Edge 科学实验、作答、导出持久化 PASS；`browser-v5-type-motion-api.cjs` WebKit 动态字号与原生 API 未授权状态 PASS；`browser-v5-press-feedback.cjs` WebKit 390/1440 按压回弹与快速点击 PASS；`browser-v5-settings-dock.cjs` Edge/WebKit 8/8 PASS；`browser-v5-ios-motion-dock.cjs` WebKit 2/2 PASS；`browser-v5-duo-perf.cjs` WebKit 2/2 PASS；`browser-v5-gesture-blur.cjs` WebKit 2/2 PASS。
- 通过本地预览 WebKit 手机 390×844 的截图逐项查看学习三段式、设置 API 原生 sheet、底部统一模糊和长文本界面。生成的截图仅保存在 `E:\CHATGPT\_tmp\zhixu-v5-native-xiaoya-preview-20261104`，未纳入公开提交。
- iPhone 17 Pro Max 真机 Safari 的 GPU 实际帧时间与 Safari 底部原生工具栏的色彩边界仍需要用户在新版验证；不宣称已完全消除全部卡顿。

## 保持不变
Original / R3 / V4 视觉版本，PFL/EvoWorld 科学事实数据，既有学习记录存储、实验评分及跨步迁移流程，公开评委网站入口。


## 2026-11-04 17:26 · 小芽最新版：Dock 上方清晰度修正

- 查阅小芽真正最新正式远端 `origin/main b31c961`（2026-11-04 16:58 +0800），其已提交 `little-works/xiaoya-apple/native-v4/dock-near-blur-press.css`，其中明确说明上次 196px 羽化高度使阅读内容在 Dock 上方约 117px 处开始变糊；正式新版改为 114px，高度上沿距 Dock 顶部约 35px，前 13% 的第一层遮罩透明，上半部分背景染色直到 35% 保持透明。
- 知序针对这一个问题只新增 `v5-dock-near-clear.css`，在原 `v5-xiaoya-dock.css` 后加载。移植新版本 114px 高度和 2 / 6 / 12 / 20px 四层重叠模糊，顶部渐进透明、底部保留强模糊；延续知序颜色变量、暗色、提高对比度和减少透明度处理。没有碰 API、实验 UI、页面切换和其他业务逻辑。
- 新 `tests/v5-dock-near-clear.test.mjs` 红→绿，3/3 PASS；`tests/browser-v5-dock-near-clear.cjs` Edge/WebKit × 320/390/430/768px 8/8 PASS：手机统一 114px，高度上沿比 Dock 顶部早 36px，4 层实际计算模糊 2/6/12/20px，无旧 body::after 层，桌面不渲染移动遮罩。原浏览器回归调整了旧 196px/22px 断言，新 WebKit Dock/动效回归 PASS，`npm test` 172/172 PASS，`npm run verify` 指纹未变化。
- 独立 WebKit 390×844 视觉对比在同一高对比文字密集页面禁用/启用新增 CSS，截图 `E:\CHATGPT\_tmp\zhixu-v5-near-clear-preview-20261104\near-clear-BEFORE.png` / `near-clear-AFTER.png`，确认 Dock 上方约 700–730px 的文字清晰度恢复、下方继续羽化。浏览器 Safari 原生地址栏不受此网页 CSS 控制，iPhone 真机物理验收仍待用户核验。
