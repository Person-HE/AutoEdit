import React, { useEffect, useRef, useState, useCallback, useMemo, memo } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { usePlayerStore } from '../../store/usePlayerStore';
import { useUIStore } from '../../store/useUIStore';
import type { Clip, Asset, Transform } from '../../types/core';
import { getTemplate, getTemplateDefaultParams } from '../../engine/templates';
import { PRESETS } from '../../engine/presets';
import { audioEngine } from '../../engine/core/AudioEngine';

const TemplateCanvasRenderer = memo(({ clip, clipProgress, containerStyle, projectWidth, projectHeight }: {
  clip: Clip;
  clipProgress: number;
  containerStyle: React.CSSProperties;
  projectWidth: number;
  projectHeight: number;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const templateId = clip.templateData?.templateId;
  const templateParams = clip.templateData?.params || {};

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !templateId) return;
    const template = getTemplate(templateId);
    if (!template) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = projectWidth;
    canvas.height = projectHeight;
    const defaults = getTemplateDefaultParams(templateId);
    const params = { ...defaults, ...templateParams };
    const duration = clip.duration;
    const time = clipProgress * duration;

    ctx.clearRect(0, 0, projectWidth, projectHeight);
    ctx.save();
    ctx.translate(projectWidth / 2, projectHeight / 2);

    try {
      template.render({
        ctx,
        width: projectWidth,
        height: projectHeight,
        progress: clipProgress,
        time,
        duration,
        params,
      });
    } catch (error) {
      console.error(`Template render error (${templateId}):`, error);
      ctx.restore();
      ctx.fillStyle = 'rgba(236,72,153,0.15)';
      ctx.fillRect(0, 0, projectWidth, projectHeight);
      ctx.fillStyle = '#f472b6';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`模板渲染错误: ${templateId}`, projectWidth / 2, projectHeight / 2);
      return;
    }
    ctx.restore();
  }, [templateId, clipProgress, projectWidth, projectHeight, clip.duration, templateParams]);

  if (!templateId || !getTemplate(templateId)) {
    return (
      <div style={{ ...containerStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 280, height: 160, background: 'rgba(236,72,153,0.15)', borderRadius: 12, border: '1px solid rgba(236,72,153,0.3)', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 28 }}>⚡</span>
        <span style={{ color: '#f472b6', fontSize: 13, fontWeight: 600 }}>{clip.name}</span>
        <span style={{ color: '#db2777', fontSize: 11 }}>模板未找到: {templateId}</span>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <canvas
        ref={canvasRef}
        style={{
          width: projectWidth,
          height: projectHeight,
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'contain',
        }}
      />
    </div>
  );
});

interface AppliedEffectResult {
  transform: Transform;
  opacity: number;
  filter: string;
}

function applyEffectsToClip(clip: Clip, currentTime: number): AppliedEffectResult {
  let finalTransform: Transform = { ...clip.transform };
  let finalOpacity = clip.style?.opacity ?? 1;
  let finalFilter = '';

  const effects = clip.effects || [];
  if (effects.length === 0) {
    return { transform: finalTransform, opacity: finalOpacity, filter: finalFilter };
  }

  const clipRelativeTime = currentTime - clip.startTime;

  for (const effect of effects) {
    const preset = PRESETS[effect.presetId];
    if (!preset || typeof preset.apply !== 'function') continue;

    let progress = 0;
    if (effect.type === 'entrance' || effect.type === 'transition') {
      const dur = Math.max(0.1, effect.duration || 1);
      progress = Math.min(1, Math.max(0, clipRelativeTime / dur));
    } else if (effect.type === 'exit') {
      const dur = Math.max(0.1, effect.duration || 1);
      const exitStartTime = clip.duration - dur;
      if (clipRelativeTime >= exitStartTime) {
        progress = Math.min(1, Math.max(0, (clipRelativeTime - exitStartTime) / dur));
      } else {
        progress = 0;
      }
    } else {
      progress = Math.min(1, Math.max(0, clipRelativeTime / clip.duration));
    }

    const params = effect.params || {};

    try {
      const result = preset.apply(progress, params, { ...finalTransform });
      if (result?.transform) {
        const newScale = result.transform.scale;
        if (typeof newScale === 'number' && isFinite(newScale) && newScale > 0.001) {
          finalTransform = {
            x: typeof result.transform.x === 'number' ? result.transform.x : finalTransform.x,
            y: typeof result.transform.y === 'number' ? result.transform.y : finalTransform.y,
            scale: Math.max(0.001, Math.min(10, newScale)),
            rotation: typeof result.transform.rotation === 'number' ? result.transform.rotation : finalTransform.rotation
          };
        }
      }
      if (typeof result?.opacity === 'number') {
        finalOpacity *= Math.max(0, Math.min(1, result.opacity));
      }
      if (result?.filter) {
        finalFilter += `${result.filter} `;
      }
    } catch (error) {
      console.error(`Error applying effect ${effect.presetId}:`, error);
    }
  }

  finalTransform.scale = Math.max(0.001, Math.min(10, finalTransform.scale));
  finalOpacity = Math.max(0, Math.min(1, finalOpacity));

  return {
    transform: finalTransform,
    opacity: finalOpacity,
    filter: finalFilter.trim()
  };
}

