import { create } from 'zustand';
import { UIState } from '../types/core';

export interface UIStore extends UIState {
  // Actions
  selectClip: (clipId: string | null) => void;
  setZoomLevel: (level: number) => void;
  setIsExportModalOpen: (isOpen: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  selectedClipId: null,
  currentTime: 0,
  isPlaying: false,
  zoomLevel: 50,
  isExporting: false,
  isExportModalOpen: false,
  copiedClip: null,

  selectClip: (clipId) => set({ selectedClipId: clipId }),
  setZoomLevel: (level) => set({ zoomLevel: level }),
  setIsExportModalOpen: (isOpen) => set({ isExportModalOpen: isOpen }),
}));
