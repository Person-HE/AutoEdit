# AI导演模式开发文档（新架构版）

> 本文档详细说明如何在新架构下通过代码生成视频片段，并添加到项目中。

---

## 目录

1. [架构概览](#架构概览)
2. [快速开始](#快速开始)
3. [模块化结构详解](#模块化结构详解)
4. [数据结构详解（新AIScriptSchema）](#数据结构详解新aiscriptschema)
5. [工作流程说明](#工作流程说明)
6. [ProjectAdapter API](#projectadapter-api)
7. [预设系统（84个完整版）](#预设系统84个完整版)
8. [模板系统（50+完整版）](#模板系统50完整版)
9. [Store API 参考（增强版）](#store-api-参考增强版)
10. [渲染导出流程](#渲染导出流程)
11. [完整示例](#完整示例)
12. [注意事项](#注意事项)

---

## 架构概览

### 什么是AI导演模式？

AI导演模式是一个智能视频生成系统，它通过调用AI API分析用户输入，自动生成符合项目格式的视频片段数据，并直接渲染到轨道上。

### 新模块化架构图

```
src/modules/ai-director/
├── index.ts                        # 模块导出入口
├── services/
│   ├── AIService.ts                # 多提供商AI调用层
│   └── AIDirectorService.ts         # 工作流编排引擎
├── prompts/
│   ├── systemPrompts.ts            # 系统提示词管理
│   └── promptTemplates.ts          # 动态提示词模板
├── adapters/
│   └── ProjectAdapter.ts           # Store适配层（关键！）
└── schema/
    ├── AIScriptSchema.ts           # 数据结构定义
    └── AIScriptValidator.ts        # 数据校验器

src/modules/renderer/
├── VideoRenderer.ts                # 视频渲染器（Puppeteer+FFmpeg）
├── puppeteer/
│   ├── BrowserLauncher.ts          # 浏览器启动器
│   └── FrameCapture.ts             # 帧捕获器
└── encoder/
    └── FFmpegEncoder.ts            # FFmpeg编码器

src/modules/preset/                 # 预设系统（84个）
src/modules/template/               # 模板系统（50+）
src/store/
├── useProjectStore.ts              # 项目状态管理
├── useTrackStore.ts                # 轨道状态管理（新增！）
└── useAssetStore.ts               # 素材状态管理（新增！）
```

### 核心组件关系图

```
┌─────────────────────────────────────────────────────────────┐
│                      用户输入描述                              │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   AIDirectorService                          │
│                  (工作流编排引擎)                              │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐     │
│  │ 第1次AI调用   │ → │ 第2次AI调用   │ → │ 第3次AI调用   │     │
│  │ 分析阶段     │   │ 素材提示词   │   │ 分镜数据     │     │
│  └──────────────┘   └──────────────┘   └──────────────┘     │
│                                                     │       │
│  ┌──────────────┐                            │       │
│  │ 第4次AI调用   │◄──────────────────────────┘       │
│  │ 文案处理     │                                    │
│  └──────┬───────┘                                    │
└─────────┼───────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│                    ProjectAdapter                           │
│                 (Store适配层)                                │
├─────────────────────────────────────────────────────────────┤
│  • addClipToProject()      • addAssetsToProject()           │
│  • applyEffectToClip()     • updateClip()                  │
│  • addTemplateClip()       • removeClip()                  │
│  • getProjectState()                                      │
└─────────────────────┬───────────────────────────────────────┘
                      │
          ┌───────────┼───────────┐
          ▼           ▼           ▼
┌─────────────┐ ┌──────────┐ ┌──────────┐
│useProjectStore│ │useTrackStore│ │useAssetStore│
│   (项目)     │ │  (轨道)   │ │  (素材)   │
└─────────────┘ └──────────┘ └──────────┘
```

---

## 快速开始

### 基础使用示例

```typescript
import { AIDirectorService } from '@/modules/ai-director/services/AIDirectorService';
import { projectAdapter } from '@/modules/ai-director/adapters/ProjectAdapter';

// 1. 创建AI导演服务实例
const director = new AIDirectorService();

// 2. 执行完整的AI生成流程
async function generateVideo(userDescription: string) {
  try {
    // 调用AI导演服务（内部会执行4次AI调用）
    const aiScript = await director.generateFromDescription(userDescription);

    console.log('✅ AI生成完成');
    console.log('分镜数量:', aiScript.shots.length);

    // 3. 使用ProjectAdapter将结果添加到项目
    for (const shot of aiScript.shots) {
      await processShot(shot);
    }

    console.log('✅ 所有分镜已添加到项目');
  } catch (error) {
    console.error('❌ 生成失败:', error);
  }
}

// 4. 处理单个分镜
async function processShot(shot: any) {
  const { projectAdapter } = await import('@/modules/ai-director/adapters/ProjectAdapter');

  // 添加素材（如果有）
  if (shot.materials?.length > 0) {
    const assets = await generateMaterials(shot.materials);
    projectAdapter.addAssetsToProject(assets);

    for (const material of shot.materials) {
      const asset = assets.find(a => a.id === material.id);
      if (asset) {
        projectAdapter.addClipToProject({
          type: 'video',
          assetId: asset.id,
          trackId: 'track_video_1',
          startTime: shot.startTime || 0,
          name: material.id
        });
      }
    }
  }

  // 添加文本片段
  for (const text of shot.texts || []) {
    const clip = projectAdapter.addClipToProject({
      type: 'text',
      trackId: 'track_text_1',
      startTime: (shot.startTime || 0) + (text.delay || 0),
      textData: {
        content: text.content,
        fontSize: text.style?.fontSize || 48,
        color: text.style?.color || '#ffffff',
        fontFamily: text.style?.fontFamily || 'Arial',
        fontWeight: text.style?.fontWeight || 'bold'
      },
      name: text.id
    });

    // 应用动画效果
    if (clip && text.animation?.entrance) {
      projectAdapter.applyEffectToClip(clip.id, text.animation.entrance.presetId);
    }
  }
}
```

### 直接使用ProjectAdapter

```typescript
import { projectAdapter } from '@/modules/ai-director/adapters/ProjectAdapter';

// 添加文本片段
const textClip = projectAdapter.addClipToProject({
  type: 'text',
  trackId: 'track_text_1',
  startTime: 0,
  duration: 5,
  textData: {
    content: 'Hello World',
    fontSize: 48,
    color: '#00d4ff',
    fontFamily: 'Arial'
  },
  name: 'my_text_clip'
});

// 应用预设效果
if (textClip) {
  projectAdapter.applyEffectToClip(textClip.id, 'entrance_fade_in');
}

// 更新片段参数
projectAdapter.updateClip(textClip.id, {
  duration: 8,
  textData: { ...textClip.textData, content: 'Updated Text' }
});

// 获取当前项目状态
const state = projectAdapter.getProjectState();
console.log('轨道数:', state.tracks.length);
console.log('片段数:', Object.keys(state.clips).length);
console.log('素材数:', state.assets.length);
```

---

## 模块化结构详解

### services/AIService.ts

**职责**: 多提供商AI调用抽象层

```typescript
import { AIService } from '@/modules/ai-director/services/AIService';

// 支持多个AI提供商
const aiService = new AIService({
  provider: 'openai',           // 或 'anthropic', 'google', 'custom'
  apiKey: 'your-api-key',
  model: 'gpt-4-turbo',        // 或 'claude-3', 'gemini-pro' 等
  maxTokens: 4096,
  temperature: 0.7
});

// 统一调用接口
const response = await aiService.chat([
  { role: 'system', content: systemPrompt },
  { role: 'user', content: userMessage }
]);
```

### services/AIDirectorService.ts

**职责**: 工作流编排，协调4次AI调用

```typescript
import { AIDirectorService } from '@/modules/ai-director/services/AIDirectorService';

const director = new AIDirectorService();

// 完整的生成流程（自动执行4次AI调用）
const result = await director.generateFromDescription('创建一个产品宣传视频');

// 返回 AIScriptSchema 格式数据
console.log(result.version);     // "2.0.0"
console.log(result.title);       // "产品宣传"
console.log(result.shots);       // Shot[]
```

### prompts/systemPrompts.ts

**职责**: 系统提示词管理和版本控制

```typescript
import { SCHEMA_VALIDATION_RULES } from '@/modules/ai-director/schema/AIScriptSchema';

// 获取验证规则
const rules = SCHEMA_VALIDATION_RULES;
console.log(rules.requiredFields);    // 必填字段列表
console.log(rules.formatRules);      // 格式规则
```

### prompts/promptTemplates.ts

**职责**: 动态提示词模板生成

```typescript
// 内部使用，根据上下文动态构建提示词
// 支持变量插值、条件逻辑等
```

### adapters/ProjectAdapter.ts

**职责**: Store适配层，桥接AI输出和项目状态管理

> **这是最关键的模块！** 所有对项目的操作都通过它进行。

**文件位置**: `src/modules/ai-director/adapters/ProjectAdapter.ts`

详见下方 [ProjectAdapter API](#projectadapter-api) 章节。

### schema/AIScriptSchema.ts

**职责**: 定义AI脚本的数据结构

详见下方 [数据结构详解](#数据结构详解新aiscriptschema) 章节。

### schema/AIScriptValidator.ts

**职责**: 校验AI输出的数据格式

```typescript
import { aiscriptValidator, type ValidationResult } from '@/modules/ai-director/schema/AIScriptValidator';

const validation: ValidationResult = aiscriptValidator.validate(aiScriptData);

if (!validation.valid) {
  console.error('校验失败:', validation.errors);
  console.warn('警告:', validation.warnings);
} else {
  console.log('✅ 数据格式正确');
}
```

---

## 数据结构详解（新AIScriptSchema）

### 1. AIScript（顶层结构）

```typescript
interface AIScript {
  version: string;                    // 版本号 "2.0.0"
  title: string;                     // 视频标题
  canvas: { aspectRatio: string };   // 画布比例 ("16:9", "9:16", "1:1")
  shots: Shot[];                     // 分镜数组
  metadata?: {
    generatedAt: string;             // 生成时间
    model: string;                   // 使用的AI模型
    totalDuration: number;           // 总时长(秒)
  };
}
```

### 2. Shot（分镜）

```typescript
interface Shot {
  shotId: string;                    // 分镜ID（唯一）
  order: number;                     // 顺序号
  duration: number;                  // 时长(秒)
  startTime?: number;                // 开始时间（相对于项目）
  layoutId: string;                 // 布局位置ID
  texts: TextElement[];             // 文本元素数组
  materials: MaterialElement[];     // 素材元素数组
  transitions?: AITransition[];      // 转场效果
  background?: {                    // 背景配置
    color?: string;                 // 背景色
    gradient?: string[];            // 渐变色
    templateId?: string;            // 背景模板ID
  };
  audio?: {                         // 音频配置
    music?: string;                 // 音乐ID或URL
    sfx?: string[];                 // 音效列表
    volume?: number;                 // 音量(0-1)
  };
}
```

### 3. TextElement（文本元素）

```typescript
interface TextElement {
  id: string;                        // 元素ID
  content: string;                   // 文本内容
  layoutId: string;                 // 布局位置ID
  style: TextStyle;                 // 样式配置
  animation?: {                      // 动画配置（增强版）
    entrance?: AnimationConfig;     // 进场动画
    exit?: AnimationConfig;         // 出场动画
    emphasis?: AnimationConfig;     // 强调动画
    delay?: number;                 // 延迟时间(秒)
  };
  effects?: EffectConfig[];         // 额外效果列表
}

interface TextStyle {
  fontSize: number;                  // 字体大小
  fontFamily: string;                // 字体族
  color: string;                     // 字体颜色 (#RRGGBB 或 rgba())
  fontWeight?: string;               // 字重 ("normal" | "bold" | ...)
  textAlign?: 'left' | 'center' | 'right';  // 对齐方式
  letterSpacing?: number;            // 字间距(px)
  lineHeight?: number;               // 行高倍数
  textShadow?: string;              // 文字阴影
  opacity?: number;                  // 透明度(0-1)
}

interface AnimationConfig {
  presetId: string;                  // 预设ID（来自84个预设列表）
  duration?: number;                 // 动画时长(秒)
  delay?: number;                    // 延迟时间(秒)
  params?: Record<string, any>;     // 预设自定义参数
}

interface EffectConfig {
  presetId: string;                  // 效果预设ID
  params?: Record<string, any>;     // 效果参数
  startTime?: number;               // 效果开始时间
  duration?: number;                // 效果持续时长
}
```

### 4. MaterialElement（素材元素）

```typescript
interface MaterialElement {
  id: string;                        // 素材ID
  source: string;                     // 来源类型 ('comfyui' | 'local' | 'url' | 'stock')
  layoutId: string;                 // 布局位置ID
  generatePrompt?: string;            // AI生成提示词（用于ComfyUI）
  url?: string;                      // 直接URL（如果source='url'）
  stockId?: string;                  // 素材库ID（如果source='stock'）
  style?: {
    filter?: string;                 // CSS滤镜
    opacity?: number;                // 透明度
    blendMode?: string;              // 混合模式
  };
  animation?: AnimationConfig;       // 动画配置（同TextElement）
  transform?: {                      // 初始变换
    x?: number;
    y?: number;
    scale?: number;
    rotation?: number;
  };
}
```

### 5. AITransition（转场）

```typescript
interface AITransition {
  type: 'fade' | 'slide' | 'zoom' | 'wipe' | 'dissolve' | 'cube';
  duration?: number;                 // 转场时长(秒)
  direction?: 'left' | 'right' | 'up' | 'down';
  params?: Record<string, any>;
}
```

### 6. AIAssetReference（素材引用）

```typescript
interface AIAssetReference {
  id: string;
  type: 'image' | 'video' | 'audio';
  source: string;
  url?: string;
  prompt?: string;
  metadata?: Record<string, any>;
}
```

---

## 工作流程说明

### 完整的4次AI调用流程

```
┌─────────────────────────────────────────────────────────────┐
│ 用户输入: "创建一个30秒的产品宣传视频，展示新款智能手机"       │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
╔═══════════════════════════════════════════════════════════╗
║  第1次AI调用: 分析阶段                                   ║
║  ─────────────────────────────────────────────────────── ║
║  输入: 用户描述                                          ║
║  输出:                                                   ║
║  • 素材需求清单（需要几张图、什么风格）                     ║
║  • 分镜画面描述（每个镜头的画面构思）                       ║
║  • 文案内容（标题、副标题、口号等）                         ║
║  • 整体风格建议                                           ║
╚═════════════════════┬═════════════════════════════════════╝
                      │
                      ▼
╔═══════════════════════════════════════════════════════════╗
║  第2次AI调用: 素材提示词生成                               ║
║  ─────────────────────────────────────────────────────── ║
║  输入: 素材需求清单                                        ║
║  处理: 调用ComfyUI/Stable Diffusion生成图片                 ║
║  输出:                                                   ║
║  • 生成的图片URL列表                                       ║
║  • 图片元数据（用于后续引用）                               ║
╚═════════════════════┬═════════════════════════════════════╝
                      │
                      ▼
╔═══════════════════════════════════════════════════════════╗
║  第3次AI调用: 分镜数据生成                                 ║
║  ─────────────────────────────────────────────────────── ║
║  输入: 分镜画面描述 + 文案 + 素材信息                      ║
║  输出: AIScript JSON                                     ║
║  {                                                       ║
║    version: "2.0.0",                                     ║
║    title: "产品宣传",                                     ║
║    shots: [...]                                          ║
║  }                                                       ║
╚═════════════════════┬═════════════════════════════════════╝
                      │
                      ▼
╔═══════════════════════════════════════════════════════════╗
║  第4次AI调用: 文案处理（可选）                             ║
║  ─────────────────────────────────────────────────────── ║
║  输入: 长文本内容                                         ║
║  输出:                                                   ║
║  • 拆分后的短句（适合逐字显示）                             ║
║  • 时间戳标注（每句话的出现时机）                          ║
║  • 强调关键词标记                                         ║
╚═════════════════════┬═════════════════════════════════════╝
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  ProjectAdapter 处理                          │
│                                                             │
│  for each shot in aiscript.shots:                          │
│    ├─ 添加素材到项目 (addAssetsToProject)                  │
│    ├─ 添加视频片段 (addClipToProject - video/image)        │
│    ├─ 添加文本片段 (addClipToProject - text)               │
│    ├─ 设置样式和参数 (updateClip)                          │
│    ├─ 应用进场动画 (applyEffectToClip - entrance)          │
│    ├─ 应用出场动画 (applyEffectToClip - exit)              │
│    └─ 应用强调动画 (applyEffectToClip - emphasis)          │
│                                                             │
│  结果: 所有内容已添加到 useProjectStore/useTrackStore      │
└─────────────────────────────────────────────────────────────┘
```

### 错误处理和重试机制

```typescript
import { AIDirectorService } from '@/modules/ai-director/services/AIDirectorService';

const director = new AIDirectorService({
  maxRetries: 3,                    // 最大重试次数
  retryDelay: 1000,                 // 重试延迟(ms)
  timeout: 30000,                   // 单次调用超时(ms)
  onRetry: (attempt, error) => {
    console.warn(`第${attempt}次重试:`, error.message);
  }
});
```

---

## ProjectAdapter API

**文件位置**: `src/modules/ai-director/adapters/ProjectAdapter.ts`

> **核心作用**: 桥接AI输出数据和项目Store，提供类型安全的操作接口。

### AddClipInput 接口

```typescript
interface AddClipInput {
  type: 'video' | 'image' | 'text' | 'template';  // 片段类型
  assetId?: string;                // 关联的素材ID（video/image必填）
  trackId: string;                 // 目标轨道ID
  startTime: number;               // 开始时间(秒)
  duration?: number;               // 时长(秒)
  textData?: Partial<Clip['textData']>;  // 文本数据（text类型）
  transform?: Partial<Clip['transform']>;  // 变换属性
  templateId?: string;             // 模板ID（template类型）
  templateParams?: Record<string, any>;  // 模板参数
  name?: string;                   // 片段名称
}
```

### 核心方法

#### addClipToProject()

添加片段到项目：

```typescript
const clip = projectAdapter.addClipToProject({
  type: 'text',
  trackId: 'track_text_1',
  startTime: 0,
  duration: 5,
  textData: {
    content: 'Hello World',
    fontSize: 48,
    color: '#ffffff',
    fontFamily: 'Arial'
  },
  name: 'intro_text'
});

// 返回 Clip 对象或 null
if (clip) {
  console.log('片段创建成功:', clip.id);
} else {
  console.log('片段创建失败');
}
```

#### addAssetsToProject()

批量添加素材：

```typescript
const assets: Asset[] = [
  {
    id: 'img_001',
    name: 'product.png',
    type: 'image',
    url: 'data:image/png;base64,...',
    width: 1920,
    height: 1080
  },
  {
    id: 'vid_001',
    name: 'background.mp4',
    type: 'video',
    url: '/assets/background.mp4',
    width: 1920,
    height: 1080,
    duration: 10
  }
];

projectAdapter.addAssetsToProject(assets);
```

#### applyEffectToClip()

为片段应用预设效果：

```typescript
const success = projectAdapter.applyEffectToClip('clip_id_here', 'entrance_fade_in');
// 返回 boolean

// 可用的预设ID来自84个预设列表：
// - entrance_* (18个)
// - exit_* (10个)
// - emphasis_* (18个)
// - motion_* (12个)
// - fx_* (19个)
// - transition_* (5个)
// - text_* (2个)
```

#### updateClip()

更新片段属性：

```typescript
projectAdapter.updateClip('clip_id_here', {
  duration: 8,
  textData: {
    content: '更新后的文字',
    fontSize: 64,
    color: '#00d4ff'
  },
  transform: {
    x: 100,
    y: 200,
    scale: 1.2,
    rotation: 15
  }
});
```

#### addTemplateClip()

添加模板片段（快捷方式）：

```typescript
const success = projectAdapter.addTemplateClip(
  'text_typewriter',    // 模板ID（来自50+模板列表）
  'track_text_1',       // 目标轨道
  0                     // 开始时间
);
```

#### removeClip()

删除片段：

```typescript
projectAdapter.removeClip('clip_id_here');
```

#### getProjectState()

获取当前项目状态快照：

```typescript
const state = projectAdapter.getProjectState();

console.log({
  currentTime: state.currentTime,           // 当前播放时间
  tracks: state.tracks,                     // 所有轨道
  clips: state.clips,                       // 所有片段
  assets: state.assets,                     // 所有素材
  project: state.project                    // 完整项目对象
});
```

### 使用示例：完整的分镜生成流程

```typescript
async function generateShotToProject(shot: Shot) {
  const { projectAdapter } = await import('@/modules/ai-director/adapters/ProjectAdapter');

  // 1. 处理素材
  if (shot.materials?.length > 0) {
    const assets = await generateMaterials(shot.materials);
    projectAdapter.addAssetsToProject(assets);

    for (const material of shot.materials) {
      const asset = assets.find(a => a.id === material.id);
      if (asset) {
        projectAdapter.addClipToProject({
          type: 'video',
          assetId: asset.id,
          trackId: 'track_video_1',
          startTime: shot.startTime ?? 0,
          transform: material.transform,
          name: material.id
        });
      }
    }
  }

  // 2. 处理文本
  for (const text of shot.texts ?? []) {
    const clip = projectAdapter.addClipToProject({
      type: 'text',
      trackId: 'track_text_1',
      startTime: (shot.startTime ?? 0) + (text.animation?.delay ?? 0),
      duration: shot.duration,
      textData: {
        content: text.content,
        fontSize: text.style.fontSize,
        color: text.style.color,
        fontFamily: text.style.fontFamily,
        fontWeight: text.style.fontWeight
      },
      name: text.id
    });

    // 3. 应用动画
    if (clip) {
      if (text.animation?.entrance) {
        projectAdapter.applyEffectToClip(clip.id, text.animation.entrance.presetId);
      }
      if (text.animation?.exit) {
        // 可以链式应用多个效果
        setTimeout(() => {
          projectAdapter.applyEffectToClip(clip.id, text.animation.exit.presetId!);
        }, (shot.duration - (text.animation.exit.duration ?? 1)) * 1000);
      }
    }
  }

  console.log(`✅ 分镜 ${shot.shotId} 已添加到项目`);
}
```

---

## 预设系统（84个完整版）

### Entrance 进场动画（18个）

| ID | 名称 | 说明 |
|---|------|------|
| `entrance_fade_in` | 淡入 | 从透明到不透明 |
| `entrance_fade_in_up` | 向上淡入 | 从下方淡入 |
| `entrance_fade_in_down` | 向下淡入 | 从上方淡入 |
| `entrance_fade_in_left` | 向左淡入 | 从右侧淡入 |
| `entrance_fade_in_right` | 向右淡入 | 从左侧淡入 |
| `entrance_slide_in_up` | 向上滑入 | 从下方滑入 |
| `entrance_slide_in_down` | 向下滑入 | 从上方滑入 |
| `entrance_slide_in_left` | 向左滑入 | 从右侧滑入 |
| `entrance_slide_in_right` | 向右滑入 | 从左侧滑入 |
| `entrance_zoom_in` | 缩放进入 | 从小到大缩放 |
| `entrance_zoom_in_up` | 向上缩放 | 向上移动+缩放 |
| `entrance_zoom_in_down` | 向下缩放 | 向下移动+缩放 |
| `entrance_bounce_in` | 弹跳进入 | 弹性弹跳效果 |
| `entrance_elastic_in` | 弹性进入 | 弹性过冲效果 |
| `entrance_back_in` | 回弹进入 | 回弹效果 |
| `entrance_flip_in` | 翻转进入 | 3D翻转效果 |
| `entrance_rotate_in` | 旋转进入 | 旋转出现 |
| `entrance_explode_in` | 爆炸进入 | 粒子爆炸效果 |

### Exit 出场动画（10个）

| ID | 名称 | 说明 |
|---|------|------|
| `exit_fade_out` | 淡出 | 从不透明到透明 |
| `exit_fade_out_up` | 向上淡出 | 向上消失 |
| `exit_fade_out_down` | 向下淡出 | 向下消失 |
| `exit_slide_out_up` | 向上滑出 | 向上滑出 |
| `exit_slide_out_down` | 向下滑出 | 向下滑出 |
| `exit_slide_out_left` | 向左滑出 | 向左滑出 |
| `exit_slide_out_right` | 向右滑出 | 向右滑出 |
| `exit_zoom_out` | 缩放消失 | 从大到小 |
| `exit_zoom_out_up` | 向上缩放 | 向上+缩小 |
| `exit_bounce_out` | 弹跳消失 | 弹跳退出 |

### Emphasis 强调动画（18个）

| ID | 名称 |
|---|------|
| `emphasis_pulse` | 脉冲 |
| `emphasis_pulse_ring` | 环形脉冲 |
| `emphasis_pulse_glow` | 发光脉冲 |
| `emphasis_shake` | 抖动 |
| `emphasis_shake_x` | X轴抖动 |
| `emphasis_shake_y` | Y轴抖动 |
| `emphasis_bounce` | 弹跳 |
| `emphasis_bounce_soft` | 柔和弹跳 |
| `emphasis_flash` | 闪烁 |
| `emphasis_flash_soft` | 柔和闪烁 |
| `emphasis_swing` | 摇摆 |
| `emphasis_wobble` | 摇晃 |
| `emphasis_heartbeat` | 心跳 |
| `emphasis_breathe` | 呼吸 |
| `emphasis_jitter` | 抖动 |
| `emphasis_pop` | 弹出 |
| `emphasis_grow_shrink` | 生长收缩 |
| `emphasis_tilt` | 倾斜 |

### Motion 移位动画（12个）

| ID | 名称 |
|---|------|
| `motion_float` | 悬浮 |
| `motion_float_x` | X轴悬浮 |
| `motion_float_y` | Y轴悬浮 |
| `motion_drift` | 漂移 |
| `motion_drift_slow` | 慢速漂移 |
| `motion_orbit` | 轨道运动 |
| `motion_orbit_slow` | 慢速轨道 |
| `motion_sway` | 摆动 |
| `motion_spiral` | 螺旋 |
| `motion_wave` | 波浪 |
| `motion_bob` | 上下浮动 |
| `motion_pan` | 平移 |

### FX 视觉特效（19个）

| ID | 名称 |
|---|------|
| `fx_glow` | 发光 |
| `fx_glow_pulse` | 脉冲发光 |
| `fx_glow_rainbow` | 彩虹发光 |
| `fx_blur` | 模糊 |
| `fx_blur_in` | 模糊进入 |
| `fx_blur_out` | 模糊退出 |
| `fx_shadow` | 阴影 |
| `fx_shadow_lift` | 阴影提升 |
| `fx_hue_rotate` | 色相旋转 |
| `fx_saturate` | 饱和度 |
| `fx_contrast` | 对比度 |
| `fx_grayscale` | 黑白电影 |
| `fx_sepia` | 复古色调 |
| `fx_invert` | 反色 |
| `fx_glassmorphism` | 毛玻璃 |
| `fx_glitch` | 故障 |
| `fx_neon` | 霓虹 |
| `fx_scanline` | 扫描线 |
| `fx_vignette` | 暗角 |

### Transition 转场动画（5个）

| ID | 名称 |
|---|------|
| `transition_cross_dissolve` | 交叉溶解 |
| `transition_wipe_left` | 向左擦除 |
| `transition_wipe_right` | 向右擦除 |
| `transition_page_flip` | 翻页 |
| `transition_cube_rotate` | 立方体旋转 |

### Text 文字特效（2个）

| ID | 名称 |
|---|------|
| `text_typewriter` | 打字机 |
| `text_reveal` | 揭示效果 |

**总计: 84 个预设**

---

## 模板系统（50+完整版）

### Text（文字效果）- 15个

| ID | 名称 |
|---|------|
| `text_split` | 分割文字 |
| `text_blur` | 模糊文字 |
| `text_circular` | 圆形文字 |
| `text_typewriter` | 打字机 |
| `text_shiny` | 闪烁文字 |
| `text_gradient` | 渐变文字 |
| `text_falling` | 下落文字 |
| `text_decrypted` | 解密文字 |
| `text_glitch` | 故障文字 |
| `text_scroll_reveal` | 滚动揭示 |
| `text_count_up` | 计数器 |
| `text_pressure` | 文字压力 |
| `text_gradual_blur` | 渐进模糊 |
| `text_ascii` | ASCII艺术 |
| `text_scrambled` | 乱序文字 |

### UI（UI组件）- 10个

| ID | 名称 |
|---|------|
| `ui_elastic_button` | 弹性按钮 |
| `ui_card_flip` | 卡片翻转 |
| `ui_card_3d` | 3D卡片 |
| `ui_spotlight_card` | 聚光灯卡片 |
| `ui_border_glow` | 边框发光 |
| `ui_magnet_button` | 磁性按钮 |
| `ui_glass_card` | 玻璃卡片 |
| `ui_card_stack` | 卡片堆叠 |
| `ui_accordion` | 手风琴 |
| `ui_tabs` | 标签页 |

### Background（背景效果）- 10个

| ID | 名称 |
|---|------|
| `background_liquid_ether` | 液态以太 |
| `background_aurora` | 极光 |
| `background_waves` | 波浪 |
| `background_silk` | 丝绸 |
| `background_particles` | 粒子 |
| `background_grid_distortion` | 网格变形 |
| `background_light_rays` | 光线射线 |
| `background_beams` | 光束 |
| `background_galaxy` | 星空银河 |
| `background_noise_texture` | 噪点纹理 |

### Effect（视觉特效）- 10个

| ID | 名称 |
|---|------|
| `effect_particle_explosion` | 粒子爆炸 |
| `effect_halo_expand` | 光晕扩散 |
| `effect_energy_ring` | 能量环 |
| `effect_shockwave` | 冲击波 |
| `effect_magic_circle` | 魔法阵 |
| `effect_data_stream` | 数据流 |
| `effect_code_rain` | 代码雨 |
| `effect_matrix` | 矩阵 |
| `effect_fire` | 火焰 |
| `effect_smoke` | 烟雾 |

### Transition（转场效果）- 5个

| ID | 名称 |
|---|------|
| `transition_fade` | 淡入淡出 |
| `transition_slide` | 滑动转场 |
| `transition_zoom` | 缩放转场 |
| `transition_rotate` | 旋转转场 |
| `transition_blur` | 模糊转场 |

**总计: 50+ 模板**

---

## Store API 参考（增强版）

### useProjectStore

项目级别的状态管理，管理轨道、片段、时间轴等。

```typescript
import { useProjectStore } from '@/store/useProjectStore';

const store = useProjectStore.getState();

// 主要方法
store.addAssets(assets: Asset[]);                          // 添加素材
store.removeAsset(id: string);                              // 删除素材
store.addClip(asset, trackId, time, type);                   // 添加片段
store.updateClip(id, changes: Partial<Clip>);               // 更新片段
store.removeClip(id: string);                               // 删除片段
store.addTrack(type: TrackType);                            // 添加轨道
store.addEffectToClip(clipId, presetId);                    // 添加预设效果
store.addTemplateClip(templateId, trackId, time);           // 添加模板片段
```

### useTrackStore （新增！）

轨道级别的状态管理，管理轨道可见性、锁定等。

```typescript
import { useTrackStore } from '@/store/useTrackStore';

const trackStore = useTrackStore.getState();

trackStore.toggleTrackVisibility(trackId);     // 切换轨道可见性
trackStore.toggleTrackLock(trackId);           // 切换轨道锁定
trackStore.reorderTracks(trackIds);            // 重排轨道顺序
trackStore.addTrack(type);                      // 添加轨道
trackStore.removeTrack(trackId);               // 删除轨道
```

### useAssetStore （新增！）

素材库的状态管理，管理图片、视频、音频等素材。

```typescript
import { useAssetStore } from '@/asset/useAssetStore';

const assetStore = useAssetStore.getState();

assetStore.addAsset(asset: Asset);              // 添加素材
assetStore.removeAsset(id: string);             // 删除素材
assetStore.updateAsset(id, changes);            // 更新素材
assetStore.getAssets();                         // 获取所有素材
assetStore.getAssetById(id);                    // 通过ID获取素材
assetStore.importAssets(files: File[]);         // 导入素材文件
```

### Store 协作示例（完整版）

```typescript
async function createCompleteScene() {
  const projectStore = useProjectStore.getState();
  const trackStore = useTrackStore.getState();
  const assetStore = useAssetStore.getState();

  // 1. 管理轨道
  const videoTrack = trackStore.addTrack('video');
  const textTrack = trackStore.addTrack('text');

  // 2. 导入并管理素材
  const files = await selectFiles();
  const assets = await assetStore.importAssets(files);

  // 3. 添加素材到项目
  projectStore.addAssets(assets);

  // 4. 创建视频片段
  assets.forEach((asset, index) => {
    const clip = projectStore.addClip(asset, videoTrack.id, index * 5, 'video');
    if (clip) {
      projectStore.updateClip(clip.id, {
        duration: 5,
        transform: { x: 0, y: 0, scale: 1, rotation: 0 }
      });
      projectStore.addEffectToClip(clip.id, 'entrance_fade_in');
    }
  });

  // 5. 创建文本片段
  const textClip = projectStore.addClip(null, textTrack.id, 0, 'text');
  if (textClip) {
    projectStore.updateClip(textClip.id, {
      textData: {
        content: '精彩即将呈现',
        fontSize: 64,
        color: '#ffffff',
        fontFamily: 'Arial'
      },
      duration: 10
    });
    projectStore.addEffectToClip(textClip.id, 'text_typewriter');
  }

  console.log('场景创建完成！');
}
```

---

## 渲染导出流程

### VideoRenderer 视频渲染器

**文件位置**: `src/modules/renderer/VideoRenderer.ts`

> **说明**: 使用 Puppeteer + FFmpeg 进行高质量视频渲染导出。

#### 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                    VideoRenderer                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │ BrowserLauncher│    │ FrameCapture │    │ FFmpegEncoder│  │
│  │ (启动浏览器)  │ →  │ (捕获帧PNG)  │ →  │ (编码视频)   │  │
│  └─────────────┘    └──────────────┘    └──────────────┘  │
│                                                             │
│  流程: HTML页面 → 逐帧截图 → FFmpeg合成MP4                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### render() 方法

执行完整的渲染流程：

```typescript
import VideoRenderer from '@/modules/renderer/VideoRenderer';

const renderer = new VideoRenderer();

const result = await renderer.render({
  entryPoint: './dist/index.html',        // 入口HTML文件路径
  outputPath: './output/video.mp4',       // 输出视频路径
  width: 1920,                           // 视频宽度
  height: 1080,                          // 视频高度
  fps: 30,                               // 帧率
  durationInFrames: 900,                 // 总帧数 (= 30fps × 30秒)
  codec: 'libx264',                      // 编码器
  crf: 23,                               // 质量(0-51,越小质量越高)
  format: 'mp4',                         // 格式
  audioPath: './audio/background.mp3',   // 音频文件（可选）
  
  onProgress: (progress) => {
    console.log(`${progress.percent}% - ${progress.message}`);
    // progress.stage: 'launching' | 'capturing' | 'encoding' | 'finalizing'
    // progress.currentFrame / progress.totalFrames
  },
  
  onComplete: (result) => {
    console.log('✅ 渲染完成!');
    console.log('文件大小:', (result.fileSize / 1024 / 1024).toFixed(2), 'MB');
    console.log('耗时:', (result.renderTime / 1000).toFixed(1), '秒');
  },
  
  onError: (error) => {
    console.error('❌ 渲染失败:', error);
  }
});

// 结果
// RenderResult {
//   success: boolean,
//   outputPath: string,
//   fileSize: number,       // 字节
//   duration: number,        // 秒
//   totalFrames: number,
//   renderTime: number       // 毫秒
// }
```

#### renderStill() 方法

渲染单帧为静态图片：

```typescript
const imagePath = await renderer.renderStill({
  entryPoint: './dist/index.html',
  outputPath: './output/thumbnail.png',
  width: 1920,
  height: 1080,
  frame: 150  // 渲染第150帧（= 5秒处）
});
```

#### validateOptions() 方法

验证渲染参数：

```typescript
const validation = renderer.validateOptions({
  entryPoint: './index.html',
  outputPath: './output.mp4',
  durationInFrames: 900
});

if (!validation.valid) {
  console.error('❌ 参数错误:', validation.errors);
} else {
  if (validation.warnings.length > 0) {
    console.warn('⚠️ 警告:', validation.warnings);
  }
}
```

#### cancel() 方法

取消正在进行的渲染：

```typescript
// 在另一个上下文中
renderer.cancel();
// 渲染会在下一帧检查时抛出错误并清理资源
```

#### getEstimatedTime() 方法

估算渲染时间：

```typescript
const estimatedMs = renderer.getEstimatedTime({
  fps: 30,
  durationInFrames: 900
});

console.log('预计耗时:', (estimatedMs / 1000).toFixed(1), '秒');
```

### Player 预览播放器

用于实时预览编辑结果（非导出）。

```typescript
// 通常在React组件中使用
import { Player } from '@/components/Player';

function PreviewPanel() {
  return (
    <Player
      width={1920}
      height={1080}
      fps={30}
      duration={30}
      onFrameUpdate={(frame) => {
        // 帧更新回调
      }}
      onPlay={() => {}}
      onPause={() => {}}
      onSeek={(time) => {}}
    />
  );
}
```

### 渲染导出最佳实践

1. **分辨率选择**
   - 预览: 960×540 (快速)
   - 标准高清: 1920×1080
   - 4K: 3840×2160 (较慢)

2. **帧率选择**
   - 动画内容: 30fps
   - 电影感: 24fps
   - 流畅运动: 60fps

3. **CRF值指南**
   - 0-17: 几乎无损（文件很大）
   - 18-27: 高质量（推荐）
   - 28-34: 中等质量
   * 35-51: 低质量（文件很小）

4. **性能优化**
   - 使用SSR预渲染减少首帧时间
   - 并行捕获多帧（如果内存允许）
   - GPU加速Canvas渲染

---

## 完整示例

### 示例1: 创建一个简单的产品宣传分镜

```json
{
  "version": "2.0.0",
  "title": "产品宣传",
  "canvas": { "aspectRatio": "16:9" },
  "shots": [
    {
      "shotId": "shot_product_intro",
      "order": 1,
      "duration": 5,
      "startTime": 0,
      "layoutId": "full",
      "texts": [
        {
          "id": "text_title",
          "content": "全新上市",
          "layoutId": "top_center",
          "style": {
            "fontSize": 64,
            "color": "#ffffff",
            "fontWeight": "bold",
            "fontFamily": "Arial"
          },
          "animation": {
            "entrance": {
              "presetId": "entrance_slide_in_down",
              "duration": 0.8
            },
            "exit": {
              "presetId": "exit_fade_out",
              "duration": 0.5,
              "delay": 4.2
            }
          }
        },
        {
          "id": "text_subtitle",
          "content": "震撼来袭",
          "layoutId": "bottom_center",
          "style": {
            "fontSize": 36,
            "color": "#00d4ff",
            "fontFamily": "Arial"
          },
          "animation": {
            "entrance": {
              "presetId": "entrance_fade_in_up",
              "duration": 1
            },
            "exit": {
              "presetId": "exit_fade_out",
              "duration": 0.5,
              "delay": 4
            }
          }
        }
      ],
      "materials": [
        {
          "id": "mat_product",
          "source": "comfyui",
          "layoutId": "center",
          "generatePrompt": "A sleek modern product on a dark background with dramatic lighting, professional photography style, 4K quality"
        }
      ]
    }
  ]
}
```

### 示例2: 使用ProjectAdapter处理上述分镜

```typescript
import { projectAdapter } from '@/modules/ai-director/adapters/ProjectAdapter';
import { aiscriptValidator } from '@/modules/ai-director/schema/AIScriptValidator';

async function processProductVideo(aiscriptData: any) {
  // 1. 校验数据格式
  const validation = aiscriptValidator.validate(aiscriptData);
  if (!validation.valid) {
    throw new Error(`数据格式错误: ${validation.errors.join(', ')}`);
  }

  // 2. 处理每个分镜
  for (const shot of aiscriptData.shots) {
    console.log(`\n📹 处理分镜: ${shot.shotId}`);

    // 2.1 处理素材
    if (shot.materials?.length > 0) {
      console.log(`  🖼️  素材数量: ${shot.materials.length}`);
      // 这里应该调用素材生成服务...
      // const assets = await generateMaterials(shot.materials);
      // projectAdapter.addAssetsToProject(assets);
      
      for (const material of shot.materials) {
        // 暂时跳过素材生成，仅记录
        console.log(`    - ${material.id}: ${material.generatePrompt?.substring(0, 50)}...`);
      }
    }

    // 2.2 处理文本
    for (const text of shot.texts || []) {
      console.log(`  📝 文本: "${text.content}"`);

      const clip = projectAdapter.addClipToProject({
        type: 'text',
        trackId: 'track_text_1',
        startTime: (shot.startTime ?? 0) + (text.animation?.delay ?? 0),
        duration: shot.duration,
        textData: {
          content: text.content,
          fontSize: text.style.fontSize,
          color: text.style.color,
          fontFamily: text.style.fontFamily,
          fontWeight: text.style.fontWeight
        },
        name: text.id
      });

      if (clip) {
        // 2.3 应用进场动画
        if (text.animation?.entrance) {
          const success = projectAdapter.applyEffectToClip(
            clip.id,
            text.animation.entrance.presetId
          );
          console.log(`    ✨ 进场动画: ${text.animation.entrance.presetId} (${success ? '成功' : '失败'})`);
        }

        // 2.4 应用出场动画（延迟执行）
        if (text.animation?.exit) {
          const exitDelay = (shot.duration - (text.animation.exit.duration ?? 1)) * 1000;
          setTimeout(() => {
            projectAdapter.applyEffectToClip(clip.id, text.animation.exit.presetId!);
            console.log(`    👋 出场动画: ${text.animation.exit.presetId}`);
          }, exitDelay);
        }
      }
    }
  }

  // 3. 获取最终状态
  const state = projectAdapter.getProjectState();
  console.log('\n📊 最终状态:');
  console.log(`  总片段数: ${Object.keys(state.clips).length}`);
  console.log(`  总素材数: ${state.assets.length}`);
  console.log(`  总轨道数: ${state.tracks.length}`);

  return state;
}
```

### 示例3: 渲染导出完整视频

```typescript
import VideoRenderer from '@/modules/renderer/VideoRenderer';

async function exportVideo() {
  const renderer = new VideoRenderer();

  try {
    const result = await renderer.render({
      entryPoint: './dist/index.html',
      outputPath: `./exports/product_promo_${Date.now()}.mp4`,
      width: 1920,
      height: 1080,
      fps: 30,
      durationInFrames: 900,  // 30秒视频
      codec: 'libx264',
      crf: 20,
      format: 'mp4',

      onProgress: (progress) => {
        const bar = '█'.repeat(Math.floor(progress.percent / 5)) +
                    '░'.repeat(20 - Math.floor(progress.percent / 5));
        process.stdout.write(`\r[${bar}] ${progress.percent.toFixed(1)}% - ${progress.message}`);
      },

      onComplete: (result) => {
        console.log('\n\n✅ 渲染成功!');
        console.log(`   文件: ${result.outputPath}`);
        console.log(`   大小: ${(result.fileSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   时长: ${result.duration.toFixed(1)}秒`);
        console.log(`   总帧数: ${result.totalFrames}`);
        console.log(`   耗时: ${(result.renderTime / 1000).toFixed(1)}秒`);
      },

      onError: (error) => {
        console.error('\n❌ 渲染失败:', error.message);
      }
    });

    return result;
  } catch (error) {
    console.error('异常:', error);
    throw error;
  }
}
```

---

## 注意事项

### 1. ID唯一性

所有ID必须唯一，建议使用UUID或带前缀的时间戳：

```typescript
const uniqueId = `shot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
```

### 2. 时间连续性

片段时间不能重叠，ProjectAdapter会按startTime排序但不会自动处理冲突。建议在添加前检查：

```typescript
const state = projectAdapter.getProjectState();
const existingClips = Object.values(state.clips)
  .filter(c => c.trackId === targetTrackId)
  .sort((a, b) => a.startTime - b.startTime);

// 检查时间冲突
for (let i = 0; i < existingClips.length - 1; i++) {
  const current = existingClips[i];
  const next = existingClips[i + 1];
  if (current.startTime + current.duration > next.startTime) {
    console.warn('⚠️ 时间冲突检测到!');
  }
}
```

### 3. 轨道存在性

目标轨道必须先存在。可以使用useTrackStore创建：

```typescript
import { useTrackStore } from '@/store/useTrackStore';

const trackStore = useTrackStore.getState();

// 确保轨道存在
let videoTrack = 'track_video_1';
const tracks = trackStore.getTracks?.() ?? [];
if (!tracks.find(t => t.id === videoTrack)) {
  videoTrack = trackStore.addTrack('video');
}
```

### 4. 素材关联

视频片段需要关联有效的assetId：

```typescript
// 先添加素材
projectAdapter.addAssetsToProject([{
  id: 'img_001',
  name: 'product.png',
  type: 'image',
  url: 'data:image/png,...',
  width: 1920,
  height: 1080
}]);

// 再创建片段（引用该素材）
projectAdapter.addClipToProject({
  type: 'image',
  assetId: 'img_001',  // 必须有效
  trackId: 'track_video_1',
  startTime: 0
});
```

### 5. 格式要求

- **颜色**: 使用十六进制 (`#ffffff`) 或 rgba (`rgba(255,255,255,1)`)
- **字体大小**: 数字 (px)
- **时间**: 秒 (number)
- **角度**: 度 (number)

### 6. 性能考虑

- AI调用有延迟（通常每次1-10秒），4次调用可能需要30秒+
- 建议显示进度指示器
- 大量素材生成可能需要队列管理
- 渲染导出是CPU密集型任务，建议在Web Worker中运行

### 7. 错误恢复

实现完善的错误处理和重试机制：

```typescript
async function robustGenerate(description: string, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await director.generateFromDescription(description);
      return result;
    } catch (error) {
      console.warn(`第${attempt}/${maxRetries}次尝试失败:`, error.message);
      if (attempt === maxRetries) throw error;
      await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
    }
  }
}
```

---

## 总结

新架构下的AI导演模式开发要点：

1. **模块化结构** - 清晰的services/adapters/schema分层
2. **ProjectAdapter** - 所有项目操作的唯一入口
3. **4次AI调用** - 分析→素材→分镜→文案的工作流
4. **AIScriptSchema v2** - 完善的数据结构支持复杂场景
5. **84个预设** - 丰富的动画效果库
6. **50+模板** - 专业级视觉效果
7. **三Store协作** - Project/Track/Asset 分工明确
8. **VideoRenderer** - Puppeteer+FFmpeg高质量导出
9. **类型安全** - TypeScript全覆盖
10. **错误处理** - 完善的校验和重试机制

遵循这些规范，您就能在新架构下开发出功能强大、稳定可靠的AI视频生成功能！
