# 知序 V6.2｜Dock 常显与并排切页修复（2026-11-05）

## 用户验收目标

本次以上一版知序 V6（`958d3be7fb411cc288e744d77e64f3c6ee50b1b4`）为代码基线，修复两个体验问题：
1. 学习页面与「今天、资料、进度、设置」保持同一导航布局；不隐藏 Dock，不收起顶部工具栏，不再通过专注模式改动主栏宽度。
2. 页面切换参照鼠哥学院真实代码和演示：**两张完整页面静止地承载各自内容，一张向侧面滑出，一张从另一侧同步滑入**。取消旧版多个内容块独立弹动和旧 DOM 克隆叠影，统一原子路由运动。

## 源文件和行为

- `apple-editions/ai-academy-v5/v6-paired-pages.js`：真实 DOM 的旧页移入独立的 inert、aria-hidden 外层，新页面内容在另一个完整外层。两个外层各以相同宽度、时长、缓动执行水平 `translate3d`，不改透明度和缩放。进出 `420ms`，学习页 `480ms`；动画被打断或 WebKit 的 finished promise 未完成也会在规定时间清理。保留边缘手势、垂直滚动保护、减少动态效果。
- `apple-editions/ai-academy-v5/v6-paired-pages.css`：确保两个舞台层使用相同边框盒宽度、绝对布局和继承的内容边距；Dock 在五个 tab 中包含设置，不再针对学习页隐藏。超窄 260px 视口沿用「今天、学习、更多」可访问回流，不隐藏更多菜单中的设置。
- `apple-editions/ai-academy-v5/v6-press-clock.js`：按钮仅反馈 pointer down / up / cancel，不延迟原生 click，不重复触发，不覆盖 Dock 镜片的独立 Motion 弹簧。
- `apple-editions/ai-academy-v5/v4.js`：路由与导航事件改由单一成对页面过渡器负责；学习页不再触发整站 Focus 样式和工具栏 inert。首页学习入口继续调用原版 `ScienceBridge` 和已验证真实教学核；不改任何科学数据算法。
- `apple-editions/ai-academy-v5/index.html`：右上角重复的设置按钮删除，手机 Dock 新增「设置」；桌面端保留左侧设置菜单；更窄屏的「更多」内仍可进入设置。

## 已知注意事项

- 页面过渡仅用于**顶层路由切换**，博士对话及 BYOK 安全弹层继续使用独立的可逆 Sheet 动画。
- 当路由切换进行中又发生新路由时，旧层及时卸载，重新以当前最新真实页面建立过渡，不使用 cloneNode / 截图副本，也不为重复 CSS/WAAPI 变换增加新层。
- 学习界面始终有 Dock，因此教学页不再获得全屏独占宽度；其他学习图表和表单布局沿用 V6。
- WebKit 仿真不等于实机 iPhone Safari，实机触控和真实帧率仍需单独验收。

## 工程验证

- `npm test`：266/266 PASS。
- `npm run verify`：`AI_ACADEMY_VERIFY_OK`，PFL `88f7c1a189aeb1870ae522a6e90d0de0eb00e893ad467dae9c6743e40a6c4a92`，Evo `45466224cc6ce12510cb301ccfffbef653a9704bb6e18cf4e2937521162e1263`，上游变更数均为 0。
- `tests/browser-v6-paired-pages.cjs`：Edge / WebKit 各 390px 与 1440px 共四组 PASS；包括 Dock 持续可见、两页无缝、回退方向、边缘滑动/垂直滚动互斥、快速切换和 reduced motion、零浏览器错误/404。
- `tests/browser-v5-route-matrix.cjs`：Edge/WebKit 在 320/390/768/1440px 共八组 PASS，五个页面均无死按钮、横向溢出和聚焦错误。
- `tests/browser-v6-integrated-learning.cjs`：Edge/WebKit 的 PFL、EvoWorld 各两组共四组 PASS，均含二次实验审批、原版真实运行、导师、反思、迁移及刷新入口。
- 历史测试中原先硬编码学习模式隐藏导航、工具栏设置入口及按键延迟的断言已换成最新用户行为合同，但仍保留原版科学、安全及可用性断言。

## 发布与保护

只使用隔离工作树 `E:/CHATGPT/work/zhixu-dock-visible-paired-swipe-20261105`，不覆盖其他 worktree、Original/R3/V4、原版 PFL/Evo 引擎或持久学习数据。正常非强制快进推送到正式 `main`，由既有 GitHub Pages Actions 发布，最后实际核验 `https://ndshuge.github.io/zhixu-ai-academy/`。不得将本地 PASS 当作线上已发布。
