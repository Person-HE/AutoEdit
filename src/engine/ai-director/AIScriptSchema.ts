/**
 * AI 脚本 Schema 类型定义
 * 定义标准化的 AI 生成脚本结构
 * 
 * 画布配置：固定16:9 (1920x1080)
 * 网格系统：32x18，每个网格60x60像素
 */

import { GridId } from './GridSystem';

// ============ 画布配置（固定16:9）============

export interface CanvasConfig {
  aspectRatio: '16:9';  // 固定16:9比例
}

// ============ 动画引用 ============

export interface AnimationRef {
  presetId: string;     // 预设 ID，如 'entrance_fade_in'
  duration?: number;    // 动画时长（秒）
  delay?: number;       // 延迟时间（秒）
  params?: Record<string, any>; // 额外参数
}

// ============ 文本元素 ============

export interface TextElement {
  id: string;
  content: string;      // 文本内容
  layoutId: GridId;     // 位置（网格标识）

  // 样式
  style?: {
    fontSize?: number | 'auto';
    color?: string;
    fontWeight?: 'normal' | 'bold';
    textAlign?: 'left' | 'center' | 'right';
  };

  // 动画
  animation?: {
    entrance?: AnimationRef;   // 进场动画
    exit?: AnimationRef;       // 出场动画
    emphasis?: AnimationRef;   // 强调动画
  };

  // 配音
  dubbing?: {
    enabled: boolean;
    voice?: string;     // 音色 ID
    speed?: number;     // 语速 0.5-2.0
  };
}

// ============ 素材元素 ============

export interface MaterialElement {
  id: string;
  source: 'comfyui' | 'upload' | 'library'; // 素材来源
  layoutId: GridId;     // 位置（网格标识）

  // ComfyUI 生成参数
  generatePrompt?: string;
  negativePrompt?: string;

  // 外部素材
  assetId?: string;
  url?: string;

  // 适配规则
  fitMode?: 'cover' | 'contain' | 'fill';

  // 动画
  animation?: {
    entrance?: AnimationRef;
    exit?: AnimationRef;
    emphasis?: AnimationRef;
  };
}

// ============ 背景配置 ============

export interface BackgroundConfig {
  type: 'color' | 'gradient' | 'image';
  value: string;
}

// ============ 转场配置 ============

export interface TransitionConfig {
  type: 'fade' | 'slide' | 'zoom' | 'none';
  duration: number;
}

// ============ 分镜（镜头） ============

export interface Shot {
  shotId: string;
  order: number;        // 分镜顺序（重要：用于时序排序）
  duration: number;     // 分镜时长（秒）
  layoutId: GridId;     // 分镜整体布局

  // 背景
  background?: BackgroundConfig;

  // 元素
  texts: TextElement[];
  materials: MaterialElement[];

  // 转场
  transition?: TransitionConfig;
}

// ============ 完整脚本 ============

export interface AIScript {
  version: string;
  title: string;
  description?: string;
  canvas: CanvasConfig;
  shots: Shot[];
  metadata?: {
    generatedAt: string;
    aiModel?: string;
    prompt?: string;
  };
}

// ============ 校验结果 ============

export interface ValidationError {
  path: string;         // 错误路径
  message: string;      // 错误信息
  severity: 'error' | 'warning';
  autoCorrected?: boolean;
  originalValue?: any;
  correctedValue?: any;
}

export interface ScriptValidationResult {
  valid: boolean;
  errors: ValidationError[];
  correctedScript?: AIScript;
}

// ============ 构建进度 ============

export interface BuildProgress {
  stage: 'validating' | 'generating_assets' | 'generating_dubbing' | 'building' | 'complete';
  progress: number;     // 0-100
  message: string;
  currentShot?: number;
  totalShots?: number;
}

// ============ 构建结果 ============

export interface BuildResult {
  success: boolean;
  projectId: string;
  totalDuration: number; // 总时长
  shots: BuiltShot[];
  errors: string[];
  warnings: string[];
}

