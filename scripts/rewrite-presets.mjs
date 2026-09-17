import fs from 'fs';
import path from 'path';

const presetsDir = 'd:\\project\\AutoEdit\\src\\engine\\presets';

function write(file, content) {
  const p = path.join(presetsDir, file);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content, 'utf8');
  console.log('wrote', p);
}

const typesTs = `import { EffectParamSchema, Transform } from '../../types/core';

export type PresetMood = 'tension' | 'release' | 'excitement' | 'urgency' | 'calm' | 'epic' | 'mysterious';
export type PresetMaterial = 'neon' | 'glass' | 'metal' | 'paper' | 'carbon' | 'hologram' | 'liquid' | 'none';
export type PresetQuality = 'viral' | 'basic' | 'legacy';

export interface PresetApplyResult {
  transform: Transform;
  opacity: number;
  filter?: string;
  compositeOperation?: GlobalCompositeOperation;
}

export interface PresetDefinition {
  id: string;
  name: string;
  description?: string;
  category: 'entrance' | 'exit' | 'emphasis' | 'motion' | 'fx' | 'transition' | 'text';
  schema: EffectParamSchema[];
  quality?: PresetQuality;
  mood?: PresetMood | PresetMood[];
  material?: PresetMaterial | PresetMaterial[];
  dimensions?: {
    materialOptics?: boolean;
    physicsMotion?: boolean;
    spatialDepth?: boolean;
    styleEmotion?: boolean;
  };
  physics?: string[];
  apply: (progress: number, params: any, currentTransform: Transform, ctx?: CanvasRenderingContext2D) => PresetApplyResult;
}
`;

