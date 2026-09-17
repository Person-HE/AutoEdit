import React, { useEffect, useRef, useState, useCallback, useMemo, memo } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { usePlayerStore } from '../../store/usePlayerStore';
import { useUIStore } from '../../store/useUIStore';
import type { Clip, Asset, Transform, Effect } from '../../types/core';
import { getTemplate, getTemplateDefaultParams } from '../../engine/templates';
import { PRESETS } from '../../engine/presets';
import { audioEngine } from '../../engine/core/AudioEngine';
import { evaluateClipKeyframes } from '../../engine/keyframes/evaluate';
import { buildGradingCss } from '../../engine/color/grading';
import type { GradingOverlay } from '../../engine/color/grading';

import { composeTransformCss, STAGE_PERSPECTIVE_PX } from '../../engine/spatial/compose';
import { sourceElapsed, instantSpeed, normalizePoints } from '../../engine/timing/speedCurve';
import { VideoClipLayer } from './video/VideoClipLayer';
import { buildMaskCss, maskToReactStyle } from '../../engine/mask/maskEngine';
import type { MaskCssResult } from '../../engine/mask/maskEngine';


interface AppliedEffectResult {
  transform: Transform;
  opacity: number;
  filter: string;
  clipPath?: string;
  /** 调色混合层（soft-light/lighten），渲染在片段内容之上 */
  gradingOverlays: GradingOverlay[];
}

/** 蒙版求值缓存：key = 片段引用（配置变更即换引用） */
const maskCssCache = new WeakMap<Clip, MaskCssResult | null>();
function getClipMaskCss(clip: Clip): MaskCssResult | null {
  if (maskCssCache.has(clip)) return maskCssCache.get(clip) ?? null;
  const result = buildMaskCss(clip.mask);
  maskCssCache.set(clip, result);
  return result;
}

/** 将蒙版 + 抠像以外的遮罩合并为容器 style（形状蒙版用 CSS mask 承载） */
function buildMaskStyle(clip: Clip): React.CSSProperties {
  const mask = getClipMaskCss(clip);
  if (!mask) return {};
  return maskToReactStyle(mask) as React.CSSProperties;
}

/** 转场窗口内对"前一片段"应用反向进度的同一转场预设 */
function applyOutgoingTransition(
  base: AppliedEffectResult,
  transition: Effect,
  currentTime: number,
  incomingStart: number,
  fps: number
): AppliedEffectResult {
  const preset = PRESETS[transition.presetId];
  if (!preset?.apply) return base;

  const dur = Math.max(0.1, transition.duration || 1);
  const rel = currentTime - incomingStart;
  const progress = Math.min(1, Math.max(0, 1 - rel / dur)); // 反向：前一片段从 1→0

  try {
    const r = preset.apply(progress, transition.params || {}, base.transform);
    const merged: AppliedEffectResult = {
      transform: r.transform ? { ...base.transform, ...r.transform } : base.transform,
      opacity: typeof r.opacity === 'number' ? base.opacity * Math.min(1, Math.max(0, r.opacity)) : base.opacity,
      filter: `${base.filter} ${r.filter ?? ''}`.trim(),
      clipPath: r.clipPath ?? base.clipPath,
      gradingOverlays: base.gradingOverlays,
    };
    return merged;
  } catch {
    return base;
  }
}

/**
 * 效果求值缓存：key = 片段引用 + 按 fps 量化的片内相对时间。
 * 同一量化帧内的重复渲染或静止帧直接命中，避免重复计算与样式对象抖动。
 */
const effectResultCache = new WeakMap<Clip, { key: number; value: AppliedEffectResult }>();

