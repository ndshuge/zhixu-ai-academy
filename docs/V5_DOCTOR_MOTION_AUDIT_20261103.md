# 知序 Apple V5｜知序博士面板动效审查（2026-11-03）

## 范围
只修改正式独立仓库 `ndshuge/zhixu-ai-academy` 的 `apple-editions/ai-academy-v5/v4.js` 中博士对话弹层；Original、R3、V4 和科学引擎不改。依照 ChatGPT 挂载的 Motion、Apple Web Design、SHUGE Apple Design Skills 的中断/反向生命周期要求。

## 真实浏览器基线
Edge / Playwright WebKit @320、390：点击头像 → 点击关闭 → 退出动画尚未结束时再次点击头像，旧实现会将其当作“已打开”而再执行关闭。最终 aria-expanded=false，panel.hidden=true。

## 已修复（测试通过）
- 使用 `aria-expanded` 作为用户期望的开关状态，而不是使用动画结束前的 `panel.hidden`。
- 被取消的退出动画只在预期状态仍为关闭时才允许设置 `panel.hidden=true`。
- 本机 320/390 Edge/WebKit 连续操作 4/4：快速关闭→重开、Escape 收起且返回焦点、连续三次快速切换后正确打开；无 JS page errors。
- 新增 `tests/v5-doctor-motion.test.mjs`，2 个静态防回归断言。

## 尚未修好的动画视觉问题（明确保留）
- 进一步的中间帧测试发现，在关→开快速反向时，WebKit 的 WAAPI/Motion 动画可能把可见透明度从 0.65–0.8 瞬间重置到 0；即使最终 panel 状态正确，仍可能肉眼看到短暂闪烁。
- 单纯从当前计算透明度接续关键帧、手动取消旧 WAAPI 效果都未稳定解决；这些未验证方案已经**撤回，未随本轮提交**。不是原生 Liquid Glass 的修复。
- 后续应在独立任务中将博士弹层改为单一动画控制器（单一 motionValue 或单一 CSS transition 状态机，不能让 WAAPI 和内联样式同时管理 opacity），测试 0/25/50/75/100% 及中途取消/反向，特别是 WebKit 与真实 iPhone Safari。避免继续盲目补丁。

## 仍需独立核验
- iPhone Safari 真机、中间帧可感知的动画流畅度、VoiceOver/200% 缩放。
- 之前项目 `npm run verify` 存在与本轮无关的 PFL 适配器 SHA256 mismatch；不得伪称完整验收通过。
