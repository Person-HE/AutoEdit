// smoke3.cjs — 真实人像分割效果验证
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.goto('about:blank');
  const urls = [
    'https://storage.googleapis.com/mediapipe-assets/business-person.jpg',
    'https://storage.googleapis.com/mediapipe-assets/portrait.jpg',
  ];
  const result = await page.evaluate(async (urls) => {
    let img = null;
    for (const u of urls) {
      try {
        const im = new Image();
        im.crossOrigin = 'anonymous';
        im.src = u;
        await im.decode();
        img = im;
        break;
      } catch (e) { /* next */ }
    }
    if (!img) return { fetched: false };
    try {
      const { ImageSegmenter } = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.17/vision_bundle.mjs');
      const seg = await ImageSegmenter.createFromOptions({
        wasmLoaderPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.17/wasm/vision_wasm_internal.js',
        wasmBinaryPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.17/wasm/vision_wasm_internal.wasm',
      }, {
        baseOptions: { modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/1/selfie_multiclass_256x256.tflite', delegate: 'CPU' },
        runningMode: 'VIDEO',
        outputConfidenceMasks: true,
      });
      // 中心区域（应为人像主体）vs 四角（应为背景）
      let out = null;
      seg.segmentForVideo(img, performance.now(), (res) => {
        const m = res.confidenceMasks[0];
        const d = m.getAsFloat32Array();
        const w = m.width, h = m.height;
        const bgConf = (x, y) => d[Math.round(y) * w + Math.round(x)];
        const center = bgConf(w/2, h*0.55);
        const cornerTL = bgConf(5, 5);
        const cornerTR = bgConf(w-5, 5);
        const cornerBL = bgConf(5, h-5);
        const cornerBR = bgConf(w-5, h-5);
        out = {
          centerBgConf: center,
          cornersBgConf: [cornerTL, cornerTR, cornerBL, cornerBR],
          personDetected: center < 0.5 && (cornerTL > 0.8 || cornerTR > 0.8),
          imgSize: [img.naturalWidth, img.naturalHeight],
        };
        res.close();
      });
      seg.close();
      return { fetched: true, src: img.src.slice(0, 60), ...out };
    } catch (e) {
      return { fetched: true, error: String(e && e.message || e) };
    }
  }, urls);
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
})().catch(e => { console.error('FAILED:', e); process.exit(1); });
