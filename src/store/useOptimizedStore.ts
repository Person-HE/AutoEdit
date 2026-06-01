import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { Project, Clip, Track, Asset } from '../types/core';
import { projectService } from '../services/projectService';
import { PRESETS } from '../engine/presets';
import { getTemplate, getTemplateDefaultParams } from '../engine/templates';
import { v4 as uuidv4 } from 'uuid';

import { useTrackStore } from '../modules/track/useTrackStore';
import { useAssetStore } from '../modules/asset/useAssetStore';
import ClipManager from '../modules/clip/ClipManager';
import { ClipFactory } from '../modules/clip/ClipTypes';

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

  createNewProject: (name: string) => Promise<string>;
  deleteProject: (projectId: string) => Promise<void>;
  renameProject: (projectId: string, newName: string) => Promise<void>;
  switchProject: (projectId: string) => Promise<void>;

  saveProject: () => Promise<void>;
  startAutoSave: () => void;
  stopAutoSave: () => void;
  exportProject: () => Promise<void>;
}

const createOptimizedProjectStore = () => {
  return create<ProjectState>()(
    subscribeWithSelector((set, get) => ({
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
      assets: [],
      copiedClip: null,
      lastSaved: Date.now(),

      initApp: async () => {
        const { project, assets } = await projectService.getLastActiveProject();
        set({ project, assets });
        useAssetStore.getState().setAssets(assets);
        useTrackStore.getState().setTracks(project.tracks || []);
        get().startAutoSave();
      },

      addAssets: (newAssets) => {
        useAssetStore.getState().addAssets(newAssets);
        set(state => ({ assets: [...state.assets, ...newAssets] }));
      },

      removeAsset: (assetId) => {
        useAssetStore.getState().removeAsset(assetId);
        set(state => ({ assets: state.assets.filter(a => a.id !== assetId) }));
      },

      addClip: (asset, trackId, time, type = 'video') => {
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
          const clip = state.project.clips[clipId];
          if (!clip) return {};
          return {
            project: {
              ...state.project,
              clips: {
                ...state.project.clips,
                [clipId]: { ...clip, ...changes }
              }
            }
          };
        });
      },

      removeClip: (clipId) => {
        set(state => {
          const clips = state.project.clips;
          const { [clipId]: removed, ...remainingClips } = clips;
          return {
            project: { ...state.project, clips: remainingClips }
          };
        });
      },

      copyClip: (clipId) => {
        set(state => ({
          copiedClip: state.project.clips[clipId] ? { ...state.project.clips[clipId] } : null
        }));
      },

      pasteClip: (trackId, time) => {
        const state = get();
        const copied = state.copiedClip;
        const targetTrack = state.project.tracks.find(t => t.id === trackId);
        if (!copied || !targetTrack) return false;

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
        const clip = state.project.clips[clipId];
        const targetTrack = state.project.tracks.find(t => t.id === trackId);
        if (!clip || !targetTrack) return false;

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

      addTrack: (type) => {
        useTrackStore.getState().addTrack(type);
        const tracks = useTrackStore.getState().tracks;
        set(state => ({ project: { ...state.project, tracks } }));
      },

      updateTrack: (trackId, changes) => {
        useTrackStore.getState().updateTrack(trackId, changes);
        const tracks = useTrackStore.getState().tracks;
        set(state => ({ project: { ...state.project, tracks } }));
      },

      removeTrack: (trackId) => {
        useTrackStore.getState().removeTrack(trackId);
        set(state => {
          const newClips = { ...state.project.clips };
          Object.keys(newClips).forEach(key => {
            if (newClips[key].trackId === trackId) {
              delete newClips[key];
            }
          });
          const tracks = useTrackStore.getState().tracks;
          return { project: { ...state.project, tracks, clips: newClips } };
        });
      },

      addEffectToClip: (clipId, presetId) => {
        const state = get();
        const clip = state.project.clips[clipId];
        const preset = PRESETS[presetId];
        if (!clip || !preset) return false;

        let newEffects = [...(clip.effects || [])];
        const category = preset.category;

        if (category === 'entrance') {
          newEffects = newEffects.filter(e => e.type !== 'entrance');
        } else if (category === 'exit') {
          newEffects = newEffects.filter(e => e.type !== 'exit');
        } else {
          newEffects = newEffects.filter(e => e.type === 'entrance' || e.type === 'exit');
        }

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
          const clip = state.project.clips[clipId];
          if (!clip) return {};
          const newEffects = (clip.effects || []).filter(e => e.id !== effectId);
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
          const clip = state.project.clips[clipId];
          if (!clip) return {};
          const newEffects = (clip.effects || []).map(fx =>
            fx.id === effectId ? { ...fx, params: { ...fx.params, ...params } } : fx
          );
          return {
            project: {
              ...state.project,
              clips: { ...state.project.clips, [clipId]: { ...clip, effects: newEffects } }
            }
          };
        });
      },

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
        return true;
      },

      updateTemplateParams: (clipId, params) => {
        set((state) => {
          const clip = state.project.clips[clipId];
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
          () => set({ lastSaved: Date.now() })
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
        useAssetStore.getState().clearAll();
        useTrackStore.getState().setTracks(newProject.tracks);
        set({ project: newProject, copiedClip: null, lastSaved: Date.now() });
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
          useAssetStore.getState().clearAll();
          useTrackStore.getState().setTracks(newProject.tracks);
          set({ project: newProject, copiedClip: null, lastSaved: Date.now() });
        }
      },

      renameProject: async (projectId, newName) => {
        await projectService.renameProject(projectId, newName);
        const state = get();
        if (state.project.id === projectId) {
          set(state => ({ project: { ...state.project, name: newName } }));
        }
      },

      switchProject: async (projectId) => {
        const result = await projectService.switchProject(projectId);
        if (result) {
          useAssetStore.getState().setAssets(result.assets);
          useTrackStore.getState().setTracks(result.project.tracks || []);
          set({ project: result.project, copiedClip: null, lastSaved: Date.now() });
        }
      },

      exportProject: async () => {
        const state = get();
        if (!state.project) return;
        const assets = useAssetStore.getState().assets;
        await projectService.exportProject(state.project, assets);
      },
    }))
  );
};

export const useOptimizedProjectStore = createOptimizedProjectStore();

export function useProjectClips() {
  return useOptimizedProjectStore(state => state.project.clips);
}

export function useProjectTracks() {
  return useOptimizedProjectStore(state => state.project.tracks);
}

export function useProjectDuration() {
  return useOptimizedProjectStore(state => state.project.duration);
}

export function useProjectSettings() {
  return useOptimizedProjectStore(state => ({
    width: state.project.width,
    height: state.project.height,
    fps: state.project.fps,
    duration: state.project.duration,
  }));
}

export function useClipById(clipId: string | null) {
  return useOptimizedProjectStore(
    state => clipId ? state.project.clips[clipId] : null
  );
}

export function useVisibleClips(currentTime: number) {
  return useOptimizedProjectStore(state => {
    const clips = state.project.clips;
    const result: Clip[] = [];
    for (const id in clips) {
      const clip = clips[id];
      if (currentTime >= clip.startTime && currentTime < clip.startTime + clip.duration) {
        result.push(clip);
      }
    }
    return result.sort((a, b) => (a.style?.zIndex || 0) - (b.style?.zIndex || 0));
  });
}

export function useTrackClips(trackId: string) {
  return useOptimizedProjectStore(state => {
    const clips = state.project.clips;
    const result: Clip[] = [];
    for (const id in clips) {
      if (clips[id].trackId === trackId) {
        result.push(clips[id]);
      }
    }
    return result;
  });
}
