# V4 Native Rebuild｜QA Evidence（2026-10-29）

## 本机已执行

| 闸门 | 结果 | 执行与佐证 |
| --- | --- | --- |
| Edge + WebKit 路由/响应式/原版学习闭环 | Edge 29/29 + WebKit 4/4 PASS | `qa/v4-e2e.mjs`，本机 `qa/screens/report.json` |
| 第二科学世界 EvoWorld + DeepSeek 原版设置进出 | 11/11 PASS | `qa/v4-evo-e2e.mjs`，本机 `qa/evo-report.json` |
| 原版玻璃滤镜、Motion、长按、移动端点击尺寸与设置持久化 | 12/12 PASS | `qa/v4-interaction.mjs`，本机 `qa/interaction-report.json` |
| 独立 V4 shell + 六页导航 | 1/1 PASS | `qa/v4-shell.test.mjs` |
| 原版 Taste Inspector（本机原脚本） | 0 FAIL，1 WARN（40px 页面标题，设计判断为可接受） | 本机 `qa/taste-r3/report.json` |
| 无 Console JS 错误/HTTP 资源故障 | Edge 0 + WebKit 0 | E2E logs |
| 原版科学证据 | Logistic 真实 metrics 和图表、EvoWorld 独立种子实验、V2 事件  | 真实 same-origin 原版接口、浏览器本地测试存储 |
| 照片/布局比较 | 320/390/768/1024/1440 + WebKit 390 | 本机 `qa/screens/*.png`；人工检查 |

## 修复的问题

1. 初版 iPhone 的博士浮动按钮遮住课程内容 → 工具栏 39px 可触控按钮。
2. 手机课程书架第二张卡片文字被裁剪（Taste FAIL） → 仅封面露出，修正对比度，重新扫描后 0 FAIL。
3. Motion pointercancel 离开原控件时卡在缩放态 → 统一 document/window settle，重新复测通过。
4. Original DeepSeek iframe 阻挡 V4「关闭并返回」控件 → BYOK 退出控件单独提升 stacking context，复测真正可关闭。
5. 真实实验原始浮点数过长，图表太密 → 科学计数法和标明截取区间的 88 步预览，原版数据不修改。

## 保留与限制

- **保留**：业务接口、原版评分题库与权限边界、版本 2 学习证据、AI 逐次授权、Original 入口、R3 比赛入口。
- **未验证**：真机 iPhone Safari 60/120Hz 实际延迟与触控触觉；Apple 官方认证不存在。
- **视觉人工验收**：当前候选可供用户评审；不得仅因自动化绿色就称为 Apple 原生认证或最终用户批准。
- **发布范围**：仅可新增独立 V4 路径，**不切换**公共比赛 URL，遇部署连接故障原线上保持不变。

## Git

唯一范围：`little-works/ai-academy-v4/` 和对应 `docs/superpowers` 设计计划。测试脚本和未公开采集画面位于开发工作区，本 Markdown 记录实际测试结果与保留项。

## V4 tactile revision: direct iPhone screenshot defects

The user supplied three real iPhone screenshots. These revealed defects which the previous green browser checks had missed:

- The inherited `lg-navbar` created a second copied icon/label tree inside its selected lens. V4's vertical mobile layout and the copied tree disagreed, causing double icons and cropped text. Replaced with **one semantic `nav`** and a single shared lens. The **original MIT createGlass()** is actually invoked on the glass backdrop; no copied tab content.
- The former pale bar allowed strongly contrasting text to remain behind controls. The new navigation uses a restrained rim highlight, genuine Blink refraction, and a scroll-edge diffusion gradient for contrast.
- A single fade-in of one heading was inadequate. Motion animates route content and a shared indicator with interruptible retargeting. Press, sustained hold, horizontal scrub, pointer cancel, release and rapid tab switches now have defined behavior. All motion is transform/opacity based; no optical map regeneration during dragging.
- The unconfigured doctor opened a large blank input panel and focused the textarea, immediately summoning the iPhone keyboard. It now opens a compact status/action popover, with no unsolicited keyboard; when a model is verified the conversation form remains available. The panel also follows the visual viewport if a keyboard opens.
- Apple WebKit/Safari **cannot refract arbitrary DOM below a fixed bar** using this backdrop SVG technique. V4 honestly uses the engine's blur fallback on WebKit (L1), rather than claiming native system Liquid Glass (L2).

