// 共享类型定义 (Shared Types)
// 从 src/types/core.ts 提取核心类型并扩展，供所有模块使用

// 基础变换属性（支持 2D + 伪 3D）
export interface Transform {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  // 3D 空间扩展
  rotateX?: number;
  rotateY?: number;
  rotateZ?: number;
  depthZ?: number;
  skewX?: number;
  skewY?: number;
}

// 动画/特效预设元数据
export interface EffectPreset {
  id: string;
  name: string;
  category: 'entrance' | 'exit' | 'emphasis' | 'motion' | 'fx' | 'transition' | 'text';
  schema: EffectParamSchema[];
}

// 特效参数定义
export interface EffectParamSchema {
  key: string;
  label: string;
  type: 'number' | 'color' | 'boolean' | 'string';
  default: any;
  min?: number;
  max?: number;
  step?: number;
}

// 实例化的特效
export interface Effect {
  id: string;
  presetId: string;
  type: EffectPreset['category'];
  name: string;
  duration?: number;
  params: Record<string, any>;
}

// 资源类型
export interface Asset {
  id: string;
  name: string;
  type: 'video' | 'image' | 'audio' | 'sound_effect';
  url: string;
  thumbnail?: string;
  width?: number;
  height?: number;
  duration?: number;
  createdAt: number;
  source?: 'fixed' | 'imported';
  folderPath?: string;
  /** 音频波形峰值（0..1，按时间顺序，用于时间线渲染） */
  peaks?: number[];
}

// 配音数据
export interface VoiceOver {
  audioSource: string;
  audioDuration: number;
  voice: string;
  speed: number;
  emotion?: string;
  generatedAt: number;
  filePath?: string;
  linkedClipId?: string;
  referenceAudioName?: string;
}

// 文本数据
export interface TextData {
  content: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  backgroundColor?: string;
}

// 模板数据
export interface TemplateData {
  templateId: string;
  params: Record<string, any>;
}

// 关键帧动画
export type KeyframeEasing = 'linear' | 'ease_in' | 'ease_out' | 'ease_in_out' | 'hold';
export type KeyframeChannel = 'x' | 'y' | 'scale' | 'rotation' | 'opacity' | 'z' | 'rotateX' | 'rotateY';
export interface Keyframe {
  id: string;
  /** 片段内相对时间（秒） */
  time: number;
  value: number;
  easing: KeyframeEasing;
}

// ==================== 调色 ====================
/**
 * 片段级调色参数，全部可选；0 为中性。
 * 曝光/对比/饱和为倍率偏移(-1..1 映射到滤镜系数)，色温/色调/褪色通过混合层实现。
 */
export interface ColorGrading {
  /** 曝光 -1..1 */
  exposure?: number;
  /** 对比度 -1..1 */
  contrast?: number;
  /** 饱和度 -1..1（-1 为黑白） */
  saturation?: number;
  /** 色温 -100(冷)..100(暖) */
  temperature?: number;
  /** 色调 -100(绿)..100(品红) */
  tint?: number;
  /** 色相旋转 -180..180 度 */
  hueRotate?: number;
  /** 褪色/胶片感 0..1（黑位抬升近似） */
  fade?: number;
}

// ==================== 曲线变速 ====================
/** 变速控制点：t 为片段进度 0..1，value 为该点瞬时速度倍率 */
export interface SpeedPoint {
  t: number;
  value: number;
}


// 样式配置
export interface ClipStyle {
  opacity: number;
  zIndex: number;
}

// 轨道片段 (Clip) - 扩展版本
export interface Clip {
  id: string;
  assetId: string;
  trackId: string;
  type: 'video' | 'image' | 'audio' | 'text' | 'template';
  startTime: number;
  duration: number;
  offset: number;
  transform: Transform;
  style: ClipStyle;
  textData?: TextData;
  voiceOver?: VoiceOver;
  templateData?: TemplateData;
  effects?: Effect[];
  name: string;
  // 扩展属性（用于AI导演等高级功能）
  inPoint?: number;
  outPoint?: number;
  speed?: number;
  crop?: { x: number; y: number; width: number; height: number };
  opacity?: number;
  volume?: number;
  /** 音频淡入/淡出秒数（音频与视频音轨通用） */
  audioFadeIn?: number;
  audioFadeOut?: number;
  /** 调色参数（视觉片段生效，渲染在预设效果之下） */
  colorGrading?: ColorGrading;
  /**
   * 曲线变速控制点。存在时覆盖 clip.speed 的恒速语义：
   * 时间线窗口时长不变，源媒体消耗按速度曲线积分推进。
   */

