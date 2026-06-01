# NanoEdit Pro 模板开发完整指南（新架构版）

> 本文档提供详细的模板开发指导，帮助开发者在新架构下创建视觉效果冲击感强烈、动画丝滑流畅的视频片段效果模板。

---

## 目录

1. [架构概览](#架构概览)
2. [快速开始](#快速开始)
3. [核心概念](#核心概念)
4. [双模式渲染系统](#双模式渲染系统)
5. [模板引擎API](#模板引擎api)
6. [模板注册表API](#模板注册表api)
7. [React上下文系统](#react上下文系统)
8. [自适应布局系统](#自适应布局系统)
9. [缓动函数与动画](#缓动函数与动画)
10. [开发规范（重要）](#开发规范重要)
11. [模板工具库](#模板工具库)
12. [模板分类列表（50+完整版）](#模板分类列表50完整版)
13. [在新架构中创建模板](#在新架构中创建模板)
14. [Store API 参考](#store-api-参考)
15. [模板示例](#模板示例)
16. [高级技巧](#高级技巧)

---

## 架构概览

### 新模块化结构

```
src/modules/template/
├── core/
│   ├── TemplateEngine.ts        # 模板引擎核心（双模式渲染）
│   ├── TemplateRegistry.ts      # 模板注册表
│   └── TemplateContext.tsx       # React上下文提供者
├── types/
│   └── index.ts                 # 类型定义
└── components/
    └── TemplateRenderer.tsx     # 模板渲染组件

src/engine/templates/            # 保留旧路径兼容
├── types.ts                     # 类型定义
├── templateUtils.ts             # 工具函数库（路径不变）
└── index.ts                     # 模板导出

src/modules/shared/
└── types.ts                     # 共享类型定义
```

### 关键变更

| 旧路径 | 新路径 | 说明 |
|--------|--------|------|
| `src/engine/templates/` | `src/modules/template/` | 模板核心模块 |
| `src/types/core.ts` | `src/modules/shared/types.ts` | 共享类型 |
| `TemplateDefinition` | `CanvasTemplate \| ReactTemplate` | 双模式支持 |

---

## 快速开始

### 创建第一个 Canvas 模板

```typescript
// src/modules/template/templates/myTemplate.ts
import { CanvasTemplate } from '../core/TemplateEngine';
import { easing, adaptiveLayout, paramGuard, drawUtils } from '../../../engine/templates/templateUtils';

export const myTemplate: CanvasTemplate = {
  id: 'my_first_template',
  name: '我的第一个模板',
  description: '这是一个示例模板，展示如何使用新架构',
  category: 'effect',
  schema: [
    {
      key: 'text',
      label: '显示文字',
      type: 'string',
      default: 'Hello World',
      placeholder: '输入要显示的文字'
    },
    {
      key: 'color',
      label: '文字颜色',
      type: 'color',
      default: '#00d4ff'
    }
  ],

  render: (context) => {
    const { ctx, width, height, progress, params } = context;

    // 1. 获取自适应尺寸 - 内容占满画面的95%
    const availableSize = adaptiveLayout.getAvailableSize(width, height, 0.95);

    // 2. 参数边界保护
    const text = paramGuard.string(params.text, 'Hello World');
    const color = paramGuard.color(params.color, '#00d4ff');

    // 3. 进度边界保护 + 缓动函数
    const p = paramGuard.number(progress, 0, 0, 1);
    const eased = easing.easeOutCubic(p);

    // 4. 计算自适应字体大小
    const fontSize = adaptiveLayout.calculateFontSize(
      ctx, text, availableSize.width, availableSize.height
    );

    // 5. 绘制内容（使用发光效果增强视觉冲击）
    drawUtils.glow(ctx, color, 30 * eased, () => {
      ctx.save();
      ctx.fillStyle = color;
      ctx.font = `bold ${fontSize}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.globalAlpha = eased;
      ctx.fillText(text, 0, 0);
      ctx.restore();
    });
  }
};
```

### 注册模板到引擎

```typescript
// src/modules/template/index.ts
import templateEngine from './core/TemplateEngine';
import { myTemplate } from './templates/myTemplate';

// 注册到模板引擎
templateEngine.registerTemplate(myTemplate);

export { templateEngine };
```

### 同时注册到注册表（用于UI展示）

```typescript
// src/modules/template/index.ts
import templateRegistry from './core/TemplateRegistry';
import { myTemplate } from './templates/myTemplate';

// 仅注册元数据到注册表
templateRegistry.register({
  id: myTemplate.id,
  name: myTemplate.name,
  category: myTemplate.category,
  description: myTemplate.description,
  schema: myTemplate.schema
});
```

---

## 核心概念

### CanvasTemplate 接口（Canvas 2D 模式）

```typescript
interface CanvasTemplate {
  id: string;                      // 唯一标识符
  name: string;                    // 显示名称
  category: TemplateCategory;      // 模板分类
  description?: string;            // 描述说明
  thumbnail?: string;              // 缩略图 URL（可选）
  schema: Array<{                  // 参数定义
    key: string;
    label: string;
    type: string;
    default: any;
    min?: number;
    max?: number;
    step?: number;
    options?: { label: string; value: any }[];
    placeholder?: string;
  }>;
  render: (context: TemplateRenderContext) => void;  // 渲染函数
  initParams?: (duration: number) => Record<string, any>;  // 初始化参数
  validateParams?: (params: Record<string, any>) => boolean;  // 参数验证
}
```

### ReactTemplate 接口（React 模式）

```typescript
interface ReactTemplate {
  id: string;                      // 唯一标识符
  name: string;                    // 显示名称
  category: TemplateCategory;      // 模板分类
  description?: string;            // 描述说明
  thumbnail?: string;              // 缩略图 URL（可选）
  schema: Array<{                  // 参数定义（同上）
    key: string;
    label: string;
    type: string;
    default: any;
    min?: number;
    max?: number;
    step?: number;
    options?: { label: string; value: any }[];
    placeholder?: string;
  }>;
  component: (props: {             // React组件函数
    frame: number;
    fps: number;
    params: Record<string, any>;
    width: number;
    height: number;
  }) => ReactElement;
  initParams?: (duration: number) => Record<string, any>;
  validateParams?: (params: Record<string, any>) => boolean;
}
```

### AnyTemplate 联合类型

```typescript
type AnyTemplate = CanvasTemplate | ReactTemplate;
type TemplateDefinition = LegacyTemplateDefinition | ReactTemplate;
```

### TemplateRenderContext 接口

```typescript
interface TemplateRenderContext {
  ctx: CanvasRenderingContext2D;   // Canvas 2D 上下文
  width: number;                   // 画布宽度
  height: number;                  // 画布高度
  progress: number;                // 当前进度 (0-1)
  time: number;                    // 当前时间（秒）
  duration: number;                // 片段总时长（秒）
  params: Record<string, any>;     // 用户参数
}

// 扩展上下文（用于renderTemplate方法）
interface TemplateRenderContextExtended extends TemplateRenderContext {
  frame: number;                   // 当前帧号
  fps: number;                     // 帧率
}
```

**重要说明**：渲染器已经通过 `ctx.translate(centerX, centerY)` 将坐标原点移动到画布中心，所以所有绘制操作都应该相对于中心点 `(0, 0)` 进行。

### 参数类型

| 类型 | 说明 | 示例 |
|------|------|------|
| `string` | 单行文本 | 快捷键输入 |
| `number` | 数字（带滑块） | 大小、透明度 |
| `color` | 颜色选择器 | 背景色、文字色 |
| `boolean` | 布尔值（复选框） | 显示/隐藏 |
| `select` | 下拉选择 | 预设选项 |
| `textarea` | 多行文本 | 简短说明 |
| `code` | 代码编辑器 | 代码内容 |

---

## 双模式渲染系统

### 架构设计

新架构支持两种渲染模式，可以无缝切换和互转：

```
┌─────────────────────────────────────────────┐
│              TemplateEngine                  │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────────┐    ┌─────────────────────┐ │
│  │ CanvasMode  │    │    ReactMode        │ │
│  │             │    │                     │ │
│  │ • render()  │◄──►│ • component()       │ │
│  │ • 2D Context│    │ • JSX/React         │ │
│  │ • 高性能    │    │ • 声明式            │ │
│  └─────────────┘    └─────────────────────┘ │
│           │                    │            │
│           ▼                    ▼            │
│  ┌─────────────────────────────────────┐   │
│  │     createTemplateWrapper()          │   │
│  │  (Canvas → React 自动包装器)          │   │
│  └─────────────────────────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

### 模式检测

```typescript
import templateEngine from '@/modules/template/core/TemplateEngine';

const templateType = templateEngine.detectTemplateType(template);
// 返回: 'canvas' | 'react'

// 检测逻辑:
if ('component' in template && typeof template.component === 'function') {
  return 'react';  // React模式
}
if ('render' in template && typeof template.render === 'function') {
  return 'canvas';  // Canvas模式
}
```

### Canvas → React 包装器

将现有 Canvas 模板自动转换为 React 组件：

```typescript
import templateEngine from '@/modules/template/core/TemplateEngine';

const canvasTemplate: CanvasTemplate = { /* ... */ };

// 自动包装为React模板
const reactTemplate = templateEngine.createTemplateWrapper(canvasTemplate);

// 现在可以在React中使用
<reactTemplate.component
  frame={currentFrame}
  fps={30}
  params={templateParams}
  width={1920}
  height={1080}
/>
```

### 使用场景建议

| 场景 | 推荐模式 | 原因 |
|------|---------|------|
| 复杂粒子系统 | Canvas | 高性能绑定GPU |
| 文字排版 | React | 利用CSS布局能力 |
| SVG图形 | React | 声明式操作简单 |
| 实时预览编辑 | React | 热重载友好 |
| 最终渲染导出 | Canvas | 帧级精确控制 |

---

## 模板引擎API

### TemplateEngine 类

**文件位置**: `src/modules/template/core/TemplateEngine.ts`

#### 核心方法

##### renderTemplate()

渲染指定模板到Canvas上下文：

```typescript
import templateEngine from '@/modules/template/core/TemplateEngine';

const result = templateEngine.renderTemplate('my_template_id', {
  ctx: canvasContext,
  width: 1920,
  height: 1080,
  progress: 0.5,
  time: 1.5,
  duration: 3,
  params: { text: 'Hello', color: '#00d4ff' },
  frame: 45,
  fps: 30
});

// 返回值
interface RenderResult {
  success: boolean;
  error?: string;
  data?: unknown;
}

if (!result.success) {
  console.error('渲染失败:', result.error);
}
```

**注意**: React模板无法直接渲染到Canvas，会返回 `{ success: false, error: '...' }`

##### getTemplate()

获取单个模板定义：

```typescript
const template = templateEngine.getTemplate('my_template_id');
if (template) {
  console.log('模板名称:', template.name);
  console.log('模板类别:', template.category);
}
```

##### detectTemplateType()

检测模板类型：

```typescript
const type = templateEngine.detectTemplateType(template);
// 'canvas' | 'react'
```

##### createTemplateWrapper()

将Canvas模板包装为React模板：

```typescript
const reactTemplate = templateEngine.createTemplateWrapper(canvasTemplate);
// 返回一个新的ReactTemplate对象，包含原始属性 + component函数
```

##### registerTemplate() / unregisterTemplate()

注册/注销模板：

```typescript
// 注册
templateEngine.registerTemplate(myTemplate);

// 注销
templateEngine.unregisterTemplate('my_template_id');
```

##### getAllTemplates() / getTemplatesByCategory()

查询模板列表：

```typescript
// 获取所有模板
const allTemplates = templateEngine.getAllTemplates();

// 按分类获取
const effectTemplates = templateEngine.getTemplatesByCategory('effect');
```

##### getDefaultParams()

获取模板默认参数：

```typescript
const defaults = templateEngine.getDefaultParams('my_template_id');
// 返回: { key: defaultValue, ... }
```

---

## 模板注册表API

### TemplateRegistry 类

**文件位置**: `src/modules/template/core/TemplateRegistry.ts`

> **用途**: 存储模板元数据（不含渲染逻辑），主要用于UI展示、搜索、分类管理。

#### 核心方法

##### register()

注册模板定义（仅元数据）：

```typescript
import templateRegistry from '@/modules/template/core/TemplateRegistry';

templateRegistry.register({
  id: 'my_template',
  name: '我的模板',
  category: 'text',
  description: '描述信息',
  schema: [
    { key: 'text', label: '文字', type: 'string', default: 'Hello' }
  ]
});
```

##### get()

通过ID获取模板：

```typescript
const template = templateRegistry.get('my_template');
// 返回: TemplateDefinition | undefined
```

##### getByCategory()

按分类获取模板列表：

```typescript
const textTemplates = templateRegistry.getByCategory('text');
// 返回: TemplateDefinition[]
```

##### getAll()

获取全部模板：

```typescript
const allTemplates = templateRegistry.getAll();
// 返回: TemplateDefinition[]
```

##### getDefaultParams()

获取默认参数：

```typescript
const params = templateRegistry.getDefaultParams('my_template');
// 返回: { text: 'Hello' }
```

##### 其他实用方法

```typescript
// 搜索模板（模糊匹配名称、ID、描述）
const results = templateRegistry.search('发光');

// 检查是否存在
const exists = templateRegistry.has('my_template');

// 获取所有分类
const categories = templateRegistry.getCategories();
// ['text', 'ui', 'background', 'effect', 'transition']

// 获取数量统计
const totalCount = templateRegistry.getCount();
const categoryCount = templateRegistry.getCountByCategory('text');

// 清空注册表
templateRegistry.clear();

// 注销单个模板
templateRegistry.unregister('my_template');
```

### TemplateEngine vs TemplateRegistry 对比

| 特性 | TemplateEngine | TemplateRegistry |
|------|---------------|-----------------|
| **存储内容** | 完整模板（含render/component） | 元数据（仅id/name/schema等） |
| **主要用途** | 渲染执行 | UI展示、搜索、管理 |
| **内存占用** | 较大（含函数引用） | 较小（纯数据） |
| **适用场景** | 运行时渲染 | 模板选择面板、预设管理 |

---

## React上下文系统

### TemplateContext

**文件位置**: `src/modules/template/core/TemplateContext.tsx`

提供React模板运行时的上下文数据。

#### TemplateProvider

包裹子组件提供模板上下文：

```tsx
import { TemplateProvider } from '@/modules/template/core/TemplateContext';

function App() {
  return (
    <TemplateProvider
      frame={currentFrame}
      fps={30}
      params={templateParams}
      width={1920}
      height={1080}
    >
      {/* 子组件可以通过hooks访问上下文 */}
      <MyTemplateComponent />
    </TemplateProvider>
  );
}
```

#### Hooks API

##### useTemplateFrame()

获取当前帧号：

```tsx
import { useTemplateFrame } from '@/modules/template/core/TemplateContext';

function MyComponent() {
  const frame = useTemplateFrame();
  return <div>当前帧: {frame}</div>;
}
```

##### useTemplateParams()

获取当前模板参数：

```tsx
import { useTemplateParams } from '@/modules/template/core/TemplateContext';

function MyComponent() {
  const params = useTemplateParams();
  return <div style={{ color: params.color }}>{params.text}</div>;
}
```

##### useTemplateSize()

获取画布尺寸：

```tsx
import { useTemplateSize } from '@/modules/template/core/TemplateContext';

function MyComponent() {
  const { width, height } = useTemplateSize();
  return (
    <svg width={width} height={height}>
      {/* SVG内容 */}
    </svg>
  );
}
```

##### useTemplateContext()

获取完整上下文：

```tsx
import { useTemplateContext } from '@/modules/template/core/TemplateContext';

function MyComponent() {
  const context = useTemplateContext();
  // { frame, fps, params, width, height }

  const progress = context.frame / context.fps / duration;
  // ...
}
```

#### 默认值

```typescript
const DEFAULT_CONTEXT_VALUE = {
  frame: 0,
  fps: 30,
  params: {},
  width: 1920,
  height: 1080,
};
```

---

## 自适应布局系统

### 核心原则

**所有模板内容必须占满视频画面的 95%**，不留过多空隙。这是为了确保视觉效果具有冲击力。

### 使用自适应布局工具

```typescript
import { adaptiveLayout } from '../../../engine/templates/templateUtils';

render: (context) => {
  const { ctx, width, height, progress, params } = context;

  // 获取可用区域（占满画面的95%）
  const availableSize = adaptiveLayout.getAvailableSize(width, height, 0.95);
  const availWidth = availableSize.width;
  const availHeight = availableSize.height;

  // 计算自适应字体大小
  const fontSize = adaptiveLayout.calculateFontSize(
    ctx,
    '要显示的文本',
    availWidth,
    availHeight,
    1  // 行数
  );

  // 计算缩放比例
  const scale = adaptiveLayout.calculateScale(
    contentWidth,    // 内容原始宽度
    contentHeight,   // 内容原始高度
    availWidth,      // 目标宽度
    availHeight,     // 目标高度
    0.95             // 填充比例
  );
}
```

### 自适应布局最佳实践

```typescript
// ✅ 正确：使用自适应布局
render: (context) => {
  const { ctx, width, height, progress } = context;

  // 获取可用区域
  const { width: availWidth, height: availHeight } =
    adaptiveLayout.getAvailableSize(width, height, 0.95);

  // 根据可用区域计算元素大小
  const elementSize = Math.min(availWidth, availHeight) * 0.8;

  ctx.fillRect(-elementSize/2, -elementSize/2, elementSize, elementSize);
}

// ❌ 错误：使用固定尺寸
render: (context) => {
  const { ctx, width, height, progress } = context;

  // 固定尺寸会导致在不同分辨率下显示不一致
  ctx.fillRect(-100, -100, 200, 200);  // 不要这样做！
}
```

---

## 缓动函数与动画

### 缓动函数库

```typescript
import { easing } from '../../../engine/templates/templateUtils';

// 常用缓动函数
const eased = easing.easeOutCubic(progress);     // 平滑减速
const elastic = easing.easeOutElastic(progress); // 弹性效果
const bounce = easing.easeOutBounce(progress);   // 弹跳效果
const back = easing.easeOutBack(progress);       // 回弹效果
```

### 缓动函数选择指南

| 缓动函数 | 效果 | 适用场景 |
|---------|------|---------|
| `easeOutQuad` | 开始快，结束慢 | 淡入效果 |
| `easeOutCubic` | 平滑减速 | 滑入效果 |
| `easeOutQuart` | 强烈减速 | 强调进入 |
| `easeOutElastic` | 弹性效果 | 弹跳进入 |
| `easeOutBack` | 回弹效果 | 强调效果 |
| `easeOutBounce` | 弹跳效果 | 活泼动画 |
| `easeInOutCubic` | 两头慢，中间快 | 转场动画 |

### 创建丝滑动画的关键

```typescript
render: (context) => {
  const { ctx, width, height, progress, time } = context;

  // 1. 使用缓动函数 - 不要直接使用线性进度
  const p = paramGuard.number(progress, 0, 0, 1);
  const eased = easing.easeOutCubic(p);

  // 2. 添加多阶段动画
  // 阶段1: 快速进入 (0-30%)
  const enterProgress = Math.min(1, p / 0.3);
  const enterEased = easing.easeOutBack(enterProgress);

  // 阶段2: 保持 (30-70%)
  const holdProgress = p > 0.3 && p < 0.7 ? 1 : 0;

  // 阶段3: 退出 (70-100%)
  const exitProgress = p > 0.7 ? (p - 0.7) / 0.3 : 0;
  const exitEased = easing.easeInCubic(exitProgress);

  // 3. 添加微动画增强反馈感
  const microBounce = Math.sin(time * 10) * 0.02 * (1 - p);

  // 4. 组合动画
  const finalScale = enterEased * (1 + microBounce) * (1 - exitEased * 0.5);
}
```

---

## 开发规范（重要）

### 必须遵守的规则

#### 1. 参数边界保护

```typescript
import { paramGuard } from '../../../engine/templates/templateUtils';

render: (context) => {
  const { params } = context;

  // 使用 paramGuard 进行边界保护
  const text = paramGuard.string(params.text, '默认文字');
  const size = paramGuard.number(params.size, 50, 10, 200);
  const color = paramGuard.color(params.color, '#ffffff');
  const enabled = paramGuard.boolean(params.enabled, true);
}
```

#### 2. 进度边界保护

```typescript
render: (context) => {
  const { progress } = context;

  // 确保进度在 0-1 范围内
  const p = paramGuard.number(progress, 0, 0, 1);

  // 应用缓动函数
  const eased = easing.easeOutCubic(p);
}
```

#### 3. 使用自适应布局（必须）

```typescript
render: (context) => {
  const { ctx, width, height } = context;

  // 必须获取自适应尺寸
  const availableSize = adaptiveLayout.getAvailableSize(width, height, 0.95);

  // 基于可用尺寸计算元素大小
  // ... 绘制代码
}
```

#### 4. Canvas 状态管理

```typescript
render: (context) => {
  const { ctx } = context;

  // 保存当前状态
  ctx.save();

  // 修改状态并绘制
  ctx.fillStyle = '#ff0000';
  ctx.fillRect(-50, -50, 100, 100);

  // 恢复状态
  ctx.restore();
}
```

#### 5. 视觉效果增强

```typescript
render: (context) => {
  const { ctx, progress } = context;

  // 使用发光效果增强视觉冲击
  drawUtils.glow(ctx, '#00d4ff', 30 * progress, () => {
    ctx.fillText('发光文字', 0, 0);
  });

  // 使用阴影增加层次感
  drawUtils.shadowRect(
    ctx, -50, -50, 100, 100,
    '#ffffff',      // 颜色
    '#000000',      // 阴影颜色
    20,             // 阴影模糊
    5, 5            // 阴影偏移
  );
}
```

### 完整的模板模板

```typescript
import { CanvasTemplate } from '@/modules/template/core/TemplateEngine';
import {
  easing,
  adaptiveLayout,
  colorUtils,
  drawUtils,
  animationUtils,
  paramGuard
} from '../../../engine/templates/templateUtils';

export const template: CanvasTemplate = {
  id: 'category_template_name',
  name: '模板名称',
  description: '模板描述说明',
  category: 'effect',
  schema: [
    {
      key: 'text',
      label: '显示文字',
      type: 'string',
      default: 'Hello',
      placeholder: '输入文字'
    },
    {
      key: 'color',
      label: '颜色',
      type: 'color',
      default: '#00d4ff'
    },
    {
      key: 'intensity',
      label: '强度',
      type: 'number',
      default: 1,
      min: 0.1,
      max: 3,
      step: 0.1
    }
  ],

  render: (context) => {
    const { ctx, width, height, progress, time, duration, params } = context;

    // 1. 获取自适应尺寸（必须）
    const { width: availWidth, height: availHeight } =
      adaptiveLayout.getAvailableSize(width, height, 0.95);

    // 2. 参数边界保护
    const text = paramGuard.string(params.text, 'Hello');
    const color = paramGuard.color(params.color, '#00d4ff');
    const intensity = paramGuard.number(params.intensity, 1, 0.1, 3);

    // 3. 进度边界保护 + 缓动函数
    const p = paramGuard.number(progress, 0, 0, 1);
    const eased = easing.easeOutCubic(p);

    // 4. 计算自适应字体大小
    const fontSize = adaptiveLayout.calculateFontSize(
      ctx, text, availWidth, availHeight
    );

    // 5. 添加微动画增强反馈感
    const microAnim = Math.sin(time * 8) * 0.03 * (1 - p);

    // 6. 绘制内容（带发光效果）
    drawUtils.glow(ctx, color, 25 * intensity * eased, () => {
      ctx.save();
      ctx.fillStyle = color;
      ctx.font = `bold ${fontSize}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // 应用动画
      ctx.scale(1 + microAnim, 1 + microAnim);
      ctx.globalAlpha = eased;

      ctx.fillText(text, 0, 0);
      ctx.restore();
    });
  },

  initParams: (duration: number) => ({
    text: 'Hello',
    color: '#00d4ff',
    intensity: 1
  }),

  validateParams: (params: Record<string, any>) => {
    return params.text && params.text.length > 0;
  }
};
```

---

## 模板工具库

**文件位置**: `src/engine/templates/templateUtils.ts`（路径不变）

### 缓动函数 (easing)

```typescript
import { easing } from '../../../engine/templates/templateUtils';

// 线性
easing.linear(t)

// 二次缓动
easing.easeInQuad(t)
easing.easeOutQuad(t)
easing.easeInOutQuad(t)

// 三次缓动
easing.easeInCubic(t)
easing.easeOutCubic(t)  // 最常用
easing.easeInOutCubic(t)

// 四次缓动
easing.easeInQuart(t)
easing.easeOutQuart(t)
easing.easeInOutQuart(t)

// 特殊效果
easing.easeOutElastic(t)  // 弹性
easing.easeOutBack(t)     // 回弹
easing.easeOutBounce(t)   // 弹跳
```

### 自适应布局 (adaptiveLayout)

```typescript
import { adaptiveLayout } from '../../../engine/templates/templateUtils';

// 获取可用区域尺寸
const { width, height } = adaptiveLayout.getAvailableSize(
  canvasWidth,
  canvasHeight,
  0.95  // 填充比例
);

// 计算自适应字体大小
const fontSize = adaptiveLayout.calculateFontSize(
  ctx,
  '文本内容',
  maxWidth,
  maxHeight,
  maxLines
);

// 计算缩放比例
const scale = adaptiveLayout.calculateScale(
  contentWidth,
  contentHeight,
  targetWidth,
  targetHeight,
  fillRatio
);
```

### 颜色工具 (colorUtils)

```typescript
import { colorUtils } from '../../../engine/templates/templateUtils';

// 调整颜色亮度
const lighter = colorUtils.adjustBrightness('#ff0000', 30);
const darker = colorUtils.adjustBrightness('#ff0000', -30);

// 转换为 RGBA
const rgba = colorUtils.toRgba('#ff0000', 0.5);
```

### 绘制工具 (drawUtils)

```typescript
import { drawUtils } from '../../../engine/templates/templateUtils';

// 绘制圆角矩形
drawUtils.roundedRect(ctx, x, y, width, height, radius);
ctx.fill();

// 绘制带阴影的矩形
drawUtils.shadowRect(
  ctx, x, y, width, height,
  color, shadowColor, shadowBlur, offsetX, offsetY
);

// 绘制发光效果
drawUtils.glow(ctx, glowColor, intensity, () => {
  // 在回调中绘制内容
  ctx.fillText('发光文字', 0, 0);
});
```

### 动画工具 (animationUtils)

```typescript
import { animationUtils } from '../../../engine/templates/templateUtils';

// 循环进度
const looped = animationUtils.loopProgress(progress, cycles);

// 往返动画（0->1->0）
const pingPong = animationUtils.pingPong(progress);

// 脉冲效果
const pulse = animationUtils.pulse(progress, frequency);

// 延迟动画
const delayed = animationUtils.delay(progress, delayAmount);
```

### 参数保护 (paramGuard)

```typescript
import { paramGuard } from '../../../engine/templates/templateUtils';

// 保护数字参数
const num = paramGuard.number(value, defaultValue, min, max);

// 保护字符串参数
const str = paramGuard.string(value, defaultValue);

// 保护布尔参数
const bool = paramGuard.boolean(value, defaultValue);

// 保护颜色参数
const color = paramGuard.color(value, defaultValue);
```

### TemplateBase 基类（可选使用）

```typescript
import { TemplateBase } from '../../../engine/templates/templateUtils';

class MyTemplate extends TemplateBase {
  render(): void {
    // 自动访问 this.ctx, this.width, this.height 等
    const size = this.getAdaptiveSize(0.95);
    const fontSize = this.calculateAdaptiveFontSize('Text', size.width, size.height);
    const p = this.guardProgress(this.progress);

    // 绘制代码...
  }
}
```

---

## 模板分类列表（50+完整版）

### Text（文字效果）- 15个

| ID | 名称 | 说明 |
|---|------|------|
| `text_split` | 分割文字 | 文字逐字分割显示 |
| `text_blur` | 模糊文字 | 从模糊到清晰 |
| `text_circular` | 圆形文字 | 圆形排列文字 |
| `text_typewriter` | 打字机 | 打字机效果 |
| `text_shiny` | 闪烁文字 | 闪光效果 |
| `text_gradient` | 渐变文字 | 渐变色填充 |
| `text_falling` | 下落文字 | 字符下落动画 |
| `text_decrypted` | 解密文字 | 解密显示效果 |
| `text_glitch` | 故障文字 | 故障艺术风格 |
| `text_scroll_reveal` | 滚动揭示 | 滚动显示文字 |
| `text_count_up` | 计数器 | 数字递增动画 |
| `text_pressure` | 文字压力 | 按压变形效果 |
| `text_gradual_blur` | 渐进模糊 | 渐进式模糊 |
| `text_ascii` | ASCII艺术 | ASCII字符转换 |
| `text_scrambled` | 乱序文字 | 字符乱序重组 |

### UI（UI组件）- 10个

| ID | 名称 | 说明 |
|---|------|------|
| `ui_elastic_button` | 弹性按钮 | 弹性动画按钮 |
| `ui_card_flip` | 卡片翻转 | 3D翻转卡片 |
| `ui_card_3d` | 3D卡片 | 3D透视卡片 |
| `ui_spotlight_card` | 聚光灯卡片 | 聚光灯效果 |
| `ui_border_glow` | 边框发光 | 发光边框效果 |
| `ui_magnet_button` | 磁性按钮 | 磁吸效果按钮 |
| `ui_glass_card` | 玻璃卡片 | 毛玻璃效果 |
| `ui_card_stack` | 卡片堆叠 | 卡片堆叠动画 |
| `ui_accordion` | 手风琴 | 手风琴展开 |
| `ui_tabs` | 标签页 | 标签页切换 |

### Background（背景效果）- 10个

| ID | 名称 | 说明 |
|---|------|------|
| `background_liquid_ether` | 液态以太 | 流体动态背景 |
| `background_aurora` | 极光 | 北极光效果 |
| `background_waves` | 波浪 | 波浪动画 |
| `background_silk` | 丝绸 | 丝绸飘动效果 |
| `background_particles` | 粒子 | 粒子系统背景 |
| `background_grid_distortion` | 网格变形 | 网格扭曲效果 |
| `background_light_rays` | 光线射线 | 光线放射效果 |
| `background_beams` | 光束 | 光束扫描效果 |
| `background_galaxy` | 星空银河 | 星空旋转效果 |
| `background_noise_texture` | 噪点纹理 | 噪点纹理背景 |

### Effect（视觉特效）- 10个

| ID | 名称 | 说明 |
|---|------|------|
| `effect_particle_explosion` | 粒子爆炸 | 粒子爆炸特效 |
| `effect_halo_expand` | 光晕扩散 | 光晕扩展效果 |
| `effect_energy_ring` | 能量环 | 能量环旋转 |
| `effect_shockwave` | 冲击波 | 冲击波扩散 |
| `effect_magic_circle` | 魔法阵 | 魔法阵绘制 |
| `effect_data_stream` | 数据流 | 数据流动画 |
| `effect_code_rain` | 代码雨 | 黑客帝国风格 |
| `effect_matrix` | 矩阵 | 矩阵数字雨 |
| `effect_fire` | 火焰 | 火焰粒子效果 |
| `effect_smoke` | 烟雾 | 烟雾弥漫效果 |

### Transition（转场效果）- 5个

| ID | 名称 | 说明 |
|---|------|------|
| `transition_fade` | 淡入淡出 | 渐变过渡 |
| `transition_slide` | 滑动转场 | 滑动切换 |
| `transition_zoom` | 缩放转场 | 缩放过渡 |
| `transition_rotate` | 旋转转场 | 旋转变换 |
| `transition_blur` | 模糊转场 | 模糊过渡 |

**总计: 50+ 模板**

---

## 在新架构中创建模板

### 步骤1: 创建模板文件

```typescript
// src/modules/template/templates/text/pulsingGlowText.ts
import { CanvasTemplate } from '../../core/TemplateEngine';
import { easing, adaptiveLayout, paramGuard, drawUtils, animationUtils } from '../../../../engine/templates/templateUtils';

export const pulsingGlowText: CanvasTemplate = {
  id: 'text_pulsing_glow',
  name: '脉冲发光文字',
  description: '带有脉冲发光效果的文字动画',
  category: 'text',
  schema: [
    { key: 'text', label: '文字内容', type: 'string', default: 'NANO EDIT' },
    { key: 'color', label: '文字颜色', type: 'color', default: '#00d4ff' },
    { key: 'pulseSpeed', label: '脉冲速度', type: 'number', default: 2, min: 0.5, max: 5, step: 0.1 },
    { key: 'glowIntensity', label: '发光强度', type: 'number', default: 30, min: 10, max: 100, step: 5 }
  ],

  render: (context) => {
    const { ctx, width, height, progress, time, params } = context;

    const availSize = adaptiveLayout.getAvailableSize(width, height, 0.95);
    const text = paramGuard.string(params.text, 'NANO EDIT');
    const color = paramGuard.color(params.color, '#00d4ff');
    const pulseSpeed = paramGuard.number(params.pulseSpeed, 2, 0.5, 5);
    const glowIntensity = paramGuard.number(params.glowIntensity, 30, 10, 100);

    const p = paramGuard.number(progress, 0, 0, 1);
    const eased = easing.easeOutCubic(p);

    // 脉冲效果
    const pulse = animationUtils.pulse(time * pulseSpeed, 1);
    const currentGlow = glowIntensity * (0.7 + pulse * 0.3);

    const fontSize = adaptiveLayout.calculateFontSize(
      ctx, text, availSize.width, availSize.height
    );

    // 绘制发光文字
    drawUtils.glow(ctx, color, currentGlow * eased, () => {
      ctx.save();
      ctx.fillStyle = color;
      ctx.font = `bold ${fontSize}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.globalAlpha = eased;
      ctx.fillText(text, 0, 0);
      ctx.restore();
    });
  }
};

export default pulsingGlowText;
```

### 步骤2: 注册到模板引擎

```typescript
// src/modules/template/templates/text/index.ts
export { pulsingGlowText } from './pulsingGlowText';
// ... 其他文字模板
```

```typescript
// src/modules/template/index.ts
import templateEngine from './core/TemplateEngine';
import templateRegistry from './core/TemplateRegistry';
import { pulsingGlowText } from './templates/text/pulsingGlowText';

// 注册到引擎（完整模板，可渲染）
templateEngine.registerTemplate(pulsingGlowText);

// 注册到注册表（元数据，用于UI展示）
templateRegistry.register({
  id: pulsingGlowText.id,
  name: pulsingGlowText.name,
  category: pulsingGlowText.category,
  description: pulsingGlowText.description,
  schema: pulsingGlowText.schema
});

export { templateEngine, templateRegistry };
```

### 步骤3: 在应用中使用

```typescript
// 在组件中使用
import { templateEngine } from '@/modules/template';

// 方式1: 直接渲染到Canvas
const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');
const result = templateEngine.renderTemplate('text_pulsing_glow', {
  ctx,
  width: 1920,
  height: 1080,
  progress: 0.5,
  time: 1.5,
  duration: 3,
  params: { text: 'Hello World', color: '#00d4ff' },
  frame: 45,
  fps: 30
});

// 方式2: 获取模板信息用于UI
const templateInfo = templateRegistry.get('text_pulsing_glow');
console.log('模板名称:', templateInfo?.name);
console.log('参数schema:', templateInfo?.schema);
```

### 创建React模板示例

```typescript
// src/modules/template/templates/ui/reactButton.tsx
import React from 'react';
import { ReactTemplate } from '../../core/TemplateEngine';

export const reactButton: ReactTemplate = {
  id: 'ui_react_button',
  name: 'React按钮',
  description: '使用React实现的弹性按钮',
  category: 'ui',
  schema: [
    { key: 'label', label: '按钮标签', type: 'string', default: 'Click Me' },
    { key: 'bgColor', label: '背景色', type: 'color', default: '#2a2a2a' },
    { key: 'textColor', label: '文字色', type: 'color', default: '#ffffff' }
  ],

  component: ({ frame, fps, params, width, height }) => {
    const progress = Math.min(1, Math.max(0, (frame / fps) / 2));
    const scale = 0.8 + 0.2 * progress;

    return (
      <button
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          padding: '20px 40px',
          fontSize: '24px',
          backgroundColor: params.bgColor || '#2a2a2a',
          color: params.textColor || '#ffffff',
          border: 'none',
          borderRadius: '12px',
          cursor: 'pointer',
          opacity: progress,
          transition: 'transform 0.1s ease-out'
        }}
      >
        {params.label || 'Click Me'}
      </button>
    );
  }
};
```

---

## Store API 参考

### useProjectStore

项目级别的状态管理，管理轨道、片段、时间轴等。

```typescript
import { useProjectStore } from '@/store/useProjectStore';

// 获取store实例
const store = useProjectStore.getState();

// 主要方法
store.addAssets(assets: Asset[]);                          // 添加素材
store.removeAsset(id: string);                              // 删除素材
store.addClip(asset, trackId, time, type);                   // 添加片段
store.updateClip(id, changes: Partial<Clip>);               // 更新片段
store.removeClip(id: string);                               // 删除片段
store.addTrack(type: TrackType);                            // 添加轨道
store.addEffectToClip(clipId, presetId);                    // 添加预设效果
store.addTemplateClip(templateId, trackId, time);           // 添加模板片段
```

### useTrackStore

轨道级别的状态管理，管理轨道可见性、锁定等。

```typescript
import { useTrackStore } from '@/store/useTrackStore';

const trackStore = useTrackStore.getState();

trackStore.toggleTrackVisibility(trackId);     // 切换轨道可见性
trackStore.toggleTrackLock(trackId);           // 切换轨道锁定
trackStore.reorderTracks(trackIds);            // 重排轨道顺序
trackStore.addTrack(type);                      // 添加轨道
trackStore.removeTrack(trackId);               // 删除轨道
```

### useAssetStore

素材库的状态管理，管理图片、视频、音频等素材。

```typescript
import { useAssetStore } from '@/asset/useAssetStore';

const assetStore = useAssetStore.getState();

assetStore.addAsset(asset: Asset);              // 添加素材
assetStore.removeAsset(id: string);             // 删除素材
assetStore.updateAsset(id, changes);            // 更新素材
assetStore.getAssets();                         // 获取所有素材
assetStore.getAssetById(id);                    // 通过ID获取素材
assetStore.importAssets(files: File[]);         // 导入素材文件
```

### Store 协作示例

```typescript
async function createTemplateClip() {
  const projectStore = useProjectStore.getState();
  const assetStore = useAssetStore.getState();

  // 1. 从素材库获取或添加素材
  const assets = assetStore.getAssets();

  // 2. 添加模板片段到项目
  const clip = projectStore.addTemplateClip(
    'text_typewriter',    // 模板ID
    'track_text_1',       // 目标轨道
    0                     // 开始时间
  );

  if (clip) {
    // 3. 更新片段参数
    projectStore.updateClip(clip.id, {
      templateParams: {
        text: 'Hello World',
        color: '#00d4ff',
        fontSize: 48
      },
      duration: 4
    });

    // 4. 应用入场效果
    projectStore.addEffectToClip(clip.id, 'entrance_fade_in');
  }
}
```

---

## 模板示例

### 示例 1：脉冲发光文字

```typescript
import { CanvasTemplate } from '@/modules/template/core/TemplateEngine';
import { easing, adaptiveLayout, paramGuard, drawUtils, animationUtils } from '../../../engine/templates/templateUtils';

export const pulsingGlowText: CanvasTemplate = {
  id: 'text_pulsing_glow',
  name: '脉冲发光文字',
  description: '带有脉冲发光效果的文字动画',
  category: 'text',
  schema: [
    { key: 'text', label: '文字内容', type: 'string', default: 'NANO EDIT' },
    { key: 'color', label: '文字颜色', type: 'color', default: '#00d4ff' },
    { key: 'pulseSpeed', label: '脉冲速度', type: 'number', default: 2, min: 0.5, max: 5, step: 0.1 },
    { key: 'glowIntensity', label: '发光强度', type: 'number', default: 30, min: 10, max: 100, step: 5 }
  ],

  render: (context) => {
    const { ctx, width, height, progress, time, params } = context;

    const availSize = adaptiveLayout.getAvailableSize(width, height, 0.95);
    const text = paramGuard.string(params.text, 'NANO EDIT');
    const color = paramGuard.color(params.color, '#00d4ff');
    const pulseSpeed = paramGuard.number(params.pulseSpeed, 2, 0.5, 5);
    const glowIntensity = paramGuard.number(params.glowIntensity, 30, 10, 100);

    const p = paramGuard.number(progress, 0, 0, 1);
    const eased = easing.easeOutCubic(p);

    // 脉冲效果
    const pulse = animationUtils.pulse(time * pulseSpeed, 1);
    const currentGlow = glowIntensity * (0.7 + pulse * 0.3);

    const fontSize = adaptiveLayout.calculateFontSize(
      ctx, text, availSize.width, availSize.height
    );

    // 绘制发光文字
    drawUtils.glow(ctx, color, currentGlow * eased, () => {
      ctx.save();
      ctx.fillStyle = color;
      ctx.font = `bold ${fontSize}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.globalAlpha = eased;
      ctx.fillText(text, 0, 0);
      ctx.restore();
    });
  }
};
```

### 示例 2：弹性按键

```typescript
import { CanvasTemplate } from '@/modules/template/core/TemplateEngine';
import { easing, adaptiveLayout, paramGuard, drawUtils, colorUtils } from '../../../engine/templates/templateUtils';

export const elasticButton: CanvasTemplate = {
  id: 'ui_elastic_button',
  name: '弹性按键',
  description: '带有弹性动画的按键效果',
  category: 'ui',
  schema: [
    { key: 'label', label: '按键标签', type: 'string', default: 'CLICK' },
    { key: 'bgColor', label: '背景颜色', type: 'color', default: '#2a2a2a' },
    { key: 'textColor', label: '文字颜色', type: 'color', default: '#ffffff' },
    { key: 'accentColor', label: '强调颜色', type: 'color', default: '#00d4ff' }
  ],

  render: (context) => {
    const { ctx, width, height, progress, params } = context;

    const availSize = adaptiveLayout.getAvailableSize(width, height, 0.95);
    const label = paramGuard.string(params.label, 'CLICK');
    const bgColor = paramGuard.color(params.bgColor, '#2a2a2a');
    const textColor = paramGuard.color(params.textColor, '#ffffff');
    const accentColor = paramGuard.color(params.accentColor, '#00d4ff');

    const p = paramGuard.number(progress, 0, 0, 1);

    // 弹性进入动画
    const enterProgress = Math.min(1, p / 0.4);
    const elasticScale = easing.easeOutElastic(enterProgress);

    // 计算按键大小（占满可用区域）
    const buttonSize = Math.min(availSize.width, availSize.height) * 0.8;
    const cornerRadius = buttonSize * 0.1;

    ctx.save();
    ctx.scale(elasticScale, elasticScale);

    // 绘制发光边框
    drawUtils.glow(ctx, accentColor, 20 * p, () => {
      drawUtils.roundedRect(
        ctx, -buttonSize/2, -buttonSize/2,
        buttonSize, buttonSize, cornerRadius
      );
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 4;
      ctx.stroke();
    });

    // 绘制背景
    drawUtils.roundedRect(
      ctx, -buttonSize/2, -buttonSize/2,
      buttonSize, buttonSize, cornerRadius
    );
    ctx.fillStyle = bgColor;
    ctx.fill();

    // 绘制文字
    const fontSize = adaptiveLayout.calculateFontSize(
      ctx, label, buttonSize * 0.8, buttonSize * 0.5
    );
    ctx.fillStyle = textColor;
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 0, 0);

    ctx.restore();
  }
};
```

---

## 模板导入导出

### 从代码导入模板

```typescript
import { registerTemplateFromCode, validateTemplateCode } from '../templateImporter';

// 验证模板代码
const code = `
export const myTemplate = {
  id: 'custom_template',
  name: '自定义模板',
  // ...
};
`;

const validation = validateTemplateCode(code);
if (validation.valid) {
  const result = registerTemplateFromCode(code);
  if (result.success) {
    console.log('模板导入成功:', result.template?.name);
  } else {
    console.error('导入失败:', result.error);
  }
}
```

### 导出模板为代码

```typescript
import { exportTemplateToCode } from '../templateImporter';

const templateCode = exportTemplateToCode(myTemplate);
console.log(templateCode);
```

### 获取模板代码模板

```typescript
import { getTemplateCodeTemplate } from '../templateImporter';

// 获取一个空模板代码作为起点
const templateCode = getTemplateCodeTemplate();
```

---

## 高级技巧

### 1. 多阶段动画

```typescript
render: (context) => {
  const { progress } = context;
  const p = paramGuard.number(progress, 0, 0, 1);

  // 阶段1: 进入 (0-30%)
  if (p < 0.3) {
    const phaseProgress = p / 0.3;
    const eased = easing.easeOutBack(phaseProgress);
    // ... 进入动画
  }
  // 阶段2: 保持 (30-70%)
  else if (p < 0.7) {
    const phaseProgress = (p - 0.3) / 0.4;
    // ... 保持动画（可以添加微动画）
  }
  // 阶段3: 退出 (70-100%)
  else {
    const phaseProgress = (p - 0.7) / 0.3;
    const eased = easing.easeInCubic(phaseProgress);
    // ... 退出动画
  }
}
```

### 2. 粒子系统

```typescript
render: (context) => {
  const { ctx, width, height, progress, time } = context;

  const particleCount = 50;

  for (let i = 0; i < particleCount; i++) {
    // 使用固定种子确保粒子位置一致
    const seed = i * 137.5;
    const baseX = (Math.sin(seed) * 0.5 + 0.5) * width;
    const baseY = (Math.cos(seed) * 0.5 + 0.5) * height;

    // 基于时间和进度计算位置
    const offsetY = (progress * 200 + time * 50) % height;
    const x = baseX - width / 2;
    const y = baseY - height / 2 - offsetY;

    // 绘制粒子
    const size = 2 + Math.sin(seed * 10) * 1;
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.5 + Math.sin(time * 3 + i) * 0.3;
    ctx.fillRect(x, y, size, size);
  }
}
```

### 3. 渐变效果

```typescript
render: (context) => {
  const { ctx, width, height } = context;

  // 线性渐变
  const gradient = ctx.createLinearGradient(-width/2, -height/2, width/2, height/2);
  gradient.addColorStop(0, '#ff0000');
  gradient.addColorStop(0.5, '#00ff00');
  gradient.addColorStop(1, '#0000ff');

  ctx.fillStyle = gradient;
  ctx.fillRect(-width/2, -height/2, width, height);
}
```

### 4. 调试技巧

```typescript
render: (context) => {
  const { ctx, width, height, progress, params } = context;

  // 在控制台查看参数
  if (progress < 0.01) {
    console.log('Template params:', params);
  }

  // 绘制调试信息
  ctx.save();
  ctx.fillStyle = '#ff0000';
  ctx.font = '12px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(`Progress: ${progress.toFixed(2)}`, -width/2 + 10, -height/2 + 20);
  ctx.restore();
}
```

### 5. 双模式适配

如果需要同时支持Canvas和React渲染，可以这样组织代码：

```typescript
// src/modules/template/templates/myDualModeTemplate.ts
import { CanvasTemplate, ReactTemplate } from '../../core/TemplateEngine';

// Canvas版本
export const canvasVersion: CanvasTemplate = {
  id: 'dual_mode_template',
  name: '双模式模板',
  category: 'effect',
  schema: [ /* ... */ ],
  render: (context) => {
    // Canvas 2D渲染逻辑
  }
};

// React版本（可选）
export const reactVersion: ReactTemplate = {
  ...canvasVersion,
  component: ({ frame, fps, params, width, height }) => {
    // React渲染逻辑
    return <div>{/* JSX */}</div>;
  }
};

// 或者使用引擎的自动包装器
import templateEngine from '../../core/TemplateEngine';
const autoWrapped = templateEngine.createTemplateWrapper(canvasVersion);
```

---

## 最佳实践总结

1. **新架构路径** - 使用 `src/modules/template/` 作为主要开发路径
2. **双模式支持** - 根据需求选择 Canvas 或 React 模式
3. **引擎+注册表** - TemplateEngine负责渲染，TemplateRegistry负责管理
4. **自适应布局** - 始终使用 `adaptiveLayout.getAvailableSize()` 确保内容占满画面的95%
5. **参数保护** - 使用 `paramGuard` 保护所有参数
6. **缓动函数** - 使用缓动函数让动画丝滑流畅
7. **视觉增强** - 使用发光、阴影等效果增强视觉冲击
8. **微动画** - 添加细微的动画增强反馈感
9. **状态管理** - 正确使用 `ctx.save()` 和 `ctx.restore()`
10. **性能优化** - 避免在 render 中创建大量对象
11. **Store协作** - 配合 useProjectStore/useTrackStore/useAssetStore 使用
12. **Hooks使用** - React模板中使用 useTemplateFrame/useTemplateParams/useTemplateSize

遵循这些规范，您就能在新架构下创建出视觉效果冲击力强烈、动画丝滑流畅的模板效果！
