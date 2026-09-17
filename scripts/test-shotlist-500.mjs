// 测试分镜表 prompt 是否会导致 500
const API_KEY = '[REDACTED-AGNES-KEY-2]';
const ENDPOINT = 'https://apihub.agnes-ai.com/v1/chat/completions';

const duration = 30;
const speed = 200;
const totalWords = Math.floor((duration / 60) * speed);
const userInput = '用 AI 把 2 小时工作报告压缩成 5 分钟';
const topicAnalysis = {
  topic: 'AI 工作报告压缩术',
  coreMessage: '用 AI 把 2 小时工作报告压缩成 5 分钟',
  hookType: '痛点直击',
  viralFormula: '痛点场景(3s) → 方案演示(20s) → 结果对比(5s) → CTA(2s)',
  materials: '录屏、图表、办公场景',
};
const emotionCurve = {
  curve: [
    { timeStart: 0, timeEnd: 3, emotion: '焦虑', score: -0.7, purpose: '痛点钩子' },
    { timeStart: 3, timeEnd: 10, emotion: '期待', score: 0.3, purpose: '方案引入' },
    { timeStart: 10, timeEnd: 20, emotion: '振奋', score: 0.6, purpose: '逐步演示' },
    { timeStart: 20, timeEnd: 28, emotion: '兴奋', score: 0.8, purpose: '效果展示' },
    { timeStart: 28, timeEnd: 30, emotion: '行动', score: 0.9, purpose: 'CTA' },
  ],
};

const prompt = `你是抖音/快手秒级拉片分镜表设计师。基于选题、爆款公式、情绪曲线，输出严格 JSON 格式的 15 字段秒级分镜表。

## 选题与约束（必须严格围绕此主题，严禁改写为 AI/设计/装修/学习等其他主题）
- 用户原始想法: ${userInput}
- 选题: ${topicAnalysis.topic}
- 核心信息: ${topicAnalysis.coreMessage}
- 爆款公式: ${topicAnalysis.viralFormula}
- 总时长: ${duration}s（所有分镜 duration 之和必须等于 ${duration}）
- 画幅: 9:16
- 赛道: 知识教育
- 配音语速: ${speed}字/分钟（整段口播总字数约 ${totalWords} 字）
- 可用素材: ${topicAnalysis.materials}

## 情绪曲线
${JSON.stringify(emotionCurve.curve)}

## 15 字段定义
shotId(整数), timeStart/timeEnd(秒), duration(秒), sceneType(开场|发展|转折|高潮|结尾), shotSize(远景|全景|中景|近景|特写), cameraMove(固定|推镜|拉镜|摇镜|移镜|跟拍|手持晃动|变焦), visualDescription(具体画面), dialogue(口播台词), subtitle(屏幕字幕,≤21字), subtitleStyle(字幕样式), musicSfx(BGM/音效), transition(硬切|叠化|闪白|闪黑|匹配剪辑|跳切|放大擦除|前景遮挡), emotion(情绪词), emotionScore(-1~+1), purpose(该镜目的,≤10字)

## 赛道公式参考
知识教育：反常识钩子（3s）→ 视觉化推导/操作（主体）→ 结论+行动号召（结尾）

### 节奏结构
- 前 3 秒完成注意力抢占
- 单镜头 1-3 秒，情绪长镜可 5 秒+
- 画面每 2-3 秒切换一次

### 字幕规范
- 单行 ≤21 字，每屏 ≤2 行
- 关键信息停留 ≥2 秒

### 严禁模拟
所有产物必须具体可执行，不得使用占位符。

## 输出要求
- 只输出单个 JSON 对象（不要数组，不要嵌套 data/scripts 字段）
- 不要 Markdown 代码块，不要解释
- shots 数组覆盖 0-${duration}s，不能有重叠或空白
- 口播总字数控制在 ${totalWords} 字左右
- visualDescription 和 dialogue 必须贴合「${topicAnalysis.topic}」主题
- markdownTable 是 Markdown 字符串，包含表头和所有分镜行

## 输出格式
{"shots":[{"shotId":1,"timeStart":0,"timeEnd":3,"duration":3,"sceneType":"开场","shotSize":"特写","cameraMove":"固定","visualDescription":"...","dialogue":"...","subtitle":"...","subtitleStyle":"白字黑色细描边","musicSfx":"轻快节奏起","transition":"硬切","emotion":"焦虑","emotionScore":-0.7,"purpose":"痛点钩子"}],"markdownTable":"..."}
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
          { role: 'system', content: '你是抖音/快手秒级拉片分镜表设计师，严格按 JSON 输出。' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.6,
        max_tokens: 16384,
      }),
    });

    console.log('Status:', res.status);
    if (!res.ok) {
      const text = await res.text();
      console.error('Error:', text.slice(0, 1000));
      return;
    }

    const data = await res.json();
    console.log('Usage:', JSON.stringify(data.usage, null, 2));
    const content = data.choices?.[0]?.message?.content || '';
    console.log('Content length:', content.length);
    console.log('Content preview:', content.slice(0, 300));
  } catch (e) {
    console.error('Fetch error:', e.message);
  }
}

main();
