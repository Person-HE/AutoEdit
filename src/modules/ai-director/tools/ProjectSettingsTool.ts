import { AgentTool, ToolResult, AgentContext } from '../core/AgentTypes';
import { useProjectStore } from '../../../store/useProjectStore';

const projectSettingsTool: AgentTool = {
  name: 'update_project_settings',
  description:
    '更新项目设置：画布尺寸、帧率、时长、项目名称等。AI智能体可以根据视频需求调整项目参数。',
  parameters: [
    {
      name: 'name',
      type: 'string',
      description: '新项目名称',
      required: false,
    },
    {
      name: 'width',
      type: 'number',
      description: '画布宽度（像素）',
      required: false,
    },
    {
      name: 'height',
      type: 'number',
      description: '画布高度（像素）',
      required: false,
    },
    {
      name: 'duration',
      type: 'number',
      description: '项目总时长（秒）',
      required: false,
    },
    {
      name: 'fps',
      type: 'number',
      description: '帧率（fps）',
      required: false,
    },
  ],
  async execute(params, context: AgentContext) {
    try {
      const projectState = useProjectStore.getState();
      const project = projectState.project;
      const changes: any = {};

      if (params.name !== undefined) changes.name = params.name;
      if (params.width !== undefined) changes.width = params.width;
      if (params.height !== undefined) changes.height = params.height;
      if (params.duration !== undefined) changes.duration = params.duration;
      if (params.fps !== undefined) changes.fps = params.fps;

      if (Object.keys(changes).length === 0) {
        return { success: false, error: '没有提供任何要更新的设置' };
      }

      useProjectStore.setState({
        project: { ...project, ...changes, lastModified: Date.now() },
      });

      return {
        success: true,
        data: {
          updatedFields: Object.keys(changes),
          newSettings: { ...project, ...changes },
        },
      };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  },
};

export { projectSettingsTool };
