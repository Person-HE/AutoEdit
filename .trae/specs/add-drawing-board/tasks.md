# Tasks

- [x] Task 1: 创建画板模块类型定义 - 在 src/types/core.ts 中添加画板相关类型定义
  - [x] Task 1.1: 添加 DrawingTool, DrawingElement, DrawingLayer, DrawingFrame 类型
  - [x] Task 1.2: 扩展 AssetPanel activeTab 类型支持 'drawing'

- [x] Task 2: 创建画板核心组件 - 创建 DrawingBoard 主组件
  - [x] Task 2.1: 创建 src/components/business/DrawingBoard.tsx 主组件框架
  - [x] Task 2.2: 实现Canvas画布组件，支持1920x1080尺寸
  - [x] Task 2.3: 实现工具栏组件，支持各种绘图工具

- [x] Task 3: 实现绘图工具功能
  - [x] Task 3.1: 实现画笔工具（free draw）
  - [x] Task 3.2: 实现橡皮擦工具
  - [x] Task 3.3: 实现形状工具（矩形、椭圆、菱形、直线、箭头）
  - [x] Task 3.4: 实现选择工具（移动、缩放）
  - [x] Task 3.5: 实现文字工具
  - [x] Task 3.6: 实现图片工具

- [x] Task 4: 实现图层系统
  - [x] Task 4.1: 创建 LayerPanel 图层面板组件
  - [x] Task 4.2: 实现图层创建、删除、切换功能
  - [x] Task 4.3: 实现图层可见性、锁定、透明度控制

- [x] Task 5: 实现逐帧动画系统
  - [x] Task 5.1: 创建 FramePanel 帧面板组件
  - [x] Task 5.2: 实现帧的创建、删除、复制功能
  - [x] Task 5.3: 实现动画预览播放功能
  - [x] Task 5.4: 实现帧率设置

- [x] Task 6: 实现导出功能
  - [x] Task 6.1: 创建 drawingExporter.ts 导出工具
  - [x] Task 6.2: 实现内容居中计算逻辑
  - [x] Task 6.3: 实现PNG图片导出
  - [x] Task 6.4: 实现MP4视频导出（使用MediaRecorder）

- [x] Task 7: 集成到素材库
  - [x] Task 7.1: 扩展 assetService 添加画板导出保存功能
  - [x] Task 7.2: 在 AssetPanel 中添加画板Tab入口
  - [x] Task 7.3: 实现导出后自动添加到素材库

- [x] Task 8: UI优化和适配
  - [x] Task 8.1: 确保画板界面在面板中正常显示
  - [x] Task 8.2: 添加颜色选择器支持
  - [x] Task 8.3: 添加笔刷大小/透明度设置

# Task Dependencies

- Task 1.2 依赖 Task 1.1
- Task 2.1 依赖 Task 1
- Task 2.2 依赖 Task 2.1
- Task 2.3 依赖 Task 2.1
- Task 3 依赖 Task 2
- Task 4 依赖 Task 2
- Task 5 依赖 Task 2
- Task 6 依赖 Task 3, Task 4, Task 5
- Task 7.1 依赖 Task 6
- Task 7.2 依赖 Task 7.1
- Task 7.3 依赖 Task 7.2
- Task 8 依赖 Task 7

