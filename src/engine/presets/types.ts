import { EffectParamSchema, Transform } from '../../types/core';

// 预设定义接口
export interface PresetDefinition {
  id: string;
  name: string;
  category: 'entrance' | 'exit' | 'emphasis' | 'motion' | 'fx' | 'transition' | 'text';
  schema: EffectParamSchema[];
  // 渲染计算函数
  apply: (progress: number, params: any, currentTransform: Transform, ctx?: CanvasRenderingContext2D) => { 
    transform: Transform; 
    opacity: number; 
    filter?: string 
  };
}
