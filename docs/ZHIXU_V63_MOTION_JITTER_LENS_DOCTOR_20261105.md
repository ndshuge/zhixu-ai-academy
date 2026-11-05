# 知序 V6.3｜切页收尾稳定、设置 Dock 镜片、博士顶部 Sheet（2026-11-05）

## 用户发现的问题
1. 已实现双页左右平移，但**过渡完成瞬间仍会抖动**。
2. Dock 进入「设置」时，**玻璃选中镜片消失**。
3. 知序博士缺少鼠哥学院式的连贯弹层：从上面滑入，关闭时原路收回，带轻弹性，重复点击可中断。

## 调查与根因证据
通过浏览器 Edge 390px 逐帧采样：
- V6.2 采用绝对定位的两页层：`#screen` 容器高度按 `incoming.scrollHeight` 或 `outgoing.scrollHeight` 设置；这**没包含原始页面全部内外间距**。解除层结构时，`#screen` 恢复自然高度，浏览器产生巨大重排。
- 首页实测旧动画尾帧从约 `1853px` 突然变为 `2008px`（**155px** 差）；设置页从 `1566px` 切到 `1710px`。
- 设置标题的隐藏 CSS 只匹配 `#screen > .page-intro`，动画时移动到了 `.zx-route-incoming > .page-intro` 中，因此中途重新显示、结束又突然隐藏。
- `v5-product-design.css` 遗留有 `body:has(#screen[data-page="settings"]) #mobile-tabs .tab-lens{opacity:0!important}`，这是旧版“设置入口在右上角”时期逻辑，和新 Dock 第五项冲突。
- 博士原版 `#doctor-panel` 从下方 12–26px 短距离缩放弹出，与鼠哥学院 `python.html` 的弹层上下方向不一致。

## 修改
- `v6-paired-pages.js`：把 **新页面在真实、未包装布局中的精确高度**预先测量为 `finalHeight`，过渡期间用同一高度约束 `#screen`，完成后移除约束保持自然高度完全一致。
- `v6-paired-pages.css`：`height:var(--zx-paired-height,auto)`；保持设置页标题在新旧两层里的 display 规则一致，不在清理动画容器时切换可见性。
- `v6-route-motion-fixes.css`：只覆盖设置页 Dock 的**选中镜片透明度与选中项色彩**，保留已验证的玻璃层、镜片宽度与 Motion 弹簧参数；给博士面板设置 `translateY(calc(-100% - 160px))` 的顶部出入轨迹。进入 560ms 轻弹簧曲线，关闭 420ms 快速缓出；背景只柔和调色、不整体缩放；禁用 chat log 的独立入场动画，支持中断、反向、键盘及减少动态效果。
- `index.html`：为最新覆盖 CSS 加入新版本标签，避免 Pages 缓存把旧逻辑留在正式站点。
- 未修改 `v5-xiaoya-dock.css` 和 `v5-dock-near-clear.css` 的玻璃渲染实现，也不修改 PFL/EvoWorld 原始算法、BYOK 模型授权边界和学习事件数据。

## 质量门禁
- `npm test`：266/266 PASS。
- `npm run verify`：`AI_ACADEMY_VERIFY_OK`，PFL SHA256 `88f7c1a189aeb1870ae522a6e90d0de0eb00e893ad467dae9c6743e40a6c4a92`，Evo SHA256 `45466224cc6ce12510cb301ccfffbef653a9704bb6e18cf4e2937521162e1263`。
- `tests/browser-v63-motion-regression.cjs`：Edge/WebKit，5 次切页结束前后高度差 ≤2px、设置 Dock 镜片 opacity=1、设置标题过渡一致、博士从屏幕顶部进入和退出、关闭未完重开 1 个实体、0 JS 错误。
- `tests/browser-v6-paired-pages.cjs`：Edge/WebKit × 390/1440px，真实双页等速、无缝及快速切换，Dock、减少动效、手势均通过。
- `tests/browser-v5-route-matrix.cjs`：Edge/WebKit × 320/390/768/1440px，五页无横向溢出与操作失败。
- `tests/browser-v6-integrated-learning.cjs`：Edge/WebKit 的 PFL/EvoWorld 完整旅程，应在发布前再次完成，避免页面优化破坏真实学习流程。
- 仍需要**真机 iPhone Safari**进行主观顺滑度与帧率验收；WebKit 仿真不等于真机。

## 发布策略
保留原工作树和历史版本，在隔离工作树 `E:/CHATGPT/work/zhixu-v63-jitter-lens-doctor-20261105` 整理，`git diff --check`、测试、版本完整性后非强制快进推送至 `main`，等待 GitHub Pages Actions 成功；对原评委网址进行正式站点实际浏览器验证。不要把本地测试结果冒充正式上线证据。
