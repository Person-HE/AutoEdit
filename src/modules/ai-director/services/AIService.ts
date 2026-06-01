export interface AIProviderConfig {
  id: string;
  name: string;
  endpoint: string;
  apiKey: string;
  model: string;
}

export interface AIServiceConfig {
  providers: AIProviderConfig[];
  defaultProviderId?: string;
  retryCount?: number;
  retryDelay?: number;
  timeout?: number;
}

interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface CallAIOptions {
  temperature?: number;
  maxTokens?: number;
  thinking?: boolean;
}

const DEFAULT_CONFIG = {
  retryCount: 3,
  retryDelay: 1000,
  timeout: 60000,
};

class AIService {
  private config: AIServiceConfig & typeof DEFAULT_CONFIG;
  private defaultProviderId: string;

  constructor(config: AIServiceConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    if (!config.providers || config.providers.length === 0) {
      throw new Error('AIService: 至少需要配置一个 AI 提供商');
    }
    this.defaultProviderId =
      config.defaultProviderId || config.providers[0].id;
  }

  get providers(): AIProviderConfig[] {
    return this.config.providers;
  }

  get currentProvider(): AIProviderConfig | undefined {
    return this.config.providers.find(
      (p) => p.id === this.defaultProviderId
    );
  }

  getProvider(id: string): AIProviderConfig | undefined {
    return this.config.providers.find((p) => p.id === id);
  }

  setDefaultProvider(id: string): void {
    const exists = this.config.providers.some((p) => p.id === id);
    if (!exists) {
      throw new Error(`AIService: 未找到 id="${id}" 的提供商`);
    }
    this.defaultProviderId = id;
  }

  private async callAIRaw(
    messages: AIMessage[],
    options: CallAIOptions,
    provider: AIProviderConfig
  ): Promise<string> {
    const { temperature = 0.8, maxTokens = 4096, thinking = false } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      this.config.timeout
    );

