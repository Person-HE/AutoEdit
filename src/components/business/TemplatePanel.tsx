import React, { useState } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { getAllTemplates, getTemplateCategories, TemplateDefinition } from '../../engine/templates';
import clsx from 'clsx';

export const TemplatePanel: React.FC = () => {
  const { project, addTemplateClip } = useProjectStore();
  const [expandedCategory, setExpandedCategory] = useState<string | null>('ui');

  // 处理添加模板
  const handleAddTemplate = (templateId: string) => {
    // 获取第一个视频轨道
    const videoTrack = project?.tracks.find(t => t.type === 'video');
    if (!videoTrack) {
      alert('请先创建一个视频轨道');
      return;
    }
    
    // 计算添加时间（当前播放位置或轨道末尾）
    const clipsInTrack = Object.values(project?.clips || {}).filter(c => c.trackId === videoTrack.id);
    const lastClipEnd = clipsInTrack.length > 0 
      ? Math.max(...clipsInTrack.map(c => c.startTime + c.duration))
      : 0;
    
    const success = addTemplateClip(templateId, videoTrack.id, lastClipEnd);
    if (success) {
      console.log(`✅ Added template: ${templateId}`);
    }
  };

  // 处理模板拖拽
  const handleTemplateDragStart = (e: React.DragEvent, templateId: string) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ 
      type: 'template', 
      templateId 
    }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="flex flex-col h-full select-none">
      {/* Header */}
      <div className="p-3 border-b border-white/5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">模板库</h3>
          <span className="text-[10px] text-gray-500">点击或拖拽添加</span>
        </div>
      </div>

      {/* Template Categories */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {getTemplateCategories().map(({ key, name }) => (
          <div key={key} className="rounded-xl overflow-hidden border border-white/5 bg-white/[0.02]">
            <div 
              onClick={() => setExpandedCategory(expandedCategory === key ? null : key)}
              className="px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider bg-white/5 cursor-pointer hover:bg-white/10 flex justify-between items-center"
            >
              {name}
              <span className={clsx("transition-transform", expandedCategory === key ? "rotate-180" : "")}>▼</span>
            </div>
            
            {expandedCategory === key && (
              <div className="p-2 grid grid-cols-1 gap-2 animate-fade-in">
                {getAllTemplates().filter((t: TemplateDefinition) => t.category === key).map((template: TemplateDefinition) => (
                  <div 
                    key={template.id}
                    draggable
                    onDragStart={(e) => handleTemplateDragStart(e, template.id)}
                    onClick={() => handleAddTemplate(template.id)}
                    className="p-3 bg-black/20 hover:bg-brand-500/10 border border-white/5 hover:border-brand-500/50 rounded-lg cursor-pointer transition-all active:scale-95 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-500/20 to-purple-500/20 flex items-center justify-center text-lg">
                        {template.category === 'ui' && '⌨️'}
                        {template.category === 'code' && '💻'}
                        {template.category === 'text' && '📝'}
                        {template.category === 'effect' && '✨'}
                        {template.category === 'transition' && '🎬'}
                        {template.category === 'other' && '📦'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-300 group-hover:text-white font-medium truncate">{template.name}</div>
                        <div className="text-[10px] text-gray-500 truncate">{template.description}</div>
                      </div>
                      <div className="text-gray-500 group-hover:text-brand-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="12" y1="5" x2="12" y2="19"></line>
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                      </div>
                    </div>
                  </div>
                ))}
                {getAllTemplates().filter((t: TemplateDefinition) => t.category === key).length === 0 && (
                  <div className="text-[10px] text-gray-600 text-center py-2">暂无模板</div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
