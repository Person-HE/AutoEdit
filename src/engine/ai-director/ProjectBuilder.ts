/**
 * 项目构建器
 * 核心功能：将 AI 脚本 JSON 转换为项目数据
 * 
 * 关键点：
 * 1. 时序排序：分镜按 order 字段排序
 * 2. 时长对齐：每个分镜的 startTime = 前面所有分镜时长之和
 * 3. Clip 创建：正确设置 startTime, duration, transform
 * 4. 配音对齐：音频时长 = 文本时长 = 分镜时长
 */

import { v4 as uuidv4 } from 'uuid';
import { Project, Clip, Track, Asset, Effect, VoiceOver } from '../../types/core';
import { AIScript, Shot, TextElement, MaterialElement, BuildProgress, BuildResult, BuiltShot } from './AIScriptSchema';
import { GridSystem, CANVAS_CONFIG } from './GridSystem';
import { AIScriptValidator } from './AIScriptValidator';
import { indexTTSService } from '../../services/indexTtsService';
import { comfyUIService } from '../../services/comfyUIService';

export type BuildProgressCallback = (progress: BuildProgress) => void;

export interface ProjectBuilderConfig {
  generateAssets: boolean;
  generateDubbing: boolean;
  onProgress?: BuildProgressCallback;
}

const DEFAULT_CONFIG: ProjectBuilderConfig = {
  generateAssets: true,
  generateDubbing: true,
};

export class ProjectBuilder {
  private gridSystem: GridSystem;
  private validator: AIScriptValidator;
  private config: ProjectBuilderConfig;
  private assets: Asset[] = [];
  private clips: Record<string, Clip> = {};
  private tracks: Track[] = [];

  constructor(config: Partial<ProjectBuilderConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.validator = new AIScriptValidator();
    this.gridSystem = new GridSystem();
  }

  async build(script: AIScript): Promise<BuildResult> {
    this.assets = [];
    this.clips = {};
    this.tracks = [];

    const errors: string[] = [];
    const warnings: string[] = [];
    const builtShots: BuiltShot[] = [];

    try {
      this.reportProgress('validating', 0, '校验脚本...');

      const validationResult = this.validator.validate(script);
      if (!validationResult.valid) {
        errors.push(...validationResult.errors.map(e => e.message));
        return {
          success: false,
          projectId: '',
          totalDuration: 0,
          shots: [],
          errors,
          warnings,
        };
      }

      const validatedScript = validationResult.correctedScript || script;

      // 使用固定的16:9画布配置
      this.gridSystem = new GridSystem();

      this.reportProgress('building', 5, '初始化项目结构...');
      this.initializeTracks();

      const totalShots = validatedScript.shots.length;
      let currentProgress = 10;

      const sortedShots = [...validatedScript.shots].sort((a, b) => a.order - b.order);

      let currentTime = 0;

      for (let i = 0; i < sortedShots.length; i++) {
        const shot = sortedShots[i];
        const shotProgress = 10 + (i / totalShots) * 80;

        this.reportProgress('building', shotProgress, `构建分镜 ${i + 1}/${totalShots}...`, i + 1, totalShots);

        const shotStartTime = currentTime;
        const shotDuration = shot.duration;
        const shotEndTime = shotStartTime + shotDuration;

        const shotClipIds: string[] = [];

        if (this.config.generateAssets && shot.materials.length > 0) {
          this.reportProgress('generating_assets', shotProgress, `生成分镜 ${i + 1} 素材...`, i + 1, totalShots);
          await this.generateMaterialsForShot(shot, shotStartTime, shotDuration, shotClipIds, warnings);
        }

        for (const textElement of shot.texts) {
          const textClip = await this.createTextClip(
            textElement,
            shotStartTime,
            shotDuration,
            shotClipIds,
            warnings
          );

          if (textClip) {
            this.clips[textClip.id] = textClip;

            if (this.config.generateDubbing && textElement.dubbing?.enabled) {
              this.reportProgress('generating_dubbing', shotProgress + 5, `生成分镜 ${i + 1} 配音...`, i + 1, totalShots);
              await this.generateDubbingForText(textElement, textClip, shotDuration, warnings);
            }
          }
        }

        builtShots.push({
          shotId: shot.shotId,
          startTime: shotStartTime,
          endTime: shotEndTime,
          duration: shotDuration,
          clips: shotClipIds,
        });

        currentTime = shotEndTime;
      }

      const totalDuration = currentTime;

      const project = this.createProject(validatedScript, totalDuration);

      this.reportProgress('complete', 100, '构建完成');

      return {
        success: true,
        projectId: project.id,
        totalDuration,
        shots: builtShots,
        errors,
        warnings,
      };
    } catch (error) {
      errors.push(`构建失败: ${error instanceof Error ? error.message : String(error)}`);
      return {
        success: false,
        projectId: '',
        totalDuration: 0,
        shots: [],
        errors,
        warnings,
      };
    }
  }

