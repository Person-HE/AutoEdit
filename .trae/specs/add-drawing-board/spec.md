# 画板模块 (Drawing Board Module) 规格文档

## Why

用户需要一个内置的画板工具来创建自定义图形和动画内容。该功能应该类似于 d:\project\webcreate 项目中的 CanvasBoard 实现，支持多种绘图工具（画笔、橡皮擦、矩形、椭圆、菱形、直线、箭头、选择、填充、文字、图片），支持逐帧动画，能够导出图片/视频，并自动添加到素材库中。

## What Changes

### 新增功能
1. **画板模块UI** - 在素材库中添加画板Tab，提供完整的绘图界面
2. **绘图工具集** - 支持画笔、橡皮擦、矩形、椭圆、菱形、直线、箭头、选择、填充、文字、图片等工具
3. **图层系统** - 支持多层图层管理，每层可包含多个元素
4. **逐帧动画** - 支持创建多帧动画，每帧独立编辑
5. **导出功能** - 支持导出单帧图片和逐帧视频（MP4格式）
6. **素材库集成** - 导出的内容自动保存到素材库对应文件夹

### 架构设计
- **DrawingCanvas** - 核心Canvas组件，处理所有绘图操作
- **DrawingToolbar** - 工具栏组件，提供绘图工具选择
- **LayerPanel** - 图层面板，管理图层
- **FramePanel** - 帧面板，管理动画帧
- **DrawingExporter** - 导出器，处理图片/视频导出
- **assetService集成** - 与现有素材服务集成

### 画布规格
- 画布尺寸：1920x1080 (16:9)
- 内容居中：导出时自动将内容居中到画布中心

## Impact

### 受影响的文件
- `src/components/business/DrawingBoard.tsx` - 新增画板主组件
- `src/components/business/AssetPanel.tsx` - 添加画板Tab入口
- `src/services/assetService.ts` - 扩展导出保存功能
- `src/types/core.ts` - 添加画板相关类型定义
- `src/engine/utils/drawingExporter.ts` - 新增导出工具

## ADDED Requirements

### Requirement: 画板模块入口
The system SHALL provide a drawing board tab in the asset panel.

#### Scenario: 打开画板
- **GIVEN** 用户在素材库面板
- **WHEN** 点击"画板"标签页
- **THEN** 显示完整的画板界面，包含工具栏、画布、图层和帧面板

### Requirement: 绘图工具
The system SHALL provide various drawing tools.

#### Scenario: 画笔工具
- **GIVEN** 用户选择画笔工具
- **WHEN** 在画布上拖动绘制
- **THEN** 画出平滑的自由线条，支持颜色、大小、透明度设置

#### Scenario: 形状工具
- **GIVEN** 用户选择矩形/椭圆/菱形/直线/箭头工具
- **WHEN** 在画布上拖动绘制
- **THEN** 画出对应的几何形状，支持填充样式和描边样式

#### Scenario: 橡皮擦工具
- **GIVEN** 用户选择橡皮擦工具
- **WHEN** 在画布上擦除内容
- **THEN** 擦除所经过的绘制内容

#### Scenario: 文字工具
- **GIVEN** 用户选择文字工具
- **WHEN** 点击画布输入文字
- **THEN** 在指定位置添加可编辑的文字

#### Scenario: 图片工具
- **GIVEN** 用户选择图片工具
- **WHEN** 上传本地图片
- **THEN** 图片被添加到画布指定位置

### Requirement: 图层系统
The system SHALL provide layer management.

#### Scenario: 创建图层
- **GIVEN** 用户点击新建图层
- **THEN** 创建新图层并自动设为当前图层

#### Scenario: 切换图层
- **GIVEN** 用户点击不同图层
- **THEN** 切换当前编辑图层，显示该图层内容

### Requirement: 逐帧动画
The system SHALL provide frame-by-frame animation.

#### Scenario: 创建帧
- **WHEN** 用户点击添加帧
- **THEN** 创建新帧，复制当前帧内容

#### Scenario: 播放动画
- **WHEN** 用户点击播放按钮
- **THEN** 按设定帧率播放所有帧

### Requirement: 导出图片
The system SHALL export drawings as images.

#### Scenario: 导出当前帧
- **WHEN** 用户点击"导出图片"
- **THEN** 将当前帧内容导出为PNG图片，自动居中到1920x1080画布，保存到素材库

### Requirement: 导出视频
The system SHALL export drawings as video.

#### Scenario: 导出动画视频
- **WHEN** 用户点击"导出视频"
- **THEN** 将所有帧按顺序合成为MP4视频，自动居中内容，保存到素材库

### Requirement: 内容居中
The system SHALL ensure exported content is centered.

#### Scenario: 导出居中
- **WHEN** 导出图片或视频时
- **THEN** 计算绘制内容的边界框，将内容居中放置在1920x1080画布中心

## MODIFIED Requirements

### Requirement: AssetPanel扩展
**Current**: AssetPanel支持本地文件、AI生成、SVG转换
**Modified**: 新增画板Tab，提供完整绘图和动画功能

```typescript
// ActiveTab类型扩展
type AssetTab = 'local' | 'text' | 'effects' | 'ai' | 'drawing';
```

## REMOVED Requirements

None