  speedCurve?: SpeedPoint[];
  /** 用户关键帧（按通道组织，时间相对片段起点） */
  keyframes?: Partial<Record<KeyframeChannel, Keyframe[]>>;
  /** 蒙版配置（形状遮罩：矩形/圆形/心形/星形/三角形） */
  mask?: MaskConfig;
  /** 智能抠像配置（MediaPipe 人像分割） */
  chromaKey?: SmartMattingConfig;
}

// ==================== 蒙版系统 ====================
export type MaskShape = 'rectangle' | 'circle' | 'heart' | 'star' | 'triangle';

export interface MaskConfig {
  enabled: boolean;
  /** 蒙版形状 */
  shape: MaskShape;
  /** 中心点 X（占画面宽度百分比 0-100） */
  x: number;
  /** 中心点 Y（占画面高度百分比 0-100） */
  y: number;
  /** 宽度（占画面宽度百分比 5-200） */
  width: number;
  /** 高度（占画面高度百分比 5-200） */
  height: number;
  /** 旋转角度（度） */
  rotation: number;
  /** 羽化程度（0-100，映射到 SVG 高斯模糊 stdDeviation） */
  feather: number;
  /** 反转蒙版（挖空形状内部） */
  inverted: boolean;
}

// ==================== 智能抠像 ====================
export interface SmartMattingConfig {
  enabled: boolean;
  /** 分割模式：person = 人像抠像（MediaPipe selfie_multiclass） */
  mode: 'person';
  /** 蒙版边缘羽化（0-100） */
  feather: number;
  /** 置信度阈值（0-100）：低于该置信度的前景会被裁掉 */
  confidence: number;
  /** 抠像范围（0-100，正值收缩前景边缘，负值扩张） */
  expand: number;
}


export const DEFAULT_MASK_CONFIG: MaskConfig = {
  enabled: true,
  shape: 'circle',
  x: 50,
  y: 50,
  width: 60,
  height: 60,
  rotation: 0,
  feather: 0,
  inverted: false,
};

export const DEFAULT_SMART_MATTING_CONFIG: SmartMattingConfig = {
  enabled: true,
  mode: 'person',
  feather: 15,
  confidence: 50,
  expand: 0,
};

// 轨道 (Track)
export interface Track {
  id: string;
  type: 'video' | 'audio' | 'effect' | 'text';
  name: string;
  visible: boolean;
  locked: boolean;
}

// 项目 (Project)
export interface Project {
  id: string;
  name: string;
  width: number;
  height: number;
  duration: number;
  fps: number;
  tracks: Track[];
  clips: Record<string, Clip>;
  lastModified: number;
}

// UI 状态
export interface UIState {
  selectedClipId: string | null;
  currentTime: number;
  isPlaying: boolean;
  zoomLevel: number;
  isExporting: boolean;
  isExportModalOpen: boolean;
  copiedClip: Clip | null;
}

// 模块间通信接口

// 事件总线事件类型
export type ModuleEvent =
  | { type: 'CLIP_SELECTED'; payload: { clipId: string } }
  | { type: 'CLIP_UPDATED'; payload: { clip: Clip } }
  | { type: 'CLIP_ADDED'; payload: { clip: Clip } }
  | { type: 'CLIP_REMOVED'; payload: { clipId: string } }
  | { type: 'TRACK_ADDED'; payload: { track: Track } }
  | { type: 'TRACK_REMOVED'; payload: { trackId: string } }
  | { type: 'ASSET_ADDED'; payload: { asset: Asset } }
  | { type: 'ASSET_REMOVED'; payload: { assetId: string } }
  | { type: 'TIME_CHANGED'; payload: { time: number } }
  | { type: 'PLAY_STATE_CHANGED'; payload: { isPlaying: boolean } }
  | { type: 'EFFECT_APPLIED'; payload: { clipId: string; effect: Effect } }
  | { type: 'EFFECT_REMOVED'; payload: { clipId: string; effectId: string } }
  | { type: 'PROJECT_SAVED'; payload: { project: Project } }
  | { type: 'PROJECT_LOADED'; payload: { project: Project } };

// 模块状态接口
export interface ModuleState<T> {
  data: T;
  isLoading: boolean;
  error: string | null;
}

// 异步操作结果
export interface AsyncResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// 分页参数
export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 过滤器参数
export interface FilterParams {
  search?: string;
  types?: string[];
  dateRange?: [number, number];
}

// 渲染相关类型
export interface RenderConfig {
  width: number;
  height: number;
  fps: number;
  quality: 'low' | 'medium' | 'high' | 'ultra';
  format: 'mp4' | 'webm' | 'gif';
  codec?: string;
}

// 导出进度
export interface ExportProgress {
  stage: 'preparing' | 'rendering' | 'encoding' | 'finalizing' | 'completed' | 'error';
  progress: number; // 0-100
  currentFrame?: number;
  totalFrames?: number;
  message?: string;
}
