# 代码渲染成视频：架构、实现思路与代码规范

## 一、核心原理

### 1.1 根本思想

**"把视频的每一帧当作 React 的一次 render"**

Remotion 的核心洞察是：视频本质上是一系列按时间顺序排列的静态画面。如果能够：
1. 用 React 组件描述单帧画面
2. 按帧号驱动渲染
3. 逐帧捕获输出

就能用 Web 技术栈生成视频。

### 1.2 渲染流程

```
用户代码 (React组件)
       ↓
   帧号驱动
       ↓
 React Render (特定帧)
       ↓
 Canvas/DOM 截图
       ↓
  图片序列
       ↓
 FFmpeg 编码
       ↓
   视频文件
```

---

## 二、核心架构

### 2.1 三大模式

| 模式 | 用途 | 帧驱动方式 |
|------|------|------------|
| **预览模式** | 实时预览 | requestAnimationFrame |
| **渲染模式** | 生成视频 | Puppeteer 控制帧 |
| **Player 模式** | 嵌入播放 | 自行控制帧 |

### 2.2 核心 Context 架构

```
TimelineContext          ← 管理全局帧状态
    ↓
CompositionManager      ← 管理所有注册的"作品"
    ↓
SequenceContext         ← 管理时间偏移
    ↓
useCurrentFrame()       ← 最终 hook
```

### 2.3 组件层级

```
<Composition>           ← 注册作品入口
    ↓
<Sequence>             ← 时间偏移组件
    ↓
<AbsoluteFill>         ← 绝对定位容器
    ↓
用户组件                ← 实际内容
```

---

## 三、核心 API 实现原理

### 3.1 useCurrentFrame() - 获取当前帧

```typescript
// 简化实现
const useCurrentFrame = () => {
  const frame = useContext(TimelineContext).frame;
  const sequenceContext = useContext(SequenceContext);

  // 减去 Sequence 的时间偏移
  const contextOffset = sequenceContext?.cumulatedFrom ?? 0;
  return frame - contextOffset;
};
```

**关键点**：
- 帧号从 0 开始
- 在 Sequence 内部会自动减去偏移量
- 支持嵌套 Sequence

### 3.2 interpolate() - 插值动画

```typescript
const interpolate = (
  value: number,           // 输入值（通常是帧号）
  inputRange: [number, number],  // 输入范围 [0, 30]
  outputRange: [number, number], // 输出范围 [0, 1]
  options?: {
    extrapolate?: 'clamp' | 'extend' | 'identity';
    easing?: Function;
  }
): number => {
  const [inputMin, inputMax] = inputRange;
  const [outputMin, outputMax] = outputRange;

  // 归一化到 0-1
  let t = (value - inputMin) / (inputMax - inputMin);
  t = Math.max(0, Math.min(1, t)); // clamp

  // 应用缓动
  if (options?.easing) {
    t = options.easing(t);
  }

  // 映射到输出范围
  return outputMin + t * (outputMax - outputMin);
};

// 使用示例
const opacity = interpolate(frame, [0, 30], [0, 1], { extrapolate: 'clamp' });
// frame=0  → opacity=0
// frame=15 → opacity=0.5
// frame=30 → opacity=1
```

### 3.3 spring() - 弹性动画

```typescript
const spring = ({
  frame,
  fps = 30,
  config = {
    damping: 200,    // 阻尼（越大弹性越小）
    stiffness: 100,  // 刚度（越大运动越快）
    mass = 1,        // 质量
  }
}) => {
  // 简化的弹簧物理模型
  const omega = Math.sqrt(config.stiffness / config.mass);
  const zeta = config.damping / (2 * Math.sqrt(config.stiffness * config.mass));

  // 欠阻尼弹簧响应
  const t = frame / fps;
  const decay = Math.exp(-zeta * omega * t);
  const oscillation = Math.cos(Math.sqrt(1 - zeta * zeta) * omega * t);

  return 1 - decay * oscillation;
};
```

### 3.4 Sequence - 时间偏移

