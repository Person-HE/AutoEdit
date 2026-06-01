import { AgentTool, ToolResult, AgentContext } from '../core/AgentTypes';
import { projectAdapter } from '../adapters/ProjectAdapter';
import { useProjectStore } from '../../../store/useProjectStore';

const updateClipTool: AgentTool = {
  name: 'update_clip',
  description:
    '更新已存在片段的属性：位置、大小、文字内容、颜色、字体、时长等。用于AI智能体根据需求调整已创建的片段。',
  parameters: [
    {
      name: 'clipId',
      type: 'string',
      description: '要更新的片段ID',
      required: true,
    },
    {
      name: 'content',
      type: 'string',
      description: '新的文本内容（仅text类型有效）',
      required: false,
    },
    {
      name: 'fontSize',
      type: 'number',
      description: '字体大小',
      required: false,
    },
    {
      name: 'color',
      type: 'string',
      description: '文字颜色（十六进制）',
      required: false,
    },
    {
      name: 'fontFamily',
      type: 'string',
      description: '字体名称',
      required: false,
    },
    {
      name: 'x',
      type: 'number',
      description: 'X坐标',
      required: false,
    },
    {
      name: 'y',
      type: 'number',
      description: 'Y坐标',
      required: false,
    },
    {
      name: 'scale',
      type: 'number',
      description: '缩放比例',
      required: false,
    },
    {
      name: 'rotation',
      type: 'number',
      description: '旋转角度（度）',
      required: false,
    },
    {
      name: 'duration',
      type: 'number',
      description: '新的持续时长（秒）',
      required: false,
    },
    {
      name: 'startTime',
      type: 'number',
      description: '新的开始时间（秒）',
      required: false,
    },
    {
      name: 'opacity',
      type: 'number',
      description: '不透明度（0-1）',
      required: false,
    },
  ],
  async execute(params, context: AgentContext) {
    try {
      const projectState = useProjectStore.getState();
      const clip = (projectState.project.clips || {})[params.clipId];

      if (!clip) {
        return { success: false, error: `片段 ${params.clipId} 不存在` };
      }

      const changes: any = {};

      if (params.duration !== undefined) changes.duration = params.duration;
      if (params.startTime !== undefined) changes.startTime = params.startTime;
      if (params.opacity !== undefined) changes.style = { ...clip.style, opacity: params.opacity };

      const transformChanges: any = {};
      if (params.x !== undefined) transformChanges.x = params.x;
      if (params.y !== undefined) transformChanges.y = params.y;
      if (params.scale !== undefined) transformChanges.scale = params.scale;
      if (params.rotation !== undefined) transformChanges.rotation = params.rotation;

      if (Object.keys(transformChanges).length > 0) {
        changes.transform = { ...clip.transform, ...transformChanges };
      }

      if (clip.type === 'text' && clip.textData) {
        const textChanges: any = {};
        if (params.content !== undefined) textChanges.content = params.content.slice(0, 100);
        if (params.fontSize !== undefined) textChanges.fontSize = params.fontSize;
        if (params.color !== undefined) textChanges.color = params.color;
        if (params.fontFamily !== undefined) textChanges.fontFamily = params.fontFamily;

        if (Object.keys(textChanges).length > 0) {
          changes.textData = { ...clip.textData, ...textChanges };
        }
      }

      if (Object.keys(changes).length === 0) {
        return { success: false, error: '没有提供任何要更新的属性' };
      }

      projectAdapter.updateClip(params.clipId, changes);

      return {
        success: true,
        data: {
          clipId: params.clipId,
          updatedFields: Object.keys(changes),
          changes,
        },
      };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  },
};

export { updateClipTool };
