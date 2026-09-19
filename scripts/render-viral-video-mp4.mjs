// AI 导演模式：完整生成爆款视频 MP4（真实图片 + 真实配音）
// 适配 agnes-2.0-flash 模型
// 运行：node scripts/render-viral-video-mp4.mjs

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFile } from 'child_process';
import { promisify } from 'util';
import puppeteer from 'puppeteer';

const execFileAsync = promisify(execFile);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_KEY = process.env.AGNES_API_KEY ?? '';
const ENDPOINT = 'https://apihub.agnes-ai.com/v1/chat/completions';
const MODEL = 'agnes-2.0-flash';

const USER_INPUT = '用 AI 把 2 小时工作报告压缩成 5 分钟';
const CONFIG = {
  platform: '抖音',
  track: '知识教育',
  duration: 30,
  aspectRatio: '9:16',
  width: 1080,
  height: 1920,
  fps: 30,
  voiceSpeed: 200,
  audience: '25-35岁年轻职场人',
  hookType: '痛点直击',
  style: '轻快、专业',
  materials: '真人出镜、录屏、手绘动画',
  cta: '点赞收藏',
};

const OUTPUT_DIR = path.join(__dirname, 'output');
const MP4_PATH = path.join(OUTPUT_DIR, 'viral-video.mp4');
const AUDIO_PATH = path.join(OUTPUT_DIR, 'viral-audio.mp3');
const HTML_PATH = path.join(OUTPUT_DIR, 'viral-render.html');

// ==================== AI 调用 ====================

async function callAI(system, user, temperature = 0.7, maxTokens = 8192) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text.slice(0, 300)}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

function parseJSON(text) {
  const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = codeBlock ? codeBlock[1].trim() : text.match(/\{[\s\S]*\}/)?.[0] || text;
  const parsed = JSON.parse(candidate);
  if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
  return parsed;
}

function buildTopicPrompt() {
  return `你是抖音/快手短视频爆款选题分析师。基于用户想法输出 JSON。
用户想法：${USER_INPUT}
约束：平台=${CONFIG.platform}，赛道=${CONFIG.track}，时长=${CONFIG.duration}s，画幅=${CONFIG.aspectRatio}
输出：{"topic":"","coreMessage":"","hookType":"","audience":"","style":"","materials":"","cta":"","viralFormula":"","reasoning":""}
只输出 JSON，不要 Markdown 代码块。`;
}

function buildEmotionPrompt(topic) {
  return `你是短视频情绪曲线设计师。基于选题规划情绪起伏。
选题：${topic.topic}
核心信息：${topic.coreMessage}
爆款公式：${topic.viralFormula}
总时长：${CONFIG.duration}s
输出：{"curve":[{"timeStart":0,"timeEnd":3,"emotion":"焦虑","score":-0.7,"purpose":"痛点钩子"}],"keyTurningPoints":[]}
只输出 JSON。`;
}

function buildShotListPrompt(topic, emotion) {
  const totalWords = Math.floor((CONFIG.duration / 60) * CONFIG.voiceSpeed);
  return `你是秒级拉镜分镜表设计师。输出 15 字段 JSON。
选题：${topic.topic}
核心信息：${topic.coreMessage}
爆款公式：${topic.viralFormula}
总时长：${CONFIG.duration}s
情绪曲线：${JSON.stringify(emotion.curve)}
字段：shotId,timeStart,timeEnd,duration,sceneType,shotSize,cameraMove,visualDescription,dialogue,subtitle,subtitleStyle,musicSfx,transition,emotion,emotionScore,purpose
输出：{"shots":[],"markdownTable":""}
口播总字数约 ${totalWords} 字。只输出 JSON。`;
}

function buildCopywritingPrompt(shotList) {
  return `你是短视频文案专家。基于分镜表输出文案 JSON。
分镜表：${JSON.stringify(shotList.shots.map((s) => ({
    shotId: s.shotId,
    timeStart: s.timeStart,
    timeEnd: s.timeEnd,
    dialogue: s.dialogue,
    subtitle: s.subtitle,
  })))}
输出：{"fullScript":"","lines":[{"id":"line_1","content":"","layoutId":"bottom_center","presetId":"entrance_fade_in","shotId":1,"estimatedDuration":1.5}]}
只输出 JSON。`;
}

function buildMaterialPrompt(shotList) {
  return `你是 ComfyUI 提示词工程师。基于分镜表为每个分镜生成英文提示词。
分镜表：${JSON.stringify(shotList.shots.map((s) => ({
    shotId: s.shotId,
    visualDescription: s.visualDescription,
    shotSize: s.shotSize,
    sceneType: s.sceneType,
  })))}
画幅：9:16 竖屏 1080x1920
输出：{"materials":[{"id":"mat_shot_1","shotId":1,"prompt":"英文提示词","negativePrompt":"ugly, blurry","width":1080,"height":1920,"seed":-1}]}
只输出 JSON。`;
}

