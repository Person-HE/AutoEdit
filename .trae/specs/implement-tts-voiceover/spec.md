# TTS 文本配音功能规格文档

## Why

用户需要为文本片段添加 AI 配音功能，使用本地部署的 Index-TTS 服务生成语音。该功能需要解决两个关键 Bug：
1. 预览时没有声音 - 由于 AudioEngine.ts 中异步加载音频时未提前标记加载状态，导致每秒 60 帧重复发起请求
2. 导出视频没有对应音频 - 由于 videoExporter.ts 中每帧重复调用播放方法，导致音频叠加或上下文异常

## What Changes

### 新增功能
1. **TTS 服务** - 创建 ttsService.ts，集成本地 Index-TTS API 生成语音
2. **音频引擎** - 创建 AudioEngine.ts，管理音频播放和缓存
3. **配音属性面板** - 在 PropertiesPanel.tsx 中添加配音配置 UI
4. **导出音频支持** - 修改 videoExporter.ts，支持导出时混合配音音频

### Bug 修复
1. **修复预览无声问题** - 在 AudioEngine.ts 中提前标记 loadedUrls，防止请求洪水
2. **修复导出无声问题** - 在 VideoExporter 中添加 playedAudioClips Set，防止每帧重复播放

## Impact

### 受影响的文件
- `src/services/ttsService.ts` - 新增 TTS 服务，调用 Index-TTS API
- `src/engine/core/AudioEngine.ts` - 新增音频引擎，管理音频播放（需修复请求洪水 Bug）
- `src/services/videoExporter.ts` - 修改导出逻辑，支持音频混合（需修复重复播放 Bug）
- `src/components/business/PropertiesPanel.tsx` - 添加配音配置 UI
- `src/types/core.ts` - 扩展 TextClip 类型，添加 voiceOver 字段
- `src/store/useProjectStore.ts` - 添加配音相关操作

## ADDED Requirements

### Requirement: TTS 服务
The system SHALL provide a TTS service that generates voice audio using local Index-TTS API.

#### Scenario: 生成配音
- **GIVEN** 用户为文本片段配置了配音
- **WHEN** 调用 TTS 服务生成语音
- **THEN** 返回生成的音频 URL，可用于预览和导出

#### Scenario: 支持中文配音
- **GIVEN** 用户输入中文文本
- **WHEN** 调用 Index-TTS API
- **THEN** 生成自然流畅的中文语音

### Requirement: 音频引擎
The system SHALL provide an AudioEngine that manages audio playback and caching.

#### Scenario: 预览配音
- **GIVEN** 文本片段有配音配置
- **WHEN** 播放头移动到文本片段时间范围
- **THEN** 音频引擎加载并播放对应的配音音频

#### Scenario: 防止请求洪水
- **GIVEN** 音频正在加载中
- **WHEN** 同步方法每秒被调用 60 次
- **THEN** 不会重复发起相同的音频加载请求

### Requirement: 配音属性面板
The system SHALL provide a voice over configuration UI in the properties panel.

#### Scenario: 配置配音
- **GIVEN** 用户选中文本片段
- **WHEN** 在属性面板启用配音并输入文本
- **THEN** 生成配音并关联到该片段

#### Scenario: 删除配音
- **GIVEN** 文本片段已有配音
- **WHEN** 用户点击删除配音按钮
- **THEN** 移除该片段的配音配置

### Requirement: 视频导出音频混合
The system SHALL mix voice over audio into exported videos.

#### Scenario: 导出带配音的视频
- **GIVEN** 项目包含带配音的文本片段
- **WHEN** 用户导出视频
- **THEN** 导出的视频包含正确的配音音频

#### Scenario: 防止重复播放
- **GIVEN** 导出过程中逐帧渲染
- **WHEN** 每帧检查音频播放
- **THEN** 每个音频片段只播放一次，不会重复叠加

## MODIFIED Requirements

### Requirement: TextClip 类型扩展
**Current**: TextClip 只包含文本样式信息
**Modified**: TextClip 新增 voiceOver 字段，存储配音信息

```typescript
export interface VoiceOverConfig {
  text: string;
  audioSource?: string;
  speed?: number;
  volume?: number;
}

export interface TextClip extends Clip {
  type: 'text';
  text: string;
  // ... existing fields
  voiceOver?: VoiceOverConfig;
}
```

### Requirement: AudioEngine 加载逻辑修复
**Current**: 在 await fetch 后才将 url 加入 loadedUrls
**Modified**: 在发起请求前立即标记为已加载

```typescript
async loadAudio(url: string, assetId: string): Promise<void> {
  if (!this.audioContext) return;
  if (this.buffers.has(assetId)) return;
  if (this.loadedUrls.has(url)) return;

  // ✅ 修复：在发起请求前立即标记为已加载
  this.loadedUrls.add(url);

  try {
    const response = await fetch(url);
    // ...
  }
}
```

### Requirement: VideoExporter 播放逻辑修复
**Current**: 每帧都调用 playAudioForCurrentTime，没有记录已播放的音频
**Modified**: 添加 playedAudioClips Set 跟踪已播放的音频

```typescript
export class VideoExporter {
  // ✅ 新增：用于跟踪导出过程中已经播放过的音频 Clip 的 ID
  private playedAudioClips: Set<string> = new Set();

  async exportProject(project, assets, config): Promise<void> {
    this.playedAudioClips.clear(); // ✅ 开始导出时清空记录
    // ...
  }

  private playAudioForCurrentTime(project, assets, currentTime, ...): void {
    for (const clip of audioClips) {
      // ✅ 检查是否已经为该片段创建过播放节点
      if (!this.playedAudioClips.has(clip.id)) {
        this.playedAudioClips.add(clip.id);
        // ... 播放音频
      }
    }
  }
}
```

## REMOVED Requirements

None