function applyEffectsToClip(clip: Clip, currentTime: number, fps: number): AppliedEffectResult {
  const rel = currentTime - clip.startTime;
  const key = Math.round(rel * fps);
  const cached = effectResultCache.get(clip);
  if (cached && cached.key === key) return cached.value;

  let finalTransform: Transform = { ...clip.transform };
  let finalOpacity = clip.style?.opacity ?? 1;
  let finalFilter = '';
  let finalClipPath: string | undefined;

  // 调色（基准层，先于关键帧与预设效果）
  const grading = buildGradingCss(clip.colorGrading);
  if (grading.filter) finalFilter += `${grading.filter} `;

  // 关键帧通道作为基础变换叠加（在预设效果之前）
  const kf = clip.keyframes;
  if (kf) {
    const ev = evaluateClipKeyframes(clip, rel);
    if (kf.x?.length) finalTransform.x = ev.x;
    if (kf.y?.length) finalTransform.y = ev.y;
    if (kf.scale?.length) finalTransform.scale = ev.scale;
    if (kf.rotation?.length) finalTransform.rotation = ev.rotation;
    if (kf.z?.length) finalTransform.depthZ = ev.z;
    if (kf.rotateX?.length) finalTransform.rotateX = ev.rotateX;
    if (kf.rotateY?.length) finalTransform.rotateY = ev.rotateY;
    if (kf.opacity?.length) finalOpacity *= Math.max(0, Math.min(1, ev.opacity));
  }

  const effects = clip.effects || [];
  for (const effect of effects) {
      const preset = PRESETS[effect.presetId];
      if (!preset || typeof preset.apply !== 'function') continue;

      let progress = 0;
      if (effect.type === 'entrance' || effect.type === 'transition') {
        progress = Math.min(1, Math.max(0, rel / Math.max(0.1, effect.duration || 1)));
      } else if (effect.type === 'exit') {
        const dur = Math.max(0.1, effect.duration || 1);
        const exitStart = clip.duration - dur;
        progress = rel >= exitStart ? Math.min(1, Math.max(0, (rel - exitStart) / dur)) : 0;
      } else {
        progress = Math.min(1, Math.max(0, rel / Math.max(0.001, clip.duration)));
      }

      try {
        const result = preset.apply(progress, effect.params || {}, { ...finalTransform });
        if (result?.transform) {
          // 只覆盖预设显式返回的字段；3D/斜切等未涉及字段原样保留
          const rT = result.transform;
          const nextScale = rT.scale;
          finalTransform = {
            ...finalTransform,
            x: typeof rT.x === 'number' ? rT.x : finalTransform.x,
            y: typeof rT.y === 'number' ? rT.y : finalTransform.y,
            scale: (typeof nextScale === 'number' && isFinite(nextScale) && nextScale > 0.001)
              ? Math.max(0.001, Math.min(10, nextScale))
              : finalTransform.scale,
            rotation: typeof rT.rotation === 'number' ? rT.rotation : finalTransform.rotation,
          };
        }
        if (typeof result?.opacity === 'number') finalOpacity *= Math.max(0, Math.min(1, result.opacity));
        if (result?.filter) finalFilter += `${result.filter} `;
        if (result?.clipPath) finalClipPath = result.clipPath;
      } catch (error) {
        console.error(`Error applying effect ${effect.presetId}:`, error);
      }
    }

  finalTransform.scale = Math.max(0.001, Math.min(10, finalTransform.scale));
  finalOpacity = Math.max(0, Math.min(1, finalOpacity));

  const value: AppliedEffectResult = {
    transform: finalTransform,
    opacity: finalOpacity,
    filter: finalFilter.trim(),
    clipPath: finalClipPath,
    gradingOverlays: grading.overlays,
  };
  effectResultCache.set(clip, { key, value });
  return value;
}

/** 调色混合覆盖层（继承父级 transform/filter，叠放在片段内容上方） */
const GradingLayers = memo(({ list }: { list: GradingOverlay[] }) => {
  if (!list?.length) return null;
  return (
    <>
      {list.map((o, i) => (
        <div
          key={`${o.blend}-${i}`}
          style={{
            position: 'absolute',
            inset: '-1%',
            background: o.color,
            mixBlendMode: o.blend,
            opacity: o.opacity ?? 1,
            pointerEvents: 'none',
          }}
        />
      ))}
    </>
  );
});

