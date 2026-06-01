export const linear = (t: number) => t;

export const easeInQuad = (t: number) => t * t;
export const easeOutQuad = (t: number) => t * (2 - t);
export const easeInOutQuad = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

export const easeInCubic = (t: number) => t * t * t;
export const easeOutCubic = (t: number) => { const t1 = t - 1; return t1 * t1 * t1 + 1; };
export const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;

export const easeInQuart = (t: number) => t * t * t * t;
export const easeOutQuart = (t: number) => { const t1 = t - 1; return 1 - t1 * t1 * t1 * t1; };
export const easeInOutQuart = (t: number) => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t;

export const easeInQuint = (t: number) => t * t * t * t * t;
export const easeOutQuint = (t: number) => { const t1 = t - 1; return t1 * t1 * t1 * t1 * t1 + 1; };
export const easeInOutQuint = (t: number) => t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t;

export const easeInExpo = (t: number) => t === 0 ? 0 : Math.pow(2, 10 * (t - 1));
export const easeOutExpo = (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
export const easeInOutExpo = (t: number) => {
  if (t === 0 || t === 1) return t;
  return t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2;
};

export const easeOutElastic = (t: number) => {
  if (t === 0 || t === 1) return t;
  const p = 0.3;
  return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
};

export const easeOutBack = (t: number) => {
  const s = 1.70158;
  const t1 = t - 1;
  return t1 * t1 * ((s + 1) * t1 + s) + 1;
};

export const easeOutBounce = (t: number) => {
  const n1 = 7.5625;
  const d1 = 2.75;
  if (t < 1 / d1) return n1 * t * t;
  if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
  if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
  return n1 * (t -= 2.625 / d1) * t + 0.984375;
};

export const easeInBounce = (t: number) => 1 - easeOutBounce(1 - t);
export const easeInOutBounce = (t: number) => t < 0.5 ? (1 - easeOutBounce(1 - 2 * t)) / 2 : (1 + easeOutBounce(2 * t - 1)) / 2;

export function spring(t: number, stiffness: number = 180, damping: number = 12, mass: number = 1): number {
  const omega0 = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));
  if (zeta < 1) {
    const omegaD = omega0 * Math.sqrt(1 - zeta * zeta);
    const duration = 1;
    const time = t * duration;
    const envelope = Math.exp(-zeta * omega0 * time);
    return 1 - envelope * (Math.cos(omegaD * time) + (zeta * omega0 / omegaD) * Math.sin(omegaD * time));
  } else if (zeta === 1) {
    const duration = 1;
    const time = t * duration;
    return 1 - Math.exp(-omega0 * time) * (1 + omega0 * time);
  } else {
    const duration = 1;
    const time = t * duration;
    const s1 = (-zeta + Math.sqrt(zeta * zeta - 1)) * omega0;
    const s2 = (-zeta - Math.sqrt(zeta * zeta - 1)) * omega0;
    const A = (s2 / (s2 - s1));
    const B = (-s1 / (s2 - s1));
    return 1 - (A * Math.exp(s1 * time) + B * Math.exp(s2 * time));
  }
}

export function springBounce(t: number, bounces: number = 4, decay: number = 3.5): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const phase = t * bounces * Math.PI;
  const envelope = 1 - Math.pow(t, decay);
  const oscillation = Math.cos(phase);
  return 1 - envelope * (1 - oscillation) * 0.5;
}

export function criticalSpring(t: number, overshoot: number = 0.15): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const c4 = (2 * Math.PI) / 3;
  return t === 0 ? 0 : t === 1 ? 1 :
    Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
}

export function gravityBounce(t: number, restitution: number = 0.6, gravity: number = 9.8): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const totalTime = Math.sqrt(2 / gravity);
  const scaledTime = t * totalTime * 3;
  let currentHeight = 1;
  let velocity = 0;
  let currentTime = 0;
  const dt = 0.001;
  let lastBounceTime = 0;
  while (currentTime < scaledTime && currentTime < totalTime * 10) {
    velocity -= gravity * dt;
    currentHeight += velocity * dt;
    currentTime += dt;
    if (currentHeight <= 0) {
      currentHeight = 0;
      velocity = Math.abs(velocity) * restitution;
      lastBounceTime = currentTime;
      if (velocity < 0.01) break;
    }
  }
  return 1 - currentHeight;
}

