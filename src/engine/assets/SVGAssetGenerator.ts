// SVG 真实感素材生成器
// 生成可转换为 Canvas ImageAsset 的 data URL / Asset 对象
import type { Asset } from '../../modules/shared/types';

export interface SVGTextureOptions {
  width?: number;
  height?: number;
  name?: string;
  asAsset?: boolean;
}

export interface SVGObjectOptions extends SVGTextureOptions {}

export interface ReceiptOptions extends SVGObjectOptions {
  merchant?: string;
  amount?: string;
  time?: string;
  items?: Array<{ name: string; price: string }>;
}

export interface ChatBubbleOptions extends SVGObjectOptions {
  userName?: string;
  message?: string;
  avatar?: string;
  direction?: 'left' | 'right';
}

export interface PhoneScreenshotOptions extends SVGObjectOptions {
  title?: string;
  amount?: string;
  changeRate?: string;
  isPositive?: boolean;
}

export interface IDCardOptions extends SVGObjectOptions {
  personName?: string;
  title?: string;
  company?: string;
  color?: string;
}

export interface StickyNoteOptions extends SVGObjectOptions {
  text?: string;
  color?: string;
  angle?: number;
}

export interface PolaroidPhotoOptions extends SVGObjectOptions {
  caption?: string;
  photoColor?: string;
}

export interface NewspaperClippingOptions extends SVGObjectOptions {
  headline?: string;
  date?: string;
  snippets?: string[];
}

export interface BankNotificationOptions extends SVGObjectOptions {
  amount?: string;
  time?: string;
  bank?: string;
}

export class SVGAssetGenerator {
  private static uid(prefix = 'id'): string {
    return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
  }

  private static escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private static encodeSvg(svg: string): string {
    const utf8 = encodeURIComponent(svg).replace(/%([0-9A-F]{2})/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    );
    return `data:image/svg+xml;base64,${btoa(utf8)}`;
  }

  private static wrapResult(
    svg: string,
    name: string,
    width: number,
    height: number,
    asAsset?: boolean
  ): string | Asset {
    const url = this.encodeSvg(svg);
    if (!asAsset) return url;
    return {
      id: this.uid('asset'),
      name,
      type: 'image',
      url,
      width,
      height,
      createdAt: Date.now(),
      source: 'imported',
    };
  }

