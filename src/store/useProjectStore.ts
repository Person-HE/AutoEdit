import { create } from 'zustand';
import type { Project, Clip, Track, Asset, VoiceOver } from '../types/core';
import { projectService } from '../services/projectService';
import { PRESETS } from '../engine/presets';
import { getTemplate, getTemplateDefaultParams } from '../engine/templates';
import { v4 as uuidv4 } from 'uuid';

import { useTrackStore } from '../modules/track/useTrackStore';
import { useAssetStore } from '../modules/asset/useAssetStore';
import ClipManager from '../modules/clip/ClipManager';
import { ClipFactory } from '../modules/clip/ClipTypes';
import { indexTTSService } from '../services/indexTtsService';
import { getSortedTrackClips, resolvePlacement } from '../modules/timeline/placement';
import { usePlayerStore } from './usePlayerStore';
import { useUIStore } from './useUIStore';
import type { Effect } from '../types/core';

export interface VoiceOverResult {
  audioUrl: string;
  audioDuration: number;
  filePath: string;
}

/** 删除片段并处理文本↔配音互链级联（改变传入 map） */
function removeClipCascade(clips: Record<string, Clip>, clipId: string) {
  const clip = clips[clipId];
  if (!clip) return;

  if (clip.type === 'text' && clip.voiceOver?.linkedClipId) {
    const linkedId = clip.voiceOver.linkedClipId;
    if (clips[linkedId]) delete clips[linkedId];
  }

  if (clip.type === 'audio') {
    for (const other of Object.values(clips)) {
      if (other.type === 'text' && other.voiceOver?.linkedClipId === clipId) {
        const { voiceOver, ...rest } = other;
        clips[other.id] = rest;
      }
    }
  }

  delete clips[clipId];
}

/** 分割时拆分效果：入场效果留在前半段，出场效果留在后半段（沿用 ClipManager 语义） */
function splitEffects(effects: Effect[], part: 'head' | 'tail'): Effect[] {
  return effects.map(fx => {
    const copy = { ...fx, id: uuidv4() };
    if (fx.type === 'entrance' && part === 'tail') return { ...copy, duration: 0 };
    if (fx.type === 'exit' && part === 'head') return { ...copy, duration: 0 };
    return copy;
  });
}

export interface ProjectState {
  project: Project;
  assets: Asset[];
  copiedClip: Clip | null;
  lastSaved: number;

  /** 撤销栈（只存 project 引用，片段/轨道变更均可回退；素材库导入不在历史范围内） */
  past: Project[];
  future: Project[];

  initApp: () => Promise<void>;

  canUndo: () => boolean;
  canRedo: () => boolean;
  /** 撤销/重做：还原 project 并同步 useTrackStore */
  undo: () => void;
  redo: () => void;
  /**
   * 打一次手动快照。约定：
   * - 离散动作(add/remove/split/paste/效果增删/轨道增删)内部自动入栈；
   * - 连续手势(拖动/修剪/滑杆)由调用方在手势开始时调 markHistory，
   *   过程中直接用 updateClip(不产生历史)，抬手即完成一个撤销单元。
   */
  markHistory: () => void;

  addClip: (asset: Asset | null, trackId: string, time: number, type?: Clip['type']) => void;
  updateClip: (clipId: string, changes: Partial<Clip>) => void;
  removeClip: (clipId: string) => void;
  /** 删除并把同轨后续片段前移补位 */
  rippleDeleteClip: (clipId: string) => void;
  copyClip: (clipId: string) => void;
  pasteClip: (trackId: string, time: number) => boolean;
  /** 在播放头处分割（选中片段优先，否则分割所有跨线片段；链接的文本↔配音一起切） */
  splitAtTime: (time: number, onlySelected?: boolean) => number;
  /** 创建副本，紧随原片段之后的最近合法位置 */
  duplicateClip: (clipId: string) => boolean;
  /** 跨轨/同轨移动（内部做防重叠让位）；opts.history=false 用于手势已自行 markHistory 的场景 */
  moveClip: (clipId: string, trackId: string, time: number, opts?: { history?: boolean }) => boolean;
  
