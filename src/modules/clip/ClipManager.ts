// Clip 管理器 - 完整实现
import type { Clip, Effect, Transform, Track } from '../shared/types';
import type {
  IClipManager,
  ClipFactoryConfig,
  AppliedTransform,
  ClipTimeRange,
  OverlapResult
} from './ClipTypes';
import {
  ClipFactory,
  TRACK_CLIP_COMPATIBILITY,
  clampTransform,
  getClipTimeRange,
  timeRangesContain,
  ClipOverlapDetector,
  sortEffectsByOrder,
  EFFECT_APPLICATION_ORDER
} from './ClipTypes';
import { v4 as uuidv4 } from 'uuid';

class ClipManager implements IClipManager {
  private clips: Map<string, Clip> = new Map();

  constructor(initialClips?: Record<string, Clip>) {
    if (initialClips) {
      Object.entries(initialClips).forEach(([id, clip]) => this.clips.set(id, clip));
    }
  }

  // ==================== 基础 CRUD ====================

  generateId(): string {
    return uuidv4();
  }

  createClip(config: ClipFactoryConfig): Clip {
    const clip = ClipFactory.createClip(config);
    this.clips.set(clip.id, clip);
    return clip;
  }

  addClip(clipData: Omit<Clip, 'id'>): Clip {
    const id = this.generateId();
    const clip: Clip = { ...clipData, id };
    this.clips.set(id, clip);
    return clip;
  }

  removeClip(clipId: string): void {
    this.clips.delete(clipId);
  }

  updateClip(clipId: string, updates: Partial<Clip>): void {
    const clip = this.clips.get(clipId);
    if (clip) {
      Object.assign(clip, updates);
    }
  }

  getClip(clipId: string): Clip | undefined {
    return this.clips.get(clipId);
  }

  getAllClips(): Clip[] {
    return Array.from(this.clips.values());
  }

  getAllClipsRecord(): Record<string, Clip> {
    return Object.fromEntries(this.clips);
  }

  setClips(clips: Record<string, Clip>): void {
    this.clips.clear();
    Object.entries(clips).forEach(([id, clip]) => this.clips.set(id, clip));
  }

  // ==================== 轨道查询 ====================

  getClipsByTrack(trackId: string): Clip[] {
    return this.getAllClips().filter(c => c.trackId === trackId);
  }

  static getClipsByTrackFromList(clips: Clip[], trackId: string): Clip[] {
    return clips.filter(c => c.trackId === trackId);
  }

  getVisibleClipsAtTime(time: number, tracks: Track[]): Clip[] {
    const visibleTrackIds = new Set(
      tracks.filter(t => t.visible).map(t => t.id)
    );

    return this.getAllClips()
      .filter(clip => {
        if (!visibleTrackIds.has(clip.trackId)) return false;
        const range = getClipTimeRange(clip);
        return timeRangesContain(range, time);
      })
      .sort((a, b) => a.style.zIndex - b.style.zIndex);
  }

  static getVisibleClipsAtTimeFromList(
    clips: Clip[],
    tracks: Track[],
    time: number
  ): Clip[] {
    const visibleTrackIds = new Set(
      tracks.filter(t => t.visible).map(t => t.id)
    );

    return clips
      .filter(clip => {
        if (!visibleTrackIds.has(clip.trackId)) return false;
        const range = getClipTimeRange(clip);
        return timeRangesContain(range, time);
      })
      .sort((a, b) => a.style.zIndex - b.style.zIndex);
  }

  // ==================== 片段操作 ====================

  duplicateClip(clipId: string): Clip | null {
    const clip = this.clips.get(clipId);
    if (!clip) return null;

    const newClip: Clip = {
      ...clip,
      id: this.generateId(),
      startTime: clip.startTime + clip.duration,
      name: `${clip.name} (副本)`,
      effects: clip.effects.map(fx => ({ ...fx, id: this.generateId() })),
      textData: clip.textData ? { ...clip.textData } : undefined,
      templateData: clip.templateData
        ? { ...clip.templateData, params: { ...clip.templateData.params } }
        : undefined,
      voiceOver: clip.voiceOver ? { ...clip.voiceOver } : undefined
    };

    this.clips.set(newClip.id, newClip);
    return newClip;
  }

