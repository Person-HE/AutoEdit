# AI 导演模式架构设计文档

## 一、整体架构概览

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            AI 导演模式架构                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                        用户输入层                                      │   │
│  │   • 视频脚本（文案、画面描述、素材需求）                                 │   │
│  │   • 画布比例选择（16:9 / 9:16 / 1:1）                                  │   │
│  │   • 风格偏好设置                                                       │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│                                    ▼                                         │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    AI 脚本生成层（调用 LLM API）                        │   │
│  │   • 解析用户脚本，生成 9×9 网格标准化 JSON                              │   │
│  │   • 遵循 Schema 约束，仅输出 grid_xx_xx 标识                           │   │
│  │   • 自动匹配动画预设 ID                                                │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│                                    ▼                                         │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    脚本校验与修正层                                     │   │
│  │   • 格式校验：grid_xx_xx 合法性检查                                    │   │
│  │   • 逻辑校验：碰撞检测、时长合理性                                      │   │
│  │   • 自动修正：非法标识修正、复合网格反转                                │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│                                    ▼                                         │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    素材生成层（并行执行）                               │   │
│  │   ┌─────────────────┐    ┌─────────────────┐                         │   │
│  │   │ ComfyUI 图片生成 │    │ Index-TTS 配音  │                         │   │
│  │   │ • 适配网格宽高比 │    │ • 按句生成配音  │                         │   │
│  │   │ • 自动缩放裁剪   │    │ • 时长同步      │                         │   │
│  │   └─────────────────┘    └─────────────────┘                         │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│                                    ▼                                         │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    9×9 网格坐标映射层                                  │   │
│  │   • grid_xx_xx → 像素坐标 (x, y)                                      │   │
│  │   • 计算元素锚点位置                                                   │   │
│  │   • 应用素材适配规则                                                   │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│                                    ▼                                         │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    碰撞检测与自动调整层                                │   │
│  │   • 网格占用表维护                                                     │   │
│  │   • 元素层级排序（文本 > 素材 > 装饰）                                 │   │
│  │   • 自动偏移至相邻空闲网格                                             │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│                                    ▼                                         │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    项目构建层                                          │   │
│  │   • 创建 Project 对象                                                 │   │
│  │   • 创建 Clip 对象（设置 transform、effects、voiceOver）              │   │
│  │   • 创建 Asset 对象                                                   │   │
│  │   • 添加到时间轴轨道                                                   │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│                                    ▼                                         │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    可视化预览与调整层                                  │   │
│  │   • 9×9 网格可视化预览                                                │   │
│  │   • 拖拽吸附调整                                                       │   │
│  │   • 实时更新脚本                                                       │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│                                    ▼                                         │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    导出层                                              │   │
│  │   • 视频渲染导出                                                       │   │
│  │   • 音频混合（背景音乐 + 配音）                                        │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 二、9×9 网格系统设计

### 2.1 网格标识规则

```typescript
// 单网格标识
type SingleGridId = `grid_${1-9}_${1-9}`;
// 示例: grid_5_5 (中心), grid_1_1 (左上), grid_9_9 (右下)

// 复合网格标识
type CompositeGridId = `grid_${startCol}_${startRow}_${endCol}_${endRow}`;
// 示例: grid_2_2_8_8 (7×7核心区), grid_1_1_9_3 (顶部通栏)

// 特殊标识（预设常用区域）
type SpecialGridId = 
  | 'center'        // grid_5_5
  | 'top_center'    // grid_5_2
  | 'bottom_center' // grid_5_8
  | 'left_center'   // grid_2_5
  | 'right_center'  // grid_8_5
  | 'top_bar'       // grid_1_1_9_2
  | 'bottom_bar'    // grid_1_8_9_9
  | 'center_area'   // grid_3_3_7_7
  | 'full';         // grid_1_1_9_9
```

### 2.2 网格元数据

```typescript
interface GridMetadata {
  gridId: string;
  pixelRange: [number, number, number, number]; // [left, top, right, bottom]
  center: { x: number; y: number };
  width: number;
  height: number;
  aspectRatio: number;
  
  // 素材适配规则
  materialRule: 'fit' | 'fill' | 'crop';
  
  // 文本适配规则
  textRule: {
    maxFontSize: number;
    lineHeight: number;
    autoWrap: boolean;
  };
  
  // 动画基准
  animationSpeed: number; // 秒/格
}
```

### 2.3 画布配置

```typescript
interface CanvasConfig {
  aspectRatio: '16:9' | '9:16' | '1:1';
  width: number;
  height: number;
}

const CANVAS_PRESETS = {
  '16:9': { width: 1920, height: 1080 },
  '9:16': { width: 1080, height: 1920 },
  '1:1': { width: 1080, height: 1080 },
};
```

## 三、AI 脚本 Schema 设计

### 3.1 完整 Schema 定义