  private static svgHeader(width: number, height: number, extra = ''): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"${extra}>`;
  }

  // ---------------------------------------------------------------------------
  // 真实材质纹理
  // ---------------------------------------------------------------------------

  static brushedMetal(options?: SVGTextureOptions & { asAsset?: false }): string;
  static brushedMetal(options: SVGTextureOptions & { asAsset: true }): Asset;
  static brushedMetal(options?: SVGTextureOptions): string | Asset {
    const width = options?.width ?? 800;
    const height = options?.height ?? 600;
    const bid = this.uid('bm');
    const svg = `${this.svgHeader(width, height)}
      <defs>
        <linearGradient id="${bid}_bg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#c2c8d0"/>
          <stop offset="40%" stop-color="#eef1f5"/>
          <stop offset="60%" stop-color="#d8dde3"/>
          <stop offset="100%" stop-color="#9aa2ab"/>
        </linearGradient>
        <filter id="${bid}_f" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.004 0.18" numOctaves="4" seed="12" result="noise"/>
          <feColorMatrix type="saturate" values="0" in="noise" result="gray"/>
          <feComponentTransfer in="gray" result="contrast">
            <feFuncR type="linear" slope="2.2" intercept="-0.55"/>
            <feFuncG type="linear" slope="2.2" intercept="-0.55"/>
            <feFuncB type="linear" slope="2.2" intercept="-0.55"/>
          </feComponentTransfer>
          <feBlend mode="overlay" in="contrast" in2="SourceGraphic" result="blend"/>
          <feSpecularLighting surfaceScale="2.5" specularConstant="0.9" specularExponent="28" lighting-color="#ffffff" in="blend" result="spec">
            <fePointLight x="${width * 0.2}" y="${height * 0.1}" z="240"/>
          </feSpecularLighting>
          <feComposite in="spec" in2="SourceAlpha" operator="in" result="specOut"/>
          <feBlend mode="screen" in="specOut" in2="blend"/>
        </filter>
      </defs>
      <rect width="100%" height="100%" fill="url(#${bid}_bg)" filter="url(#${bid}_f)"/>
    </svg>`;
    return this.wrapResult(svg, options?.name ?? 'brushed-metal.svg', width, height, options?.asAsset);
  }

  static carbonFiber(options?: SVGTextureOptions & { asAsset?: false }): string;
  static carbonFiber(options: SVGTextureOptions & { asAsset: true }): Asset;
  static carbonFiber(options?: SVGTextureOptions): string | Asset {
    const width = options?.width ?? 800;
    const height = options?.height ?? 600;
    const bid = this.uid('cf');
    const svg = `${this.svgHeader(width, height)}
      <defs>
        <pattern id="${bid}_weave" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="10" height="10" fill="#161616"/>
          <rect width="5" height="10" fill="#252525"/>
          <rect x="5" width="5" height="10" fill="#0e0e0e"/>
        </pattern>
        <filter id="${bid}_f" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="4" seed="55" result="noise"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0.12 0 0 0 0 0.12 0 0 0 0 0.12 0 0 0 0.35 0" in="noise" result="dust"/>
          <feBlend mode="overlay" in="dust" in2="SourceGraphic" result="blend"/>
          <feSpecularLighting surfaceScale="1.2" specularConstant="0.5" specularExponent="35" lighting-color="#777" in="blend" result="spec">
            <feDistantLight azimuth="45" elevation="60"/>
          </feSpecularLighting>
          <feComposite in="spec" in2="SourceAlpha" operator="in"/>
          <feBlend mode="screen" in2="blend"/>
        </filter>
        <radialGradient id="${bid}_v" cx="50%" cy="50%" r="80%">
          <stop offset="0%" stop-color="#2a2a2a" stop-opacity="0"/>
          <stop offset="100%" stop-color="#000" stop-opacity="0.6"/>
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#${bid}_weave)" filter="url(#${bid}_f)"/>
      <rect width="100%" height="100%" fill="url(#${bid}_v)"/>
    </svg>`;
    return this.wrapResult(svg, options?.name ?? 'carbon-fiber.svg', width, height, options?.asAsset);
  }

  static glassFrost(options?: SVGTextureOptions & { asAsset?: false }): string;
  static glassFrost(options: SVGTextureOptions & { asAsset: true }): Asset;
  static glassFrost(options?: SVGTextureOptions): string | Asset {
    const width = options?.width ?? 800;
    const height = options?.height ?? 600;
    const bid = this.uid('gf');
    const svg = `${this.svgHeader(width, height)}
      <defs>
        <linearGradient id="${bid}_bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.82"/>
          <stop offset="50%" stop-color="#eef2f6" stop-opacity="0.72"/>
          <stop offset="100%" stop-color="#d9e2ec" stop-opacity="0.78"/>
        </linearGradient>
        <filter id="${bid}_f" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="5" seed="33" result="noise"/>
          <feGaussianBlur stdDeviation="2.5" in="noise" result="blurNoise"/>
          <feDisplacementMap in="SourceGraphic" in2="blurNoise" scale="10" xChannelSelector="R" yChannelSelector="G" result="displaced"/>
          <feSpecularLighting surfaceScale="3" specularConstant="0.8" specularExponent="25" lighting-color="#ffffff" in="displaced" result="spec">
            <fePointLight x="${width * 0.3}" y="${height * 0.2}" z="220"/>
          </feSpecularLighting>
          <feComposite in="spec" in2="SourceAlpha" operator="in" result="specOut"/>
          <feBlend mode="screen" in="specOut" in2="displaced"/>
        </filter>
      </defs>
      <rect width="100%" height="100%" fill="url(#${bid}_bg)" filter="url(#${bid}_f)"/>
    </svg>`;
    return this.wrapResult(svg, options?.name ?? 'glass-frost.svg', width, height, options?.asAsset);
  }

  static craftPaper(options?: SVGTextureOptions & { asAsset?: false }): string;
  static craftPaper(options: SVGTextureOptions & { asAsset: true }): Asset;
  static craftPaper(options?: SVGTextureOptions): string | Asset {
    const width = options?.width ?? 800;
    const height = options?.height ?? 600;
    const bid = this.uid('cp');
    const svg = `${this.svgHeader(width, height)}
      <defs>
        <linearGradient id="${bid}_bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#dccbb3"/>
          <stop offset="50%" stop-color="#cdb89d"/>
          <stop offset="100%" stop-color="#bfa88d"/>
        </linearGradient>
        <filter id="${bid}_f" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="6" seed="91" result="noise"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0.45 0 0 0 0 0.38 0 0 0 0 0.28 0 0 0 0.45 0" in="noise" result="fiber"/>
          <feBlend mode="multiply" in="fiber" in2="SourceGraphic" result="blend"/>
          <feDiffuseLighting surfaceScale="1.5" diffuseConstant="0.6" lighting-color="#fff8ee" in="noise" result="diff">
            <feDistantLight azimuth="120" elevation="55"/>
          </feDiffuseLighting>
          <feBlend mode="soft-light" in="diff" in2="blend"/>
        </filter>
      </defs>
      <rect width="100%" height="100%" fill="url(#${bid}_bg)" filter="url(#${bid}_f)"/>
    </svg>`;
    return this.wrapResult(svg, options?.name ?? 'craft-paper.svg', width, height, options?.asAsset);
  }

  static concrete(options?: SVGTextureOptions & { asAsset?: false }): string;
  static concrete(options: SVGTextureOptions & { asAsset: true }): Asset;
  static concrete(options?: SVGTextureOptions): string | Asset {
    const width = options?.width ?? 800;
    const height = options?.height ?? 600;
    const bid = this.uid('ct');
    const svg = `${this.svgHeader(width, height)}
      <defs>
        <radialGradient id="${bid}_bg" cx="50%" cy="40%" r="90%">
          <stop offset="0%" stop-color="#888"/>
          <stop offset="60%" stop-color="#666"/>
          <stop offset="100%" stop-color="#444"/>
        </radialGradient>
        <filter id="${bid}_f" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.025" numOctaves="7" seed="18" result="noise"/>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="18" xChannelSelector="R" yChannelSelector="G" result="displaced"/>
          <feDiffuseLighting surfaceScale="3" diffuseConstant="0.7" lighting-color="#eeeeee" in="noise" result="diff">
            <feDistantLight azimuth="60" elevation="40"/>
          </feDiffuseLighting>
          <feBlend mode="multiply" in="diff" in2="displaced" result="blend"/>
          <feSpecularLighting surfaceScale="1" specularConstant="0.3" specularExponent="15" lighting-color="#ffffff" in="blend" result="spec">
            <fePointLight x="${width * 0.7}" y="${height * 0.3}" z="180"/>
          </feSpecularLighting>
          <feComposite in="spec" in2="SourceAlpha" operator="in"/>
          <feBlend mode="screen" in2="blend"/>
        </filter>
      </defs>
      <rect width="100%" height="100%" fill="url(#${bid}_bg)" filter="url(#${bid}_f)"/>
    </svg>`;
    return this.wrapResult(svg, options?.name ?? 'concrete.svg', width, height, options?.asAsset);
  }

  static darkNoise(options?: SVGTextureOptions & { asAsset?: false }): string;
  static darkNoise(options: SVGTextureOptions & { asAsset: true }): Asset;
  static darkNoise(options?: SVGTextureOptions): string | Asset {
    const width = options?.width ?? 800;
    const height = options?.height ?? 600;
    const bid = this.uid('dn');
    const svg = `${this.svgHeader(width, height)}
      <defs>
        <radialGradient id="${bid}_bg" cx="50%" cy="50%" r="90%">
          <stop offset="0%" stop-color="#1f2330"/>
          <stop offset="70%" stop-color="#12141c"/>
          <stop offset="100%" stop-color="#090a0f"/>
        </radialGradient>
        <filter id="${bid}_f" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="4" seed="72" result="noise"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0.55 0 0 0 0 0.6 0 0 0 0 0.75 0 0 0 0.22 0" in="noise" result="dust"/>
          <feBlend mode="screen" in="dust" in2="SourceGraphic" result="blend"/>
          <feGaussianBlur stdDeviation="0.6" in="noise" result="softNoise"/>
          <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.08 0" in="softNoise" result="stars"/>
          <feBlend mode="screen" in="stars" in2="blend"/>
        </filter>
      </defs>
      <rect width="100%" height="100%" fill="url(#${bid}_bg)" filter="url(#${bid}_f)"/>
    </svg>`;
    return this.wrapResult(svg, options?.name ?? 'dark-noise.svg', width, height, options?.asAsset);
  }

  static filmGrain(options?: SVGTextureOptions & { asAsset?: false }): string;
  static filmGrain(options: SVGTextureOptions & { asAsset: true }): Asset;
  static filmGrain(options?: SVGTextureOptions): string | Asset {
    const width = options?.width ?? 800;
    const height = options?.height ?? 600;
    const bid = this.uid('fg');
    const svg = `${this.svgHeader(width, height)}
      <defs>
        <radialGradient id="${bid}_bg" cx="50%" cy="50%" r="90%">
          <stop offset="0%" stop-color="#2a2a2a"/>
          <stop offset="100%" stop-color="#050505"/>
        </radialGradient>
        <filter id="${bid}_f" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" seed="64" result="noise"/>
          <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.25 0" in="noise" result="grain"/>
          <feBlend mode="screen" in="grain" in2="SourceGraphic" result="blend"/>
          <feTurbulence type="turbulence" baseFrequency="0.005 0.8" numOctaves="2" seed="8" result="scratches"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0.9 0 0 0 0 0.9 0 0 0 0 0.9 0 0 0 0.15 0" in="scratches" result="scratchW"/>
          <feBlend mode="screen" in="scratchW" in2="blend"/>
        </filter>
      </defs>
      <rect width="100%" height="100%" fill="url(#${bid}_bg)" filter="url(#${bid}_f)"/>
    </svg>`;
    return this.wrapResult(svg, options?.name ?? 'film-grain.svg', width, height, options?.asAsset);
  }

  // ---------------------------------------------------------------------------
  // 真实物体 / 场景
  // ---------------------------------------------------------------------------

  static receipt(options?: ReceiptOptions & { asAsset?: false }): string;
  static receipt(options: ReceiptOptions & { asAsset: true }): Asset;
  static receipt(options?: ReceiptOptions): string | Asset {
    const width = options?.width ?? 420;
    const height = options?.height ?? 640;
    const bid = this.uid('rc');
    const merchant = this.escapeXml(options?.merchant ?? 'STARBUCKS');
    const amount = this.escapeXml(options?.amount ?? '¥ 38.00');
    const time = this.escapeXml(options?.time ?? '2026-06-25 09:42');
    const items = options?.items ?? [
      { name: 'Grande Latte', price: '¥ 32.00' },
      { name: 'Croissant', price: '¥ 18.00' },
      { name: 'Service Fee', price: '¥ 2.00' },
    ];
    const zig = (y: number, up: boolean) => {
      let d = `M 0 ${y}`;
      for (let x = 0; x <= width; x += 12) {
        d += ` L ${x + 6} ${y + (up ? -6 : 6)}`;
      }
      d += ` L ${width} ${y}`;
      return d;
    };
    const itemLines = items
      .map(
        (it, i) =>
          `<text x="36" y="${200 + i * 40}" font-family="monospace" font-size="18" fill="#4a4a4a">${this.escapeXml(it.name)}</text>` +
          `<text x="${width - 36}" y="${200 + i * 40}" text-anchor="end" font-family="monospace" font-size="18" fill="#4a4a4a">${this.escapeXml(it.price)}</text>`
      )
      .join('');
    const svg = `${this.svgHeader(width, height)}
      <defs>
        <filter id="${bid}_shadow" x="-20%" y="-10%" width="140%" height="120%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="6"/>
          <feOffset dx="4" dy="6" result="off"/>
          <feComponentTransfer><feFuncA type="linear" slope="0.25"/></feComponentTransfer>
          <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="${bid}_paper" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="4" seed="44" result="noise"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0.6 0 0 0 0 0.55 0 0 0 0 0.45 0 0 0 0.12 0"/>
          <feBlend mode="multiply" in2="SourceGraphic"/>
        </filter>
      </defs>
      <rect width="100%" height="100%" fill="#f7f3eb"/>
      <path d="${zig(0, true)} L ${width} ${height} L 0 ${height} Z" fill="#fdfbf7" filter="url(#${bid}_shadow)"/>
      <path d="${zig(0, true)} L ${width} ${height} ${zig(height, false)} Z" fill="#fdfbf7" filter="url(#${bid}_paper)"/>
      <text x="50%" y="90" text-anchor="middle" font-family="Arial Black, sans-serif" font-size="28" fill="#2b2b2b" font-weight="bold">${merchant}</text>
      <text x="50%" y="125" text-anchor="middle" font-family="monospace" font-size="13" fill="#777">ORDER #8921 · ${time}</text>
      <line x1="36" y1="155" x2="${width - 36}" y2="155" stroke="#bbb" stroke-width="1.5" stroke-dasharray="6 4"/>
      ${itemLines}
      <line x1="36" y1="${190 + items.length * 40}" x2="${width - 36}" y2="${190 + items.length * 40}" stroke="#bbb" stroke-width="1.5" stroke-dasharray="6 4"/>
      <text x="${width - 36}" y="${235 + items.length * 40}" text-anchor="end" font-family="Arial Black, sans-serif" font-size="26" fill="#111">${amount}</text>
      <text x="50%" y="${height - 50}" text-anchor="middle" font-family="monospace" font-size="12" fill="#999">THANK YOU · 欢迎下次光临</text>
    </svg>`;
    return this.wrapResult(svg, options?.name ?? 'receipt.svg', width, height, options?.asAsset);
  }

  static chatBubble(options?: ChatBubbleOptions & { asAsset?: false }): string;
  static chatBubble(options: ChatBubbleOptions & { asAsset: true }): Asset;
  static chatBubble(options?: ChatBubbleOptions): string | Asset {
    const width = options?.width ?? 560;
    const height = options?.height ?? 240;
    const bid = this.uid('cb');
    const direction = options?.direction ?? 'left';
    const userName = this.escapeXml(options?.userName ?? 'Sarah');
    const message = this.escapeXml(options?.message ?? 'The payment has been received, thanks!');
    const avatar = this.escapeXml(options?.avatar ?? 'S');
    const bubbleX = direction === 'left' ? 90 : 36;
    const bubbleW = width - 130;
    const tailPath =
      direction === 'left'
        ? `M ${bubbleX + 18} ${height - 58} L ${bubbleX - 12} ${height - 40} L ${bubbleX + 28} ${height - 48} Z`
        : `M ${bubbleX + bubbleW - 18} ${height - 58} L ${bubbleX + bubbleW + 12} ${height - 40} L ${bubbleX + bubbleW - 28} ${height - 48} Z`;
    const avatarX = direction === 'left' ? 24 : width - 72;
    const svg = `${this.svgHeader(width, height)}
      <defs>
        <filter id="${bid}_shadow" x="-10%" y="-10%" width="120%" height="130%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="5"/>
          <feOffset dx="2" dy="4"/>
          <feComponentTransfer><feFuncA type="linear" slope="0.2"/></feComponentTransfer>
          <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <linearGradient id="${bid}_bg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#f4f7ff"/>
          <stop offset="100%" stop-color="#dce5ff"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="none"/>
      <circle cx="${avatarX + 24}" cy="52" r="24" fill="url(#${bid}_bg)" filter="url(#${bid}_shadow)"/>
      <text x="${avatarX + 24}" y="59" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#5b7cff">${avatar}</text>
      <text x="${direction === 'left' ? 90 : 36}" y="36" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#555">${userName}</text>
      <g filter="url(#${bid}_shadow)">
        <rect x="${bubbleX}" y="48" width="${bubbleW}" height="${height - 72}" rx="22" ry="22" fill="url(#${bid}_bg)"/>
        <path d="${tailPath}" fill="url(#${bid}_bg)"/>
      </g>
      <text x="${bubbleX + 22}" y="100" font-family="system-ui, -apple-system, sans-serif" font-size="20" fill="#222">${message}</text>
      <text x="${bubbleX + bubbleW - 16}" y="${height - 24}" text-anchor="end" font-family="Arial, sans-serif" font-size="12" fill="#99a">10:42 AM</text>
    </svg>`;
    return this.wrapResult(svg, options?.name ?? 'chat-bubble.svg', width, height, options?.asAsset);
  }

  static phoneScreenshot(options?: PhoneScreenshotOptions & { asAsset?: false }): string;
  static phoneScreenshot(options: PhoneScreenshotOptions & { asAsset: true }): Asset;
  static phoneScreenshot(options?: PhoneScreenshotOptions): string | Asset {
    const width = options?.width ?? 420;
    const height = options?.height ?? 760;
    const bid = this.uid('ps');
    const title = this.escapeXml(options?.title ?? 'Wealth Overview');
    const amount = this.escapeXml(options?.amount ?? '¥ 128,450.00');
    const changeRate = this.escapeXml(options?.changeRate ?? '+12.34%');
    const isPositive = options?.isPositive ?? true;
    const badgeColor = isPositive ? '#10b981' : '#ef4444';
    const svg = `${this.svgHeader(width, height)}
      <defs>
        <filter id="${bid}_shadow" x="-15%" y="-8%" width="130%" height="120%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="12"/>
          <feOffset dx="6" dy="14"/>
          <feComponentTransfer><feFuncA type="linear" slope="0.28"/></feComponentTransfer>
          <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <linearGradient id="${bid}_screen" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#f8fafc"/>
          <stop offset="100%" stop-color="#e2e8f0"/>
        </linearGradient>
        <linearGradient id="${bid}_glass" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.6"/>
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0.1"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="none"/>
      <rect x="16" y="16" width="${width - 32}" height="${height - 32}" rx="42" ry="42" fill="#111" filter="url(#${bid}_shadow)"/>
      <rect x="24" y="24" width="${width - 48}" height="${height - 48}" rx="36" ry="36" fill="url(#${bid}_screen)"/>
      <rect x="${width / 2 - 50}" y="30" width="100" height="22" rx="11" fill="#111"/>
      <text x="${width - 44}" y="46" text-anchor="end" font-family="Arial, sans-serif" font-size="12" fill="#111">9:41</text>
      <text x="50%" y="130" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="#64748b">${title}</text>
      <text x="50%" y="200" text-anchor="middle" font-family="Arial Black, sans-serif" font-size="38" fill="#0f172a">${amount}</text>
      <rect x="${width / 2 - 60}" y="230" width="120" height="32" rx="16" fill="${badgeColor}" fill-opacity="0.15"/>
      <text x="50%" y="252" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="${badgeColor}">${changeRate}</text>
      <g transform="translate(40, 320)">
        <rect width="${width - 80}" height="120" rx="20" fill="#fff" filter="url(#${bid}_shadow)"/>
        <rect x="0" y="0" width="${width - 80}" height="120" rx="20" fill="url(#${bid}_glass)"/>
        <text x="20" y="40" font-family="Arial, sans-serif" font-size="14" fill="#64748b">Today's return</text>
        <text x="20" y="80" font-family="Arial, sans-serif" font-size="26" font-weight="bold" fill="#0f172a">+¥ 1,240.50</text>
      </g>
      <g transform="translate(40, 470)">
        <rect width="${width - 80}" height="160" rx="20" fill="#fff" filter="url(#${bid}_shadow)"/>
        <polyline points="20,120 70,80 130,95 190,50 260,70 320,30" fill="none" stroke="${badgeColor}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="320" cy="30" r="5" fill="${badgeColor}"/>
      </g>
      <rect x="${width / 2 - 60}" y="${height - 64}" width="120" height="5" rx="2.5" fill="#111"/>
    </svg>`;
    return this.wrapResult(svg, options?.name ?? 'phone-screenshot.svg', width, height, options?.asAsset);
  }

  static idCard(options?: IDCardOptions & { asAsset?: false }): string;
  static idCard(options: IDCardOptions & { asAsset: true }): Asset;
  static idCard(options?: IDCardOptions): string | Asset {
    const width = options?.width ?? 640;
    const height = options?.height ?? 400;
    const bid = this.uid('ic');
    const rawName = options?.personName ?? 'Alex Chen';
    const name = this.escapeXml(rawName);
    const title = this.escapeXml(options?.title ?? 'Senior Product Designer');
    const company = this.escapeXml(options?.company ?? 'NanoEdit Inc.');
    const accent = options?.color ?? '#3b82f6';
    const svg = `${this.svgHeader(width, height)}
      <defs>
        <filter id="${bid}_shadow" x="-10%" y="-10%" width="120%" height="125%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="8"/>
          <feOffset dx="4" dy="8"/>
          <feComponentTransfer><feFuncA type="linear" slope="0.22"/></feComponentTransfer>
          <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <linearGradient id="${bid}_bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="100%" stop-color="#f1f5f9"/>
        </linearGradient>
        <linearGradient id="${bid}_accent" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="${accent}"/>
          <stop offset="100%" stop-color="${accent}" stop-opacity="0.7"/>
        </linearGradient>
        <pattern id="${bid}_grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" stroke-width="1"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="#e2e8f0" fill-opacity="0.3"/>
      <g transform="translate(30, 30)" filter="url(#${bid}_shadow)">
        <rect width="${width - 60}" height="${height - 60}" rx="20" fill="url(#${bid}_bg)"/>
        <rect width="${width - 60}" height="${height - 60}" rx="20" fill="url(#${bid}_grid)" fill-opacity="0.4"/>
        <rect x="0" y="0" width="${width - 60}" height="70" rx="20" fill="url(#${bid}_accent)"/>
        <rect x="0" y="50" width="${width - 60}" height="30" fill="url(#${bid}_accent)"/>
        <circle cx="80" cy="${(height - 60) / 2 + 10}" r="54" fill="#e2e8f0" stroke="#fff" stroke-width="4"/>
        <text x="80" y="${(height - 60) / 2 + 24}" text-anchor="middle" font-family="Arial, sans-serif" font-size="38" fill="#94a3b8">${this.escapeXml(rawName.slice(0, 1))}</text>
        <text x="160" y="${(height - 60) / 2 - 10}" font-family="Arial Black, sans-serif" font-size="28" fill="#0f172a">${name}</text>
        <text x="160" y="${(height - 60) / 2 + 28}" font-family="Arial, sans-serif" font-size="16" fill="#475569">${title}</text>
        <text x="160" y="${(height - 60) / 2 + 56}" font-family="Arial, sans-serif" font-size="14" fill="${accent}" font-weight="bold">${company}</text>
        <rect x="${width - 160}" y="${height - 120}" width="100" height="28" rx="4" fill="#f59e0b"/>
        <text x="${width - 110}" y="${height - 100}" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#fff">STAFF</text>
      </g>
    </svg>`;
    return this.wrapResult(svg, options?.name ?? 'id-card.svg', width, height, options?.asAsset);
  }

  static stickyNote(options?: StickyNoteOptions & { asAsset?: false }): string;
  static stickyNote(options: StickyNoteOptions & { asAsset: true }): Asset;
  static stickyNote(options?: StickyNoteOptions): string | Asset {
    const width = options?.width ?? 360;
    const height = options?.height ?? 360;
    const bid = this.uid('sn');
    const text = this.escapeXml(options?.text ?? 'Call back before 3PM');
    const color = options?.color ?? '#fde047';
    const angle = options?.angle ?? -3;
    const svg = `${this.svgHeader(width, height)}
      <defs>
        <filter id="${bid}_shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="5"/>
          <feOffset dx="5" dy="7"/>
          <feComponentTransfer><feFuncA type="linear" slope="0.28"/></feComponentTransfer>
          <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="${bid}_paper" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.1" numOctaves="3" seed="77" result="noise"/>
          <feBlend mode="multiply" in="noise" in2="SourceGraphic"/>
        </filter>
        <linearGradient id="${bid}_tape" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.55"/>
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0.25"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="none"/>
      <g transform="translate(${width / 2}, ${height / 2}) rotate(${angle}) translate(${-width / 2}, ${-height / 2})" filter="url(#${bid}_shadow)">
        <rect x="20" y="20" width="${width - 40}" height="${height - 40}" fill="${color}" filter="url(#${bid}_paper)"/>
        <rect x="${width / 2 - 55}" y="12" width="110" height="32" fill="url(#${bid}_tape)"/>
        <text x="50%" y="120" text-anchor="middle" font-family="'Comic Sans MS', 'Chalkboard SE', cursive, sans-serif" font-size="28" fill="#3f3f24">${text}</text>
        <line x1="50" y1="170" x2="${width - 50}" y2="170" stroke="#000" stroke-opacity="0.12" stroke-width="2"/>
        <line x1="50" y1="210" x2="${width - 50}" y2="210" stroke="#000" stroke-opacity="0.12" stroke-width="2"/>
        <line x1="50" y1="250" x2="${width - 100}" y2="250" stroke="#000" stroke-opacity="0.12" stroke-width="2"/>
      </g>
    </svg>`;
    return this.wrapResult(svg, options?.name ?? 'sticky-note.svg', width, height, options?.asAsset);
  }

  static polaroidPhoto(options?: PolaroidPhotoOptions & { asAsset?: false }): string;
  static polaroidPhoto(options: PolaroidPhotoOptions & { asAsset: true }): Asset;
  static polaroidPhoto(options?: PolaroidPhotoOptions): string | Asset {
    const width = options?.width ?? 420;
    const height = options?.height ?? 520;
    const bid = this.uid('pp');
    const caption = this.escapeXml(options?.caption ?? 'Summer Memories');
    const photoColor = options?.photoColor ?? '#93c5fd';
    const svg = `${this.svgHeader(width, height)}
      <defs>
        <filter id="${bid}_shadow" x="-15%" y="-10%" width="130%" height="120%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="10"/>
          <feOffset dx="8" dy="12"/>
          <feComponentTransfer><feFuncA type="linear" slope="0.25"/></feComponentTransfer>
          <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="${bid}_photo" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="4" seed="22" result="noise"/>
          <feBlend mode="overlay" in="noise" in2="SourceGraphic"/>
        </filter>
        <linearGradient id="${bid}_bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="100%" stop-color="#f1f5f9"/>
        </linearGradient>
        <linearGradient id="${bid}_inner" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${photoColor}"/>
          <stop offset="100%" stop-color="#1e293b"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="none"/>
      <g transform="translate(20, 20)" filter="url(#${bid}_shadow)">
        <rect width="${width - 40}" height="${height - 40}" fill="url(#${bid}_bg)"/>
        <rect x="20" y="20" width="${width - 80}" height="${width - 80}" fill="url(#${bid}_inner)" filter="url(#${bid}_photo)"/>
        <text x="${(width - 40) / 2}" y="${height - 85}" text-anchor="middle" font-family="'Courier New', monospace" font-size="20" fill="#334155">${caption}</text>
        <line x1="40" y1="${height - 70}" x2="${width - 80}" y2="${height - 70}" stroke="#cbd5e1" stroke-width="1"/>
      </g>
    </svg>`;
    return this.wrapResult(svg, options?.name ?? 'polaroid-photo.svg', width, height, options?.asAsset);
  }

  static newspaperClipping(options?: NewspaperClippingOptions & { asAsset?: false }): string;
  static newspaperClipping(options: NewspaperClippingOptions & { asAsset: true }): Asset;
  static newspaperClipping(options?: NewspaperClippingOptions): string | Asset {
    const width = options?.width ?? 640;
    const height = options?.height ?? 480;
    const bid = this.uid('nc');
    const headline = this.escapeXml(options?.headline ?? 'MARKET HITS RECORD HIGH');
    const date = this.escapeXml(options?.date ?? 'June 25, 2026');
    const snippets = options?.snippets ?? [
      'Investors welcomed the latest quarterly results as tech stocks surged.',
      'Analysts remain cautiously optimistic amid ongoing global uncertainty.',
      'The benchmark index closed up 2.4 percent in heavy trading volume.',
    ];
    const tornPath = (y: number) => {
      let d = `M 0 ${y}`;
      for (let x = 0; x <= width; x += 14) {
        d += ` l 7 ${Math.random() > 0.5 ? 5 : -5} l 7 ${Math.random() > 0.5 ? 4 : -4}`;
      }
      return d;
    };
    const topTear = tornPath(0);
    const bottomTear = tornPath(height);
    const colCount = 3;
    const colWidth = (width - 80) / colCount;
    const lineBlocks = Array.from({ length: colCount }, (_, c) => {
      const x = 40 + c * colWidth;
      return Array.from({ length: 9 }, (_, i) => {
        const w = colWidth - 14 - Math.random() * 24;
        return `<rect x="${x}" y="${250 + i * 18}" width="${w}" height="6" fill="#4b5563" fill-opacity="0.8"/>`;
      }).join('');
    }).join('');
    const svg = `${this.svgHeader(width, height)}
      <defs>
        <filter id="${bid}_shadow" x="-10%" y="-10%" width="120%" height="125%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="5"/>
          <feOffset dx="3" dy="6"/>
          <feComponentTransfer><feFuncA type="linear" slope="0.2"/></feComponentTransfer>
          <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="${bid}_paper" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="4" seed="17" result="noise"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0.5 0 0 0 0 0.45 0 0 0 0 0.35 0 0 0 0.15 0"/>
          <feBlend mode="multiply" in2="SourceGraphic"/>
        </filter>
      </defs>
      <rect width="100%" height="100%" fill="none"/>
      <path d="${topTear} L ${width} ${height} L 0 ${height} Z" fill="#f8f6f1" filter="url(#${bid}_shadow)"/>
      <path d="${topTear} L ${width} ${height} ${bottomTear} Z" fill="#f8f6f1" filter="url(#${bid}_paper)"/>
      <text x="40" y="70" font-family="'Times New Roman', serif" font-size="34" font-weight="bold" fill="#111">${headline}</text>
      <rect x="40" y="88" width="120" height="8" fill="#ef4444"/>
      <text x="40" y="130" font-family="'Times New Roman', serif" font-size="14" font-style="italic" fill="#555">The Daily Chronicle · ${date}</text>
      ${snippets
        .map(
          (s, i) =>
            `<text x="${40 + i * 210}" y="180" font-family="'Times New Roman', serif" font-size="13" fill="#374151">${this.escapeXml(s)}</text>`
        )
        .join('')}
      ${lineBlocks}
    </svg>`;
    return this.wrapResult(svg, options?.name ?? 'newspaper-clipping.svg', width, height, options?.asAsset);
  }

  static bankNotification(options?: BankNotificationOptions & { asAsset?: false }): string;
  static bankNotification(options: BankNotificationOptions & { asAsset: true }): Asset;
  static bankNotification(options?: BankNotificationOptions): string | Asset {
    const width = options?.width ?? 560;
    const height = options?.height ?? 260;
    const bid = this.uid('bn');
    const amount = this.escapeXml(options?.amount ?? '+ ¥ 5,200.00');
    const time = this.escapeXml(options?.time ?? 'Today 11:23');
    const bank = this.escapeXml(options?.bank ?? 'China Merchants Bank');
    const svg = `${this.svgHeader(width, height)}
      <defs>
        <filter id="${bid}_shadow" x="-10%" y="-15%" width="120%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="10"/>
          <feOffset dx="0" dy="10"/>
          <feComponentTransfer><feFuncA type="linear" slope="0.18"/></feComponentTransfer>
          <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <linearGradient id="${bid}_bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="100%" stop-color="#f8fafc"/>
        </linearGradient>
        <linearGradient id="${bid}_accent" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#ef4444"/>
          <stop offset="100%" stop-color="#f97316"/>
        </linearGradient>
        <filter id="${bid}_noise" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" seed="39" result="noise"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.04 0"/>
          <feBlend mode="multiply" in2="SourceGraphic"/>
        </filter>
      </defs>
      <rect width="100%" height="100%" fill="none"/>
      <g transform="translate(24, 24)" filter="url(#${bid}_shadow)">
        <rect width="${width - 48}" height="${height - 48}" rx="24" fill="url(#${bid}_bg)" filter="url(#${bid}_noise)"/>
        <rect x="0" y="0" width="${width - 48}" height="6" rx="3" fill="url(#${bid}_accent)"/>
        <circle cx="54" cy="70" r="28" fill="url(#${bid}_accent)"/>
        <text x="54" y="78" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#fff">¥</text>
        <text x="100" y="62" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#111">${bank}</text>
        <text x="100" y="86" font-family="Arial, sans-serif" font-size="12" fill="#64748b">Account deposit received</text>
        <text x="40" y="150" font-family="Arial Black, sans-serif" font-size="36" fill="#111">${amount}</text>
        <text x="40" y="185" font-family="Arial, sans-serif" font-size="14" fill="#10b981" font-weight="bold">Transaction successful</text>
        <text x="${width - 72}" y="${height - 64}" text-anchor="end" font-family="Arial, sans-serif" font-size="12" fill="#94a3b8">${time}</text>
        <circle cx="${width - 88}" cy="68" r="14" fill="#10b981"/>
        <path d="M ${width - 94} 68 L ${width - 86} 76 L ${width - 78} 62" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
    </svg>`;
    return this.wrapResult(svg, options?.name ?? 'bank-notification.svg', width, height, options?.asAsset);
  }
}

export default SVGAssetGenerator;
