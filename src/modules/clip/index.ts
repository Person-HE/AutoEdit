// Clip 模块导出
export type {
  ClipType,
  ValidatedTransform,
  TransformValidationError,
  ClipFactoryConfig,
  ClipFactoryConfigBase,
  TextClipConfig,
  VideoClipConfig,
  AudioClipConfig,
  TemplateClipConfig,
  ClipTimeRange,
  OverlapResult,
  EffectApplicationPhase,
  AppliedTransform,
  ClipOperation,
  ClipState,
  IClipManager
} from './ClipTypes';

export {
  CLIP_TYPES,
  TRACK_CLIP_COMPATIBILITY,
  TRANSFORM_CONSTRAINTS,
  createTransform,
  clampTransform,
  ClipFactory,
  getClipTimeRange,
  timeRangesOverlap,
  timeRangesContain,
  mergeOverlappingRanges,
  ClipOverlapDetector,
  EFFECT_APPLICATION_ORDER,
  sortEffectsByOrder
} from './ClipTypes';

export { default as ClipManager } from './ClipManager';
export { ClipManager as ClipManagerClass } from './ClipManager';