const centerFlex: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'absolute',
};

const ClipRenderer = memo(({ clip, currentTime, assets, projectWidth, projectHeight }: {
  clip: Clip;
  currentTime: number;
  assets: Asset[];
  projectWidth: number;
  projectHeight: number;
}) => {
  const clipProgress = Math.max(0, Math.min(1, (currentTime - clip.startTime) / clip.duration));
  const effectResult = useMemo(() => applyEffectsToClip(clip, currentTime), [clip, currentTime]);
  const transform = effectResult.transform;
  const opacity = effectResult.opacity;
  const filter = effectResult.filter;
  const zIndex = clip.style?.zIndex ?? 0;

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: `translate(-50%, -50%) translate(${transform.x}px, ${transform.y}px) rotate(${transform.rotation}deg) scale(${Math.max(0.001, transform.scale)})`,
    opacity,
    filter: filter || undefined,
    zIndex,
    pointerEvents: 'none',
  };

  if (clip.type === 'audio') return null;

  if (clip.type === 'image') {
    const asset = assets.find(a => a.id === clip.assetId);
    if (asset && asset.url) {
      return (
        <div style={containerStyle}>
          <img
            src={asset.url}
            alt={asset.name}
            style={{
              maxWidth: projectWidth * 0.8,
              maxHeight: projectHeight * 0.8,
              objectFit: 'contain',
              userSelect: 'none',
            }}
            draggable={false}
            loading="lazy"
          />
        </div>
      );
    }
    return (
      <div style={{ ...containerStyle, ...centerFlex, width: 200, height: 120, background: 'rgba(59,130,246,0.15)', borderRadius: 8, border: '1px dashed rgba(59,130,246,0.4)' }}>
        <span style={{ color: '#60a5fa', fontSize: 12 }}>🖼️ {clip.name}</span>
      </div>
    );
  }

  if (clip.type === 'video') {
    const asset = assets.find(a => a.id === clip.assetId);
    if (asset && (asset.url || asset.thumbnail)) {
      return (
        <div style={containerStyle}>
          {asset.thumbnail ? (
            <img
              src={asset.thumbnail}
              alt={asset.name}
              style={{
                maxWidth: projectWidth * 0.8,
                maxHeight: projectHeight * 0.8,
                objectFit: 'contain',
                userSelect: 'none',
              }}
              draggable={false}
              loading="lazy"
            />
          ) : (
            <div style={{ ...centerFlex, width: 300, height: 180, background: 'rgba(139,92,246,0.15)', borderRadius: 8, border: '1px dashed rgba(139,92,246,0.4)', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 24 }}>🎥</span>
              <span style={{ color: '#a78bfa', fontSize: 12 }}>{asset.name}</span>
              <span style={{ color: '#7c3aed', fontSize: 10 }}>{clipProgress.toFixed(2)}s / {clip.duration.toFixed(1)}s</span>
            </div>
          )}
        </div>
      );
    }
    return (
      <div style={{ ...containerStyle, ...centerFlex, width: 300, height: 180, background: 'rgba(139,92,246,0.15)', borderRadius: 8, border: '1px dashed rgba(139,92,246,0.4)' }}>
        <span style={{ color: '#a78bfa', fontSize: 12 }}>🎥 {clip.name}</span>
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
            maxWidth: projectWidth * 0.85,
            userSelect: 'none',
            backgroundColor: clip.textData.backgroundColor || 'transparent',
            padding: clip.textData.backgroundColor ? '8px 16px' : 0,
            borderRadius: clip.textData.backgroundColor ? 6 : 0,
          }}
        >
          {clip.textData.content}
        </div>
      </div>
    );
  }

  if (clip.type === 'template' && clip.templateData) {
    return (
      <TemplateCanvasRenderer
        clip={clip}
        clipProgress={clipProgress}
        containerStyle={containerStyle}
        projectWidth={projectWidth}
        projectHeight={projectHeight}
      />
    );
  }

  return null;
});

