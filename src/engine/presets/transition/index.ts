// 转场预设（应用于相邻片段边界，挂载在后一个"入场"片段上）
// 约定：apply(progress) 描述后进片段的观感；系统以 progress=1-p 驱动前一片段，
// 两侧对称即可得到交叉溶解/推移等效果；非对称划像在反向播放时方向互补。
import { easeOutCubic } from '../../utils/easing';
import { PresetDefinition } from '../types';

export const crossDissolve: PresetDefinition = {
  id: 'transition_cross_dissolve',
  name: '交叉溶解',
  description: '经典叠化：前一片段淡出、后一片段淡入',
  category: 'transition',
  schema: [],
  apply: (progress) => ({ transform: {} as any, opacity: Math.min(1, Math.max(0, progress)) }),
};

export const dipToBlack: PresetDefinition = {
  id: 'transition_dip_to_black',
  name: '黑场过渡',
  description: '经过黑场的柔和转场',
  category: 'transition',
  schema: [],
  apply: (progress) => {
    // 对称函数 f(p)=|2p-1|：中点前后分别对应出/入画面压至全黑
    return { transform: {} as any, opacity: Math.abs(progress * 2 - 1) };
  },
};

export const dipToWhite: PresetDefinition = {
  id: 'transition_dip_to_white',
  name: '白场过渡',
  category: 'transition',
  schema: [],
  apply: (progress) => {
    // 以白色遮罩模拟（透明度对偶）：容器下方铺白，无法直接改变底色 → 用亮度滤镜近似
    const v = Math.abs(progress * 2 - 1);
    return {
      transform: {} as any,
      opacity: Math.min(1, Math.max(0, progress)),
      filter: v < 0.9 ? `brightness(${1 + (1 - v) * 4}) blur(${(1 - v) * 6}px)` : undefined,
    };
  },
};

const wipePreset = (id: string, name: string, dir: 'left' | 'right' | 'up' | 'down'): PresetDefinition => ({
  id,
  name,
  category: 'transition',
  schema: [{ key: 'softness', label: '边缘柔和', type: 'number', default: 0, min: 0, max: 60, step: 1 }],
  apply: (progress, params) => {
    const p = Math.min(1, Math.max(0, progress));
    const softness = Math.max(0, Math.min(40, params.softness ?? 0));
    let inset: string;
    if (dir === 'left') inset = `0 0 0 ${(1 - p) * 100}%`;
    else if (dir === 'right') inset = `0 ${(1 - p) * 100}% 0 0`;
    else if (dir === 'up') inset = `${(1 - p) * 100}% 0 0 0`;
    else inset = `0 0 ${(1 - p) * 100}% 0`;
    return {
      transform: {} as any,
      opacity: p <= softness / 300 ? 0 : 1,
      clipPath: p >= 1 ? undefined : `inset(${inset} round 0px)`,
      ...(softness > 0 ? { filter: `blur(${softness / 10}px)` } : {}),
    };
  },
});

export const wipeLeft = wipePreset('transition_wipe_left', '左移划像', 'left');
export const wipeRight = wipePreset('transition_wipe_right', '右移划像', 'right');
export const wipeUp = wipePreset('transition_wipe_up', '上移划像', 'up');
export const wipeDown = wipePreset('transition_wipe_down', '下移划像', 'down');

const slidePreset = (id: string, name: string, dx: number, dy: number): PresetDefinition => ({
  id,
  name,
  category: 'transition',
  schema: [],
  apply: (progress) => {
    const p = easeOutCubic(Math.min(1, Math.max(0, progress)));
    return {
      transform: { x: (1 - p) * dx, y: (1 - p) * dy } as any,
      opacity: 1,
    };
  },
});

export const slideLeft = slidePreset('transition_slide_left', '向左滑动', -1920, 0);

export const zoomDissolve: PresetDefinition = {
  id: 'transition_zoom_dissolve',
  name: '缩放溶解',
  category: 'transition',
  schema: [{ key: 'zoom', label: '缩放强度', type: 'number', default: 2.5, min: 1.2, max: 5, step: 0.1 }],
  apply: (progress, params) => {
    const p = easeOutCubic(Math.min(1, Math.max(0, progress)));
    const zoom = Math.max(1.1, params.zoom ?? 2.5);
    return {
      transform: { scale: zoom - (zoom - 1) * p } as any,
      opacity: p,
    };
  },
};

export const blurDissolve: PresetDefinition = {
  id: 'transition_blur_dissolve',
  name: '模糊溶解',
  category: 'transition',
  schema: [{ key: 'blurAmount', label: '模糊强度', type: 'number', default: 24, min: 2, max: 80, step: 1 }],
  apply: (progress, params) => {
    const p = easeOutCubic(Math.min(1, Math.max(0, progress)));
    const amount = Math.max(1, params.blurAmount ?? 24);
    return {
      transform: { scale: 1.04 - 0.04 * p } as any,
      opacity: Math.max(0, p),
      filter: `blur(${amount * (1 - p)}px)`,
    };
  },
};

export const glitchFlash: PresetDefinition = {
  id: 'transition_glitch_flash',
  name: '故障闪烁',
  category: 'transition',
  schema: [],
  apply: (progress) => {
    const p = Math.min(1, Math.max(0, progress));
    // 前半程高频抖动闪烁，后半程恢复
    const flicker = p < 0.5 ? (Math.sin(p * Math.PI * 14) > 0 ? 1 : 0.25) : 1;
    const jitterX = p < 0.45 ? Math.sin(p * Math.PI * 20) * 26 * (1 - p) : 0;
    return {
      transform: { x: jitterX } as any,
      opacity: flicker,
      filter: p < 0.5 && Math.sin(p * 40) > 0 ? 'hue-rotate(40deg) saturate(2)' : undefined,
    };
  },
};
