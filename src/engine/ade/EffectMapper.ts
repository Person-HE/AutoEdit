import { PRESETS } from '../presets';
import { PresetDefinition } from '../presets/types';
import { EffectInstruction } from './types';

interface PresetInfo {
  id: string;
  name: string;
  category: string;
  description: string;
  params: ParamInfo[];
}

interface ParamInfo {
  key: string;
  label: string;
  type: string;
  default: any;
  min?: number;
  max?: number;
  step?: number;
}

export class EffectMapper {
  private presetRegistry: Map<string, PresetInfo> = new Map();
  private keywordMappings: Map<string, string[]> = new Map();

  constructor() {
    this.buildRegistry();
    this.buildKeywordMappings();
  }

  private buildRegistry(): void {
    for (const [id, preset] of Object.entries(PRESETS)) {
      const info: PresetInfo = {
        id: preset.id,
        name: preset.name,
        category: preset.category,
        description: this.generateDescription(preset),
        params: preset.schema.map(s => ({
          key: s.key,
          label: s.label,
          type: s.type,
          default: s.default,
          min: s.min,
          max: s.max,
          step: s.step
        }))
      };
      
      this.presetRegistry.set(id, info);
    }
  }

  private buildKeywordMappings(): void {
    this.keywordMappings.set('entrance', ['进入', '入场', '出现', '淡入', '滑入', '弹入', 'entrance', 'enter', 'appear', 'fade in']);
    this.keywordMappings.set('exit', ['退出', '出场', '消失', '淡出', '滑出', 'exit', 'leave', 'disappear', 'fade out']);
    this.keywordMappings.set('emphasis', ['强调', '突出', '抖动', '震动', '脉冲', '闪烁', 'emphasis', 'shake', 'pulse', 'highlight']);
    this.keywordMappings.set('motion', ['移动', '运动', '悬浮', '漂移', '轨道', 'motion', 'float', 'orbit', 'move']);
    this.keywordMappings.set('fx', ['特效', '滤镜', '模糊', '发光', '黑白', 'fx', 'effect', 'blur', 'glow', 'filter']);
    this.keywordMappings.set('transition', ['转场', '过渡', '切换', 'transition', 'cross', 'dissolve']);
    
    this.keywordMappings.set('fade', ['淡入', '淡出', '渐变', 'fade']);
    this.keywordMappings.set('bounce', ['弹跳', '弹性', 'bounce', 'elastic']);
    this.keywordMappings.set('slide', ['滑动', '滑入', '滑出', 'slide']);
    this.keywordMappings.set('rotate', ['旋转', '转动', 'rotate', 'spin']);
    this.keywordMappings.set('shake', ['抖动', '震动', 'shake', 'vibrate']);
    this.keywordMappings.set('pulse', ['脉冲', '心跳', 'pulse', 'heartbeat']);
    this.keywordMappings.set('float', ['悬浮', '漂浮', 'float', 'hover']);
    this.keywordMappings.set('blur', ['模糊', '虚化', 'blur']);
    this.keywordMappings.set('glow', ['发光', '光晕', 'glow']);
    this.keywordMappings.set('grayscale', ['黑白', '灰度', 'grayscale', 'b&w']);
  }

  private generateDescription(preset: PresetDefinition): string {
    const categoryDescriptions: Record<string, string> = {
      'entrance': '进场动画',
      'exit': '出场动画',
      'emphasis': '强调动画',
      'motion': '移位动画',
      'fx': '视觉特效',
      'text': '文本动画',
      'transition': '转场动画'
    };
    
    return `${preset.name} - ${categoryDescriptions[preset.category] || '动画效果'}`;
  }

  getSkillManifest(): string {
    const categories: Record<string, PresetInfo[]> = {};
    
    for (const [, info] of this.presetRegistry) {
      if (!categories[info.category]) {
        categories[info.category] = [];
      }
      categories[info.category].push(info);
    }
    
    let manifest = '# 可用动画效果列表\n\n';
    
    for (const [category, presets] of Object.entries(categories)) {
      manifest += `## ${this.getCategoryName(category)}\n\n`;
      
      for (const preset of presets) {
        manifest += `### ${preset.name} (ID: ${preset.id})\n`;
        manifest += `${preset.description}\n`;
        
        if (preset.params.length > 0) {
          manifest += '参数:\n';
          for (const param of preset.params) {
            let paramDesc = `- ${param.label} (${param.key}): 默认值 ${param.default}`;
            if (param.min !== undefined && param.max !== undefined) {
              paramDesc += `, 范围 ${param.min}-${param.max}`;
            }
            manifest += paramDesc + '\n';
          }
        }
        manifest += '\n';
      }
    }
    
    return manifest;
  }

