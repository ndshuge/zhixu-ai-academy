# 知序 AI 学院 · Design VNext 工程交接（2026-11-04）

## 权威状态
- 正式 GitHub `ndshuge/zhixu-ai-academy`，Pages `https://ndshuge.github.io/zhixu-ai-academy/`。
- 最新远程 main 在开工时为 `9c8071319ef23d0b75064b9ced6facd59140fd47`，与 `git ls-remote origin refs/heads/main` 一致；较 2026-11-04 上午 `a2ebeea` 更新。
- 唯一当前施工分支 `feature/zhixu-design-vnext-20261104`，独立目录 `E:/CHATGPT/work/zhixu-design-vnext-20261104`，基线 `9c80713`。**此分支禁止自动发布、不得修改 main 或 Pages。**
- 原 canonical worktree `E:/CHATGPT/projects/zhixu-academy-pages` 旧 local main 及 57 条未提交/未跟踪文件保持原状；其它 worktree 中仍有 WIP，全部不触碰。
- 当前真产品 V5 `apple-editions/ai-academy-v5/`。Original/R3/V4 和 PFL/Evo 原始字节不可改；已删除的 Courses 路由绝不恢复。

## 本轮不可修改内容
1. 冻结 Dock 的结构、位置、图标、玻璃、渐变、动效、选中状态及既有显示隐藏逻辑。禁止更改任何 Dock CSS/JS 行为、Dock 元素及随 Dock 的导航控制。
2. 保留科学引擎、真实实验、V2 学习证据、BYOK 配置、DeepSeek 自主连接、安全授权；禁止接入真实密钥和任何付费请求。
3. 不得对历史版本、正式 GitHub main、Pages 入口做任何变更。
4. 不冒称 Playwright WebKit 为 iPhone Safari，也不冒称规则导师为真实模型。

## G0 发现
- Root `AGENTS.md` 与 V5 `AGENTS.md`、真实分支和 26+ worktrees 检查；最新版 `9c80713` 含专注学习，`#courses` 降级为今天。
- 新 branch/worktree 从远程 main 建立，起始 clean。
- 基线 `npm run verify`：PFL/Evo 哈希 PASS。
- 首次 `npm test`：174/175（`tests/agent.test.mjs` 的跨实例隔离测试在并行全量中失败）。独立 `node --test tests/agent.test.mjs`：13/13 PASS；需复测全量和并发原因。
- 基线 `docs/APPLE_V5_FOCUS_NO_COURSES_QA_20261104.md` 描述先前 6/6 浏览器，但属于历史记录，不能代替本轮重跑。

## 阶段状态
- G0：已建立隔离版本，发现 WIP 且安全保留。
- G1：旧鼠哥学院 `ndshuge/ndshuge-academy` 已只读克隆至 `E:/CHATGPT/work/zhixu-design-reference-academy-20261104`，HEAD `3adf3a8`；五学院与两个实验页存在。研究细节见 `docs/zhixu-vnext-research-20261104.md`。
- G2：已检查 V5 首页/学习/练习/导航、历史 QA、原版桥；改造以学习状态连续性与题目反馈为最高优先。
- G3–G6：以本文件后续更新的真实提交、命令及浏览器证据为准，不以方案文字标记通过。

## 2026-11-04 本轮 G3 最新核验（本地独立版本）
- 已实施真实学习连续性：同实验从已保存 lesson 继续、首页下一站学习入口、前测/迁移作答的未选/已选/提交/对错/解析状态。前测不提前泄露答案，选项默认始终为空；新题清空草稿，已选草稿暂存于会话。参考 `tests/v5-learning-continuity.test.mjs`。
- 变动仅 `apple-editions/ai-academy-v5/index.html`、`v4.js`、`views.js` 与新增内容专用 `v5-learning-continuity.css`、测试及研究/交接文档。**Dock 结构/样式/动效/显示隐藏逻辑没有变动。**
- `npm test` 181/181 PASS；`npm run verify` PASS，PFL/Evo 哈希保持。初始 174/175 一次的并发隔离失败后，单项 13/13 PASS，最终全量 181/181 PASS。不能抹去初次失败记录。
- 新专项真实 Edge：390/1440 两场景 PASS，覆盖未选择→已选择→返回/恢复→提交→下一题清空。已有专注导航 195/390/1440 三场景 PASS；BYOK 失败保护 390/1440 两场景 PASS；完整真实科学路线 `QA_ENGINE=edge` 敏感性实验 PASS，9 条事件、4 次独立作答、1 次真实科学执行、导出及持久化且 404=0。
- 浏览器最初完整科学测试 404 是本地预览目录未按正式 Pages 根目录平铺导致，诊断时 `learning.html`、`learning-store.js` 缺失，改由独立只读源链接与扁平复制的预览目录重跑成功。此处**仅修正测试预览结构，未更改应用科学逻辑**。
- 预览测试根：`E:/CHATGPT/work/zhixu-design-vnext-pages-preview-20261104`。Playwright-core 缺失时仅在本工作树使用 `npm install --no-save --no-package-lock --ignore-scripts playwright-core`，无 package.json / lock 改动。
- **未验收**：Playwright WebKit（当前本机浏览器组件未证实可用）、iPhone Safari 真机/VoiceOver/真实帧率；Magic Move 及产品级弹簧、全面视觉 QA、完整深色/Reduced Motion 回归仍待实测。不可宣称 G4/G5/G6 完成，更不能称用户艺术签收。
- 当前施工版不发布、不改 main/正式评委 Pages。下一步：完成 Edge/WebKit 对照、返回/长文本/Reduced Motion、非 Dock 页面过渡和全部按钮审计；按 G4→G6 单项有据施工。

## 继续时的首要命令
```powershell
git -C E:/CHATGPT/work/zhixu-design-vnext-20261104 status -sb
git -C E:/CHATGPT/work/zhixu-design-vnext-20261104 log -4 --oneline
npm test
npm run verify
```
之后执行 `tests/browser-v5-learning-continuity.cjs` 与原有 V5 Focus / BYOK / Full Journey 专项脚本。使用 `ZHIXU_PREVIEW_ROOT=E:/CHATGPT/work/zhixu-design-vnext-20261104`。任何未完成测试标记 NOT_RUN；真机 Safari 需设备验证。