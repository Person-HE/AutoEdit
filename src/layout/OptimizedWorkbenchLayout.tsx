import React, { useState, Suspense, lazy } from 'react';
import { Header } from '../components/business/Header';
import { OptimizedAssetPanel } from '../components/business/OptimizedAssetPanel';
import { OptimizedTemplatePanel } from '../components/business/OptimizedTemplatePanel';
import { AIDirectorPanel } from '../components/business/AIDirectorPanel';
import { OptimizedPreviewPlayer } from '../components/overlays/OptimizedPreviewPlayer';
import { PropertiesPanel } from '../components/business/PropertiesPanel';
import { OptimizedTimeline } from '../components/business/OptimizedTimeline';
import { ExportModal } from '../components/overlays/ExportModal';
import { LoadingOverlay } from '../components/common/LoadingOverlay';
import clsx from 'clsx';

interface WorkbenchLayoutProps {
  children?: React.ReactNode;
}

type LeftPanelMode = 'assets' | 'templates' | 'ai-director';

const PanelFallback = () => (
  <div className="flex-1 flex items-center justify-center">
    <div className="animate-spin h-5 w-5 border-2 border-brand-500 border-t-transparent rounded-full"></div>
  </div>
);

export const OptimizedWorkbenchLayout: React.FC<WorkbenchLayoutProps> = ({ children }) => {
  const [leftPanelMode, setLeftPanelMode] = useState<LeftPanelMode>('assets');

  return (
    <div className="flex flex-col h-screen w-screen bg-bg-base text-white overflow-hidden font-sans p-3 gap-3">
      <Header />

      <div className="flex-1 flex gap-3 overflow-hidden min-h-0">
        <div className="glass-panel w-[280px] flex flex-col">
          <div className="flex border-b border-white/5">
            <button
              onClick={() => setLeftPanelMode('assets')}
              className={clsx(
                "flex-1 py-2 text-xs font-medium transition-colors",
                leftPanelMode === 'assets'
                  ? "text-brand-400 border-b-2 border-brand-400"
                  : "text-gray-400 hover:text-white"
              )}
            >
              素材库
            </button>
            <button
              onClick={() => setLeftPanelMode('templates')}
              className={clsx(
                "flex-1 py-2 text-xs font-medium transition-colors",
                leftPanelMode === 'templates'
                  ? "text-brand-400 border-b-2 border-brand-400"
                  : "text-gray-400 hover:text-white"
              )}
            >
              模板
            </button>
            <button
              onClick={() => setLeftPanelMode('ai-director')}
              className={clsx(
                "flex-1 py-2 text-xs font-medium transition-colors",
                leftPanelMode === 'ai-director'
                  ? "text-brand-400 border-b-2 border-brand-400"
                  : "text-gray-400 hover:text-white"
              )}
            >
              🎬 AI导演
            </button>
          </div>

          <div className="flex-1 overflow-hidden">
            {leftPanelMode === 'assets' && <OptimizedAssetPanel />}
            {leftPanelMode === 'templates' && <OptimizedTemplatePanel />}
            {leftPanelMode === 'ai-director' && <AIDirectorPanel />}
          </div>
        </div>

        <div className="flex-1 flex flex-col relative rounded-2xl overflow-hidden">
          <OptimizedPreviewPlayer />
        </div>

        <div className="glass-panel w-[320px] flex flex-col">
          <PropertiesPanel />
        </div>
      </div>

      <div className="glass-panel h-1/3 flex flex-col">
        <OptimizedTimeline />
      </div>

      <ExportModal />

      {children}
    </div>
  );
};
