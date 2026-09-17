import { AgentTool, ToolResult, AgentContext } from '../core/AgentTypes';
import { projectAdapter } from '../adapters/ProjectAdapter';
import { useProjectStore } from '../../../store/useProjectStore';
import { useAssetStore } from '../../asset/useAssetStore';
import { SVGAssetGenerator } from '../../../engine/assets/SVGAssetGenerator';
import type { Asset } from '../../shared/types';

interface BatchItem {
  type: 'video' | 'image' | 'text' | 'template' | 'audio';
  trackId?: string;
  startTime?: number;
  duration?: number;
  assetId?: string;
  content?: string;
  templateId?: string;
  fontSize?: number;
  color?: string;
  x?: number;
  y?: number;
  scale?: number;
  presetId?: string;
  exitPresetId?: string;
  name?: string;
  // 爆款视频扩展字段
  depthLayer?: 'background' | 'midground' | 'foreground';
  rhythmBeat?: boolean;
  strongEffects?: boolean;
  material?: 'neon' | 'paper' | 'glass' | 'metal' | 'carbon';
  bRollType?: 'chat' | 'phoneScreenshot' | 'bankNotification' | 'receipt' | 'idCard' | 'stickyNote' | 'polaroidPhoto' | 'newspaperClipping';
  bRollParams?: Record<string, any>;
  motionPresetId?: string;
  foregroundDecoration?: 'codeParticles' | 'glitchBars' | 'scanlines' | 'hexGrid' | 'none';
}

function getZIndexByDepth(layer?: string): number {
  switch (layer) {
    case 'background': return 5;
    case 'midground': return 75;
    case 'foreground': return 175;
    default: return 100;
  }
}

function generateForegroundDecorationAsset(type: string, params: Record<string, any> = {}): Asset {
  const width = params.width || 1920;
  const height = params.height || 1080;
  let svg = '';

  if (type === 'codeParticles') {
    const chars = ['{', '}', '<', '>', '/', ';', '0', '1', 'AI', '#', '$'];
    let elements = '';
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = 12 + Math.random() * 24;
      const color = Math.random() > 0.5 ? '#00f0ff' : '#ff00a0';
      const opacity = 0.2 + Math.random() * 0.4;
      elements += `<text x="${x}" y="${y}" font-family="monospace" font-size="${size}" fill="${color}" opacity="${opacity}">${chars[i % chars.length]}</text>`;
    }
    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${elements}</svg>`;
  } else if (type === 'glitchBars') {
    let elements = '';
    for (let i = 0; i < 12; i++) {
      const y = Math.random() * height;
      const h = 4 + Math.random() * 40;
      const color = Math.random() > 0.5 ? 'rgba(255,0,0,0.35)' : 'rgba(0,255,255,0.35)';
      elements += `<rect x="0" y="${y}" width="${width}" height="${h}" fill="${color}" />`;
    }
    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${elements}</svg>`;
  } else if (type === 'scanlines') {
    let elements = '';
    for (let y = 0; y < height; y += 6) {
      elements += `<rect x="0" y="${y}" width="${width}" height="2" fill="rgba(0,255,200,0.12)" />`;
    }
    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${elements}</svg>`;
  } else if (type === 'hexGrid') {
    let elements = '';
    const r = 40;
    for (let row = 0; row < height / r + 2; row++) {
      for (let col = 0; col < width / r + 2; col++) {
        const x = col * r * 1.5 + (row % 2) * r * 0.75;
        const y = row * r * 0.866;
        const opacity = 0.05 + Math.random() * 0.1;
        elements += `<polygon points="${x},${y - r} ${x + r * 0.866},${y - r * 0.5} ${x + r * 0.866},${y + r * 0.5} ${x},${y + r} ${x - r * 0.866},${y + r * 0.5} ${x - r * 0.866},${y - r * 0.5}" fill="none" stroke="#00f0ff" stroke-width="1" opacity="${opacity}" />`;
      }
    }
    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${elements}</svg>`;
  }

  return {
    id: `fg_deco_${type}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: 'image',
    name: `前景装饰: ${type}`,
    url: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`,
    width,
    height,
  } as Asset;
}