### Fresh evidence

- `qa/motion-fidelity.test.mjs`: 9/9 Edge tests; each new behavior had an observed failing test first. Tests cover actual optical URL filter, single navigation tree, shared lens alignment, hold/drag/cancel, quick retargeting, doctor keyboard prevention, focus-driven keyboard-safe layout, reduced motion, and 16px iPhone editable controls to prevent focus zoom. Run with Playwright installed, a same-origin Original Pages preview, and `ZX_TEST_BASE` to override the default local URL.
- Full same-origin learning regression rerun: Edge 29/29, WebKit 4/4, EvoWorld/BYOK 11/11.
- Visual/optics sampling: 5/5 local checks with Edge and WebKit. Edge lens SVG filter observed in computed backdrop; WebKit computed `blur(22px) saturate(1.55)`. The 630ms desktop-headless sampling observed no frame gaps above 50ms, **not** proof of iPhone FPS.
- Original Taste-Skill Inspector: 0 FAIL, 1 WARN (40px page H1). Screens at 320, 390, 768, 1024, 1440 and WebKit 390.
- User's real Safari screenshots remain baseline evidence; **fresh physical iPhone Safari validation after this revision is UNVERIFIED**. Browser chrome/status bar belong to the iOS host app, not the webpage.
- The competition landing page, Original Edition, R3 Apple Edition, science API, learning events and user records were not modified.

## V4 route motion quality gate (second real-device feedback iteration)

- User's physical iPhone screenshots reported unconvincing glass and choppy transitions. Functional success alone is insufficient.
- **Rejected experiment:** document-scoped View Transitions passed route checks, but captured intermediate frames showed double text in Chromium and a transient empty surface in WebKit. This was intentionally not shipped.
- **Chosen:** per-block lightweight CSS reveal limited to four content groups (220ms with 12/24/36ms stagger). Heading is opacity-only to prevent fuzzy fractional-pixel text. Content always stays readable, with no copied DOM or frozen page snapshots.
- **Physical tab control:** original MIT Liquid Glass createGlass() on Chromium with honest standard-blur fallback on Safari/WebKit. Motion controls hold, drag, spring release, cancellation, retargeting.
- **Early interaction:** Motion bundle modulepreloaded. A test deliberately delays the download and checks navigation still operates. Deformation tests wait for the Motion engine to be ready before timing it.
- Fresh checks: qa/route-lite.test.mjs Edge and WebKit and reduced motion 3/3, qa/early-motion.test.mjs preload plus slow asset 2/2, qa/motion-fidelity.test.mjs 9/9.
- Science regression: Edge 29/29, WebKit 4/4, EvoWorld and BYOK 11/11, shell 1/1. No changes to science API, scoring algorithms or V2 learning events.
- 390x844 Edge/WebKit intermediate screenshots at 85 to 155 milliseconds and at settled state were inspected. No ghosted whole-page snapshot or transient blank in the accepted approach.
- **UNVERIFIED:** actual physical iPhone Safari frame timing and tactile feel after these changes. Browser chrome belongs to iOS app, not the site. No Apple certification claim.
- **Release:** only isolated V4 candidate; R3, Original and competition judge link stay untouched.


## Doctor toolbar portrait refinement (2026-10-29)

- The original full-body 330x420 illustration was rendered at ~32x35px inside a toolbar button; it visually read as an off-center sticker, not an avatar.
- Cropped a dedicated **320x320 WebP** head-and-shoulders rendition from the existing authorized illustration; no new character identity or generative asset.
- Nested a clipped 50% circular media frame inside a **42px** circular toolbar button with a restrained border, matching the 42px settings control. The detached green engine dot is visually hidden; engine state in the underlying application remains unchanged.
- This change is scoped to `index.html`, `v4-avatar.css`, `assets/doctor-avatar.webp` and `qa/doctor-avatar.test.mjs`. Science APIs, data, glass navigation and R3 competition URL remain unchanged.
- Fresh local tests: Edge + WebKit avatar/functional 2/2, existing navigation/route 17/17, full study Edge 29/29 + WebKit 4/4, EvoWorld 11/11. Visual screenshots inspected at 390x844 and 1440x900. Physical iPhone Safari still needs a device-level review.
