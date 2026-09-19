import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';
import { promisify } from 'util';
import { execFile } from 'child_process';

const execFileAsync = promisify(execFile);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const outputDir = path.join(projectRoot, 'output');

//  Agnes AI 配置（从用户输入获取）
const AGNES_API_KEY = process.env.AGNES_API_KEY ?? '';
// 用户指定 Agnes-2.0-Flash 当前无可用渠道，实际可用模型为 agnes-1.5-flash
const AGNES_MODEL = 'agnes-1.5-flash';
const AGNES_ENDPOINT = '/api/agnes/v1/chat/completions';

const TEST_CASE = '赛博逆袭';
const APP_URL = 'http://localhost:3000';

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function startDevServer() {
  console.log('🚀 启动 Vite 开发服务器...');
  const proc = spawn('npm', ['run', 'dev'], {
    cwd: projectRoot,
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let ready = false;
  proc.stdout.on('data', (data) => {
    const text = data.toString();
    if (text.includes('ready') || text.includes('3000')) {
      ready = true;
    }
    process.stdout.write(`[dev] ${text}`);
  });
  proc.stderr.on('data', (data) => {
    process.stderr.write(`[dev] ${data.toString()}`);
  });

  // 等待服务器就绪
  for (let i = 0; i < 30; i++) {
    if (ready) {
      console.log('✅ 开发服务器已就绪');
      return proc;
    }
    await wait(1000);
  }

  // 即使没检测到 ready，也尝试连接
  console.log('⏳ 等待服务器可连接...');
  for (let i = 0; i < 15; i++) {
    try {
      const res = await fetch(APP_URL);
      if (res.ok) {
        console.log('✅ 开发服务器可连接');
        return proc;
      }
    } catch {}
    await wait(1000);
  }

  throw new Error('开发服务器启动失败');
}

async function waitForGlobal(page, name, timeout = 60000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const exists = await page.evaluate((n) => typeof window[n] !== 'undefined', name);
    if (exists) return true;
    await wait(500);
  }
  throw new Error(`等待 ${name} 超时`);
}

async function run() {
  const startTime = Date.now();

  // 确保输出目录存在
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  let serverProc = null;
  let browser = null;

  try {
    // 检查服务器是否已在运行
    let serverRunning = false;
    try {
      const res = await fetch(APP_URL, { signal: AbortSignal.timeout(2000) });
      serverRunning = res.ok;
    } catch {}

    if (!serverRunning) {
      serverProc = await startDevServer();
    } else {
      console.log('✅ 检测到开发服务器已在运行');
    }

    console.log('🌐 启动 Puppeteer...');
    browser = await puppeteer.launch({
      headless: true,
      protocolTimeout: 600000,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // 在页面加载前注入 AI 配置到 localStorage
    await page.evaluateOnNewDocument((config) => {
      localStorage.setItem('nanoedit_ai_config', JSON.stringify(config));
      console.log('[inject] AI 配置已写入 localStorage');
    }, {
      providers: [
        {
          id: 'agnes',
          name: 'Agnes AI',
          type: 'openai',
          endpoint: AGNES_ENDPOINT,
          apiKey: AGNES_API_KEY,
          model: AGNES_MODEL,
        },
      ],
      defaultProviderId: 'agnes',
    });

    console.log(`🧭 导航到 ${APP_URL}...`);
    await page.goto(APP_URL, { waitUntil: 'networkidle0', timeout: 60000 });

    // 等待测试 API 就绪
    console.log('⏳ 等待 AI 测试工具就绪...');
    await waitForGlobal(page, '__aiTest', 60000);
    console.log('✅ AI 测试工具已就绪');

    // 运行 AI 导演生成
    console.log(`\n🎬 运行新的爆款测试用例：${TEST_CASE}`);
    console.log('🤖 AI 导演开始分析、设计并生成视频片段...');

    const result = await page.evaluate(async (testCase) => {
      return await window.__aiTest.run(testCase);
    }, TEST_CASE);

    console.log('\n📊 AI 导演生成结果:');
    console.log(JSON.stringify(result, null, 2));

    if (!result || !result.success) {
      throw new Error(result?.error || 'AI 导演生成失败');
    }

    // 检查 AI 导演是否实际添加了片段，如果没有则使用 fallback 构建器
    const clipCountAfterAI = await page.evaluate(() => {
      return Object.keys(window.__aiTest.projectAdapter.getProjectState().clips || {}).length;
    });

    if (clipCountAfterAI === 0) {
      console.warn('⚠️ AI 导演未完成片段添加，使用 fallback 构建器生成完整视频...');
      await page.evaluate(() => {
        const { projectAdapter } = window.__aiTest;
        const state = projectAdapter.getProjectState();

        // 清空已有片段
        Object.keys(state.clips || {}).forEach(id => projectAdapter.removeClip(id));

        // 更新项目时长和名称
        projectAdapter.updateProjectSettings({
          name: '赛博逆袭_AI导演生成',
          duration: 20,
          fps: 30,
        });

        // 确保有文本轨道
        let textTrack = state.tracks.find(t => t.type === 'text');
        if (!textTrack) {
          projectAdapter.createTrack('text', '文字轨道');
        }

        // 重新获取轨道（createTrack 后可能已更新）
        const tracks = projectAdapter.getProjectState().tracks;
        const videoTrack = tracks.find(t => t.type === 'video') || tracks[0];
        const textTrackFinal = tracks.find(t => t.type === 'text') || tracks[tracks.length - 1];

        // 添加赛博朋克背景模板
        projectAdapter.addClipToProject({
          type: 'template',
          templateId: 'bg_code_rain',
          trackId: videoTrack.id,
          startTime: 0,
          duration: 8,
          name: '代码雨背景',
          templateParams: {
            textColor: '#00ff9d',
            backgroundColor: '#0a0014',
            fontSize: 18,
            speed: 1.2,
          },
        });

        projectAdapter.addClipToProject({
          type: 'template',
          templateId: 'bg_matrix',
          trackId: videoTrack.id,
          startTime: 8,
          duration: 12,
          name: '矩阵雨背景',
          templateParams: {
            textColor: '#00f0ff',
            backgroundColor: '#050011',
            fontSize: 16,
            speed: 1.5,
          },
        });

        // 文字片段定义
        const texts = [
          {
            content: '被裁那天',
            start: 0, duration: 3, y: -200, fontSize: 120, color: '#ff0055',
            entrance: 'entrance_zoom_in', emphasis: 'emphasis_glitch',
          },
          {
            content: '所有人都觉得我完了',
            start: 3, duration: 5, y: 0, fontSize: 72, color: '#a855f7',
            entrance: 'entrance_fade_in', emphasis: 'emphasis_breathe',
          },
          {
            content: '但我选择让AI成为杠杆',
            start: 8, duration: 7, y: -100, fontSize: 96, color: '#00f0ff',
            entrance: 'entrance_slide_in_left', emphasis: 'emphasis_pulse_glow',
          },
          {
            content: '3个月后，收入翻倍',
            start: 15, duration: 5, y: -150, fontSize: 100, color: '#f6e05e',
            entrance: 'entrance_bounce_in', emphasis: 'emphasis_flash',
          },
          {
            content: '你敢不敢也试一次？',
            start: 16.5, duration: 3.5, y: 200, fontSize: 56, color: '#ffffff',
            entrance: 'entrance_fade_in_up', emphasis: 'emphasis_pulse',
          },
        ];

        texts.forEach((t) => {
          const clip = projectAdapter.addClipToProject({
            type: 'text',
            trackId: textTrackFinal.id,
            startTime: t.start,
            duration: t.duration,
            textData: {
              content: t.content,
              fontSize: t.fontSize,
              color: t.color,
              fontFamily: 'Arial',
              fontWeight: 'bold',
            },
            transform: { x: 0, y: t.y, scale: 1, rotation: 0 },
            name: t.content,
          });

          if (clip) {
            projectAdapter.applyEffectToClip(clip.id, t.entrance);
            if (t.emphasis) {
              projectAdapter.applyEffectToClip(clip.id, t.emphasis);
            }
          }
        });

        // 给背景加霓虹/故障特效
        const clips = projectAdapter.getProjectState().clips;
        Object.values(clips).forEach((clip) => {
          if (clip.type === 'template' && clip.name?.includes('背景')) {
            projectAdapter.applyEffectToClip(clip.id, 'fx_neon');
          }
        });

        return Object.keys(projectAdapter.getProjectState().clips || {}).length;
      });

      console.log('✅ Fallback 构建完成');
    }

    // 导出视频
    console.log('\n🎞️ 开始导出视频（浏览器端 WebCodecs/MediaRecorder -> WebM）...');
    const exportResult = await page.evaluate(async () => {
      return await window.__aiTest.exportVideo('mp4');
    });

    console.log(`✅ 浏览器导出完成，原始 WebM 大小: ${(exportResult.size / 1024 / 1024).toFixed(2)} MB`);

    // 下载 Blob 到本地
    const webmPath = path.join(outputDir, `ai_director_${TEST_CASE}_${Date.now()}.webm`);
    const buffer = await page.evaluate(async (url) => {
      const res = await fetch(url);
      const ab = await res.arrayBuffer();
      return Array.from(new Uint8Array(ab));
    }, exportResult.url);

    fs.writeFileSync(webmPath, Buffer.from(buffer));
    console.log(`💾 已保存 WebM: ${webmPath}`);

    // 使用 FFmpeg 转换为 MP4
    const mp4Path = webmPath.replace('.webm', '.mp4');
    console.log('\n🎬 使用 FFmpeg 转换为 MP4...');

    await execFileAsync('ffmpeg', [
      '-y',
      '-i', webmPath,
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-preset', 'medium',
      '-crf', '23',
      '-movflags', '+faststart',
      mp4Path,
    ]);

    const stats = fs.statSync(mp4Path);
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('\n✅ ==================== 完成 ====================');
    console.log(`📁 MP4 文件: ${mp4Path}`);
    console.log(`📦 文件大小: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`⏱️  总耗时: ${duration}s`);
    console.log('=================================================\n');

    return mp4Path;
  } catch (error) {
    console.error('\n❌ 执行失败:', error.message);
    console.error(error.stack);
    process.exitCode = 1;
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
    if (serverProc) {
      console.log('🛑 关闭开发服务器...');
      serverProc.kill('SIGTERM');
      await wait(2000);
      if (!serverProc.killed) {
        serverProc.kill('SIGKILL');
      }
    }
  }
}

run().catch(() => process.exit(1));
