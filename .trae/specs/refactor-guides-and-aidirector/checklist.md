# Checklist - 开发指南重构与AI导演模块适配

## 阶段一：AI导演模块迁移

- [x] AIService.ts 包含完整的4次调用链（analyzeUserInput/generateImagePrompts/generateShotData/processTextContent）
- [x] AIService 支持配置外部化（endpoint/apiKey/model 通过构造函数注入）+ 多提供商架构
- [x] AIDirectorService.generateFromInput() 完整实现5阶段流程
- [x] AIDirectorService 使用 ProjectAdapter 操作数据（非直接 useProjectStore）
- [x] systemPrompts.ts 集中管理所有4个系统提示词
- [x] promptTemplates.ts 可动态生成预设列表和布局列表文本
- [x] ProjectAdapter 提供添加片段/素材到项目的适配方法
- [x] AI导演模块 index.ts 正确导出所有公开API

## 阶段二：开发指南更新

- [x] TEMPLATE_DEVELOPMENT_GUIDE.md 所有路径指向 modules/template/
- [x] TEMPLATE_DEVELOPMENT_GUIDE.md TemplateEngine/TemplateRegistry API 文档完整
- [x] TEMPLATE_DEVELOPMENT_GUIDE.md 模板分类列表完整（50+）
- [x] PRESET_DEVELOPMENT_GUIDE.md 所有路径指向 modules/preset/
- [x] PRESET_DEVELOPMENT_GUIDE.md PresetRegistry API 文档完整
- [x] PRESET_DEVELOPMENT_GUIDE.md 预设完整列表84个（7大分类）
- [x] PRESET_DEVELOPMENT_GUIDE.md 动画引擎核心文档（EasingLibrary/SpringPhysics/AnimationEngine/GPURenderer/TimelineDriver）
- [x] AI_DIRECTOR_DEVELOPMENT_GUIDE.md 架构图反映新模块化结构
- [x] AI_DIRECTOR_DEVELOPMENT_GUIDE.md 代码示例使用新模块API（aiService/projectAdapter）
- [x] AI_DIRECTOR_DEVELOPMENT_GUIDE.md Store API 参考包含 useTrackStore/useAssetStore
- [x] AI_DIRECTOR_DEVELOPMENT_GUIDE.md 新增渲染导出流程章节

## 阶段三：集成与清理

- [x] AIDirectorPanel.tsx 导入路径更新为 modules/ai-director
- [x] 旧 aiService.ts 标记 @deprecated 并 re-export
- [x] 旧 aiDirectorService.ts 标记 @deprecated 并 re-export
- [x] TypeScript 编译零错误（新增/修改的模块代码，仅测试文件缺@types/jest预存问题）
