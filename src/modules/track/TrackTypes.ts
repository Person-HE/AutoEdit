import type { Clip } from '../shared/types';

export type TrackType = 'video' | 'audio' | 'text' | 'effect';

export const TRACK_ORDER: Record<TrackType, number> = {
  text: 0,
  video: 1,
  audio: 2,
  effect: 3,
};

export interface Track {
  id: string;
  type: TrackType;
  name: string;
  visible: boolean;
  locked: boolean;
}

export type ClipType = Clip['type'];

export interface TrackOperation {
  type: 'add' | 'remove' | 'update' | 'reorder' | 'toggleVisibility' | 'toggleLock';
  payload: {
    trackId?: string;
    track?: Partial<Track>;
    index?: number;
  };
}

export interface TrackState {
  tracks: Track[];
  activeTrackId: string | null;
}

export interface ITrackManager {
  createTrack(type: TrackType, existingTracks?: Track[]): Track;
  removeTrack(trackId: string, clipsRef?: Record<string, Clip>): { removedTrack: Track | null; removedClipIds: string[] };
  updateTrack(trackId: string, changes: Partial<Track>, currentTracks?: Track[]): Track | null;
  toggleVisibility(trackId: string, currentTracks?: Track[]): Track | null;
  toggleLock(trackId: string, currentTracks?: Track[]): Track | null;
  getSortedTracks(tracks: Track[]): Track[];
  validateClipMove(clipType: ClipType, targetTrackType: TrackType): boolean;
}

const TYPE_LABELS: Record<TrackType, string> = {
  video: '视频',
  audio: '音频',
  text: '文本',
  effect: '特效',
};

export function getDefaultTrackName(type: TrackType, count: number): string {
  return `${TYPE_LABELS[type]}轨道 ${count + 1}`;
}

export function sortTracksByType(tracks: Track[]): Track[] {
  return [...tracks].sort((a, b) => {
    const orderA = TRACK_ORDER[a.type] ?? 99;
    const orderB = TRACK_ORDER[b.type] ?? 99;
    return orderA - orderB;
  });
}

const COMPATIBILITY_MAP: Record<TrackType, ClipType[]> = {
  video: ['video', 'image', 'template'],
  audio: ['audio'],
  text: ['text'],
  effect: ['video', 'image', 'audio', 'text', 'template'],
};

export function isClipCompatibleWithTrack(clipType: ClipType, trackType: TrackType): boolean {
  const allowed = COMPATIBILITY_MAP[trackType];
  if (!allowed) return false;
  return allowed.includes(clipType);
}
