# 模块化架构重构与渲染引擎升级 Spec

## Why

当前 AutoEdit 项目存在以下核心问题：
1. **代码组织混乱**：所有功能耦合在少数几个大文件中，`Renderer.ts` 承担了过多职责（资源加载、特效应用、模板渲染、Canvas绘制），难以维护和扩展
2. **渲染能力受限**：当前基于 Canvas 2D + MediaRecorder 的导出方案，画质差、性能低、无法实现复杂视觉效果
3. **动画系统原始**：预设/模板使用简单的 progress 插值，缺乏物理缓动、GPU 加速、弹簧模型等高级动画能力
4. **扩展性差**：新增功能需要修改核心文件，无法独立开发和测试

## What Changes

### 一、架构重构：按功能模块拆分

将项目从扁平结构重构为清晰的模块化架构：

```
src/
├── modules/                          # 功能模块（高内聚、低耦合）
│   ├── track/                        # 轨道模块
│   │   ├── TrackManager.ts           # 轨道 CRUD、排序、可见性管理
│   │   ├── TrackTypes.ts             # 轨道类型定义与常量
│   │   ├── useTrackStore.ts          # 轨道状态（Zustand slice）
│   │   └── index.ts
│   ├── asset/                        # 素材库模块
│   │   ├── AssetManager.ts           # 素材加载、缓存、元数据管理
│   │   ├── AssetTypes.ts             # 素材类型定义
│   │   ├── useAssetStore.ts          # 素材状态（Zustand slice）
│   │   └── index.ts
│   ├── clip/                         # 片段模块
│   │   ├── ClipManager.ts            # 片段生命周期、变换、效果管理
│   │   ├── ClipTypes.ts              # 片段类型定义
│   │   └── index.ts
│   ├── preset/                       # 预设模块（动画引擎）
│   │   ├── core/                     # 动画引擎核心
│   │   │   ├── AnimationEngine.ts    # 统一动画调度器
│   │   │   ├── EasingLibrary.ts      # 缓动函数库（GSAP风格）
│   │   │   ├── SpringPhysics.ts      # 弹簧物理模型
│   │   │   ├── GPURenderer.ts        # GPU加速渲染器
│   │   │   └── TimelineDriver.ts     # 时间轴驱动器
│   │   ├── categories/               # 预设分类目录
│   │   │   ├── entrance/             # 进场动画
│   │   │   ├── exit/                 # 出场动画
│   │   │   ├── emphasis/             # 强调动画
│   │   │   ├── motion/               # 运动动画
│   │   │   ├── fx/                   # 特效滤镜
│   │   │   ├── transition/           # 过渡转场
│   │   │   └── text/                 # 文字动画
│   │   ├── PresetRegistry.ts         # 预设注册表
│   │   └── index.ts
│   ├── template/                     # 模板模块
│   │   ├── core/                     # 模板引擎核心
│   │   │   ├── TemplateEngine.ts     # 模板渲染引擎
│   │   │   ├── TemplateContext.tsx    # 模板上下文（React）
│   │   │   ├── TemplateRenderer.ts   # 模板渲染适配层
│   │   │   └── TemplateRegistry.ts   # 模板注册表
│   │   ├── categories/               # 模板分类目录
│   │   │   ├── text/                 # 文字模板
│   │   │   ├── ui/                   # UI组件模板
│   │   │   ├── background/           # 背景模板
│   │   │   ├── effect/               # 特效模板
│   │   │   └── transition/           # 转场模板
│   │   └── index.ts
│   ├── renderer/                     # 视频渲染模块（Remotion架构）
│   │   ├── core/                     # 渲染核心
│   │   │   ├── TimelineContext.tsx    # 帧驱动时间线上下文
│   │   │   ├── SequenceContext.tsx    # 序列时间偏移上下文
│   │   │   ├── CompositionManager.ts # 作品注册管理
│   │   │   └── RenderContext.tsx      # 全局渲染配置上下文
│   │   ├── hooks/                    # 渲染Hooks
│   │   │   ├── useCurrentFrame.ts    # 获取当前帧号
│   │   │   ├── useVideoConfig.ts     # 获取视频配置
│   │   │   ├── useInterpolate.ts     # 帧插值动画
│   │   │   ├── useSpring.ts          # 弹簧动画Hook
│   │   │   └── useDelayRender.ts     # 异步资源延迟渲染
│   │   ├── components/               # 渲染组件
│   │   │   ├── AbsoluteFill.tsx      # 全屏绝对定位容器
│   │   │   ├── Sequence.tsx          # 时间序列组件
│   │   │   ├── Composition.tsx       # 作品注册组件
│   │   │   └── VideoFrame.tsx        # 单帧视频输出组件
│   │   ├── animation/                # 动画工具
│   │   │   ├── interpolate.ts        # 插值函数
│   │   │   ├── spring.ts             # 弹簧物理
│   │   │   ├── easings.ts            # 缓动函数集合
│   │   │   └── stagger.ts            # 交错动画工具
│   │   ├── puppeteer/                # Puppeteer渲染后端
│   │   │   ├── BrowserLauncher.ts    # 浏览器启动与管理
│   │   │   ├── FrameCapture.ts       # 逐帧截图
│   │   │   └── FrameDriver.ts        # 帧驱动注入
│   │   ├── encoder/                  # 视频编码
│   │   │   ├── FFmpegEncoder.ts      # FFmpeg编码封装
│   │   │   └── EncodePipeline.ts     # 编码流水线
│   │   ├── preview/                  # 预览播放器
│   │   │   ├── Player.tsx            # 实时预览播放器
│   │   │   ├── PlayerControls.tsx    # 播放控制器
│   │   │   └── PlayerTimeline.tsx    # 播放时间轴
│   │   ├── VideoRenderer.ts          # 渲染入口（编排Puppeteer+FFmpeg）
│   │   └── index.ts
│   └── ai-director/                  # AI导演模块
│       ├── services/                 # AI服务
│       │   ├── AIService.ts          # AI API调用封装
│       │   └── AIDirectorService.ts  # AI导演工作流编排
│       ├── schema/                   # 数据结构
│       │   ├── AIScriptSchema.ts     # 脚本数据结构
│       │   └── AIScriptValidator.ts  # 校验器
│       └── index.ts
├── store/                            # 全局状态
│   ├── index.ts                      # Store组合入口
│   ├── useProjectStore.ts            # 项目状态（精简版）
│   ├── usePlayerStore.ts             # 播放器状态
│   └── useUIStore.ts                 # UI状态
├── components/                       # UI组件
│   ├── business/                     # 业务组件
│   ├── common/                       # 通用组件
│   └── overlays/                     # 弹窗覆盖层
├── hooks/                            # 通用Hooks
├── types/                            # 类型定义
└── utils/                            # 工具函数
```

