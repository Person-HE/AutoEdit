/**
 * Index-TTS 配音服务
 * 与本地部署的 Index-TTS 后端 (index_tts_server.py) 交互
 * 后端代理到 IndexTTS api_server.py，支持参考音频文件上传
 */

export interface TTSConfig {
  speed: number;
  emotion?: string;
  emoWeight?: number;
}

export interface TTSResult {
  audioUrl: string;
  audioDuration: number;
  filePath: string;
}

export interface ReferenceAudioInfo {
  filename: string;
  filePath: string;
  audioUrl: string;
  duration: number;
}

export const EMOTION_CONTROL_METHODS = [
  { id: '与音色参考音频相同', name: '与音色参考音频相同', description: '使用参考音频的情感' },
  { id: '使用情感参考音频', name: '使用情感参考音频', description: '使用独立的情感参考音频' },
  { id: '使用情感向量控制', name: '使用情感向量控制', description: '使用情感向量参数控制' },
];

export const DEFAULT_TTS_CONFIG: TTSConfig = {
  speed: 1.0,
  emotion: '与音色参考音频相同',
  emoWeight: 0.65,
};

const STORAGE_KEY = 'nanoedit_tts_config';

function loadTTSConfig(): { proxyUrl: string } {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load TTS config:', e);
  }
  return { proxyUrl: 'http://127.0.0.1:8001' };
}

function saveTTSConfig(config: { proxyUrl: string }): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save TTS config:', e);
  }
}

class IndexTTSService {
  private proxyUrl: string;

  constructor() {
    const config = loadTTSConfig();
    this.proxyUrl = config.proxyUrl;
  }

  getProxyUrl(): string {
    return this.proxyUrl;
  }

  setProxyUrl(url: string): void {
    this.proxyUrl = url;
    saveTTSConfig({ proxyUrl: url });
  }

  /**
   * 上传参考音频到服务器
   * @param audioFile 参考音频文件
   * @returns 参考音频信息
   */
  async uploadReferenceAudio(audioFile: File): Promise<ReferenceAudioInfo> {
    const formData = new FormData();
    formData.append('audio', audioFile);

    const response = await fetch(`${this.proxyUrl}/api/tts/upload_reference`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`上传参考音频失败: ${response.status} ${errorText}`);
    }

    const result = await response.json();

