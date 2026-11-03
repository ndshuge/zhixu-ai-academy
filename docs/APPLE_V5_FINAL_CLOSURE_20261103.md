# 知序 Apple V5 · 科学证据、学习闭环与极窄屏可访问性收口（2026-11-03）

## 唯一产品与变更边界
- 产品：知序 AI 学院（AI 学习/科学探究）；与小芽 LifeLab 无关。
- 正式评委入口：`https://ndshuge.github.io/zhixu-ai-academy/`，仓库 `ndshuge/zhixu-ai-academy`，主要线上 UI `apple-editions/ai-academy-v5/`。
- 独立施工树 `feature/zhixu-v5-verify-learning-accessibility-20261103`，始于 `03f6096`；不修改 Original、R3、V4，也不虚构真人测试。

## 根因审计、修复与科学证据
| 项目 | 修复前的证据 | 修复方法 | 本轮验证 |
|---|---|---|---|
| PFL bundle 哈希 | bundle SHA 6dcc8289…；2026-10-10 固定证据 SHA 88f7c1a1… | 从本机原知序工程及官方提交材料中核实同一 SHA 后，恢复精确的原 bundle 字节；**不修改原 provenance** | 哈希测试 + `npm run verify` PASS |
| EvoWorld 快照 | 6 个 `.mjs` 在 Windows `core.autocrlf=true` 后由 LF→CRLF；但 HEAD Git blobs 均与锁定快照匹配 | 恢复原 LF 字节；增加 `.gitattributes` 的 PFL 和 Evo 快照 `-text` 规则 | 11 模块、manifest 聚合哈希 PASS；需 **重新检出后再测** |
| Git worktree PFL 上游路径 | 旧 `verify.mjs` 直接以 cwd 解析 `../physics-frontier-lab`，独立工作树无法定位 | `scripts/pfl-provenance-verifier.mjs` 从 manifest 中原 `source` 解析、限制路径、遇原上游缺失则明确警告；bundle 不匹配一律失败 | 6 个新增科学/构建测试 PASS |
| 旧文档存在性检查 | `docs/PRODUCT_BRIEF.md`、`docs/ACCEPTANCE.md`、`docs/SCHOOL_API_BYOK.md` 不在公开仓库 | 改为校验实际随产品发布的 README 与两份 Apple V5 审计文档；保留科学模块和产品脚本存在性检查 | `npm run verify` PASS |

完整科学校验控制台：`AI_ACADEMY_VERIFY_OK`，PFL SHA `88f7c1a189aeb1870ae522a6e90d0de0eb00e893ad467dae9c6743e40a6c4a92`，Evo aggregate SHA `45466224cc6ce12510cb301ccfffbef653a9704bb6e18cf4e2937521162e1263`，Evo 11 模块，PFL/Evo 上游漂移 0。

## 真实用户旅程（自动化无真人样本）
新增 `tests/browser-v5-full-journey.cjs`：在浏览器加载实际静态 Pages 构建和同源原版适配器，不伪造科学引擎、题库或学习数字；模拟一名测试学生的操作，不代表真实用户学习成效。
- Logistic sensitivity（Edge + WebKit）：两道前测、独立预测、1 次科学计算、规则导师、两道迁移题、个人进度、刷新留存、导出 V2 JSON、取消删除。
- EvoWorld evo-pair（Edge + WebKit）：一道前测、独立预测、1 次独立生态重复实验、规则导师、一道迁移题、进度、刷新留存、V2 导出、取消删除。
- 共 4/4 组完整流程 PASS；没有 JS pageerror 或资源 404；未在测试中连接真实 BYOK Key。
- 旧原版 `tests/browser.mjs` 与 `tests/browser-learning.mjs` 在 Mice Hole 单次命令工具 28 秒预算内均超时，**未取得 PASS**。保留为独立未完成项，不能用本轮 V5 浏览器绿灯代替。

