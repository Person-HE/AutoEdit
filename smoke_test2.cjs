// smoke2.cjs — 像素级验证蒙版 + segmentForVideo(<img>) 验证
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 800, height: 600 });
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));

  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise(r => setTimeout(r, 2000));

  // 搭建测试场景：左上角放 200x200 带圆形蒙版的渐变块
  await page.evaluate(() => {
    const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none"><rect width="100" height="100" fill="black"/><circle cx="50" cy="50" r="46" fill="white"/></svg>`;
    const enc = encodeURIComponent(SVG);
    const host = document.createElement('div');
    host.id = 'mask-test';
    host.style.cssText = `position:fixed;left:0;top:0;width:200px;height:200px;background:rgb(255,0,0);z-index:99999;`;
    const s = host.style;
    s.maskImage = `url('data:image/svg+xml,${enc}')`;
    s.maskSize = '100% 100%';
    s.maskPosition = '50% 50%';
    s.maskRepeat = 'no-repeat';
    s.maskMode = 'luminance';
    s.webkitMaskImage = `url('data:image/svg+xml,${enc}')`;
    s.webkitMaskSize = '100% 100%';
    s.webkitMaskPosition = '50% 50%';
    s.webkitMaskRepeat = 'no-repeat';
    document.body.appendChild(host);
  });
  await new Promise(r => setTimeout(r, 400));

  // 截图 clip 得到 PNG buffer，稍后传回页面内解码采样
  const shot = await page.screenshot({ clip: { x: 0, y: 0, width: 200, height: 200 } });
  const cssSupport = await page.evaluate(() => {
    const el = document.getElementById('mask-test');
    const cs = getComputedStyle(el);
    return {
      maskImageApplied: (cs.maskImage || cs.webkitMaskImage || '').includes('data:image/svg+xml'),
      maskModeLuminance: cs.maskMode === 'luminance',
      supportsMask: CSS.supports('mask-image', 'url("data:image/svg+xml,test")') || CSS.supports('-webkit-mask-image', 'url("data:image/svg+xml,test")'),
    };
  });

  // 蒙版像素级验证：截图 clip 后在 Node 端用 puppeteer page.evaluate + OffscreenCanvas 不行，
  // 改为：把截图 buffer 传回页面 canvas 解码采样
  const pixelCheck = await page.evaluate(async (bufB64) => {
    const img = new Image();
    img.src = 'data:image/png;base64,' + bufB64;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = 200; c.height = 200;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const center = ctx.getImageData(100, 100, 1, 1).data;   // 圆心
    const corner = ctx.getImageData(3, 3, 1, 1).data;        // 角落（黑=隐藏→页面底色）
    const edge = ctx.getImageData(100, 8, 1, 1).data;        // 圆外上边缘
    return {
      center: [center[0], center[1], center[2]],
      corner: [corner[0], corner[1], corner[2]],
      edge: [edge[0], edge[1], edge[2]],
      centerIsRed: center[0] > 200 && center[1] < 60 && center[2] < 60,
      cornerIsPageBg: !(corner[0] > 200 && corner[1] < 60),
      edgeIsPageBg: !(edge[0] > 200 && edge[1] < 60),
    };
  }, shot.toString('base64'));

  // ===== segmentForVideo 对 <img> 的可用性验证 =====
  const segTest = await page.evaluate(async () => {
    try {
      const { ImageSegmenter } = await import('/node_modules/@mediapipe/tasks-vision/vision_bundle.mjs');
      const seg = await ImageSegmenter.createFromOptions({
        wasmLoaderPath: '/mediapipe/wasm/vision_wasm_internal.js',
        wasmBinaryPath: '/mediapipe/wasm/vision_wasm_internal.wasm',
      }, {
        baseOptions: { modelAssetPath: '/mediapipe/models/selfie_multiclass_256x256.tflite', delegate: 'CPU' },
        runningMode: 'VIDEO',
        outputCategoryMask: false,
        outputConfidenceMasks: true,
      });
      const img = new Image();
      img.src = 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="blue"/><circle cx="128" cy="128" r="60" fill="tan"/></svg>`);
      await img.decode();
      let ok = false, bgAvg = -1, fgAvg = -1;
      seg.segmentForVideo(img, performance.now(), (res) => {
        const m = res.confidenceMasks[0];
        const d = m.getAsFloat32Array();
        const w = m.width, h = m.height;
        let bgSum = 0, bgN = 0, fgSum = 0, fgN = 0;
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          const v = d[y * w + x];
          const isFaceArea = Math.hypot(x - 128, y - 128) < 40;
          if (isFaceArea) { fgSum += v; fgN++; } else if (x < 20 && y < 20) { bgSum += v; bgN++; }
        }
        bgAvg = bgSum / Math.max(1, bgN);
        fgAvg = fgSum / Math.max(1, fgN);
        res.close();
        ok = true;
      });
      seg.close();
      return { ok, bgAvg, fgAvg, separable: ok && bgAvg > 0.8 && fgAvg < 0.4 };
    } catch (e) {
      return { ok: false, error: String(e && e.message || e) };
    }
  });

  console.log(JSON.stringify({ cssSupport, pixelCheck, segTest, pageErrors: errors.slice(0, 5) }, null, 2));
  await browser.close();
})().catch(e => { console.error('SMOKE FAILED:', e); process.exit(1); });
