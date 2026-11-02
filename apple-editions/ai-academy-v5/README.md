# 知序 AI 学院 · Apple V5 学习工作室 × 科学实验室

> 2026-11-02 从完整 Apple V4 拷贝，原 V4 文件未修改。V5 增加双入口首页、可交互 Logistic 公式预览、四阶段学习说明和独立样式层；后续正式改版仅修改 V5。这里沿用的 `QA_REPORT.md` 是 V4 历史参考，不能作为 V5 真机验收证明。实验预览数据不计入学习证据，正式科学实验和导师权限仍由 Original ScienceBridge 负责。

这是与 R3 Apple Edition **完全分离**的界面重建候选版。它不是旧版 HTML/CSS 的覆盖层，而是自行定义的 `index.html`、`v4.css`、`views.js`、`v4.js` 和独立科学桥 `bridge.js`。2026-11-02 起，本版源码也保存在 `ndshuge/zhixu-ai-academy` 独立仓库的 `apple-editions/ai-academy-v4/`；经发布验收后作为新的正式首页。原有 R3、Original 路径继续保留。

## 设计与功能

- **iPhone**：Apple Books 式继续阅读和课程书架、单列阅读/实验页、悬浮玻璃导航、顶部博士；课程横向滑动时不截断文字。
- **桌面**：Notes 式主导航、上下文目录和阅读内容三栏；可收起中栏。无伪 Mac 红黄绿交通灯。
- **核心功能**：科学课程、原版前测和迁移题、独立预测、真实 Logistic 与 EvoWorld 实验、原版规则导师、经明确授权可调用的 DeepSeek、真实的 V2 错题/复习/知识进度、学习数据导出/清空与 Original Edition 回退入口。
- **科学不重写**：同源 iframe 引用 `/zhixu-ai-academy/learning.html`；所有原版科学 API 与 V2 学习数据结构保持不变。实验图形显示的是原版数据，简化高密度图只显示前 88 次迭代并明确标注，不改变原数据。
- **视觉引擎**：实际 import 并执行上级 Apple 版附带 MIT Liquid Glass Web Components 与 Motion bundle；本仓库父目录含许可证。SVG 折射在受支持的 Edge 中开启，WebKit 等环境可降级为模糊玻璃。
- **隐私**：不会读取、上传用户真实 API Key；模型必须经原版验证，当前会话数据不被伪造成 AI 生成内容。
- **可访问**：无预选答案、最小触控区、键盘焦点、对比度、减弱动态/透明效果与系统安全区。

## 设计证据

从 Apple 官方原版参考入手，提炼**布局结构与行为**，不是复制 Apple 私有应用资源或声称 SwiftUI 原生：

1. Apple Books 官方阅读界面：<https://support.apple.com/guide/iphone/read-books-iphc1af7c57/ios>
2. Apple Notes 原生多栏：<https://support.apple.com/guide/notes/view-your-notes-apd8b73d28be/mac>
3. Apple Material / Liquid Glass：<https://developer.apple.com/design/human-interface-guidelines/materials>
4. Apple Layout：<https://developer.apple.com/design/human-interface-guidelines/layout>

另使用了 SHUGE Apple Design Skill、原版 MIT Liquid Glass、Motion、Taste Inspector，并实际运行浏览器截图。详见 `QA_REPORT.md`。

## 部署与回退

静态目录可由 Galaxy Pages 直接提供：

- V5 正式版：`/zhixu-ai-academy/apple-editions/ai-academy-v5/`
- R3 历史版：`/zhixu-ai-academy/apple-editions/ai-academy-apple/`
- Original：`/zhixu-ai-academy/original.html`

V4 仅在有同源 Original Pages 的环境工作；跨域单独托管不会得到科学接口。

## 验收界限

Playwright Edge 与 Windows WebKit 不等于真实 iPhone Safari/120Hz 手势设备。评委入口只有在真正通过视觉与功能终验并确认后才能切换。该项目没有获得 Apple 认证或原生 API 加持。

## Interaction revision

The V4 UI additionally loads `v4-kinetic.css`. The mobile five-tab control is a single-layer shared Motion spring indicator with the original MIT `createGlass()` backdrop on Blink. iOS WebKit falls back to translucent blur (true arbitrary-DOM backdrop refraction is not available to ordinary webpages). The compact doctor popover avoids auto-opening the keyboard before a verified model is available. The public competition link still points to R3 until physical iPhone review.

Route transitions: lightweight, four-block CSS stagger with an opacity-only heading; no screenshot-based transitions. Original Motion bundle is modulepreloaded and liquid tab indicator remains a single physical layer. The public competition entry remains R3.
