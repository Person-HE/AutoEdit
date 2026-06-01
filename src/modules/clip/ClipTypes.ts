// Clip 类型定义 - 完整版
import type { Clip, Effect, Transform, Track, TextData, TemplateData, VoiceOver } from '../shared/types';
import { v4 as uuidv4 } from 'uuid';

// ==================== ClipType 枚举 ====================
export type ClipType = Clip['type'];

export const CLIP_TYPES: Record<ClipType, ClipType> = {
  video: 'video',
  image: 'image',
  audio: 'audio',
  text: 'text',
  template: 'template'
};

// 轨道与片段类型兼容性映射
export const TRACK_CLIP_COMPATIBILITY: Record<Track['type'], ClipType[]> = {
  video: ['video', 'image', 'template'],
  audio: ['audio'],
  text: ['text'],
  effect: []
};

// ==================== Transform 扩展 ====================
export interface ValidatedTransform extends Transform {
  validate(): TransformValidationError[];
}

export interface TransformValidationError {
  field: keyof Transform;
  message: string;
  value: number;
}

export const TRANSFORM_CONSTRAINTS = {
  x: { min: -10000, max: 10000 },
  y: { min: -10000, max: 10000 },
  scale: { min: 0.001, max: 100 },
  rotation: { min: -360, max: 360 }
} as const;

export function createTransform(partial?: Partial<Transform>): ValidatedTransform {
  const base: Transform = {
    x: partial?.x ?? 0,
    y: partial?.y ?? 0,
    scale: partial?.scale ?? 1,
    rotation: partial?.rotation ?? 0
  };

  return {
    ...base,
    validate(): TransformValidationError[] {
      const errors: TransformValidationError[] = [];
      for (const [key, constraints] of Object.entries(TRANSFORM_CONSTRAINTS)) {
        const value = base[key as keyof Transform];
        if (typeof value === 'number') {
          if (value < constraints.min || value > constraints.max) {
            errors.push({
              field: key as keyof Transform,
              message: `${key} must be between ${constraints.min} and ${constraints.max}`,
              value
            });
          }
        }
      }
      return errors;
    }
  };
}

export function clampTransform(transform: Transform): Transform {
  return {
    x: Math.max(TRANSFORM_CONSTRAINTS.x.min, Math.min(TRANSFORM_CONSTRAINTS.x.max, transform.x)),
    y: Math.max(TRANSFORM_CONSTRAINTS.y.min, Math.min(TRANSFORM_CONSTRAINTS.y.max, transform.y)),
    scale: Math.max(TRANSFORM_CONSTRAINTS.scale.min, Math.min(TRANSFORM_CONSTRAINTS.scale.max, transform.scale)),
    rotation: Math.max(TRANSFORM_CONSTRAINTS.rotation.min, Math.min(TRANSFORM_CONSTRAINTS.rotation.max, transform.rotation))
  };
}

// ==================== ClipFactory 工厂接口 ====================
export interface ClipFactoryConfigBase {
  trackId: string;
  startTime: number;
  duration?: number;
  name?: string;
  transform?: Partial<Transform>;
}

export interface TextClipConfig extends ClipFactoryConfigBase {
  type: 'text';
  textData?: Partial<TextData>;
}

export interface VideoClipConfig extends ClipFactoryConfigBase {
  type: 'video' | 'image';
  assetId: string;
  offset?: number;
}

export interface AudioClipConfig extends ClipFactoryConfigBase {
  type: 'audio';
  assetId: string;
  offset?: number;
  voiceOver?: VoiceOver;
}

export interface TemplateClipConfig extends ClipFactoryConfigBase {
  type: 'template';
  templateId: string;
  templateParams?: Record<string, any>;
}

export type ClipFactoryConfig = TextClipConfig | VideoClipConfig | AudioClipConfig | TemplateClipConfig;

export class ClipFactory {
  static createTextClip(config: TextClipConfig): Clip {
    const id = uuidv4();
    return {
      id,
      assetId: `virtual_text_${id}`,
      trackId: config.trackId,
      type: 'text',
      startTime: config.startTime,
      duration: config.duration ?? 5,
      offset: 0,
      transform: createTransform(config.transform),
      style: { opacity: 1, zIndex: 1 },
      textData: {
        content: config.textData?.content ?? '双击编辑文本',
        fontSize: config.textData?.fontSize ?? 60,
        fontFamily: config.textData?.fontFamily ?? 'Arial',
        color: config.textData?.color ?? '#ffffff',
        backgroundColor: config.textData?.backgroundColor
      },
      effects: [],
      name: config.name ?? '新建文本'
    };
  }

