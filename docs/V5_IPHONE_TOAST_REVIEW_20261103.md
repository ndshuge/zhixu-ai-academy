# 知序 Apple V5 · iPhone Safari 录屏复盘与修复（2026-11-03）

## 录屏来源与结论
用户提供约 18 秒、512×1112/30fps 的 iPhone Safari 屏幕录制，已在当前对话实看关键帧（资料页、博士面板、设置页、课程页、首页）。
请勿将私人原始录屏提交到公开仓库。以下仅记录可见 UI 问题与非敏感工程现象。

## 发现与原因
1. 「资料与错题」→「待复习」按钮右侧 SVG 没有专用尺寸；其默认宽度挤占 flex 行的文字列，显示为黑色大三角形和逐字竖排。修复：SVG 固定 18px、stroke/fill 控制，复习说明列 flex min-width:0，中文自然折行。
2. 原始 Toast 基于 CSS 固定 bottom，未考虑 Safari 工具栏与悬浮 dock 的动态相对位置。录屏中较长提示贴近 dock/Safari 地址栏。修复：notify 运行时取 dock.top，计算 --zx-toast-bottom；resize、scroll、visualViewport resize/scroll 更新；Toast 保留完整提示，14px 字号，允许多行，减少动态效果与降低透明度回退；起始动画也预留 24px 间隔。
3. 设置页最后内容与 dock 临近。仅 V5 手机布局底部 padding 扩大以允许全部设置滚动到 dock 上方。
4. 博士头像现有外观/交互反馈用户满意，本轮没有重新设计或修改该弹层动画。先前审计记录的 WebKit 动效中途反向闪烁仍未解决。

## Chat 插件依据
- 通过 ChatGPT skills__read 加载 Motion、finesse-ui 的 component-scope / apple-design、impeccable craft-floor、SHUGE Apple Design；不假定插件 Skill 在本机安装。
- 采用 app-mode / h5+product 的约束，Glass 只保留在浮动控件，Toast 属于反馈层不是额外的大面积玻璃卡片。
- Apple HIG 参考：feedback（反馈层级与内容及时性）https://developer.apple.com/design/human-interface-guidelines/feedback；layout / scroll edge（工具栏与滚动内容的分层）https://developer.apple.com/design/human-interface-guidelines/layout

## 测试
- 首先 RED：新增 tests/v5-mobile-feedback.test.mjs（4 条）。
- GREEN：4/4，并验证 app 原有单元 npm test=113/113。
- 真实页面构件 + 合成数据在本机静态服务内渲染；Playwright Edge/WebKit @320/390/1440 共 6/6：
  - SVG 18×18，中文说明列最窄宽度在 320 视口仍有 222px；
  - Toast 启动中和静止后均高于 dock，间距达 23px 左右；
  - 最后设置说明滚动到底后清楚露出，未被 dock 覆盖；
  - 无 JS pageerror、404、水平溢出。
- 测试截图保存在本机隔离 QA 目录，不把录屏或私密任务数据提交到公开仓库。
- 未等同于真实 iPhone Safari 远程验收。真实用户滚动浏览器工具栏、提高文字大小和 VoiceOver 仍需手动验收。
- 旧有 npm run verify 因 PFL adapter SHA256 mismatch 失败，不能将 npm test 绿灯表述为整个科学工程全部验收完成。
