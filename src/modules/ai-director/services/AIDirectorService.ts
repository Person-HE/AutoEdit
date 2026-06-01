import { aiService } from './AIService';
import { projectAdapter } from '../adapters/ProjectAdapter';
import { buildShotDataPrompt } from '../prompts/promptTemplates';

export interface AIDirectorProgress {
  stage: 'analyzing' | 'generating_prompts' | 'generating_shot' | 'processing_text' | 'adding_to_project' | 'complete' | 'error';
  message: string;
  progress: number;
  detail?: any;
}

interface AIDirectorConfig {
  generateAssets?: boolean;
  onProgress?: (progress: AIDirectorProgress) => void;
}

export interface AIDirectorResult {
  success: boolean;
  error?: string;
  data?: {
    analysis?: any;
    prompts?: any[];
    shotData?: any;
    textLines?: any[];
    clipsAdded?: string[];
  };
}

export class AIDirectorService {
  private config: AIDirectorConfig;

  constructor(config: AIDirectorConfig = {}) {
    this.config = {
      generateAssets: false,
      onProgress: () => {},
      ...config
    };
  }

  private updateProgress(stage: AIDirectorProgress['stage'], message: string, progress: number, detail?: any) {
    this.config.onProgress?.({ stage, message, progress, detail });
    console.log(`[AI Director] ${stage}: ${message} (${progress}%)`);
  }

  async generateFromInput(userInput: string): Promise<AIDirectorResult> {
    try {
      this.updateProgress('analyzing', '正在分析您的需求...', 5);

      const analysis = await aiService.analyzeUserInput(userInput);
      console.log('[AI Director] 分析完成:', analysis);

      this.updateProgress('analyzing', '分析完成，正在准备素材...', 20, analysis);

      if (analysis.materials && analysis.materials.length > 0) {
        this.updateProgress('generating_prompts', '正在生成素材提示词...', 25);

        const materialDescriptions = analysis.materials.map(m => m.description);
        const prompts = await aiService.generateImagePrompts(materialDescriptions);

        console.log('[AI Director] 提示词生成完成:', prompts);
        this.updateProgress('generating_prompts', '提示词生成完成...', 40, prompts);
      }

      this.updateProgress('generating_shot', '正在生成分镜数据...', 45);

      const shotDescription = analysis.shots?.[0]?.description || userInput;
      const systemPrompt = buildShotDataPrompt();
      const shotData = await aiService.generateShotData(shotDescription, systemPrompt);

      console.log('[AI Director] 分镜数据生成完成:', shotData);
      this.updateProgress('generating_shot', '分镜数据生成完成...', 60, shotData);

      this.updateProgress('processing_text', '正在处理文案...', 65);

      let textLines: any[] = [];
      if (analysis.textContent) {
        textLines = await aiService.processTextContent(analysis.textContent);
        console.log('[AI Director] 文案处理完成:', textLines);
      }

      this.updateProgress('processing_text', '文案处理完成...', 80, textLines);

      this.updateProgress('adding_to_project', '正在添加到轨道...', 85);

      const clipIds = await this.addShotToProject(shotData, textLines, userInput);

      console.log('[AI Director] 已添加到项目:', clipIds);
      this.updateProgress('complete', '✅ 视频片段已生成！', 100, { clipIds });

      return {
        success: true,
        data: {
          analysis,
          shotData,
          textLines,
          clipsAdded: clipIds
        }
      };

    } catch (error: any) {
      console.error('[AI Director] 错误:', error);
      this.updateProgress('error', `错误: ${error.message}`, 0);

      return {
        success: false,
        error: error.message
      };
    }
  }

  private async addShotToProject(shotData: any, textLines: any[], userInput: string): Promise<string[]> {
    const projectState = projectAdapter.getProjectState();
    const addedClipIds: string[] = [];

    if (!shotData || !shotData.shots || shotData.shots.length === 0) {
      throw new Error('无效的分镜数据');
    }

    const shot = shotData.shots[0];
    const startTime = projectState.currentTime;

    if (shot.materials && shot.materials.length > 0) {
      for (const material of shot.materials) {
        try {
          const asset = {
            id: material.id,
            name: `AI生成素材_${material.id}`,
            type: 'image' as const,
            url: '',
            width: 1920,
            height: 1080,
            thumbnailUrl: '',
            createdAt: Date.now(),
          };

          projectAdapter.addAssetsToProject([asset]);

          const clip = projectAdapter.addClipToProject({
            type: 'video',
            assetId: material.id,
            trackId: 'track_video_1',
            startTime,
            duration: shot.duration
          });

          if (clip) {
            projectAdapter.updateClip(clip.id, {
              duration: shot.duration,
              transform: { x: 0, y: 0, scale: 1, rotation: 0 },
              style: { opacity: 1, zIndex: 1 }
            });

            addedClipIds.push(clip.id);
          }
        } catch (e) {
          console.error(`添加素材 ${material.id} 失败:`, e);
        }
      }
    }

    const textsToUse = textLines.length > 0 ? textLines : (shot.texts || []);

    for (let i = 0; i < textsToUse.length; i++) {
      try {
        const textItem = textsToUse[i];
        const content = textItem.content || '';
        const layoutId = textItem.layoutId || 'bottom_center';
        const presetId = textItem.presetId || 'entrance_fade_in';

        let fontSize = 36;
        let yPosition = 400;

        switch (layoutId) {
          case 'top_center':
            fontSize = 48;
            yPosition = -300;
            break;
          case 'center':
            fontSize = 56;
            yPosition = 0;
            break;
          case 'bottom_center':
            fontSize = 36;
            yPosition = 350;
            break;
          default:
            fontSize = 36;
            yPosition = 300;
        }

        const clip = projectAdapter.addClipToProject({
          type: 'text',
          trackId: 'track_text_1',
          startTime,
          duration: shot.duration,
          textData: {
            content: content.substring(0, 15),
            fontSize,
            color: '#ffffff',
            fontFamily: 'Arial',
          },
          transform: {
            x: 0,
            y: yPosition,
            scale: 1,
            rotation: 0
          }
        });

        if (clip) {
          if (presetId && presetId.startsWith('entrance')) {
            projectAdapter.applyEffectToClip(clip.id, presetId);
          }

          addedClipIds.push(clip.id);
        }
      } catch (e) {
        console.error(`添加文本 ${i} 失败:`, e);
      }
    }

    if (addedClipIds.length === 0) {
      const defaultText = userInput.substring(0, 10);
      const clip = projectAdapter.addClipToProject({
        type: 'text',
        trackId: 'track_text_1',
        startTime,
        duration: 5,
        textData: {
          content: defaultText,
          fontSize: 48,
          color: '#ffffff',
          fontFamily: 'Arial',
        },
        transform: { x: 0, y: 0, scale: 1, rotation: 0 }
      });

      if (clip) {
        projectAdapter.applyEffectToClip(clip.id, 'entrance_fade_in');
        addedClipIds.push(clip.id);
      }
    }

    return addedClipIds;
  }

  private async generateAssetsWithComfyUI(prompts: any[]): Promise<void> {
    console.log('[AI Director] ComfyUI素材生成功能待实现');
  }
}

export const aiDirectorService = new AIDirectorService();

export async function generateAIVideo(
  userInput: string,
  onProgress?: (progress: AIDirectorProgress) => void
): Promise<AIDirectorResult> {
  const service = new AIDirectorService({ onProgress });
  return service.generateFromInput(userInput);
}