function pollinationsUrl(prompt, seed = 42) {
  const safe = prompt.replace(/[\n\r]+/g, ' ').trim();
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(safe)}?width=${CONFIG.width}&height=${CONFIG.height}&seed=${seed}&nologo=true`;
}

function youdaoTTSUrl(text) {
  return `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(text)}&type=2`;
}

// ==================== 产物生成 ====================

async function generateDirectorOutput() {
  console.log('1/5 选题分析...');
  const topicRaw = await callAI('你是短视频爆款选题分析师，严格按 JSON 输出。', buildTopicPrompt(), 0.6, 4096);
  const topic = parseJSON(topicRaw);
  console.log('Topic:', topic.topic);

  console.log('2/5 情绪曲线...');
  const emotionRaw = await callAI('你是短视频情绪曲线设计师，严格按 JSON 输出。', buildEmotionPrompt(topic), 0.6, 4096);
  const emotion = parseJSON(emotionRaw);

  console.log('3/5 分镜表...');
  const shotRaw = await callAI('你是秒级拉镜分镜表设计师，严格按 JSON 输出。', buildShotListPrompt(topic, emotion), 0.6, 16384);
  const shotList = parseJSON(shotRaw);

  console.log('4/5 文案...');
  const copyRaw = await callAI('你是短视频文案专家，严格按 JSON 输出。', buildCopywritingPrompt(shotList), 0.7, 16384);
  const copywriting = parseJSON(copyRaw);

  console.log('5/5 素材提示词...');
  const matRaw = await callAI('你是 ComfyUI 提示词工程师，严格按 JSON 输出。', buildMaterialPrompt(shotList), 0.7, 8192);
  const materials = parseJSON(matRaw);

  const imageMaterials = materials.materials.map((m, idx) => ({
    ...m,
    imageUrl: pollinationsUrl(m.prompt, m.seed ?? idx + 1),
  }));

  // 把每行文案拆成短句，避免有道 TTS 对长句 500
  const dubbingSegments = [];
  copywriting.lines.forEach((line, idx) => {
    const chunks = splitTextToChunks(line.content, 20);
    const lineShotIdNorm = normalizeShotId(line.shotId);
    const shot = shotList.shots.find((s) => normalizeShotId(s.shotId) === lineShotIdNorm);
    chunks.forEach((chunk, cidx) => {
      dubbingSegments.push({
        id: `dub_${line.id}_${cidx}`,
        lineId: line.id,
        text: chunk,
        audioUrl: youdaoTTSUrl(chunk),
        startTime: shot?.timeStart ?? 0,
        duration: line.estimatedDuration / chunks.length,
      });
    });
  });

  return { topic, emotion, shotList, copywriting, imageMaterials, dubbingSegments };
}

function splitTextToChunks(text, maxLen) {
  // 按标点拆分，尽量保持语义完整
  const punctuation = /[，。！？、；,.!?;]/;
  const parts = text.split(punctuation).filter((s) => s.trim().length > 0);
  const chunks = [];
  let current = '';
  for (const part of parts) {
    const trimmed = part.trim();
    if ((current + trimmed).length > maxLen && current.length > 0) {
      chunks.push(current);
      current = trimmed;
    } else {
      current = current ? current + '，' + trimmed : trimmed;
    }
  }
  if (current) chunks.push(current);
  if (chunks.length === 0) chunks.push(text.slice(0, maxLen));
  return chunks;
}

// ==================== 音频处理 ====================

async function downloadFile(url, dest, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`下载失败 ${res.status}`);
      const buffer = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(dest, buffer);
      return dest;
    } catch (e) {
      if (i === retries - 1) throw new Error(`下载失败 ${e.message}: ${url}`);
      console.warn(`下载重试 ${i + 1}/${retries}: ${url}`);
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
}

async function generateEdgeTTS(text, outputPath, rate = '+60%') {
  // 使用 Python edge-tts 生成真实中文语音，支持 1.6x 语速
  await execFileAsync('python', [
    path.join(__dirname, 'edge_tts_worker.py'),
    text,
    outputPath,
    rate,
  ]);
}

async function mergeAudioFiles(segments, outputPath) {
  const tempDir = path.join(OUTPUT_DIR, 'audio_temp');
  fs.mkdirSync(tempDir, { recursive: true });

  console.log(`使用 Edge TTS 生成 ${segments.length} 段配音（语速 1.6x）...`);

  // 并行生成音频（限制并发数 5）
  const fileList = [];
  const concurrency = 5;
  for (let i = 0; i < segments.length; i += concurrency) {
    const batch = segments.slice(i, i + concurrency);
    await Promise.all(
      batch.map(async (seg, idx) => {
        const globalIdx = i + idx;
        const segPath = path.join(tempDir, `seg_${String(globalIdx).padStart(3, '0')}.mp3`);
        await generateEdgeTTS(seg.text, segPath, '+60%');
        fileList[globalIdx] = segPath;
        console.log(`  配音 ${globalIdx + 1}/${segments.length}: ${seg.text.slice(0, 20)}...`);
      })
    );
  }

  // 用 concat demuxer 合并
  const listPath = path.join(tempDir, 'list.txt');
  fs.writeFileSync(listPath, fileList.map((f) => `file '${f.replace(/'/g, "'\\''")}'`).join('\n'));

  await execFileAsync('ffmpeg', [
    '-y',
    '-f', 'concat',
    '-safe', '0',
    '-i', listPath,
    '-c', 'copy',
    outputPath,
  ]);

  console.log('音频合并完成:', outputPath);
}

