// Renderer 模块导出
// 注意：此模块仅导出浏览器安全的组件和钩子
// Node.js 专用模块（Puppeteer、FFmpeg）请通过动态导入使用

// Core
export { TimelineProvider, useTimeline, TimelineContext } from './core/TimelineContext';
export { SequenceProvider, useSequence, SequenceContext } from './core/SequenceContext';
export { default as compositionManager, CompositionManager } from './core/CompositionManager';
export { RenderProvider, useRender, useRenderConfig, RenderContext } from './core/RenderContext';

// Hooks
export { useCurrentFrame } from './hooks/useCurrentFrame';
export { useVideoConfig } from './hooks/useVideoConfig';
export { useInterpolate, interpolate } from './hooks/useInterpolate';
export { useSpring } from './hooks/useSpring';
export { useDelayRender } from './hooks/useDelayRender';

// Components
export { default as AbsoluteFill } from './components/AbsoluteFill';
export { default as Sequence } from './components/Sequence';
export { default as Composition } from './components/Composition';
export { default as VideoFrame } from './components/VideoFrame';

// Animation
export { interpolate as animInterpolate, createInterpolation } from './animation/interpolate';
export { spring as animSpring } from './animation/spring';
export { Easings as easings, getEasing } from './animation/easings';
export { stagger } from './animation/stagger';

// Preview (Browser-safe)
export { default as Player } from './preview/Player';
export { default as PlayerControls } from './preview/PlayerControls';
export { default as PlayerTimeline } from './preview/PlayerTimeline';

// Node.js 专用模块 - 请通过动态导入使用
// 以下模块仅在 Node.js 环境中可用，不能在浏览器中直接导入
// 
// 使用示例：
// const { VideoRenderer } = await import('./VideoRenderer');
// const { BrowserLauncher } = await import('./puppeteer/BrowserLauncher');
// const { FFmpegEncoder } = await import('./encoder/FFmpegEncoder');
// const { FrameCapture } = await import('./puppeteer/FrameCapture');
// const { EncodePipeline } = await import('./encoder/EncodePipeline');
