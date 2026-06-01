# Tasks - 模块化架构重构与渲染引擎升级

## 阶段一：基础设施与核心模块

- [x] Task 1: 创建模块目录结构与基础类型定义
  - [x] 1.1 创建 `src/modules/` 目录及子目录结构（track, asset, clip, preset, template, renderer, ai-director）
  - [x] 1.2 创建各模块的 `index.ts` 导出文件
  - [x] 1.3 定义模块间共享的核心类型（`modules/shared/types.ts`）

- [x] Task 2: 实现轨道模块 (Track Module)
  - [x] 2.1 创建 `modules/track/TrackTypes.ts`：轨道类型、常量、排序规则
  - [x] 2.2 创建 `modules/track/TrackManager.ts`：轨道 CRUD、排序、可见性/锁定管理
  - [x] 2.3 创建 `modules/track/useTrackStore.ts`：轨道状态（Zustand slice）
  - [x] 2.4 从 `useProjectStore.ts` 中迁移轨道相关逻辑到 Track 模块

- [x] Task 3: 实现素材库模块 (Asset Module)
  - [x] 3.1 创建 `modules/asset/AssetTypes.ts`：素材类型定义
  - [x] 3.2 创建 `modules/asset/AssetManager.ts`：素材加载、缓存、元数据提取、Blob URL 管理
  - [x] 3.3 创建 `modules/asset/useAssetStore.ts`：素材状态（Zustand slice）
  - [x] 3.4 从 `useProjectStore.ts` 和 `assetService.ts` 迁移素材相关逻辑

- [x] Task 4: 实现片段模块 (Clip Module)
  - [x] 4.1 创建 `modules/clip/ClipTypes.ts`：片段类型扩展定义
  - [x] 4.2 创建 `modules/clip/ClipManager.ts`：片段生命周期、变换计算、效果应用
  - [x] 4.3 从 `useProjectStore.ts` 迁移片段 CRUD 和效果管理逻辑

## 阶段二：动画引擎升级

- [x] Task 5: 构建动画引擎核心
  - [x] 5.1 创建 `modules/preset/core/EasingLibrary.ts`：GSAP风格缓动函数库
    - Power 系列 (power0~power4, in/out/inOut)
    - Elastic 系列 (elastic, elastic.out, elastic.inOut)
    - Back 系列 (back, back.out, back.inOut)
    - Bounce, Rough, Stepped 等
  - [x] 5.2 创建 `modules/preset/core/SpringPhysics.ts`：弹簧物理模型
    - 基于 React Spring 的弹簧公式实现
    - 支持 mass, tension, friction, damping 配置
  - [x] 5.3 创建 `modules/preset/core/GPURenderer.ts`：GPU加速约束检查器
    - 强制 transform + opacity 属性约束
    - will-change 提示管理
    - 性能警告日志
  - [x] 5.4 创建 `modules/preset/core/TimelineDriver.ts`：RAF 时间轴驱动器
    - requestAnimationFrame 封装
    - 基于时间戳的帧计算（补偿卡顿）
    - 高帧率支持（60fps / 120fps / 144Hz）
  - [x] 5.5 创建 `modules/preset/core/AnimationEngine.ts`：统一动画调度器
    - 整合 Easing + Spring + GPU 约束 + Timeline
    - 提供统一的 animate() API

- [x] Task 6: 升级预设系统架构
  - [x] 6.1 重构预设类型定义 `modules/preset/PresetTypes.ts`
    - 新增 AnimationEffect 接口（双模式：Canvas + React）
    - 定义 EffectRenderMode 枚举
  - [x] 6.2 创建 `modules/preset/PresetRegistry.ts`：预设注册表
    - 支持动态注册/注销
    - 分类索引查询
  - [x] 6.3 迁移现有预设文件到新架构（保持向后兼容）
    - 入场预设 (entrance/) → 包装为新的 PresetDefinition 格式
    - 出场预设 (exit/)
    - 强调预设 (emphasis/)
    - 运动预设 (motion/)
    - 特效预设 (fx/)
    - 转场预设 (transition/)
    - 文字预设 (text/)

## 阶段三：模板引擎升级

- [x] Task 7: 构建模板引擎核心
  - [x] 7.1 创建 `modules/template/core/TemplateContext.tsx`：模板渲染上下文（React）
    - 提供 useTemplateFrame() 获取当前模板帧
    - 提供 useTemplateParams() 获取模板参数
  - [x] 7.2 创建 `modules/template/core/TemplateEngine.ts`：模板渲染引擎
    - 支持React组件模板和Canvas 2D模板
    - 帧驱动渲染适配
  - [x] 7.3 创建 `modules/template/core/TemplateRenderer.ts`：模板渲染适配层
    - Canvas 2D 后备渲染路径
    - React 渲染路径（用于预览和 Puppeteer）
  - [x] 7.4 创建 `modules/template/core/TemplateRegistry.ts`：模板注册表
  - [x] 7.5 迁移现有模板到新架构，分类整理

## 阶段四：视频渲染引擎（Remotion 架构）

