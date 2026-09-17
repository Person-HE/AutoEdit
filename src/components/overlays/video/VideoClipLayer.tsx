
import React, { memo, useEffect, useRef, type ReactNode } from 'react';
import { usePlayerStore } from '../../../store/usePlayerStore';
import { sourceElapsed, instantSpeed, normalizePoints } from '../../../engine/timing/speedCurve';
import { smartMattingEngine } from '../../../engine/mask/smartMatting';
import type { Asset, Clip } from '../../../types/core';

interface RegisteredVideo {
  clip: Clip;
  asset: Asset;
  el: HTMLVideoElement;
}

/** 项目时间 → 片段应显示的源时间（恒速或曲线积分） */
function targetSourceTime(clip: Clip, t: number): number {
  const rel = t - clip.startTime;
  if (normalizePoints(clip.speedCurve)) {
    return sourceElapsed(clip, rel);
  }
  const speed = Math.max(0.25, Math.min(4, clip.speed ?? 1));
  return (clip.offset ?? 0) + rel * speed;
}

/** 当前项目时间处的瞬时播放倍率 */
function instantaneousRate(clip: Clip, t: number): number {
  const pts = normalizePoints(clip.speedCurve);
  const base = Math.max(0.25, Math.min(4, clip.speed ?? 1));
  if (!pts) return base;
  const dur = Math.max(0.001, clip.duration);
  return Math.max(0.05, Math.min(16, instantSpeed(pts, (t - clip.startTime) / dur, base)));
}

/**
 * 视频真实解码控制器：
 * - 每个可见视频片段挂载一个 <video>（muted，声音由 AudioEngine 统一负责）
 * - 全局单实例订阅播放头：播放时漂移 >80ms 校正；擦洗/逐帧直接 seek
 * - 变速支持恒速 clip.speed 与曲线（sourceElapsed 积分映射 + 实时 playbackRate）
 */
class VideoPlaybackController {
  private registry = new Map<string, RegisteredVideo>();
  private started = false;

  private ensureSubscribed(): void {
    if (this.started) return;
    this.started = true;

    usePlayerStore.subscribe((s) => {
      if (this.registry.size === 0) return;
      const t = s.currentTime;
      const playing = s.isPlaying;

      this.registry.forEach(({ clip }) => {
        const entry = this.registry.get(clip.id);
        if (!entry) return;
        const el = entry.el;

        const target = targetSourceTime(clip, t);
        // 目标已越过素材末尾：暂停等待（同步循环会在回到范围内时恢复）
        if (entry.asset.duration !== undefined && (target < 0 || target >= entry.asset.duration + 0.25)) {
          if (!el.paused) el.pause();
          return;
        }

        if (playing) {
          try { el.playbackRate = instantaneousRate(clip, t); } catch {}
          if (Math.abs(el.currentTime - target) > 0.08 || el.paused) {
            try { el.currentTime = target; } catch {}
            el.play().catch(() => {});
          }
        } else {
          if (!el.paused) el.pause();
          const frameTolerance = instantaneousRate(clip, t) / 60 * 1.01;
          if (Math.abs(el.currentTime - target) > frameTolerance) {
            try { el.currentTime = target; } catch {}
          }
        }
      });
    });
  }

  register(clipId: string, clip: Clip, asset: Asset): HTMLVideoElement {
    this.ensureSubscribed();

    if (this.registry.has(clipId)) {
      const existing = this.registry.get(clipId)!;
      existing.clip = clip;
      if (existing.asset.url !== asset.url) {
        existing.asset = asset;
        existing.el.src = asset.url;
      }
      return existing.el;
    }

    const el = document.createElement('video');
    el.muted = true;
    el.playsInline = true;
    el.preload = 'auto';
    el.style.width = '100%';
    el.style.height = '100%';
    el.style.objectFit = 'contain';
    el.poster = asset.thumbnail ?? '';
    el.src = asset.url;

    this.registry.set(clipId, { clip, asset, el });
    return el;
  }

  unregister(clipId: string): void {
    const entry = this.registry.get(clipId);
    if (!entry) return;
    try { entry.el.pause(); } catch {}
    this.registry.delete(clipId);
  }

  updateClip(clipId: string, clip: Clip): void {
    const entry = this.registry.get(clipId);
    if (entry) entry.clip = clip;
  }

  clearAll(): void {
    this.registry.forEach(({ el }) => { try { el.pause(); } catch {} });
    this.registry.clear();
  }
}

export const videoPlaybackController = new VideoPlaybackController();

// ==================== 片段层组件 ====================

export const VideoClipLayer = memo(({ clip, asset, containerStyle, children }: {
  clip: Clip;
  asset: Asset;
  containerStyle: React.CSSProperties;
  /** 叠放在画面上方的附加层（调色混合层等），位于 video 元素之后以保证可见 */
  children?: ReactNode;
}) => {

  const hostRef = useRef<HTMLDivElement>(null);
  const mattingRef = useRef<HTMLDivElement>(null);
  const videoElRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    const mattingHost = mattingRef.current;
    if (!host || !mattingHost) return;

    const el = videoPlaybackController.register(clip.id, clip, asset);
    videoElRef.current = el;
    // video 始终插入内层包裹元素最前：抠像蒙版作用于 video 本身；
    // JSX 子层（调色混合层等）保持在 video 之后以保证可见
    mattingHost.insertBefore(el, mattingHost.firstChild);

    const t = usePlayerStore.getState().currentTime;
    try { el.currentTime = Math.max(0, targetSourceTime(clip, t)); } catch {}
    if (usePlayerStore.getState().isPlaying) {
      try { el.playbackRate = instantaneousRate(clip, t); } catch {}
    }

    // 智能抠像：人像蒙版应用到内层包裹元素（mattingRef），形状蒙版仍由外层容器承载
    if (clip.chromaKey?.enabled) {
      smartMattingEngine.bind(clip.id, el, mattingHost, clip.chromaKey);
    }

    return () => {
      smartMattingEngine.unbind(clip.id);
      videoPlaybackController.unregister(clip.id);
      el.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clip.id, asset.url]);

  useEffect(() => {
    videoPlaybackController.updateClip(clip.id, clip);
    if (clip.chromaKey?.enabled) {
      smartMattingEngine.updateConfig(clip.id, clip.chromaKey);
      const mattingHost = mattingRef.current;
      const el = videoElRef.current;
      if (mattingHost && el) smartMattingEngine.bind(clip.id, el, mattingHost, clip.chromaKey);
    } else {
      smartMattingEngine.unbind(clip.id);
    }
  }, [clip]);


  // video 始终位于内层包裹元素中：未启用抠像时该层无蒙版、视觉无差异；
  // 启用后由 smartMattingEngine 写入人像 mask-image，与外层形状蒙版相乘
  return (
    <div ref={hostRef} style={containerStyle}>
      <div
        ref={mattingRef}
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {children}
      </div>
    </div>
  );
});
