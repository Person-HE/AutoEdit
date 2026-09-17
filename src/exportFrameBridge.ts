// 帧同步桥：Puppeteer 导出管线驱动
// FrameDriver 每帧向页面写入 window.__currentFrame 并派发 framechange 事件；
// 本桥把帧号换算为项目时间写入 usePlayerStore，驱动预览渲染层逐帧摆姿势，
// 并在 React 提交完成后置 __frameRendered=true 供截图器等待。
// 浏览器正常使用时（无 Puppeteer）此桥不激活。
import { usePlayerStore } from './store/usePlayerStore';
import { useProjectStore } from './store/useProjectStore';

function isPuppeteerExport(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /HeadlessChrome/i.test(navigator.userAgent);
}

if (typeof window !== 'undefined' && isPuppeteerExport()) {
  let readyTimer: number | null = null;

  const applyFrame = (frame: number) => {
    const project = useProjectStore.getState().project;
    const fps = project?.fps || 30;
    const t = frame / fps;
    // 直接写 store：绕过 RAF 播放循环，精确单帧
    usePlayerStore.setState({ currentTime: t, isPlaying: false });
    // 等两轮 RAF：React 提交 + 浏览器合成
    if (readyTimer !== null) cancelAnimationFrame(readyTimer);
    readyTimer = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        (window as any).__frameRendered = true;
      });
    });
  };

  window.addEventListener('framechange', () => {
    const frame = (window as any).__currentFrame;
    if (typeof frame === 'number') applyFrame(frame);
  });

  // 导出页初始就绪标记（FrameDriver.waitForRender 也可能用于首帧等待）
  (window as any).__exportBridgeReady = true;
  console.log('[ExportFrameBridge] active — headless frame sync enabled');
}
