// 模板系统类型定义

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

// 模板分类
export type TemplateCategory = 
  | 'ui'           // UI 元素模板
  | 'code'         // 代码相关模板
  | 'text'         // 文字效果模板
  | 'effect'       // 特效模板
  | 'transition'   // 转场模板
  | 'other';       // 其他模板

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

// 模板定义接口
export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  thumbnail?: string;      // 缩略图 URL
  schema: TemplateParamSchema[];
  
  // 渲染函数 - 在 Canvas 上绘制模板效果
  render: (context: TemplateRenderContext) => void;
  
  // 可选：初始化函数，在片段创建时调用
  initParams?: (duration: number) => Record<string, any>;
  
  // 可选：验证参数函数
  validateParams?: (params: Record<string, any>) => boolean;
}
