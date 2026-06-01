import { PresetDefinition } from './types';

// 导入所有预设
import * as entrance from './entrance';
import * as exit from './exit';
import * as transition from './transition';
import * as text from './text';
import * as emphasis from './emphasis';
import * as motion from './motion';
import * as fx from './fx';

// 收集所有预设
const collectPresets = (): Record<string, PresetDefinition> => {
  const presets: Record<string, PresetDefinition> = {};
  
  const modules = [
    entrance,
    exit,
    transition,
    text,
    emphasis,
    motion,
    fx
  ];
  
  modules.forEach(module => {
    Object.values(module).forEach((preset: any) => {
      if (preset && preset.id && typeof preset.apply === 'function') {
        presets[preset.id] = preset;
      }
    });
  });
  
  return presets;
};

// 导出预设注册表
export const PRESETS: Record<string, PresetDefinition> = collectPresets();

// 导出类型
export type { PresetDefinition } from './types';

// 注册新预设的函数
export const registerPreset = (preset: PresetDefinition): void => {
  if (!preset.id || !preset.apply) {
    throw new Error("Invalid preset format: must have id and apply function");
  }
  
  // 添加到 PRESETS 对象
  (PRESETS as Record<string, PresetDefinition>)[preset.id] = preset;
  
  console.log(`✅ Preset registered: ${preset.name} (${preset.id})`);
};

// 按类别获取预设
export const getPresetsByCategory = (category: PresetDefinition['category']): PresetDefinition[] => {
  return Object.values(PRESETS).filter(preset => preset.category === category);
};

// 获取所有预设类别
export const getPresetCategories = (): { key: string; name: string }[] => {
  return [
    { key: 'entrance', name: '进场动画 (Entrance)' },
    { key: 'exit', name: '出场动画 (Exit)' },
    { key: 'transition', name: '转场动画 (Transition)' },
    { key: 'text', name: '文本动画 (Text FX)' },
    { key: 'emphasis', name: '强调动画 (Emphasis)' },
    { key: 'motion', name: '移位动画 (Motion)' },
    { key: 'fx', name: '视觉特效 (FX)' }
  ];
};
