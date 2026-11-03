# 知序 Apple V5｜全站审计延续：博士弹层中途反向（2026-11-03）

## 产品、工作树、变更边界
- 唯一产品：知序 AI 学院，正式评委入口 `https://ndshuge.github.io/zhixu-ai-academy/`，源代码 `ndshuge/zhixu-ai-academy`，页面 `apple-editions/ai-academy-v5/`。
- 新工作树：`feature/zhixu-v5-apple-audit-p0p1-20261103`，基线 `1a953c6`。未触及 Original、R3、V4、科学引擎、数据模型或用户学习记录。
- 先阅读 AGENTS.md、此前全站审计、24 组路线截图。基线已经解决 ZX-01 重开课程、ZX-02 设置触控、ZX-03 空目录；本轮只完成 ZX-07 博士弹层中断问题的一轮改造。

## 官方与开源参考（实际打开／检查）
- Apple WWDC25「Meet Liquid Glass」：https://developer.apple.com/videos/play/wwdc2025/219/ —— 内容与浮动控件分层、控制反馈连续、玻璃材质克制。落实到博士面板稳定显示，不为效果重复堆叠玻璃。
- Apple HIG 「Buttons」：https://developer.apple.com/design/human-interface-guidelines/buttons —— 控制面积、清晰的标签与反馈。保留 44px 关闭按钮及焦点语义。
- Apple HIG 「Sidebars」：https://developer.apple.com/design/human-interface-guidelines/sidebars —— 仅有价值的分层导航；原版已消除低信息桌面目录，不重复改。
- MDN Animation.updatePlaybackRate：https://developer.mozilla.org/en-US/docs/Web/API/Animation/updatePlaybackRate —— 反转动画有同步时序；WebKit、Blink 的实际复测发现进度归零/停顿风险，未直接采用。
- motiondivision/motion（MIT，活跃）：https://github.com/motiondivision/motion —— 保留当前项目导航和 dock 的 Motion；弹层使用单一 CSS 过渡更符合这次不叠加实例的约束。
- Web Liquid Glass 研究型项目仅做兼容性参考：不额外引入 React/WebGL 或将 L1 blur 冒充 Apple 原生 L2。

## ChatGPT 插件 Skill 的使用证据
- `shuge-apple-product-audit`、`AUDIT_MATRIX.md` —— 已读、按屏幕×状态×问题矩阵继续审计；当前修复 ZX-07。
- `shuge-apple-design`、`apple-web-design`、`finesse-ui` —— 已读，应用“内容先于材质”、“一处控件一个主要反馈”。
- `motion` —— 已读；对照原有 Motion 实例，决定局部退出弹层竞争动画，而导航的 Motion 实现不改。
- `frontend-dual-source`、`design-taste-frontend` —— 已读；本轮为局部交互状态修复，没有伪称已运行视觉方向生成器或 Designeer。
- 所有 Skills 挂载于 ChatGPT 会话，Mice Hole 是执行桥，并非本机 Skill 安装。未调用的 Skill 不记作实际执行。

## 问题、诊断与技术选择
- ZX-07 P1：博士面板快速开→关→再开时，旧实现的 Motion 进入/退出动画共用 opacity/transform，某些帧会变成透明。
- 第一方案：单实例 WAAPI `reverse()`；Playwright Edge 反向接近端点时播放头可能跳回起点 —— **失败并撤回**。
- 第二方案：WAAPI `updatePlaybackRate()` 或 pause/currentTime/playbackRate/restore/play；部分 Edge 帧归零 —— **失败并撤回**。
- 现行方案：保留博士头像/面板外观，`v4.js` 用单一 DOM class `doctor-visible` 管理预期状态；`v5-doctor-motion.css` 让 CSS 从实时计算状态进行 opacity/transform 过渡，只有退出完成且 aria-expanded=false 才真正 hidden。重开清理关闭超时，Esc 和关闭后焦点仍回到头像。减少动态效果立即切换状态。
- 这是针对弹层的局部状态机，不推翻原有导航 Motion 引擎。Dock 的 L1 scroll-edge 保持现状。

## 真实验证（本地 V5 静态 Pages，不是 iPhone 真机）
| 场景 | 测试 | 结果 |
|---|---|---|
| CSS 状态和浏览器脚本回归 | node --test tests/v5-doctor-motion.test.mjs tests/v5-doctor-reversible.test.mjs | 6/6 PASS |
| Edge 中途关闭→重开、连续反向、Esc、焦点、无 404/报错 | 320/390/1440px | 3/3 PASS |
| Playwright WebKit 相同交互＋实际截图驱动的帧检查 | 320/390/1440px | 3/3 PASS |
| 减少动态效果：开关同步完成 | Edge/WebKit × 320/390/1440px | 6/6 PASS |
| 全仓测试 | npm test | 123/123 PASS |
| 公开文件名检查 | npm run audit:filenames | PASS（仅文件名，非秘密全量扫描）|
| 独立工程证据校验 | npm run verify | FAIL：历史 PFL adapter SHA256 mismatch |
| iPhone Safari 真机、VoiceOver、色彩对比/200% 缩放 | 未执行 | UNVERIFIED |
| 博士真实 LLM BYOK | 未执行，不使用私人 API Key | UNVERIFIED |

## 前后行为与截图
- 修复前：某些 WebKit 中途反向帧记录出现约 0.75→0 的透明度骤降。原博士弹层视觉保留。
- 修复后：同一浏览器会话的关闭/重新打开操作沿实际 CSS 计算状态过渡；通过测试，没有出现返回关闭的错误状态。
- 改造后 390×844 实际截图：`docs/evidence/apple-v5-audit-20261103/doctor-open-edge-390.png` 和 `doctor-open-webkit-390.png`。这些是 **Playwright 桌面浏览器截图**，不能冒充 iPhone Safari 真机截图。
- 过渡的首帧在部分无头 WebKit 自动化时可能暂时保持 opacity=0，截图会促成实际绘制；因此没有以固定毫秒值判定真机手感。以上为所测操作场景的通过，非 Apple 原生认证。

## 尚未完成 / 下轮
- P1：更全面的 WebKit 0/25/50/75/100% 真实帧率采集，iPhone Safari Safari UI 地址栏变化，VoiceOver、高对比、200% 缩放、真实长内容键盘。
- P1：PFL 证据哈希不匹配独立调查，不在前端分支改写科研验收。
- P1：科学图表和首页微文案 <12.5px 的页面级对比；课程目录的真实实验任务入口和二级状态。
- P2：深色模式适配、长文案与国际化状态、各页面异常流、阅读布局最后细节。
