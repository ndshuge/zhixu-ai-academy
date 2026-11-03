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
