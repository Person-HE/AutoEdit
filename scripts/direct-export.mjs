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
    if (text.includes('ready') || text.includes('3000')) ready = true;
    process.stdout.write(`[dev] ${text}`);
  });
  proc.stderr.on('data', (data) => {
    process.stderr.write(`[dev] ${data.toString()}`);
  });

  for (let i = 0; i < 30; i++) {
    if (ready) {
      console.log('✅ 开发服务器已就绪');
      return proc;
    }
    await wait(1000);
  }
  for (let i = 0; i < 15; i++) {
    try {
      const res = await fetch(APP_URL);
      if (res.ok) return proc;
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
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  let serverProc = null;
  let browser = null;
  let framesDir = null;

  try {
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
    // 最终输出使用 1920x1080
    const RENDER_WIDTH = 1920;
    const RENDER_HEIGHT = 1080;
    await page.setViewport({ width: RENDER_WIDTH, height: RENDER_HEIGHT });
    page.setDefaultTimeout(600000);

    console.log(`🧭 导航到 ${APP_URL}...`);
    await page.goto(APP_URL, { waitUntil: 'networkidle0', timeout: 60000 });

    console.log('⏳ 等待 AI 测试工具就绪...');
    await waitForGlobal(page, '__aiTest', 60000);
    console.log('✅ AI 测试工具已就绪');

    // 捕获浏览器控制台日志，便于排查渲染/编码问题
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('[Export]') || text.includes('导出') || text.includes('VideoEncoder') || text.includes('error') || text.includes('Error')) {
        console.log(`[browser] ${text}`);
      }
    });
    page.on('pageerror', (err) => console.error('[browser pageerror]', err.message));

    // 快速构建完整的爆款视频项目（避免 AI API 超时）
    console.log('\n🎬 构建爆款视频：赛博逆袭（快节奏高信息密度版）...');
    const buildResult = await page.evaluate(async (width, height) => {
      const { projectAdapter, toolSystem } = window.__aiTest;
      const state = projectAdapter.getProjectState();

      // 清空已有片段
      Object.keys(state.clips || {}).forEach(id => projectAdapter.removeClip(id));

      // 设置项目参数
      projectAdapter.updateProjectSettings({
        name: '赛博逆袭_AI导演生成',
        duration: 20,
        fps: 30,
        width,
        height,
      });

      // 确保有文本轨道和视频轨道
      if (!state.tracks.find(t => t.type === 'text')) {
        projectAdapter.createTrack('text', '文字轨道');
      }
      if (!state.tracks.find(t => t.type === 'video')) {
        projectAdapter.createTrack('video', '视频轨道');
      }

      const tracks = projectAdapter.getProjectState().tracks;
      const videoTrack = tracks.find(t => t.type === 'video') || tracks[0];
      const textTrack = tracks.find(t => t.type === 'text') || tracks[tracks.length - 1];

      // 添加赛博朋克背景模板
      // 背景模板：按情绪节奏切换，营造4个阶段的氛围
      const bgTemplates = [
        { id: 'bg_cyber_terminal', start: 0, duration: 4, params: { textColor: '#00ff9d', flicker: 0.12 } },
        { id: 'bg_hologram_grid', start: 4, duration: 5, params: { gridColor: '#00f0ff', horizonGlow: '#ff00a0', speed: 1.2 } },
        { id: 'bg_data_vortex', start: 9, duration: 5, params: { color: '#00f0ff', accentColor: '#ff0055', speed: 2 } },
        { id: 'bg_neon_scanlines', start: 14, duration: 6, params: { color: '#ff00a0', secondaryColor: '#00f0ff', speed: 1.8 } },
      ];
      for (const bg of bgTemplates) {
        projectAdapter.addClipToProject({
          type: 'template',
          templateId: bg.id,
          trackId: videoTrack.id,
          startTime: bg.start,
          duration: bg.duration,
          name: `${bg.id}背景`,
          templateParams: bg.params,
          style: { zIndex: 1, opacity: 1 },
        });
      }

      // 前景装饰：按阶段切换，增强空间层次
      const fgDecorations = [
        { type: 'scanlines', start: 0, duration: 4 },
        { type: 'hexGrid', start: 4, duration: 5 },
        { type: 'codeParticles', start: 9, duration: 5 },
        { type: 'glitchBars', start: 14, duration: 6 },
      ];

      // 16个信息点：每1-1.5秒一个节奏点，完整爆款叙事弧线
      // 0-3s 压抑 | 3-7s 转折 | 7-14s 高潮 | 14-17s 重构 | 17-20s CTA
      const batchItems = [
        // 压抑开场
        {
          type: 'text', trackId: textTrack.id,
          content: '被裁那天', startTime: 0, duration: 1.5, y: -180, fontSize: 140, color: '#ff0055',
          depthLayer: 'foreground', rhythmBeat: true, strongEffects: true, material: 'metal',
          foregroundDecoration: 'scanlines',
        },
        {
          type: 'text', trackId: textTrack.id,
          content: '所有人觉得我完了', startTime: 1.5, duration: 1.5, y: 0, fontSize: 80, color: '#a855f7',
          depthLayer: 'foreground', rhythmBeat: false, strongEffects: true, material: 'paper',
          foregroundDecoration: 'scanlines',
        },
        // 转折加速
        {
          type: 'text', trackId: textTrack.id,
          content: 'HR通知截图', startTime: 3, duration: 1.5, y: -120, fontSize: 64, color: '#ffffff',
          depthLayer: 'midground', rhythmBeat: true, strongEffects: true,
          bRollType: 'chat', bRollParams: { userName: 'HR', message: '很遗憾，你的岗位被取消了', avatar: 'H' },
          foregroundDecoration: 'hexGrid',
        },
        {
          type: 'text', trackId: textTrack.id,
          content: '但我让AI成为杠杆', startTime: 4.5, duration: 1.5, y: -120, fontSize: 96, color: '#00f0ff',
          depthLayer: 'foreground', rhythmBeat: true, strongEffects: true, material: 'neon',
          foregroundDecoration: 'hexGrid',
        },
        {
          type: 'text', trackId: textTrack.id,
          content: '凌晨3点还在跑', startTime: 6, duration: 1, y: 140, fontSize: 56, color: '#f6e05e',
          depthLayer: 'foreground', rhythmBeat: false, strongEffects: true, material: 'glass',
          foregroundDecoration: 'hexGrid',
        },
        // 高潮证明
        {
          type: 'text', trackId: textTrack.id,
          content: 'AI工具界面', startTime: 7, duration: 1.5, y: -80, fontSize: 60, color: '#f6e05e',
          depthLayer: 'midground', rhythmBeat: true, strongEffects: true,
          bRollType: 'phoneScreenshot', bRollParams: { title: 'AI收益概览', amount: '¥ 89,420.00', changeRate: '+28.5%' },
          foregroundDecoration: 'codeParticles',
        },
        {
          type: 'text', trackId: textTrack.id,
          content: '3个月', startTime: 8.5, duration: 1, y: -160, fontSize: 120, color: '#f6e05e',
          depthLayer: 'foreground', rhythmBeat: true, strongEffects: true, material: 'metal',
          foregroundDecoration: 'codeParticles',
        },
        {
          type: 'text', trackId: textTrack.id,
          content: '收入翻倍', startTime: 9.5, duration: 1.5, y: -60, fontSize: 130, color: '#f6e05e',
          depthLayer: 'foreground', rhythmBeat: true, strongEffects: true, material: 'neon',
          foregroundDecoration: 'codeParticles',
        },
        {
          type: 'text', trackId: textTrack.id,
          content: '到账通知', startTime: 11, duration: 1, y: -80, fontSize: 56, color: '#ffffff',
          depthLayer: 'midground', rhythmBeat: false, strongEffects: true,
          bRollType: 'bankNotification', bRollParams: { amount: '+ ¥ 52,000.00', bank: '招商银行', time: 'Today 09:41' },
          foregroundDecoration: 'codeParticles',
        },
        {
          type: 'text', trackId: textTrack.id,
          content: '+52,000', startTime: 12, duration: 1.5, y: 40, fontSize: 160, color: '#00ff9d',
          depthLayer: 'foreground', rhythmBeat: true, strongEffects: true, material: 'metal',
          foregroundDecoration: 'codeParticles',
        },
        // 价值重构
        {
          type: 'text', trackId: textTrack.id,
          content: '这不是鸡汤', startTime: 13.5, duration: 1.5, y: -120, fontSize: 90, color: '#00f0ff',
          depthLayer: 'foreground', rhythmBeat: true, strongEffects: true, material: 'glass',
          foregroundDecoration: 'glitchBars',
        },
        {
          type: 'text', trackId: textTrack.id,
          content: '是普通人能复制的路径', startTime: 15, duration: 1.5, y: -60, fontSize: 72, color: '#a855f7',
          depthLayer: 'foreground', rhythmBeat: false, strongEffects: true, material: 'paper',
          foregroundDecoration: 'glitchBars',
        },
        // 强CTA
        {
          type: 'text', trackId: textTrack.id,
          content: '现在还在观望？', startTime: 16.5, duration: 1, y: -100, fontSize: 80, color: '#ffffff',
          depthLayer: 'foreground', rhythmBeat: true, strongEffects: true, material: 'neon',
          foregroundDecoration: 'glitchBars',
        },
        {
          type: 'text', trackId: textTrack.id,
          content: '扣1', startTime: 17.5, duration: 1, y: -30, fontSize: 180, color: '#ff0055',
          depthLayer: 'foreground', rhythmBeat: true, strongEffects: true, material: 'metal',
          foregroundDecoration: 'glitchBars',
        },
        {
          type: 'text', trackId: textTrack.id,
          content: '发你完整路径', startTime: 18.5, duration: 1, y: 120, fontSize: 64, color: '#ff0055',
          depthLayer: 'foreground', rhythmBeat: true, strongEffects: true, material: 'neon',
          foregroundDecoration: 'glitchBars',
        },
        {
          type: 'text', trackId: textTrack.id,
          content: '立即行动', startTime: 19.5, duration: 0.5, y: 200, fontSize: 48, color: '#00ff9d',
          depthLayer: 'foreground', rhythmBeat: true, strongEffects: true, material: 'carbon',
          foregroundDecoration: 'glitchBars',
        },
      ];

      const context = {
        userInput: 'direct-export 赛博逆袭',
        conversationHistory: [],
        workingMemory: { reflections: [], errors: [], addedClipIds: [] },
        projectState: {
          tracks: tracks.map(t => ({ id: t.id, type: t.type, name: t.name })),
          clipsCount: Object.keys(projectAdapter.getProjectState().clips || {}).length,
          assetsCount: projectAdapter.getProjectState().assets?.length ?? 0,
          currentTime: 0,
          totalDuration: 20,
          canvasSize: { width, height },
          fps: 30,
        },
        config: { maxIterations: 20, maxReflections: 3, enableSelfCorrection: true, verbose: false, temperature: 0.7 },
      };

      const batchResult = await toolSystem.execute('batch_add_clips', { items: batchItems }, context);

      // 小字号/中景标签仍为普通文字，额外加霓虹发光；模板文字已自带发光材质
      const clips = projectAdapter.getProjectState().clips;
      Object.values(clips).forEach((clip) => {
        if (clip.type === 'text') {
          projectAdapter.applyEffectToClip(clip.id, 'fx_neon', {
            glowColor: clip.textData?.color || '#ffffff',
            flicker: 0.25,
          });
        }
      });

      const finalClips = projectAdapter.getProjectState().clips;
      return {
        clipCount: Object.keys(finalClips).length,
        trackCount: projectAdapter.getProjectState().tracks.length,
        duration: projectAdapter.getProjectState().project.duration,
        batchResult,
      };
    }, RENDER_WIDTH, RENDER_HEIGHT);

    console.log(`✅ 项目构建完成: ${buildResult.clipCount} 个片段, ${buildResult.trackCount} 条轨道, ${buildResult.duration}秒`);

    // 导出视频：浏览器端编码在 headless 下不可靠，改用逐帧截图 + FFmpeg 合成
    const fps = 24;
    const totalFrames = Math.floor(buildResult.duration * fps);
    framesDir = path.join(outputDir, `frames_${Date.now()}`);
    fs.mkdirSync(framesDir, { recursive: true });

    console.log(`\n🎞️ 开始逐帧渲染: ${buildResult.duration}s * ${fps}fps = ${totalFrames} 帧`);

    // 初始化渲染器并加载资源
    const initResult = await page.evaluate(async (width, height) => {
      try {
        const state = window.__aiTest.projectAdapter.getProjectState();
        const exporter = window.__aiTest.videoExporter;
        exporter.canvas.width = width;
        exporter.canvas.height = height;
        exporter.engine.bindCanvas(exporter.canvas);
        await exporter.engine.loadResources(state.assets);
        return { ok: true, width: exporter.canvas.width, height: exporter.canvas.height, assets: state.assets.length };
      } catch (e) {
        return { ok: false, error: e.message, stack: e.stack };
      }
    }, RENDER_WIDTH, RENDER_HEIGHT);
    console.log('[Export] 初始化结果:', initResult);
    if (!initResult.ok) throw new Error('渲染器初始化失败: ' + initResult.error);

    // 先渲染一帧测试，确认渲染链路可用
    console.log('[Export] 渲染测试帧（仅 render）...');
    const testRender = await page.evaluate(async () => {
      try {
        const state = window.__aiTest.projectAdapter.getProjectState();
        const exporter = window.__aiTest.videoExporter;
        exporter.engine.render(state.project, 0, state.assets);
        return { ok: true, project: state.project.name, clips: Object.keys(state.project.clips || {}).length };
      } catch (e) {
        return { ok: false, error: e.message, stack: e.stack };
      }
    });
    console.log('[Export] 测试 render 结果:', testRender);
    if (!testRender.ok) throw new Error('测试 render 失败: ' + testRender.error);

    console.log('[Export] 测试帧 toDataURL...');
    const testDataUrl = await page.evaluate(async () => {
      try {
        const exporter = window.__aiTest.videoExporter;
        const dataUrl = exporter.canvas.toDataURL('image/png');
        return { ok: true, size: dataUrl.length };
      } catch (e) {
        return { ok: false, error: e.message, stack: e.stack };
      }
    });
    console.log('[Export] 测试 toDataURL 结果:', testDataUrl);
    if (!testDataUrl.ok) throw new Error('测试 toDataURL 失败: ' + testDataUrl.error);

    const pad = (n) => String(n).padStart(6, '0');
    const batchSize = 3;

    for (let batchStart = 0; batchStart < totalFrames; batchStart += batchSize) {
      const batchEnd = Math.min(batchStart + batchSize, totalFrames);
      const frameData = await Promise.race([
        page.evaluate(async (start, end, fps) => {
          const state = window.__aiTest.projectAdapter.getProjectState();
          const exporter = window.__aiTest.videoExporter;
          const results = [];
          for (let i = start; i < end; i++) {
            const time = i / fps;
            exporter.engine.render(state.project, time, state.assets);
            const dataUrl = exporter.canvas.toDataURL('image/png');
            results.push({ index: i, dataUrl });
          }
          return { ok: true, results };
        }, batchStart, batchEnd, fps),
        new Promise((_, reject) => setTimeout(() => reject(new Error(`第 ${batchStart}-${batchEnd} 帧渲染超时`)), 120000))
      ]);

      if (!frameData.ok) throw new Error('帧渲染失败: ' + frameData.error);

      for (const { index, dataUrl } of frameData.results) {
        const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
        const framePath = path.join(framesDir, `frame_${pad(index)}.png`);
        fs.writeFileSync(framePath, Buffer.from(base64, 'base64'));
      }

      const progress = ((batchEnd / totalFrames) * 100).toFixed(1);
      console.log(`[Export] 进度: ${progress}% (${batchEnd}/${totalFrames} 帧)`);
    }

    console.log(`✅ 逐帧渲染完成，帧文件保存在: ${framesDir}`);

    // 使用 FFmpeg 将 PNG 序列合成为 MP4
    const mp4Path = path.join(outputDir, `ai_director_赛博逆袭_${Date.now()}.mp4`);
    console.log('\n🎬 使用 FFmpeg 合成 MP4...');

    await execFileAsync('ffmpeg', [
      '-y',
      '-framerate', String(fps),
      '-i', path.join(framesDir, 'frame_%06d.png'),
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-preset', 'medium',
      '-crf', '23',
      '-movflags', '+faststart',
      '-frames:v', String(totalFrames),
      mp4Path,
    ]);

    const stats = fs.statSync(mp4Path);
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('\n✅ ==================== 完成 ====================');
    console.log(`📁 MP4 文件: ${mp4Path}`);
    console.log(`📦 文件大小: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`⏱️  总耗时: ${duration}s`);
    console.log('=================================================\n');

    return { mp4Path, framesDir };
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
    // 清理临时帧目录（保留 MP4）
    if (framesDir && fs.existsSync(framesDir)) {
      fs.rmSync(framesDir, { recursive: true, force: true });
      console.log(`🧹 已清理临时帧目录: ${framesDir}`);
    }
  }
}

run().catch(() => process.exit(1));
