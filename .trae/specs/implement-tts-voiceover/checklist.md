# TTS 文本配音功能检查清单

## TTS 服务
- [x] `src/services/ttsService.ts` 文件创建完成
- [x] TTS 服务能够正确调用本地 Index-TTS API
- [x] 生成配音返回有效的音频 URL
- [x] 错误处理机制正常工作

## 音频引擎
- [x] `src/engine/core/AudioEngine.ts` 文件创建完成
- [x] AudioEngine 类实现完整
- [x] 音频上下文管理正常工作
- [x] 音频缓冲区缓存机制正常工作
- [x] ✅ `loadAudio` 方法在发起请求前标记 `loadedUrls`
- [x] ✅ `loadVoiceOverAudio` 方法在发起请求前标记 `loadedUrls`
- [x] 配音音频加载和播放正常工作
- [x] 音频同步方法随视频帧正确调用

## 核心类型
- [x] `VoiceOverConfig` 接口定义完整
- [x] `TextClip` 类型扩展了 `voiceOver` 字段
- [x] TypeScript 编译无错误

## Store 操作
- [x] `generateVoiceOver` 方法正常工作
- [x] `removeVoiceOver` 方法正常工作
- [x] `updateVoiceOverConfig` 方法正常工作

## 属性面板 UI
- [x] 文本片段显示配音配置区域
- [x] 配音文本输入框正常工作
- [x] "生成配音"按钮正常工作
- [x] "删除配音"按钮正常工作
- [x] 配音生成状态显示正确

## 视频导出（Bug 修复）
- [x] ✅ `VideoExporter` 类添加了 `playedAudioClips` 属性
- [x] ✅ `exportProject` 方法开始时清空 `playedAudioClips`
- [x] ✅ `playAudioForCurrentTime` 方法检查并记录已播放的音频
- [x] 普通音频 Clip 导出时只播放一次
- [x] 配音音频 Clip 导出时只播放一次
- [x] 导出视频包含正确的配音音频

## 预览集成
- [x] AudioEngine 在预览播放器中正确初始化
- [x] 预览时配音随视频同步播放
- [x] 预览时没有请求洪水问题
- [x] 预览时音频播放流畅无卡顿

## 功能测试
- [x] 可以为文本片段生成配音
- [x] 可以删除文本片段的配音
- [x] 预览时听到正确的配音
- [x] 导出视频包含正确的配音
- [x] 多个文本片段的配音互不干扰
