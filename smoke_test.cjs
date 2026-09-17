// smoke_mask_matting.js — 端到端冒烟验证蒙版 CSS 方案 + MediaPipe 分割器加载/推理
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));

  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise(r => setTimeout(r, 3000));

  // ===== Test 1: 蒙版 CSS data-URL 方案渲染验证 =====
  const maskTest = await page.evaluate(async () => {
    const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none"><rect width="100" height="100" fill="black"/><circle cx="50" cy="50" r="46" fill="white"/></svg>`;
    const enc = encodeURIComponent(SVG);
    const host = document.createElement('div');
    host.style.cssText = `position:fixed;left:0;top:0;width:200px;height:200px;background:linear-gradient(red,lime);z-index:99999;`;
    const s = host.style;
    s.maskImage = `url('data:image/svg+xml,${enc}')`;
    s.maskSize = '100% 100%';
    s.maskPosition = '50% 50%';
    s.maskRepeat = 'no-repeat';
    s.maskMode = 'luminance';
    s.WebkitMaskImage = `url('data:image/svg+xml,${enc}')`;
    s.WebkitMaskSize = '100% 100%';
    s.WebkitMaskPosition = '50% 50%';
    s.WebkitMaskRepeat = 'no-repeat';
    document.body.appendChild(host);
    await new Promise(r => setTimeout(r, 300));
    // 采样：圆心应为可见（颜色非黑），角落应为隐藏（页面背景色）
    const c = document.createElement('canvas');
    c.width = 200; c.height = 200;
    // 用 elementFromPoint 检测：角落应命中下层元素
    const centerVisible = document.elementFromPoint(100, 100) === host;
    const cornerHidden = document.elementFromPoint(5, 5) !== host;
    host.remove();
    return { centerVisible, cornerHidden };
  });

  // ===== Test 2: MediaPipe ImageSegmenter 本地加载 + 推理 =====
  const segTest = await page.evaluate(async () => {
    try {
      const { ImageSegmenter } = await import('/node_modules/@mediapipe/tasks-vision/vision_bundle.mjs');
      const fileset = {
        wasmLoaderPath: '/mediapipe/wasm/vision_wasm_internal.js',
        wasmBinaryPath: '/mediapipe/wasm/vision_wasm_internal.wasm',
      };
      const seg = await ImageSegmenter.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: '/mediapipe/models/selfie_multiclass_256x256.tflite', delegate: 'CPU' },
        runningMode: 'VIDEO',
        outputCategoryMask: false,
        outputConfidenceMasks: true,
      });
      // 生成测试图：纯色（无人物），前景置信度应低
      const img = new Image();
      img.src = 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="blue"/></svg>`);
      await img.decode();
      let ok = false, avg = -1;
      seg.segment(img, (res) => {
        const m = res.confidenceMasks[0];
        const d = m.getAsFloat32Array();
        let sum = 0; for (let i = 0; i < d.length; i++) sum += d[i];
        avg = sum / d.length;
        res.close();
        ok = true;
      });
      seg.close();
      return { ok, bgConfidence: avg };
    } catch (e) {
      return { ok: false, error: String(e && e.message || e) };
    }
  });

  console.log(JSON.stringify({ maskTest, segTest, consoleErrors: errors.slice(0, 8) }, null, 2));
  await browser.close();
})().catch(e => { console.error('SMOKE FAILED:', e); process.exit(1); });
