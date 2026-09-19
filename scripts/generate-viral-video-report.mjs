// 独立脚本：真实运行 AI 导演全链路，生成完整爆款视频产物并输出 HTML 报告
// 运行：node scripts/generate-viral-video-report.mjs

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
  voiceSpeed: 200,
  audience: '25-35岁年轻职场人',
  hookType: '痛点直击',
  style: '轻快、专业',
  materials: '真人出镜、录屏、手绘动画',
  cta: '点赞收藏',
};

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
  const content = data.choices?.[0]?.message?.content ?? '';
  return content;
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
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(safe)}?width=1080&height=1920&seed=${seed}&nologo=true`;
}

function youdaoTTSUrl(text) {
  return `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(text)}&type=2`;
}

async function main() {
  console.log('1/7 选题分析...');
  const topicRaw = await callAI('你是短视频爆款选题分析师，严格按 JSON 输出。', buildTopicPrompt(), 0.6, 4096);
  const topic = parseJSON(topicRaw);
  console.log('Topic:', topic.topic);

  console.log('2/7 情绪曲线...');
  const emotionRaw = await callAI('你是短视频情绪曲线设计师，严格按 JSON 输出。', buildEmotionPrompt(topic), 0.6, 4096);
  const emotion = parseJSON(emotionRaw);

  console.log('3/7 分镜表...');
  const shotRaw = await callAI('你是秒级拉镜分镜表设计师，严格按 JSON 输出。', buildShotListPrompt(topic, emotion), 0.6, 16384);
  const shotList = parseJSON(shotRaw);

  console.log('4/7 文案...');
  const copyRaw = await callAI('你是短视频文案专家，严格按 JSON 输出。', buildCopywritingPrompt(shotList), 0.7, 16384);
  const copywriting = parseJSON(copyRaw);

  console.log('5/7 素材提示词...');
  const matRaw = await callAI('你是 ComfyUI 提示词工程师，严格按 JSON 输出。', buildMaterialPrompt(shotList), 0.7, 8192);
  const materials = parseJSON(matRaw);

  console.log('6/7 生成真实图片 URL...');
  const imageMaterials = materials.materials.map((m, idx) => ({
    ...m,
    imageUrl: pollinationsUrl(m.prompt, m.seed ?? idx + 1),
  }));

  console.log('7/7 生成真实音频 URL...');
  const dubbingSegments = copywriting.lines.map((line, idx) => ({
    id: `dub_${line.id}`,
    lineId: line.id,
    text: line.content,
    audioUrl: youdaoTTSUrl(line.content),
    estimatedDuration: line.estimatedDuration,
  }));

  // 生成 HTML 报告
  const reportPath = path.join(__dirname, 'viral-video-report.html');
  const html = generateReport({
    userInput: USER_INPUT,
    config: CONFIG,
    topic,
    emotion,
    shotList,
    copywriting,
    imageMaterials,
    dubbingSegments,
  });

  fs.writeFileSync(reportPath, html, 'utf-8');
  console.log('\n报告已生成:', reportPath);
}

function generateReport(data) {
  const { topic, emotion, shotList, copywriting, imageMaterials, dubbingSegments } = data;

  const shotsRows = shotList.shots.map((s) => `
    <tr>
      <td>${s.shotId}</td>
      <td>${s.timeStart}-${s.timeEnd}s</td>
      <td>${s.sceneType}</td>
      <td>${s.shotSize}</td>
      <td>${s.dialogue}</td>
      <td>${s.subtitle}</td>
      <td>${s.emotion} (${s.emotionScore})</td>
      <td>${s.purpose}</td>
    </tr>
  `).join('');

  const imageCards = imageMaterials.map((m) => `
    <div class="card">
      <img src="${m.imageUrl}" alt="分镜${m.shotId}" loading="lazy" />
      <p><b>分镜 ${m.shotId}</b></p>
      <p class="prompt">${m.prompt}</p>
      <p><a href="${m.imageUrl}" target="_blank">打开原图</a></p>
    </div>
  `).join('');

  const audioItems = dubbingSegments.map((d) => `
    <div class="audio-row">
      <span>${d.text}</span>
      <audio controls src="${d.audioUrl}"></audio>
      <a href="${d.audioUrl}" target="_blank">下载</a>
    </div>
  `).join('');

  const emotionRows = emotion.curve.map((c) => `
    <tr>
      <td>${c.timeStart}-${c.timeEnd}s</td>
      <td>${c.emotion}</td>
      <td>${c.score}</td>
      <td>${c.purpose}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI 导演 - 爆款视频生成报告</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; background: #f5f5f7; color: #1d1d1f; }
    h1, h2, h3 { color: #111; }
    .section { background: #fff; border-radius: 16px; padding: 24px; margin-bottom: 20px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
    .card { background: #fafafa; border-radius: 12px; padding: 12px; }
    .card img { width: 100%; border-radius: 8px; background: #eee; min-height: 180px; object-fit: cover; }
    .prompt { font-size: 12px; color: #666; word-break: break-all; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    th, td { border: 1px solid #e5e5e5; padding: 10px; text-align: left; }
    th { background: #f2f2f2; }
    .audio-row { display: flex; align-items: center; gap: 12px; padding: 10px; border-bottom: 1px solid #eee; }
    .audio-row span { flex: 1; }
    .highlight { background: #e8f5e9; padding: 12px; border-radius: 8px; }
    .warning { background: #fff3e0; padding: 12px; border-radius: 8px; }
  </style>
</head>
<body>
  <h1>AI 导演 - 爆款视频生成质量报告</h1>

  <div class="section">
    <h2>输入与配置</h2>
    <p><b>用户输入：</b>${data.userInput}</p>
    <p><b>平台：</b>${data.config.platform} | <b>赛道：</b>${data.config.track} | <b>时长：</b>${data.config.duration}s | <b>画幅：</b>${data.config.aspectRatio}</p>
  </div>

  <div class="section">
    <h2>选题分析</h2>
    <p><b>Topic：</b>${topic.topic}</p>
    <p><b>核心信息：</b>${topic.coreMessage}</p>
    <p><b>钩子类型：</b>${topic.hookType}</p>
    <p><b>爆款公式：</b>${topic.viralFormula}</p>
    <p><b>目标受众：</b>${topic.audience}</p>
    <p><b>CTA：</b>${topic.cta}</p>
  </div>

  <div class="section">
    <h2>情绪曲线</h2>
    <table>
      <tr><th>时间段</th><th>情绪</th><th>强度</th><th>目的</th></tr>
      ${emotionRows}
    </table>
  </div>

  <div class="section">
    <h2>秒级分镜表（${shotList.shots.length} 个分镜）</h2>
    <table>
      <tr><th>镜号</th><th>时间</th><th>场景</th><th>景别</th><th>口播</th><th>字幕</th><th>情绪</th><th>目的</th></tr>
      ${shotsRows}
    </table>
  </div>

  <div class="section">
    <h2>口播文案</h2>
    <div class="highlight">
      <p><b>完整口播：</b>${copywriting.fullScript}</p>
    </div>
    <h3>字幕拆分</h3>
    <ol>
      ${copywriting.lines.map((l) => `<li>${l.content}（分镜${l.shotId}，约${l.estimatedDuration?.toFixed(1) || '?'}s）</li>`).join('')}
    </ol>
  </div>

  <div class="section">
    <h2>真实图片素材（Pollinations AI）</h2>
    <div class="warning">
      <p>图片由 Pollinations AI 根据英文提示词实时生成，首次加载可能需要数秒。</p>
    </div>
    <div class="grid">
      ${imageCards}
    </div>
  </div>

  <div class="section">
    <h2>真实配音音频（有道 TTS）</h2>
    <div class="warning">
      <p>音频由有道词典 TTS 服务生成，可直接播放。</p>
    </div>
    ${audioItems}
  </div>

  <div class="section">
    <h2>质量自检</h2>
    <ul>
      <li>分镜数量：${shotList.shots.length} 个</li>
      <li>图片素材：${imageMaterials.length} 张</li>
      <li>配音片段：${dubbingSegments.length} 段</li>
      <li>口播字数：${copywriting.fullScript?.length || 0} 字</li>
      <li>首镜时长：${shotList.shots[0]?.duration}s，场景：${shotList.shots[0]?.sceneType}</li>
      <li>末镜场景：${shotList.shots[shotList.shots.length - 1]?.sceneType}</li>
    </ul>
  </div>
</body>
</html>`;
}

main().catch((e) => {
  console.error('生成失败:', e);
  process.exit(1);
});
