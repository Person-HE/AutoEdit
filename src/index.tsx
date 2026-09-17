
import React from 'react';
import ReactDOM from 'react-dom/client';
import EditorPage from './pages/EditorPage';
import AIDirectorPage from './pages/AIDirectorPage';
import { useAppRouter } from './store/useAppRouter';
import './exportFrameBridge';

if (import.meta.env.DEV) {
  import('./test/aiAgentTest');
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

function AppShell() {
  const currentPage = useAppRouter((s) => s.currentPage);
  return (
    <React.StrictMode>
      {currentPage === 'director' ? <AIDirectorPage /> : <EditorPage />}
    </React.StrictMode>
  );
}

/** P7 将替换为完整的 AIDirectorPage */
const AIDirectorPlaceholder: React.FC = () => (
  <div className="h-screen w-screen flex items-center justify-center bg-[#0a0a0f] text-gray-300">
    <button
      className="px-6 py-3 rounded-xl bg-brand-500/20 border border-brand-500/40 text-brand-400 hover:bg-brand-500/30"
      onClick={() => useAppRouter.getState().goToEditor()}
    >
      AI 导演页重建中,点击返回编辑器
    </button>
  </div>
);

root.render(<AppShell />);