function generateBRollAsset(type: string, params: Record<string, any> = {}): Asset {
  const width = params.width ?? 800;
  const height = params.height ?? 600;
  switch (type) {
    case 'chat':
      return SVGAssetGenerator.chatBubble({
        width: 560,
        height: 240,
        asAsset: true,
        name: 'chat-broll.svg',
        userName: params.userName ?? 'User',
        message: params.message ?? '',
        avatar: params.avatar ?? 'U',
        direction: params.direction ?? 'left',
      }) as Asset;
    case 'phoneScreenshot':
      return SVGAssetGenerator.phoneScreenshot({
        width: 420,
        height: 760,
        asAsset: true,
        name: 'phone-broll.svg',
        title: params.title ?? 'Overview',
        amount: params.amount ?? '¥ 0.00',
        changeRate: params.changeRate ?? '+0.0%',
        isPositive: params.isPositive ?? true,
      }) as Asset;
    case 'bankNotification':
      return SVGAssetGenerator.bankNotification({
        width: 560,
        height: 260,
        asAsset: true,
        name: 'bank-broll.svg',
        amount: params.amount ?? '+ ¥ 0.00',
        time: params.time ?? 'Today',
        bank: params.bank ?? 'Bank',
      }) as Asset;
    case 'receipt':
      return SVGAssetGenerator.receipt({
        width: 420,
        height: 640,
        asAsset: true,
        name: 'receipt-broll.svg',
        merchant: params.merchant ?? 'SHOP',
        amount: params.amount ?? '¥ 0.00',
        time: params.time ?? new Date().toLocaleString(),
        items: params.items,
      }) as Asset;
    case 'idCard':
      return SVGAssetGenerator.idCard({
        width: 640,
        height: 400,
        asAsset: true,
        name: 'idcard-broll.svg',
        personName: params.name ?? 'Name',
        title: params.title ?? 'Title',
        company: params.company ?? 'Company',
        color: params.color ?? '#3b82f6',
      }) as Asset;
    case 'stickyNote':
      return SVGAssetGenerator.stickyNote({
        width: 360,
        height: 360,
        asAsset: true,
        name: 'sticky-broll.svg',
        text: params.text ?? '',
        color: params.color ?? '#fde047',
        angle: params.angle ?? -3,
      }) as Asset;
    case 'polaroidPhoto':
      return SVGAssetGenerator.polaroidPhoto({
        width: 420,
        height: 520,
        asAsset: true,
        name: 'polaroid-broll.svg',
        caption: params.caption ?? '',
        photoColor: params.photoColor ?? '#93c5fd',
      }) as Asset;
    case 'newspaperClipping':
      return SVGAssetGenerator.newspaperClipping({
        width: 640,
        height: 480,
        asAsset: true,
        name: 'newspaper-broll.svg',
        headline: params.headline ?? 'HEADLINE',
        date: params.date ?? new Date().toDateString(),
        snippets: params.snippets,
      }) as Asset;
    default:
      return SVGAssetGenerator.craftPaper({ width, height, asAsset: true, name: 'broll-paper.svg' }) as Asset;
  }
}

function mapTextToTemplate(item: BatchItem): { templateId: string; params: Record<string, any> } | null {
  const content = (item.content || '').slice(0, 100);
  const fontSize = item.fontSize ?? 60;
  const color = item.color || '#ffffff';

  // 小字号/中景标签保持为普通文字，避免渲染过载；只把前景大字转为高质感模板
  if (item.depthLayer === 'midground' || fontSize < 70) {
    return null;
  }

  // 数字增长类优先使用 countup_fire
  const numericValueMatch = content.match(/^[+\-¥]?\s*([\d,]+(?:\.\d+)?)$/);
  if (numericValueMatch) {
    const raw = numericValueMatch[1].replace(/,/g, '');
    const value = parseFloat(raw);
    if (!isNaN(value) && value >= 0) {
      return {
        templateId: 'text_countup_fire',
        params: {
          value,
          prefix: content.includes('¥') ? '¥' : content.startsWith('+') ? '+' : '',
          fontSize: Math.max(100, fontSize),
        },
      };
    }
  }

  switch (item.material) {
    case 'metal':
      return {
        templateId: 'text_viral_hook',
        params: { text: content, fontSize: Math.max(120, fontSize), color, glitch: 0.6 },
      };
    case 'carbon':
      return {
        templateId: 'text_glitch_title',
        params: { text: content, fontSize, color, intensity: 0.8 },
      };
    case 'neon':
      return {
        templateId: 'text_neon_scramble',
        params: { text: content.toUpperCase(), fontSize, color },
      };
    case 'glass':
      return {
        templateId: 'text_cyber_subtitle',
        params: { text: content, fontSize, color },
      };
    case 'paper':
    default:
      return {
        templateId: 'text_kinetic_title',
        params: { text: content, fontSize, color },
      };
  }
}

