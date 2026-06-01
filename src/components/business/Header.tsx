import React, { useState, useRef, useEffect } from 'react';
import { useUIStore } from '../../store/useUIStore';
import { useProjectStore } from '../../store/useProjectStore';
import { projectService } from '../../services/projectService';
import { fileStorage } from '../../services/fileStorage';
import clsx from 'clsx';

export const Header: React.FC = () => {
  const { setIsExportModalOpen } = useUIStore();
  const { project, createNewProject, deleteProject, renameProject, switchProject } = useProjectStore();
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [projects, setProjects] = useState<{ id: string; name: string; lastModified: number }[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    const recentProjects = await projectService.getRecentProjects();
    setProjects(recentProjects);
  };

  const handleExport = () => {
    setIsExportModalOpen(true);
  };

  const handleNewProject = async () => {
    setIsNewProjectModalOpen(true);
    setNewProjectName(`未命名项目_${new Date().toLocaleDateString()}`);
  };

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    if (confirm(`确定要删除项目 "${projectName}" 吗？`)) {
      await deleteProject(projectId);
      await loadProjects();
      if (project?.id === projectId) {
        window.location.reload();
      }
    }
  };

  const handleRenameProject = async () => {
    if (!newProjectName.trim()) return;
    
    try {
      await renameProject(project.id, newProjectName);
      await loadProjects();
      setIsRenameModalOpen(false);
      setNewProjectName('');
    } catch (error) {
      alert('重命名失败：' + error);
    }
  };

  const handleSwitchProject = async (projectId: string) => {
    await switchProject(projectId);
    await loadProjects();
    setIsProjectMenuOpen(false);
  };

  const handleClearData = () => {
    if (confirm('确定要清除所有数据吗？这将删除所有项目和素材。')) {
      fileStorage.clearAllData();
      window.location.reload();
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsProjectMenuOpen(false);
      }
    };

    if (isProjectMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProjectMenuOpen]);

  return (
    <header className="h-14 px-4 shrink-0 flex items-center justify-between z-50 bg-[#1E1E24] border border-white/10 rounded-2xl shadow-glass relative">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-brand-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </div>
          <div className="font-bold text-lg tracking-tight text-white">
            NanoEdit <span className="text-brand-500">Pro</span>
          </div>
        </div>
        
        <div className="text-xs text-gray-400 bg-black/20 px-3 py-1 rounded-full border border-white/5">
          {project?.name || 'Loading...'}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setIsProjectMenuOpen(!isProjectMenuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all duration-200 border border-transparent hover:bg-white/5 text-gray-300 hover:text-white"
          >
            <span>项目</span>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="12" height="12" 
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className={clsx("transition-transform duration-200", isProjectMenuOpen ? "rotate-180" : "")}
            >
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </button>
          
          {isProjectMenuOpen && (
            <div className="absolute top-full right-0 mt-2 w-64 glass-modal p-2 z-50 animate-scale-in origin-top-right shadow-2xl">
              <div className="mb-2">
                <button 
                  onClick={handleNewProject}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-brand-400 hover:bg-brand-500/10 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  <span>新建项目</span>
                </button>
              </div>
              
              <div className="max-h-64 overflow-y-auto">
                {projects.map(p => (
                  <div 
                    key={p.id}
                    className={clsx(
                      "flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors mb-1",
                      project?.id === p.id 
                        ? "bg-brand-500/20 text-brand-400 border border-brand-500/30" 
                        : "hover:bg-white/10 text-gray-300"
                    )}
                  >
                    <button 
                      onClick={() => handleSwitchProject(p.id)}
                      className="flex-1 text-left"
                    >
                      {p.name}
                    </button>
                    <div className="flex items-center gap-1">
                      {project?.id === p.id && (
                        <button 
                          onClick={() => {
                            setNewProjectName(p.name);
                            setIsRenameModalOpen(true);
                          }}
                          className="p-1 hover:text-brand-400 transition-colors"
                          title="重命名"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 0 2 2h14a2 2 0 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4H2a2 2 0 0 0-2-2V4a2 2 0 0 0 2-2h2.5a2.121 2.121 0 0 1 3-3Z"/></svg>
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeleteProject(p.id, p.name)}
                        className="p-1 hover:text-red-400 transition-colors"
                        title="删除"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <button 
          onClick={handleExport}
          className="btn-primary px-4 py-1.5 text-xs flex items-center gap-2"
        >
          <span>导出</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        </button>

        <button 
          onClick={handleClearData}
          className="px-3 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
        >
          清除数据
        </button>
      </div>

      {isRenameModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="glass-modal p-4 rounded-xl w-80">
            <h3 className="text-sm font-bold text-white mb-3">重命名项目</h3>
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-brand-500 outline-none mb-3"
              placeholder="输入项目名称"
              autoFocus
            />
            <div className="flex gap-2">
              <button 
                onClick={() => setIsRenameModalOpen(false)}
                className="flex-1 px-3 py-2 rounded-lg text-xs text-gray-300 hover:bg-white/10 transition-colors"
              >
                取消
              </button>
              <button 
                onClick={handleRenameProject}
                className="flex-1 btn-primary px-3 py-2 rounded-lg text-xs"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {isNewProjectModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="glass-modal p-4 rounded-xl w-80">
            <h3 className="text-sm font-bold text-white mb-3">新建项目</h3>
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-brand-500 outline-none mb-3"
              placeholder="输入项目名称"
              autoFocus
            />
            <div className="flex gap-2">
              <button 
                onClick={() => setIsNewProjectModalOpen(false)}
                className="flex-1 px-3 py-2 rounded-lg text-xs text-gray-300 hover:bg-white/10 transition-colors"
              >
                取消
              </button>
              <button 
                onClick={async () => {
                  if (newProjectName.trim()) {
                    await createNewProject(newProjectName);
                    await loadProjects();
                    setIsNewProjectModalOpen(false);
                    setIsProjectMenuOpen(false);
                  }
                }}
                className="flex-1 btn-primary px-3 py-2 rounded-lg text-xs"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