  addTrack: (type: Track['type']) => void;
  updateTrack: (trackId: string, changes: Partial<Track>) => void;
  removeTrack: (trackId: string) => void;
  
  addAssets: (assets: Asset[]) => void;
  removeAsset: (assetId: string) => void;
  
  addEffectToClip: (clipId: string, presetId: string) => boolean;
  removeEffectFromClip: (clipId: string, effectId: string) => void;
  clearClipEffects: (clipId: string) => void;
  updateEffectParams: (clipId: string, effectId: string, params: any) => void;
  
  addTemplateClip: (templateId: string, trackId: string, time: number) => boolean;
  updateTemplateParams: (clipId: string, params: any) => void;
  
  generateVoiceOver: (clipId: string, referenceAudioFile: File, speed?: number) => Promise<void>;
  removeVoiceOver: (clipId: string) => void;
  
  createNewProject: (name: string) => Promise<string>;
  deleteProject: (projectId: string) => Promise<void>;
  renameProject: (projectId: string, newName: string) => Promise<void>;
  switchProject: (projectId: string) => Promise<void>;
  
  saveProject: () => Promise<void>;
  startAutoSave: () => void;
  stopAutoSave: () => void;
  exportProject: () => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set, get) => {
  const HISTORY_LIMIT = 100;

  const pushHistory = () => {
    set(state => ({
      past: [...state.past.slice(-(HISTORY_LIMIT - 1)), state.project],
      future: [],
    }));
  };

  /** 撤销/重做后同步轨道镜像 store，保持双写一致 */
  const restoreTracks = (p: Project) => {
    useTrackStore.getState().setTracks(p.tracks || []);
  };

  return {
  project: {
    id: 'temp',
    name: '加载中...',
    width: 1920,
    height: 1080,
    duration: 30,
    fps: 60,
    tracks: [],
    clips: {},
    lastModified: Date.now()
  },
  assets: [], // 保持向后兼容 - 实际数据来自 useAssetStore
  copiedClip: null,
  lastSaved: Date.now(),
  past: [],
  future: [],

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,

  undo: () => {
    const { past, future, project } = get();
    if (!past.length) return;
    const prev = past[past.length - 1];
    restoreTracks(prev);
    set({ project: prev, past: past.slice(0, -1), future: [project, ...future].slice(0, HISTORY_LIMIT) });
  },

  redo: () => {
    const { past, future, project } = get();
    if (!future.length) return;
    const next = future[0];
    restoreTracks(next);
    set({ project: next, past: [...past.slice(-(HISTORY_LIMIT - 1)), project], future: future.slice(1) });
  },

  markHistory: () => pushHistory(),

  initApp: async () => {
    const { project, assets } = await projectService.getLastActiveProject();

    set({ project, assets, past: [], future: [] });
    
    // 同步到模块 store
    useAssetStore.getState().setAssets(assets);
    useTrackStore.getState().setTracks(project.tracks || []);
    
    // 启动自动保存
    get().startAutoSave();
    
    console.log(`✅ App initialized with ${assets.length} assets`);
  },

  // ==================== 素材操作（委托给 useAssetStore + 同步本地状态）====================
  
  addAssets: (newAssets) => {
    useAssetStore.getState().addAssets(newAssets);
    // 同步到本地状态以保持向后兼容
    set(state => ({ 
      assets: [...state.assets, ...newAssets] 
    }));
  },

  removeAsset: (assetId) => {
    useAssetStore.getState().removeAsset(assetId);
    // 同步到本地状态以保持向后兼容
    set(state => ({
      assets: state.assets.filter(a => a.id !== assetId)
    }));
  },

  // ==================== 片段操作 ====================

  addClip: (asset, trackId, time, type = 'video') => {
    const state = get();

    let clipConfig;
    const isText = type === 'text';

    if (isText) {
      clipConfig = {
        type: 'text' as const,
        trackId,
        startTime: time,
        textData: {
          content: '双击编辑文本',
          fontSize: 60,
          fontFamily: 'Arial',
          color: '#ffffff'
        }
      };
    } else if (asset) {
      clipConfig = {
        type: (asset.type === 'image' ? 'image' : 'video') as 'video' | 'image',
        assetId: asset.id,
        trackId,
        startTime: time,
        duration: asset.duration || (asset.type === 'image' ? 5 : 10),
        offset: 0,
        name: asset.name
      };
    } else {
      clipConfig = {
        type: 'video' as const,
        trackId,
        startTime: time,
        name: 'Clip'
      };
    }

    const newClip = ClipFactory.createClip(clipConfig);

    // 同轨防重叠：吸附到最近合法落位
    const trackClips = getSortedTrackClips(state.project.clips, trackId);
    const placedStart = resolvePlacement(trackClips, newClip.duration, Math.max(0, time));
    if (placedStart === null) return;
    newClip.startTime = placedStart;

    pushHistory();

    set((state) => ({
      project: {
        ...state.project,
        clips: { ...state.project.clips, [newClip.id]: newClip }
      }
    }));
  },

  updateClip: (clipId, changes) => {
    set((state) => {
      const clip = (state.project.clips || {})[clipId];
      if (!clip) return {};

      const updatedClips: Record<string, Clip> = {
        ...state.project.clips,
        [clipId]: { ...clip, ...changes }
      };

      if (clip.type === 'text' && clip.voiceOver?.linkedClipId) {
        const linkedClipId = clip.voiceOver.linkedClipId;
        const linkedClip = updatedClips[linkedClipId];
        if (linkedClip) {
          if (changes.startTime !== undefined) {
            updatedClips[linkedClipId] = { ...linkedClip, startTime: changes.startTime };
          }
          if (changes.duration !== undefined) {
            updatedClips[linkedClipId] = { 
              ...(updatedClips[linkedClipId] || linkedClip), 
              duration: changes.duration 
            };
          }
        }
      }

      if (clip.type === 'audio') {
        const textClipWithLink = Object.values(state.project.clips || {}).find(
          c => c.type === 'text' && c.voiceOver?.linkedClipId === clipId
        );
        if (textClipWithLink) {
          if (changes.startTime !== undefined) {
            updatedClips[textClipWithLink.id] = {
              ...updatedClips[textClipWithLink.id],
              startTime: changes.startTime,
            };
          }
          if (changes.duration !== undefined) {
            updatedClips[textClipWithLink.id] = {
              ...updatedClips[textClipWithLink.id],
              duration: changes.duration,
            };
            if (updatedClips[textClipWithLink.id].voiceOver) {
              updatedClips[textClipWithLink.id] = {
                ...updatedClips[textClipWithLink.id],
                voiceOver: {
                  ...updatedClips[textClipWithLink.id].voiceOver!,
                  audioDuration: changes.duration,
                },
              };
            }
          }
        }
      }

      return {
        project: {
          ...state.project,
          clips: updatedClips
        }
      };
    });
  },

  removeClip: (clipId) => {
    const clip = (get().project.clips || {})[clipId];
    if (!clip) return;
    pushHistory();

    set(state => {
      const clips = { ...state.project.clips || {} };
      removeClipCascade(clips, clipId);
      return {
        project: { ...state.project, clips }
      };
    });
  },

  rippleDeleteClip: (clipId) => {
    const state = get();
    const clipsMap = state.project.clips || {};
    const target = clipsMap[clipId];
    if (!target) return;
    pushHistory();

    set(s => {
      const clips = { ...s.project.clips };
      // 计算级联删除集合（文本↔配音互链）
      const removedIds = new Set<string>();
      const collectRemovals = (id: string) => {
        if (removedIds.has(id)) return;
        const c = clips[id];
        if (!c) return;
        removedIds.add(id);
        if (c.type === 'text' && c.voiceOver?.linkedClipId) collectRemovals(c.voiceOver.linkedClipId);
        if (c.type === 'audio') {
          for (const other of Object.values(clips)) {
            if (other.type === 'text' && other.voiceOver?.linkedClipId === id) collectRemovals(other.id);
          }
        }
      };
      collectRemovals(clipId);

      // 同轨上被删片段所占的时长总和，用于前移补位
      let shift = 0;
      for (const id of removedIds) {
        const c = clips[id];
        if (c.trackId === target.trackId) shift += c.duration;
      }

      for (const id of removedIds) delete clips[id];

      for (const c of Object.values(clips)) {
        if (c.trackId === target.trackId && c.startTime >= target.startTime + 1e-6) {
          clips[c.id] = { ...c, startTime: Math.max(0, c.startTime - shift) };
        }
      }

      return { project: { ...s.project, clips } };
    });
  },

  copyClip: (clipId) => {
    set(state => ({
      copiedClip: (state.project.clips || {})[clipId] ? { ...(state.project.clips || {})[clipId] } : null
    }));
  },

  pasteClip: (trackId, time) => {
    const state = get();
    const copied = state.copiedClip;
    const targetTrack = state.project.tracks.find(t => t.id === trackId);

    if (!copied || !targetTrack) return false;

    // 兼容性检查
    const isAudioTrack = targetTrack.type === 'audio';
    const isTextTrack = targetTrack.type === 'text';

    if (isAudioTrack && copied.type !== 'audio') {
      alert("❌ 无法粘贴：格式不匹配 (音频轨道)");
      return false;
    }
    if (isTextTrack && copied.type !== 'text') {
      alert("❌ 无法粘贴：格式不匹配 (文本轨道)");
      return false;
    }
    if (targetTrack.type === 'video' && copied.type === 'audio') {
      alert("❌ 无法粘贴：音频无法放入视频轨道");
      return false;
    }

    // 同轨防重叠落位；跨轨道粘贴时剥离配音链接（链接只在原音轨有效）
    const trackClips = getSortedTrackClips(state.project.clips, trackId);
    const placedStart = resolvePlacement(trackClips, copied.duration, Math.max(0, time));
    if (placedStart === null) return false;

    const newClip: Clip = {
      ...copied,
      id: uuidv4(),
      trackId,
      startTime: placedStart,
      name: `${copied.name} (Copy)`
    };
    if (trackId !== copied.trackId && newClip.voiceOver) newClip.voiceOver = undefined;

    pushHistory();

    set((state) => ({
      project: {
        ...state.project,
        clips: { ...state.project.clips, [newClip.id]: newClip }
      }
    }));
    return true;
  },

  splitAtTime: (time, onlySelected = false) => {
    const state = get();
    const clips = state.project.clips || {};
    const selectedId = useUIStore.getState().selectedClipId;

    // 需要分割的片段：选中优先；否则所有跨线片段
    const targets: string[] = [];
    if (onlySelected && selectedId && clips[selectedId]) {
      const c = clips[selectedId];
      if (time > c.startTime + 1e-6 && time < c.startTime + c.duration - 1e-6) targets.push(selectedId);
    } else {
      for (const c of Object.values(clips)) {
        if (time > c.startTime + 1e-6 && time < c.startTime + c.duration - 1e-6) targets.push(c.id);
      }
    }
    if (!targets.length) return 0;

    // 文本片段联动其配音音频一起切，保持对齐
    const allTargets = new Set<string>(targets);
    for (const id of targets) {
      const c = clips[id];
      const linkedId = c.type === 'text' ? c.voiceOver?.linkedClipId : undefined;
      if (linkedId && clips[linkedId]) {
        const lc = clips[linkedId];
        if (time > lc.startTime + 1e-6 && time < lc.startTime + lc.duration - 1e-6) allTargets.add(linkedId);
      }
    }

    pushHistory();

    set(s => {
      const next = { ...s.project.clips };
      for (const id of allTargets) {
        const clip = next[id];
        if (!clip) continue;
        const firstDuration = time - clip.startTime;
        const secondDuration = clip.duration - firstDuration;

        const firstClip: Clip = {
          ...clip,
          id: uuidv4(),
          duration: firstDuration,
          name: `${clip.name} (1)`,
          effects: splitEffects(clip.effects || [], 'head')
        };
        const secondClip: Clip = {
          ...clip,
          id: uuidv4(),
          startTime: time,
          duration: secondDuration,
          offset: clip.offset + firstDuration,
          name: `${clip.name} (2)`,
          effects: splitEffects(clip.effects || [], 'tail')
        };

        delete next[id];
        next[firstClip.id] = firstClip;
        next[secondClip.id] = secondClip;
      }
      return { project: { ...s.project, clips: next } };
    });

    return allTargets.size;
  },

  duplicateClip: (clipId) => {
    const state = get();
    const orig = (state.project.clips || {})[clipId];
    if (!orig) return false;

    const trackClips = getSortedTrackClips(state.project.clips, orig.trackId, clipId);
    const wanted = orig.startTime + orig.duration;
    const placedStart = resolvePlacement(trackClips, orig.duration, wanted);
    if (placedStart === null) return false;

    const copy: Clip = { ...orig, id: uuidv4(), startTime: placedStart, name: `${orig.name} 副本` };

    pushHistory();

    set(s => ({
      project: {
        ...s.project,
        clips: { ...s.project.clips, [copy.id]: copy }
      }
    }));
    return true;
  },

  moveClip: (clipId, trackId, time, opts) => {
    const state = get();
    const clip = (state.project.clips || {})[clipId];
    const targetTrack = state.project.tracks.find(t => t.id === trackId);
    if (!clip || !targetTrack) return false;

    // 兼容性检查
    const isAudioTrack = targetTrack.type === 'audio';
    const isTextTrack = targetTrack.type === 'text';

    if (isAudioTrack && clip.type !== 'audio') return false;
    if (isTextTrack && clip.type !== 'text') return false;
    if (targetTrack.type === 'video' && (clip.type === 'audio' || clip.type === 'text')) return false;

    // 同轨防重叠让位
    const trackClips = getSortedTrackClips(state.project.clips, trackId, clipId);
    const placedStart = resolvePlacement(trackClips, clip.duration, Math.max(0, time));
    if (placedStart === null) return false;

    if (opts?.history !== false) pushHistory();

    set((state) => ({
      project: {
        ...state.project,
        clips: {
          ...state.project.clips,
          [clipId]: { ...clip, trackId, startTime: placedStart }
        }
      }
    }));
    return true;
  },

  // ==================== 轨道操作（委托给 useTrackStore）====================

  addTrack: (type) => {
    pushHistory();
    useTrackStore.getState().addTrack(type);
    
    // 同步到 project.tracks 以保持兼容
    const tracks = useTrackStore.getState().tracks;
    set(state => ({
      project: { ...state.project, tracks }
    }));
  },

  updateTrack: (trackId, changes) => {
    useTrackStore.getState().updateTrack(trackId, changes);
    
    // 同步到 project.tracks
    const tracks = useTrackStore.getState().tracks;
    set(state => ({
      project: { ...state.project, tracks }
    }));
  },

  removeTrack: (trackId) => {
    if (!get().project.tracks.some(t => t.id === trackId)) return;
    pushHistory();
    useTrackStore.getState().removeTrack(trackId);
    
    // 删除该轨道上的所有片段并同步
    set(state => {
      const newClips = { ...state.project.clips };
      Object.keys(newClips).forEach(key => {
        if (newClips[key].trackId === trackId) {
          delete newClips[key];
        }
      });
      
      const tracks = useTrackStore.getState().tracks;
      return {
        project: { ...state.project, tracks, clips: newClips }
      };
    });
  },

  // ==================== 效果操作 ====================

  addEffectToClip: (clipId, presetId) => {
    const state = get();
    const clip = (state.project.clips || {})[clipId];
    const preset = PRESETS[presetId];
    if (!clip || !preset) return false;

    pushHistory();

    // 互斥逻辑：1进 1出 1转场 1其他
    let newEffects = [...clip.effects];
    const category = preset.category;

    if (category === 'entrance') {
        newEffects = newEffects.filter(e => e.type !== 'entrance');
    } else if (category === 'exit') {
        newEffects = newEffects.filter(e => e.type !== 'exit');
    } else if (category === 'transition') {
        newEffects = newEffects.filter(e => e.type !== 'transition');
        if (preset.id.startsWith('transition_')) newEffects = newEffects.filter(e => e.presetId !== preset.id);
    } else {
        newEffects = newEffects.filter(e => e.type === 'entrance' || e.type === 'exit');
    }

    // Initialize default params
    const defaultParams: any = {};
    preset.schema.forEach(field => {
        defaultParams[field.key] = field.default;
    });

    const newEffect = { 
        id: uuidv4(), 
        presetId: preset.id,
        type: preset.category, 
        name: preset.name, 
        duration: ['entrance', 'exit', 'transition'].includes(preset.category) ? 1.0 : clip.duration,
        params: defaultParams
    };

    newEffects.push(newEffect);

    set((state) => ({
      project: {
        ...state.project,
        clips: {
          ...state.project.clips,
          [clipId]: { ...clip, effects: newEffects }
        }
      }
    }));
    return true;
  },

  removeEffectFromClip: (clipId, effectId) => {
    const clip = (get().project.clips || {})[clipId];
    if (!clip || !clip.effects.some(e => e.id === effectId)) return;
    pushHistory();

    set(state => {
        const clip = (state.project.clips || {})[clipId];
        if (!clip) return {};
        const newEffects = clip.effects.filter(e => e.id !== effectId);
        return { 
            project: { 
                ...state.project, 
                clips: { ...state.project.clips, [clipId]: { ...clip, effects: newEffects } } 
            } 
        };
    });
  },

  clearClipEffects: (clipId) => {
    const clip = (get().project.clips || {})[clipId];
    if (!clip || !clip.effects?.length) return;
    pushHistory();

    set(state => ({
      project: {
        ...state.project,
        clips: { ...state.project.clips, [clipId]: { ...clip, effects: [] } }
      }
    }));
  },

  updateEffectParams: (clipId, effectId, params) => {
    set(state => {
        const clip = (state.project.clips || {})[clipId];
        if (!clip) return {};
        
        const newEffects = clip.effects.map(fx => 
            fx.id === effectId ? { ...fx, params: { ...fx.params, ...params } } : fx
        );

        return {
            project: {
                ...state.project,
                clips: {
                    ...state.project.clips,
                    [clipId]: { ...clip, effects: newEffects }
                }
            }
        };
    });
  },

  // ==================== 模板操作 ====================

  addTemplateClip: (templateId, trackId, time) => {
    const state = get();
    const template = getTemplate(templateId);
    const track = state.project.tracks.find(t => t.id === trackId);

    if (!template || !track) return false;
    if (track.type !== 'video') {
      alert('❌ 模板只能添加到视频轨道');
      return false;
    }

    const defaultParams = getTemplateDefaultParams(templateId);
    const initParams = template.initParams ? template.initParams(5) : defaultParams;

    const newClip = ClipFactory.createTemplateClip({
      type: 'template',
      templateId,
      trackId,
      startTime: time,
      templateParams: initParams,
      name: template.name
    });

    // 同轨防重叠落位
    const trackClips = getSortedTrackClips(state.project.clips, trackId);
    const placedStart = resolvePlacement(trackClips, newClip.duration, Math.max(0, time));
    if (placedStart === null) return false;
    newClip.startTime = placedStart;

    pushHistory();

    set((state) => ({
      project: {
        ...state.project,
        clips: { ...state.project.clips, [newClip.id]: newClip }
      }
    }));

    return true;
  },

  updateTemplateParams: (clipId, params) => {
    set((state) => {
      const clip = (state.project.clips || {})[clipId];
      if (!clip || clip.type !== 'template' || !clip.templateData) return {};
      
      return {
        project: {
          ...state.project,
          clips: {
            ...state.project.clips,
            [clipId]: {
              ...clip,
              templateData: {
                ...clip.templateData,
                params: { ...clip.templateData.params, ...params }
              }
            }
          }
        }
      };
    });
  },

  // ==================== 项目级操作 ====================

  generateVoiceOver: async (clipId, referenceAudioFile, speed = 1.0) => {
    const state = get();
    const clip = (state.project.clips || {})[clipId];
    if (!clip || clip.type !== 'text' || !clip.textData?.content) {
      throw new Error('请选择一个包含文本内容的文本片段');
    }

    const result = await indexTTSService.generateVoice(
      clip.textData.content,
      referenceAudioFile,
      { speed }
    );

    pushHistory();

    let audioTrack = state.project.tracks.find(t => t.type === 'audio');
    if (!audioTrack) {
      useTrackStore.getState().addTrack('audio');
      const updatedTracks = useTrackStore.getState().tracks;
      audioTrack = updatedTracks.find(t => t.type === 'audio');
      set(s => ({ project: { ...s.project, tracks: updatedTracks } }));
    }

    const existingLinkedClipId = clip.voiceOver?.linkedClipId;
    if (existingLinkedClipId && (state.project.clips || {})[existingLinkedClipId]) {
      const linkedClip = (state.project.clips || {})[existingLinkedClipId];
      const audioAsset: Asset = {
        id: linkedClip.assetId,
        name: `配音: ${clip.textData.content.substring(0, 10)}`,
        type: 'audio',
        url: result.audioUrl,
        duration: result.audioDuration,
        createdAt: Date.now(),
      };
      useAssetStore.getState().addAssets([audioAsset]);
      set(s => ({
        project: {
          ...s.project,
          clips: {
            ...s.project.clips,
            [clipId]: {
              ...clip,
              voiceOver: {
                audioSource: result.audioUrl,
                audioDuration: result.audioDuration,
                voice: referenceAudioFile.name,
                speed,
                generatedAt: Date.now(),
                filePath: result.filePath,
                linkedClipId: existingLinkedClipId,
                referenceAudioName: referenceAudioFile.name,
              },
              duration: result.audioDuration,
            },
            [existingLinkedClipId]: {
              ...linkedClip,
              startTime: clip.startTime,
              duration: result.audioDuration,
            },
          },
        },
        assets: [...s.assets, audioAsset],
      }));
    } else {
      const audioAssetId = uuidv4();
      const audioClipId = uuidv4();
      const audioAsset: Asset = {
        id: audioAssetId,
        name: `配音: ${clip.textData.content.substring(0, 10)}`,
        type: 'audio',
        url: result.audioUrl,
        duration: result.audioDuration,
        createdAt: Date.now(),
      };

      useAssetStore.getState().addAssets([audioAsset]);

      const audioClip: Clip = {
        id: audioClipId,
        assetId: audioAssetId,
        trackId: audioTrack!.id,
        type: 'audio',
        startTime: clip.startTime,
        duration: result.audioDuration,
        offset: 0,
        transform: { x: 0, y: 0, scale: 1, rotation: 0 },
        style: { opacity: 1, zIndex: 0 },
        effects: [],
        name: `配音: ${clip.textData.content.substring(0, 10)}`,
        volume: 1,
      };

      set(s => ({
        project: {
          ...s.project,
          clips: {
            ...s.project.clips,
            [clipId]: {
              ...clip,
              voiceOver: {
                audioSource: result.audioUrl,
                audioDuration: result.audioDuration,
                voice: referenceAudioFile.name,
                speed,
                generatedAt: Date.now(),
                filePath: result.filePath,
                linkedClipId: audioClipId,
                referenceAudioName: referenceAudioFile.name,
              },
              duration: result.audioDuration,
            },
            [audioClipId]: audioClip,
          },
        },
        assets: [...s.assets, audioAsset],
      }));
    }

    console.log(`Voice over generated for clip ${clipId}, duration: ${result.audioDuration.toFixed(2)}s`);
  },

  removeVoiceOver: (clipId) => {
    const state = get();
    const clip = (state.project.clips || {})[clipId];
    if (!clip || !clip.voiceOver) return;
    pushHistory();

    const linkedClipId = clip.voiceOver.linkedClipId;
    const newClips = { ...state.project.clips };

    if (linkedClipId && newClips[linkedClipId]) {
      delete newClips[linkedClipId];
    }

    const { voiceOver, ...clipWithoutVoiceOver } = clip;
    newClips[clipId] = {
      ...clipWithoutVoiceOver,
    };

    set(s => ({
      project: { ...s.project, clips: newClips },
    }));
  },

  saveProject: async () => {
    const state = get();
    if (!state.project || state.project.id === 'temp-load') return;

    const assets = useAssetStore.getState().assets;
    await projectService.saveProject(state.project, assets);
    set({ lastSaved: Date.now() });
  },

  startAutoSave: () => {
    // 兜底周期保存（读取实时状态）
    projectService.startAutoSave(
      () => get().project,
      () => useAssetStore.getState().assets,
      () => set({ lastSaved: Date.now() })
    );

    // 主路径：项目引用变化即标记脏，2s 防抖保存
    (get() as any)._autoSaveUnsub?.();
    const timers: Set<ReturnType<typeof setTimeout>> = new Set();
    (useProjectStore as any)._debounceTimers = timers;
    let lastSavedProject: Project | null = get().project;
    const unsub = useProjectStore.subscribe((state) => {
      if (state.project === lastSavedProject) return;
      lastSavedProject = state.project;
      timers.forEach(clearTimeout);
      timers.clear();
      timers.add(setTimeout(() => { get().saveProject(); }, 2000));
    });
    (get() as any)._autoSaveUnsub = unsub;
  },

  stopAutoSave: () => {
    projectService.stopAutoSave();
    const unsub = (get() as any)._autoSaveUnsub;
    if (unsub) unsub();
    const timers = (useProjectStore as any)._debounceTimers as Set<ReturnType<typeof setTimeout>> | undefined;
    if (timers) timers.forEach(clearTimeout);
  },

  createNewProject: async (name) => {
    const newProject: Project = {
      id: uuidv4(),
      name: name || `未命名项目_${new Date().toLocaleDateString()}`,
      width: 1920,
      height: 1080,
      duration: 30,
      fps: 60,
      tracks: [
        { id: 'track_v1', type: 'video', name: '视频轨道 1', visible: true, locked: false },
        { id: 'track_a1', type: 'audio', name: '音频轨道 1', visible: true, locked: false }
      ],
      clips: {},
      lastModified: Date.now()
    };

    const projectId = await projectService.createNewProject(newProject);
    
    // 重置所有模块 store
    useAssetStore.getState().clearAll();
    useTrackStore.getState().setTracks(newProject.tracks);
    
    set(state => ({
      project: newProject,
      copiedClip: null,
      lastSaved: Date.now(),
      past: [],
      future: []
    }));

    console.log(`✅ Created new project: ${name}`);
    return projectId;
  },

  deleteProject: async (projectId) => {
    await projectService.deleteProject(projectId);
    
    const state = get();
    if (state.project.id === projectId) {
      const newProject: Project = {
        id: uuidv4(),
        name: `未命名项目_${new Date().toLocaleDateString()}`,
        width: 1920,
        height: 1080,
        duration: 30,
        fps: 60,
        tracks: [
          { id: 'track_v1', type: 'video', name: '视频轨道 1', visible: true, locked: false },
          { id: 'track_a1', type: 'audio', name: '音频轨道 1', visible: true, locked: false }
        ],
        clips: {},
        lastModified: Date.now()
      };

      // 重置模块 store
      useAssetStore.getState().clearAll();
      useTrackStore.getState().setTracks(newProject.tracks);

      set(state => ({
        project: newProject,
        copiedClip: null,
        lastSaved: Date.now(),
        past: [],
        future: []
      }));
    }

    console.log(`🗑️ Deleted project: ${projectId}`);
  },

  renameProject: async (projectId, newName) => {
    await projectService.renameProject(projectId, newName);
    
    const state = get();
    if (state.project.id === projectId) {
      set(state => ({
        project: { ...state.project, name: newName }
      }));
    }

    console.log(`✏️ Renamed project to: ${newName}`);
  },

  switchProject: async (projectId) => {
    const result = await projectService.switchProject(projectId);
    
    if (result) {
      // 同步到模块 store
      useAssetStore.getState().setAssets(result.assets);
      useTrackStore.getState().setTracks(result.project.tracks || []);
      
      set(state => ({
        project: result.project,
        copiedClip: null,
        lastSaved: Date.now(),
        past: [],
        future: []
      }));

      console.log(`🔄 Switched to project: ${result.project.name}`);
    } else {
      console.error(`Failed to switch to project: ${projectId}`);
    }
  },

  exportProject: async () => {
    const state = get();
    if (!state.project) return;

    const assets = useAssetStore.getState().assets;
    await projectService.exportProject(state.project, assets);
    console.log(`📦 Exported project: ${state.project.name}`);
  },
  };
});