const batchAddTool: AgentTool = {
  name: 'batch_add_clips',
  description:
    '批量添加多个片段到轨道。用于一次性创建完整的视频结构，如多段文字、多个素材、多层效果等。items数组中每个元素是一个片段配置。支持爆款视频扩展字段：depthLayer（空间层级）、rhythmBeat（节奏强调）、strongEffects（强冲击效果）、material（材质风格）、bRollType（SVG生成B-roll类型）。',
  parameters: [
    {
      name: 'items',
      type: 'array',
      description: '片段配置数组，每个元素包含type, content/assetId, startTime, duration等字段，以及可选的depthLayer, rhythmBeat, strongEffects, material, bRollType, bRollParams',
      required: true,
    },
    {
      name: 'baseStartTime',
      type: 'number',
      description: '基础开始时间，所有片段的startTime会叠加此值',
      required: false,
      default: 0,
    },
  ],
  async execute(params, context: AgentContext) {
    try {
      if (!Array.isArray(params.items) || params.items.length === 0) {
        return { success: false, error: 'items 必须是非空数组' };
      }

      const baseStartTime = params.baseStartTime ?? context?.projectState?.currentTime ?? 0;
      const results: any[] = [];
      const errors: string[] = [];

      for (let i = 0; i < params.items.length; i++) {
        const item: BatchItem = params.items[i];
        try {
          const projectState = useProjectStore.getState();
          let trackId = item.trackId;

          const startTime = (item.startTime ?? 0) + baseStartTime;

          // 文字自动映射到重写后的爆款文字模板
          const textTemplateMapping = item.type === 'text' ? mapTextToTemplate(item) : null;
          const resolvedType: BatchItem['type'] = textTemplateMapping ? 'template' : item.type;

          if (!trackId) {
            const targetType = resolvedType === 'audio' ? 'audio' : resolvedType === 'text' ? 'text' : 'video';
            const existingTrack = projectState.project.tracks.find(t => t.type === targetType);
            if (existingTrack) {
              trackId = existingTrack.id;
            } else {
              useProjectStore.getState().addTrack(targetType);
              const newTracks = useProjectStore.getState().project.tracks;
              const newTrack = newTracks.find(t => t.type === targetType);
              trackId = newTrack?.id;
            }
          }

          // 模板必须放在视频轨道
          if (resolvedType === 'template' && textTemplateMapping) {
            const videoTrack = projectState.project.tracks.find(t => t.type === 'video');
            if (videoTrack) trackId = videoTrack.id;
          }

          const clipInput: any = {
            type: resolvedType,
            trackId: trackId!,
            startTime,
            duration: item.duration ?? 5,
            transform: { x: item.x ?? 0, y: item.y ?? 0, scale: item.scale ?? 1, rotation: 0 },
            name: item.name,
            style: { zIndex: getZIndexByDepth(item.depthLayer) },
          };

          if (resolvedType === 'text') {
            clipInput.textData = {
              content: (item.content || '').slice(0, 100),
              fontSize: item.fontSize ?? 36,
              color: item.color || '#ffffff',
              fontFamily: 'Arial',
              fontWeight: 'bold',
            };
          }

          if ((resolvedType === 'video' || resolvedType === 'image' || resolvedType === 'audio') && item.assetId) {
            const asset = useAssetStore.getState().getAssetById(item.assetId);
            if (asset) {
              clipInput.assetId = item.assetId;
              if (asset.duration && !item.duration) {
                clipInput.duration = asset.duration;
              }
            }
          }

          if (resolvedType === 'template' && item.templateId && !textTemplateMapping) {
            clipInput.templateId = item.templateId;
          }

          if (textTemplateMapping) {
            clipInput.templateId = textTemplateMapping.templateId;
            clipInput.templateParams = textTemplateMapping.params;
          }

          const clip = projectAdapter.addClipToProject(clipInput);

          if (!clip) {
            errors.push(`第${i + 1}个片段创建失败`);
            continue;
          }

          const appliedEffects: string[] = [];

          // 强冲击效果：按材质匹配物理入场（模板自身已有入场动画，避免双重动画）
          if (item.strongEffects && !textTemplateMapping) {
            const materialPresetMap: Record<string, string> = {
              neon: 'entrance_glitch_smash',
              paper: 'entrance_elastic_bounce',
              glass: 'entrance_spring_scale',
              metal: 'entrance_smash_in',
              carbon: 'entrance_glitch_in',
            };
            const strongPreset = materialPresetMap[item.material || ''] || 'entrance_spring_scale';
            projectAdapter.applyEffectToClip(clip.id, strongPreset);
            appliedEffects.push(strongPreset);
          }

          // 节奏强调
          if (item.rhythmBeat) {
            const beatPreset = item.material === 'neon' ? 'emphasis_shockwave' : 'emphasis_pulse';
            projectAdapter.applyEffectToClip(clip.id, beatPreset);
            appliedEffects.push(beatPreset);
          }

          // 运动漂浮（空间感）
          if (item.motionPresetId) {
            projectAdapter.applyEffectToClip(clip.id, item.motionPresetId);
            appliedEffects.push(item.motionPresetId);
          } else if (item.depthLayer === 'foreground') {
            projectAdapter.applyEffectToClip(clip.id, 'motion_parallax_float');
            appliedEffects.push('motion_parallax_float');
          }

          // 用户显式预设
          if (item.presetId) {
            const presets = item.presetId.split(',').map((p: string) => p.trim()).filter(Boolean);
            for (const preset of presets) {
              projectAdapter.applyEffectToClip(clip.id, preset);
              appliedEffects.push(preset);
            }
          }

          if (item.exitPresetId) {
            projectAdapter.applyEffectToClip(clip.id, item.exitPresetId);
            appliedEffects.push(item.exitPresetId);
          }

          // SVG B-roll 生成并叠加到视频轨道
          let bRollClipId: string | undefined;
          if (item.bRollType) {
            try {
              const asset = generateBRollAsset(item.bRollType, item.bRollParams || {});
              projectAdapter.addAssetsToProject([asset]);

              const videoTrack = projectState.project.tracks.find(t => t.type === 'video')
                || projectState.project.tracks[0];

              if (videoTrack) {
                const bRollClip = projectAdapter.addClipToProject({
                  type: 'image',
                  assetId: asset.id,
                  trackId: videoTrack.id,
                  startTime,
                  duration: item.duration ?? 5,
                  transform: {
                    x: item.x ? item.x * 0.6 : 260,
                    y: item.y ? item.y * 0.3 + 80 : 80,
                    scale: 0.55,
                    rotation: (Math.random() - 0.5) * 6,
                  },
                  name: `B-roll: ${item.bRollType}`,
                  style: { zIndex: getZIndexByDepth('midground') },
                });

                if (bRollClip) {
                  projectAdapter.applyEffectToClip(bRollClip.id, 'entrance_zoom_in');
                  bRollClipId = bRollClip.id;
                }
              }
            } catch (bRollError) {
              errors.push(`第${i + 1}个B-roll生成失败: ${bRollError instanceof Error ? bRollError.message : String(bRollError)}`);
            }
          }

          // 前景装饰层：快速掠过的半透明元素
          let foregroundClipId: string | undefined;
          if (item.foregroundDecoration && item.foregroundDecoration !== 'none') {
            try {
              const decoAsset = generateForegroundDecorationAsset(item.foregroundDecoration);
              projectAdapter.addAssetsToProject([decoAsset]);
              const fgTrack = projectState.project.tracks.find(t => t.type === 'video')
                || projectState.project.tracks[0];
              if (fgTrack) {
                const fgClip = projectAdapter.addClipToProject({
                  type: 'image',
                  assetId: decoAsset.id,
                  trackId: fgTrack.id,
                  startTime,
                  duration: item.duration ?? 5,
                  transform: { x: 0, y: 0, scale: 1, rotation: 0 },
                  name: `前景装饰: ${item.foregroundDecoration}`,
                  style: { zIndex: getZIndexByDepth('foreground'), opacity: 0.35 },
                });
                if (fgClip) {
                  projectAdapter.applyEffectToClip(fgClip.id, 'fx_crt_flicker');
                  foregroundClipId = fgClip.id;
                }
              }
            } catch (decoError) {
              errors.push(`第${i + 1}个前景装饰生成失败: ${decoError instanceof Error ? decoError.message : String(decoError)}`);
            }
          }

          if (!context.workingMemory.addedClipIds) {
            context.workingMemory.addedClipIds = [];
          }
          context.workingMemory.addedClipIds.push(clip.id);

          results.push({
            index: i,
            clipId: clip.id,
            type: item.type,
            trackId,
            startTime,
            duration: clipInput.duration,
            appliedEffects,
            bRollClipId,
            foregroundClipId,
          });
        } catch (itemError) {
          errors.push(`第${i + 1}个片段错误: ${itemError instanceof Error ? itemError.message : String(itemError)}`);
        }
      }

      return {
        success: results.length > 0,
        data: {
          addedCount: results.length,
          failedCount: errors.length,
          items: results,
        },
        error: errors.length > 0 ? errors.join('; ') : undefined,
        metadata: { totalAdded: context.workingMemory.addedClipIds?.length ?? 0 },
      };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  },
};

export { batchAddTool };
