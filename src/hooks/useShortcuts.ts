import { useEffect } from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { useUIStore } from '../store/useUIStore';
import { usePlayerStore } from '../store/usePlayerStore';

function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName?.toLowerCase();
  return tag === 'input' || tag === 'textarea' || el.isContentEditable;
}

/**
 * 全局剪辑快捷键（PR/剪映习惯）：
 * Space 播放/暂停 · ←→ 逐帧 · Shift+←→ 逐秒 · Home/End
 * Del/Backspace 删除 · Shift+Del 波纹删除
 * Ctrl+Z / Ctrl+Shift+Z(或 Ctrl+Y) 撤销恢复 · Ctrl+C/V 复制粘贴 · Ctrl+D 副本
 * S 在播放头分割 · +/- 缩放
 */
export function useShortcuts() {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;

      const ui = useUIStore.getState();
      const player = usePlayerStore.getState();
      const project = useProjectStore.getState();
      const fps = project.project.fps || 30;

      const mod = e.ctrlKey || e.metaKey;

      if (e.code === 'Space') {
        e.preventDefault();
        const max = project.project.duration;
        if (!player.isPlaying && player.currentTime >= max) player.setCurrentTime(0);
        player.setIsPlaying(!player.isPlaying);
        return;
      }

      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) project.redo(); else project.undo();
        return;
      }
      if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        project.redo();
        return;
      }
      if (mod && e.key.toLowerCase() === 'c') {
        if (ui.selectedClipId) project.copyClip(ui.selectedClipId);
        return;
      }
      if (mod && e.key.toLowerCase() === 'v') {
        project.pasteClip(selectedTrackId(ui.selectedClipId) ?? firstVideoTrack(), player.currentTime);
        return;
      }
      if (mod && e.key.toLowerCase() === 'd') {
        if (ui.selectedClipId) {
          e.preventDefault();
          project.duplicateClip(ui.selectedClipId);
        }
        return;
      }

      switch (e.key) {
        case 'ArrowLeft': {
          e.preventDefault();
          const step = e.shiftKey ? 1 : 1 / fps;
          player.setCurrentTime(Math.max(0, player.currentTime - step));
          break;
        }
        case 'ArrowRight': {
          e.preventDefault();
          const step = e.shiftKey ? 1 : 1 / fps;
          player.setCurrentTime(player.currentTime + step);
          break;
        }
        case 'Home':
          player.setCurrentTime(0);
          break;
        case 'End':
          player.setCurrentTime(project.project.duration);
          break;
        case 'Delete':
        case 'Backspace': {
          if (!ui.selectedClipId) break;
          e.preventDefault();
          if (e.shiftKey) project.rippleDeleteClip(ui.selectedClipId);
          else project.removeClip(ui.selectedClipId);
          ui.selectClip(null);
          break;
        }
        case '+':
        case '=':
          ui.setZoomLevel(Math.min(200, ui.zoomLevel * 1.2));
          break;
        case '-':
          ui.setZoomLevel(Math.max(5, ui.zoomLevel / 1.2));
          break;
        default:
          break;
      }

      if (!mod && (e.key === 's' || e.key === 'S')) {
        const n = project.splitAtTime(player.currentTime, !!ui.selectedClipId);
        if (n > 0) {
          ui.selectClip(null);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}

/** 粘贴目标轨道：优先选中片段所在轨道（类型兼容时），否则首个视频轨 */
function selectedTrackId(selectedClipId: string | null): string | undefined {
  if (!selectedClipId) return undefined;
  const clip = useProjectStore.getState().project.clips[selectedClipId];
  return clip?.trackId;
}

function firstVideoTrack(): string | undefined {
  return useProjectStore.getState().project.tracks.find(t => t.type === 'video')?.id;
}