```typescript
const Sequence = ({ from = 0, durationInFrames, children }) => {
  const frame = useCurrentFrame(); // 获取全局帧
  const parentContext = useContext(SequenceContext);

  // 计算累积偏移
  const cumulatedFrom = (parentContext?.cumulatedFrom ?? 0) + (parentContext?.relativeFrom ?? 0);

  const contextValue = {
    cumulatedFrom,
    relativeFrom: from,
    durationInFrames,
  };

  // 只在序列时间范围内渲染
  const isVisible = frame >= cumulatedFrom + from &&
                    frame < cumulatedFrom + from + durationInFrames;

  if (!isVisible) return null;

  return (
    <SequenceContext.Provider value={contextValue}>
      {children}
    </SequenceContext.Provider>
  );
};
```

### 3.5 AbsoluteFill - 全屏容器

```typescript
const AbsoluteFill = ({ style, children }) => (
  <div style={{
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    ...style
  }}>
    {children}
  </div>
);
```

---

## 四、在其他项目中实现类似功能

### 4.1 不依赖 Remotion 的完整实现架构

```
┌─────────────────────────────────────────────────────────┐
│                    你的项目                               │
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   Timeline   │  │ Composition │  │  Sequence   │    │
│  │   Context   │  │  Manager    │  │  Context    │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
│         ↓               ↓               ↓              │
│  ┌─────────────────────────────────────────────────┐  │
│  │              useCurrentFrame()                    │  │
│  │              useVideoConfig()                      │  │
│  │              interpolate()                         │  │
│  │              spring()                             │  │
│  └─────────────────────────────────────────────────┘  │
│                         ↓                              │
│  ┌─────────────────────────────────────────────────┐  │
│  │              你的 React 组件                      │  │
│  │  (用上面的 hooks 描述动画)                        │  │
│  └─────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│                   渲染层 (Puppeteer)                      │
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   启动浏览器  │  │  注入 bundle │  │  逐帧截图   │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
│                         ↓                              │
│  ┌─────────────────────────────────────────────────┐  │
│  │              FFmpeg 编码                          │  │
│  └─────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 4.2 核心依赖

```json
{
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "puppeteer": "^21.0.0",
    "fluent-ffmpeg": "^2.1.0"
  }
}
```

### 4.3 实现代码

#### Step 1: Timeline Context

```typescript
// contexts/TimelineContext.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';

export type TimelineContextValue = {
  frame: number;
  setFrame: (frame: number) => void;
  fps: number;
  durationInFrames: number;
  playing: boolean;
  setPlaying: (playing: boolean) => void;
};

const TimelineContext = createContext<TimelineContextValue | null>(null);

export const TimelineProvider: React.FC<{
  fps?: number;
  durationInFrames?: number;
  children: React.ReactNode;
}> = ({ fps = 30, durationInFrames = 90, children }) => {
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);

  return (
    <TimelineContext.Provider value={{ frame, setFrame, fps, durationInFrames, playing, setPlaying }}>
      {children}
    </TimelineContext.Provider>
  );
};

export const useTimeline = () => {
  const ctx = useContext(TimelineContext);
  if (!ctx) throw new Error('useTimeline must be used within TimelineProvider');
  return ctx;
};
```

#### Step 2: Sequence Context

```typescript
// contexts/SequenceContext.tsx
import React, { createContext, useContext } from 'react';

export type SequenceContextValue = {
  cumulatedFrom: number;  // 累积偏移
  relativeFrom: number;   // 当前序列起始帧
  durationInFrames: number;
};

const SequenceContext = createContext<SequenceContextValue | null>(null);

export const useSequence = () => useContext(SequenceContext);

export const Sequence: React.FC<{
  from?: number;
  durationInFrames: number;
  children: React.ReactNode;
}> = ({ from = 0, durationInFrames, children }) => {
  const parent = useSequence();
  const { frame } = useTimeline();

  const cumulatedFrom = (parent?.cumulatedFrom ?? 0) + (parent?.relativeFrom ?? 0);

  const isVisible = frame >= cumulatedFrom + from &&
                    frame < cumulatedFrom + from + durationInFrames;

  if (!isVisible) return null;

  const value: SequenceContextValue = {
    cumulatedFrom,
    relativeFrom: from,
    durationInFrames,
  };

  return (
    <SequenceContext.Provider value={value}>
      {children}
    </SequenceContext.Provider>
  );
};
```

#### Step 3: Core Hooks

```typescript
// hooks/useCurrentFrame.ts
import { useTimeline } from '../contexts/TimelineContext';
import { useSequence } from '../contexts/SequenceContext';

