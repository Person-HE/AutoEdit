# 模板系统 (Template System) 规格文档

## Why

用户需要一种方式来创建完整的、可复用的视频片段效果，而不仅仅是单一的动画预设。模板系统允许用户通过配置参数（如代码、文字、快捷键等）快速生成复杂的视频效果片段，如键盘按键悬浮特写、代码执行流高亮等。这些模板应该像普通素材一样可以拖放到时间轴、预览和导出。

## What Changes

### 新增功能
1. **模板定义系统** - 创建与预设类似但功能更强大的模板架构
2. **键盘按键悬浮特写模板** - 展示快捷键输入的3D键盘动画效果
3. **代码执行流高亮模板** - 代码逐行执行高亮、变量值气泡提示效果
4. **模板注册机制** - 支持动态注册新模板，便于扩展
5. **模板属性面板** - 支持在属性面板中编辑模板参数
6. **模板渲染引擎集成** - 模板能够正常预览和导出

### 架构设计
- **TemplateDefinition** - 模板定义接口，包含渲染逻辑和参数配置
- **TemplateRegistry** - 模板注册表，管理所有可用模板
- **TemplateRenderer** - 模板渲染器，集成到现有渲染引擎
- **TemplatePropertyPanel** - 模板属性面板，支持参数编辑

## Impact

### 受影响的文件
- `src/engine/templates/types.ts` - 新增模板类型定义
- `src/engine/templates/index.ts` - 模板注册和管理
- `src/engine/templates/keyboardFloat.ts` - 键盘按键悬浮模板
- `src/engine/templates/codeExecution.ts` - 代码执行流模板
- `src/engine/core/Renderer.ts` - 集成模板渲染
- `src/types/core.ts` - 扩展 Clip 类型支持模板
- `src/store/useProjectStore.ts` - 添加模板相关操作
- `src/components/business/AssetPanel.tsx` - 添加模板库UI
- `src/components/business/PropertiesPanel.tsx` - 添加模板属性编辑
- `src/components/business/Timeline.tsx` - 支持模板片段显示
- `TEMPLATE_DEVELOPMENT_GUIDE.md` - 模板开发文档

## ADDED Requirements

### Requirement: 模板系统架构
The system SHALL provide a template system that allows users to create reusable video effect clips.

#### Scenario: 模板定义
- **GIVEN** 开发者需要创建新模板
- **WHEN** 按照 TemplateDefinition 接口定义模板
- **THEN** 模板可以被注册并在系统中使用

#### Scenario: 模板注册
- **GIVEN** 有新模板需要添加到系统
- **WHEN** 调用 registerTemplate 函数
- **THEN** 模板出现在模板库中，可以被用户选择

### Requirement: 键盘按键悬浮特写模板
The system SHALL provide a keyboard key float template that displays 3D keyboard key animations.

#### Scenario: 配置快捷键
- **GIVEN** 用户选择了键盘按键模板
- **WHEN** 在属性面板输入快捷键组合（如 "Ctrl+C"）
- **THEN** 预览和导出时显示对应的3D按键按下发光动画

#### Scenario: 自定义样式
- **GIVEN** 用户使用键盘按键模板
- **WHEN** 调整按键大小、颜色、发光颜色等参数
- **THEN** 预览实时更新显示效果

### Requirement: 代码执行流高亮模板
The system SHALL provide a code execution flow highlight template.

#### Scenario: 代码高亮
- **GIVEN** 用户选择了代码执行模板
- **WHEN** 输入代码内容和执行行序列
- **THEN** 预览时逐行高亮显示代码执行过程

#### Scenario: 变量气泡提示
- **GIVEN** 代码执行到某一行
- **WHEN** 该行有变量值变化
- **THEN** 在变量旁显示气泡提示框展示新值

### Requirement: 模板渲染集成
The system SHALL integrate template rendering into the existing render engine.

#### Scenario: 预览模板
- **GIVEN** 用户在时间轴添加了模板片段
- **WHEN** 播放头移动到模板片段时间范围
- **THEN** 预览窗口正确显示模板渲染效果

#### Scenario: 导出模板
- **GIVEN** 项目包含模板片段
- **WHEN** 用户导出视频
- **THEN** 导出的视频包含正确的模板渲染效果

### Requirement: 模板开发文档
The system SHALL provide comprehensive documentation for template development.

#### Scenario: 开发新模板
- **GIVEN** 开发者需要创建自定义模板
- **WHEN** 阅读 TEMPLATE_DEVELOPMENT_GUIDE.md
- **THEN** 开发者能够按照文档创建并注册新模板

## MODIFIED Requirements

### Requirement: Clip 类型扩展
**Current**: Clip 支持 video, image, audio, text 类型
**Modified**: Clip 新增 template 类型，支持模板片段

```typescript
export interface Clip {
  // ... existing fields
  type: 'video' | 'image' | 'audio' | 'text' | 'template';
  templateData?: {
    templateId: string;
    params: Record<string, any>;
  };
}
```

## REMOVED Requirements

None
