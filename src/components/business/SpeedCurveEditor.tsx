// 曲线变速编辑器：Canvas 绘制 + 指针拖拽控制点
// X 轴为片段进度(0..1)，Y 轴为瞬时速度(SPEED_MIN..MAX 对数刻度，1× 参考线加亮)
import React, { memo, useCallback, useEffect, useRef } from 'react';
import { SPEED_MIN, SPEED_MAX, normalizePoints, SPEED_CURVE_PRESETS, presetToPoints, curveAverage } from '../../engine/timing/speedCurve';
import { useProjectStore } from '../../store/useProjectStore';
import type { Clip, SpeedPoint } from '../../types/core';

const PAD_L = 34;
const PAD_R = 8;
const PAD_T = 8;
const PAD_B = 18;

interface Props {
  clip: Clip;
  width?: number;
  height?: number;
}

function vToY(v: number, h: number): number {
  const innerH = h - PAD_T - PAD_B;
  const lv = (Math.log(Math.max(SPEED_MIN, Math.min(SPEED_MAX, v))) - Math.log(SPEED_MIN)) / (Math.log(SPEED_MAX) - Math.log(SPEED_MIN));
  return h - PAD_B - lv * innerH;
}

function yToV(y: number, h: number): number {
  const innerH = h - PAD_T - PAD_B;
  const frac = Math.min(1, Math.max(0, (h - PAD_B - y) / innerH));
  return Math.exp(Math.log(SPEED_MIN) + frac * (Math.log(SPEED_MAX) - Math.log(SPEED_MIN)));
}

