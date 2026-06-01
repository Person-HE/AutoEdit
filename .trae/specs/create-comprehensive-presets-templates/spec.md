# 全面预设和模板系统开发 Spec

## Why
用户希望基于 React Bits (reactbits.dev) 和 Aceternity UI (ui.aceternity.com) 提供的丝滑动画效果，创建全面的预设和模板系统，用于视频编辑器的各种场景和效果。

## What Changes
- 创建 50+ 个新预设 (Presets)，涵盖进场、出场、强调、移位、视觉特效等类别
- 创建 30+ 个新模板 (Templates)，涵盖文字动画、UI组件、背景效果、转场等场景
- 所有预设和模板遵循现有的开发规范，确保代码正确、动画丝滑
- 参考 TEMPLATE_DEVELOPMENT_GUIDE.md 和 PRESET_DEVELOPMENT_GUIDE.md 的开发标准

## Impact
- Affected specs: 新增预设和模板功能
- Affected code: src/engine/presets/, src/engine/templates/

## ADDED Requirements

### Requirement: 预设系统扩展
The system SHALL 提供全面的预设集合，包括：

#### 进场动画 (Entrance) - 15个
- 淡入系列: fadeIn, fadeInUp, fadeInDown, fadeInLeft, fadeInRight
- 滑入系列: slideInUp, slideInDown, slideInLeft, slideInRight
- 缩放系列: zoomIn, zoomInUp, zoomInDown
- 弹性系列: bounceIn, elasticIn, backIn
- 翻转系列: flipInX, flipInY
- 旋转系列: rotateIn

#### 出场动画 (Exit) - 10个
- 淡出系列: fadeOut, fadeOutUp, fadeOutDown
- 滑出系列: slideOutUp, slideOutDown, slideOutLeft, slideOutRight
- 缩放系列: zoomOut, zoomOutUp
- 弹性系列: bounceOut

#### 强调动画 (Emphasis) - 15个
- 脉冲系列: pulse, pulseRing, pulseGlow
- 抖动系列: shake, shakeX, shakeY
- 弹跳系列: bounce, bounceSoft
- 闪烁系列: flash, flashSoft
- 摇摆系列: swing, wobble
- 心跳系列: heartbeat
- 呼吸系列: breathe
- 抖动文字: jitter

#### 移位动画 (Motion) - 10个
- 悬浮系列: float, floatX, floatY
- 漂移系列: drift, driftSlow
- 轨道系列: orbit, orbitSlow
- 摆动系列: sway
- 螺旋系列: spiral
- 波浪系列: wave

#### 视觉特效 (FX) - 15个
- 发光系列: glow, glowPulse, glowRainbow
- 模糊系列: blur, blurIn, blurOut
- 阴影系列: shadow, shadowLift
- 色彩系列: hueRotate, saturate, contrast
- 毛玻璃系列: glassmorphism
- 故障系列: glitch, glitchCyber
- 霓虹系列: neon, neonPulse
- 扫描线: scanline

#### 转场动画 (Transition) - 5个
- 交叉溶解: crossDissolve
- 擦除系列: wipeLeft, wipeRight
- 翻页: pageFlip
- 立方体: cubeRotate

### Requirement: 模板系统扩展
The system SHALL 提供全面的模板集合，包括：

#### 文字动画模板 (Text) - 15个
- 分割文字: splitText (字符逐个动画)
- 模糊文字: blurText (模糊到清晰)
- 圆形文字: circularText (环形排列)
- 打字机效果: typewriter
- 闪烁文字: shinyText
- 渐变文字: gradientText
- 下落文字: fallingText
- 解密文字: decryptedText (乱码到文字)
- 故障文字: glitchText
- 滚动文字: scrollReveal
- 计数器: countUp
- 文字压力: textPressure
- 模糊循环: gradualBlur
- ASCII艺术: asciiText
- 文字乱序: scrambledText

#### UI组件模板 (UI) - 10个
- 弹性按钮: elasticButton
- 卡片翻转: cardFlip
- 3D卡片: card3D
- 聚光灯卡片: spotlightCard
- 边框发光: borderGlow
- 磁性按钮: magnetButton
- 玻璃拟态: glassCard
- 堆叠卡片: cardStack
- 手风琴: accordion
- 标签页: tabs

#### 背景效果模板 (Background) - 10个
- 液态以太: liquidEther
- 极光效果: aurora
- 粒子系统: particles
- 波浪效果: waves
- 网格变形: gridDistortion
- 光线射线: lightRays
- 星空银河: galaxy
- 噪点纹理: noiseTexture
- 光束效果: beams
- 丝绸效果: silk

#### 特效模板 (Effect) - 10个
- 粒子爆炸: particleExplosion
- 光晕扩散: haloExpand
- 能量环: energyRing
- 冲击波: shockwave
- 魔法阵: magicCircle
- 数据流: dataStream
- 代码雨: codeRain
- 矩阵效果: matrix
- 火焰效果: fire
- 烟雾效果: smoke

#### 转场模板 (Transition) - 5个
- 淡入淡出: fadeTransition
- 滑动转场: slideTransition
- 缩放转场: zoomTransition
- 旋转转场: rotateTransition
- 模糊转场: blurTransition

## 开发规范

### 预设开发要求
1. 所有预设必须包含参数边界保护
2. 所有预设必须使用缓动函数确保动画丝滑
3. Scale 最小值保护: Math.max(0.001, scaleValue)
4. Opacity 最小值保护: Math.max(0.01, opacityValue)
5. 保留原有变换: { ...currentTransform, ... }

### 模板开发要求
1. 所有模板必须使用自适应布局: adaptiveLayout.getAvailableSize(width, height, 0.95)
2. 所有模板必须使用参数保护: paramGuard
3. 所有模板必须使用缓动函数: easing
4. 内容占满画面95%
5. 使用发光、阴影等效果增强视觉冲击

### 代码质量要求
1. 避免语法错误
2. 遵循 TypeScript 类型规范
3. 正确导入依赖
4. 正确注册到索引文件
