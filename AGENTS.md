# 知序 AI 学院｜施工 Agent 指引（2026-11-03）

## 项目与正式发布
- 当前施工对象仅为 **知序 AI 学院**；绝不把小芽 LifeLab、FactGuard 等项目混进本仓库。
- 正式 GitHub 仓库：`ndshuge/zhixu-ai-academy`，唯一固定评委网址：`https://ndshuge.github.io/zhixu-ai-academy/`。当前正式版本为 Apple V5（`apple-editions/ai-academy-v5/`）。
- Original、Apple R3、Apple V4 均为保留的历史版本；绝不修改它们来代替 V5 施工。小东西版本页在独立 Galaxy 仓库。
- 使用独立 Git worktree / 分支，先 fetch 最新远程 main，保护别人的 WIP；变更后测试、对比手机/桌面页面、查看安全差异，再非强制推送，核实 Pages 和原评委 URL。不能把本地测试说成上线。

## ChatGPT 插件 Skills —— **挂载于 Chat 会话，不在本机安装**
- Apple Web Design / Apple Liquid Glass / Liquid Glass for the Web / Motion / Design Taste / Frontend Dual Source / finesse-ui / Impeccable / Prism / SHUGE Apple Design 等由 **ChatGPT 当前对话的插件系统**提供，调用 `tools.skills__list({})` 确认挂载，再通过 `tools.skills__read({uri:"skills://plugins/apple-web-design/<skill-slug>"})` 在 Chat 内加载原文及任务相关引用。
- **不要将 `E:\CHATGPT\...\skills\`、`C:\Users\...\.agents\skills\` 或旧的本地 Skill 复制品当作这些 ChatGPT 插件的安装位置或执行证据。** 本机可能另有可用资源或示例，但须独立核验路径/许可证，不可代替 Chat 的 `skills__read`。Mice Hole 是 Chat 可调用的本机文件、终端、浏览器执行桥，不是 Skill 安装器。
- 分类使用：**apple-web-design** 定信息架构；**frontend-dual-source + design-taste-frontend** 定真实参考和主体布局；**shuge-apple-design** 组织 Apple 真实性、两端比较和真实验收；**apple-liquid-glass + liquid-glass-web** 处理 L0/L1/L2 材质（`backdrop-filter` 只是 L1，网页 CSS 不能宣称系统原生折射）；**motion** 规定手势和可中断转场；**finesse-ui + impeccable** 做字号、密度、冗余文案、触控与无障碍审计；**prism** 仅在与当前 Vanilla JS 技术栈兼容的场景使用，不为调用技能而强行改 React。
- 执行证据分开标明：`FOUND` 已发现、`LOADED` 已通过 Chat 阅读、`APPLIED` 已对应实际源码修改、`VERIFIED` 已经过截图/运行/交互测试。**仅列出名称、找到索引或读取 Skill 均不能声称已调用运行时组件。**
- 以原版科学引擎、学员真实事件和访问者能否完成完整学习为标准；不得编造样本效果、AI Key 验证结果或 Safari 真机折射。真机 iPhone Safari 与模拟 WebKit 分开记录。

## V5 前端持续改进标准
- 手机：内容可读、首屏看得懂如何开始；dock 与安全区渐进衔接；触控目标尽量不低于 44 CSS px；滚动、键盘弹出不遮挡主按钮；动态效果支持 reduce-motion/transparency。
- 桌面：主阅读/实验工作台优先；左侧目录栏按需使用，避免空白列；保持助手上下文可达；不要重复顶部标题和正文标题。
- 清除无意义英文全大写装饰、重复解释和 9–11px 低可读说明；保留必要的数学公式、真实提示和 AI 授权边界。
- 重点测试首页→实验→私人教师→迁移练习，记录 UI 实际截图、点击后布局稳定性、Edge/WebKit、320/390/768/1440 四档，以及 V4/R3/Original 不变。

## Apple V5 全站审计持久约束（2026-11-03）
- 在 ChatGPT 插件 Skills 中，优先调用 `shuge-apple-product-audit` 并阅读 `references/AUDIT_MATRIX.md`，再选择 `shuge-apple-design`、`apple-web-design`、`motion`、`liquid-glass-web`、`finesse-ui`、`impeccable`。这些技能是 **ChatGPT 会话挂载**，不是 Windows 本机默认安装。每次区分 FOUND / READ / APPLIED / VERIFIED；不得以本机目录扫描冒充调用。
- 知序是“独立前测→预测→可复现科学计算→导师追问→迁移→复习”的学习产品，非小芽生活管理；保留原版教学引擎、用户 V2 事件、真实数据和 BYOK 用户授权边界；无证据不制造成绩。
- 每个新页面/组件先审查“是否必须存在”，再处理正文/控件层级、按钮和辅助文案。优先让阅读内容清楚、操作可靠。手机 dock/scroll edge 是单独浮动层，不能用固定白雾冒充 Liquid Glass L2；不能在单一滚动区叠多套边缘遮罩。
- 系统性 UI 变更按 `docs/APPLE_V5_RESEARCH_AND_SKILLS_20261103.md` 与 `docs/APPLE_V5_FULL_AUDIT_QA_20261103.md` 门禁：基线 6 路由，320/390/768/1440px，两端真实浏览器点击、滚动到底、控制状态、中途取消、键盘、长文、Reduced Motion；截图前后对照、确认可访问性与核心学习流才集成。
- 同页“重新开始”必须实际刷新当前 UI 而不删除已记载的学习事件。设置属于工具路由，不能把前一个底部主 tab 伪装选中，也不应重复多个设置入口。桌面课程/学习可用二级目录，资料/进度/设置若只有静态说明则不应占用一整列。
- WebKit 模拟绝不等同 iPhone Safari 真机；“已调用插件/实现 L2 原生折射/达 Apple 第一方视觉”均须有实测证据。PFL SHA256 mismatch 需独立调查，不得为消除红灯篡改科学证据。
- 施工只改 `apple-editions/ai-academy-v5/`，保留 R3/V4/Original；独立 worktree、无 force push，发布必须核对正式评委 URL 指向与静态部署成功。文档状态以实际源码和验证记录为准。
## 2026-11-03：博士弹层中途反向行为（仅知序 V5）
- Apple UI 的动效生命周期不得让 Motion 与另一个 WAAPI 动画同时控制同一面板的 opacity/transform；本次已在 V5 将博士面板改为单一 doctor-visible 状态 + CSS transition，支持中途反向并只在真实关闭完成后 hidden。
- launch/close 使用 aria-expanded 作为用户期望状态；关闭未完成时重新打开需取消退出计时器，不得复位原聊天内容；Esc 退出焦点返回头像。Reduce Motion 立即切换，不触发 iOS 软键盘。
- 该约束只作用于 `apple-editions/ai-academy-v5/`；V4/R3/Original 禁止回填。参考 `docs/APPLE_V5_DOCTOR_REVERSAL_QA_20261103.md`。
- Chat 插件 Skill 在 ChatGPT 环境中加载，Mice Hole 只负责本机执行；Playwright WebKit ≠ iPhone Safari 真机，不得以绿测声称已完成视觉终验。

## Apple V5 follow-up: immutable science artifacts and compact navigation (2026-11-03)
- For PFL and EvoWorld provenance SHA256 evidence files, always preserve original bytes with .gitattributes -text; never reformat/normalize line endings, regenerate a bundle without provenance, or rewrite an expected hash to silence verification. Always run npm run verify on a fresh Windows checkout.
- The official judge URL and Apple V5 remain in ndshuge/zhixu-ai-academy; V4/R3/Original must not be overwritten.
- At viewports <=260 CSS px (e.g., approximate 200% zoom of a 390px mobile viewport), use Today / Learn / More. Each nav hit area >=44 CSS px. More contains Courses, Library, Growth; Escape returns focus; aria-expanded, aria-current and history must remain consistent.
- Rules mentor does not imply a connected commercial model; no BYOK secret in tests. Use tests/browser-v5-full-journey.cjs to exercise actual evidence-producing science adapter.
- Browser WebKit simulation and local 195px reflow are NOT real iPhone Safari, VoiceOver, system Dynamic Type or 60fps performance certification.
- ChatGPT Apple/UI plugin Skills are loaded in the ChatGPT plugin environment, not automatically installed in the local Windows filesystem. Reference docs/APPLE_V5_FINAL_CLOSURE_20261103.md.

## V5 systemic appearance and modal accessibility (2026-11-03)
- V5 follows prefers-color-scheme dark/light and explicitly accommodates prefers-contrast:more and prefers-reduced-transparency. Only the V5 CSS is changed; Original/R3/V4 keep their own appearance. Use content-first opaque reading surfaces; avoid claiming native Apple L2 refraction.
- A destructive confirmation dialog must have an accessible name and description, Escape cancel, Tab/Shift+Tab containment and focus restoration. Pass the actual invoking button explicitly: disabling a button can clear document.activeElement on WebKit before the modal is rendered.
- Old backend browser scripts must wait for DOM content and named app controls instead of networkidle; the original app keeps background requests alive. Never drop assertions that detect HTTP >=400.
- The public evidence summary is a sanitized synthetic technical aggregate regenerated from source under strict conditions, with source SHA256 fingerprints; do not commit case-level prompts, responses or private model credentials. Never state that this is evidence of student learning improvement (verified sample remains 0).
- Temporary browser screenshots and reports go to ignored evidence/browser/ or isolated _tmp, not the public Git repo. Selected non-sensitive design screenshots may go to docs/evidence/ after review.
- ChatGPT Apple and frontend Skills are mounted in Chat, not installed by default in Windows. See docs/APPLE_V5_APPEARANCE_A11Y_LEGACY_QA_20261103.md.
