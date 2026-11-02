# 知序 AI 学院 Apple Edition｜R3 最终兼容性与功能验收

日期：2026-10-29。仅涉及 `little-works/ai-academy-apple/`，不修改 Original Edition 科学引擎、题库、BYOK 边界或用户历史记录结构。

## 真实设计来源与实施

- 已加载原生 SHUGE Apple Design、Apple Web Design、Frontend Dual Source、Liquid Glass for the Web、Motion、Taste-Skill 的 Skill 说明及相关参考。
- 已访问 Apple HIG 的 Materials、Tab Bars、Layout 文档；设计遵循「玻璃控制层 / 清晰内容层」的分层原则，而不是把每个正文卡片做成玻璃。
- Taste-Skill 的原版 `draw.mjs --app --kind workspace` 已执行，比较 `editorial-greeting` 与 `achromatic-ledger`，采用科学证据优先的内容层级。系统字体保留 Apple 平台文字兼容性。
- 实际运行的开源前端引擎：`assets/liquid-glass.js` + `assets/components.js`、`assets/motion.bundle.js`；浏览器检测到 `lg-navbar`、Motion、按压导航与 SVG 位移滤镜。许可证沿用本目录 assets 下的原始 MIT 记录。没有将阅读说明等同于集成。

## 已执行验收

| 维度 | 结果 | 证据位置（本机临时工作区，未发布含用户数据的记录） |
| --- | --- | --- |
| Edge 页面、科学桥、导航、320/390/768/1440 布局 | 24/24 通过；0 JS 异常；0 HTTP 资源故障 | `evidence-native-r3/report.json` |
| 真实学习闭环 | 13/13 通过：前测 2 题→提交预测→运行真实科学计算→规则导师→迁移题→本地 V2 学习记录 | `evidence-native-r3/functional-flow.json` |
| Playwright WebKit（Windows） | 6/6 通过：首页、无横向溢出、原版桥、导航、Motion | `evidence-native-r3/webkit.json` |
| 首帧与加载后布局一致性（390px） | 通过：新旧状态均为新 R3 页面；无旧主页闪屏 | `evidence-native-r3/first-paint.json` |
| 在线 GitHub Pages 回归 | 13/13 通过：新 Apple 页面、桌面与移动端、真实原版桥、原版旧入口、无资源失败 | `evidence-native-r3/production-report.json` |
| 原版科学和用户数据 | 保持原版同源 iframe 桥接、预先独立预测、未预选答案、未授权不付费模型 | `app.js`、`index.html` |
| 味觉/构图检查 | Taste app-mode 原版 inspector：0 FAIL、3 WARN（字号与几处图标边缘线条） | `evidence-native-r3/taste-app/report.json` |

## 已知限制与回退

- WebKit 是 Windows 上的 Playwright 浏览器，**不是 iPhone Safari 真机测试**；真机性能、120Hz、长按触觉与像素匹配不可由此宣称已验收。
- WebKit 在当前截图环境中检测到 SVG 折射滤镜为 0，启用现有透明/模糊降级；Edge 中实测存在位移滤镜。不能将 WebKit 的 L1 模糊冒称为 L2 折射。
- 真正 AI 聊天需要用户自行验证 BYOK；验收只运行不付费的规则导师，不读取或调用个人 API 密钥。
- 公共页面路径：`/ndshuge-galaxy/little-works/ai-academy-apple/`；独立回退入口：`/zhixu-ai-academy/original.html`。发布时只做不强推的 fast-forward 更新。

## 视觉裁决

桌面采用稳定侧栏 + 数据驱动主工作台；手机采用清晰阅读内容 + 原生感浮动底栏，科学曲线由 Logistic 方程确定性计算，博士入口缩为可展开图像按钮。避免八角星、滥用玻璃、虚构进度或漂亮但无意义的统计数据。工程 QA 不等于 Apple 官方设计认证或用户最终美术签收。
