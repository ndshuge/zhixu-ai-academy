# 知序 AI 学院 Apple V5｜全站设计审计与分阶段改造规范

日期：2026-11-03 · 主项目：`ndshuge/zhixu-ai-academy` · 基线 `44fbf75` · 独立工作树 `feature/zhixu-v5-full-design-audit-20261103`

## 产品定位
- 核心用户：希望理解科学原理、自主做出判断、借助苏格拉底式导师和可重复科学实验验证知识的学习者。
- 主路径：进入课程 → 独立前测 → 提出预测 → 运行可重复科学实验 → 导师追问 → 迁移检验 → 学习证据/错题复习。
- 品牌：研究型阅读与实验工作室，中文自然简洁。保留可验证的实验、真实事件、V2 学习记录、规则导师/明确授权的 BYOK 接口。
- 两端信息架构：手机 5 个稳定 tab + 右上角设置与导师；桌面左侧主要导航+仅在需要时出现的步骤/课程目录。
- 本轮选定方向：**内容中心 Hybrid / Apple Books 的阅读层级 + Notes 的轻控制 + Safari 浮动导航隔离**；不使用大量仪表盘统计卡、无依据生理掌握率、伪原生折射或全页面玻璃。
- 拒绝方案：换 React+R3F+GSAP 的 Prism 全重构、引入独立 WebGL DOM 捕获玻璃库、所有内容卡玻璃化。这些会伤害现有 Vanilla JS 科学教学引擎及中低端手机性能。

## 研究依据
- Apple Design Principles: https://developer.apple.com/design/human-interface-guidelines/design-principles
- Apple Design Resources: https://developer.apple.com/design/resources/ （2026 iOS 27 kits 发布，兼顾 iOS 26）
- WWDC25 356 Design System: https://developer.apple.com/videos/play/wwdc2025/356/（同一 scroll view 一层 soft edge，不叠加灰白底）
- WWDC25 219 Liquid Glass: https://developer.apple.com/videos/play/wwdc2025/219/（玻璃只在导航/浮控层；内容优先）
- Apple Tab Bars: https://developer.apple.com/design/human-interface-guidelines/tab-bars （tab 位置长期稳定）
- Apple Feedback: https://developer.apple.com/design/human-interface-guidelines/feedback （简单成功状态轻提示，严重错误留在上下文）
- Apple Books 阅读界面: https://support.apple.com/guide/iphone/read-books-iphc1af7c57/ios （正文与继续阅读明确主次）
- Apple Notes 便笺: https://support.apple.com/guide/iphone/get-started-with-notes-iph9e04f3be2/ios （阅读文面简洁）
- Motion JS: https://github.com/motiondivision/motion （MIT，已通过项目内 motion.bundle.js 采用）
- ybouane/liquidglass: https://github.com/ybouane/liquidglass （MIT，需 DOM 截图与 WebGL compositing；滚动复杂/视频高成本，不新增）
- motiondivision/motionone: https://github.com/motiondivision/motionone （2024 archived，不用于新项目）
- 如需更进一步研究 L2，只做独立实验并用真实 WebKit 性能和降级证明，不进入主线默认视觉。

## 路由与状态清单
| 路由 | 主要交互 | 子状态/空态 | 桌面导航 | 手机导航 | 本轮状态 |
|---|---|---|---|---|---|
| `today` 今天 | 开始学习、预览滑块、课程推荐 | 真实数据 0、滑块中途拖动、可滚动短页 | 左栏+正文 | dock | 基线已截屏 |
| `courses` 课程 | 两个科学世界、课程入口 | 可选实验、真实课程状态 | 有用的课程目录 | dock | 基线已截屏 |
| `learn` 学习 | 3 实验切换、前测、预测、科学实验、导师、迁移、重新开始 | 题目未加载、加载中、回答、异常、权限 | 有用的步骤目录 | dock | P0 reset 错误已复现 |
| `library` 资料 | 复习任务、近期作答、误区确认 | 空题库、误区待确认、长文本、日期 | 重复静态目录 | dock | P1 目录压缩 |
| `growth` 进度 | 证据统计、最近学习事件 | 无真实记录、0 值、长时间线 | 说明型目录 | dock | P1 目录压缩 |
| `settings` 设置 | 减少动态、重置、BYOK、导出、清空、原版链接 | 开关/危险确认/授权/异常 | 说明型目录 | 右上角入口 | P1 触控尺寸、冗余目录 |
| 全局叠层 | 知序博士、确认弹框、Toast、dock | 关闭中反向、键盘、Reduced Motion、透明度偏好 | toolbar | toolbar+dock | 先前闪烁未解决 |

## 审计矩阵（本轮发现）
| ID | 优先级 | 实证与源代码 | 参考原则 | 修复/方案 | 验收标准 |
|---|---|---|---|---|---|
| ZX-01 | P0 | `v4.js` 中 reset-lesson → goto('learn') 当前路由早退，Edge/WebKit 复现残留节点 | Feedback / 语义准确 | 当前路由直接 render，其他路由 goto | 重置页面实际更新，旧学习事件不删 |
| ZX-02 | P1 | 320/390 设置中连接 25–26px、导出 37–42px、清空 38px、原版链接高度 20px，且有文字竖排 | Controls / 44px / Touch | 操作最小 hit box 44×44，文本不竖排、不挤压主栏 | 320/390/768/1440 实测无小于 44px 的 CTA |
| ZX-03 | P1 | 1440 设置/进度/资料双侧栏中间信息无可操作性/重复占约 216px | Deference / 可用正文宽度 | 三路由不显示第二侧栏，只保留课程/学习的有用目录 | 1440 正文扩大，页面路径/返回稳定 |
| ZX-04 | P1 | 首页部分辅助文字 <12.5px；r 滑块视觉 31px | Typographic hierarchy / Direct Manipulation | 核心辅助说明适当提高，滑块可触控 44px | 320/390 滑块拖动成功；不改变其科学计算 |
| ZX-05 | P1 OPEN | 知序博士中途反向时 WebKit 闪到 opacity=0 | Motion continuity | 后续需要单一动画状态控制器和中间帧审计 | WebKit 0/25/50/75/100% 反向无闪烁 |
| ZX-06 | P1 OPEN | 额外 PFL verify SHA mismatch | Evidence integrity | 核对封包完整性，不在纯设计分支改证据哈希 | npm run verify 单独绿灯 |
| ZX-07 | P2 | 主标题与工具栏重复，某些英文式说明 | Apple Books / Clarity | 后续逐页减重，保留真实免责声明 | 页面阅读顺序自然、可访问 |
| ZX-08 | UNVERIFIED | iPhone Safari 实机 / VoiceOver / 200% / 黑暗模式/外接键盘 | Accessibility | 分离真实设备验收清单 | 必须真实设备检验，不以 Playwright 冒充 |

## 工作边界与阶段
本轮交付第一段：全路由和组件矩阵 + 24 基线截图 + Apple/GitHub 研究 + ZX-01～ZX-04 有独立功能测试的收敛；其他项记录为 OPEN/UNVERIFIED。不得在没有 iPhone 真机证据时宣布 Apple 水准达标。线上正式 URL 固定不变；评委入口是否发布，必须依据测试与非强制推送范围检查。