export const SpeedCurveEditor: React.FC<Props> = memo(({ clip, width = 272, height = 148 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const draggingRef = useRef<number | null>(null);

  const points = normalizePoints(clip.speedCurve);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  const setPoints = useCallback((next: SpeedPoint[]) => {
    useProjectStore.getState().updateClip(clip.id, { speedCurve: next });
  }, [clip.id]);

  // ---- 绘制 ----
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    cv.width = width * dpr;
    cv.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const plotW = width - PAD_L - PAD_R;

    // 网格
    ctx.font = '9px system-ui, sans-serif';
    ctx.textBaseline = 'middle';
    for (const gv of [0.25, 0.5, 1, 2, 4]) {
      const y = vToY(gv, height);
      ctx.strokeStyle = gv === 1 ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.07)';
      ctx.setLineDash(gv === 1 ? [] : [3, 3]);
      ctx.beginPath();
      ctx.moveTo(PAD_L, y);
      ctx.lineTo(width - PAD_R, y);
      ctx.stroke();
      ctx.fillStyle = gv === 1 ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.25)';
      ctx.fillText(`${gv}×`, 4, y);
    }
    ctx.setLineDash([]);
    for (const gt of [0.25, 0.5, 0.75]) {
      const x = PAD_L + gt * plotW;
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.beginPath();
      ctx.moveTo(x, PAD_T);
      ctx.lineTo(x, height - PAD_B);
      ctx.stroke();
    }

    if (!points || points.length === 0) return;

    // 曲线（分段线性）
    const pt = (p: SpeedPoint) => ({ x: PAD_L + p.t * plotW, y: vToY(p.value, height) });
    ctx.strokeStyle = '#F43F5E';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    points.forEach((p, i) => {
      const c = pt(p);
      i === 0 ? ctx.moveTo(c.x, c.y) : ctx.lineTo(c.x, c.y);
    });
    // 曲线结束后延续到右缘（保持末点值观感）
    const lastC = pt(points[points.length - 1]);
    ctx.lineTo(width - PAD_R, lastC.y);
    ctx.stroke();

    // 控制点
    for (let i = 0; i < points.length; i++) {
      const c = pt(points[i]);
      const isEdge = i === 0 || i === points.length - 1;
      ctx.beginPath();
      ctx.arc(c.x, c.y, isEdge ? 4 : 5, 0, Math.PI * 2);
      ctx.fillStyle = isEdge ? '#ffffff' : '#F43F5E';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }, [points, width, height, dpr]);

  // ---- 交互 ----
  const pointAt = useCallback((clientX: number, clientY: number): { idx: number; x: number; y: number } | null => {
    const cv = canvasRef.current;
    if (!cv) return null;
    const rect = cv.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    if (!points) return null;
    const plotW = width - PAD_L - PAD_R;
    let best = -1;
    let bestDist = 14;
    points.forEach((p, i) => {
      const cx = PAD_L + p.t * plotW;
      const cy = vToY(p.value, height);
      const d = Math.hypot(px - cx, py - cy);
      if (d < bestDist) { bestDist = d; best = i; }
    });
    return best >= 0 ? { idx: best, x: px, y: py } : null;
  }, [points, width, height]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    const hit = pointAt(e.clientX, e.clientY);
    if (!hit) return;
    useProjectStore.getState().markHistory();
    draggingRef.current = hit.idx;
    const move = (ev: PointerEvent) => {
      const cv = canvasRef.current;
      if (!cv || draggingRef.current === null) return;
      const rect = cv.getBoundingClientRect();
      const plotW = width - PAD_L - PAD_R;
      const t = Math.min(1, Math.max(0, (ev.clientX - rect.left - PAD_L) / plotW));
      const v = yToV(ev.clientY - rect.top, height);
      const cur = normalizePoints(useProjectStore.getState().project.clips[clip.id]?.speedCurve) ?? [];
      const next = cur.map((p, i) =>
        i === draggingRef.current
          ? { ...(p as SpeedPoint), t: (i === 0 ? 0 : i === cur.length - 1 ? 1 : Math.round(t * 200) / 200), value: Math.round(v * 100) / 100 }
          : p
      );
      setPoints(next.sort((a, b) => a.t - b.t));
    };
    const up = () => {
      draggingRef.current = null;
      document.removeEventListener('pointermove', move);
    };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up, { once: true });
  }, [pointAt, setPoints, width, height, clip.id]);

  const onDoubleClick = useCallback((e: React.MouseEvent) => {
    const cv = canvasRef.current;
    if (!cv) return;
    const rect = cv.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    if (px < PAD_L - 4 || px > width - PAD_R) return;
    useProjectStore.getState().markHistory();
    const plotW = width - PAD_L - PAD_R;
    const t = Math.min(0.99, Math.max(0.01, Math.round(((px - PAD_L) / plotW) * 200) / 200));
    const v = Math.round(yToV(py, height) * 100) / 100;
    const cur = normalizePoints(useProjectStore.getState().project.clips[clip.id]?.speedCurve)
      ?? [{ t: 0, value: 1 }, { t: 1, value: 1 }];
    const next = [...cur.filter(p => Math.abs(p.t - t) > 0.005), { t, value: v }].sort((a, b) => a.t - b.t);
    setPoints(next);
  }, [setPoints, width, height, clip.id]);

  const onContextMenuPoint = useCallback((e: React.MouseEvent) => {
    const hit = pointAt(e.clientX, e.clientY);
    if (!hit || !points) return;
    e.preventDefault();
    // 固定首尾两个端点不可删
    if (hit.idx === 0 || hit.idx === points.length - 1) return;
    useProjectStore.getState().markHistory();
    setPoints(points.filter((_, i) => i !== hit.idx));
  }, [pointAt, points, setPoints]);

  const applyPreset = (pid: string) => {
    const preset = SPEED_CURVE_PRESETS.find(p => p.id === pid);
    if (!preset) return;
    useProjectStore.getState().markHistory();
    setPoints(presetToPoints(preset));
  };

  const clearCurve = () => {
    useProjectStore.getState().markHistory();
    useProjectStore.getState().updateClip(clip.id, { speedCurve: undefined });
  };

  void curveAverage;

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1">
        {SPEED_CURVE_PRESETS.map(p => (
          <button key={p.id} onClick={() => applyPreset(p.id)}
            className="px-1.5 py-0.5 rounded text-[10px] border border-white/10 text-gray-400 hover:border-rose-400/50 hover:text-rose-300 transition-colors">
            {p.name}
          </button>
        ))}
        <button onClick={clearCurve}
          className="ml-auto px-1.5 py-0.5 rounded text-[10px] text-gray-500 hover:text-red-400 transition-colors" title="恢复恒速">
          ✕ 清除曲线
        </button>
      </div>
      <canvas
        ref={canvasRef}
        style={{ width, height }}
        className="rounded-lg bg-black/25 border border-white/10 cursor-crosshair touch-none"
        onPointerDown={onPointerDown}
        onDoubleClick={onDoubleClick}
        onContextMenu={onContextMenuPoint}
      />
      <div className="text-[9px] text-gray-600 leading-relaxed">
        双击添加控制点 · 拖拽调整 · 右键删除 · 端点固定于首尾
      </div>
    </div>
  );
});

export default SpeedCurveEditor;