const files = {
  // ============== ENTRANCE ==============
  'entrance/fadeIn.ts': `import { PresetDefinition } from '../types';
import { spring, dampedOscillation, easeOutExpo } from '../../utils/easing';

export const fadeIn: PresetDefinition = {
  id: 'entrance_fade_in',
  name: '霓虹淡入 (Neon Fade In)',
  description: '带弹簧 settle、霓虹 glow 和轻微 3D 翻转的真实感淡入',
  category: 'entrance',
  quality: 'viral',
  mood: 'mysterious',
  material: 'neon',
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['spring', 'dampedOscillation', 'easeOutExpo'],
  schema: [
    { key: 'scaleFrom', label: '起始缩放', type: 'number', default: 0.75, min: 0.1, max: 1.5, step: 0.05 },
    { key: 'rotateXFrom', label: '起始X轴旋转', type: 'number', default: 25, min: -90, max: 90, step: 5 },
    { key: 'glowColor', label: '发光颜色', type: 'color', default: '#00f0ff' },
  ],
  apply: (progress, params, currentTransform) => {
    const scaleFrom = Math.max(0.1, Math.min(1.5, params.scaleFrom || 0.75));
    const rotateXFrom = Math.max(-90, Math.min(90, params.rotateXFrom || 25));
    const glowColor = params.glowColor || '#00f0ff';
    const t = Math.max(0, Math.min(1, progress));

    const springValue = spring(t, 140, 14, 1);
    const scale = scaleFrom + (1 - scaleFrom) * springValue;
    const opacity = easeOutExpo(t);
    const rotateX = rotateXFrom * (1 - springValue);
    const settleWobble = t < 1 ? dampedOscillation(t, 4, 0.25) * 0.02 * (1 - t) : 0;

    return {
      transform: {
        ...currentTransform,
        scale: Math.max(0.001, currentTransform.scale * (scale + settleWobble)),
        rotateX: (currentTransform.rotateX || 0) + rotateX,
      },
      opacity: Math.max(0.01, opacity),
      filter: \`drop-shadow(0 0 8px \${glowColor}) drop-shadow(0 0 24px \${glowColor}) drop-shadow(0 0 48px \${glowColor}80)\`
    };
  }
};
`,
  'entrance/fadeInUp.ts': `import { PresetDefinition } from '../types';
import { spring, dampedOscillation, easeOutExpo } from '../../utils/easing';

export const fadeInUp: PresetDefinition = {
  id: 'entrance_fade_in_up',
  name: '霓虹上浮淡入 (Neon Fade Up)',
  description: '带弹性 settle 的向上滑入淡入',
  category: 'entrance',
  quality: 'viral',
  mood: 'release',
  material: 'neon',
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['spring', 'dampedOscillation', 'easeOutExpo'],
  schema: [
    { key: 'distance', label: '距离', type: 'number', default: 120, min: 0, max: 600 },
    { key: 'glowColor', label: '发光色', type: 'color', default: '#ff00a0' },
  ],
  apply: (progress, params, currentTransform) => {
    const distance = Math.max(0, Math.min(600, params.distance || 120));
    const glowColor = params.glowColor || '#ff00a0';
    const t = Math.max(0, Math.min(1, progress));

    const springValue = spring(t, 140, 14, 1);
    const y = distance * (1 - springValue);
    const wobble = t < 1 ? dampedOscillation(t, 4, 0.25) * 0.02 * (1 - t) : 0;

    return {
      transform: {
        ...currentTransform,
        y: currentTransform.y + y,
        scale: Math.max(0.001, currentTransform.scale * (0.95 + 0.05 * springValue + wobble)),
        rotateX: (currentTransform.rotateX || 0) - (1 - springValue) * 15,
      },
      opacity: Math.max(0.01, easeOutExpo(t)),
      filter: \`drop-shadow(0 0 8px \${glowColor}) drop-shadow(0 0 20px \${glowColor}88)\`
    };
  }
};
`,
  'entrance/fadeInDown.ts': `import { PresetDefinition } from '../types';
import { spring, dampedOscillation, easeOutExpo } from '../../utils/easing';

export const fadeInDown: PresetDefinition = {
  id: 'entrance_fade_in_down',
  name: '霓虹下落淡入 (Neon Fade Down)',
  description: '带弹性 settle 的向下滑入淡入',
  category: 'entrance',
  quality: 'viral',
  mood: 'mysterious',
  material: 'neon',
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['spring', 'dampedOscillation', 'easeOutExpo'],
  schema: [
    { key: 'distance', label: '距离', type: 'number', default: 120, min: 0, max: 600 },
    { key: 'glowColor', label: '发光色', type: 'color', default: '#00f0ff' },
  ],
  apply: (progress, params, currentTransform) => {
    const distance = Math.max(0, Math.min(600, params.distance || 120));
    const glowColor = params.glowColor || '#00f0ff';
    const t = Math.max(0, Math.min(1, progress));

    const springValue = spring(t, 140, 14, 1);
    const y = -distance * (1 - springValue);
    const wobble = t < 1 ? dampedOscillation(t, 4, 0.25) * 0.02 * (1 - t) : 0;

    return {
      transform: {
        ...currentTransform,
        y: currentTransform.y + y,
        scale: Math.max(0.001, currentTransform.scale * (0.95 + 0.05 * springValue + wobble)),
        rotateX: (currentTransform.rotateX || 0) + (1 - springValue) * 15,
      },
      opacity: Math.max(0.01, easeOutExpo(t)),
      filter: \`drop-shadow(0 0 8px \${glowColor}) drop-shadow(0 0 20px \${glowColor}88)\`
    };
  }
};
`,
  'entrance/fadeInLeft.ts': `import { PresetDefinition } from '../types';
import { spring, dampedOscillation, easeOutExpo } from '../../utils/easing';

export const fadeInLeft: PresetDefinition = {
  id: 'entrance_fade_in_left',
  name: '霓虹左浮淡入 (Neon Fade Left)',
  description: '带弹性 settle 的向左滑入淡入',
  category: 'entrance',
  quality: 'viral',
  mood: 'calm',
  material: 'neon',
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['spring', 'dampedOscillation', 'easeOutExpo'],
  schema: [
    { key: 'distance', label: '距离', type: 'number', default: 120, min: 0, max: 600 },
    { key: 'glowColor', label: '发光色', type: 'color', default: '#a855f7' },
  ],
  apply: (progress, params, currentTransform) => {
    const distance = Math.max(0, Math.min(600, params.distance || 120));
    const glowColor = params.glowColor || '#a855f7';
    const t = Math.max(0, Math.min(1, progress));

    const springValue = spring(t, 140, 14, 1);
    const x = distance * (1 - springValue);
    const wobble = t < 1 ? dampedOscillation(t, 4, 0.25) * 0.02 * (1 - t) : 0;

    return {
      transform: {
        ...currentTransform,
        x: currentTransform.x + x,
        scale: Math.max(0.001, currentTransform.scale * (0.95 + 0.05 * springValue + wobble)),
        rotateY: (currentTransform.rotateY || 0) + (1 - springValue) * 20,
      },
      opacity: Math.max(0.01, easeOutExpo(t)),
      filter: \`drop-shadow(0 0 8px \${glowColor}) drop-shadow(0 0 20px \${glowColor}88)\`
    };
  }
};
`,
  'entrance/fadeInRight.ts': `import { PresetDefinition } from '../types';
import { spring, dampedOscillation, easeOutExpo } from '../../utils/easing';

export const fadeInRight: PresetDefinition = {
  id: 'entrance_fade_in_right',
  name: '霓虹右浮淡入 (Neon Fade Right)',
  description: '带弹性 settle 的向右滑入淡入',
  category: 'entrance',
  quality: 'viral',
  mood: 'calm',
  material: 'neon',
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['spring', 'dampedOscillation', 'easeOutExpo'],
  schema: [
    { key: 'distance', label: '距离', type: 'number', default: 120, min: 0, max: 600 },
    { key: 'glowColor', label: '发光色', type: 'color', default: '#00ff9d' },
  ],
  apply: (progress, params, currentTransform) => {
    const distance = Math.max(0, Math.min(600, params.distance || 120));
    const glowColor = params.glowColor || '#00ff9d';
    const t = Math.max(0, Math.min(1, progress));

    const springValue = spring(t, 140, 14, 1);
    const x = -distance * (1 - springValue);
    const wobble = t < 1 ? dampedOscillation(t, 4, 0.25) * 0.02 * (1 - t) : 0;

    return {
      transform: {
        ...currentTransform,
        x: currentTransform.x + x,
        scale: Math.max(0.001, currentTransform.scale * (0.95 + 0.05 * springValue + wobble)),
        rotateY: (currentTransform.rotateY || 0) - (1 - springValue) * 20,
      },
      opacity: Math.max(0.01, easeOutExpo(t)),
      filter: \`drop-shadow(0 0 8px \${glowColor}) drop-shadow(0 0 20px \${glowColor}88)\`
    };
  }
};
`,
  'entrance/zoomIn.ts': `import { PresetDefinition } from '../types';
import { spring, dampedOscillation, easeOutExpo } from '../../utils/easing';

export const zoomIn: PresetDefinition = {
  id: 'entrance_zoom_in',
  name: '3D 弹性缩放 (3D Elastic Zoom)',
  description: '从远处带有景深的弹性缩放入场，带发光和 RGB 色散',
  category: 'entrance',
  quality: 'viral',
  mood: 'excitement',
  material: 'metal',
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['spring', 'dampedOscillation', 'easeOutExpo'],
  schema: [
    { key: 'scaleFrom', label: '起始缩放', type: 'number', default: 0.2, min: 0.05, max: 1, step: 0.05 },
    { key: 'rotateYFrom', label: '起始Y轴旋转', type: 'number', default: -45, min: -90, max: 90, step: 5 },
    { key: 'glowColor', label: '发光颜色', type: 'color', default: '#ff00a0' },
  ],
  apply: (progress, params, currentTransform) => {
    const scaleFrom = Math.max(0.05, Math.min(1, params.scaleFrom || 0.2));
    const rotateYFrom = Math.max(-90, Math.min(90, params.rotateYFrom || -45));
    const glowColor = params.glowColor || '#ff00a0';
    const t = Math.max(0, Math.min(1, progress));

    const springValue = spring(t, 180, 12, 1);
    const scale = scaleFrom + (1 - scaleFrom) * springValue;
    const rotateY = rotateYFrom * (1 - springValue);
    const wobble = t < 1 ? dampedOscillation(t, 3.5, 0.22) * 0.03 * (1 - t) : 0;
    const opacity = easeOutExpo(t);
    const chromaIntensity = (1 - springValue) * 4;

    return {
      transform: {
        ...currentTransform,
        scale: Math.max(0.001, currentTransform.scale * (scale + wobble)),
        rotateY: (currentTransform.rotateY || 0) + rotateY,
        depthZ: (currentTransform.depthZ || 0) - (1 - springValue) * 200,
      },
      opacity: Math.max(0.01, opacity),
      filter: \`drop-shadow(0 0 10px \${glowColor}) drop-shadow(0 0 30px \${glowColor}99) drop-shadow(\${chromaIntensity}px 0 0 rgba(255,0,0,0.5)) drop-shadow(-\${chromaIntensity}px 0 0 rgba(0,255,255,0.5))\`
    };
  }
};
`,
  'entrance/rotateIn.ts': `import { PresetDefinition } from '../types';
import { elasticOut, easeOutExpo, dampedOscillation } from '../../utils/easing';

export const rotateIn: PresetDefinition = {
  id: 'entrance_rotate_in',
  name: '金属飞旋 (Metal Spin In)',
  description: '带惯性甩尾和金属光泽的 3D 旋入',
  category: 'entrance',
  quality: 'viral',
  mood: 'epic',
  material: 'metal',
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['elasticOut', 'dampedOscillation', 'easeOutExpo', 'inertia'],
  schema: [
    { key: 'rotationFrom', label: '起始旋转', type: 'number', default: -180, min: -360, max: 360, step: 15 },
    { key: 'rotateYFrom', label: '起始Y轴翻转', type: 'number', default: 60, min: -90, max: 90, step: 5 },
    { key: 'metalColor', label: '金属色', type: 'color', default: '#c0c0c0' },
  ],
  apply: (progress, params, currentTransform) => {
    const rotationFrom = Math.max(-360, Math.min(360, params.rotationFrom || -180));
    const rotateYFrom = Math.max(-90, Math.min(90, params.rotateYFrom || 60));
    const metalColor = params.metalColor || '#c0c0c0';
    const t = Math.max(0, Math.min(1, progress));

    const elastic = elasticOut(t, 1, 0.35);
    const rotation = rotationFrom * (1 - elastic);
    const rotateY = rotateYFrom * (1 - elastic);
    const wobble = t < 1 ? dampedOscillation(t, 2.5, 0.2) * 3 * (1 - t) : 0;
    const opacity = easeOutExpo(t);

    return {
      transform: {
        ...currentTransform,
        rotation: currentTransform.rotation + rotation + wobble,
        rotateY: (currentTransform.rotateY || 0) + rotateY,
        scale: Math.max(0.001, currentTransform.scale * (0.7 + 0.3 * elastic)),
      },
      opacity: Math.max(0.01, opacity),
      filter: \`drop-shadow(0 0 12px \${metalColor}) drop-shadow(0 0 30px \${metalColor}77) contrast(1.15) brightness(1.1)\`
    };
  }
};
`,
  'entrance/flipInX.ts': `import { PresetDefinition } from '../types';
import { spring, easeOutExpo } from '../../utils/easing';

export const flipInX: PresetDefinition = {
  id: 'entrance_flip_in_x',
  name: '全息翻转 X (Hologram Flip X)',
  description: '真实 3D 绕 X 轴翻转入场，带全息残影',
  category: 'entrance',
  quality: 'viral',
  mood: 'excitement',
  material: 'hologram',
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['spring', 'easeOutExpo'],
  schema: [
    { key: 'holoColor', label: '全息色', type: 'color', default: '#00f0ff' },
  ],
  apply: (progress, params, currentTransform) => {
    const holoColor = params.holoColor || '#00f0ff';
    const t = Math.max(0, Math.min(1, progress));

    const springValue = spring(t, 160, 14, 1);
    const rotateX = 90 * (1 - springValue);
    const opacity = easeOutExpo(t);
    const chroma = (1 - springValue) * 6;

    return {
      transform: {
        ...currentTransform,
        rotateX: (currentTransform.rotateX || 0) + rotateX,
        scale: Math.max(0.001, currentTransform.scale * (0.85 + 0.15 * springValue)),
      },
      opacity: Math.max(0.01, opacity),
      filter: \`drop-shadow(0 0 10px \${holoColor}) drop-shadow(0 0 25px \${holoColor}88) drop-shadow(\${chroma}px 0 0 rgba(0,255,255,0.5)) drop-shadow(-\${chroma}px 0 0 rgba(255,0,255,0.5))\`
    };
  }
};
`,
  'entrance/flipInY.ts': `import { PresetDefinition } from '../types';
import { spring, easeOutExpo } from '../../utils/easing';

export const flipInY: PresetDefinition = {
  id: 'entrance_flip_in_y',
  name: '全息翻转 Y (Hologram Flip Y)',
  description: '真实 3D 绕 Y 轴翻转入场，带全息残影',
  category: 'entrance',
  quality: 'viral',
  mood: 'excitement',
  material: 'hologram',
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['spring', 'easeOutExpo'],
  schema: [
    { key: 'holoColor', label: '全息色', type: 'color', default: '#ff00a0' },
  ],
  apply: (progress, params, currentTransform) => {
    const holoColor = params.holoColor || '#ff00a0';
    const t = Math.max(0, Math.min(1, progress));

    const springValue = spring(t, 160, 14, 1);
    const rotateY = -90 * (1 - springValue);
    const opacity = easeOutExpo(t);
    const chroma = (1 - springValue) * 6;

    return {
      transform: {
        ...currentTransform,
        rotateY: (currentTransform.rotateY || 0) + rotateY,
        scale: Math.max(0.001, currentTransform.scale * (0.85 + 0.15 * springValue)),
      },
      opacity: Math.max(0.01, opacity),
      filter: \`drop-shadow(0 0 10px \${holoColor}) drop-shadow(0 0 25px \${holoColor}88) drop-shadow(\${chroma}px 0 0 rgba(255,0,0,0.5)) drop-shadow(-\${chroma}px 0 0 rgba(0,255,255,0.5))\`
    };
  }
};
`,
  'entrance/slideInLeft.ts': `import { PresetDefinition } from '../types';
import { whipEffect, spring, dampedOscillation, easeOutExpo } from '../../utils/easing';

export const slideInLeft: PresetDefinition = {
  id: 'entrance_slide_in_left',
  name: '惯性左滑 (Inertia Slide Left)',
  description: '带鞭打惯性、阻尼 settle 和霓虹拖尾的左侧滑入',
  category: 'entrance',
  quality: 'viral',
  mood: 'urgency',
  material: 'neon',
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['whipEffect', 'spring', 'dampedOscillation', 'easeOutExpo'],
  schema: [
    { key: 'distance', label: '距离', type: 'number', default: 700, min: 100, max: 2000 },
    { key: 'rotateYFrom', label: 'Y轴翻转', type: 'number', default: 35, min: -90, max: 90, step: 5 },
    { key: 'glowColor', label: '拖尾色', type: 'color', default: '#00f0ff' },
  ],
  apply: (progress, params, currentTransform) => {
    const distance = Math.max(100, Math.min(2000, params.distance || 700));
    const rotateYFrom = Math.max(-90, Math.min(90, params.rotateYFrom || 35));
    const glowColor = params.glowColor || '#00f0ff';
    const t = Math.max(0, Math.min(1, progress));

    const whip = whipEffect(t, 0.38);
    const settle = spring(t, 110, 12, 1);
    const currentX = distance * (1 - whip);
    const settleX = t < 1 ? (settle - whip) * distance * 0.05 : 0;
    const rotateY = rotateYFrom * (1 - whip);
    const wobble = t < 1 ? dampedOscillation(t, 4, 0.2) * 0.02 * (1 - t) : 0;

    return {
      transform: {
        ...currentTransform,
        x: currentTransform.x + currentX - settleX,
        rotateY: (currentTransform.rotateY || 0) + rotateY,
        scale: Math.max(0.001, currentTransform.scale * (1 + wobble)),
      },
      opacity: Math.max(0.01, easeOutExpo(Math.min(1, t * 1.5))),
      filter: \`drop-shadow(-\${distance * 0.02 * (1 - whip)}px 0 20px \${glowColor}66) drop-shadow(0 0 12px \${glowColor})\`
    };
  }
};
`,
  'entrance/slideInRight.ts': `import { PresetDefinition } from '../types';
import { whipEffect, spring, dampedOscillation, easeOutExpo } from '../../utils/easing';

export const slideInRight: PresetDefinition = {
  id: 'entrance_slide_in_right',
  name: '惯性右滑 (Inertia Slide Right)',
  description: '带鞭打惯性、阻尼 settle 和霓虹拖尾的右侧滑入',
  category: 'entrance',
  quality: 'viral',
  mood: 'urgency',
  material: 'neon',
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['whipEffect', 'spring', 'dampedOscillation', 'easeOutExpo'],
  schema: [
    { key: 'distance', label: '距离', type: 'number', default: 700, min: 100, max: 2000 },
    { key: 'rotateYFrom', label: 'Y轴翻转', type: 'number', default: -35, min: -90, max: 90, step: 5 },
    { key: 'glowColor', label: '拖尾色', type: 'color', default: '#ff00a0' },
  ],
  apply: (progress, params, currentTransform) => {
    const distance = Math.max(100, Math.min(2000, params.distance || 700));
    const rotateYFrom = Math.max(-90, Math.min(90, params.rotateYFrom || -35));
    const glowColor = params.glowColor || '#ff00a0';
    const t = Math.max(0, Math.min(1, progress));

    const whip = whipEffect(t, 0.38);
    const settle = spring(t, 110, 12, 1);
    const currentX = -distance * (1 - whip);
    const settleX = t < 1 ? (settle - whip) * distance * 0.05 : 0;
    const rotateY = rotateYFrom * (1 - whip);
    const wobble = t < 1 ? dampedOscillation(t, 4, 0.2) * 0.02 * (1 - t) : 0;

    return {
      transform: {
        ...currentTransform,
        x: currentTransform.x + currentX + settleX,
        rotateY: (currentTransform.rotateY || 0) + rotateY,
        scale: Math.max(0.001, currentTransform.scale * (1 + wobble)),
      },
      opacity: Math.max(0.01, easeOutExpo(Math.min(1, t * 1.5))),
      filter: \`drop-shadow(\${distance * 0.02 * (1 - whip)}px 0 20px \${glowColor}66) drop-shadow(0 0 12px \${glowColor})\`
    };
  }
};
`,
  'entrance/slideInUp.ts': `import { PresetDefinition } from '../types';
import { whipEffect, spring, dampedOscillation, easeOutExpo } from '../../utils/easing';

export const slideInUp: PresetDefinition = {
  id: 'entrance_slide_in_up',
  name: '重力上弹 (Gravity Bounce Up)',
  description: '带重力感和弹性 settle 的上滑入场',
  category: 'entrance',
  quality: 'viral',
  mood: 'release',
  material: 'glass',
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['whipEffect', 'spring', 'dampedOscillation', 'easeOutExpo'],
  schema: [
    { key: 'distance', label: '距离', type: 'number', default: 500, min: 100, max: 1500 },
    { key: 'rotateXFrom', label: 'X轴翻转', type: 'number', default: 40, min: -90, max: 90, step: 5 },
    { key: 'glowColor', label: '发光色', type: 'color', default: '#f6e05e' },
  ],
  apply: (progress, params, currentTransform) => {
    const distance = Math.max(100, Math.min(1500, params.distance || 500));
    const rotateXFrom = Math.max(-90, Math.min(90, params.rotateXFrom || 40));
    const glowColor = params.glowColor || '#f6e05e';
    const t = Math.max(0, Math.min(1, progress));

    const whip = whipEffect(t, 0.42);
    const settle = spring(t, 120, 13, 1);
    const currentY = distance * (1 - whip);
    const settleY = t < 1 ? (settle - whip) * distance * 0.04 : 0;
    const rotateX = rotateXFrom * (1 - whip);
    const wobble = t < 1 ? dampedOscillation(t, 3.5, 0.22) * 0.025 * (1 - t) : 0;

    return {
      transform: {
        ...currentTransform,
        y: currentTransform.y + currentY - settleY,
        rotateX: (currentTransform.rotateX || 0) + rotateX,
        scale: Math.max(0.001, currentTransform.scale * (1 + wobble)),
      },
      opacity: Math.max(0.01, easeOutExpo(Math.min(1, t * 1.5))),
      filter: \`drop-shadow(0 \${distance * 0.02 * (1 - whip)}px 20px \${glowColor}66) drop-shadow(0 0 12px \${glowColor})\`
    };
  }
};
`,
  'entrance/slideInDown.ts': `import { PresetDefinition } from '../types';
import { whipEffect, spring, dampedOscillation, easeOutExpo } from '../../utils/easing';

export const slideInDown: PresetDefinition = {
  id: 'entrance_slide_in_down',
  name: '重锤下落 (Heavy Drop In)',
  description: '带重量感的下落并弹性 settle',
  category: 'entrance',
  quality: 'viral',
  mood: 'tension',
  material: 'metal',
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['whipEffect', 'spring', 'dampedOscillation', 'easeOutExpo'],
  schema: [
    { key: 'distance', label: '距离', type: 'number', default: 500, min: 100, max: 1500 },
    { key: 'rotateXFrom', label: 'X轴翻转', type: 'number', default: -40, min: -90, max: 90, step: 5 },
    { key: 'glowColor', label: '发光色', type: 'color', default: '#ff0055' },
  ],
  apply: (progress, params, currentTransform) => {
    const distance = Math.max(100, Math.min(1500, params.distance || 500));
    const rotateXFrom = Math.max(-90, Math.min(90, params.rotateXFrom || -40));
    const glowColor = params.glowColor || '#ff0055';
    const t = Math.max(0, Math.min(1, progress));

    const whip = whipEffect(t, 0.35);
    const settle = spring(t, 140, 16, 1);
    const currentY = -distance * (1 - whip);
    const settleY = t < 1 ? (settle - whip) * distance * 0.04 : 0;
    const rotateX = rotateXFrom * (1 - whip);
    const wobble = t < 1 ? dampedOscillation(t, 3, 0.25) * 0.02 * (1 - t) : 0;

    return {
      transform: {
        ...currentTransform,
        y: currentTransform.y + currentY + settleY,
        rotateX: (currentTransform.rotateX || 0) + rotateX,
        scale: Math.max(0.001, currentTransform.scale * (1 + wobble)),
      },
      opacity: Math.max(0.01, easeOutExpo(Math.min(1, t * 1.5))),
      filter: \`drop-shadow(0 -\${distance * 0.02 * (1 - whip)}px 20px \${glowColor}66) drop-shadow(0 0 12px \${glowColor})\`
    };
  }
};
`,
  'entrance/smashIn.ts': `import { PresetDefinition } from '../types';
import { spring, whipEffect, dampedOscillation, easeOutExpo } from '../../utils/easing';

export const smashIn: PresetDefinition = {
  id: 'entrance_smash_in',
  name: '爆裂重击 (Smash Impact)',
  description: '高速冲击后剧烈回弹，带 RGB 色散和屏幕震动质感',
  category: 'entrance',
  quality: 'viral',
  mood: 'excitement',
  material: 'metal',
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['spring', 'whipEffect', 'dampedOscillation', 'easeOutExpo'],
  schema: [
    { key: 'impactColor', label: '冲击色', type: 'color', default: '#ff0055' },
    { key: 'shake', label: '震动强度', type: 'number', default: 18, min: 0, max: 60, step: 1 },
  ],
  apply: (progress, params, currentTransform) => {
    const impactColor = params.impactColor || '#ff0055';
    const shake = Math.max(0, Math.min(60, params.shake || 18));
    const t = Math.max(0, Math.min(1, progress));

    const whip = whipEffect(t, 0.55);
    const settle = spring(t, 220, 10, 1);
    const scale = 1.45 - 0.45 * whip + 0.08 * (settle - whip) * (1 - t);
    const rotate = Math.sin(t * Math.PI * 6) * shake * (1 - t) * t;
    const chroma = (1 - whip) * 10;

    return {
      transform: {
        ...currentTransform,
        scale: Math.max(0.001, currentTransform.scale * scale),
        rotation: currentTransform.rotation + rotate,
      },
      opacity: Math.max(0.01, easeOutExpo(Math.min(1, t * 1.4))),
      filter: \`drop-shadow(0 0 20px \${impactColor}) drop-shadow(0 0 60px \${impactColor}99) drop-shadow(\${chroma}px 0 0 rgba(255,0,0,0.6)) drop-shadow(-\${chroma}px 0 0 rgba(0,255,255,0.6))\`
    };
  }
};
`,
  'entrance/glitchIn.ts': `import { PresetDefinition } from '../types';
import { perlinNoise1D, spring, easeOutExpo } from '../../utils/easing';

export const glitchIn: PresetDefinition = {
  id: 'entrance_glitch_in',
  name: '赛博故障进入 (Cyber Glitch In)',
  description: '数字解码式故障进入，带 RGB 分离、扫描线和霓虹发光',
  category: 'entrance',
  quality: 'viral',
  mood: 'urgency',
  material: 'neon',
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['perlinNoise1D', 'spring', 'easeOutExpo'],
  schema: [
    { key: 'glitchColor', label: '故障主色', type: 'color', default: '#00f0ff' },
    { key: 'intensity', label: '故障强度', type: 'number', default: 22, min: 0, max: 60, step: 1 },
  ],
  apply: (progress, params, currentTransform) => {
    const glitchColor = params.glitchColor || '#00f0ff';
    const intensity = Math.max(0, Math.min(60, params.intensity || 22));
    const t = Math.max(0, Math.min(1, progress));

    const springValue = spring(t, 160, 14, 1);
    const scale = 0.85 + 0.15 * springValue;
    const noise = perlinNoise1D(t, 12, 0);
    const jitterX = noise * intensity * (1 - springValue);
    const jitterY = perlinNoise1D(t, 16, 5) * intensity * 0.4 * (1 - springValue);
    const chroma = (1 - springValue) * 8;
    const opacity = easeOutExpo(t);

    return {
      transform: {
        ...currentTransform,
        x: currentTransform.x + jitterX,
        y: currentTransform.y + jitterY,
        scale: Math.max(0.001, currentTransform.scale * scale),
        skewX: (currentTransform.skewX || 0) + noise * 12 * (1 - springValue),
      },
      opacity: Math.max(0.01, opacity),
      filter: \`drop-shadow(0 0 12px \${glitchColor}) drop-shadow(\${chroma}px 0 0 rgba(255,0,0,0.55)) drop-shadow(-\${chroma}px 0 0 rgba(0,255,255,0.55))\`
    };
  }
};
`,
  'entrance/glitchSmash.ts': `import { PresetDefinition } from '../types';
import { perlinNoise1D, whipEffect, spring, dampedOscillation, easeOutExpo } from '../../utils/easing';

export const glitchSmash: PresetDefinition = {
  id: 'entrance_glitch_smash',
  name: '故障爆裂 (Glitch Smash)',
  description: '强冲击故障入场，结合速度线和数字抖动',
  category: 'entrance',
  quality: 'viral',
  mood: 'urgency',
  material: 'carbon',
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['perlinNoise1D', 'whipEffect', 'spring', 'dampedOscillation', 'easeOutExpo'],
  schema: [
    { key: 'impactColor', label: '冲击色', type: 'color', default: '#ff0055' },
    { key: 'glitchIntensity', label: '故障强度', type: 'number', default: 30, min: 0, max: 80, step: 1 },
  ],
  apply: (progress, params, currentTransform) => {
    const impactColor = params.impactColor || '#ff0055';
    const glitchIntensity = Math.max(0, Math.min(80, params.glitchIntensity || 30));
    const t = Math.max(0, Math.min(1, progress));

    const whip = whipEffect(t, 0.6);
    const settle = spring(t, 200, 11, 1);
    const scale = 1.35 - 0.35 * whip;
    const noise = perlinNoise1D(t, 14, 0);
    const jitterX = noise * glitchIntensity * (1 - whip);
    const jitterY = perlinNoise1D(t, 18, 3) * glitchIntensity * 0.35 * (1 - whip);
    const chroma = (1 - whip) * 12;
    const wobble = t < 1 ? dampedOscillation(t, 5, 0.25) * 0.03 * (1 - t) : 0;

    return {
      transform: {
        ...currentTransform,
        x: currentTransform.x + jitterX,
        y: currentTransform.y + jitterY,
        scale: Math.max(0.001, currentTransform.scale * (scale + wobble)),
        skewX: (currentTransform.skewX || 0) + noise * 15 * (1 - whip),
      },
      opacity: Math.max(0.01, easeOutExpo(Math.min(1, t * 1.5))),
      filter: \`drop-shadow(0 0 25px \${impactColor}) drop-shadow(0 0 60px \${impactColor}99) drop-shadow(\${chroma}px 0 0 rgba(255,0,0,0.6)) drop-shadow(-\${chroma}px 0 0 rgba(0,255,255,0.6))\`
    };
  }
};
`,
  'entrance/bounceIn.ts': `import { PresetDefinition } from '../types';
import { gravityBounce, easeOutExpo } from '../../utils/easing';

export const bounceIn: PresetDefinition = {
  id: 'entrance_bounce_in',
  name: '重力弹跳进入 (Gravity Bounce In)',
  description: '真实重力弹跳入场，带惯性和弹性反馈',
  category: 'entrance',
  quality: 'viral',
  mood: 'release',
  material: 'glass',
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['gravityBounce', 'easeOutExpo'],
  schema: [
    { key: 'glowColor', label: '发光色', type: 'color', default: '#f6e05e' },
    { key: 'height', label: '弹跳高度', type: 'number', default: 180, min: 0, max: 600 },
  ],
  apply: (progress, params, currentTransform) => {
    const glowColor = params.glowColor || '#f6e05e';
    const height = Math.max(0, Math.min(600, params.height || 180));
    const t = Math.max(0, Math.min(1, progress));

    const bounce = gravityBounce(t, 0.55, 12);
    const y = -height * (1 - bounce);
    const squash = 1 + Math.sin(bounce * Math.PI) * 0.12;
    const stretch = 1 / squash;

    return {
      transform: {
        ...currentTransform,
        y: currentTransform.y + y,
        scale: Math.max(0.001, currentTransform.scale * stretch * squash),
      },
      opacity: Math.max(0.01, easeOutExpo(t)),
      filter: \`drop-shadow(0 0 10px \${glowColor}) drop-shadow(0 0 30px \${glowColor}88)\`
    };
  }
};
`,
  'entrance/elasticBounce.ts': `import { PresetDefinition } from '../types';
import { elasticOut, dampedOscillation, easeOutExpo } from '../../utils/easing';

export const elasticBounce: PresetDefinition = {
  id: 'entrance_elastic_bounce',
  name: '弹性果冻进入 (Elastic Jelly In)',
  description: '超弹性果冻质感进入，带多次回弹和液体变形',
  category: 'entrance',
  quality: 'viral',
  mood: 'excitement',
  material: 'liquid',
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['elasticOut', 'dampedOscillation', 'easeOutExpo'],
  schema: [
    { key: 'glowColor', label: '发光色', type: 'color', default: '#00ff9d' },
    { key: 'scaleFrom', label: '起始缩放', type: 'number', default: 0.3, min: 0.05, max: 1, step: 0.05 },
  ],
  apply: (progress, params, currentTransform) => {
    const glowColor = params.glowColor || '#00ff9d';
    const scaleFrom = Math.max(0.05, Math.min(1, params.scaleFrom || 0.3));
    const t = Math.max(0, Math.min(1, progress));

    const elastic = elasticOut(t, 1, 0.28);
    const scale = scaleFrom + (1 - scaleFrom) * elastic;
    const wobbleX = 1 + dampedOscillation(t, 4, 0.28) * 0.08 * (1 - t);
    const wobbleY = 1 - dampedOscillation(t, 4, 0.28) * 0.05 * (1 - t);

    return {
      transform: {
        ...currentTransform,
        scale: Math.max(0.001, currentTransform.scale * scale * wobbleX * wobbleY),
      },
      opacity: Math.max(0.01, easeOutExpo(t)),
      filter: \`drop-shadow(0 0 10px \${glowColor}) drop-shadow(0 0 30px \${glowColor}88)\`
    };
  }
};
`,
  'entrance/springScale.ts': `import { PresetDefinition } from '../types';
import { spring, dampedOscillation, easeOutExpo } from '../../utils/easing';

export const springScale: PresetDefinition = {
  id: 'entrance_spring_scale',
  name: '弹簧缩放进入 (Spring Scale In)',
  description: '带明显弹簧 overshoot 的缩放进入，适合 CTAs',
  category: 'entrance',
  quality: 'viral',
  mood: 'excitement',
  material: 'glass',
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['spring', 'dampedOscillation', 'easeOutExpo'],
  schema: [
    { key: 'glowColor', label: '发光色', type: 'color', default: '#00f0ff' },
    { key: 'stiffness', label: '刚度', type: 'number', default: 200, min: 50, max: 400, step: 10 },
  ],
  apply: (progress, params, currentTransform) => {
    const glowColor = params.glowColor || '#00f0ff';
    const stiffness = Math.max(50, Math.min(400, params.stiffness || 200));
    const t = Math.max(0, Math.min(1, progress));

    const springValue = spring(t, stiffness, 10, 1);
    const scale = 0.4 + 0.6 * springValue;
    const wobble = t < 1 ? dampedOscillation(t, 3.5, 0.18) * 0.04 * (1 - t) : 0;

    return {
      transform: {
        ...currentTransform,
        scale: Math.max(0.001, currentTransform.scale * (scale + wobble)),
      },
      opacity: Math.max(0.01, easeOutExpo(t)),
      filter: \`drop-shadow(0 0 12px \${glowColor}) drop-shadow(0 0 36px \${glowColor}88)\`
    };
  }
};
`,

  // ============== EXIT ==============
  'exit/fadeOut.ts': `import { PresetDefinition } from '../types';
import { easeInExpo, dampedOscillation } from '../../utils/easing';

export const fadeOut: PresetDefinition = {
  id: 'exit_fade_out',
  name: '色散淡出 (Chromatic Fade Out)',
  description: '带 RGB 色散和轻微 3D 翻转的淡出',
  category: 'exit',
  quality: 'viral',
  mood: 'mysterious',
  material: 'neon',
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['easeInExpo', 'dampedOscillation'],
  schema: [
    { key: 'rotateXTo', label: '退出X轴旋转', type: 'number', default: -25, min: -90, max: 90, step: 5 },
  ],
  apply: (progress, params, currentTransform) => {
    const rotateXTo = Math.max(-90, Math.min(90, params.rotateXTo || -25));
    const t = Math.max(0, Math.min(1, progress));

    const opacity = 1 - easeInExpo(t);
    const chroma = t * 8;
    const wobble = dampedOscillation(t, 5, 0.3) * 3 * t;

    return {
      transform: {
        ...currentTransform,
        rotateX: (currentTransform.rotateX || 0) + rotateXTo * t,
        scale: Math.max(0.001, currentTransform.scale * (1 - t * 0.2)),
        x: currentTransform.x + wobble,
      },
      opacity: Math.max(0, opacity),
      filter: \`drop-shadow(\${chroma}px 0 0 rgba(255,0,0,0.5)) drop-shadow(-\${chroma}px 0 0 rgba(0,255,255,0.5))\`
    };
  }
};
`,
  'exit/fadeOutUp.ts': `import { PresetDefinition } from '../types';
import { easeInExpo } from '../../utils/easing';

export const fadeOutUp: PresetDefinition = {
  id: 'exit_fade_out_up',
  name: '上浮淡出 (Fade Out Up)',
  description: '向上漂浮并淡出，带霓虹拖尾',
  category: 'exit',
  quality: 'viral',
  mood: 'calm',
  material: 'neon',
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['easeInExpo'],
  schema: [
    { key: 'distance', label: '距离', type: 'number', default: 160, min: 0, max: 800 },
    { key: 'glowColor', label: '发光色', type: 'color', default: '#00f0ff' },
  ],
  apply: (progress, params, currentTransform) => {
    const distance = Math.max(0, Math.min(800, params.distance || 160));
    const glowColor = params.glowColor || '#00f0ff';
    const t = Math.max(0, Math.min(1, progress));

    const ease = easeInExpo(t);
    const y = -distance * ease;
    const opacity = 1 - ease;

    return {
      transform: {
        ...currentTransform,
        y: currentTransform.y + y,
        scale: Math.max(0.001, currentTransform.scale * (1 - t * 0.1)),
      },
      opacity: Math.max(0, opacity),
      filter: \`drop-shadow(0 \${distance * 0.05 * t}px 20px \${glowColor}66)\`
    };
  }
};
`,
  'exit/fadeOutDown.ts': `import { PresetDefinition } from '../types';
import { easeInExpo } from '../../utils/easing';

export const fadeOutDown: PresetDefinition = {
  id: 'exit_fade_out_down',
  name: '下沉淡出 (Fade Out Down)',
  description: '向下沉降并淡出，带重量感',
  category: 'exit',
  quality: 'viral',
  mood: 'tension',
  material: 'metal',
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['easeInExpo'],
  schema: [
    { key: 'distance', label: '距离', type: 'number', default: 160, min: 0, max: 800 },
    { key: 'glowColor', label: '发光色', type: 'color', default: '#ff0055' },
  ],
  apply: (progress, params, currentTransform) => {
    const distance = Math.max(0, Math.min(800, params.distance || 160));
    const glowColor = params.glowColor || '#ff0055';
    const t = Math.max(0, Math.min(1, progress));

    const ease = easeInExpo(t);
    const y = distance * ease;
    const opacity = 1 - ease;

    return {
      transform: {
        ...currentTransform,
        y: currentTransform.y + y,
        scale: Math.max(0.001, currentTransform.scale * (1 - t * 0.15)),
      },
      opacity: Math.max(0, opacity),
      filter: \`drop-shadow(0 -\${distance * 0.05 * t}px 20px \${glowColor}66)\`
    };
  }
};
`,
  'exit/zoomOut.ts': `import { PresetDefinition } from '../types';
import { easeInExpo, dampedOscillation } from '../../utils/easing';

export const zoomOut: PresetDefinition = {
  id: 'exit_zoom_out',
  name: '3D 景深退出 (3D Zoom Out)',
  description: '带景深后退、变小和发光衰减的退出',
  category: 'exit',
  quality: 'viral',
  mood: 'mysterious',
  material: 'hologram',
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['easeInExpo', 'dampedOscillation'],
  schema: [
    { key: 'scaleTo', label: '目标缩放', type: 'number', default: 0.2, min: 0.05, max: 1, step: 0.05 },
    { key: 'glowColor', label: '发光色', type: 'color', default: '#00f0ff' },
  ],
  apply: (progress, params, currentTransform) => {
    const scaleTo = Math.max(0.05, Math.min(1, params.scaleTo || 0.2));
    const glowColor = params.glowColor || '#00f0ff';
    const t = Math.max(0, Math.min(1, progress));

    const ease = easeInExpo(t);
    const scale = 1 - (1 - scaleTo) * ease;
    const opacity = 1 - ease;
    const wobble = dampedOscillation(t, 4, 0.25) * 2 * t;

    return {
      transform: {
        ...currentTransform,
        scale: Math.max(0.001, currentTransform.scale * scale),
        depthZ: (currentTransform.depthZ || 0) - t * 300,
        rotateY: (currentTransform.rotateY || 0) + t * 30,
        x: currentTransform.x + wobble,
      },
      opacity: Math.max(0, opacity),
      filter: \`drop-shadow(0 0 \${20 * (1 - t)}px \${glowColor}) blur(\${t * 4}px)\`
    };
  }
};
`,
  'exit/slideOutDown.ts': `import { PresetDefinition } from '../types';
import { easeInExpo, dampedOscillation } from '../../utils/easing';

export const slideOutDown: PresetDefinition = {
  id: 'exit_slide_out_down',
  name: '惯性下坠退出 (Inertia Drop Out)',
  description: '带重量感的向下惯性和淡出',
  category: 'exit',
  quality: 'viral',
  mood: 'tension',
  material: 'metal',
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['easeInExpo', 'dampedOscillation'],
  schema: [
    { key: 'distance', label: '距离', type: 'number', default: 500, min: 100, max: 1500 },
    { key: 'glowColor', label: '拖尾色', type: 'color', default: '#ff0055' },
  ],
  apply: (progress, params, currentTransform) => {
    const distance = Math.max(100, Math.min(1500, params.distance || 500));
    const glowColor = params.glowColor || '#ff0055';
    const t = Math.max(0, Math.min(1, progress));

    const ease = easeInExpo(t);
    const y = distance * ease;
    const opacity = 1 - ease;
    const rotateX = t * 40;

    return {
      transform: {
        ...currentTransform,
        y: currentTransform.y + y,
        rotateX: (currentTransform.rotateX || 0) + rotateX,
        scale: Math.max(0.001, currentTransform.scale * (1 - t * 0.15)),
      },
      opacity: Math.max(0, opacity),
      filter: \`drop-shadow(0 -\${distance * 0.02 * t}px 20px \${glowColor}66) drop-shadow(0 0 10px \${glowColor})\`
    };
  }
};
`,
  'exit/slideOutUp.ts': `import { PresetDefinition } from '../types';
import { easeInExpo } from '../../utils/easing';

export const slideOutUp: PresetDefinition = {
  id: 'exit_slide_out_up',
  name: '弹射上出 (Launch Out Up)',
  description: '带惯性的向上弹射退出',
  category: 'exit',
  quality: 'viral',
  mood: 'excitement',
  material: 'neon',
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['easeInExpo'],
  schema: [
    { key: 'distance', label: '距离', type: 'number', default: 500, min: 100, max: 1500 },
    { key: 'glowColor', label: '拖尾色', type: 'color', default: '#00f0ff' },
  ],
  apply: (progress, params, currentTransform) => {
    const distance = Math.max(100, Math.min(1500, params.distance || 500));
    const glowColor = params.glowColor || '#00f0ff';
    const t = Math.max(0, Math.min(1, progress));

    const ease = easeInExpo(t);
    const y = -distance * ease;
    const opacity = 1 - ease;

    return {
      transform: {
        ...currentTransform,
        y: currentTransform.y + y,
        scale: Math.max(0.001, currentTransform.scale * (1 - t * 0.1)),
      },
      opacity: Math.max(0, opacity),
      filter: \`drop-shadow(0 \${distance * 0.02 * t}px 20px \${glowColor}66) drop-shadow(0 0 10px \${glowColor})\`
    };
  }
};
`,
  'exit/slideOutLeft.ts': `import { PresetDefinition } from '../types';
import { easeInExpo } from '../../utils/easing';

export const slideOutLeft: PresetDefinition = {
  id: 'exit_slide_out_left',
  name: '惯性左出 (Inertia Slide Left)',
  description: '带拖尾的向左惯性退出',
  category: 'exit',
  quality: 'viral',
  mood: 'urgency',
  material: 'neon',
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['easeInExpo'],
  schema: [
    { key: 'distance', label: '距离', type: 'number', default: 600, min: 100, max: 2000 },
    { key: 'glowColor', label: '拖尾色', type: 'color', default: '#a855f7' },
  ],
  apply: (progress, params, currentTransform) => {
    const distance = Math.max(100, Math.min(2000, params.distance || 600));
    const glowColor = params.glowColor || '#a855f7';
    const t = Math.max(0, Math.min(1, progress));

    const ease = easeInExpo(t);
    const x = -distance * ease;
    const opacity = 1 - ease;

    return {
      transform: {
        ...currentTransform,
        x: currentTransform.x + x,
        rotateY: (currentTransform.rotateY || 0) - t * 30,
        scale: Math.max(0.001, currentTransform.scale * (1 - t * 0.1)),
      },
      opacity: Math.max(0, opacity),
      filter: \`drop-shadow(\${distance * 0.02 * t}px 0 20px \${glowColor}66) drop-shadow(0 0 10px \${glowColor})\`
    };
  }
};
`,
  'exit/slideOutRight.ts': `import { PresetDefinition } from '../types';
import { easeInExpo } from '../../utils/easing';

export const slideOutRight: PresetDefinition = {
  id: 'exit_slide_out_right',
  name: '惯性右出 (Inertia Slide Right)',
  description: '带拖尾的向右惯性退出',
  category: 'exit',
  quality: 'viral',
  mood: 'urgency',
  material: 'neon',
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['easeInExpo'],
  schema: [
    { key: 'distance', label: '距离', type: 'number', default: 600, min: 100, max: 2000 },
    { key: 'glowColor', label: '拖尾色', type: 'color', default: '#00ff9d' },
  ],
  apply: (progress, params, currentTransform) => {
    const distance = Math.max(100, Math.min(2000, params.distance || 600));
    const glowColor = params.glowColor || '#00ff9d';
    const t = Math.max(0, Math.min(1, progress));

    const ease = easeInExpo(t);
    const x = distance * ease;
    const opacity = 1 - ease;

    return {
      transform: {
        ...currentTransform,
        x: currentTransform.x + x,
        rotateY: (currentTransform.rotateY || 0) + t * 30,
        scale: Math.max(0.001, currentTransform.scale * (1 - t * 0.1)),
      },
      opacity: Math.max(0, opacity),
      filter: \`drop-shadow(-\${distance * 0.02 * t}px 0 20px \${glowColor}66) drop-shadow(0 0 10px \${glowColor})\`
    };
  }
};
`,
  'exit/bounceOut.ts': `import { PresetDefinition } from '../types';
import { gravityBounce, easeInExpo } from '../../utils/easing';

export const bounceOut: PresetDefinition = {
  id: 'exit_bounce_out',
  name: '弹跳消失 (Bounce Out)',
  description: '真实重力弹跳后缩小消失',
  category: 'exit',
  quality: 'viral',
  mood: 'release',
  material: 'glass',
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['gravityBounce', 'easeInExpo'],
  schema: [
    { key: 'glowColor', label: '发光色', type: 'color', default: '#f6e05e' },
  ],
  apply: (progress, params, currentTransform) => {
    const glowColor = params.glowColor || '#f6e05e';
    const t = Math.max(0, Math.min(1, progress));

    const bounce = gravityBounce(t, 0.5, 12);
    const y = 180 * (1 - bounce);
    const scale = 1 - easeInExpo(t) * 0.5;
    const opacity = 1 - easeInExpo(t);

    return {
      transform: {
        ...currentTransform,
        y: currentTransform.y + y,
        scale: Math.max(0.001, currentTransform.scale * scale),
      },
      opacity: Math.max(0, opacity),
      filter: \`drop-shadow(0 0 10px \${glowColor}) drop-shadow(0 0 30px \${glowColor}66)\`
    };
  }
};
`,
  'exit/glitchOut.ts': `import { PresetDefinition } from '../types';
import { perlinNoise1D, easeInExpo } from '../../utils/easing';

export const glitchOut: PresetDefinition = {
  id: 'exit_glitch_out',
  name: '故障消散 (Glitch Dissolve)',
  description: '数字故障抖动并色散消失',
  category: 'exit',
  quality: 'viral',
  mood: 'urgency',
  material: 'neon',
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: false, styleEmotion: true },
  physics: ['perlinNoise1D', 'easeInExpo'],
  schema: [
    { key: 'glitchColor', label: '故障色', type: 'color', default: '#00f0ff' },
    { key: 'intensity', label: '强度', type: 'number', default: 28, min: 0, max: 80, step: 1 },
  ],
  apply: (progress, params, currentTransform) => {
    const glitchColor = params.glitchColor || '#00f0ff';
    const intensity = Math.max(0, Math.min(80, params.intensity || 28));
    const t = Math.max(0, Math.min(1, progress));

    const noise = perlinNoise1D(t, 14, 0);
    const jitterX = noise * intensity * t;
    const jitterY = perlinNoise1D(t, 18, 3) * intensity * 0.4 * t;
    const chroma = t * 10;
    const opacity = 1 - easeInExpo(t);

    return {
      transform: {
        ...currentTransform,
        x: currentTransform.x + jitterX,
        y: currentTransform.y + jitterY,
        skewX: (currentTransform.skewX || 0) + noise * 15 * t,
      },
      opacity: Math.max(0, opacity),
      filter: \`drop-shadow(0 0 12px \${glitchColor}) drop-shadow(\${chroma}px 0 0 rgba(255,0,0,0.55)) drop-shadow(-\${chroma}px 0 0 rgba(0,255,255,0.55))\`
    };
  }
};
`,

  // ============== EMPHASIS ==============
  'emphasis/flash.ts': `import { PresetDefinition } from '../types';
import { perlinNoise1D, dampedOscillation } from '../../utils/easing';

export const flash: PresetDefinition = {
  id: 'emphasis_flash',
  name: 'CRT 爆闪 (CRT Flash)',
  description: '模拟 CRT 显示器过曝闪烁与扫描线',
  category: 'emphasis',
  quality: 'viral',
  mood: 'urgency',
  material: 'neon',
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: false, styleEmotion: true },
  physics: ['perlinNoise1D', 'dampedOscillation'],
  schema: [
    { key: 'intensity', label: '强度', type: 'number', default: 0.4, min: 0, max: 1, step: 0.05 },
    { key: 'color', label: '闪烁色', type: 'color', default: '#ffffff' },
  ],
  apply: (progress, params, currentTransform) => {
    const intensity = Math.max(0, Math.min(1, params.intensity || 0.4));
    const color = params.color || '#ffffff';
    const t = Math.max(0, Math.min(1, progress));

    const noise = perlinNoise1D(t, 18, 0) * intensity;
    const wave = dampedOscillation(t, 3, 0.2) * 0.15 * intensity;
    const brightness = 1 + Math.abs(noise) * 0.8 + wave;

    return {
      transform: currentTransform,
      opacity: 1,
      filter: \`brightness(\${brightness}) contrast(1.2) drop-shadow(0 0 \${15 * brightness}px \${color})\`
    };
  }
};
`,
  'emphasis/jitter.ts': `import { PresetDefinition } from '../types';
import { perlinNoise1D, dampedOscillation } from '../../utils/easing';

export const jitter: PresetDefinition = {
  id: 'emphasis_jitter',
  name: '数字故障抖动 (Digital Glitch Jitter)',
  description: '带 RGB 分离和位置抖动的故障强调',
  category: 'emphasis',
  quality: 'viral',
  mood: 'urgency',
  material: 'neon',
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: false, styleEmotion: true },
  physics: ['perlinNoise1D', 'dampedOscillation'],
  schema: [
    { key: 'intensity', label: '强度', type: 'number', default: 18, min: 0, max: 60, step: 1 },
    { key: 'rgbShift', label: 'RGB分离', type: 'number', default: 4, min: 0, max: 15, step: 0.5 },
  ],
  apply: (progress, params, currentTransform) => {
    const intensity = Math.max(0, Math.min(60, params.intensity || 18));
    const rgbShift = Math.max(0, Math.min(15, params.rgbShift || 4));
    const t = Math.max(0, Math.min(1, progress));

    const noiseX = perlinNoise1D(t, 16, 0) * 2 - 1;
    const noiseY = perlinNoise1D(t, 20, 5) * 2 - 1;
    const envelope = Math.exp(-t * 3.5);
    const jitterX = noiseX * intensity * envelope;
    const jitterY = noiseY * intensity * 0.5 * envelope;
    const scalePulse = 1 + perlinNoise1D(t, 12, 3) * 0.04 * envelope;

    return {
      transform: {
        ...currentTransform,
        x: currentTransform.x + jitterX,
        y: currentTransform.y + jitterY,
        scale: Math.max(0.001, currentTransform.scale * scalePulse),
      },
      opacity: 1,
      filter: \`drop-shadow(\${rgbShift}px 0 0 rgba(255,0,0,0.6)) drop-shadow(-\${rgbShift}px 0 0 rgba(0,255,255,0.6))\`
    };
  }
};
`,
  'emphasis/wobble.ts': `import { PresetDefinition } from '../types';
import { dampedOscillation } from '../../utils/easing';

export const wobble: PresetDefinition = {
  id: 'emphasis_wobble',
  name: '果冻弹性晃动 (Jelly Wobble)',
  description: '像果冻一样带阻尼的弹性晃动',
  category: 'emphasis',
  quality: 'viral',
  mood: 'release',
  material: 'liquid',
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['dampedOscillation'],
  schema: [
    { key: 'intensity', label: '强度', type: 'number', default: 12, min: 0, max: 45, step: 1 },
    { key: 'glowColor', label: '发光色', type: 'color', default: '#00f0ff' },
  ],
  apply: (progress, params, currentTransform) => {
    const intensity = Math.max(0, Math.min(45, params.intensity || 12));
    const glowColor = params.glowColor || '#00f0ff';
    const t = Math.max(0, Math.min(1, progress));

    const wobbleRot = dampedOscillation(t, 2.5, 0.3) * intensity;
    const wobbleScaleX = 1 + dampedOscillation(t, 3, 0.25) * 0.06;
    const wobbleScaleY = 1 - dampedOscillation(t, 3, 0.25) * 0.04;

    return {
      transform: {
        ...currentTransform,
        rotation: currentTransform.rotation + wobbleRot,
        scale: Math.max(0.001, currentTransform.scale * wobbleScaleX * wobbleScaleY),
        skewX: (currentTransform.skewX || 0) + dampedOscillation(t, 2, 0.35) * intensity * 0.3,
      },
      opacity: 1,
      filter: \`drop-shadow(0 0 \${8 + intensity * 0.5}px \${glowColor})\`
    };
  }
};
`,
  'emphasis/pulse.ts': `import { PresetDefinition } from '../types';
import { dampedOscillation } from '../../utils/easing';

export const pulse: PresetDefinition = {
  id: 'emphasis_pulse',
  name: '霓虹脉冲 (Neon Pulse)',
  description: '带阻尼衰减的心脏跳动式脉冲',
  category: 'emphasis',
  quality: 'viral',
  mood: 'excitement',
  material: 'neon',
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['dampedOscillation'],
  schema: [
    { key: 'glowColor', label: '发光色', type: 'color', default: '#ff00a0' },
    { key: 'intensity', label: '强度', type: 'number', default: 0.12, min: 0, max: 0.4, step: 0.01 },
  ],
  apply: (progress, params, currentTransform) => {
    const glowColor = params.glowColor || '#ff00a0';
    const intensity = Math.max(0, Math.min(0.4, params.intensity || 0.12));
    const t = Math.max(0, Math.min(1, progress));

    const beat = Math.abs(dampedOscillation(t, 2, 0.35)) * intensity;
    const scale = 1 + beat;

    return {
      transform: {
        ...currentTransform,
        scale: Math.max(0.001, currentTransform.scale * scale),
      },
      opacity: 1,
      filter: \`drop-shadow(0 0 \${20 + beat * 200}px \${glowColor}) drop-shadow(0 0 \${40 + beat * 300}px \${glowColor}88)\`
    };
  }
};
`,
  'emphasis/pulseGlow.ts': `import { PresetDefinition } from '../types';
import { dampedOscillation } from '../../utils/easing';

export const pulseGlow: PresetDefinition = {
  id: 'emphasis_pulse_glow',
  name: '呼吸光晕 (Breathing Glow)',
  description: '节奏感呼吸式光晕缩放',
  category: 'emphasis',
  quality: 'viral',
  mood: 'calm',
  material: 'glass',
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['dampedOscillation'],
  schema: [
    { key: 'glowColor', label: '发光色', type: 'color', default: '#00f0ff' },
  ],
  apply: (progress, params, currentTransform) => {
    const glowColor = params.glowColor || '#00f0ff';
    const t = Math.max(0, Math.min(1, progress));

    const breathe = Math.sin(t * Math.PI * 4) * 0.03;
    const scale = 1 + breathe;

    return {
      transform: {
        ...currentTransform,
        scale: Math.max(0.001, currentTransform.scale * scale),
      },
      opacity: 1,
      filter: \`drop-shadow(0 0 \${25 + breathe * 400}px \${glowColor}) drop-shadow(0 0 \${50}px \${glowColor}66)\`
    };
  }
};
`,
  'emphasis/shockwave.ts': `import { PresetDefinition } from '../types';
import { dampedOscillation, easeOutExpo } from '../../utils/easing';

export const shockwave: PresetDefinition = {
  id: 'emphasis_shockwave',
  name: '冲击波震荡 (Shockwave)',
  description: '从中心向外扩散的冲击波动效',
  category: 'emphasis',
  quality: 'viral',
  mood: 'epic',
  material: 'neon',
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['dampedOscillation', 'easeOutExpo'],
  schema: [
    { key: 'waveColor', label: '波纹色', type: 'color', default: '#00f0ff' },
  ],
  apply: (progress, params, currentTransform) => {
    const waveColor = params.waveColor || '#00f0ff';
    const t = Math.max(0, Math.min(1, progress));

    const wave = dampedOscillation(t, 2, 0.25);
    const scale = 1 + wave * 0.08;

    return {
      transform: {
        ...currentTransform,
        scale: Math.max(0.001, currentTransform.scale * scale),
      },
      opacity: 1,
      filter: \`drop-shadow(0 0 \${20 + Math.abs(wave) * 60}px \${waveColor}) drop-shadow(0 0 \${40 + Math.abs(wave) * 100}px \${waveColor}55)\`
    };
  }
};
`,
  'emphasis/focusZoom.ts': `import { PresetDefinition } from '../types';
import { spring, easeOutExpo } from '../../utils/easing';

export const focusZoom: PresetDefinition = {
  id: 'emphasis_focus_zoom',
  name: '焦点聚焦 (Focus Zoom)',
  description: '快速聚焦放大后稳定，引导视觉重心',
  category: 'emphasis',
  quality: 'viral',
  mood: 'tension',
  material: 'metal',
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['spring', 'easeOutExpo'],
  schema: [
    { key: 'glowColor', label: '发光色', type: 'color', default: '#ff0055' },
  ],
  apply: (progress, params, currentTransform) => {
    const glowColor = params.glowColor || '#ff0055';
    const t = Math.max(0, Math.min(1, progress));

    const springValue = spring(t, 180, 14, 1);
    const scale = 1 + springValue * 0.18;

    return {
      transform: {
        ...currentTransform,
        scale: Math.max(0.001, currentTransform.scale * scale),
      },
      opacity: 1,
      filter: \`drop-shadow(0 0 15px \${glowColor}) drop-shadow(0 0 40px \${glowColor}88) brightness(1 + \${springValue * 0.15})\`
    };
  }
};
`,
  'emphasis/shake.ts': `import { PresetDefinition } from '../types';
import { perlinNoise1D, dampedOscillation } from '../../utils/easing';

export const shake: PresetDefinition = {
  id: 'emphasis_shake',
  name: '剧烈震动 (Heavy Shake)',
  description: '带阻尼衰减的剧烈位置震动',
  category: 'emphasis',
  quality: 'viral',
  mood: 'urgency',
  material: 'metal',
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: false, styleEmotion: true },
  physics: ['perlinNoise1D', 'dampedOscillation'],
  schema: [
    { key: 'intensity', label: '强度', type: 'number', default: 14, min: 0, max: 50, step: 1 },
  ],
  apply: (progress, params, currentTransform) => {
    const intensity = Math.max(0, Math.min(50, params.intensity || 14));
    const t = Math.max(0, Math.min(1, progress));

    const envelope = Math.exp(-t * 4);
    const shakeX = perlinNoise1D(t, 20, 0) * intensity * envelope;
    const shakeY = perlinNoise1D(t, 24, 5) * intensity * 0.6 * envelope;

    return {
      transform: {
        ...currentTransform,
        x: currentTransform.x + shakeX,
        y: currentTransform.y + shakeY,
      },
      opacity: 1,
      filter: \`drop-shadow(\${shakeX * 0.5}px 0 0 rgba(255,0,0,0.4)) drop-shadow(-\${shakeX * 0.5}px 0 0 rgba(0,255,255,0.4))\`
    };
  }
};
`,

  // ============== TEXT ==============
  'text/typewriter.ts': `import { PresetDefinition } from '../types';
import { easeOutExpo } from '../../utils/easing';

export const typewriter: PresetDefinition = {
  id: 'text_typewriter',
  name: '终端打字机 (Terminal Typewriter)',
  description: '代码编辑器风格的逐字出现，带光标闪烁',
  category: 'text',
  quality: 'viral',
  mood: 'mysterious',
  material: 'carbon',
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: false, styleEmotion: true },
  physics: ['easeOutExpo'],
  schema: [
    { key: 'cursorColor', label: '光标色', type: 'color', default: '#00ff41' },
  ],
  apply: (progress, params, currentTransform) => {
    const t = Math.max(0, Math.min(1, progress));
    const cursorBlink = Math.sin(t * 30) > 0 ? 1 : 0.3;

    return {
      transform: currentTransform,
      opacity: 1,
      filter: \`drop-shadow(0 0 4px \${params.cursorColor || '#00ff41'}) drop-shadow(0 0 12px \${params.cursorColor || '#00ff41'}66)\`,
      compositeOperation: 'source-over'
    };
  }
};
`,
  'text/scaleUp.ts': `import { PresetDefinition } from '../types';
import { spring, dampedOscillation, easeOutExpo } from '../../utils/easing';

export const scaleUp: PresetDefinition = {
  id: 'text_scale_up',
  name: '文字弹大 (Text Scale Pop)',
  description: '文字弹性放大出现，带霓虹描边',
  category: 'text',
  quality: 'viral',
  mood: 'excitement',
  material: 'neon',
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['spring', 'dampedOscillation', 'easeOutExpo'],
  schema: [
    { key: 'glowColor', label: '发光色', type: 'color', default: '#ff00a0' },
  ],
  apply: (progress, params, currentTransform) => {
    const glowColor = params.glowColor || '#ff00a0';
    const t = Math.max(0, Math.min(1, progress));

    const springValue = spring(t, 180, 12, 1);
    const scale = 0.6 + 0.4 * springValue;
    const wobble = t < 1 ? dampedOscillation(t, 4, 0.22) * 0.03 * (1 - t) : 0;

    return {
      transform: {
        ...currentTransform,
        scale: Math.max(0.001, currentTransform.scale * (scale + wobble)),
      },
      opacity: Math.max(0.01, easeOutExpo(t)),
      filter: \`drop-shadow(0 0 8px \${glowColor}) drop-shadow(0 0 24px \${glowColor}88)\`
    };
  }
};
`,
  'text/decode.ts': `import { PresetDefinition } from '../types';
import { perlinNoise1D, easeOutExpo } from '../../utils/easing';

export const decode: PresetDefinition = {
  id: 'text_decode',
  name: '数字解码 (Digital Decode)',
  description: '字符从乱码解码成目标文字，带故障残影',
  category: 'text',
  quality: 'viral',
  mood: 'mysterious',
  material: 'hologram',
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: false, styleEmotion: true },
  physics: ['perlinNoise1D', 'easeOutExpo'],
  schema: [
    { key: 'glowColor', label: '发光色', type: 'color', default: '#00f0ff' },
  ],
  apply: (progress, params, currentTransform) => {
    const glowColor = params.glowColor || '#00f0ff';
    const t = Math.max(0, Math.min(1, progress));

    const noise = perlinNoise1D(t, 10, 0);
    const jitter = noise * 6 * (1 - t);
    const chroma = (1 - t) * 5;

    return {
      transform: {
        ...currentTransform,
        x: currentTransform.x + jitter,
      },
      opacity: Math.max(0.01, easeOutExpo(t)),
      filter: \`drop-shadow(0 0 10px \${glowColor}) drop-shadow(\${chroma}px 0 0 rgba(0,255,255,0.5)) drop-shadow(-\${chroma}px 0 0 rgba(255,0,255,0.5))\`
    };
  }
};
`,
  'text/scramble.ts': `import { PresetDefinition } from '../types';
import { perlinNoise1D, easeOutExpo } from '../../utils/easing';

export const scramble: PresetDefinition = {
  id: 'text_scramble',
  name: '乱码重组 (Text Scramble)',
  description: '赛博朋克风格字符乱码后重组',
  category: 'text',
  quality: 'viral',
  mood: 'urgency',
  material: 'neon',
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: false, styleEmotion: true },
  physics: ['perlinNoise1D', 'easeOutExpo'],
  schema: [
    { key: 'glowColor', label: '发光色', type: 'color', default: '#00ff9d' },
  ],
  apply: (progress, params, currentTransform) => {
    const glowColor = params.glowColor || '#00ff9d';
    const t = Math.max(0, Math.min(1, progress));

    const noise = perlinNoise1D(t, 14, 0);
    const jitter = noise * 4 * (1 - t);

    return {
      transform: {
        ...currentTransform,
        x: currentTransform.x + jitter,
        skewX: (currentTransform.skewX || 0) + noise * 8 * (1 - t),
      },
      opacity: Math.max(0.01, easeOutExpo(t)),
      filter: \`drop-shadow(0 0 8px \${glowColor}) drop-shadow(0 0 20px \${glowColor}88)\`
    };
  }
};
`,

  // ============== MOTION ==============
  'motion/floatY.ts': `import { PresetDefinition } from '../types';
import { dampedOscillation } from '../../utils/easing';

export const floatY: PresetDefinition = {
  id: 'motion_float_y',
  name: '垂直漂浮 (Vertical Float)',
  description: '带正弦波阻尼的轻柔上下漂浮',
  category: 'motion',
  quality: 'viral',
  mood: 'calm',
  material: 'glass',
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['dampedOscillation'],
  schema: [
    { key: 'amplitude', label: '振幅', type: 'number', default: 25, min: 0, max: 120 },
    { key: 'frequency', label: '频率', type: 'number', default: 2, min: 0.5, max: 6, step: 0.1 },
  ],
  apply: (progress, params, currentTransform) => {
    const amplitude = Math.max(0, Math.min(120, params.amplitude || 25));
    const frequency = Math.max(0.5, Math.min(6, params.frequency || 2));
    const t = Math.max(0, Math.min(1, progress));

    const y = dampedOscillation(t, frequency, 0.05) * amplitude;

    return {
      transform: {
        ...currentTransform,
        y: currentTransform.y + y,
      },
      opacity: 1,
      filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.3))'
    };
  }
};
`,
  'motion/parallaxFloat.ts': `import { PresetDefinition } from '../types';
import { dampedOscillation } from '../../utils/easing';

export const parallaxFloat: PresetDefinition = {
  id: 'motion_parallax_float',
  name: '视差漂浮 (Parallax Float)',
  description: '前景快速掠过的视差漂浮，增强空间层次',
  category: 'motion',
  quality: 'viral',
  mood: 'mysterious',
  material: 'glass',
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['dampedOscillation'],
  schema: [
    { key: 'speed', label: '速度', type: 'number', default: 1, min: -3, max: 3, step: 0.1 },
  ],
  apply: (progress, params, currentTransform) => {
    const speed = Math.max(-3, Math.min(3, params.speed || 1));
    const t = Math.max(0, Math.min(1, progress));

    const driftX = Math.sin(t * Math.PI * 2 * speed) * 40;
    const driftY = Math.cos(t * Math.PI * 1.5 * speed) * 20;
    const rotate = Math.sin(t * Math.PI * speed) * 3;

    return {
      transform: {
        ...currentTransform,
        x: currentTransform.x + driftX,
        y: currentTransform.y + driftY,
        rotation: currentTransform.rotation + rotate,
      },
      opacity: 1,
      filter: 'drop-shadow(0 0 20px rgba(0,240,255,0.2))'
    };
  }
};
`,
  'motion/orbit.ts': `import { PresetDefinition } from '../types';
import { dampedOscillation } from '../../utils/easing';

export const orbit: PresetDefinition = {
  id: 'motion_orbit',
  name: '3D 环绕 (3D Orbit)',
  description: '在三维空间中环绕运动',
  category: 'motion',
  quality: 'viral',
  mood: 'mysterious',
  material: 'hologram',
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['dampedOscillation'],
  schema: [
    { key: 'radius', label: '半径', type: 'number', default: 120, min: 0, max: 500 },
    { key: 'speed', label: '速度', type: 'number', default: 1, min: -3, max: 3, step: 0.1 },
  ],
  apply: (progress, params, currentTransform) => {
    const radius = Math.max(0, Math.min(500, params.radius || 120));
    const speed = Math.max(-3, Math.min(3, params.speed || 1));
    const t = Math.max(0, Math.min(1, progress));

    const angle = t * Math.PI * 2 * speed;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius * 0.35;
    const rotateY = Math.sin(angle) * 25;

    return {
      transform: {
        ...currentTransform,
        x: currentTransform.x + x,
        y: currentTransform.y + y,
        rotateY: (currentTransform.rotateY || 0) + rotateY,
      },
      opacity: 1,
      filter: 'drop-shadow(0 0 15px rgba(0,240,255,0.4))'
    };
  }
};
`,
  'motion/bounce.ts': `import { PresetDefinition } from '../types';
import { gravityBounce } from '../../utils/easing';

export const bounce: PresetDefinition = {
  id: 'motion_bounce',
  name: '持续弹跳 (Continuous Bounce)',
  description: '真实物理的持续重力弹跳循环',
  category: 'motion',
  quality: 'viral',
  mood: 'release',
  material: 'glass',
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['gravityBounce'],
  schema: [
    { key: 'height', label: '高度', type: 'number', default: 80, min: 0, max: 300 },
    { key: 'glowColor', label: '发光色', type: 'color', default: '#f6e05e' },
  ],
  apply: (progress, params, currentTransform) => {
    const height = Math.max(0, Math.min(300, params.height || 80));
    const glowColor = params.glowColor || '#f6e05e';
    const t = Math.max(0, Math.min(1, progress));

    const bounce = gravityBounce(t, 0.65, 10);
    const y = -height * bounce;
    const squash = 1 + Math.sin(bounce * Math.PI) * 0.08;

    return {
      transform: {
        ...currentTransform,
        y: currentTransform.y + y,
        scale: Math.max(0.001, currentTransform.scale * squash),
      },
      opacity: 1,
      filter: \`drop-shadow(0 0 10px \${glowColor}) drop-shadow(0 \${-y * 0.2}px 20px \${glowColor}55)\`
    };
  }
};
`,
  'motion/drift.ts': `import { PresetDefinition } from '../types';
import { dampedOscillation } from '../../utils/easing';

export const drift: PresetDefinition = {
  id: 'motion_drift',
  name: '缓慢漂移 (Slow Drift)',
  description: '背景层级的缓慢漂移，制造空间深度',
  category: 'motion',
  quality: 'viral',
  mood: 'calm',
  material: 'hologram',
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['dampedOscillation'],
  schema: [
    { key: 'distance', label: '漂移距离', type: 'number', default: 60, min: 0, max: 300 },
  ],
  apply: (progress, params, currentTransform) => {
    const distance = Math.max(0, Math.min(300, params.distance || 60));
    const t = Math.max(0, Math.min(1, progress));

    const x = Math.sin(t * Math.PI * 2) * distance;
    const y = Math.cos(t * Math.PI * 1.3) * distance * 0.4;

    return {
      transform: {
        ...currentTransform,
        x: currentTransform.x + x,
        y: currentTransform.y + y,
      },
      opacity: 1,
      filter: 'blur(0px) brightness(1.05)'
    };
  }
};
`,
  'motion/sway.ts': `import { PresetDefinition } from '../types';
import { dampedOscillation } from '../../utils/easing';

export const sway: PresetDefinition = {
  id: 'motion_sway',
  name: '摇摆晃动 (Sway)',
  description: '带惯性的左右摇摆，适合文字强调',
  category: 'motion',
  quality: 'viral',
  mood: 'release',
  material: 'liquid',
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['dampedOscillation'],
  schema: [
    { key: 'amplitude', label: '振幅', type: 'number', default: 8, min: 0, max: 30 },
  ],
  apply: (progress, params, currentTransform) => {
    const amplitude = Math.max(0, Math.min(30, params.amplitude || 8));
    const t = Math.max(0, Math.min(1, progress));

    const rotation = dampedOscillation(t, 1.5, 0.25) * amplitude;

    return {
      transform: {
        ...currentTransform,
        rotation: currentTransform.rotation + rotation,
      },
      opacity: 1,
      filter: 'drop-shadow(0 0 12px rgba(0,240,255,0.3))'
    };
  }
};
`,

  // ============== FX ==============
  'fx/glow.ts': `import { PresetDefinition } from '../types';
import { dampedOscillation } from '../../utils/easing';

export const glow: PresetDefinition = {
  id: 'fx_glow',
  name: '霓虹辉光 (Neon Glow)',
  description: '持续霓虹辉光脉冲，增强材质发光感',
  category: 'fx',
  quality: 'viral',
  mood: 'mysterious',
  material: 'neon',
  dimensions: { materialOptics: true, physicsMotion: false, spatialDepth: true, styleEmotion: true },
  physics: ['dampedOscillation'],
  schema: [
    { key: 'glowColor', label: '发光色', type: 'color', default: '#00f0ff' },
    { key: 'intensity', label: '强度', type: 'number', default: 20, min: 0, max: 80, step: 1 },
  ],
  apply: (progress, params, currentTransform) => {
    const glowColor = params.glowColor || '#00f0ff';
    const intensity = Math.max(0, Math.min(80, params.intensity || 20));
    const t = Math.max(0, Math.min(1, progress));

    const pulse = Math.sin(t * Math.PI * 4) * 0.3 + 0.7;

    return {
      transform: currentTransform,
      opacity: 1,
      filter: \`drop-shadow(0 0 \${intensity * pulse}px \${glowColor}) drop-shadow(0 0 \${intensity * 2 * pulse}px \${glowColor}66) brightness(1.1)\`
    };
  }
};
`,
  'fx/neon.ts': `import { PresetDefinition } from '../types';
import { dampedOscillation } from '../../utils/easing';

export const neon: PresetDefinition = {
  id: 'fx_neon',
  name: '霓虹灯管 (Neon Tube)',
  description: '模拟真实霓虹灯管的闪烁和发光',
  category: 'fx',
  quality: 'viral',
  mood: 'mysterious',
  material: 'neon',
  dimensions: { materialOptics: true, physicsMotion: false, spatialDepth: true, styleEmotion: true },
  physics: ['dampedOscillation'],
  schema: [
    { key: 'glowColor', label: '发光色', type: 'color', default: '#ff00a0' },
    { key: 'flicker', label: '闪烁强度', type: 'number', default: 0.25, min: 0, max: 1, step: 0.05 },
  ],
  apply: (progress, params, currentTransform) => {
    const glowColor = params.glowColor || '#ff00a0';
    const flicker = Math.max(0, Math.min(1, params.flicker || 0.25));
    const t = Math.max(0, Math.min(1, progress));

    const flick = 1 + dampedOscillation(t, 8, 0.5) * flicker;

    return {
      transform: currentTransform,
      opacity: 1,
      filter: \`drop-shadow(0 0 15px \${glowColor}) drop-shadow(0 0 40px \${glowColor}\${Math.floor(flick * 128).toString(16).padStart(2,'0')}) brightness(\${1 + flick * 0.1})\`
    };
  }
};
`,
  'fx/chromaticBurst.ts': `import { PresetDefinition } from '../types';
import { perlinNoise1D, dampedOscillation, easeOutExpo } from '../../utils/easing';

export const chromaticBurst: PresetDefinition = {
  id: 'fx_chromatic_burst',
  name: 'RGB 色散爆发 (Chromatic Burst)',
  description: '强烈的 RGB 色散和亮度爆发',
  category: 'fx',
  quality: 'viral',
  mood: 'urgency',
  material: 'neon',
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: false, styleEmotion: true },
  physics: ['perlinNoise1D', 'dampedOscillation', 'easeOutExpo'],
  schema: [
    { key: 'intensity', label: '强度', type: 'number', default: 10, min: 0, max: 30, step: 0.5 },
  ],
  apply: (progress, params, currentTransform) => {
    const intensity = Math.max(0, Math.min(30, params.intensity || 10));
    const t = Math.max(0, Math.min(1, progress));

    const envelope = Math.exp(-t * 4);
    const chroma = intensity * envelope;
    const noise = perlinNoise1D(t, 12, 0) * intensity * 0.5 * envelope;

    return {
      transform: {
        ...currentTransform,
        x: currentTransform.x + noise,
      },
      opacity: 1,
      filter: \`drop-shadow(\${chroma}px 0 0 rgba(255,0,0,0.6)) drop-shadow(-\${chroma}px 0 0 rgba(0,255,255,0.6)) brightness(\${1 + envelope * 0.4}) contrast(1.2)\`
    };
  }
};
`,
  'fx/crtFlicker.ts': `import { PresetDefinition } from '../types';
import { perlinNoise1D } from '../../utils/easing';

export const crtFlicker: PresetDefinition = {
  id: 'fx_crt_flicker',
  name: 'CRT 扫描闪烁 (CRT Flicker)',
  description: '模拟 CRT 显示器的扫描线和随机闪烁',
  category: 'fx',
  quality: 'viral',
  mood: 'urgency',
  material: 'carbon',
  dimensions: { materialOptics: true, physicsMotion: false, spatialDepth: false, styleEmotion: true },
  physics: ['perlinNoise1D'],
  schema: [
    { key: 'intensity', label: '强度', type: 'number', default: 0.25, min: 0, max: 1, step: 0.05 },
  ],
  apply: (progress, params, currentTransform) => {
    const intensity = Math.max(0, Math.min(1, params.intensity || 0.25));
    const t = Math.max(0, Math.min(1, progress));

    const flicker = perlinNoise1D(t, 10, 0) * intensity;

    return {
      transform: currentTransform,
      opacity: 1,
      filter: \`brightness(\${1 + flicker * 0.2}) contrast(1.15) saturate(1.1)\`
    };
  }
};
`,
  'fx/scanline.ts': `import { PresetDefinition } from '../types';
import { dampedOscillation } from '../../utils/easing';

export const scanline: PresetDefinition = {
  id: 'fx_scanline',
  name: '扫描线叠加 (Scanline Overlay)',
  description: '复古 CRT 扫描线效果，增强怀旧科技感',
  category: 'fx',
  quality: 'viral',
  mood: 'mysterious',
  material: 'carbon',
  dimensions: { materialOptics: true, physicsMotion: false, spatialDepth: false, styleEmotion: true },
  physics: ['dampedOscillation'],
  schema: [
    { key: 'lineColor', label: '线条色', type: 'color', default: '#00f0ff' },
  ],
  apply: (progress, params, currentTransform) => {
    const lineColor = params.lineColor || '#00f0ff';
    const t = Math.max(0, Math.min(1, progress));

    const roll = Math.sin(t * Math.PI * 6) * 2;

    return {
      transform: {
        ...currentTransform,
        y: currentTransform.y + roll,
      },
      opacity: 1,
      filter: \`drop-shadow(0 0 4px \${lineColor}) contrast(1.1)\`
    };
  }
};
`,
  'fx/glitchCyber.ts': `import { PresetDefinition } from '../types';
import { perlinNoise1D, dampedOscillation } from '../../utils/easing';

export const glitchCyber: PresetDefinition = {
  id: 'fx_glitch_cyber',
  name: '赛博故障 (Cyber Glitch FX)',
  description: '持续赛博故障 RGB 分离和抖动',
  category: 'fx',
  quality: 'viral',
  mood: 'urgency',
  material: 'neon',
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: false, styleEmotion: true },
  physics: ['perlinNoise1D', 'dampedOscillation'],
  schema: [
    { key: 'intensity', label: '强度', type: 'number', default: 8, min: 0, max: 30, step: 0.5 },
  ],
  apply: (progress, params, currentTransform) => {
    const intensity = Math.max(0, Math.min(30, params.intensity || 8));
    const t = Math.max(0, Math.min(1, progress));

    const noise = perlinNoise1D(t, 10, 0);
    const jitter = noise * intensity;
    const chroma = intensity * 0.6;

    return {
      transform: {
        ...currentTransform,
        x: currentTransform.x + jitter,
        y: currentTransform.y + perlinNoise1D(t, 12, 5) * intensity * 0.4,
      },
      opacity: 1,
      filter: \`drop-shadow(\${chroma}px 0 0 rgba(255,0,0,0.5)) drop-shadow(-\${chroma}px 0 0 rgba(0,255,255,0.5))\`
    };
  }
};
`,
  'fx/glowPulse.ts': `import { PresetDefinition } from '../types';
import { dampedOscillation } from '../../utils/easing';

export const glowPulse: PresetDefinition = {
  id: 'fx_glow_pulse',
  name: '光晕脉冲 (Glow Pulse)',
  description: '节奏感光晕脉冲，适合高潮点',
  category: 'fx',
  quality: 'viral',
  mood: 'excitement',
  material: 'neon',
  dimensions: { materialOptics: true, physicsMotion: false, spatialDepth: true, styleEmotion: true },
  physics: ['dampedOscillation'],
  schema: [
    { key: 'glowColor', label: '发光色', type: 'color', default: '#00f0ff' },
  ],
  apply: (progress, params, currentTransform) => {
    const glowColor = params.glowColor || '#00f0ff';
    const t = Math.max(0, Math.min(1, progress));

    const pulse = Math.abs(dampedOscillation(t, 2.5, 0.3));

    return {
      transform: currentTransform,
      opacity: 1,
      filter: \`drop-shadow(0 0 \${20 + pulse * 80}px \${glowColor}) drop-shadow(0 0 \${40 + pulse * 120}px \${glowColor}66) brightness(\${1 + pulse * 0.2})\`
    };
  }
};
`,
  'fx/hueRotate.ts': `import { PresetDefinition } from '../types';
import { dampedOscillation } from '../../utils/easing';

export const hueRotate: PresetDefinition = {
  id: 'fx_hue_rotate',
  name: '色相漂移 (Hue Shift)',
  description: '霓虹色相循环漂移',
  category: 'fx',
  quality: 'viral',
  mood: 'mysterious',
  material: 'hologram',
  dimensions: { materialOptics: true, physicsMotion: false, spatialDepth: false, styleEmotion: true },
  physics: ['dampedOscillation'],
  schema: [
    { key: 'speed', label: '速度', type: 'number', default: 1, min: -3, max: 3, step: 0.1 },
  ],
  apply: (progress, params, currentTransform) => {
    const speed = Math.max(-3, Math.min(3, params.speed || 1));
    const t = Math.max(0, Math.min(1, progress));

    const hue = t * 360 * speed;

    return {
      transform: currentTransform,
      opacity: 1,
      filter: \`hue-rotate(\${hue}deg) saturate(1.2) brightness(1.05)\`
    };
  }
};
`,
};