const centerFlex: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

// ==================== 模板画布（显示分辨率渲染 + ResizeObserver） ====================
const TemplateCanvasRenderer = memo(({ clip, currentTime, containerStyle, projectWidth, projectHeight, fps }: {
  clip: Clip;
  currentTime: number;
  containerStyle: React.CSSProperties;
  projectWidth: number;
  projectHeight: number;
  fps: number;
}) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [displaySize, setDisplaySize] = useState<{ w: number; h: number } | null>(null);
  const templateId = clip.templateData?.templateId;
  const templateParams = clip.templateData?.params;

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const r = entries[0].contentRect;
      const w = Math.max(1, Math.round(r.width));
      const h = Math.max(1, Math.round(r.height));
      setDisplaySize(prev => (prev && prev.w === w && prev.h === h ? prev : { w, h }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // 以量化时间为输入：静置时不重复绘制
  const timeKey = Math.round((currentTime - clip.startTime) * fps);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !templateId || !displaySize) return;
    const template = getTemplate(templateId);
    if (!template) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const targetW = Math.max(64, Math.round(displaySize.w * dpr));
    const targetH = Math.max(36, Math.round(displaySize.h * dpr));
    if (canvas.width !== targetW) canvas.width = targetW;
    if (canvas.height !== targetH) canvas.height = targetH;

    const defaults = getTemplateDefaultParams(templateId);
    const params = { ...(defaults || {}), ...(templateParams || {}) };
    const duration = clip.duration;
    const rel = Math.max(0, currentTime - clip.startTime);
    const progress = Math.min(1, rel / Math.max(0.001, duration));

    ctx.setTransform(targetW / projectWidth, 0, 0, targetH / projectHeight, 0, 0);
    ctx.clearRect(0, 0, projectWidth, projectHeight);
    ctx.save();
    ctx.translate(projectWidth / 2, projectHeight / 2);
    try {
      template.render({ ctx, width: projectWidth, height: projectHeight, progress, time: progress * duration, duration, params });
    } catch (error) {
      console.error(`Template render error (${templateId}):`, error);
      ctx.fillStyle = 'rgba(236,72,153,0.15)';
      ctx.fillRect(0, 0, projectWidth, projectHeight);
    }
    ctx.restore();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }, [templateId, timeKey, displaySize, projectWidth, projectHeight]);

  if (!templateId || !getTemplate(templateId)) {
    return (
      <div style={{ ...containerStyle, width: 280, height: 160, background: 'rgba(236,72,153,0.15)', borderRadius: 12, border: '1px solid rgba(236,72,153,0.3)', flexDirection: 'column', gap: 6 }}>
        <svg style={{ fontSize: 28 }} width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
        <span style={{ color: '#f472b6', fontSize: 13, fontWeight: 600 }}>{clip.name}</span>
        <span style={{ color: '#db2777', fontSize: 11 }}>模板未找到: {templateId}</span>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div ref={wrapRef} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <canvas ref={canvasRef} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
      </div>
    </div>
  );
});

