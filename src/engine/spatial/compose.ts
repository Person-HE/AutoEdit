// 空间变换合成：统一的 CSS transform 字符串生成（预览、选中框共用）
// 字段与 Clip.transform 对齐：x/y 平移、depthZ→translateZ、rotateX/Y、rotation(2D)、skewX/Y
import type { Transform } from '../../types/core';

/** 舞台透视距离（px）。所有视觉片段共享同一灭点 */
export const STAGE_PERSPECTIVE_PX = 1600;

const fmtDeg = (v?: number) => (v && Math.abs(v) > 1e-4 ? `${(+v).toFixed(2)}deg` : '');
const n2 = (v?: number) => (v ? +(+v).toFixed(2) : 0);
const n1 = (v?: number) => (v ? +(+v).toFixed(1) : 0);

export function composeTransformCss(t: Partial<Transform>, scaleOverride?: number): string {
  const parts: string[] = ['translate(-50%, -50%)'];
  parts.push(`translate3d(${n2(t.x)}px, ${n2(t.y)}px, ${n1(t.depthZ)}px)`);
  const rx = fmtDeg(t.rotateX); if (rx) parts.push(`rotateX(${rx})`);
  const ry = fmtDeg(t.rotateY); if (ry) parts.push(`rotateY(${ry})`);
  const rz = fmtDeg(t.rotation); if (rz) parts.push(`rotate(${rz})`);
  const sx = fmtDeg(t.skewX); if (sx) parts.push(`skewX(${sx})`);
  const sy = fmtDeg(t.skewY); if (sy) parts.push(`skewY(${sy})`);
  parts.push(`scale(${Math.max(0.001, +(scaleOverride ?? t.scale ?? 1).toFixed(4))})`);
  return parts.filter(Boolean).join(' ');
}

/** 是否存在超出平面的 3D 值（决定舞台是否需要开启 perspective） */
export function hasActive3D(transforms: Array<Partial<Transform>>): boolean {
  for (const t of transforms) {
    if ((t.depthZ && Math.abs(t.depthZ) > 0.5) ||
        (t.rotateX && Math.abs(t.rotateX) > 0.05) ||
        (t.rotateY && Math.abs(t.rotateY) > 0.05)) return true;
  }
  return false;
}
