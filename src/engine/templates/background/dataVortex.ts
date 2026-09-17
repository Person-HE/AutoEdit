import { TemplateDefinition, TemplateRenderContext } from '../types';
import { paramGuard, drawUtils, easing } from '../templateUtils';

export const dataVortexTemplate: TemplateDefinition = {
  id: 'bg_data_vortex',
  name: '数据漩涡',
  description: '螺旋流动的数据粒子漩涡，前景快速、后景缓慢，营造紧张高速感',
  category: 'effect',
  quality: 'viral',
  mood: ['tension', 'urgency'],
  material: ['neon', 'hologram'],
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['spring', 'inertiaDecay'],
  schema: [
    { key: 'color', label: '主色', type: 'color', default: '#00f0ff' },
    { key: 'accentColor', label: '强调色', type: 'color', default: '#ff0055' },
    { key: 'speed', label: '旋转速度', type: 'number', default: 1.8, min: 0.5, max: 4, step: 0.1 },
  ],
  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const color = params.color || '#00f0ff';
    const accentColor = params.accentColor || '#ff0055';
    const speed = Math.max(0.5, Math.min(4, params.speed ?? 1.8));
    const p = paramGuard.number(progress, 0, 0, 1);

    ctx.fillStyle = '#020205';
    ctx.fillRect(-width / 2, -height / 2, width, height);

    // 中心发光
    const centerGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, width * 0.5);
    centerGlow.addColorStop(0, 'rgba(0, 240, 255, 0.12)');
    centerGlow.addColorStop(0.5, 'rgba(255, 0, 85, 0.05)');
    centerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = centerGlow;
    ctx.fillRect(-width / 2, -height / 2, width, height);

    // 漩涡粒子
    ctx.save();
    const arms = 6;
    const particlesPerArm = 30;
    for (let arm = 0; arm < arms; arm++) {
      const baseAngle = (arm / arms) * Math.PI * 2 + time * speed * 0.3;
      for (let i = 0; i < particlesPerArm; i++) {
        const progress = i / particlesPerArm;
        const radius = 80 + progress * width * 0.55;
        const angle = baseAngle + progress * Math.PI * 2 * speed;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        const size = 2 + (1 - progress) * 6;
        const alpha = (1 - progress) * 0.8 * p;

        ctx.globalAlpha = alpha;
        const particleColor = progress > 0.7 ? accentColor : color;
        ctx.fillStyle = particleColor;
        ctx.shadowColor = particleColor;
        ctx.shadowBlur = size * 2;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // 拖尾
        ctx.strokeStyle = progress > 0.7 ? accentColor : color;
        ctx.lineWidth = size * 0.4;
        ctx.globalAlpha = alpha * 0.35;
        ctx.beginPath();
        ctx.moveTo(x, y);
        const tailAngle = angle - 0.18 * speed;
        ctx.lineTo(
          Math.cos(tailAngle) * (radius - 20),
          Math.sin(tailAngle) * (radius - 20)
        );
        ctx.stroke();
      }
    }
    ctx.restore();

    // 中心脉冲环
    ctx.save();
    const ringPulse = (time * speed) % 1.5 / 1.5;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.globalAlpha = (1 - ringPulse) * p;
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(0, 0, 50 + ringPulse * 180, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  },
  initParams: () => ({
    color: '#00f0ff',
    accentColor: '#ff0055',
    speed: 1.8,
  }),
};
