# 知序 AI 学院 · Apple Edition

**Original Edition 完整保留，Apple Edition 是新增的独立前端。** 本目录不包含原版教师业务逻辑副本，也不包含任何 API Key。

## 入口

- Apple Edition：`/ndshuge-galaxy/little-works/ai-academy-apple/`
- 双版本并排对照：`/ndshuge-galaxy/little-works/ai-academy-apple/compare.html`
- Original Edition：`/zhixu-ai-academy/original.html`（原版仍保留）
- 小东西目录入口：通过 `little-works/catalog.json` 登记。

## 架构及数据

原版科学、题库和 AI 接口位于 **同一 GitHub Pages 域名**的 `/zhixu-ai-academy/`。Apple Edition 仅在隐藏 iframe 装载原版轻量 `learning.html` 学习运行页，并按需加载同源、未改动的原版 `original-pages-byok.js` 模型设置脚本；通过已存在的 `window.ZHIXU_BROWSER_ADAPTER` 和原版拦截的 `fetch('/api/…')` 调用，**不复制评分规则或科学计算**。

学习事件动态导入原版 `/zhixu-ai-academy/learning-store.js`，沿用 `ai-academy-learning-v02`、`ai-academy-learning-v01` 及版本化 `schemaVersion: 2`。用户在同一浏览器可用两个界面查看相同数据。新 UI 的视觉偏好使用独立键 `zx-apple-preferences-v1`，教学途中上下文放 `sessionStorage`。

**部署边界：** 必须在 `ndshuge.github.io` 同一来源（scheme、域名、端口均相同）运行。跨域静态克隆不提供完整业务能力。离线访问或原版资源不可用时显示连接失败，不冒充科学服务正常。手机端不保证与服务器部署版本完全一致。

**模型边界：** 没有自动连接付费 LLM。未授权时仅有规则导师。用户可通过设置访问原版 BYOK，使用的浏览器端 Key 存储风险沿用原版。每次模型调用仍需用户确认，不能在这里输出或上传 Key。未实装真实学生成效评价、全自动知识图谱、独立学校级账户和历史统计的，不显示为上线功能。

## 真实功能

- 今日学习、科学课程、知识点状态、个人成长、V2 错因候选与复习任务。
- 原版题库独立前测与独立迁移：敏感性课程按原版真实题目完成两道前测和两道迁移，其他课程按真实题库数量显示，不补造数据。选项初始均未选择；前测暂缓透露答案。
- 原版 Logistic / EvoWorld 真实浏览器计算、实际实验指标、基于结果绘制的曲线。
- AI/规则导师、单变量规划、独立新预测、显式批准与第二轮运行。
- V2 学习记录写入、只读数据汇总、JSON 导出、可控数据清除。
- 390px 触控导航、768px 平板自适应、1440px 多栏桌面。
- 手机原生风格浮动导航、Motion 物理按压反馈、课程长按/取消、页面连续过渡。

## 第三方引擎与许可证

- **Liquid Glass for the Web** `assets/liquid-glass.js` + `assets/components.js`：源自已安装 Skill 中的经过跨浏览器设计的 SVG 折射与原生 Web Components，MIT 许可证见 `assets/LICENSE-liquidglass.txt`。实装 `lg-navbar`、`lg-lens`、`lg-segmented`。在不可见或无背景区域会产生 L1 退化，不能将模糊称为真实环境折射。
- **Motion v14.7.1**：只提取并本地打包了开源的 `animate`、`motionValue`，压缩版 `assets/motion.bundle.js`。MIT 许可证见 `assets/LICENSE-motion.md`。未经授权不包含 Motion+ 内容。
- **Apple Liquid Glass**：`assets/apple-tokens.css` 为已安装 Skill 的自适应变量基础，不含 Apple 私有字体或授权图片。

首屏包含无需 JavaScript 即可阅读的课程介绍和原版后备链接。原版引擎加载前的科学操作会等待连接，明确反馈失败状态；不会调用虚构模型。

详情见 `QA_REPORT.md`、`design-studies/`；开发自动化脚本与原始图像存放在私有工作树 `qa/`。

## 故障与回退

业务接口由原版站点提供。打开前请确保原版网页可访问。失败时查看“科学引擎未连接”提示；不要尝试使用不同域名或 file:// 访问本应用。若新版出现故障，使用 Original Edition 链接继续操作原版。仅清除 V2 学习记录时会保留 V1 历史备份。
