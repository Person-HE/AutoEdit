import { Transform } from '../../types/core';
import { GridPosition, ZDepthLayer, SemanticPosition, LayoutResult } from './types';

const Z_INDEX_MAP: Record<ZDepthLayer, number> = {
  'background': 0,
  'middle-ground': 10,
  'foreground': 20,
  'text': 30
};

export class LayoutEngine {
  private canvasWidth: number;
  private canvasHeight: number;
  private padding: number;

  constructor(canvasWidth = 1920, canvasHeight = 1080, padding = 50) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.padding = padding;
  }

  setCanvasSize(width: number, height: number): void {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  semanticToPixel(position: SemanticPosition, assetWidth?: number, assetHeight?: number): Transform {
    const { grid, offsetX = 0, offsetY = 0 } = position;
    
    const gridCoords = this.getGridCoordinates(grid);
    
    let x = gridCoords.x + offsetX;
    let y = gridCoords.y + offsetY;
    
    if (assetWidth && assetHeight) {
      x -= assetWidth / 2;
      y -= assetHeight / 2;
    }
    
    return {
      x,
      y,
      scale: 1,
      rotation: 0
    };
  }

  private getGridCoordinates(grid: GridPosition): { x: number; y: number } {
    const cellWidth = (this.canvasWidth - this.padding * 2) / 3;
    const cellHeight = (this.canvasHeight - this.padding * 2) / 3;
    
    const gridMap: Record<GridPosition, { col: number; row: number }> = {
      'top-left': { col: 0, row: 0 },
      'top-center': { col: 1, row: 0 },
      'top-right': { col: 2, row: 0 },
      'middle-left': { col: 0, row: 1 },
      'center': { col: 1, row: 1 },
      'middle-right': { col: 2, row: 1 },
      'bottom-left': { col: 0, row: 2 },
      'bottom-center': { col: 1, row: 2 },
      'bottom-right': { col: 2, row: 2 }
    };
    
    const { col, row } = gridMap[grid];
    
    const x = this.padding + col * cellWidth + cellWidth / 2;
    const y = this.padding + row * cellHeight + cellHeight / 2;
    
    return { x, y };
  }

  getZIndex(layer: ZDepthLayer): number {
    return Z_INDEX_MAP[layer];
  }

  calculateLayout(
    position: SemanticPosition,
    existingClips: Array<{ id: string; transform: Transform; width: number; height: number }>,
    assetWidth = 1920,
    assetHeight = 1080
  ): LayoutResult {
    let transform = this.semanticToPixel(position, assetWidth, assetHeight);
    const zIndex = this.getZIndex(position.layer);
    
    const collisions: string[] = [];
    
    for (const clip of existingClips) {
      if (this.checkCollision(transform, assetWidth, assetHeight, clip.transform, clip.width, clip.height)) {
        collisions.push(clip.id);
      }
    }
    
    if (collisions.length > 0) {
      transform = this.resolveCollision(transform, assetWidth, assetHeight, existingClips);
    }
    
    return {
      transform,
      zIndex,
      collisions
    };
  }

  private checkCollision(
    transform1: Transform,
    w1: number,
    h1: number,
    transform2: Transform,
    w2: number,
    h2: number
  ): boolean {
    const x1 = transform1.x;
    const y1 = transform1.y;
    const x2 = transform2.x;
    const y2 = transform2.y;
    
    const overlapX = Math.abs(x1 - x2) < (w1 + w2) / 2 * 0.8;
    const overlapY = Math.abs(y1 - y2) < (h1 + h2) / 2 * 0.8;
    
    return overlapX && overlapY;
  }

  private resolveCollision(
    transform: Transform,
    assetWidth: number,
    assetHeight: number,
    existingClips: Array<{ transform: Transform; width: number; height: number }>
  ): Transform {
    const offsets = [
      { x: assetWidth * 0.6, y: 0 },
      { x: -assetWidth * 0.6, y: 0 },
      { x: 0, y: assetHeight * 0.6 },
      { x: 0, y: -assetHeight * 0.6 },
      { x: assetWidth * 0.4, y: assetHeight * 0.4 },
      { x: -assetWidth * 0.4, y: -assetHeight * 0.4 }
    ];
    
    for (const offset of offsets) {
      const newTransform = {
        ...transform,
        x: transform.x + offset.x,
        y: transform.y + offset.y
      };
      
      let hasCollision = false;
      for (const clip of existingClips) {
        if (this.checkCollision(newTransform, assetWidth, assetHeight, clip.transform, clip.width, clip.height)) {
          hasCollision = true;
          break;
        }
      }
      
      if (!hasCollision) {
        return newTransform;
      }
    }
    
    return transform;
  }

  getGridPositionFromDescription(description: string): SemanticPosition {
    const desc = description.toLowerCase();
    
    let grid: GridPosition = 'center';
    let layer: ZDepthLayer = 'middle-ground';
    
    if (desc.includes('左') || desc.includes('left')) {
      if (desc.includes('上') || desc.includes('top')) {
        grid = 'top-left';
      } else if (desc.includes('下') || desc.includes('bottom')) {
        grid = 'bottom-left';
      } else {
        grid = 'middle-left';
      }
    } else if (desc.includes('右') || desc.includes('right')) {
      if (desc.includes('上') || desc.includes('top')) {
        grid = 'top-right';
      } else if (desc.includes('下') || desc.includes('bottom')) {
        grid = 'bottom-right';
      } else {
        grid = 'middle-right';
      }
    } else if (desc.includes('上') || desc.includes('top')) {
      grid = 'top-center';
    } else if (desc.includes('下') || desc.includes('bottom')) {
      grid = 'bottom-center';
    } else {
      grid = 'center';
    }
    
    if (desc.includes('背景') || desc.includes('background')) {
      layer = 'background';
    } else if (desc.includes('前景') || desc.includes('foreground')) {
      layer = 'foreground';
    } else if (desc.includes('文字') || desc.includes('字幕') || desc.includes('text')) {
      layer = 'text';
    }
    
    return { grid, layer };
  }

  getSafeArea(): { top: number; right: number; bottom: number; left: number } {
    return {
      top: this.padding,
      right: this.canvasWidth - this.padding,
      bottom: this.canvasHeight - this.padding,
      left: this.padding
    };
  }
}

export const layoutEngine = new LayoutEngine();
