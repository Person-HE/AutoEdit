import { AgentTool, ToolResult, AgentContext } from '../core/AgentTypes';
import { projectAdapter } from '../adapters/ProjectAdapter';
import { useProjectStore } from '../../../store/useProjectStore';
import { getTemplate, getAllTemplates, getTemplatesByCategory } from '../../../engine/templates';

const useTemplateTool: AgentTool = {
  name: 'use_template',
  description:
    '使用项目中的模板创建片段并添加到轨道。支持按模板ID或名称关键词搜索模板。模板是预定义的可复用视频片段结构。',
  parameters: [
    {
      name: 'templateQuery',
      type: 'string',
      description: '模板查询：模板ID、名称关键词、或类别名',
      required: true,
    },
    {
      name: 'trackId',
      type: 'string',
      description: '目标轨道ID，不提供则自动分配到视频轨道',
      required: false,
    },
    {
      name: 'startTime',
      type: 'number',
      description: '开始时间（秒）',
      required: false,
      default: 0,
    },
    {
      name: 'duration',
      type: 'number',
      description: '持续时长（秒）',
      required: false,
      default: 5,
    },
    {
      name: 'templateParams',
      type: 'object',
      description: '模板自定义参数，覆盖默认值',
      required: false,
    },
    {
      name: 'presetId',
      type: 'string',
      description: '额外应用的入场动画预设ID',
      required: false,
    },
  ],
  async execute(params, context: AgentContext) {
    try {
      let template = getTemplate(params.templateQuery);

      if (!template) {
        const lowerQuery = params.templateQuery.toLowerCase();
        const allTemplates = getAllTemplates();
        const matches = allTemplates.filter(t =>
          t.name.toLowerCase().includes(lowerQuery) ||
          t.id.toLowerCase().includes(lowerQuery) ||
          t.description?.toLowerCase().includes(lowerQuery) ||
          t.category.toLowerCase().includes(lowerQuery)
        );
        if (matches.length > 0) {
          template = matches[0];
        }
      }

      if (!template) {
        const allTemplates = getAllTemplates().slice(0, 10);
        return {
          success: false,
          error: `未找到模板: "${params.templateQuery}"。可用模板: ${allTemplates.map(t => `${t.name}(${t.id})`).join(', ') || '无'}`,
        };
      }

      const projectState = useProjectStore.getState();
      let trackId = params.trackId;
      if (!trackId) {
        const videoTrack = projectState.project.tracks.find(t => t.type === 'video');
        trackId = videoTrack?.id;
        if (!trackId) {
          useProjectStore.getState().addTrack('video');
          const newTrack = useProjectStore.getState().project.tracks.find(t => t.type === 'video');
          trackId = newTrack?.id;
        }
      }

      const startTime = params.startTime ?? context?.projectState?.currentTime ?? 0;
      const duration = params.duration ?? 5;

      const clip = projectAdapter.addClipToProject({
        type: 'template',
        templateId: template.id,
        trackId: trackId!,
        startTime,
        duration,
        templateParams: params.templateParams || {},
        name: template.name,
      });

      if (!clip) {
        return { success: false, error: '创建模板片段失败' };
      }

      if (params.presetId) {
        projectAdapter.applyEffectToClip(clip.id, params.presetId);
      }

      if (!context.workingMemory.addedClipIds) {
        context.workingMemory.addedClipIds = [];
      }
      context.workingMemory.addedClipIds.push(clip.id);

      return {
        success: true,
        data: {
          clipId: clip.id,
          templateId: template.id,
          templateName: template.name,
          trackId,
          startTime,
          duration,
          params: params.templateParams,
        },
        metadata: { totalAdded: context.workingMemory.addedClipIds.length },
      };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  },
};

export { useTemplateTool };
