/**
 * 模板渲染测试 - 验证所有模板是否能正确渲染
 */

import {
  getAllTemplates,
  getTemplateDefaultParams,
} from '../index';

// 模拟函数
const mockFn = () => {};

// 模拟 Canvas 2D 上下文
const createMockContext = (): CanvasRenderingContext2D => {
  const mockCtx = {
    save: mockFn,
    restore: mockFn,
    fillRect: mockFn,
    clearRect: mockFn,
    strokeRect: mockFn,
    fillText: mockFn,
    strokeText: mockFn,
    measureText: () => ({ width: 100 }),
    beginPath: mockFn,
    closePath: mockFn,
    moveTo: mockFn,
    lineTo: mockFn,
    arc: mockFn,
    arcTo: mockFn,
    ellipse: mockFn,
    rect: mockFn,
    quadraticCurveTo: mockFn,
    bezierCurveTo: mockFn,
    stroke: mockFn,
    fill: mockFn,
    clip: mockFn,
    rotate: mockFn,
    scale: mockFn,
    translate: mockFn,
    transform: mockFn,
    setTransform: mockFn,
    resetTransform: mockFn,
    createLinearGradient: () => ({
      addColorStop: mockFn,
    }),
    createRadialGradient: () => ({
      addColorStop: mockFn,
    }),
    createConicGradient: () => ({
      addColorStop: mockFn,
    }),
    createPattern: () => null,
    drawImage: mockFn,
    putImageData: mockFn,
    getImageData: () => ({ data: new Uint8ClampedArray(4) }),
    createImageData: () => ({ data: new Uint8ClampedArray(4) }),
    getContextAttributes: () => ({
      alpha: true,
      desynchronized: false,
      colorSpace: 'srgb',
      willReadFrequently: false,
    }),
    isContextLost: () => false,
    isPointInPath: () => false,
    isPointInStroke: () => false,
    canvas: { width: 1920, height: 1080 },
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    fillStyle: '#000',
    strokeStyle: '#000',
    lineWidth: 1,
    lineCap: 'butt',
    lineJoin: 'miter',
    miterLimit: 10,
    lineDashOffset: 0,
    shadowColor: '#000',
    shadowBlur: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    font: '10px sans-serif',
    textAlign: 'start',
    textBaseline: 'alphabetic',
    direction: 'ltr',
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'low',
    filter: 'none',
    setLineDash: mockFn,
    getLineDash: () => [],
    fontKerning: 'auto',
    fontStretch: 'normal',
    fontVariantCaps: 'normal',
    letterSpacing: '0px',
    textRendering: 'auto',
    wordSpacing: '0px',
    roundRect: mockFn,
  } as unknown as CanvasRenderingContext2D;

  return mockCtx;
};

describe('Template Render Test', () => {
  const mockContext = (ctx: CanvasRenderingContext2D) => ({
    ctx,
    width: 1920,
    height: 1080,
    progress: 0.5,
    time: 1.5,
    duration: 3,
    params: {},
  });

  test('all templates should be registered', () => {
    const templates = getAllTemplates();
    console.log(`Registered templates: ${templates.length}`);
    expect(templates.length).toBeGreaterThan(0);

    templates.forEach(t => {
      console.log(`  - ${t.id}: ${t.name} (${t.category})`);
    });
  });

  test('each template should have required properties', () => {
    const templates = getAllTemplates();

    templates.forEach(template => {
      expect(template.id).toBeTruthy();
      expect(template.name).toBeTruthy();
      expect(template.description).toBeTruthy();
      expect(template.category).toBeTruthy();
      expect(Array.isArray(template.schema)).toBe(true);
      expect(typeof template.render).toBe('function');
    });
  });

  test('each template should render without throwing', () => {
    const templates = getAllTemplates();
    const ctx = createMockContext();

    templates.forEach(template => {
      const params = getTemplateDefaultParams(template.id);
      const context = mockContext(ctx);
      context.params = params;

      try {
        template.render(context);
        console.log(`✅ ${template.id} rendered successfully`);
      } catch (error) {
        console.error(`❌ ${template.id} failed to render:`, error);
        throw error;
      }
    });
  });

  test('each template should render at progress 0 and 1', () => {
    const templates = getAllTemplates();
    const ctx = createMockContext();

    templates.forEach(template => {
      const params = getTemplateDefaultParams(template.id);

      [0, 1].forEach(progress => {
        const context = mockContext(ctx);
        context.progress = progress;
        context.time = progress * 3;
        context.params = params;

        try {
          template.render(context);
        } catch (error) {
          console.error(`❌ ${template.id} failed at progress ${progress}:`, error);
          throw error;
        }
      });
    });
  });
});
