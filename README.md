# NanoEdit Pro (AutoEdit) — 浏览器端 AI 视频剪辑工具

对标 Premiere Pro / 剪映 的工作流：多轨时间线、预设动效库、转场、关键帧、真实视频解码预览、WebAudio 混音，以及独立的**全屏 AI 导演**界面（ReAct 智能体直接操作当前项目）。

## 技术栈

- **框架**: React 19 + TypeScript + Vite
- **状态**: Zustand（细粒度 selector 订阅）
- **持久化**: IndexedDB（Dexie）+ 防抖自动保存；导出兜底 File System Access API
- **音频**: WebAudio（per-clip 增益/变速/淡入淡出）
- **导出**: 本地 Puppeteer+FFmpeg 管线（`modules/renderer`），浏览器内 MediaRecorder 兜底

## 快速开始

```bash
npm install
npm run dev        # 开发
npm run build      # 生产构建
npm test           # jest 单测（放置/吸附/撤销/分割/关键帧求值等）
```

## 功能矩阵

### 剪辑核心（快捷键）

| 操作 | 快捷键 | 说明 |
|---|---|---|
| 播放/暂停 | `Space` | |
| 逐帧 / 逐秒 | `←` `→` / `Shift+←→` | |
| 分割 | `S` | 有选中切选中片段；否则切所有跨播放头片段（文本↔配音联动同切） |
| 删除 / 波纹删除 | `Del` / `Shift+Del` | 波纹删除后同一轨道后续片段自动前移补位 |
| 复制 / 粘贴 / 副本 | `Ctrl+C/V/D` | 落点自动防重叠让位 |
| 撤销 / 重做 | `Ctrl+Z` / `Ctrl+Shift+Z` 或 `Ctrl+Y` | 100 步历史；拖拽/修剪手势整体为一步 |
| 缩放时间线 | `+` `-` 或滑杆 | |

**同轨防重叠（剪映式）**：移动、修剪、粘贴、新增全部经过布局引擎——磁吸吸附（片段首尾/播放头/零点，红色参考线）+ 就近空隙让位。修剪受左右邻居与素材源时长双重钳制。

### 效果系统

- **预设动效库**：入场 / 出场 / 强调 / 运动 / 滤镜 fx / 文本（90+），进度函数式驱动预览与导出一致。
- **转场**（9 种）：交叉溶解、黑场/白场过渡、四向划像、滑动、缩放溶解、模糊溶解、故障闪烁。
  - 应用方式：时间线相邻切点上点击转场方块 → 选择效果 + 时长滑杆；或属性面板 Effects 区编辑。
- **关键帧动画**：X/Y/缩放/旋转/不透明度五通道。
  - 属性行菱形按钮按当前播放头打帧，缓动可选（线性/缓入/缓出/缓入出/定格）；列表可改值、跳转、删除。

### 音频

- 时间线波形（导入时自动抽取峰值）、淡入淡出斜线可视化
- 片段级音量(0–200%)与变速(0.25×–4×)；变速联动时长换算并受邻居钳制

### 性能设计

- 播放头/时间码通过订阅式小组件直接写 DOM，主视图不逐帧重渲染
- 效果求值结果按 fps 量化缓存；素材 Map 索引；可见片段排序缓存+二分
- 时间线视口窗口化渲染；模板 canvas 按显示尺寸×DPR 降采样绘制
- AudioEngine 单遍扫描 + 漂移阈值重建；保存走变更防抖(2s)+30s 兜底，读取实时状态

## AI 导演（独立全屏页）

入口：顶部导航「AI 导演模式」或编辑器左侧栏「🎬 AI导演」。`#/director`

- ReAct 智能体（~25 个工具）：分析素材 → 规划分镜 → 创建轨道/片段/模板 → 应用预设 → 执行导出
- 会话式追问修改（"加大标题"）、内置无 API 模拟测试
- 三栏：会话控制台 / 执行活动流 / 实时项目大纲；右上配置 OpenAI 兼容服务商（运行时切换）

## 目录速览

```
src/
├─ engine/            # 预设动效(presets)、转场、模板、关键帧求值器、音频引擎与峰值提取
├─ modules/
│  ├─ timeline/       # 布局引擎: 吸附/防重叠落位/修剪钳制(纯函数,含单测)
│  ├─ clip|track|asset/# ClipManager / 轨道与素材管理
│  ├─ ai-director/    # ReAct Agent: planner/tools/memory/AIService/ProjectAdapter
│  └─ renderer/       # Puppeteer+FFmpeg 导出管线(本地)
├─ store/             # useProjectStore(含 undo/redo 历史)/useUIStore/usePlayerStore/useAppRouter
├─ components/        # Timeline / PreviewPlayer(+video 真实解码层) / 属性面板 / AI导演组件
└─ pages/             # EditorPage / AIDirectorPage(全屏)
```

## 说明与约定

- 撤销范围 = 项目数据（片段/轨道/参数）；素材导入不在历史内。
- 连续手势（拖动、修剪、滑杆）以 `markHistory()` 在起点打一次快照构成单步撤销。
- 视频片段声音统一由 AudioEngine 调度；预览 `<video>` 一律 muted 避免双声。
- 导出需本机 FFmpeg 在 PATH 中；浏览器兜底导出输出 WebM。

## 量化数据（可复现）

采集环境：**Windows 11 · Node.js v24.12.0 · npm 11.6.2**  
采集日期：**2026-09-17**  
复现命令：

```bash
npm ci
npm test
npm run build
node scripts/count-assets.mjs
Get-ChildItem dist -Recurse -File | Measure-Object Length -Sum
```

| 指标 | 数值 |
|------|------|
| Jest 测试 | **71 通过 / 4 跳过 / 75 总计**（跳过项为需要本机 FFmpeg 的 e2e 编码测试） |
| 测试耗时 | **1.9 s** |
| 预设动效数（`src/engine/presets` 实测） | **95**（7 类：entrance/exit/emphasis/motion/fx/text/transition） |
| 模板源文件数 | **28** |
| `vite build` 耗时 | **2.74 s** |
| 主 JS chunk | **933.3 KB**（gzip **278.9 KB**） |
| `dist/` 总体积 | **34.9 MB**（含 MediaPipe 人脸/手势模型与 WASM，按需加载） |
| MediaPipe 最大资源 | `selfie_multiclass_256x256.tflite` 15.6 MB |

## 部署到 Cloudflare Pages

```bash
npx wrangler login
npm run build
npx wrangler pages deploy dist --project-name=nanoedit-pro --branch=main
```

| 项 | 值 |
|----|----|
| Build command | `npm run build` |
| Output directory | `dist` |
| SPA fallback | `/* /index.html 200` |

> 已附带 `vercel.json` / `netlify.toml` 作为备选平台配置；本仓库默认以 Cloudflare Pages 为准。
