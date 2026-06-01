import React, { useRef, useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { useUIStore } from '../../store/useUIStore';
import { usePlayerStore } from '../../store/usePlayerStore';
import clsx from 'clsx';
import type { Clip } from '../../types/core';

const TrackHeader = memo(({ track, onRemove, onUpdate }: {
  track: any;
  onRemove: (id: string) => void;
  onUpdate: (id: string, changes: any) => void;
}) => (
  <div className="sticky left-0 z-30 w-[200px] shrink-0 bg-[#1E1E24] border-r border-white/10 p-2 flex flex-col justify-center gap-2 group shadow-[4px_0_10px_-2px_rgba(0,0,0,0.3)]">
    <div className="flex items-center gap-2">
      <div className={clsx("w-5 h-5 rounded flex items-center justify-center text-xs", track.type === 'video' ? "bg-blue-500/20 text-blue-400" : track.type === 'text' ? "bg-yellow-500/20 text-yellow-400" : "bg-green-500/20 text-green-400")}>
        {track.type === 'video' ? '🎬' : track.type === 'text' ? 'T' : '🎵'}
      </div>
      <span className="text-xs text-gray-300 font-medium truncate cursor-text hover:text-white" title={track.name}>
        {track.name}
      </span>
    </div>
    <div className="flex gap-2 pl-7 opacity-0 group-hover:opacity-100 transition-opacity">
      <button onClick={() => onUpdate(track.id, { visible: !track.visible })} className="text-gray-500 hover:text-white">
        {track.visible ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
        )}
      </button>
      <button onClick={() => onRemove(track.id)} className="text-gray-500 hover:text-red-400">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      </button>
    </div>
  </div>
));

const ClipItem = memo(({ clip, isSelected, onSelect, onDragStart, onContextMenu, onResizeStart, zoomLevel }: {
  clip: Clip;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDragStart: (e: React.DragEvent, clip: Clip) => void;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
  onResizeStart: (e: React.MouseEvent, clip: Clip, mode: 'start' | 'end') => void;
  zoomLevel: number;
}) => {
  const left = clip.startTime * zoomLevel;
  const width = Math.max(2, clip.duration * zoomLevel);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, clip)}
      onClick={(e) => { e.stopPropagation(); onSelect(clip.id); }}
      onContextMenu={(e) => onContextMenu(e, clip.id)}
      onMouseDown={(e) => e.stopPropagation()}
      className={clsx(
        "absolute top-2 bottom-2 rounded-lg cursor-pointer overflow-hidden border transition-all duration-200 select-none group/clip shadow-sm",
        isSelected ? "border-brand-500 z-10 shadow-glow ring-1 ring-brand-500/50" : "border-white/10 hover:border-white/30",
        clip.type === 'audio' ? "bg-gradient-to-r from-emerald-900/90 to-emerald-800/90" :
        clip.type === 'text' ? "bg-gradient-to-r from-yellow-900/90 to-orange-900/90" :
        clip.type === 'template' ? "bg-gradient-to-r from-purple-900/90 to-pink-900/90" :
        "bg-gradient-to-r from-blue-900/90 to-indigo-900/90"
      )}
      style={{ left, width }}
    >
      <div className="absolute inset-0 bg-white/5 pointer-events-none"></div>
      <div className="relative px-2 py-1 text-[10px] text-white/90 truncate font-medium flex items-center gap-1.5 h-full">
        {clip.type === 'image' ? '🖼️' : clip.type === 'video' ? '🎥' : clip.type === 'text' ? 'T' : clip.type === 'template' ? '⚡' : '🎵'} {clip.name}
        {clip.type === 'text' && clip.voiceOver && (
          <span className="inline-flex items-center gap-0.5 text-[9px] text-green-400 bg-green-500/20 px-1 rounded" title="已生成配音">
            🔊
          </span>
        )}
      </div>
      {clip.effects && clip.effects.length > 0 && (
        <div className="absolute bottom-1 right-1 flex gap-0.5">
          {clip.effects.map(e => <div key={e.id} className="w-1.5 h-1.5 rounded-full bg-yellow-400 shadow-sm" title={e.name}/>)}
        </div>
      )}
      {isSelected && (
        <>
          <div
            className="absolute left-0 top-0 bottom-0 w-3 cursor-ew-resize bg-white/20 hover:bg-brand-500/50 z-20 flex items-center justify-center transition-colors"
            onMouseDown={(e) => onResizeStart(e, clip, 'start')}
          >
            <div className="w-0.5 h-4 bg-white/50 rounded-full"></div>
          </div>
          <div
            className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize bg-white/20 hover:bg-brand-500/50 z-20 flex items-center justify-center transition-colors"
            onMouseDown={(e) => onResizeStart(e, clip, 'end')}
          >
            <div className="w-0.5 h-4 bg-white/50 rounded-full"></div>
          </div>
        </>
      )}
    </div>
  );
});

