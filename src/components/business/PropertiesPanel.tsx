import React, { useState, useCallback, useRef, memo } from 'react';
import clsx from 'clsx';
import { useProjectStore } from '../../store/useProjectStore';
import { useUIStore } from '../../store/useUIStore';
import { usePlayerStore } from '../../store/usePlayerStore';
import { PRESETS } from '../../engine/presets';
import { getTemplate } from '../../engine/templates';
import { DEFAULT_TTS_CONFIG } from '../../services/indexTtsService';
import { getSortedTrackClips, getTrimLimits } from '../../modules/timeline/placement';

import { GRADING_LOOKS, isGradingNeutral } from '../../engine/color/grading';
import { suggestMaskSize } from '../../engine/mask/maskEngine';
import { smartMattingEngine } from '../../engine/mask/smartMatting';
import { DEFAULT_MASK_CONFIG, DEFAULT_SMART_MATTING_CONFIG, type MaskConfig, type MaskShape, type SmartMattingConfig } from '../../modules/shared/types';
import type { ColorGrading } from '../../types/core';
import SpeedCurveEditor from './SpeedCurveEditor';
import { curveAverage, normalizePoints, hasSpeedCurve } from '../../engine/timing/speedCurve';
import type { Clip, KeyframeChannel, KeyframeEasing } from '../../types/core';

/** 滑杆/输入框开始交互时打一次撤销快照（一个手势=一步历史） */
function useGestureHistoryMarker() {
  return useCallback((e: React.PointerEvent | React.FocusEvent) => {
    const el = e.target as HTMLElement;
    const tag = el?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
      useProjectStore.getState().markHistory();
    }
  }, []);
}

// ==================== 关键帧菱形开关 ====================
const CHANNEL_LABELS: Record<KeyframeChannel, string> = {
  x: 'X', y: 'Y', scale: '缩放', rotation: '旋转', opacity: '不透明度',
  z: '深度Z', rotateX: '翻转X', rotateY: '翻转Y',
};

function channelValue(clip: Clip, ch: KeyframeChannel): number {
  switch (ch) {
    case 'x': return clip.transform.x;
    case 'y': return clip.transform.y;
    case 'scale': return clip.transform.scale;
    case 'rotation': return clip.transform.rotation;
    case 'opacity': return clip.style?.opacity ?? 1;
    case 'z': return clip.transform.depthZ ?? 0;
    case 'rotateX': return clip.transform.rotateX ?? 0;
    case 'rotateY': return clip.transform.rotateY ?? 0;
  }
}

const KfDiamond = memo(({ clip, channel }: { clip: Clip; channel: KeyframeChannel }) => {
  const t = usePlayerStore(s => s.currentTime);
  const fps = useProjectStore(s => s.project.fps) || 30;

  const rel = t - clip.startTime;
  const inRange = rel >= -1 / fps && rel <= clip.duration + 1 / fps;
  const frameTime = Math.round(Math.min(Math.max(rel, 0), clip.duration) * fps) / fps;

  const frames = clip.keyframes?.[channel] || [];
  const hit = frames.find(f => Math.abs(f.time - frameTime) < 0.5 / fps);
  const enabled = frames.length > 0;

  if (!inRange) {
    return <span className={clsx("text-[9px]", enabled ? "opacity-70" : "opacity-20")} title="播放头不在片段内">◆</span>;
  }

  const toggle = () => {
    useProjectStore.getState().markHistory();
    const cur = channelValue(clip, channel);
    let next = [...frames];
    if (hit) next = next.filter(f => f.id !== hit.id);
    else next.push({ id: crypto.randomUUID(), time: frameTime, value: cur, easing: 'ease_in_out' });

    const keyframes = { ...(clip.keyframes || {}) };
    if (next.length) keyframes[channel] = next.sort((a, b) => a.time - b.time);
    else delete keyframes[channel];
    useProjectStore.getState().updateClip(clip.id, { keyframes });
  };

  const setEasing = (easing: KeyframeEasing) => {
    if (!hit) return;
    const next = frames.map(f => f.id === hit.id ? { ...f, easing } : f);
    useProjectStore.getState().updateClip(clip.id, { keyframes: { ...(clip.keyframes || {}), [channel]: next } });
  };

  return (
    <span className="inline-flex items-center gap-1">
      <button onClick={toggle}
        title={hit ? '移除此处关键帧' : enabled ? '在此时间打关键帧' : '启用关键帧'}
        className={clsx("leading-none transition-colors",
          hit ? "text-brand-400 hover:text-brand-300" : enabled ? "text-gray-500 hover:text-brand-400" : "text-gray-600 hover:text-gray-300")}
      >
        ◆
      </button>
      {enabled && !hit && <span className="w-[3px] h-[3px] rounded-full bg-brand-500" title="通道已启用关键帧" />}
      {hit && (
        <select value={hit.easing} onChange={e => setEasing(e.target.value as KeyframeEasing)}
          className="bg-black/40 border border-white/10 rounded text-[9px] px-0.5 py-0 outline-none"
          title="此段缓动">
          {(['linear', 'ease_in', 'ease_out', 'ease_in_out', 'hold'] as const).map(k =>
            <option key={k} value={k}>{ { linear: '线性', ease_in: '缓入', ease_out: '缓出', ease_in_out: '缓入出', hold: '定格' }[k] }</option>)}
        </select>
      )}
    </span>
  );
});

// ==================== 小控件 ====================
const GradingSlider = memo(({ label, value, min, max, step = 0.01, onChange, onGesture, display }: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  onGesture: (e: React.PointerEvent) => void;
  display?: string;
}) => (
  <div className="space-y-1">
    <div className="flex justify-between items-center">
      <label className="text-gray-400">{label}</label>
      <span className={clsx("text-[10px]", Math.abs(value) > 1e-6 ? "text-brand-300" : "text-gray-500")}>
        {display ?? (Math.abs(value) > 1e-6 ? String(Math.round(value * 100) / 100) : '中性')}
      </span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value}
      onPointerDown={onGesture}
      onChange={e => onChange(parseFloat(e.target.value))}
      className="w-full accent-brand-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer" />
  </div>
));

