import { Project, Asset, Clip } from '../../types/core';

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private sources: Map<string, AudioBufferSourceNode> = new Map();
  private buffers: Map<string, AudioBuffer> = new Map();
  private voiceOverBuffers: Map<string, AudioBuffer> = new Map();
  private gainNode: GainNode | null = null;
  private lastSyncTime: number = -1;
  private loadedUrls: Set<string> = new Set();

  constructor() {
    this.initAudioContext();
  }

  private initAudioContext(): void {
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
    }
  }

  async loadAudio(url: string, assetId: string): Promise<void> {
    if (!this.audioContext) return;
    if (this.buffers.has(assetId)) return;
    if (this.loadedUrls.has(url)) return;

    // 修复：在发起请求前立即标记为已加载，防止 Request Flood
    this.loadedUrls.add(url);

    try {
      console.log(`Loading audio: ${assetId} from ${url.substring(0, 50)}...`);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch audio: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();

      if (arrayBuffer.byteLength === 0) {
        console.warn(`Empty audio buffer for ${assetId}`);
        return;
      }

      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.buffers.set(assetId, audioBuffer);

      console.log(`Audio loaded: ${assetId}, duration: ${audioBuffer.duration}s`);
    } catch (error) {
      console.error(`Failed to load audio asset ${assetId}:`, error);
    }
  }

  // 加载配音音频
  async loadVoiceOverAudio(clipId: string, audioUrl: string): Promise<void> {
    if (!this.audioContext) return;
    if (this.voiceOverBuffers.has(clipId)) return;
    if (this.loadedUrls.has(audioUrl)) return;

    // 修复：在发起请求前立即标记为已加载，防止 Request Flood
    this.loadedUrls.add(audioUrl);

    try {
      console.log(`Loading voice over: ${clipId}`);

      const response = await fetch(audioUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch voice over: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();

      if (arrayBuffer.byteLength === 0) {
        console.warn(`Empty voice over buffer for ${clipId}`);
        return;
      }

      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.voiceOverBuffers.set(clipId, audioBuffer);

      console.log(`Voice over loaded: ${clipId}, duration: ${audioBuffer.duration}s`);
    } catch (error) {
      console.error(`Failed to load voice over for clip ${clipId}:`, error);
    }
  }

  async loadResources(assets: Asset[]): Promise<void> {
    const audioAssets = assets.filter(a => a.type === 'audio' && a.url);

    console.log(`Loading ${audioAssets.length} audio resources`);

    const loadPromises = audioAssets.map(asset =>
      this.loadAudio(asset.url, asset.id)
    );

    await Promise.all(loadPromises);
  }

  sync(currentTime: number, isPlaying: boolean, project: Project): void {
    if (!this.audioContext || !this.gainNode) return;

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    // 获取活动的音频 Clip
    const activeAudioClips = Object.values(project.clips || {}).filter(clip =>
      clip.type === 'audio' &&
      currentTime >= clip.startTime &&
      currentTime < clip.startTime + clip.duration
    );

    // 获取带有配音的文本 Clip
    const voiceOverClips = Object.values(project.clips || {}).filter(clip =>
      clip.type === 'text' &&
      clip.voiceOver?.audioSource &&
      !clip.voiceOver?.linkedClipId &&
      currentTime >= clip.startTime &&
      currentTime < clip.startTime + clip.duration
    );

    // 预加载配音音频
    voiceOverClips.forEach(clip => {
      if (clip.voiceOver?.audioSource) {
        this.loadVoiceOverAudio(clip.id, clip.voiceOver.audioSource);
      }
    });

    // 停止不再活动的音频
    this.sources.forEach((source, clipId) => {
      const clip = (project.clips || {})[clipId];
      const isActive = activeAudioClips.find(c => c.id === clipId) ||
                       voiceOverClips.find(c => c.id === clipId);
      if (!clip || !isActive || !isPlaying) {
        try {
          source.stop();
        } catch (e) {}
        this.sources.delete(clipId);
      }
    });

    if (!isPlaying) {
      this.sources.forEach((source) => {
        try {
          source.stop();
        } catch (e) {}
      });
      this.sources.clear();
      this.lastSyncTime = -1;
      return;
    }

    const timeDelta = Math.abs(currentTime - this.lastSyncTime);
    const needsResync = timeDelta > 0.1;

    if (needsResync) {
      this.sources.forEach((source, clipId) => {
        try {
          source.stop();
        } catch (e) {}
        this.sources.delete(clipId);
      });
    }

    // 播放普通音频 Clip
    activeAudioClips.forEach(clip => {
      if (!this.sources.has(clip.id)) {
        const buffer = this.buffers.get(clip.assetId);
        if (buffer) {
          try {
            const source = this.audioContext!.createBufferSource();
            source.buffer = buffer;
            source.connect(this.gainNode!);

            const playOffset = currentTime - clip.startTime + clip.offset;

            if (playOffset < buffer.duration && playOffset >= 0) {
              const remainingDuration = buffer.duration - playOffset;
              const clipRemaining = clip.duration - (currentTime - clip.startTime);
              const duration = Math.min(remainingDuration, clipRemaining);

              console.log(`Playing audio clip ${clip.id} at offset ${playOffset.toFixed(2)}s for ${duration.toFixed(2)}s`);

              source.start(0, playOffset, duration);
              this.sources.set(clip.id, source);

              source.onended = () => {
                this.sources.delete(clip.id);
              };
            }
          } catch (error) {
            console.error(`Failed to play audio clip ${clip.id}:`, error);
          }
        } else {
          console.warn(`Buffer not found for clip ${clip.id}, asset ${clip.assetId}`);
        }
      }
    });

    // 播放配音
    voiceOverClips.forEach(clip => {
      if (!this.sources.has(clip.id) && clip.voiceOver?.audioSource) {
        const buffer = this.voiceOverBuffers.get(clip.id);
        if (buffer) {
          try {
            const source = this.audioContext!.createBufferSource();
            source.buffer = buffer;
            source.connect(this.gainNode!);

            const playOffset = currentTime - clip.startTime;

            if (playOffset < buffer.duration && playOffset >= 0) {
              const remainingDuration = buffer.duration - playOffset;
              const clipRemaining = clip.duration - (currentTime - clip.startTime);
              const duration = Math.min(remainingDuration, clipRemaining);

              console.log(`Playing voice over for clip ${clip.id} at offset ${playOffset.toFixed(2)}s for ${duration.toFixed(2)}s`);

              source.start(0, playOffset, duration);
              this.sources.set(clip.id, source);

              source.onended = () => {
                this.sources.delete(clip.id);
              };
            }
          } catch (error) {
            console.error(`Failed to play voice over for clip ${clip.id}:`, error);
          }
        }
      }
    });

    this.lastSyncTime = currentTime;
  }

  setVolume(volume: number): void {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  stop(): void {
    this.sources.forEach((source) => {
      try {
        source.stop();
      } catch (e) {}
    });
    this.sources.clear();
    this.lastSyncTime = -1;
  }

  pause(): void {
    this.stop();
  }

  resume(): void {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  dispose(): void {
    this.stop();
    this.buffers.clear();
    this.voiceOverBuffers.clear();
    this.loadedUrls.clear();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.gainNode = null;
  }
}

export const audioEngine = new AudioEngine();