- [x] Task 8: 实现 Remotion 风格核心上下文与 Hooks
  - [x] 8.1 创建 `modules/renderer/core/TimelineContext.tsx`
    - frame, setFrame, fps, durationInFrames, playing, setPlaying
    - TimelineProvider 组件
  - [x] 8.2 创建 `modules/renderer/core/SequenceContext.tsx`
    - cumulatedFrom, relativeFrom, durationInFields
    - Sequence 组件（时间偏移 + 可见性判断）
  - [x] 8.3 创建 `modules/renderer/core/CompositionManager.ts`：作品注册管理
  - [x] 8.4 创建 `modules/renderer/core/RenderContext.tsx`：全局渲染配置（分辨率、背景色等）
  - [x] 8.5 创建 `modules/renderer/hooks/useCurrentFrame.ts`
  - [x] 8.6 创建 `modules/renderer/hooks/useVideoConfig.ts`
  - [x] 8.7 创建 `modules/renderer/hooks/useInterpolate.ts`
  - [x] 8.8 创建 `modules/renderer/hooks/useSpring.ts`
  - [x] 8.9 创建 `modules/renderer/hooks/useDelayRender.ts`

- [x] Task 9: 实现渲染组件与动画工具
  - [x] 9.1 创建 `modules/renderer/components/AbsoluteFill.tsx`
  - [x] 9.2 创建 `modules/renderer/components/Sequence.tsx`
  - [x] 9.3 创建 `modules/renderer/components/Composition.tsx`
  - [x] 9.4 创建 `modules/renderer/components/VideoFrame.tsx`：单帧输出组件
  - [x] 9.5 创建 `modules/renderer/animation/interpolate.ts`：插值函数
  - [x] 9.6 创建 `modules/renderer/animation/spring.ts`：弹簧动画
  - [x] 9.7 创建 `modules/renderer/animation/easings.ts`：缓动函数集合
  - [x] 9.8 创建 `modules/renderer/animation/stagger.ts`：交错动画工具

- [x] Task 10: 实现 Puppeteer 渲染后端
  - [x] 10.1 创建 `modules/renderer/puppeteer/BrowserLauncher.ts`：浏览器启动与管理
  - [x] 10.2 创建 `modules/renderer/puppeteer/FrameDriver.ts`：帧驱动注入（window.__currentFrame）
  - [x] 10.3 创建 `modules/renderer/puppeteer/FrameCapture.ts`：逐帧截图与临时文件管理

- [x] Task 11: 实现 FFmpeg 编码流水线
  - [x] 11.1 创建 `modules/renderer/encoder/FFmpegEncoder.ts`：FFmpeg 封装
    - H.264 / H.265 编码
    - 分辨率、码率、CRF 配置
  - [x] 11.2 创建 `modules/renderer/encoder/EncodePipeline.ts`：编码流水线编排
    - 图片序列 → 视频文件
    - 音轨合成
    - 进度回调

- [x] Task 12: 实现视频渲染入口与预览播放器
  - [x] 12.1 创建 `modules/renderer/VideoRenderer.ts`：渲染主入口
    - 编排 Puppeteer 启动 → 帧捕获 → FFmpeg 编码 全流程
    - RenderOptions 接口定义
    - 错误处理与资源清理
  - [x] 12.2 创建 `modules/renderer/preview/Player.tsx`：实时预览播放器（RAF驱动）
  - [x] 12.3 创建 `modules/renderer/preview/PlayerControls.tsx`：播放控制UI
  - [x] 12.4 创建 `modules/renderer/preview/PlayerTimeline.tsx`：播放时间轴

## 阶段五：集成与迁移

- [x] Task 13: 重构全局状态管理层
  - [x] 13.1 精简 `useProjectStore.ts`：仅保留项目元数据和 clips/tracks 引用
  - [x] 13.2 创建 `store/index.ts`：组合所有 store slice（已存在且完整）
  - [x] 13.3 更新所有组件引用新的模块化导入路径

- [x] Task 14: 替换视频导出功能
  - [x] 14.1 修改 `ExportModal.tsx`：使用新的 VideoRenderer 替代旧的 VideoExporter
  - [x] 14.2 更新导出 UI：新增格式选择、分辨率选择、编码参数
  - [x] 14.3 实现渲染进度实时显示

- [x] Task 15: 更新预览播放器集成
  - [x] 15.1 修改 `PreviewPlayer.tsx`：集成新的 Player 组件
  - [x] 15.2 确保 Timeline 组件与新的 TimelineContext 同步
  - [ ] 15.3 测试预览模式下的预设/模板效果展示

- [x] Task 16: 清理旧代码与文档
  - [x] 16.1 标记废弃旧文件（`engine/core/Renderer.ts`, `services/videoExporter.ts`）
  - [x] 16.2 更新内部引用到新模块路径
  - [ ] 16.3 删除已完全迁移的旧文件

# Task Dependencies

- [Task 2, 3, 4] 并行执行，依赖 [Task 1]
- [Task 5] 依赖 [Task 1]
- [Task 6] 依赖 [Task 5]
- [Task 7] 可与 [Task 6] 并行执行
- [Task 8] 依赖 [Task 1]
- [Task 9] 依赖 [Task 8]
- [Task 10] 依赖 [Task 8, 9]
- [Task 11] 依赖 [Task 10]
- [Task 12] 依赖 [Task 9, 11]
- [Task 13] 依赖 [Task 2, 3, 4]
- [Task 14] 依赖 [Task 12, 13]
- [Task 15] 依赖 [Task 12, 13]
- [Task 16] 依赖 [Task 14, 15]
