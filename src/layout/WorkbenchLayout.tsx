import React, { useState, Suspense, lazy } from 'react';
import { Header } from '../components/business/Header';
import { AssetPanel } from '../components/business/AssetPanel';
import { TemplatePanel } from '../components/business/TemplatePanel';
import { useAppRouter } from '../store/useAppRouter';
import { PreviewPlayer } from '../components/overlays/PreviewPlayer';
import { PropertiesPanel } from '../components/business/PropertiesPanel';
import { Timeline } from '../components/business/Timeline';
import { ExportModal } from '../components/overlays/ExportModal';
import { LoadingOverlay } from '../components/common/LoadingOverlay';
import clsx from 'clsx';

interface WorkbenchLayoutProps {
  children?: React.ReactNode;
}

type LeftPanelMode = 'assets' | 'templates';

const PanelFallback = () => (
  <div className="flex-1 flex items-center justify-center">
    <div className="animate-spin h-5 w-5 border-2 border-brand-500 border-t-transparent rounded-full"></div>
  </div>
);

export const WorkbenchLayout: React.FC<WorkbenchLayoutProps> = ({ children }) => {
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
              onClick={() => useAppRouter.getState().goToDirector()}
              className={clsx(
                "flex-1 py-2 text-xs font-medium transition-colors",
                "text-gray-400 hover:text-white"
              )}
              title="进入全屏 AI 导演页"
            >
              <svg className="inline w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>AI导演
            </button>
          </div>

          <div className="flex-1 overflow-hidden">
            {leftPanelMode === 'assets' && <AssetPanel />}
            {leftPanelMode === 'templates' && <TemplatePanel />}
          </div>
        </div>

        <div className="flex-1 flex flex-col relative rounded-2xl overflow-hidden">
          <PreviewPlayer />
        </div>

        <div className="glass-panel w-[320px] flex flex-col">
          <PropertiesPanel />
        </div>
      </div>

      <div className="glass-panel h-1/3 flex flex-col">
        <Timeline />
      </div>

      <ExportModal />

      {children}
    </div>
  );
};
