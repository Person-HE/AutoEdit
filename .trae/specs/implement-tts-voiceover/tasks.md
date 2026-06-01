# TTS 文本配音功能开发任务列表

## Task 1: 创建 TTS 服务
- [x] SubTask 1.1: 创建 `src/services/ttsService.ts` 文件
  - 定义 TTS 生成请求接口
  - 实现调用本地 Index-TTS API 的方法
  - 处理 API 响应并返回音频 URL
  - 添加错误处理和重试逻辑

## Task 2: 创建音频引擎（修复预览无声 Bug）
- [x] SubTask 2.1: 创建 `src/engine/core/AudioEngine.ts` 文件
  - 实现 AudioEngine 类
  - 实现音频上下文管理
  - 实现音频缓冲区缓存
  - ✅ 修复：在 `loadAudio` 方法中提前标记 `loadedUrls`，防止请求洪水
  - ✅ 修复：在 `loadVoiceOverAudio` 方法中提前标记 `loadedUrls`
  - 实现配音音频加载和播放
  - 实现音频同步方法（随视频帧调用）

## Task 3: 扩展核心类型支持配音
- [x] SubTask 3.1: 修改 `src/types/core.ts`
  - 添加 `VoiceOverConfig` 接口
  - 扩展 `TextClip` 类型，添加 `voiceOver` 字段

## Task 4: 添加 Store 配音操作
- [x] SubTask 4.1: 修改 `src/store/useProjectStore.ts`
  - 添加 `generateVoiceOver` 方法，调用 TTS 服务生成配音
  - 添加 `removeVoiceOver` 方法，删除片段配音
  - 添加 `updateVoiceOverConfig` 方法，更新配音配置

## Task 5: 添加配音属性面板 UI
- [x] SubTask 5.1: 修改 `src/components/business/PropertiesPanel.tsx`
  - 添加配音配置区域（仅对文本片段显示）
  - 添加配音文本输入框
  - 添加"生成配音"按钮
  - 添加"删除配音"按钮
  - 显示配音生成状态

## Task 6: 修复视频导出无声 Bug
- [x] SubTask 6.1: 修改 `src/services/videoExporter.ts`
  - ✅ 添加 `playedAudioClips: Set<string>` 属性
  - ✅ 在 `exportProject` 方法开始时清空 `playedAudioClips`
  - ✅ 在 `playAudioForCurrentTime` 方法中检查并记录已播放的音频
  - 实现配音音频在导出时的混合

## Task 7: 集成音频引擎到预览播放器
- [x] SubTask 7.1: 修改预览相关组件
  - 在预览播放器中初始化 AudioEngine
  - 将 AudioEngine 与视频播放同步
  - 确保预览时配音正确播放

## Task 8: 测试和验证
- [x] SubTask 8.1: 测试预览配音功能
  - 验证预览时配音正常播放
  - 验证没有请求洪水问题
- [x] SubTask 8.2: 测试导出配音功能
  - 验证导出视频包含配音
  - 验证没有重复播放问题
- [x] SubTask 8.3: 测试配音管理
  - 验证生成配音正常工作
  - 验证删除配音正常工作

# Task Dependencies
- Task 2 依赖 Task 1
- Task 4 依赖 Task 1, Task 3
- Task 5 依赖 Task 3, Task 4
- Task 6 依赖 Task 2
- Task 7 依赖 Task 2
- Task 8 依赖 Task 5, Task 6, Task 7
