# 知序 AI 学院 V5｜深色外观、无障碍与旧版科学验收（2026-11-03）

## 范围与产品边界
唯一项目：知序 AI 学院（科学探究学习、导师反馈、迁移测验、学习证据）。正式入口仍为 `https://ndshuge.github.io/zhixu-ai-academy/`，正式源码 `ndshuge/zhixu-ai-academy`，生产版 `apple-editions/ai-academy-v5/`。本轮从 `08cbe6e` 创建独立 Git worktree。Original/R3/V4 和 PFL/EvoWorld 核心算法未改动。

## 已研究资料
- Apple HIG Color: https://developer.apple.com/design/human-interface-guidelines/color —— 颜色必须兼容浅色、深色、高对比，色彩不应独占状态传达。
- Apple HIG Dark Mode: https://developer.apple.com/design/human-interface-guidelines/dark-mode —— 尊重系统偏好、保证内容对比度，区分表面与控制层。
- Apple HIG Materials: https://developer.apple.com/design/human-interface-guidelines/materials —— 浮动 Dock 可使用材质，阅读区优先不透明高可读表面，不把 CSS 模糊称为系统原生 L2 折射。
- Apple WWDC25 Meet Liquid Glass: https://developer.apple.com/videos/play/wwdc2025/219/ —— 控制与内容的空间层级、背景感知以及可访问性。
- Chat 已实际读取 `shuge-apple-product-audit`、`finesse-ui`、`shuge-apple-design`，配套的 `AUDIT_MATRIX.md` 和工程 TDD/系统调试 Skill。本机的 Mice Hole 仅作文件、终端、浏览器桥接；不视为 Apple Skill 已安装于本机。

## 修改内容及原因
| 级别 | 页面/组件 | 原问题、证据 | 实施方案 |
|---|---|---|---|
| P1 | 六个 V5 页面 | 浏览器模拟 dark preference 后仍显示纯亮色背景：移动阅读区 rgb(246,246,248)，书架、设置分组 rgb(255,255,255) | 新增 `v5-system-appearance.css`，使用 `prefers-color-scheme:dark` + 色彩角色，布局和科学教学不改变；系统浅色仍保持原表现 |
| P1 | Dock、博士与设置按钮 | 深色背景下首版截图发现设置按钮仍是 rgba(255,255,255,.82) 的亮色胶囊 | 纠正 CSS 优先级，统一深色 Dock 与 toolbar 控件材质；不额外引入光学库 |
| P1 | 系统对比度/透明度 | 背景材质在某些系统辅助模式下可能降低可读性 | 使用 `prefers-contrast:more` 增强边框/控件，`prefers-reduced-transparency:reduce` 时给控件提供不透明降级 |
| P1 | 确认清空学习记录 | WebKit 按下 Clear 时临时 disabled 导致 activeElement 变为 body，Esc 无法返回触发按钮；模态框也未处理键盘 Tab 循环 | 将触发按钮显式传给 `confirmModal`，补全 Escape、Tab/Shift+Tab、aria-describedby，取消后焦点回原按钮，确认后落在 stage |
| P0 | 原版公开证据接口 | `/api/evidence/summary` 因私有细节文件不在公开源仓库而 HTTP 500，旧浏览器验收随之失败 | 从保留在本机原工程的真实实验 JSON 经严格条件验证生成 **仅统计+SHA 指纹**的 `evidence/public-synthetic-technical-summary.json`；服务端缺少明细时返回此明确标注“合成技术测试”的汇总，不复制原始 prompts/模型输出 |
| P1 | 原版浏览器测试 | `networkidle` 等待后台持续请求，浏览器 30 秒超时；页面尚未执行业务断言 | 官方 5 个测试脚本改用 `domcontentloaded`，并沿用实际教学控件可见性/网络检查；保留所有原断言和 HTTP>=400 失败条件 |
| 工程 | 测试输出隐私 | `evidence/browser/` 生成 25 份截图/报告，可能包含临时测试输入 | 加入 .gitignore，只发布无敏感细节的审计截图，移除本轮未跟踪的临时浏览器文件 |

## 本轮真实测试结果
- `npm test`：**143/143 PASS**（新增深色源码、模态键盘、公开证据、旧测试加载契约测试）。
- `npm run verify`：**PASS**，PFL/EvoWorld SHA-256、11 个 Evo 模块及上游漂移计数正常。
- `npm run test:browser`：**完整 5 套脚本 PASS**：PFL 实验与移动、学校 API、Agent 审批、G1–G4 学习、G4 合成研究展示。
- `tests/browser-v5-system-appearance.cjs`：Edge + WebKit × 390/1440 × 六页面 × light/dark **48/48 PASS**。主要卡片与标题文本实际计算的对比度 ≥4.5:1；不涉及深色渐变区域所有像素的审计认证。
- WebKit 系统更高对比偏好、dark × 390 六页面 **6/6 PASS**。
- `tests/browser-v5-modal-a11y.cjs`：Edge/WebKit × 390/1440，**4/4 PASS**。检测 Tab/Shift+Tab、Escape、焦点回跳、确认后的 stage 焦点。
- 修改后的 V5 真实教学链路：Edge/Logistic 与 WebKit/EvoWorld，均已通过前测、预测、真实计算、规则导师、迁移、刷新、导出、取消删除。
- `npm run audit:filenames`：PASS，但仅文件名/目录检查，**不是内容/历史/API 秘钥全面安全扫描**。
- 本地页面截图 `docs/evidence/apple-v5-appearance-20261103/`，均来自 Playwright Edge/WebKit；并非 iPhone 真机。

## 严格的真实性说明
- 公开合成技术证据：离线 60 场景 / 120 次实际 PFL 重算，8 个远程合成场景由 1 次真实模型调用覆盖；并未验证学生学习效果。
- 真人学习成效：**0 人**；不能写成已有真实教学提升。
- 本轮没有使用或打印 BYOK 真实 API Key。真实商用模型计费、授权、网络中断需获得安全授权后才能验收。
- iPhone Safari、物理设备 VoiceOver、系统动态字体及 60fps 测量：**未验证**；Playwright WebKit 不能替代真机。
- 本次仅 V5 支持跟随系统暗色；原版内嵌 AI 配置页仍属独立 UI，它的深色适配未证明覆盖。

## 后续
1. 真机 iPhone Safari：系统深色/浅色切换、地址栏伸缩、软键盘、页面转场、减少动态、VoiceOver / 大字号、实际帧率。
2. 真实模型连接：通过用户自行授权的 BYOK 配置测试认证、断网、429、超时、重试和密钥生命周期。
3. 真实学生试测：前测→独立迁移→延迟记忆，获得受试者知情同意与匿名评价，不将模拟成绩标真人证据。
4. 深色动态高对比灰阶细节和真正 L2 光学折射仍需真实硬件与性能证据；目前只有可靠 L1 降级。
