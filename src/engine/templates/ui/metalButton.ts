import { TemplateDefinition, TemplateRenderContext } from '../types';
import { paramGuard, colorUtils, drawUtils, easing } from '../templateUtils';

export const metalButtonTemplate: TemplateDefinition = {
  id: 'ui_metal_button',
  name: '金属按钮',
  description: '拉丝金属按钮，带 3D 浮雕、边缘高光与弹性按压反馈',
  category: 'ui',
  quality: 'viral',
  mood: ['urgency', 'excitement'],
  material: ['metal', 'neon'],
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['spring', 'gravityBounce'],
  schema: [
    { key: 'text', label: '按钮文字', type: 'string', default: '立即行动' },
    { key: 'color', label: '主色', type: 'color', default: '#ff0055' },
  ],
  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const text = paramGuard.string(params.text, '立即行动');
    const color = paramGuard.color(params.color, '#ff0055');
    const p = paramGuard.number(progress, 0, 0, 1);

    ctx.clearRect(-width / 2, -height / 2, width, height);

    const btnW = 420;
    const btnH = 110;
    const radius = 16;

    const scale = easing.spring(p, 160, 14, 1);
    const pulse = 1 + Math.sin(time * 6) * 0.015;

    ctx.save();
    ctx.scale(scale * pulse, scale * pulse);

    // 外发光
    drawUtils.multiLayerGlow(ctx, 0, 0, color, 120, 4);

    // 金属底座
    drawUtils.roundedRect(ctx, -btnW / 2, -btnH / 2, btnW, btnH, radius);
    const baseGrad = ctx.createLinearGradient(0, -btnH / 2, 0, btnH / 2);
    baseGrad.addColorStop(0, '#3a3a3a');
    baseGrad.addColorStop(0.5, '#1a1a1a');
    baseGrad.addColorStop(1, '#0a0a0a');
    ctx.fillStyle = baseGrad;
    ctx.fill();

    // 拉丝纹理
    drawUtils.metalTexture(ctx, -btnW / 2, -btnH / 2, btnW, btnH, '#1a1a1a', 0.35);

    // 顶部高光
    const topGrad = ctx.createLinearGradient(0, -btnH / 2, 0, 0);
    topGrad.addColorStop(0, 'rgba(255,255,255,0.25)');
    topGrad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = topGrad;
    drawUtils.roundedRect(ctx, -btnW / 2, -btnH / 2, btnW, btnH / 2, radius);
    ctx.fill();

    // 边缘霓虹
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 文字
    ctx.font = '900 48px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;
    ctx.fillText(text, 0, 2);
    ctx.shadowBlur = 0;

    ctx.restore();
  },
  initParams: () => ({
    text: '立即行动',
    color: '#ff0055',
  }),
};