// ==================== 单片段渲染 ====================
const ClipRenderer = memo(({ clip, currentTime, assetsById, projectWidth, projectHeight, fps, outgoingTransition }: {
  clip: Clip;
  currentTime: number;
  assetsById: Map<string, Asset>;
  projectWidth: number;
  projectHeight: number;
  fps: number;
  /** 该片段作为转场"前一片段"的叠加：后进片段上的 transition 效果 + 其入场时间 */
  outgoingTransition?: { effect: Effect; incomingStart: number };
}) => {
  let effectResult = applyEffectsToClip(clip, currentTime, fps);
  if (outgoingTransition) {
    effectResult = applyOutgoingTransition(effectResult, outgoingTransition.effect, currentTime, outgoingTransition.incomingStart, fps);
  }
  const zIndex = clip.style?.zIndex ?? 0;


  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '80%',
    height: '80%',
    transform: composeTransformCss(effectResult.transform),
    opacity: effectResult.opacity,
    filter: effectResult.filter || undefined,
    clipPath: effectResult.clipPath,
    zIndex,
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...buildMaskStyle(clip),
  };
  const overlays = <GradingLayers list={effectResult.gradingOverlays} />;

  if (clip.type === 'audio') return null;

  if (clip.type === 'image') {
    const asset = assetsById.get(clip.assetId);
    if (asset?.url) {
      return (
        <div style={containerStyle}>
          <img src={asset.url} alt={asset.name}
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', userSelect: 'none' }}
            draggable={false} loading="lazy" />
          {overlays}
        </div>
      );
    }
    return (
      <div style={{ ...containerStyle, width: 200, height: 120, background: 'rgba(59,130,246,0.15)', borderRadius: 8, border: '1px dashed rgba(59,130,246,0.4)' }}>
        <span style={{ color: '#60a5fa', fontSize: 12 }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline mr-1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg>{clip.name}</span>
      </div>
    );
  }

  if (clip.type === 'video') {
    const asset = assetsById.get(clip.assetId);
    if (asset && (asset.thumbnail || asset.url)) {
      // P5 起替换为真实 <video> 解码；封面仅作未就绪兜底
      return (
        <VideoClipLayer
          clip={clip}
          asset={asset}
          containerStyle={containerStyle}
        >
          {overlays}
        </VideoClipLayer>
      );
    }
    return (
      <div style={{ ...containerStyle, background: 'rgba(139,92,246,0.15)', borderRadius: 8, border: '1px dashed rgba(139,92,246,0.4)', flexDirection: 'column', gap: 4 }}>
        <svg style={{ fontSize: 24, opacity: 0.3 }} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
        <span style={{ color: '#a78bfa', fontSize: 12 }}>{asset?.name ?? clip.name}</span>
      </div>
    );
  }

  if (clip.type === 'text' && clip.textData) {
    return (
      <div style={containerStyle}>
        <div
          style={{
            color: clip.textData.color || '#ffffff',
            fontSize: clip.textData.fontSize || 60,
            fontFamily: clip.textData.fontFamily || 'Arial, sans-serif',
            fontWeight: 'bold',
            textAlign: 'center',
            textShadow: '0 2px 8px rgba(0,0,0,0.7)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            userSelect: 'none',
            backgroundColor: clip.textData.backgroundColor || 'transparent',
            padding: clip.textData.backgroundColor ? '8px 16px' : 0,
            borderRadius: clip.textData.backgroundColor ? 6 : 0,
          }}
        >
          {clip.textData.content}
        </div>
        {overlays}
      </div>
    );
  }

  if (clip.type === 'template' && clip.templateData) {
    return (
      <div style={containerStyle}>
        <TemplateCanvasRenderer
          clip={clip}
          currentTime={currentTime}
          containerStyle={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          projectWidth={projectWidth}
          projectHeight={projectHeight}
          fps={fps}
        />
        {overlays}
      </div>
    );
  }

  return null;
});

// ==================== 可见片段收集（排序数组缓存 + 二分） ====================
let sortedClipsCache: { clips: Record<string, Clip>; sorted: Clip[] } | null = null;

function getVisibleClips(clipsRecord: Record<string, Clip>, t: number): Clip[] {
  if (sortedClipsCache?.clips !== clipsRecord) {
    sortedClipsCache = { clips: clipsRecord, sorted: Object.values(clipsRecord).sort((a, b) => a.startTime - b.startTime) };
  }
  const sorted = sortedClipsCache.sorted;
  let lo = 0, hi = sorted.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (sorted[mid].startTime + sorted[mid].duration <= t) lo = mid + 1;
    else hi = mid;
  }
  const visible: Clip[] = [];
  for (let i = lo; i < sorted.length; i++) {
    const c = sorted[i];
    if (c.startTime > t) break;
    visible.push(c);
  }
  return visible.sort((a, b) => (a.style?.zIndex ?? 0) - (b.style?.zIndex ?? 0));
}

