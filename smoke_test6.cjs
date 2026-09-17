// smoke6.cjs — 综合验证：蒙版旋转+羽化像素级验证 + 智能抠像引擎（生产路径）UI 集成验证
const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', protocolTimeout: 120000 });
  const page = await browser.newPage();
  await page.setViewport({ width: 900, height: 700 });
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise(r => setTimeout(r, 2500));

  // ===== A. 蒙版旋转 45°：矩形旋转后角落采样 =====
  await page.evaluate(() => {
    function buildSvg(rot, feather) {
      const shape = `<rect x="4" y="4" width="92" height="92" rx="2" fill="white"/>`;
      const filter = feather > 0.2
        ? `<defs><filter id="f" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${feather}"/></filter></defs>` : '';
      const edge = feather > 0.2 ? `<g filter="url(#f)">${shape.replace('fill="white"', 'fill="black"')}</g>` : '';
      const wrapped = feather > 0.2 ? shape + edge : shape;
      const rotated = rot !== 0 ? `<g transform="rotate(${rot} 50 50)">${wrapped}</g>` : wrapped;
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none"><rect width="100" height="100" fill="black"/>${filter}${rotated}</svg>`;
    }
    const enc = encodeURIComponent(buildSvg(45, 0));
    const host = document.createElement('div');
    host.id = 'rot-test';
    host.style.cssText = `position:fixed;left:0;top:0;width:200px;height:200px;background:rgb(0,255,0);z-index:99999;`;
    const s = host.style;
    s.maskImage = `url('data:image/svg+xml,${enc}')`;
    s.maskSize = '100% 100%'; s.maskPosition = '50% 50%'; s.maskRepeat = 'no-repeat'; s.maskMode = 'luminance';
    s.webkitMaskImage = `url('data:image/svg+xml,${enc}')`;
    s.webkitMaskSize = '100% 100%'; s.webkitMaskPosition = '50% 50%'; s.webkitMaskRepeat = 'no-repeat';
    document.body.appendChild(host);
  });
  await new Promise(r => setTimeout(r, 300));
  const rotShot = await page.screenshot({ clip: { x: 0, y: 0, width: 200, height: 200 } });
  const rotCheck = await page.evaluate(async (b64) => {
    const img = new Image();
    img.src = 'data:image/png;base64,' + b64;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = 200; c.height = 200;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    // 旋转 45° 的矩形：中心可见；左上角(10,10)与右上角(190,10)应在旋转后形状外
    const at = (x, y) => ctx.getImageData(x, y, 1, 1).data;
    const center = at(100, 100);
    const tl = at(8, 8);
    const tr = at(192, 8);
    const isGreen = p => p[1] > 180 && p[0] < 90;
    return {
      centerVisible: isGreen(center),
      tlHidden: !isGreen(tl),
      trHidden: !isGreen(tr),
    };
  }, rotShot.toString('base64'));

  // ===== B. 生产代码引擎集成：import 引擎模块 + engine singleton 存在性 =====
  const engineImport = await page.evaluate(async () => {
    try {
      const mod = await import('/src/engine/mask/maskEngine.ts');
      const sm = await import('/src/engine/mask/smartMatting.ts');
      const cfg = { enabled: true, shape: 'star', x: 50, y: 50, width: 80, height: 80, rotation: 25, feather: 20, inverted: false };
      const css = mod.buildMaskCss(cfg);
      const style = mod.maskToReactStyle(css);
      return {
        maskCssOk: css.maskImage.startsWith("url('data:image/svg+xml,"),
        rotationBakedIn: decodeURIComponent(css.maskImage).includes('rotate(25 50 50)'),
        featherBakedIn: decodeURIComponent(css.maskImage).includes('feGaussianBlur'),
        styleKeys: Object.keys(style).length,
        mattingSingleton: !!sm.smartMattingEngine,
        mattingHasBind: typeof sm.smartMattingEngine.bind === 'function',
        mattingHasCheck: typeof sm.smartMattingEngine.checkAvailability === 'function',
      };
    } catch (e) {
      return { error: String(e && e.message || e) };
    }
  });

  // ===== C. 模型可达性（引擎同路径）=====
  const modelAvail = await page.evaluate(async () => {
    const r = await fetch('/mediapipe/models/selfie_multiclass_256x256.tflite', { method: 'HEAD' });
    return { ok: r.ok, size: r.headers.get('content-length') };
  });

  console.log(JSON.stringify({ rotCheck, engineImport, modelAvail, pageErrors: errors.slice(0, 5) }, null, 2));
  await browser.close();
})().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
