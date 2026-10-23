# 知序 AI 学院 · 工程发布说明

原版服务端源码、AI 提供者管理、测试、原版前端和博士都保存在同一个仓库。本项目的静态站点由 `.github/workflows/deploy-pages.yml` 从 `public/` 和 `pages-overlay/` 自动构建，不再独立维护一套旧版前端。

- 在线版：https://ndshuge.github.io/zhixu-ai-academy/
- 详细实测能力、录制限制、安全说明：[Pages 功能验收](PAGES_CAPABILITY_AUDIT.md)
- 源码入口：`public/`、`server.mjs`、`model-provider.mjs`、`adapters/`、`quiz-bank.mjs`
- Pages 专用差异：`pages-overlay/` 和 `scripts/build_pages_from_source.py`

**请勿将 GitHub Pages 当作 Node 服务端。** 浏览器内可运行数学实验、课堂和个人学习记录，但没有部署学校管理员鉴权、云端数据库或服务端防作弊。

**API Key 在浏览器保存是用户自主选择的风险功能**：默认仅当前标签页；主动勾选后将 Key 存储在浏览器 localStorage，刷新后可再次测试连接、并可随时清除。此 Key 不进入 GitHub、Actions 或知序自己的服务器，但因前端可读，无法防御浏览器扩展或同源脚本访问。DeepSeek 官方不推荐将 Key 暴露在客户端；长期生产环境应部署安全后端。