// ==================== 预览内容层 ====================
const PreviewContent = memo(() => {
  const clips = useProjectStore(s => s.project.clips);
  const projectFps = useProjectStore(s => s.project.fps);
  const projectW = useProjectStore(s => s.project.width);
  const projectH = useProjectStore(s => s.project.height);
  const assetsMirror = useProjectStore(s => s.assets);
  const currentTime = usePlayerStore(s => s.currentTime);

  const assetsById = useMemo(() => {
    const m = new Map<string, Asset>();
    for (const a of assetsMirror) m.set(a.id, a);
    return m;
  }, [assetsMirror]);

  // { clip, outgoing? } 渲染项：转场窗口内补渲染前一片段
  const renderItems = useMemo(() => {
    const base = getVisibleClips(clips, currentTime);
    const items: Array<{ clip: Clip; outgoing?: { effect: Effect; incomingStart: number } }> =
      base.map(clip => ({ clip }));

    for (const incoming of base) {
      const tr = (incoming.effects || []).find(e => e.type === 'transition');
      if (!tr) continue;
      const dur = Math.max(0.1, Math.min(tr.duration || 1, incoming.duration));
      if (currentTime >= incoming.startTime + dur) continue;

      // 同轨上前一片段：结尾紧贴本片段开始
      const prev = Object.values(clips).find(
        a => a.trackId === incoming.trackId && a.id !== incoming.id &&
             Math.abs(a.startTime + a.duration - incoming.startTime) < 1e-3
      );
      if (!prev) continue;
      if (!items.some(it => it.clip.id === prev.id)) items.push({ clip: prev });
      const item = items.find(it => it.clip.id === prev.id)!;
      item.outgoing = { effect: tr, incomingStart: incoming.startTime };
    }

    return items.sort((a, b) => (a.clip.style?.zIndex ?? 0) - (b.clip.style?.zIndex ?? 0));
  }, [clips, currentTime]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', backgroundColor: '#000', overflow: 'hidden' }}>
      {renderItems.map(({ clip, outgoing }) => (
        <ClipRenderer
          key={clip.id}
          clip={clip}
          currentTime={currentTime}
          assetsById={assetsById}
          projectWidth={projectW}
          projectHeight={projectH}
          fps={projectFps || 30}
          outgoingTransition={outgoing}
        />
      ))}
      {renderItems.length === 0 && (
        <div style={{ ...centerFlex, position: 'absolute', inset: 0, flexDirection: 'column', gap: 12, color: '#555', fontSize: 14 }}>
          <svg style={{ fontSize: 36, opacity: 0.3 }} width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
          <span>拖拽素材到轨道上即可预览</span>
        </div>
      )}
    </div>
  );
});