### 二、渲染引擎升级：基于 Remotion 架构

参考 `docs/remotion-architecture-guide.md`，实现帧驱动的视频渲染管线：

1. **TimelineContext**：全局帧状态管理（frame, fps, durationInFrames, playing）
2. **SequenceContext**：时间偏移管理（支持嵌套序列）
3. **useCurrentFrame() Hook**：获取当前相对帧号
4. **interpolate()**：帧插值动画函数
5. **spring()**：弹性动画函数
6. **Puppeteer 逐帧捕获**：无头浏览器逐帧截图
7. **FFmpeg 编码**：高质量 H.264/H.265 视频输出

### 三、动画引擎升级：GSAP + Framer Motion + WebGL

#### 核心技术栈

| 技术 | 用途 | 关键特性 |
|------|------|----------|
| GSAP (+ ScrollTrigger) | JS动画引擎 | RAF驱动、GPU加速、高级Easing |
| Framer Motion / React Spring | React声明式动画 | 弹簧物理模型、声明式API |
| Three.js / R3F | 3D/WebGL效果 | GPU渲染、粒子系统、着色器 |

#### 动画质量保证原则

1. **强制 GPU 加速**：只动画化 transform (translate, scale, rotate) 和 opacity
2. **物理模拟**：使用弹簧模型（mass, tension, friction）替代线性插值
3. **非线性缓动**：power4.inOut, elastic.out, back.out 等
4. **时间同步**：requestAnimationFrame + 基于时间戳的动画计算
5. **亚像素渲染**：devicePixelRatio 适配 + antialias

### 四、模块间通信协议

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Track模块   │────>│  Clip模块   │────>│ Renderer模块  │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       v                   v                   v
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Asset模块   │<----│  Preset模块  │<----│ Template模块 │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           v
                    ┌─────────────┐
                    │ AnimationEngine│
                    └─────────────┘
