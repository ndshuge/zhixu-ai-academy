# 知序 AI 学院 Apple V5｜设计研究、开源选型与 Chat Skills 实录
日期：2026-11-03。独立工作树 `feature/zhixu-v5-full-design-audit-20261103`。

## 1. 当前产品与选定方向
**知序是深度学习学伴**：独立作答、提出假设、可重复科学计算、导师提问、迁移测试和学习证据。目标用户是主动学习理工知识的学生。Apple 视觉只是服务学习任务的产品语言。

本轮采用 **Apple Books 式的阅读层级 + Notes 式的朴素信息控件 + iOS 浮动导航/scroll edge**。手机用五个稳定主 tab；桌面主导航 + 有价值时才展开的课程/步骤目录。玻璃层不能覆盖主要阅读内容。

## 2. 实际打开/研究的 Apple 官方资料

| 实际资料 | 可证实的原则 | 实际落点 | 未照搬的内容 |
|---|---|---|---|
| [WWDC25 · Get to know the new design system](https://developer.apple.com/videos/play/wwdc2025/356/) | 一个 scroll view 使用协调的 soft edge；玻璃控件与正文保持空间分层，不叠加多个 edge | 保留已有 `v5-scroll-edge.css/js` 的滚动感知边界，避免叠第二片高白雾 | 系统私有折射/光场 |
| [WWDC25 · Meet Liquid Glass](https://developer.apple.com/videos/play/wwdc2025/219/) | 浮动控制属于独立层，玻璃与其背景响应相关联 | 导航与对话控件优先，内容保持实体可读 | 通过 CSS blur 冒称系统 L2 |
| [Apple HIG · Layout](https://developer.apple.com/design/human-interface-guidelines/layout) | 实际阅读面积、安全区、控件之间的关系 | 有用时显示桌面目录，无作用时收起 | Mac 分栏比例直接照搬到 iPhone |
| [Apple HIG · Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars) | tab 位置与选择状态稳定、语义清楚 | 手机固定五个主 tab；设置入口不保留错误高亮 | 强行增加第六个 tab |
| [Apple HIG · Feedback](https://developer.apple.com/design/human-interface-guidelines/feedback) | 短反馈优先，严重问题应在内容上下文明确说明 | 保留短 Toast、危险清空确认、AI 授权 | 每个操作都弹全屏模态 |
| [Apple Design Principles](https://developer.apple.com/design/human-interface-guidelines/design-principles) | Clarity、内容优先、直接操作、及时反馈和一致性 | 调整学习重置反馈与设置按钮面积 | 为视觉效果牺牲任务可达性 |
| [Apple Design Resources](https://developer.apple.com/design/resources/) | 2026 年已提供 iOS/iPadOS 27 官方套件，同时保留 26 资料 | 参考按钮、开关、tab 形态和自适应规则 | 复制 Apple 私有资产或视觉标识 |
| [Apple Books 阅读指南](https://support.apple.com/guide/iphone/read-books-iphc1af7c57/ios) | 正文层级、正在读和资料库区分 | 保留课程、学习、资料不同页面职责 | 课程假装电子书商店 |
| [Apple Notes 使用指南](https://support.apple.com/guide/iphone/get-started-with-notes-iph9e04f3be2/ios) | 操作清楚，长文以内容为主，精简工具栏 | 设置页面删重复说明/齿轮；减少无效中间栏 | 增加纯装饰的工具条 |
| [Apple Reminders 支持](https://support.apple.com/es-es/102484) | 清晰分组行、可理解的切换、实际可点击目标 | 设置开关保留 30px pill 轨道，点击盒44px | 将学习流程改造为待办 App |

**研究证据级别**：WWDC 页面及字幕实际打开；HIG 部分页面要求 JS，使用其可见搜索摘要和 WWDC 互相验证；Books/Reminders 可见 Apple 官方帮助截图属于静态参考，未声称观察过真实 App 的中间动画帧。

## 3. GitHub/开源实现调研（2026-11-03）

| 仓库 | 实际查看的实现/许可证/维护性质 | 选型 |
|---|---|---|
| [motiondivision/motion](https://github.com/motiondivision/motion) | MIT、活跃、提供 Vanilla JS `animate`、spring、MotionValue；现有 V5 已导入 `ai-academy-apple/assets/motion.bundle.js` | **复用现有运行时**，不再引入第二套动画库 |
| [ybouane/liquidglass](https://github.com/ybouane/liquidglass) | MIT、WebGL + Canvas + DOM rasterization，动态元素需要重捕获；根元素结构有约束，复杂滚动代价高 | **拒绝在 V5 默认运行**，可在离线实验验证后再讨论 L2 |
| [rdev/liquid-glass-react](https://github.com/rdev/liquid-glass-react) | React 组件 + WebGL/Shader；本项目是 Vanilla JS，接入会引入框架耦合 | 当前不采用 |
| [motiondivision/motionone](https://github.com/motiondivision/motionone) | GitHub 2024-11-12 归档，只读；许多旧教程仍引用它 | 不采用过期库 |

**开源研究结论**：Stars 不能替代用户触控、Safari 和材料层的性能验收。V5 已有可用的 Motion 与玻璃引擎，继续复用比全栈换 React、增加帧采样开销更符合产品目标。

## 4. 当前 ChatGPT 挂载 Skills 的真实使用状态

| Skill | FOUND | READ | APPLIED（本轮源码/方法） | VERIFIED |
|---|---|---|---|---|
| `shuge-apple-product-audit` + `AUDIT_MATRIX.md` | 是 | 是 | 六路由/状态矩阵与 P0/P1/P2、真实浏览器基线 | 24 张基线、4种宽度 |
| `shuge-apple-design` + quality/reference | 是 | 是 | 设计方向、两端/材料层与验收门槛 | 部分已验证，真机未验 |
| `apple-web-design` | 是 | 是 | 信息层级与跨设备连续性 | 本轮布局对比 |
| `apple-liquid-glass` / `liquid-glass-web` | 是 | 是 | 审核 L0/L1/L2，延用原代码 L1 blur / createGlass | 未验证 L2；**不可声称** L2 已实现 |
| `motion` | 是 | 是 | 利用已有 Motion 不叠新框架；保留可中断导航 | 现有导航操作有回归，博士 WebKit 闪烁未解 |
| `finesse-ui` + `apple-design` | 是 | 是 | app/h5 操作区约束、设置按钮和文本密度 | 320/390/768/1440 |
| `impeccable` + `craft-floor` | 是 | 是 | 读者先行、控制触控、去除冗余 UI | 前后截图 |
| `design-taste-frontend` | 是 | 是 | 非模板设计审计，保留实验科学图形而非虚拟 KPI | 专用本地 draw/inspect **未运行** |
| `frontend-dual-source` | 是 | 是 | 设计基线、前后可观察的对比回路 | 独立 Designeer 页/双来源选样 **未完成** |
| `prism` | 是 | 是 | 评估后拒绝 React+3D 引擎迁移 | 不适用，不将 READ 宣称 APPLIED |

**Skills 在 ChatGPT 插件环境挂载**，不是本机安装。Skill 阅读 != 运行该库；本机 Mice Hole 仅作为授权工程执行桥。

## 5. 后续研究/验收
- 对实际 iOS 26/27 Notes/Books/Settings 录屏采样中途帧，而不是只依赖静态图。
- 使用 Safari 真机实测滚动地址栏、键盘、VoiceOver、动态字体、Reduce Motion/Transparency；Playwright WebKit 不等于真机。
- Liquid Glass L2 在离线实验做真实背景采样和性能基准，只有性能与降级可靠时才考虑上主版本。
- Motion 的中途反向动画单控制器专项仍是 P1 未完成。