const PreviewContent = memo(() => {
  const { project, assets } = useProjectStore();
  const { currentTime } = usePlayerStore();

  if (!project) return null;

  const visibleClips = useMemo(() => {
    const result: Clip[] = [];
    const clips = project.clips || {};
    for (const id in clips) {
      const clip = clips[id];
      if (currentTime >= clip.startTime && currentTime < clip.startTime + clip.duration) {
        result.push(clip);
      }
    }
    return result.sort((a, b) => {
      const aZ = a.style?.zIndex || 0;
      const bZ = b.style?.zIndex || 0;
      return aZ - bZ;
    });
  }, [project.clips, currentTime]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        backgroundColor: '#000',
        overflow: 'hidden',
      }}
    >
      {visibleClips.map(clip => (
        <ClipRenderer
          key={clip.id}
          clip={clip}
          currentTime={currentTime}
          assets={assets}
          projectWidth={project.width}
          projectHeight={project.height}
        />
      ))}
      {visibleClips.length === 0 && (
        <div
          style={{
            ...centerFlex,
            width: '100%',
            height: '100%',
            flexDirection: 'column',
            gap: 12,
            color: '#555',
            fontSize: 14,
          }}
        >
          <span style={{ fontSize: 36, opacity: 0.3 }}>🎬</span>
          <span>拖拽素材到轨道上即可预览</span>
          <span style={{ fontSize: 11, opacity: 0.5 }}>素材面板 → 拖拽 → 视频轨道</span>
        </div>
      )}
    </div>
  );
});

