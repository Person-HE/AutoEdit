// smoke5.cjs — 真实人像 + 引擎完整管线验证（含自适应阈值）
const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');

(async () => {
  const haveImg = fs.existsSync('portrait_test.jpg');
  if (!haveImg) { console.log(JSON.stringify({ fetched: false })); process.exit(0); }

  const srv = http.createServer((req, res) => {
    if (req.url !== '/portrait.jpg') { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': 'image/jpeg', 'Access-Control-Allow-Origin': '*' });
    fs.createReadStream('portrait_test.jpg').pipe(res);
  }).listen(0);
  const port = srv.address().port;

  const browser = await puppeteer.launch({ headless: 'new', protocolTimeout: 120000 });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});

  const result = await page.evaluate(async (port) => {
    try {
      const { ImageSegmenter } = await import('/node_modules/@mediapipe/tasks-vision/vision_bundle.mjs');
      const seg = await ImageSegmenter.createFromOptions({
        wasmLoaderPath: '/mediapipe/wasm/vision_wasm_internal.js',
        wasmBinaryPath: '/mediapipe/wasm/vision_wasm_internal.wasm',
      }, {
        baseOptions: { modelAssetPath: '/mediapipe/models/selfie_multiclass_256x256.tflite', delegate: 'CPU' },
        runningMode: 'VIDEO',
        outputConfidenceMasks: true,
      });
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = `http://localhost:${port}/portrait.jpg`;
      await img.decode();

      // 复刻引擎 drawResult 逻辑（含空场景自适应）并统计不透明率
      function renderAlpha(data, w, h, conf, expand, featherPx) {
        const threshold = conf + expand * 0.5;
        let fgCount = 0;
        const total = w * h;
        for (let i = 0; i < total; i++) if (data[i] < conf) fgCount++;
        const fgRatio = fgCount / total;
        let dynThreshold = threshold;
        if (fgRatio < 0.02) {
          const sampled = [];
          const step = Math.max(1, Math.floor(total / 8192));
          for (let i = 0; i < total; i += step) sampled.push(data[i]);
          sampled.sort((a, b) => a - b);
          const k = Math.max(0, Math.floor(sampled.length * 0.02) - 1);
          const pivot = sampled[Math.min(sampled.length - 1, Math.max(0, k))] ?? 0;
          dynThreshold = Math.min(threshold, Math.max(0, (1 - pivot) - 0.02));
        }
        const c1 = document.createElement('canvas');
        c1.width = w; c1.height = h;
        const ctx = c1.getContext('2d');
        const imgData = ctx.createImageData(w, h);
        for (let i = 0; i < total; i++) {
          const fg = 1 - data[i];
          let alpha = (fg - dynThreshold) * 8 + 0.5;
          alpha = Math.max(0, Math.min(1, alpha));
          imgData.data[i*4] = 255; imgData.data[i*4+1] = 255; imgData.data[i*4+2] = 255; imgData.data[i*4+3] = alpha*255;
        }
        ctx.putImageData(imgData, 0, 0);
        if (featherPx > 0.2) {
          const c2 = document.createElement('canvas');
          c2.width = w; c2.height = h;
          const bctx = c2.getContext('2d');
          bctx.filter = `blur(${featherPx}px)`;
          bctx.drawImage(c1, 0, 0);
          return c2;
        }
        return c1;
      }

      let out = null;
      seg.segmentForVideo(img, performance.now(), (res) => {
        const m = res.confidenceMasks[0];
        const d = m.getAsFloat32Array();
        const w = m.width, h = m.height;
        const canvas = renderAlpha(d, w, h, 0.5, 0, 2);
        const ctx = canvas.getContext('2d');
        const px = ctx.getImageData(0, 0, w, h).data;
        let opaque = 0;
        for (let i = 0; i < w * h; i++) if (px[i*4+3] > 128) opaque++;
        const fgRatio = opaque / (w * h);
        out = {
          fgRatio: +fgRatio.toFixed(3),
          verdict: fgRatio > 0.05 && fgRatio < 0.85 ? 'PERSON_ISOLATED' : (fgRatio >= 0.85 ? 'ALL_VISIBLE_FALLBACK' : 'MOSTLY_TRANSPARENT'),
        };
        res.close();
      });
      seg.close();
      return out;
    } catch (e) {
      return { error: String(e && e.message || e) };
    }
  }, port);

  console.log(JSON.stringify(result, null, 2));
  await browser.close();
  srv.close();
})().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
