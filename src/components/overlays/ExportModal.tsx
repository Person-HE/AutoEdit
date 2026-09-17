import React, { useState, useEffect, useRef } from 'react';
import { useUIStore } from '../../store/useUIStore';
import { useProjectStore } from '../../store/useProjectStore';
import { videoExporter } from '../../services/videoExporter';
import clsx from 'clsx';

type ResolutionPreset = '1080p' | '4k' | 'custom';
type VideoCodec = 'libx264' | 'libx265' | 'libvpx-vp9';
type OutputFormat = 'mp4' | 'webm' | 'mkv' | 'gif';

interface ResolutionConfig {
  width: number;
  height: number;
  label: string;
}

interface RenderProgress {
  stage: 'launching' | 'capturing' | 'encoding' | 'finalizing';
  currentFrame?: number;
  totalFrames?: number;
  percent: number;
  message: string;
}

interface RenderResult {
  success: boolean;
  outputPath: string;
  fileSize: number;
  duration: number;
  totalFrames: number;
  renderTime: number;
}

interface RenderOptions {
  entryPoint: string;
  outputPath: string;
  width?: number;
  height?: number;
  fps?: number;
  durationInFrames: number;
  codec?: string;
  crf?: number;
  format?: string;
  audioPath?: string;
  onProgress?: (progress: RenderProgress) => void;
  onComplete?: (result: RenderResult) => void;
  onError?: (error: Error) => void;
}

interface VideoRendererInterface {
  render: (options: RenderOptions) => Promise<RenderResult>;
  cancel: () => void;
}

const RESOLUTION_PRESETS: Record<ResolutionPreset, ResolutionConfig> = {
  '1080p': { width: 1920, height: 1080, label: '1080p (1920×1080)' },
  '4k': { width: 3840, height: 2160, label: '4K (3840×2160)' },
  'custom': { width: 1920, height: 1080, label: '自定义' },
};

const CODEC_OPTIONS: { value: VideoCodec; label: string; defaultCRF: number }[] = [
  { value: 'libx264', label: 'H.264 (AVC)', defaultCRF: 23 },
  { value: 'libx265', label: 'H.265 (HEVC)', defaultCRF: 28 },
  { value: 'libvpx-vp9', label: 'VP9', defaultCRF: 32 },
];

const FORMAT_OPTIONS: { value: OutputFormat; label: string; supportedCodecs: VideoCodec[] }[] = [
  { value: 'mp4', label: 'MP4', supportedCodecs: ['libx264', 'libx265'] },
  { value: 'webm', label: 'WebM', supportedCodecs: ['libvpx-vp9'] },
  { value: 'mkv', label: 'MKV', supportedCodecs: ['libx264', 'libx265', 'libvpx-vp9'] },
  { value: 'gif', label: 'GIF (旧版)', supportedCodecs: [] },
];

const STAGE_LABELS: Record<RenderProgress['stage'], string> = {
  launching: '正在启动浏览器...',
  capturing: '截取帧中...',
  encoding: '编码视频中...',
  finalizing: '完成渲染...',
};

