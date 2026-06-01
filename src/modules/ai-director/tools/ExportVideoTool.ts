import { AgentTool, ToolResult, AgentContext } from '../core/AgentTypes';
import { useProjectStore } from '../../../store/useProjectStore';

const exportVideoTool: AgentTool = {
  name: 'export_video',
  description:
    '导出项目为视频文件。AI智能体可以在完成视频创作后触发导出流程，生成最终视频文件。',
  parameters: [
    {
      name: 'format',
      type: 'string',
      description: '导出格式: mp4(默认), webm, gif',
      required: false,
      enum: ['mp4', 'webm', 'gif'],
      default: 'mp4',
    },
    {
      name: 'quality',
      type: 'string',
      description: '导出质量: high(高质量), medium(中等), low(低质量/快速)',
      required: false,
      enum: ['high', 'medium', 'low'],
      default: 'high',
    },
  ],
  async execute(params, context: AgentContext) {
    try {
      const projectState = useProjectStore.getState();
      const project = projectState.project;
      const clips = Object.values(project.clips || {});

      if (clips.length === 0) {
        return { success: false, error: '项目中没有片段，无法导出' };
      }

      const format = params.format || 'mp4';
      const quality = params.quality || 'high';

      const qualitySettings: Record<string, { bitrate: string; preset: string }> = {
        high: { bitrate: '8000k', preset: 'slow' },
        medium: { bitrate: '4000k', preset: 'medium' },
        low: { bitrate: '2000k', preset: 'fast' },
      };

      const settings = qualitySettings[quality];

      return {
        success: true,
        data: {
          projectName: project.name,
          format,
          quality,
          resolution: `${project.width}x${project.height}`,
          duration: project.duration,
          fps: project.fps,
          clipCount: clips.length,
          trackCount: project.tracks.length,
          bitrate: settings.bitrate,
          preset: settings.preset,
          message: '导出任务已准备。请在UI中点击导出按钮开始渲染。',
        },
        metadata: {
          readyToExport: true,
          estimatedFileSize: `${Math.round((project.duration * parseInt(settings.bitrate)) / 8 / 1024 / 1024)}MB`,
        },
      };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  },
};

export { exportVideoTool };
