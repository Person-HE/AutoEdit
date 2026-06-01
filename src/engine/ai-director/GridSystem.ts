/**
 * 16:9画布正方形网格系统
 * 核心模块：网格标识解析、坐标映射、元数据管理
 * 
 * 画布尺寸：1920 x 1080
 * 网格配置：32列 x 18行，每个网格60x60像素
 * 总网格数：576个
 */

// 画布配置（固定16:9）
export const CANVAS_CONFIG = {
  width: 1920,
  height: 1080,
  aspectRatio: '16:9' as const,
};

// 网格配置
export const GRID_CONFIG = {
  cols: 32,      // 32列
  rows: 18,      // 18行
  cellSize: 60,  // 每个网格60x60像素
};

// 网格标识类型
export type GridId = string;

// 像素范围 [left, top, right, bottom]
export type PixelRange = [number, number, number, number];

// 网格元数据
export interface GridMetadata {
  gridId: GridId;
  pixelRange: PixelRange;
  aspectRatio: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  materialRule: 'fit' | 'fill' | 'crop';
  textRule: {
    maxFontSize: number;
    lineHeight: number;
    autoWrap: boolean;
  };
  neighborCheck: boolean;
  animationSpeed: number;
}

// 解析后的网格信息
export interface ParsedGrid {
  startCol: number;
  startRow: number;
  endCol: number;
  endRow: number;
  isComposite: boolean;
}

// 校验结果
export interface ValidationResult {
  valid: boolean;
  error?: string;
  corrected?: GridId;
}

// 特殊网格标识映射 - 32x18网格系统
// 支持单网格和复合网格（多网格区域）
export const SPECIAL_GRID_MAP: Record<string, GridId> = {
  // ===== 单点位置（中心点）=====
  'center': 'grid_16_9',           // 正中心
  'center_left': 'grid_8_9',       // 中心偏左
  'center_right': 'grid_24_9',     // 中心偏右
  
  'top_center': 'grid_16_4',       // 上中
  'bottom_center': 'grid_16_15',   // 下中
  'left_center': 'grid_4_9',       // 左中
  'right_center': 'grid_28_9',     // 右中
  
  // 四个角落（小区域）
  'top_left': 'grid_4_4',          // 左上
  'top_right': 'grid_28_4',        // 右上
  'bottom_left': 'grid_4_15',      // 左下
  'bottom_right': 'grid_28_15',    // 右下
  
  // ===== 边缘条带区域 =====
  'top_bar': 'grid_1_1_32_3',      // 顶部条（3行高）
  'bottom_bar': 'grid_1_16_32_18', // 底部条（3行高）
  'left_bar': 'grid_1_1_4_18',     // 左侧条（4列宽）
  'right_bar': 'grid_29_1_32_18',  // 右侧条（4列宽）
  
  // ===== 中心区域（多种尺寸）=====
  'center_small': 'grid_14_7_18_11',   // 中心小区域 (5x5网格)
  'center_medium': 'grid_12_5_20_13',  // 中心中等区域 (9x9网格)
  'center_large': 'grid_8_3_24_15',    // 中心大区域 (17x13网格)
  'center_area': 'grid_8_3_24_15',     // 同 center_large
  
  // ===== 四分之一区域 =====
  'top_left_quarter': 'grid_1_1_16_9',     // 左上四分之一
  'top_right_quarter': 'grid_17_1_32_9',   // 右上四分之一
  'bottom_left_quarter': 'grid_1_10_16_18',  // 左下四分之一
  'bottom_right_quarter': 'grid_17_10_32_18', // 右下四分之一
  
  // ===== 三分之一区域 =====
  'left_third': 'grid_1_1_10_18',    // 左三分之一
  'center_third': 'grid_11_1_22_18', // 中三分之一
  'right_third': 'grid_23_1_32_18',  // 右三分之一
  
  'top_third': 'grid_1_1_32_6',      // 上三分之一
  'middle_third': 'grid_1_7_32_12',  // 中三分之一
  'bottom_third': 'grid_1_13_32_18', // 下三分之一
  
  // ===== 全屏 =====
  'full': 'grid_1_1_32_18',          // 全屏
  'fullscreen': 'grid_1_1_32_18',    // 同 full
  
  // ===== 常用复合区域 =====
  'header': 'grid_1_1_32_4',         // 页眉区域
  'footer': 'grid_1_15_32_18',       // 页脚区域
  'sidebar_left': 'grid_1_1_6_18',   // 左侧边栏
  'sidebar_right': 'grid_27_1_32_18', // 右侧边栏
  'content_area': 'grid_7_5_26_14',  // 内容区域
  
  // ===== 标题区域 =====
  'title_top': 'grid_8_2_24_4',      // 顶部标题区
  'title_bottom': 'grid_8_15_24_17', // 底部标题区
  'title_left': 'grid_2_7_8_12',     // 左侧标题区
  'title_right': 'grid_24_7_30_12',  // 右侧标题区
};

// 16:9画布正方形网格系统类
export class GridSystem {
  private metadataCache: Map<GridId, GridMetadata> = new Map();
  private canvasConfig = { ...CANVAS_CONFIG };

