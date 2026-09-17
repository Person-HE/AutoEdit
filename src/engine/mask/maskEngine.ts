/**
 * 蒙版引擎：将 MaskConfig 编译为 CSS mask-image / mask-size / mask-position
 *
 * 实现原理：
 * - 每种形状生成一段内联 SVG（白=显示，黑=隐藏），经 encodeURIComponent 后作为 mask-image
 * - 羽化通过 SVG <feGaussianBlur> 实现，模糊发生在 SVG 内部，
 *   在 mask-mode: luminance 下羽化边缘呈现灰度渐变
 * - 反转 = 黑底白形状（遮罩取反）
 * - mask-mode: luminance 使任意白色形状（含心形/星形路径）都可用作遮罩
 *
 * 该方案为纯 CSS 合成：
 * - 预览：React inline style 直接生效
 * - 导出：Puppeteer 截图同源渲染，所见即所得
 */
import type { MaskConfig, MaskShape } from '../../modules/shared/types';

export interface MaskCssResult {
  maskImage: string;
  maskSize: string;
  maskPosition: string;
  maskRepeat: string;
}

const VIEWBOX = 100; // 统一 100×100 逻辑坐标

/** 各形状的 SVG 内部元素（viewBox 100×100） */
function shapeElement(shape: MaskShape): string {
  switch (shape) {
    case 'rectangle':
      return '<rect x="4" y="4" width="92" height="92" rx="2" fill="white"/>';
    case 'circle':
      return '<circle cx="50" cy="50" r="46" fill="white"/>';
    case 'triangle':
      return '<path d="M50 5 L95 92 L5 92 Z" fill="white"/>';
    case 'star': {
      // 五角星路径（外接圆半径 47，内切圆半径 19）
      const cx = 50, cy = 50, R = 47, r = 19;
      const pts: string[] = [];
      for (let i = 0; i < 10; i++) {
        const ang = (Math.PI / 5) * i - Math.PI / 2;
        const rad = i % 2 === 0 ? R : r;
        pts.push(`${(cx + rad * Math.cos(ang)).toFixed(2)},${(cy + rad * Math.sin(ang)).toFixed(2)}`);
      }
      return `<polygon points="${pts.join(' ')}" fill="white"/>`;
    }
    case 'heart':
      // 心形贝塞尔路径
      return '<path d="M50 88 C20 62 6 44 6 28 C6 13 18 5 30 5 C39 5 46 10 50 18 C54 10 61 5 70 5 C82 5 94 13 94 28 C94 44 80 62 50 88 Z" fill="white"/>';
    default:
      return '<rect x="4" y="4" width="92" height="92" rx="2" fill="white"/>';
  }
}



function buildShapeSvg(config: MaskConfig): string {
  const featherPx = (Math.max(0, Math.min(100, config.feather)) / 100) * 24;
  const fill = config.inverted ? 'black' : 'white';
  const bg = config.inverted ? 'white' : 'black';
  const shape = shapeElement(config.shape).replace('fill="white"', `fill="${fill}"`);
  const rot = Math.max(-180, Math.min(180, config.rotation || 0));

  // 羽化在 mask 模式下需要把「显示=白」过渡到「隐藏=黑」：先画黑底，再叠一层
  // 模糊过的形状（黑色描边高斯扩散），边缘即出现灰度渐变；反转时颜色对调。
  const filter = featherPx > 0.2
    ? `<defs><filter id="f" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${featherPx.toFixed(2)}"/></filter></defs>`
    : '';
  const edge = featherPx > 0.2
    ? `<g filter="url(#f)">${shape.replace(`fill="${fill}"`, `fill="${bg}"`)}</g>`
    : '';
  const wrapped = featherPx > 0.2 ? `${shape}${edge}` : shape;

  // 旋转烘进 SVG 内部（绕 50,50 中心），避免 mask 简写属性的兼容性差异
  const rotated = rot !== 0 ? `<g transform="rotate(${rot} 50 50)">${wrapped}</g>` : wrapped;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEWBOX} ${VIEWBOX}" preserveAspectRatio="none"><rect width="${VIEWBOX}" height="${VIEWBOX}" fill="${bg}"/>${filter}${rotated}</svg>`;
}


/** 编译蒙版配置为 CSS mask 属性；未启用返回 null（零开销跳过） */
export function buildMaskCss(config?: MaskConfig | null): MaskCssResult | null {
  if (!config?.enabled) return null;

  const svg = buildShapeSvg(config);
  // 单引号已足够包裹 data URL；encodeURIComponent 会转义双引号，
  // 因此属性定界符用单引号，避免 Chrome 对裸双引号的解析差异
  const encoded = encodeURIComponent(svg);

  const w = Math.max(1, Math.min(300, config.width));
  const h = Math.max(1, Math.min(300, config.height));
  const x = Math.max(-100, Math.min(200, config.x));
  const y = Math.max(-100, Math.min(200, config.y));

  return {
    maskImage: `url('data:image/svg+xml,${encoded}')`,
    maskSize: `${w}% ${h}%`,
    maskPosition: `${x}% ${y}%`,
    maskRepeat: 'no-repeat',
  };
}

/** 形状切换时的建议尺寸 */
export function suggestMaskSize(shape: MaskShape): { width: number; height: number } {
  switch (shape) {
    case 'circle': return { width: 60, height: 60 };
    case 'rectangle': return { width: 70, height: 70 };
    case 'triangle': return { width: 65, height: 60 };
    case 'star': return { width: 70, height: 70 };
    case 'heart': return { width: 70, height: 65 };
    default: return { width: 60, height: 60 };
  }
}

/** React CSSProperties 形式的 mask 属性（带 -webkit- 前缀兼容） */
export function maskToReactStyle(result: MaskCssResult): Record<string, string> {
  return {
    maskImage: result.maskImage,
    maskSize: result.maskSize,
    maskPosition: result.maskPosition,
    maskRepeat: result.maskRepeat,
    maskMode: 'luminance',
    WebkitMaskImage: result.maskImage,
    WebkitMaskSize: result.maskSize,
    WebkitMaskPosition: result.maskPosition,
    WebkitMaskRepeat: result.maskRepeat,
    WebkitMaskMode: 'luminance',
  };
}