export const OptimizedPreviewPlayer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { project, updateClip } = useProjectStore();
  const { currentTime, isPlaying, setCurrentTime, setIsPlaying } = usePlayerStore();
  const { selectedClipId } = useUIStore();
  const selectedClip = selectedClipId ? (project?.clips || {})[selectedClipId] : null;

  const [isDragging, setIsDragging] = useState(false);
  const [interactionMode, setInteractionMode] = useState<'none' | 'move' | 'resize' | 'rotate'>('none');
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [initialTransform, setInitialTransform] = useState<any>(null);

  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!project) return;
    const assets = useProjectStore.getState().assets;
    audioEngine.loadResources(assets);
  }, [project]);

  useEffect(() => {
    if (!project) return;
    audioEngine.sync(currentTime, isPlaying, project);
  }, [currentTime, isPlaying, project]);

  useEffect(() => {
    if (!isPlaying) {
      audioEngine.pause();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    audioEngine.resume();
    lastTimeRef.current = performance.now();
    const fps = project?.fps || 30;

    const tick = (now: number) => {
      const dt = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      if (dt < 0 || dt > 1 || isNaN(dt)) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      setCurrentTime(prev => {
        const next = prev + dt;
        const maxTime = project?.duration || 30;
        if (next >= maxTime || isNaN(next)) return 0;
        return next;
      });

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, project?.fps, project?.duration, setCurrentTime]);

  const togglePlay = useCallback(() => {
    if (currentTime >= (project?.duration || 30)) setCurrentTime(0);
    setIsPlaying(!isPlaying);
  }, [isPlaying, setIsPlaying, currentTime, project?.duration, setCurrentTime]);

  const handleStop = useCallback(() => {
    audioEngine.stop();
    setIsPlaying(false);
    setCurrentTime(0);
  }, [setIsPlaying, setCurrentTime]);

  const handleMouseDown = useCallback((e: React.MouseEvent, mode: 'move' | 'resize' | 'rotate') => {
    if (!selectedClip) return;
    e.stopPropagation();
    setIsDragging(true);
    setInteractionMode(mode);
    setStartPos({ x: e.clientX, y: e.clientY });
    setInitialTransform({ ...selectedClip.transform });
  }, [selectedClip]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !selectedClip || !containerRef.current) return;

    const deltaX = e.clientX - startPos.x;
    const deltaY = e.clientY - startPos.y;

    const rect = containerRef.current.getBoundingClientRect();
    const scaleFactor = (project?.width || 1920) / rect.width;

    if (interactionMode === 'move') {
      updateClip(selectedClip.id, {
        transform: {
          ...initialTransform,
          x: (initialTransform.x || 0) + deltaX * scaleFactor,
          y: (initialTransform.y || 0) + deltaY * scaleFactor,
        },
      });
    } else if (interactionMode === 'rotate') {
      const rotationDelta = deltaX * 0.5;
      updateClip(selectedClip.id, {
        transform: { ...initialTransform, rotation: ((initialTransform.rotation || 0) + rotationDelta) % 360 },
      });
    } else if (interactionMode === 'resize') {
      const scaleDelta = deltaX * 0.005;
      updateClip(selectedClip.id, {
        transform: { ...initialTransform, scale: Math.max(0.1, (initialTransform.scale || 1) + scaleDelta) },
      });
    }
  }, [isDragging, selectedClip, startPos, interactionMode, initialTransform, project?.width, updateClip]);

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
      <div
        className="absolute inset-0 opacity-20"
        style={{ backgroundImage: 'radial-gradient(circle, #333 1px, transparent 1px)', backgroundSize: '20px 20px' }}
      ></div>

      <div
        ref={containerRef}
        className="relative shadow-2xl transition-all duration-300 ease-out w-full max-w-[95%]"
        style={{
          aspectRatio: `${project?.width || 1920} / ${project?.height || 1080}`,
          boxShadow: '0 20px 60px -20px rgba(0,0,0,0.8)',
        }}
      >
        <PreviewContent />

        {selectedClip && currentTime >= selectedClip.startTime && currentTime < selectedClip.startTime + selectedClip.duration && (
          <div
            className="absolute border border-brand-500"
            onMouseDown={(e) => handleMouseDown(e, 'move')}
            style={{
              left: '50%',
              top: '50%',
              width: 100,
              height: 100,
              transform: `translate(-50%, -50%) translate(${(selectedClip.transform?.x || 0) / 2}px, ${(selectedClip.transform?.y || 0) / 2}px) rotate(${selectedClip.transform?.rotation || 0}deg) scale(${selectedClip.transform?.scale || 1})`,
              cursor: 'move',
              boxShadow: '0 0 20px rgba(41, 151, 255, 0.3)',
            }}
          >
            {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((pos) => (
              <div
                key={pos}
                className="absolute w-3 h-3 bg-white border-2 border-brand-500 rounded-full shadow-lg cursor-nwse-resize"
                style={{
                  top: pos.includes('top') ? -6 : 'auto',
                  bottom: pos.includes('bottom') ? -6 : 'auto',
                  left: pos.includes('left') ? -6 : 'auto',
                  right: pos.includes('right') ? -6 : 'auto',
                }}
                onMouseDown={(e) => handleMouseDown(e, 'resize')}
              />
            ))}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-px h-8 bg-brand-500 pointer-events-none"></div>
            <div
              className="absolute -top-10 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-2 border-brand-500 rounded-full shadow-lg cursor-grab hover:scale-110 transition-transform"
              onMouseDown={(e) => handleMouseDown(e, 'rotate')}
            ></div>
          </div>
        )}
      </div>

      <div className="absolute bottom-8 glass-modal px-6 py-2.5 flex items-center gap-6 z-20 animate-fade-in">
        <button onClick={handleStop} className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
        </button>
        <button onClick={togglePlay} className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-lg shadow-white/20">
          {isPlaying ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="translate-x-0.5"><path d="M5 3l14 9-14 9V3z"/></svg>
          )}
        </button>
        <div className="text-sm font-mono font-medium min-w-[90px] text-center text-gray-200">
          {formatPlayerTime(currentTime)}
          <span className="text-xs text-gray-500"> / {formatPlayerTime(project?.duration || 30)}</span>
        </div>
        <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-0.5 rounded">{project?.fps || 30}fps</span>
      </div>
    </div>
  );
};

function formatPlayerTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}