    try {
      const body: Record<string, any> = {
        model: provider.model,
        messages,
        max_tokens: maxTokens,
        temperature,
      };

      if (thinking) {
        body.thinking = { type: 'enabled' };
      }

      const response = await fetch(provider.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${provider.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      if (data.choices?.[0]?.message?.content) {
        return data.choices[0].message.content;
      }

      throw new Error('Invalid API response');
    } catch (error) {
      console.error('AI API call failed:', error);
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async callAI(
    messages: AIMessage[],
    options?: CallAIOptions,
    providerId?: string
  ): Promise<string> {
    const targetId = providerId || this.defaultProviderId;
    const provider = this.getProvider(targetId);
    if (!provider) {
      throw new Error(
        `AIService: 未找到 id="${targetId}" 的提供商`
      );
    }
    return this.callAIRaw(messages, options || {}, provider);
  }

  async callAIWithRetry(
    messages: AIMessage[],
    options?: CallAIOptions,
    providerId?: string
  ): Promise<string> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= this.config.retryCount; attempt++) {
      try {
        return await this.callAI(messages, options, providerId);
      } catch (error) {
        lastError = error;
        if (attempt < this.config.retryCount) {
          await new Promise((resolve) =>
            setTimeout(resolve, this.config.retryDelay * attempt)
          );
        }
      }
    }
    throw lastError;
  }

  private parseJSONResponse<T>(result: string, key?: string): T {
    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('无法解析AI返回的JSON');
      }
      const parsed = JSON.parse(jsonMatch[0]);
      return key ? parsed[key] : parsed;
    } catch (e) {
      console.error('Parse error:', e);
      throw e instanceof Error ? e : new Error(String(e));
    }
  }

  async analyzeUserInput(userInput: string): Promise<{
    materials: Array<{ id: string; description: string; type: string }>;
    shots: Array<{ id: string; description: string; duration: number }>;
    textContent: string;
  }> {
    const systemPrompt = `你是一个专业的视频制作分析师。当用户输入视频描述时，你需要分析并返回结构化的JSON数据。

请分析用户输入，返回以下JSON格式：
{
  "materials": [
    { "id": "mat_1", "description": "素材描述", "type": "image" }
  ],
  "shots": [
    { "id": "shot_1", "description": "分镜画面描述", "duration": 3 }
  ],
  "textContent": "完整的文案内容"
}

注意：
- 一个输入只生成一个分镜
- 素材类型只能是 image（图片）
- 分镜时长建议3-10秒
- 文案要简洁有力`;

    const userMessage = `请分析以下视频描述：\n\n${userInput}`;

    const result = await this.callAIWithRetry([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ]);

    return this.parseJSONResponse(result);
  }

  async generateImagePrompts(
    materialDescriptions: string[]
  ): Promise<Array<{ prompt: string; negativePrompt: string }>> {
    const systemPrompt = `你是一个专业的AI绘画提示词工程师。根据素材描述生成用于ComfyUI/SDXL的英文提示词。

对于每个素材描述，返回：
{
  "prompts": [
    { 
      "prompt": "详细的正向提示词", 
      "negativePrompt": "负面提示词（模糊、低质量等）" 
    }
  ]
}

要求：
- 提示词要详细、具体、高质量
- 使用英文
- 包含风格、构图、光线、色彩等细节
- 负面提示词要包含常见的质量问题`;

    const userMessage = `请为以下素材生成文生图提示词：\n${materialDescriptions.map((d, i) => `${i + 1}. ${d}`).join('\n')}`;

    const result = await this.callAIWithRetry([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ]);

    return this.parseJSONResponse<Array<{ prompt: string; negativePrompt: string }>>(result, 'prompts');
  }

  async generateShotData(shotDescription: string, customSystemPrompt?: string): Promise<any> {
    const systemPrompt = customSystemPrompt || `你是一个专业的视频编辑代码生成器。根据分镜描述生成符合AIScript格式的JSON数据。

必须严格遵循以下AIScript格式：
{
  "version": "1.0.0",
  "title": "视频标题",
  "canvas": { "aspectRatio": "16:9" },
  "shots": [
    {
      "shotId": "shot_1",
      "order": 1,
      "duration": 5,
      "layoutId": "full",
      "texts": [
        {
          "id": "text_1",
          "content": "显示的文字",
          "layoutId": "center",
          "style": {
            "fontSize": 48,
            "color": "#ffffff",
            "fontWeight": "bold",
            "fontFamily": "Arial"
          },
          "animation": {
            "entrance": {
              "presetId": "entrance_fade_in",
              "duration": 0.8
            },
            "exit": {
              "presetId": "exit_fade_out",
              "duration": 0.5,
              "delay": 4.2
            }
          }
        }
      ],
      "materials": [
        {
          "id": "mat_1",
          "source": "comfyui",
          "layoutId": "center",
          "generatePrompt": "生成的提示词"
        }
      ]
    }
  ]
}

可用的预设ID列表（entrance类别）:
- entrance_fade_in, entrance_fade_in_up, entrance_fade_in_down, entrance_fade_in_left, entrance_fade_in_right
- entrance_slide_in_up, entrance_slide_in_down, entrance_slide_in_left, entrance_slide_in_right
- entrance_zoom_in, entrance_zoom_in_up, entrance_zoom_in_down
- entrance_bounce_in, entrance_elastic_in, entrance_back_in
- entrance_flip_in_x, entrance_flip_in_y

可用的预设ID列表（exit类别）:
- exit_fade_out, exit_fade_out_up, exit_fade_out_down
- exit_slide_out_up, exit_slide_out_down, exit_slide_out_left, exit_slide_out_right
- exit_zoom_out, exit_bounce_out

可用的布局ID:
- full, center, center_large, top_center, bottom_center
- top_left_quarter, top_right_quarter, bottom_left_quarter, bottom_right_quarter
- left_third, right_third, top_bar, bottom_bar
- sidebar_left, sidebar_right, content_area
- grid_16_9, grid_16_6, grid_16_4 等

注意：
- 只返回一个分镜
- 时长建议3-10秒
- 文字大小要根据画布自适应
- 颜色使用十六进制格式`;

    const userMessage = `请为以下分镜描述生成完整的AIScript JSON：\n\n分镜描述：${shotDescription}\n\n注意：只输出JSON，不要其他内容。`;

    const result = await this.callAIWithRetry(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      { temperature: 0.6 }
    );

    return this.parseJSONResponse(result);
  }

  async processTextContent(textContent: string): Promise<Array<{
    id: string;
    content: string;
    layoutId: string;
    presetId: string;
  }>> {
    const systemPrompt = `你是一个专业的文案处理专家。将长文案拆分为短句。

规则：
1. 每句话不超过10个字
2. 不能断句（保持语义完整）
3. 每句话独立成行
4. 保持原文意思不变

返回格式：
{
  "lines": [
    { "id": "line_1", "content": "第一句", "layoutId": "bottom_center", "presetId": "entrance_fade_in" }
  ]
}

可用的文本布局:
- center: 居中
- top_center: 上方居中
- bottom_center: 下方居中
- left_center: 左侧居中
- right_center: 右侧居中

可用的入场预设:
- entrance_fade_in: 淡入
- entrance_slide_in_up: 从下滑入
- entrance_zoom_in: 缩放进入
- entrance_bounce_in: 弹跳进入`;

    const userMessage = `请处理以下文案：\n\n"${textContent}"\n\n拆分为短句，每句不超过10字。`;

    const result = await this.callAIWithRetry([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ]);

    return this.parseJSONResponse<Array<{
      id: string;
      content: string;
      layoutId: string;
      presetId: string;
    }>>(result, 'lines');
  }
}

const defaultConfig: AIServiceConfig = {
  providers: [
    {
      id: 'nvidia',
      name: 'NVIDIA NIM',
      endpoint: import.meta.env.DEV
        ? '/api/nvidia/v1/chat/completions'
        : 'https://integrate.api.nvidia.com/v1/chat/completions',
      apiKey: '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',
      model: 'meta/llama-3.3-70b-instruct',
    },
  ],
  defaultProviderId: 'nvidia',
};

export const aiService = new AIService(defaultConfig);

export { AIService };
export default aiService;
