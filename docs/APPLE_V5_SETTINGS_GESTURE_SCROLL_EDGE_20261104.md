# 知序 V5：设置返回、长按触感与连续滚动边缘（2026-11-04）

## 用户观察和根因
输入：iPhone Safari 录屏 `ScreenRecording_11-04-2026 10-47-12_1.mp4`，9.13s，录屏每秒 30 帧，包含快速切页、打开设置与在齿轮附近多次操作。录屏不能单独证明实际 GPU 帧耗时或网页抖动与系统录屏的关系。

- **二次点击无响应**：`goto` 对所有相同路由一律忽略，设置是顶栏路由而非第五个 Tab。现在进入设置时保存原路由，再点设置返回原路由；直接使用 `#settings` 首次进入则默认返回今天。无须依赖浏览器回退。
- **按压反馈**：齿轮原本不在全局 Motion 的按压选择器内，只有 `:active` 的短时缩放。如今增加独立 `v5-settings-touch.js` 手势状态处理，触碰缩放 `0.955`、190ms 持续按住变为 `0.9`、松手通过 CSS 合成层 `transform` 回弹；手指大幅移开、cancel、blur 清状态。减少动态效果不进行位移，键盘仍可直接激活按钮。不使用 JavaScript 每帧驱动齿轮缩放，避免与其他 Motion 值争用控制权。
- **模糊卡顿和不连贯**：V5 曾叠加高度 196px、28px 背景模糊及 Dock 的 23px 模糊，并同时装载 `v5-scroll-edge.js`（滚动时读取布局，逐帧写 CSS 变量）；CSS 后来却把遮罩设为 `opacity:1!important`，导致 JS 计算没有视觉收益。现在保留**一个固定、平滑渐变的 scroll edge**，高度 154px、blur 16px、连续 alpha mask 和低混色，Dock 自身降低为 blur 14px；不再加载旧 per-scroll edge 模块。减少透明度、提高对比度、键盘/博士弹层降级保留。旧模块仍在仓库供历史测试和独立工具使用，未改 Original、R3、V4。
- 注意：CSS `backdrop-filter` 是 L1 模糊，不能穿透 Safari 自身的原生地址栏或提供系统 Liquid Glass L2 光学折射。iOS Safari Web 页面无法调用原生 Taptic Engine，所谓长触感是可感知的**视觉按压与持有反馈**，不承诺实际振动。

## 已读取参考与插件
- Apple 官方 WWDC25 `https://developer.apple.com/videos/play/wwdc2025/356/`（scroll edge 不叠加混用，单视图软羽化）。
- `https://developer.apple.com/design/human-interface-guidelines/scroll-views` 和 `https://developer.apple.com/design/human-interface-guidelines/motion`。
- Chat Skill 实际 READ / APPLIED：`shuge-apple-product-audit`、`motion/best-practices/motion.md` 和 `motion/best-practices/index.md`、`liquid-glass-web`、`shuge-apple-design`、`systematic-debugging`、`verification-before-completion`。
- 采用不重复的工具材料层、连续按压状态、compositor-friendly transform、可取消且无真机夸大宣称。

## 技术验收
- `tests/v5-gesture-blur.test.mjs` 初次 RED；修复后全量 `npm test` 156/156 PASS，科学数据 SHA 完全一致。
- `tests/browser-v5-gesture-blur.cjs` 使用 Edge / WebKit × 390px/1440px，本地真实鼠标 pointerdown→190ms 长按→up，检查按下缩放、data-holding、松手复位、设置返回原路由和重复切换、mask/blur 计算样式与页底恒定遮罩。
- 全仓旧 V5 browser 回归及 Pages 发布需要在提交前/后分别核验。用户提供的录屏是修改前证据；iPhone 真机 Safari 的帧率、WebKit 内核原生纹理/触感还需修改后实机录屏验收。
