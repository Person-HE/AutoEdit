# Tasks - 开发指南重构与AI导演模块适配

## 阶段一：AI导演模块迁移（核心）

- [x] Task 1: 重写 AIService.ts - 迁移真实实现到新架构
  - [x] 1.1 从 `src/services/aiService.ts` 迁移完整逻辑到 `modules/ai-director/services/AIService.ts`
  - [x] 1.2 增强为支持多提供商的 AIProvider 接口
  - [x] 1.3 配置外部化：AIServiceConfig 支持 endpoint/apiKey/model 注入
  - [x] 1.4 添加错误重试和响应缓存机制
  - [x] 1.5 导出完整的4次调用链 API

- [x] Task 2: 重写 AIDirectorService.ts - 使用新模块操作数据
  - [x] 2.1 从 `src/services/aiDirectorService.ts` 迁移完整逻辑
  - [x] 2.2 将 useProjectStore 直接调用改为使用 ClipManager/TrackManager/AssetManager
  - [x] 2.3 addShotToProject() 方法改用新模块API添加片段
  - [x] 2.4 保持 AIDirectorProgress 回调接口不变
  - [x] 2.5 保持 generateFromInput() 和 generateAIVideo() 公开接口不变

- [x] Task 3: 创建AI提示词管理模块
  - [x] 3.1 创建 `modules/ai-director/prompts/systemPrompts.ts`：集中管理所有系统提示词
  - [x] 3.2 创建 `modules/ai-director/prompts/promptTemplates.ts`：提示词模板工具

- [x] Task 4: 创建 Store 适配层
  - [x] 4.1 创建 `modules/ai-director/adapters/ProjectAdapter.ts`
  - [x] 4.2 实现 addClipToProject(clipData)
  - [x] 4.3 实现 addAssetsToProject(assets)
  - [x] 4.4 实现 getProjectState()
  - [x] 4.5 确保向后兼容

## 阶段二：更新开发指南

- [x] Task 5: 重构 TEMPLATE_DEVELOPMENT_GUIDE.md
- [x] Task 6: 重构 PRESET_DEVELOPMENT_GUIDE.md
- [x] Task 7: 重构 AI_DIRECTOR_DEVELOPMENT_GUIDE.md

## 阶段三：集成与清理

- [x] Task 8: 更新 AIDirectorPanel 引用
  - [x] 8.1 修改 import 路径从 `../../services/aiDirectorService` 到 `../../modules/ai-director`
  - [x] 8.2 验证所有功能正常（AI输入→生成→添加到轨道）

- [x] Task 9: 标记废弃旧文件
  - [x] 9.1 `src/services/aiService.ts` 添加 @deprecated 标签 + re-export
  - [x] 9.2 `src/services/aiDirectorService.ts` 添加 @deprecated 标签 + re-export
  - [x] 9.3 更新 `modules/ai-director/index.ts` 导出所有公开API

- [x] Task 10: TypeScript 验证
  - [x] 10.1 运行 tsc --noEmit 确保零错误（仅测试文件缺 @types/jest，预存问题）
  - [x] 10.2 所有新增模块代码零 TypeScript 错误

# Task Dependencies
- [Task 2] depends on [Task 1, 4]
- [Task 3] depends on [Task 1]
- [Task 5, 6, 7] 可并行执行，依赖 [Task 1, 2]
- [Task 8] depends on [Task 2]
- [Task 9] depends on [Task 1, 2, 8]
- [Task 10] depends on 所有其他任务
