# Checklist - 模块化架构重构与渲染引擎升级

## 阶段一：基础设施与核心模块

- [ ] 模块目录结构完整创建，包含所有子目录（track, asset, clip, preset, template, renderer, ai-director）
- [ ] 各模块 index.ts 导出文件正确配置
- [ ] 共享类型定义 `modules/shared/types.ts` 创建完成
- [ ] TrackManager 实现完整的 CRUD、排序、可见性/锁定管理
- [ ] useTrackStore 正确从 useProjectStore 分离轨道逻辑
- [ ] AssetManager 实现素材加载、缓存、元数据提取、Blob URL 生命周期管理
- [ ] useAssetStore 正确分离素材状态管理
- [ ] ClipManager 实现片段生命周期和变换/效果管理

## 阶段二：动画引擎

- [ ] EasingLibrary 包含 Power/Elastic/Back/Bounce/Rough/Stepped 系列缓动函数
- [ ] SpringPhysics 支持质量/张力/摩擦力参数的弹簧物理计算
- [ ] GPURenderer 强制约束 transform + opacity 属性，有性能警告机制
- [ ] TimelineDriver 基于 RAF 和时间戳实现高帧率驱动
- [ ] AnimationEngine 统一调度器整合所有动画子模块
- [ ] PresetRegistry 支持动态注册/注销和分类查询
- [ ] 所有现有预设成功迁移到新架构并保持向后兼容

## 阶段三：模板引擎

- [ ] TemplateContext 提供 useTemplateFrame() 和 useTemplateParams()
- [ ] TemplateEngine 支持 React 组件和 Canvas 2D 双模式渲染
- [ ] TemplateRenderer 正确适配两种渲染路径
- [ ] TemplateRegistry 支持模板注册与发现
- [ ] 所有现有模板迁移到新架构

## 阶段四：视频渲染引擎

- [ ] TimelineContext 提供帧号/帧率/时长/播放状态管理
- [ ] SequenceContext 正确处理时间偏移和嵌套序列
- [ ] CompositionManager 管理作品注册
- [ ] RenderContext 提供全局渲染配置
- [ ] useCurrentFrame Hook 正确返回相对帧号（考虑 Sequence 偏移）
- [ ] useVideoConfig Hook 返回 fps/durationInFrames
- [ ] useInterpolate Hook 实现帧插值动画
- [ ] useSpring Hook 实现弹性动画
- [ ] useDelayRender Hook 处理异步资源加载等待
- [ ] AbsoluteFill 组件正确全屏绝对定位
- [ ] Sequence 组件正确时间偏移和可见性判断
- [ ] Composition 组件正确注册作品
- [ ] VideoFrame 组件输出单帧画面
- [ ] interpolate 函数支持 clamp/extend/easing 选项
- [ ] spring 函数支持 damping/stiffness/mass 配置
- [ ] easings 包含 linear/easeIn/easeOut/easeInOut 等
- [ ] stagger 工具支持交错延迟配置
- [ ] BrowserLauncher 成功启动无头浏览器并管理生命周期
- [ ] FrameDriver 正确注入帧号到 window 对象
- [ ] FrameCapture 逐帧截图并存储到临时目录
- [ ] FFmpegEncoder 支持 H.264 编码和分辨率/码率配置
- [ ] EncodePipeline 正确编排图片序列到视频编码流程
- [ ] VideoRenderer 入口完整编排 Puppeteer → FrameCapture → FFmpeg 流程
- [ ] Player 预览播放器基于 RAF 实现实时播放
- [ ] PlayerControls 提供播放/暂停/跳转控制
- [ ] PlayerTimeline 可视化播放进度

## 阶段五：集成与迁移

- [ ] useProjectStore 精简为仅保留项目元数据
- [ ] store/index.ts 正确组合所有 store slice
- [ ] 所有业务组件引用更新为新模块路径
- [ ] ExportModal 使用新的 VideoRenderer 替代旧 VideoExporter
- [ ] 导出 UI 支持格式/分辨率/编码参数选择
- [ ] 渲染进度实时反馈正常工作
- [ ] PreviewPlayer 集成新 Player 组件
- [ ] Timeline 与 TimelineContext 同步
- [ ] 预览模式下预设效果正确展示
- [ ] 预览模式下模板效果正确展示
- [ ] 旧废弃代码已标记或删除
- [ ] 无残留的旧路径引用导致编译错误
