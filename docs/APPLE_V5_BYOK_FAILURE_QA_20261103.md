# 知序 Apple V5｜BYOK 模型失败与隐私路径（2026-11-03）

## 当前产品及适用范围
- 唯一项目：知序 AI 学院，正式仓库 `ndshuge/zhixu-ai-academy`，原评委 URL `https://ndshuge.github.io/zhixu-ai-academy/`。
- 评委页面为 `apple-editions/ai-academy-v5/`；DeepSeek BYOK 配置实际通过同源 `learning.html` iframe 加载 `pages-overlay/original-pages-byok.js`；GitHub Pages 上没有 Node 后端模型代理。规则导师和真实 LLM 状态必须区分。
- 不修改 Original/R3/V4、原版 BYOK 适配器、科学引擎、原证据 hash；本轮仅追加自动化验收和文档，确认已有失败处理机制可用。

## 实测流程（真实浏览器，全部使用合成密钥）
`tests/browser-v5-byok-failures.cjs` 加载本机真实 Pages 静态构建，使用 Playwright route 拦截 `https://api.deepseek.com/**`，并全局阻断其他外部网络出口。使用的是运行时拼接的 `sk-` 开头合成占位符，**不是实际 API Key**。不连接真实 DeepSeek，不产生计费。

实际点击顺序：
1. 未配置时检查 `ZHIXU_PAGES_AI.status()===false`，没有提前发出模型请求。
2. 设置→配置原版模型→输入虚拟 Key（记住密钥默认不勾选）→测试连接。接收合成 200，只有此时才允许 V5 博士发消息；密码输入框清空，本地存储无 Key。
3. 关闭配置→点击博士头像→发送提问；合成 429 速率限制后，已连接状态撤销，发送按钮禁用，聊天记录给出可辨认的失败反馈，用户不被误导为在线模型仍可用。
4. 再次打开配置，合成 HTTP 401：状态保持未验证；不输出、不存储 Key。
5. 再次点击测试并模拟网络中断：状态仍未验证；不自动重试或调用真实外网。
6. 无浏览器 JavaScript `pageerror` 或本地资源 404；合成模型请求均明确由用户交互触发，单浏览器共四次。

## 验收结果
| 项目 | Edge 390×844 | Playwright WebKit 390×844 |
|---|---|---|
| 未授权不请求模型 | PASS | PASS |
| 虚拟 HTTP 200 成功连接 | PASS | PASS |
| 429 后自动解除“已连接”状态 | PASS | PASS |
| 401 不错误宣称连接成功 | PASS | PASS |
| 网络中断后状态保持未验证 | PASS | PASS |
| 默认未勾选保存、输入框清空、无 localStorage Key | PASS | PASS |
| 全局阻断非本地非模拟外网请求 | PASS | PASS |
| JS 异常、缺失的本地资源 | 0 | 0 |

**运行命令（Windows PowerShell，本机需存在 Playwright/Edge/WebKit 浏览器）**：

```powershell
$env:PLAYWRIGHT_CORE_PATH='E:\CHATGPT\projects\ai-academy\video-studio\node_modules\playwright-core'
$env:ZHIXU_PREVIEW_ROOT='E:\CHATGPT\_tmp\zhixu-v5-byok-qa-20261103'
node tests/browser-v5-byok-failures.cjs
```

参数 `QA_ENGINE=edge` / `webkit` 可分别运行。测试入口也可不指定 `ZHIXU_PREVIEW_ROOT`，但那样会访问正式线上静态资源（模型请求仍被拦截；测试可能受公网速度影响）。

## 尚未完成（不得替代真机／真实计费验收）
- 真正 DeepSeek API Key 的首次连接、模型权限、实际 CORS、费用和真实 429/超时。
- 用户主动勾选“记住 Key”后，原版适配器会以**明文形式**存入同源 localStorage；现有 UI 已明确警告。未经过用户同意不得改变该存储机制或假称密钥被加密；建议后续评估禁用网页长期明文保存并提供服务器安全代理（需要后端运维）。
- 真机 iPhone Safari、VoiceOver、软键盘与真机网络切换。
- 真实学生学习效果与对照研究，仍无合格真人样本。
- 本次测试无法证明 Apple 原生 L2 材质或第一方设计一致性。

## ChatGPT Plugin Skill
已按当前对话读取 `shuge-engineering-studio` 的规划、TDD、worktree、验证技能和 Apple 产品审计相关 Skill。它们挂载在 ChatGPT 的插件环境，而不是 Windows 本机。

## 2026-11-03 正式发布与线上补充验收
- 提交 `d297caec8e71cd9255b525ea939ccf99b5fc1018` 已经通过安全无强推脚本进入 `ndshuge/zhixu-ai-academy/main`。
- 对应 GitHub Pages 工作流 `41642624946`：`completed / success`；正式评委根入口仍 HTTP 200 并跳转 V5。
- 使用**正式线上** `https://ndshuge.github.io/zhixu-ai-academy/apple-editions/ai-academy-v5/` 运行 `tests/browser-v5-system-appearance.cjs`：
  - Edge 6 路由 × 390/1440px × light/dark：24/24 通过；
  - Playwright WebKit 同样矩阵：24/24 通过；
  - 两浏览器合计 48/48，无水平溢出、脚本错误或静态资源 404；代表性卡片文字／背景对比度通过 >=4.5 的测试断言。
- 正式线上运行 `tests/browser-v5-modal-a11y.cjs`：Edge/WebKit × 390/1440px，4/4 通过；包括 Tab／Shift+Tab 焦点约束、Esc 取消、取消操作焦点恢复、确认后的焦点归属。
- BYOK 401/429/断网测试仍使用**本机同源静态构建及模拟模型路由**，不能等同真实 DeepSeek 公网请求，也不能称为 iPhone Safari 真机验收。
