import React, { useState, useCallback, useRef } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { useUIStore } from '../../store/useUIStore';
import { PRESETS } from '../../engine/presets';
import { getTemplate } from '../../engine/templates';
import { DEFAULT_TTS_CONFIG } from '../../services/indexTtsService';

export const PropertiesPanel: React.FC = () => {
  const { project, updateClip, updateEffectParams, removeEffectFromClip, updateTemplateParams, generateVoiceOver, removeVoiceOver } = useProjectStore();
  const { selectedClipId } = useUIStore();
  const selectedClip = selectedClipId ? project?.clips[selectedClipId] : null;

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

  const handleRemoveEffect = useCallback((effectId: string) => {
    if (!selectedClip) return;
    removeEffectFromClip(selectedClip.id, effectId);
  }, [selectedClip, removeEffectFromClip]);

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
            'T'
          ) : selectedClip.type === 'template' ? (
            <span className="text-lg">
              {template?.category === 'ui' && '⌨️'}
              {template?.category === 'code' && '💻'}
              {template?.category === 'text' && '📝'}
              {template?.category === 'effect' && '✨'}
              {template?.category === 'transition' && '🎬'}
              {template?.category === 'other' && '📦'}
            </span>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
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
              <label className="text-gray-400 text-[10px]">Position X</label>
              <input type="number" value={Math.round(selectedClip.transform.x)} onChange={e => handleTransformChange('x', parseFloat(e.target.value))} className="input-glass w-full px-2 py-1.5" />
            </div>
            <div className="space-y-1">
              <label className="text-gray-400 text-[10px]">Position Y</label>
              <input type="number" value={Math.round(selectedClip.transform.y)} onChange={e => handleTransformChange('y', parseFloat(e.target.value))} className="input-glass w-full px-2 py-1.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <label className="text-gray-400">Scale</label>
              <span className="text-gray-300">{selectedClip.transform.scale.toFixed(2)}x</span>
            </div>
            <input type="range" min="0.1" max="3" step="0.05" value={selectedClip.transform.scale} onChange={e => handleTransformChange('scale', parseFloat(e.target.value))} className="w-full accent-brand-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer" />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <label className="text-gray-400">Rotation</label>
              <span className="text-gray-300">{Math.round(selectedClip.transform.rotation)} deg</span>
            </div>
            <input type="range" min="0" max="360" step="1" value={selectedClip.transform.rotation} onChange={e => handleTransformChange('rotation', parseFloat(e.target.value))} className="w-full accent-brand-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer" />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <label className="text-gray-400">Opacity</label>
              <span className="text-gray-300">{(selectedClip.style.opacity * 100).toFixed(0)}%</span>
            </div>
            <input type="range" min="0" max="1" step="0.01" value={selectedClip.style.opacity} onChange={e => handleOpacityChange(parseFloat(e.target.value))} className="w-full accent-brand-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer" />
          </div>
        </div>

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
