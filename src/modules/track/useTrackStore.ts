import { create } from 'zustand';
import type { Clip } from '../shared/types';
import type { Track, TrackType, TrackState } from './TrackTypes';
import TrackManager from './TrackManager';
import { sortTracksByType, isClipCompatibleWithTrack } from './TrackTypes';

export interface TrackStore extends TrackState {
  addTrack: (type: TrackType) => void;
  updateTrack: (trackId: string, changes: Partial<Track>) => void;
  removeTrack: (trackId: string) => void;
  toggleVisibility: (trackId: string) => void;
  toggleLock: (trackId: string) => void;
  getSortedTracks: () => Track[];
  validateClipMove: (clipType: Clip['type'], targetTrackType: TrackType) => boolean;
  setActiveTrack: (trackId: string | null) => void;
  setTracks: (tracks: Track[]) => void;
}

const manager = new TrackManager();

const useTrackStore = create<TrackStore>((set, get) => ({
  tracks: [],
  activeTrackId: null,

  addTrack: (type) => {
    const { tracks } = get();
    const newTrack = manager.createTrack(type, tracks);
    const newTracks = sortTracksByType([...tracks, newTrack]);
    set({ tracks: newTracks });
  },

  updateTrack: (trackId, changes) => {
    set(state => {
      const updated = manager.updateTrack(trackId, changes, state.tracks);
      if (!updated) return state;
      return {
        tracks: state.tracks.map(t => t.id === trackId ? updated : t),
      };
    });
  },

  removeTrack: (trackId) => {
    set(state => {
      const { removedClipIds } = manager.removeTrack(trackId, {});
      console.log(`[Track] Removed track ${trackId}, affected clips: ${removedClipIds.length}`);
      return {
        tracks: state.tracks.filter(t => t.id !== trackId),
        activeTrackId: state.activeTrackId === trackId ? null : state.activeTrackId,
      };
    });
  },

  toggleVisibility: (trackId) => {
    set(state => {
      const updated = manager.toggleVisibility(trackId, state.tracks);
      if (!updated) return state;
      return {
        tracks: state.tracks.map(t => t.id === trackId ? updated : t),
      };
    });
  },

  toggleLock: (trackId) => {
    set(state => {
      const updated = manager.toggleLock(trackId, state.tracks);
      if (!updated) return state;
      return {
        tracks: state.tracks.map(t => t.id === trackId ? updated : t),
      };
    });
  },

  getSortedTracks: () => {
    const { tracks } = get();
    return manager.getSortedTracks(tracks);
  },

  validateClipMove: (clipType, targetTrackType) => {
    return manager.validateClipMove(clipType, targetTrackType);
  },

  setActiveTrack: (trackId) => set({ activeTrackId: trackId }),

  setTracks: (tracks) => set({ tracks: sortTracksByType(tracks) }),
}));

export default useTrackStore;
export { useTrackStore, sortTracksByType, isClipCompatibleWithTrack };
