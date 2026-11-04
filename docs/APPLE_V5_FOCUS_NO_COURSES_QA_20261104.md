# 知序 AI 学院 V5｜四栏导航与学习专注模式（2026-11-04）

## 用户输入及设计决策
- 需求一：删除「课程」独立页面，让 Dock 同步调整。
- 需求二：用户上传真实 iPhone Safari 录屏 `ScreenRecording_11-04-2026 18-30-34_1.mp4`（7.4 秒、512×1112、30 fps）。图中学习步骤在前测/预测之间推进，但顶部「敏感性 / 非线性 / 生态演化」实验栏与底部五栏 Dock 一直可见，分散作答注意。
- 产品原则：**今天**承担实验选择和继续入口；**学习**是独立、专注的任务态；**资料/进度**保留在主导航。进入学习后暂时隐藏全局导航，但保留显式退出，不删除学习状态或科学证据。
- 参考 Apple HIG（2026-11-04 查阅）：`https://developer.apple.com/design/human-interface-guidelines/design-principles` 主张把重要内容放在近处，次要操作适当退场；`https://developer.apple.com/design/human-interface-guidelines/going-full-screen` 建议主任务需要时收起导航，同时保留核心控制；`https://developer.apple.com/design/human-interface-guidelines/immersive-experiences` 强调明确退出与平稳转场。Web 项目没有声称实现原生 UIKit 或全屏 API。

## 实现范围
- `index.html`：同时移除桌面主导航、手机 Dock、195px「更多」菜单的「课程」入口。四栏为今天、学习、资料、进度；新增 `v5-focus-navigation.css`。更新动态 JS 与窄屏 CSS 的版本号避免 Safari 缓存旧入口。
- `views.js`：删除 `courses` 路由、整页、目录函数及已无引用的书架组件；「今天」保留敏感性/生态演化入口，并将原来只能从学习三段式切换栏访问的 Logistic 非线性实验放到首页，避免消失；学习页移除三段切换栏，仅保留学习步骤进度、题目和清楚的「退出学习」操作。
- `v4.js`：`body.dataset.focus` 跟随 route === 'learn'，Dock 在学习中设置 `inert` + `aria-hidden`；`goto('courses')` 与旧 `#courses` 链接统一回退 `#today`。保留 `exit-focus` 和 `enter-logistic` 操作，退出后学习记录继续留在 sessionStorage 及科学引擎的 V2 事件里。移除三段式旧 DOM 保留逻辑，防止无意义的重建与计算。
- `v5-focus-navigation.css`：手机端四栏 Dock 以 compositor transform 向屏幕下方滑出、淡出，并禁用触摸；Dock 的复杂四层背景模糊在专注态 `display:none` 以减少 Safari GPU 负担。退出时导航恢复；195px 退化布局为今天/学习/更多。桌面学习态收起两列导航侧栏，让学习内容居中。Reduced Motion 立即切换，保留 44px 可访问退出按钮、焦点描边。学习中顶部博士与设置保持可用。
- 保留所有 Original/R3/V4、科学计算接口与实验数据、真实教学证据、V5 原生 DeepSeek 配置与知序博士。未改 API 鉴权、不使用任何密钥。

## 已完成的验证及局限
- 新单测 `tests/v5-focus-no-courses.test.mjs` 在修改前失败，修改后 3/3 PASS；全量 `npm test` 175/175 PASS，`npm run verify` 原始 PFL/Evo SHA 完全一致。
- `tests/browser-v5-focus-navigation.cjs` Edge/WebKit × 195/390/1440 六场景：旧 `#courses` 恢复首页并修正 hash，四栏 Dock、学习专注态、隐藏且 inert 的导航、退出恢复、Logistic 和生态选择、设置往返、桌面导航隐藏以及无脚本报错，6/6 PASS。
- 现有 `browser-v5-compact-navigation.cjs` Edge/WebKit 6/6 PASS，测试 195px 可访问更多菜单和 320/390px 四栏布局；`browser-v5-native-segment.cjs` Edge/WebKit 手机桌面保留原生 DeepSeek 200/401/402/429/断网诊断和博士共享连接状态；`browser-v5-press-feedback.cjs` 双端按压及快速切换；`browser-v5-ios-motion-dock.cjs` WebKit 2/2，`browser-v5-system-appearance.cjs` Edge/WebKit light/dark，`browser-v5-type-motion-api.cjs` WebKit 2/2。
- `browser-v5-full-journey.cjs` Edge/WebKit 完成真实科学实验、作答、预测、导出和持久化，无 404 和脚本错误，保留原来的 V2 数据。
- 实际打开 Windows Local Preview 390×844 的「今天」和「学习」页面，确认普通状态四栏 Dock 可见；学习页面没有实验切换栏和 Dock，退出学习按钮、进度条、开始前测卡片可见。真实 iPhone Safari 的触摸动画帧时间仍需要新版本真机复查；桌面 WebKit 截图不能作为真机帧率证据。