```typescript
interface AIScript {
  version: string;
  title: string;
  description?: string;
  canvas: {
    aspectRatio: '16:9' | '9:16' | '1:1';
  };
  shots: Shot[];
  metadata?: {
    generatedAt: string;
    aiModel?: string;
    prompt?: string;
  };
}

interface Shot {
  shotId: string;
  duration: number; // 秒
  layoutId: GridId; // 分镜整体布局
  
  background?: {
    type: 'color' | 'gradient' | 'image';
    value: string;
  };
  
  texts: TextElement[];
  materials: MaterialElement[];
  dubbing?: DubbingConfig;
  transition?: {
    type: 'fade' | 'slide' | 'zoom' | 'none';
    duration: number;
  };
}

interface TextElement {
  id: string;
  content: string;
  layoutId: GridId;
  
  style?: {
    fontSize?: number | 'auto';
    color?: string;
    fontWeight?: 'normal' | 'bold';
    textAlign?: 'left' | 'center' | 'right';
  };
  
  animation?: {
    entrance?: AnimationRef;
    exit?: AnimationRef;
    emphasis?: AnimationRef;
  };
  
  dubbing?: {
    enabled: boolean;
    voice?: string;
    speed?: number;
  };
}

interface MaterialElement {
  id: string;
  source: 'comfyui' | 'upload' | 'library';
  layoutId: GridId;
  
  // ComfyUI 生成参数
  generatePrompt?: string;
  negativePrompt?: string;
  
  // 外部素材
  assetId?: string;
  url?: string;
  
  // 适配规则
  fitMode?: 'cover' | 'contain' | 'fill';
  
  animation?: {
    entrance?: AnimationRef;
    exit?: AnimationRef;
    emphasis?: AnimationRef;
  };
}

interface AnimationRef {
  presetId: string; // 预设 ID
  duration?: number;
  delay?: number;
  params?: Record<string, any>;
}

interface DubbingConfig {
  text: string;
  voice?: string;
  speed?: number;
  emotion?: string;
}
```

### 3.2 示例脚本

```json
{
  "version": "1.0.0",
  "title": "产品介绍视频",
  "canvas": {
    "aspectRatio": "16:9"
  },
  "shots": [
    {
      "shotId": "shot_1",
      "duration": 5,
      "layoutId": "full",
      "background": {
        "type": "color",
        "value": "#1a1a2e"
      },
      "texts": [
        {
          "id": "text_1",
          "content": "欢迎使用 AI 视频编辑器",
          "layoutId": "top_center",
          "style": {
            "fontSize": "auto",
            "color": "#ffffff",
            "fontWeight": "bold",
            "textAlign": "center"
          },
          "animation": {
            "entrance": {
              "presetId": "entrance_fade_in",
              "duration": 0.8
            }
          },
          "dubbing": {
            "enabled": true,
            "voice": "default",
            "speed": 1.0
          }
        }
      ],
      "materials": [
        {
          "id": "material_1",
          "source": "comfyui",
          "layoutId": "center_area",
          "generatePrompt": "科技感蓝色背景，未来主义风格，高清细节",
          "negativePrompt": "ugly, blurry, noisy",
          "fitMode": "cover",
          "animation": {
            "entrance": {
              "presetId": "entrance_zoom_in",
              "duration": 1.0
            }
          }
        }
      ]
    }
  ]
}
```

## 四、核心模块设计

### 4.1 模块结构

```
src/engine/ai-director/
├── Grid9x9System.ts          # 9×9 网格系统
├── GridCollisionDetector.ts  # 碰撞检测器
├── AIScriptValidator.ts      # 脚本校验器
├── AIScriptGenerator.ts      # AI 脚本生成器
├── AssetGenerator.ts         # 素材生成器
├── DubbingGenerator.ts       # 配音生成器
├── ProjectBuilder.ts         # 项目构建器
└── index.ts                  # 导出
```

### 4.2 Grid9x9System 核心方法

```typescript
class Grid9x9System {
  // 初始化
  constructor(canvasConfig: CanvasConfig);
  
  // 网格解析
  parseGridId(gridId: GridId): ParsedGrid;
  
  // 坐标计算
  getPixelRange(gridId: GridId): [number, number, number, number];
  getCenter(gridId: GridId): { x: number; y: number };
  
  // 元数据获取
  getMetadata(gridId: GridId): GridMetadata;
  
  // 校验
  validateGridId(gridId: GridId): ValidationResult;
  
  // 特殊标识转换
  resolveSpecialId(specialId: SpecialGridId): GridId;
}
```

### 4.3 AIScriptGenerator 核心方法

```typescript
class AIScriptGenerator {
  // 生成脚本
  async generateScript(
    userScript: string,
    config: GeneratorConfig
  ): Promise<AIScript>;
  
  // 构建 Prompt
  private buildPrompt(userScript: string): string;
  
  // 解析 AI 响应
  private parseResponse(response: string): AIScript;
}
```

### 4.4 ProjectBuilder 核心方法

```typescript
class ProjectBuilder {
  // 从 AI 脚本构建项目
  async buildFromScript(
    script: AIScript,
    onProgress?: (progress: BuildProgress) => void
  ): Promise<BuildResult>;
  
  // 构建单个分镜
  private buildShot(shot: Shot, startTime: number): Promise<Clip[]>;
  
  // 创建文本 Clip
  private createTextClip(element: TextElement, shot: Shot): Clip;
  
  // 创建素材 Clip
  private createMaterialClip(element: MaterialElement, shot: Shot): Promise<Clip>;
}
```

