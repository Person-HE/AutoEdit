import { fileStorage } from './fileStorage';
import { Asset } from '../types/core';

export const assetService = {
  // 生成一个测试图片
  createSampleAsset: async (): Promise<Asset> => {
    // 创建一个简单的 Canvas 生成图片
    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        // 背景渐变
        const gradient = ctx.createLinearGradient(0, 0, 1920, 1080);
        gradient.addColorStop(0, '#007AFF');
        gradient.addColorStop(1, '#00C6FF');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1920, 1080);
        
        // 文字
        ctx.fillStyle = 'white';
        ctx.font = 'bold 120px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Sample Asset', 1920 / 2, 1080 / 2);
        ctx.font = '40px sans-serif';
        ctx.fillText('NanoEdit Pro Test', 1920 / 2, 1080 / 2 + 100);
    }

    return new Promise((resolve) => {
        canvas.toBlob(async (blob) => {
            if (!blob) return;
            const file = new File([blob], "sample_gradient.png", { type: "image/png" });
            const asset = await fileStorage.saveAsset(file);
            resolve(asset);
        }, 'image/png');
    });
  },

  // 上传素材
  uploadAssets: async (files: File[]): Promise<Asset[]> => {
    const assets: Asset[] = [];

    for (const file of files) {
      const asset = await fileStorage.saveAsset(file);
      assets.push(asset);
    }

    return assets;
  },

  // 加载所有素材
  loadAssets: async (): Promise<Asset[]> => {
    let assets = await fileStorage.loadAllAssets();
    
    // 如果没有素材，自动创建一个样本
    if (assets.length === 0) {
        const sample = await assetService.createSampleAsset();
        assets = [sample];
    }

    return assets;
  },

  // 加载单个素材
  loadAsset: async (assetId: string): Promise<Asset | null> => {
    return await fileStorage.loadAsset(assetId);
  },

  // SVG转PNG
  convertSvgToPng: async (svgCode: string): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      try {
        // 创建SVG Blob
        const svgBlob = new Blob([svgCode], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        
        const img = new Image();
        img.onload = () => {
          // 创建canvas
          const canvas = document.createElement('canvas');
          // 默认尺寸，如果SVG有viewBox则使用viewBox的尺寸
          const parser = new DOMParser();
          const doc = parser.parseFromString(svgCode, 'image/svg+xml');
          const svgElement = doc.documentElement;
          
          let width = 1920;
          let height = 1080;
          
          // 尝试从SVG获取尺寸
          const viewBox = svgElement.getAttribute('viewBox');
          if (viewBox) {
            const parts = viewBox.split(/\s+/);
            if (parts.length === 4) {
              width = parseInt(parts[2]) || 1920;
              height = parseInt(parts[3]) || 1080;
            }
          }
          
          // 检查是否有width和height属性
          const svgWidth = svgElement.getAttribute('width');
          const svgHeight = svgElement.getAttribute('height');
          if (svgWidth) width = parseInt(svgWidth.replace(/[^0-9]/g, '')) || width;
          if (svgHeight) height = parseInt(svgHeight.replace(/[^0-9]/g, '')) || height;
          
          // 确保最小尺寸
          width = Math.max(width, 100);
          height = Math.max(height, 100);
          
          // 限制最大尺寸
          const maxDimension = 4096;
          if (width > maxDimension || height > maxDimension) {
            const ratio = Math.min(maxDimension / width, maxDimension / height);
            width = Math.floor(width * ratio);
            height = Math.floor(height * ratio);
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            URL.revokeObjectURL(url);
            reject(new Error('无法创建canvas上下文'));
            return;
          }
          
          // 绘制白色背景（防止透明背景）
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          
          // 绘制SVG
          ctx.drawImage(img, 0, 0, width, height);
          
          // 转换为PNG
          canvas.toBlob((blob) => {
            URL.revokeObjectURL(url);
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('转换失败'));
            }
          }, 'image/png');
        };
        
        img.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error('SVG加载失败，请检查代码是否正确'));
        };
        
        img.src = url;
      } catch (error) {
        reject(error);
      }
    });
  },

  // 删除素材
  async deleteAsset(assetId: string): Promise<boolean> {
    return await fileStorage.deleteAsset(assetId);
  }
};