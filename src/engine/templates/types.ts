// 模板系统类型定义（病毒式视频标准版）

// 模板质量等级
export type TemplateQuality = 'viral' | 'basic' | 'legacy';

// 模板情绪标签
export type TemplateMood =
  | 'tension'      // 紧张
  | 'release'      // 释放
  | 'excitement'   // 兴奋
  | 'urgency'      // 紧迫
  | 'calm'         // 平静
  | 'epic'         // 史诗
  | 'mysterious';  // 神秘

// 模板材质标签
export type TemplateMaterial =
  | 'neon'         // 霓虹
  | 'glass'        // 玻璃
  | 'metal'        // 金属
  | 'paper'        // 纸张
  | 'carbon'       // 碳纤维
  | 'hologram'     // 全息
  | 'liquid'       // 液体
  | 'none';        // 无

// 模板参数类型
export type TemplateParamType = 'string' | 'number' | 'color' | 'boolean' | 'select' | 'textarea' | 'code';

// 模板参数定义
export interface TemplateParamSchema {
  key: string;
  label: string;
  type: TemplateParamType;
  default: any;
  min?: number;
  max?: number;
  step?: number;
  options?: { label: string; value: string }[]; // for select type
  placeholder?: string;
}

// 模板分类（移除 transition：系统性重写后不再保留低质量转场模板）
export type TemplateCategory =
  | 'ui'           // UI 元素模板
  | 'code'         // 代码相关模板
  | 'text'         // 文字效果模板
  | 'effect'       // 特效模板
  | 'other';       // 其他模板

// 渲染模式：Canvas2D / WebGL / Three.js
export type TemplateRenderMode = 'canvas2d' | 'webgl' | 'threejs';

// 模板渲染上下文
export interface TemplateRenderContext {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  progress: number;        // 0-1 的进度
  time: number;           // 当前时间（秒）
  duration: number;       // 片段总时长
  params: Record<string, any>; // 用户参数
}

// 病毒式视频四维评估标签
export interface TemplateDimensions {
  materialOptics?: boolean;  // 材质与光学维度
  physicsMotion?: boolean;   // 物理与运动维度
  spatialDepth?: boolean;    // 空间感维度
  styleEmotion?: boolean;    // 风格与情绪维度
}

// 模板定义接口
export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  thumbnail?: string;        // 缩略图 URL
  schema: TemplateParamSchema[];

  // 病毒式视频元数据
  quality?: TemplateQuality;
  mood?: TemplateMood | TemplateMood[];
  material?: TemplateMaterial | TemplateMaterial[];
  dimensions?: TemplateDimensions;
  physics?: string[];        // 使用的物理公式/算法列表
  renderMode?: TemplateRenderMode;

  // 渲染函数 - 在 Canvas 上绘制模板效果
  render: (context: TemplateRenderContext) => void;

  // 可选：初始化函数，在片段创建时调用
  initParams?: (duration: number) => Record<string, any>;

  // 可选：验证参数函数
  validateParams?: (params: Record<string, any>) => boolean;
}
