# 开发指南重构与AI导演模块适配 Spec

## Why

当前项目存在以下问题：
1. **三份开发指南（TEMPLATE/PRESET/AI_DIRECTOR）仍引用旧架构路径**，如 `src/engine/presets/`、`src/engine/templates/`、`src/types/core.ts` 等，与新的模块化架构 `src/modules/preset/`、`src/modules/template/` 不一致
2. **AI导演模块是空壳骨架**：`modules/ai-director/` 下的 AIService/AIDirectorService 只是占位实现，真正的业务逻辑仍在旧位置 `src/services/aiService.ts` 和 `src/services/aiDirectorService.ts`
3. **新旧代码重复**：两套 AI 服务并存，AIDirectorPanel.tsx 仍然引用旧的 `src/services/aiDirectorService.ts`
4. **开发指南内容过时**：预设列表只有70个（实际已有84+），模板API描述不匹配新接口

## What Changes

### 一、重构三份开发指南

将所有路径引用更新为新模块化架构：

| 旧路径 | 新路径 |
|--------|--------|
| `src/engine/presets/` | `src/modules/preset/` |
| `src/engine/templates/` | `src/modules/template/` |
| `src/types/core.ts` | `src/modules/shared/types.ts` |
| `src/store/useProjectStore` (全部操作) | 各模块 Store + useProjectStore(精简) |
| `RenderEngine.render()` | `VideoRenderer.render()` + Player 预览 |

同时更新指南中的：
- 预设完整列表（84个 → 完整列出）
- 模板 API 文档（新 TemplateEngine / TemplateRegistry）
- Store API 参考（新增 useTrackStore/useAssetStore）
- 渲染流程说明（Puppeteer + FFmpeg 替代 Canvas + MediaRecorder）

### 二、迁移 AI 导演模块到新架构

将 `src/services/aiService.ts` 和 `src/services/aiDirectorService.ts` 的真实逻辑迁移到 `modules/ai-director/`：

```
modules/ai-director/
├── services/
│   ├── AIService.ts              # 从 src/services/aiService.ts 迁移
│   │                             # + 新增：支持多AI提供商切换
│   └── AIDirectorService.ts      # 从 src/services/aiDirectorService.ts 迁移
│                                 # + 改用新模块的 ClipManager/TrackManager/AssetManager
├── schema/
│   ├── AIScriptSchema.ts         # 保留并增强
│   └── AIScriptValidator.ts      # 保留
├── prompts/                      # 新增：AI提示词模板管理
│   ├── systemPrompts.ts          # 系统提示词集中管理
│   └── promptTemplates.ts        # 提示词模板
├── adapters/                     # 新增：Store适配层
│   └── ProjectAdapter.ts         # 适配新旧Store接口
└── index.ts                      # 统一导出
```

### 三、更新 AIDirectorPanel 引用

修改 `src/components/business/AIDirectorPanel.tsx`：
- 导入路径从 `../../services/aiDirectorService` 改为 `../../modules/ai-director`

## Impact

- **受影响的代码**：
  - `TEMPLATE_DEVELOPMENT_GUIDE.md` — 全面更新路径和API
  - `PRESET_DEVELOPMENT_GUIDE.md` — 全面更新路径和预设列表
  - `AI_DIRECTOR_DEVELOPMENT_GUIDE.md` — 更新架构说明和新模块引用
  - `src/modules/ai-director/services/AIService.ts` — 重写为真实实现
  - `src/modules/ai-director/services/AIDirectorService.ts` — 重写为真实实现
  - `src/components/business/AIDirectorPanel.tsx` — 更新导入路径
  - `src/services/aiService.ts` — 标记废弃
  - `src/services/aiDirectorService.ts` — 标记废弃

- **BREAKING 变更**：
  - AI导演模块的导入路径变更

## ADDED Requirements

### Requirement: 模块化的AI服务层

AIService SHALL 提供：
- 多AI提供商支持（当前：智谱AI glm-4.7-flash；可扩展：OpenAI/Claude等）
- 配置外部化（endpoint, apiKey, model 可通过构造函数注入）
- 4次标准调用链：analyzeUserInput → generateImagePrompts → generateShotData → processTextContent
- 错误重试机制
- 响应缓存（可选）

#### Scenario: 调用AI分析用户输入
- **WHEN** 用户在 AI导演面板输入描述文字
- **THEN** 系统调用 analyzeUserInput() 返回结构化的素材需求、分镜描述、文案

### Requirement: 模块化的AI导演工作流

AIDirectorService SHALL 提供：
- generateFromInput(userInput) 主流程编排
- 使用新模块的 TrackManager/ClipManager/AssetManager 操作数据
- 5阶段进度回调（analyzing → generating_prompts → generating_shot → processing_text → adding_to_project）
- 完整的错误处理和回滚

#### Scenario: AI生成视频片段到轨道
- **WHEN** 用户输入 "一只猫在阳光下打哈欠"
- **THEN** 系统：分析→生成提示词→生成分镜JSON→处理文案→添加clip到video轨道和text轨道

### Requirement: 更新的开发指南

三份开发指南 SHALL：
- 所有文件路径指向新模块化架构
- 预设列表包含完整的84个预设
- 模板API使用新的 TemplateEngine/TemplateRegistry 接口
- Store API 同时展示新旧接口（过渡期兼容）
- 渲染流程说明使用 Puppeteer + FFmpeg 方案

## MODIFIED Requirements

### Requirement: AI Director Panel

原 AIDirectorPanel 直接引用 `src/services/aiDirectorService`。

**修改为**：引用 `src/modules/ai-director`，保持所有 UI 和交互不变。

## REMOVED Requirements

### Requirement: 旧位置的AI服务文件

**原因**：逻辑已迁移到 modules/ai-director/

**迁移**：
- `src/services/aiService.ts` → 标记 @deprecated，内容替换为 re-export
- `src/services/aiDirectorService.ts` → 标记 @deprecated，内容替换为 re-export