export const ExportModal: React.FC = () => {
  const isExportModalOpen = useUIStore((s) => s.isExportModalOpen);
  const setIsExportModalOpen = useUIStore((s) => s.setIsExportModalOpen);
  const project = useProjectStore((s) => s.project);
  const assets = useProjectStore((s) => s.assets);

  const [fileName, setFileName] = useState('');
  const [resolution, setResolution] = useState<ResolutionPreset>('1080p');
  const [customWidth, setCustomWidth] = useState(1920);
  const [customHeight, setCustomHeight] = useState(1080);
  const [format, setFormat] = useState<OutputFormat>('mp4');
  const [codec, setCodec] = useState<VideoCodec>('libx264');
  const [crf, setCrf] = useState(23);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState<RenderProgress['stage'] | ''>('');
  const [stageMessage, setStageMessage] = useState('');
  const [exportUrl, setExportUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [useFallback, setUseFallback] = useState(false);

  const rendererRef = useRef<VideoRendererInterface | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (project) {
      setFileName(`${project.name}_export`);
    }
  }, [project]);

  useEffect(() => {
    if (format === 'webm') {
      setCodec('libvpx-vp9');
    } else if (format === 'mp4' && codec === 'libvpx-vp9') {
      setCodec('libx264');
    }
  }, [format]);

  useEffect(() => {
    const selectedCodecOption = CODEC_OPTIONS.find(c => c.value === codec);
    if (selectedCodecOption) {
      setCrf(selectedCodecOption.defaultCRF);
    }
  }, [codec]);

  const getCurrentResolution = (): ResolutionConfig => {
    if (resolution === 'custom') {
      return { width: customWidth, height: customHeight, label: `${customWidth}×${customHeight}` };
    }
    return RESOLUTION_PRESETS[resolution];
  };

  const calculateTotalFrames = (): number => {
    if (!project) return 30 * 30;

    const clips = Object.values(project.clips || {});
    if (clips.length === 0) return 30 * 30;

    let maxTime = -Infinity;
    for (const clip of clips) {
      const clipEnd = clip.startTime + clip.duration;
      maxTime = Math.max(maxTime, clipEnd);
    }

    const duration = Math.max(maxTime, 5);
    const fps = project.fps || 30;
    return Math.floor(duration * fps);
  };

  const getEntryPointURL = (): string => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return 'http://localhost:5173';
  };

  const mapExportConfigToRenderOptions = (): RenderOptions => {
    const res = getCurrentResolution();
    const totalFrames = calculateTotalFrames();
    const fps = project?.fps || 30;

    return {
      entryPoint: getEntryPointURL(),
      outputPath: `${fileName}.${format}`,
      width: res.width,
      height: res.height,
      fps: fps,
      durationInFrames: totalFrames,
      codec: format !== 'gif' ? codec : undefined,
      crf: format !== 'gif' ? crf : undefined,
      format: format !== 'gif' ? format : undefined,
      onProgress: handleProgress,
      onComplete: handleComplete,
      onError: handleError,
    };
  };

  const handleProgress = (progressData: RenderProgress) => {
    setProgress(progressData.percent);
    setCurrentStage(progressData.stage);
    setStageMessage(progressData.message);
  };

  const handleComplete = (result: RenderResult) => {
    console.log('✅ Export completed!', result);
    setIsExporting(false);
    setProgress(100);
    setCurrentStage('finalizing');
    setStageMessage('导出完成！');
    setError(null);

    if (result.success && result.outputPath) {
      setExportUrl(result.outputPath);
    }
  };

  const handleError = (error: Error) => {
    console.error('❌ Export failed:', error);
    setError(error.message || '导出失败');
    setIsExporting(false);
    setProgress(0);
    setCurrentStage('');
    setStageMessage('');
  };


  const handleExportWithNewRenderer = async () => {
    if (!project) return;

    // 导出前确保项目已保存到本地存储：新开的无头浏览器页面将从 IndexedDB 恢复项目
    try {
      const { projectService } = await import('../../services/projectService');
      await projectService.saveProject(project, assets);
    } catch (e) {
      console.warn('[Export] 导出前保存失败，继续使用当前页面状态:', e);
    }

    setIsExporting(true);
    setProgress(0);
    setCurrentStage('launching');
    setStageMessage('准备中...');
    setError(null);
    setExportUrl(null);

    try {
      const { VideoRenderer } = await import('../../modules/renderer/VideoRenderer');
      rendererRef.current = new VideoRenderer();
      await rendererRef.current.render(mapExportConfigToRenderOptions());
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      if (err.message.includes('已取消')) {
        console.log('Export cancelled by user');
        setIsExporting(false);
        setProgress(0);
        setCurrentStage('');
        setStageMessage('');
      } else {
        handleError(err);
      }
    } finally {
      rendererRef.current = null;
    }
  };

  const handleExportWithFallback = async () => {
    if (!project) return;

    setIsExporting(true);
    setProgress(0);
    setError(null);
    setExportUrl(null);

    try {
      await videoExporter.exportProject(project, assets, {
        fileName,
        resolution: resolution === '4k' ? '4k' : '1080p',
        format: format === 'gif' ? 'gif' : 'mp4',
        onProgress: (p) => {
          setProgress(p);
          setStageMessage(`渲染中... ${Math.round(p)}%`);
        },
        onComplete: (url) => {
          setExportUrl(url);
          setIsExporting(false);
          setProgress(100);
          setStageMessage('导出完成！（使用旧版方案）');
        }
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      handleError(err);
    }
  };

  const handleExport = async () => {
    if (format === 'gif' || useFallback) {
      await handleExportWithFallback();
    } else {
      await handleExportWithNewRenderer();
    }
  };

  const handleCancel = () => {
    if (rendererRef.current) {
      rendererRef.current.cancel();
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsExporting(false);
    setProgress(0);
    setCurrentStage('');
    setStageMessage('');
  };

  const handleDownload = () => {
    if (!exportUrl) return;

    const a = document.createElement('a');
    a.href = exportUrl.startsWith('blob:') ? exportUrl : `file://${exportUrl}`;
    a.download = `${fileName}.${format}`;
    a.click();
  };

  const isGIFMode = format === 'gif';

  if (!isExportModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center animate-fade-in backdrop-blur-sm">
      <div className="glass-modal w-[600px] overflow-hidden flex flex-col animate-scale-in max-h-[90vh]">
        {/* Header */}
        <div className="h-14 border-b border-white/10 flex items-center justify-between px-6 bg-white/5 shrink-0">
          <h2 className="text-white font-bold text-lg">导出视频</h2>
          {!isExporting && (
            <button
                onClick={() => setIsExportModalOpen(false)}
                className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          )}
        </div>

        {/* Body - Scrollable */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* File Name */}
          <div className="space-y-2">
            <label className="text-xs text-gray-400 uppercase font-bold tracking-wider">文件名</label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              disabled={isExporting}
              className="input-glass w-full h-10 px-3 text-white transition-colors"
            />
          </div>

          {/* Format Selection */}
          <div className="space-y-2">
            <label className="text-xs text-gray-400 uppercase font-bold tracking-wider">格式</label>
            <div className="grid grid-cols-4 gap-2 bg-black/20 p-1 rounded-lg border border-white/5">
              {FORMAT_OPTIONS.map((fmt) => (
                <button
                  key={fmt.value}
                  onClick={() => setFormat(fmt.value)}
                  disabled={isExporting}
                  className={clsx(
                    "py-1.5 text-xs font-medium rounded transition-all",
                    format === fmt.value
                      ? "bg-white/10 text-white shadow-sm border border-white/10"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  {fmt.label}
                </button>
              ))}
            </div>
            {isGIFMode && (
              <p className="text-xs text-yellow-400/80 mt-1">⚠️ GIF 格式使用旧版导出方案，画质和性能有限</p>
            )}
          </div>

          {/* Advanced Options (hidden for GIF) */}
          {!isGIFMode && (
            <>
              {/* Resolution Selection */}
              <div className="space-y-2">
                <label className="text-xs text-gray-400 uppercase font-bold tracking-wider">分辨率</label>
                <div className="grid grid-cols-3 gap-2 bg-black/20 p-1 rounded-lg border border-white/5">
                  {(['1080p', '4k', 'custom'] as ResolutionPreset[]).map((res) => (
                    <button
                      key={res}
                      onClick={() => setResolution(res)}
                      disabled={isExporting}
                      className={clsx(
                        "py-1.5 text-xs font-medium rounded transition-all",
                        resolution === res
                          ? "bg-white/10 text-white shadow-sm border border-white/10"
                          : "text-gray-400 hover:text-white hover:bg-white/5"
                      )}
                    >
                      {RESOLUTION_PRESETS[res].label}
                    </button>
                  ))}
                </div>

                {/* Custom Resolution Inputs */}
                {resolution === 'custom' && (
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">宽度</label>
                      <input
                        type="number"
                        value={customWidth}
                        onChange={(e) => setCustomWidth(Math.max(1, Math.min(7680, parseInt(e.target.value) || 1)))}
                        disabled={isExporting}
                        className="input-glass w-full h-9 px-3 text-white text-sm"
                        min="1"
                        max="7680"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">高度</label>
                      <input
                        type="number"
                        value={customHeight}
                        onChange={(e) => setCustomHeight(Math.max(1, Math.min(4320, parseInt(e.target.value) || 1)))}
                        disabled={isExporting}
                        className="input-glass w-full h-9 px-3 text-white text-sm"
                        min="1"
                        max="4320"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Codec Selection */}
              <div className="space-y-2">
                <label className="text-xs text-gray-400 uppercase font-bold tracking-wider">编码器</label>
                <div className="grid grid-cols-3 gap-2 bg-black/20 p-1 rounded-lg border border-white/5">
                  {CODEC_OPTIONS.filter(c =>
                    FORMAT_OPTIONS.find(f => f.value === format)?.supportedCodecs.includes(c.value)
                  ).map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setCodec(c.value)}
                      disabled={isExporting}
                      className={clsx(
                        "py-1.5 text-xs font-medium rounded transition-all",
                        codec === c.value
                          ? "bg-white/10 text-white shadow-sm border border-white/10"
                          : "text-gray-400 hover:text-white hover:bg-white/5"
                      )}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quality (CRF) Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs text-gray-400 uppercase font-bold tracking-wider">质量 (CRF)</label>
                  <span className="text-xs text-gray-300 font-mono">{crf}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="51"
                  value={crf}
                  onChange={(e) => setCrf(parseInt(e.target.value))}
                  disabled={isExporting}
                  className="w-full h-2 bg-black/40 rounded-full appearance-none cursor-pointer accent-brand-500"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>最高质量 (0)</span>
                  <span>默认 (23)</span>
                  <span>最小文件 (51)</span>
                </div>
              </div>

              {/* Fallback Toggle */}
              <div className="flex items-center gap-3 py-2">
                <input
                  type="checkbox"
                  id="use-fallback"
                  checked={useFallback}
                  onChange={(e) => setUseFallback(e.target.checked)}
                  disabled={isExporting}
                  className="w-4 h-4 rounded border-white/20 bg-black/40 accent-brand-500"
                />
                <label htmlFor="use-fallback" className="text-xs text-gray-400 cursor-pointer">
                  使用旧版导出方案（Canvas录制）
                </label>
              </div>
            </>
          )}
        </div>

        {/* Progress Section */}
        {isExporting && (
           <div className="px-6 pb-4 space-y-3 animate-fade-in border-t border-white/5 pt-4 shrink-0">
              {/* Stage Message */}
              {currentStage && (
                <div className="flex justify-between text-xs text-gray-300">
                  <span className="flex items-center gap-2">
                    <span className={clsx(
                      "w-2 h-2 rounded-full animate-pulse",
                      currentStage === 'launching' && "bg-yellow-400",
                      currentStage === 'capturing' && "bg-blue-400",
                      currentStage === 'encoding' && "bg-purple-400",
                      currentStage === 'finalizing' && "bg-green-400"
                    )}></span>
                    {STAGE_LABELS[currentStage]}
                  </span>
                  <span>{Math.round(progress)}%</span>
                </div>
              )}

              {/* Progress Bar */}
              <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                <div
                  className="h-full bg-gradient-to-r from-brand-500 to-brand-400 shadow-[0_0_10px_rgba(41,151,255,0.5)] transition-all duration-150 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>

              {/* Stage Detail Message */}
              {stageMessage && (
                <p className="text-xs text-gray-400 text-center">{stageMessage}</p>
              )}

              {/* Cancel Button */}
              <button
                onClick={handleCancel}
                className="w-full h-9 btn-secondary text-xs font-medium flex items-center justify-center gap-2 hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-400 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="6" width="12" height="12"></rect></svg>
                取消导出
              </button>
           </div>
        )}

        {/* Error Display */}
        {error && !isExporting && (
          <div className="mx-6 mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg animate-fade-in shrink-0">
            <div className="flex items-start gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400 mt-0.5 shrink-0"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-red-300 font-medium mb-1">导出失败</p>
                <p className="text-xs text-red-400/80 break-words">{error}</p>
                {error.toLowerCase().includes('ffmpeg') && (
                  <p className="text-xs text-yellow-400/80 mt-2">
                    💡 请确保已安装 FFmpeg 并添加到系统 PATH 环境变量中。
                    <a href="https://ffmpeg.org/download.html" target="_blank" rel="noopener noreferrer" className="underline ml-1">下载 FFmpeg</a>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-6 pt-0 shrink-0">
           {!isExporting && !exportUrl && !error && (
             <button
               onClick={handleExport}
               className="w-full h-10 btn-primary flex items-center justify-center gap-2 font-semibold"
             >
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
               开始导出
             </button>
           )}
           {exportUrl && (
             <div className="space-y-3">
               <button
                 onClick={handleDownload}
                 className="w-full h-10 btn-primary flex items-center justify-center gap-2 font-semibold"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                 下载视频
               </button>
               <button
                 onClick={() => {
                   setExportUrl(null);
                   setProgress(0);
                   setCurrentStage('');
                   setStageMessage('');
                 }}
                 className="w-full h-9 btn-secondary text-sm"
               >
                 导出新视频
               </button>
             </div>
           )}
           {error && (
             <button
               onClick={() => setError(null)}
               className="w-full h-10 btn-primary flex items-center justify-center"
             >
               重试
             </button>
           )}
        </div>
      </div>
    </div>
  );
};
