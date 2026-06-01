# 模板系统开发任务列表

## Task 1: 创建模板类型定义系统
- [x] SubTask 1.1: 创建 `src/engine/templates/types.ts` 文件
  - 定义 TemplateDefinition 接口
  - 定义 TemplateParamSchema 接口
  - 定义 TemplateCategory 类型
  - 定义 TemplateRenderContext 接口

## Task 2: 创建模板注册和管理系统
- [x] SubTask 2.1: 创建 `src/engine/templates/index.ts` 文件
  - 实现模板注册表 TEMPLATES
  - 实现 registerTemplate 函数
  - 实现 getTemplatesByCategory 函数
  - 实现 getTemplateCategories 函数

## Task 3: 实现键盘按键悬浮特写模板
- [x] SubTask 3.1: 创建 `src/engine/templates/keyboardFloat.ts` 文件
  - 实现键盘按键解析逻辑（支持组合键如 Ctrl+C）
  - 实现3D按键渲染（使用 Canvas）
  - 实现按键按下发光动画效果
  - 定义参数配置（快捷键、按键大小、颜色、发光颜色等）
- [x] SubTask 3.2: 在 `src/engine/templates/index.ts` 中注册模板

## Task 4: 实现代码执行流高亮模板
- [x] SubTask 4.1: 创建 `src/engine/templates/codeExecution.ts` 文件
  - 实现代码解析和高亮显示
  - 实现当前执行行高亮动画
  - 实现箭头跳转到当前行动画
  - 实现变量值气泡提示框
  - 定义参数配置（代码内容、执行序列、高亮颜色等）
- [x] SubTask 4.2: 在 `src/engine/templates/index.ts` 中注册模板

## Task 5: 扩展核心类型支持模板
- [x] SubTask 5.1: 修改 `src/types/core.ts`
  - 扩展 Clip 类型，添加 'template' 到 type 联合类型
  - 添加 templateData 字段到 Clip 接口

## Task 6: 集成模板渲染到渲染引擎
- [x] SubTask 6.1: 修改 `src/engine/core/Renderer.ts`
  - 导入模板系统
  - 在 render 方法中添加对 template 类型 Clip 的处理
  - 调用模板的 render 方法进行渲染

## Task 7: 添加模板相关 Store 操作
- [x] SubTask 7.1: 修改 `src/store/useProjectStore.ts`
  - 添加 addTemplateClip 方法
  - 添加 updateTemplateParams 方法
  - 确保模板片段可以正常添加、删除、移动

## Task 8: 在素材面板添加模板库UI
- [x] SubTask 8.1: 修改 `src/components/business/AssetPanel.tsx`
  - 添加 "模板" Tab
  - 显示可用模板列表（按分类）
  - 支持拖拽模板到时间轴
  - 点击模板直接添加到选中轨道

## Task 9: 在属性面板添加模板属性编辑
- [x] SubTask 9.1: 修改 `src/components/business/PropertiesPanel.tsx`
  - 添加对 template 类型 Clip 的支持
  - 根据模板定义动态生成参数编辑UI
  - 支持文本、数字、颜色、布尔等参数类型
  - 实时更新预览

## Task 10: 在时间轴支持模板片段显示
- [x] SubTask 10.1: 修改 `src/components/business/Timeline.tsx`
  - 更新 ClipItem 组件，支持 template 类型显示
  - 添加模板片段的视觉样式（区别于普通素材）

## Task 11: 创建模板开发文档
- [x] SubTask 11.1: 创建 `TEMPLATE_DEVELOPMENT_GUIDE.md`
  - 模板系统架构介绍
  - TemplateDefinition 接口详解
  - 参数配置说明
  - 创建新模板的步骤
  - 模板渲染函数编写指南
  - 示例模板代码
  - 最佳实践和注意事项

# Task Dependencies
- Task 3 依赖 Task 1, Task 2
- Task 4 依赖 Task 1, Task 2
- Task 6 依赖 Task 3, Task 4, Task 5
- Task 7 依赖 Task 5
- Task 8 依赖 Task 2, Task 7
- Task 9 依赖 Task 2, Task 7
- Task 10 依赖 Task 5
