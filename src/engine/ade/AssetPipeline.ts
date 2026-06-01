import { v4 as uuidv4 } from 'uuid';
import { AssetGenerationResult, Shot, VisualDescription } from './types';

export class AssetPipeline {
  private comfyUIEnabled: boolean = false;
  private comfyUIHost: string = '127.0.0.1';
  private comfyUIPort: number = 8188;
  private ws: WebSocket | null = null;

  setComfyUIConfig(enabled: boolean, host: string = '127.0.0.1', port: number = 8188): void {
    this.comfyUIEnabled = enabled;
    this.comfyUIHost = host;
    this.comfyUIPort = port;
  }

  async generateVisual(visual: VisualDescription): Promise<AssetGenerationResult> {
    switch (visual.type) {
      case 'comfyui':
        return this.generateFromComfyUI(visual.prompt || '');
      case 'svg':
        return this.generateSVG(visual.svgCode || '');
      case 'color':
        return this.generateColorBackground(visual.color || '#1a1a2e');
      case 'library':
        return { assetId: visual.assetId || '', url: '', type: 'image' };
      default:
        return this.generateColorBackground('#1a1a2e');
    }
  }

  private async generateFromComfyUI(prompt: string): Promise<AssetGenerationResult> {
    if (!this.comfyUIEnabled) {
      console.log('ComfyUI not enabled, generating placeholder');
      return this.generatePlaceholder(prompt);
    }

    try {
      const workflow = this.buildDefaultWorkflow(prompt);
      
      const response = await fetch(`http://${this.comfyUIHost}:${this.comfyUIPort}/prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workflow)
      });

      if (!response.ok) {
        throw new Error('ComfyUI request failed');
      }

      const result = await response.json();
      
      const imageUrl = await this.waitForCompletion(result.prompt_id);
      
      return {
        assetId: uuidv4(),
        url: imageUrl,
        type: 'image',
        width: 1920,
        height: 1080
      };
    } catch (error) {
      console.error('ComfyUI generation failed:', error);
      return this.generatePlaceholder(prompt);
    }
  }

  private buildDefaultWorkflow(prompt: string): any {
    return {
      "3": {
        "inputs": {
          "seed": Math.floor(Math.random() * 1000000000),
          "steps": 20,
          "cfg": 7,
          "sampler_name": "euler",
          "scheduler": "normal",
          "denoise": 1,
          "model": ["4", 0],
          "positive": ["6", 0],
          "negative": ["7", 0],
          "latent_image": ["5", 0]
        },
        "class_type": "KSampler"
      },
      "4": {
        "inputs": {
          "ckpt_name": "v1-5-pruned-emaonly.ckpt"
        },
        "class_type": "CheckpointLoaderSimple"
      },
      "5": {
        "inputs": {
          "width": 1920,
          "height": 1080,
          "batch_size": 1
        },
        "class_type": "EmptyLatentImage"
      },
      "6": {
        "inputs": {
          "text": `${prompt}, high quality, 4k, detailed`,
          "clip": ["4", 1]
        },
        "class_type": "CLIPTextEncode"
      },
      "7": {
        "inputs": {
          "text": "blurry, low quality, distorted, ugly",
          "clip": ["4", 1]
        },
        "class_type": "CLIPTextEncode"
      },
      "8": {
        "inputs": {
          "samples": ["3", 0],
          "vae": ["4", 2]
        },
        "class_type": "VAEDecode"
      },
      "9": {
        "inputs": {
          "filename_prefix": "ade_output",
          "images": ["8", 0]
        },
        "class_type": "SaveImage"
      }
    };
  }

  private async waitForCompletion(promptId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(`ws://${this.comfyUIHost}:${this.comfyUIPort}/ws`);
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'executed' && data.data.prompt_id === promptId) {
          const output = data.data.output;
          if (output.images && output.images.length > 0) {
            const image = output.images[0];
            const imageUrl = `http://${this.comfyUIHost}:${this.comfyUIPort}/view?filename=${image.filename}&type=output`;
            ws.close();
            resolve(imageUrl);
          }
        }
      };
      
      ws.onerror = () => {
        reject(new Error('WebSocket error'));
      };
      
      setTimeout(() => {
        ws.close();
        reject(new Error('Timeout'));
      }, 120000);
    });
  }

  private generatePlaceholder(prompt: string): AssetGenerationResult {
    const svgCode = this.generatePlaceholderSVG(prompt);
    const blob = new Blob([svgCode], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    return {
      assetId: uuidv4(),
      url,
      type: 'image',
      width: 1920,
      height: 1080
    };
  }

  private generatePlaceholderSVG(prompt: string): string {
    const colors = ['#1a1a2e', '#16213e', '#0f3460', '#1a1a2e'];
    const bgColor = colors[Math.floor(Math.random() * colors.length)];
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${bgColor}"/>
  <text x="960" y="540" font-family="Arial, sans-serif" font-size="48" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">
    ${prompt.substring(0, 30)}...
  </text>
  <text x="960" y="600" font-family="Arial, sans-serif" font-size="24" fill="#888888" text-anchor="middle">
    AI Generated Placeholder
  </text>
</svg>`;
  }

  async generateSVG(svgCode: string): Promise<AssetGenerationResult> {
    const blob = new Blob([svgCode], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    return {
      assetId: uuidv4(),
      url,
      type: 'image',
      width: 1920,
      height: 1080
    };
  }

  async generateColorBackground(color: string): Promise<AssetGenerationResult> {
    const svgCode = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${color}"/>
</svg>`;
    
    return this.generateSVG(svgCode);
  }

  async processShot(shot: Shot): Promise<Shot> {
    const processedShot = { ...shot };
    
    const visualAsset = await this.generateVisual(shot.visual);
    processedShot.visual = {
      ...shot.visual,
      assetId: visualAsset.assetId
    };
    
    return processedShot;
  }

  async processShots(shots: Shot[]): Promise<Shot[]> {
    const results: Shot[] = [];
    
    for (const shot of shots) {
      const processedShot = await this.processShot(shot);
      results.push(processedShot);
    }
    
    return results;
  }
}

export const assetPipeline = new AssetPipeline();