## 五、UI 组件设计

### 5.1 组件结构

```
src/components/ai-director/
├── AIDirectorPanel.tsx       # 主面板
├── ScriptInput.tsx           # 脚本输入
├── ShotPreview.tsx           # 分镜预览
├── Grid9x9Overlay.tsx        # 网格叠加层
├── GenerationProgress.tsx    # 生成进度
└── AdjustmentPanel.tsx       # 调整面板
```

### 5.2 AIDirectorPanel 功能

- 脚本输入区（支持富文本）
- 画布比例选择
- 生成控制按钮
- 分镜预览列表
- 网格可视化预览
- 生成进度显示
- 调整工具栏

## 六、数据流程图

```
用户输入脚本
     │
     ▼
┌─────────────────┐
│ AI Script Gen   │ ← 调用 LLM API
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Script Validator│ ← 校验 + 自动修正
└────────┬────────┘
         │
         ├──────────────────┐
         │                  │
         ▼                  ▼
┌─────────────────┐  ┌─────────────────┐
│ Asset Generator │  │Dubbing Generator│
│ (ComfyUI)       │  │ (Index-TTS)     │
└────────┬────────┘  └────────┬────────┘
         │                    │
         └──────────┬─────────┘
                    │
                    ▼
         ┌─────────────────┐
         │ Grid Mapper     │ ← grid_xx_xx → 像素坐标
         └────────┬────────┘
                  │
                  ▼
         ┌─────────────────┐
         │ Collision Det.  │ ← 碰撞检测 + 自动调整
         └────────┬────────┘
                  │
                  ▼
         ┌─────────────────┐
         │ Project Builder │ ← 创建 Project + Clips
         └────────┬────────┘
                  │
                  ▼
         ┌─────────────────┐
         │ Timeline Render │ ← 显示在时间轴
         └─────────────────┘
```

## 七、API 接口设计

### 7.1 AI 脚本生成 API

```typescript
// POST /api/ai-director/generate-script
interface GenerateScriptRequest {
  userScript: string;
  canvasRatio: '16:9' | '9:16' | '1:1';
  style?: {
    tone?: 'formal' | 'casual' | 'creative';
    targetAudience?: string;
  };
}

interface GenerateScriptResponse {
  success: boolean;
  script?: AIScript;
  error?: string;
}
```

### 7.2 素材生成 API

```typescript
// POST /api/ai-director/generate-assets
interface GenerateAssetsRequest {
  materials: MaterialElement[];
  canvasConfig: CanvasConfig;
}

interface GenerateAssetsResponse {
  success: boolean;
  assets: Asset[];
  errors: string[];
}
```

### 7.3 配音生成 API

```typescript
// POST /api/ai-director/generate-dubbing
interface GenerateDubbingRequest {
  texts: {
    id: string;
    content: string;
    voice?: string;
    speed?: number;
  }[];
}

interface GenerateDubbingResponse {
  success: boolean;
  results: {
    id: string;
    audioUrl: string;
    duration: number;
  }[];
}
```

## 八、错误处理与降级

### 8.1 错误类型

```typescript
enum AIDirectorError {
  SCRIPT_GENERATION_FAILED = 'SCRIPT_GENERATION_FAILED',
  SCRIPT_VALIDATION_FAILED = 'SCRIPT_VALIDATION_FAILED',
  ASSET_GENERATION_FAILED = 'ASSET_GENERATION_FAILED',
  DUBBING_GENERATION_FAILED = 'DUBBING_GENERATION_FAILED',
  COLLISION_UNRESOLVABLE = 'COLLISION_UNRESOLVABLE',
}
```

### 8.2 降级策略

- AI 脚本生成失败 → 提供模板脚本供用户修改
- ComfyUI 不可用 → 提示用户上传素材
- Index-TTS 不可用 → 跳过配音，仅生成视频
- 碰撞无法解决 → 标记冲突区域，提示用户手动调整

## 九、性能优化

### 9.1 缓存策略

- 网格元数据缓存（按画布尺寸）
- AI 脚本缓存（相同输入）
- 素材生成结果缓存

### 9.2 并行处理

- 素材生成并行执行
- 配音生成并行执行
- 分镜预渲染并行

## 十、开发计划

### Phase 1: 核心基础设施
- [ ] 9×9 网格系统
- [ ] 网格可视化组件
- [ ] 脚本 Schema 定义

### Phase 2: AI 集成
- [ ] AI 脚本生成器
- [ ] 脚本校验器
- [ ] 碰撞检测器

### Phase 3: 素材与配音
- [ ] ComfyUI 集成优化
- [ ] Index-TTS 集成优化
- [ ] 项目构建器

### Phase 4: UI 与交互
- [ ] AI 导演面板
- [ ] 网格调整工具
- [ ] 预览与导出

---

**请确认此架构设计是否符合您的预期，确认后我将开始实现。**