export const useCurrentFrame = (): number => {
  const { frame } = useTimeline();
  const sequence = useSequence();

  const offset = sequence ? sequence.cumulatedFrom + sequence.relativeFrom : 0;
  return frame - offset;
};

// hooks/useVideoConfig.ts
import { useTimeline } from '../contexts/TimelineContext';

export const useVideoConfig = () => {
  const { fps, durationInFrames } = useTimeline();
  return { fps, durationInFrames };
};
```

#### Step 4: Animation Functions

```typescript
// utils/animation.ts
export const interpolate = (
  value: number,
  inputRange: [number, number],
  outputRange: [number, number],
  options: {
    extrapolate?: 'clamp' | 'extend';
    easing?: (t: number) => number;
  } = {}
): number => {
  const [inMin, inMax] = inputRange;
  const [outMin, outMax] = outputRange;

  let t = (value - inMin) / (inMax - inMin);

  if (options.extrapolate === 'clamp') {
    t = Math.max(0, Math.min(1, t));
  }

  if (options.easing) {
    t = options.easing(t);
  }

  return outMin + t * (outMax - outMin);
};

export const spring = ({
  frame,
  fps = 30,
  config = { damping: 200, stiffness: 100, mass: 1 }
}: {
  frame: number;
  fps?: number;
  config?: { damping: number; stiffness: number; mass?: number };
}): number => {
  const { damping, stiffness, mass = 1 } = config;
  const omega = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));

  const t = frame / fps;
  const decay = Math.exp(-zeta * omega * t);
  const freq = Math.sqrt(Math.max(0, 1 - zeta * zeta)) * omega;

  return 1 - decay * Math.cos(freq * t);
};

// 常用缓动函数
export const easings = {
  linear: (t: number) => t,
  easeIn: (t: number) => t * t,
  easeOut: (t: number) => t * (2 - t),
  easeInOut: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
};
```

#### Step 5: Layout Components

```typescript
// components/AbsoluteFill.tsx
import React from 'react';

export const AbsoluteFill: React.FC<{
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ style, children }) => (
  <div style={{
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    ...style,
  }}>
    {children}
  </div>
);
```

### 4.4 完整示例

```tsx
// MyVideo.tsx
import React from 'react';
import { AbsoluteFill } from './components/AbsoluteFill';
import { Sequence } from './contexts/SequenceContext';
import { useCurrentFrame, useVideoConfig } from './hooks/useCurrentFrame';
import { interpolate, spring, easings } from './utils/animation';

const AnimatedText: React.FC<{ text: string; color?: string }> = ({
  text,
  color = '#ffffff'
}) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [0, 30], [0, 1], {
    easing: easings.easeOut,
  });

  const scale = spring({ frame, config: { damping: 200, stiffness: 100 } });

  const translateY = interpolate(spring({ frame, config: { damping: 200 } }), [0, 1], [50, 0]);

  return (
    <div style={{
      opacity,
      transform: `scale(${scale}) translateY(${translateY}px)`,
      fontSize: 120,
      fontWeight: 700,
      color,
      fontFamily: 'system-ui, sans-serif',
      textShadow: '0 4px 20px rgba(0,0,0,0.3)',
    }}>
      {text}
    </div>
  );
};

export const MyVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#1a1a2e' }}>
      <Sequence from={0} durationInFrames={90}>
        <AnimatedText text="你好啊" color="#ffffff" />
      </Sequence>
      <Sequence from={90} durationInFrames={60}>
        <AnimatedText text="Welcome" color="#4fc3f7" />
      </Sequence>
    </AbsoluteFill>
  );
};
```

---

## 五、渲染引擎实现

### 5.1 Puppeteer 逐帧渲染

```typescript
// renderer/renderVideo.ts
import puppeteer from 'puppeteer';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';

interface RenderOptions {
  entryPoint: string;        // HTML/JS bundle 路径
  outputPath: string;        // 输出视频路径
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
  onProgress?: (frame: number) => void;
}

