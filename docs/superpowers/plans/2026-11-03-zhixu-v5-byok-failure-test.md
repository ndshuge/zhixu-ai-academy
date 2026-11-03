# Zhixu V5 fake BYOK error and privacy end-to-end plan

> Requires: superpowers:executing-plans

### Task 1: Audit current adapter and public static preview
- [x] Confirm V5 overlay is in `pages-overlay/original-pages-byok.js`, not a live Node provider.
- [ ] Build isolated local Pages preview from latest Git HEAD, including science runtime.

### Task 2: Write and execute actual browser failure-path regression
- [ ] Add `tests/browser-v5-byok-failures.cjs` with intercepted model route, no real key.
- [ ] Edge/WebKit default unconfigured, mock 200 connection, mock 429/401 or offline failure, status and localStorage.
- [ ] Only if broken, create failing regression for V5-only fix; never edit historical BYOK shared adapter.

### Task 3: Verify and ship bounded results
- [ ] `npm test`, `npm run verify`, `git diff --check`.
- [ ] Record what is and is not verified, commit in isolated worktree, safely push only checked files.

## 验收记录 2026-11-03
- [x] 独立 worktree `feature/zhixu-v5-model-failure-hardening-20261103`，基线 Git `628a15e`。
- [x] 根据真实 V5→iframe→`ZHIXU_PAGES_AI` 链路建立可重跑 browser 测试；没有调用真实模型。
- [x] Edge/WebKit 390px：未授权、模拟 200/429/401/断网、禁用已失效导师、禁止本地秘密持久化和非模拟外网；2/2 PASS。
- [x] 失败响应处理已存在且测试通过，因此不修改 Original/R3/V4 及共享 BYOK 适配器，不做无意义重构。
- [ ] 发布前 npm test、npm run verify、git diff --check 和范围审查。
- [ ] 安全推送、正式部署后验证仓库实际 main 与报告。
- [ ] 真机 Safari、真实计费模型、真人效果验证保留 NOT VERIFIED。
- [x] 安全推送 d297cae 到正式 main、Pages Success，原评委 URL 保持不变。
- [x] 正式线上深色/浅色全站 Edge/WebKit 48/48，确认框键盘焦点 4/4。