export interface BuiltShot {
  shotId: string;
  startTime: number;    // 开始时间（秒）
  endTime: number;      // 结束时间（秒）
  duration: number;     // 时长（秒）
  clips: string[];      // Clip ID 列表
}

// ============ 示例脚本 ============
// 展示32x18网格系统的各种布局用法

export function getExampleScript(): AIScript {
  return {
    version: '1.0.0',
    title: '网格系统演示视频',
    description: '展示32x18网格系统的各种布局用法，包括单网格和复合网格',
    canvas: {
      aspectRatio: '16:9',
    },
    shots: [
      {
        shotId: 'shot_1',
        order: 1,
        duration: 5,
        layoutId: 'full',
        background: {
          type: 'color',
          value: '#1a1a2e',
        },
        texts: [
          {
            id: 'text_1',
            content: '欢迎使用 32x18 网格系统',
            layoutId: 'top_center',  // 顶部居中
            style: {
              fontSize: 'auto',
              color: '#ffffff',
              fontWeight: 'bold',
              textAlign: 'center',
            },
            animation: {
              entrance: {
                presetId: 'entrance_fade_in',
                duration: 0.8,
              },
            },
            dubbing: {
              enabled: true,
              voice: 'default',
              speed: 1.0,
            },
          },
          {
            id: 'text_1_sub',
            content: '每个网格60x60像素，共576个网格',
            layoutId: 'grid_16_6',  // 标题下方
            style: {
              fontSize: 24,
              color: '#aaaaaa',
              fontWeight: 'normal',
              textAlign: 'center',
            },
            animation: {
              entrance: {
                presetId: 'entrance_slide_up',
                duration: 0.6,
                delay: 0.3,
              },
            },
            dubbing: {
              enabled: false,
            },
          },
        ],
        materials: [
          {
            id: 'material_1',
            source: 'comfyui',
            layoutId: 'center_large',  // 中心大区域 (17x13网格)
            generatePrompt: '科技感蓝色背景，未来主义风格，高清细节，16:9宽屏',
            negativePrompt: 'ugly, blurry, noisy, portrait',
            fitMode: 'cover',
            animation: {
              entrance: {
                presetId: 'entrance_zoom_in',
                duration: 1.0,
              },
            },
          },
        ],
        transition: {
          type: 'fade',
          duration: 0.5,
        },
      },
      {
        shotId: 'shot_2',
        order: 2,
        duration: 4,
        layoutId: 'full',
        background: {
          type: 'color',
          value: '#0d1b2a',
        },
        texts: [
          {
            id: 'text_2',
            content: '复合网格布局演示',
            layoutId: 'center',  // 正中心单网格
            style: {
              fontSize: 'auto',
              color: '#ffffff',
              fontWeight: 'bold',
              textAlign: 'center',
            },
            animation: {
              entrance: {
                presetId: 'entrance_slide_up',
                duration: 0.6,
              },
            },
            dubbing: {
              enabled: true,
              voice: 'default',
              speed: 1.0,
            },
          },
        ],
        materials: [
          {
            id: 'material_2_left',
            source: 'comfyui',
            layoutId: 'left_third',  // 左三分之一区域 (10x18网格)
            generatePrompt: '左侧抽象几何图形，蓝色调，现代设计',
            negativePrompt: 'text, words',
            fitMode: 'cover',
            animation: {
              entrance: {
                presetId: 'entrance_slide_left',
                duration: 0.8,
              },
            },
          },
          {
            id: 'material_2_right',
            source: 'comfyui',
            layoutId: 'right_third',  // 右三分之一区域 (10x18网格)
            generatePrompt: '右侧抽象几何图形，紫色调，现代设计',
            negativePrompt: 'text, words',
            fitMode: 'cover',
            animation: {
              entrance: {
                presetId: 'entrance_slide_right',
                duration: 0.8,
              },
            },
          },
        ],
        transition: {
          type: 'slide',
          duration: 0.5,
        },
      },
      {
        shotId: 'shot_3',
        order: 3,
        duration: 5,
        layoutId: 'full',
        background: {
          type: 'color',
          value: '#1b263b',
        },
        texts: [
          {
            id: 'text_3_title',
            content: '四分屏布局',
            layoutId: 'top_bar',  // 顶部条带
            style: {
              fontSize: 36,
              color: '#ffffff',
              fontWeight: 'bold',
              textAlign: 'center',
            },
            animation: {
              entrance: {
                presetId: 'entrance_fade_in',
                duration: 0.5,
              },
            },
            dubbing: {
              enabled: true,
              voice: 'default',
              speed: 1.0,
            },
          },
        ],
        materials: [
          {
            id: 'material_3_tl',
            source: 'comfyui',
            layoutId: 'top_left_quarter',  // 左上四分之一 (16x9网格)
            generatePrompt: '红色抽象艺术',
            negativePrompt: 'text',
            fitMode: 'cover',
            animation: {
              entrance: {
                presetId: 'entrance_zoom_in',
                duration: 0.6,
                delay: 0,
              },
            },
          },
          {
            id: 'material_3_tr',
            source: 'comfyui',
            layoutId: 'top_right_quarter',  // 右上四分之一 (16x9网格)
            generatePrompt: '蓝色抽象艺术',
            negativePrompt: 'text',
            fitMode: 'cover',
            animation: {
              entrance: {
                presetId: 'entrance_zoom_in',
                duration: 0.6,
                delay: 0.1,
              },
            },
          },
          {
            id: 'material_3_bl',
            source: 'comfyui',
            layoutId: 'bottom_left_quarter',  // 左下四分之一 (16x9网格)
            generatePrompt: '绿色抽象艺术',
            negativePrompt: 'text',
            fitMode: 'cover',
            animation: {
              entrance: {
                presetId: 'entrance_zoom_in',
                duration: 0.6,
                delay: 0.2,
              },
            },
          },
          {
            id: 'material_3_br',
            source: 'comfyui',
            layoutId: 'bottom_right_quarter',  // 右下四分之一 (16x9网格)
            generatePrompt: '黄色抽象艺术',
            negativePrompt: 'text',
            fitMode: 'cover',
            animation: {
              entrance: {
                presetId: 'entrance_zoom_in',
                duration: 0.6,
                delay: 0.3,
              },
            },
          },
        ],
        transition: {
          type: 'zoom',
          duration: 0.5,
        },
      },
      {
        shotId: 'shot_4',
        order: 4,
        duration: 4,
        layoutId: 'full',
        background: {
          type: 'color',
          value: '#0d1b2a',
        },
        texts: [
          {
            id: 'text_4',
            content: '侧边栏布局演示',
            layoutId: 'title_top',  // 顶部标题区
            style: {
              fontSize: 'auto',
              color: '#ffffff',
              fontWeight: 'bold',
              textAlign: 'center',
            },
            animation: {
              entrance: {
                presetId: 'entrance_slide_down',
                duration: 0.6,
              },
            },
            dubbing: {
              enabled: true,
              voice: 'default',
              speed: 1.0,
            },
          },
        ],
        materials: [
          {
            id: 'material_4_sidebar',
            source: 'comfyui',
            layoutId: 'sidebar_left',  // 左侧边栏 (6x18网格)
            generatePrompt: '深色侧边栏背景，简洁设计',
            negativePrompt: 'text, busy',
            fitMode: 'cover',
            animation: {
              entrance: {
                presetId: 'entrance_slide_left',
                duration: 0.8,
              },
            },
          },
          {
            id: 'material_4_content',
            source: 'comfyui',
            layoutId: 'content_area',  // 内容区域 (20x10网格)
            generatePrompt: '主要内容区域，白色背景，简洁',
            negativePrompt: 'dark, black',
            fitMode: 'cover',
            animation: {
              entrance: {
                presetId: 'entrance_fade_in',
                duration: 0.8,
                delay: 0.2,
              },
            },
          },
        ],
        transition: {
          type: 'fade',
          duration: 0.5,
        },
      },
    ],
    metadata: {
      generatedAt: new Date().toISOString(),
      aiModel: 'example',
      prompt: '32x18网格系统演示脚本，展示单网格和复合网格布局',
    },
  };
}
