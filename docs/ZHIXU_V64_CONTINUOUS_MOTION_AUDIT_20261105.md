# 知序 V6.4 · 全站连续动效审计与修复（2026-11-05）

## 用户录屏
- `ScreenRecording_11-05-2026 10-30-00_1.mp4`，约 24.14 秒，512 × 1112 / 30fps。
- 逐段参考：0–5s 五页面切换；5–10s 设置页「减少动态效果」开关；11–15s 「连接 DeepSeek」底部弹层和关闭；18–24s 学习页过渡。
- 需求：页面滑动不出现底色闪变，模态小弹窗完整从下进入、沿下方原路关闭，所有设置开关/选择状态发生连续过渡而不是销毁重建。

## 审计到的实际冲突
| 界面 | 原因 | 修正 |
|---|---|---|
| 页面路由 | V6.3 两个滑动页面外层写死 `background:var(--white,#fff)`，应用实际 `--ground:#f6f6f8` | 两个滑动外层与页面共享 `var(--ground)`，不再露出白色底层 |
| DeepSeek 原生安全配置 | `v5-surface-continuity.js` 使用按钮坐标计算小幅 `translate+scale`；遮罩先结束，实际面板会突然卸载 | 从底部真实位移 `translateY(100% + 50px)`，完整上升 ~540ms，沿原路径退场 ~460ms；等 `transform transitionend` 才卸载 |
| 清空 V2 记录确认 | 与 BYOK 共用老入口，使用同样的小幅缩放 | 复用新安全底部 Sheet；取消/确认、Escape、遮罩点按及焦点返回保留 |
| DeepSeek 反向打断 | 旧 close 立刻清空 `dialog` 变量；关闭未结束再打开会新建第二个含相同 ID 的面板 | 保持旧面板 DOM 直至完全退出；在退场途中点击重开时同一实例逆转；API Key 仍只保存在内存且关闭立即清空输入框 |
| 减少动态效果 | `toggle-reduced` 调用 `render()`，整个设置页被 `innerHTML` 重新创建，轨迹断裂 | 直接更新原开关 `aria-checked` 和文档设置；圆点原位逐帧滑动 0→19px，轨道背景平滑变色；手动减少动态保留小范围开关反馈，系统级减少动态为最高优先级 |
| 阅读字号 | `set-type-scale` 每次 `render()` 重建卡片与所有设置控件 | 直接切换现有按钮 `aria-pressed`，保留节点与焦点，颜色/描边过渡 |
| 其他设置行按钮 | 旧版释放按压存在 `scale(1.015)`，容易出现额外膨胀 | 轻微压下 0.985 → 1.0，去除多余放大，控制部件自有过渡 |
| 博士对话 | V6.3 已实现顶部 Sheet 可逆轨迹 | 保留此机制，不把统一底部 Sheet 强加给博士 |
| Dock | 已有镜片连续移动、渐变模糊与选中态 | 保留现有镜片，无需重构 |
| Toast、超窄屏“更多” | Toast 是短暂状态提示，“更多”是导航菜单，并非用户确认/配置模态 | 不强制改成占屏底部 Sheet，避免破坏操作语义 |
| `v5-deepseek.js` 旧实现 | 旧代码仍存在于历史源码，但未接入当前 V6.4 index | 不改动以免误接旧版配置，保留 `v5-native-api.js` 唯一实际入口 |

## 实施文件
- `v6-paired-pages.css`：两页背景统一。
- `v5-surface-continuity.js`：统一可逆弹层 JS 生命周期，取消按钮坐标轨迹。
- `v6-sheet-continuity.css`：底部进退 + 遮罩时序，支持 OS/user reduced motion。
- `v5-native-api.js`：原生 DeepSeek 配置取消/重进支持中途反向，避免重复弹层及重复 ID；保留原版 BYOK 授权/请求/密钥清理安全边界。
- `v4.js`：开关、阅读字号在原位更新，不重新创建 DOM。
- `v6-control-continuity.css`：开关圆点、轨道、阅读字号和设置按钮的逐帧过渡。
- `index.html`：新增新文件引用与独立版本标签。
- `tests/v64-continuous-motion.test.mjs` 和 `tests/browser-v64-continuity.cjs`：回归合同与真实浏览器采样。

## 发布门禁
- 全量 `npm test`：270/270 PASS。
- `npm run verify`：`AI_ACADEMY_VERIFY_OK`，PFL、Evo 原版 SHA256 不变。
- Edge / WebKit、390 / 1440px 连续控制与底部弹层测试；真实圆点中间帧位移和面板 top 采样，确认 Sheet 首尾退场与中断重入；没有真实付费 DeepSeek 请求。
- 路由回归 Edge / WebKit × 320/390/768/1440px：五个页面无按钮失效、水平溢出、聚焦错误。
- V6.3 博士顶部 Sheet、V6.2 双页左右平移与学习 Dock 不隐藏：不能回归破坏。
- PFL/EvoWorld 双引擎完整学习流程 Edge/WebKit：不能回归破坏。
- Git worktree 隔离，非 force push，Pages Actions 完成后进行生产浏览器烟测；iPhone Safari 真机未实测时不得声称“真机完美”。
- 缓存失效：由于 V6.4 修改了 `v4.js`、`bridge.js`、`v5-native-api.js`、`v5-surface-continuity.js` 以及两页背景 CSS，逐级升级它们的导入查询版本号至 `20261105-continuous-b`；保证 GitHub Pages 和 iPhone Safari 不会沿用旧模块。科学算法没有改动。

## 时间参数
- 底部 Sheet 进入 ~540ms，顶部/关闭返回 ~460ms，不同视口同方向同逻辑。
- 开关圆点 ~280ms，轨道颜色 ~280ms；阅读字号按钮颜色/边框 ~240ms。
- 这些是界面参数与仿真验证的动画时序，不冒充实机帧率测试。
