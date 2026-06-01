# NanoEdit Pro（AutoEdit）AI 模板开发规范文档

> **文档定位**：本文档是面向 AI 的模板开发规范，指导 AI 生成完全符合 NanoEdit Pro 项目规范的模板代码。AI 阅读本文档后，应能 100% 独立生成可直接运行的、无需任何额外信息即可集成到项目中的模板代码。

---

## 目录

1. [模板系统完整架构说明](#1-模板系统完整架构说明)
2. [完整的类型定义参考](#2-完整的类型定义参考)
3. [模板开发完整规范](#3-模板开发完整规范)
4. [模板工具库完整 API 参考](#4-模板工具库完整-api-参考)
5. [配色方案完整列表](#5-配色方案完整列表)
6. [模板分类和 ID 命名规范](#6-模板分类和-id-命名规范)
7. [完整的模板代码模板](#7-完整的模板代码模板)
8. [多种分类的完整代码示例](#8-多种分类的完整代码示例)
9. [注册和集成步骤](#9-注册和集成步骤)
10. [模板导入导出 API](#10-模板导入导出-api)
11. [AI 导演模式集成说明](#11-ai-导演模式集成说明)
12. [常见错误和调试指南](#12-常见错误和调试指南)
13. [性能优化建议](#13-性能优化建议)
14. [视觉效果设计哲学](#14-视觉效果设计哲学)
15. [物理真实感核心原理](#15-物理真实感核心原理)
16. [光影效果深度技术](#16-光影效果深度技术)
17. [材质模拟技术](#17-材质模拟技术)
18. [粒子系统设计](#18-粒子系统设计)
19. [后处理效果链](#19-后处理效果链)
20. [动画节奏与时机](#20-动画节奏与时机)
21. [视觉冲击力配方](#21-视觉冲击力配方)
22. [质量评估标准](#22-质量评估标准)

**附录**
- [附录A：标准模板渲染骨架](#附录a标准模板渲染骨架)
- [附录B：缓动函数选择决策树](#附录b缓动函数选择决策树)
- [附录C：drawUtils快速选择指南](#附录cdrawutils快速选择指南)

---

## 1. 模板系统完整架构说明

### 1.1 项目技术栈

- **框架**：React + TypeScript + Vite
- **状态管理**：Zustand
- **核心功能**：基于轨道的非线性视频编辑器，支持模板系统、预设系统、AI 导演模式

### 1.2 文件路径映射

| 功能 | 文件路径 |
|------|----------|
| 模板类型定义 | `src/engine/templates/types.ts` |
| 模板工具库 | `src/engine/templates/templateUtils.ts` |
| 模板导入器 | `src/engine/templates/templateImporter.ts` |
| 模板注册入口 | `src/engine/templates/index.ts` |
| 模板引擎 | `src/modules/template/core/TemplateEngine.ts` |
| 模板注册表 | `src/modules/template/core/TemplateRegistry.ts` |
| 模板渲染器 | `src/modules/template/core/TemplateRenderer.tsx` |
| 模板上下文 | `src/modules/template/core/TemplateContext.tsx` |
| 各模板实现 | `src/engine/templates/<templateName>.ts` |

### 1.3 双模式渲染系统

模板系统支持两种渲染模式：

- **CanvasTemplate**：使用 `render()` 函数在 Canvas 2D 上绘制（**主要模式，绝大多数模板使用此模式**）
- **ReactTemplate**：使用 `component()` 函数返回 ReactElement
- **AnyTemplate** = CanvasTemplate | ReactTemplate
- `TemplateEngine.createTemplateWrapper()` 可将 Canvas 模板自动包装为 React 模板

### 1.4 渲染上下文重要说明

**渲染器已经通过 `ctx.translate(centerX, centerY)` 将坐标原点移动到画布中心**，所以所有绘制操作都应该相对于中心点 `(0, 0)` 进行。

这意味着：
- `(0, 0)` 是画布中心
- 左上角坐标是 `(-width/2, -height/2)`
- 右下角坐标是 `(width/2, height/2)`
- 清除整个画布：`ctx.fillRect(-width/2, -height/2, width, height)`

### 1.5 模板注册流程

1. 创建模板文件（如 `src/engine/templates/myTemplate.ts`），导出 `TemplateDefinition` 对象
2. 在 `src/engine/templates/index.ts` 中 import 模板并调用 `registerTemplate()`
3. 同时在 `src/modules/template/core/TemplateRegistry.ts` 中注册元数据（如需要）

### 1.6 现有模板列表（52 个）

**Text 类（15 个）**：text_split, text_blur, text_circular, text_typewriter, text_shiny, text_gradient, text_falling, text_decrypted, text_glitch, text_scroll_reveal, text_count_up, text_pressure, text_gradual_blur, text_ascii, text_scrambled

**UI 类（10 个）**：ui_elastic_button, ui_card_flip, ui_card_3d, ui_spotlight_card, ui_border_glow, ui_magnet_button, ui_glass_card, ui_card_stack, ui_accordion, ui_tabs

**Background 类（10 个）**：background_liquid_ether, background_aurora, background_waves, background_silk, background_particles, background_grid_distortion, background_light_rays, background_beams, background_galaxy, background_noise_texture

**Effect 类（10 个）**：effect_particle_explosion, effect_halo_expand, effect_energy_ring, effect_shockwave, effect_magic_circle, effect_data_stream, effect_code_rain, effect_matrix, effect_fire, effect_smoke

**Transition 类（5 个）**：transition_fade, transition_slide, transition_zoom, transition_rotate, transition_blur

**Code 类（2 个）**：keyboardFloat, codeExecution

---

## 2. 完整的类型定义参考

### 2.1 核心类型（src/engine/templates/types.ts）

```typescript
export type TemplateParamType = 'string' | 'number' | 'color' | 'boolean' | 'select' | 'textarea' | 'code';

export interface TemplateParamSchema {
  key: string;           // 参数唯一标识，与 params 对象中的键对应
  label: string;         // 参数显示名称（中文）
  type: TemplateParamType;
  default: any;          // 默认值，必须提供
  min?: number;          // type='number' 时有效
  max?: number;          // type='number' 时有效
  step?: number;         // type='number' 时有效
  options?: { label: string; value: string }[];  // type='select' 时有效
  placeholder?: string;  // type='string'|'textarea'|'code' 时有效
}

export type TemplateCategory = 'ui' | 'code' | 'text' | 'effect' | 'transition' | 'other';

export interface TemplateRenderContext {
  ctx: CanvasRenderingContext2D;  // Canvas 2D 上下文（原点已移至画布中心）
  width: number;                  // 画布宽度（像素）
  height: number;                 // 画布高度（像素）
  progress: number;               // 0-1 的播放进度
  time: number;                   // 当前时间（秒）
  duration: number;               // 片段总时长（秒）
  params: Record<string, any>;    // 用户自定义参数
}

export interface TemplateDefinition {
  id: string;                     // 模板唯一ID，必须遵循命名规范
  name: string;                   // 模板显示名称（中文）
  description: string;            // 模板描述（中文）
  category: TemplateCategory;     // 模板分类
  thumbnail?: string;             // 缩略图 URL（可选）
  schema: TemplateParamSchema[];  // 参数定义列表
  render: (context: TemplateRenderContext) => void;  // 渲染函数
  initParams?: (duration: number) => Record<string, any>;  // 初始化参数
  validateParams?: (params: Record<string, any>) => boolean;  // 参数验证
}
```

### 2.2 模板引擎扩展类型（src/modules/template/core/TemplateEngine.ts）

```typescript
export interface RenderResult {
  success: boolean;
  error?: string;
  data?: unknown;
}

export interface TemplateRenderContextExtended extends TemplateRenderContext {
  frame: number;
  fps: number;
}

export interface CanvasTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  description?: string;
  thumbnail?: string;
  schema: Array<{
    key: string; label: string; type: string; default: any;
    min?: number; max?: number; step?: number;
    options?: { label: string; value: string }[];
    placeholder?: string;
  }>;
  render: (context: TemplateRenderContext) => void;
  initParams?: (duration: number) => Record<string, any>;
  validateParams?: (params: Record<string, any>) => boolean;
}

export interface ReactTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  description?: string;
  thumbnail?: string;
  schema: Array<{
    key: string; label: string; type: string; default: any;
    min?: number; max?: number; step?: number;
    options?: { label: string; value: string }[];
    placeholder?: string;
  }>;
  component: (props: {
    frame: number; fps: number;
    params: Record<string, any>;
    width: number; height: number;
  }) => ReactElement;
  initParams?: (duration: number) => Record<string, any>;
  validateParams?: (params: Record<string, any>) => boolean;
}

export type AnyTemplate = CanvasTemplate | ReactTemplate;
```

### 2.3 模板上下文类型（src/modules/template/core/TemplateContext.tsx）

```typescript
export interface TemplateContextValue {
  frame: number;
  fps: number;
  params: Record<string, any>;
  width: number;
  height: number;
}
```

### 2.4 模板导入结果类型（src/engine/templates/templateImporter.ts）

```typescript
export interface TemplateImportResult {
  success: boolean;
  template?: TemplateDefinition;
  error?: string;
}
```

---

## 3. 模板开发完整规范

### 3.1 必须遵守的规则

#### 规则 1：参数保护（强制）

**所有从 `params` 中获取的参数必须通过 `paramGuard` 进行边界保护**，绝不能直接使用 `params.xxx`。

```typescript
// ✅ 正确
const text = paramGuard.string(params.text, 'DEFAULT');
const speed = paramGuard.number(params.speed, 1, 0.5, 3);
const color = paramGuard.color(params.mainColor, '#ffffff');
const flag = paramGuard.boolean(params.enabled, true);

// ❌ 错误 - 直接使用 params 值，可能导致 undefined 或越界
const text = params.text;
const speed = params.speed;
```

#### 规则 2：进度保护（强制）

**`progress` 值必须通过 `paramGuard.number` 保护到 [0, 1] 范围**。

```typescript
// ✅ 正确
const p = paramGuard.number(progress, 0, 0, 1);

// ❌ 错误
const p = progress;
```

#### 规则 3：自适应布局（强制）

**所有尺寸计算必须使用 `adaptiveLayout` 工具**，确保模板在不同分辨率下正确显示。

```typescript
// ✅ 正确 - 获取自适应可用区域
const availSize = adaptiveLayout.getAvailableSize(width, height, 0.95);
const fontSize = adaptiveLayout.calculateFontSize(ctx, text, availSize.width, availSize.height);

// ❌ 错误 - 硬编码尺寸
const fontSize = 48;
```

#### 规则 4：Canvas 状态管理（强制）

**每次修改 Canvas 状态（transform、alpha、fillStyle 等）前必须 `ctx.save()`，修改后必须 `ctx.restore()`**。save/restore 必须严格配对。

```typescript
// ✅ 正确
ctx.save();
ctx.globalAlpha = 0.5;
ctx.translate(10, 10);
// ... 绘制操作
ctx.restore();

// ❌ 错误 - 没有 save/restore 配对
ctx.globalAlpha = 0.5;
ctx.translate(10, 10);
```

#### 规则 5：坐标原点（强制）

**渲染器已将坐标原点移至画布中心，所有绘制操作相对于 `(0, 0)` 进行**。

```typescript
// ✅ 正确 - 相对于中心绘制
ctx.fillText(text, 0, 0);
ctx.fillRect(-width/2, -height/2, width, height);

// ❌ 错误 - 使用左上角原点
ctx.fillText(text, width/2, height/2);
```

#### 规则 6：确定性渲染（强制）

**模板渲染必须是确定性的**：相同的 `progress`、`time`、`params` 输入必须产生完全相同的输出。禁止使用 `Math.random()`，应使用基于种子的伪随机或 `easing.perlinNoise1D`。

```typescript
// ✅ 正确 - 基于种子的确定性随机
const seed = i * 3571;
const x = ((seed * 7) % 10000) / 10000;
const noise = easing.perlinNoise1D(time * 5 + i, 3, 0);

// ❌ 错误 - 非确定性
const x = Math.random();
```

#### 规则 7：完整 schema 定义（强制）

**每个参数必须在 `schema` 中完整定义**，包含 `key`、`label`、`type`、`default`。number 类型必须提供 `min`、`max`、`step`。select 类型必须提供 `options`。

#### 规则 8：initParams 和 validateParams（推荐）

- `initParams`：应提供，返回与 schema 中 default 值一致的参数对象
- `validateParams`：应提供，至少验证关键参数不为空

#### 规则 9：导入路径规范（强制）

**模板文件中的 import 路径必须使用相对路径**，从 `./types` 和 `./templateUtils` 导入。

```typescript
// ✅ 正确
import { TemplateDefinition, TemplateRenderContext } from './types';
import { easing, adaptiveLayout, paramGuard, drawUtils, colorUtils, animationUtils, palettes } from './templateUtils';

// ❌ 错误
import { TemplateDefinition } from '@/engine/templates/types';
```

#### 规则 10：导出命名规范（强制）

**模板变量名采用 camelCase，格式为 `<categoryPrefix><PascalName>Template`**。

```typescript
// ✅ 正确
export const glitchTextTemplate: TemplateDefinition = { ... };
export const elasticButtonTemplate: TemplateDefinition = { ... };
export const fadeTransitionTemplate: TemplateDefinition = { ... };

// ❌ 错误
export const GlitchText = { ... };
export const glitch_template = { ... };
```

### 3.2 动画进度设计规范

模板的 `progress` 范围是 `[0, 1]`，代表片段从开始到结束的播放进度。推荐采用以下阶段划分：

| 进度范围 | 阶段 | 说明 |
|----------|------|------|
| 0 - 0.3 | 入场（Enter） | 元素从无到有，使用弹性/缓出缓动 |
| 0.3 - 0.7 | 保持（Hold） | 主要内容展示，可添加微动画（呼吸、脉冲等） |
| 0.7 - 1.0 | 退场（Exit） | 元素逐渐消失，使用缓入缓动 |

```typescript
const enterProgress = Math.min(1, p / 0.3);
const holdPhase = p >= 0.3 && p < 0.7;
const exitProgress = p >= 0.7 ? (p - 0.7) / 0.3 : 0;
const enterScale = easing.spring(enterProgress, 150, 14, 1);
const exitAlpha = 1 - easing.easeInCubic(exitProgress);
```

### 3.3 时间驱动动画

对于需要持续动画的效果（如背景、粒子），使用 `time`（秒）驱动，而非 `progress`：

```typescript
const breathe = Math.sin(time * 2) * 0.5 + 0.5;
const rotation = time * 0.5;
const shimmerPos = (time * 0.3) % 1;
```

---

## 4. 模板工具库完整 API 参考

所有工具从 `./templateUtils` 导入：

```typescript
import { easing, adaptiveLayout, colorUtils, palettes, drawUtils, animationUtils, paramGuard, TemplateBase } from './templateUtils';
```

### 4.1 easing — 缓动函数

所有缓动函数签名：`(t: number) => number`，输入输出范围均为 `[0, 1]`（部分弹性函数可能超出此范围）。

| 函数名 | 效果描述 | 典型用途 |
|--------|----------|----------|
| `linear` | 线性，无缓动 | 匀速运动 |
| `easeInQuad` | 二次缓入 | 慢启动加速 |
| `easeOutQuad` | 二次缓出 | 减速停止 |
| `easeInOutQuad` | 二次缓入缓出 | 平滑过渡 |
| `easeInCubic` | 三次缓入 | 更强的慢启动 |
| `easeOutCubic` | 三次缓出 | **最常用**，柔和减速 |
| `easeInOutCubic` | 三次缓入缓出 | 平滑过渡 |
| `easeInQuart` | 四次缓入 | 极慢启动 |
| `easeOutQuart` | 四次缓出 | 快速减速 |
| `easeInOutQuart` | 四次缓入缓出 | 平滑过渡 |
| `easeInQuint` | 五次缓入 | 极端慢启动 |
| `easeOutQuint` | 五次缓出 | 极端减速 |
| `easeInOutQuint` | 五次缓入缓出 | 平滑过渡 |
| `easeInExpo` | 指数缓入 | 爆发式启动 |
| `easeOutExpo` | 指数缓出 | 急速减速 |
| `easeInOutExpo` | 指数缓入缓出 | 平滑过渡 |
| `easeOutElastic` | 弹性缓出 | 弹簧效果 |
| `easeOutBack` | 回弹缓出 | 过冲回弹 |
| `easeOutBounce` | 弹跳缓出 | 落地弹跳 |
| `easeInBounce` | 弹跳缓入 | 反向弹跳 |
| `easeInOutBounce` | 弹跳缓入缓出 | 双向弹跳 |
| `spring` | 弹簧效果 | `(t, mass=150, stiffness=14, damping=1)` |
| `springBounce` | 弹簧弹跳 | `(t, mass=150, stiffness=14, damping=1)` |
| `criticalSpring` | 临界阻尼弹簧 | 无过冲的弹簧 |
| `gravityBounce` | 重力弹跳 | `(t, gravity=9.8, bounciness=0.6)` |
| `momentumEase` | 动量缓动 | 惯性效果 |
| `snapSpring` | 吸附弹簧 | `(t, mass=350, stiffness=30)` |
| `elasticOut` | 弹性缓出 | 橡皮筋效果 |
| `whipEffect` | 鞭打效果 | 快速甩动 |
| `inertiaDecay` | 惯性衰减 | 逐渐停止 |
| `perlinNoise1D` | 一维柏林噪声 | `(t, octaves=3, seed=0)` 确定性随机 |
| `dampedOscillation` | 阻尼振荡 | `(t, frequency=1, damping=0.1)` |
| `bezierEase` | 贝塞尔缓动 | 自定义曲线 |

**特殊函数签名**：
```typescript
easing.spring(t: number, mass?: number, stiffness?: number, damping?: number): number
easing.springBounce(t: number, mass?: number, stiffness?: number, damping?: number): number
easing.snapSpring(t: number, mass?: number, stiffness?: number): number
easing.gravityBounce(t: number, gravity?: number, bounciness?: number): number
easing.perlinNoise1D(t: number, octaves?: number, seed?: number): number
easing.dampedOscillation(t: number, frequency?: number, damping?: number): number
easing.bezierEase(t: number, ...controlPoints: number[]): number
```

### 4.2 adaptiveLayout — 自适应布局

```typescript
adaptiveLayout.getAvailableSize(width: number, height: number, fillRatio?: number): { width: number; height: number }
```
- 获取可用绘制区域，`fillRatio` 默认 0.95（占画面 95%）
- 返回 `{ width: width * fillRatio, height: height * fillRatio }`

```typescript
adaptiveLayout.calculateFontSize(ctx: CanvasRenderingContext2D, text: string, availableWidth: number, availableHeight: number, maxLines?: number): number
```
- 自动计算文字能填满可用区域的最大字体大小
- `maxLines` 默认 1（单行）
- 返回合适的 fontSize（像素）

```typescript
adaptiveLayout.calculateScale(contentWidth: number, contentHeight: number, targetWidth: number, targetHeight: number, fillRatio?: number): number
```
- 计算内容适配目标区域所需的缩放比例
- `fillRatio` 默认 0.95
- 返回缩放因子（取宽高缩放的最小值，保持宽高比）

### 4.3 colorUtils — 颜色工具

```typescript
colorUtils.adjustBrightness(color: string, amount: number): string
```
- 调整颜色亮度，`amount` 正值变亮，负值变暗
- 返回 `#rrggbb` 格式

```typescript
colorUtils.toRgba(color: string, alpha: number): string
```
- 将 hex 颜色转为 rgba 字符串
- 返回 `rgba(r, g, b, alpha)` 格式

```typescript
colorUtils.hexToRgb(color: string): { r: number; g: number; b: number }
```
- 将 hex 颜色转为 RGB 对象
- 输入 `#rrggbb`，返回 `{ r: 0-255, g: 0-255, b: 0-255 }`

```typescript
colorUtils.rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number }
```
- RGB 转 HSL，`h` 范围 0-360，`s` 和 `l` 范围 0-1

```typescript
colorUtils.hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number }
```
- HSL 转 RGB，`h` 范围 0-360，`s` 和 `l` 范围 0-1

```typescript
colorUtils.lerpColor(c1: string, c2: string, t: number): string
```
- 两个 hex 颜色之间线性插值，`t` 范围 0-1
- 返回 `#rrggbb` 格式

```typescript
colorUtils.withAlpha(r: number, g: number, b: number, a: number): string
```
- 从 RGB 值生成 rgba 字符串
- 返回 `rgba(r, g, b, a)` 格式

### 4.4 palettes — 配色方案

详见 [第 5 节：配色方案完整列表](#5-配色方案完整列表)。

使用方式：
```typescript
const colors = palettes.neon;  // string[]
const primaryColor = palettes.cyberpunk[0];  // '#ff003c'
```

### 4.5 drawUtils — 绘制工具

#### roundedRect — 圆角矩形路径
```typescript
drawUtils.roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void
```
- 创建圆角矩形路径（不会自动 fill 或 stroke）
- 需要在调用后手动调用 `ctx.fill()` 或 `ctx.stroke()`

#### shadowRect — 带阴影的矩形
```typescript
drawUtils.shadowRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, color: string, shadowColor: string, shadowBlur: number, shadowOffsetX?: number, shadowOffsetY?: number): void
```
- 绘制带阴影的填充矩形
- `shadowOffsetX` 和 `shadowOffsetY` 默认 0

#### glow — 发光效果
```typescript
drawUtils.glow(ctx: CanvasRenderingContext2D, color: string, intensity: number, callback: () => void): void
```
- 在 callback 中的绘制操作添加发光效果
- 自动 save/restore

#### multiLayerGlow — 多层发光
```typescript
drawUtils.multiLayerGlow(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, radius: number, layers?: number): void
```
- 在指定位置绘制多层径向发光
- `layers` 默认 4

#### premiumGradient — 高级线性渐变
```typescript
drawUtils.premiumGradient(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, colors: string[], angle?: number): CanvasGradient
```
- 创建多色线性渐变
- `angle` 默认 135（度），从左上到右下
- 返回 CanvasGradient 对象，需赋值给 `ctx.fillStyle`

#### radialGlow — 径向发光
```typescript
drawUtils.radialGlow(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, color: string, intensity?: number): void
```
- 绘制径向渐变发光效果
- `intensity` 默认 1

#### glassBackground — 毛玻璃背景
```typescript
drawUtils.glassBackground(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number, opacity?: number, borderColor?: string, blur?: number): void
```
- 绘制半透明毛玻璃效果背景
- `opacity` 默认 0.15，`borderColor` 默认 `'rgba(255,255,255,0.2)'`，`blur` 默认 20

#### specularHighlight — 高光反射
```typescript
drawUtils.specularHighlight(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number, opacity?: number): void
```
- 在矩形上半部分绘制高光反射
- `opacity` 默认 0.15

#### shimmerLine — 闪光扫描线
```typescript
drawUtils.shimmerLine(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, progress: number, color?: string, intensity?: number): void
```
- 绘制从左到右移动的闪光线
- `progress` 范围 0-1，`color` 默认 `'#ffffff'`，`intensity` 默认 0.6

#### noiseTexture — 噪点纹理
```typescript
drawUtils.noiseTexture(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, opacity?: number, seed?: number): void
```
- 在指定区域叠加噪点纹理
- `opacity` 默认 0.03，`seed` 默认 0
- **注意**：此函数使用 `getImageData/putImageData`，性能开销较大，谨慎使用

#### vignette — 暗角效果
```typescript
drawUtils.vignette(ctx: CanvasRenderingContext2D, width: number, height: number, intensity?: number, offsetX?: number, offsetY?: number): void
```
- 绘制径向暗角效果
- `intensity` 默认 0.4，`offsetX`/`offsetY` 默认 0

#### particle — 粒子
```typescript
drawUtils.particle(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string, opacity?: number, softness?: number): void
```
- 绘制带径向渐变的柔和粒子
- `opacity` 默认 1，`softness` 默认 0.8（越大越柔和）

#### lightBeam — 光束
```typescript
drawUtils.lightBeam(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, width?: number, opacity?: number, glowSize?: number): void
```
- 绘制两点之间的发光光束
- `width` 默认 2，`opacity` 默认 0.6，`glowSize` 默认 20

#### textWithShadow — 带阴影文字
```typescript
drawUtils.textWithShadow(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, fillColor: string, shadowColor?: string, shadowBlur?: number, shadowOffsetX?: number, shadowOffsetY?: number): void
```
- 绘制带投影的文字
- `shadowColor` 默认 `'rgba(0,0,0,0.5)'`，`shadowBlur` 默认 8，偏移默认 2

#### gradientText — 渐变文字
```typescript
drawUtils.gradientText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, colors: string[], angle?: number, maxWidth?: number): void
```
- 绘制渐变色文字
- `angle` 默认 135，`maxWidth` 可选

#### neonText — 霓虹文字
```typescript
drawUtils.neonText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, intensity?: number): void
```
- 绘制多层发光的霓虹文字效果
- `intensity` 默认 1
- 自动 save/restore

#### borderBeam — 边框光束
```typescript
drawUtils.borderBeam(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number, progress: number, color1: string, color2: string, beamWidth?: number): void
```
- 在圆角矩形边框上绘制移动的光束
- `progress` 范围 0-1，`beamWidth` 默认 60

#### meshGradient — 网格渐变
```typescript
drawUtils.meshGradient(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, colors: string[], time?: number, intensity?: number): void
```
- 绘制多色网格渐变背景（颜色球随时间移动）
- `time` 默认 0，`intensity` 默认 0.3

### 4.6 animationUtils — 动画工具

```typescript
animationUtils.loopProgress(progress: number, cycles: number): number
```
- 将进度循环 `cycles` 次，返回当前循环内的进度 [0, 1)

```typescript
animationUtils.pingPong(progress: number): number
```
- 进度来回摆动，0→1→0

```typescript
animationUtils.pulse(progress: number, frequency?: number): number
```
- 正弦脉冲，`frequency` 默认 1，返回 [0, 1]

```typescript
animationUtils.delay(progress: number, delay: number): number
```
- 延迟启动，`delay` 为延迟比例（0-1），返回 [0, 1]

```typescript
animationUtils.stagger(progress: number, index: number, total: number, overlap?: number): number
```
- 交错动画，为第 `index` 个元素（共 `total` 个）计算独立进度
- `overlap` 默认 0.3，返回 [0, 1]

### 4.7 paramGuard — 参数保护

```typescript
paramGuard.number(value: any, defaultValue: number, min: number, max: number): number
```
- 保护数值参数，确保在 [min, max] 范围内
- 如果 value 不是 number 类型，使用 defaultValue

```typescript
paramGuard.string(value: any, defaultValue: string): string
```
- 保护字符串参数
- 如果 value 不是 string 类型，使用 defaultValue

```typescript
paramGuard.boolean(value: any, defaultValue: boolean): boolean
```
- 保护布尔参数
- 如果 value 不是 boolean 类型，使用 defaultValue

```typescript
paramGuard.color(value: any, defaultValue: string): string
```
- 保护颜色参数，验证 hex 格式（`#rrggbb` 或 `#rgb`）
- 如果格式不匹配，使用 defaultValue

### 4.8 TemplateBase — 模板基类

```typescript
abstract class TemplateBase {
  protected ctx: CanvasRenderingContext2D;
  protected width: number;
  protected height: number;
  protected progress: number;
  protected time: number;
  protected duration: number;
  protected params: Record<string, any>;

  constructor(context: TemplateRenderContext);

  protected getAdaptiveSize(fillRatio?: number): { width: number; height: number };
  protected calculateAdaptiveFontSize(text: string, maxWidth: number, maxHeight: number, maxLines?: number): number;
  protected guardProgress(value: number): number;

  abstract render(): void;
}
```

> **注意**：当前项目中绝大多数模板使用函数式定义（直接导出 `TemplateDefinition` 对象），而非继承 `TemplateBase`。AI 生成模板时优先使用函数式定义。

---

## 5. 配色方案完整列表

```typescript
palettes.aurora:     ['#00ff87', '#60efff', '#0061ff', '#7b2ff7', '#ff00e5']
palettes.cyberpunk:  ['#ff003c', '#ff6b00', '#ffd000', '#00ff87', '#00d4ff', '#7b2ff7']
palettes.sunset:     ['#ff6b35', '#f7c59f', '#efefd0', '#004e89', '#1a659e']
palettes.ocean:      ['#0a1628', '#0d2137', '#134074', '#13678a', '#45b7d1', '#88e0ef']
palettes.neon:       ['#ff0080', '#ff00ff', '#8000ff', '#0040ff', '#00bfff', '#00ff80']
palettes.fire:       ['#1a0000', '#4d0000', '#990000', '#ff1a1a', '#ff6600', '#ffcc00', '#ffff99']
palettes.galaxy:     ['#0b0d17', '#1a1a2e', '#16213e', '#0f3460', '#533483', '#e94560']
palettes.glass:      ['#ffffff', '#e8f4f8', '#c5e4ed', '#a0d2db', '#7ec8c8']
palettes.premium:    ['#0f0f0f', '#1a1a2e', '#2d2d44', '#e8d5b7', '#f5e6cc', '#ffffff']
palettes.matrix:     ['#000000', '#001100', '#003300', '#006600', '#00cc00', '#00ff00']
palettes.dream:      ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe']
palettes.ember:      ['#0d0d0d', '#1a0a00', '#3d1500', '#7a2e00', '#cc5500', '#ff8800', '#ffbb33']
palettes.frost:      ['#e8f4f8', '#c5e4ed', '#88d4e8', '#45b7d1', '#2e8ba6', '#1a659e']
palettes.royal:      ['#0a0a1a', '#1a1a3e', '#2d1b69', '#5b21b6', '#7c3aed', '#a78bfa', '#c4b5fd']
```

**配色方案适用场景**：

| 方案 | 适用场景 | 风格 |
|------|----------|------|
| aurora | 极光、自然光效 | 清新、多彩 |
| cyberpunk | 故障、科技、赛博朋克 | 霓虹、高对比 |
| sunset | 日落、温暖场景 | 暖色调 |
| ocean | 海洋、深度、冷静 | 冷色调、渐变 |
| neon | 霓虹、发光、夜店 | 高饱和、荧光 |
| fire | 火焰、爆炸、热力 | 红橙黄渐变 |
| galaxy | 星系、宇宙、深空 | 深色+点缀 |
| glass | 毛玻璃、透明、现代 | 低饱和、通透 |
| premium | 高端、奢华、商务 | 暗色+金色 |
| matrix | 黑客、代码、矩阵 | 绿色终端 |
| dream | 梦幻、渐变、柔和 | 紫粉蓝渐变 |
| ember | 余烬、温暖、暗调 | 暗橙渐变 |
| frost | 冰霜、寒冷、清爽 | 冰蓝渐变 |
| royal | 皇家、高贵、神秘 | 深紫渐变 |

---

## 6. 模板分类和 ID 命名规范

### 6.1 分类定义

| 分类 | category 值 | ID 前缀 | 适用场景 |
|------|-------------|---------|----------|
| 文字效果 | `'text'` | `text_` | 文字动画、文字特效、文字展示 |
| UI 组件 | `'ui'` | `ui_` | 按钮、卡片、弹窗、导航等 UI 元素 |
| 视觉特效 | `'effect'` | `effect_` 或 `bg_` | 粒子、光环、冲击波等视觉特效；背景效果 |
| 转场效果 | `'transition'` | `transition_` | 淡入淡出、滑动、缩放等转场 |
| 代码效果 | `'code'` | 无固定前缀 | 代码展示、终端效果 |
| 其他 | `'other'` | 自定义 | 不属于以上分类的效果 |

### 6.2 ID 命名规则

- 格式：`<前缀><snake_case_name>`
- 使用小写字母和下划线
- 名称应简洁、描述性强
- 不得与现有模板 ID 重复

```typescript
// ✅ 正确
id: 'text_wave_reveal'
id: 'ui_toggle_switch'
id: 'effect_spiral_vortex'
id: 'transition_wipe'
id: 'bg_liquid_ether'

// ❌ 错误
id: 'TextWave'        // 大写字母
id: 'text-wave'       // 连字符
id: 'wave'            // 缺少前缀
id: 'text_glitch'     // 已存在
```

### 6.3 文件命名规则

- 文件名使用 camelCase
- 与导出变量名对应（去掉 Template 后缀）
- 示例：`glitchText.ts` → `export const glitchTextTemplate`

| 模板 ID | 文件名 | 导出变量名 |
|---------|--------|-----------|
| `text_glitch` | `glitchText.ts` | `glitchTextTemplate` |
| `ui_elastic_button` | `elasticButton.ts` | `elasticButtonTemplate` |
| `bg_aurora` | `aurora.ts` | `auroraTemplate` |
| `transition_fade` | `fadeTransition.ts` | `fadeTransitionTemplate` |

---

## 7. 完整的模板代码模板

以下是 AI 可以直接填充的代码骨架，复制后替换标记部分即可：

```typescript
import { TemplateDefinition, TemplateRenderContext } from './types';
import { easing, adaptiveLayout, paramGuard, drawUtils, colorUtils, animationUtils, palettes } from './templateUtils';

export const __templateVarName__: TemplateDefinition = {
  id: '__template_id__',
  name: '__模板中文名__',
  description: '__模板描述__',
  category: '__category__',
  schema: [
    {
      key: '__paramKey__',
      label: '__参数标签__',
      type: '__paramType__',
      default: __defaultValue__,
      // number 类型必填：
      min: __min__,
      max: __max__,
      step: __step__,
      // select 类型必填：
      options: [
        { label: '__选项标签__', value: '__选项值__' }
      ],
      // string/textarea/code 类型可选：
      placeholder: '__占位文字__'
    }
  ],

  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, duration, params } = context;

    // 1. 获取自适应布局
    const availSize = adaptiveLayout.getAvailableSize(width, height, 0.95);

    // 2. 参数保护（必须）
    // const textValue = paramGuard.string(params.textKey, 'defaultText');
    // const numValue = paramGuard.number(params.numKey, 1, 0, 10);
    // const colorValue = paramGuard.color(params.colorKey, '#ffffff');
    // const boolValue = paramGuard.boolean(params.boolKey, true);

    // 3. 进度保护（必须）
    const p = paramGuard.number(progress, 0, 0, 1);

    // 4. 缓动处理
    const eased = easing.easeOutCubic(p);

    // 5. 动画阶段划分
    const enterProgress = Math.min(1, p / 0.3);
    const holdPhase = p >= 0.3 && p < 0.7;
    const exitProgress = p >= 0.7 ? (p - 0.7) / 0.3 : 0;

    // 6. 绘制背景
    ctx.save();
    // ... 背景绘制
    ctx.restore();

    // 7. 绘制主要内容
    ctx.save();
    // ... 主要内容绘制
    ctx.restore();

    // 8. 绘制装饰效果
    ctx.save();
    // ... 装饰效果
    ctx.restore();
  },

  initParams: (duration: number) => ({
    // 与 schema 中的 default 值一致
  }),

  validateParams: (params: Record<string, any>) => {
    // 验证关键参数
    return true;
  }
};
```

---

## 8. 多种分类的完整代码示例

### 8.1 Text 类示例：波浪文字

```typescript
import { TemplateDefinition, TemplateRenderContext } from './types';
import { easing, adaptiveLayout, paramGuard, drawUtils, colorUtils, animationUtils, palettes } from './templateUtils';

export const waveTextTemplate: TemplateDefinition = {
  id: 'text_wave',
  name: '波浪文字',
  description: '文字沿正弦波浪路径排列，带有渐变色和发光效果',
  category: 'text',
  schema: [
    {
      key: 'text',
      label: '文字内容',
      type: 'string',
      default: 'WAVE',
      placeholder: '输入要显示的文字'
    },
    {
      key: 'mainColor',
      label: '主色',
      type: 'color',
      default: '#00d4ff'
    },
    {
      key: 'accentColor',
      label: '强调色',
      type: 'color',
      default: '#ff0080'
    },
    {
      key: 'waveAmplitude',
      label: '波浪振幅',
      type: 'number',
      default: 0.3,
      min: 0.1,
      max: 0.6,
      step: 0.05
    },
    {
      key: 'waveFrequency',
      label: '波浪频率',
      type: 'number',
      default: 2,
      min: 1,
      max: 5,
      step: 0.5
    },
    {
      key: 'glowIntensity',
      label: '发光强度',
      type: 'number',
      default: 0.8,
      min: 0.3,
      max: 1.5,
      step: 0.1
    }
  ],

  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const availSize = adaptiveLayout.getAvailableSize(width, height, 0.9);
    const text = paramGuard.string(params.text, 'WAVE');
    const mainColor = paramGuard.color(params.mainColor, '#00d4ff');
    const accentColor = paramGuard.color(params.accentColor, '#ff0080');
    const waveAmplitude = paramGuard.number(params.waveAmplitude, 0.3, 0.1, 0.6);
    const waveFrequency = paramGuard.number(params.waveFrequency, 2, 1, 5);
    const glowIntensity = paramGuard.number(params.glowIntensity, 0.8, 0.3, 1.5);
    const p = paramGuard.number(progress, 0, 0, 1);

    const enterProgress = Math.min(1, p / 0.3);
    const enterAlpha = easing.easeOutCubic(enterProgress);
    const exitProgress = p > 0.75 ? (p - 0.75) / 0.25 : 0;
    const exitAlpha = 1 - easing.easeInCubic(exitProgress);

    ctx.save();
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(-width / 2, -height / 2, width, height);
    drawUtils.meshGradient(ctx, -width / 2, -height / 2, width, height, [palettes.ocean[2], palettes.ocean[4], mainColor], time * 0.15, 0.2);
    drawUtils.vignette(ctx, width, height, 0.5);
    ctx.restore();

    const fontSize = adaptiveLayout.calculateFontSize(ctx, text, availSize.width * 0.8, availSize.height * 0.4);
    const charSpacing = fontSize * 0.85;
    const totalWidth = text.length * charSpacing;
    const startX = -totalWidth / 2 + charSpacing / 2;
    const amplitude = availSize.height * waveAmplitude;

    for (let i = 0; i < text.length; i++) {
      const staggerP = animationUtils.stagger(enterProgress, i, text.length, 0.4);
      const charEased = easing.spring(staggerP, 200, 16, 1);
      const charAlpha = charEased * exitAlpha;

      const charX = startX + i * charSpacing;
      const waveOffset = Math.sin(time * waveFrequency + i * 0.5) * amplitude * charEased;
      const charY = waveOffset;

      const t = i / Math.max(1, text.length - 1);
      const charColor = colorUtils.lerpColor(mainColor, accentColor, t);

      ctx.save();
      ctx.globalAlpha = charAlpha;
      ctx.font = `bold ${fontSize}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      drawUtils.glow(ctx, charColor, 20 * glowIntensity * charEased, () => {
        ctx.fillStyle = charColor;
        ctx.fillText(text[i], charX, charY);
      });

      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = charAlpha * 0.6;
      ctx.fillText(text[i], charX, charY - 1);

      ctx.restore();
    }

    ctx.save();
    ctx.globalAlpha = 0.15 * enterAlpha * exitAlpha;
    for (let i = 0; i < 20; i++) {
      const seed = i * 4217;
      const px = ((seed * 13) % 10000) / 10000 * width - width / 2;
      const py = ((seed * 17) % 10000) / 10000 * height - height / 2;
      const pColor = palettes.ocean[(i * 3) % palettes.ocean.length];
      const pAlpha = 0.3 + Math.sin(time * 1.5 + i) * 0.2;
      drawUtils.particle(ctx, px, py, 3 + Math.sin(time + i) * 2, pColor, pAlpha, 0.7);
    }
    ctx.restore();

    ctx.save();
    drawUtils.noiseTexture(ctx, -width / 2, -height / 2, width, height, 0.02, time);
    ctx.restore();
  },

  initParams: () => ({
    text: 'WAVE',
    mainColor: '#00d4ff',
    accentColor: '#ff0080',
    waveAmplitude: 0.3,
    waveFrequency: 2,
    glowIntensity: 0.8
  }),

  validateParams: (params: Record<string, any>) => {
    return params.text && params.text.length > 0;
  }
};
```

### 8.2 UI 类示例：发光卡片

```typescript
import { TemplateDefinition, TemplateRenderContext } from './types';
import { easing, adaptiveLayout, paramGuard, drawUtils, colorUtils, animationUtils, palettes } from './templateUtils';

export const glowCardTemplate: TemplateDefinition = {
  id: 'ui_glow_card',
  name: '发光卡片',
  description: '带有边框发光和悬浮效果的展示卡片',
  category: 'ui',
  schema: [
    {
      key: 'title',
      label: '标题',
      type: 'string',
      default: 'GLOW CARD',
      placeholder: '输入卡片标题'
    },
    {
      key: 'subtitle',
      label: '副标题',
      type: 'string',
      default: 'Premium UI Component',
      placeholder: '输入副标题'
    },
    {
      key: 'bgColor',
      label: '背景色',
      type: 'color',
      default: '#0f0f1a'
    },
    {
      key: 'accentColor',
      label: '强调色',
      type: 'color',
      default: '#7c3aed'
    },
    {
      key: 'borderRadius',
      label: '圆角',
      type: 'number',
      default: 20,
      min: 0,
      max: 50,
      step: 2
    },
    {
      key: 'glowSize',
      label: '发光大小',
      type: 'number',
      default: 40,
      min: 10,
      max: 100,
      step: 5
    }
  ],

  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const availSize = adaptiveLayout.getAvailableSize(width, height, 0.9);
    const title = paramGuard.string(params.title, 'GLOW CARD');
    const subtitle = paramGuard.string(params.subtitle, 'Premium UI Component');
    const bgColor = paramGuard.color(params.bgColor, '#0f0f1a');
    const accentColor = paramGuard.color(params.accentColor, '#7c3aed');
    const borderRadius = paramGuard.number(params.borderRadius, 20, 0, 50);
    const glowSize = paramGuard.number(params.glowSize, 40, 10, 100);
    const p = paramGuard.number(progress, 0, 0, 1);

    const enterProgress = Math.min(1, p / 0.35);
    const enterScale = easing.snapSpring(enterProgress, 300, 28);
    const enterAlpha = easing.easeOutCubic(enterProgress);
    const exitProgress = p > 0.75 ? (p - 0.75) / 0.25 : 0;
    const exitAlpha = 1 - easing.easeInCubic(exitProgress);

    ctx.save();
    drawUtils.meshGradient(ctx, -width / 2, -height / 2, width, height, palettes.royal, time * 0.08, 0.2);
    drawUtils.vignette(ctx, width, height, 0.45);
    ctx.restore();

    const cardWidth = availSize.width * 0.7;
    const cardHeight = availSize.height * 0.55;
    const radius = Math.min(borderRadius, cardHeight * 0.15);

    ctx.save();
    ctx.globalAlpha = enterAlpha * exitAlpha;
    ctx.scale(enterScale, enterScale);

    const breathe = easing.dampedOscillation(time * 1.5, 1.2, 0.08) * 0.01;
    ctx.scale(1 + breathe, 1 + breathe);

    drawUtils.multiLayerGlow(ctx, 0, 0, accentColor, cardWidth * 0.25, 5);

    const cardGrad = drawUtils.premiumGradient(
      ctx, -cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight,
      [colorUtils.adjustBrightness(bgColor, 20), bgColor, colorUtils.adjustBrightness(bgColor, -15)],
      135
    );
    drawUtils.roundedRect(ctx, -cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, radius);
    ctx.fillStyle = cardGrad;
    ctx.fill();

    drawUtils.glassBackground(ctx, -cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, radius, 0.06, colorUtils.toRgba(accentColor, 0.08));
    drawUtils.specularHighlight(ctx, -cardWidth / 2 + 4, -cardHeight / 2 + 4, cardWidth - 8, cardHeight, radius * 0.8, 0.12);

    const shimmerProgress = (time * 0.25) % 1;
    ctx.save();
    drawUtils.roundedRect(ctx, -cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, radius);
    ctx.clip();
    drawUtils.shimmerLine(ctx, -cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, shimmerProgress, accentColor, 0.1);
    ctx.restore();

    const beamProgress = (time * 0.3) % 1;
    drawUtils.borderBeam(ctx, -cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, radius, beamProgress, accentColor, colorUtils.lerpColor(accentColor, '#ff00e5', 0.5), glowSize);

    ctx.strokeStyle = colorUtils.toRgba(accentColor, 0.3);
    ctx.lineWidth = 1;
    drawUtils.roundedRect(ctx, -cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, radius);
    ctx.stroke();

    const titleFontSize = adaptiveLayout.calculateFontSize(ctx, title, cardWidth * 0.8, cardHeight * 0.25);
    ctx.font = `bold ${titleFontSize}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    drawUtils.gradientText(ctx, title, 0, -cardHeight * 0.1, ['#ffffff', accentColor, '#ffffff'], 90);

    const subtitleFontSize = adaptiveLayout.calculateFontSize(ctx, subtitle, cardWidth * 0.7, cardHeight * 0.15);
    ctx.font = `${subtitleFontSize}px Arial, sans-serif`;
    ctx.fillStyle = colorUtils.toRgba('#ffffff', 0.5);
    ctx.fillText(subtitle, 0, cardHeight * 0.15);

    ctx.restore();
  },

  initParams: () => ({
    title: 'GLOW CARD',
    subtitle: 'Premium UI Component',
    bgColor: '#0f0f1a',
    accentColor: '#7c3aed',
    borderRadius: 20,
    glowSize: 40
  }),

  validateParams: (params: Record<string, any>) => {
    return params.title && params.title.length > 0;
  }
};
```

### 8.3 Effect 类示例：能量漩涡

```typescript
import { TemplateDefinition, TemplateRenderContext } from './types';
import { easing, adaptiveLayout, paramGuard, drawUtils, colorUtils, animationUtils, palettes } from './templateUtils';

export const energyVortexTemplate: TemplateDefinition = {
  id: 'effect_energy_vortex',
  name: '能量漩涡',
  description: '螺旋能量漩涡特效，带有粒子轨迹和中心发光',
  category: 'effect',
  schema: [
    {
      key: 'color1',
      label: '主色',
      type: 'color',
      default: '#7c3aed'
    },
    {
      key: 'color2',
      label: '辅色',
      type: 'color',
      default: '#00d4ff'
    },
    {
      key: 'spiralCount',
      label: '螺旋臂数',
      type: 'number',
      default: 3,
      min: 2,
      max: 6,
      step: 1
    },
    {
      key: 'rotationSpeed',
      label: '旋转速度',
      type: 'number',
      default: 1.5,
      min: 0.5,
      max: 4,
      step: 0.5
    },
    {
      key: 'particleCount',
      label: '粒子数量',
      type: 'number',
      default: 60,
      min: 20,
      max: 150,
      step: 10
    },
    {
      key: 'intensity',
      label: '亮度',
      type: 'number',
      default: 1,
      min: 0.3,
      max: 1.5,
      step: 0.1
    }
  ],

  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const availSize = adaptiveLayout.getAvailableSize(width, height, 0.95);
    const color1 = paramGuard.color(params.color1, '#7c3aed');
    const color2 = paramGuard.color(params.color2, '#00d4ff');
    const spiralCount = paramGuard.number(params.spiralCount, 3, 2, 6);
    const rotationSpeed = paramGuard.number(params.rotationSpeed, 1.5, 0.5, 4);
    const particleCount = paramGuard.number(params.particleCount, 60, 20, 150);
    const intensity = paramGuard.number(params.intensity, 1, 0.3, 1.5);
    const p = paramGuard.number(progress, 0, 0, 1);

    const enterProgress = Math.min(1, p / 0.3);
    const enterScale = easing.easeOutCubic(enterProgress);
    const exitProgress = p > 0.8 ? (p - 0.8) / 0.2 : 0;
    const exitAlpha = 1 - easing.easeInCubic(exitProgress);

    ctx.save();
    ctx.fillStyle = '#050510';
    ctx.fillRect(-width / 2, -height / 2, width, height);
    drawUtils.meshGradient(ctx, -width / 2, -height / 2, width, height, ['#0a0520', '#0f0830', '#050520'], time * 0.1, 0.2);
    ctx.restore();

    const maxRadius = Math.min(availSize.width, availSize.height) * 0.45;

    ctx.save();
    ctx.globalAlpha = enterScale * exitAlpha * intensity;

    for (let arm = 0; arm < spiralCount; arm++) {
      const armAngle = (arm / spiralCount) * Math.PI * 2;
      const armColor = arm % 2 === 0 ? color1 : color2;

      ctx.save();
      ctx.rotate(time * rotationSpeed + armAngle);

      for (let i = 0; i < 30; i++) {
        const t = i / 30;
        const spiralRadius = t * maxRadius * enterScale;
        const spiralAngle = t * Math.PI * 4;
        const x = Math.cos(spiralAngle) * spiralRadius;
        const y = Math.sin(spiralAngle) * spiralRadius;
        const dotSize = (1 - t) * 4 + 1;
        const dotAlpha = (1 - t * 0.7) * 0.6;

        const dotColor = colorUtils.lerpColor(armColor, '#ffffff', t * 0.3);
        drawUtils.particle(ctx, x, y, dotSize * 2, dotColor, dotAlpha * intensity, 0.5);
      }

      ctx.restore();
    }

    drawUtils.multiLayerGlow(ctx, 0, 0, color1, maxRadius * 0.3, 6);
    drawUtils.radialGlow(ctx, 0, 0, maxRadius * 0.15, '#ffffff', 0.5 * intensity);

    for (let i = 0; i < particleCount; i++) {
      const seed = i * 3571;
      const angle = ((seed * 13) % 10000) / 10000 * Math.PI * 2 + time * rotationSpeed * 0.5;
      const dist = ((seed * 7) % 10000) / 10000 * maxRadius * enterScale;
      const px = Math.cos(angle) * dist;
      const py = Math.sin(angle) * dist;
      const pSize = 1 + ((seed * 3) % 100) / 100 * 3;
      const pAlpha = (0.2 + Math.sin(time * 2 + i * 0.5) * 0.15) * intensity;
      const pColor = i % 2 === 0 ? color1 : color2;

      drawUtils.particle(ctx, px, py, pSize, pColor, pAlpha, 0.6);
    }

    ctx.restore();

    ctx.save();
    drawUtils.vignette(ctx, width, height, 0.5);
    drawUtils.noiseTexture(ctx, -width / 2, -height / 2, width, height, 0.015, time);
    ctx.restore();
  },

  initParams: () => ({
    color1: '#7c3aed',
    color2: '#00d4ff',
    spiralCount: 3,
    rotationSpeed: 1.5,
    particleCount: 60,
    intensity: 1
  }),

  validateParams: (params: Record<string, any>) => {
    return params.color1 && params.color2;
  }
};
```

### 8.4 Background 类示例：流光网格

```typescript
import { TemplateDefinition, TemplateRenderContext } from './types';
import { easing, adaptiveLayout, paramGuard, drawUtils, colorUtils, animationUtils, palettes } from './templateUtils';

export const gridFlowTemplate: TemplateDefinition = {
  id: 'bg_grid_flow',
  name: '流光网格',
  description: '带有流光效果和透视变形的动态网格背景',
  category: 'effect',
  schema: [
    {
      key: 'gridColor',
      label: '网格颜色',
      type: 'color',
      default: '#00d4ff'
    },
    {
      key: 'gridSpacing',
      label: '网格间距',
      type: 'number',
      default: 40,
      min: 20,
      max: 80,
      step: 5
    },
    {
      key: 'flowSpeed',
      label: '流动速度',
      type: 'number',
      default: 1,
      min: 0.3,
      max: 3,
      step: 0.1
    },
    {
      key: 'glowIntensity',
      label: '发光强度',
      type: 'number',
      default: 0.6,
      min: 0.2,
      max: 1,
      step: 0.1
    },
    {
      key: 'paletteName',
      label: '配色方案',
      type: 'select',
      default: 'cyberpunk',
      options: [
        { label: '赛博朋克', value: 'cyberpunk' },
        { label: '霓虹', value: 'neon' },
        { label: '矩阵', value: 'matrix' },
        { label: '梦幻', value: 'dream' }
      ]
    }
  ],

  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const gridColor = paramGuard.color(params.gridColor, '#00d4ff');
    const gridSpacing = paramGuard.number(params.gridSpacing, 40, 20, 80);
    const flowSpeed = paramGuard.number(params.flowSpeed, 1, 0.3, 3);
    const glowIntensity = paramGuard.number(params.glowIntensity, 0.6, 0.2, 1);
    const paletteName = paramGuard.string(params.paletteName, 'cyberpunk');
    const p = paramGuard.number(progress, 0, 0, 1);

    const paletteMap: Record<string, string[]> = {
      cyberpunk: palettes.cyberpunk,
      neon: palettes.neon,
      matrix: palettes.matrix,
      dream: palettes.dream
    };
    const palette = paletteMap[paletteName] || palettes.cyberpunk;

    ctx.save();
    ctx.fillStyle = '#050510';
    ctx.fillRect(-width / 2, -height / 2, width, height);
    drawUtils.meshGradient(ctx, -width / 2, -height / 2, width, height, [palette[0], palette[3] || palette[1], palette[4] || palette[2]], time * 0.06, 0.15);
    ctx.restore();

    const flowOffset = time * flowSpeed * 20;
    const rgb = colorUtils.hexToRgb(gridColor);

    ctx.save();
    ctx.globalAlpha = glowIntensity * 0.3;

    for (let x = -width / 2; x <= width / 2; x += gridSpacing) {
      const distFromCenter = Math.abs(x) / (width / 2);
      const lineAlpha = (1 - distFromCenter * 0.7) * glowIntensity;
      const waveShift = Math.sin(time * flowSpeed + x * 0.01) * 3;

      ctx.strokeStyle = colorUtils.withAlpha(rgb.r, rgb.g, rgb.b, lineAlpha * 0.4);
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(x + waveShift, -height / 2);
      ctx.lineTo(x + waveShift, height / 2);
      ctx.stroke();
    }

    for (let y = -height / 2; y <= height / 2; y += gridSpacing) {
      const yOffset = ((y + flowOffset) % gridSpacing) - gridSpacing / 2;
      const distFromCenter = Math.abs(y) / (height / 2);
      const lineAlpha = (1 - distFromCenter * 0.7) * glowIntensity;
      const waveShift = Math.sin(time * flowSpeed + y * 0.01) * 3;

      ctx.strokeStyle = colorUtils.withAlpha(rgb.r, rgb.g, rgb.b, lineAlpha * 0.4);
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(-width / 2, y + waveShift);
      ctx.lineTo(width / 2, y + waveShift);
      ctx.stroke();
    }
    ctx.restore();

    const intersectionGlow = Math.floor(width / gridSpacing) * Math.floor(height / gridSpacing);
    ctx.save();
    for (let ix = -width / 2; ix <= width / 2; ix += gridSpacing) {
      for (let iy = -height / 2; iy <= height / 2; iy += gridSpacing) {
        const dist = Math.sqrt(ix * ix + iy * iy);
        const maxDist = Math.sqrt(width * width + height * height) / 2;
        const brightness = (1 - dist / maxDist) * glowIntensity;
        const pulse = (Math.sin(time * flowSpeed * 2 + ix * 0.05 + iy * 0.05) + 1) / 2;

        if (brightness > 0.1) {
          drawUtils.particle(ctx, ix, iy, 2 + pulse * 2, gridColor, brightness * 0.5 * pulse, 0.6);
        }
      }
    }
    ctx.restore();

    const beamX = Math.sin(time * flowSpeed * 0.5) * width * 0.3;
    const beamY = Math.cos(time * flowSpeed * 0.3) * height * 0.3;
    ctx.save();
    drawUtils.radialGlow(ctx, beamX, beamY, 150, palette[1], 0.15 * glowIntensity);
    ctx.restore();

    ctx.save();
    drawUtils.vignette(ctx, width, height, 0.5);
    drawUtils.noiseTexture(ctx, -width / 2, -height / 2, width, height, 0.01, time);
    ctx.restore();
  },

  initParams: () => ({
    gridColor: '#00d4ff',
    gridSpacing: 40,
    flowSpeed: 1,
    glowIntensity: 0.6,
    paletteName: 'cyberpunk'
  }),

  validateParams: (params: Record<string, any>) => {
    return params.gridColor && params.gridSpacing > 0;
  }
};
```

### 8.5 Transition 类示例：百叶窗转场

```typescript
import { TemplateDefinition, TemplateRenderContext } from './types';
import { easing, adaptiveLayout, paramGuard, drawUtils, colorUtils, animationUtils, palettes } from './templateUtils';

export const blindsTransitionTemplate: TemplateDefinition = {
  id: 'transition_blinds',
  name: '百叶窗转场',
  description: '带有光泽效果和色彩分级的百叶窗转场',
  category: 'transition',
  schema: [
    {
      key: 'blindsColor',
      label: '百叶窗颜色',
      type: 'color',
      default: '#1a1a2e'
    },
    {
      key: 'stripCount',
      label: '条纹数量',
      type: 'number',
      default: 8,
      min: 3,
      max: 20,
      step: 1
    },
    {
      key: 'direction',
      label: '方向',
      type: 'select',
      default: 'horizontal',
      options: [
        { label: '水平', value: 'horizontal' },
        { label: '垂直', value: 'vertical' }
      ]
    },
    {
      key: 'accentColor',
      label: '光泽色',
      type: 'color',
      default: '#00d4ff'
    }
  ],

  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const blindsColor = paramGuard.color(params.blindsColor, '#1a1a2e');
    const stripCount = paramGuard.number(params.stripCount, 8, 3, 20);
    const direction = paramGuard.string(params.direction, 'horizontal');
    const accentColor = paramGuard.color(params.accentColor, '#00d4ff');
    const p = paramGuard.number(progress, 0, 0, 1);

    let closeProgress: number;
    let openProgress: number;

    if (p < 0.5) {
      closeProgress = easing.easeInOutCubic(p * 2);
      openProgress = 0;
    } else {
      closeProgress = 1;
      openProgress = easing.easeInOutCubic((p - 0.5) * 2);
    }

    const isHorizontal = direction === 'horizontal';
    const stripSize = isHorizontal ? height / stripCount : width / stripCount;

    ctx.save();
    for (let i = 0; i < stripCount; i++) {
      const staggerDelay = i / stripCount * 0.2;
      const stripClose = Math.max(0, Math.min(1, (closeProgress - staggerDelay) / (1 - staggerDelay)));
      const stripOpen = Math.max(0, Math.min(1, (openProgress - staggerDelay) / (1 - staggerDelay)));
      const stripProgress = stripClose * (1 - stripOpen);

      if (stripProgress <= 0) continue;

      const pos = isHorizontal ? -height / 2 + i * stripSize : -width / 2 + i * stripSize;
      const stripGrad = drawUtils.premiumGradient(
        ctx,
        isHorizontal ? -width / 2 : pos,
        isHorizontal ? pos : -height / 2,
        isHorizontal ? width : stripSize,
        isHorizontal ? stripSize : height,
        [blindsColor, colorUtils.lerpColor(blindsColor, accentColor, 0.1), blindsColor],
        isHorizontal ? 90 : 0
      );

      ctx.fillStyle = stripGrad;
      ctx.globalAlpha = stripProgress;

      if (isHorizontal) {
        const centerY = pos + stripSize / 2;
        const currentHeight = stripSize * stripProgress;
        ctx.fillRect(-width / 2, centerY - currentHeight / 2, width, currentHeight);
      } else {
        const centerX = pos + stripSize / 2;
        const currentWidth = stripSize * stripProgress;
        ctx.fillRect(centerX - currentWidth / 2, -height / 2, currentWidth, height);
      }

      if (stripProgress > 0.5) {
        ctx.save();
        const shimmerPos = (time * 0.5 + i * 0.1) % 1;
        if (isHorizontal) {
          const centerY = pos + stripSize / 2;
          const currentHeight = stripSize * stripProgress;
          drawUtils.shimmerLine(ctx, -width / 2, centerY - currentHeight / 2, width, currentHeight, shimmerPos, accentColor, 0.1);
        } else {
          const centerX = pos + stripSize / 2;
          const currentWidth = stripSize * stripProgress;
          drawUtils.shimmerLine(ctx, centerX - currentWidth / 2, -height / 2, currentWidth, height, shimmerPos, accentColor, 0.1);
        }
        ctx.restore();
      }
    }
    ctx.restore();

    if (p > 0.3 && p < 0.7) {
      const vignetteAlpha = 1 - Math.abs(p - 0.5) * 4;
      ctx.save();
      drawUtils.vignette(ctx, width, height, 0.3 * vignetteAlpha);
      ctx.restore();
    }
  },

  initParams: () => ({
    blindsColor: '#1a1a2e',
    stripCount: 8,
    direction: 'horizontal',
    accentColor: '#00d4ff'
  }),

  validateParams: (params: Record<string, any>) => {
    return params.stripCount && params.stripCount >= 3;
  }
};
```

---

## 9. 注册和集成步骤

### 步骤 1：创建模板文件

在 `src/engine/templates/` 目录下创建新的 `.ts` 文件，例如 `waveText.ts`。

### 步骤 2：编写模板代码

按照规范编写完整的 `TemplateDefinition` 对象，确保：
- 正确的 import 路径（`./types` 和 `./templateUtils`）
- 完整的 schema 定义
- 参数保护、进度保护、自适应布局
- Canvas 状态管理（save/restore 配对）
- 确定性渲染

### 步骤 3：在 index.ts 中注册

编辑 `src/engine/templates/index.ts`，添加以下内容：

**1. 在文件顶部添加 import：**
```typescript
import { waveTextTemplate } from './waveText';
```

**2. 在 export 块中添加导出：**
```typescript
export {
  // ... 已有导出
  waveTextTemplate,
};
```

**3. 在注册区域添加注册调用：**
```typescript
// Text 文字效果模板
registerTemplate(waveTextTemplate);
```

### 步骤 4：在 TemplateRegistry 中注册（可选）

如果需要在 `TemplateRegistry` 中注册元数据，编辑 `src/modules/template/core/TemplateRegistry.ts`。

### 步骤 5：验证

- 启动开发服务器，检查控制台是否出现 `✅ Template registered: 波浪文字 (text_wave)` 日志
- 在编辑器中添加模板片段，验证渲染效果
- 修改参数，验证参数保护和自适应布局是否正常工作

---

## 10. 模板导入导出 API

### 10.1 validateTemplateCode

```typescript
import { validateTemplateCode } from './templateImporter';

const result = validateTemplateCode(codeString);
// result: { valid: boolean; error?: string }
```

验证规则：
- 必须包含 `export` 语句
- 必须包含 `render` 函数
- 必须包含 `id`、`name`、`description`、`category`、`schema` 属性
- 基础语法检查

### 10.2 importTemplateFromCode

```typescript
import { importTemplateFromCode } from './templateImporter';

const result = importTemplateFromCode(codeString, optionalTemplateId);
// result: TemplateImportResult { success: boolean; template?: TemplateDefinition; error?: string }
```

功能：
- 验证代码
- 在沙箱环境中执行代码
- 验证模板结构（id、name、description、category、schema、render）
- 验证每个参数定义（key、label、type、default）
- 自动补充 `initParams`（如果缺失）
- 自动补充 `validateParams`（如果缺失）
- 包装 render 函数添加自适应布局和错误处理

### 10.3 registerTemplateFromCode

```typescript
import { registerTemplateFromCode } from './templateImporter';

const result = registerTemplateFromCode(codeString);
// result: TemplateImportResult { success: boolean; template?: TemplateDefinition; error?: string }
```

功能：调用 `importTemplateFromCode` 后自动注册到模板表。

### 10.4 exportTemplateToCode

```typescript
import { exportTemplateToCode } from './templateImporter';

const codeString = exportTemplateToCode(templateDefinition);
// 返回完整的 TypeScript 代码字符串
```

功能：将 `TemplateDefinition` 对象导出为可执行的 TypeScript 代码字符串。

### 10.5 getTemplateCodeTemplate

```typescript
import { getTemplateCodeTemplate } from './templateImporter';

const codeTemplate = getTemplateCodeTemplate();
// 返回空模板的 TypeScript 代码字符串
```

功能：获取一个基础模板代码骨架，包含所有必要的结构和注释。

### 10.6 模板注册表 API（src/engine/templates/index.ts）

```typescript
registerTemplate(template: TemplateDefinition): void   // 注册模板
getTemplate(id: string): TemplateDefinition | undefined  // 获取单个模板
getAllTemplates(): TemplateDefinition[]                   // 获取所有模板
getTemplatesByCategory(category: TemplateCategory): TemplateDefinition[]  // 按分类获取
getTemplateCategories(): { key: TemplateCategory; name: string }[]       // 获取分类列表
hasTemplate(id: string): boolean                          // 检查模板是否存在
getTemplateDefaultParams(templateId: string): Record<string, any>        // 获取默认参数
```

### 10.7 模板引擎 API（src/modules/template/core/TemplateEngine.ts）

```typescript
templateEngine.registerTemplate(template: AnyTemplate): void
templateEngine.unregisterTemplate(templateId: string): void
templateEngine.getTemplate(templateId: string): AnyTemplate | undefined
templateEngine.getAllTemplates(): AnyTemplate[]
templateEngine.getTemplatesByCategory(category: TemplateCategory): AnyTemplate[]
templateEngine.detectTemplateType(template: AnyTemplate): 'canvas' | 'react'
templateEngine.createTemplateWrapper(canvasTemplate: CanvasTemplate): ReactTemplate
templateEngine.renderTemplate(templateId: string, context: TemplateRenderContextExtended): RenderResult
templateEngine.getDefaultParams(templateId: string): Record<string, any>
```

### 10.8 模板注册表 API（src/modules/template/core/TemplateRegistry.ts）

```typescript
templateRegistry.register(definition: TemplateDefinition): void
templateRegistry.unregister(id: string): void
templateRegistry.get(id: string): TemplateDefinition | undefined
templateRegistry.getByCategory(category: TemplateCategory): TemplateDefinition[]
templateRegistry.getAll(): TemplateDefinition[]
templateRegistry.has(id: string): boolean
templateRegistry.search(query: string): TemplateDefinition[]
templateRegistry.clear(): void
templateRegistry.getCategories(): TemplateCategory[]
templateRegistry.getDefaultParams(templateId: string): Record<string, any>
templateRegistry.getCount(): number
templateRegistry.getCountByCategory(category: TemplateCategory): number
```

---

## 11. AI 导演模式集成说明

AI 导演通过 `use_template` 工具使用模板，参数包括：

```typescript
{
  templateQuery: string;       // 模板ID或名称关键词
  trackId: string;             // 目标轨道ID
  startTime: number;           // 开始时间（秒）
  duration: number;            // 持续时长（秒）
  templateParams?: Record<string, any>;  // 模板自定义参数
  presetId?: string;           // 额外应用的入场动画预设ID
}
```

### Store API

```typescript
store.addTemplateClip(templateId, trackId, time)  // 添加模板片段到轨道
store.addAssets(assets)                            // 添加素材
store.removeAsset(id)                              // 移除素材
store.addClip(asset, trackId, time, type)          // 添加片段
store.updateClip(id, changes)                      // 更新片段
store.removeClip(id)                               // 移除片段
store.addTrack(type)                               // 添加轨道
store.addEffectToClip(clipId, presetId)            // 为片段添加效果
```

### AI 导演使用模板的典型流程

1. 根据用户需求选择合适的模板（通过 `templateQuery` 匹配模板 ID 或名称）
2. 确定目标轨道和时间位置
3. 设置模板参数（`templateParams`），参数键名与模板 `schema` 中的 `key` 对应
4. 可选地应用入场动画预设（`presetId`）
5. 调用 `store.addTemplateClip()` 将模板片段添加到时间线

---

## 12. 常见错误和调试指南

### 12.1 模板注册失败

**错误**：`Invalid template format: must have id, name, and render function`

**原因**：
- 缺少 `id`、`name` 或 `render` 字段
- `render` 不是函数

**解决**：检查模板对象是否完整定义了所有必需字段。

### 12.2 渲染结果偏移

**错误**：内容绘制在错误的位置

**原因**：忘记坐标原点已移至画布中心

**解决**：所有坐标相对于 `(0, 0)` 绘制。清除画布使用 `ctx.fillRect(-width/2, -height/2, width, height)`。

### 12.3 Canvas 状态泄漏

**错误**：后续绘制操作受到之前状态影响（透明度、变换等）

**原因**：`ctx.save()` 和 `ctx.restore()` 不配对

**解决**：确保每个 `save()` 都有对应的 `restore()`。推荐使用缩进对齐方式检查。

### 12.4 参数为 undefined

**错误**：`Cannot read property 'xxx' of undefined` 或渲染异常

**原因**：直接使用 `params.xxx` 而未通过 `paramGuard` 保护

**解决**：所有参数必须通过 `paramGuard` 获取。

### 12.5 动画不连贯

**错误**：动画在 progress=0 或 progress=1 时出现跳变

**原因**：未对 `progress` 进行边界保护

**解决**：始终使用 `const p = paramGuard.number(progress, 0, 0, 1);`

### 12.6 每帧渲染结果不同

**错误**：相同时间点渲染结果不一致

**原因**：使用了 `Math.random()` 等非确定性函数

**解决**：使用基于种子的伪随机或 `easing.perlinNoise1D`。

### 12.7 字体大小不适配

**错误**：文字溢出或过小

**原因**：硬编码字体大小

**解决**：使用 `adaptiveLayout.calculateFontSize()` 自动计算。

### 12.8 模板导入失败

**错误**：`模板代码必须包含 export 语句` 或 `模板缺少必要属性`

**原因**：代码格式不符合导入器要求

**解决**：确保代码包含 `export` 语句、`render` 函数，以及 `id`、`name`、`description`、`category`、`schema` 属性。

### 12.9 noiseTexture 性能问题

**错误**：渲染帧率严重下降

**原因**：`drawUtils.noiseTexture` 使用 `getImageData/putImageData`，开销大

**解决**：仅在必要时使用，且 `opacity` 参数尽量小（0.01-0.03），避免在每帧大面积调用。

### 12.10 颜色格式错误

**错误**：`addColorStop` 颜色格式不正确

**原因**：传入了非标准颜色格式

**解决**：使用 `colorUtils.toRgba()` 或 `colorUtils.withAlpha()` 生成标准 rgba 格式字符串。

---

## 13. 性能优化建议

### 13.1 减少 Canvas 状态切换

每次 `save()/restore()` 和状态切换都有开销。将相同状态的绘制操作合并：

```typescript
// ✅ 好 - 合并相同状态的绘制
ctx.save();
ctx.globalAlpha = 0.5;
ctx.fillStyle = '#ff0000';
// 绘制所有红色半透明元素
ctx.restore();

// ❌ 差 - 频繁切换状态
ctx.save(); ctx.globalAlpha = 0.5; ctx.fillStyle = '#ff0000'; ctx.fillRect(...); ctx.restore();
ctx.save(); ctx.globalAlpha = 0.5; ctx.fillStyle = '#ff0000'; ctx.fillRect(...); ctx.restore();
```

### 13.2 控制粒子数量

粒子系统是性能瓶颈。建议：
- 粒子总数不超过 200 个
- 使用 `drawUtils.particle` 的 `softness` 参数控制渐变范围
- 远距离粒子不绘制连线

### 13.3 避免频繁使用 noiseTexture

`noiseTexture` 使用像素级操作，开销极大。建议：
- 仅在最终合成时调用一次
- `opacity` 使用极小值（0.01-0.03）
- 可用简化的扫描线效果替代

### 13.4 使用 perlinNoise1D 替代 Math.random

`perlinNoise1D` 既是确定性的，又能产生平滑的随机效果，比 `Math.random()` 更适合动画。

### 13.5 优化循环绘制

避免在每帧中进行大量循环计算。对于确定性元素，可以预计算位置：

```typescript
// 在 render 函数外部定义辅助函数
function getParticles(time: number, width: number, height: number, count: number, palette: string[]): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const seed = i * 3571;
    // 基于种子计算位置
  }
  return particles;
}
```

### 13.6 合理使用 vignette

`vignette` 是轻量级操作，适合作为最终合成效果。但不要在同一帧中多次调用。

### 13.7 渐变缓存

如果渐变颜色不变，可以缓存 `CanvasGradient` 对象。但由于模板的 `render` 函数是纯函数，实际缓存较难实现。建议尽量减少渐变创建次数。

### 13.8 避免过度使用 shadowBlur

`ctx.shadowBlur` 是昂贵的操作。优先使用 `drawUtils.glow()` 和 `drawUtils.radialGlow()` 替代直接设置 shadowBlur。

---

## 14. 视觉效果设计哲学

### 14.1 什么是"让人眼前一亮"的效果？

让人眼前一亮的效果，不是单纯的"花哨"，而是**信息密度与感知效率的平衡**。核心要素拆解：

| 要素 | 含义 | 权重 |
|------|------|------|
| **层次感** | 画面有明确的前景、中景、背景分离，不是扁平的一层 | 30% |
| **动态感** | 即使是静态画面，也有微妙的呼吸、闪烁、流动 | 25% |
| **光影真实** | 光源方向一致，高光/阴影/反射符合物理直觉 | 20% |
| **色彩和谐** | 配色有主题，不是随机堆砌，有明确的情绪基调 | 15% |
| **细节丰富** | 噪点、扫描线、微粒子等"质感层"让画面不"干净得假" | 10% |

**关键洞察**：最让人印象深刻的视觉效果，往往不是"信息量最大"的，而是**每个层次都恰到好处**的。层次感是第一优先级——一个有3层深度、每层只做1件事的效果，远胜于1层做了5件事的扁平效果。

### 14.2 视觉层次理论：四层架构

所有高质量视觉效果都可以拆解为四层，**从后往前**依次绘制：

```
┌─────────────────────────────────────────────┐
│  第四层：后处理层（Post-Processing）          │
│  vignette → noiseTexture → 色彩分级          │
├─────────────────────────────────────────────┤
│  第三层：装饰层（Decoration）                 │
│  粒子、光束、扫描线、符文、余烬               │
├─────────────────────────────────────────────┤
│  第二层：主体层（Subject）                    │
│  火焰体、卡片、文字、魔法阵、能量环           │
├─────────────────────────────────────────────┤
│  第一层：背景层（Background）                 │
│  meshGradient/premiumGradient + vignette      │
└─────────────────────────────────────────────┘
```

**每层的职责**：

- **背景层**：建立氛围和色调，绝不能是纯色。使用 `meshGradient` 或 `premiumGradient` 创建有深度的暗色基底，紧接着用 `vignette` 建立中心聚焦。
- **主体层**：画面的视觉焦点，承载核心信息。使用渐变、发光、材质叠加让它"站出来"。
- **装饰层**：让画面"活"起来。粒子、光束、扫描线等动态元素，让静止画面也有生命力。
- **后处理层**：统一画面质感。`vignette` 收拢视觉焦点，`noiseTexture` 添加胶片质感消除"数字感"。

**实际代码中的四层结构**（以火焰效果为例）：

```typescript
render: (context: TemplateRenderContext) => {
  const { ctx, width, height, time, params } = context;

  // ===== 第一层：背景层 =====
  const bgGrad = drawUtils.premiumGradient(ctx, -width/2, -height/2, width, height,
    ['#0a0505', '#1a0a0a', '#0a0505'], 180);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(-width/2, -height/2, width, height);
  drawUtils.radialGlow(ctx, 0, height*0.3, width*0.4, baseColor, 0.1*intensity);

  // ===== 第二层：主体层 =====
  // 火焰体（贝塞尔曲线轮廓 + 多层渐变）
  for (let f = 0; f < flameCount; f++) { /* ... */ }
  // 核心白热区
  const coreGrad = ctx.createRadialGradient(/* ... */);

  // ===== 第三层：装饰层 =====
  // 余烬粒子
  for (let i = 0; i < emberCount; i++) { /* ... */ }

  // ===== 第四层：后处理层 =====
  drawUtils.vignette(ctx, width, height, 0.4);
  drawUtils.noiseTexture(ctx, -width/2, -height/2, width, height, 0.015, time);
}
```

### 14.3 动态 vs 静态：为什么微动画比完全静止更有质感

**核心原理**：人眼对运动极度敏感。一个完全静止的画面，大脑会在 200ms 内将其归类为"非活物"而降低注意力。而一个有微妙呼吸、闪烁、漂浮的画面，大脑会持续关注，因为"它还活着"。

**微动画的三种类型**：

1. **呼吸微动**：`dampedOscillation` 产生的低频微振，让物体看起来在"呼吸"
   ```typescript
   const breathe = easing.dampedOscillation(time * 2, 1.5, 0.1) * 0.015;
   ctx.scale(1 + breathe, 1 + breathe);
   ```

2. **闪烁脉冲**：`sin` 函数驱动的亮度波动，让发光体看起来在"脉动"
   ```typescript
   const blinkValue = (Math.sin(time * blinkSpeed) + 1) / 2;
   const currentGlow = glowIntensity * (0.5 + blinkValue * 0.5);
   ```

3. **自然漂移**：`perlinNoise1D` 驱动的位置微偏移，让物体看起来在"漂浮"
   ```typescript
   const microBounce = easing.perlinNoise1D(time * 1.5, 1, 0) * 0.02;
   ```

**关键参数范围**：微动画的幅度必须极小（0.01-0.03 的缩放变化，1-3px 的位置偏移），否则会从"有质感"变成"在抖动"。

### 14.4 色彩心理学与配色策略

**14种配色的情绪定位**：

| 配色 | 情绪 | 适用场景 | 关键特征 |
|------|------|----------|----------|
| `aurora` | 神秘、自然 | 极光、自然现象 | 绿→蓝→紫的极光色谱 |
| `cyberpunk` | 叛逆、未来 | 赛博朋克UI | 红→橙→黄→绿→蓝→紫的全谱 |
| `sunset` | 温暖、怀旧 | 日落、温暖场景 | 暖橙→米白→深蓝的冷暖对比 |
| `ocean` | 深邃、宁静 | 海洋、深度 | 极深蓝→浅蓝的单一色相渐变 |
| `neon` | 活力、刺激 | 霓虹灯、派对 | 品红→紫→蓝→青→绿的高饱和 |
| `fire` | 热烈、危险 | 火焰、爆炸 | 黑→红→橙→黄→白的温度谱 |
| `galaxy` | 宇宙、神秘 | 银河、星空 | 极深蓝→紫→品红的深空色 |
| `glass` | 通透、精致 | 毛玻璃UI | 白→浅蓝的极低饱和 |
| `premium` | 高端、奢华 | 高端卡片、按钮 | 黑→深蓝→米白→白的金属感 |
| `matrix` | 科技、黑客 | 代码雨、终端 | 纯黑→纯绿的单色 |
| `dream` | 梦幻、浪漫 | 梦境、渐变 | 紫→粉→蓝的柔和过渡 |
| `ember` | 温暖、余烬 | 余烬、暖光 | 黑→深棕→橙→黄的暖色 |
| `frost` | 清冷、冰霜 | 冰雪、冷调 | 浅蓝→深蓝的冷色 |
| `royal` | 皇家、尊贵 | 高端UI、徽章 | 极深蓝→紫→淡紫的皇家色 |

**配色策略原则**：

1. **一个主色，一个辅助色**：不要使用超过2种主色调。用 `lerpColor` 在两色之间生成过渡色。
   ```typescript
   const ringColor = colorUtils.lerpColor(color1, color2, ring / ringCount);
   ```

2. **暗底亮主**：背景用配色的前2-3个暗色，主体用后2-3个亮色。
   ```typescript
   // 背景：premium的前3个暗色
   drawUtils.premiumGradient(ctx, x, y, w, h, ['#0a0a15', '#0f0f25', '#0a0a1a'], 135);
   // 主体：premium的后3个亮色
   const blobColor = palette[i % palette.length]; // 会取到 #e8d5b7, #f5e6cc, #ffffff
   ```

3. **用 `adjustBrightness` 制造明暗变化**：同一颜色的亮度变化比换色更有层次感。
   ```typescript
   const cardGrad = drawUtils.premiumGradient(ctx, x, y, w, h, [
     colorUtils.adjustBrightness(cardColor, 30),   // 亮面
     cardColor,                                     // 本色
     colorUtils.adjustBrightness(cardColor, -25),   // 暗面
     colorUtils.lerpColor(cardColor, accentColor, 0.08) // 环境色影响
   ], 135);
   ```

4. **透明度是第三维度**：同一颜色不同透明度可以制造深度。远处的东西更透明，近处更不透明。
   ```typescript
   drawUtils.particle(ctx, ex, ey, emberSize * 3, emberColor, emberAlpha * 0.3, 0.3); // 光晕层（远）
   drawUtils.particle(ctx, ex, ey, emberSize, emberColor, emberAlpha, 0.7);           // 核心层（近）
   ```

---

## 15. 物理真实感核心原理

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

**参数调优实战**：

```typescript
// 轻盈弹跳（UI元素入场）—— 振荡明显但不夸张
easing.spring(t, 120, 10, 1)    // ζ ≈ 0.14，明显弹跳

// 快速吸附（按钮出现）—— 快速到位，微弹
easing.snapSpring(t, 350, 30)    // tension高→快，friction适中→微弹

// 柔和展开（魔法阵出现）—— 有仪式感的展开
easing.spring(t, 100, 14, 1)    // ζ ≈ 0.22，优雅弹跳

// 重物落地（沉重感）—— 低刚度高阻尼
easing.spring(t, 60, 20, 2)     // ζ ≈ 0.58，几乎无弹跳，缓慢到位

// 极度弹性（弹簧玩具）—— 高刚度低阻尼
easing.spring(t, 300, 5, 1)     // ζ ≈ 0.045，疯狂振荡
```

**`snapSpring(t, tension=300, friction=28)`** —— 简化的弹簧模型：

- `tension` 等价于 `stiffness`，控制速度
- `friction` 等价于 `damping`，控制振荡次数
- 内部自动计算阻尼比，更适合UI场景

```typescript
// 按钮快速吸附
easing.snapSpring(enterProgress, 350, 30)

// 涟漪扩散
easing.snapSpring(rippleProgress, 400, 32)

// 卡片入场
easing.snapSpring(enterProgress, 300, 28)
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
easing.gravityBounce(t, 0.75, 9.8)

// 钢球弹跳 —— 高弹性
easing.gravityBounce(t, 0.9, 9.8)

// 黏土落地 —— 几乎不弹
easing.gravityBounce(t, 0.2, 9.8)

// 月球弹跳 —— 低重力
easing.gravityBounce(t, 0.7, 1.6)

// 超重弹跳 —— 高重力快速落地
easing.gravityBounce(t, 0.5, 20)
```

**`springBounce(t, bounces=4, decay=3.5)`**

数学近似的弹跳，不是物理模拟，但更容易控制：

- `bounces`：弹跳次数
- `decay`：衰减速度，值越大弹跳衰减越快

```typescript
// 标准弹跳
easing.springBounce(t, 4, 3.5)

// 快速衰减（只弹2-3次）
easing.springBounce(t, 3, 5)

// 持续弹跳（弹很多次）
easing.springBounce(t, 8, 2)
```

### 15.3 阻尼振荡：dampedOscillation

**`dampedOscillation(t, frequency=3, dampingRatio=0.3)`**

这是制造"稳定微振"的核心工具。返回值在正负之间振荡并逐渐衰减到0。

```typescript
// 返回值 = exp(-dampingRatio * t * 6) * sin(t * frequency * PI * 2)
```

| 参数 | 增大效果 | 减小效果 |
|------|----------|----------|
| `frequency` | 振荡更快（更"紧张"） | 振荡更慢（更"慵懒"） |
| `dampingRatio` | 更快停止（更"僵硬"） | 持续更久（更"柔软"） |

**实战用法**：

```typescript
// 卡片3D倾斜的自然晃动
const tiltOscX = easing.dampedOscillation(time * floatSpeed * 0.3, 1.2, 0.08);
const tiltX = tiltOscX * tiltAmount;

// 按钮呼吸微动
const breathe = easing.dampedOscillation(time * 2, 1.5, 0.1) * 0.015;
ctx.scale(1 + breathe, 1 + breathe);

// 装饰点脉动
const dotOsc = easing.dampedOscillation(time * 2 + i * 0.8, 1.5, 0.12);
const dotSize = baseSize * (0.8 + Math.abs(dotOsc) * 0.6);
```

**关键技巧**：`dampedOscillation` 的第一个参数 `t` 是持续递增的（如 `time * speed`），这意味着振荡会不断重新激发。`dampingRatio` 控制的是每次振荡的衰减速度，但由于 `t` 持续增长，效果是"持续微振"而非"振一次就停"。

### 15.4 惯性运动：momentumEase / inertiaDecay

**`momentumEase(t, mass=1, friction=0.3)`**

模拟有初速度的物体在摩擦力下减速停止：

- `mass`：质量越大，惯性越大，减速越慢
- `friction`：摩擦力越大，减速越快

```typescript
// 轻物体快速减速
easing.momentumEase(t, 0.5, 0.5)

// 重物体缓慢减速
easing.momentumEase(t, 3, 0.1)

// 标准惯性
easing.momentumEase(t, 1, 0.3)

// 扫描高光的驱动
const shineSweep = easing.momentumEase((time * blinkSpeed * 0.15) % 1, 2, 0.5);
```

**`inertiaDecay(t, initialVelocity=3, drag=2)`**

更直接的惯性衰减模型：

- `initialVelocity`：初始速度
- `drag`：阻力系数

```typescript
// 快速启动慢速停止
easing.inertiaDecay(t, 5, 1)

// 均匀减速
easing.inertiaDecay(t, 3, 2)

// 极快减速
easing.inertiaDecay(t, 3, 5)
```

### 15.5 鞭打与过冲：whipEffect / easeOutBack / easeOutElastic

**`whipEffect(t, whipStrength=0.4)`**

模拟鞭打效果——极快的启动 + 过冲 + 回弹：

```typescript
// 标准鞭打
easing.whipEffect(t, 0.4)

// 强烈甩动
easing.whipEffect(t, 0.8)

// 微妙甩动
easing.whipEffect(t, 0.2)
```

**`easeOutBack(t)`** —— 标准过冲缓动：

固定过冲量（约10%），适合UI元素出场：

```typescript
// 按钮出场
const scale = easing.easeOutBack(progress);
```

**`easeOutElastic(t)`** —— 弹性过冲：

有多次振荡的弹性效果：

```typescript
// 弹性出场
const scale = easing.easeOutElastic(progress);
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

```typescript
// 返回值范围 [0, 1]，输入 t 越大变化越快
const noise = easing.perlinNoise1D(time * 1.5, 1, 0);
```

| 参数 | 增大效果 | 减小效果 |
|------|----------|----------|
| `frequency` | 变化更快（更"紧张"） | 变化更慢（更"平滑"） |
| `seed` | 不同的随机序列 | 相同的随机序列 |

**实战用法**：

```typescript
// 文字微弹跳 —— 自然的微小位移
const microBounce = easing.perlinNoise1D(time * 1.5, 1, 0) * 0.02;

// 火花距离变化 —— 每个火花用不同seed
const sparkDist = baseDist + easing.perlinNoise1D(time * 2 + i * 3.7, 1, i * 5) * variation;

// 火花透明度变化 —— 闪烁效果
const sparkAlpha = baseAlpha * easing.perlinNoise1D(time * 3 + i * 1.3, 1, i * 7);

// 多个元素的不同相位 —— 用不同的seed
for (let i = 0; i < count; i++) {
  const noise = easing.perlinNoise1D(time * speed, 1, i * 5.7);
}
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

## 16. 光影效果深度技术

### 16.1 多层发光：multiLayerGlow + radialGlow 组合

真实的光晕不是单一圆圈，而是**从中心到边缘的多层渐变衰减**。项目中的组合模式：

**标准双层发光**（适用于大多数发光体）：

```typescript
// 先用 radialGlow 铺设大范围柔光基底
drawUtils.radialGlow(ctx, cx, cy, radius, color, 0.06);
// 再用 multiLayerGlow 在中心叠加多层高亮
drawUtils.multiLayerGlow(ctx, cx, cy, color, radius * 0.4, 5);
```

**原理**：
- `radialGlow` 产生一个从中心到边缘的4级衰减（0.6→0.3→0.1→0），覆盖范围大
- `multiLayerGlow` 产生 `layers+1` 层同心圆，每层半径递增、透明度递减，中心最亮

**火焰基底光**（大范围暖光）：

```typescript
drawUtils.radialGlow(ctx, 0, height*0.3, width*0.4, baseColor, 0.1*intensity);
drawUtils.multiLayerGlow(ctx, 0, height*0.3, baseColor, width*0.15, 4);
```

**魔法阵中心光核**（小范围强光）：

```typescript
drawUtils.multiLayerGlow(ctx, 0, 0, color1, currentRadius * 0.4, 5);
drawUtils.radialGlow(ctx, 0, 0, currentRadius * 1.3, color1, 0.06);
```

**亮星十字光芒**（极小范围极亮）：

```typescript
drawUtils.multiLayerGlow(ctx, bx, by, '#ffffff', 15 + pulse * 10, 4);
drawUtils.particle(ctx, bx, by, 3 + pulse * 2, '#ffffff', 0.8, 0.9);
```

**`multiLayerGlow` 的 layers 参数选择**：

| layers | 效果 | 适用场景 |
|--------|------|----------|
| 3 | 柔和光晕 | 背景装饰、远距离光 |
| 4 | 标准发光 | 通用发光体 |
| 5 | 强烈发光 | 中心光核、按钮发光 |
| 6+ | 极亮光源 | 爆炸闪光、太阳 |

### 16.2 高光与反射：specularHighlight

**`specularHighlight(ctx, x, y, width, height, radius, opacity=0.15)`**

高光是材质感的关键。不同材质的高光特征：

**金属/铬合金**（强高光，小面积，高对比）：

```typescript
drawUtils.specularHighlight(ctx, x+4, y+4, width-8, height, radius*0.9, 0.25);
```

**玻璃**（柔和高光，大面积，低对比）：

```typescript
drawUtils.specularHighlight(ctx, x+2, y+2, width-4, height, radius, 0.12);
```

**塑料**（中等高光，中等面积）：

```typescript
drawUtils.specularHighlight(ctx, x+3, y+3, width-6, height, radius*0.8, 0.18);
```

**液态金属**（多个移动高光点）：

```typescript
for (let i = 0; i < 8; i++) {
  const specPhase = time * speed * 0.4 + i * 1.5;
  const specX = Math.cos(specPhase * 0.7) * width * 0.3;
  const specY = Math.sin(specPhase * 0.5) * height * 0.3;
  const specSize = 20 + Math.sin(specPhase) * 10;
  drawUtils.specularHighlight(ctx, specX - specSize, specY - specSize/2,
    specSize * 2, specSize, specSize * 0.3, 0.15 * intensity);
}
```

**丝绸**（移动的线性高光）：

```typescript
for (let i = 0; i < 6; i++) {
  const specPhase = time * speed * 0.5 + i * 1.2;
  const specX = Math.cos(specPhase * 0.4) * width * 0.35;
  const specY = Math.sin(specPhase * 0.3) * height * 0.3;
  drawUtils.specularHighlight(ctx, specX - specW/2, specY - specH/2,
    specW, specH, specH * 0.5, 0.2 * intensity);
}
```

### 16.3 扫描光效：shimmerLine + borderBeam 组合

扫描光效是让物体看起来"活"的关键技术。

**`shimmerLine`** —— 内部扫光：

```typescript
// 卡片内部扫光（循环）
const shimmerProgress = (time * 0.25) % 1;
ctx.save();
drawUtils.roundedRect(ctx, x, y, width, height, radius);
ctx.clip();  // 必须clip到物体范围内
drawUtils.shimmerLine(ctx, x, y, width, height, shimmerProgress, accentColor, 0.12);
ctx.restore();
```

**`borderBeam`** —— 边框扫光：

```typescript
// 按钮边框扫光（循环）
const beamProgress = (time * 0.35) % 1;
drawUtils.borderBeam(ctx, x, y, width, height, radius, beamProgress,
  accentColor, colorUtils.lerpColor(accentColor, '#ff00e5', 0.5), 60);
```

**组合使用**（弹性按钮的完整光效）：

```typescript
// 1. 内部扫光
const shimmerProgress = (time * 0.3) % 1;
ctx.save();
drawUtils.roundedRect(ctx, x, y, width, height, radius);
ctx.clip();
drawUtils.shimmerLine(ctx, x, y, width, height, shimmerProgress, accentColor, 0.15);
ctx.restore();

// 2. 边框扫光
const beamProgress = (time * 0.35) % 1;
drawUtils.borderBeam(ctx, x, y, width, height, radius, beamProgress,
  accentColor, colorUtils.lerpColor(accentColor, '#ff00e5', 0.5), 60);
```

**扫光速度参数选择**：

| 速度 (time * N % 1) | 感觉 | 适用场景 |
|---------------------|------|----------|
| 0.1-0.15 | 缓慢优雅 | 高端卡片、奢侈品 |
| 0.2-0.3 | 标准节奏 | 通用UI |
| 0.35-0.5 | 活跃 | 按钮、交互元素 |
| 0.5+ | 急促 | 警告、能量充能 |

### 16.4 阴影：动态阴影实现

真实阴影不是固定的——它随物体的位置和倾斜而变化。

**3D卡片的动态阴影**（阴影跟随倾斜）：

```typescript
// 阴影偏移随倾斜方向变化
const shadowOffsetX = -tiltX * 0.5;
const shadowOffsetY = 20 + Math.abs(floatY) * 0.5;
// 阴影模糊随倾斜强度变化
const shadowBlur = 40 + Math.abs(tiltX);

ctx.save();
ctx.translate(shadowOffsetX, shadowOffsetY);
ctx.fillStyle = colorUtils.toRgba('#000000', 0.5);
ctx.filter = `blur(${shadowBlur}px)`;
drawUtils.roundedRect(ctx, -cardWidth/2, -cardHeight/2, cardWidth, cardHeight, cornerRadius);
ctx.fill();
ctx.restore();
```

**弹性按钮的脉冲阴影**（阴影跟随缩放）：

```typescript
ctx.save();
ctx.shadowColor = colorUtils.toRgba(accentColor, 0.3);
ctx.shadowBlur = glowIntensity * (1 + breathe * 5);
ctx.shadowOffsetX = 0;
ctx.shadowOffsetY = 5 + breathe * 10;
```

**悬浮阴影**（物体越高阴影越远越淡）：

```typescript
const hoverHeight = Math.abs(floatY);
const shadowScale = 1 + hoverHeight * 0.01;
const shadowAlpha = 0.5 - hoverHeight * 0.01;
const shadowBlur = 20 + hoverHeight * 2;
```

### 16.5 体积光：lightBeam

**`lightBeam(ctx, x1, y1, x2, y2, color, width=2, opacity=0.6, glowSize=20)`**

模拟光束穿透效果。内部实现是双层绘制：细线+大glow，粗线+小glow。

```typescript
// 极光光束
drawUtils.lightBeam(ctx, -width/2, -height/4, width/2, -height/4,
  '#00ff87', 3, 0.4, 30);

// 多条交叉光束
for (let i = 0; i < 5; i++) {
  const angle = (i / 5) * Math.PI * 2 + time * 0.2;
  const len = width * 0.4;
  drawUtils.lightBeam(ctx, 0, 0,
    Math.cos(angle) * len, Math.sin(angle) * len,
    color, 2, 0.3 + Math.sin(time + i) * 0.1, 25);
}
```

### 16.6 环境光遮蔽：vignette

**`vignette(ctx, width, height, intensity=0.4, offsetX=0, offsetY=0)`**

暗角效果是画面聚焦的核心工具。它通过径向渐变让画面边缘变暗，将视线引向中心。

**intensity 参数选择**：

| intensity | 效果 | 适用场景 |
|-----------|------|----------|
| 0.2-0.3 | 微妙暗角 | 明亮场景、清新风格 |
| 0.35-0.45 | 标准暗角 | 通用 |
| 0.5-0.6 | 强烈暗角 | 暗色场景、戏剧性 |
| 0.7+ | 极端暗角 | 聚光灯效果、恐怖氛围 |

**实战用法**：

```typescript
// 标准用法（几乎所有效果都需要）
drawUtils.vignette(ctx, width, height, 0.4);

// 偏移暗角（光源不在中心时）
drawUtils.vignette(ctx, width, height, 0.5, lightOffsetX, lightOffsetY);
```

---

## 17. 材质模拟技术

### 17.1 玻璃/毛玻璃

**核心技术组合**：`glassBackground` + `specularHighlight` + 低透明度叠加

```typescript
// 完整的毛玻璃卡片
// 1. 卡片主体渐变
const cardGrad = drawUtils.premiumGradient(ctx, x, y, w, h,
  [colorUtils.adjustBrightness(cardColor, 30), cardColor,
   colorUtils.adjustBrightness(cardColor, -25)], 135);
drawUtils.roundedRect(ctx, x, y, w, h, radius);
ctx.fillStyle = cardGrad;
ctx.fill();

// 2. 毛玻璃层
drawUtils.glassBackground(ctx, x, y, w, h, radius, 0.06,
  colorUtils.toRgba(accentColor, 0.1));

// 3. 顶部高光
drawUtils.specularHighlight(ctx, x+4, y+4, w-8, h, radius*0.9, 0.25);

// 4. 扫光
const shimmerProgress = (time * 0.25) % 1;
ctx.save();
drawUtils.roundedRect(ctx, x, y, w, h, radius);
ctx.clip();
drawUtils.shimmerLine(ctx, x, y, w, h, shimmerProgress, accentColor, 0.12);
ctx.restore();
```

**关键参数**：
- `glassBackground` 的 `opacity`：0.05-0.10 极微妙，0.10-0.20 标准，0.20+ 明显
- `specularHighlight` 的 `opacity`：0.10-0.15 柔和，0.20-0.30 明显

### 17.2 金属/铬合金

**核心技术组合**：5色chrome渐变 + 强高光 + 多层发光

```typescript
// 金属质感渐变（灰→主色→白→主色→灰，180度角）
const chromeGradColors = [
  colorUtils.lerpColor('#888888', color, 0.3),  // 暗灰偏主色
  color,                                          // 纯主色
  colorUtils.lerpColor(color, '#ffffff', 0.4),   // 亮白偏主色
  color,                                          // 纯主色
  colorUtils.lerpColor('#888888', color, 0.3),   // 暗灰偏主色
];

// 绘制金属文字
ctx.font = `bold ${fontSize}px Arial, sans-serif`;
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
drawUtils.gradientText(ctx, text, 0, 0, chromeGradColors, 180);

// 金属发光
ctx.shadowColor = glowColor;
ctx.shadowBlur = currentGlow * 0.6;
ctx.shadowOffsetY = fontSize * 0.06;  // 微下移模拟环境光

// 描边高光
ctx.strokeStyle = colorUtils.lerpColor(color, '#ffffff', 0.3);
ctx.lineWidth = 1;
ctx.globalAlpha = 0.2;
ctx.strokeText(text, 0, 0);
```

**5色chrome渐变原理**：模拟金属表面的反射带——暗面→本色→高光→本色→暗面，180度角让高光带水平穿过，产生金属反射条纹。

### 17.3 霓虹/荧光

**核心技术组合**：`neonText` + `multiLayerGlow` + `perlinNoise1D` 闪烁

```typescript
// 霓虹文字（neonText 内部已实现4层递减发光）
drawUtils.neonText(ctx, text, x, y, color, intensity);

// 霓虹闪烁（用 perlinNoise1D 驱动 intensity）
const flickerIntensity = 0.7 + easing.perlinNoise1D(time * 8, 2, 0) * 0.3;
drawUtils.neonText(ctx, text, x, y, color, flickerIntensity);

// 霓虹管发光（multiLayerGlow 作为基底）
drawUtils.multiLayerGlow(ctx, x, y, color, radius, 5);

// 霓虹脉冲（呼吸式亮度变化）
const pulse = (Math.sin(time * 3) + 1) / 2;
const neonIntensity = 0.5 + pulse * 0.5;
drawUtils.neonText(ctx, text, x, y, color, neonIntensity);
```

**`neonText` 内部实现解析**：
1. 第一层：`shadowBlur=20*intensity`，`alpha=0.8` —— 近距离柔光
2. 第二层：`shadowBlur=40*intensity`，`alpha=0.4` —— 中距离扩散
3. 第三层：`shadowBlur=60*intensity`，`alpha=0.2` —— 远距离光晕
4. 第四层：`shadowBlur=0`，`fillStyle='#ffffff'` —— 白色核心

### 17.4 液态/流体

**核心技术组合**：椭圆变形blob + 径向渐变 + 水平扫描线 + specularHighlight

```typescript
// 液态色团
for (let i = 0; i < blobCount; i++) {
  const phase = time * speed * 0.2 + i * Math.PI * 2 / blobCount;
  const bx = Math.cos(phase) * width * 0.25;
  const by = Math.sin(phase * 0.7 + i) * height * 0.25;
  const blobSize = width * 0.2 + Math.sin(phase * 0.5) * width * 0.05;

  // 双层发光
  drawUtils.radialGlow(ctx, bx, by, blobSize, blobColor, 0.4);
  drawUtils.multiLayerGlow(ctx, bx, by, blobColor, blobSize * 0.5, 4);

  // 椭圆变形的径向渐变blob
  const blobGrad = ctx.createRadialGradient(bx, by, 0, bx, by, blobSize);
  blobGrad.addColorStop(0, colorUtils.toRgba(blobColor, 0.5));
  blobGrad.addColorStop(0.3, colorUtils.toRgba(
    colorUtils.lerpColor(blobColor, '#ffffff', 0.3), 0.3));
  blobGrad.addColorStop(0.6, colorUtils.toRgba(blobColor, 0.15));
  blobGrad.addColorStop(1, colorUtils.toRgba(blobColor, 0));
  ctx.fillStyle = blobGrad;
  ctx.beginPath();
  ctx.ellipse(bx, by, blobSize, blobSize * 0.7, phase * 0.3, 0, Math.PI * 2);
  ctx.fill();
}

// 水平扫描线（极低透明度）
for (let y = -height/2; y < height/2; y += 3) {
  const waveOffset = Math.sin(y * 0.01 + time * speed * 0.5) * 2;
  const alpha = 0.02 + Math.abs(Math.sin(y * 0.005 + time * 0.3)) * 0.03;
  ctx.strokeStyle = colorUtils.toRgba('#ffffff', alpha * intensity);
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(-width/2, y + waveOffset);
  ctx.lineTo(width/2, y + waveOffset);
  ctx.stroke();
}

// 移动高光
for (let i = 0; i < 8; i++) {
  const specPhase = time * speed * 0.4 + i * 1.5;
  const specX = Math.cos(specPhase * 0.7) * width * 0.3;
  const specY = Math.sin(specPhase * 0.5) * height * 0.3;
  drawUtils.specularHighlight(ctx, specX - specSize, specY - specSize/2,
    specSize * 2, specSize, specSize * 0.3, 0.15 * intensity);
}
```

**关键参数**：
- 扫描线间距：2-4px（太密看不清，太疏不像液态）
- 扫描线透明度：0.02-0.05（极低！超过0.1就不像液态了）
- blob椭圆比：0.6-0.8（长轴:短轴）
- blob轨道速度：`time * 0.2`（极慢，产生"流动"感）

### 17.5 全息/投影

**核心技术组合**：扫描线 + 色彩偏移 + 噪点 + 半透明

```typescript
// 全息投影效果
ctx.save();
ctx.globalAlpha = 0.7 + Math.sin(time * 5) * 0.1;  // 闪烁

// 1. 主体内容（半透明）
ctx.globalAlpha = 0.6;
// ... 绘制主体内容 ...

// 2. 扫描线
for (let y = startY; y < endY; y += 2) {
  const scanAlpha = 0.03 + Math.sin(y * 0.1 + time * 3) * 0.02;
  ctx.fillStyle = colorUtils.toRgba('#00ffcc', scanAlpha);
  ctx.fillRect(startX, y, width, 1);
}

// 3. 色彩偏移（RGB分离）
ctx.globalCompositeOperation = 'screen';
ctx.globalAlpha = 0.1;
ctx.fillStyle = '#ff0000';
// ... 偏移绘制红色通道 ...
ctx.fillStyle = '#0000ff';
// ... 反向偏移绘制蓝色通道 ...

// 4. 噪点
drawUtils.noiseTexture(ctx, startX, startY, width, height, 0.04, time);

ctx.restore();
```

### 17.6 丝绸/织物

**核心技术组合**：贝塞尔曲线 + 正弦波动 + 渐变色 + specularHighlight

```typescript
// 丝绸褶皱
const foldCount = 12;
for (let i = 0; i < foldCount; i++) {
  const foldPhase = time * speed * 0.3 + i * 0.5;
  const foldX = -width/2 + (i / foldCount) * width;
  const foldWidth = width / foldCount;
  const isHighlight = i % 2 === 0;

  ctx.beginPath();
  // 左边缘（正弦波动）
  for (let y = -height/2; y <= height/2; y += 5) {
    const waveX = foldX + Math.sin(y * 0.01 + foldPhase) * foldWidth * 0.3;
    if (y === -height/2) ctx.moveTo(waveX, y);
    else ctx.lineTo(waveX, y);
  }
  // 右边缘（正弦波动，相位偏移）
  for (let y = height/2; y >= -height/2; y -= 5) {
    const waveX = foldX + foldWidth +
      Math.sin(y * 0.01 + foldPhase + 0.5) * foldWidth * 0.3;
    ctx.lineTo(waveX, y);
  }
  ctx.closePath();

  // 褶皱渐变（亮面/暗面交替）
  const foldColor = palette[i % palette.length];
  const foldGrad = ctx.createLinearGradient(foldX, 0, foldX + foldWidth, 0);
  if (isHighlight) {
    foldGrad.addColorStop(0, colorUtils.toRgba(
      colorUtils.lerpColor(foldColor, '#ffffff', 0.1), 0.3));
    foldGrad.addColorStop(0.3, colorUtils.toRgba(
      colorUtils.lerpColor(foldColor, '#ffffff', 0.3), 0.5));
    foldGrad.addColorStop(0.5, colorUtils.toRgba(foldColor, 0.4));
    foldGrad.addColorStop(0.7, colorUtils.toRgba(
      colorUtils.adjustBrightness(foldColor, -20), 0.3));
    foldGrad.addColorStop(1, colorUtils.toRgba(
      colorUtils.adjustBrightness(foldColor, -30), 0.2));
  } else {
    foldGrad.addColorStop(0, colorUtils.toRgba(
      colorUtils.adjustBrightness(foldColor, -20), 0.2));
    foldGrad.addColorStop(0.5, colorUtils.toRgba(foldColor, 0.35));
    foldGrad.addColorStop(1, colorUtils.toRgba(
      colorUtils.lerpColor(foldColor, '#ffffff', 0.1), 0.3));
  }
  ctx.fillStyle = foldGrad;
  ctx.fill();
}

// 丝绸高光
for (let i = 0; i < 6; i++) {
  const specPhase = time * speed * 0.5 + i * 1.2;
  drawUtils.specularHighlight(ctx, specX - specW/2, specY - specH/2,
    specW, specH, specH * 0.5, 0.2 * intensity);
}

// 全局扫光
const shimmerProgress = (time * speed * 0.2) % 1;
drawUtils.shimmerLine(ctx, -width/2, -height/2, width, height,
  shimmerProgress, palette[1], 0.08 * intensity);
```

**关键技巧**：
- 褶皱的亮暗交替（`i % 2 === 0`）模拟光线在褶皱凸面和凹面的不同反射
- 正弦波的相位偏移（`+0.5`）让左右边缘不完全对称，更自然
- 5个渐变色标（0, 0.3, 0.5, 0.7, 1）让褶皱有明确的亮面→暗面过渡

---

## 18. 粒子系统设计

### 18.1 确定性粒子生成

**核心原则**：粒子必须是确定性的——相同的 `time` 和 `seed` 产生相同的结果。绝不能使用 `Math.random()`。

**确定性种子生成模式**：

```typescript
for (let i = 0; i < particleCount; i++) {
  const seed = i * 3571;  // 质数乘法，确保种子分散

  // 位置：用种子生成确定性的"随机"位置
  const angle = ((seed * 7) % 10000) / 10000 * Math.PI * 2;
  const dist = ((seed * 11) % 10000) / 10000;

  // 速度：用种子的不同乘法生成不同维度
  const speed = (0.3 + ((seed * 13) % 100) / 100 * 0.7) * force;

  // 颜色：用取模循环
  const particleColor = i % 2 === 0 ? color1 : color2;
}
```

**种子乘数选择**：使用不同的质数（7, 11, 13, 17, 23...）作为乘数，确保不同维度（角度、距离、速度、大小）的"随机"序列不相关。

### 18.2 双层渲染

**核心模式**：每个粒子绘制两次——大半径低透明度（光晕）+ 小半径高透明度（核心）。

```typescript
// 光晕层：大半径、低透明度、低softness
drawUtils.particle(ctx, px, py, particleSize * 3, particleColor, particleAlpha * 0.3, 0.3);

// 核心层：小半径、高透明度、高softness
drawUtils.particle(ctx, px, py, particleSize, particleColor, particleAlpha, 0.7);
```

**`particle` 的 `softness` 参数**：
- `0.3`：硬边缘，大部分区域不透明——适合光晕层
- `0.5`：中等——通用
- `0.7-0.9`：柔边缘，大部分区域透明——适合核心层，产生"发光点"效果

**为什么双层？** 单层粒子要么太亮（看不出光晕），要么太暗（看不出核心）。双层叠加后，中心区域亮度叠加（核心+光晕），边缘只有光晕，产生真实的"发光体"效果。

### 18.3 生命周期

粒子的生命周期数学模型：

**余烬粒子**（上升 + 衰减 + 尺寸递减）：

```typescript
for (let i = 0; i < emberCount; i++) {
  const seed = i * 3121;
  const emberPhase = time * 1.5 + i * 0.3;

  // 位置：水平漂移 + 垂直上升
  const ex = baseX + Math.sin(emberPhase * 0.5) * 30;
  const riseProgress = ((emberPhase * 0.3 + ((seed * 11) % 100) / 100) % 1);
  const ey = baseY - riseProgress * height * 0.6;

  // 尺寸：随上升递减
  const emberSize = 1.5 + (1 - riseProgress) * 3;

  // 透明度：随上升衰减
  const emberAlpha = (1 - riseProgress) * 0.8 * intensity;

  // 双层渲染
  drawUtils.particle(ctx, ex, ey, emberSize * 3, emberColor, emberAlpha * 0.3, 0.3);
  drawUtils.particle(ctx, ex, ey, emberSize, emberColor, emberAlpha, 0.7);
}
```

**爆炸粒子**（径向扩散 + 重力 + 拖尾）：

```typescript
for (let i = 0; i < particleCount; i++) {
  const seed = i * 3571;
  const angle = ((seed * 7) % 10000) / 10000 * Math.PI * 2;
  const speed = (0.3 + ((seed * 13) % 100) / 100 * 0.7) * explosionForce;

  const dist = speed * explosionProgress * maxDist;
  const px = Math.cos(angle) * dist;
  const py = Math.sin(angle) * dist;

  // 重力影响（二次函数模拟抛物线）
  const gravity = particleP * particleP * 50;
  const finalPy = py + gravity;

  // 透明度衰减
  const particleAlpha = Math.max(0, 1 - particleP * 1.2);

  // 尺寸衰减
  const particleSize = baseSize * (1 - particleP * 0.5);

  // 拖尾
  if (particleP < 0.5) {
    const trailLen = 3;
    for (let t = 1; t <= trailLen; t++) {
      const trailP = Math.max(0, particleP - t * 0.03);
      const trailDist = speed * easing.easeOutCubic(trailP) * maxDist;
      const trailX = Math.cos(angle) * trailDist;
      const trailY = Math.sin(angle) * trailDist + trailP * trailP * 50;
      const trailAlpha = particleAlpha * (1 - t / trailLen) * 0.4;
      const trailSize = particleSize * (1 - t / trailLen * 0.5);
      drawUtils.particle(ctx, trailX, trailY, trailSize, particleColor, trailAlpha, 0.5);
    }
  }
}
```

### 18.4 深度排序

**银河星场的深度分层**：

```typescript
for (let i = 0; i < starDensity; i++) {
  const seed = i * 4919;

  // depth 决定一切：0.2=最远, 1.0=最近
  const depth = 0.2 + ((seed * 13) % 100) / 100 * 0.8;

  // 深度影响旋转速度（视差效果）
  const angle = baseAngle + rotation * depth;

  // 深度影响大小
  const starSize = (0.5 + depth * 2.5) * (0.7 + twinkle * 0.3);

  // 深度影响透明度
  const starAlpha = depth * (0.3 + twinkle * 0.5) * (1 - dist * 0.3);

  // 只有近处的大星星才有光晕
  if (depth > 0.7 && starSize > 2) {
    drawUtils.radialGlow(ctx, sx, sy, starSize * 4, starColor, starAlpha * 0.1);
  }
}
```

**深度参数影响总结**：

| depth 值 | 大小 | 透明度 | 旋转速度 | 光晕 | 视觉效果 |
|----------|------|--------|----------|------|----------|
| 0.2-0.4 | 小 | 低 | 慢 | 无 | 远景星尘 |
| 0.4-0.7 | 中 | 中 | 中 | 微弱 | 中景星星 |
| 0.7-1.0 | 大 | 高 | 快 | 明显 | 近景亮星 |

### 18.5 粒子连线

```typescript
// 粒子连线（距离阈值过滤 + 透明度随距离衰减）
const maxLineDist = 100;
for (let i = 0; i < particleCount; i++) {
  for (let j = i + 1; j < particleCount; j++) {
    const dx = particles[i].x - particles[j].x;
    const dy = particles[i].y - particles[j].y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < maxLineDist) {
      const lineAlpha = (1 - dist / maxLineDist) * 0.3;
      ctx.save();
      ctx.strokeStyle = colorUtils.toRgba(lineColor, lineAlpha);
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(particles[i].x, particles[i].y);
      ctx.lineTo(particles[j].x, particles[j].y);
      ctx.stroke();
      ctx.restore();
    }
  }
}
```

### 18.6 特殊粒子类型

**余烬**（上升 + 衰减）：

```typescript
// 关键特征：缓慢上升、尺寸递减、透明度衰减、水平漂移
const riseProgress = ((emberPhase * 0.3 + seedOffset) % 1);
const ey = baseY - riseProgress * height * 0.6;
const emberSize = 1.5 + (1 - riseProgress) * 3;
const emberAlpha = (1 - riseProgress) * 0.8;
```

**火花**（径向扩散 + 快速衰减）：

```typescript
// 关键特征：从中心向外扩散、极短生命周期、高亮度
const sparkAngle = (i / sparkCount) * Math.PI * 2 + time * 0.5;
const sparkDist = baseDist + easing.perlinNoise1D(time * 2 + i * 3.7, 1, i * 5) * variation;
const sparkX = Math.cos(sparkAngle) * sparkDist;
const sparkY = Math.sin(sparkAngle) * sparkDist;
const sparkAlpha = (0.3 + blinkValue * 0.4) * easing.perlinNoise1D(time * 3 + i * 1.3, 1, i * 7);
drawUtils.particle(ctx, sparkX, sparkY, 4 + blinkValue * 3, color, sparkAlpha, 0.6);
```

**星尘**（缓慢漂浮 + 闪烁）：

```typescript
// 关键特征：极慢运动、闪烁、不同颜色温度
const twinkle = Math.sin(time * 3 + i * 0.5) * 0.5 + 0.5;
const starSize = (0.5 + depth * 2.5) * (0.7 + twinkle * 0.3);
const starAlpha = depth * (0.3 + twinkle * 0.5);
const starColors = ['#ffffff', '#ffe4c4', '#c4d4ff', '#ffd4e4', '#d4ffe4'];
```

---

## 19. 后处理效果链

### 19.1 标准后处理链

**几乎所有高质量效果都遵循的后处理顺序**：

```typescript
// 1. vignette —— 收拢视觉焦点
drawUtils.vignette(ctx, width, height, 0.4);

// 2. noiseTexture —— 添加胶片质感
drawUtils.noiseTexture(ctx, -width/2, -height/2, width, height, 0.015, time);
```

**为什么是这个顺序？**
- `vignette` 先做，因为它影响的是整体画面亮度分布
- `noiseTexture` 后做，因为它需要读取当前像素值并叠加噪点，如果先做噪点再暗角，噪点会被暗角压暗导致不均匀

### 19.2 暗角效果详解

**intensity 参数如何影响画面聚焦感**：

```typescript
// 微妙聚焦（0.2-0.3）—— 适合明亮场景
drawUtils.vignette(ctx, width, height, 0.25);

// 标准聚焦（0.35-0.45）—— 通用
drawUtils.vignette(ctx, width, height, 0.4);

// 强烈聚焦（0.5-0.6）—— 暗色场景、戏剧性
drawUtils.vignette(ctx, width, height, 0.55);

// 极端聚焦（0.7+）—— 聚光灯效果
drawUtils.vignette(ctx, width, height, 0.8);
```

**vignette 的内部实现**：从画面中心30%半径到70%半径的径向渐变，从透明到黑色。这意味着中心30%完全不受影响，70%以外最暗。

### 19.3 噪点纹理详解

**opacity 参数选择**：

| opacity | 视觉效果 | 适用场景 |
|---------|----------|----------|
| 0.005-0.01 | 几乎不可见，微妙质感 | 极精致UI |
| 0.01-0.02 | 微妙胶片感 | 通用效果 |
| 0.02-0.03 | 明显质感 | 火焰、液态 |
| 0.03-0.05 | 强烈噪点 | 复古、全息 |
| 0.05+ | 过度噪点 | 极少使用 |

**实战参数参考**（从现有模板提取）：

```typescript
// 银河 —— 极微妙噪点
drawUtils.noiseTexture(ctx, x, y, w, h, 0.012, time);

// 火焰 —— 微妙噪点
drawUtils.noiseTexture(ctx, x, y, w, h, 0.015, time);

// 液态以太 —— 标准噪点
drawUtils.noiseTexture(ctx, x, y, w, h, 0.02, time);

// 3D卡片 —— 标准噪点
drawUtils.noiseTexture(ctx, x, y, w, h, 0.02, time);

// 冲击波 —— 极微妙噪点
drawUtils.noiseTexture(ctx, x, y, w, h, 0.008, time);

// 闪烁文字 —— 标准噪点
drawUtils.noiseTexture(ctx, x, y, w, h, 0.02, time);
```

### 19.4 色彩分级：meshGradient 作为氛围基底

**`meshGradient` 不是用来做"渐变背景"的，而是用来做"色彩氛围"的。**

```typescript
// 正确用法：低intensity（0.2-0.35）作为氛围层
drawUtils.meshGradient(ctx, -width/2, -height/2, width, height,
  palettes.royal, time * 0.15, 0.35);

// 错误用法：高intensity（0.5+）会变成花哨的彩色背景
drawUtils.meshGradient(ctx, -width/2, -height/2, width, height,
  palettes.cyberpunk, time * 0.15, 0.8);  // 太花哨！
```

**`meshGradient` 的 `intensity` 参数**控制整体透明度，`time` 参数控制色彩团的缓慢漂移。

**不同场景的 meshGradient 配置**：

```typescript
// 暗色科技感
drawUtils.meshGradient(ctx, x, y, w, h, ['#050510', '#0a0a18', '#050510'], time * 0.05, 0.2);

// 皇家紫金
drawUtils.meshGradient(ctx, x, y, w, h, palettes.royal, time * 0.15, 0.35);

// 深空
drawUtils.meshGradient(ctx, x, y, w, h, ['#020210', '#050520', '#0a0a30'], time * 0.03, 0.3);

// 暖色余烬
drawUtils.meshGradient(ctx, x, y, w, h, palettes.ember.slice(3, 6), time * 0.2, 0.18);
```

### 19.5 景深模拟

通过透明度和大小渐变模拟景深：

```typescript
// 远景层：小尺寸、低透明度、慢运动
const farDepth = 0.2 + ((seed * 13) % 100) / 100 * 0.3;
const farSize = baseSize * farDepth;
const farAlpha = baseAlpha * farDepth * 0.5;
const farSpeed = baseSpeed * farDepth;

// 中景层：中等
const midDepth = 0.5 + ((seed * 13) % 100) / 100 * 0.3;

// 近景层：大尺寸、高透明度、快运动
const nearDepth = 0.8 + ((seed * 13) % 100) / 100 * 0.2;
```

---

## 20. 动画节奏与时机

### 20.1 入场-保持-退场 三段式设计

**几乎所有高质量动画都遵循三段式结构**：

```typescript
const p = paramGuard.number(progress, 0, 0, 1);

// ===== 入场阶段（0 - 0.3）=====
const enterProgress = Math.min(1, p / 0.3);
const enterScale = easing.spring(enterProgress, 120, 10, 1);

// ===== 保持阶段（0.3 - 0.7）=====
const holdPhase = p > 0.3 && p < 0.7;
// 保持阶段可以有呼吸微动、脉冲等

// ===== 退场阶段（0.7 - 1.0）=====
const exitProgress = p > 0.7 ? (p - 0.7) / 0.3 : 0;
const exitScale = 1 - easing.easeInCubic(exitProgress) * 0.3;

// ===== 合成 =====
const finalScale = enterScale * exitScale;
```

**三段式的时间分配**：

| 效果类型 | 入场 | 保持 | 退场 |
|----------|------|------|------|
| 快闪效果 | 0-0.15 | 0.15-0.85 | 0.85-1.0 |
| 标准效果 | 0-0.3 | 0.3-0.7 | 0.7-1.0 |
| 强调入场 | 0-0.4 | 0.4-0.7 | 0.7-1.0 |
| 慢入快出 | 0-0.5 | 0.5-0.75 | 0.75-1.0 |

### 20.2 交错动画：stagger

**`stagger(progress, index, total, overlap=0.3)`**

交错动画让多个元素依次出现，产生"波浪感"。

```typescript
// 5个元素依次入场
for (let i = 0; i < 5; i++) {
  const staggerP = animationUtils.stagger(progress, i, 5, 0.3);
  const elementScale = easing.spring(staggerP, 120, 10, 1);
  // ... 使用 elementScale 绘制第i个元素 ...
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

### 20.3 延迟展开

**冲击波的多环延迟展开**：

```typescript
for (let ring = 0; ring < ringCount; ring++) {
  const ringDelay = ring * 0.08;  // 每环延迟0.08
  const ringP = Math.max(0, Math.min(1, (p - ringDelay) / (1 - ringDelay)));
  if (ringP <= 0) continue;

  const ringProgress = easing.easeOutCubic(ringP);
  const radius = ringProgress * maxRadius;
  // ... 绘制环 ...
}
```

**延迟展开的参数选择**：

| 延迟量 | 效果 | 适用场景 |
|--------|------|----------|
| 0.03-0.05 | 快速涟漪 | 水波、声波 |
| 0.08-0.12 | 标准延迟 | 冲击波、光环 |
| 0.15-0.2 | 明显延迟 | 魔法阵展开 |
| 0.25+ | 极慢展开 | 仪式感展开 |

### 20.4 呼吸微动

**`dampedOscillation` 的低频微振**：

```typescript
// 按钮呼吸
const breathe = easing.dampedOscillation(time * 2, 1.5, 0.1) * 0.015;
ctx.scale(1 + breathe, 1 + breathe);

// 卡片浮动
const floatOsc = easing.dampedOscillation(time * floatSpeed * 0.5, 0.8, 0.05);
const floatY = floatOsc * 15;

// 装饰点脉动
const dotOsc = easing.dampedOscillation(time * 2 + i * 0.8, 1.5, 0.12);
const dotSize = baseSize * (0.8 + Math.abs(dotOsc) * 0.6);
```

**呼吸微动的关键参数**：

| 参数 | 推荐范围 | 效果 |
|------|----------|------|
| time 倍率 | 1.5-3 | 控制呼吸速度 |
| frequency | 0.8-2 | 控制振荡频率 |
| dampingRatio | 0.05-0.15 | 控制衰减速度 |
| 振幅乘数 | 0.01-0.03 | 控制微动幅度 |

**关键**：振幅乘数必须极小（0.01-0.03），否则从"呼吸"变成"颤抖"。

### 20.5 弹性稳定：Settle Wobble

弹簧入场后的"稳定微振"是物理真实感的关键：

```typescript
// 弹簧入场
const enterProgress = Math.min(1, p / 0.3);
const springValue = easing.spring(enterProgress, 100, 14, 1);

// spring 内部已经包含了过冲和回弹
// 当 enterProgress 接近 1 时，springValue 会在 1 附近微振后稳定
```

**spring 的 stiffness/damping 组合对 settle wobble 的影响**：

| stiffness | damping | settle 效果 |
|-----------|---------|-------------|
| 100 | 14 | 2-3次微振后稳定，优雅 |
| 120 | 10 | 3-4次微振后稳定，活泼 |
| 180 | 12 | 2-3次微振后稳定，标准 |
| 300 | 5 | 多次振荡，极度弹性 |
| 60 | 20 | 几乎无振荡，沉重 |

### 20.6 节奏感：速度变化创造视觉节奏

**快→慢→快** 的节奏模式：

```typescript
// 冲击波：快速扩散 → 减速 → 停止
const ringProgress = easing.easeOutCubic(ringP);  // 先快后慢

// 弹性按钮：快速吸附 → 微振 → 稳定
const snapEnter = easing.snapSpring(enterProgress, 350, 30);  // 快速到位+微振

// 粒子爆炸：极快扩散 → 减速 → 重力下落
const explosionProgress = easing.easeOutCubic(p);  // 先快后慢
const gravity = particleP * particleP * 50;  // 二次函数加速下落
```

**节奏感设计原则**：

1. **入场要快**：用户注意力有限，入场动画超过0.3秒就会觉得"慢"
2. **保持要活**：保持阶段不能完全静止，必须有呼吸/脉冲/微动
3. **退场要果断**：退场动画0.2-0.3秒，不要太长
4. **对比产生节奏**：快慢交替比匀速更有吸引力

---

## 21. 视觉冲击力配方

### 21.1 爆裂扩散（冲击波 + 闪光 + 粒子）

**效果描述**：从中心爆发的冲击波，伴随初始闪光和环上粒子。

**核心技术组合**：

```typescript
render: (context: TemplateRenderContext) => {
  const { ctx, width, height, progress, time, params } = context;
  const p = paramGuard.number(progress, 0, 0, 1);

  // 背景
  drawUtils.meshGradient(ctx, -width/2, -height/2, width, height,
    ['#050510', '#0a0a18', '#050510'], time * 0.05, 0.2);
  drawUtils.vignette(ctx, width, height, 0.5);

  // 1. 初始闪光（极快衰减）
  const flashAlpha = Math.max(0, 1 - p * 4);
  if (flashAlpha > 0) {
    drawUtils.radialGlow(ctx, 0, 0, 50 * flashAlpha, '#ffffff', flashAlpha * 0.6);
    drawUtils.multiLayerGlow(ctx, 0, 0, color1, 30 * flashAlpha, 5);
  }

  // 2. 多环延迟展开
  for (let ring = 0; ring < ringCount; ring++) {
    const ringDelay = ring * 0.08;
    const ringP = Math.max(0, Math.min(1, (p - ringDelay) / (1 - ringDelay)));
    if (ringP <= 0) continue;

    const ringProgress = easing.easeOutCubic(ringP);
    const radius = ringProgress * maxRadius;
    const ringAlpha = (1 - ringP) * 0.6;
    const ringColor = colorUtils.lerpColor(color1, color2, ring / ringCount);

    ctx.strokeStyle = colorUtils.toRgba(ringColor, ringAlpha);
    ctx.lineWidth = 3 - ring * 0.3;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();

    drawUtils.radialGlow(ctx, 0, 0, radius, ringColor, ringAlpha * 0.15);

    // 3. 环上粒子
    const particleCount = 12;
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2 + ring * 0.5;
      const px = Math.cos(angle) * radius;
      const py = Math.sin(angle) * radius;
      drawUtils.particle(ctx, px, py, 4, ringColor, ringAlpha * 0.5, 0.5);
    }
  }

  // 4. 中心扭曲
  const distortionAlpha = Math.max(0, 1 - p * 2);
  if (distortionAlpha > 0) {
    const distortRadius = easing.easeOutCubic(p) * maxRadius * 0.5;
    const distortGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, distortRadius);
    distortGrad.addColorStop(0, colorUtils.toRgba('#ffffff', distortionAlpha * 0.1));
    distortGrad.addColorStop(0.5, colorUtils.toRgba(color1, distortionAlpha * 0.05));
    distortGrad.addColorStop(1, colorUtils.toRgba(color1, 0));
    ctx.fillStyle = distortGrad;
    ctx.beginPath();
    ctx.arc(0, 0, distortRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  drawUtils.noiseTexture(ctx, -width/2, -height/2, width, height, 0.008, time);
}
```

**参数建议**：
- 闪光衰减：`1 - p * 4`（0.25秒内消失）
- 环延迟：`ring * 0.08`（每环间隔0.08）
- 环扩散缓动：`easeOutCubic`（先快后慢）
- 环透明度：`(1 - ringP) * 0.6`（越远越淡）

### 21.2 弹性着陆（spring + squash & stretch + 阴影变化）

**效果描述**：物体从上方落下，着陆时挤压变形，弹跳后恢复。

**核心技术组合**：

```typescript
render: (context: TemplateRenderContext) => {
  const { ctx, width, height, progress, time, params } = context;
  const p = paramGuard.number(progress, 0, 0, 1);

  // 背景
  drawUtils.meshGradient(ctx, -width/2, -height/2, width, height,
    palettes.royal, time * 0.1, 0.25);
  drawUtils.vignette(ctx, width, height, 0.4);

  // 重力弹跳
  const bounceY = easing.gravityBounce(p, 0.65, 9.8);
  const landY = -height * 0.3 + (1 - bounceY) * height * 0.4;

  // Squash & Stretch
  const velocity = Math.abs(easing.dampedOscillation(p * 3, 8, 0.5));
  const squash = 1 + velocity * 0.15;
  const stretch = 1 / squash;

  // 动态阴影
  const shadowDist = (1 - bounceY) * height * 0.4;
  const shadowAlpha = 0.3 + bounceY * 0.2;
  const shadowBlur = 10 + shadowDist * 0.3;
  const shadowScale = 0.8 + (1 - bounceY) * 0.4;

  ctx.save();
  // 绘制阴影
  ctx.save();
  ctx.translate(0, height * 0.15);
  ctx.scale(shadowScale, 0.3);
  ctx.fillStyle = colorUtils.toRgba('#000000', shadowAlpha);
  ctx.filter = `blur(${shadowBlur}px)`;
  ctx.beginPath();
  ctx.arc(0, 0, objectWidth * 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 绘制物体
  ctx.translate(0, landY);
  ctx.scale(stretch, squash);

  // 物体主体
  drawUtils.multiLayerGlow(ctx, 0, 0, accentColor, objectWidth * 0.3, 4);
  const objGrad = drawUtils.premiumGradient(ctx, -objectWidth/2, -objectHeight/2,
    objectWidth, objectHeight,
    [colorUtils.adjustBrightness(objColor, 30), objColor,
     colorUtils.adjustBrightness(objColor, -25)], 135);
  drawUtils.roundedRect(ctx, -objectWidth/2, -objectHeight/2,
    objectWidth, objectHeight, cornerRadius);
  ctx.fillStyle = objGrad;
  ctx.fill();
  drawUtils.glassBackground(ctx, -objectWidth/2, -objectHeight/2,
    objectWidth, objectHeight, cornerRadius, 0.08);
  drawUtils.specularHighlight(ctx, -objectWidth/2+3, -objectHeight/2+3,
    objectWidth-6, objectHeight, cornerRadius*0.8, 0.2);

  ctx.restore();

  drawUtils.noiseTexture(ctx, -width/2, -height/2, width, height, 0.015, time);
}
```

**参数建议**：
- 重力弹跳：`restitution=0.65`（3-4次弹跳）
- Squash幅度：`0.1-0.2`（超过0.3会夸张）
- 阴影模糊：随高度增加而增大
- 阴影透明度：物体越高阴影越淡

### 21.3 能量汇聚（螺旋 + 发光 + 粒子轨迹 + 中心爆发）

**效果描述**：粒子沿螺旋轨迹汇聚到中心，到达后产生爆发。

**核心技术组合**：

```typescript
render: (context: TemplateRenderContext) => {
  const { ctx, width, height, progress, time, params } = context;
  const p = paramGuard.number(progress, 0, 0, 1);

  drawUtils.meshGradient(ctx, -width/2, -height/2, width, height,
    ['#050510', '#0a0a18', '#050510'], time * 0.05, 0.2);
  drawUtils.vignette(ctx, width, height, 0.5);

  const gatherP = Math.min(1, p / 0.7);  // 前70%时间汇聚
  const burstP = p > 0.7 ? (p - 0.7) / 0.3 : 0;  // 后30%时间爆发

  // 螺旋粒子汇聚
  const spiralCount = 30;
  for (let i = 0; i < spiralCount; i++) {
    const seed = i * 2741;
    const baseAngle = ((seed * 7) % 10000) / 10000 * Math.PI * 2;
    const spiralSpeed = 3 + ((seed * 13) % 100) / 100 * 2;

    // 螺旋轨迹：角度随时间增加，半径随汇聚进度减小
    const angle = baseAngle + time * spiralSpeed + gatherP * Math.PI * 4;
    const maxR = Math.min(width, height) * 0.4;
    const radius = maxR * (1 - easing.easeInCubic(gatherP));

    const px = Math.cos(angle) * radius;
    const py = Math.sin(angle) * radius;
    const particleAlpha = (0.3 + Math.sin(time * 3 + i) * 0.2) * (1 - burstP);
    const particleSize = 2 + (1 - gatherP) * 3;

    // 拖尾
    const trailLen = 4;
    for (let t = 1; t <= trailLen; t++) {
      const trailAngle = angle - t * 0.15;
      const trailR = radius + t * maxR * 0.02;
      const tx = Math.cos(trailAngle) * trailR;
      const ty = Math.sin(trailAngle) * trailR;
      const trailAlpha = particleAlpha * (1 - t / trailLen) * 0.4;
      drawUtils.particle(ctx, tx, ty, particleSize * (1 - t/trailLen*0.5),
        particleColor, trailAlpha, 0.5);
    }

    drawUtils.particle(ctx, px, py, particleSize * 2, particleColor, particleAlpha * 0.3, 0.3);
    drawUtils.particle(ctx, px, py, particleSize, particleColor, particleAlpha, 0.7);
  }

  // 中心发光（随汇聚增强）
  const coreIntensity = easing.easeInCubic(gatherP) * (1 - burstP);
  drawUtils.multiLayerGlow(ctx, 0, 0, color1, 30 * coreIntensity, 5);
  drawUtils.radialGlow(ctx, 0, 0, 80 * coreIntensity, color1, 0.2 * coreIntensity);

  // 中心爆发
  if (burstP > 0) {
    const burstAlpha = Math.max(0, 1 - burstP * 3);
    if (burstAlpha > 0) {
      drawUtils.radialGlow(ctx, 0, 0, width * 0.5 * burstAlpha, '#ffffff', burstAlpha * 0.5);
      drawUtils.multiLayerGlow(ctx, 0, 0, color1, width * 0.2 * burstAlpha, 5);
    }

    const burstRadius = easing.easeOutCubic(burstP) * Math.min(width, height) * 0.4;
    ctx.strokeStyle = colorUtils.toRgba(color1, burstAlpha * 0.5);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, burstRadius, 0, Math.PI * 2);
    ctx.stroke();
  }

  drawUtils.noiseTexture(ctx, -width/2, -height/2, width, height, 0.01, time);
}
```

**参数建议**：
- 汇聚时间：70%进度
- 螺旋速度：3-5（角速度）
- 汇聚缓动：`easeInCubic`（越来越快，像被吸引）
- 爆发缓动：`easeOutCubic`（先快后慢扩散）

### 21.4 液态流动（blob + 扫描线 + 高光 + 色彩混合）

**效果描述**：液态金属般的流动色团，带有反射高光和扫描线。

**核心技术组合**：参见 [17.4 液态/流体](#174-液态流体) 的完整代码。

**参数建议**：
- blob数量：5-8个
- blob轨道速度：`time * 0.2`（极慢）
- 扫描线间距：3px
- 扫描线透明度：0.02-0.05
- 高光数量：6-8个
- 高光透明度：0.12-0.20

### 21.5 全息投影（扫描线 + 色彩偏移 + 噪点 + 闪烁）

**效果描述**：科幻全息投影效果，带有扫描线、色彩偏移和闪烁。

**核心技术组合**：

```typescript
render: (context: TemplateRenderContext) => {
  const { ctx, width, height, progress, time, params } = context;
  const p = paramGuard.number(progress, 0, 0, 1);

  // 暗色背景
  ctx.fillStyle = '#050510';
  ctx.fillRect(-width/2, -height/2, width, height);
  drawUtils.vignette(ctx, width, height, 0.6);

  const holoAlpha = 0.6 + Math.sin(time * 5) * 0.1;  // 闪烁

  ctx.save();
  ctx.globalAlpha = holoAlpha * p;

  // 1. 主体内容（半透明青色）
  const contentWidth = width * 0.6;
  const contentHeight = height * 0.5;
  drawUtils.roundedRect(ctx, -contentWidth/2, -contentHeight/2,
    contentWidth, contentHeight, 10);
  ctx.fillStyle = colorUtils.toRgba('#00ffcc', 0.08);
  ctx.fill();
  ctx.strokeStyle = colorUtils.toRgba('#00ffcc', 0.4);
  ctx.lineWidth = 1;
  ctx.stroke();

  // 2. 扫描线
  for (let y = -contentHeight/2; y < contentHeight/2; y += 2) {
    const scanAlpha = 0.03 + Math.sin(y * 0.1 + time * 3) * 0.02;
    ctx.fillStyle = colorUtils.toRgba('#00ffcc', scanAlpha);
    ctx.fillRect(-contentWidth/2, y, contentWidth, 1);
  }

  // 3. 滚动扫描条
  const scanLineY = -contentHeight/2 + ((time * 50) % contentHeight);
  ctx.fillStyle = colorUtils.toRgba('#00ffcc', 0.15);
  ctx.fillRect(-contentWidth/2, scanLineY, contentWidth, 2);
  drawUtils.radialGlow(ctx, 0, scanLineY, 30, '#00ffcc', 0.1);

  // 4. 色彩偏移（RGB分离）
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = 0.05 * holoAlpha;
  ctx.fillStyle = '#ff0000';
  ctx.fillRect(-contentWidth/2 + 2, -contentHeight/2, contentWidth, contentHeight);
  ctx.fillStyle = '#0000ff';
  ctx.fillRect(-contentWidth/2 - 2, -contentHeight/2, contentWidth, contentHeight);
  ctx.globalCompositeOperation = 'source-over';

  // 5. 随机故障线
  const glitchChance = easing.perlinNoise1D(time * 10, 5, 0);
  if (glitchChance > 0.85) {
    const glitchY = (easing.perlinNoise1D(time * 20, 3, 1) - 0.5) * contentHeight;
    const glitchH = 2 + easing.perlinNoise1D(time * 30, 2, 2) * 5;
    ctx.fillStyle = colorUtils.toRgba('#00ffcc', 0.3);
    ctx.fillRect(-contentWidth/2, glitchY, contentWidth, glitchH);
  }

  ctx.restore();

  drawUtils.noiseTexture(ctx, -width/2, -height/2, width, height, 0.04, time);
}
```

**参数建议**：
- 扫描线间距：2px
- 扫描线透明度：0.02-0.05
- 闪烁频率：`time * 5`
- RGB偏移量：2-3px
- 噪点强度：0.03-0.05（比一般效果高）
- 故障触发阈值：perlinNoise > 0.85

### 21.6 霓虹脉冲（多层发光 + perlin闪烁 + 色彩渐变）

**效果描述**：霓虹灯般的脉冲发光效果，带有自然闪烁和色彩渐变。

**核心技术组合**：

```typescript
render: (context: TemplateRenderContext) => {
  const { ctx, width, height, progress, time, params } = context;
  const p = paramGuard.number(progress, 0, 0, 1);

  ctx.fillStyle = '#0a0015';
  ctx.fillRect(-width/2, -height/2, width, height);
  drawUtils.vignette(ctx, width, height, 0.5);

  const neonColors = palettes.neon;
  const pulse = (Math.sin(time * 3) + 1) / 2;
  const flicker = easing.perlinNoise1D(time * 8, 2, 0);
  const neonIntensity = (0.5 + pulse * 0.3 + flicker * 0.2) * p;

  // 多条霓虹线
  const lineCount = 5;
  for (let i = 0; i < lineCount; i++) {
    const lineY = -height * 0.3 + i * height * 0.15;
    const lineColor = neonColors[i % neonColors.length];
    const lineAlpha = neonIntensity * (0.5 + Math.sin(time * 2 + i * 0.8) * 0.3);

    // 发光基底
    drawUtils.multiLayerGlow(ctx, 0, lineY, lineColor, width * 0.3, 4);

    // 霓虹线
    ctx.save();
    ctx.strokeStyle = colorUtils.toRgba(lineColor, lineAlpha);
    ctx.lineWidth = 3;
    ctx.shadowColor = lineColor;
    ctx.shadowBlur = 20 * neonIntensity;
    ctx.beginPath();
    for (let x = -width/2; x <= width/2; x += 5) {
      const wave = Math.sin(x * 0.02 + time * 2 + i) * 10;
      if (x === -width/2) ctx.moveTo(x, lineY + wave);
      else ctx.lineTo(x, lineY + wave);
    }
    ctx.stroke();

    // 白色核心
    ctx.shadowBlur = 0;
    ctx.strokeStyle = colorUtils.toRgba('#ffffff', lineAlpha * 0.5);
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  drawUtils.noiseTexture(ctx, -width/2, -height/2, width, height, 0.02, time);
}
```

### 21.7 重力弹跳（gravityBounce + squash & stretch + 阴影）

**效果描述**：物体在重力作用下弹跳，每次弹跳都有挤压拉伸和阴影变化。

**核心技术组合**：参见 [21.2 弹性着陆](#212-弹性着陆spring--squash--stretch--阴影变化) 的核心代码，将 `spring` 替换为 `gravityBounce`：

```typescript
const bounceY = easing.gravityBounce(p, 0.65, 9.8);

// Squash & Stretch 基于弹跳速度
const bounceVelocity = /* 通过差分近似计算 */;
const squash = 1 + Math.abs(bounceVelocity) * 0.12;
const stretch = 1 / squash;
```

**参数建议**：
- `restitution=0.6-0.75`：3-5次可见弹跳
- Squash幅度：`0.1-0.15`
- 阴影随高度变化：越高越淡越模糊

### 21.8 魔法展开（弹簧 + 反向旋转 + 符文 + 轨道粒子）

**效果描述**：魔法阵从中心弹簧展开，多层环反向旋转，符文发光，粒子沿轨道运动。

**核心技术组合**：参见 [magicCircle.ts](file:///d:/project/AutoEdit/src/engine/templates/magicCircle.ts) 的完整实现。

**关键参数**：
- 弹簧入场：`spring(p/0.3, 100, 14, 1)`
- 反向旋转：`ring % 2 === 0 ? 1 : -1`
- 旋转速度递增：`1 + r * 0.2`
- 虚线装饰环：`setLineDash([8, 12])`
- 符文闪烁：`0.6 + Math.sin(time * 2 + i) * 0.2`
- 轨道粒子：12个，沿阵法边缘运动

### 21.9 粒子爆炸（径向扩散 + 拖尾 + 衰减 + 闪光）

**效果描述**：从中心爆发的粒子，带有拖尾、重力下落和初始闪光。

**核心技术组合**：参见 [particleExplosion.ts](file:///d:/project/AutoEdit/src/engine/templates/particleExplosion.ts) 的完整实现。

**关键参数**：
- 初始闪光：`1 - p * 5`（0.2秒内消失）
- 扩散缓动：`easeOutCubic`
- 重力：`particleP * particleP * 50`（二次函数）
- 拖尾长度：3-5帧
- 拖尾透明度：`particleAlpha * (1 - t / trailLen) * 0.4`
- 冲击波环：3环，每环 `0.8 + ring * 0.15` 半径比

### 21.10 丝绸飘动（贝塞尔 + 正弦波 + 渐变 + 高光）

**效果描述**：丝绸般的褶皱飘动，带有光线反射和流动感。

**核心技术组合**：参见 [silk.ts](file:///d:/project/AutoEdit/src/engine/templates/silk.ts) 的完整实现。

**关键参数**：
- 褶皱数量：10-14
- 正弦波频率：`y * 0.01`（低频波动）
- 波动幅度：`foldWidth * 0.3`
- 亮暗交替：`i % 2 === 0`
- 渐变色标：5个（0, 0.3, 0.5, 0.7, 1）
- 高光数量：5-8个
- 全局扫光速度：`time * 0.2`

---

## 22. 质量评估标准

### 22.1 视觉效果的5级评分标准

| 等级 | 名称 | 标准 | 典型特征 |
|------|------|------|----------|
| ⭐ | 基础 | 功能正确，能渲染 | 纯色背景、无渐变、无发光、无粒子 |
| ⭐⭐ | 及格 | 有基本视觉层次 | 有渐变背景、有发光、有后处理 |
| ⭐⭐⭐ | 良好 | 有完整四层结构 | 背景层+主体层+装饰层+后处理层齐全 |
| ⭐⭐⭐⭐ | 优秀 | 有物理真实感 | 弹簧入场、呼吸微动、动态阴影、双层粒子 |
| ⭐⭐⭐⭐⭐ | 卓越 | 让人眼前一亮 | 多层光影、材质模拟、粒子拖尾、节奏感、色彩和谐 |

**各级别的具体要求**：

**⭐ 基础**：
- ✅ 能正确渲染，无报错
- ✅ 参数保护完整
- ❌ 无渐变、无发光、无粒子

**⭐⭐ 及格**：
- ✅ 有渐变背景（premiumGradient 或 meshGradient）
- ✅ 有 vignette
- ✅ 有基本发光（radialGlow 或 multiLayerGlow）
- ❌ 无粒子、无动态效果

**⭐⭐⭐ 良好**：
- ✅ 完整四层结构
- ✅ 有粒子系统（双层渲染）
- ✅ 有 noiseTexture
- ✅ 有入场/退场动画
- ❌ 无物理缓动、无材质模拟

**⭐⭐⭐⭐ 优秀**：
- ✅ 物理缓动（spring/snapSpring/dampedOscillation）
- ✅ 呼吸微动
- ✅ 动态阴影
- ✅ 扫描光效（shimmerLine/borderBeam）
- ✅ 材质叠加（glassBackground + specularHighlight）
- ❌ 无特殊粒子效果、无节奏感设计

**⭐⭐⭐⭐⭐ 卓越**：
- ✅ 多层光影组合（radialGlow + multiLayerGlow + lightBeam）
- ✅ 材质模拟（金属/玻璃/液态/霓虹）
- ✅ 粒子拖尾/余烬/火花
- ✅ 三段式节奏（入场-保持-退场）
- ✅ 色彩和谐（配色方案 + lerpColor + adjustBrightness）
- ✅ 交错动画/延迟展开
- ✅ 完整后处理链

### 22.2 物理真实感检查清单

对每个模板/预设，逐项检查：

**入场动画**：
- [ ] 使用物理缓动（spring/snapSpring/gravityBounce），而非线性或简单ease
- [ ] 有过冲和回弹（spring 的欠阻尼振荡）
- [ ] 入场时间 ≤ 0.3秒（太快不好看，太慢觉得卡）

**保持阶段**：
- [ ] 有呼吸微动（dampedOscillation * 0.015）
- [ ] 有脉冲效果（sin 驱动的亮度/大小变化）
- [ ] 有扫光效果（shimmerLine/borderBeam 循环）
- [ ] 粒子持续运动（不是静止的）

**退场动画**：
- [ ] 退场时间 0.2-0.3秒
- [ ] 退场缓动与入场缓动有对比（入场弹性，退场加速）

**阴影**：
- [ ] 阴影偏移随物体运动变化
- [ ] 阴影模糊随物体高度变化
- [ ] 阴影颜色不是纯黑（用 toRgba 控制透明度）

**粒子**：
- [ ] 双层渲染（光晕+核心）
- [ ] 确定性生成（无 Math.random）
- [ ] 有生命周期（上升/扩散/衰减）
- [ ] 有拖尾（高速粒子）

**后处理**：
- [ ] vignette 强度 0.3-0.6
- [ ] noiseTexture 强度 0.008-0.025
- [ ] 后处理顺序：vignette → noiseTexture

### 22.3 常见"假"感的来源和修复方法

| 问题 | 原因 | 修复方法 |
|------|------|----------|
| 动画像机器人 | 使用 linear 或简单 ease | 改用 spring/snapSpring 物理缓动 |
| 画面太平 | 只有一层，没有深度 | 添加四层结构，用透明度制造深度 |
| 发光太假 | 单层发光，没有层次 | 改用 radialGlow + multiLayerGlow 双层 |
| 粒子像噪点 | 单层渲染，没有光晕 | 改用双层渲染（大半径低透明度+小半径高透明度） |
| 画面太"干净" | 缺少质感层 | 添加 noiseTexture(0.015) |
| 画面没有焦点 | 缺少 vignette | 添加 vignette(0.4) |
| 颜色太杂 | 使用了太多颜色 | 限制2种主色，用 lerpColor 生成过渡 |
| 动画太突然 | 没有预备动作 | 添加 anticipation（先反向再正向） |
| 物体像漂浮 | 没有阴影 | 添加动态阴影 |
| 闪烁不自然 | 用 Math.random | 改用 perlinNoise1D |
| 粒子同步运动 | 用同一个 seed | 每个粒子用不同 seed（i * 质数） |
| 弹跳太机械 | 用固定弹跳 | 改用 gravityBounce（真实物理模拟） |
| 退场太慢 | 退场用 easeOut | 改用 easeInCubic（加速消失） |
| 画面太暗 | vignette 太强 | 降低 vignette intensity 到 0.3-0.4 |
| 画面太亮 | 缺少暗部 | 增强背景渐变的暗色端 |
| 扫光太明显 | shimmerLine intensity 太高 | 降低到 0.08-0.15 |
| 呼吸太抖 | dampedOscillation 振幅太大 | 降低振幅乘数到 0.01-0.03 |
| 粒子太多 | particleCount 过大 | 根据画面大小调整，一般 20-60 |
| 渐变色带 | 渐变色标太少 | 增加到 4-5 个色标 |
| 阴影太硬 | 没有模糊 | 添加 ctx.filter = `blur(${blur}px)` |

---

## 附录：快速参考

### A. 标准模板渲染骨架

```typescript
import { TemplateDefinition, TemplateRenderContext } from './types';
import { easing, adaptiveLayout, paramGuard, drawUtils, colorUtils, animationUtils, palettes } from './templateUtils';

export const myTemplate: TemplateDefinition = {
  id: 'category_name',
  name: '中文名',
  description: '描述',
  category: 'effect',
  schema: [
    { key: 'color1', label: '主颜色', type: 'color', default: '#00d4ff' },
    { key: 'intensity', label: '强度', type: 'number', default: 1, min: 0.5, max: 2, step: 0.1 },
  ],

  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const color1 = paramGuard.color(params.color1, '#00d4ff');
    const intensity = paramGuard.number(params.intensity, 1, 0.5, 2);
    const p = paramGuard.number(progress, 0, 0, 1);

    // ===== 第一层：背景层 =====
    drawUtils.meshGradient(ctx, -width/2, -height/2, width, height,
      ['#050510', '#0a0a18', '#050510'], time * 0.05, 0.2);
    drawUtils.vignette(ctx, width, height, 0.5);

    // ===== 入场动画 =====
    const enterProgress = Math.min(1, p / 0.3);
    const enterScale = easing.spring(enterProgress, 120, 10, 1);

    // ===== 第二层：主体层 =====
    ctx.save();
    ctx.scale(enterScale, enterScale);
    drawUtils.multiLayerGlow(ctx, 0, 0, color1, 50, 4);
    // ... 主体绘制 ...
    ctx.restore();

    // ===== 第三层：装饰层 =====
    for (let i = 0; i < 20; i++) {
      const seed = i * 3571;
      // ... 粒子绘制（双层渲染）...
    }

    // ===== 退场动画 =====
    const exitProgress = p > 0.7 ? (p - 0.7) / 0.3 : 0;
    // ... 退场处理 ...

    // ===== 第四层：后处理层 =====
    drawUtils.vignette(ctx, width, height, 0.4);
    drawUtils.noiseTexture(ctx, -width/2, -height/2, width, height, 0.015, time);
  },

  initParams: () => ({
    color1: '#00d4ff',
    intensity: 1,
  })
};
```

### B. 缓动函数选择决策树

```
需要什么效果？
├── 入场动画
│   ├── UI元素 → snapSpring(tension=350, friction=30)
│   ├── 效果元素 → spring(stiffness=100-180, damping=10-14, mass=1)
│   └── 快速出现 → easeOutBack
├── 弹跳效果
│   ├── 真实弹跳 → gravityBounce(restitution=0.6)
│   ├── 数学弹跳 → springBounce(bounces=4, decay=3.5)
│   └── 弹性振荡 → easeOutElastic
├── 微动画
│   ├── 呼吸 → dampedOscillation(frequency=1.5, dampingRatio=0.1)
│   ├── 漂浮 → perlinNoise1D(frequency=1, seed=0)
│   └── 脉冲 → sin(time * frequency)
├── 扩散/收缩
│   ├── 先快后慢 → easeOutCubic
│   ├── 先慢后快 → easeInCubic
│   └── 延迟展开 → stagger + easeOutCubic
└── 特殊效果
    ├── 鞭打 → whipEffect(whipStrength=0.4)
    ├── 惯性 → momentumEase(mass=1, friction=0.3)
    └── 自定义贝塞尔 → bezierEase(x1, y1, x2, y2)
```

### C. drawUtils 快速选择指南

```
需要什么视觉效果？
├── 发光
│   ├── 大范围柔光 → radialGlow
│   ├── 中心强光 → multiLayerGlow
│   ├── 文字发光 → neonText
│   └── 光束 → lightBeam
├── 材质
│   ├── 玻璃 → glassBackground
│   ├── 金属渐变 → premiumGradient
│   └── 高光 → specularHighlight
├── 扫光
│   ├── 内部扫光 → shimmerLine
│   └── 边框扫光 → borderBeam
├── 粒子
│   ├── 单个粒子 → particle
│   └── 粒子连线 → 手动实现距离检测
├── 背景
│   ├── 渐变背景 → premiumGradient
│   ├── 氛围背景 → meshGradient
│   └── 暗角 → vignette
├── 后处理
│   ├── 噪点 → noiseTexture
│   └── 暗角 → vignette
└── 文字
    ├── 渐变文字 → gradientText
    ├── 发光文字 → neonText
    └── 阴影文字 → textWithShadow
```

---

> **文档版本**：v2.0（融合版） | **最后更新**：2026-05-29
>
> 本文档由《AI模板开发规范文档》与《AI视觉效果与物理真实感开发指南》融合而成，涵盖模板开发全流程规范与视觉效果深度技术。