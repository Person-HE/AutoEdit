/**
 * 智能抠像引擎 — MediaPipe ImageSegmenter (selfie_multiclass_256x256)
 *
 * 工作方式：
 * - 从本地 /mediapipe/ 目录加载 WASM 与模型（无运行时 CDN 依赖）
 * - 对视频/图片元素逐帧分割，产出 alpha 蒙版（人像=不透明，背景=透明）
 * - 蒙版写入宿主元素的 mask-image（canvas → dataURL），复用蒙版系统的 CSS 合成管线：
 *   内层包裹元素承载人像蒙版，外层容器承载形状蒙版，两者相乘
 *
 * 性能设计：
 * - 单例 ImageSegmenter，多个片段复用；CPU delegate 保证 headless 导出可用
 * - 播放中按 15fps 节流分割；暂停/静止时仅在 seek 或参数变化后刷新
 * - 256×256 小模型 CPU 实时推理，Web 端可承载
 */
import type { SmartMattingConfig } from '../../modules/shared/types';
import { ImageSegmenter, type ImageSegmenterResult } from '@mediapipe/tasks-vision';

const WASM_ROOT = '/mediapipe/wasm';
const MODEL_URL = '/mediapipe/models/selfie_multiclass_256x256.tflite';
const TARGET_FPS = 15; // 分割节流帧率

interface MattingBinding {
  el: HTMLVideoElement | HTMLImageElement;
  host: HTMLElement;          // 应用人像蒙版的内层包裹元素
  config: SmartMattingConfig;
  maskCanvas: HTMLCanvasElement;   // 原始 alpha 蒙版
  blurCanvas: HTMLCanvasElement;   // 羽化输出
  lastWallTime: number;       // 上次分割的墙钟时间（节流）
  lastSrcTime: number;        // 上次分割的媒体时间（静止检测）
  lastSignature: string;      // 配置签名，变更时强制刷新
  ready: boolean;
}

class SmartMattingEngine {
  private segmenter: ImageSegmenter | null = null;
  private loading: Promise<ImageSegmenter> | null = null;
  private bindings = new Map<string, MattingBinding>();
  private rafId = 0;
  private started = false;
  private lastFrameTime = 0;