export const renderVideo = async (options: RenderOptions) => {
  const { entryPoint, outputPath, width, height, fps, durationInFrames, onProgress } = options;

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width, height });

  // 加载 bundle
  await page.goto(`file://${entryPoint}`, { waitUntil: 'networkidle0' });

  const framesDir = path.join(__dirname, 'temp_frames');
  // 创建临时目录存储帧

  for (let frame = 0; frame < durationInFrames; frame++) {
    // 设置当前帧
    await page.evaluate((f) => {
      (window as any).__currentFrame = f;
      // 触发重新渲染
      window.dispatchEvent(new Event('framechange'));
    }, frame);

    // 等待渲染完成
    await page.waitForFunction(
      () => (window as any).__frameRendered === true,
      { timeout: 5000 }
    ).catch(() => {});

    // 截图
    await page.screenshot({
      path: path.join(framesDir, `frame_${String(frame).padStart(5, '0')}.png`),
      type: 'png',
    });

    onProgress?.(frame);
  }

  await browser.close();

  // FFmpeg 编码
  await encodeToVideo(framesDir, outputPath, fps, width, height);
};

const encodeToVideo = (
  framesDir: string,
  outputPath: string,
  fps: number,
  width: number,
  height: number
): Promise<void> => {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(path.join(framesDir, 'frame_%05d.png'))
      .inputFPS(fps)
      .outputOptions([
        `-vf scale=${width}:${height}`,
        '-c:v libx264',
        '-pix_fmt yuv420p',
        '-crf 23',
      ])
      .output(outputPath)
      .on('end', resolve)
      .on('error', reject)
      .run();
  });
};
```

### 5.2 React 端的帧驱动

```typescript
// 在 React 端，需要监听帧变化并触发重渲染

// 方式1: 使用 useEffect + state
const FrameDriver: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const handleFrameChange = () => {
      setFrame((window as any).__currentFrame ?? 0);
    };

    window.addEventListener('framechange', handleFrameChange);
    return () => window.removeEventListener('framechange', handleFrameChange);
  }, []);

  return <>{children}</>;
};

// 方式2: 使用 React 外部状态
// 在 Puppeteer 端修改 window 对象，React 端用 useSyncExternalStore 同步
```

---

## 六、Player 播放器实现

### 6.1 预览播放器

```typescript
// components/Player.tsx
import React, { useEffect, useRef, useState } from 'react';
import { TimelineProvider } from '../contexts/TimelineContext';