  constructor() {
    this.initializeCache();
  }

  // 设置画布配置（当前仅支持16:9）
  setCanvasConfig(aspectRatio: string): void {
    // 当前固定使用16:9配置
    if (aspectRatio !== '16:9') {
      console.warn(`[GridSystem] Only 16:9 aspect ratio is supported, ignoring: ${aspectRatio}`);
    }
    this.canvasConfig = { ...CANVAS_CONFIG };
  }

  // 初始化常用网格的元数据缓存
  private initializeCache(): void {
    const { cols, rows } = GRID_CONFIG;
    
    // 缓存所有单网格（32x18 = 576个）
    for (let col = 1; col <= cols; col++) {
      for (let row = 1; row <= rows; row++) {
        const gridId = `grid_${col}_${row}`;
        this.metadataCache.set(gridId, this.calculateMetadata(gridId));
      }
    }
    
    // 缓存常用复合网格
    const commonCompositeGrids = [
      'grid_1_1_32_18',      // 全屏
      'grid_8_3_24_15',      // 中心大区域 (17x13)
      'grid_12_5_20_13',     // 中心中等区域 (9x9)
      'grid_14_7_18_11',     // 中心小区域 (5x5)
      'grid_1_1_16_9',       // 左上四分之一 (16x9)
      'grid_17_1_32_9',      // 右上四分之一 (16x9)
      'grid_1_10_16_18',     // 左下四分之一 (16x9)
      'grid_17_10_32_18',    // 右下四分之一 (16x9)
      'grid_1_1_32_3',       // 顶部条 (32x3)
      'grid_1_16_32_18',     // 底部条 (32x3)
      'grid_1_1_4_18',       // 左侧条 (4x18)
      'grid_29_1_32_18',     // 右侧条 (4x18)
      'grid_1_1_10_18',      // 左三分之一 (10x18)
      'grid_11_1_22_18',     // 中三分之一 (12x18)
      'grid_23_1_32_18',     // 右三分之一 (10x18)
      'grid_1_1_32_6',       // 上三分之一 (32x6)
      'grid_1_7_32_12',      // 中三分之一 (32x6)
      'grid_1_13_32_18',     // 下三分之一 (32x6)
      'grid_1_1_32_4',       // 页眉 (32x4)
      'grid_1_15_32_18',     // 页脚 (32x4)
      'grid_7_5_26_14',      // 内容区域 (20x10)
      'grid_8_2_24_4',       // 顶部标题区 (17x3)
      'grid_8_15_24_17',     // 底部标题区 (17x3)
    ];
    
    commonCompositeGrids.forEach(gridId => {
      if (this.validateGridId(gridId).valid) {
        this.metadataCache.set(gridId, this.calculateMetadata(gridId));
      }
    });
  }

  // 解析网格标识
  // 支持格式：
  // - 单网格: grid_16_9
  // - 复合网格: grid_8_3_24_15 (从第8列第3行到第24列第15行)
  parseGridId(gridId: GridId): ParsedGrid {
    // 处理特殊标识
    const normalizedId = SPECIAL_GRID_MAP[gridId] || gridId;

    const match = normalizedId.match(/^grid_(\d+)_(\d+)(?:_(\d+)_(\d+))?$/);
    if (!match) {
      throw new Error(`Invalid grid ID format: ${gridId}`);
    }

    const startCol = parseInt(match[1], 10);
    const startRow = parseInt(match[2], 10);
    const endCol = match[3] ? parseInt(match[3], 10) : startCol;
    const endRow = match[4] ? parseInt(match[4], 10) : startRow;

    return {
      startCol,
      startRow,
      endCol,
      endRow,
      isComposite: !!(match[3] && match[4]),
    };
  }

  // 验证网格标识是否合法
  validateGridId(gridId: GridId): ValidationResult {
    try {
      // 处理特殊标识
      if (SPECIAL_GRID_MAP[gridId]) {
        return { valid: true };
      }

      const parsed = this.parseGridId(gridId);
      const { startCol, startRow, endCol, endRow } = parsed;
      const { cols, rows } = GRID_CONFIG;

      // 检查范围
      if (startCol < 1 || startCol > cols || endCol < 1 || endCol > cols ||
          startRow < 1 || startRow > rows || endRow < 1 || endRow > rows) {
        return {
          valid: false,
          error: `Grid coordinates out of range (1-${cols} x 1-${rows}): ${gridId}`,
          corrected: `grid_${Math.floor(cols/2)}_${Math.floor(rows/2)}`,
        };
      }

      // 检查复合网格逻辑
      if (parsed.isComposite) {
        if (startCol > endCol || startRow > endRow) {
          // 自动修正
          const corrected = `grid_${Math.min(startCol, endCol)}_${Math.min(startRow, endRow)}_${Math.max(startCol, endCol)}_${Math.max(startRow, endRow)}`;
          return {
            valid: false,
            error: `Invalid composite grid order: ${gridId}`,
            corrected,
          };
        }
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: `Invalid grid ID format: ${gridId}`,
        corrected: `grid_${Math.floor(GRID_CONFIG.cols/2)}_${Math.floor(GRID_CONFIG.rows/2)}`,
      };
    }
  }