## Apple 设计质量提升与实际浏览器验收
- 小字号：公式预览、方法步骤、实验说明/记录等由 12px 提升到 13px（仅 V5 特定范围覆盖）；内容优先，不改源码引擎逻辑。
- 极窄视口：195px CSS reflow（模拟手机 390px 宽度在浏览器放大 200% 的布局压力）下原五个 Dock Tab 约 30px 触控宽度。只在 max-width:260px 时显示「今天 / 学习 / 更多」，保留课程、资料和进度于 44px 的可访问菜单中；不是在 390px 手机上强行隐藏主 Tab。
- 通过：Edge/WebKit × 195/320/390px 6/6 浏览器操作组；菜单方向键、Esc 退出与焦点恢复、选中态、页面返回、五 Tab 正常模式、无横向溢出/404/脚本错误；195px 三个底栏按钮各 44×52px。
- 布局审核：Edge/WebKit × 六路由 × 320/390/768/1440 视口均完成，检查当前可见短按钮、辅助小字号与横向溢出。
- 截图证据：`docs/evidence/apple-v5-closure-20261103/edge-195-before.png`、`edge-195-more.png`、`webkit-195-more.png`。均为本机 Playwright 浏览器的公用演示界面，**不是 iPhone Safari 真机**。

## 依据和所用 Skill
- Apple HIG：`https://developer.apple.com/design/human-interface-guidelines/`；阅读/动效/导航与内容分层。
- WWDC25 Liquid Glass `https://developer.apple.com/videos/play/wwdc2025/219/`；不将普通 `backdrop-filter` 冒充真实光学折射 L2。
- Chat Plugins 实际读取：`shuge-apple-product-audit` + `AUDIT_MATRIX.md`、`shuge-apple-design`、`motion`、`finesse-ui`、`apple-liquid-glass`。实际应用场景：边界化组件审计、触控区域、空间/视觉连续性、CSS 限域覆盖和对照实测。Skill 安装在 **ChatGPT 当前插件环境**，并未声称本机有对应 skill 文件。

## 最终验收表（提交前）
| 检查项 | 实际结果 |
|---|---|
| `npm test` | 134/134 PASS |
| `npm run verify` | PASS |
| 科学/文档新增专项测试 | 6/6 PASS（包含 npm test 中） |
| Browser V5 完整教学路径 | 4/4 PASS（Edge/WebKit × Logistic/Evo） |
| 极窄 Dock 真实交互 | 6/6 PASS（Edge/WebKit × 195/320/390） |
| 发布文件名安全检查 | PASS：462 个文件名，非内容全量秘密扫描 |
| 单次老版 `browser.mjs` 与 `browser-learning.mjs` | TIMEOUT / NOT VERIFIED |
| 真机 iPhone Safari 真实工具栏与键盘 | NOT VERIFIED |
| VoiceOver、200% 系统文本动态字体、全部高对比/深色模式 | NOT VERIFIED |
| 真实 DeepSeek BYOK 和私人 API Key | NOT VERIFIED |
| 真人教育效果对照试验 | 未进行，样本 0 |
| 全站 Apple 第一方品质判定 | 尚无可证明的全面真机/逐帧验收，不宣称达标 |

## 后续边界
1. 完成新 Git worktree 的重新检出哈希测试和正式 Pages 部署验收后，才能宣称本轮合并发布成功。
2. 真人真机 Safari / VoiceOver / 深色模式 / WebKit 性能测量，需要可接触的物理设备；浏览器模拟无法取代。
3. 不发布、打印或记录私人 API Key；规则导师和真实模型明确区分。

## Release confirmation (after the pre-release checklist)
- SHA `8d9baff9908271d0c2bbc0fbf226f5d129b6119d` committed and pushed to `ndshuge/zhixu-ai-academy/main` with protected non-force safe-HTTPS script.
- Fresh independent Windows checkout at the exact commit: `npm run verify` PASS; `npm test` 134/134 PASS. PFL original expected SHA remains 88f7c1a1...; original scientific Git blobs unchanged.
- GitHub Pages workflow run `41632009573` completed with `success`.
- Production from judge root `https://ndshuge.github.io/zhixu-ai-academy/?judge=1`: Edge/WebKit 2/2 rerouted to V5, no JS errors or 404.
- Production compact navigation (195, 320, 390 CSS px) Edge/WebKit 6/6 PASS.
- Production Edge Logistic end-to-end journey PASS, including genuine model-free science, persisted V2 record and export. EvoWorld and WebKit journeys additionally passed in the local Pages build, not re-run in the public deployment.
- Original page `https://ndshuge.github.io/zhixu-ai-academy/original.html` still HTTP 200.
- Unverified limits remain actual iPhone Safari, VoiceOver, BYOK live model and independent human learning efficacy; older backend browser scripts timed out locally.
