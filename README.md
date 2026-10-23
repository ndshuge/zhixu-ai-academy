<div align="center">

<img src="docs/assets/zhixu-doctor/welcome.webp" width="170" alt="知序博士欢迎形态"/>

# 知序 AI 学院
### 让知识有序，让理解发生。

**面向深度理解的个性化智能学伴 · 科学探究与学习证据**

[![Online](https://img.shields.io/badge/GitHub_Pages-在线体验-087F80?logo=githubpages&logoColor=white)](https://ndshuge.github.io/zhixu-ai-academy/)
[![Labs](https://img.shields.io/badge/Science-PFL_%2B_EvoWorld-147C84)](#科学探究如何工作)
[![Human](https://img.shields.io/badge/Human_approval-required-2CADA2)](#科学探究如何工作)

**[立即体验 →](https://ndshuge.github.io/zhixu-ai-academy/)** · [工程入口](server.mjs) · [运行指南](START_HERE.md) · [部署说明](DEPLOYMENT.md) · [工程开发历程](docs/README_PROJECT_HISTORY.md)

</div>

---

## 会得到答案，不等于真正理解

理工学习不能只停留在“我知道答案”。知序让学生先独立判断，再进行可复算的科学实验，记录预测与结果的差异，并形成下一轮复习。

| 学习阶段 | 体验内容 |
|---|---|
| 独立前测 | 先留下自己的答案，不提前看到结论 |
| 知序博士 | 分情境启发思考，不默认替学生作答 |
| 科学探究 | 运行 PFL / EvoWorld，观察可复算结果 |
| 错因诊断 | 对照原判断、实验和可追踪证据 |
| 针对性复习 | 再次验证理解，保存学习过程 |

## 科学探究如何工作

**先预测 → 设置参数 → 运行实验 → 阅读证据 → 修正理解 → 学生批准下一步**

- **Physics Frontier Lab**：非线性动力学和数值实验。
- **EvoWorld**：不同实验条件下的生命演化与对照。
- **知序博士**：多状态角色导师，解释、提醒并鼓励学生自主判断。
- **人类在环**：建议与执行相互区分；关键行动需要学生明确批准。

## 立即开始

**[打开知序 AI 学院在线版](https://ndshuge.github.io/zhixu-ai-academy/)**（手机和电脑均可打开）

GitHub Pages 提供公开浏览器体验。完整本机模式可通过 Node.js 启动：

    node server.mjs

随后访问 http://127.0.0.1:4386/ 。公开 Pages 与本地学校管理、科学工具、真实模型配置的能力边界，请阅读 [部署说明](DEPLOYMENT.md)。

## 仓库导览

| 目录 | 内容 |
|---|---|
| [docs/](docs/) | GitHub Pages 公开网页 |
| [public/](public/) | 前端应用与资源 |
| [adapters/](adapters/) | PFL、EvoWorld 计算适配器 |
| [server.mjs](server.mjs) | 本机 Node 服务 |
| [tests/](tests/) | 工程回归测试 |
| [开发历史](docs/README_PROJECT_HISTORY.md) | 早期版本、验收报告与时间线 |

## 技术与真实性边界

- 真实的科学计算与浏览器软件演示，不等于已经证实学生成绩提高。**真实学生学习效果研究 n=0**。
- 合成学习场景、规则规划、真实付费模型调用必须区分。
- 密钥不应进入公开仓库，正式部署应核对服务端配置及发布范围。
- 各阶段历史交付数据已经收进 [工程开发历程](docs/README_PROJECT_HISTORY.md)，避免将历史版本当成最新发布。

---

<div align="center"><sub>知序 AI 学院 · Evidence-led learning · 2026</sub></div>