  static createVideoClip(config: VideoClipConfig): Clip {
    const isImage = config.type === 'image';
    return {
      id: uuidv4(),
      assetId: config.assetId,
      trackId: config.trackId,
      type: config.type,
      startTime: config.startTime,
      duration: config.duration ?? (isImage ? 5 : 10),
      offset: config.offset ?? 0,
      transform: createTransform(config.transform),
      style: { opacity: 1, zIndex: 1 },
      effects: [],
      name: config.name ?? (isImage ? '图片片段' : '视频片段')
    };
  }

  static createAudioClip(config: AudioClipConfig): Clip {
    return {
      id: uuidv4(),
      assetId: config.assetId,
      trackId: config.trackId,
      type: 'audio',
      startTime: config.startTime,
      duration: config.duration ?? 10,
      offset: config.offset ?? 0,
      transform: createTransform({ x: 0, y: 0, scale: 1, rotation: 0 }),
      style: { opacity: 1, zIndex: 1 },
      voiceOver: config.voiceOver,
      effects: [],
      name: config.name ?? '音频片段'
    };
  }

  static createTemplateClip(config: TemplateClipConfig): Clip {
    return {
      id: uuidv4(),
      assetId: `template_${config.templateId}`,
      trackId: config.trackId,
      type: 'template',
      startTime: config.startTime,
      duration: config.duration ?? 5,
      offset: 0,
      transform: createTransform(config.transform),
      style: { opacity: 1, zIndex: 1 },
      templateData: {
        templateId: config.templateId,
        params: config.templateParams ?? {}
      },
      effects: [],
      name: config.name ?? `模板_${config.templateId}`
    };
  }

  static createClip(config: ClipFactoryConfig): Clip {
    switch (config.type) {
      case 'text':
        return this.createTextClip(config);
      case 'video':
      case 'image':
        return this.createVideoClip(config);
      case 'audio':
        return this.createAudioClip(config);
      case 'template':
        return this.createTemplateClip(config);
      default:
        throw new Error(`Unsupported clip type: ${(config as any).type}`);
    }
  }
}

// ==================== ClipTimeRange 时间范围工具 ====================
export interface ClipTimeRange {
  start: number;
  end: number;
  clipId: string;
}

export function getClipTimeRange(clip: Clip): ClipTimeRange {
  return {
    start: clip.startTime,
    end: clip.startTime + clip.duration,
    clipId: clip.id
  };
}

export function timeRangesOverlap(a: ClipTimeRange, b: ClipTimeRange): boolean {
  return a.start < b.end && b.start < a.end;
}

export function timeRangesContain(range: ClipTimeRange, time: number): boolean {
  return time >= range.start && time < range.end;
}

export function mergeOverlappingRanges(ranges: ClipTimeRange[]): ClipTimeRange[] {
  if (ranges.length <= 1) return ranges;

  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  const merged: ClipTimeRange[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const last = merged[merged.length - 1];

    if (current.start <= last.end) {
      merged[merged.length - 1] = {
        start: Math.min(last.start, current.start),
        end: Math.max(last.end, current.end),
        clipId: last.clipId
      };
    } else {
      merged.push(current);
    }
  }

  return merged;
}

// ==================== ClipOverlapDetector 重叠检测 ====================
export interface OverlapResult {
  hasOverlap: boolean;
  overlappingClips: Clip[];
  overlapRegions: Array<{
    start: number;
    end: number;
    clipIds: string[];
  }>;
}

export class ClipOverlapDetector {
  static detect(clips: Clip[], targetClip: Clip | null = null): OverlapResult {
    const targetRange = targetClip ? getClipTimeRange(targetClip) : null;
    const checkClips = targetClip
      ? clips.filter(c => c.id !== targetClip.id && c.trackId === targetClip.trackId)
      : clips;

    const overlappingClips: Clip[] = [];
    const overlapRegions: Array<{ start: number; end: number; clipIds: string[] }> = [];

    if (!targetClip) {
      // 检测所有片段之间的重叠
      for (let i = 0; i < checkClips.length; i++) {
        for (let j = i + 1; j < checkClips.length; j++) {
          const a = checkClips[i];
          const b = checkClips[j];
          if (a.trackId !== b.trackId) continue;

          const rangeA = getClipTimeRange(a);
          const rangeB = getClipTimeRange(b);

          if (timeRangesOverlap(rangeA, rangeB)) {
            if (!overlappingClips.includes(a)) overlappingClips.push(a);
            if (!overlappingClips.includes(b)) overlappingClips.push(b);

            overlapRegions.push({
              start: Math.max(rangeA.start, rangeB.start),
              end: Math.min(rangeA.end, rangeB.end),
              clipIds: [a.id, b.id]
            });
          }
        }
      }
    } else {
      // 检测目标片段与其他片段的重叠
      for (const clip of checkClips) {
        if (clip.trackId !== targetClip.trackId) continue;

        const clipRange = getClipTimeRange(clip);
        if (targetRange && timeRangesOverlap(targetRange, clipRange)) {
          overlappingClips.push(clip);
          overlapRegions.push({
            start: Math.max(targetRange.start, clipRange.start),
            end: Math.min(targetRange.end, clipRange.end),
            clipIds: [targetClip.id, clip.id]
          });
        }
      }
    }

    return {
      hasOverlap: overlappingClips.length > 0,
      overlappingClips,
      overlapRegions
    };
  }

