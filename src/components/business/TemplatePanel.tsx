import React, { useState, useCallback, useMemo, memo } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { getAllTemplates, getTemplateCategories, TemplateDefinition } from '../../engine/templates';
import clsx from 'clsx';

const TemplateCard = memo(({ template, onClick, onDragStart }: {
  template: TemplateDefinition;
  onClick: () => void;
  onDragStart: (e: React.DragEvent) => void;
}) => (
  <div
    draggable
    onDragStart={onDragStart}
    onClick={onClick}
    className="p-3 bg-black/20 hover:bg-brand-500/10 border border-white/5 hover:border-brand-500/50 rounded-lg cursor-pointer transition-all active:scale-95 group"
  >
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500/20 to-purple-500/20 flex items-center justify-center shrink-0">
        {template.category === 'ui' && (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>
        )}
        {template.category === 'code' && (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
        )}
        {template.category === 'text' && (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        )}
        {template.category === 'effect' && (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
        )}
        {template.category === 'other' && (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-gray-300 group-hover:text-white font-medium truncate">{template.name}</div>
        <div className="text-[10px] text-gray-500 truncate">{template.description}</div>
      </div>
      <div className="text-gray-500 group-hover:text-brand-400 shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
      </div>
    </div>
  </div>
));

export const TemplatePanel: React.FC = () => {
  const project = useProjectStore((s) => s.project);
  const addTemplateClip = useProjectStore((s) => s.addTemplateClip);
  const [expandedCategory, setExpandedCategory] = useState<string | null>('ui');

  const handleAddTemplate = useCallback((templateId: string) => {
    const videoTrack = project?.tracks.find(t => t.type === 'video');
    if (!videoTrack) {
      alert('请先创建一个视频轨道');
      return;
    }
    const clipsInTrack = Object.values(project?.clips || {}).filter(c => c.trackId === videoTrack.id);
    const lastClipEnd = clipsInTrack.length > 0
      ? Math.max(...clipsInTrack.map(c => c.startTime + c.duration))
      : 0;
    const success = addTemplateClip(templateId, videoTrack.id, lastClipEnd);
    if (success) {
      console.log(`✅ Added template: ${templateId}`);
    }
  }, [project, addTemplateClip]);

  const handleTemplateDragStart = useCallback((e: React.DragEvent, templateId: string) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'template',
      templateId
    }));
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  const categories = useMemo(() => getTemplateCategories(), []);

  const templatesByCategory = useMemo(() => {
    const allTemplates = getAllTemplates();
    const result: Record<string, TemplateDefinition[]> = {};
    for (const cat of categories) {
      result[cat.key] = allTemplates.filter((t: TemplateDefinition) => t.category === cat.key);
    }
    return result;
  }, [categories]);

  return (
    <div className="flex flex-col h-full select-none">
      <div className="p-3 border-b border-white/5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">模板库</h3>
          <span className="text-[10px] text-gray-500">点击或拖拽添加</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {categories.map((cat) => {
          const isExpanded = expandedCategory === cat.key;
          const catTemplates = templatesByCategory[cat.key] || [];
          return (
            <div key={cat.key} className="rounded-xl overflow-hidden border border-white/5 bg-white/[0.02] mb-2">
              <div
                onClick={() => setExpandedCategory(isExpanded ? null : cat.key)}
                className="px-3 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider bg-white/5 cursor-pointer hover:bg-white/10 flex justify-between items-center"
              >
                <span>{cat.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-500">{catTemplates.length}</span>
                  <svg className={clsx("w-3 h-3 transition-transform text-gray-500", isExpanded ? "rotate-180" : "")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
              </div>
              {isExpanded && (
                <div className="p-2 space-y-2 animate-fade-in">
                  {catTemplates.map((template: TemplateDefinition) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      onClick={() => handleAddTemplate(template.id)}
                      onDragStart={(e) => handleTemplateDragStart(e, template.id)}
                    />
                  ))}
                  {catTemplates.length === 0 && (
                    <div className="text-[10px] text-gray-600 text-center py-2">暂无模板</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