const TrackRow = memo(({ track, clips, selectedClipId, contentWidth, zoomLevel, onSelect, onDragStart, onContextMenu, onResizeStart, onDrop, onDragOver, onScrubStart }: {
  track: any;
  clips: Clip[];
  selectedClipId: string | null;
  contentWidth: number;
  zoomLevel: number;
  onSelect: (id: string) => void;
  onDragStart: (e: React.DragEvent, clip: Clip) => void;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
  onResizeStart: (e: React.MouseEvent, clip: Clip, mode: 'start' | 'end') => void;
  onDrop: (e: React.DragEvent, trackId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onScrubStart: (e: React.MouseEvent) => void;
}) => {
  return (
    <div className="flex h-24 border-b border-white/5 relative bg-[#151515]">
      <div className="sticky left-0 z-30 w-[200px] shrink-0 bg-[#1E1E24] border-r border-white/10 p-2 flex flex-col justify-center gap-2 group shadow-[4px_0_10px_-2px_rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-2">
          <div className={clsx("w-5 h-5 rounded flex items-center justify-center text-xs", track.type === 'video' ? "bg-blue-500/20 text-blue-400" : track.type === 'text' ? "bg-yellow-500/20 text-yellow-400" : "bg-green-500/20 text-green-400")}>
            {track.type === 'video' ? '🎬' : track.type === 'text' ? 'T' : '🎵'}
          </div>
          <span className="text-xs text-gray-300 font-medium truncate" title={track.name}>
            {track.name}
          </span>
        </div>
      </div>
      <div
        className="relative h-full bg-[#151515]"
        style={{ width: contentWidth }}
        onDragOver={onDragOver}
        onDrop={(e) => onDrop(e, track.id)}
        onMouseDown={onScrubStart}
      >
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{backgroundImage: 'linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: `${zoomLevel}px 100%`}}></div>
        {clips.map(clip => (
          <ClipItem
            key={clip.id}
            clip={clip}
            isSelected={selectedClipId === clip.id}
            onSelect={onSelect}
            onDragStart={onDragStart}
            onContextMenu={onContextMenu}
            onResizeStart={onResizeStart}
            zoomLevel={zoomLevel}
          />
        ))}
      </div>
    </div>
  );
});

export const OptimizedTimeline: React.FC = () => {
  const { project, addClip, removeClip, moveClip, removeEffectFromClip, addTrack, removeTrack, updateTrack, updateClip, addTemplateClip } = useProjectStore();
  const { selectedClipId, selectClip, zoomLevel, setZoomLevel } = useUIStore();
  const { currentTime, setCurrentTime } = usePlayerStore();
  const containerRef = useRef<HTMLDivElement>(null);

  const [resizingClipId, setResizingClipId] = useState<string | null>(null);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [initialDuration, setInitialDuration] = useState(0);
  const [initialStartTime, setInitialStartTime] = useState(0);
  const [resizeMode, setResizeMode] = useState<'start' | 'end' | null>(null);
  const [isLongPress, setIsLongPress] = useState(false);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, type: 'clip', targetId: string } | null>(null);

  const contentWidth = useMemo(() => {
    if (!project) return 0;
    return Math.max(window.innerWidth - 250, project.duration * zoomLevel + 500);
  }, [project?.duration, zoomLevel]);

  const trackClips = useMemo(() => {
    if (!project) return {};
    const clips: Record<string, Clip[]> = {};
    for (const track of project.tracks) {
      clips[track.id] = [];
    }
    for (const id in project.clips) {
      const clip = project.clips[id];
      if (!clips[clip.trackId]) clips[clip.trackId] = [];
      clips[clip.trackId].push(clip);
    }
    return clips;
  }, [project?.tracks, project?.clips]);

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    const handleGlobalUp = () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      setIsLongPress(false);
      setResizingClipId(null);
      setResizeMode(null);
      setIsScrubbing(false);
    };

    const handleGlobalMove = (e: MouseEvent) => {
      if (resizingClipId && isLongPress) {
        const deltaX = e.clientX - resizeStartX;
        const deltaTime = deltaX / zoomLevel;
        if (resizeMode === 'end') {
          const newDuration = Math.max(0.5, initialDuration + deltaTime);
          updateClip(resizingClipId, { duration: newDuration });
        } else if (resizeMode === 'start') {
          const newStartTime = Math.max(0, initialStartTime + deltaTime);
          const newDuration = Math.max(0.5, initialDuration - deltaTime);
          updateClip(resizingClipId, { startTime: newStartTime, duration: newDuration });
        }
      }
      if (isScrubbing) {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const scrollLeft = containerRef.current.scrollLeft;
        const absoluteX = e.clientX - rect.left + scrollLeft;
        if (e.clientX - rect.left < 200) return;
        const timelineX = absoluteX - 200;
        const time = Math.max(0, timelineX / zoomLevel);
        setCurrentTime(time);
      }
    };

    document.addEventListener('click', handleClickOutside);
    document.addEventListener('mouseup', handleGlobalUp);
    document.addEventListener('mousemove', handleGlobalMove);
    document.addEventListener('mouseleave', handleGlobalUp);

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('mouseup', handleGlobalUp);
      document.removeEventListener('mousemove', handleGlobalMove);
      document.removeEventListener('mouseleave', handleGlobalUp);
    };
  }, [resizingClipId, isLongPress, zoomLevel, resizeStartX, initialDuration, initialStartTime, resizeMode, isScrubbing, updateClip, setCurrentTime]);

  const handleDragStart = useCallback((e: React.DragEvent, clip: Clip) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const clickOffsetX = e.clientX - rect.left;
    const timeOffset = clickOffsetX / zoomLevel;
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'move-clip',
      clipId: clip.id,
      clipType: clip.type,
      timeOffset
    }));
    e.dataTransfer.effectAllowed = 'copyMove';
  }, [zoomLevel]);

  const handleDrop = useCallback((e: React.DragEvent, trackId: string) => {
    e.preventDefault();
    e.stopPropagation();
    let data;
    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (!dataStr) return;
      data = JSON.parse(dataStr);
    } catch (err) {
      console.error("Failed to parse drag data", err);
      return;
    }

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const scrollLeft = containerRef.current?.scrollLeft || 0;
    const offsetX = e.clientX - rect.left + scrollLeft - 200;
    const timeAtCursor = Math.max(0, offsetX / zoomLevel);

    const track = project?.tracks.find(t => t.id === trackId);
    if (!track) return;

    const checkType = (contentType: string) => {
      if (!contentType) return "❌ 未知素材类型";
      if (track.type === 'text' && contentType !== 'text') return "❌ 文本轨道只能放文本";
      if (track.type === 'audio' && contentType !== 'audio') return "❌ 音频轨道只能放音频";
      if (track.type === 'video' && (contentType === 'text' || contentType === 'audio')) return "❌ 视频轨道只能放视频/图片";
      return null;
    };

    if (data.type === 'move-clip') {
      const error = checkType(data.clipType);
      if (error) { alert(error); return; }
      let newStartTime = timeAtCursor;
      if (typeof data.timeOffset === 'number') {
        newStartTime = Math.max(0, timeAtCursor - data.timeOffset);
      }
      moveClip(data.clipId, trackId, newStartTime);
    } else if (data.type === 'template') {
      if (track.type !== 'video') {
        alert('❌ 模板只能添加到视频轨道');
        return;
      }
      addTemplateClip(data.templateId, trackId, timeAtCursor);
    } else {
      const { assetId, type } = data;
      const asset = type === 'text' ? null : null;
      if (type !== 'text' && !asset) {
        console.error("Asset not found:", assetId);
        return;
      }
      const contentType = type === 'text' ? 'text' : asset?.type;
      const error = checkType(contentType as string);
      if (error) { alert(error); return; }
      addClip(asset || null, trackId, timeAtCursor, type === 'text' ? 'text' : undefined);
    }
  }, [project, zoomLevel, addClip, moveClip, addTemplateClip]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleScrubStart = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsScrubbing(true);
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const scrollLeft = containerRef.current.scrollLeft;
    const absoluteX = e.clientX - rect.left + scrollLeft;
    if (e.clientX - rect.left < 200) return;
    const timelineX = absoluteX - 200;
    const time = Math.max(0, timelineX / zoomLevel);
    setCurrentTime(time);
  }, [zoomLevel, setCurrentTime]);

  const handleResizeStart = useCallback((e: React.MouseEvent, clip: Clip, mode: 'start' | 'end') => {
    e.stopPropagation();
    e.preventDefault();
    longPressTimerRef.current = setTimeout(() => {
      setIsLongPress(true);
      setResizingClipId(clip.id);
      setResizeStartX(e.clientX);
      setInitialDuration(clip.duration);
      setInitialStartTime(clip.startTime);
      setResizeMode(mode);
    }, 300);
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, type: 'clip', targetId });
  }, []);

  const handleMenuAction = useCallback((action: string) => {
    if (!contextMenu) return;
    const { targetId } = contextMenu;
    if (action === 'delete') {
      removeClip(targetId);
    }
    if (action === 'clearEffects') {
      const clip = project?.clips?.[targetId];
      if (clip && clip.effects) {
        clip.effects.forEach(e => removeEffectFromClip(clip.id, e.id));
      }
    }
    setContextMenu(null);
  }, [contextMenu, project?.clips, removeClip, removeEffectFromClip]);

  if (!project) return null;

  return (
    <div className="h-full w-full flex flex-col select-none overflow-hidden rounded-2xl bg-[#121212]">
      <div className="h-9 bg-[#1E1E24] border-b border-white/5 flex shrink-0 z-50 justify-between px-4 items-center shadow-sm">
        <div className="text-xs text-gray-500 font-medium">Timeline</div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 bg-black/30 rounded-lg p-0.5 border border-white/5">
            <button onClick={() => setZoomLevel(zoomLevel * 0.8)} className="p-1 px-2 hover:bg-white/10 rounded text-xs text-gray-400 hover:text-white transition-colors">-</button>
            <input
              type="range" min="5" max="200" step="5"
              value={zoomLevel}
              onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
              className="w-20 h-1 accent-brand-500 bg-white/10 rounded-lg appearance-none cursor-pointer"
            />
            <button onClick={() => setZoomLevel(zoomLevel * 1.2)} className="p-1 px-2 hover:bg-white/10 rounded text-xs text-gray-400 hover:text-white transition-colors">+</button>
          </div>
          <div className="w-px h-4 bg-white/10 mx-2"></div>
          <button onClick={() => addTrack('text')} className="text-[10px] bg-white/5 hover:bg-brand-500/20 hover:text-brand-400 px-2 py-1 rounded text-gray-300 transition-colors border border-white/5">T 文本</button>
          <button onClick={() => addTrack('video')} className="text-[10px] bg-white/5 hover:bg-blue-500/20 hover:text-blue-400 px-2 py-1 rounded text-gray-300 transition-colors border border-white/5">🎬 视频</button>
          <button onClick={() => addTrack('audio')} className="text-[10px] bg-white/5 hover:bg-green-500/20 hover:text-green-400 px-2 py-1 rounded text-gray-300 transition-colors border border-white/5">🎵 音频</button>
        </div>
      </div>

      <div className="flex-1 overflow-auto relative scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent" ref={containerRef}>
        <div className="sticky top-0 z-40 flex h-[30px] min-w-max border-b border-white/10 bg-[#1E1E24]/95 backdrop-blur-sm">
          <div className="sticky left-0 z-50 w-[200px] shrink-0 bg-[#1E1E24] border-r border-white/10 flex items-center justify-center text-[10px] font-mono text-brand-500 shadow-[4px_0_10px_-2px_rgba(0,0,0,0.5)]">
            {(() => {
              const t = typeof currentTime === 'number' && !isNaN(currentTime) ? currentTime : 0;
              try {
                return new Date(t * 1000).toISOString().substr(14, 8) + ':' + Math.floor((t % 1) * 100).toString().padStart(2, '0');
              } catch {
                return '00:00:00:00';
              }
            })()}
          </div>
          <div
            className="relative h-full bg-transparent cursor-pointer group"
            style={{ width: contentWidth }}
            onMouseDown={handleScrubStart}
          >
            <div className="absolute inset-0 opacity-30" style={{backgroundImage: 'linear-gradient(90deg, transparent 49px, #666 50px)', backgroundSize: '50px 100%'}}></div>
            <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'linear-gradient(90deg, transparent 9px, #444 10px)', backgroundSize: '10px 100%'}}></div>
            <div className="absolute top-0 bottom-0 w-px bg-brand-500 z-50" style={{ left: currentTime * zoomLevel }}>
              <div className="absolute -top-0 -left-[5px] w-[11px] h-[12px] bg-brand-500 rounded-b-sm shadow-glow transform group-hover:scale-110 transition-transform"></div>
            </div>
          </div>
        </div>

        <div className="min-w-max pb-32 relative">
          <div
            className="absolute top-0 bottom-0 w-px bg-brand-500 pointer-events-none z-20 shadow-[0_0_15px_rgba(41,151,255,0.4)]"
            style={{ left: 200 + currentTime * zoomLevel }}
          ></div>

          {project.tracks.map(track => (
            <TrackRow
              key={track.id}
              track={track}
              clips={trackClips[track.id] || []}
              selectedClipId={selectedClipId}
              contentWidth={contentWidth}
              zoomLevel={zoomLevel}
              onSelect={selectClip}
              onDragStart={handleDragStart}
              onContextMenu={handleContextMenu}
              onResizeStart={handleResizeStart}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onScrubStart={handleScrubStart}
            />
          ))}
        </div>
      </div>

      {contextMenu && (
        <div
          className="fixed bg-[#1E1E24] border border-white/10 shadow-2xl rounded-lg py-1 z-[100] w-36 animate-fade-in"
          style={{ left: Math.min(contextMenu.x, window.innerWidth - 160), top: Math.min(contextMenu.y, window.innerHeight - 100) }}
          onClick={(e) => e.stopPropagation()}
        >
          {(() => {
            const clip = project.clips?.[contextMenu.targetId];
            const hasEffects = clip && clip.effects && clip.effects.length > 0;
            return (
              <>
                {hasEffects && (
                  <button
                    onClick={() => handleMenuAction('clearEffects')}
                    className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-brand-500/20 hover:text-brand-400 transition-colors flex items-center gap-2"
                  >
                    <span>✨</span>
                    <span>清除预设</span>
                  </button>
                )}
                <button
                  onClick={() => handleMenuAction('delete')}
                  className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/20 transition-colors flex items-center gap-2"
                >
                  <span>🗑️</span>
                  <span>删除</span>
                </button>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
};