  static duplicateClipStatic(clip: Clip): Clip {
    return {
      ...clip,
      id: uuidv4(),
      startTime: clip.startTime + clip.duration,
      name: `${clip.name} (副本)`,
      effects: clip.effects.map(fx => ({ ...fx, id: uuidv4() })),
      textData: clip.textData ? { ...clip.textData } : undefined,
      templateData: clip.templateData
        ? { ...clip.templateData, params: { ...clip.templateData.params } }
        : undefined,
      voiceOver: clip.voiceOver ? { ...clip.voiceOver } : undefined
    };
  }

  splitClip(clipId: string, splitTime: number): [Clip, Clip] | null {
    const clip = this.clips.get(clipId);
    if (!clip) return null;

    const clipStart = clip.startTime;
    const clipEnd = clip.startTime + clip.duration;

    if (splitTime <= clipStart || splitTime >= clipEnd) {
      return null;
    }

    const firstDuration = splitTime - clipStart;
    const secondDuration = clip.duration - firstDuration;

    const firstClip: Clip = {
      ...clip,
      id: this.generateId(),
      duration: firstDuration,
      name: `${clip.name} (1/2)`,
      effects: this._splitEffects(clip.effects, 'head', firstDuration),
      textData: clip.textData ? { ...clip.textData } : undefined,
      templateData: clip.templateData
        ? { ...clip.templateData, params: { ...clip.templateData.params } }
        : undefined
    };

    const secondClip: Clip = {
      ...clip,
      id: this.generateId(),
      startTime: splitTime,
      duration: secondDuration,
      offset: clip.offset + firstDuration,
      name: `${clip.name} (2/2)`,
      effects: this._splitEffects(clip.effects, 'tail', secondDuration),
      textData: clip.textData ? { ...clip.textData } : undefined,
      templateData: clip.templateData
        ? { ...clip.templateData, params: { ...clip.templateData.params } }
        : undefined
    };

    this.removeClip(clipId);
    this.clips.set(firstClip.id, firstClip);
    this.clips.set(secondClip.id, secondClip);

    return [firstClip, secondClip];
  }

  static splitClipStatic(clip: Clip, splitTime: number): [Clip, Clip] | null {
    const clipStart = clip.startTime;
    const clipEnd = clip.startTime + clip.duration;

    if (splitTime <= clipStart || splitTime >= clipEnd) {
      return null;
    }

    const firstDuration = splitTime - clipStart;
    const secondDuration = clip.duration - firstDuration;

    const firstClip: Clip = {
      ...clip,
      id: uuidv4(),
      duration: firstDuration,
      name: `${clip.name} (1/2)`
    };

    const secondClip: Clip = {
      ...clip,
      id: uuidv4(),
      startTime: splitTime,
      duration: secondDuration,
      offset: clip.offset + firstDuration,
      name: `${clip.name} (2/2)`
    };

    return [firstClip, secondClip];
  }

  private _splitEffects(
    effects: Effect[],
    part: 'head' | 'tail',
    duration: number
  ): Effect[] {
    return effects.map(fx => {
      const newFx = { ...fx, id: this.generateId() };

      if (fx.type === 'entrance' && part === 'tail') {
        return { ...newFx, duration: 0 };
      }
      if (fx.type === 'exit' && part === 'head') {
        return { ...newFx, duration: 0 };
      }

      return newFx;
    });
  }

  trimClip(clipId: string, startTime?: number, endTime?: number): Clip | null {
    const clip = this.clips.get(clipId);
    if (!clip) return null;

    const clipStart = clip.startTime;
    const clipEnd = clip.startTime + clip.duration;

    const newStartTime = startTime ?? clipStart;
    const newEndTime = endTime ?? clipEnd;

    if (newStartTime >= newEndTime) return null;
    if (newStartTime < clipStart || newEndTime > clipEnd) return null;

    const trimmedClip: Clip = {
      ...clip,
      startTime: newStartTime,
      duration: newEndTime - newStartTime,
      offset: clip.offset + (newStartTime - clipStart)
    };

    this.clips.set(clipId, trimmedClip);
    return trimmedClip;
  }

