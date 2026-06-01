import { AgentTool, ToolResult, AgentContext } from '../core/AgentTypes';
import { useProjectStore } from '../../../store/useProjectStore';

const manageTrackTool: AgentTool = {
  name: 'manage_track',
  description:
    '管理项目轨道：创建新轨道、删除轨道、重命名轨道、调整轨道顺序。AI智能体可以根据内容需求自动创建合适的轨道结构。',
  parameters: [
    {
      name: 'action',
      type: 'string',
      description: '操作类型: create(创建), delete(删除), rename(重命名), reorder(排序), list(列出所有)',
      required: true,
      enum: ['create', 'delete', 'rename', 'reorder', 'list'],
    },
    {
      name: 'trackType',
      type: 'string',
      description: '轨道类型: video(视频), audio(音频), text(文字)。create操作必需',
      required: false,
      enum: ['video', 'audio', 'text'],
    },
    {
      name: 'trackId',
      type: 'string',
      description: '目标轨道ID。delete/rename操作必需',
      required: false,
    },
    {
      name: 'newName',
      type: 'string',
      description: '新名称（rename操作使用）',
      required: false,
    },
    {
      name: 'trackIds',
      type: 'array',
      description: '轨道ID排序数组（reorder操作使用）',
      required: false,
    },
  ],
  async execute(params, context: AgentContext) {
    try {
      const projectState = useProjectStore.getState();
      const tracks = projectState.project.tracks;

      switch (params.action) {
        case 'list': {
          return {
            success: true,
            data: {
              tracks: tracks.map(t => ({
                id: t.id,
                type: t.type,
                name: t.name,
                visible: t.visible,
                locked: t.locked,
              })),
              count: tracks.length,
            },
          };
        }

        case 'create': {
          if (!params.trackType) {
            return { success: false, error: 'create操作需要提供trackType参数' };
          }
          useProjectStore.getState().addTrack(params.trackType);
          const newTracks = useProjectStore.getState().project.tracks;
          const created = newTracks[newTracks.length - 1];
          return {
            success: true,
            data: {
              trackId: created.id,
              type: created.type,
              name: created.name,
              allTracks: newTracks.map(t => ({ id: t.id, type: t.type, name: t.name })),
            },
          };
        }

        case 'delete': {
          if (!params.trackId) {
            return { success: false, error: 'delete操作需要提供trackId参数' };
          }
          const trackExists = tracks.find(t => t.id === params.trackId);
          if (!trackExists) {
            return { success: false, error: `轨道 ${params.trackId} 不存在` };
          }
          useProjectStore.getState().removeTrack(params.trackId);
          return {
            success: true,
            data: {
              deletedTrackId: params.trackId,
              remainingTracks: useProjectStore.getState().project.tracks.length,
            },
          };
        }

        case 'rename': {
          if (!params.trackId || !params.newName) {
            return { success: false, error: 'rename操作需要提供trackId和newName参数' };
          }
          useProjectStore.getState().updateTrack(params.trackId, { name: params.newName });
          return {
            success: true,
            data: {
              trackId: params.trackId,
              newName: params.newName,
            },
          };
        }

        case 'reorder': {
          if (!Array.isArray(params.trackIds)) {
            return { success: false, error: 'reorder操作需要提供trackIds数组' };
          }
          return {
            success: true,
            data: {
              message: '轨道排序功能需要在TrackStore中实现',
              requestedOrder: params.trackIds,
            },
          };
        }

        default:
          return { success: false, error: `未知操作: ${params.action}` };
      }
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  },
};

export { manageTrackTool };
