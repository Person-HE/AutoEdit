# NanoEdit Pro 预设开发完整指南（新架构版）

> 本文档提供详细的预设开发指导，确保您能够在新架构下开发出丝滑、流畅且符合预期的动画效果，并正确适配图片和视频素材。

---

## 目录

1. [架构概览](#架构概览)
2. [快速开始](#快速开始)
3. [核心概念](#核心概念)
4. [PresetRegistry API](#presetregistry-api)
5. [动画引擎核心](#动画引擎核心)
6. [EasingLibrary 缓动函数库](#easinglibrary-缓动函数库)
7. [GPU加速规则](#gpu加速规则)
8. [预设类型详解（84个完整版）](#预设类型详解84个完整版)
9. [开发规范（重要）](#开发规范重要)
10. [在新架构中创建预设](#在新架构中创建预设)
11. [预设示例](#预设示例)
12. [常见问题](#常见问题)

---

## 架构概览

### 新模块化结构

```
src/modules/preset/
├── PresetTypes.ts                # 类型定义（AnimationEffect, EffectRenderMode等）
├── PresetRegistry.ts             # 预设注册表（单例模式）
└── core/
    ├── EasingLibrary.ts          # 45+ 缓动函数库
    ├── AnimationEngine.ts        # 动画引擎核心
    ├── SpringPhysics.ts          # 弹簧物理系统
    ├── GPURenderer.ts            # GPU加速渲染器
    └── TimelineDriver.ts         # 时间轴驱动器（RAF）

src/engine/presets/               # 保留旧路径兼容
├── types.ts                      # 旧类型定义
├── entrance/                     # 进场动画
├── exit/                         # 出场动画
├── emphasis/                     # 强调动画
├── motion/                       # 移位动画
├── fx/                           # 视觉特效
├── transition/                   # 转场动画
└── text/                         # 文字特效

src/modules/shared/
└── types.ts                      # 共享类型定义（Transform等）
```

### 关键变更

| 旧路径/类型 | 新路径/类型 | 说明 |
|------------|-----------|------|
| `src/engine/presets/` | `src/modules/preset/` | 预设核心模块 |
| `PresetDefinition` | `AnimationEffect` | 新增renderMode/reactRender/gpuSafeProps |
| 无 | `EffectRenderMode` | 渲染模式枚举（CANVAS_2D/REACT/HYBRID） |
| 简单的apply函数 | 完整的动画引擎 | 支持stagger/timeline/spring/GPU加速 |

---

## 快速开始

### 创建第一个预设

```typescript
// src/modules/presets/entrance/myFadeIn.ts
import { AnimationEffect, EffectRenderMode } from '../PresetTypes';
import { getEasing } from '../core/EasingLibrary';

export const myFadeIn: AnimationEffect = {
  id: 'entrance_my_fade_in',
  name: '我的淡入效果',
  category: 'entrance',
  renderMode: EffectRenderMode.CANVAS_2D,
  schema: [
    { key: 'scaleFrom', label: '起始缩放', type: 'number', default: 0.8, min: 0.1, max: 1.5, step: 0.05 }
  ],
  gpuSafeProps: ['transform', 'opacity'],  // 声明GPU安全属性

  apply: (progress, params, currentTransform) => {
    // 1. 参数边界保护（必须）
    const scaleFrom = Math.max(0.1, Math.min(1.5, params.scaleFrom || 0.8));

    // 2. 进度边界保护（必须）
    const p = Math.max(0, Math.min(1, progress));

    // 3. 应用缓动函数（使用新EasingLibrary）
    const eased = getEasing('easeOutQuad')(p);

    // 4. 计算变换值，确保 scale > 0, opacity > 0
    const scale = scaleFrom + (1 - scaleFrom) * eased;

    return {
      transform: {
        ...currentTransform,
        scale: Math.max(0.001, currentTransform.scale * scale)
      },
      opacity: Math.max(0.01, eased)
    };
  }
};
```

### 注册预设到注册表

```typescript
// src/modules/preset/index.ts
import presetRegistry from './PresetRegistry';
import { myFadeIn } from './presets/entrance/myFadeIn';

// 注册到全局注册表（单例模式）
presetRegistry.register(myFadeIn);

export { presetRegistry };
```

---

## 核心概念

### AnimationEffect 接口（替代旧的PresetDefinition）

**文件位置**: `src/modules/preset/PresetTypes.ts`

```typescript
interface AnimationEffect extends Omit<LegacyPresetDefinition, 'apply'> {
  id: string;                      // 唯一标识符，如 'entrance_fade_in'
  name: string;                    // 显示名称，如 '淡入 (Fade In)'
  category: PresetCategory;        // 预设分类
  renderMode: EffectRenderMode;    // 渲染模式（新增！）
  schema: EffectParamSchema[];     // 可调参数定义
  apply: ApplyFunction;            // 核心动画算法
  reactRender?: (props: ReactEffectProps) => React.ReactElement;  // React渲染（可选）
  gpuSafeProps: string[];          // GPU安全属性列表（新增！）
}
```

### EffectRenderMode 枚举（新增）

```typescript
enum EffectRenderMode {
  CANVAS_2D = 'canvas2d',   // Canvas 2D渲染模式
  REACT = 'react',          // React组件渲染模式
  HYBRID = 'hybrid'         // 混合模式（两者都支持）
}
```

### PresetCategory 类型

```typescript
type PresetCategory =
  | 'entrance'     // 进场动画
  | 'exit'         // 出场动画
  | 'emphasis'     // 强调动画
  | 'motion'       // 移位动画
  | 'fx'           // 视觉特效
  | 'transition'   // 转场动画
  | 'text';        // 文字特效
```

### ApplyFunction 签名

```typescript
type ApplyFunction = (
  progress: number,              // 0-1 的进度值
  params: any,                   // 用户调整的参数
  currentTransform: Transform,   // 当前变换状态
  ctx?: CanvasRenderingContext2D // Canvas 上下文（可选）
) => {
  transform: Transform;          // 新的变换状态
  opacity: number;               // 新的透明度 (0-1)
  filter?: string;               // 可选的 CSS 滤镜
};
```

### Transform 接口（来自共享类型）

```typescript
// 文件位置: src/modules/shared/types.ts
interface Transform {
  x: number;        // X 轴位移（像素）
  y: number;        // Y 轴位移（像素）
  rotation: number; // 旋转角度（度）
  scale: number;    // 缩放比例（1 = 原始大小）
}
```

### EffectParamSchema 参数定义

```typescript
interface EffectParamSchema {
  key: string;      // 参数键名
  label: string;    // 显示标签
  type: 'number' | 'boolean' | 'color';
  default: any;     // 默认值
  min?: number;     // 最小值（number 类型）
  max?: number;     // 最大值（number 类型）
  step?: number;    // 步长（number 类型）
}
```

### ReactEffectProps（React模式支持）

```typescript
interface ReactEffectProps {
  progress: number;
  params: Record<string, any>;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
```

---

## PresetRegistry API

### PresetRegistry 类

**文件位置**: `src/modules/preset/PresetRegistry.ts`

> **特点**: 单例模式（Singleton），全局唯一实例。

#### 核心方法

##### register()

注册预设到全局注册表：

```typescript
import presetRegistry from '@/modules/preset/PresetRegistry';
import { AnimationEffect } from '@/modules/preset/PresetTypes';

const myPreset: AnimationEffect = { /* ... */ };

presetRegistry.register(myPreset);
// 自动按category分组存储
```

##### get()

通过ID获取预设：

```typescript
const preset = presetRegistry.get('entrance_fade_in');
if (preset) {
  console.log('预设名称:', preset.name);
  console.log('渲染模式:', preset.renderMode);
}
// 返回: AnimationEffect | undefined
```

##### getByCategory()

按分类获取预设列表：

```typescript
const entrancePresets = presetRegistry.getByCategory('entrance');
// 返回: AnimationEffect[]
console.log(`进场动画数量: ${entrancePresets.length}`);
```

##### getAll()

获取全部预设：

```typescript
const allPresets = presetRegistry.getAll();
// 返回: AnimationEffect[]
console.log(`总预设数量: ${allPresets.length}`);
```

##### findByName()

通过名称模糊搜索：

```typescript
const result = presetRegistry.findByName('fade');
// 返回第一个匹配的预设（不区分大小写）
```

##### count（getter属性）

获取预设总数：

```typescript
const total = presetRegistry.count;
// 返回: number（等同于 presets.size）
```

##### 其他实用方法

```typescript
// 检查是否存在
const exists = presetRegistry.has('entrance_fade_in');

// 获取所有分类列表
const categories = presetRegistry.getCategories();
// ['entrance', 'exit', 'emphasis', 'motion', 'fx', 'transition', 'text']

// 注销预设
presetRegistry.unregister('my_preset_id');

// 清空所有预设
presetRegistry.clear();

// 获取注册表项（包含渲染函数）
const items = presetRegistry.getRegistryItems();
// 返回: PresetRegistryItem[]
// 每个 item 包含: { preset: AnimationEffect, renderFn: PresetRenderFn }
```

### 使用示例

```typescript
import presetRegistry from '@/modules/preset/PresetRegistry';

// 1. 批量注册预设
import { fadeIn, bounceIn, slideInLeft } from './presets/entrance';
presetRegistry.register(fadeIn);
presetRegistry.register(bounceIn);
presetRegistry.register(slideInLeft);

// 2. 查询和使用
const allEntrance = presetRegistry.getByCategory('entrance');
allEntrance.forEach(preset => {
  console.log(`${preset.name} (${preset.id})`);
});

// 3. 应用预设
const preset = presetRegistry.get('entrance_fade_in');
if (preset) {
  const result = preset.apply(
    0.5,                          // progress: 50%
    { scaleFrom: 0.8 },           // params
    { x: 0, y: 0, scale: 1, rotation: 0 },  // currentTransform
  );
  console.log('变换结果:', result.transform);
  console.log('透明度:', result.opacity);
}

// 4. 统计信息
console.log(`已注册 ${presetRegistry.count} 个预设`);
console.log('分类:', presetRegistry.getCategories());
```

---

## 动画引擎核心

### AnimationEngine 类

**文件位置**: `src/modules/preset/core/AnimationEngine.ts`

> **说明**: 提供完整的动画控制能力，包括单个动画、交错动画、时间轴编排等。

#### 核心 API

##### animate()

创建并播放单个动画：

```typescript
import { AnimationEngine } from '@/modules/preset/core/AnimationEngine';

const controller = AnimationEngine.animate({
  target: { x: 0, y: 0, scale: 1, opacity: 1 },
  to: { x: 100, y: 200, scale: 1.5, opacity: 0 },
  duration: 1,                    // 动画时长（秒）
  easing: 'easeOutCubic',          // 缓动函数名或函数
  delay: 0.5,                      // 延迟时间（秒）
  loop: false,                     // 是否循环
  yoyo: false,                     // 是否往返
  onUpdate: (values, progress) => {
    // 每帧更新回调
    console.log('当前值:', values);
    console.log('进度:', progress);
  },
  onComplete: (values) => {
    // 动画完成回调
    console.log('动画完成:', values);
  },
  gpuAccelerated: true             // 启用GPU加速（默认true）
});
```

**返回的控制器接口**:

```typescript
interface AnimationController<T> {
  id: string;
  play(): void;                   // 播放
  pause(): void;                  // 暂停
  resume(): void;                 // 恢复
  stop(): void;                   // 停止并清理
  seek(progress: number): void;   // 跳转到指定进度(0-1)
  getCurrentValues(): T;          // 获取当前值
  getProgress(): number;           // 获取当前进度
  isPlaying(): boolean;            // 是否正在播放
  dispose(): void;                 // 销毁释放资源
}
```

##### stagger()

创建交错动画（依次延迟启动多个动画）：

```typescript
const targets = [
  { x: 0, y: 0, scale: 1 },
  { x: 0, y: 100, scale: 1 },
  { x: 0, y: 200, scale: 1 },
];

const controllers = AnimationEngine.stagger(targets, {
  to: { x: 200, scale: 1.2 },
  duration: 0.6,
  easing: 'easeOutBack',
  stagger: 0.1,                    // 每个元素间隔0.1秒
  from: 'start',                   // 从开头开始 ('start'|'end'|'center'|'edges')
  onUpdate: (values, progress) => {
    // 更新UI...
  }
});
```

**stagger选项详解**:

```typescript
interface StaggerOptions<T> {
  targets: T[];                    // 目标对象数组
  options: {
    stagger?: number | ((index: number, total: number) => number);  // 间距或自定义函数
    from?: 'start' | 'end' | 'center' | 'edges' | number;         // 起始方向
    // ... 其他AnimationOptions
  };
}
```

##### timeline()

创建时间轴（编排多个动画序列）：

```typescript
const tl = AnimationEngine.timeline();

tl.add(target1, {
  to: { x: 100 },
  duration: 0.5,
  easing: 'easeOutQuad'
})
.to(target2, {
  to: { scale: 1.5 },
  duration: 0.3,
  easing: 'easeOutBack'
})
.fromTo(target3,
  { x: -200 },                     // from
  { x: 200, scale: 1.2 },         // to
  { duration: 0.8, easing: 'easeInOutCubic' }
)
.delay(0.2)                        // 延迟0.2秒
.add(target4, {
  to: { opacity: 0 },
  duration: 0.4,
  easing: 'easeInQuad'
});

// 控制时间轴
tl.play();
// tl.pause();
// tl.stop();
// tl.seek(0.5);  // 跳转到50%位置
```

##### globalPause() / globalResume()

全局暂停/恢复所有动画：

```typescript
// 暂停所有正在运行的动画
AnimationEngine.globalPause();

// 恢复所有暂停的动画
AnimationEngine.globalResume();
```

##### 其他实用方法

```typescript
// 获取当前活动动画数量
const count = AnimationEngine.getActiveAnimationsCount();

// 获取性能指标
const metrics = AnimationEngine.getPerformanceMetrics();
// { fps: number, frameTime: number, ... }

// 获取WillChange管理器（用于优化GPU合成层）
const willChangeManager = AnimationEngine.getWillChangeManager();

// 清理所有动画和资源
AnimationEngine.disposeAll();
```

### TimelineDriver 类

**文件位置**: `src/modules/preset/core/TimelineDriver.ts`

> **说明**: 底层RAF驱动器，为AnimationEngine提供精确的时间控制。

```typescript
interface TimelineDriverConfig {
  duration: number;               // 总时长（秒）
  autoPlay?: boolean;             // 是否自动播放
  loop?: boolean;                 // 是否循环
  yoyo?: boolean;                 // 是否往返
}

class TimelineDriver {
  play(): void;
  pause(): void;
  stop(): void;
  seekProgress(progress: number): void;
  isPlayingNow(): boolean;
  getProgress(): number;
  setCallbacks(callbacks: {
    onFrame: (time: number) => void;
    onComplete: () => void;
  }): void;
  dispose(): void;
}
```

### SpringPhysics 弹簧系统

**文件位置**: `src/modules/preset/core/SpringPhysics.ts`

> **说明**: 提供真实的弹簧物理模拟，用于自然流畅的动画效果。

```typescript
interface SpringConfig {
  stiffness?: number;             // 刚度（默认120）
  damping?: number;               // 阻尼（默认14）
  mass?: number;                  // 质量（默认1）
  precision?: number;             // 精度（默认0.01）
  velocity?: number;              // 初始速度
}

// 创建弹簧配置
const config = createSpringConfig({
  stiffness: 200,
  damping: 20,
  mass: 1
});

// 计算弹簧动画值
const result: SpringResult = springAnimation(
  frame,           // 当前帧号
  60,              // FPS
  config,          // 弹簧配置
  fromValue,       // 起始值
  toValue          // 结束值
);

// 返回值
interface SpringResult {
  value: number;    // 当前值
  velocity: number; // 当前速度
  isResting: boolean; // 是否静止
}
```

### GPURenderer GPU加速渲染器

**文件位置**: `src/modules/preset/core/GPURenderer.ts`

> **说明**: 验证和管理GPU合成层，确保动画性能最优。

#### validateAnimationProps()

验证动画属性是否可以GPU加速：

```typescript
import { validateAnimationProps } from '@/modules/preset/core/GPURenderer';

const validation = validateAnimationProps({
  transform: true,
  opacity: true,
  backgroundColor: false  // 这个不能GPU加速
});

console.log(validation.valid);           // false
console.log(validation.unsafeProps);     // ['backgroundColor']
console.log(validation.safeProps);       // ['transform', 'opacity']
```

#### WillChangeManager

自动管理`will-change`CSS属性以优化GPU合成层：

```typescript
const manager = AnimationEngine.getWillChangeManager();

// 会自动为GPU安全的属性添加will-change
// 并在动画结束后移除，避免内存泄漏
```

#### PerformanceMonitor

监控动画性能：

```typescript
const metrics = AnimationEngine.getPerformanceMetrics();
// {
//   fps: 60,
//   frameTime: 16.67,
//   droppedFrames: 0,
//   averageFrameTime: 16.5
// }

// 当FPS低于阈值时会触发警告
```

---

## EasingLibrary 缓动函数库

**文件位置**: `src/modules/preset/core/EasingLibrary.ts`

> **说明**: 提供45+种缓动函数，是业界最完整的缓动函数集合之一。

### 函数分类（15组 × 3种变体 = 45+）

#### 1. Power系列 (power0 - power4)

```typescript
import { power0, power1, power2, power3, power4 } from '@/modules/preset/core/EasingLibrary';

// 每个都有 in / out / inOut 三种变体
power0.in(t)    // 线性（等同 linear）
power0.out(t)
power0.inOut(t)

power1.in(t)    // 二次方 (quad)
power1.out(t)
power1.inOut(t)

power2.in(t)    // 三次方 (cubic)
power2.out(t)   // 最常用！
power2.inOut(t)

power3.in(t)    // 四次方 (quart)
power3.out(t)
power3.inOut(t)

power4.in(t)    // 五次方 (quint)
power4.out(t)
power4.inOut(t)
```

#### 2. 标准别名（推荐使用）

```typescript
import {
  quad, cubic, quart, quint,  // 多项式
  sine, circ, expo,            // 特殊数学
  elastic, back, bounce,       // 效果类
  rough, stepped               // 特殊效果
} from '@/modules/preset/core/EasingLibrary';

// 二次缓动
quad.in(t)
quad.out(t)      // easeOutQuad
quad.inOut(t)    // easeInOutQuad

// 三次缓动
cubic.in(t)      // easeInCubic
cubic.out(t)     // easeOutCubic ← 最常用
cubic.inOut(t)   // easeInOutCubic

// 四次缓动
quart.in(t)
quart.out(t)
quart.inOut(t)

// 五次缓动
quint.in(t)
quint.out(t)
quint.inOut(t)
```

#### 3. 正弦/圆形/指数

```typescript
sine.in(t)       // 正弦缓入
sine.out(t)      // 正弦缓出
sine.inOut(t)    // 正弦缓入缓出

circ.in(t)       // 圆形缓入
circ.out(t)      // 圆形缓出
circ.inOut(t)    // 圆形缓入缓出

expo.in(t)       // 指数缓入
expo.out(t)      // 指数缓出
expo.inOut(t)    // 指数缓入缓出
```

#### 4. 弹性/回弹/弹跳（带参数化）

```typescript
// 弹性缓动（可配置振幅和周期）
elastic.in(1, 0.3)     // (amplitude=1, period=0.3)
elastic.out(1, 0.3)
elastic.inOut(1, 0.3)

// 回弹缓动（可配置过冲量）
back.in(1.70158)       // overshoot=1.70158
back.out(1.70158)
back.inOut(1.70158)

// 弹跳缓动
bounce.in(t)
bounce.out(t)          // 最常用的弹跳效果
bounce.inOut(t)
```

#### 5. 特殊效果

```typescript
// 粗糙/噪声效果（可配置强度和种子）
rough(1, 0)            // (strength=1, seed=0)

// 阶梯效果（可配置步数）
stepped(10)            // 10级阶梯

// 线性和无动画
linear(t)              // 线性（恒等函数）
none(t)                // 无动画（阶跃函数：t>=1 ? 1 : 0）
```

### getEasing() - 通过名称获取缓动函数

```typescript
import { getEasing } from '@/modules/preset/core/EasingLibrary';

// 通过字符串名称获取
const fn = getEasing('easeOutCubic');  // 返回 cubic.out
const fn2 = getEasing('bounce.out');   // 返回 bounce.out
const fn3 = getEasing('unknown');      // 返回 linear（fallback）

// 使用
const eased = getEasing('easeOutBack')(progress);
```

### resolveEasing() - 智能解析

```typescript
import { resolveEasing } from '@/modules/preset/core/EasingLibrary';

// 支持多种输入类型
resolveEasing(undefined);              // → linear
resolveEasing(null);                   // → linear
resolveEasing('easeOutCubic');         // → cubic.out 函数
resolveEasing(cubic.out);              // → 直接返回函数
resolveEasing((t) => t * t);           // → 直接返回自定义函数
```

### Easings 全局字典

```typescript
import { Easings } from '@/modules/preset/core/EasingLibrary';

// 通过点号访问所有缓动函数
Easings['easeOutQuad']           // quad.out
Easings['cubic.out']             // cubic.out
Easings['elastic.out']           // elastic.out
Easings['back.inOut']            // back.inOut

// 兼容旧API
Easings.easeInQuad               // quad.in
Easings.easeOutCubic             // cubic.out
Easings.easeOutElastic           // elastic.out
Easings.easeOutBack              // back.out
Easings.easeOutBounce            // bounce.out
// ... 共45+个入口
```

### 缓动函数选择指南

| 缓动函数 | 效果 | 适用场景 |
|---------|------|---------|
| `easeOutQuad` | 开始快，结束慢 | 进场动画 |
| `easeInQuad` | 开始慢，结束快 | 出场动画 |
| `easeOutCubic` | 平滑减速 | 滑入效果 |
| `easeInCubic` | 平滑加速 | 滑出效果 |
| `easeOutQuart` | 强烈减速 | 强调进入 |
| `easeOutElastic` | 弹性效果 | 弹跳进入 |
| `easeOutBack` | 回弹效果 | 强调效果 |
| `easeInOutCubic` | 两头慢，中间快 | 转场动画 |
| `bounce.out` | 弹跳效果 | 活泼动画 |
| `elastic.out` | 弹性振荡 | 自然回弹 |
| `back.out` | 过冲回弹 | 强调出现 |

---

## GPU加速规则

### GPU安全属性

只有以下CSS属性可以被GPU加速合成：

| 属性 | 说明 | 示例 |
|------|------|------|
| `transform` | 变换（位移/缩放/旋转） | `translate`, `scale`, `rotate` |
| `opacity` | 透明度 | `0` 到 `1` |

### 不能GPU加速的属性

这些属性会触发重绘（repaint），影响性能：

- ❌ `width`, `height`
- ❌ `top`, `left`, `right`, `bottom`
- ❌ `margin`, `padding`
- ❌ `background-color`, `color`
- ❌ `border-*`
- ❌ `box-shadow`
- ❌ `filter` (部分浏览器)
- ❌ `font-size`, `line-height`

### 在预设中声明gpuSafeProps

```typescript
export const myPreset: AnimationEffect = {
  id: 'my_preset',
  name: '我的预设',
  category: 'entrance',
  renderMode: EffectRenderMode.CANVAS_2D,

  // ✅ 声明只使用GPU安全属性
  gpuSafeProps: ['transform', 'opacity'],

  apply: (progress, params, currentTransform) => {
    const p = Math.max(0, Math.min(1, progress));
    const eased = getEasing('easeOutQuad')(p);

    return {
      transform: {
        ...currentTransform,
        x: currentTransform.x + 100 * eased,     // ✅ GPU安全
        scale: Math.max(0.001, 1 * eased)         // ✅ GPU安全
      },
      opacity: Math.max(0.01, eased)               // ✅ GPU安全
      // 不要返回 filter 或其他非GPU属性
    };
  }
};
```

### 性能验证

```typescript
import { validateAnimationProps } from '@/modules/preset/core/GPURenderer';

// 在注册前验证
const validation = validateAnimationProps({
  transform: true,
  opacity: true
});

if (!validation.valid) {
  console.warn('警告: 以下属性无法GPU加速:', validation.unsafeProps);
  // 可以调用 suggestGPUSafeAlternative() 获取建议
}
```

### 最佳实践

1. **始终使用transform + opacity** - 这两个属性性能最好
2. **避免在动画中改变布局属性** - 如width/height/margin等
3. **使用will-change提示浏览器** - AnimationEngine会自动管理
4. **复杂滤镜考虑离屏Canvas** - 如果必须使用filter
5. **测试低端设备** - GPU加速在不同设备表现不同

---

## 预设类型详解（84个完整版）

### 1. Entrance 进场动画（18个）

**特点**：素材从不可见到可见的过渡动画

| ID | 名称 | 说明 |
|---|------|------|
| `entrance_fade_in` | 淡入 | 从透明到不透明 |
| `entrance_fade_in_up` | 向上淡入 | 从下方淡入 |
| `entrance_fade_in_down` | 向下淡入 | 从上方淡入 |
| `entrance_fade_in_left` | 向左淡入 | 从右侧淡入 |
| `entrance_fade_in_right` | 向右淡入 | 从左侧淡入 |
| `entrance_slide_in_up` | 向上滑入 | 从下方滑入 |
| `entrance_slide_in_down` | 向下滑入 | 从上方滑入 |
| `entrance_slide_in_left` | 向左滑入 | 从右侧滑入 |
| `entrance_slide_in_right` | 向右滑入 | 从左侧滑入 |
| `entrance_zoom_in` | 缩放进入 | 从小到大缩放 |
| `entrance_zoom_in_up` | 向上缩放 | 向上移动+缩放 |
| `entrance_zoom_in_down` | 向下缩放 | 向下移动+缩放 |
| `entrance_bounce_in` | 弹跳进入 | 弹性弹跳效果 |
| `entrance_elastic_in` | 弹性进入 | 弹性过冲效果 |
| `entrance_back_in` | 回弹进入 | 回弹效果 |
| `entrance_flip_in` | 翻转进入 | 3D翻转效果 |
| `entrance_rotate_in` | 旋转进入 | 旋转出现 |
| `entrance_explode_in` | 爆炸进入 | 粒子爆炸效果 |

**适用素材**：图片、视频

**关键点**：
- `progress = 0` 时元素应完全不可见或处于初始状态
- `progress = 1` 时元素应完全可见且处于最终状态
- 必须确保 opacity 最小值为 0.01，scale 最小值为 0.001

---

### 2. Exit 出场动画（10个）

**特点**：素材从可见到不可见的过渡动画

| ID | 名称 | 说明 |
|---|------|------|
| `exit_fade_out` | 淡出 | 从不透明到透明 |
| `exit_fade_out_up` | 向上淡出 | 向上消失 |
| `exit_fade_out_down` | 向下淡出 | 向下消失 |
| `exit_slide_out_up` | 向上滑出 | 向上滑出 |
| `exit_slide_out_down` | 向下滑出 | 向下滑出 |
| `exit_slide_out_left` | 向左滑出 | 向左滑出 |
| `exit_slide_out_right` | 向右滑出 | 向右滑出 |
| `exit_zoom_out` | 缩放消失 | 从大到小 |
| `exit_zoom_out_up` | 向上缩放 | 向上+缩小 |
| `exit_bounce_out` | 弹跳消失 | 弹跳退出 |

**关键点**：
- `progress = 0` 时元素应保持正常状态
- `progress = 1` 时元素应完全不可见
- 动画在片段结束前完成

---

### 3. Emphasis 强调动画（18个）

**特点**：突出显示的动画，通常循环播放

| ID | 名称 | 说明 |
|---|------|------|
| `emphasis_pulse` | 脉冲 | 心跳式脉冲 |
| `emphasis_pulse_ring` | 环形脉冲 | 扩散环效果 |
| `emphasis_pulse_glow` | 发光脉冲 | 发光脉冲 |
| `emphasis_shake` | 抖动 | 随机抖动 |
| `emphasis_shake_x` | X轴抖动 | 水平抖动 |
| `emphasis_shake_y` | Y轴抖动 | 垂直抖动 |
| `emphasis_bounce` | 弹跳 | 弹跳强调 |
| `emphasis_bounce_soft` | 柔和弹跳 | 轻柔弹跳 |
| `emphasis_flash` | 闪烁 | 快速闪烁 |
| `emphasis_flash_soft` | 柔和闪烁 | 平滑闪烁 |
| `emphasis_swing` | 摇摆 | 左右摇摆 |
| `emphasis_wobble` | 摇晃 | 不规则摇晃 |
| `emphasis_heartbeat` | 心跳 | 心跳节奏 |
| `emphasis_breathe` | 呼吸 | 呼吸效果 |
| `emphasis_jitter` | 抖动 | 高频抖动 |
| `emphasis_pop` | 弹出 | 弹出效果 |
| `emphasis_grow_shrink` | 生长收缩 | 尺寸变化 |
| `emphasis_tilt` | 倾斜 | 倾斜摇晃 |

**关键点**：
- 使用周期函数（sin, cos）创建循环效果
- 不应该影响素材的最终可见性
- opacity 始终返回 1

---

### 4. Motion 移位动画（12个）

**特点**：持续的运动效果，通常循环

| ID | 名称 | 说明 |
|---|------|------|
| `motion_float` | 悬浮 | 悬浮漂移 |
| `motion_float_x` | X轴悬浮 | 水平悬浮 |
| `motion_float_y` | Y轴悬浮 | 垂直悬浮 |
| `motion_drift` | 漂移 | 缓慢漂移 |
| `motion_drift_slow` | 慢速漂移 | 极慢漂移 |
| `motion_orbit` | 轨道运动 | 圆形轨道 |
| `motion_orbit_slow` | 慢速轨道 | 慢速轨道 |
| `motion_sway` | 摆动 | 左右摆动 |
| `motion_spiral` | 螺旋 | 螺旋运动 |
| `motion_wave` | 波浪 | 波浪运动 |
| `motion_bob` | 上下浮动 | 规律上下浮动 |
| `motion_pan` | 平移 | 平滑平移 |

**关键点**：
- 使用周期函数创建循环运动
- 确保运动范围合理
- opacity 始终返回 1

---

### 5. FX 视觉特效（19个）

**特点**：滤镜和后处理效果

| ID | 名称 | 说明 |
|---|------|------|
| `fx_glow` | 发光 | 外发光效果 |
| `fx_glow_pulse` | 脉冲发光 | 脉冲发光 |
| `fx_glow_rainbow` | 彩虹发光 | 彩色发光 |
| `fx_blur` | 模糊 | 高斯模糊 |
| `fx_blur_in` | 模糊进入 | 从模糊到清晰 |
| `fx_blur_out` | 模糊退出 | 从清晰到模糊 |
| `fx_shadow` | 阴影 | 投影阴影 |
| `fx_shadow_lift` | 阴影提升 | 浮起阴影 |
| `fx_hue_rotate` | 色相旋转 | 颜色旋转 |
| `fx_saturate` | 饱和度 | 饱和度调整 |
| `fx_contrast` | 对比度 | 对比度调整 |
| `fx_grayscale` | 黑白电影 | 灰度效果 |
| `fx_sepia` | 复古色调 | 怀旧效果 |
| `fx_invert` | 反色 | 颜色反转 |
| `fx_glassmorphism` | 毛玻璃 | 磨砂玻璃 |
| `fx_glitch` | 故障 | 数字故障 |
| `fx_neon` | 霓虹 | 霓虹灯效果 |
| `fx_scanline` | 扫描线 | CRT扫描线 |
| `fx_vignette` | 暗角 | 边缘暗化 |

**关键点**：
- 主要使用 `filter` 属性应用CSS滤镜
- 可以动态调整滤镜强度
- opacity 始终返回 1

---

### 6. Transition 转场动画（5个）

**特点**：两个素材之间的平滑过渡

| ID | 名称 | 说明 |
|---|------|------|
| `transition_cross_dissolve` | 交叉溶解 | 渐变混合 |
| `transition_wipe_left` | 向左擦除 | 左向擦除 |
| `transition_wipe_right` | 向右擦除 | 右向擦除 |
| `transition_page_flip` | 翻页 | 3D翻页效果 |
| `transition_cube_rotate` | 立方体旋转 | 3D立方体旋转 |

---

### 7. Text 文字特效（2个）

**特点**：专门用于文字元素的动画

| ID | 名称 | 说明 |
|---|------|------|
| `text_typewriter` | 打字机 | 逐字显示 |
| `text_reveal` | 揭示效果 | 文字揭示 |

**总计: 84 个预设**

---

## 开发规范（重要）

### 必须遵守的规则

#### 1. 参数边界保护

```typescript
// 必须对参数进行边界保护
const scaleFrom = Math.max(0.1, Math.min(1.5, params.scaleFrom || 0.8));
const speed = Math.max(0.5, Math.min(5, params.speed || 1));
const intensity = Math.max(1, Math.min(50, params.intensity || 10));
```

#### 2. 进度边界保护

```typescript
// 必须对进度进行边界保护
const p = Math.max(0, Math.min(1, progress));
const eased = getEasing('easeOutQuad')(p);
```

#### 3. Scale 最小值保护

```typescript
// scale 必须大于 0，否则素材会消失
return {
  transform: {
    ...currentTransform,
    scale: Math.max(0.001, scaleValue)
  },
  opacity: 1
};
```

#### 4. Opacity 最小值保护

```typescript
// opacity 必须大于 0，否则素材会不可见
return {
  transform: currentTransform,
  opacity: Math.max(0.01, opacityValue)
};
```

#### 5. 保留原有变换

```typescript
// 必须使用展开运算符保留原有变换
return {
  transform: {
    ...currentTransform,  // 保留原有变换
    x: currentTransform.x + xOffset,  // 在原有基础上修改
    y: currentTransform.y + yOffset
  },
  opacity: 1
};
```

#### 6. 声明GPU安全属性

```typescript
export const myPreset: AnimationEffect = {
  // ...
  gpuSafeProps: ['transform', 'opacity'],  // 声明使用的属性
  apply: (progress, params, currentTransform) => {
    // 只使用 transform 和 opacity
    return {
      transform: { /* ... */ },
      opacity: /* ... */
    };
  }
};
```

### 完整的预设模板

```typescript
import { AnimationEffect, EffectRenderMode } from '@/modules/preset/PresetTypes';
import { getEasing } from '@/modules/preset/core/EasingLibrary';

export const template: AnimationEffect = {
  id: 'category_template_name',
  name: '模板名称 (Template Name)',
  category: 'entrance',
  renderMode: EffectRenderMode.CANVAS_2D,
  gpuSafeProps: ['transform', 'opacity'],

  schema: [
    {
      key: 'paramName',
      label: '参数标签',
      type: 'number',
      default: 1,
      min: 0.1,
      max: 10,
      step: 0.1
    }
  ],

  apply: (progress, params, currentTransform) => {
    // 1. 参数边界保护
    const paramName = Math.max(0.1, Math.min(10, params.paramName || 1));

    // 2. 进度边界保护
    const p = Math.max(0, Math.min(1, progress));

    // 3. 应用缓动函数（使用新EasingLibrary）
    const eased = getEasing('easeOutCubic')(p);

    // 4. 计算变换值
    const scale = eased * paramName;

    // 5. 返回结果，确保 scale > 0, opacity > 0
    return {
      transform: {
        ...currentTransform,
        scale: Math.max(0.001, currentTransform.scale * scale)
      },
      opacity: Math.max(0.01, eased)
    };
  }
};
```

---

## 在新架构中创建预设

### 步骤1: 创建预设文件

```typescript
// src/modules/presets/entrance/customBounceIn.ts
import { AnimationEffect, EffectRenderMode } from '../../PresetTypes';
import { getEasing } from '../../core/EasingLibrary';

export const customBounceIn: AnimationEffect = {
  id: 'entrance_custom_bounce_in',
  name: '自定义弹跳进入',
  description: '带有弹性效果的弹跳进入动画',
  category: 'entrance',
  renderMode: EffectRenderMode.CANVAS_2D,
  gpuSafeProps: ['transform', 'opacity'],

  schema: [
    { key: 'delay', label: '延迟(s)', type: 'number', default: 0, min: 0, max: 2, step: 0.1 },
    { key: 'bounceStrength', label: '弹跳强度', type: 'number', default: 1, min: 0.5, max: 2, step: 0.1 }
  ],

  apply: (progress, params, currentTransform) => {
    const delay = Math.max(0, Math.min(2, params.delay || 0));
    const bounceStrength = Math.max(0.5, Math.min(2, params.bounceStrength || 1));
    const delayedProgress = Math.max(0, progress - delay);

    if (delayedProgress <= 0) {
      return {
        transform: { ...currentTransform, scale: 0.001 },
        opacity: 0.01
      };
    }

    const effectiveProgress = Math.min(1, delayedProgress / Math.max(0.1, 1 - delay));
    const eased = getEasing('easeOutElastic')(effectiveProgress);
    const bounceScale = eased * (1 + Math.sin(effectiveProgress * Math.PI * 3) * 0.05 * (1 - effectiveProgress)) * bounceStrength;

    return {
      transform: {
        ...currentTransform,
        scale: Math.max(0.001, currentTransform.scale * bounceScale)
      },
      opacity: Math.max(0.01, Math.min(1, effectiveProgress * 2.5))
    };
  }
};

export default customBounceIn;
```

### 步骤2: 注册到全局注册表

```typescript
// src/modules/presets/entrance/index.ts
export { fadeIn } from './fadeIn';
export { bounceIn } from './bounceIn';
export { slideInLeft } from './slideInLeft';
export { customBounceIn } from './customBounceIn';  // 添加这行
```

```typescript
// src/modules/preset/index.ts
import presetRegistry from './PresetRegistry';
import { customBounceIn } from './presets/entrance/customBounceIn';

// 注册到全局单例
presetRegistry.register(customBounceIn);

export { presetRegistry };

// 导出所有预设类型
export type { AnimationEffect, EffectRenderMode, PresetCategory } from './PresetTypes';
```

### 步骤3: 在应用中使用

```typescript
import { presetRegistry } from '@/modules/preset';
import { AnimationEngine } from '@/modules/preset/core/AnimationEngine';

// 方式1: 直接使用预设的apply方法
const preset = presetRegistry.get('entrance_custom_bounce_in');
if (preset) {
  const result = preset.apply(
    0.5,                                    // progress
    { delay: 0.2, bounceStrength: 1.5 },    // 自定义参数
    { x: 0, y: 0, scale: 1, rotation: 0 }  // 当前变换
  );
  console.log('结果:', result);
}

// 方式2: 结合AnimationEngine使用
const controller = AnimationEngine.animate({
  target: { x: 0, y: 0, scale: 0.001, rotation: 0 },
  to: { x: 0, y: 0, scale: 1, rotation: 0 },
  duration: 0.8,
  easing: 'easeOutElastic',
  delay: 0.2,
  onUpdate: (values) => {
    // 更新DOM或Canvas...
  }
});

// 方式3: 创建React模式的预设
export const reactPreset: AnimationEffect = {
  id: 'react_fade_in',
  name: 'React淡入',
  category: 'entrance',
  renderMode: EffectRenderMode.REACT,
  gpuSafeProps: ['transform', 'opacity'],
  schema: [],

  apply: (progress, params, currentTransform) => {
    const p = Math.max(0, Math.min(1, progress));
    const eased = getEasing('easeOutQuad')(p);
    return {
      transform: currentTransform,
      opacity: Math.max(0.01, eased)
    };
  },

  reactRender: ({ progress, params, children, style }) => {
    const p = Math.max(0, Math.min(1, progress));
    const eased = getEasing('easeOutQuad')(p);
    return (
      <div style={{
        ...style,
        opacity: Math.max(0.01, eased),
        transform: `scale(${0.8 + 0.2 * eased})`
      }}>
        {children}
      </div>
    );
  }
};
```

### 步骤4: 验证GPU安全性

```typescript
import { validateAnimationProps } from '@/modules/preset/core/GPURenderer';

// 在发布前验证你的预设
const validation = validateAnimationProps({
  transform: true,
  opacity: true
});

if (!validation.valid) {
  console.error('❌ 预设使用了非GPU安全的属性:', validation.unsafeProps);
  console.log('✅ 安全属性:', validation.safeProps);
} else {
  console.log('✅ 预设完全符合GPU加速要求');
}
```

---

## 预设示例

### 进场动画示例

#### 淡入效果（新版）

```typescript
import { AnimationEffect, EffectRenderMode } from '@/modules/preset/PresetTypes';
import { getEasing } from '@/modules/preset/core/EasingLibrary';

export const fadeIn: AnimationEffect = {
  id: 'entrance_fade_in',
  name: '淡入 (Fade In)',
  category: 'entrance',
  renderMode: EffectRenderMode.CANVAS_2D,
  gpuSafeProps: ['transform', 'opacity'],

  schema: [
    { key: 'scaleFrom', label: '起始缩放', type: 'number', default: 0.8, min: 0.1, max: 1.5, step: 0.05 }
  ],

  apply: (progress, params, currentTransform) => {
    const scaleFrom = Math.max(0.1, Math.min(1.5, params.scaleFrom || 0.8));
    const eased = getEasing('easeOutQuad')(Math.max(0, Math.min(1, progress)));
    const scale = scaleFrom + (1 - scaleFrom) * eased;

    return {
      transform: {
        ...currentTransform,
        scale: Math.max(0.001, currentTransform.scale * scale)
      },
      opacity: Math.max(0.01, eased)
    };
  }
};
```

#### 弹跳进入（新版 - 使用EasingLibrary）

```typescript
import { AnimationEffect, EffectRenderMode } from '@/modules/preset/PresetTypes';
import { getEasing } from '@/modules/preset/core/EasingLibrary';

export const bounceIn: AnimationEffect = {
  id: 'entrance_bounce_in',
  name: '弹跳进入 (Bounce In)',
  category: 'entrance',
  renderMode: EffectRenderMode.CANVAS_2D,
  gpuSafeProps: ['transform', 'opacity'],

  schema: [
    { key: 'delay', label: '延迟(s)', type: 'number', default: 0, min: 0, max: 2, step: 0.1 }
  ],

  apply: (progress, params, currentTransform) => {
    const delay = Math.max(0, Math.min(2, params.delay || 0));
    const delayedProgress = Math.max(0, progress - delay);

    if (delayedProgress <= 0) {
      return {
        transform: { ...currentTransform, scale: 0.001 },
        opacity: 0.01
      };
    }

    const effectiveProgress = Math.min(1, delayedProgress / Math.max(0.1, 1 - delay));
    const eased = getEasing('easeOutElastic')(effectiveProgress);
    const bounceScale = eased * (1 + Math.sin(effectiveProgress * Math.PI * 3) * 0.05 * (1 - effectiveProgress));

    return {
      transform: {
        ...currentTransform,
        scale: Math.max(0.001, currentTransform.scale * bounceScale)
      },
      opacity: Math.max(0.01, Math.min(1, effectiveProgress * 2.5))
    };
  }
};
```

### 出场动画示例

#### 缩小消失（新版）

```typescript
import { AnimationEffect, EffectRenderMode } from '@/modules/preset/PresetTypes';
import { getEasing } from '@/modules/preset/core/EasingLibrary';

export const zoomOut: AnimationEffect = {
  id: 'exit_zoom_out',
  name: '缩小消失 (Zoom Out)',
  category: 'exit',
  renderMode: EffectRenderMode.CANVAS_2D,
  gpuSafeProps: ['transform', 'opacity'],

  schema: [
    { key: 'fadeOut', label: '淡出', type: 'boolean', default: true },
    { key: 'targetScale', label: '目标缩放', type: 'number', default: 0, min: 0, max: 0.5, step: 0.05 }
  ],

  apply: (progress, params, currentTransform) => {
    const targetScale = Math.max(0, Math.min(0.5, params.targetScale || 0));
    const fadeOut = params.fadeOut !== false;

    const eased = getEasing('easeInQuad')(Math.max(0, Math.min(1, progress)));
    const scale = 1 - (1 - targetScale) * eased;

    return {
      transform: {
        ...currentTransform,
        scale: Math.max(0.001, currentTransform.scale * scale)
      },
      opacity: fadeOut ? Math.max(0.01, 1 - eased) : 1
    };
  }
};
```

### 强调动画示例

#### 抖动效果（新版）

```typescript
import { AnimationEffect, EffectRenderMode } from '@/modules/preset/PresetTypes';

export const shake: AnimationEffect = {
  id: 'emphasis_shake',
  name: '抖动 (Shake)',
  category: 'emphasis',
  renderMode: EffectRenderMode.CANVAS_2D,
  gpuSafeProps: ['transform'],

  schema: [
    { key: 'intensity', label: '强度', type: 'number', default: 10, min: 1, max: 50, step: 1 },
    { key: 'speed', label: '速度', type: 'number', default: 10, min: 1, max: 30, step: 1 }
  ],

  apply: (progress, params, currentTransform) => {
    const intensity = Math.max(1, Math.min(50, params.intensity || 10));
    const speed = Math.max(1, Math.min(30, params.speed || 10));

    const shakeX = Math.sin(progress * Math.PI * 2 * speed) * intensity;
    const shakeY = Math.cos(progress * Math.PI * 2 * speed * 1.5) * intensity * 0.5;

    return {
      transform: {
        ...currentTransform,
        x: currentTransform.x + shakeX,
        y: currentTransform.y + shakeY
      },
      opacity: 1
    };
  }
};
```

---

## 常见问题

### Q1: 预设应用后素材消失了？

**原因**：
- scale 或 opacity 返回了 0 或负数
- 没有进行边界保护

**解决方案**：
```typescript
// 确保返回值有最小值保护
return {
  transform: {
    ...currentTransform,
    scale: Math.max(0.001, scaleValue)  // 必须 > 0
  },
  opacity: Math.max(0.01, opacityValue)  // 必须 > 0
};
```

### Q2: 动画不流畅？

**原因**：
- 没有使用缓动函数
- 参数没有边界保护
- 使用了非GPU加速的属性

**解决方案**：
```typescript
// 1. 使用EasingLibrary的缓动函数
import { getEasing } from '@/modules/preset/core/EasingLibrary';
const eased = getEasing('easeOutCubic')(Math.max(0, Math.min(1, progress)));

// 2. 参数边界保护
const speed = Math.max(0.5, Math.min(5, params.speed || 1));

// 3. 只使用GPU安全属性
return {
  transform: { ... },  // ✅
  opacity: value        // ✅
  // 不要返回 filter, backgroundColor 等
};
```

### Q3: 如何使用AnimationEngine而不是直接调用apply？

**解决方案**：
```typescript
import { AnimationEngine } from '@/modules/preset/core/AnimationEngine';

// 创建动画控制器
const controller = AnimationEngine.animate({
  target: { x: 0, y: 0, scale: 0.5, rotation: 0 },
  to: { x: 100, y: 200, scale: 1.2, rotation: 360 },
  duration: 1,
  easing: 'easeOutBack',
  onUpdate: (values, progress) => {
    // 自动应用到DOM/Canvas
    element.style.transform = `
      translate(${values.x}px, ${values.y}px)
      scale(${values.scale})
      rotate(${values.rotation}deg)
    `;
    element.style.opacity = values.opacity ?? 1;
  }
});

// 控制动画
controller.pause();
controller.resume();
controller.seek(0.5);
controller.stop();
```

### Q4: 如何创建交错动画？

**解决方案**：
```typescript
const elements = document.querySelectorAll('.item');
const targets = Array.from(elements).map(el => ({
  el,
  x: 0,
  y: 0,
  scale: 0.5,
  opacity: 0
}));

AnimationEngine.stagger(targets, {
  to: { x: 0, y: 0, scale: 1, opacity: 1 },
  duration: 0.5,
  easing: 'easeOutBack',
  stagger: 0.1,           // 每个元素间隔0.1秒
  from: 'start',          // 从第一个开始
  onUpdate: (values, progress, index) => {
    const { el, ...rest } = targets[index];
    el.style.transform = `...`;
    el.style.opacity = rest.opacity;
  }
});
```

### Q5: 如何调试预设？

**解决方案**：
```typescript
apply: (progress, params, currentTransform) => {
  // 在控制台查看进度和参数
  if (progress < 0.01 || progress > 0.99) {
    console.log('Preset Debug:', { progress, params, currentTransform });
  }

  // 使用PerformanceMonitor检查帧率
  const metrics = AnimationEngine.getPerformanceMetrics();
  if (metrics.fps < 55) {
    console.warn('⚠️ 性能警告: FPS =", metrics.fps);
  }

  // ... 动画逻辑
};
```

### Q6: 旧版PresetDefinition还能用吗？

**答案**: 可以兼容，但建议迁移到新的`AnimationEffect`接口。

```typescript
// 旧代码仍然工作
import { PresetDefinition } from '../../engine/presets/types';  // 旧路径

// 但新代码更强大
import { AnimationEffect } from '@/modules/preset/PresetTypes';  // 新路径
```

---

## 总结

开发高质量预设的关键要点（新架构版）：

1. **新架构路径** - 使用 `src/modules/preset/` 作为主要开发路径
2. **类型升级** - 使用 `AnimationEffect` 替代 `PresetDefinition`
3. **渲染模式** - 声明 `EffectRenderMode`（CANVAS_2D/REACT/HYBRID）
4. **参数边界保护** - `Math.max(min, Math.min(max, params.value || default))`
5. **进度边界保护** - `Math.max(0, Math.min(1, progress))`
6. **Scale 最小值** - `Math.max(0.001, scaleValue)`
7. **Opacity 最小值** - `Math.max(0.01, opacityValue)`
8. **保留原有变换** - `{ ...currentTransform, ... }`
9. **使用EasingLibrary** - `getEasing('easeOutCubic')(p)` （45+函数）
10. **GPU加速** - 声明 `gpuSafeProps: ['transform', 'opacity']`
11. **AnimationEngine** - 使用 `animate()`/`stagger()`/`timeline()` 进行高级控制
12. **SpringPhysics** - 使用弹簧物理实现自然动画
13. **TimelineDriver** - RAF驱动，精确时间控制
14. **性能监控** - 使用 `PerformanceMonitor` 和 `validateAnimationProps()`
15. **正确注册** - 使用 `presetRegistry.register()` （单例模式）

遵循这些规范，您就能在新架构下开发出符合预期、丝滑流畅、GPU加速优化的预设效果！

**总计可用预设: 84个**（7大分类完整版）
