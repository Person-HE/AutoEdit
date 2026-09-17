// 音频峰值提取：时间线波形可视化数据
let sharedCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!sharedCtx) {
    sharedCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return sharedCtx;
}

/**
 * 从音频 URL 计算 min-max 峰值数组（单声道下混、绝对值归一化）。
 * 失败返回 undefined（调用方静默降级为色块显示）。
 */
export async function computePeaksFromUrl(url: string, buckets = 1200): Promise<number[] | undefined> {
  try {
    const resp = await fetch(url);
    if (!resp.ok) return undefined;
    const buf = await resp.arrayBuffer();
    const decoded = await getCtx().decodeAudioData(buf);

    const chCount = Math.min(decoded.numberOfChannels, 2);
    const length = decoded.length;
    const data: Float32Array[] = [];
    for (let c = 0; c < chCount; c++) data.push(decoded.getChannelData(c));

    const out: number[] = [];
    const step = Math.max(1, Math.floor(length / buckets));
    let maxPeak = 0.0001;

    for (let b = 0; b < buckets; b++) {
      const start = b * step;
      const end = Math.min(length, start + step);
      if (start >= end) { out.push(0); continue; }
      let peak = 0;
      for (const channel of data) {
        // 每桶抽样 ~64 点足以还原观感，性能稳定
        const sampleStep = Math.max(1, Math.floor((end - start) / 64));
        for (let i = start; i < end; i += sampleStep) {
          const v = Math.abs(channel[i]);
          if (v > peak) peak = v;
        }
      }
      if (peak > maxPeak) maxPeak = peak;
      out.push(peak);
    }

    // 归一化
    return out.map(v => Math.min(1, v / maxPeak));
  } catch {
    return undefined;
  }
}
