import { create } from 'zustand';

export interface PlayerState {
  currentTime: number;
  isPlaying: boolean;

  // Actions
  setCurrentTime: (time: number | ((prev: number) => number)) => void;
  setIsPlaying: (playing: boolean) => void;
  togglePlay: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTime: 0,
  isPlaying: false,

  setCurrentTime: (time) => {
    if (typeof time === 'function') {
      const prev = get().currentTime;
      const next = time(prev);
      if (typeof next !== 'number' || isNaN(next) || !isFinite(next)) {
        console.warn('[PlayerStore] Invalid time value from updater:', next);
        return;
      }
      set({ currentTime: Math.max(0, next) });
      return;
    }
    if (typeof time !== 'number' || isNaN(time) || !isFinite(time)) {
      console.warn('[PlayerStore] Invalid time value:', time);
      return;
    }
    set({ currentTime: Math.max(0, time) });
  },
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  togglePlay: () => set({ isPlaying: !get().isPlaying }),
}));
