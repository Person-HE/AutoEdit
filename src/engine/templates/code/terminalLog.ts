import { TemplateDefinition, TemplateRenderContext } from '../types';
import { paramGuard, drawUtils, easing, hash } from '../templateUtils';

export const terminalLogTemplate: TemplateDefinition = {
  id: 'code_terminal_log',
  name: '终端日志流',
  description: '终端风格日志流，带滚动动画、颜色标签与光标',
  category: 'code',
  quality: 'viral',
  mood: ['mysterious', 'tension'],
  material: ['neon', 'glass'],
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['inertiaDecay'],
  schema: [
    { key: 'accentColor', label: '强调色', type: 'color', default: '#00ff9d' },
    { key: 'speed', label: '滚动速度', type: 'number', default: 1.2, min: 0.2, max: 3, step: 0.1 },
  ],
  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const accentColor = paramGuard.color(params.accentColor, '#00ff9d');
    const speed = paramGuard.number(params.speed, 1.2, 0.2, 3);
    const p = paramGuard.number(progress, 0, 0, 1);

    ctx.fillStyle = '#050a08';
    ctx.fillRect(-width / 2, -height / 2, width, height);

    const logs = [
      { type: 'info', text: '[INFO] 模型加载完成' },
      { type: 'success', text: '[OK] 收益流优化成功' },
      { type: 'warn', text: '[WARN] 传统路径效率低于阈值' },
      { type: 'success', text: '[OK] AI 杠杆系数 x17.3' },
      { type: 'info', text: '[INFO] 账户状态: 独立' },
      { type: 'success', text: '[OK] 到账 ¥52,000.00' },
    ];

    ctx.save();
    ctx.font = '18px monospace';
    ctx.textAlign = 'left';
    const lineHeight = 36;
    const offset = (time * speed * 40) % lineHeight;

    for (let i = 0; i < 16; i++) {
      const y = -height / 2 + 60 + i * lineHeight - offset;
      if (y < -height / 2 || y > height / 2) continue;
      const log = logs[(i + Math.floor(time * speed)) % logs.length];
      const alpha = (0.5 + 0.45 * (1 - Math.abs(y) / (height / 2))) * p;
      ctx.fillStyle = log.type === 'success' ? accentColor : log.type === 'warn' ? '#ffd000' : '#00f0ff';
      ctx.globalAlpha = alpha;
      ctx.fillText(log.text, -width / 2 + 60, y);
    }
    ctx.restore();

    // 光标
    ctx.fillStyle = accentColor;
    ctx.globalAlpha = Math.floor(time * 10) % 2 === 0 ? p : 0;
    ctx.fillRect(-width / 2 + 60, height / 2 - 50, 12, 24);
    ctx.globalAlpha = 1;

    drawUtils.scanlines(ctx, width, height, 4, 0.08);
  },
  initParams: () => ({
    accentColor: '#00ff9d',
    speed: 1.2,
  }),
};