export const PreviewPlayer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const updateClip = useProjectStore(s => s.updateClip);
  const project = useProjectStore(s => s.project);
  const isPlaying = usePlayerStore(s => s.isPlaying);
  const setIsPlaying = usePlayerStore(s => s.setIsPlaying);
  const selectedClipId = useUIStore(s => s.selectedClipId);

  const [isDragging, setIsDragging] = useState(false);
  const [interactionMode, setInteractionMode] = useState<'none' | 'move' | 'resize' | 'rotate'>('none');
  const startPosRef = useRef({ x: 0, y: 0 });
  const initialTransformRef = useRef<Transform | null>(null);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // 音频同步：订阅式，不触发重渲染
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;
  useEffect(() => {
    let lastT = Number.NaN;
    let lastSyncedAt = Number.NaN;
    return usePlayerStore.subscribe((s) => {
      const t = s.currentTime;
      lastT = t;
      if (!isPlayingRef.current) return;
      if (Math.abs(t - lastSyncedAt) >= 0.02 || Number.isNaN(lastSyncedAt)) {
        lastSyncedAt = t;
        audioEngine.sync(t, true, useProjectStore.getState().project);
      }
    });
  }, []);
  // 状态切换到暂停时立即停声
  useEffect(() => {
    if (!isPlaying) audioEngine.pause();
    else audioEngine.resume();
  }, [isPlaying]);

  useEffect(() => {
    audioEngine.loadResources(useProjectStore.getState().assets);
  }, [project]);

  // 播放循环：RAF 写入 playerStore；订阅方自行决定是否重渲染
  useEffect(() => {
    if (!isPlaying) return;

    lastTimeRef.current = performance.now();
    const tick = (now: number) => {
      const dt = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;
      if (dt >= 0 && dt <= 1 && !isNaN(dt)) {
        usePlayerStore.setState(s => {
          const next = s.currentTime + dt;
          const maxTime = useProjectStore.getState().project.duration || 30;
          return next >= maxTime || isNaN(next) ? { currentTime: 0 } : { currentTime: next };
        });
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying]);

  const togglePlay = useCallback(() => {
    const player = usePlayerStore.getState();
    const maxDur = useProjectStore.getState().project.duration || 30;
    if (!player.isPlaying && player.currentTime >= maxDur) player.setCurrentTime(0);
    player.setIsPlaying(!player.isPlaying);
  }, []);

  const handleStop = useCallback(() => {
    audioEngine.stop();
    setIsPlaying(false);
    usePlayerStore.getState().setCurrentTime(0);
  }, [setIsPlaying]);

  const handleMouseDown = useCallback((e: React.MouseEvent, mode: 'move' | 'resize' | 'rotate') => {
    e.stopPropagation();
    const selId = useUIStore.getState().selectedClipId;
    const clip = selId ? useProjectStore.getState().project.clips[selId] : null;
    if (!clip) return;
    setIsDragging(true);
    setInteractionMode(mode);
    startPosRef.current = { x: e.clientX, y: e.clientY };
    initialTransformRef.current = { ...clip.transform };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !initialTransformRef.current) return;
    const selId = useUIStore.getState().selectedClipId;
    if (!selId) return;
    const init = initialTransformRef.current;
    const deltaX = e.clientX - startPosRef.current.x;
    const deltaY = e.clientY - startPosRef.current.y;
    const rect = containerRef.current?.getBoundingClientRect();
    const scaleFactor = rect ? (project.width || 1920) / rect.width : 1;

    if (interactionMode === 'move') {
      updateClip(selId, {
        transform: { ...init, x: (init.x || 0) + deltaX * scaleFactor, y: (init.y || 0) + deltaY * scaleFactor },
      });
    } else if (interactionMode === 'rotate') {
      updateClip(selId, { transform: { ...init, rotation: ((init.rotation || 0) + deltaX * 0.5) % 360 } });
    } else if (interactionMode === 'resize') {
      updateClip(selId, { transform: { ...init, scale: Math.max(0.1, (init.scale || 1) + deltaX * 0.005) } });
    }
  }, [isDragging, interactionMode, project.width, updateClip]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setInteractionMode('none');
  }, []);

  return (
    <div
      className="flex-1 bg-black relative flex flex-col items-center justify-center overflow-hidden h-full w-full"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="absolute inset-0 opacity-20"
        style={{ backgroundImage: 'radial-gradient(circle, #333 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

      <div ref={containerRef}
        className="relative shadow-2xl transition-all duration-300 ease-out w-full max-w-[95%]"
        style={{
          aspectRatio: `${project.width || 1920} / ${project.height || 1080}`,
          boxShadow: '0 20px 60px -20px rgba(0,0,0,0.8)',
          perspective: `${STAGE_PERSPECTIVE_PX}px`,
        }}
      >
        <PreviewContent />
        {selectedClipId && (
          <SelectionOverlay clipId={selectedClipId} onHandleDown={handleMouseDown} />
        )}
      </div>

      <TransportBar isPlaying={isPlaying} onToggle={togglePlay} onStop={handleStop} fps={project.fps || 30} duration={project.duration || 30} />
    </div>
  );
};

/** 订阅式播放头 hook：回调触发但不重渲染宿主组件 */
export function usePlayheadSubscription(cb: (t: number) => void): void {
  const cbRef = useRef(cb);
  cbRef.current = cb;
  useEffect(() => {
    let last = Number.NaN;
    return usePlayerStore.subscribe((s) => {
      if (s.currentTime === last) return;
      last = s.currentTime;
      cbRef.current(s.currentTime);
    });
  }, []);
}

/** 选中框：显隐由布尔选择器驱动（只在进入/离开片段时变化），不逐帧重渲染 */
const SelectionOverlay = memo(({ clipId, onHandleDown }: {
  clipId: string;
  onHandleDown: (e: React.MouseEvent, mode: 'move' | 'resize' | 'rotate') => void;
}) => {
  const clip = useProjectStore(s => s.project.clips[clipId] ?? null);
  const visible = usePlayerStore(s => {
    if (!clip) return false;
    return s.currentTime >= clip.startTime && s.currentTime < clip.startTime + clip.duration;
  });
  if (!clip || !visible) return null;

  return (
    <div
      className="absolute border border-brand-500"
      onMouseDown={(e) => onHandleDown(e, 'move')}
      style={{
        left: '50%',
        top: '50%',
        width: 100,
        height: 100,
        transform: `translate(-50%, -50%) translate(${(clip.transform?.x || 0) / 2}px, ${(clip.transform?.y || 0) / 2}px) rotate(${clip.transform?.rotation || 0}deg) scale(${clip.transform?.scale || 1})`,
        cursor: 'move',
        boxShadow: '0 0 20px rgba(41, 151, 255, 0.3)',
      }}
    >
      {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map(pos => (
        <div key={pos}
          className="absolute w-3 h-3 bg-white border-2 border-brand-500 rounded-full shadow-lg cursor-nwse-resize"
          style={{
            top: pos.includes('top') ? -6 : 'auto',
            bottom: pos.includes('bottom') ? -6 : 'auto',
            left: pos.includes('left') ? -6 : 'auto',
            right: pos.includes('right') ? -6 : 'auto',
          }}
          onMouseDown={(e) => onHandleDown(e, 'resize')}
        />
      ))}
      <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-px h-8 bg-brand-500 pointer-events-none"></div>
      <div
        className="absolute -top-10 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-2 border-brand-500 rounded-full shadow-lg cursor-grab hover:scale-110 transition-transform"
        onMouseDown={(e) => onHandleDown(e, 'rotate')}
      ></div>
    </div>
  );
});

const TransportBar = memo(({ isPlaying, onToggle, onStop, fps, duration }: {
  isPlaying: boolean; onToggle: () => void; onStop: () => void; fps: number; duration: number;
}) => (
  <div className="absolute bottom-8 glass-modal px-6 py-2.5 flex items-center gap-6 z-20 animate-fade-in">
    <button onClick={onStop} className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
    </button>
    <button onClick={onToggle} className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-lg shadow-white/20">
      {isPlaying ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="translate-x-0.5"><path d="M5 3l14 9-14 9V3z"/></svg>
      )}
    </button>
    <TimeReadout duration={duration} />
    <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-0.5 rounded">{fps}fps</span>
  </div>
));

const TimeReadout = memo(({ duration }: { duration: number }) => {
  const currentTime = usePlayerStore(s => s.currentTime);
  return (
    <div className="text-sm font-mono font-medium min-w-[90px] text-center text-gray-200">
      {formatPlayerTime(currentTime)}
      <span className="text-xs text-gray-500"> / {formatPlayerTime(duration)}</span>
    </div>
  );
});

function formatPlayerTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}