// ==================== HTML 入口生成 ====================

function normalizeShotId(id) {
  return String(id).replace(/^S/i, '');
}

function generateRenderHTML(data) {
  const { shotList, copywriting, imageMaterials } = data;

  const shots = shotList.shots.map((shot) => {
    const shotIdNorm = normalizeShotId(shot.shotId);
    const img = imageMaterials.find((m) => normalizeShotId(m.shotId) === shotIdNorm) || imageMaterials[0];
    const line = copywriting.lines.find((l) => normalizeShotId(l.shotId) === shotIdNorm);
    return {
      shotId: shot.shotId,
      startTime: shot.timeStart,
      endTime: shot.timeEnd,
      duration: shot.duration,
      imageUrl: img?.imageUrl || '',
      subtitle: line?.content || shot.subtitle || '',
      emotion: shot.emotion,
      emotionScore: shot.emotionScore,
    };
  });

  const shotsJSON = JSON.stringify(shots);

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Viral Video Render</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: ${CONFIG.width}px;
      height: ${CONFIG.height}px;
      background: #000;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", sans-serif;
    }
    #stage {
      position: relative;
      width: 100%;
      height: 100%;
    }
    #shot-image {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    #shot-image.active { opacity: 1; }
    #subtitle {
      position: absolute;
      bottom: 120px;
      left: 50%;
      transform: translateX(-50%);
      max-width: 920px;
      padding: 18px 32px;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(8px);
      border-radius: 16px;
      color: #fff;
      font-size: 48px;
      font-weight: 700;
      text-align: center;
      line-height: 1.4;
      text-shadow: 0 2px 8px rgba(0,0,0,0.5);
      opacity: 0;
      transition: opacity 0.2s ease, transform 0.2s ease;
    }
    #subtitle.active {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
    #progress-bar {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 8px;
      background: linear-gradient(90deg, #ff0055, #ff9900);
      width: 0%;
      transition: width 0.05s linear;
    }
    #loading {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: #fff;
      font-size: 36px;
    }
  </style>
</head>
<body>
  <div id="stage">
    <div id="loading">加载素材中...</div>
    <img id="shot-image" crossorigin="anonymous" />
    <div id="subtitle"></div>
    <div id="progress-bar"></div>
  </div>

  <script>
    const SHOTS = ${shotsJSON};
    const FPS = ${CONFIG.fps};
    const DURATION = ${CONFIG.duration};
    const imageEl = document.getElementById('shot-image');
    const subtitleEl = document.getElementById('subtitle');
    const progressEl = document.getElementById('progress-bar');
    const loadingEl = document.getElementById('loading');

    let preloadedImages = 0;
    const imageCache = {};

    function preloadImages() {
      return new Promise((resolve) => {
        let loaded = 0;
        const total = SHOTS.length;
        if (total === 0) return resolve();
        SHOTS.forEach((shot) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            loaded++;
            if (loaded >= total) resolve();
          };
          img.onerror = () => {
            loaded++;
            if (loaded >= total) resolve();
          };
          img.src = shot.imageUrl;
          imageCache[shot.shotId] = img;
        });
      });
    }

    function renderFrame(frameNumber) {
      const currentTime = frameNumber / FPS;
      const shot = SHOTS.find((s) => currentTime >= s.startTime && currentTime < s.endTime) || SHOTS[SHOTS.length - 1];

      if (shot) {
        if (imageEl.src !== shot.imageUrl) {
          imageEl.src = shot.imageUrl;
          imageEl.classList.add('active');
        }
        if (subtitleEl.textContent !== shot.subtitle) {
          subtitleEl.textContent = shot.subtitle;
          subtitleEl.classList.add('active');
        }
      }

      progressEl.style.width = (currentTime / DURATION * 100) + '%';
      window.__frameRendered = true;
    }

    window.__currentFrame = 0;
    window.__frameRendered = false;

    window.addEventListener('framechange', () => {
      window.__frameRendered = false;
      renderFrame(window.__currentFrame);
    });

    preloadImages().then(() => {
      loadingEl.style.display = 'none';
      renderFrame(0);
      console.log('[RenderEntry] Images preloaded, ready to render');
    });
  </script>