  // 计算网格元数据
  private calculateMetadata(gridId: GridId): GridMetadata {
    const cached = this.metadataCache.get(gridId);
    if (cached) return cached;

    const parsed = this.parseGridId(gridId);
    const { startCol, startRow, endCol, endRow } = parsed;
    const { cellSize } = GRID_CONFIG;

    // 计算像素范围
    const left = (startCol - 1) * cellSize;
    const top = (startRow - 1) * cellSize;
    const right = endCol * cellSize;
    const bottom = endRow * cellSize;

    const width = right - left;
    const height = bottom - top;
    const centerX = (left + right) / 2;
    const centerY = (top + bottom) / 2;
    const aspectRatio = width / height;

    // 根据网格大小确定适配规则
    const isSmallGrid = width < 180 || height < 180;
    const isLargeGrid = width > 600 || height > 600;

    const metadata: GridMetadata = {
      gridId,
      pixelRange: [left, top, right, bottom],
      aspectRatio,
      width,
      height,
      centerX,
      centerY,
      materialRule: isLargeGrid ? 'fill' : 'fit',
      textRule: {
        maxFontSize: isSmallGrid ? 16 : isLargeGrid ? 48 : 24,
        lineHeight: 1.2,
        autoWrap: true,
      },
      neighborCheck: true,
      animationSpeed: 0.3,
    };

    return metadata;
  }

  // 获取网格元数据（带缓存）
  getMetadata(gridId: GridId): GridMetadata {
    const validation = this.validateGridId(gridId);
    if (!validation.valid && validation.corrected) {
      console.warn(`[GridSystem] Auto-corrected grid ID: ${gridId} -> ${validation.corrected}`);
      return this.calculateMetadata(validation.corrected);
    }
    return this.calculateMetadata(gridId);
  }

  // 计算网格中心点
  getCenter(gridId: GridId): { x: number; y: number } {
    const metadata = this.getMetadata(gridId);
    return { x: metadata.centerX, y: metadata.centerY };
  }

  // 获取像素范围
  getPixelRange(gridId: GridId): PixelRange {
    const metadata = this.getMetadata(gridId);
    return metadata.pixelRange;
  }

  // 计算动画时长（基于跨网格数）
  calculateAnimationDuration(fromGrid: GridId | undefined, toGrid: GridId): number {
    if (!fromGrid) {
      return 0.8;
    }

    const from = this.parseGridId(fromGrid);
    const to = this.parseGridId(toGrid);

    // 计算曼哈顿距离
    const colDistance = Math.abs(to.startCol - from.startCol);
    const rowDistance = Math.abs(to.startRow - from.startRow);
    const totalGrids = colDistance + rowDistance;

    // 基础速度 + 距离因子
    const baseSpeed = 0.3;
    if (totalGrids <= 1) return baseSpeed;
    if (totalGrids <= 3) return 0.8;
    if (totalGrids <= 5) return 1.2;
    if (totalGrids <= 10) return 1.8;
    return 2.5;
  }

  // 获取所有网格标识（用于调试/展示）
  getAllGridIds(): GridId[] {
    const ids: GridId[] = [];
    const { cols, rows } = GRID_CONFIG;
    
    // 单网格
    for (let col = 1; col <= cols; col++) {
      for (let row = 1; row <= rows; row++) {
        ids.push(`grid_${col}_${row}`);
      }
    }
    
    // 特殊标识
    ids.push(...Object.keys(SPECIAL_GRID_MAP));
    return ids;
  }

  // 获取网格统计信息
  getGridStats(): { totalCells: number; cols: number; rows: number; cellSize: number } {
    const { cols, rows, cellSize } = GRID_CONFIG;
    return {
      totalCells: cols * rows,
      cols,
      rows,
      cellSize
    };
  }

  // 获取画布配置
  getCanvasConfig(): typeof CANVAS_CONFIG {
    return { ...CANVAS_CONFIG };
  }

  // 解析特殊标识
  resolveSpecialId(specialId: string): GridId {
    return SPECIAL_GRID_MAP[specialId] || specialId;
  }

  // 获取网格配置
  getGridConfig(): typeof GRID_CONFIG {
    return { ...GRID_CONFIG };
  }
  
  // 检查是否为复合网格（多网格区域）
  isCompositeGrid(gridId: GridId): boolean {
    try {
      const parsed = this.parseGridId(gridId);
      return parsed.isComposite;
    } catch {
      return false;
    }
  }
  
  // 获取网格面积（用于素材占用空间计算）
  getGridArea(gridId: GridId): number {
    const metadata = this.getMetadata(gridId);
    return metadata.width * metadata.height;
  }
}

// 单例实例
let gridSystemInstance: GridSystem | null = null;

export function getGridSystem(): GridSystem {
  if (!gridSystemInstance) {
    gridSystemInstance = new GridSystem();
  }
  return gridSystemInstance;
}

export function resetGridSystem(): void {
  gridSystemInstance = null;
}

// 向后兼容 - 导出旧的函数名
export const getGrid9x9System = getGridSystem;
export const resetGrid9x9System = resetGridSystem;
