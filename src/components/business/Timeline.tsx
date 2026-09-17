import React, { useRef, useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { useUIStore } from '../../store/useUIStore';
import { usePlayerStore } from '../../store/usePlayerStore';
import { useAssetStore } from '../../modules/asset/useAssetStore';
import {
  getSortedTrackClips,
  buildSnapPoints,
  applySnap,
  snapScalar,
  getTrimLimits,
  clampTrimStart,
  clampTrimEnd,
  resolvePlacement,
} from '../../modules/timeline/placement';
import clsx from 'clsx';
import type { Clip, Track, Asset } from '../../types/core';
import { PRESETS, getPresetsByCategory } from '../../engine/presets';

const HEADER_W = 200;
const EDGE_GRAB_PX = 10;

function formatTimecode(t: number): string {
  const v = typeof t === 'number' && !isNaN(t) ? t : 0;
  const m = Math.floor(v / 60);
  const s = Math.floor(v % 60);
  const cs = Math.floor((v % 1) * 100);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`;
}

type GestureMode = 'move' | 'trim-start' | 'trim-end';

interface DragMeta {
  mode: GestureMode;
  clipId: string;
  /** 按下时的片段快照（片段在手势中持续被 updateClip 更新，起始值从快照推导） */
  origStart: number;
  origEnd: number;
  grabOffset: number;
  snapPoints: number[];
  rowRects: Array<{ trackId: string; top: number; bottom: number; type: Track['type'] }>;
}

function isTypeCompatible(trackType: Track['type'], contentType: string): boolean {
  if (trackType === 'text') return contentType === 'text';
  if (trackType === 'audio') return contentType === 'audio' || contentType === 'sound_effect';
  return contentType !== 'audio' && contentType !== 'text' && contentType !== 'sound_effect';
}

// ==================== 音频波形 ====================
const WaveformCanvas = memo(({ peaks, width }: { peaks?: number[]; width: number }) => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv || !peaks?.length) return;
    const w = Math.max(4, Math.round(width));
    const h = 22;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (cv.width !== Math.round(w * dpr)) cv.width = Math.round(w * dpr);
    if (cv.height !== Math.round(h * dpr)) cv.height = Math.round(h * dpr);
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(110, 231, 183, 0.55)';
    const n = peaks.length;
    const barW = Math.max(1, w / n - 0.5);
    for (let i = 0; i < n; i++) {
      const x = (i / n) * w;
      const ph = Math.max(1, peaks[i] * h);
      ctx.fillRect(x, (h - ph) / 2, barW, ph);
    }
  }, [peaks, width]);

  if (!peaks?.length) return null;
  return <canvas ref={ref} style={{ width, height: 22 }} className="pointer-events-none" />;
});


/** 曲线变速缩略折线（片段块右上角） */
function curveSparkline(points: Array<{ t: number; value: number }>): string {
  const W = 30, H = 12;
  const sorted = [...points].sort((a, b) => a.t - b.t);
  return sorted.map(p => {
    const x = (p.t * W).toFixed(1);
    const frac = Math.min(1, Math.max(0, (Math.log(Math.max(0.1, p.value)) - Math.log(0.1)) / (Math.log(5) - Math.log(0.1))));
    const y = (H - frac * H).toFixed(1);
    return `${x},${y}`;
  }).join(' ');
}

// ==================== 单个片段块 ====================
const ClipItem = memo(({ clip, zoomLevel, isSelected, hasVoiceOver, peaks,
  onPointerDown, onContextMenu }: {
  clip: Clip;
  zoomLevel: number;
  isSelected: boolean;
  hasVoiceOver: boolean;
  peaks?: number[];
  onPointerDown: (e: React.PointerEvent, clip: Clip, mode: GestureMode) => void;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
}) => {
  const left = clip.startTime * zoomLevel;
  const width = Math.max(3, clip.duration * zoomLevel);
  const speed = clip.speed ?? 1;
  const volume = clip.volume ?? 1;

  const startGesture = (e: React.PointerEvent, mode: GestureMode) => {
    e.stopPropagation();
    onPointerDown(e, clip, mode);
  };

  return (
    <div
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const rel = e.clientX - rect.left;
        startGesture(e, rel <= EDGE_GRAB_PX ? 'trim-start' : rel >= rect.width - EDGE_GRAB_PX ? 'trim-end' : 'move');
      }}
      onContextMenu={(e) => onContextMenu(e, clip.id)}
      className={clsx(
        "absolute top-1.5 bottom-1.5 rounded-lg overflow-hidden border select-none group/clip shadow-sm",
        isSelected ? "border-brand-400 z-10 ring-1 ring-brand-500/60" : "border-white/10 hover:border-white/30",
        clip.type === 'audio' ? "bg-gradient-to-r from-emerald-900/90 to-emerald-800/90" :
        clip.type === 'text' ? "bg-gradient-to-r from-yellow-900/90 to-orange-900/90" :
        clip.type === 'template' ? "bg-gradient-to-r from-purple-900/90 to-pink-900/90" :
        "bg-gradient-to-r from-blue-900/90 to-indigo-900/90"
      )}
      style={{ left, width, cursor: 'grab', touchAction: 'none' }}
    >
      {clip.type === 'audio' && (
        <div className="absolute inset-x-0 bottom-0 h-[22px] pointer-events-none px-0.5">
          <WaveformCanvas peaks={peaks} width={Math.max(4, clip.duration * zoomLevel - 2)} />
        </div>
      )}
      {(clip.type === 'audio') && ((clip.audioFadeIn ?? 0) > 0 || (clip.audioFadeOut ?? 0) > 0) && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {(clip.audioFadeIn ?? 0) > 0 && (
            <div className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-white/25 to-transparent"
              style={{ width: (clip.audioFadeIn! / Math.max(0.01, clip.duration)) * 100 + '%' }} />
          )}
          {(clip.audioFadeOut ?? 0) > 0 && (
            <div className="absolute right-0 top-0 bottom-0 bg-gradient-to-l from-white/25 to-transparent"
              style={{ width: (clip.audioFadeOut! / Math.max(0.01, clip.duration)) * 100 + '%' }} />
          )}
        </div>
      )}
      {clip.speedCurve && clip.speedCurve.length >= 2 && (
        <svg className="absolute top-1 right-1 pointer-events-none opacity-80" width="30" height="12" viewBox="0 0 30 12">
          <title>曲线变速</title>
          <polyline fill="none" stroke="#FB7185" strokeWidth="1.5" strokeLinejoin="round" points={curveSparkline(clip.speedCurve)} />
        </svg>
      )}
      <div className="relative px-2 py-1 text-[10px] text-white/90 truncate font-medium flex items-center gap-1.5 pointer-events-none">
        <span>{clip.type === 'image' ? (
          <svg className="inline w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg>
        ) : clip.type === 'video' ? (
          <svg className="inline w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
        ) : clip.type === 'template' ? (
          <svg className="inline w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
        ) : (
          <svg className="inline w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
        )} {clip.name}</span>
        {(speed !== 1 || volume !== 1 || (clip.audioFadeIn ?? 0) > 0 || (clip.audioFadeOut ?? 0) > 0) && (
          <span className="text-[9px] text-white/50 shrink-0">
            {[
              speed !== 1 ? `${speed}×` : '',
              volume !== 1 ? `${Math.round(volume * 100)}%` : '',
              (clip.audioFadeIn ?? 0) > 0 ? `fadeIn${Math.round(clip.audioFadeIn! * 1000)}ms` : '',
              (clip.audioFadeOut ?? 0) > 0 ? `fadeOut${Math.round(clip.audioFadeOut! * 1000)}ms` : '',
            ].filter(Boolean).join(' · ')}
          </span>
        )}
        {hasVoiceOver && (
          <svg className="inline w-3 h-3 mr-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
        )}
      </div>
      {clip.effects && clip.effects.length > 0 && (
        <div className="absolute bottom-1 right-1 flex gap-0.5 pointer-events-none">
          {clip.effects.map(e => (
            <div key={e.id} className={clsx("w-1.5 h-1.5 rounded-full", e.type === 'transition' ? 'bg-pink-400' : 'bg-yellow-400')} title={e.name} />
          ))}
        </div>
      )}
      {isSelected && (
        <>
          <div
            onPointerDown={(e) => startGesture(e, 'trim-start')}
            className="absolute left-0 top-0 bottom-0 w-2.5 z-20 flex items-center justify-center"
            style={{ cursor: 'ew-resize', touchAction: 'none' }}
          >
            <div className="w-0.5 h-4 bg-white/40 group-hover/clip:bg-brand-400 rounded-full transition-colors pointer-events-none" />
          </div>
          <div
            onPointerDown={(e) => startGesture(e, 'trim-end')}
            className="absolute right-0 top-0 bottom-0 w-2.5 z-20 flex items-center justify-center"
            style={{ cursor: 'ew-resize', touchAction: 'none' }}
          >
            <div className="w-0.5 h-4 bg-white/40 group-hover/clip:bg-brand-400 rounded-full transition-colors pointer-events-none" />
          </div>
        </>
      )}
    </div>
  );
});

interface CutMarker {
  time: number;
  incomingId: string;
  effectId?: string;
}

const TRANSITION_PRESETS = getPresetsByCategory('transition');

/** 相邻切点上的转场标记（剪映式小方块，点击选择/编辑转场） */
const CutBadges = memo(({ cuts, zoomLevel, onOpen }: {
  cuts: CutMarker[];
  zoomLevel: number;
  onOpen: (e: React.MouseEvent, c: CutMarker) => void;
}) => (
  <>
    {cuts.map(c => {
      const w = 12;
      return (
        <div
          key={`${c.time}-${c.incomingId}`}
          title={c.effectId ? `${PRESETS[c.effectId]?.name ?? '转场'}（点击修改）` : '添加转场'}
          onClick={(e) => { e.stopPropagation(); onOpen(e, c); }}
          className={clsx(
            "absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-sm z-20 cursor-pointer transition-all",
            "flex items-center justify-center text-[8px] leading-none pointer-events-auto",
            c.effectId ? "bg-pink-500/80 text-white shadow-glow" : "bg-black/40 border border-white/25 text-white/60 opacity-0 group-hover/cut:opacity-100 hover:!opacity-100"
          )}
          style={{ left: c.time * zoomLevel, width: w, height: ROW_HEIGHT * 0.4 }}
        >
          ⧉
        </div>
      );
    })}
  </>
));

// ==================== 轨道行 ====================
const TrackRow = memo(({ track, clips, selectedClipId, contentWidth, zoomLevel,
  visibleRange, linkedTextIds, cuts, assetById,
  onClipPointerDown, onContextMenu, onDropExternal, onBackgroundPointerDown, onOpenTransitionMenu }: {
  track: Track;
  clips: Clip[];
  selectedClipId: string | null;
  contentWidth: number;
  zoomLevel: number;
  visibleRange: [number, number];
  linkedTextIds: Set<string>;
  cuts: CutMarker[];
  assetById: Map<string, Asset>;
  onClipPointerDown: (e: React.PointerEvent, clip: Clip, mode: GestureMode) => void;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
  onDropExternal: (e: React.DragEvent, trackId: string) => void;
  onBackgroundPointerDown: (e: React.PointerEvent) => void;
  onOpenTransitionMenu: (e: React.MouseEvent, c: CutMarker) => void;
}) => {
  // 视口窗口化：只渲染可见时间段 ±缓冲 的片段
  const windowed = useMemo(
    () => clips.filter(c => c.startTime + c.duration > visibleRange[0] && c.startTime < visibleRange[1]),
    [clips, visibleRange]
  );

  return (
    <div className="flex relative border-b border-white/5" style={{ height: ROW_HEIGHT }}>
      <div className="sticky left-0 z-30 shrink-0 bg-[#1E1E24] border-r border-white/10 p-2 flex flex-col justify-center gap-2 group shadow-[4px_0_10px_-2px_rgba(0,0,0,0.3)]" style={{ width: HEADER_W }}>
        <div className="flex items-center gap-2">
          <div className={clsx("w-5 h-5 rounded flex items-center justify-center text-xs",
            track.type === 'video' ? "bg-blue-500/20 text-blue-400" : track.type === 'text' ? "bg-yellow-500/20 text-yellow-400" : "bg-green-500/20 text-green-400")}>
            {track.type === 'video' ? (
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
            ) : track.type === 'text' ? (
              <span className="text-xs font-bold">T</span>
            ) : (
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
            )}
          </div>
          <span className="text-xs text-gray-300 font-medium truncate cursor-text hover:text-white" title={track.name}>{track.name}</span>
        </div>
        <div className="flex gap-2 pl-7 opacity-0 group-hover:opacity-100 transition-opacity">
          <TrackHeaderActions trackId={track.id} />
        </div>
      </div>
      <div
        className="relative h-full bg-[#151519]"
        style={{ width: contentWidth }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => onDropExternal(e, track.id)}
        onPointerDown={onBackgroundPointerDown}
      >
        {windowed.map(clip => (
          <ClipItem
            key={clip.id}
            clip={clip}
            zoomLevel={zoomLevel}
            isSelected={selectedClipId === clip.id}
            hasVoiceOver={linkedTextIds.has(clip.id)}
            peaks={clip.type === 'audio' ? assetById.get(clip.assetId)?.peaks : undefined}
            onPointerDown={onClipPointerDown}
            onContextMenu={onContextMenu}
          />
        ))}
        {track.type !== 'audio' && cuts.length > 0 && (
          <CutBadges cuts={cuts} zoomLevel={zoomLevel} onOpen={onOpenTransitionMenu} />
        )}
      </div>
    </div>
  );
});

const ROW_HEIGHT = 96;

/** 轨道行的可见性/删除操作 */
const TrackHeaderActions = memo(({ trackId }: { trackId: string }) => {
  const updateTrack = useProjectStore(s => s.updateTrack);
  const removeTrack = useProjectStore(s => s.removeTrack);
  const visible = useProjectStore(s => s.project.tracks.find(t => t.id === trackId)?.visible ?? true);
  return (
    <>
      <button onClick={() => updateTrack(trackId, { visible: !visible })} className="text-gray-500 hover:text-white" title={visible ? '隐藏轨道' : '显示轨道'}>
        {visible ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
        )}
      </button>
      <button onClick={() => removeTrack(trackId)} className="text-gray-500 hover:text-red-400" title="删除轨道">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      </button>
    </>
  );
});

// ==================== 播放头（订阅式，独立小组件重渲染） ====================
const PlayheadLayer = memo(({ zoomLevel }: { zoomLevel: number }) => {
  const lineRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let last = -1;
    const apply = (t: number) => {
      if (t === last) return;
      last = t;
      if (lineRef.current) lineRef.current.style.left = `${HEADER_W + Math.max(0, t) * zoomLevel}px`;
    };
    apply(usePlayerStore.getState().currentTime);
    return usePlayerStore.subscribe((s) => apply(s.currentTime));
  }, [zoomLevel]);
  return (
    <div ref={lineRef} className="absolute top-0 bottom-0 w-px bg-brand-500 pointer-events-none z-30 shadow-[0_0_15px_rgba(41,151,255,0.4)]" style={{ left: HEADER_W }} />
  );
});

const TimeCodeDisplay = memo(() => {
  const currentTime = usePlayerStore(s => s.currentTime);
  return <>{formatTimecode(currentTime)}</>;
});

// ==================== 主组件 ====================
export const Timeline: React.FC = () => {
  const project = useProjectStore(s => s.project);
  const addClip = useProjectStore(s => s.addClip);
  const removeClip = useProjectStore(s => s.removeClip);
  const rippleDeleteClip = useProjectStore(s => s.rippleDeleteClip);
  const moveClip = useProjectStore(s => s.moveClip);
  const updateClip = useProjectStore(s => s.updateClip);
  const splitAtTime = useProjectStore(s => s.splitAtTime);
  const duplicateClip = useProjectStore(s => s.duplicateClip);
  const copyClip = useProjectStore(s => s.copyClip);
  const pasteClip = useProjectStore(s => s.pasteClip);
  const clearClipEffects = useProjectStore(s => s.clearClipEffects);
  const markHistory = useProjectStore(s => s.markHistory);
  const addTemplateClip = useProjectStore(s => s.addTemplateClip);

  const selectedClipId = useUIStore(s => s.selectedClipId);
  const selectClip = useUIStore(s => s.selectClip);
  const zoomLevel = useUIStore(s => s.zoomLevel);
  const setZoomLevel = useUIStore(s => s.setZoomLevel);
  const setCurrentTime = usePlayerStore(s => s.setCurrentTime);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; targetId: string } | null>(null);
  const [snapLines, setSnapLines] = useState<number[]>([]);

  // 右键菜单外点击关闭
  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    document.addEventListener('mousedown', close);
    document.addEventListener('scroll', close, true);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('scroll', close, true);
    };
  }, [contextMenu]);

  // ==================== 转场标记与菜单 ====================
  const cutsByTrack = useMemo(() => {
    const map: Record<string, CutMarker[]> = {};
    for (const t of project.tracks) map[t.id] = [];
    const clipList = Object.values(project.clips);
    for (const c of clipList) {
      if (c.type === 'audio' || !map[c.trackId]) continue;
      const prevExists = clipList.some(
        a => a.trackId === c.trackId && a.id !== c.id &&
             Math.abs(a.startTime + a.duration - c.startTime) < 1e-3
      );
      if (!prevExists) continue;
      const tr = (c.effects || []).find(e => e.type === 'transition');
      map[c.trackId].push({ time: c.startTime, incomingId: c.id, effectId: tr?.presetId });
    }
    return map;
  }, [project.tracks, project.clips]);

  const [transMenu, setTransMenu] = useState<{ x: number; y: number; cut: CutMarker } | null>(null);
  useEffect(() => {
    if (!transMenu) return;
    const close = () => setTransMenu(null);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [transMenu]);

  const transMenuIncoming = transMenu ? project.clips[transMenu.cut.incomingId] : null;
  const transMenuEffect = transMenuIncoming
    ? (transMenuIncoming.effects || []).find(e => e.type === 'transition')
    : undefined;

  const chooseTransitionPreset = useCallback((presetId: string) => {
    if (!transMenu) return;
    useProjectStore.getState().markHistory();
    useProjectStore.getState().addEffectToClip(transMenu.cut.incomingId, presetId);
    setTransMenu(m => m && { ...m, cut: { ...m.cut, effectId: presetId } });
  }, [transMenu]);

  const removeCurrentTransition = useCallback(() => {
    if (!transMenu || !transMenuEffect) return;
    useProjectStore.getState().removeEffectFromClip(transMenu.cut.incomingId, transMenuEffect.id);
    setTransMenu(null);
  }, [transMenu, transMenuEffect]);

  const changeTransitionDuration = useCallback((duration: number) => {
    if (!transMenu || !transMenuEffect || !transMenuIncoming) return;
    const incoming = useProjectStore.getState().project.clips[transMenu.cut.incomingId];
    if (!incoming) return;
    const newEffects = (incoming.effects || []).map(fx =>
      fx.id === transMenuEffect.id ? { ...fx, duration } : fx
    );
    useProjectStore.getState().updateClip(transMenu.cut.incomingId, { effects: newEffects });
  }, [transMenu, transMenuEffect, transMenuIncoming]);

  // 视口时间窗（片段窗口化渲染）
  const [viewWindow, setViewWindow] = useState<[number, number]>([0, 4000]);
  const updateViewWindow = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const padSecs = 200 / zoomLevel;
    const start = Math.max(0, el.scrollLeft - HEADER_W) / zoomLevel - padSecs;
    const end = (el.scrollLeft - HEADER_W + el.clientWidth) / zoomLevel + padSecs;
    setViewWindow(prev => (Math.abs(prev[0] - start) < 0.001 && Math.abs(prev[1] - end) < 0.001) ? prev : [start, end]);
  }, [zoomLevel]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(updateViewWindow);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    updateViewWindow();
    return () => { el.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
  }, [updateViewWindow]);

  useEffect(() => { updateViewWindow(); }, [zoomLevel, updateViewWindow]);

  const linkedTextIds = useMemo(() => {
    const set = new Set<string>();
    for (const c of Object.values(project.clips)) {
      if (c.type === 'text' && c.voiceOver?.linkedClipId) set.add(c.id);
    }
    return set;
  }, [project.clips]);

  const contentWidth = useMemo(
    () => Math.max(window.innerWidth - 260, project.duration * zoomLevel + 500),
    [project.duration, zoomLevel]
  );

  const assetsMirror = useProjectStore(s => s.assets);
  const assetByIdMap = useMemo(() => {
    const m = new Map<string, Asset>();
    for (const a of assetsMirror) m.set(a.id, a);
    return m;
  }, [assetsMirror]);

  const trackClipsMap = useMemo(() => {
    const map: Record<string, Clip[]> = {};
    for (const t of project.tracks) map[t.id] = [];
    for (const c of Object.values(project.clips)) {
      if (!map[c.trackId]) map[c.trackId] = [];
      map[c.trackId].push(c);
    }
    return map;
  }, [project.tracks, project.clips]);

  // ==================== 时间坐标换算与工具 ====================
  const timeAtClientX = useCallback((clientX: number): number => {
    const el = scrollRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const x = clientX - rect.left + el.scrollLeft - HEADER_W;
    return Math.max(0, x / zoomLevel);
  }, [zoomLevel]);

  const collectRowRects = (): DragMeta['rowRects'] => {
    const root = scrollRef.current;
    if (!root) return [];
    const rects: DragMeta['rowRects'] = [];
    root.querySelectorAll<HTMLElement>('[data-track-row]').forEach(row => {
      const r = row.getBoundingClientRect();
      rects.push({
        trackId: row.dataset.trackRow!,
        top: r.top,
        bottom: r.bottom,
        type: (row.dataset.trackType as Track['type']) || 'video',
      });
    });
    return rects;
  };

  const dragMetaRef = useRef<DragMeta | null>(null);
  const autoScrollRafRef = useRef(0);

  const autoScrollNearEdge = useCallback((clientX: number) => {
    const el = scrollRef.current;
    if (!el) return;
    cancelAnimationFrame(autoScrollRafRef.current);
    const rect = el.getBoundingClientRect();
    const margin = 48;
    let dx = 0;
    if (clientX < rect.left + margin) dx = -Math.ceil((rect.left + margin - clientX) / 6);
    else if (clientX > rect.right - margin) dx = Math.ceil((clientX - (rect.right - margin)) / 6);
    if (dx !== 0) {
      el.scrollLeft += dx;
      autoScrollRafRef.current = requestAnimationFrame(() => autoScrollNearEdge(clientX));
    }
  }, []);

  const handleGestureMove = useCallback((e: PointerEvent) => {
    const meta = dragMetaRef.current;
    if (!meta) return;
    const state = useProjectStore.getState();
    const clip = state.project.clips[meta.clipId];
    if (!clip) return;

    autoScrollNearEdge(e.clientX);

    if (meta.mode === 'move') {
      const wantedStart = Math.max(0, timeAtClientX(e.clientX) - meta.grabOffset);
      const rows = meta.rowRects;
      let targetTrackId = clip.trackId;
      let bestDist = Infinity;
      for (const r of rows) {
        const d = e.clientY < r.top ? r.top - e.clientY : e.clientY >= r.bottom ? e.clientY - r.bottom + 1 : 0;
        if (d < bestDist) { bestDist = d; targetTrackId = r.trackId; }
      }
      const targetTrack = state.project.tracks.find(t => t.id === targetTrackId);
      if (!targetTrack || !isTypeCompatible(targetTrack.type, clip.type)) return;

      const snapped = applySnap(wantedStart, clip.duration, meta.snapPoints, 10 / zoomLevel);
      const others = getSortedTrackClips(state.project.clips, targetTrackId, meta.clipId);
      const finalStart = resolvePlacement(others, clip.duration, snapped.start) ?? snapped.start;

      if (Math.abs(finalStart - clip.startTime) > 1e-4 || targetTrackId !== clip.trackId) {
        updateClip(meta.clipId, { startTime: finalStart, trackId: targetTrackId });
      }
      const lines = snapped.start === finalStart ? snapped.snapLines : [];
      setSnapLines(prev => (prev.length === lines.length && prev.every((v, i) => v === lines[i])) ? prev : lines);
    } else if (meta.mode === 'trim-start') {
      const others = getSortedTrackClips(state.project.clips, clip.trackId, meta.clipId);
      const limits = getTrimLimits(others, clip);
      const speed = clip.speed ?? 1;

      let newStart = timeAtClientX(e.clientX);
      const sn = snapScalar(newStart, [...meta.snapPoints, clip.startTime + clip.duration], 8 / zoomLevel);
      newStart = sn.value;
      const res = clampTrimStart(newStart, clip.startTime + clip.duration, limits);

      // 素材源上限（考虑变速与已消耗 offset）
      const asset = clip.assetId ? useAssetStore.getState().assets.find(a => a.id === clip.assetId) : null;
      if (asset?.duration) {
        const maxConsumable = Math.max(0, (asset.duration - clip.offset) / speed);
        if (res.duration > maxConsumable + 1e-6) {
          res.duration = maxConsumable;
          res.start = clip.startTime + clip.duration - maxConsumable;
        }
      }
      if (sn.snappedPoint !== undefined && Math.abs(sn.snappedPoint - res.start) < 1e-6) {
        setSnapLines([sn.snappedPoint]);
      } else {
        setSnapLines([]);
      }
      updateClip(meta.clipId, { startTime: res.start, duration: res.duration });
    } else {
      const others = getSortedTrackClips(state.project.clips, clip.trackId, meta.clipId);
      const limits = getTrimLimits(others, clip);
      const speed = clip.speed ?? 1;

      let newEnd = timeAtClientX(e.clientX);
      const sn = snapScalar(newEnd, [...meta.snapPoints, clip.startTime], 8 / zoomLevel);
      newEnd = sn.value;
      const res = clampTrimEnd(clip.startTime, newEnd, limits);

      const asset = clip.assetId ? useAssetStore.getState().assets.find(a => a.id === clip.assetId) : null;
      if (asset?.duration) {
        const maxConsumable = Math.max(0, (asset.duration - clip.offset) / speed);
        if (res.duration > maxConsumable + 1e-6) res.duration = maxConsumable;
      }
      setSnapLines(sn.snappedPoint !== undefined ? [sn.snappedPoint] : []);
      updateClip(meta.clipId, { duration: res.duration });
    }

    // 拖动超出项目时长时自动扩展，保证可继续向右编排
    const endTimeReached = timeAtClientX(e.clientX);
    if (endTimeReached > state.project.duration) {
      useProjectStore.setState(s => ({ project: { ...s.project, duration: Math.ceil(endTimeReached) + 5 } }));
    }
  }, [timeAtClientX, zoomLevel, updateClip, autoScrollNearEdge]);

  const handleGestureUp = useCallback(() => {
    dragMetaRef.current = null;
    cancelAnimationFrame(autoScrollRafRef.current);
    setSnapLines([]);
    document.removeEventListener('pointermove', handleGestureMove);
  }, [handleGestureMove]);

  const handleClipPointerDown = useCallback((e: React.PointerEvent, clip: Clip, mode: GestureMode) => {
    e.preventDefault();
    selectClip(clip.id);
    markHistory();

    dragMetaRef.current = {
      mode,
      clipId: clip.id,
      origStart: clip.startTime,
      origEnd: clip.startTime + clip.duration,
      grabOffset: mode === 'move' ? timeAtClientX(e.clientX) - clip.startTime : 0,
      snapPoints: buildSnapPoints(useProjectStore.getState().project.clips, clip.id),
      rowRects: collectRowRects(),
    };

    document.addEventListener('pointermove', handleGestureMove);
    document.addEventListener('pointerup', handleGestureUp, { once: true });
    document.addEventListener('pointercancel', handleGestureUp, { once: true });
  }, [markHistory, selectClip, timeAtClientX, handleGestureMove, handleGestureUp]);

  // 空白处按下：取消选择并开始擦洗播放头
  const scrubbingRef = useRef(false);
  const handleScrubMove = useCallback((e: PointerEvent) => {
    if (!scrubbingRef.current) return;
    setCurrentTime(timeAtClientX(e.clientX));
  }, [setCurrentTime, timeAtClientX]);

  const startScrub = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    scrubbingRef.current = true;
    setCurrentTime(timeAtClientX(e.clientX));
    const move = (ev: PointerEvent) => handleScrubMove(ev);
    const up = () => {
      scrubbingRef.current = false;
      document.removeEventListener('pointermove', move);
    };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up, { once: true });
  }, [handleScrubMove, timeAtClientX, setCurrentTime]);

  const handleRowBackgroundPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    selectClip(null);
    startScrub(e);
  }, [selectClip, startScrub]);

  // ==================== 外部拖入（素材/模板/文本） ====================
  const handleDropExternal = useCallback((e: React.DragEvent, trackId: string) => {
    e.preventDefault();
    e.stopPropagation();
    let data: any;
    try {
      const str = e.dataTransfer.getData('application/json');
      if (!str) return;
      data = JSON.parse(str);
    } catch { return; }

    const rawTime = Math.max(0, timeAtClientX(e.clientX));
    const track = project.tracks.find(t => t.id === trackId);
    if (!track) return;

    if (data.type === 'move-clip') {
      const clip = project.clips[data.clipId];
      if (!clip || !isTypeCompatible(track.type, clip.type)) return;
      const wanted = Math.max(0, rawTime - (data.timeOffset ?? 0));
      const snapped = applySnap(wanted, clip.duration, buildSnapPoints(project.clips, clip.id), 12 / zoomLevel);
      moveClip(clip.id, trackId, snapped.start);
    } else if (data.type === 'template') {
      if (track.type !== 'video') { alert('❌ 模板只能添加到视频轨道'); return; }
      addTemplateClip(data.templateId, trackId, rawTime);
    } else if (data.type === 'text') {
      if (track.type !== 'text') { alert('❌ 文本只能放入文本轨道'); return; }
      addClip(null, trackId, rawTime, 'text');
    } else if (data.assetId) {
      const asset = useAssetStore.getState().assets.find(a => a.id === data.assetId);
      if (!asset) return;
      if (!isTypeCompatible(track.type, asset.type)) { alert('❌ 素材类型与轨道不匹配'); return; }
      addClip(asset, trackId, rawTime, undefined);
    }
  }, [project, timeAtClientX, zoomLevel, moveClip, addTemplateClip, addClip]);

  // ==================== 右键菜单 ====================
  const handleContextMenu = useCallback((e: React.MouseEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();
    selectClip(targetId);
    setContextMenu({ x: e.clientX, y: e.clientY, targetId });
  }, [selectClip]);

  const menuTarget = contextMenu ? project.clips[contextMenu.targetId] : null;
  const runMenu = (action: string) => {
    if (!contextMenu) return;
    const { targetId } = contextMenu;
    const playhead = usePlayerStore.getState().currentTime;
    switch (action) {
      case 'split': splitAtTime(playhead, true); break;
      case 'copy': copyClip(targetId); break;
      case 'paste': pasteClip(project.clips[targetId]?.trackId ?? project.tracks[0]?.id, playhead); break;
      case 'duplicate': duplicateClip(targetId); break;
      case 'delete': removeClip(targetId); break;
      case 'rippleDelete': rippleDeleteClip(targetId); break;
      case 'clearEffects': clearClipEffects(targetId); break;
    }
    if (action === 'split' || action === 'delete' || action === 'rippleDelete') {
      if (useUIStore.getState().selectedClipId === targetId) selectClip(null);
    }
    setContextMenu(null);
  };

  return (
    <div className="h-full w-full flex flex-col select-none overflow-hidden rounded-2xl bg-[#121212]"
      onMouseDown={() => contextMenu && setContextMenu(null)}
    >
      {/* 工具栏 */}
      <div className="h-9 bg-[#1E1E24] border-b border-white/5 flex shrink-0 z-50 justify-between px-4 items-center shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 font-medium">Timeline</span>
          <ToolbarActions splitAtTime={splitAtTime} selectedClipId={selectedClipId} />
        </div>
        <div className="flex items-center gap-4">
          <ZoomControl zoomLevel={zoomLevel} setZoomLevel={setZoomLevel} />
          <div className="w-px h-4 bg-white/10 mx-2"></div>
          <button onClick={() => useProjectStore.getState().addTrack('text')} className="text-[10px] bg-white/5 hover:bg-brand-500/20 hover:text-brand-400 px-2 py-1 rounded text-gray-300 transition-colors border border-white/5">T 文本</button>
          <button onClick={() => useProjectStore.getState().addTrack('video')} className="text-[10px] bg-white/5 hover:bg-blue-500/20 hover:text-blue-400 px-2 py-1 rounded text-gray-300 transition-colors border border-white/5 flex items-center gap-1"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>视频</button>
          <button onClick={() => useProjectStore.getState().addTrack('audio')} className="text-[10px] bg-white/5 hover:bg-green-500/20 hover:text-green-400 px-2 py-1 rounded text-gray-300 transition-colors border border-white/5 flex items-center gap-1"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>音频</button>
        </div>
      </div>

      <div className="flex-1 overflow-auto relative scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent" ref={scrollRef}>
        {/* 标尺 */}
        <div className="sticky top-0 z-40 flex h-[30px] min-w-max border-b border-white/10 bg-[#1E1E24]/95 backdrop-blur-sm">
          <div className="sticky left-0 z-50 shrink-0 bg-[#1E1E24] border-r border-white/10 flex items-center justify-center text-[10px] font-mono text-brand-500 shadow-[4px_0_10px_-2px_rgba(0,0,0,0.5)]" style={{ width: HEADER_W }}>
            <TimeCodeDisplay />
          </div>
          <div
            className="relative h-full bg-transparent cursor-pointer"
            style={{ width: contentWidth }}
            onPointerDown={(e) => { e.stopPropagation(); startScrub(e); }}
          >
            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(90deg, transparent 49px, #666 50px)', backgroundSize: '50px 100%' }}></div>
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(90deg, transparent 9px, #444 10px)', backgroundSize: '10px 100%' }}></div>
          </div>
        </div>

        {/* 行区 + 播放头 + 吸附线 */}
        <div className="min-w-max pb-32 relative">
          <PlayheadLayer zoomLevel={zoomLevel} />
          {snapLines.map(t => (
            <div key={`snap-${t}`} className="absolute top-0 bottom-0 w-px bg-red-500/80 pointer-events-none z-40" style={{ left: HEADER_W + t * zoomLevel }} />
          ))}
          {project.tracks.map(track => (
            <div key={track.id} data-track-row={track.id} data-track-type={track.type}>
              <TrackRow
                track={track}
                clips={trackClipsMap[track.id] || []}
                selectedClipId={selectedClipId}
                contentWidth={contentWidth}
                zoomLevel={zoomLevel}
                visibleRange={viewWindow}
                linkedTextIds={linkedTextIds}
                cuts={cutsByTrack[track.id] || []}
                assetById={assetByIdMap}
                onClipPointerDown={handleClipPointerDown}
                onContextMenu={handleContextMenu}
                onDropExternal={handleDropExternal}
                onBackgroundPointerDown={handleRowBackgroundPointerDown}
                onOpenTransitionMenu={(e, cut) => setTransMenu({ x: e.clientX, y: e.clientY, cut })}
              />
            </div>
          ))}
        </div>
      </div>

      {/* 转场选择浮层 */}
      {transMenu && (
        <div
          className="fixed bg-[#1E1E24] border border-white/10 shadow-2xl rounded-xl p-3 z-[110] w-56 animate-fade-in"
          style={{ left: Math.min(transMenu.x - 40, window.innerWidth - 240), top: Math.min(transMenu.y + 12, window.innerHeight - 320) }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">转场</span>
            {transMenuEffect && (
              <button onClick={removeCurrentTransition} className="text-[10px] text-red-400 hover:text-red-300">移除</button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-1.5 max-h-52 overflow-y-auto scrollbar-thin">
            {TRANSITION_PRESETS.map(p => (
              <button key={p.id}
                onClick={() => chooseTransitionPreset(p.id)}
                className={clsx("px-2 py-1.5 rounded-lg text-left text-[11px] border transition-colors",
                  transMenuEffect?.presetId === p.id
                    ? "border-pink-500 text-pink-300 bg-pink-500/15"
                    : "border-white/10 text-gray-300 hover:border-pink-400/60 hover:bg-pink-500/10")}
              >
                {p.name}
              </button>
            ))}
          </div>
          {transMenuEffect && (
            <div className="mt-2.5">
              <div className="flex justify-between text-[10px] mb-1">
                <span className="text-gray-400">时长</span>
                <span className="text-gray-200">{(transMenuEffect.duration ?? 1).toFixed(1)}s</span>
              </div>
              <input type="range" min="0.2" max="4" step="0.1"
                value={transMenuEffect.duration ?? 1}
                onChange={(e) => changeTransitionDuration(parseFloat(e.target.value))}
                onPointerDown={() => useProjectStore.getState().markHistory()}
                className="w-full accent-pink-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer" />
            </div>
          )}
        </div>
      )}

      {/* 右键菜单 */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          menuTarget={menuTarget ?? null}
          hasCopied={!!useProjectStore.getState().copiedClip}
          run={runMenu}
        />
      )}
    </div>
  );
};

// ==================== 工具栏子组件（窄订阅） ====================
const ToolbarActions = memo(({ splitAtTime, selectedClipId }: {
  splitAtTime: (t: number, onlySelected?: boolean) => number;
  selectedClipId: string | null;
}) => {
  const canUndo = useProjectStore(s => s.past.length > 0);
  const canRedo = useProjectStore(s => s.future.length > 0);
  const undo = useProjectStore(s => s.undo);
  const redo = useProjectStore(s => s.redo);
  const selectClip = useUIStore(s => s.selectClip);
  return (
    <div className="flex items-center gap-0.5">
      <ToolBtn title="撤销 (Ctrl+Z)" onClick={undo} label="↩" disabled={!canUndo} />
      <ToolBtn title="恢复 (Ctrl+Shift+Z)" onClick={redo} label="↪" disabled={!canRedo} />
      <ToolBtn
        title={selectedClipId ? '分割选中片段 (S)' : '分割所有跨线片段 (S)'}
        onClick={() => {
          splitAtTime(usePlayerStore.getState().currentTime, !!selectedClipId);
          selectClip(null);
        }}
        label="✂"
      />
    </div>
  );
});

const ZoomControl = memo(({ zoomLevel, setZoomLevel }: { zoomLevel: number; setZoomLevel: (z: number) => void }) => (
  <div className="flex items-center gap-1 bg-black/30 rounded-lg p-0.5 border border-white/5">
    <button onClick={() => setZoomLevel(zoomLevel * 0.8)} className="p-1 px-2 hover:bg-white/10 rounded text-xs text-gray-400 hover:text-white transition-colors">-</button>
    <input type="range" min="5" max="200" step="5" value={zoomLevel}
      onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
      className="w-20 h-1 accent-brand-500 bg-white/10 rounded-lg appearance-none cursor-pointer" />
    <button onClick={() => setZoomLevel(zoomLevel * 1.2)} className="p-1 px-2 hover:bg-white/10 rounded text-xs text-gray-400 hover:text-white transition-colors">+</button>
  </div>
));

const ContextMenu = memo(({ x, y, menuTarget, hasCopied, run }: {
  x: number; y: number; menuTarget: Clip | null; hasCopied: boolean;
  run: (action: string) => void;
}) => (
  <div
    className="fixed bg-[#1E1E24] border border-white/10 shadow-2xl rounded-lg py-1 z-[100] w-44 animate-fade-in"
    style={{ left: Math.min(x, window.innerWidth - 180), top: Math.min(y, window.innerHeight - 260) }}
    onMouseDown={(e) => e.stopPropagation()}
  >
    <MenuRow icon="split" label="在此处分割" hint="S" onClick={() => run('split')} />
    <MenuRow icon="copy" label="复制" hint="Ctrl+C" onClick={() => run('copy')} />
    <MenuRow icon="paste" label="粘贴到此轨道播放头" hint="Ctrl+V" onClick={() => run('paste')} disabled={!hasCopied} />
    <MenuRow icon="duplicate" label="创建副本" hint="Ctrl+D" onClick={() => run('duplicate')} />
    {menuTarget?.effects && menuTarget.effects.length > 0 && (
      <MenuRow icon="clear" label="清除效果" onClick={() => run('clearEffects')} />
    )}
    <div className="my-1 h-px bg-white/10" />
    <MenuRow icon="delete" label="删除" hint="Del" onClick={() => run('delete')} danger />
    <MenuRow icon="ripple" label="波纹删除(补位)" hint="⇧Del" onClick={() => run('rippleDelete')} danger />
  </div>
));

const ToolBtn = ({ label, title, onClick, disabled }: { label: string; title: string; onClick: () => void; disabled?: boolean }) => (
  <button title={title} onClick={onClick} disabled={disabled}
    className={clsx("p-1 px-1.5 rounded text-xs transition-colors", disabled ? "text-gray-600 cursor-default" : "text-gray-400 hover:text-white hover:bg-white/10")}>{label}</button>
);


const iconMap: Record<string, React.ReactNode> = {
  split: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.5 17.5L3 6V3h3l11.5 11.5"/><path d="m21 15-5-5L21 4"/></svg>,
  copy: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  paste: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>,
  duplicate: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  clear: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  delete: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  ripple: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>,
};

const MenuRow = ({ icon, label, hint, onClick, danger, disabled }: {
  icon: string; label: string; hint?: string; onClick: () => void; danger?: boolean; disabled?: boolean;
}) => (
  <button
    disabled={disabled}
    onClick={onClick}
    className={clsx("w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
      danger ? "text-red-400 hover:bg-red-500/20" : "text-gray-300 hover:bg-brand-500/20 hover:text-brand-300")}
  >
    <span className="w-4 shrink-0 text-gray-400">{iconMap[icon] ?? <span className="text-[10px]">{icon}</span>}</span><span className="flex-1">{label}</span>{hint && <span className="text-[10px] text-gray-500">{hint}</span>}
  </button>
);