export function momentumEase(t: number, mass: number = 1, friction: number = 0.3): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const v0 = 1 + friction;
  const decay = friction / mass;
  const velocity = v0 * Math.exp(-decay * t * 5);
  const position = (v0 / decay) * (1 - Math.exp(-decay * t * 5));
  const maxPos = (v0 / decay) * (1 - Math.exp(-decay * 5));
  return position / maxPos;
}

export function snapSpring(t: number, tension: number = 300, friction: number = 28): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const w0 = Math.sqrt(tension);
  const zeta = friction / (2 * w0);
  const wd = zeta < 1 ? w0 * Math.sqrt(1 - zeta * zeta) : 0;
  const b = zeta < 1 ? 1 / (zeta * w0) * Math.atan(wd / (zeta * w0)) : 1;
  const scaledT = t * 2;
  if (zeta < 1) {
    const envelope = Math.exp(-zeta * w0 * scaledT);
    return 1 - envelope * Math.cos(wd * scaledT);
  }
  return 1 - Math.exp(-w0 * scaledT) * (1 + w0 * scaledT);
}

export function elasticOut(t: number, amplitude: number = 1, period: number = 0.3): number {
  if (t === 0 || t === 1) return t;
  const s = period / 4;
  return amplitude * Math.pow(2, -10 * t) * Math.sin((t - s) * (2 * Math.PI) / period) + 1;
}

export function whipEffect(t: number, whipStrength: number = 0.4): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const fastStart = Math.pow(t, 0.3);
  const overshoot = Math.sin(t * Math.PI * 1.5) * whipStrength * (1 - t);
  return Math.min(1, Math.max(0, fastStart + overshoot));
}

export function inertiaDecay(t: number, initialVelocity: number = 3, drag: number = 2): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const v = initialVelocity * Math.exp(-drag * t);
  const pos = (initialVelocity / drag) * (1 - Math.exp(-drag * t));
  const maxPos = (initialVelocity / drag) * (1 - Math.exp(-drag));
  return pos / maxPos;
}

export function perlinNoise1D(t: number, frequency: number = 1, seed: number = 0): number {
  const x = t * frequency + seed;
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  const hash = (n: number) => {
    let h = n * 127.1 + seed * 311.7;
    h = Math.sin(h) * 43758.5453;
    return h - Math.floor(h);
  };
  return hash(i) * (1 - u) + hash(i + 1) * u;
}

export function dampedOscillation(t: number, frequency: number = 3, dampingRatio: number = 0.3): number {
  return Math.exp(-dampingRatio * t * 6) * Math.sin(t * frequency * Math.PI * 2);
}

export function bezierEase(t: number, x1: number, y1: number, x2: number, y2: number): number {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  function sampleCurveX(s: number) { return ((ax * s + bx) * s + cx) * s; }
  function sampleCurveY(s: number) { return ((ay * s + by) * s + cy) * s; }
  function sampleCurveDerivativeX(s: number) { return (3 * ax * s + 2 * bx) * s + cx; }
  function solveCurveX(x: number) {
    let t2 = x;
    for (let i = 0; i < 8; i++) {
      const x2 = sampleCurveX(t2) - x;
      if (Math.abs(x2) < 1e-6) return t2;
      const d2 = sampleCurveDerivativeX(t2);
      if (Math.abs(d2) < 1e-6) break;
      t2 -= x2 / d2;
    }
    return t2;
  }
  return sampleCurveY(solveCurveX(t));
}

export const Easing = {
  linear,
  easeInQuad, easeOutQuad, easeInOutQuad,
  easeInCubic, easeOutCubic, easeInOutCubic,
  easeInQuart, easeOutQuart, easeInOutQuart,
  easeInQuint, easeOutQuint, easeInOutQuint,
  easeInExpo, easeOutExpo, easeInOutExpo,
  easeOutElastic, easeOutBack, easeOutBounce,
  easeInBounce, easeInOutBounce,
  spring, springBounce, criticalSpring,
  gravityBounce, momentumEase, snapSpring,
  elasticOut, whipEffect, inertiaDecay,
  perlinNoise1D, dampedOscillation, bezierEase,
};