</body>
</html>`;
}

// ==================== 视频渲染 ====================

async function renderMP4(entryPoint, outputPath, audioPath) {
  const totalFrames = CONFIG.duration * CONFIG.fps;
  const tempDir = path.join(OUTPUT_DIR, 'frames_temp');
  fs.mkdirSync(tempDir, { recursive: true });

  console.log('启动 Puppeteer...');
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: CONFIG.width, height: CONFIG.height, deviceScaleFactor: 1 });

  const url = `file://${path.resolve(entryPoint)}`;
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });

  // 等待图片预加载完成
  await page.waitForFunction(() => {
    const loading = document.getElementById('loading');
    return loading && loading.style.display === 'none';
  }, { timeout: 120000 });

  console.log(`开始捕获 ${totalFrames} 帧...`);
  for (let frame = 0; frame < totalFrames; frame++) {
    await page.evaluate(
      ({ frameNum }) => {
        window.__currentFrame = frameNum;
        window.__frameRendered = false;
        window.dispatchEvent(new CustomEvent('framechange'));
      },
      { frameNum: frame }
    );

    // 等待渲染完成
    try {
      await page.waitForFunction(() => window.__frameRendered === true, { timeout: 5000 });
    } catch (e) {
      console.warn(`帧 ${frame} 渲染等待超时`);
    }

    const framePath = path.join(tempDir, `frame_${String(frame).padStart(5, '0')}.png`);
    // 给浏览器一帧渲染时间，避免截图内容错位
    await new Promise((r) => setTimeout(r, 50));
    await page.screenshot({ path: framePath, type: 'png', fullPage: false });

    if (frame % 30 === 0) {
      console.log(`进度: ${Math.round((frame / totalFrames) * 100)}%`);
    }
  }

  await browser.close();

  const capturedFrames = fs.readdirSync(tempDir).filter((f) => f.startsWith('frame_') && f.endsWith('.png')).length;
  console.log(`实际捕获帧数: ${capturedFrames} / ${totalFrames}`);

  console.log('开始编码 MP4...');
  const videoTempPath = outputPath.replace(/\.mp4$/, '_noaudio.mp4');

  await execFileAsync('ffmpeg', [
    '-y',
    '-framerate', String(CONFIG.fps),
    '-i', path.join(tempDir, 'frame_%05d.png'),
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-crf', '23',
    '-preset', 'medium',
    '-movflags', '+faststart',
    videoTempPath,
  ]);

  if (fs.existsSync(audioPath)) {
    await execFileAsync('ffmpeg', [
      '-y',
      '-i', videoTempPath,
      '-i', audioPath,
      '-c:v', 'copy',
      '-c:a', 'aac',
      '-b:a', '128k',
      outputPath,
    ]);
    fs.unlinkSync(videoTempPath);
  } else {
    fs.renameSync(videoTempPath, outputPath);
  }

  console.log('MP4 渲染完成:', outputPath);
}

// ==================== 主流程 ====================

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log('=== AI 导演模式：生成完整爆款视频 MP4 ===\n');

  const data = await generateDirectorOutput();

  console.log('\n6/5 合并配音音频...');
  await mergeAudioFiles(data.dubbingSegments, AUDIO_PATH);

  console.log('\n7/5 生成渲染入口 HTML...');
  const html = generateRenderHTML(data);
  fs.writeFileSync(HTML_PATH, html, 'utf-8');

  console.log('\n8/5 渲染 MP4...');
  await renderMP4(HTML_PATH, MP4_PATH, AUDIO_PATH);

  const stats = fs.statSync(MP4_PATH);
  console.log('\n✅ 完成!');
  console.log('MP4 文件:', MP4_PATH);
  console.log('文件大小:', (stats.size / 1024 / 1024).toFixed(2), 'MB');
  console.log('时长:', CONFIG.duration, 's');
  console.log('分辨率:', `${CONFIG.width}x${CONFIG.height}`);
}

main().catch((e) => {
  console.error('生成失败:', e);
  process.exit(1);
});
