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

export interface VoiceOverResult {
  audioUrl: string;
  audioDuration: number;
  filePath: string;
}

export interface ProjectState {
  project: Project;
  assets: Asset[];
  copiedClip: Clip | null;
  lastSaved: number;
  
  initApp: () => Promise<void>;
  
  addClip: (asset: Asset | null, trackId: string, time: number, type?: Clip['type']) => void;
  updateClip: (clipId: string, changes: Partial<Clip>) => void;
  removeClip: (clipId: string) => void;
  copyClip: (clipId: string) => void;
  pasteClip: (trackId: string, time: number) => boolean;
  moveClip: (clipId: string, trackId: string, time: number) => boolean;
  
  addTrack: (type: Track['type']) => void;
  updateTrack: (trackId: string, changes: Partial<Track>) => void;
  removeTrack: (trackId: string) => void;
  
  addAssets: (assets: Asset[]) => void;
  removeAsset: (assetId: string) => void;
  
  addEffectToClip: (clipId: string, presetId: string) => boolean;
  removeEffectFromClip: (clipId: string, effectId: string) => void;
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

export const useProjectStore = create<ProjectState>((set, get) => ({
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

  initApp: async () => {
    const { project, assets } = await projectService.getLastActiveProject();
    
    set({ project, assets });
    
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

  // ==================== 片段操作（使用 ClipManager）====================

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
    set(state => {
      const clips = { ...state.project.clips || {} };
      const clip = clips[clipId];

      if (clip?.type === 'text' && clip.voiceOver?.linkedClipId) {
        const linkedId = clip.voiceOver.linkedClipId;
        if (clips[linkedId]) {
          delete clips[linkedId];
        }
      }

      if (clip?.type === 'audio') {
        const textClipWithLink = Object.values(clips).find(
          c => c.type === 'text' && c.voiceOver?.linkedClipId === clipId
        );
        if (textClipWithLink) {
          const { voiceOver, ...rest } = textClipWithLink;
          clips[textClipWithLink.id] = rest;
        }
      }

      delete clips[clipId];

      return {
        project: { ...state.project, clips }
      };
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

    const newClip = {
      ...copied,
      id: uuidv4(),
      trackId: trackId,
      startTime: time,
      name: `${copied.name} (Copy)`
    };

    set((state) => ({
      project: {
        ...state.project,
        clips: { ...state.project.clips, [newClip.id]: newClip }
      }
    }));
    return true;
  },

  moveClip: (clipId, trackId, time) => {
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

    set((state) => ({
      project: {
        ...state.project,
        clips: {
          ...state.project.clips,
          [clipId]: { ...clip, trackId, startTime: time }
        }
      }
    }));
    return true;
  },

  // ==================== 轨道操作（委托给 useTrackStore）====================

  addTrack: (type) => {
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

    // 互斥逻辑：1进 1出 1其他
    let newEffects = [...clip.effects];
    const category = preset.category;

    if (category === 'entrance') {
        newEffects = newEffects.filter(e => e.type !== 'entrance');
    } else if (category === 'exit') {
        newEffects = newEffects.filter(e => e.type !== 'exit');
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
    
    set((state) => ({
      project: {
        ...state.project,
        clips: { ...state.project.clips, [newClip.id]: newClip }
      }
    }));
    
    console.log(`✅ Added template clip: ${template.name}`);
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
    if (!state.project) return;
    
    const assets = useAssetStore.getState().assets;
    await projectService.saveProject(state.project, assets);
    set({ lastSaved: Date.now() });
  },

  startAutoSave: () => {
    const state = get();
    if (!state.project) return;
    
    const assets = useAssetStore.getState().assets;
    
    projectService.startAutoSave(
      state.project, 
      assets,
      () => {
        set({ lastSaved: Date.now() });
        console.log('💾 Auto-saved at', new Date().toLocaleTimeString());
      }
    );
  },

  stopAutoSave: () => {
    projectService.stopAutoSave();
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
      lastSaved: Date.now()
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
        lastSaved: Date.now()
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
        lastSaved: Date.now()
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


}));
