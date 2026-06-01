# NanoEdit Pro (AutoEdit) — AI 预设开发规范文档

> **文档定位**：本文档是面向 AI 的预设开发规范，指导 AI 生成完全符合项目架构、类型约束、编码规范和性能要求的预设代码。AI 阅读本文档后，应能 100% 独立生成可运行、可注册、可集成的预设代码，无需任何额外信息。

---

## 目录

1. [预设系统完整架构](#1-预设系统完整架构)
2. [完整类型定义参考](#2-完整类型定义参考)
3. [预设开发完整规范](#3-预设开发完整规范)
4. [缓动函数完整 API 参考](#4-缓动函数完整-api-参考)
5. [预设分类详解](#5-预设分类详解)
6. [预设代码模板](#6-预设代码模板)
7. [各分类完整代码示例](#7-各分类完整代码示例)
8. [注册和集成步骤](#8-注册和集成步骤)
9. [PresetRegistry 完整 API 参考](#9-presetregistry-完整-api-参考)
10. [AnimationEngine 完整 API 参考](#10-animationengine-完整-api-参考)
11. [AI 导演模式集成说明](#11-ai-导演模式集成说明)
12. [GPU 加速规则和性能优化](#12-gpu-加速规则和性能优化)
13. [常见错误和调试指南](#13-常见错误和调试指南)
14. [视觉效果设计哲学（预设视角）](#14-视觉效果设计哲学预设视角)
15. [物理真实感核心原理（预设视角）](#15-物理真实感核心原理预设视角)
16. [预设的物理真实感增强](#16-预设的物理真实感增强)
17. [动画节奏与时机（预设视角）](#17-动画节奏与时机预设视角)
18. [视觉冲击力预设配方](#18-视觉冲击力预设配方)
19. [质量检查清单](#19-质量检查清单)

---

## 1. 预设系统完整架构

### 1.1 文件路径总览

| 用途 | 文件路径 |
|------|----------|
| 旧版预设类型定义（**当前实际使用**） | `src/engine/presets/types.ts` |
| 新版预设类型定义 | `src/modules/preset/PresetTypes.ts` |
| 预设注册表（新版单例） | `src/modules/preset/PresetRegistry.ts` |
| 旧版预设注册入口 | `src/engine/presets/index.ts` |
| 缓动函数库 | `src/engine/utils/easing.ts` |
| 动画引擎 | `src/modules/preset/core/AnimationEngine.ts` |
| 弹簧物理 | `src/modules/preset/core/SpringPhysics.ts` |
| GPU 渲染器 | `src/modules/preset/core/GPURenderer.ts` |
| 时间轴驱动 | `src/modules/preset/core/TimelineDriver.ts` |
| 缓动库 | `src/modules/preset/core/EasingLibrary.ts` |
| 共享类型 | `src/modules/shared/types.ts` |
| 进场动画预设目录 | `src/engine/presets/entrance/` |
| 出场动画预设目录 | `src/engine/presets/exit/` |
| 强调动画预设目录 | `src/engine/presets/emphasis/` |
| 移位动画预设目录 | `src/engine/presets/motion/` |
| 视觉特效预设目录 | `src/engine/presets/fx/` |
| 转场动画预设目录 | `src/engine/presets/transition/` |
| 文字特效预设目录 | `src/engine/presets/text/` |

### 1.2 架构说明

项目存在两套预设类型系统：

- **旧版（PresetDefinition）**：当前实际使用的格式，定义在 `src/engine/presets/types.ts`，所有现有 84 个预设均使用此格式。**AI 生成新预设时必须使用此格式。**
- **新版（AnimationEffect）**：扩展格式，定义在 `src/modules/preset/PresetTypes.ts`，增加了 `renderMode`、`reactRender`、`gpuSafeProps` 等字段，用于未来的 React 渲染和 GPU 加速场景。当前尚未全面启用。

两套系统通过 `PresetRegistry` 单例桥接：旧版预设可通过 `PresetRegistry.register()` 以 `AnimationEffect` 形式注册，但预设文件本身仍以 `PresetDefinition` 格式编写。

### 1.3 预设注册流程

```
创建预设文件（PresetDefinition 格式）
    ↓
在对应分类的 index.ts 中 export
    ↓
src/engine/presets/index.ts 中 collectPresets() 自动收集
    ↓
也可通过 registerPreset() 手动注册
    ↓
新版通过 presetRegistry.register() 注册到 PresetRegistry 单例
```

---

## 2. 完整类型定义参考

### 2.1 Transform（变换）

```typescript
// src/modules/shared/types.ts
export interface Transform {
  x: number;       // X 轴位移（像素）
  y: number;       // Y 轴位移（像素）
  scale: number;    // 缩放比例（1 = 原始大小）
  rotation: number; // 旋转角度（度）
}
```

### 2.2 EffectParamSchema（参数定义）

```typescript
// src/modules/shared/types.ts
export interface EffectParamSchema {
  key: string;      // 参数键名，与 apply 函数中 params[key] 对应
  label: string;    // UI 显示标签（中文 + 英文，如 "强度 (Intensity)"）
  type: 'number' | 'color' | 'boolean' | 'string'; // 参数类型
  default: any;     // 默认值
  min?: number;     // 最小值（仅 number 类型）
  max?: number;     // 最大值（仅 number 类型）
  step?: number;    // 步进值（仅 number 类型）
}
```

### 2.3 PresetDefinition（旧版，当前实际使用）

```typescript
// src/engine/presets/types.ts
import { EffectParamSchema, Transform } from '../../types/core';

export interface PresetDefinition {
  id: string;       // 唯一标识符，格式：{category}_{name}，如 "entrance_fade_in"
  name: string;     // 显示名称，格式：中文名 (English Name)，如 "淡入 (Fade In)"
  category: 'entrance' | 'exit' | 'emphasis' | 'motion' | 'fx' | 'transition' | 'text';
  schema: EffectParamSchema[]; // 可调参数定义数组
  apply: (progress: number, params: any, currentTransform: Transform, ctx?: CanvasRenderingContext2D) => {
    transform: Transform;
    opacity: number;
    filter?: string;
  };
}
```

**apply 函数参数说明：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `progress` | `number` | 动画进度，范围 [0, 1]。0 = 动画开始，1 = 动画结束 |
| `params` | `any` | 用户传入的参数对象，键名与 schema 中的 key 对应 |
| `currentTransform` | `Transform` | 元素当前的变换状态，必须保留原有值并在此基础上叠加 |
| `ctx` | `CanvasRenderingContext2D` | 可选的 Canvas 2D 上下文，用于高级渲染 |

**apply 函数返回值说明：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `transform` | `Transform` | 是 | 变换结果，必须包含完整的 Transform 对象 |
| `opacity` | `number` | 是 | 透明度，范围 [0, 1]，最小值 0.01 |
| `filter` | `string` | 否 | CSS filter 字符串，如 `"blur(10px)"` |

### 2.4 AnimationEffect（新版）

```typescript
// src/modules/preset/PresetTypes.ts
import React from 'react';
import { EffectParamSchema, Transform } from '../../types/core';
import type { PresetDefinition as LegacyPresetDefinition } from '../../engine/presets/types';

export enum EffectRenderMode {
  CANVAS_2D = 'canvas2d',
  REACT = 'react',
  HYBRID = 'hybrid'
}

export interface ReactEffectProps {
  progress: number;
  params: Record<string, any>;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export type PresetCategory = 'entrance' | 'exit' | 'emphasis' | 'motion' | 'fx' | 'transition' | 'text';

export interface AnimationEffect extends Omit<LegacyPresetDefinition, 'apply'> {
  renderMode: EffectRenderMode;
  apply: (progress: number, params: any, currentTransform: Transform, ctx?: CanvasRenderingContext2D) => {
    transform: Transform;
    opacity: number;
    filter?: string;
  };
  reactRender?: (props: ReactEffectProps) => React.ReactElement;
  gpuSafeProps: string[];
}
```

**新版相比旧版的差异：**

| 字段 | 旧版 PresetDefinition | 新版 AnimationEffect |
|------|----------------------|---------------------|
| `renderMode` | 无 | 必填，`EffectRenderMode` 枚举 |
| `reactRender` | 无 | 可选，React 渲染函数 |
| `gpuSafeProps` | 无 | 必填，GPU 安全属性名数组 |

### 2.5 PresetRenderFn

```typescript
export type PresetRenderFn = (
  params: Record<string, any>,
  progress: number
) => {
  transform: { x: number; y: number; scale: number; rotation: number };
  opacity: number;
};
```

### 2.6 PresetRegistryItem

```typescript
export interface PresetRegistryItem {
  preset: AnimationEffect;
  renderFn: PresetRenderFn;
}
```

### 2.7 ApplyPresetConfig

```typescript
export interface ApplyPresetConfig {
  clipId: string;       // 目标片段 ID
  presetId: string;     // 预设 ID
  params?: Record<string, any>; // 预设参数
  duration?: number;    // 持续时间
}
```

### 2.8 Effect（实例化的特效）

```typescript
// src/modules/shared/types.ts
export interface Effect {
  id: string;           // 特效实例 ID
  presetId: string;     // 对应的预设 ID
  type: EffectPreset['category'];
  name: string;         // 特效名称
  duration?: number;    // 持续时间
  params: Record<string, any>; // 参数值
}
```

---

## 3. 预设开发完整规范

### 3.1 必须遵守的规则

#### 规则 1：参数保护（Clamp）

所有从 `params` 中读取的数值参数，**必须**使用 `Math.max(min, Math.min(max, value))` 进行范围限制，绝不能直接使用未校验的值。

```typescript
// ✅ 正确
const intensity = Math.max(0, Math.min(50, params.intensity || 10));

// ❌ 错误
const intensity = params.intensity || 10;
```

#### 规则 2：进度保护（Progress Clamping）

`progress` 参数**必须**在 apply 函数开头进行 [0, 1] 范围限制。

```typescript
// ✅ 正确
const t = Math.max(0, Math.min(1, progress));

// ❌ 错误
const t = progress; // 可能超出 [0, 1]
```

#### 规则 3：scale 最小值

所有 `scale` 计算结果的最终值**必须**使用 `Math.max(0.001, ...)` 保护，防止 scale 为 0 或负数导致渲染异常。

```typescript
// ✅ 正确
scale: Math.max(0.001, currentTransform.scale * scaleDelta)

// ❌ 错误
scale: currentTransform.scale * scaleDelta // 可能为 0 或负数
```

#### 规则 4：opacity 最小值

所有 `opacity` 值**必须**使用 `Math.max(0.01, ...)` 保护，防止完全透明导致元素不可见或渲染异常。

```typescript
// ✅ 正确
opacity: Math.max(0.01, easedOpacity)

// ❌ 错误
opacity: 0 // 完全透明，可能导致问题
```

#### 规则 5：保留原有变换

返回的 `transform` **必须**以 `...currentTransform` 为基础，仅修改需要动画的属性。绝不能丢弃 currentTransform 中的原有值。

```typescript
// ✅ 正确
return {
  transform: {
    ...currentTransform,
    scale: Math.max(0.001, currentTransform.scale * scaleDelta)
  },
  opacity: 1
};

// ❌ 错误
return {
  transform: {
    x: 0,
    y: 0,
    scale: scaleDelta,
    rotation: 0
  },
  opacity: 1
}; // 丢失了 currentTransform 中的 x, y, rotation 原有值
```

#### 规则 6：ID 命名规范

预设 ID 必须遵循 `{category前缀}_{snake_case名称}` 格式：

| 分类 | ID 前缀 | 示例 |
|------|---------|------|
| entrance | `entrance_` | `entrance_fade_in` |
| exit | `exit_` | `exit_fade_out` |
| emphasis | `emphasis_` | `emphasis_pulse` |
| motion | `motion_` | `motion_float` |
| fx | `fx_` | `fx_glitch` |
| transition | `transition_` | `transition_cross_dissolve` |
| text | `text_` | `text_typewriter` |

#### 规则 7：name 命名规范

预设 name 必须遵循 `中文名 (English Name)` 格式，如 `"淡入 (Fade In)"`、`"故障效果 (Glitch)"`。

#### 规则 8：schema 默认值

schema 中每个参数的 `default` 值必须与 apply 函数中 `||` 后的回退值一致。

```typescript
// ✅ 正确：default 和回退值都是 0.8
schema: [
  { key: 'scaleFrom', label: '起始缩放', type: 'number', default: 0.8, min: 0.1, max: 1.5, step: 0.05 }
],
apply: (progress, params, currentTransform) => {
  const scaleFrom = Math.max(0.1, Math.min(1.5, params.scaleFrom || 0.8));
  // ...
}

// ❌ 错误：default 和回退值不一致
schema: [
  { key: 'scaleFrom', label: '起始缩放', type: 'number', default: 0.5, ... }
],
apply: (progress, params, currentTransform) => {
  const scaleFrom = Math.max(0.1, Math.min(1.5, params.scaleFrom || 0.8)); // 回退值 0.8 ≠ default 0.5
}
```

#### 规则 9：boolean 参数处理

boolean 类型参数不能使用 `||` 运算符（因为 `false` 是 falsy），应使用 `!== false` 或 `=== true`。

```typescript
// ✅ 正确
const fadeIn = params.fadeIn !== false;
const animate = params.animate === true;

// ❌ 错误
const fadeIn = params.fadeIn || true; // 当 fadeIn=false 时仍为 true
```

#### 规则 10：filter 属性

仅在 fx 和部分 text 分类预设中使用 `filter` 返回值。entrance、exit、emphasis、motion、transition 分类预设通常不使用 filter（除非有明确的视觉特效需求）。

#### 规则 11：无副作用

apply 函数必须是纯函数，不能修改 `params`、`currentTransform` 或任何外部状态。

#### 规则 12：数值安全

所有中间计算结果应避免 NaN 和 Infinity。在除法运算中确保除数不为 0，在 Math.pow 等运算中注意溢出。

```typescript
// ✅ 正确
const effectiveProgress = Math.min(1, delayedProgress / Math.max(0.1, 1 - delay));

// ❌ 错误
const effectiveProgress = delayedProgress / (1 - delay); // 当 delay=1 时除以 0
```

### 3.2 编码风格规范

1. **文件命名**：使用 camelCase，与导出变量名一致。如 `fadeIn.ts` 导出 `fadeIn`。
2. **导出方式**：使用命名导出 `export const xxx: PresetDefinition = { ... }`。
3. **import 顺序**：先导入类型，再导入缓动函数。
4. **变量命名**：缓动后的进度值常用 `t` 或 `p`；eased 值使用 `{属性}Eased` 命名，如 `opacityEased`、`scaleEased`。
5. **无注释**：代码中不添加注释（项目约定）。
6. **无空行**：对象属性之间不添加空行。

---

## 4. 缓动函数完整 API 参考

所有缓动函数位于 `src/engine/utils/easing.ts`，导入方式：

```typescript
import { easeOutExpo, spring, perlinNoise1D } from '../../utils/easing';
```

### 4.1 基础缓动函数

输入参数 `t` 范围 [0, 1]，输出范围通常 [0, 1]。

| 函数名 | 签名 | 效果描述 | 适用场景 |
|--------|------|----------|----------|
| `linear` | `(t: number) => number` | 线性，匀速 | 持续匀速运动、进度条 |
| `easeInQuad` | `(t: number) => number` | 缓入二次方，慢启动 | 需要缓慢开始的加速运动 |
| `easeOutQuad` | `(t: number) => number` | 缓出二次方，快启动慢结束 | 温和的减速效果 |
| `easeInOutQuad` | `(t: number) => number` | 缓入缓出二次方 | 平滑的加速-减速 |
| `easeInCubic` | `(t: number) => number` | 缓入三次方 | 比Quad更明显的慢启动 |
| `easeOutCubic` | `(t: number) => number` | 缓出三次方 | 比Quad更明显的减速 |
| `easeInOutCubic` | `(t: number) => number` | 缓入缓出三次方 | 流畅的加减速 |
| `easeInQuart` | `(t: number) => number` | 缓入四次方 | 极慢启动 |
| `easeOutQuart` | `(t: number) => number` | 缓出四次方 | 极明显的减速 |
| `easeInOutQuart` | `(t: number) => number` | 缓入缓出四次方 | 强调中间段的加减速 |
| `easeInQuint` | `(t: number) => number` | 缓入五次方 | 非常慢的启动 |
| `easeOutQuint` | `(t: number) => number` | 缓出五次方 | 非常明显的减速 |
| `easeInOutQuint` | `(t: number) => number` | 缓入缓出五次方 | 极端强调中间段 |
| `easeInExpo` | `(t: number) => number` | 缓入指数 | 几乎静止后突然加速；出场动画的 opacity 衰减 |
| `easeOutExpo` | `(t: number) => number` | 缓出指数 | 快速到达后缓慢停止；进场动画的 opacity 增长 |
| `easeInOutExpo` | `(t: number) => number` | 缓入缓出指数 | 转场动画 |
| `easeOutElastic` | `(t: number) => number` | 弹性缓出 | 弹性效果，有过冲 |
| `easeOutBack` | `(t: number) => number` | 回弹缓出 | 回拉效果，略过目标后回弹 |
| `easeOutBounce` | `(t: number) => number` | 弹跳缓出 | 弹跳落地效果 |
| `easeInBounce` | `(t: number) => number` | 弹跳缓入 | 反向弹跳 |
| `easeInOutBounce` | `(t: number) => number` | 弹跳缓入缓出 | 两端弹跳 |

### 4.2 物理缓动函数

#### spring(t, stiffness?, damping?, mass?)

```typescript
function spring(t: number, stiffness: number = 180, damping: number = 12, mass: number = 1): number
```

**参数说明：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `t` | number | - | 进度 [0, 1] |
| `stiffness` | number | 180 | 弹簧刚度，值越大振荡越快 |
| `damping` | number | 12 | 阻尼系数，值越大振荡衰减越快 |
| `mass` | number | 1 | 质量，值越大运动越缓慢 |

**效果**：模拟弹簧物理，欠阻尼时有过冲振荡，临界阻尼时平滑到达，过阻尼时缓慢到达。

**适用场景**：进场动画的缩放、位移；需要自然物理感的动画。

**常用参数组合**：
- `spring(t, 120, 14, 1)` — 温和弹性，fadeIn 使用
- `spring(t, 180, 14, 1)` — 标准弹性
- `spring(t, 100, 12, 1)` — 柔和弹性
- `spring(t, 200, 16, 1)` — 快速弹性

---

#### springBounce(t, bounces?, decay?)

```typescript
function springBounce(t: number, bounces: number = 4, decay: number = 3.5): number
```

**参数说明：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `t` | number | - | 进度 [0, 1] |
| `bounces` | number | 4 | 弹跳次数 |
| `decay` | number | 3.5 | 衰减指数，值越大弹跳衰减越快 |

**效果**：模拟弹跳，多次弹起并逐渐衰减。

**适用场景**：弹跳进场效果（bounceIn）。

---

#### criticalSpring(t, overshoot?)

```typescript
function criticalSpring(t: number, overshoot: number = 0.15): number
```

**参数说明：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `t` | number | - | 进度 [0, 1] |
| `overshoot` | number | 0.15 | 过冲量 |

**效果**：临界阻尼弹簧，有轻微过冲但无持续振荡。

**适用场景**：需要快速到位但允许轻微过冲的场景。

---

#### gravityBounce(t, restitution?, gravity?)

```typescript
function gravityBounce(t: number, restitution: number = 0.6, gravity: number = 9.8): number
```

**参数说明：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `t` | number | - | 进度 [0, 1] |
| `restitution` | number | 0.6 | 弹性系数（0-1），值越大弹跳越高 |
| `gravity` | number | 9.8 | 重力加速度 |

**效果**：模拟重力弹跳，物体下落后弹起，逐渐停止。

**适用场景**：弹跳进场（bounceIn）、弹跳出场（bounceOut）。

**常用参数组合**：
- `gravityBounce(t, 0.5, 12)` — 快速弹跳
- `gravityBounce(t, 0.6, 9.8)` — 标准重力弹跳

---

#### momentumEase(t, mass?, friction?)

```typescript
function momentumEase(t: number, mass: number = 1, friction: number = 0.3): number
```

**参数说明：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `t` | number | - | 进度 [0, 1] |
| `mass` | number | 1 | 质量，值越大惯性越大 |
| `friction` | number | 0.3 | 摩擦力，值越大减速越快 |

**效果**：模拟惯性运动，先快后慢，自然减速。

**适用场景**：滑入/滑出动画（slideIn、slideOut）、擦除转场（wipe）。

**常用参数组合**：
- `momentumEase(t, 1.5, 0.4)` — 标准惯性滑入
- `momentumEase(t, 1, 0.3)` — 默认惯性

---

#### snapSpring(t, tension?, friction?)

```typescript
function snapSpring(t: number, tension: number = 300, friction: number = 28): number
```

**参数说明：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `t` | number | - | 进度 [0, 1] |
| `tension` | number | 300 | 张力，值越大弹簧越硬 |
| `friction` | number | 28 | 摩擦力，值越大振荡越少 |

**效果**：快速吸附弹簧，高张力低摩擦时快速到位。

**适用场景**：需要快速吸附到位的 UI 动画。

---

#### elasticOut(t, amplitude?, period?)

```typescript
function elasticOut(t: number, amplitude: number = 1, period: number = 0.3): number
```

**参数说明：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `t` | number | - | 进度 [0, 1] |
| `amplitude` | number | 1 | 振幅 |
| `period` | number | 0.3 | 周期 |

**效果**：弹性缓出，有明显的拉伸回弹。

**适用场景**：弹性进场（elasticIn）。

---

#### whipEffect(t, whipStrength?)

```typescript
function whipEffect(t: number, whipStrength: number = 0.4): number
```

**参数说明：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `t` | number | - | 进度 [0, 1] |
| `whipStrength` | number | 0.4 | 鞭打强度，值越大过冲越明显 |

**效果**：鞭打效果，极快启动后过冲回弹。

**适用场景**：需要"甩"感的动画。

---

#### inertiaDecay(t, initialVelocity?, drag?)

```typescript
function inertiaDecay(t: number, initialVelocity: number = 3, drag: number = 2): number
```

**参数说明：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `t` | number | - | 进度 [0, 1] |
| `initialVelocity` | number | 3 | 初始速度 |
| `drag` | number | 2 | 阻力系数 |

**效果**：惯性衰减，初始高速后逐渐减速停止。

**适用场景**：需要惯性衰减的动画。

### 4.3 噪声和振荡函数

#### perlinNoise1D(t, frequency?, seed?)

```typescript
function perlinNoise1D(t: number, frequency: number = 1, seed: number = 0): number
```

**参数说明：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `t` | number | - | 输入值（通常为 progress） |
| `frequency` | number | 1 | 频率，值越大变化越快 |
| `seed` | number | 0 | 随机种子，不同种子产生不同噪声模式 |

**返回值**：[0, 1] 范围的伪随机值。

**效果**：1D Perlin 噪声，产生平滑的随机变化。

**适用场景**：
- 故障效果（glitch）的随机偏移
- 悬浮漂移（float）的随机运动
- 打字机效果（typewriter）的节奏变化
- 霓虹闪烁（neon）的亮度波动

**常用技巧**：使用 `perlinNoise1D(p, freq, seed) * 2 - 1` 将范围映射到 [-1, 1]。

---

#### dampedOscillation(t, frequency?, dampingRatio?)

```typescript
function dampedOscillation(t: number, frequency: number = 3, dampingRatio: number = 0.3): number
```

**参数说明：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `t` | number | - | 输入值（通常为 progress） |
| `frequency` | number | 3 | 振荡频率 |
| `dampingRatio` | number | 0.3 | 阻尼比，值越大衰减越快 |

**返回值**：振荡值，范围不固定，随阻尼衰减。

**效果**：阻尼振荡，振幅随时间衰减。

**适用场景**：
- 抖动效果（shake）的振荡
- 脉冲效果（pulse）的缩放振荡
- 进场动画的稳定微振（settle wobble）
- 旋转稳定（cubeRotate）

**常用技巧**：乘以 `(1 - t)` 确保在 progress=1 时振荡归零。

---

#### bezierEase(t, x1, y1, x2, y2)

```typescript
function bezierEase(t: number, x1: number, y1: number, x2: number, y2: number): number
```

**参数说明：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `t` | number | - | 进度 [0, 1] |
| `x1` | number | - | 第一个控制点 X |
| `y1` | number | - | 第一个控制点 Y |
| `x2` | number | - | 第二个控制点 X |
| `y2` | number | - | 第二个控制点 Y |

**效果**：自定义三次贝塞尔缓动。

**适用场景**：需要精确匹配 CSS `cubic-bezier()` 的动画。

---

## 5. 预设分类详解

### 5.1 entrance（进场动画）

**特点**：元素从不可见/远处/变形状态过渡到正常显示状态。

**progress 方向**：
- `progress = 0`：元素处于初始状态（不可见、远处、缩小等）
- `progress = 1`：元素处于最终正常状态

**设计原则**：
- opacity 从低到高（0.01 → 1）
- 位移从远处到目标位置
- scale 从小到大或从大到正常
- 使用 `easeOut*` 系列缓动（快进慢停）
- 可添加 settle wobble（稳定微振）增加自然感
- ID 前缀：`entrance_`

**现有预设（18个）**：entrance_fade_in, entrance_fade_in_up, entrance_fade_in_down, entrance_fade_in_left, entrance_fade_in_right, entrance_slide_in_up, entrance_slide_in_down, entrance_slide_in_left, entrance_slide_in_right, entrance_zoom_in, entrance_zoom_in_up, entrance_zoom_in_down, entrance_bounce_in, entrance_elastic_in, entrance_back_in, entrance_flip_in_x, entrance_flip_in_y, entrance_rotate_in

### 5.2 exit（出场动画）

**特点**：元素从正常显示状态过渡到不可见/远处/变形状态。与 entrance 方向相反。

**progress 方向**：
- `progress = 0`：元素处于正常显示状态
- `progress = 1`：元素处于消失状态（不可见、远处、缩小等）

**设计原则**：
- opacity 从高到低（1 → 0.01）
- 位移从目标位置到远处
- scale 从正常到小或大
- 使用 `easeIn*` 系列缓动（慢进快出）
- 可添加出场时的微振或旋转
- ID 前缀：`exit_`

**现有预设（10个）**：exit_fade_out, exit_fade_out_up, exit_fade_out_down, exit_slide_out_up, exit_slide_out_down, exit_slide_out_left, exit_slide_out_right, exit_zoom_out, exit_zoom_out_up, exit_bounce_out

### 5.3 emphasis（强调动画）

**特点**：元素保持可见，通过局部变化（缩放、位移、旋转等）吸引注意力。progress=1 时元素应回到或接近原始状态。

**progress 方向**：
- `progress = 0`：元素处于正常状态
- `progress = 0.5`（左右）：效果最明显
- `progress = 1`：元素回到正常状态

**设计原则**：
- opacity 通常保持为 1
- 使用振荡类缓动（dampedOscillation）产生脉冲效果
- 效果应在 progress=1 时自然衰减归零
- 可使用正弦/余弦函数产生周期性变化
- ID 前缀：`emphasis_`

**现有预设（20个）**：emphasis_pulse, emphasis_pulse_ring, emphasis_pulse_glow, emphasis_shake, emphasis_shake_x, emphasis_shake_y, emphasis_bounce, emphasis_bounce_soft, emphasis_breathe, emphasis_flash, emphasis_flash_soft, emphasis_heartbeat, emphasis_jitter, emphasis_spin, emphasis_swing, emphasis_tutorial_click, emphasis_tutorial_focus, emphasis_wobble, emphasis_focus_zoom, emphasis_bounce

### 5.4 motion（移位动画）

**特点**：元素沿特定路径持续移动，progress=1 时元素可以不在原始位置（循环运动类）或回到原始位置（往复运动类）。

**progress 方向**：
- `progress = 0`：动画开始
- `progress = 1`：动画结束（位置取决于运动类型）

**设计原则**：
- opacity 通常保持为 1
- 使用 perlinNoise1D 产生自然的随机运动
- 使用三角函数产生规则的周期运动
- 可组合多个噪声/振荡产生复杂运动路径
- ID 前缀：`motion_`

**现有预设（13个）**：motion_bounce, motion_drift, motion_drift_slow, motion_float, motion_float_x, motion_float_y, motion_orbit, motion_orbit_slow, motion_spiral, motion_sway, motion_tutorial_focus, motion_wave

### 5.5 fx（视觉特效）

**特点**：通过 CSS filter、颜色变化等产生视觉特效，元素位置通常不变。

**progress 方向**：
- `progress = 0`：效果开始
- `progress = 1`：效果结束
- 某些 fx 预设在整个 progress 范围内持续生效

**设计原则**：
- 大量使用 `filter` 返回值（blur、brightness、drop-shadow、hue-rotate 等）
- transform 通常保持 `currentTransform` 不变
- opacity 通常保持为 1
- 使用 perlinNoise1D 产生闪烁/波动效果
- ID 前缀：`fx_`

**现有预设（19个）**：fx_blur, fx_blur_in, fx_blur_out, fx_brightness, fx_contrast, fx_glassmorphism, fx_glitch, fx_glitch_cyber, fx_glow, fx_glow_pulse, fx_glow_rainbow, fx_grayscale, fx_hue_rotate, fx_neon, fx_neon_pulse, fx_saturate, fx_scanline, fx_shadow, fx_shadow_lift

### 5.6 transition（转场动画）

**特点**：控制两个片段之间的过渡效果，通常涉及 opacity 和位移/旋转的组合。

**progress 方向**：
- `progress = 0`：当前片段完全可见
- `progress = 1`：当前片段完全不可见（下一个片段完全可见）

**设计原则**：
- opacity 从 1 过渡到 0.01
- 常用 easeInOutExpo 等对称缓动
- 可添加旋转、位移等辅助效果
- ID 前缀：`transition_`

**现有预设（5个）**：transition_cross_dissolve, transition_cube_rotate, transition_page_flip, transition_wipe_left, transition_wipe_right

### 5.7 text（文字特效）

**特点**：专门针对文字元素的动画效果。

**progress 方向**：
- `progress = 0`：文字动画开始
- `progress = 1`：文字动画完成

**设计原则**：
- 可使用 opacity 闪烁模拟光标
- 可使用 scale 模拟文字放大
- 可使用 perlinNoise1D 模拟打字节奏
- ID 前缀：`text_`

**现有预设（2个）**：text_scale_up, text_typewriter

---

## 6. 预设代码模板

### 6.1 旧版 PresetDefinition 模板（当前实际使用）

```typescript
import { PresetDefinition } from '../types';
import { /* 按需导入缓动函数 */ } from '../../utils/easing';

export const presetName: PresetDefinition = {
  id: '{category}_{snake_case_name}',
  name: '中文名 (English Name)',
  category: '{category}',
  schema: [
    { key: 'paramKey', label: '参数标签', type: 'number', default: 10, min: 0, max: 50, step: 1 }
  ],
  apply: (progress, params, currentTransform) => {
    const paramKey = Math.max(0, Math.min(50, params.paramKey || 10));
    const t = Math.max(0, Math.min(1, progress));

    // 计算动画值...

    return {
      transform: {
        ...currentTransform,
        // 仅修改需要动画的属性
      },
      opacity: Math.max(0.01, /* opacity值 */)
    };
  }
};
```

### 6.2 无参数预设模板

```typescript
import { PresetDefinition } from '../types';
import { /* 缓动函数 */ } from '../../utils/easing';

export const presetName: PresetDefinition = {
  id: '{category}_{snake_case_name}',
  name: '中文名 (English Name)',
  category: '{category}',
  schema: [],
  apply: (progress, _params, currentTransform) => {
    const t = Math.max(0, Math.min(1, progress));

    return {
      transform: {
        ...currentTransform,
        // 修改属性
      },
      opacity: Math.max(0.01, /* opacity值 */)
    };
  }
};
```

### 6.3 带 filter 的预设模板（fx 分类）

```typescript
import { PresetDefinition } from '../types';
import { /* 缓动函数 */ } from '../../utils/easing';

export const presetName: PresetDefinition = {
  id: 'fx_{snake_case_name}',
  name: '中文名 (English Name)',
  category: 'fx',
  schema: [
    { key: 'intensity', label: '强度', type: 'number', default: 10, min: 0, max: 50, step: 1 }
  ],
  apply: (progress, params, currentTransform) => {
    const intensity = Math.max(0, Math.min(50, params.intensity || 10));
    const p = Math.max(0, Math.min(1, progress));

    // 计算效果值...

    return {
      transform: currentTransform,
      opacity: 1,
      filter: `/* CSS filter 字符串 */`
    };
  }
};
```

---

## 7. 各分类完整代码示例

### 7.1 entrance 示例：fadeIn

```typescript
import { PresetDefinition } from '../types';
import { spring, dampedOscillation, easeOutExpo } from '../../utils/easing';

export const fadeIn: PresetDefinition = {
  id: 'entrance_fade_in',
  name: '淡入 (Fade In)',
  category: 'entrance',
  schema: [
    { key: 'scaleFrom', label: '起始缩放', type: 'number', default: 0.8, min: 0.1, max: 1.5, step: 0.05 }
  ],
  apply: (progress, params, currentTransform) => {
    const scaleFrom = Math.max(0.1, Math.min(1.5, params.scaleFrom || 0.8));
    const t = Math.max(0, Math.min(1, progress));
    const scaleEased = spring(t, 120, 14, 1);
    const opacityEased = easeOutExpo(t);
    const scale = scaleFrom + (1 - scaleFrom) * scaleEased;
    const settleWobble = t < 1 ? dampedOscillation(t, 4, 0.25) * 0.02 * (1 - t) : 0;

    return {
      transform: {
        ...currentTransform,
        scale: Math.max(0.001, currentTransform.scale * (scale + settleWobble))
      },
      opacity: Math.max(0.01, opacityEased)
    };
  }
};
```

### 7.2 exit 示例：fadeOut

```typescript
import { PresetDefinition } from '../types';
import { easeInExpo, easeInQuint, dampedOscillation } from '../../utils/easing';

export const fadeOut: PresetDefinition = {
  id: 'exit_fade_out',
  name: '基础淡出 (Fade Out)',
  category: 'exit',
  schema: [],
  apply: (progress, _params, currentTransform) => {
    const t = Math.max(0, Math.min(1, progress));
    const opacityEased = easeInExpo(t);
    const scaleEased = easeInQuint(t);
    const wobble = dampedOscillation(t, 2, 0.5) * 0.5 * (1 - t);

    return {
      transform: {
        ...currentTransform,
        scale: Math.max(0.001, currentTransform.scale * (1 - 0.08 * scaleEased)),
        rotation: currentTransform.rotation + wobble
      },
      opacity: Math.max(0.01, 1 - opacityEased)
    };
  }
};
```

### 7.3 emphasis 示例：pulse

```typescript
import { PresetDefinition } from '../types';
import { dampedOscillation } from '../../utils/easing';

export const pulse: PresetDefinition = {
  id: 'emphasis_pulse',
  name: '心跳脉冲 (Pulse)',
  category: 'emphasis',
  schema: [
    { key: 'speed', label: '速度', type: 'number', default: 2, min: 0.5, max: 5, step: 0.1 },
    { key: 'strength', label: '强度', type: 'number', default: 0.1, min: 0.02, max: 0.3, step: 0.01 }
  ],
  apply: (progress, params, currentTransform) => {
    const speed = Math.max(0.5, Math.min(5, params.speed || 2));
    const strength = Math.max(0.02, Math.min(0.3, params.strength || 0.1));
    const p = Math.max(0, Math.min(1, progress));

    const frequency = speed * 1.5 + 2;
    const dampingRatio = 0.25;
    const oscillation = dampedOscillation(p, frequency, dampingRatio);
    const scaleDelta = 1 + oscillation * strength * 2;

    return {
      transform: {
        ...currentTransform,
        scale: Math.max(0.001, currentTransform.scale * scaleDelta)
      },
      opacity: 1
    };
  }
};
```

### 7.4 motion 示例：float

```typescript
import { PresetDefinition } from '../types';
import { perlinNoise1D } from '../../utils/easing';

export const float: PresetDefinition = {
  id: 'motion_float',
  name: '悬浮漂移 (Float)',
  category: 'motion',
  schema: [
    { key: 'range', label: '范围', type: 'number', default: 20, min: 5, max: 100, step: 5 },
    { key: 'speed', label: '速度', type: 'number', default: 1, min: 0.1, max: 3, step: 0.1 }
  ],
  apply: (progress, params, currentTransform) => {
    const range = Math.max(5, Math.min(100, params.range || 20));
    const speed = Math.max(0.1, Math.min(3, params.speed || 1));
    const p = Math.max(0, Math.min(1, progress));

    const noiseY = perlinNoise1D(p, speed * 3, 0) * 2 - 1;
    const noiseX = perlinNoise1D(p, speed * 1.5, 42) * 2 - 1;
    const yOffset = noiseY * range;
    const xOffset = noiseX * range * 0.3;

    return {
      transform: {
        ...currentTransform,
        x: currentTransform.x + xOffset,
        y: currentTransform.y + yOffset
      },
      opacity: 1
    };
  }
};
```

### 7.5 fx 示例：glitch

```typescript
import { PresetDefinition } from '../types';
import { perlinNoise1D } from '../../utils/easing';

export const glitch: PresetDefinition = {
  id: 'fx_glitch',
  name: '故障效果 (Glitch)',
  category: 'fx',
  schema: [
    { key: 'intensity', label: '强度', type: 'number', default: 10, min: 0, max: 50, step: 1 },
    { key: 'rgbShift', label: 'RGB分离', type: 'number', default: 3, min: 0, max: 10, step: 0.5 }
  ],
  apply: (progress, params, currentTransform) => {
    const intensity = Math.max(0, Math.min(50, params.intensity || 10));
    const rgbShift = Math.max(0, Math.min(10, params.rgbShift || 3));
    const p = Math.max(0, Math.min(1, progress));

    const glitchNoise1 = perlinNoise1D(p, 15, 0) * 2 - 1;
    const glitchNoise2 = perlinNoise1D(p, 20, 33) * 2 - 1;
    const glitchOffset = glitchNoise1 * intensity;
    const scaleX = 1 + glitchNoise2 * 0.03;

    return {
      transform: {
        ...currentTransform,
        x: currentTransform.x + glitchOffset,
        scale: Math.max(0.001, currentTransform.scale * scaleX)
      },
      opacity: 1,
      filter: `drop-shadow(${rgbShift}px 0 0 rgba(255, 0, 0, 0.5)) drop-shadow(-${rgbShift}px 0 0 rgba(0, 255, 255, 0.5))`
    };
  }
};
```

### 7.6 transition 示例：cubeRotate

```typescript
import { PresetDefinition } from '../types';
import { dampedOscillation } from '../../utils/easing';

export const cubeRotate: PresetDefinition = {
  id: 'transition_cube_rotate',
  name: '立方体旋转 (Cube Rotate)',
  category: 'transition',
  schema: [],
  apply: (progress, params, currentTransform) => {
    const p = Math.max(0, Math.min(1, progress));
    const settle = 1 + dampedOscillation(p, 2, 0.15) * 0.08;
    const eased = p * settle;

    return {
      transform: {
        ...currentTransform,
        rotation: currentTransform.rotation + 90 * (1 - eased)
      },
      opacity: Math.max(0.01, eased)
    };
  }
};
```

### 7.7 text 示例：typewriter

```typescript
import { PresetDefinition } from '../types';
import { perlinNoise1D } from '../../utils/easing';

export const typewriter: PresetDefinition = {
  id: 'text_typewriter',
  name: '打字机 (Typewriter)',
  category: 'text',
  schema: [
    { key: 'speed', label: '速度', type: 'number', default: 1, min: 0.1, max: 3, step: 0.1 }
  ],
  apply: (progress, params, currentTransform) => {
    const speed = Math.max(0.1, Math.min(3, params.speed || 1));
    const p = Math.max(0, Math.min(1, progress));

    const rhythmNoise = perlinNoise1D(p, speed * 8, 0);
    const variableSpeed = speed * 10 * (0.7 + rhythmNoise * 0.6);
    const blink = Math.floor(p * variableSpeed) % 2 === 0 ? 1 : 0.7;

    return {
      transform: currentTransform,
      opacity: p < 1 ? blink : 1
    };
  }
};
```

### 7.8 带延迟参数的 entrance 示例：bounceIn

```typescript
import { PresetDefinition } from '../types';
import { gravityBounce, springBounce, easeOutExpo } from '../../utils/easing';

export const bounceIn: PresetDefinition = {
  id: 'entrance_bounce_in',
  name: '弹跳进入 (Bounce In)',
  category: 'entrance',
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
    const t = Math.max(0, Math.min(1, effectiveProgress));
    const bounceScale = gravityBounce(t, 0.5, 12);
    const settleScale = springBounce(t, 3, 4);
    const combinedScale = bounceScale * 0.85 + settleScale * 0.15;
    const wobble = t < 1 ? Math.sin(t * Math.PI * 4) * 0.03 * (1 - t) * (1 - t) : 0;

    return {
      transform: {
        ...currentTransform,
        scale: Math.max(0.001, currentTransform.scale * (combinedScale + wobble))
      },
      opacity: Math.max(0.01, Math.min(1, easeOutExpo(t)))
    };
  }
};
```

### 7.9 带 boolean 参数的 exit 示例：bounceOut

```typescript
import { PresetDefinition } from '../types';
import { gravityBounce, easeInExpo, dampedOscillation } from '../../utils/easing';

export const bounceOut: PresetDefinition = {
  id: 'exit_bounce_out',
  name: '弹跳消失 (Bounce Out)',
  category: 'exit',
  schema: [
    { key: 'fadeOut', label: '淡出', type: 'boolean', default: true },
    { key: 'targetScale', label: '目标缩放', type: 'number', default: 0, min: 0, max: 0.5, step: 0.05 }
  ],
  apply: (progress, params, currentTransform) => {
    const t = Math.max(0, Math.min(1, progress));
    const targetScale = Math.max(0, Math.min(0.5, params.targetScale || 0));
    const fadeOut = params.fadeOut !== false;

    const bounceEased = gravityBounce(t, 0.5, 9.8);
    const scale = 1 - (1 - targetScale) * bounceEased;
    const opacityEased = easeInExpo(t);
    const wobble = dampedOscillation(t, 5, 0.3) * 4 * (1 - t);
    const squash = 1 + dampedOscillation(t, 6, 0.5) * 0.08 * (1 - t);

    return {
      transform: {
        ...currentTransform,
        scale: Math.max(0.001, currentTransform.scale * scale * squash),
        rotation: currentTransform.rotation + wobble
      },
      opacity: fadeOut ? Math.max(0.01, 1 - opacityEased) : 1
    };
  }
};
```

### 7.10 带 color 参数的 fx 示例：neon

```typescript
import { PresetDefinition } from '../types';
import { perlinNoise1D } from '../../utils/easing';

export const neon: PresetDefinition = {
  id: 'fx_neon',
  name: '霓虹效果 (Neon)',
  category: 'fx',
  schema: [
    { key: 'color', label: '颜色', type: 'color', default: '#ff00ff' },
    { key: 'intensity', label: '强度', type: 'number', default: 25, min: 0, max: 100, step: 5 },
    { key: 'spread', label: '扩散', type: 'number', default: 15, min: 0, max: 50, step: 1 }
  ],
  apply: (progress, params, currentTransform) => {
    const color = params.color || '#ff00ff';
    const intensity = Math.max(0, Math.min(100, params.intensity || 25));
    const spread = Math.max(0, Math.min(50, params.spread || 15));
    const p = Math.max(0, Math.min(1, progress));

    const flickerNoise = perlinNoise1D(p, 12, 0) * 0.3 + perlinNoise1D(p, 25, 99) * 0.15;
    const flickerFactor = 0.7 + flickerNoise;
    const glowIntensity = intensity * flickerFactor;

    return {
      transform: currentTransform,
      opacity: 1,
      filter: `brightness(1.2) drop-shadow(0 0 ${spread * flickerFactor}px ${color}) drop-shadow(0 0 ${spread * 2 * flickerFactor}px ${color}) drop-shadow(0 0 ${spread * 4 * flickerFactor}px ${color})`
    };
  }
};
```

---

## 8. 注册和集成步骤

### 8.1 创建预设文件

在对应分类目录下创建 `.ts` 文件，文件名使用 camelCase：

```
src/engine/presets/entrance/myNewEffect.ts
```

### 8.2 编写预设代码

使用 `PresetDefinition` 格式编写预设，导出命名变量：

```typescript
import { PresetDefinition } from '../types';
import { easeOutExpo } from '../../utils/easing';

export const myNewEffect: PresetDefinition = {
  id: 'entrance_my_new_effect',
  name: '我的新效果 (My New Effect)',
  category: 'entrance',
  schema: [],
  apply: (progress, _params, currentTransform) => {
    const t = Math.max(0, Math.min(1, progress));
    return {
      transform: currentTransform,
      opacity: Math.max(0.01, easeOutExpo(t))
    };
  }
};
```

### 8.3 在分类 index.ts 中导出

在对应分类的 `index.ts` 中添加导出语句：

```typescript
// src/engine/presets/entrance/index.ts
export { myNewEffect } from './myNewEffect';
```

### 8.4 自动收集

`src/engine/presets/index.ts` 中的 `collectPresets()` 函数会自动通过模块导入收集所有预设，无需手动修改此文件（前提是分类 index.ts 已正确导出）。

### 8.5 手动注册（可选）

如果需要在运行时动态注册预设：

```typescript
import { registerPreset } from '../../engine/presets';
import { myNewEffect } from './myNewEffect';

registerPreset(myNewEffect);
```

### 8.6 新版 PresetRegistry 注册（可选）

如果需要将预设注册到新版 PresetRegistry 单例：

```typescript
import presetRegistry from '../../modules/preset/PresetRegistry';
import { EffectRenderMode } from '../../modules/preset/PresetTypes';

presetRegistry.register({
  ...myNewEffect,
  renderMode: EffectRenderMode.CANVAS_2D,
  gpuSafeProps: ['transform', 'opacity']
});
```

---

## 9. PresetRegistry 完整 API 参考

`PresetRegistry` 是单例模式，通过 `PresetRegistry.getInstance()` 或直接导入 `presetRegistry` 获取实例。

```typescript
import presetRegistry from '../../modules/preset/PresetRegistry';
```

### 方法列表

| 方法 | 签名 | 说明 |
|------|------|------|
| `register` | `(preset: AnimationEffect) => void` | 注册预设。如果 id 或 apply 缺失会抛出错误 |
| `unregister` | `(id: string) => void` | 注销预设 |
| `get` | `(id: string) => AnimationEffect \| undefined` | 按 ID 获取预设 |
| `getByCategory` | `(category: PresetCategory) => AnimationEffect[]` | 按分类获取所有预设 |
| `getAll` | `() => AnimationEffect[]` | 获取所有已注册预设 |
| `findByName` | `(name: string) => AnimationEffect \| undefined` | 按名称模糊搜索预设（不区分大小写） |
| `getCategories` | `() => PresetCategory[]` | 获取所有已有预设的分类列表 |
| `has` | `(id: string) => boolean` | 检查预设是否已注册 |
| `clear` | `() => void` | 清空所有已注册预设 |
| `getRegistryItems` | `() => PresetRegistryItem[]` | 获取所有预设的 RegistryItem（含 renderFn） |

### 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `count` | `number`（getter） | 已注册预设数量 |

---

## 10. AnimationEngine 完整 API 参考

```typescript
import { AnimationEngine } from '../../modules/preset/core/AnimationEngine';
```

### 10.1 animate(options)

创建并播放一个动画，返回 `AnimationController`。

```typescript
AnimationEngine.animate<Record<string, number>>({
  target: { x: 0, y: 0, scale: 1 },
  from: { x: 100 },           // 可选，起始值
  to: { x: 0, y: 100, scale: 2 }, // 目标值
  duration: 0.6,              // 可选，持续时间（秒），默认 0.6
  easing: 'easeOutExpo',      // 可选，缓动函数名或自定义函数
  spring: { stiffness: 180, damping: 12, mass: 1 }, // 可选，弹簧配置（设置后 duration 自动为 2s）
  delay: 0,                   // 可选，延迟时间（秒）
  loop: false,                // 可选，是否循环
  yoyo: false,                // 可选，是否往返
  gpuAccelerated: true,       // 可选，是否启用 GPU 加速检测，默认 true
  onUpdate: (values, progress) => {}, // 每帧回调
  onComplete: (values) => {},  // 完成回调
  onStart: () => {}            // 开始回调
});
```

### 10.2 stagger(targets, options)

对多个目标创建交错动画，返回 `AnimationController[]`。

```typescript
AnimationEngine.stagger(
  [{ x: 0 }, { x: 0 }, { x: 0 }],
  {
    options: {
      to: { x: 100 },
      duration: 0.5,
      stagger: 100,             // 交错延迟（毫秒），或函数 (index, total) => number
      from: 'start',            // 可选：'start' | 'end' | 'center' | 'edges' | number
    }
  }
);
```

### 10.3 timeline()

创建时间轴，用于编排多个动画的顺序执行。

```typescript
const tl = AnimationEngine.timeline();
tl.add(target, { to: { x: 100 }, duration: 0.5 });
tl.delay(0.2);
tl.to(target, { y: 200, duration: 0.3 });
tl.fromTo(target, { x: 0 }, { to: { x: 100 }, duration: 0.4 });
tl.play();
tl.pause();
tl.stop();
tl.seek(0.5);
tl.dispose();
```

### 10.4 全局控制

| 方法 | 签名 | 说明 |
|------|------|------|
| `globalPause` | `() => void` | 暂停所有活动动画 |
| `globalResume` | `() => void` | 恢复所有活动动画 |
| `getActiveAnimationsCount` | `() => number` | 获取活动动画数量 |
| `getPerformanceMetrics` | `() => object` | 获取性能指标 |
| `disposeAll` | `() => void` | 销毁所有动画 |

### 10.5 AnimationController

| 方法/属性 | 签名 | 说明 |
|-----------|------|------|
| `id` | `string` | 动画 ID |
| `play` | `() => void` | 播放 |
| `pause` | `() => void` | 暂停 |
| `resume` | `() => void` | 恢复 |
| `stop` | `() => void` | 停止并销毁 |
| `seek` | `(progress: number) => void` | 跳转到指定进度 |
| `getCurrentValues` | `() => T` | 获取当前值 |
| `getProgress` | `() => number` | 获取当前进度 |
| `isPlaying` | `() => boolean` | 是否正在播放 |
| `dispose` | `() => void` | 销毁动画 |

---

## 11. AI 导演模式集成说明

AI 导演模式通过工具调用的方式使用预设系统。

### 11.1 apply_preset_effect 工具

为指定片段应用动画预设效果。

**参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `clipId` | string | 是 | 目标片段 ID |
| `presetId` | string | 是 | 预设 ID（如 `"entrance_fade_in"`） |
| `params` | object | 否 | 预设参数（键名与 schema 中的 key 对应） |

**使用示例：**

```json
{
  "tool": "apply_preset_effect",
  "params": {
    "clipId": "clip_001",
    "presetId": "entrance_fade_in",
    "params": {
      "scaleFrom": 0.5
    }
  }
}
```

### 11.2 create_custom_preset 工具

创建新的自定义动画预设。

**参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `presetId` | string | 是 | 预设唯一 ID |
| `name` | string | 是 | 预设显示名称 |
| `category` | string | 是 | 预设类别 |
| `keyframes` | array | 是 | 关键帧定义数组 |

### 11.3 Store API

AI 导演也可通过 Store API 直接操作：

```typescript
// 应用特效到片段
store.addEffectToClip(clipId, presetId);

// 添加片段
store.addClip(asset, trackId, time, type);

// 更新片段
store.updateClip(id, changes);

// 删除片段
store.removeClip(id);
```

### 11.4 projectAdapter API

```typescript
// 应用特效到片段（带参数）
projectAdapter.applyEffectToClip(clipId, presetId, params?);

// 添加片段到项目
projectAdapter.addClipToProject(input);

// 更新片段
projectAdapter.updateClip(id, changes);
```

---

## 12. GPU 加速规则和性能优化

### 12.1 GPU 安全属性

以下 CSS 属性可被 GPU 加速（通过 transform 和 opacity 实现）：

- `transform`（translate、scale、rotate）
- `opacity`

### 12.2 非 GPU 安全属性

以下 CSS 属性**不能**被 GPU 加速，每帧都会触发重排/重绘：

- `width`, `height`
- `top`, `left`
- `margin`, `padding`
- `background-color`, `color`
- `border`
- `box-shadow`
- `filter`

### 12.3 AnimationEffect 中的 gpuSafeProps

在新版 `AnimationEffect` 中，必须声明 `gpuSafeProps` 数组：

```typescript
const effect: AnimationEffect = {
  // ...其他字段
  gpuSafeProps: ['transform', 'opacity'] // 仅包含 GPU 安全属性
};
```

如果预设使用了 `filter`，则 `filter` 不应列入 `gpuSafeProps`。

### 12.4 性能优化建议

1. **优先使用 transform 和 opacity**：这两个属性可被 GPU 加速，性能最优。
2. **避免频繁使用 filter**：filter（blur、drop-shadow 等）消耗较大，尤其是 blur 半径较大时。
3. **减少 perlinNoise1D 调用频率**：在单个 apply 函数中，perlinNoise1D 调用不宜超过 4-5 次。
4. **避免复杂计算**：apply 函数每帧调用一次，应保持计算简洁。
5. **使用 Math.max 保护避免 NaN**：NaN 会导致整个渲染管线中断。
6. **gravityBounce 性能注意**：gravityBounce 内部使用迭代模拟，调用时注意参数合理性。

### 12.5 AnimationEngine 的 GPU 检测

AnimationEngine 在创建动画时会自动检测非 GPU 安全属性并发出警告：

```typescript
if (options.gpuAccelerated !== false) {
  const validation = validateAnimationProps(propsToValidate);
  if (!validation.valid) {
    console.warn(`Non-GPU-accelerated properties detected:`, validation.unsafeProps);
  }
}
```

---

## 13. 常见错误和调试指南

### 13.1 元素消失/不可见

**原因**：
- opacity 为 0 或负数
- scale 为 0 或负数
- 元素被移到画布外

**解决**：
- 确保使用 `Math.max(0.01, opacity)` 和 `Math.max(0.001, scale)`
- 检查位移值是否合理

### 13.2 动画结束后元素状态异常

**原因**：
- progress=1 时的返回值不是期望的最终状态
- 没有使用 `...currentTransform` 保留原有变换

**解决**：
- 检查 progress=1 时 apply 函数的返回值
- 确保使用展开运算符保留 currentTransform

### 13.3 参数不生效

**原因**：
- schema 中的 key 与 apply 中 params 的键名不一致
- boolean 参数使用了 `||` 运算符

**解决**：
- 确保 schema.key 与 params 中的键名完全一致
- boolean 参数使用 `!== false` 或 `=== true`

### 13.4 预设未注册

**原因**：
- 未在分类 index.ts 中导出
- 文件名与导出变量名不匹配

**解决**：
- 在分类 index.ts 中添加 `export { xxx } from './xxx';`
- 确认文件名和导出名一致

### 13.5 动画抖动/闪烁

**原因**：
- 缓动函数返回值超出 [0, 1] 范围（如 spring 的过冲）
- perlinNoise1D 产生过大的偏移

**解决**：
- 对最终值进行合理范围限制
- 使用 `(1 - t)` 衰减因子控制振幅
- spring 过冲是正常物理行为，可通过调整 damping 减小

### 13.6 NaN 或 Infinity 错误

**原因**：
- 除以 0
- Math.pow 溢出
- 未对 params 做范围保护

**解决**：
- 除法使用 `Math.max(0.001, divisor)` 保护
- 所有 params 值使用 Math.max/Math.min 保护
- 中间计算添加合理性检查

### 13.7 预设 ID 冲突

**原因**：
- 新预设 ID 与已有预设重复

**解决**：
- 查看现有预设列表，确保 ID 唯一
- 遵循 `{category}_{name}` 命名规范

---

## 14. 视觉效果设计哲学（预设视角）

> 本章从视觉效果设计哲学出发，适配预设系统的 CSS Transform/Opacity/Filter 渲染模式，指导 AI 开发出视觉品质远超普通水平的预设。

### 14.1 什么是"让人眼前一亮"的效果？

让人眼前一亮的效果，不是单纯的"花哨"，而是**信息密度与感知效率的平衡**。核心要素拆解：

| 要素 | 含义 | 权重 | 预设实现方式 |
|------|------|------|-------------|
| **层次感** | 画面有明确的前景、中景、背景分离，不是扁平的一层 | 30% | 通过 transform.scale 和 opacity 差异制造深度 |
| **动态感** | 即使是静态画面，也有微妙的呼吸、闪烁、流动 | 25% | 通过 dampedOscillation/perlinNoise1D 驱动 transform 微变 |
| **光影真实** | 光源方向一致，高光/阴影/反射符合物理直觉 | 20% | 通过 filter: drop-shadow() 和 brightness() 模拟 |
| **色彩和谐** | 配色有主题，不是随机堆砌，有明确的情绪基调 | 15% | 通过 filter: hue-rotate() 和 saturate() 调整 |
| **细节丰富** | 噪点、扫描线、微粒子等"质感层"让画面不"干净得假" | 10% | 通过 filter 组合和 perlinNoise1D 微扰实现 |

**关键洞察**：最让人印象深刻的视觉效果，往往不是"信息量最大"的，而是**每个层次都恰到好处**的。层次感是第一优先级——一个有3层深度、每层只做1件事的效果，远胜于1层做了5件事的扁平效果。

### 14.2 视觉层次理论：四层架构（预设视角）

所有高质量预设视觉效果都可以拆解为四层，**从后往前**依次作用于元素：

```
┌─────────────────────────────────────────────┐
│  第四层：后处理层（Post-Processing）          │
│  CSS filter: blur / brightness / saturate    │
├─────────────────────────────────────────────┤
│  第三层：装饰层（Decoration）                 │
│  微粒子偏移、光晕抖动、扫描线位移             │
├─────────────────────────────────────────────┤
│  第二层：主体层（Subject）                    │
│  元素本身的 transform + opacity 动画          │
├─────────────────────────────────────────────┤
│  第一层：背景层（Background）                 │
│  基底 transform 状态 + filter 氛围            │
└─────────────────────────────────────────────┘
```

**每层的职责（预设视角）**：

- **背景层**：通过 filter 建立氛围和色调（如 `brightness(0.8) saturate(1.2)`），绝不能是"无处理"的默认状态。
- **主体层**：元素的 transform（x/y/scale/rotation）和 opacity 动画，承载核心运动信息。使用 spring/dampedOscillation 让运动"站出来"。
- **装饰层**：通过 perlinNoise1D 驱动 transform 的微偏移和 filter 的微波动，让静止元素也有生命力。
- **后处理层**：通过 CSS filter 统一画面质感。`drop-shadow()` 建立光影关系，`brightness()` + `saturate()` 添加视觉冲击。

**预设中的四层结构示例**：

```typescript
apply: (progress, params, currentTransform) => {
  const t = Math.max(0, Math.min(1, progress));

  // ===== 第一层：背景层 =====
  const baseBrightness = 0.85 + t * 0.15;

  // ===== 第二层：主体层 =====
  const scaleEased = spring(t, 120, 14, 1);
  const opacityEased = easeOutExpo(t);

  // ===== 第三层：装饰层 =====
  const microBounce = perlinNoise1D(t * 3, 2, 0) * 0.01;

  // ===== 第四层：后处理层 =====
  const shadowBlur = 10 + scaleEased * 20;

  return {
    transform: {
      ...currentTransform,
      scale: Math.max(0.001, currentTransform.scale * (scaleEased + microBounce))
    },
    opacity: Math.max(0.01, opacityEased),
    filter: `brightness(${baseBrightness}) drop-shadow(0 0 ${shadowBlur}px rgba(0, 212, 255, 0.3))`
  };
}
```

### 14.3 动态 vs 静态：为什么微动画比完全静止更有质感

**核心原理**：人眼对运动极度敏感。一个完全静止的画面，大脑会在 200ms 内将其归类为"非活物"而降低注意力。而一个有微妙呼吸、闪烁、漂浮的画面，大脑会持续关注，因为"它还活着"。

**预设中的三种微动画**：

1. **呼吸微动**：`dampedOscillation` 产生的低频微振，让物体看起来在"呼吸"
   ```typescript
   const breathe = dampedOscillation(t * 2, 1.5, 0.1) * 0.015;
   const scale = 1 + breathe;
   ```

2. **闪烁脉冲**：`sin` 函数驱动的亮度波动，让发光体看起来在"脉动"
   ```typescript
   const blinkValue = (Math.sin(t * Math.PI * 6) + 1) / 2;
   const currentBrightness = 1 + blinkValue * 0.3;
   ```

3. **自然漂移**：`perlinNoise1D` 驱动的位置微偏移，让物体看起来在"漂浮"
   ```typescript
   const microBounce = perlinNoise1D(t * 1.5, 1, 0) * 0.02;
   const yOffset = microBounce * 3;
   ```

**关键参数范围**：微动画的幅度必须极小（0.01-0.03 的缩放变化，1-3px 的位置偏移），否则会从"有质感"变成"在抖动"。

### 14.4 色彩心理学与配色策略

**14种配色的情绪定位**：

| 配色 | 情绪 | 适用场景 | 关键特征 | 预设 filter 模拟 |
|------|------|----------|----------|-----------------|
| `aurora` | 神秘、自然 | 极光、自然现象 | 绿→蓝→紫 | `hue-rotate(120deg) saturate(1.5)` |
| `cyberpunk` | 叛逆、未来 | 赛博朋克UI | 全谱 | `hue-rotate(180deg) saturate(2)` |
| `sunset` | 温暖、怀旧 | 日落、温暖场景 | 暖橙→深蓝 | `hue-rotate(-15deg) saturate(1.3)` |
| `ocean` | 深邃、宁静 | 海洋、深度 | 深蓝→浅蓝 | `hue-rotate(200deg) saturate(1.2)` |
| `neon` | 活力、刺激 | 霓虹灯、派对 | 高饱和 | `saturate(2) brightness(1.2)` |
| `fire` | 热烈、危险 | 火焰、爆炸 | 黑→红→黄 | `hue-rotate(-30deg) saturate(1.8)` |
| `galaxy` | 宇宙、神秘 | 银河、星空 | 深蓝→紫 | `hue-rotate(240deg) saturate(1.4)` |
| `glass` | 通透、精致 | 毛玻璃UI | 极低饱和 | `saturate(0.5) brightness(1.1)` |
| `premium` | 高端、奢华 | 高端卡片、按钮 | 金属感 | `saturate(0.8) brightness(1.05)` |
| `matrix` | 科技、黑客 | 代码雨、终端 | 纯绿 | `hue-rotate(90deg) saturate(3)` |
| `dream` | 梦幻、浪漫 | 梦境、渐变 | 紫→粉→蓝 | `hue-rotate(270deg) saturate(1.3)` |
| `ember` | 温暖、余烬 | 余烬、暖光 | 黑→橙→黄 | `hue-rotate(-20deg) saturate(1.5)` |
| `frost` | 清冷、冰霜 | 冰雪、冷调 | 浅蓝→深蓝 | `hue-rotate(190deg) saturate(0.8)` |
| `royal` | 皇家、尊贵 | 高端UI、徽章 | 深蓝→紫 | `hue-rotate(250deg) saturate(1.2)` |

**配色策略原则（预设视角）**：

1. **一个主色，一个辅助色**：不要使用超过2种主色调。通过 `filter: hue-rotate()` 在两色之间过渡。
2. **暗底亮主**：背景用低 brightness，主体用高 brightness + drop-shadow 发光。
3. **用 brightness 制造明暗变化**：同一颜色的亮度变化比换色更有层次感。通过 `filter: brightness()` 动态调整。
4. **透明度是第三维度**：同一颜色不同 opacity 可以制造深度。远处的东西更透明，近处更不透明。

---

## 15. 物理真实感核心原理（预设视角）

> 本章聚焦于预设可用的物理缓动函数，说明如何在 `apply` 函数返回的 `{transform, opacity, filter?}` 中实现物理真实感。物理缓动主要用于计算 transform 的 x/y/scale/rotation 值和 opacity 值。

### 15.1 弹簧物理：spring / snapSpring / criticalSpring

弹簧是物理动画的基石。理解三个参数的物理含义是调优的关键：

**`spring(t, stiffness=180, damping=12, mass=1)`**

| 参数 | 物理含义 | 增大效果 | 减小效果 |
|------|----------|----------|----------|
| `stiffness` | 弹簧刚度 | 振荡更快、弹力更强 | 振荡更慢、更柔和 |
| `damping` | 阻尼系数 | 更快停止、振荡更少 | 振荡更多、更"弹" |
| `mass` | 物体质量 | 振荡更慢、惯性更大 | 振荡更快、更灵敏 |

**阻尼比 ζ = damping / (2 * √(stiffness * mass))** 决定运动类型：

- **ζ < 1（欠阻尼）**：有振荡，会过冲后回弹。**这是最常用的模式**。
- **ζ = 1（临界阻尼）**：最快到达目标，无振荡。
- **ζ > 1（过阻尼）**：缓慢接近目标，无振荡。

**参数调优实战（预设 apply 函数中）**：

```typescript
// 轻盈弹跳（UI元素入场）—— 振荡明显但不夸张
const scaleEased = spring(t, 120, 10, 1);    // ζ ≈ 0.14，明显弹跳
return { transform: { ...currentTransform, scale: Math.max(0.001, currentTransform.scale * scaleEased) }, opacity: 1 };

// 快速吸附（按钮出现）—— 快速到位，微弹
const scaleEased = snapSpring(t, 350, 30);    // tension高→快，friction适中→微弹
return { transform: { ...currentTransform, scale: Math.max(0.001, currentTransform.scale * scaleEased) }, opacity: 1 };

// 柔和展开（魔法阵出现）—— 有仪式感的展开
const scaleEased = spring(t, 100, 14, 1);    // ζ ≈ 0.22，优雅弹跳
return { transform: { ...currentTransform, scale: Math.max(0.001, currentTransform.scale * scaleEased) }, opacity: 1 };

// 重物落地（沉重感）—— 低刚度高阻尼
const yEased = spring(t, 60, 20, 2);         // ζ ≈ 0.58，几乎无弹跳，缓慢到位
return { transform: { ...currentTransform, y: currentTransform.y + yEased * 100 }, opacity: 1 };

// 极度弹性（弹簧玩具）—— 高刚度低阻尼
const scaleEased = spring(t, 300, 5, 1);     // ζ ≈ 0.045，疯狂振荡
return { transform: { ...currentTransform, scale: Math.max(0.001, currentTransform.scale * scaleEased) }, opacity: 1 };
```

**`snapSpring(t, tension=300, friction=28)`** —— 简化的弹簧模型：

- `tension` 等价于 `stiffness`，控制速度
- `friction` 等价于 `damping`，控制振荡次数
- 内部自动计算阻尼比，更适合UI场景

```typescript
// 按钮快速吸附
const scaleEased = snapSpring(enterProgress, 350, 30);

// 涟漪扩散
const radiusEased = snapSpring(rippleProgress, 400, 32);

// 卡片入场
const scaleEased = snapSpring(enterProgress, 300, 28);
```

**`criticalSpring(t, overshoot=0.15)`** —— 临界阻尼弹簧：

- 几乎无振荡，最快到达目标
- `overshoot` 控制微小过冲量
- 适合"需要快速到位但不能弹"的场景

### 15.2 重力与弹跳：gravityBounce / springBounce

**`gravityBounce(t, restitution=0.6, gravity=9.8)`**

这是真实的物理模拟——物体从高处落下，每次弹跳损失能量。

- `restitution`（恢复系数）：0 = 完全非弹性（落地不弹），1 = 完全弹性（永远弹）
- `gravity`：重力加速度，影响下落速度

```typescript
// 篮球弹跳 —— 中等弹性
const yEased = gravityBounce(t, 0.75, 9.8);
return { transform: { ...currentTransform, y: currentTransform.y + (1 - yEased) * 200 }, opacity: 1 };

// 钢球弹跳 —— 高弹性
const yEased = gravityBounce(t, 0.9, 9.8);

// 黏土落地 —— 几乎不弹
const yEased = gravityBounce(t, 0.2, 9.8);

// 月球弹跳 —— 低重力
const yEased = gravityBounce(t, 0.7, 1.6);

// 超重弹跳 —— 高重力快速落地
const yEased = gravityBounce(t, 0.5, 20);
```

**`springBounce(t, bounces=4, decay=3.5)`**

数学近似的弹跳，不是物理模拟，但更容易控制：

- `bounces`：弹跳次数
- `decay`：衰减速度，值越大弹跳衰减越快

```typescript
// 标准弹跳
const scaleEased = springBounce(t, 4, 3.5);

// 快速衰减（只弹2-3次）
const scaleEased = springBounce(t, 3, 5);

// 持续弹跳（弹很多次）
const scaleEased = springBounce(t, 8, 2);
```

### 15.3 阻尼振荡：dampedOscillation

**`dampedOscillation(t, frequency=3, dampingRatio=0.3)`**

这是制造"稳定微振"的核心工具。返回值在正负之间振荡并逐渐衰减到0。

| 参数 | 增大效果 | 减小效果 |
|------|----------|----------|
| `frequency` | 振荡更快（更"紧张"） | 振荡更慢（更"慵懒"） |
| `dampingRatio` | 更快停止（更"僵硬"） | 持续更久（更"柔软"） |

**预设中的实战用法**：

```typescript
// 卡片倾斜的自然晃动
const tiltOsc = dampedOscillation(t * 0.3, 1.2, 0.08);
const rotation = tiltOsc * 5;
return { transform: { ...currentTransform, rotation: currentTransform.rotation + rotation }, opacity: 1 };

// 按钮呼吸微动
const breathe = dampedOscillation(t * 2, 1.5, 0.1) * 0.015;
return { transform: { ...currentTransform, scale: Math.max(0.001, currentTransform.scale * (1 + breathe)) }, opacity: 1 };

// 装饰点脉动
const dotOsc = dampedOscillation(t * 2, 1.5, 0.12);
const scaleDelta = 0.8 + Math.abs(dotOsc) * 0.6;
return { transform: { ...currentTransform, scale: Math.max(0.001, currentTransform.scale * scaleDelta) }, opacity: 1 };
```

**关键技巧**：`dampedOscillation` 的第一个参数 `t` 是持续递增的（如 `progress * speed`），这意味着振荡会不断重新激发。`dampingRatio` 控制的是每次振荡的衰减速度，但由于 `t` 持续增长，效果是"持续微振"而非"振一次就停"。

### 15.4 惯性运动：momentumEase / inertiaDecay

**`momentumEase(t, mass=1, friction=0.3)`**

模拟有初速度的物体在摩擦力下减速停止：

- `mass`：质量越大，惯性越大，减速越慢
- `friction`：摩擦力越大，减速越快

```typescript
// 轻物体快速减速
const xEased = momentumEase(t, 0.5, 0.5);
return { transform: { ...currentTransform, x: currentTransform.x + xEased * 200 }, opacity: 1 };

// 重物体缓慢减速
const xEased = momentumEase(t, 3, 0.1);

// 标准惯性
const xEased = momentumEase(t, 1, 0.3);
```

**`inertiaDecay(t, initialVelocity=3, drag=2)`**

更直接的惯性衰减模型：

- `initialVelocity`：初始速度
- `drag`：阻力系数

```typescript
// 快速启动慢速停止
const xEased = inertiaDecay(t, 5, 1);

// 均匀减速
const xEased = inertiaDecay(t, 3, 2);

// 极快减速
const xEased = inertiaDecay(t, 3, 5);
```

### 15.5 鞭打与过冲：whipEffect / easeOutBack / easeOutElastic

**`whipEffect(t, whipStrength=0.4)`**

模拟鞭打效果——极快的启动 + 过冲 + 回弹：

```typescript
// 标准鞭打
const scaleEased = whipEffect(t, 0.4);

// 强烈甩动
const scaleEased = whipEffect(t, 0.8);

// 微妙甩动
const scaleEased = whipEffect(t, 0.2);
```

**选择指南**：

| 场景 | 推荐缓动 | 原因 |
|------|----------|------|
| UI元素入场 | `easeOutBack` | 微过冲，有力度感 |
| 弹性动画 | `easeOutElastic` | 多次弹跳，有弹性感 |
| 鞭打/甩动 | `whipEffect` | 极快启动+过冲 |
| 弹簧物理 | `spring` | 真实物理模拟 |
| 快速吸附 | `snapSpring` | 简化弹簧，适合UI |

### 15.6 噪声运动：perlinNoise1D

**`perlinNoise1D(t, frequency=1, seed=0)`**

柏林噪声是制造"自然随机运动"的核心。与 `Math.random()` 不同，柏林噪声是**连续的**——相邻输入产生相邻输出，没有突变。

| 参数 | 增大效果 | 减小效果 |
|------|----------|----------|
| `frequency` | 变化更快（更"紧张"） | 变化更慢（更"平滑"） |
| `seed` | 不同的随机序列 | 相同的随机序列 |

**预设中的实战用法**：

```typescript
// 文字微弹跳 —— 自然的微小位移
const microBounce = perlinNoise1D(t * 1.5, 1, 0) * 0.02;
return { transform: { ...currentTransform, y: currentTransform.y + microBounce * 3 }, opacity: 1 };

// 闪烁效果 —— 用不同seed产生不同闪烁模式
const flickerNoise = perlinNoise1D(t * 8, 2, 0) * 0.3 + perlinNoise1D(t * 25, 2, 99) * 0.15;
const flickerFactor = 0.7 + flickerNoise;
return { transform: currentTransform, opacity: Math.max(0.01, flickerFactor), filter: `brightness(${flickerFactor})` };

// 多个元素的不同相位 —— 用不同的seed
const noise1 = perlinNoise1D(t * speed, 1, 0);
const noise2 = perlinNoise1D(t * speed, 1, 5.7);
```

**关键技巧**：为不同元素使用不同的 `seed` 值（如 `i * 5.7`），确保每个元素的运动轨迹不同但都自然。如果所有元素用同一个 seed，它们会同步运动，看起来像"呼吸"而非"自然"。

### 15.7 物理参数速查表

| 效果类型 | 推荐缓动 | 推荐参数 | 典型应用 |
|----------|----------|----------|----------|
| **轻盈弹性** | `spring` | stiffness=120, damping=10, mass=1 | 气泡、羽毛、轻UI |
| **标准弹性** | `spring` | stiffness=180, damping=12, mass=1 | 通用UI入场 |
| **快速吸附** | `snapSpring` | tension=350, friction=30 | 按钮、开关 |
| **柔和展开** | `spring` | stiffness=100, damping=14, mass=1 | 魔法阵、光环 |
| **沉重落地** | `spring` | stiffness=60, damping=20, mass=2 | 重物、石头 |
| **极度弹性** | `spring` | stiffness=300, damping=5, mass=1 | 弹簧玩具、果冻 |
| **重力弹跳** | `gravityBounce` | restitution=0.6, gravity=9.8 | 球体落地 |
| **高弹弹跳** | `gravityBounce` | restitution=0.85, gravity=9.8 | 橡皮球 |
| **微弹跳** | `gravityBounce` | restitution=0.3, gravity=15 | 重物落地 |
| **呼吸微动** | `dampedOscillation` | frequency=1.5, dampingRatio=0.1 | 卡片浮动 |
| **自然晃动** | `dampedOscillation` | frequency=1.2, dampingRatio=0.08 | 3D倾斜 |
| **紧张颤抖** | `dampedOscillation` | frequency=5, dampingRatio=0.3 | 能量充能 |
| **鞭打甩动** | `whipEffect` | whipStrength=0.4 | 旗帜、触手 |
| **惯性滑行** | `momentumEase` | mass=1, friction=0.3 | 滚动停止 |
| **自然漂移** | `perlinNoise1D` | frequency=1, seed=0 | 微动画 |
| **快速过冲** | `easeOutBack` | （无参数） | UI元素入场 |
| **弹性过冲** | `easeOutElastic` | （无参数） | 弹性出场 |
| **先快后慢** | `easeOutCubic` | （无参数） | 冲击波扩散 |
| **先慢后快** | `easeInCubic` | （无参数） | 加速冲出 |

---

## 16. 预设的物理真实感增强

> 预设系统使用 CSS Transform/Opacity/Filter 动画。以下技术说明如何在预设中实现物理真实感。

### 16.1 Squash & Stretch（挤压拉伸）

**原理**：物体在运动方向上拉伸，在碰撞方向上挤压。保持体积不变：`scaleX * scaleY ≈ 1`。

在预设中，Transform 只有统一的 `scale`（非独立的 scaleX/scaleY），因此通过以下方式模拟：

- **着陆挤压**：scale 略增（水平拉伸感）+ y 位移减少（视觉压缩）
- **起跳拉伸**：scale 略减（垂直拉伸感）+ y 位移增加（视觉拉伸）

**预设实现**：

```typescript
apply: (progress, params, currentTransform) => {
  const t = Math.max(0, Math.min(1, progress));
  const bounceY = gravityBounce(t, 0.65, 9.8);
  const velocity = Math.abs(dampedOscillation(t * 3, 8, 0.5));
  const squash = 1 + velocity * 0.15;
  const landY = (1 - bounceY) * 100;

  return {
    transform: {
      ...currentTransform,
      y: currentTransform.y + landY,
      scale: Math.max(0.001, currentTransform.scale * squash)
    },
    opacity: 1
  };
}
```

**CSS Animation 关键帧参考**：

```css
@keyframes bounce-land {
  0% { transform: scaleX(1) scaleY(1); }
  40% { transform: scaleX(1.2) scaleY(0.83); }  /* 着陆挤压 */
  55% { transform: scaleX(0.95) scaleY(1.05); }  /* 回弹过冲 */
  70% { transform: scaleX(1.02) scaleY(0.98); }  /* 微弹 */
  100% { transform: scaleX(1) scaleY(1); }        /* 恢复 */
}
```

### 16.2 Follow Through（跟随延迟）

**原理**：物体的不同部分以不同速度运动。末端部分在主体停止后还会继续运动。

在预设中，由于只有一个 Transform 对象，可以通过**延迟的旋转/位移**模拟跟随效果：

```typescript
apply: (progress, params, currentTransform) => {
  const t = Math.max(0, Math.min(1, progress));
  const mainEased = spring(t, 180, 14, 1);
  const followEased = spring(Math.max(0, t - 0.05), 120, 10, 1);
  const mainX = mainEased * 100;
  const followRotation = (mainEased - followEased) * 15;

  return {
    transform: {
      ...currentTransform,
      x: currentTransform.x + mainX,
      rotation: currentTransform.rotation + followRotation
    },
    opacity: 1
  };
}
```

**CSS Animation 关键帧参考**：

```css
/* 父元素先停 */
@keyframes parent-stop {
  0% { transform: translateX(0); }
  100% { transform: translateX(100px); }
}

/* 子元素后停（延迟 + 过冲） */
@keyframes child-follow {
  0% { transform: translateX(0); }
  70% { transform: translateX(110px); }  /* 过冲10px */
  85% { transform: translateX(95px); }   /* 回弹 */
  100% { transform: translateX(100px); } /* 最终位置 */
}
```

### 16.3 Anticipation（预备动作）

**原理**：在主要动作之前，先做一个反向的小动作。比如跳跃前先下蹲。

```typescript
apply: (progress, params, currentTransform) => {
  const t = Math.max(0, Math.min(1, progress));
  let y = 0;
  let scale = 1;

  if (t < 0.15) {
    const anticipationT = t / 0.15;
    y = anticipationT * 10;
    scale = 1 + anticipationT * 0.1;
  } else if (t < 0.5) {
    const jumpT = (t - 0.15) / 0.35;
    const jumpEased = easeOutCubic(jumpT);
    y = 10 - jumpEased * 110;
    scale = 1 + 0.1 * (1 - jumpEased) - jumpEased * 0.1;
  } else if (t < 0.7) {
    const landT = (t - 0.5) / 0.2;
    y = -100 + landT * 100;
    scale = 1 + 0.15 * (1 - landT);
  } else {
    const settleT = (t - 0.7) / 0.3;
    const settle = dampedOscillation(settleT, 3, 0.3) * 0.05 * (1 - settleT);
    scale = 1 + settle;
  }

  return {
    transform: {
      ...currentTransform,
      y: currentTransform.y + y,
      scale: Math.max(0.001, currentTransform.scale * scale)
    },
    opacity: 1
  };
}
```

**CSS Animation 关键帧参考**：

```css
@keyframes jump-with-anticipation {
  0% { transform: translateY(0) scaleX(1) scaleY(1); }
  15% { transform: translateY(10px) scaleX(1.1) scaleY(0.9); }  /* 下蹲预备 */
  50% { transform: translateY(-80px) scaleX(0.9) scaleY(1.1); } /* 跳起拉伸 */
  70% { transform: translateY(0) scaleX(1.15) scaleY(0.87); }   /* 着陆挤压 */
  85% { transform: translateY(-5px) scaleX(0.98) scaleY(1.02);  /* 微弹 */
  100% { transform: translateY(0) scaleX(1) scaleY(1); }         /* 恢复 */
}
```

### 16.4 Settle Wobble（稳定微振）

**原理**：物体到达目标位置后，不是立即静止，而是有微小的振荡后稳定。

```typescript
apply: (progress, params, currentTransform) => {
  const t = Math.max(0, Math.min(1, progress));
  const scaleEased = spring(t, 120, 10, 1);
  const settleWobble = t < 1 ? dampedOscillation(t, 4, 0.25) * 0.02 * (1 - t) : 0;

  return {
    transform: {
      ...currentTransform,
      scale: Math.max(0.001, currentTransform.scale * (scaleEased + settleWobble))
    },
    opacity: 1
  };
}
```

**CSS Animation 关键帧参考**：

```css
@keyframes settle-wobble {
  0% { transform: scale(0); }
  60% { transform: scale(1.08); }   /* 过冲 */
  75% { transform: scale(0.97); }   /* 回弹 */
  87% { transform: scale(1.02); }   /* 微过冲 */
  95% { transform: scale(0.99); }   /* 微回弹 */
  100% { transform: scale(1); }     /* 稳定 */
}
```

**使用 CSS cubic-bezier 模拟弹簧**：

```css
/* 快速弹簧（类似 snapSpring(350, 30)） */
.transition-snap {
  transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

/* 柔和弹簧（类似 spring(120, 10, 1)） */
.transition-soft-spring {
  transition: transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.1);
}

/* 强烈弹簧（类似 easeOutElastic） */
.transition-elastic {
  transition: transform 0.7s cubic-bezier(0.175, 0.885, 0.32, 1.4);
}
```

**spring 的 stiffness/damping 组合对 settle wobble 的影响**：

| stiffness | damping | settle 效果 |
|-----------|---------|-------------|
| 100 | 14 | 2-3次微振后稳定，优雅 |
| 120 | 10 | 3-4次微振后稳定，活泼 |
| 180 | 12 | 2-3次微振后稳定，标准 |
| 300 | 5 | 多次振荡，极度弹性 |
| 60 | 20 | 几乎无振荡，沉重 |

### 16.5 Secondary Motion（次级运动）

**原理**：主要动作触发的附属运动。比如按钮按下时的阴影变化、光泽移动。

在预设中，次级运动通过 filter 的动态变化实现：

```typescript
apply: (progress, params, currentTransform) => {
  const t = Math.max(0, Math.min(1, progress));
  const pressEased = spring(t, 350, 30);
  const scale = 1 - pressEased * 0.03;
  const shadowBlur = 15 + (1 - pressEased) * 10;
  const shadowY = 4 + (1 - pressEased) * 3;

  return {
    transform: {
      ...currentTransform,
      scale: Math.max(0.001, currentTransform.scale * scale)
    },
    opacity: 1,
    filter: `drop-shadow(0 ${shadowY}px ${shadowBlur}px rgba(0, 0, 0, 0.3))`
  };
}
```

**CSS Animation 关键帧参考**：

```css
/* 按钮按下次级运动 */
.button:active .ripple {
  animation: ripple-expand 0.6s ease-out;
}

@keyframes ripple-expand {
  0% { transform: scale(0); opacity: 0.5; }
  100% { transform: scale(2.5); opacity: 0; }
}

/* 阴影随按下变化 */
.button {
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  transition: box-shadow 0.15s ease-out, transform 0.15s ease-out;
}

.button:active {
  transform: translateY(2px) scaleX(1.03) scaleY(0.97);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

/* 光泽随悬停移动 */
.button .shimmer {
  transition: transform 0.3s ease-out;
}

.button:hover .shimmer {
  transform: translateX(100%);
}
```

---

## 17. 动画节奏与时机（预设视角）

> 本章从预设视角讲解动画节奏设计，所有技术均基于 `apply(progress, params, currentTransform)` 函数中的 progress 分段实现。

### 17.1 入场-保持-退场 三段式设计

**几乎所有高质量动画都遵循三段式结构**，在预设中通过 progress 分段实现：

```typescript
apply: (progress, params, currentTransform) => {
  const t = Math.max(0, Math.min(1, progress));

  // ===== 入场阶段（0 - 0.3）=====
  const enterProgress = Math.min(1, t / 0.3);
  const enterScale = spring(enterProgress, 120, 10, 1);

  // ===== 保持阶段（0.3 - 0.7）=====
  const holdPhase = t > 0.3 && t < 0.7;
  const breathe = holdPhase ? dampedOscillation(t * 2, 1.5, 0.1) * 0.015 : 0;

  // ===== 退场阶段（0.7 - 1.0）=====
  const exitProgress = t > 0.7 ? (t - 0.7) / 0.3 : 0;
  const exitScale = 1 - easeInCubic(exitProgress) * 0.3;

  // ===== 合成 =====
  const finalScale = enterScale * exitScale + breathe;

  return {
    transform: {
      ...currentTransform,
      scale: Math.max(0.001, currentTransform.scale * finalScale)
    },
    opacity: Math.max(0.01, t < 0.7 ? 1 : 1 - exitProgress)
  };
}
```

**三段式的时间分配**：

| 效果类型 | 入场 | 保持 | 退场 |
|----------|------|------|------|
| 快闪效果 | 0-0.15 | 0.15-0.85 | 0.85-1.0 |
| 标准效果 | 0-0.3 | 0.3-0.7 | 0.7-1.0 |
| 强调入场 | 0-0.4 | 0.4-0.7 | 0.7-1.0 |
| 慢入快出 | 0-0.5 | 0.5-0.75 | 0.75-1.0 |

### 17.2 交错动画：stagger

交错动画让多个元素依次出现，产生"波浪感"。在预设中，通过为不同元素使用不同的 progress 偏移实现：

```typescript
// 假设预设需要处理多个子元素（通过参数传入 index 和 total）
apply: (progress, params, currentTransform) => {
  const index = Math.max(0, params.index || 0);
  const total = Math.max(1, params.total || 1);
  const overlap = Math.max(0.1, Math.min(0.9, params.overlap || 0.3));
  const t = Math.max(0, Math.min(1, progress));

  const staggerOffset = (1 - overlap) * (index / Math.max(1, total - 1));
  const staggerT = Math.max(0, Math.min(1, (t - staggerOffset) / Math.max(0.1, 1 - staggerOffset)));
  const elementScale = spring(staggerT, 120, 10, 1);

  return {
    transform: {
      ...currentTransform,
      scale: Math.max(0.001, currentTransform.scale * elementScale)
    },
    opacity: Math.max(0.01, staggerT > 0 ? 1 : 0)
  };
}
```

**overlap 参数如何影响"波浪感"**：

| overlap | 效果 | 视觉感受 |
|---------|------|----------|
| 0.1 | 几乎同时出现 | "爆发" |
| 0.3 | 标准波浪 | "流畅" |
| 0.5 | 明显依次 | "优雅" |
| 0.7 | 极慢依次 | "仪式感" |
| 0.9 | 几乎逐个 | "逐个展示" |

### 17.3 延迟展开

多环延迟展开效果，通过 progress 偏移实现：

```typescript
apply: (progress, params, currentTransform) => {
  const ringIndex = Math.max(0, params.ringIndex || 0);
  const ringDelay = ringIndex * 0.08;
  const t = Math.max(0, Math.min(1, progress));
  const ringP = Math.max(0, Math.min(1, (t - ringDelay) / Math.max(0.1, 1 - ringDelay)));

  if (ringP <= 0) {
    return { transform: { ...currentTransform, scale: 0.001 }, opacity: 0.01 };
  }

  const ringProgress = easeOutCubic(ringP);
  const ringScale = ringProgress;
  const ringAlpha = (1 - ringP) * 0.6;

  return {
    transform: {
      ...currentTransform,
      scale: Math.max(0.001, currentTransform.scale * ringScale)
    },
    opacity: Math.max(0.01, ringAlpha)
  };
}
```

**延迟展开的参数选择**：

| 延迟量 | 效果 | 适用场景 |
|--------|------|----------|
| 0.03-0.05 | 快速涟漪 | 水波、声波 |
| 0.08-0.12 | 标准延迟 | 冲击波、光环 |
| 0.15-0.2 | 明显延迟 | 魔法阵展开 |
| 0.25+ | 极慢展开 | 仪式感展开 |

### 17.4 呼吸微动

**`dampedOscillation` 驱动 transform.scale 微变**：

```typescript
// 按钮呼吸
apply: (progress, params, currentTransform) => {
  const t = Math.max(0, Math.min(1, progress));
  const breathe = dampedOscillation(t * 2, 1.5, 0.1) * 0.015;
  return {
    transform: {
      ...currentTransform,
      scale: Math.max(0.001, currentTransform.scale * (1 + breathe))
    },
    opacity: 1
  };
}

// 卡片浮动
apply: (progress, params, currentTransform) => {
  const t = Math.max(0, Math.min(1, progress));
  const floatOsc = dampedOscillation(t * 0.5, 0.8, 0.05);
  const floatY = floatOsc * 15;
  return {
    transform: {
      ...currentTransform,
      y: currentTransform.y + floatY
    },
    opacity: 1
  };
}
```

**呼吸微动的关键参数**：

| 参数 | 推荐范围 | 效果 |
|------|----------|------|
| time 倍率 | 1.5-3 | 控制呼吸速度 |
| frequency | 0.8-2 | 控制振荡频率 |
| dampingRatio | 0.05-0.15 | 控制衰减速度 |
| 振幅乘数 | 0.01-0.03 | 控制微动幅度 |

**关键**：振幅乘数必须极小（0.01-0.03），否则从"呼吸"变成"颤抖"。

### 17.5 弹性稳定：Settle Wobble

弹簧入场后的"稳定微振"是物理真实感的关键：

```typescript
apply: (progress, params, currentTransform) => {
  const t = Math.max(0, Math.min(1, progress));
  const enterProgress = Math.min(1, t / 0.3);
  const springValue = spring(enterProgress, 100, 14, 1);
  const settleWobble = t < 1 ? dampedOscillation(t, 4, 0.25) * 0.02 * (1 - t) : 0;

  return {
    transform: {
      ...currentTransform,
      scale: Math.max(0.001, currentTransform.scale * (springValue + settleWobble))
    },
    opacity: 1
  };
}
```

### 17.6 节奏感：速度变化创造视觉节奏

**快→慢→快** 的节奏模式：

```typescript
// 冲击波：快速扩散 → 减速 → 停止
const ringProgress = easeOutCubic(ringP);  // 先快后慢

// 弹性按钮：快速吸附 → 微振 → 稳定
const snapEnter = snapSpring(enterProgress, 350, 30);  // 快速到位+微振

// 粒子爆炸：极快扩散 → 减速 → 重力下落
const explosionProgress = easeOutCubic(p);  // 先快后慢
```

**节奏感设计原则**：

1. **入场要快**：用户注意力有限，入场动画超过0.3秒就会觉得"慢"
2. **保持要活**：保持阶段不能完全静止，必须有呼吸/脉冲/微动
3. **退场要果断**：退场动画0.2-0.3秒，不要太长
4. **对比产生节奏**：快慢交替比匀速更有吸引力

---

## 18. 视觉冲击力预设配方

> 本章提供4个完整的视觉冲击力预设配方，每个配方用完整的 PresetDefinition 代码展示，可直接使用或作为参考。

### 18.1 弹性着陆预设（spring + squash & stretch + 阴影变化）

**效果描述**：元素从上方落下，着陆时挤压变形，弹跳后恢复，阴影随高度动态变化。

```typescript
import { PresetDefinition } from '../types';
import { gravityBounce, dampedOscillation, easeOutExpo } from '../../utils/easing';

export const elasticLand: PresetDefinition = {
  id: 'entrance_elastic_land',
  name: '弹性着陆 (Elastic Land)',
  category: 'entrance',
  schema: [
    { key: 'height', label: '落下高度', type: 'number', default: 200, min: 50, max: 500, step: 10 },
    { key: 'restitution', label: '弹性系数', type: 'number', default: 0.65, min: 0.2, max: 0.9, step: 0.05 },
    { key: 'squashAmount', label: '挤压幅度', type: 'number', default: 0.15, min: 0.05, max: 0.3, step: 0.01 }
  ],
  apply: (progress, params, currentTransform) => {
    const height = Math.max(50, Math.min(500, params.height || 200));
    const restitution = Math.max(0.2, Math.min(0.9, params.restitution || 0.65));
    const squashAmount = Math.max(0.05, Math.min(0.3, params.squashAmount || 0.15));
    const t = Math.max(0, Math.min(1, progress));

    const bounceY = gravityBounce(t, restitution, 9.8);
    const landY = -(1 - bounceY) * height;
    const velocity = Math.abs(dampedOscillation(t * 3, 8, 0.5));
    const squash = 1 + velocity * squashAmount;
    const opacityEased = easeOutExpo(Math.min(1, t * 3));
    const shadowBlur = 10 + (1 - bounceY) * height * 0.15;
    const shadowAlpha = 0.1 + bounceY * 0.2;

    return {
      transform: {
        ...currentTransform,
        y: currentTransform.y + landY,
        scale: Math.max(0.001, currentTransform.scale * squash)
      },
      opacity: Math.max(0.01, opacityEased),
      filter: `drop-shadow(0 ${Math.max(0, (1 - bounceY) * 5)}px ${shadowBlur}px rgba(0, 0, 0, ${shadowAlpha}))`
    };
  }
};
```

### 18.2 重力弹跳预设（gravityBounce + squash & stretch）

**效果描述**：元素在重力作用下弹跳，每次弹跳都有挤压拉伸效果。

```typescript
import { PresetDefinition } from '../types';
import { gravityBounce, dampedOscillation, easeOutExpo } from '../../utils/easing';

export const gravityBouncePreset: PresetDefinition = {
  id: 'entrance_gravity_bounce',
  name: '重力弹跳 (Gravity Bounce)',
  category: 'entrance',
  schema: [
    { key: 'restitution', label: '弹性系数', type: 'number', default: 0.6, min: 0.1, max: 0.95, step: 0.05 },
    { key: 'gravity', label: '重力', type: 'number', default: 9.8, min: 1, max: 30, step: 0.5 },
    { key: 'squashIntensity', label: '挤压强度', type: 'number', default: 0.12, min: 0, max: 0.3, step: 0.01 }
  ],
  apply: (progress, params, currentTransform) => {
    const restitution = Math.max(0.1, Math.min(0.95, params.restitution || 0.6));
    const gravity = Math.max(1, Math.min(30, params.gravity || 9.8));
    const squashIntensity = Math.max(0, Math.min(0.3, params.squashIntensity || 0.12));
    const t = Math.max(0, Math.min(1, progress));

    const bounceValue = gravityBounce(t, restitution, gravity);
    const y = (1 - bounceValue) * 150;
    const squashVelocity = Math.abs(dampedOscillation(t * 4, 10, 0.6));
    const squash = 1 + squashVelocity * squashIntensity;
    const wobble = dampedOscillation(t, 5, 0.3) * 3 * (1 - t);
    const opacityEased = easeOutExpo(Math.min(1, t * 2.5));

    return {
      transform: {
        ...currentTransform,
        y: currentTransform.y + y,
        scale: Math.max(0.001, currentTransform.scale * squash),
        rotation: currentTransform.rotation + wobble
      },
      opacity: Math.max(0.01, opacityEased)
    };
  }
};
```

### 18.3 霓虹脉冲预设（多层发光 + perlin闪烁 + filter: drop-shadow）

**效果描述**：霓虹灯般的脉冲发光效果，带有自然闪烁和多层 drop-shadow 发光。

```typescript
import { PresetDefinition } from '../types';
import { perlinNoise1D } from '../../utils/easing';

export const neonPulse: PresetDefinition = {
  id: 'fx_neon_pulse_v2',
  name: '霓虹脉冲 (Neon Pulse V2)',
  category: 'fx',
  schema: [
    { key: 'color', label: '颜色', type: 'color', default: '#00ffcc' },
    { key: 'intensity', label: '强度', type: 'number', default: 30, min: 5, max: 80, step: 5 },
    { key: 'pulseSpeed', label: '脉冲速度', type: 'number', default: 3, min: 0.5, max: 8, step: 0.5 },
    { key: 'flickerIntensity', label: '闪烁强度', type: 'number', default: 0.3, min: 0, max: 0.6, step: 0.05 }
  ],
  apply: (progress, params, currentTransform) => {
    const color = params.color || '#00ffcc';
    const intensity = Math.max(5, Math.min(80, params.intensity || 30));
    const pulseSpeed = Math.max(0.5, Math.min(8, params.pulseSpeed || 3));
    const flickerIntensity = Math.max(0, Math.min(0.6, params.flickerIntensity || 0.3));
    const p = Math.max(0, Math.min(1, progress));

    const pulse = (Math.sin(p * Math.PI * pulseSpeed * 2) + 1) / 2;
    const flickerNoise = perlinNoise1D(p, 12, 0) * flickerIntensity + perlinNoise1D(p, 25, 99) * flickerIntensity * 0.5;
    const neonFactor = 0.6 + pulse * 0.25 + flickerNoise;
    const clampedFactor = Math.max(0.3, Math.min(1.5, neonFactor));
    const glowIntensity = intensity * clampedFactor;
    const spread1 = Math.max(0, glowIntensity * 0.5);
    const spread2 = Math.max(0, glowIntensity);
    const spread3 = Math.max(0, glowIntensity * 2);
    const brightness = 1 + clampedFactor * 0.3;

    return {
      transform: currentTransform,
      opacity: 1,
      filter: `brightness(${brightness.toFixed(2)}) drop-shadow(0 0 ${spread1.toFixed(1)}px ${color}) drop-shadow(0 0 ${spread2.toFixed(1)}px ${color}) drop-shadow(0 0 ${spread3.toFixed(1)}px ${color})`
    };
  }
};
```

### 18.4 全息投影预设（扫描线 + 色彩偏移 + filter）

**效果描述**：科幻全息投影效果，带有扫描线闪烁、色彩偏移和 RGB 分离。

```typescript
import { PresetDefinition } from '../types';
import { perlinNoise1D } from '../../utils/easing';

export const hologramPreset: PresetDefinition = {
  id: 'fx_hologram',
  name: '全息投影 (Hologram)',
  category: 'fx',
  schema: [
    { key: 'color', label: '主颜色', type: 'color', default: '#00ffcc' },
    { key: 'scanlineSpeed', label: '扫描线速度', type: 'number', default: 5, min: 1, max: 15, step: 1 },
    { key: 'rgbShift', label: 'RGB偏移', type: 'number', default: 2, min: 0, max: 5, step: 0.5 },
    { key: 'glitchChance', label: '故障概率', type: 'number', default: 0.15, min: 0, max: 0.5, step: 0.05 }
  ],
  apply: (progress, params, currentTransform) => {
    const color = params.color || '#00ffcc';
    const scanlineSpeed = Math.max(1, Math.min(15, params.scanlineSpeed || 5));
    const rgbShift = Math.max(0, Math.min(5, params.rgbShift || 2));
    const glitchChance = Math.max(0, Math.min(0.5, params.glitchChance || 0.15));
    const p = Math.max(0, Math.min(1, progress));

    const holoAlpha = 0.7 + Math.sin(p * Math.PI * scanlineSpeed) * 0.15;
    const scanFlicker = perlinNoise1D(p, scanlineSpeed * 2, 0);
    const glitchNoise = perlinNoise1D(p, 10, 42);
    const isGlitching = glitchNoise > (1 - glitchChance);
    const glitchOffset = isGlitching ? perlinNoise1D(p, 20, 33) * 2 - 1 : 0;
    const brightness = 1.1 + scanFlicker * 0.2;
    const saturate = 1.3 + scanFlicker * 0.3;
    const hueShift = isGlitching ? perlinNoise1D(p, 30, 77) * 30 - 15 : 0;

    return {
      transform: {
        ...currentTransform,
        x: currentTransform.x + glitchOffset * rgbShift * 3
      },
      opacity: Math.max(0.01, holoAlpha),
      filter: `brightness(${brightness.toFixed(2)}) saturate(${saturate.toFixed(2)}) hue-rotate(${hueShift.toFixed(1)}deg) drop-shadow(${rgbShift}px 0 0 rgba(255, 0, 0, 0.3)) drop-shadow(-${rgbShift}px 0 0 rgba(0, 100, 255, 0.3)) drop-shadow(0 0 ${Math.max(0, 8 + scanFlicker * 12)}px ${color})`
    };
  }
};
```

---

## 19. 质量检查清单

AI 生成预设后，必须逐项检查以下清单。**所有项必须通过**，否则预设不可提交。

### 19.1 结构检查

- [ ] 文件位于正确的分类目录下（`src/engine/presets/{category}/`）
- [ ] 文件名使用 camelCase，与导出变量名一致
- [ ] 使用 `PresetDefinition` 类型（非 `AnimationEffect`）
- [ ] 导入路径正确：类型从 `../types`，缓动从 `../../utils/easing`

### 19.2 ID 和命名检查

- [ ] `id` 遵循 `{category}_{snake_case_name}` 格式
- [ ] `id` 前缀与 `category` 值匹配（如 category='entrance' 则 id 以 'entrance_' 开头）
- [ ] `name` 遵循 `中文名 (English Name)` 格式
- [ ] `id` 在现有 84 个预设中唯一

### 19.3 参数检查

- [ ] 每个 schema 参数的 `key` 与 apply 函数中 `params.{key}` 一致
- [ ] 每个参数的 `default` 值与 apply 中的 `||` 回退值一致
- [ ] number 类型参数有 `min` 和 `max`
- [ ] number 类型参数有合理的 `step`
- [ ] boolean 类型参数在 apply 中使用 `!== false` 或 `=== true` 处理

### 19.4 安全检查

- [ ] `progress` 在 apply 函数开头被 clamp 到 [0, 1]
- [ ] 所有数值参数使用 `Math.max(min, Math.min(max, value))` 保护
- [ ] `scale` 最终值使用 `Math.max(0.001, ...)` 保护
- [ ] `opacity` 最终值使用 `Math.max(0.01, ...)` 保护
- [ ] 返回的 `transform` 使用 `...currentTransform` 保留原有值
- [ ] 除法运算中除数使用 `Math.max(eps, ...)` 保护
- [ ] 无 NaN 或 Infinity 风险

### 19.5 逻辑检查

- [ ] entrance 预设：progress=0 时元素不可见/远处，progress=1 时元素正常显示
- [ ] exit 预设：progress=0 时元素正常显示，progress=1 时元素不可见/远处
- [ ] emphasis 预设：效果在 progress 范围内振荡，progress=1 时自然衰减
- [ ] motion 预设：运动路径合理，不会将元素移出画布过远
- [ ] fx 预设：filter 字符串语法正确
- [ ] transition 预设：opacity 从 1 过渡到接近 0
- [ ] text 预设：效果适合文字元素

### 19.6 性能检查

- [ ] apply 函数内 perlinNoise1D 调用不超过 5 次
- [ ] 无不必要的复杂计算
- [ ] filter 使用合理（blur 半径不过大）
- [ ] 无内存泄漏风险（无闭包引用外部可变状态）

### 19.7 集成检查

- [ ] 在分类 index.ts 中添加了 export 语句
- [ ] 导入的缓动函数确实存在于 `src/engine/utils/easing.ts`
- [ ] TypeScript 类型检查通过
- [ ] 预设可被 `collectPresets()` 正确收集

### 19.8 视觉效果5级评分标准

| 等级 | 名称 | 标准 | 典型特征 |
|------|------|------|----------|
| ⭐ | 基础 | 功能正确，能渲染 | 纯 linear 缓动、无物理感、无微动画 |
| ⭐⭐ | 及格 | 有基本视觉层次 | 有缓动函数、有 opacity 渐变、有基本 transform |
| ⭐⭐⭐ | 良好 | 有完整动画结构 | 入场-保持-退场三段式、有 settle wobble、有 filter 效果 |
| ⭐⭐⭐⭐ | 优秀 | 有物理真实感 | spring/snapSpring 物理缓动、呼吸微动、动态 drop-shadow、squash & stretch |
| ⭐⭐⭐⭐⭐ | 卓越 | 让人眼前一亮 | 多层 filter 组合、perlinNoise1D 自然闪烁、节奏感设计、色彩和谐、次级运动 |

**各级别的具体要求**：

**⭐ 基础**：
- ✅ 能正确渲染，无报错
- ✅ 参数保护完整
- ❌ 无物理缓动、无微动画

**⭐⭐ 及格**：
- ✅ 有缓动函数（easeOutExpo 等）
- ✅ 有 opacity 渐变
- ✅ 有基本 transform 动画
- ❌ 无物理缓动、无微动画

**⭐⭐⭐ 良好**：
- ✅ 完整三段式结构（入场-保持-退场）
- ✅ 有 settle wobble
- ✅ 有 filter 效果（fx 类）
- ✅ 有入场/退场动画
- ❌ 无物理缓动、无 squash & stretch

**⭐⭐⭐⭐ 优秀**：
- ✅ 物理缓动（spring/snapSpring/dampedOscillation）
- ✅ 呼吸微动
- ✅ 动态 drop-shadow
- ✅ squash & stretch
- ✅ 次级运动（阴影/发光随主体变化）
- ❌ 无多层 filter 组合、无节奏感设计

**⭐⭐⭐⭐⭐ 卓越**：
- ✅ 多层 filter 组合（brightness + drop-shadow + hue-rotate）
- ✅ perlinNoise1D 自然闪烁/漂移
- ✅ 三段式节奏（入场-保持-退场）
- ✅ 色彩和谐（filter: hue-rotate/saturate 配合）
- ✅ 交错动画/延迟展开
- ✅ 次级运动完整

### 19.9 常见"假"感来源和修复方法速查表

| 问题 | 原因 | 修复方法 |
|------|------|----------|
| 动画像机器人 | 使用 linear 或简单 ease | 改用 spring/snapSpring 物理缓动 |
| 动画太突然 | 没有预备动作 | 添加 anticipation（先反向再正向） |
| 弹跳太机械 | 用固定弹跳 | 改用 gravityBounce（真实物理模拟） |
| 退场太慢 | 退场用 easeOut | 改用 easeInCubic（加速消失） |
| 发光太假 | 单层 drop-shadow | 改用多层 drop-shadow（近/中/远三层） |
| 闪烁不自然 | 用 Math.random | 改用 perlinNoise1D |
| 呼吸太抖 | dampedOscillation 振幅太大 | 降低振幅乘数到 0.01-0.03 |
| 画面没有焦点 | 缺少光影引导 | 添加 filter: drop-shadow() 建立光影关系 |
| 颜色太杂 | filter 堆砌过多 | 限制 hue-rotate 范围，用 saturate 统一 |
| 阴影太硬 | drop-shadow 无模糊 | 增大 blur radius，降低 alpha |
| 画面太"干净" | 缺少质感层 | 添加 perlinNoise1D 微扰 opacity/filter |
| 元素像漂浮 | 没有阴影 | 添加 filter: drop-shadow() 动态阴影 |
| 预设结束状态异常 | progress=1 时值不为1 | 检查 progress=1 时所有缓动函数返回值 |

---

## 附录 A：现有预设完整列表（84个）

### Entrance（18个）

| ID | Name |
|----|------|
| `entrance_fade_in` | 淡入 (Fade In) |
| `entrance_fade_in_up` | 向上淡入 (Fade In Up) |
| `entrance_fade_in_down` | 向下淡入 (Fade In Down) |
| `entrance_fade_in_left` | 向左淡入 (Fade In Left) |
| `entrance_fade_in_right` | 向右淡入 (Fade In Right) |
| `entrance_slide_in_up` | 向上滑入 (Slide In Up) |
| `entrance_slide_in_down` | 向下滑入 (Slide In Down) |
| `entrance_slide_in_left` | 向左滑入 (Slide In Left) |
| `entrance_slide_in_right` | 向右滑入 (Slide In Right) |
| `entrance_zoom_in` | 放大进入 (Zoom In) |
| `entrance_zoom_in_up` | 向上放大进入 (Zoom In Up) |
| `entrance_zoom_in_down` | 向下放大进入 (Zoom In Down) |
| `entrance_bounce_in` | 弹跳进入 (Bounce In) |
| `entrance_elastic_in` | 弹性进入 (Elastic In) |
| `entrance_back_in` | 回拉进入 (Back In) |
| `entrance_flip_in_x` | X轴翻转进入 (Flip In X) |
| `entrance_flip_in_y` | Y轴翻转进入 (Flip In Y) |
| `entrance_rotate_in` | 旋转进入 (Rotate In) |

### Exit（10个）

| ID | Name |
|----|------|
| `exit_fade_out` | 基础淡出 (Fade Out) |
| `exit_fade_out_up` | 向上淡出 (Fade Out Up) |
| `exit_fade_out_down` | 向下淡出 (Fade Out Down) |
| `exit_slide_out_up` | 向上滑出 (Slide Out Up) |
| `exit_slide_out_down` | 向下滑出 (Slide Out Down) |
| `exit_slide_out_left` | 向左滑出 (Slide Out Left) |
| `exit_slide_out_right` | 向右滑出 (Slide Out Right) |
| `exit_zoom_out` | 缩小消失 (Zoom Out) |
| `exit_zoom_out_up` | 向上缩小消失 (Zoom Out Up) |
| `exit_bounce_out` | 弹跳消失 (Bounce Out) |

### Emphasis（20个）

| ID | Name |
|----|------|
| `emphasis_pulse` | 心跳脉冲 (Pulse) |
| `emphasis_pulse_ring` | 脉冲环 (Pulse Ring) |
| `emphasis_pulse_glow` | 脉冲发光 (Pulse Glow) |
| `emphasis_shake` | 抖动 (Shake) |
| `emphasis_shake_x` | 水平抖动 (Shake X) |
| `emphasis_shake_y` | 垂直抖动 (Shake Y) |
| `emphasis_bounce` | 弹跳 (Bounce) |
| `emphasis_bounce_soft` | 柔和弹跳 (Bounce Soft) |
| `emphasis_breathe` | 呼吸 (Breathe) |
| `emphasis_flash` | 闪烁 (Flash) |
| `emphasis_flash_soft` | 柔和闪烁 (Flash Soft) |
| `emphasis_heartbeat` | 心跳 (Heartbeat) |
| `emphasis_jitter` | 颤动 (Jitter) |
| `emphasis_spin` | 旋转 (Spin) |
| `emphasis_swing` | 摆动 (Swing) |
| `emphasis_tutorial_click` | 教程点击 (Tutorial Click) |
| `emphasis_tutorial_focus` | 教程聚焦 (Tutorial Focus) |
| `emphasis_wobble` | 摇晃 (Wobble) |
| `emphasis_focus_zoom` | 聚焦缩放 (Focus Zoom) |
| `emphasis_bounce` | 弹跳 (Bounce) |

### Motion（13个）

| ID | Name |
|----|------|
| `motion_bounce` | 弹跳 (Bounce) |
| `motion_drift` | 漂移 (Drift) |
| `motion_drift_slow` | 缓慢漂移 (Drift Slow) |
| `motion_float` | 悬浮漂移 (Float) |
| `motion_float_x` | 水平悬浮 (Float X) |
| `motion_float_y` | 垂直悬浮 (Float Y) |
| `motion_orbit` | 轨道旋转 (Orbit) |
| `motion_orbit_slow` | 缓慢轨道 (Orbit Slow) |
| `motion_spiral` | 螺旋 (Spiral) |
| `motion_sway` | 摇摆 (Sway) |
| `motion_tutorial_focus` | 教程聚焦 (Tutorial Focus) |
| `motion_wave` | 波浪 (Wave) |

### FX（19个）

| ID | Name |
|----|------|
| `fx_blur` | 高斯模糊 (Blur) |
| `fx_blur_in` | 模糊进入 (Blur In) |
| `fx_blur_out` | 模糊退出 (Blur Out) |
| `fx_brightness` | 亮度 (Brightness) |
| `fx_contrast` | 对比度 (Contrast) |
| `fx_glassmorphism` | 毛玻璃 (Glassmorphism) |
| `fx_glitch` | 故障效果 (Glitch) |
| `fx_glitch_cyber` | 赛博故障 (Glitch Cyber) |
| `fx_glow` | 发光 (Glow) |
| `fx_glow_pulse` | 脉冲发光 (Glow Pulse) |
| `fx_glow_rainbow` | 彩虹发光 (Glow Rainbow) |
| `fx_grayscale` | 灰度 (Grayscale) |
| `fx_hue_rotate` | 色相旋转 (Hue Rotate) |
| `fx_neon` | 霓虹效果 (Neon) |
| `fx_neon_pulse` | 霓虹脉冲 (Neon Pulse) |
| `fx_saturate` | 饱和度 (Saturate) |
| `fx_scanline` | 扫描线 (Scanline) |
| `fx_shadow` | 阴影 (Shadow) |
| `fx_shadow_lift` | 阴影抬升 (Shadow Lift) |

### Transition（5个）

| ID | Name |
|----|------|
| `transition_cross_dissolve` | 交叉溶解 (Cross Dissolve) |
| `transition_cube_rotate` | 立方体旋转 (Cube Rotate) |
| `transition_page_flip` | 翻页 (Page Flip) |
| `transition_wipe_left` | 向左擦除 (Wipe Left) |
| `transition_wipe_right` | 向右擦除 (Wipe Right) |

### Text（2个）

| ID | Name |
|----|------|
| `text_scale_up` | 文字放大 (Scale Text) |
| `text_typewriter` | 打字机 (Typewriter) |

---

## 附录 B：缓动函数选择指南

| 动画类型 | 推荐缓动 | 原因 |
|----------|----------|------|
| 进场 opacity | `easeOutExpo` | 快速到达后缓慢停止，视觉自然 |
| 进场 scale | `spring` | 物理弹性，有过冲和稳定感 |
| 进场位移 | `momentumEase` | 惯性滑入，自然减速 |
| 进场弹跳 | `gravityBounce` + `springBounce` | 真实弹跳物理 |
| 出场 opacity | `easeInExpo` | 缓慢开始后加速消失 |
| 出场 scale | `easeInQuint` | 缓慢开始后加速缩小 |
| 出场位移 | `easeInExpo` | 缓慢开始后加速滑出 |
| 强调脉冲 | `dampedOscillation` | 自然衰减振荡 |
| 强调抖动 | `perlinNoise1D` | 随机但连续的抖动 |
| 强调弹性 | `spring` / `easeOutElastic` | 物理弹性过冲 |
| 强调闪烁 | `easeOutExpo` + 衰减 | 快速闪烁后稳定 |
| 循环呼吸 | `dampedOscillation(freq=1.5)` | 持续微弱振荡 |
| 循环漂浮 | `perlinNoise1D(freq=1)` | 平滑随机运动 |
| 色相旋转 | `inertiaDecay` | 惯性衰减旋转 |
| 故障效果 | `perlinNoise1D` | 随机偏移和抖动 |
| 发光脉冲 | `dampedOscillation` | 脉冲式发光强度变化 |
| 模糊过渡 | `spring` | 物理感模糊变化 |

---

## 附录 C：CSS Filter 语法参考

预设通过 `filter` 属性返回 CSS 滤镜字符串，浏览器原生支持 GPU 加速。

### C.1 支持的滤镜函数

| 滤镜函数 | 语法 | 值范围 | 说明 | 预设使用场景 |
|----------|------|--------|------|------------|
| `blur()` | `blur(${radius}px)` | radius: 0~50 | 高斯模糊 | 模糊进出、景深效果 |
| `brightness()` | `brightness(${value})` | value: 0~3 | 亮度调节，1=原始 | 闪烁、曝光过渡 |
| `contrast()` | `contrast(${value})` | value: 0~3 | 对比度调节，1=原始 | 强调对比、视觉冲击 |
| `saturate()` | `saturate(${value})` | value: 0~3 | 饱和度调节，1=原始 | 色彩增强、褪色效果 |
| `hue-rotate()` | `hue-rotate(${angle}deg)` | angle: 0~360 | 色相旋转 | 彩虹效果、色相动画 |
| `drop-shadow()` | `drop-shadow(${x}px ${y}px ${blur}px ${color})` | 自定义 | 投影（跟随形状） | 发光效果、霓虹灯 |
| `grayscale()` | `grayscale(${value})` | value: 0~1 | 灰度，0=彩色 1=灰 | 黑白过渡 |
| `sepia()` | `sepia(${value})` | value: 0~1 | 复古色调 | 怀旧效果 |
| `invert()` | `invert(${value})` | value: 0~1 | 反色 | 特殊效果 |
| `opacity()` | `opacity(${value})` | value: 0~1 | 透明度（滤镜方式） | 不推荐，用 opacity 属性 |

### C.2 滤镜组合写法

多个滤镜用空格连接，按顺序依次应用：

```typescript
filter: `brightness(${1.2}) contrast(${1.1}) drop-shadow(0 0 10px #00ffff)`
```

### C.3 常用预设滤镜模式

| 效果 | 滤镜组合 | 代码示例 |
|------|----------|----------|
| 霓虹发光 | 双层 drop-shadow | `drop-shadow(0 0 ${a}px ${c}) drop-shadow(0 0 ${a*2}px ${c})` |
| 三层发光 | 三层 drop-shadow | `drop-shadow(0 0 ${a*0.5}px ${c}) drop-shadow(0 0 ${a}px ${c}) drop-shadow(0 0 ${a*2}px ${c})` |
| 故障RGB分离 | 双向 drop-shadow | `drop-shadow(${s}px 0 0 rgba(255,0,0,0.5)) drop-shadow(-${s}px 0 0 rgba(0,255,255,0.5))` |
| 闪烁高亮 | brightness 脉冲 | `brightness(${1 + intensity * 2})` |
| 聚焦模糊 | blur 衰减 | `blur(${maxBlur * (1 - easedProgress)}px)` |
| 对比增强 | contrast + brightness | `contrast(${1.2}) brightness(${1.1})` |

### C.4 性能注意事项

| 滤镜 | GPU 加速 | 性能开销 | 建议 |
|------|----------|----------|------|
| `blur()` | ✅ | 中 | 半径 ≤ 30px 为佳 |
| `brightness()` | ✅ | 低 | 推荐使用 |
| `contrast()` | ✅ | 低 | 推荐使用 |
| `saturate()` | ✅ | 低 | 推荐使用 |
| `hue-rotate()` | ✅ | 低 | 推荐使用 |
| `drop-shadow()` | ⚠️ | 中-高 | 限制层数 ≤ 3，blur ≤ 50px |
| `grayscale()` | ✅ | 低 | 推荐使用 |
| `sepia()` | ✅ | 低 | 推荐使用 |
| `invert()` | ✅ | 低 | 推荐使用 |

> **关键规则**：`drop-shadow` 是唯一高开销滤镜，使用时控制层数和半径。其他滤镜均可放心使用。

---

## 附录 D：缓动函数选择决策树（预设视角）

```
需要什么效果？
├── 进场动画
│   ├── UI元素 → snapSpring(tension=350, friction=30)
│   ├── 效果元素 → spring(stiffness=100-180, damping=10-14, mass=1)
│   ├── 快速出现 → easeOutBack
│   ├── 淡入 → easeOutExpo
│   └── 弹跳进场 → gravityBounce(restitution=0.6) + springBounce(bounces=4, decay=3.5)
├── 出场动画
│   ├── 淡出 → easeInExpo
│   ├── 缩小消失 → easeInQuint
│   ├── 滑出 → easeInCubic
│   └── 快速消失 → easeInExpo
├── 强调动画
│   ├── 脉冲 → dampedOscillation(frequency=2-4, dampingRatio=0.03-0.05)
│   ├── 抖动 → perlinNoise1D(frequency=15-20, seed=不同值)
│   ├── 弹性 → spring(stiffness=180, damping=14) 或 easeOutElastic
│   ├── 闪烁 → spikeDecay = Math.exp(-p * speed * 2.5)
│   └── 聚焦 → spring(stiffness=180, damping=14)
├── 循环动画
│   ├── 呼吸 → dampedOscillation(frequency=1.5, dampingRatio=0.1)
│   ├── 漂浮 → perlinNoise1D(frequency=1, seed=0)
│   ├── 脉冲发光 → dampedOscillation(frequency=2-4, dampingRatio=0.02)
│   └── 色相旋转 → inertiaDecay(initialVelocity=3, drag=2)
├── 特效动画
│   ├── 故障 → perlinNoise1D(frequency=15-20, seed=不同质数)
│   ├── 发光 → dampedOscillation + perlinNoise1D 混合
│   ├── 模糊过渡 → spring(stiffness=140-200, damping=16-22)
│   └── 阴影 → spring(stiffness=160, damping=18)
└── 自定义
    ├── 鞭打 → whipEffect(whipStrength=0.4)
    ├── 惯性 → momentumEase(mass=1, friction=0.3)
    └── 自定义贝塞尔 → bezierEase(x1, y1, x2, y2)
```

---

## 附录 E：常见"假"感来源和修复方法速查表（预设视角）

| 问题 | 原因 | 修复方法 |
|------|------|----------|
| 动画像机器人 | 使用 linear 或简单 ease | 改用 spring/snapSpring 物理缓动 |
| 缩放没有弹性 | 直接线性 scale | 改用 spring 缓动 + 过冲效果 |
| 透明度变化太平 | 只用 opacity 线性过渡 | 配合 filter:brightness 脉冲增强 |
| 发光太假 | 单层 drop-shadow | 改用双层/三层 drop-shadow（小半径高透明度+大半径低透明度） |
| 故障效果太规律 | 用 Math.random | 改用 perlinNoise1D（不同 seed） |
| 弹跳太机械 | 用固定弹跳公式 | 改用 gravityBounce（真实物理模拟） |
| 退场太慢 | 退场用 easeOut | 改用 easeInCubic/easeInExpo（加速消失） |
| 闪烁不自然 | 用 Math.random | 改用 perlinNoise1D + dampedOscillation 混合 |
| 旋转太生硬 | 直接角度线性变化 | 添加 anticipation（先反向微转再正向旋转） |
| 缩放消失像故障 | scale 直接到 0 | 添加 easeInQuint + opacity 配合，scale 下限 0.001 |
| 色相变化太突兀 | 直接 hue-rotate 跳变 | 改用 inertiaDecay 缓动过渡 |
| 阴影太硬 | 单层 drop-shadow 无模糊 | 增大 blur 半径，降低 opacity |
| 动画没有层次 | 只改一个属性 | 同时操作 transform + opacity + filter |
| 呼吸太抖 | dampedOscillation 振幅太大 | 降低振幅乘数到 0.01-0.03 |
| 预设卡顿 | filter 层叠太多 | 限制 drop-shadow ≤ 3 层，blur ≤ 30px |
| 进场没有冲击力 | 缺少过冲 | 改用 spring（低阻尼）或 easeOutBack |
| 出场拖泥带水 | 出场用了缓出缓动 | 改用 easeInExpo（加速消失，干净利落） |
| 强调效果不明显 | 只改 opacity | 同时改 scale + filter:brightness + drop-shadow |
| 循环动画有跳变 | progress 到 1 时值不连续 | 确保 dampedOscillation 在 progress=1 时振幅趋近 0 |
| 预设参数不安全 | 未做参数钳制 | 所有参数必须 Math.max/Math.min 钳制，scale ≥ 0.001，opacity ≥ 0 |