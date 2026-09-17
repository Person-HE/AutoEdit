import { TemplateDefinition, TemplateRenderContext } from '../types';
import { paramGuard, drawUtils, easing } from '../templateUtils';

export const carbonPanelTemplate: TemplateDefinition = {
  id: 'ui_carbon_panel',
  name: '碳纤维面板',
  description: '碳纤维编织纹理面板，带金属螺丝、数据条与机械感入场',
  category: 'ui',
  quality: 'viral',
  mood: ['tension', 'urgency'],
  material: ['carbon', 'metal'],
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['spring', 'inertiaDecay'],
  schema: [
    { key: 'title', label: '标题', type: 'string', default: '系统状态' },
    { key: 'value', label: '数值', type: 'string', default: 'ONLINE' },
    { key: 'accentColor', label: '强调色', type: 'color', default: '#00ff9d' },
  ],
  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, params } = context;
    const title = paramGuard.string(params.title, '系统状态');
    const value = paramGuard.string(params.value, 'ONLINE');
    const accentColor = paramGuard.color(params.accentColor, '#00ff9d');
    const p = paramGuard.number(progress, 0, 0, 1);

    ctx.clearRect(-width / 2, -height / 2, width, height);

    const panelW = 600;
    const panelH = 240;
    const radius = 8;

    const scale = easing.spring(p, 160, 14, 1);

    ctx.save();
    ctx.scale(scale, scale);

    // 面板底色
    drawUtils.roundedRect(ctx, -panelW / 2, -panelH / 2, panelW, panelH, radius);
    ctx.fillStyle = '#111111';
    ctx.fill();

    // 碳纤维纹理
    drawUtils.carbonTexture(ctx, -panelW / 2, -panelH / 2, panelW, panelH);

    // 边框
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 四个螺丝
    ctx.fillStyle = '#888888';
    const screwOffset = 16;
    [
      [-panelW / 2 + screwOffset, -panelH / 2 + screwOffset],
      [panelW / 2 - screwOffset, -panelH / 2 + screwOffset],
      [-panelW / 2 + screwOffset, panelH / 2 - screwOffset],
      [panelW / 2 - screwOffset, panelH / 2 - screwOffset],
    ].forEach(([sx, sy]) => {
      ctx.beginPath();
      ctx.arc(sx, sy, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#555555';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // 标题
    ctx.font = '700 32px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText(title, -panelW / 2 + 40, -panelH / 2 + 60);

    // 数值
    ctx.font = '900 72px "Microsoft YaHei", sans-serif';
    ctx.fillStyle = accentColor;
    ctx.shadowColor = accentColor;
    ctx.shadowBlur = 25;
    ctx.fillText(value, -panelW / 2 + 40, 20);
    ctx.shadowBlur = 0;

    // 进度条
    const barY = panelH / 2 - 50;
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(-panelW / 2 + 40, barY, panelW - 80, 12);
    ctx.fillStyle = accentColor;
    ctx.fillRect(-panelW / 2 + 40, barY, (panelW - 80) * scale, 12);

    ctx.restore();
  },
  initParams: () => ({
    title: '系统状态',
    value: 'ONLINE',
    accentColor: '#00ff9d',
  }),
};
