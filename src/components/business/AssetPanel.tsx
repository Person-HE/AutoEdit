import React, { useRef, useState, useCallback, useMemo, memo } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { useUIStore } from '../../store/useUIStore';
import { assetService } from '../../services/assetService';
import { comfyUIService, ImageGenConfig } from '../../services/comfyUIService';
import { PRESETS, registerPreset, getPresetCategories } from '../../engine/presets';
import { PresetDefinition } from '../../engine/presets/types';
import { DrawingBoard } from './DrawingBoard';
import { VirtualGrid, VirtualList } from '../common/VirtualList';
import clsx from 'clsx';
import type { Asset } from '../../types/core';
import { useAssetStore } from '../../modules/asset/useAssetStore';

type AssetLibraryMode = 'fixed' | 'imported';

const AssetGridItem = memo(({ asset, onDragStart, onContextMenu, isFixed }: {
  asset: Asset;
  onDragStart: (e: React.DragEvent, assetId: string, type: string) => void;
  onContextMenu: (e: React.MouseEvent, assetId: string) => void;
  isFixed?: boolean;
}) => (
  <div
    draggable
    onDragStart={(e) => onDragStart(e, asset.id, asset.type)}
    onContextMenu={(e) => onContextMenu(e, asset.id)}
    className={clsx(
      "aspect-square bg-black/20 rounded-lg border overflow-hidden relative group cursor-grab active:cursor-grabbing hover:border-brand-500/50 transition-colors w-full h-full",
      isFixed ? "border-blue-500/20" : "border-white/5"
    )}
  >
    {asset.type === 'image' || asset.type === 'video' ? (
      asset.url ? (
        <img
          src={asset.url}
          className="w-full h-full object-cover opacity-80 group-hover:opacity-100"
          alt={asset.name}
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 gap-1">
          {asset.type === 'image' ? (
            <svg className="shrink-0" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg>
          ) : (
            <svg className="shrink-0" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
          )}
          <span className="text-[10px]">{asset.name}</span>
        </div>
      )
    ) : (
      <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 gap-1">
        <svg className="shrink-0" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
        <span className="text-[10px]">{asset.type === 'sound_effect' ? '音效' : '音频'}</span>
      </div>
    )}
    <div className="absolute inset-x-0 bottom-0 bg-black/70 p-1 text-[10px] truncate text-gray-300 flex items-center gap-1">
      {isFixed && <svg className="shrink-0" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 17v5"/><path d="M9 2h6l-1 7h4l-5 7-5-7h4z"/></svg>}
      <span className="truncate">{asset.name}</span>
    </div>
  </div>
));

const PresetItem = memo(({ preset, onClick }: {
  preset: PresetDefinition;
  onClick: () => void;
}) => (
  <div
    onClick={onClick}
    className="h-16 bg-black/20 hover:bg-brand-500/10 border border-white/5 hover:border-brand-500/50 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all active:scale-95 group"
  >
    <div className="text-[10px] text-gray-300 group-hover:text-white text-center px-1">{preset.name}</div>
  </div>
));

export const AssetPanel: React.FC = () => {
  const assets = useProjectStore((s) => s.assets);
  const addAssets = useProjectStore((s) => s.addAssets);
  const addEffectToClip = useProjectStore((s) => s.addEffectToClip);
  const project = useProjectStore((s) => s.project);
  const removeAsset = useProjectStore((s) => s.removeAsset);
  const selectedClipId = useUIStore((s) => s.selectedClipId);
  const {
    fixedAssets,
    fixedFolderPath,
    isLoading: isAssetLoading,
    loadFixedFolderAssets,
    setFixedFolderPath,
    setFixedAssets,
  } = useAssetStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'local' | 'text' | 'effects' | 'ai' | 'drawing'>('local');
  const [expandedCategory, setExpandedCategory] = useState<string | null>('entrance');
  const [isSvgModalOpen, setIsSvgModalOpen] = useState(false);
  const [svgCode, setSvgCode] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importCode, setImportCode] = useState('');
  const [assetContextMenu, setAssetContextMenu] = useState<{ x: number, y: number, assetId: string } | null>(null);
  const [assetCategory, setAssetCategory] = useState<'all' | 'image' | 'video' | 'audio' | 'sound_effect'>('all');
  const [imagePrompt, setImagePrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('ugly, blurry, noisy, messy, deformed, bad anatomy');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageGenProgress, setImageGenProgress] = useState('');
  const [isDrawingBoardOpen, setIsDrawingBoardOpen] = useState(false);
  const [assetLibraryMode, setAssetLibraryMode] = useState<AssetLibraryMode>('imported');
  const [isScanningFolder, setIsScanningFolder] = useState(false);
  const [dirHandle, setDirHandle] = useState<FileSystemDirectoryHandle | null>(null);

  const importedAssets = useMemo(() => assets.filter(a => a.source !== 'fixed'), [assets]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files) as File[];
      const newAssets = await assetService.uploadAssets(files);
      const taggedAssets = newAssets.map(a => ({ ...a, source: 'imported' as const }));
      addAssets(taggedAssets);
    }
  };

  const handleDragStart = useCallback((e: React.DragEvent, assetId: string, type: string) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ assetId, type }));
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  const handleApplyEffect = useCallback((presetId: string) => {
    if (!selectedClipId) {
      alert('请先在时间轴选中一个片段');
      return;
    }
    const success = addEffectToClip(selectedClipId, presetId);
    if (success) {
      const preset = PRESETS[presetId];
      console.log(`✅ Applied effect: ${preset.name} to clip: ${selectedClipId}`);
    } else {
      alert('应用效果失败，请重试');
    }
  }, [selectedClipId, addEffectToClip]);

  const handleConvertSvgToImage = async () => {
    if (!svgCode.trim()) {
      alert('请输入SVG代码');
      return;
    }
    try {
      const blob = await assetService.convertSvgToPng(svgCode);
      const file = new File([blob], `svg_${Date.now()}.png`, { type: 'image/png' });
      const newAssets = await assetService.uploadAssets([file]);
      const taggedAssets = newAssets.map(a => ({ ...a, source: 'imported' as const }));
      addAssets(taggedAssets);
      setIsSvgModalOpen(false);
      setSvgCode('');
    } catch (error) {
      console.error('SVG conversion error:', error);
      alert('SVG转换失败: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleImportPreset = () => {
    try {
      const code = `return ${importCode}`;
      const presetObj = new Function(code)();
      if (presetObj && presetObj.id && presetObj.name && typeof presetObj.apply === 'function') {
        registerPreset(presetObj);
        alert(`✅ 成功导入预设: ${presetObj.name}`);
        setIsImportModalOpen(false);
        setImportCode('');
        setExpandedCategory(expandedCategory);
      } else {
        alert('❌ 格式错误: 必须包含 id, name, category, schema, apply(func)');
      }
    } catch (e) {
      alert('❌ 代码解析失败: ' + e);
    }
  };

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) {
      alert('请输入图片描述');
      return;
    }
    setIsGeneratingImage(true);
    setImageGenProgress('正在连接 ComfyUI...');
    try {
      const isHealthy = await comfyUIService.checkHealth();
      if (!isHealthy) {
        alert('ComfyUI 服务不可用，请确保 ComfyUI 已启动 (默认端口 8188)');
        setIsGeneratingImage(false);
        return;
      }
      setImageGenProgress('正在生成图片...');
      const config: ImageGenConfig = {
        prompt: imagePrompt,
        negativePrompt: negativePrompt,
        width: 1024,
        height: 576,
        seed: -1,
        steps: 9,
        cfg: 1,
      };
      const result = await comfyUIService.generateImage(config);
      setImageGenProgress('正在下载图片...');
      const response = await fetch(result.imageUrl);
      const blob = await response.blob();
      const file = new File([blob], `ai_generated_${Date.now()}.png`, { type: 'image/png' });
      const newAssets = await assetService.uploadAssets([file]);
      const taggedAssets = newAssets.map(a => ({ ...a, source: 'imported' as const }));
      addAssets(taggedAssets);
      setImageGenProgress('生成完成！');
      setTimeout(() => {
        setImageGenProgress('');
        setImagePrompt('');
      }, 2000);
    } catch (error) {
      console.error('Image generation error:', error);
      alert('图片生成失败: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const categories = useMemo(() => getPresetCategories(), []);

  const handleAssetContextMenu = useCallback((e: React.MouseEvent, assetId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setAssetContextMenu({ x: e.clientX, y: e.clientY, assetId });
  }, []);

  const handleDeleteAsset = async () => {
    if (!assetContextMenu) return;
    const { assetId } = assetContextMenu;

    const isFixedAsset = fixedAssets.some(a => a.id === assetId);
    if (isFixedAsset) {
      alert('固定素材库中的素材不能删除');
      setAssetContextMenu(null);
      return;
    }

    const isInUse = Object.values(project?.clips || {}).some(clip => clip.assetId === assetId);
    if (isInUse) {
      alert('该素材正在使用中，无法删除');
    } else {
      const success = await assetService.deleteAsset(assetId);
      if (success) {
        removeAsset(assetId);
      } else {
        alert('删除素材失败，请重试');
      }
    }
    setAssetContextMenu(null);
  };

  const handleClick = useCallback(() => {
    setAssetContextMenu(null);
  }, []);

  const handleSelectFixedFolder = async () => {
    try {
      if (!('showDirectoryPicker' in window)) {
        alert('当前浏览器不支持文件夹选择功能，请使用 Chrome 86+ 或 Edge 86+ 浏览器');
        return;
      }
      const handle = await (window as any).showDirectoryPicker({ mode: 'read' });
      setDirHandle(handle);
      setFixedFolderPath(handle.name);
      setIsScanningFolder(true);
      await loadFixedFolderAssets(handle);
      setIsScanningFolder(false);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Failed to select folder:', err);
        alert('选择文件夹失败: ' + (err.message || String(err)));
      }
      setIsScanningFolder(false);
    }
  };

  const handleRefreshFixedFolder = async () => {
    if (!dirHandle) {
      alert('请先选择一个文件夹');
      return;
    }
    setIsScanningFolder(true);
    try {
      await loadFixedFolderAssets(dirHandle);
    } catch (err) {
      console.error('Failed to refresh folder:', err);
    }
    setIsScanningFolder(false);
  };

  const handleClearFixedFolder = () => {
    setFixedAssets([]);
    setFixedFolderPath(null);
    setDirHandle(null);
  };

  const filteredImportedAssets = useMemo(() => {
    const seen = new Set<string>();
    return importedAssets
      .filter(asset => assetCategory === 'all' || asset.type === assetCategory)
      .filter(asset => {
        if (seen.has(asset.id)) return false;
        seen.add(asset.id);
        return true;
      });
  }, [importedAssets, assetCategory]);

  const filteredFixedAssets = useMemo(() => {
    return assetCategory === 'all'
      ? fixedAssets
      : fixedAssets.filter(a => a.type === assetCategory);
  }, [fixedAssets, assetCategory]);

  const presetsByCategory = useMemo(() => {
    const allPresets = Object.values(PRESETS);
    const result: Record<string, PresetDefinition[]> = {};
    for (const cat of categories) {
      result[cat.key] = allPresets.filter((p: PresetDefinition) => p.category === cat.key);
    }
    return result;
  }, [categories]);

  const placeholderCode = `{
  id: "custom_shake",
  name: "自定义震动",
  category: "motion",
  schema: [{key: "power", label: "力度", type: "number", default: 10, min: 1, max: 50}],
  apply: (p, params, t) => {
    const shake = Math.sin(p * 50) * params.power;
    return { transform: { ...t, x: t.x + shake }, opacity: 1 };
  }
}`;

  const contextMenuAsset = assetContextMenu
    ? [...importedAssets, ...fixedAssets].find(a => a.id === assetContextMenu.assetId)
    : null;
  const isContextFixedAsset = contextMenuAsset?.source === 'fixed';

  return (
    <div className="flex flex-col h-full select-none relative" onClick={handleClick}>
      <div className="p-3 pb-2">
        <div className="flex bg-black/20 p-1 rounded-lg border border-white/5 gap-1">
          <div onClick={() => setActiveTab('local')} className={clsx("flex-1 py-1.5 text-center text-xs font-medium rounded-md cursor-pointer transition-all", activeTab === 'local' ? "bg-bg-surface text-white shadow-md border border-white/10" : "text-gray-500 hover:text-gray-300")}>素材</div>
          <div onClick={() => setActiveTab('text')} className={clsx("flex-1 py-1.5 text-center text-xs font-medium rounded-md cursor-pointer transition-all", activeTab === 'text' ? "bg-bg-surface text-white shadow-md border border-white/10" : "text-gray-500 hover:text-gray-300")}>文字</div>
          <div onClick={() => setActiveTab('effects')} className={clsx("flex-1 py-1.5 text-center text-xs font-medium rounded-md cursor-pointer transition-all", activeTab === 'effects' ? "bg-bg-surface text-white shadow-md border border-white/10" : "text-gray-500 hover:text-gray-300")}>预设</div>
          <div onClick={() => setActiveTab('ai')} className={clsx("flex-1 py-1.5 text-center text-xs font-medium rounded-md cursor-pointer transition-all", activeTab === 'ai' ? "bg-bg-surface text-white shadow-md border border-white/10" : "text-gray-500 hover:text-gray-300")}>AI生成</div>
          <div onClick={() => setIsDrawingBoardOpen(true)} className={clsx("flex-1 py-1.5 text-center text-xs font-medium rounded-md cursor-pointer transition-all", isDrawingBoardOpen ? "bg-bg-surface text-white shadow-md border border-white/10" : "text-gray-500 hover:text-gray-300")}>画板</div>
        </div>
      </div>

      {activeTab === 'local' && (
        <>
          <div className="px-3 pb-2">
            <div className="flex bg-black/30 p-0.5 rounded-lg border border-white/5 gap-0.5">
              <div
                onClick={() => setAssetLibraryMode('fixed')}
                className={clsx(
                  "flex-1 py-1 text-center text-[10px] font-medium rounded-md cursor-pointer transition-all flex items-center justify-center gap-1",
                  assetLibraryMode === 'fixed'
                    ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                    : "text-gray-500 hover:text-gray-300"
                )}
              >
                <svg className="shrink-0" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 17v5"/><path d="M9 2h6l-1 7h4l-5 7-5-7h4z"/></svg> 固定素材库
              </div>
              <div
                onClick={() => setAssetLibraryMode('imported')}
                className={clsx(
                  "flex-1 py-1 text-center text-[10px] font-medium rounded-md cursor-pointer transition-all flex items-center justify-center gap-1",
                  assetLibraryMode === 'imported'
                    ? "bg-brand-500/20 text-brand-300 border border-brand-500/30"
                    : "text-gray-500 hover:text-gray-300"
                )}
              >
                <span>📥</span> 导入素材库
              </div>
            </div>
          </div>

          {assetLibraryMode === 'fixed' ? (
            <>
              <div className="px-3 pb-2 space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSelectFixedFolder}
                    className="flex-1 border border-dashed border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 hover:border-blue-500/50 rounded-xl h-12 flex items-center justify-center gap-2 cursor-pointer transition-all group"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-400">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                    </svg>
                    <span className="text-[10px] text-blue-400 group-hover:text-blue-300">
                      {fixedFolderPath ? `📁 ${fixedFolderPath}` : '选择文件夹'}
                    </span>
                  </button>
                  {fixedFolderPath && (
                    <button
                      onClick={handleRefreshFixedFolder}
                      disabled={isScanningFolder}
                      className="shrink-0 w-8 h-8 border border-white/10 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center transition-colors"
                      title="刷新"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={clsx("text-gray-400", isScanningFolder && "animate-spin")}>
                        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                      </svg>
                    </button>
                  )}
                </div>
                {fixedFolderPath && (
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] text-gray-500">固定素材不可删除，可拖拽使用</span>
                    <button onClick={handleClearFixedFolder} className="text-[10px] text-gray-500 hover:text-red-400 transition-colors">断开</button>
                  </div>
                )}
              </div>

              <div className="px-3 pb-2 flex gap-1 flex-wrap">
                <button onClick={() => setAssetCategory('all')} className={clsx("px-2 py-1 text-[10px] rounded transition-colors", assetCategory === 'all' ? "bg-blue-500 text-white" : "bg-white/5 text-gray-400 hover:bg-white/10")}>全部</button>
                <button onClick={() => setAssetCategory('image')} className={clsx("px-2 py-1 text-[10px] rounded transition-colors", assetCategory === 'image' ? "bg-blue-500 text-white" : "bg-white/5 text-gray-400 hover:bg-white/10")}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline mr-1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg>图片</button>
                <button onClick={() => setAssetCategory('video')} className={clsx("px-2 py-1 text-[10px] rounded transition-colors", assetCategory === 'video' ? "bg-blue-500 text-white" : "bg-white/5 text-gray-400 hover:bg-white/10")}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline mr-1"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>视频</button>
                <button onClick={() => setAssetCategory('audio')} className={clsx("px-2 py-1 text-[10px] rounded transition-colors", assetCategory === 'audio' ? "bg-blue-500 text-white" : "bg-white/5 text-gray-400 hover:bg-white/10")}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline mr-1"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>音频</button>
              </div>

              <div className="flex-1 overflow-hidden px-3 pb-3">
                {isScanningFolder ? (
                  <div className="text-center text-gray-500 text-xs py-8">
                    <svg className="animate-spin h-6 w-6 mx-auto mb-2 text-blue-400" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    正在扫描文件夹...
                  </div>
                ) : !fixedFolderPath ? (
                  <div className="text-center text-gray-500 text-xs py-8">
                    <div className="text-3xl mb-2">📂</div>
                    <p>点击上方按钮选择一个文件夹</p>
                    <p className="text-[10px] text-gray-600 mt-1">将扫描文件夹中的所有素材文件</p>
                  </div>
                ) : filteredFixedAssets.length > 0 ? (
                  <VirtualGrid
                    items={filteredFixedAssets}
                    itemWidth={110}
                    itemHeight={110}
                    gap={8}
                    containerHeight="100%"
                    keyExtractor={(asset) => asset.id}
                    renderItem={(asset) => (
                      <AssetGridItem asset={asset} onDragStart={handleDragStart} onContextMenu={handleAssetContextMenu} isFixed />
                    )}
                  />
                ) : (
                  <div className="text-center text-gray-500 text-xs py-8">该文件夹中没有找到支持的素材文件</div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="px-3 pb-3 space-y-2">
                <div onClick={() => fileInputRef.current?.click()} className="border border-dashed border-white/10 bg-white/5 hover:bg-white/10 hover:border-brand-500/50 rounded-xl h-16 flex flex-col items-center justify-center cursor-pointer transition-all group">
                  <span className="text-xl text-brand-500 group-hover:scale-110 transition-transform">+</span>
                  <span className="text-[10px] text-gray-400 mt-1">导入图片/视频/音频</span>
                  <input ref={fileInputRef} type="file" multiple accept="image/*,video/*,audio/*" className="hidden" onChange={handleFileSelect} />
                </div>
                <button onClick={() => setIsSvgModalOpen(true)} className="w-full border border-dashed border-white/10 bg-white/5 hover:bg-white/10 hover:border-purple-500/50 rounded-xl h-10 flex items-center justify-center gap-2 cursor-pointer transition-all group">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-500"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                  <span className="text-[10px] text-gray-400">粘贴SVG代码转图片</span>
                </button>
              </div>

              <div className="px-3 pb-2 flex gap-1 flex-wrap">
                <button onClick={() => setAssetCategory('all')} className={clsx("px-2 py-1 text-[10px] rounded transition-colors", assetCategory === 'all' ? "bg-brand-500 text-white" : "bg-white/5 text-gray-400 hover:bg-white/10")}>全部</button>
                <button onClick={() => setAssetCategory('image')} className={clsx("px-2 py-1 text-[10px] rounded transition-colors", assetCategory === 'image' ? "bg-brand-500 text-white" : "bg-white/5 text-gray-400 hover:bg-white/10")}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline mr-1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg>图片</button>
                <button onClick={() => setAssetCategory('video')} className={clsx("px-2 py-1 text-[10px] rounded transition-colors", assetCategory === 'video' ? "bg-brand-500 text-white" : "bg-white/5 text-gray-400 hover:bg-white/10")}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline mr-1"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>视频</button>
                <button onClick={() => setAssetCategory('audio')} className={clsx("px-2 py-1 text-[10px] rounded transition-colors", assetCategory === 'audio' ? "bg-brand-500 text-white" : "bg-white/5 text-gray-400 hover:bg-white/10")}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline mr-1"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>音频</button>
                <button onClick={() => setAssetCategory('sound_effect')} className={clsx("px-2 py-1 text-[10px] rounded transition-colors", assetCategory === 'sound_effect' ? "bg-brand-500 text-white" : "bg-white/5 text-gray-400 hover:bg-white/10")}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline mr-1"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>音效</button>
              </div>

              <div className="flex-1 overflow-hidden px-3 pb-3">
                {filteredImportedAssets.length > 0 ? (
                  <VirtualGrid
                    items={filteredImportedAssets}
                    itemWidth={110}
                    itemHeight={110}
                    gap={8}
                    containerHeight="100%"
                    keyExtractor={(asset) => asset.id}
                    renderItem={(asset) => (
                      <AssetGridItem asset={asset} onDragStart={handleDragStart} onContextMenu={handleAssetContextMenu} />
                    )}
                  />
                ) : (
                  <div className="text-center text-gray-500 text-xs py-8">暂无导入素材</div>
                )}
              </div>
            </>
          )}
        </>
      )}

      {activeTab === 'text' && (
        <div className="flex-1 overflow-y-auto px-3 pt-0">
          <div className="text-[10px] text-gray-500 mb-2">拖拽添加文字</div>
          <div className="grid grid-cols-2 gap-3">
            <div draggable onDragStart={(e) => handleDragStart(e, 'text_default', 'text')} className="aspect-video bg-black/20 rounded-lg border border-white/5 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing hover:border-yellow-500/50 transition-colors group">
              <span className="text-2xl font-bold text-white group-hover:scale-110 transition-transform">T</span>
              <span className="text-[10px] text-gray-400 mt-1">默认文本</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'effects' && (
        <div className="flex-1 overflow-y-auto p-3 pt-0 space-y-2 relative">
          <button onClick={() => setIsImportModalOpen(true)} className="w-full py-1.5 mb-2 text-xs border border-dashed border-white/20 text-gray-400 hover:text-brand-500 hover:border-brand-500/50 rounded transition-colors">+ 导入预设代码</button>
          {categories.map((cat) => {
            const isExpanded = expandedCategory === cat.key;
            const catPresets = presetsByCategory[cat.key] || [];
            return (
              <div key={cat.key} className="rounded-xl overflow-hidden border border-white/5 bg-white/[0.02] mb-2">
                <div onClick={() => setExpandedCategory(isExpanded ? null : cat.key)} className="px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider bg-white/5 cursor-pointer hover:bg-white/10 flex justify-between items-center">
                  {cat.name}
                  <svg className={clsx("w-3 h-3 transition-transform text-gray-500", isExpanded ? "rotate-180" : "")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
                {isExpanded && (
                  <div className="p-2 grid grid-cols-2 gap-2 animate-fade-in">
                    {catPresets.map((preset: PresetDefinition) => (
                      <PresetItem key={preset.id} preset={preset} onClick={() => handleApplyEffect(preset.id)} />
                    ))}
                    {catPresets.length === 0 && (
                      <div className="col-span-2 text-[10px] text-gray-600 text-center py-2">暂无预设</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'ai' && (
        <div className="flex-1 overflow-y-auto px-3 pt-0 space-y-3">
          <div className="text-[10px] text-gray-500 mb-2">ComfyUI 图片生成</div>
          <div className="space-y-1">
            <label className="text-[10px] text-gray-400">正向提示词</label>
            <textarea value={imagePrompt} onChange={(e) => setImagePrompt(e.target.value)} placeholder="描述你想要的图片内容..." className="w-full h-20 bg-black/20 border border-white/10 rounded-lg p-2 text-xs text-white resize-none focus:border-brand-500 outline-none" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-gray-400">负向提示词</label>
            <textarea value={negativePrompt} onChange={(e) => setNegativePrompt(e.target.value)} placeholder="描述你不想要的内容..." className="w-full h-12 bg-black/20 border border-white/10 rounded-lg p-2 text-xs text-white resize-none focus:border-brand-500 outline-none" />
          </div>
          <button onClick={handleGenerateImage} disabled={isGeneratingImage || !imagePrompt.trim()} className="w-full py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-2">
            {isGeneratingImage ? (
              <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>{imageGenProgress || '生成中...'}</>
            ) : (
              <><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>生成图片</>
            )}
          </button>
          <div className="text-[10px] text-gray-500 space-y-1">
            <p>• 使用 ComfyUI 本地服务 (端口 8188)</p>
            <p>• 默认尺寸: 1024×576 (16:9)</p>
            <p>• 生成时间约 10-30 秒</p>
          </div>
        </div>
      )}

      {isSvgModalOpen && (
        <div className="absolute inset-0 bg-bg-base/95 z-50 p-4 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <span className="font-bold text-sm">SVG转图片</span>
            <button onClick={() => setIsSvgModalOpen(false)} className="text-gray-400 hover:text-white">✕</button>
          </div>
          <textarea className="flex-1 bg-black/50 border border-white/10 rounded p-2 text-[10px] font-mono text-gray-300 resize-none focus:border-brand-500 outline-none" placeholder={`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">\n  <circle cx="50" cy="50" r="40" fill="#00d4ff"/>\n</svg>`} value={svgCode} onChange={(e) => setSvgCode(e.target.value)} />
          <div className="flex gap-2 mt-3">
            <button onClick={() => setIsSvgModalOpen(false)} className="flex-1 py-2 text-xs border border-white/20 text-gray-400 hover:text-white rounded transition-colors">取消</button>
            <button onClick={handleConvertSvgToImage} className="flex-1 py-2 text-xs bg-brand-500 hover:bg-brand-600 text-white rounded transition-colors">转换并添加</button>
          </div>
        </div>
      )}

      {isImportModalOpen && (
        <div className="absolute inset-0 bg-bg-base/95 z-50 p-4 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <span className="font-bold text-sm">导入JS预设</span>
            <button onClick={() => setIsImportModalOpen(false)} className="text-gray-400 hover:text-white">✕</button>
          </div>
          <textarea className="flex-1 bg-black/50 border border-white/10 rounded p-2 text-[10px] font-mono text-gray-300 resize-none focus:border-brand-500 outline-none" placeholder={placeholderCode} value={importCode} onChange={(e) => setImportCode(e.target.value)} />
          <button onClick={handleImportPreset} className="mt-3 btn-primary w-full py-2 text-xs">确认导入</button>
        </div>
      )}

      {isDrawingBoardOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80">
          <div className="w-[90vw] h-[90vh] bg-[#1E1E24] rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#252530]">
              <span className="text-sm font-medium text-white">画板</span>
              <button onClick={() => setIsDrawingBoardOpen(false)} className="text-gray-400 hover:text-white transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
            </div>
            <div className="flex-1 overflow-hidden"><DrawingBoard onClose={() => setIsDrawingBoardOpen(false)} /></div>
          </div>
        </div>
      )}

      {assetContextMenu && (
        <div className="fixed bg-[#1E1E24] border border-white/10 shadow-2xl rounded-lg py-1 z-[100] w-32 animate-fade-in" style={{ left: assetContextMenu.x, top: assetContextMenu.y }}>
          {isContextFixedAsset ? (
            <div className="px-3 py-2 text-[10px] text-gray-500">固定素材不可删除</div>
          ) : (
            <button onClick={handleDeleteAsset} className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/20 transition-colors">🗑️ 删除素材</button>
          )}
        </div>
      )}
    </div>
  );
};
