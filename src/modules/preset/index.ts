import presetRegistry from './PresetRegistry';
import { entrancePresets } from './categories/entrance/index';
import { exitPresets } from './categories/exit/index';
import { emphasisPresets } from './categories/emphasis/index';
import { motionPresets } from './categories/motion/index';
import { fxPresets } from './categories/fx/index';
import { transitionPresets } from './categories/transition/index';
import { textPresets } from './categories/text/index';

export type {
  ReactEffectProps,
  PresetCategory,
  AnimationEffect,
  PresetRenderFn,
  PresetRegistryItem,
  PresetRegistryState,
  ApplyPresetConfig
} from './PresetTypes';

export { EffectRenderMode } from './PresetTypes';
export { default as presetRegistry, PresetRegistry } from './PresetRegistry';
export { AnimationEngine } from './core/AnimationEngine';
export * as easings from './core/EasingLibrary';
export * as spring from './core/SpringPhysics';
export { validateAnimationProps, WillChangeManager, PerformanceMonitor } from './core/GPURenderer';
export { TimelineDriver, type TimelineDriverConfig, type TimelineEvent, type TimelineCallbacks } from './core/TimelineDriver';

export { entrancePresets };
export { exitPresets };
export { emphasisPresets };
export { motionPresets };
export { fxPresets };
export { transitionPresets };
export { textPresets };

const allPresets = [
  ...entrancePresets,
  ...exitPresets,
  ...emphasisPresets,
  ...motionPresets,
  ...fxPresets,
  ...transitionPresets,
  ...textPresets
];

allPresets.forEach(preset => {
  try {
    presetRegistry.register(preset);
  } catch (error) {
    console.warn(`Failed to register preset ${preset.id}:`, error);
  }
});

export const getTotalPresetCount = (): number => presetRegistry.count;

export const getAllCategories = (): Array<{ key: string; name: string; count: number }> => {
  return [
    { key: 'entrance', name: '进场动画 (Entrance)', count: entrancePresets.length },
    { key: 'exit', name: '出场动画 (Exit)', count: exitPresets.length },
    { key: 'emphasis', name: '强调动画 (Emphasis)', count: emphasisPresets.length },
    { key: 'motion', name: '移位动画 (Motion)', count: motionPresets.length },
    { key: 'fx', name: '视觉特效 (FX)', count: fxPresets.length },
    { key: 'transition', name: '转场动画 (Transition)', count: transitionPresets.length },
    { key: 'text', name: '文本动画 (Text)', count: textPresets.length }
  ];
};

console.log(`✅ Preset system initialized: ${presetRegistry.count} presets registered across ${presetRegistry.getCategories().length} categories`);