  static canPlaceClip(clips: Clip[], targetClip: Clip): boolean {
    const result = this.detect(clips, targetClip);
    return !result.hasOverlap;
  }

  static findGap(clips: Clip[], trackId: string, requiredDuration: number, afterTime: number = 0): { start: number; end: number } | null {
    const trackClips = clips
      .filter(c => c.trackId === trackId)
      .sort((a, b) => a.startTime - b.startTime);

    let lastEnd = afterTime;

    for (const clip of trackClips) {
      if (clip.startTime - lastEnd >= requiredDuration) {
        return { start: lastEnd, end: lastEnd + requiredDuration };
      }
      lastEnd = Math.max(lastEnd, clip.startTime + clip.duration);
    }

    // 检查最后一个片段之后是否有空间
    return { start: lastEnd, end: lastEnd + requiredDuration };
  }
}

// ==================== EffectApplicationOrder 效果应用顺序 ====================
export const EFFECT_APPLICATION_ORDER = {
  ENTRANCE: 0,
  EMPHASIS: 1,
  MOTION: 2,
  FX: 3,
  TEXT: 4,
  EXIT: 5,
  TRANSITION: 6
} as const;

export type EffectApplicationPhase = keyof typeof EFFECT_APPLICATION_ORDER;

export function sortEffectsByOrder(effects: Effect[]): Effect[] {
  return [...effects].sort((a, b) => {
    const orderA = EFFECT_APPLICATION_ORDER[a.type.toUpperCase() as EffectApplicationPhase] ?? 99;
    const orderB = EFFECT_APPLICATION_ORDER[b.type.toUpperCase() as EffectApplicationPhase] ?? 99;
    return orderA - orderB;
  });
}

// ==================== AppliedTransform 应用后的变换结果 ====================
export interface AppliedTransform {
  transform: Transform;
  opacity: number;
  filter: string;
  effectsApplied: string[];
}

// ==================== ClipOperation 操作类型（保留原有） ====================
export interface ClipOperation {
  type: 'add' | 'remove' | 'update' | 'move' | 'split' | 'duplicate';
  payload: {
    clipId?: string;
    clip?: Partial<Clip>;
    trackId?: string;
    startTime?: number;
  };
}

// ==================== ClipState 状态（保留原有） ====================
export interface ClipState {
  clips: Record<string, Clip>;
  selectedClipId: string | null;
}

// ==================== IClipManager 接口（扩展） ====================
export interface IClipManager {
  addClip(clipData: Omit<Clip, 'id'>): Clip;
  removeClip(clipId: string): void;
  updateClip(clipId: string, updates: Partial<Clip>): void;
  getClip(clipId: string): Clip | undefined;
  getAllClips(): Clip[];
  getClipsByTrack(trackId: string): Clip[];
  moveClip(clipId: string, newTrackId: string, newStartTime: number): boolean;
  splitClip(clipId: string, splitTime: number): [Clip, Clip] | null;
  duplicateClip(clipId: string): Clip | null;
  updateTransform(clipId: string, transform: Partial<Transform>): void;
  addEffect(clipId: string, effect: Effect): void;
  removeEffect(clipId: string, effectId: string): void;
  trimClip(clipId: string, startTime?: number, endTime?: number): Clip | null;
  getVisibleClipsAtTime(time: number, tracks: Track[]): Clip[];
  applyEffectsToClip(clip: Clip, time: number, presetRegistry: Record<string, any>): AppliedTransform;
  calculateClipBounds(clip: Clip, projectSize: { width: number; height: number }): DOMRect;
}
