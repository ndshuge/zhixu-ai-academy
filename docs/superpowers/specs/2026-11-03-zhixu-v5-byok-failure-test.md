# 知序 Apple V5｜BYOK 错误与隐私路径验证设计（2026-11-03）

目标：验证评委固定 URL 的 V5 → 原教学 iframe → 本页直连 DeepSeek 的授权/失败链路，不连接真实模型、不使用用户 API Key；任何“AI已连通”状态必须由本次成功的模型响应产生，失败应清晰回退为本地规则模式。

用户已允许继续施工。已有源码使用 `pages-overlay/original-pages-byok.js` 在 iframe 中进行浏览器直连；`apple-editions/ai-academy-v5/v4.js` 的 `open-ai-config` 打开配置，`ScienceBridge.modelAsk` 调用虚拟模型。按 AGENTS.md，不修改共享 Original/V4/R3 实现；优先增加可重用 E2E 审计与明确失败记录，若发现 V5 独有缺陷，才在 V5 修复。

场景：无凭证时不能发网络请求；虚拟连接成功后面板可用、密钥默认不存储；模型 429 /401/断网时“已连接”状态解除、导师不可继续误报；请求不得将密钥写入 DOM、URL、公开日志或 JSON 导出。虚拟请求严格拦截 `https://api.deepseek.com/chat/completions`，绝不向真实网络发送。
验收：Edge/WebKit 可复现；`npm test`、`npm run verify` 不退化；真机 Safari、VoiceOver、真实密钥/计费响应仍未验收。
