# 知序 V6.6｜移动端缩放锁定与触控回归（2026-11-05）

## 需求
用户要求知序的 Web 应用避免双指捏合引起整个浏览器页面缩放；同时保留单指滚动、跟手左右切页、实验轨迹滑块、按钮反馈、Dock、顶部博士 Sheet、DeepSeek 弹窗和两套科学引擎。审计其他触控与焦点问题。

## 定位的根因
- `apple-editions/ai-academy-v5/index.html` 中只声明 `width=device-width,initial-scale=1,viewport-fit=cover`，允许浏览器缩放；无专门处理 Safari `gesturestart/gesturechange` 与 Android 双指 `touchmove`。
- `v6-paired-pages.js` 的边缘滑动仅依赖一个 pointer ID。用户第一根手指按下后第二根手指加入，若第一根继续移动，可能触发切页。
- Safari 对小于 16px 的输入控件可能在聚焦时自动放大。DeepSeek 设置输入框/课程表单应确保手机端字号不低于此值。
- 本项目已有应用内文字尺寸选择（100/115/130/150%），因此锁定交互缩放仍保留部分阅读辅助；**但阻止双指放大可能降低需要系统缩放的用户的可访问性**。没有用 `user-scalable=no` 和 `maximum-scale=1` 禁止标准浏览器可访问性放大，因为现代 iOS Safari 也可能忽略这些值。

## 修复
- `v6-gesture-guard.css`：只在粗指针触屏设备把根交互设为 `touch-action:pan-x pan-y`，允许平滑滚动、避免原生捏合和双击放大。手机端输入框、textarea 和 select 最低 16px，避免焦点触发缩放。
- `v6-gesture-guard.js`：Safari `gesturestart/gesturechange` 时 preventDefault；双指 touchmove 时拦截，单指 touchmove 放行；触控板的 ctrl-wheel 捏合拦截，常规 wheel 放行。只阻止可以取消的浏览器事件，保留键盘和系统级辅助放大入口。
- `v6-paired-pages.js`：第二根手指进入时取消尚未完成的边缘切页，立即恢复元素的 transform，不进入新路由。
- `index.html` / `v4.js`：给新资源与变动的路由控制器分配 `20261105-zoomlock-a` 缓存标签，确保 Pages 不继续加载旧控制器。保留既有 Dock 和导航。
- `tests/v66-gesture-guard.test.mjs` / `tests/browser-v66-gesture-guard.cjs`：实际测试事件是否默认取消、滚动正常、DeepSeek 真输入字号、边缘双指不误切页、横向页面溢出、资源加载与 JS 错误。

## 验证
- `npm test`：279/279 pass（本地）。
- `npm run verify`：`AI_ACADEMY_VERIFY_OK`，PFL 与 Evo 原版 SHA256 未变。
- 本地浏览器 Edge/WebKit × 390/1440：双指触控事件、Safari gesture 事件与 ctrl-wheel 取消，单指与常规滚轮放行，输入焦点字号、横向溢出、Script/404 均通过。
- 路由矩阵 Edge/WebKit × 320/390/768/1440：8/8 通过；Dock 仍可见且镜片正常，双页平移动画 4/4 通过。
- PFL/Evo 两项完整学习流程 Edge/WebKit 4/4 通过。
- **限制**：浏览器自动化的合成触摸事件不能替代 iPhone Safari 真正的双指手势物理验收；正式 Pages 部署后可以做代码与 WebKit 测试，但不能据此声称已真机验证。

## 安全发布
在隔离工作树 `E:/CHATGPT/work/zhixu-v66-gesture-guard-20261105` 开发，非强制推送正式 `main`，等待既有 Pages GitHub Actions 成功，核验原链接 `https://ndshuge.github.io/zhixu-ai-academy/`。