```

## Impact

- **受影响的代码**：
  - `src/engine/core/Renderer.ts` → 拆分到 `modules/renderer/`
  - `src/engine/presets/` → 迁移到 `modules/preset/`
  - `src/engine/templates/` → 迁移到 `modules/template/`
  - `src/services/videoExporter.ts` → 重写为 `modules/renderer/VideoRenderer.ts`
  - `src/store/useProjectStore.ts` → 精简，拆分为各模块的 store slice
  - 所有引用上述文件的组件

- **新增依赖利用**：项目中已安装 gsap, framer-motion, @react-spring/*, three, @react-three/fiber, puppeteer, fluent-ffmpeg

- **BREAKING 变更**：
  - `RenderEngine.render()` API 将被替换为新的渲染管线
  - 预设的 `apply()` 函数签名将从 Canvas 2D Context 支持转为同时支持 Canvas 和 React 渲染
  - 导出流程从 MediaRecorder 改为 Puppeteer + FFmpeg

## ADDED Requirements

### Requirement: 模块化轨道管理系统

轨道模块 SHALL 提供：
- 轨道的增删改查（CRUD）
- 轨道类型约束（video/audio/text/effect）
- 轨道排序规则（文本→视频→音频→特效）
- 轨道可见性/锁定状态管理
- 轨道与片段的关联关系维护

#### Scenario: 创建新轨道
- **WHEN** 用户点击"添加轨道"按钮并选择类型
- **THEN** 系统创建新轨道并按类型自动排序插入正确位置

### Requirement: 模块化素材库管理系统

素材库模块 SHALL 提供：
- 素材的导入、预览、删除
- 素材元数据缓存（尺寸、时长、缩略图）
- 素材类型的分类展示
- 素材 URL 的生命周期管理（Blob URL 回收）

#### Scenario: 导入素材
- **WHEN** 用户拖拽或选择文件导入
- **THEN** 系统创建 Blob URL，提取元数据，添加到素材列表

### Requirement: 统一动画引擎

动画引擎 SHALL 提供：
- 基于 GSAP 的时间轴动画能力
- 基于 React Spring 的弹簧物理动画
- GPU 加速属性约束（仅 transform + opacity）
- 高级缓动函数库（power4, elastic, back, rough 等）
- 交错动画（stagger）支持
- 亚像素渲染支持

#### Scenario: 应用入场动画
- **WHEN** 用户为片段添加 bounceIn 预设
- **THEN** 片段以弹性物理效果进入，使用 GPU 加速属性，60fps 流畅

### Requirement: Remotion 风格视频渲染器

渲染器模块 SHALL 提供：
- TimelineContext / SequenceContext 帧驱动架构
- useCurrentFrame() / interpolate() / spring() 核心 API
- Puppeteer 无头浏览器逐帧截图
- FFmpeg H.264 编码输出
- 渲染进度回调
- 多分辨率支持（1080p / 4K）

#### Scenario: 导出视频
- **WHEN** 用户点击"导出视频"按钮
- **THEN** 系统：启动 Puppeteer → 逐帧截图 → FFmpeg 编码 → 输出 MP4 文件

### Requirement: React 模板渲染系统

模板系统 SHALL 支持：
- React 组件形式的模板定义
- 帧驱动的模板动画（useCurrentFrame）
- 参数化的模板配置
- 模板的注册与发现机制
- Canvas 2D 后备渲染（兼容旧模板）

#### Scenario: 使用文字模板
- **WHEN** 用户选择 gradientText 模板并添加到轨道
- **THEN** 模板在预览和渲染时均以帧驱动方式执行渐变动画

## MODIFIED Requirements

### Requirement: 项目状态管理（useProjectStore）

原 `useProjectStore` 包含了轨道、片段、素材、效果、模板、项目等所有状态的混合管理。

**修改为**：
- `useProjectStore` 仅保留项目级元数据（id, name, width, height, duration, fps, tracks[], clips{} 引用）
- 轨道操作委托给 `modules/track/useTrackStore`
- 素材操作委托给 `modules/asset/useAssetStore`
- 片段操作委托给 `modules/clip/ClipManager`

### Requirement: 预设系统

原预设系统基于 Canvas 2D 的 `apply(progress, params, transform, ctx)` 接口。

**修改为**：
- 新增 `AnimationEffect` 接口，支持双模式渲染（Canvas + React）
- 保留向后兼容的 Canvas 2D 渲染路径
- 新增 React/Framer Motion 渲染路径用于预览和 Puppeteer 渲染

### Requirement: 视频导出功能

原导出基于 Canvas.captureStream + MediaRecorder。

**修改为**：
- 主力方案：Puppeteer 逐帧截图 + FFmpeg 编码
- 保留 GIF 导出能力（可选用新方案优化）
- 新增渲染进度实时反馈
- 新增多格式输出支持（MP4/WebM）

## REMOVED Requirements

### Requirement: 单体 Renderer 类

**原因**：`RenderEngine` 类承担了资源管理、特效计算、模板渲染、Canvas绑定等过多职责，违反单一职责原则。

**迁移**：
- 资源加载 → `modules/asset/AssetManager`
- 特效计算 → `modules/preset/core/AnimationEngine`
- 模板渲染 → `modules/template/core/TemplateEngine`
- Canvas/DOM 渲染 → `modules/renderer/core/`