  getProject(): Omit<Project, 'id' | 'name' | 'lastModified'> & { id: string; name: string; lastModified: number } {
    return {
      id: uuidv4(),
      name: 'AI Generated Project',
      width: this.gridSystem.getCanvasConfig().width,
      height: this.gridSystem.getCanvasConfig().height,
      duration: Object.values(this.clips).reduce((max, clip) => Math.max(max, clip.startTime + clip.duration), 0),
      fps: 60,
      tracks: this.tracks,
      clips: this.clips,
      lastModified: Date.now(),
    };
  }

  getAssets(): Asset[] {
    return this.assets;
  }

  getClips(): Record<string, Clip> {
    return this.clips;
  }

  getTracks(): Track[] {
    return this.tracks;
  }

  private initializeTracks(): void {
    this.tracks = [
      { id: 'track_text_1', type: 'text', name: '文本轨道 1', visible: true, locked: false },
      { id: 'track_video_1', type: 'video', name: '视频轨道 1', visible: true, locked: false },
      { id: 'track_audio_1', type: 'audio', name: '音频轨道 1', visible: true, locked: false },
    ];
  }

  private async generateMaterialsForShot(
    shot: Shot,
    startTime: number,
    duration: number,
    clipIds: string[],
    warnings: string[]
  ): Promise<void> {
    for (const material of shot.materials) {
      try {
        let asset: Asset | null = null;

        if (material.source === 'comfyui' && material.generatePrompt) {
          const result = await comfyUIService.generateImage({
            prompt: material.generatePrompt,
            negativePrompt: material.negativePrompt || '',
          });

          if (result.success && result.imageUrl) {
            asset = {
              id: uuidv4(),
              name: `AI Generated ${material.id}`,
              type: 'image',
              url: result.imageUrl,
              createdAt: Date.now(),
              duration: duration,
              width: this.gridSystem.getCanvasConfig().width,
              height: this.gridSystem.getCanvasConfig().height,
            };
            this.assets.push(asset);
          } else {
            warnings.push(`素材生成失败: ${material.id} - ${result.error || '未知错误'}`);
          }
        } else if (material.source === 'library' && material.assetId) {
          asset = this.assets.find(a => a.id === material.assetId) || null;
        }

        if (asset) {
          const clip = this.createMaterialClip(material, asset, startTime, duration);
          this.clips[clip.id] = clip;
          clipIds.push(clip.id);
        }
      } catch (error) {
        warnings.push(`素材处理失败: ${material.id} - ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  private createMaterialClip(
    material: MaterialElement,
    asset: Asset,
    startTime: number,
    duration: number
  ): Clip {
    const gridMetadata = this.gridSystem.getMetadata(material.layoutId);
    const effects: Effect[] = [];

    if (material.animation?.entrance) {
      effects.push(this.createEffect(material.animation.entrance, 'entrance', duration));
    }
    if (material.animation?.exit) {
      effects.push(this.createEffect(material.animation.exit, 'exit', duration));
    }
    if (material.animation?.emphasis) {
      effects.push(this.createEffect(material.animation.emphasis, 'emphasis', duration));
    }

    return {
      id: uuidv4(),
      assetId: asset.id,
      trackId: 'track_video_1',
      type: 'image',
      startTime,
      duration,
      offset: 0,
      transform: {
        x: gridMetadata.centerX - gridMetadata.width / 2,
        y: gridMetadata.centerY - gridMetadata.height / 2,
        scale: 1,
        rotation: 0,
      },
      style: {
        opacity: 1,
        zIndex: 1,
      },
      effects,
      name: asset.name,
    };
  }

  private async createTextClip(
    textElement: TextElement,
    startTime: number,
    duration: number,
    clipIds: string[],
    warnings: string[]
  ): Promise<Clip | null> {
    try {
      const gridMetadata = this.gridSystem.getMetadata(textElement.layoutId);
      const effects: Effect[] = [];

      if (textElement.animation?.entrance) {
        effects.push(this.createEffect(textElement.animation.entrance, 'entrance', duration));
      }
      if (textElement.animation?.exit) {
        effects.push(this.createEffect(textElement.animation.exit, 'exit', duration));
      }
      if (textElement.animation?.emphasis) {
        effects.push(this.createEffect(textElement.animation.emphasis, 'emphasis', duration));
      }

      const fontSize = textElement.style?.fontSize === 'auto' 
        ? gridMetadata.textRule.maxFontSize 
        : (textElement.style?.fontSize || gridMetadata.textRule.maxFontSize);

      const clip: Clip = {
        id: uuidv4(),
        assetId: 'virtual_text',
        trackId: 'track_text_1',
        type: 'text',
        startTime,
        duration,
        offset: 0,
        transform: {
          x: gridMetadata.centerX,
          y: gridMetadata.centerY,
          scale: 1,
          rotation: 0,
        },
        style: {
          opacity: 1,
          zIndex: 10,
        },
        textData: {
          content: textElement.content,
          fontSize,
          fontFamily: 'Arial',
          color: textElement.style?.color || '#ffffff',
          backgroundColor: 'transparent',
        },
        effects,
        name: textElement.content.substring(0, 20),
      };

      clipIds.push(clip.id);
      return clip;
    } catch (error) {
      warnings.push(`文本创建失败: ${textElement.id} - ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  private async generateDubbingForText(
    textElement: TextElement,
    textClip: Clip,
    shotDuration: number,
    warnings: string[]
  ): Promise<void> {
    try {
      const result = await indexTTSService.generateVoice(textElement.content, {
        speed: textElement.dubbing?.speed || 1.0,
      });

      const audioDuration = result.audioDuration || shotDuration;

      const voiceOver: VoiceOver = {
        audioSource: result.audioUrl,
        audioDuration: audioDuration,
        voice: textElement.dubbing?.voice || 'default',
        speed: textElement.dubbing?.speed || 1.0,
        generatedAt: Date.now(),
        filePath: result.filePath,
      };

      textClip.voiceOver = voiceOver;

      const audioAsset: Asset = {
        id: uuidv4(),
        name: `配音: ${textElement.content.substring(0, 20)}`,
        type: 'audio',
        url: result.audioUrl,
        createdAt: Date.now(),
        duration: audioDuration,
      };
      this.assets.push(audioAsset);

      const audioClip: Clip = {
        id: uuidv4(),
        assetId: audioAsset.id,
        trackId: 'track_audio_1',
        type: 'audio',
        startTime: textClip.startTime,
        duration: audioDuration,
        offset: 0,
        transform: { x: 0, y: 0, scale: 1, rotation: 0 },
        style: { opacity: 1, zIndex: 1 },
        effects: [],
        name: `配音: ${textElement.content.substring(0, 20)}`,
        voiceOver,
      };
      this.clips[audioClip.id] = audioClip;

    } catch (error) {
      warnings.push(`配音生成失败: ${textElement.id} - ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private createEffect(animRef: { presetId: string; duration?: number; params?: Record<string, any> }, type: Effect['type'], clipDuration: number): Effect {
    return {
      id: uuidv4(),
      presetId: animRef.presetId,
      type,
      name: animRef.presetId,
      duration: animRef.duration || (type === 'entrance' || type === 'exit' ? 0.8 : clipDuration),
      params: animRef.params || {},
    };
  }

  private createProject(script: AIScript, totalDuration: number): Project {
    return {
      id: uuidv4(),
      name: script.title || 'AI Generated Project',
      width: this.gridSystem.getCanvasConfig().width,
      height: this.gridSystem.getCanvasConfig().height,
      duration: totalDuration,
      fps: 60,
      tracks: this.tracks,
      clips: this.clips,
      lastModified: Date.now(),
    };
  }

  private reportProgress(
    stage: BuildProgress['stage'],
    progress: number,
    message: string,
    currentShot?: number,
    totalShots?: number
  ): void {
    if (this.config.onProgress) {
      this.config.onProgress({
        stage,
        progress,
        message,
        currentShot,
        totalShots,
      });
    }
  }
}

export async function buildProjectFromScript(
  script: AIScript,
  config: Partial<ProjectBuilderConfig> = {}
): Promise<{ project: Project; assets: Asset[]; result: BuildResult }> {
  const builder = new ProjectBuilder(config);
  const result = await builder.build(script);

  if (!result.success) {
    throw new Error(`构建失败: ${result.errors.join(', ')}`);
  }

  const project = builder.getProject();
  const assets = builder.getAssets();

  return { project, assets, result };
}
