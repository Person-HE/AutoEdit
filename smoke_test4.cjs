// smoke4.cjs — 真实人像分割验证：本地起 HTTP 提供图片，避免跨域/CDN 慢
const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');

// 用一张本地生成的 SVG 人像替代（几何人形，真实感足够验证分割逻辑）
// 更好：从 Unsplash 拉一张真实人像存本地
async function fetchPortrait() {
  const candidates = [
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80',   // 男性人像
    'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?w=600',      // 人像
  ];
  for (const u of candidates) {
    try {
      const res = await fetch(u, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length > 10000) { fs.writeFileSync('portrait_test.jpg', buf); return true; }
    } catch (e) { /* next */ }
  }
  return false;
}

(async () => {
  const haveImg = await fetchPortrait();
  if (!haveImg) { console.log(JSON.stringify({ fetched: false })); process.exit(0); }

  // 本地静态服务
  const srv = http.createServer((req, res) => {
    const p = req.url === '/portrait.jpg' ? 'portrait_test.jpg' : null;
    if (!p) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': 'image/jpeg', 'Access-Control-Allow-Origin': '*' });
    fs.createReadStream(p).pipe(res);
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
      let out = null;
      seg.segmentForVideo(img, performance.now(), (res) => {
        const m = res.confidenceMasks[0];
        const d = m.getAsFloat32Array();
        const w = m.width, h = m.height;
        const bgAt = (x, y) => d[Math.round(y) * w + Math.round(x)];
        const center = bgAt(w / 2, h * 0.5);
        const lowerCenter = bgAt(w / 2, h * 0.75);
        const corners = [bgAt(5, 5), bgAt(w - 5, 5), bgAt(5, h - 5), bgAt(w - 5, h - 5)];
        const avgCorners = corners.reduce((a, b) => a + b, 0) / 4;
        out = {
          centerBgConf: +center.toFixed(3),
          lowerCenterBgConf: +lowerCenter.toFixed(3),
          cornersBgConf: corners.map(v => +v.toFixed(3)),
          personDetected: (center < 0.45 || lowerCenter < 0.45) && avgCorners > 0.75,
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