    return {
      filename: result.filename,
      filePath: result.filePath,
      audioUrl: `${this.proxyUrl}${result.audioUrl}`,
      duration: result.duration || 0,
    };
  }

  /**
   * 生成配音 - 通过后端代理调用 IndexTTS api_server.py
   * 必须指定参考音频文件
   * @param text 要转换的文本
   * @param referenceAudioFile 参考音频文件
   * @param config TTS 配置
   * @returns TTS 生成结果
   */
  async generateVoice(
    text: string,
    referenceAudioFile: File,
    config: Partial<TTSConfig> = {}
  ): Promise<TTSResult> {
    const finalConfig = { ...DEFAULT_TTS_CONFIG, ...config };

    if (!referenceAudioFile) {
      throw new Error('必须指定参考音频文件');
    }

    try {
      const formData = new FormData();
      formData.append('text', text);
      formData.append('prompt_audio', referenceAudioFile);
      formData.append('emo_alpha', String(finalConfig.emoWeight || 1.0));
      formData.append('max_text_tokens_per_segment', '120');
      formData.append('do_sample', 'true');
      formData.append('top_p', '0.8');
      formData.append('top_k', '30');
      formData.append('temperature', '0.8');
      formData.append('length_penalty', '0');
      formData.append('num_beams', '3');
      formData.append('repetition_penalty', '10');
      formData.append('max_mel_tokens', '1500');

      console.log('Calling Index-TTS Proxy API:', `${this.proxyUrl}/api/tts/generate`);
      console.log('Text:', text);
      console.log('Reference audio:', referenceAudioFile.name, `(${(referenceAudioFile.size / 1024).toFixed(1)}KB)`);

      const response = await fetch(`${this.proxyUrl}/api/tts/generate`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errorDetail = `HTTP ${response.status}`;
        try {
          const errorJson = await response.json();
          errorDetail = errorJson.detail || errorJson.message || errorDetail;
        } catch {
          errorDetail = await response.text();
        }
        throw new Error(`配音生成失败: ${errorDetail}`);
      }

      const result = await response.json();
      console.log('Index-TTS API response:', result);

      if (result.success && result.audioUrl) {
        const fullAudioUrl = result.audioUrl.startsWith('http')
          ? result.audioUrl
          : `${this.proxyUrl}${result.audioUrl}`;

        return {
          audioUrl: fullAudioUrl,
          audioDuration: result.duration || 0,
          filePath: result.filePath || '',
        };
      }

      throw new Error(result.message || 'Invalid response from Index-TTS API');
    } catch (error) {
      console.error('Index-TTS generation error:', error);
      throw error;
    }
  }

  /**
   * 使用服务器本地参考音频文件路径生成配音
   * @param text 要转换的文本
   * @param promptAudioPath 服务器本地参考音频文件路径
   * @param config TTS 配置
   * @returns TTS 生成结果
   */
  async generateVoiceWithFilePath(
    text: string,
    promptAudioPath: string,
    config: Partial<TTSConfig> = {}
  ): Promise<TTSResult> {
    const finalConfig = { ...DEFAULT_TTS_CONFIG, ...config };

    try {
      const formData = new FormData();
      formData.append('text', text);
      formData.append('prompt_audio_path', promptAudioPath);
      formData.append('emo_alpha', String(finalConfig.emoWeight || 1.0));
      formData.append('max_text_tokens_per_segment', '120');
      formData.append('do_sample', 'true');
      formData.append('top_p', '0.8');
      formData.append('top_k', '30');
      formData.append('temperature', '0.8');
      formData.append('length_penalty', '0');
      formData.append('num_beams', '3');
      formData.append('repetition_penalty', '10');
      formData.append('max_mel_tokens', '1500');

      const response = await fetch(`${this.proxyUrl}/api/tts/generate_with_file`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errorDetail = `HTTP ${response.status}`;
        try {
          const errorJson = await response.json();
          errorDetail = errorJson.detail || errorJson.message || errorDetail;
        } catch {
          errorDetail = await response.text();
        }
        throw new Error(`配音生成失败: ${errorDetail}`);
      }

      const result = await response.json();

      if (result.success && result.audioUrl) {
        const fullAudioUrl = result.audioUrl.startsWith('http')
          ? result.audioUrl
          : `${this.proxyUrl}${result.audioUrl}`;

        return {
          audioUrl: fullAudioUrl,
          audioDuration: result.duration || 0,
          filePath: result.filePath || '',
        };
      }

      throw new Error(result.message || 'Invalid response from Index-TTS API');
    } catch (error) {
      console.error('Index-TTS generation error:', error);
      throw error;
    }
  }

  /**
   * 获取音频时长
   * @param audioUrl 音频 URL
   * @returns 音频时长（秒）
   */
  async getAudioDuration(audioUrl: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.preload = 'metadata';
      audio.onloadedmetadata = () => {
        resolve(audio.duration);
      };
      audio.onerror = () => {
        reject(new Error('Failed to load audio metadata'));
      };
      audio.src = audioUrl;
    });
  }

  /**
   * 检查服务是否可用
   */
  async checkHealth(): Promise<{ healthy: boolean; indexTtsConnected: boolean }> {
    try {
      const response = await fetch(`${this.proxyUrl}/health`, {
        method: 'GET',
      } as any);
      if (!response.ok) return { healthy: false, indexTtsConnected: false };
      const data = await response.json();
      return {
        healthy: data.status === 'healthy',
        indexTtsConnected: data.index_tts_connected || false,
      };
    } catch {
      return { healthy: false, indexTtsConnected: false };
    }
  }

}

export const indexTTSService = new IndexTTSService();