  /** 懒加载分割器（首次启用抠像时才拉起） */
  private async ensureSegmenter(): Promise<ImageSegmenter> {
    if (this.segmenter) return this.segmenter;
    if (!this.loading) {
      this.loading = (async () => {
        const fileset = {
          wasmLoaderPath: `${WASM_ROOT}/vision_wasm_internal.js`,
          wasmBinaryPath: `${WASM_ROOT}/vision_wasm_internal.wasm`,
        };
        this.segmenter = await ImageSegmenter.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: 'CPU' },
          runningMode: 'VIDEO',
          outputCategoryMask: false,
          outputConfidenceMasks: true,
        });
        return this.segmenter;
      })();
    }
    return this.loading;
  }


  /** 查询模型可用性（是否已部署到 public/mediapipe） */
  async checkAvailability(): Promise<boolean> {
    try {
      const res = await fetch(MODEL_URL, { method: 'HEAD' });
      return res.ok;
    } catch {
      return false;
    }
  }

  /** 估算全图背景置信度：用于检测画面中是否存在可抠前景 */
  estimateScene(img: HTMLVideoElement | HTMLImageElement): Promise<number> {
    return new Promise((resolve) => {
      if (!this.segmenter) { resolve(1); return; }
      try {
        this.segmenter.segmentForVideo(img, performance.now(), (result) => {
          const masks = result.confidenceMasks;
          if (!masks || masks.length === 0) { resolve(1); return; }
          const m = masks[0];
          const d = m.getAsFloat32Array();
          // 四角采样：全为背景 ≈ 空场景/全身人像特写；含前景像素 ≈ 有人物
          const w = m.width, h = m.height;
          let sum = 0;
          const n = Math.min(w * h, 4096);
          const step = Math.max(1, Math.floor((w * h) / n));
          let fgPixels = 0, total = 0;
          for (let i = 0; i < w * h; i += step) {
            total++;
            if (d[i] < 0.5) fgPixels++;
          }
          result.close();
          resolve(fgPixels / Math.max(1, total));
        });
      } catch {
        resolve(1);
      }
    });
  }

  async bind(
    clipId: string,
    el: HTMLVideoElement | HTMLImageElement,
    host: HTMLElement,
    config: SmartMattingConfig
  ): Promise<void> {
    const existing = this.bindings.get(clipId);
    if (existing) {
      existing.el = el;
      existing.host = host;
      existing.config = config;
      return;
    }
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = 256;
    maskCanvas.height = 256;
    const blurCanvas = document.createElement('canvas');
    blurCanvas.width = 256;
    blurCanvas.height = 256;
    this.bindings.set(clipId, {
      el, host, config, maskCanvas, blurCanvas,
      lastWallTime: 0,
      lastSrcTime: -1,
      lastSignature: '',
      ready: false,
    });
    await this.ensureSegmenter().catch(err => {
      console.error('[SmartMatting] 分割器初始化失败:', err);
    });
    this.startLoop();
  }

  unbind(clipId: string): void {
    const b = this.bindings.get(clipId);
    if (!b) return;
    const style = b.host.style as any;
    style.maskImage = '';
    style.WebkitMaskImage = '';
    this.bindings.delete(clipId);
  }

  updateConfig(clipId: string, config: SmartMattingConfig): void {
    const b = this.bindings.get(clipId);
    if (!b) return;
    b.config = config;
    b.lastSignature = ''; // 强制刷新
  }

  private startLoop(): void {
    if (this.started) return;
    this.started = true;
    const loop = (now: number) => {
      this.rafId = requestAnimationFrame(loop);
      if (!this.segmenter || this.bindings.size === 0) return;
      if (now - this.lastFrameTime < 1000 / TARGET_FPS * 0.9) return;
      this.lastFrameTime = now;
      this.bindings.forEach(b => this.process(b, now));
    };
    this.rafId = requestAnimationFrame(loop);
  }

  private sig(b: MattingBinding): string {
    return `${b.config.feather}|${b.config.confidence}|${b.config.expand}|${b.config.enabled}`;
  }

  private process(b: MattingBinding, now: number): void {
    if (!this.segmenter || !b.config.enabled) return;
    const el = b.el;

    const isVideo = el instanceof HTMLVideoElement;
    let srcTime = 0;
    if (isVideo) {
      const v = el as HTMLVideoElement;
      if (v.readyState < 2 || v.seeking) return;
      srcTime = v.currentTime;
    } else {
      if (!el.complete || el.naturalWidth === 0) return;
    }

    // 静止跳过：配置未变 + 媒体帧未变 + 已有结果 → 不重复推理
    const sig = this.sig(b);
    if (b.ready && sig === b.lastSignature && Math.abs(srcTime - b.lastSrcTime) < 1e-4) return;
    // 播放节流：媒体在推进但距上次分割不足一帧间隔时跳过（墙钟）
    if (b.ready && sig === b.lastSignature && now - b.lastWallTime < 1000 / TARGET_FPS * 0.9) return;

    try {
      // 统一走 VIDEO 模式接口（ImageSource 同样接受 <img>，避免切换 runningMode）
      this.segmenter.segmentForVideo(el, now, (result: ImageSegmenterResult) => {
        this.drawResult(b, result);
        result.close?.();
      });
      b.lastWallTime = now;
      b.lastSrcTime = srcTime;
      b.lastSignature = sig;
    } catch (err) {
      console.error('[SmartMatting] 分割失败:', err);
    }
  }

  /** 将 confidenceMask 写入 canvas（前景白/背景黑），应用羽化后写入宿主 mask-image */
  private drawResult(b: MattingBinding, result: ImageSegmenterResult): void {
    const masks = result.confidenceMasks;
    if (!masks || masks.length === 0) return;
    // selfie_multiclass: category 0 = background；前景 alpha = 1 - bgConfidence
    const bgMask = masks[0];
    const w = bgMask.width, h = bgMask.height;
    const canvas = b.maskCanvas;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      b.blurCanvas.width = w;
      b.blurCanvas.height = h;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;


    const data = bgMask.getAsFloat32Array();
    const img = ctx.createImageData(w, h);
    const conf = b.config.confidence / 100;        // 置信度阈值
    const expand = b.config.expand / 100;          // 收缩(>0)/扩张(<0)
    const threshold = conf + expand * 0.5;
    const slope = 8;                                // 边缘过渡斜率

    // 空场景自适应：画面几乎全是背景（全身远景/无人/人物占比 < 2%）时
    // 用相对阈值兜底——把「最像人的前 2% 像素」提亮，避免人物被整体抠除。
    let fgRatio = -1;
    {
      let fgCount = 0;
      const total = w * h;
      for (let i = 0; i < total; i++) {
        if (data[i] < conf) fgCount++;
      }
      fgRatio = fgCount / total;
    }
    const emptyScene = fgRatio < 0.02;
    let dynThreshold = threshold;
    if (emptyScene) {
      // 取最低的前 2% 背景置信度作为前景判定线
      const sampled: number[] = [];
      const step = Math.max(1, Math.floor((w * h) / 8192));
      for (let i = 0; i < w * h; i += step) sampled.push(data[i]);

      sampled.sort((a, b) => a - b);
      const k = Math.max(0, Math.floor(sampled.length * 0.02) - 1);
      const pivot = sampled[Math.min(sampled.length - 1, Math.max(0, k))] ?? 0;
      // pivot 为「最像前景」像素的背景置信度；换算到前景域后留 0.02 余量
      dynThreshold = Math.min(threshold, Math.max(0, (1 - pivot) - 0.02));
    }

    for (let i = 0; i < w * h; i++) {
      const fg = 1 - data[i];
      let alpha = (fg - dynThreshold) * slope + 0.5;
      alpha = Math.max(0, Math.min(1, alpha));
      const v = alpha * 255;
      img.data[i * 4] = 255;
      img.data[i * 4 + 1] = 255;
      img.data[i * 4 + 2] = 255;
      img.data[i * 4 + 3] = v;
    }
    ctx.putImageData(img, 0, 0);

    // 羽化：把原始蒙版以高斯模糊绘制到输出画布
    const featherPx = (Math.max(0, Math.min(100, b.config.feather)) / 100) * 8;
    let outCanvas = canvas;
    if (featherPx > 0.2) {
      const bctx = b.blurCanvas.getContext('2d');
      if (bctx) {
        bctx.clearRect(0, 0, w, h);
        bctx.filter = `blur(${featherPx.toFixed(2)}px)`;
        bctx.drawImage(canvas, 0, 0);
        bctx.filter = 'none';
        outCanvas = b.blurCanvas;
      }
    }

    const url = outCanvas.toDataURL('image/png');
    const style = b.host.style as any;
    style.maskImage = `url("${url}")`;
    style.maskSize = '100% 100%';
    style.maskRepeat = 'no-repeat';
    style.maskMode = 'luminance';
    style.WebkitMaskImage = `url("${url}")`;
    style.WebkitMaskSize = '100% 100%';
    style.WebkitMaskRepeat = 'no-repeat';
    style.WebkitMaskMode = 'luminance';
    b.ready = true;
  }

  dispose(): void {
    cancelAnimationFrame(this.rafId);
    this.started = false;
    Array.from(this.bindings.keys()).forEach(id => this.unbind(id));
    this.segmenter?.close();
    this.segmenter = null;
    this.loading = null;
  }
}

export const smartMattingEngine = new SmartMattingEngine();
