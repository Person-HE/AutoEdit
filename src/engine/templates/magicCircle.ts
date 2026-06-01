import { TemplateDefinition, TemplateRenderContext } from './types';
import { easing, adaptiveLayout, paramGuard, drawUtils, colorUtils, animationUtils, palettes } from './templateUtils';

export const magicCircleTemplate: TemplateDefinition = {
  id: 'vfx_magic_circle',
  name: '魔法阵',
  description: '带有符文和发光效果的魔法阵',
  category: 'effect',
  schema: [
    { key: 'color1', label: '主颜色', type: 'color', default: '#00d4ff' },
    { key: 'color2', label: '副颜色', type: 'color', default: '#ff00e5' },
    { key: 'radius', label: '阵法半径', type: 'number', default: 150, min: 80, max: 300, step: 10 },
    { key: 'rotationSpeed', label: '旋转速度', type: 'number', default: 0.5, min: 0.1, max: 2, step: 0.1 },
    { key: 'runeCount', label: '符文数量', type: 'number', default: 8, min: 4, max: 16, step: 1 }
  ],

  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const color1 = paramGuard.color(params.color1, '#00d4ff');
    const color2 = paramGuard.color(params.color2, '#ff00e5');
    const radius = paramGuard.number(params.radius, 150, 80, 300);
    const rotationSpeed = paramGuard.number(params.rotationSpeed, 0.5, 0.1, 2);
    const runeCount = paramGuard.number(params.runeCount, 8, 4, 16);
    const p = paramGuard.number(progress, 0, 0, 1);

    drawUtils.meshGradient(ctx, -width / 2, -height / 2, width, height, ['#050510', '#0a0a18', '#050510'], time * 0.05, 0.2);
    drawUtils.vignette(ctx, width, height, 0.5);

    const enterProgress = easing.spring(Math.min(1, p / 0.3), 100, 14, 1);
    const currentRadius = radius * enterProgress;
    const rotation = time * rotationSpeed;

    drawUtils.multiLayerGlow(ctx, 0, 0, color1, currentRadius * 0.4, 5);
    drawUtils.radialGlow(ctx, 0, 0, currentRadius * 1.3, color1, 0.06);

    const rings = [0.4, 0.65, 0.85, 1.0];
    for (let r = 0; r < rings.length; r++) {
      const ringRadius = currentRadius * rings[r];
      const ringColor = colorUtils.lerpColor(color1, color2, r / rings.length);
      const ringAlpha = (0.4 - r * 0.05) * enterProgress;
      const ringRotation = rotation * (r % 2 === 0 ? 1 : -1) * (1 + r * 0.2);

      ctx.save();
      ctx.rotate(ringRotation);
      ctx.strokeStyle = colorUtils.toRgba(ringColor, ringAlpha);
      ctx.lineWidth = 2 - r * 0.3;
      ctx.beginPath();
      ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
      ctx.stroke();

      if (r < 2) {
        ctx.save();
        ctx.setLineDash([8, 12]);
        ctx.strokeStyle = colorUtils.toRgba(ringColor, ringAlpha * 0.5);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, ringRadius + 5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }
      ctx.restore();
    }

    const runes = 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛝᛞ';
    ctx.save();
    ctx.rotate(rotation);
    ctx.font = `${currentRadius * 0.1}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < runeCount; i++) {
      const angle = (i / runeCount) * Math.PI * 2;
      const runeR = currentRadius * 0.75;
      const rx = Math.cos(angle) * runeR;
      const ry = Math.sin(angle) * runeR;
      const runeColor = colorUtils.lerpColor(color1, color2, i / runeCount);
      const runeAlpha = (0.6 + Math.sin(time * 2 + i) * 0.2) * enterProgress;

      drawUtils.neonText(ctx, runes[i % runes.length], rx, ry, runeColor, runeAlpha);
    }
    ctx.restore();

    ctx.save();
    ctx.rotate(-rotation * 0.7);
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const innerR = currentRadius * 0.4;
      const outerR = currentRadius * 0.65;
      const lineColor = colorUtils.lerpColor(color1, color2, i / 6);
      const lineAlpha = 0.3 * enterProgress;

      ctx.save();
      ctx.strokeStyle = colorUtils.toRgba(lineColor, lineAlpha);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * innerR, Math.sin(angle) * innerR);
      ctx.lineTo(Math.cos(angle) * outerR, Math.sin(angle) * outerR);
      ctx.stroke();

      const midAngle = angle + Math.PI / 6;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * outerR, Math.sin(angle) * outerR);
      ctx.lineTo(Math.cos(midAngle) * outerR, Math.sin(midAngle) * outerR);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();

    const innerSymbols = 3;
    ctx.save();
    ctx.rotate(rotation * 1.5);
    for (let i = 0; i < innerSymbols; i++) {
      const angle = (i / innerSymbols) * Math.PI * 2;
      const symR = currentRadius * 0.25;
      const sx = Math.cos(angle) * symR;
      const sy = Math.sin(angle) * symR;
      const symColor = colorUtils.lerpColor(color1, color2, i / innerSymbols);
      const symAlpha = (0.5 + Math.sin(time * 3 + i * 2) * 0.2) * enterProgress;

      drawUtils.particle(ctx, sx, sy, 8, symColor, symAlpha * 0.4, 0.4);
      drawUtils.particle(ctx, sx, sy, 4, '#ffffff', symAlpha * 0.6, 0.7);
    }
    ctx.restore();

    drawUtils.particle(ctx, 0, 0, 10, color1, 0.5 * enterProgress, 0.5);
    drawUtils.particle(ctx, 0, 0, 5, '#ffffff', 0.7 * enterProgress, 0.8);

    const orbitParticleCount = 12;
    for (let i = 0; i < orbitParticleCount; i++) {
      const angle = (i / orbitParticleCount) * Math.PI * 2 + rotation * 2;
      const orbitR = currentRadius * (0.9 + Math.sin(time + i) * 0.1);
      const opx = Math.cos(angle) * orbitR;
      const opy = Math.sin(angle) * orbitR;
      const opColor = i % 2 === 0 ? color1 : color2;
      const opAlpha = (0.3 + Math.sin(time * 2 + i) * 0.2) * enterProgress;
      drawUtils.particle(ctx, opx, opy, 3, opColor, opAlpha, 0.5);
    }

    drawUtils.noiseTexture(ctx, -width / 2, -height / 2, width, height, 0.008, time);
  },

  initParams: () => ({
    color1: '#00d4ff',
    color2: '#ff00e5',
    radius: 150,
    rotationSpeed: 0.5,
    runeCount: 8
  })
};
