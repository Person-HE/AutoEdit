import { v4 as uuidv4 } from 'uuid';
import type { Clip } from '../shared/types';
import type { Track, TrackType, ClipType, ITrackManager } from './TrackTypes';
import { getDefaultTrackName, sortTracksByType, isClipCompatibleWithTrack } from './TrackTypes';

class TrackManager implements ITrackManager {
  createTrack(type: TrackType, existingTracks: Track[] = []): Track {
    const count = existingTracks.filter(t => t.type === type).length;
    const track: Track = {
      id: `track_${type}_${uuidv4().slice(0, 8)}`,
      type,
      name: getDefaultTrackName(type, count),
      visible: true,
      locked: false,
    };
    return track;
  }

  removeTrack(trackId: string, clipsRef: Record<string, Clip> = {}): { removedTrack: Track | null; removedClipIds: string[] } {
    const removedClipIds: string[] = [];
    Object.keys(clipsRef).forEach(key => {
      if (clipsRef[key].trackId === trackId) {
        removedClipIds.push(key);
      }
    });
    return { removedTrack: null, removedClipIds };
  }

  updateTrack(trackId: string, changes: Partial<Track>, currentTracks: Track[]): Track | null {
    const track = currentTracks.find(t => t.id === trackId);
    if (!track) return null;
    return { ...track, ...changes };
  }

  toggleVisibility(trackId: string, currentTracks: Track[]): Track | null {
    const track = currentTracks.find(t => t.id === trackId);
    if (!track) return null;
    return { ...track, visible: !track.visible };
  }

  toggleLock(trackId: string, currentTracks: Track[]): Track | null {
    const track = currentTracks.find(t => t.id === trackId);
    if (!track) return null;
    return { ...track, locked: !track.locked };
  }

  getSortedTracks(tracks: Track[]): Track[] {
    return sortTracksByType(tracks);
  }

  validateClipMove(clipType: ClipType, targetTrackType: TrackType): boolean {
    return isClipCompatibleWithTrack(clipType, targetTrackType);
  }
}

export default TrackManager;
export { TrackManager };