export const Player: React.FC<{
  component: React.FC;
  durationInFrames: number;
  fps?: number;
  width?: number;
  height?: number;
}> = ({ component: Component, durationInFrames, fps = 30, width = 1920, height = 1080 }) => {
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const rafRef = useRef<number>();

  useEffect(() => {
    if (!playing) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    let lastTime = performance.now();

    const tick = (currentTime: number) => {
      const delta = currentTime - lastTime;
      const framesToAdvance = Math.floor((delta / 1000) * fps);

      if (framesToAdvance > 0) {
        lastTime = currentTime;
        setFrame(f => {
          const next = f + framesToAdvance;
          return next >= durationInFrames ? 0 : next; // 循环
        });
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [playing, fps, durationInFrames]);

  return (
    <TimelineProvider fps={fps} durationInFrames={durationInFrames}>
      {/* 内部 Provider 设置 frame 和 playing */}
      <div style={{ width, height, position: 'relative' }}>
        <Component />
      </div>
    </TimelineProvider>
  );
};
```

---

## 七、关键设计模式

### 7.1 Context 注入模式

所有状态通过 Context 向下传递，组件无需关心全局状态：

```tsx
<TimelineProvider fps={30} durationInFrames={90}>
  <CompositionManager>
    <Composition id="video1" component={Video1} />
    <Composition id="video2" component={Video2} />
  </CompositionManager>
</TimelineProvider>
```

### 7.2 延迟渲染模式

处理异步资源（图片、视频加载）：

```typescript
const { delayRender, continueRender } = useDelayRender();

useEffect(() => {
  const handle = delayRender('Loading image...');

  img.onload = () => continueRender(handle);
  img.onerror = () => continueRender(handle);

  return () => continueRender(handle);
}, []);
```

### 7.3 资源注册模式

统一管理媒体资源：

```typescript
const RenderAssetManager: React.FC = ({ children }) => {
  const [assets, setAssets] = useState<RenderAsset[]>([]);

  const registerAsset = (asset: RenderAsset) => {
    setAssets(prev => [...prev, asset]);
  };

  const unregisterAsset = (id: string) => {
    setAssets(prev => prev.filter(a => a.id !== id));
  };

  return (
    <RenderAssetContext.Provider value={{ assets, registerAsset, unregisterAsset }}>
      {children}
    </RenderAssetContext.Provider>
  );
};
```

---

## 八、与 Remotion 代码规范的对比

### 8.1 你自己的项目应该有的结构

```
my-video-engine/
├── src/
│   ├── contexts/
│   │   ├── TimelineContext.tsx    ← 核心：帧状态管理
│   │   ├── SequenceContext.tsx    ← 核心：时间偏移
│   │   ├── CompositionContext.tsx ← 核心：作品注册
│   │   └── index.ts
│   ├── hooks/
│   │   ├── useCurrentFrame.ts     ← 核心：获取帧号
│   │   ├── useVideoConfig.ts      ← 核心：获取配置
│   │   ├── useDelayRender.ts      ← 核心：延迟渲染
│   │   └── index.ts
│   ├── components/
│   │   ├── AbsoluteFill.tsx       ← 布局组件
│   │   ├── Sequence.tsx           ← 时间组件
│   │   ├── Composition.tsx        ← 注册组件
│   │   └── index.ts
│   ├── utils/
│   │   ├── interpolate.ts         ← 动画核心
│   │   ├── spring.ts              ← 弹性动画
│   │   ├── easings.ts             ← 缓动函数
│   │   └── index.ts
│   ├── Video.tsx                  ← 入口
│   └── index.ts
├── renderer/
│   ├── browser.ts                 ← Puppeteer 封装
│   ├── capture.ts                 ← 帧捕获
│   ├── encode.ts                  ← FFmpeg 编码
│   └── index.ts
└── package.json
```

### 8.2 核心区别

| 方面 | Remotion | 你自己的实现 |
|------|----------|--------------|
| 状态管理 | React Context + 大量内部优化 | 基础版只需 Context |
| 渲染 | Puppeteer + Webpack/Rspack | 可用 Puppeteer + Vite |
| 类型安全 | 完整的 TypeScript | 可选 TypeScript |
| 性能优化 | 预渲染、并行、缓存 | 基础版可省略 |
| SSR | 支持 | 可选支持 |

---

## 九、快速开始模板

### 9.1 最小可用版本

只需要这些文件就能实现"代码渲染成视频"：

```tsx
// 1. TimelineContext.tsx
import React, { createContext, useContext, useState } from 'react';

export const TimelineContext = createContext<{
  frame: number;
  setFrame: (f: number) => void;
}>({ frame: 0, setFrame: () => {} });

export const useTimeline = () => useContext(TimelineContext);

// 2. interpolate.ts
export const interpolate = (v: number, i: [number,number], o: [number,number]) => {
  let t = (v - i[0]) / (i[1] - i[0]);
  t = Math.max(0, Math.min(1, t));
  return o[0] + t * (o[1] - o[0]);
};

// 3. App.tsx
import React, { useState } from 'react';
import { TimelineContext } from './TimelineContext';
import { interpolate } from './interpolate';

const MyVideo = () => {
  const { frame } = React.useContext(TimelineContext);
  const opacity = interpolate(frame, [0, 30], [0, 1]);
  return <div style={{ opacity, fontSize: 100 }}>Hello</div>;
};

const App = () => {
  const [frame, setFrame] = useState(0);
  return (
    <TimelineContext.Provider value={{ frame, setFrame }}>
      <div style={{ width: 1920, height: 1080 }}>
        <MyVideo />
      </div>
    </TimelineContext.Provider>
  );
};

// 4. renderer.ts
import puppeteer from 'puppeteer';
// 启动浏览器 -> 加载 App -> 逐帧截图 -> FFmpeg 编码
```

---

## 十、总结

### 核心要点

1. **帧驱动渲染**：用帧号控制动画，而非时间
2. **Context 传递状态**：避免 prop drilling
3. **插值函数**：所有动画的本质
4. **Sequence 组合**：复杂时间编排的基础
5. **浏览器截图**：实现跨平台渲染

### 最小知识集

| 概念 | 作用 |
|------|------|
| `useCurrentFrame()` | 获取当前帧号 |
| `interpolate()` | 数值插值 |
| `spring()` | 弹性动画 |
| `Sequence` | 时间偏移 |
| `AbsoluteFill` | 全屏容器 |
| Puppeteer | 浏览器渲染 |
| FFmpeg | 视频编码 |

掌握这些，你就能实现一个类 Remotion 的视频渲染引擎。
