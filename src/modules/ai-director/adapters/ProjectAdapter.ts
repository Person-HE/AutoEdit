import { useProjectStore } from '../../../store/useProjectStore';
import { useAssetStore } from '../../asset/useAssetStore';
import { useTrackStore } from '../../track/useTrackStore';
import { ClipFactory, type ClipFactoryConfig } from '../../clip/ClipTypes';
import type { Asset, Clip, Track } from '../../shared/types';
import { getAllTemplates } from '../../../engine/templates';
import { PRESETS } from '../../../engine/presets';

export interface AddClipInput {
  type: 'video' | 'image' | 'text' | 'template';
  assetId?: string;
  trackId: string;
  startTime: number;
  duration?: number;
  textData?: Partial<Clip['textData']>;
  transform?: Partial<Clip['transform']>;
  templateId?: string;
  templateParams?: Record<string, any>;
  name?: string;
}

class ProjectAdapter {
  addClipToProject(input: AddClipInput): Clip | null {
    let config: ClipFactoryConfig;

    switch (input.type) {
      case 'text':
        config = {
          type: 'text',
          trackId: input.trackId,
          startTime: input.startTime,
          duration: input.duration,
          textData: input.textData,
          transform: input.transform,
          name: input.name
        };
        break;

      case 'template': {
        if (!input.templateId) return null;
        config = {
          type: 'template',
          templateId: input.templateId,
          trackId: input.trackId,
          startTime: input.startTime,
          duration: input.duration,
          templateParams: input.templateParams,
          name: input.name
        };
        break;
      }

      case 'image':
      case 'video': {
        if (!input.assetId) return null;
        config = {
          type: input.type,
          assetId: input.assetId,
          trackId: input.trackId,
          startTime: input.startTime,
          duration: input.duration,
          transform: input.transform,
          name: input.name
        };
        break;
      }

      default:
        return null;
    }

    const clip = ClipFactory.createClip(config);

    const state = useProjectStore.getState();
    const existingClips = state.project.clips || {};
    useProjectStore.setState({
      project: {
        ...state.project,
        clips: { ...existingClips, [clip.id]: clip }
      }
    });

    return clip;
  }

  addAssetsToProject(assets: Asset[]): void {
    useProjectStore.getState().addAssets(assets);
  }

  applyEffectToClip(clipId: string, presetId: string, params?: Record<string, any>): boolean {
    const result = useProjectStore.getState().addEffectToClip(clipId, presetId);
    if (result && params && Object.keys(params).length > 0) {
      const clip = (useProjectStore.getState().project.clips || {})[clipId];
      const effect = clip?.effects?.find(e => e.presetId === presetId);
      if (effect) {
        useProjectStore.getState().updateEffectParams(clipId, effect.id, params);
      }
    }
    return result;
  }

  updateClip(clipId: string, changes: Partial<Clip>): void {
    useProjectStore.getState().updateClip(clipId, changes);
  }

  addTemplateClip(templateId: string, trackId: string, time: number): boolean {
    return useProjectStore.getState().addTemplateClip(templateId, trackId, time);
  }

  removeClip(clipId: string): void {
    useProjectStore.getState().removeClip(clipId);
  }

  moveClip(clipId: string, trackId: string, startTime: number): boolean {
    return useProjectStore.getState().moveClip(clipId, trackId, startTime);
  }

  duplicateClip(clipId: string, trackId?: string, offsetTime?: number): Clip | null {
    const state = useProjectStore.getState();
    const sourceClip = (state.project.clips || {})[clipId];
    if (!sourceClip) return null;

    const targetTrackId = trackId || sourceClip.trackId;
    const startTime = sourceClip.startTime + (offsetTime ?? 0);

    const newClip = this.addClipToProject({
      type: sourceClip.type as any,
      trackId: targetTrackId,
      startTime,
      duration: sourceClip.duration,
      assetId: sourceClip.assetId,
      textData: sourceClip.textData,
      transform: { ...sourceClip.transform },
      name: `${sourceClip.name}_副本`,
    });

    return newClip;
  }

  createTrack(type: Track['type'], name?: string): Track | null {
    const trackStore = useTrackStore.getState();
    trackStore.addTrack(type);
    const tracks = trackStore.getSortedTracks();
    return tracks[tracks.length - 1] || null;
  }

  removeTrack(trackId: string): void {
    useProjectStore.getState().removeTrack(trackId);
  }

  updateTrack(trackId: string, changes: Partial<Track>): void {
    useProjectStore.getState().updateTrack(trackId, changes);
  }

  reorderTrack(trackId: string, newIndex: number): void {
    const trackStore = useTrackStore.getState();
    const tracks = trackStore.getSortedTracks();
    const trackIndex = tracks.findIndex(t => t.id === trackId);
    if (trackIndex === -1) return;
    
    const newTracks = [...tracks];
    const [removed] = newTracks.splice(trackIndex, 1);
    newTracks.splice(newIndex, 0, removed);
    trackStore.setTracks(newTracks);
  }

  removeEffectFromClip(clipId: string, effectId: string): void {
    useProjectStore.getState().removeEffectFromClip(clipId, effectId);
  }

  updateEffectParams(clipId: string, effectId: string, params: Record<string, any>): void {
    useProjectStore.getState().updateEffectParams(clipId, effectId, params);
  }

  updateProjectSettings(settings: Partial<{
    name: string;
    width: number;
    height: number;
    duration: number;
    fps: number;
  }>): void {
    const state = useProjectStore.getState();
    useProjectStore.setState({
      project: { ...state.project, ...settings, lastModified: Date.now() },
    });
  }

  getAvailableAssets(): Asset[] {
    return useAssetStore.getState().assets;
  }

  getAvailableTemplates(): { id: string; name: string; category: string }[] {
    return getAllTemplates().map(t => ({ id: t.id, name: t.name, category: t.category }));
  }

  getAvailablePresets(): { id: string; name: string; category: string }[] {
    return Object.values(PRESETS).map(p => ({ id: p.id, name: p.name, category: p.category }));
  }

  getProjectState(): {
    currentTime: number;
    tracks: Track[];
    clips: Record<string, Clip>;
    assets: Asset[];
    project: ReturnType<typeof useProjectStore.getState>['project'];
  } {
    const state = useProjectStore.getState();
    const assets = useAssetStore.getState().assets;

    return {
      currentTime: 0,
      tracks: state.project.tracks,
      clips: state.project.clips || {},
      assets,
      project: state.project
    };
  }

  getClipById(clipId: string): Clip | undefined {
    return (useProjectStore.getState().project.clips || {})[clipId];
  }

  getTrackById(trackId: string): Track | undefined {
    return useProjectStore.getState().project.tracks.find(t => t.id === trackId);
  }

  getClipsOnTrack(trackId: string): Clip[] {
    return Object.values(useProjectStore.getState().project.clips || {})
      .filter(c => c.trackId === trackId);
  }

  getTotalDuration(): number {
    const clips = Object.values(useProjectStore.getState().project.clips || {});
    if (clips.length === 0) return 0;
    return Math.max(...clips.map(c => c.startTime + c.duration));
  }
}

export const projectAdapter = new ProjectAdapter();