  static trimClipStatic(
    clip: Clip,
    startTime?: number,
    endTime?: number
  ): Clip | null {
    const clipStart = clip.startTime;
    const clipEnd = clip.startTime + clip.duration;

    const newStartTime = startTime ?? clipStart;
    const newEndTime = endTime ?? clipEnd;

    if (newStartTime >= newEndTime) return null;
    if (newStartTime < clipStart || newEndTime > clipEnd) return null;

    return {
      ...clip,
      startTime: newStartTime,
      duration: newEndTime - newStartTime,
      offset: clip.offset + (newStartTime - clipStart)
    };
  }

  // ==================== 移动（含兼容性检查） ====================

  moveClip(clipId: string, newTrackId: string, newStartTime: number): boolean {
    const clip = this.clips.get(clipId);
    if (!clip) return false;

    if (!this._checkTrackCompatibility(clip.type, newTrackId)) {
      return false;
    }

    const testClip: Clip = {
      ...clip,
      trackId: newTrackId,
      startTime: newStartTime
    };

    const allClips = this.getAllClips();
    if (!ClipOverlapDetector.canPlaceClip(allClips, testClip)) {
      return false;
    }

    clip.trackId = newTrackId;
    clip.startTime = newStartTime;
    return true;
  }

  static moveClipStatic(
    clip: Clip,
    allClips: Clip[],
    newTrackId: string,
    newStartTime: number
  ): boolean {
    if (!ClipManager._checkTrackCompatibilityStatic(clip.type, newTrackId)) {
      return false;
    }

    const testClip: Clip = {
      ...clip,
      trackId: newTrackId,
      startTime: newStartTime
    };

    return ClipOverlapDetector.canPlaceClip(allClips, testClip);
  }

  private _checkTrackCompatibility(clipType: Clip['type'], trackId: string): boolean {
    const compatibleTypes = TRACK_CLIP_COMPATIBILITY['video'] ?? [];
    return compatibleTypes.includes(clipType as any);
  }

  private static _checkTrackCompatibilityStatic(
    clipType: Clip['type'],
    _trackId: string
  ): boolean {
    const compatibleTypes = TRACK_CLIP_COMPATIBILITY['video'] ?? [];
    return compatibleTypes.includes(clipType as any);
  }

  // ==================== Transform 操作 ====================

  updateTransform(clipId: string, transform: Partial<Transform>): void {
    const clip = this.clips.get(clipId);
    if (clip) {
      const merged = { ...clip.transform, ...transform };
      clip.transform = clampTransform(merged);
    }
  }

  // ==================== 效果操作 ====================

  addEffect(clipId: string, effect: Effect): void {
    const clip = this.clips.get(clipId);
    if (clip) {
      clip.effects.push(effect);
    }
  }

  removeEffect(clipId: string, effectId: string): void {
    const clip = this.clips.get(clipId);
    if (clip) {
      clip.effects = clip.effects.filter(e => e.id !== effectId);
    }
  }

  // ==================== 效果应用计算 ====================

  applyEffectsToClip(
    clip: Clip,
    time: number,
    presetRegistry: Record<string, any>
  ): AppliedTransform {
    let finalTransform: Transform = { ...clip.transform };
    let finalOpacity = clip.style.opacity ?? 1;
    let finalFilter = '';
    const effectsApplied: string[] = [];

    if (!clip.effects || clip.effects.length === 0) {
      return {
        transform: finalTransform,
        opacity: finalOpacity,
        filter: finalFilter,
        effectsApplied
      };
    }

    const sortedEffects = sortEffectsByOrder(clip.effects);
    const clipRelativeTime = time - clip.startTime;

    for (const effect of sortedEffects) {
      const preset = presetRegistry[effect.presetId];
      if (!preset) continue;

      let progress = 0;

      if (effect.type === 'entrance' || effect.type === 'transition') {
        const dur = Math.max(0.1, effect.duration || 1);
        progress = Math.min(1, Math.max(0, clipRelativeTime / dur));
      } else if (effect.type === 'exit') {
        const dur = Math.max(0.1, effect.duration || 1);
        const exitStartTime = clip.duration - dur;
        if (clipRelativeTime >= exitStartTime) {
          progress = Math.min(1, Math.max(0, (clipRelativeTime - exitStartTime) / dur));
        } else {
          progress = 0;
        }
      } else {
        progress = Math.min(1, Math.max(0, clipRelativeTime / clip.duration));
      }

      const params = effect.params || {};

      try {
        if (typeof preset.apply === 'function') {
          const result = preset.apply(progress, params, { ...finalTransform });

          if (result?.transform) {
            const newScale = result.transform.scale;
            if (typeof newScale === 'number' && isFinite(newScale) && newScale > 0.001) {
              finalTransform = {
                x: typeof result.transform.x === 'number' ? result.transform.x : finalTransform.x,
                y: typeof result.transform.y === 'number' ? result.transform.y : finalTransform.y,
                scale: Math.max(0.001, Math.min(10, newScale)),
                rotation: typeof result.transform.rotation === 'number' ? result.transform.rotation : finalTransform.rotation
              };
            }
          }

          if (typeof result?.opacity === 'number') {
            finalOpacity *= Math.max(0, Math.min(1, result.opacity));
          }

          if (result?.filter) {
            finalFilter += `${result.filter} `;
          }
        }

        effectsApplied.push(effect.id);
      } catch (error) {
        console.error(`Error applying effect ${effect.presetId}:`, error);
      }
    }

    finalTransform.scale = Math.max(0.001, Math.min(10, finalTransform.scale));
    finalOpacity = Math.max(0, Math.min(1, finalOpacity));

    return {
      transform: finalTransform,
      opacity: finalOpacity,
      filter: finalFilter.trim(),
      effectsApplied
    };
  }