// Index files
const indices = {
  'entrance/index.ts': `export { fadeIn } from './fadeIn';
export { fadeInUp } from './fadeInUp';
export { fadeInDown } from './fadeInDown';
export { fadeInLeft } from './fadeInLeft';
export { fadeInRight } from './fadeInRight';
export { zoomIn } from './zoomIn';
export { rotateIn } from './rotateIn';
export { flipInX } from './flipInX';
export { flipInY } from './flipInY';
export { slideInLeft } from './slideInLeft';
export { slideInRight } from './slideInRight';
export { slideInUp } from './slideInUp';
export { slideInDown } from './slideInDown';
export { smashIn } from './smashIn';
export { glitchIn } from './glitchIn';
export { glitchSmash } from './glitchSmash';
export { bounceIn } from './bounceIn';
export { elasticBounce } from './elasticBounce';
export { springScale } from './springScale';
`,
  'exit/index.ts': `export { fadeOut } from './fadeOut';
export { fadeOutUp } from './fadeOutUp';
export { fadeOutDown } from './fadeOutDown';
export { zoomOut } from './zoomOut';
export { slideOutDown } from './slideOutDown';
export { slideOutUp } from './slideOutUp';
export { slideOutLeft } from './slideOutLeft';
export { slideOutRight } from './slideOutRight';
export { bounceOut } from './bounceOut';
export { glitchOut } from './glitchOut';
`,
  'emphasis/index.ts': `export { flash } from './flash';
export { jitter } from './jitter';
export { wobble } from './wobble';
export { pulse } from './pulse';
export { pulseGlow } from './pulseGlow';
export { shockwave } from './shockwave';
export { focusZoom } from './focusZoom';
export { shake } from './shake';
`,
  'text/index.ts': `export { typewriter } from './typewriter';
export { scaleUp } from './scaleUp';
export { decode } from './decode';
export { scramble } from './scramble';
`,
  'motion/index.ts': `export { floatY } from './floatY';
export { parallaxFloat } from './parallaxFloat';
export { orbit } from './orbit';
export { bounce } from './bounce';
export { drift } from './drift';
export { sway } from './sway';
`,
  'fx/index.ts': `export { glow } from './glow';
export { neon } from './neon';
export { chromaticBurst } from './chromaticBurst';
export { crtFlicker } from './crtFlicker';
export { scanline } from './scanline';
export { glitchCyber } from './glitchCyber';
export { glowPulse } from './glowPulse';
export { hueRotate } from './hueRotate';
`,
};

write('types.ts', typesTs);
Object.entries(files).forEach(([file, content]) => write(file, content));
Object.entries(indices).forEach(([file, content]) => write(file, content));
console.log('done');
