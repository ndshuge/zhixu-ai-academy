# 知序 AI 学院 Apple V5｜阅读字号、动效交互与 BYOK 会话模式

日期：2026-11-04。基线 `b92a0c7`，隔离工作树 `feature/zhixu-v5-type-motion-api-20261104`。

## 施工范围与设计理由
- **阅读字号**：在设置中提供 100% / 115% / 130% / 150% 四档；使用 V5 私有偏好、CSS rem 相对尺寸与浏览器 `text-size-adjust`；不改变成绩、学习事件或原科学引擎。用户切换后按钮保持焦点。调整仅针对 V5 主阅读内容，不宣称所有 iOS 系统 Dynamic Type 级别均已真机验证。
- **动效**：遵守 `prefers-reduced-motion` 与 V5 内部减少动态偏好；关闭/减少主要卡片进入动画、Dock/弹层过渡；Dock 拖动取消或收尾时若已开启减少动态直接复位缩放。设置开关在重新渲染后将键盘焦点恢复到当前控件。保留非减少动态模式既有 Motion/弹簧系统，不重新引入竞争的 WAAPI 状态。
- **DeepSeek API**：V5 的后台科学 iframe 增加 `?zhixu-v5-session=1` 参数；共享原版 BYOK 适配器仅对此参数应用「会话密钥」策略：不自动读取之前保存的 Key、禁用/隐藏长期保存选项、连接成功也不写入新 Key。原版不带此参数，仍保留用户主动勾选的旧保存行为；原来已存在的 Key 不会被 V5 自动删除，用户可在配置面板明确选择清除。浏览器仍直接向 DeepSeek 请求，无服务端 Key 代理；不能抵御受损浏览器扩展/恶意同源脚本的运行时读取。
- 模型列表对照官方 2026-11 接口说明，仍使用 `deepseek-flash` / `deepseek-v4-pro`；本次不使用任何真实私人密钥，不发起任何付费外网调用。
- V4、R3、Original 的 UI/科学引擎未修改；唯一跨出 V5 目录的修改是共享 BYOK 适配器中的查询参数条件分支，Original 不带参数保持原逻辑。

## 验收依据
- 新增 `tests/v5-type-motion-api.test.mjs`：先 RED 后 GREEN，三项结构/边界契约测试。
- 新增 `tests/browser-v5-type-motion-api.cjs`：Edge/WebKit × 195/320/390/768/1440 CSS px，字号从 15.2px 实际升至约 22.8px，设置重载后保持、没有根文档横向溢出；动态效果偏好关停 Dock 过渡；设置 toggle 重新渲染后保留焦点；后台 iframe 不读取在进入页面前预置的**合成**旧 Key。测试按浏览器/视口分批运行，不能将超时的首次合并执行记录为 PASS。
- 已有 `tests/browser-v5-byok-failures.cjs` Edge/WebKit 2/2 PASS，合成 HTTP 200/401/429/断网/未授权和非明文保存测试；没有真实外网调用。
- 全仓 `npm test`：实施后 150/150 PASS（发布前需重新检验）；`npm run verify`：PFL / Evo 固定 SHA 一致，上游漂移 0；`npm run audit:filenames` PASS，为文件名检查，不代表完整内容秘密扫描。
- 需重新确认 GitHub Pages Actions、正式评委 URL 和发布资产后，才能认定上线。

## 未验证
- iPhone Safari 真实系统 Dynamic Type 与 VoiceOver 朗读、Dynamic Island/键盘和动态地址栏、真实 60/120Hz 实机逐帧性能；
- 不提供真实 DeepSeek 联网可用性、实际计费和运营商 CORS 的通过证据；
- 旧版用户已主动保存在 localStorage 的密钥不会被自动清空，切换到 V5 后仍可由其它有权限同源代码访问；用户可主动清除。
