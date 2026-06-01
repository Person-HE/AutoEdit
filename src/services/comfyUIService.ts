/**
 * ComfyUI 图片生成服务
 * 用于调用本地部署的 ComfyUI 生成图片素材
 */

// 图片生成配置
export interface ImageGenConfig {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  seed?: number;
  steps?: number;
  cfg?: number;
}

// 图片生成结果
export interface ImageGenResult {
  success: boolean;
  imageUrl?: string;
  filePath?: string;
  seed: number;
  width: number;
  height: number;
  error?: string;
}

// 默认配置
export const DEFAULT_IMAGE_GEN_CONFIG: ImageGenConfig = {
  prompt: '',
  negativePrompt: 'ugly, blurry, noisy, messy, deformed, bad anatomy',
  width: 1024,
  height: 576,
  seed: -1,
  steps: 9,
  cfg: 1,
};

// ComfyUI API 地址
const COMFYUI_API_URL = (import.meta as any).env?.VITE_COMFYUI_URL || 'http://127.0.0.1:8188';

class ComfyUIService {
  private apiUrl: string;
  private clientId: string;

  constructor() {
    this.apiUrl = COMFYUI_API_URL;
    this.clientId = `nanoedit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 生成图片
   * @param config 图片生成配置
   * @returns 图片生成结果
   */
  async generateImage(config: ImageGenConfig): Promise<ImageGenResult> {
    const finalConfig = { ...DEFAULT_IMAGE_GEN_CONFIG, ...config };

    try {
      // 加载工作流配置
      const workflow = await this.loadWorkflow();
      
      // 修改工作流中的参数
      this.updateWorkflow(workflow, finalConfig);
      
      // 提交任务到 ComfyUI
      const promptId = await this.queuePrompt(workflow);
      
      // 等待生成完成并获取结果
      const result = await this.waitForResult(promptId);
      
      return result;
    } catch (error) {
      console.error('ComfyUI image generation error:', error);
      throw error;
    }
  }

  /**
   * 加载工作流配置
   */
  private async loadWorkflow(): Promise<any> {
    try {
      // 从本地 JSON 文件加载工作流
      const response = await fetch('/src/utils/image.json');
      if (!response.ok) {
        throw new Error('Failed to load workflow file');
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to load workflow:', error);
      // 返回默认工作流
      return this.getDefaultWorkflow();
    }
  }

  /**
   * 获取默认工作流
   */
  private getDefaultWorkflow(): any {
    return {
      "1": {
        "inputs": {
          "width": 1024,
          "height": 576,
          "batch_size": 1
        },
        "class_type": "EmptyLatentImage",
        "_meta": {
          "title": "空Latent图像"
        }
      },
      "6": {
        "inputs": {
          "text": "masterpiece, best quality, beautiful scenery",
          "clip": ["14", 0]
        },
        "class_type": "CLIPTextEncode",
        "_meta": {
          "title": "CLIP文本编码"
        }
      },
      "8": {
        "inputs": {
          "seed": 880624617216449,
          "steps": 9,
          "cfg": 1,
          "sampler_name": "euler_ancestral",
          "scheduler": "normal",
          "denoise": 1,
          "model": ["48", 0],
          "positive": ["6", 0],
          "negative": ["21", 0],
          "latent_image": ["1", 0]
        },
        "class_type": "KSampler",
        "_meta": {
          "title": "K采样器"
        }
      },
      "9": {
        "inputs": {
          "vae_name": "ae.safetensors"
        },
        "class_type": "VAELoader",
        "_meta": {
          "title": "加载VAE"
        }
      },
      "13": {
        "inputs": {
          "filename_prefix": "nanoedit_generated",
          "images": ["16", 0]
        },
        "class_type": "SaveImage",
        "_meta": {
          "title": "保存图像"
        }
      },
      "14": {
        "inputs": {
          "clip_name": "qwen_3_4b.safetensors",
          "type": "wan",
          "device": "default"
        },
        "class_type": "CLIPLoader",
        "_meta": {
          "title": "加载CLIP"
        }
      },
      "16": {
        "inputs": {
          "samples": ["8", 0],
          "vae": ["9", 0]
        },
        "class_type": "VAEDecode",
        "_meta": {
          "title": "VAE解码"
        }
      },
      "21": {
        "inputs": {
          "text": "ugly, blurry, noisy, messy, deformed, bad anatomy",
          "clip": ["14", 0]
        },
        "class_type": "CLIPTextEncode",
        "_meta": {
          "title": "CLIP文本编码"
        }
      },
      "48": {
        "inputs": {
          "unet_name": "z-image-turbo-Q4_K_M.gguf"
        },
        "class_type": "UnetLoaderGGUF",
        "_meta": {
          "title": "Unet Loader (GGUF)"
        }
      }
    };
  }

  /**
   * 更新工作流参数
   */
  private updateWorkflow(workflow: any, config: ImageGenConfig): void {
    // 更新正向提示词 (节点 6)
    if (workflow["6"] && workflow["6"].inputs) {
      workflow["6"].inputs.text = config.prompt || workflow["6"].inputs.text;
    }

    // 更新负向提示词 (节点 21)
    if (workflow["21"] && workflow["21"].inputs) {
      workflow["21"].inputs.text = config.negativePrompt || workflow["21"].inputs.text;
    }

    // 更新图片尺寸 (节点 1)
    if (workflow["1"] && workflow["1"].inputs) {
      workflow["1"].inputs.width = config.width || workflow["1"].inputs.width;
      workflow["1"].inputs.height = config.height || workflow["1"].inputs.height;
    }

    // 更新采样参数 (节点 8)
    if (workflow["8"] && workflow["8"].inputs) {
      if (config.seed !== undefined && config.seed >= 0) {
        workflow["8"].inputs.seed = config.seed;
      } else {
        // 随机种子
        workflow["8"].inputs.seed = Math.floor(Math.random() * 999999999999);
      }
      if (config.steps) {
        workflow["8"].inputs.steps = config.steps;
      }
      if (config.cfg) {
        workflow["8"].inputs.cfg = config.cfg;
      }
    }
  }

  /**
   * 提交生成任务到 ComfyUI
   */
  private async queuePrompt(workflow: any): Promise<string> {
    const response = await fetch(`${this.apiUrl}/prompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: workflow,
        client_id: this.clientId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to queue prompt: ${response.statusText}`);
    }

    const data = await response.json();
    return data.prompt_id;
  }

  /**
   * 等待生成完成并获取结果
   */
  private async waitForResult(promptId: string): Promise<ImageGenResult> {
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(async () => {
        try {
          // 获取历史记录
          const response = await fetch(`${this.apiUrl}/history/${promptId}`);
          if (!response.ok) {
            return;
          }

          const history = await response.json();
          
          if (history[promptId]) {
            clearInterval(checkInterval);
            
            const outputs = history[promptId].outputs;
            
            // 查找保存图片的节点 (通常是 SaveImage 节点)
            for (const nodeId in outputs) {
              const nodeOutput = outputs[nodeId];
              if (nodeOutput.images && nodeOutput.images.length > 0) {
                const imageInfo = nodeOutput.images[0];
                const imageUrl = `${this.apiUrl}/view?filename=${imageInfo.filename}&subfolder=${imageInfo.subfolder || ''}&type=${imageInfo.type || 'output'}`;
                
                resolve({
                  success: true,
                  imageUrl: imageUrl,
                  filePath: imageInfo.filename,
                  seed: 0,
                  width: 1024,
                  height: 576,
                });
                return;
              }
            }
            
            reject(new Error('No images found in output'));
          }
        } catch (error) {
          console.error('Error checking result:', error);
        }
      }, 1000);

      // 超时处理 (5 分钟)
      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error('Image generation timeout'));
      }, 300000);
    });
  }

  /**
   * 检查服务是否可用
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/system_stats`, {
        method: 'GET',
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * 设置 API 地址
   */
  setApiUrl(url: string): void {
    this.apiUrl = url;
  }

  /**
   * 获取可用模型列表
   */
  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.apiUrl}/object_info/CheckpointLoaderSimple`);
      if (!response.ok) {
        return [];
      }
      const data = await response.json();
      return data.CheckpointLoaderSimple?.input?.required?.ckpt_name?.[0] || [];
    } catch {
      return [];
    }
  }
}

export const comfyUIService = new ComfyUIService();
