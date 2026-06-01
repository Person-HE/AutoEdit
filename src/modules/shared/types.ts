// 共享类型定义 (Shared Types)
// 从 src/types/core.ts 提取核心类型并扩展，供所有模块使用

// 基础变换属性
export interface Transform {
  x: number;
  y: number;
  scale: number;
  rotation: number;
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
}

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