  private getCategoryName(category: string): string {
    const names: Record<string, string> = {
      'entrance': '进场动画',
      'exit': '出场动画',
      'emphasis': '强调动画',
      'motion': '移位动画',
      'fx': '视觉特效',
      'text': '文本动画',
      'transition': '转场动画'
    };
    return names[category] || category;
  }

  mapNaturalLanguageToEffect(description: string): EffectInstruction[] {
    const instructions: EffectInstruction[] = [];
    const lowerDesc = description.toLowerCase();
    
    const matchedPresets = this.findMatchingPresets(lowerDesc);
    
    for (const presetId of matchedPresets) {
      const preset = this.presetRegistry.get(presetId);
      if (preset) {
        const params = this.inferParamsFromDescription(preset, lowerDesc);
        const intensity = this.inferIntensity(lowerDesc);
        
        instructions.push({
          presetId,
          params,
          intensity
        });
      }
    }
    
    if (instructions.length === 0) {
      instructions.push({
        presetId: 'entrance_fade_in',
        params: {},
        intensity: 'medium'
      });
    }
    
    return instructions;
  }

  private findMatchingPresets(description: string): string[] {
    const matches: string[] = [];
    
    for (const [id, preset] of this.presetRegistry) {
      const presetName = preset.name.toLowerCase();
      
      if (description.includes(presetName)) {
        matches.push(id);
        continue;
      }
      
      for (const [, keywords] of this.keywordMappings) {
        for (const keyword of keywords) {
          if (description.includes(keyword.toLowerCase()) && 
              presetName.includes(keyword.toLowerCase())) {
            if (!matches.includes(id)) {
              matches.push(id);
            }
            break;
          }
        }
      }
    }
    
    return matches.slice(0, 3);
  }

  private inferParamsFromDescription(preset: PresetInfo, description: string): Record<string, any> {
    const params: Record<string, any> = {};
    
    for (const param of preset.params) {
      params[param.key] = param.default;
      
      if (param.type === 'number') {
        if (description.includes('快') || description.includes('fast') || description.includes('quick')) {
          if (param.key === 'speed') {
            params[param.key] = param.max ? param.max * 0.8 : param.default * 2;
          }
        }
        
        if (description.includes('慢') || description.includes('slow') || description.includes('gentle')) {
          if (param.key === 'speed') {
            params[param.key] = param.min ? param.min * 1.2 : param.default * 0.5;
          }
        }
        
        if (description.includes('大') || description.includes('强') || description.includes('strong') || description.includes('large')) {
          if (param.key === 'intensity' || param.key === 'strength' || param.key === 'range') {
            params[param.key] = param.max ? param.max * 0.8 : param.default * 1.5;
          }
        }
        
        if (description.includes('小') || description.includes('弱') || description.includes('weak') || description.includes('small')) {
          if (param.key === 'intensity' || param.key === 'strength' || param.key === 'range') {
            params[param.key] = param.min ? param.min * 1.2 : param.default * 0.5;
          }
        }
      }
      
      if (param.min !== undefined && param.max !== undefined) {
        params[param.key] = Math.max(param.min, Math.min(param.max, params[param.key]));
      }
    }
    
    return params;
  }

  private inferIntensity(description: string): 'low' | 'medium' | 'high' {
    if (description.includes('强烈') || description.includes('剧烈') || description.includes('大幅') || 
        description.includes('strong') || description.includes('intense')) {
      return 'high';
    }
    if (description.includes('轻微') || description.includes('缓慢') || description.includes('小') || 
        description.includes('gentle') || description.includes('subtle')) {
      return 'low';
    }
    return 'medium';
  }

  validateParams(presetId: string, params: Record<string, any>): Record<string, any> {
    const preset = this.presetRegistry.get(presetId);
    if (!preset) {
      return params;
    }
    
    const validatedParams: Record<string, any> = {};
    
    for (const paramInfo of preset.params) {
      let value = params[paramInfo.key] ?? paramInfo.default;
      
      if (paramInfo.type === 'number') {
        value = Number(value);
        if (isNaN(value)) {
          value = paramInfo.default;
        }
        if (paramInfo.min !== undefined) {
          value = Math.max(paramInfo.min, value);
        }
        if (paramInfo.max !== undefined) {
          value = Math.min(paramInfo.max, value);
        }
      }
      
      if (paramInfo.type === 'boolean') {
        value = Boolean(value);
      }
      
      validatedParams[paramInfo.key] = value;
    }
    
    return validatedParams;
  }

  getAllPresets(): PresetInfo[] {
    return Array.from(this.presetRegistry.values());
  }

  getPresetById(id: string): PresetInfo | undefined {
    return this.presetRegistry.get(id);
  }
}

export const effectMapper = new EffectMapper();