const SpaceRow = memo(({ label, tip, value, min, max, step = 1, suffix = '', onChange, markGesture }: {
  label: React.ReactNode;
  tip?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (v: number) => void;
  markGesture: (e: React.PointerEvent) => void;
}) => {
  const active = Math.abs(value) > 1e-4;
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <label className="text-gray-400 flex items-center gap-1" title={tip}>{label}</label>
        <span className={clsx("text-[10px]", active ? "text-brand-300" : "text-gray-500")}>
          {Math.round(value * 10) / 10}{suffix}
        </span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onPointerDown={markGesture}
        onChange={e => onChange(parseFloat(e.target.value))}
        className={clsx("w-full h-1 rounded-lg appearance-none cursor-pointer", active ? "accent-cyan-400" : "accent-white/40")} />
    </div>
  );
});

const NumberRow = memo(({ label, value, onChange, onFocus }: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  onFocus: (e: React.FocusEvent) => void;
}) => (
  <div className="space-y-1">
    <label className="text-gray-400 text-[10px]">{label}</label>
    <input type="number" value={value} step="any"
      onFocus={onFocus}
      onChange={e => onChange(parseFloat(e.target.value) || 0)}
      className="input-glass w-full px-2 py-1.5" />
  </div>
));

// ==================== 关键帧列表 ====================
const KeyframeList = memo(({ clip }: { clip: Clip }) => {
  const entries = Object.entries(clip.keyframes || {}).filter(([, v]) => v?.length) as [KeyframeChannel, NonNullable<Clip['keyframes']>[KeyframeChannel]][];
  if (!entries.length) return null;
  void CHANNEL_LABELS;

  return (
    <div className="space-y-2 mt-2">
      {entries.map(([ch, frames]) => (
        <div key={ch} className="bg-black/20 rounded-lg p-2 space-y-1">
          <div className="text-brand-400 font-bold text-[10px]">{CHANNEL_LABELS[ch]} · {frames.length} 帧</div>
          {frames.map(f => (
            <div key={f.id} className="flex items-center gap-1.5 text-[10px]">
              <button
                className="text-gray-500 hover:text-brand-400 shrink-0"
                title="跳转到该帧"
                onClick={() => usePlayerStore.getState().setCurrentTime(clip.startTime + f.time)}
              >▶</button>
              <span className="text-gray-500 w-10">{f.time.toFixed(2)}s</span>
              <input type="number" value={Math.round(f.value * 100) / 100} step="any"
                onFocus={() => useProjectStore.getState().markHistory()}
                onChange={(e) => {
                  const v = parseFloat(e.target.value) || 0;
                  const next = frames.map(x => x.id === f.id ? { ...x, value: v } : x);
                  useProjectStore.getState().updateClip(clip.id, { keyframes: { ...(clip.keyframes || {}), [ch]: next } });
                }}
                className="input-glass w-full px-1 py-0.5 min-w-0" />
              <button
                className="text-red-400/70 hover:text-red-400 shrink-0"
                title="删除关键帧"
                onClick={() => {
                  useProjectStore.getState().markHistory();
                  const next = frames.filter(x => x.id !== f.id);
                  const keyframes = { ...(clip.keyframes || {}) };
                  if (next.length) keyframes[ch] = next; else delete keyframes[ch];
                  useProjectStore.getState().updateClip(clip.id, { keyframes });
                }}
              >✕</button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
});

export const PropertiesPanel: React.FC = () => {
  const project = useProjectStore(s => s.project);
  const updateClip = useProjectStore(s => s.updateClip);
  const updateEffectParams = useProjectStore(s => s.updateEffectParams);
  const removeEffectFromClip = useProjectStore(s => s.removeEffectFromClip);
  const updateTemplateParams = useProjectStore(s => s.updateTemplateParams);
  const generateVoiceOver = useProjectStore(s => s.generateVoiceOver);
  const removeVoiceOver = useProjectStore(s => s.removeVoiceOver);
  const selectedClipId = useUIStore(s => s.selectedClipId);
  const selectedClip = selectedClipId ? project?.clips[selectedClipId] : null;
  const markGestureHistory = useGestureHistoryMarker();

  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [voiceSpeed, setVoiceSpeed] = useState(DEFAULT_TTS_CONFIG.speed);
  const [referenceAudioFile, setReferenceAudioFile] = useState<File | null>(null);
  const [referenceAudioUrl, setReferenceAudioUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const voicePlayRef = useRef<HTMLAudioElement | null>(null);

  const handleReferenceAudioSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/') && !file.name.match(/\.(wav|mp3|ogg|flac|aac|m4a|wma)$/i)) {
      alert('请选择音频文件 (wav, mp3, ogg, flac, aac, m4a)');
      return;
    }

    setReferenceAudioFile(file);

    if (referenceAudioUrl) {
      URL.revokeObjectURL(referenceAudioUrl);
    }
    const url = URL.createObjectURL(file);
    setReferenceAudioUrl(url);
  }, [referenceAudioUrl]);

  const handleClearReferenceAudio = useCallback(() => {
    setReferenceAudioFile(null);
    if (referenceAudioUrl) {
      URL.revokeObjectURL(referenceAudioUrl);
    }
    setReferenceAudioUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [referenceAudioUrl]);

  const handleGenerateVoice = useCallback(async () => {
    if (!selectedClip || !selectedClip.textData?.content) return;
    if (!referenceAudioFile) {
      alert('请先上传参考音频文件');
      return;
    }

    setIsGeneratingVoice(true);
    try {
      await generateVoiceOver(selectedClip.id, referenceAudioFile, voiceSpeed);
      console.log('Voice generated successfully');
    } catch (error: any) {
      console.error('Voice generation failed:', error);
      const msg = error?.message || '未知错误';
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        alert('配音生成失败：无法连接到配音服务。\n请确保已启动：\n1. IndexTTS API: python api_server.py --port 8080\n2. 代理服务: python index_tts_server.py');
      } else {
        alert(`配音生成失败：${msg}`);
      }
    } finally {
      setIsGeneratingVoice(false);
    }
  }, [selectedClip, referenceAudioFile, voiceSpeed, generateVoiceOver]);

  const handlePlayVoice = useCallback(() => {
    if (!selectedClip?.voiceOver?.audioSource) return;

    if (voicePlayRef.current) {
      voicePlayRef.current.pause();
      voicePlayRef.current = null;
    }

    const audio = new Audio(selectedClip.voiceOver.audioSource);
    voicePlayRef.current = audio;
    setIsPlayingVoice(true);
    audio.play();
    audio.onended = () => {
      setIsPlayingVoice(false);
      voicePlayRef.current = null;
    };
    audio.onerror = () => {
      setIsPlayingVoice(false);
      voicePlayRef.current = null;
      alert('音频播放失败');
    };
  }, [selectedClip]);

  const handleStopVoice = useCallback(() => {
    if (voicePlayRef.current) {
      voicePlayRef.current.pause();
      voicePlayRef.current = null;
    }
    setIsPlayingVoice(false);
  }, []);

  const handleRemoveVoice = useCallback(() => {
    if (!selectedClip) return;
    removeVoiceOver(selectedClip.id);
  }, [selectedClip, removeVoiceOver]);

  const handleTransformChange = useCallback((key: string, value: number) => {
    if (!selectedClip) return;
    updateClip(selectedClip.id, {
      transform: { ...selectedClip.transform, [key]: value }
    });
  }, [selectedClip, updateClip]);

  // ======== 空间字段(复用 Transform 合并逻辑) ========
  const updateTransformField = handleTransformChange;

  const handleTextChange = useCallback((key: string, value: any) => {
    if (!selectedClip?.textData) return;
    updateClip(selectedClip.id, {
      textData: { ...selectedClip.textData, [key]: value }
    });
  }, [selectedClip, updateClip]);

  const handleEffectDurationChange = useCallback((effectId: string, duration: number) => {
    if (!selectedClip) return;
    const newEffects = (selectedClip.effects || []).map(fx =>
      fx.id === effectId ? { ...fx, duration } : fx
    );
    updateClip(selectedClip.id, { effects: newEffects });
  }, [selectedClip, updateClip]);

  const handleEffectParamChange = useCallback((effectId: string, key: string, value: number) => {
    if (!selectedClip) return;
    updateEffectParams(selectedClip.id, effectId, { [key]: value });
  }, [selectedClip, updateEffectParams]);

  const handleOpacityChange = useCallback((opacity: number) => {
    if (!selectedClip) return;
    updateClip(selectedClip.id, {
      style: { ...selectedClip.style, opacity }
    });
  }, [selectedClip, updateClip]);

  // ======== 媒体：变速 / 音量 / 淡入淡出 ========
  const handleSpeedChange = useCallback((speed: number) => {
    if (!selectedClip || !project) return;
    const clampedSpeed = Math.max(0.25, Math.min(4, speed));
    // 源时长不变，按新速度换算新时长；右邻居限制内钳制
    const srcDuration = selectedClip.duration * (selectedClip.speed ?? 1);
    let newDur = srcDuration / clampedSpeed;

    if (selectedClip.assetId) {
      const others = getSortedTrackClips(project.clips, selectedClip.trackId, selectedClip.id);
      const limits = getTrimLimits(others, selectedClip);
      if (isFinite(limits.maxEnd)) {
        const maxAllowed = limits.maxEnd - selectedClip.startTime;
        newDur = Math.min(newDur, Math.max(0.1, maxAllowed));
      }
    }
    updateClip(selectedClip.id, { speed: clampedSpeed, duration: newDur });
  }, [selectedClip, project, updateClip]);

  const handleVolumeChange = useCallback((volume: number) => {
    if (!selectedClip) return;
    updateClip(selectedClip.id, { volume });
  }, [selectedClip, updateClip]);

  const handleFadeChange = useCallback((key: 'audioFadeIn' | 'audioFadeOut', secs: number) => {
    if (!selectedClip) return;
    const maxFade = Math.max(0, selectedClip.duration / 2);
    updateClip(selectedClip.id, { [key]: Math.max(0, Math.min(secs, maxFade)) });
  }, [selectedClip, updateClip]);

  // ======== 调色 ========
  const handleGradingChange = useCallback((patch: Partial<ColorGrading>) => {
    if (!selectedClip) return;
    updateClip(selectedClip.id, {
      colorGrading: { ...(selectedClip.colorGrading ?? {}), ...patch }
    });
  }, [selectedClip, updateClip]);


  const handleRemoveEffect = useCallback((effectId: string) => {
    if (!selectedClip) return;
    removeEffectFromClip(selectedClip.id, effectId);
  }, [selectedClip, removeEffectFromClip]);

  // ======== 蒙版 ========
  const handleMaskChange = useCallback((patch: Partial<MaskConfig>) => {
    if (!selectedClip) return;
    updateClip(selectedClip.id, {
      mask: { ...DEFAULT_MASK_CONFIG, ...(selectedClip.mask ?? {}), enabled: true, ...patch },
    } as any);
  }, [selectedClip, updateClip]);

  const handleMaskShapeChange = useCallback((shape: MaskShape) => {
    if (!selectedClip) return;
    const size = suggestMaskSize(shape);
    updateClip(selectedClip.id, {
      mask: { ...DEFAULT_MASK_CONFIG, ...(selectedClip.mask ?? {}), enabled: true, shape, ...size },
    } as any);
  }, [selectedClip, updateClip]);

  // ======== 智能抠像 ========
  const [mattingState, setMattingState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');

  const handleMattingToggle = useCallback((enabled: boolean) => {
    if (!selectedClip) return;
    if (enabled) {
      updateClip(selectedClip.id, {
        chromaKey: { ...DEFAULT_SMART_MATTING_CONFIG, ...(selectedClip.chromaKey ?? {}), enabled: true },
      } as any);
      setMattingState('loading');
      smartMattingEngine.checkAvailability().then(ok => setMattingState(ok ? 'ready' : 'error'));
    } else {
      updateClip(selectedClip.id, { chromaKey: { ...DEFAULT_SMART_MATTING_CONFIG, ...(selectedClip.chromaKey ?? {}), enabled: false } } as any);
      setMattingState('idle');
    }
  }, [selectedClip, updateClip]);

  const handleMattingChange = useCallback((patch: Partial<SmartMattingConfig>) => {
    if (!selectedClip) return;
    updateClip(selectedClip.id, {
      chromaKey: { ...DEFAULT_SMART_MATTING_CONFIG, ...(selectedClip.chromaKey ?? {}), enabled: true, ...patch },
    } as any);
  }, [selectedClip, updateClip]);

  const handleTemplateParamChange = useCallback((key: string, value: any) => {
    if (!selectedClip || selectedClip.type !== 'template') return;
    updateTemplateParams(selectedClip.id, { [key]: value });
  }, [selectedClip, updateTemplateParams]);

  const template = selectedClip?.type === 'template' && selectedClip.templateData 
    ? getTemplate(selectedClip.templateData.templateId)
    : null;

  if (!selectedClip) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-500 gap-3 opacity-60">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <span className="text-xs">Select a clip to edit properties</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-4 text-xs h-full overflow-y-auto">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 rounded bg-brand-500/20 flex items-center justify-center text-brand-500">
          {selectedClip.type === 'text' ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>
          ) : selectedClip.type === 'template' ? (
            <span className="text-lg">
              {template?.category === 'ui' && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>}
              {template?.category === 'code' && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>}
              {template?.category === 'text' && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}
              {template?.category === 'effect' && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>}
              {template?.category === 'other' && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>}
            </span>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-white text-sm truncate">{selectedClip.name}</div>
          <div className="text-[10px] text-gray-500 uppercase">{selectedClip.type} Clip</div>
        </div>
      </div>

      <div className="space-y-6">
        {selectedClip.type === 'text' && selectedClip.textData && (
          <div className="space-y-3">
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Text Properties</div>
            <div className="space-y-1">
              <label className="text-gray-400">Content</label>
              <textarea
                rows={2}
                className="input-glass w-full px-2 py-1.5 resize-none"
                value={selectedClip.textData.content}
                onChange={(e) => handleTextChange('content', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-gray-400">Font Size</label>
                <input
                  type="number"
                  className="input-glass w-full px-2 py-1.5"
                  value={selectedClip.textData.fontSize}
                  onChange={(e) => handleTextChange('fontSize', parseInt(e.target.value))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-gray-400">Color</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    className="w-8 h-8 rounded cursor-pointer border-none bg-transparent"
                    value={selectedClip.textData.color}
                    onChange={(e) => handleTextChange('color', e.target.value)}
                  />
                  <span className="text-gray-400 text-[10px]">{selectedClip.textData.color}</span>
                </div>
              </div>
            </div>

            {/* 配音功能区 */}
            <div className="space-y-3 mt-4">
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">配音 (Index-TTS)</div>

              {/* 参考音频上传 */}
              <div className="space-y-1">
                <label className="text-gray-400">参考音频 <span className="text-red-400">*</span></label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*,.wav,.mp3,.ogg,.flac,.aac,.m4a"
                  onChange={handleReferenceAudioSelect}
                  className="hidden"
                />
                {!referenceAudioFile ? (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 px-3 py-3 bg-black/30 hover:bg-black/40 border border-dashed border-white/20 hover:border-brand-500/50 rounded-lg text-gray-400 hover:text-brand-400 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <span>上传参考音频</span>
                  </button>
                ) : (
                  <div className="bg-black/30 rounded-lg p-2 space-y-2">
                    <div className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-500 shrink-0">
                        <path d="M9 18V5l12-2v13" />
                        <circle cx="6" cy="18" r="3" />
                        <circle cx="18" cy="16" r="3" />
                      </svg>
                      <span className="text-gray-300 text-[10px] truncate flex-1" title={referenceAudioFile.name}>
                        {referenceAudioFile.name}
                      </span>
                      <span className="text-gray-500 text-[10px] shrink-0">
                        {(referenceAudioFile.size / 1024).toFixed(0)}KB
                      </span>
                    </div>
                    {referenceAudioUrl && (
                      <audio
                        src={referenceAudioUrl}
                        controls
                        className="w-full h-8 opacity-80"
                        style={{ filter: 'invert(1) hue-rotate(180deg)' }}
                      />
                    )}
                    <button
                      onClick={handleClearReferenceAudio}
                      className="text-[10px] text-red-400 hover:text-red-300 transition-colors"
                    >
                      更换参考音频
                    </button>
                  </div>
                )}
              </div>

              {/* 语速调节 */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <label className="text-gray-400">语速</label>
                  <span className="text-gray-300">{voiceSpeed.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={voiceSpeed}
                  onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))}
                  disabled={isGeneratingVoice}
                  className="w-full accent-brand-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* 生成/播放/删除按钮 */}
              <div className="flex gap-2">
                {!selectedClip.voiceOver ? (
                  <button
                    onClick={handleGenerateVoice}
                    disabled={isGeneratingVoice || !selectedClip.textData?.content || !referenceAudioFile}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-brand-500 hover:bg-brand-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white transition-colors"
                  >
                    {isGeneratingVoice ? (
                      <>
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>生成中...</span>
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                        </svg>
                        <span>生成配音</span>
                      </>
                    )}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={isPlayingVoice ? handleStopVoice : handlePlayVoice}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white transition-colors"
                    >
                      {isPlayingVoice ? (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="6" y="4" width="4" height="16" />
                            <rect x="14" y="4" width="4" height="16" />
                          </svg>
                          <span>停止</span>
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                          <span>预览配音</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleRemoveVoice}
                      className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-colors"
                      title="删除配音"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </>
                )}
              </div>

              {/* 配音信息显示 */}
              {selectedClip.voiceOver && (
                <div className="bg-black/20 rounded-lg p-2 text-[10px] text-gray-400 space-y-1">
                  <div className="flex justify-between">
                    <span>音频时长:</span>
                    <span className="text-gray-300">{selectedClip.voiceOver.audioDuration.toFixed(2)}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span>文本时长:</span>
                    <span className="text-gray-300">{selectedClip.duration.toFixed(2)}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span>参考音频:</span>
                    <span className="text-gray-300 truncate ml-2" title={selectedClip.voiceOver.referenceAudioName || selectedClip.voiceOver.voice}>
                      {selectedClip.voiceOver.referenceAudioName || selectedClip.voiceOver.voice}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>语速:</span>
                    <span className="text-gray-300">{selectedClip.voiceOver.speed}x</span>
                  </div>
                  {selectedClip.voiceOver.linkedClipId && (
                    <div className="flex justify-between">
                      <span>音频轨道:</span>
                      <span className="text-green-400">已关联</span>
                    </div>
                  )}
                </div>
              )}

              {!referenceAudioFile && !selectedClip.voiceOver && (
                <div className="text-[10px] text-gray-600 bg-black/20 rounded-lg p-2">
                  请上传参考音频文件后点击"生成配音"。参考音频决定了生成语音的音色和风格。
                </div>
              )}
            </div>

            <div className="w-full h-px bg-white/5 my-2" />
          </div>
        )}

        <div className="space-y-3">
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Transform</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-gray-400 text-[10px] flex items-center gap-1">Position X <KfDiamond clip={selectedClip} channel="x" /></label>
              <input type="number" value={Math.round(selectedClip.transform.x)} onChange={e => handleTransformChange('x', parseFloat(e.target.value))} className="input-glass w-full px-2 py-1.5" />
            </div>
            <div className="space-y-1">
              <label className="text-gray-400 text-[10px] flex items-center gap-1">Position Y <KfDiamond clip={selectedClip} channel="y" /></label>
              <input type="number" value={Math.round(selectedClip.transform.y)} onChange={e => handleTransformChange('y', parseFloat(e.target.value))} className="input-glass w-full px-2 py-1.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-gray-400 flex items-center gap-1">Scale <KfDiamond clip={selectedClip} channel="scale" /></label>
              <span className="text-gray-300">{selectedClip.transform.scale.toFixed(2)}x</span>
            </div>
            <input type="range" min="0.1" max="3" step="0.05" value={selectedClip.transform.scale} onChange={e => handleTransformChange('scale', parseFloat(e.target.value))} className="w-full accent-brand-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer" />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-gray-400 flex items-center gap-1">Rotation <KfDiamond clip={selectedClip} channel="rotation" /></label>
              <span className="text-gray-300">{Math.round(selectedClip.transform.rotation)} deg</span>
            </div>
            <input type="range" min="0" max="360" step="1" value={selectedClip.transform.rotation} onChange={e => handleTransformChange('rotation', parseFloat(e.target.value))} className="w-full accent-brand-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer" />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-gray-400 flex items-center gap-1">Opacity <KfDiamond clip={selectedClip} channel="opacity" /></label>
              <span className="text-gray-300">{(selectedClip.style.opacity * 100).toFixed(0)}%</span>
            </div>
            <input type="range" min="0" max="1" step="0.01" value={selectedClip.style.opacity} onChange={e => handleOpacityChange(parseFloat(e.target.value))} className="w-full accent-brand-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer" />
          </div>
        </div>

        {/* 关键帧列表 */}
        {selectedClip.type !== 'template' && (
          <KeyframeList clip={selectedClip} />
        )}

        <div className="w-full h-px bg-white/5 my-2" />

        {/* 调色（视频/图片/模板） */}
        {(selectedClip.type === 'video' || selectedClip.type === 'image' || selectedClip.type === 'template') && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">调色</span>
              {!isGradingNeutral(selectedClip.colorGrading) && (
                <button
                  onClick={() => { useProjectStore.getState().markHistory(); updateClip(selectedClip.id, { colorGrading: {} }); }}
                  className="text-[10px] text-gray-500 hover:text-red-400 transition-colors"
                >重置</button>
              )}
            </div>

            {/* 风格预设 */}
            <div className="grid grid-cols-4 gap-1">
              {GRADING_LOOKS.map(look => {
                const activeId = GRADING_LOOKS.find(l => l.id !== 'none' &&
                  JSON.stringify(l.params) === JSON.stringify(selectedClip.colorGrading ?? {}))?.id;
                return (
                  <button key={look.id}
                    onClick={() => {
                      useProjectStore.getState().markHistory();
                      handleGradingChange({ ...look.params });
                    }}
                    title={look.name}
                    className={clsx("py-1 rounded text-[10px] border truncate transition-colors",
                      activeId === look.id
                        ? "border-brand-400 text-brand-300 bg-brand-500/15"
                        : look.id === 'none'
                          ? "border-white/10 text-gray-500 hover:text-gray-300"
                          : "border-white/10 text-gray-300 hover:border-brand-400/50 hover:bg-brand-500/5")}
                  >
                    {look.name}
                  </button>
                );
              })}
            </div>

            <GradingSlider label="曝光" value={selectedClip.colorGrading?.exposure ?? 0} min={-1} max={1}
              onChange={v => handleGradingChange({ exposure: v })} onGesture={markGestureHistory}
              display={(selectedClip.colorGrading?.exposure ?? 0) === 0 ? undefined : `${((1 + (selectedClip.colorGrading?.exposure ?? 0)) * 100).toFixed(0)}%`} />
            <GradingSlider label="对比" value={selectedClip.colorGrading?.contrast ?? 0} min={-1} max={1}
              onChange={v => handleGradingChange({ contrast: v })} onGesture={markGestureHistory} />
            <GradingSlider label="饱和" value={selectedClip.colorGrading?.saturation ?? 0} min={-1} max={1}
              onChange={v => handleGradingChange({ saturation: v })} onGesture={markGestureHistory} />
            <GradingSlider label="色温" value={selectedClip.colorGrading?.temperature ?? 0} min={-100} max={100} step={1}
              onChange={v => handleGradingChange({ temperature: v })} onGesture={markGestureHistory} />
            <GradingSlider label="色调" value={selectedClip.colorGrading?.tint ?? 0} min={-100} max={100} step={1}
              onChange={v => handleGradingChange({ tint: v })} onGesture={markGestureHistory} />
            <GradingSlider label="色相" value={selectedClip.colorGrading?.hueRotate ?? 0} min={-180} max={180} step={1}
              onChange={v => handleGradingChange({ hueRotate: v })} onGesture={markGestureHistory} />
            <GradingSlider label="褪色" value={selectedClip.colorGrading?.fade ?? 0} min={0} max={1}
              onChange={v => handleGradingChange({ fade: v })} onGesture={markGestureHistory} />
          </div>
        )}


        {/* 蒙版（视觉类片段） */}
        {(selectedClip.type === 'video' || selectedClip.type === 'image' || selectedClip.type === 'template') && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">蒙版</span>
              {selectedClip.mask?.enabled && (
                <button
                  onClick={() => { useProjectStore.getState().markHistory(); updateClip(selectedClip.id, { mask: { ...DEFAULT_MASK_CONFIG, ...(selectedClip.mask ?? {}), enabled: false } } as any); }}
                  className="text-[10px] text-gray-500 hover:text-red-400 transition-colors"
                >重置</button>
              )}
            </div>

            {/* 形状选择 */}
            <div className="grid grid-cols-6 gap-1">
              {([
                { id: 'rectangle', label: '矩形', icon: <rect x="4" y="6" width="16" height="12" rx="1" /> },
                { id: 'circle', label: '圆形', icon: <circle cx="12" cy="12" r="8" /> },
                { id: 'triangle', label: '三角', icon: <path d="M12 5 L20 19 L4 19 Z" /> },
                { id: 'star', label: '星形', icon: <path d="M12 4 L14.4 9.6 L20.5 10.2 L16 14.2 L17.2 20 L12 17 L6.8 20 L8 14.2 L3.5 10.2 L9.6 9.6 Z" /> },
                { id: 'heart', label: '心形', icon: <path d="M12 20 C5 14 3.5 10.5 3.5 8 C3.5 5.8 5.2 4.5 7 4.5 C9 4.5 11 5.8 12 8 C13 5.8 15 4.5 17 4.5 C18.8 4.5 20.5 5.8 20.5 8 C20.5 10.5 19 14 12 20 Z" /> },
              ] as const).map(s => (
                <button key={s.id}
                  onClick={() => { useProjectStore.getState().markHistory(); handleMaskShapeChange(s.id); }}
                  title={s.label}
                  className={clsx("py-1.5 rounded border flex items-center justify-center transition-colors",
                    selectedClip.mask?.enabled && selectedClip.mask?.shape === s.id
                      ? "border-brand-400 text-brand-300 bg-brand-500/15"
                      : "border-white/10 text-gray-400 hover:border-brand-400/50 hover:text-gray-200")}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                    fill={selectedClip.mask?.enabled && selectedClip.mask?.shape === s.id ? 'currentColor' : 'none'}
                    stroke="currentColor" strokeWidth="1.6">
                    {s.icon}
                  </svg>
                </button>
              ))}
              {/* 启用/关闭开关按钮 */}
              <button
                onClick={() => {
                  useProjectStore.getState().markHistory();
                  if (selectedClip.mask?.enabled) {
                    updateClip(selectedClip.id, { mask: { ...DEFAULT_MASK_CONFIG, ...(selectedClip.mask ?? {}), enabled: false } } as any);
                  } else {
                    handleMaskShapeChange(selectedClip.mask?.shape ?? 'circle');
                  }
                }}
                title={selectedClip.mask?.enabled ? '关闭蒙版' : '启用蒙版'}
                className={clsx("py-1.5 rounded border flex items-center justify-center transition-colors",
                  selectedClip.mask?.enabled
                    ? "border-brand-400 text-brand-300 bg-brand-500/15"
                    : "border-white/10 text-gray-400 hover:border-brand-400/50")}
              >
                <span className="text-[10px]">{selectedClip.mask?.enabled ? 'ON' : 'OFF'}</span>
              </button>
            </div>

            {selectedClip.mask?.enabled && (
              <>
                <SpaceRow label="宽度" value={selectedClip.mask.width} min={5} max={200} suffix="%"
                  onChange={v => handleMaskChange({ width: v })} markGesture={markGestureHistory} />
                <SpaceRow label="高度" value={selectedClip.mask.height} min={5} max={200} suffix="%"
                  onChange={v => handleMaskChange({ height: v })} markGesture={markGestureHistory} />
                <SpaceRow label="位置 X" value={selectedClip.mask.x} min={0} max={100} suffix="%"
                  onChange={v => handleMaskChange({ x: v })} markGesture={markGestureHistory} />
                <SpaceRow label="位置 Y" value={selectedClip.mask.y} min={0} max={100} suffix="%"
                  onChange={v => handleMaskChange({ y: v })} markGesture={markGestureHistory} />
                <SpaceRow label="旋转" value={selectedClip.mask.rotation} min={-180} max={180} suffix="°"
                  onChange={v => handleMaskChange({ rotation: v })} markGesture={markGestureHistory} />
                <SpaceRow label="羽化" value={selectedClip.mask.feather} min={0} max={100} suffix="%"
                  onChange={v => handleMaskChange({ feather: v })} markGesture={markGestureHistory} />
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-gray-400">反转蒙版</span>
                  <input type="checkbox" checked={selectedClip.mask.inverted}
                    onChange={e => { useProjectStore.getState().markHistory(); handleMaskChange({ inverted: e.target.checked }); }}
                    className="accent-brand-500" />
                </label>
              </>
            )}
          </div>
        )}

        <div className="w-full h-px bg-white/5 my-2" />

        {/* 智能抠像（仅视频/图片） */}
        {(selectedClip.type === 'video' || selectedClip.type === 'image') && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">智能抠像</span>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={!!selectedClip.chromaKey?.enabled}
                  onChange={e => { useProjectStore.getState().markHistory(); handleMattingToggle(e.target.checked); }}
                  className="accent-brand-500" />
                <span className="text-gray-400 text-[10px]">{selectedClip.chromaKey?.enabled ? '已开启' : '关闭'}</span>
              </label>
            </div>

            {selectedClip.chromaKey?.enabled && (
              <>
                {mattingState === 'error' && (
                  <div className="text-[10px] text-yellow-400/90 bg-yellow-400/10 border border-yellow-400/20 rounded px-2 py-1.5">
                    分割模型未部署：请将 selfie_multiclass_256x256.tflite 放入 public/mediapipe/models/
                  </div>
                )}
                <SpaceRow label="边缘羽化" value={selectedClip.chromaKey.feather} min={0} max={100} suffix="%"
                  onChange={v => handleMattingChange({ feather: v })} markGesture={markGestureHistory} />
                <SpaceRow label="置信度" value={selectedClip.chromaKey.confidence} min={0} max={100} suffix="%"
                  onChange={v => handleMattingChange({ confidence: v })} markGesture={markGestureHistory} />
                <SpaceRow label="抠像范围" value={selectedClip.chromaKey.expand} min={-50} max={50}
                  onChange={v => handleMattingChange({ expand: v })} markGesture={markGestureHistory} />
                <p className="text-[10px] text-gray-600 leading-relaxed">
                  基于本地 MediaPipe 人像分割，自动识别画面中的人物并去除背景。负值范围可扩张人物边缘。
                </p>
              </>
            )}
          </div>
        )}

        <div className="w-full h-px bg-white/5 my-2" />

        {/* 空间感：深度 Z / 三维旋转 / 斜切 */}
        {selectedClip.type !== 'audio' && (
          <div className="space-y-3">
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">空间 (X·Y·Z)</div>
            <SpaceRow markGesture={markGestureHistory}
              label={<>深度 Z <KfDiamond clip={selectedClip} channel="z" /></>}
              tip="translateZ，配合透视产生近大远小"
              value={selectedClip.transform.depthZ ?? 0} min={-600} max={600} step={5} suffix="px"
              onChange={v => updateTransformField('depthZ', v)} />
            <SpaceRow markGesture={markGestureHistory}
              label={<>翻转 X <KfDiamond clip={selectedClip} channel="rotateX" /></>}
              value={selectedClip.transform.rotateX ?? 0} min={-180} max={180} step={0.5} suffix="°"
              onChange={v => updateTransformField('rotateX', v)} />
            <SpaceRow markGesture={markGestureHistory}
              label={<>翻转 Y <KfDiamond clip={selectedClip} channel="rotateY" /></>}
              value={selectedClip.transform.rotateY ?? 0} min={-180} max={180} step={0.5} suffix="°"
              onChange={v => updateTransformField('rotateY', v)} />
            <div className="grid grid-cols-2 gap-3">
              <NumberRow label="斜切 X" value={selectedClip.transform.skewX ?? 0}
                onFocus={markGestureHistory}
                onChange={v => updateTransformField('skewX', v)} />
              <NumberRow label="斜切 Y" value={selectedClip.transform.skewY ?? 0}
                onFocus={markGestureHistory}
                onChange={v => updateTransformField('skewY', v)} />
            </div>
          </div>
        )}

        <div className="w-full h-px bg-white/5 my-2" />

        {/* 媒体：变速 / 音量 / 淡入淡出 */}
        {selectedClip.type !== 'template' && (
          <div className="space-y-3">
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Media</div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <label className="text-gray-400">变速</label>
                <span className="text-gray-300">{(selectedClip.speed ?? 1).toFixed(2)}×</span>
              </div>
              <input type="range" min="0.25" max="4" step="0.05"
                value={selectedClip.speed ?? 1}
                onChange={e => handleSpeedChange(parseFloat(e.target.value))}
                onPointerDown={markGestureHistory}
                className="w-full accent-brand-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer" />
              <div className="flex gap-1">
                {[0.5, 1, 2].map(s => (
                  <button key={s} onClick={() => { useProjectStore.getState().markHistory(); handleSpeedChange(s); }}
                    className={clsx("px-2 py-0.5 rounded text-[10px] border", Math.abs((selectedClip.speed ?? 1) - s) < 0.01 ? "border-brand-500 text-brand-400 bg-brand-500/10" : "border-white/10 text-gray-400 hover:border-white/30")}>
                    {s}×
                  </button>
                ))}
              </div>
            </div>

            {/* 曲线变速 */}
            {selectedClip.type === 'video' && (
              <div className="pt-2 mt-1 border-t border-white/5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-gray-400">曲线变速</label>
                  {hasSpeedCurve(selectedClip) && (
                    <span className="text-[10px] text-rose-300 font-medium">
                      全程均值 {(curveAverage(selectedClip.speedCurve ?? [{ t: 0, value: 1 }, { t: 1, value: 1 }])).toFixed(2)}x
                    </span>
                  )}
                </div>
                <SpeedCurveEditor clip={selectedClip} />
              </div>
            )}

            {(selectedClip.type === 'video' || selectedClip.type === 'audio') && (
              <>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <label className="text-gray-400">音量</label>
                    <span className="text-gray-300">{Math.round((selectedClip.volume ?? 1) * 100)}%</span>
                  </div>
                  <input type="range" min="0" max="2" step="0.01"
                    value={selectedClip.volume ?? 1}
                    onChange={e => handleVolumeChange(parseFloat(e.target.value))}
                    onPointerDown={markGestureHistory}
                    className="w-full accent-green-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-gray-400 text-[10px]">淡入 (s)</label>
                    <input type="number" min="0" max={selectedClip.duration / 2} step="0.1"
                      value={selectedClip.audioFadeIn ?? 0}
                      onFocus={markGestureHistory}
                      onChange={e => handleFadeChange('audioFadeIn', parseFloat(e.target.value) || 0)}
                      className="input-glass w-full px-2 py-1.5" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-gray-400 text-[10px]">淡出 (s)</label>
                    <input type="number" min="0" max={selectedClip.duration / 2} step="0.1"
                      value={selectedClip.audioFadeOut ?? 0}
                      onFocus={markGestureHistory}
                      onChange={e => handleFadeChange('audioFadeOut', parseFloat(e.target.value) || 0)}
                      className="input-glass w-full px-2 py-1.5" />
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <div className="w-full h-px bg-white/5 my-2" />

        {selectedClip.effects && selectedClip.effects.length > 0 && (
          <div className="space-y-4">
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Effects</div>
            {selectedClip.effects.map(effect => {
              const preset = PRESETS[effect.presetId];
              if (!preset) return null;

              return (
                <div key={effect.id} className="bg-black/20 rounded-lg p-3 border border-white/5 group relative">
                  <button
                    onClick={() => handleRemoveEffect(effect.id)}
                    className="absolute top-2 right-2 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove effect"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>

                  <div className="flex justify-between items-center mb-2 pr-4">
                    <span className="text-brand-400 font-bold">{effect.name}</span>
                    <span className="text-[10px] text-gray-600 uppercase border border-gray-700 px-1 rounded">{effect.type}</span>
                  </div>

                  <div className="space-y-2">
                    {['entrance', 'exit', 'transition'].includes(effect.type) && (
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <label className="text-gray-400">Duration (s)</label>
                          <span className="text-gray-300">{effect.duration}s</span>
                        </div>
                        <input
                          type="range" min="0.1" max={selectedClip.duration} step="0.1"
                          value={effect.duration}
                          onChange={(e) => handleEffectDurationChange(effect.id, parseFloat(e.target.value))}
                          className="w-full accent-brand-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    )}

                    {preset.schema.map(field => (
                      <div key={field.key} className="space-y-1">
                        <div className="flex justify-between">
                          <label className="text-gray-400">{field.label}</label>
                          <span className="text-gray-300">{effect.params[field.key]}</span>
                        </div>
                        {field.type === 'number' && (
                          <input
                            type="range"
                            min={field.min} max={field.max} step={field.step || 1}
                            value={effect.params[field.key]}
                            onChange={(e) => handleEffectParamChange(effect.id, field.key, parseFloat(e.target.value))}
                            className="w-full accent-brand-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {(!selectedClip.effects || selectedClip.effects.length === 0) && selectedClip.type !== 'template' && (
          <div className="text-center py-4 bg-white/5 rounded-lg text-gray-500">
            No effects applied. Add from the preset library.
          </div>
        )}

        {/* Template Parameters */}
        {selectedClip.type === 'template' && template && selectedClip.templateData && (
          <div className="space-y-4">
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Template Parameters</div>
            <div className="bg-black/20 rounded-lg p-3 border border-white/5">
              <div className="text-xs text-brand-400 font-bold mb-3">{template.name}</div>
              <div className="space-y-3">
                {template.schema.map(field => {
                  const value = selectedClip.templateData?.params[field.key];
                  return (
                    <div key={field.key} className="space-y-1">
                      <div className="flex justify-between">
                        <label className="text-gray-400">{field.label}</label>
                        {field.type !== 'boolean' && field.type !== 'code' && field.type !== 'textarea' && (
                          <span className="text-gray-300 text-[10px]">{value}</span>
                        )}
                      </div>
                      
                      {field.type === 'string' && (
                        <input
                          type="text"
                          value={value || ''}
                          placeholder={field.placeholder}
                          onChange={(e) => handleTemplateParamChange(field.key, e.target.value)}
                          className="w-full bg-black/30 border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:border-brand-500 outline-none"
                        />
                      )}
                      
                      {field.type === 'number' && (
                        <input
                          type="range"
                          min={field.min}
                          max={field.max}
                          step={field.step || 1}
                          value={value || field.default}
                          onChange={(e) => handleTemplateParamChange(field.key, parseFloat(e.target.value))}
                          className="w-full accent-brand-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                        />
                      )}
                      
                      {field.type === 'color' && (
                        <div className="flex gap-2 items-center">
                          <input
                            type="color"
                            value={value || field.default}
                            onChange={(e) => handleTemplateParamChange(field.key, e.target.value)}
                            className="w-8 h-8 rounded cursor-pointer border-none bg-transparent"
                          />
                          <span className="text-gray-400 text-[10px]">{value}</span>
                        </div>
                      )}
                      
                      {field.type === 'boolean' && (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={value || false}
                            onChange={(e) => handleTemplateParamChange(field.key, e.target.checked)}
                            className="w-4 h-4 accent-brand-500"
                          />
                          <span className="text-gray-400 text-[10px]">启用</span>
                        </label>
                      )}
                      
                      {field.type === 'textarea' && (
                        <textarea
                          value={value || ''}
                          placeholder={field.placeholder}
                          onChange={(e) => handleTemplateParamChange(field.key, e.target.value)}
                          rows={3}
                          className="w-full bg-black/30 border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:border-brand-500 outline-none resize-none"
                        />
                      )}
                      
                      {field.type === 'code' && (
                        <textarea
                          value={value || ''}
                          placeholder={field.placeholder}
                          onChange={(e) => handleTemplateParamChange(field.key, e.target.value)}
                          rows={8}
                          className="w-full bg-black/30 border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:border-brand-500 outline-none resize-none font-mono"
                        />
                      )}
                      
                      {field.type === 'select' && field.options && (
                        <select
                          value={value || field.default}
                          onChange={(e) => handleTemplateParamChange(field.key, e.target.value)}
                          className="w-full bg-black/30 border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:border-brand-500 outline-none"
                        >
                          {field.options.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
