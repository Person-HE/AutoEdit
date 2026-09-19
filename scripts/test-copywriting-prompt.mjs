// 测试文案 prompt 是否会导致 500
const API_KEY = process.env.AGNES_API_KEY ?? '';
const ENDPOINT = 'https://apihub.agnes-ai.com/v1/chat/completions';

const config = { duration: 30, voiceSpeed: 200 };
const userInput = '用 AI 把 2 小时工作报告压缩成 5 分钟';
const shotList = {
  jsonScript: {
    metadata: {
      title: 'AI 工作报告压缩术',
      theme: '用 AI 把 2 小时工作报告压缩成 5 分钟',
      targetAudience: '职场白领、项目经理',
    },
  },
  shots: [
    { shotId: 1, timeStart: 0, timeEnd: 3, dialogue: '你还在为2小时工作报告头疼吗？', subtitle: '2小时报告太长了' },
    { shotId: 2, timeStart: 3, timeEnd: 7, dialogue: 'AI可以帮你把2小时压缩到5分钟。', subtitle: 'AI帮你压缩' },
    { shotId: 3, timeStart: 7, timeEnd: 12, dialogue: '自动提取关键数据、结论和行动项。', subtitle: '自动提取重点' },
    { shotId: 4, timeStart: 12, timeEnd: 18, dialogue: '生成可视化图表，老板一眼看懂。', subtitle: '可视化呈现' },
    { shotId: 5, timeStart: 18, timeEnd: 24, dialogue: '节省90%时间，提升10倍效率。', subtitle: '效率提升10倍' },
    { shotId: 6, timeStart: 24, timeEnd: 30, dialogue: '评论区领取AI报告模板，马上试试！', subtitle: '领取模板' },
  ],
};

const topic = shotList.jsonScript?.metadata?.title || '未命名';
const prompt = `你是短视频口播文案与字幕撰写专家。基于分镜表，撰写完整口播全文并拆分为短句字幕。

## 选题约束（必须严格围绕此主题，严禁改写）
- 用户原始想法: ${userInput}
- 选题: ${topic}
- 核心信息: ${shotList.jsonScript?.metadata?.theme || ''}
- 目标受众: ${shotList.jsonScript?.metadata?.targetAudience || ''}

## 分镜表（已生成）
${JSON.stringify(shotList.shots?.map((s) => ({
  shotId: s.shotId,
  timeStart: s.timeStart,
  timeEnd: s.timeEnd,
  dialogue: s.dialogue,
  subtitle: s.subtitle,
})), null, 2)}

## 配音语速
- ${config.voiceSpeed || 200} 字/分钟（${config.duration}s 视频，总字数约 ${Math.floor((config.duration / 60) * (config.voiceSpeed || 200))} 字）

## 任务
1. 把分镜表中的 dialogue 串成完整口播全文（fullScript）
2. 拆分为短句（lines），每句不超过 10 字、关联 shotId、设置 layoutId/presetId/estimatedDuration

## 字幕规范
- 单行字数 ≤21 字
- 每屏 ≤2 行
- 关键信息停留 ≥2 秒

## 输出要求
- 只输出单个 JSON 对象，不要数组，不要 Markdown 代码块
- 文案必须围绕「${topic}」

## 输出格式
{"fullScript":"...","lines":[{"id":"line_1","content":"短句字幕","layoutId":"bottom_center","presetId":"entrance_fade_in","shotId":1,"estimatedDuration":1.5}]}
`;

async function main() {
  console.log('Prompt length:', prompt.length);

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'agnes-2.0-flash',
        messages: [
          { role: 'system', content: '你是短视频口播文案与字幕撰写专家，严格按 JSON 输出。' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 16384,
      }),
    });

    console.log('Status:', res.status);
    if (!res.ok) {
      const text = await res.text();
      console.error('Error:', text.slice(0, 500));
      return;
    }

    const data = await res.json();
    console.log('Usage:', JSON.stringify(data.usage, null, 2));
    console.log('Content:', data.choices?.[0]?.message?.content?.slice(0, 500));
  } catch (e) {
    console.error('Fetch error:', e.message);
  }
}

main();