  // ==================== 边界计算 ====================

  calculateClipBounds(
    clip: Clip,
    projectSize: { width: number; height: number }
  ): DOMRect {
    const centerX = projectSize.width / 2;
    const centerY = projectSize.height / 2;

    const t = clip.transform;
    const scale = Math.max(0.001, t.scale ?? 1);

    const baseWidth = projectSize.width * scale;
    const baseHeight = projectSize.height * scale;

    const cos = Math.abs(Math.cos((t.rotation ?? 0) * Math.PI / 180));
    const sin = Math.abs(Math.sin((t.rotation ?? 0) * Math.PI / 180));

    const rotatedWidth = baseWidth * cos + baseHeight * sin;
    const rotatedHeight = baseWidth * sin + baseHeight * cos;

    return new DOMRect(
      centerX + (t.x ?? 0) - rotatedWidth / 2,
      centerY + (t.y ?? 0) - rotatedHeight / 2,
      rotatedWidth,
      rotatedHeight
    );
  }

  static calculateClipBoundsStatic(
    clip: Clip,
    projectSize: { width: number; height: number }
  ): DOMRect {
    const centerX = projectSize.width / 2;
    const centerY = projectSize.height / 2;

    const t = clip.transform;
    const scale = Math.max(0.001, t.scale ?? 1);

    const baseWidth = projectSize.width * scale;
    const baseHeight = projectSize.height * scale;

    const cos = Math.abs(Math.cos((t.rotation ?? 0) * Math.PI / 180));
    const sin = Math.abs(Math.sin((t.rotation ?? 0) * Math.PI / 180));

    const rotatedWidth = baseWidth * cos + baseHeight * sin;
    const rotatedHeight = baseWidth * sin + baseHeight * cos;

    return new DOMRect(
      centerX + (t.x ?? 0) - rotatedWidth / 2,
      centerY + (t.y ?? 0) - rotatedHeight / 2,
      rotatedWidth,
      rotatedHeight
    );
  }

  // ==================== 重叠检测代理 ====================

  detectOverlaps(targetClip?: Clip): OverlapResult {
    return ClipOverlapDetector.detect(this.getAllClips(), targetClip ?? null);
  }

  canPlaceClip(targetClip: Clip): boolean {
    return ClipOverlapDetector.canPlaceClip(this.getAllClips(), targetClip);
  }

  findGapOnTrack(
    trackId: string,
    requiredDuration: number,
    afterTime: number = 0
  ): { start: number; end: number } | null {
    return ClipOverlapDetector.findGap(
      this.getAllClips(),
      trackId,
      requiredDuration,
      afterTime
    );
  }

  // ==================== 序列化 ====================

  toRecord(): Record<string, Clip> {
    return Object.fromEntries(this.clips);
  }

  clear(): void {
    this.clips.clear();
  }

  get size(): number {
    return this.clips.size;
  }
}

export default ClipManager;
export { ClipManager };
