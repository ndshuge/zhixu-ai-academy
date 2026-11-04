# 知序 V5｜Dock 下沿深遮罩与 DeepSeek API 接入诊断（2026-11-04）

基线：`db565f6`，隔离分支 `feature/zhixu-v5-dock-api-diagnostic-20261104`。根据用户 `ScreenRecording_11-04-2026 15-49-31_1.mp4`（18.07 秒，512×1112，30fps）提出的问题处理。录屏显示 Dock 下缘到 Safari 底部地址栏之间仍有未被足够遮蔽的网页内容；本录屏未包含 DeepSeek 真实 API 错误状态或凭据。

## Dock
用户本轮明确要求简化为「把现有深遮罩向下面延伸」。新增 V5 独立 `v5-bottom-shade.css`，仍使用 **同一个** `body::after` 背景采样（24px blur），不另加 :before/第二层 backdrop。top 起始位置与旧版一致；底边从 -1px 延伸到 `-100px - safe-area`，高度由 250px 扩到 350px，70% 处底色遮盖已达约 98%，网页可见底边接近实心遮蔽。减少透明度 / 高对比 / 键盘 / 博士面板的兜底保留。

已对本地 390×844 预览和旧高对比密集文字诊断 fixture 进行新旧截图观察：新方案在 Dock 下方网页视口的最后一段文字和横线接近不可见。Safari 原生地址栏不受网页 CSS 控制；不能保证系统工具栏与网页背景具有同一材质。

## API 故障排查：证据及修复范围
1. 核查官方 API 文档 `https://api-docs.deepseek.com/api/create-chat-completion/`：当前聊天模型 ID `deepseek-flash`、`deepseek-v4-pro` 受支持，地址 `https://api.deepseek.com/chat/completions` 正确。
2. 从 Windows 以 `Origin: https://ndshuge.github.io` 发送 **不含密钥、不产生账单** 的 OPTIONS 跨域预检，2026-11-04 返回 HTTP 200，包含 `Access-Control-Allow-Origin` 原来源、`Access-Control-Allow-Methods: POST`、`Access-Control-Allow-Headers: authorization,content-type`。所以不能把故障统一归结于「DeepSeek 必定拒绝跨域」。
3. 发现一处明确的 V5 脚本配置错误：`bridge.js` 原指向 `/zhixu-ai-academy/original-pages-byok.js`（**Original 发布版**），其代码没有 V5 会话专用守卫，可能继续允许用户选择长期明文保存 Key。这也造成 V5 关于会话密钥的说明与实际逻辑不一致。修复仅在 V5 新增 `v5-deepseek.js`（以已有的 `pages-overlay/original-pages-byok.js` 安全分支为基础），`bridge.js` 改为加载 V5 独立脚本，禁用自动读取或保存长期明文 Key；输入、验证、请求仍保持在相同源的受信任科学 iframe 中，V5 外层不读取 Key。Original / R3 / V4、科学引擎未更改。
4. 在 V5 模型输入面板加入状态说明和逐项可操作诊断：401 Key 不合法；402 余额不足；429 限速；400/422 参数；500/503 服务端；25 秒超时；`Failed to fetch` / NetworkError 设备网络、代理或浏览器跨域限制。不会把网络错误误报为密钥错误。增加 DeepSeek 开放平台入口。未使用用户真实密钥，也没有查询任何账户余额。
5. 确认网页深度集成仍属于浏览器端 **BYOK**（用户自行提供自己的 API Key），其安全性不能等同服务端代管；不能保证真实 DeepSeek 通信在所有 iOS 网络或节点都可达。若用户提供了 401/402/429/失败页面截图，可据此进一步准确定位。

## QA
- 新 `tests/v5-api-dock-remedy.test.mjs` 红→绿，确认 V5 专属脚本、错误提示和遮罩结构。
- 现有 `tests/browser-v5-byok-failures.cjs` 扩充模拟 **200/401/402/429/断网**，仅使用无法计费的合成 Key，且拦截所有发往 DeepSeek 的网络请求；断言状态提示正确、外层 DOM 不含密钥、默认 V5 记住密钥选项禁用、localStorage 没有凭据。Edge / WebKit 均通过。
- `tests/browser-v5-duo-perf.cjs` 直接断言计算后的 bottom ≤ -90px、height ≥ 350px，旧 Dock 及横向实验测试更新为验证浏览器量化后的最终遮罩而非比较原始小数文字。
- 全量单测 `npm test`、科学 SHA `npm run verify`、文件名扫描 `npm run audit:filenames`、Edge/WebKit 现有 QA 均需在最终提交前确认。
- **没有**真实账户 API Key/额度，无法验证用户账户的实际成功收费连接。不能声称「API 已完全接入」；这次完成的是 V5 会话密钥路径和清晰诊断，用户仍需在自己的浏览器使用官方 API Key 实测。
