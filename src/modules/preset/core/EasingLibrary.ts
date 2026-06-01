export type EasingFunction = (t: number) => number;

const clamp = (t: number): number => Math.max(0, Math.min(1, t));

function powerIn(p: number): EasingFunction {
  return (t) => Math.pow(clamp(t), p);
}

function powerOut(p: number): EasingFunction {
  return (t) => 1 - Math.pow(clamp(1 - t), p);
}

function powerInOut(p: number): EasingFunction {
  return (t) => {
    const ct = clamp(t);
    return ct < 0.5 ? Math.pow(2 * ct, p) / 2 : (2 - Math.pow(2 * (1 - ct), p)) / 2;
  };
}

export const power0 = { in: powerIn(1), out: powerOut(1), inOut: powerInOut(1) };
export const power1 = { in: powerIn(2), out: powerOut(2), inOut: powerInOut(2) };
export const power2 = { in: powerIn(3), out: powerOut(3), inOut: powerInOut(3) };
export const power3 = { in: powerIn(4), out: powerOut(4), inOut: powerInOut(4) };
export const power4 = { in: powerIn(5), out: powerOut(5), inOut: powerInOut(5) };

export const quad = {
  in: (t: number) => t * t,
  out: (t: number) => t * (2 - t),
  inOut: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
};

export const cubic = {
  in: (t: number) => t * t * t,
  out: (t: number) => (--t) * t * t + 1,
  inOut: (t: number) =>
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
};

export const quart = {
  in: (t: number) => t * t * t * t,
  out: (t: number) => 1 - (--t) * t * t * t,
  inOut: (t: number) => (t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t),
};

export const quint = {
  in: (t: number) => t * t * t * t * t,
  out: (t: number) => 1 + (--t) * t * t * t * t,
  inOut: (t: number) =>
    t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t,
};

export const sine = {
  in: (t: number) => 1 - Math.cos((t * Math.PI) / 2),
  out: (t: number) => Math.sin((t * Math.PI) / 2),
  inOut: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,
};

export const circ = {
  in: (t: number) => 1 - Math.sqrt(1 - t * t),
  out: (t: number) => Math.sqrt(1 - (--t) * t),
  inOut: (t: number) =>
    t < 0.5
      ? (1 - Math.sqrt(1 - 4 * t * t)) / 2
      : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2,
};

export const expo = {
  in: (t: number) => (t === 0 ? 0 : Math.pow(2, 10 * t - 10)),
  out: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  inOut: (t: number) => {
    if (t === 0 || t === 1) return t;
    return t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2;
  },
};

export const elastic = {
  in: ((amplitude = 1, period = 0.3): EasingFunction => {
    const s = period / (2 * Math.PI) * Math.asin(1 / amplitude);
    return (t) => {
      if (t === 0) return 0;
      if (t === 1) return 1;
      return -amplitude * Math.pow(2, 10 * (t -= 1)) * Math.sin((t - s) * (2 * Math.PI) / period);
    };
  }) as EasingFunction & { (amplitude?: number, period?: number): EasingFunction },
  out: ((amplitude = 1, period = 0.3): EasingFunction => {
    const s = period / (2 * Math.PI) * Math.asin(1 / amplitude);
    return (t) => {
      if (t === 0) return 0;
      if (t === 1) return 1;
      return amplitude * Math.pow(2, -10 * t) * Math.sin((t - s) * (2 * Math.PI) / period) + 1;
    };
  }) as EasingFunction & { (amplitude?: number, period?: number): EasingFunction },
  inOut: ((amplitude = 1, period = 0.3): EasingFunction => {
    const s = period / (2 * Math.PI) * Math.asin(1 / amplitude);
    return (t) => {
      if (t === 0) return 0;
      if (t === 1) return 1;
      if ((t *= 2) < 1)
        return -0.5 * amplitude * Math.pow(2, 10 * (t -= 1)) * Math.sin((t - s) * (2 * Math.PI) / period);
      return 0.5 * amplitude * Math.pow(2, -10 * (t -= 1)) * Math.sin((t - s) * (2 * Math.PI) / period) + 1;
    };
  }) as EasingFunction & { (amplitude?: number, period?: number): EasingFunction },
};

export const back = {
  in: ((overshoot = 1.70158): EasingFunction => {
    const c3 = overshoot + 1;
    return (t) => c3 * t * t * t - overshoot * t * t;
  }) as EasingFunction & { (overshoot?: number): EasingFunction },
  out: ((overshoot = 1.70158): EasingFunction => {
    const c3 = overshoot + 1;
    return (t) => 1 + c3 * Math.pow(t - 1, 3) + overshoot * Math.pow(t - 1, 2);
  }) as EasingFunction & { (overshoot?: number): EasingFunction },
  inOut: ((overshoot = 1.70158): EasingFunction => {
    const c2 = overshoot * 1.525;
    return (t) => {
      if ((t *= 2) < 1)
        return (Math.pow(t, 2) * ((c2 + 1) * t - c2)) / 2;
      return (Math.pow(t - 2, 2) * ((c2 + 1) * (t - 2) + c2) + 2) / 2;
    };
  }) as EasingFunction & { (overshoot?: number): EasingFunction },
};

const bounceOutBase: EasingFunction = (t) => {
  const n1 = 7.5625;
  const d1 = 2.75;
  if (t < 1 / d1) return n1 * t * t;
  else if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
  else if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
  else return n1 * (t -= 2.625 / d1) * t + 0.984375;
};

export const bounce = {
  in: (t: number) => 1 - bounceOutBase(1 - t),
  out: bounceOutBase,
  inOut: (t: number) => (t < 0.5 ? (1 - bounceOutBase(1 - 2 * t)) / 2 : (1 + bounceOutBase(2 * t - 1)) / 2),
};

export const rough = ((strength = 1, seed = 0): EasingFunction => {
  let currentSeed = seed;
  const random = (): number => {
    currentSeed = (currentSeed * 9301 + 49297) % 233280;
    return currentSeed / 233280;
  };

  return (t: number) => {
    const base = t;
    const noise = (random() - 0.5) * strength * 0.15;
    return clamp(base + noise);
  };
}) as EasingFunction & { (strength?: number, seed?: number): EasingFunction };

export const stepped = ((steps = 10): EasingFunction => {
  return (t: number) => Math.round(t * steps) / steps;
}) as EasingFunction & { (steps?: number): EasingFunction };

export const linear: EasingFunction = (t) => t;

export const none: EasingFunction = (t) => (t >= 1 ? 1 : 0);

export const Easings: Record<string, EasingFunction> & {
  power0: typeof power0;
  power1: typeof power1;
  power2: typeof power2;
  power3: typeof power3;
  power4: typeof power4;
  quad: typeof quad;
  cubic: typeof cubic;
  quart: typeof quart;
  quint: typeof quint;
  sine: typeof sine;
  circ: typeof circ;
  expo: typeof expo;
  elastic: typeof elastic;
  back: typeof back;
  bounce: typeof bounce;
} = Object.assign(
  {
    linear,
    none,

    'power0.in': power0.in,
    'power0.out': power0.out,
    'power0.inOut': power0.inOut,
    'power1.in': power1.in,
    'power1.out': power1.out,
    'power1.inOut': power1.inOut,
    'power2.in': power2.in,
    'power2.out': power2.out,
    'power2.inOut': power2.inOut,
    'power3.in': power3.in,
    'power3.out': power3.out,
    'power3.inOut': power3.inOut,
    'power4.in': power4.in,
    'power4.out': power4.out,
    'power4.inOut': power4.inOut,

    'quad.in': quad.in,
    'quad.out': quad.out,
    'quad.inOut': quad.inOut,
    'cubic.in': cubic.in,
    'cubic.out': cubic.out,
    'cubic.inOut': cubic.inOut,
    'quart.in': quart.in,
    'quart.out': quart.out,
    'quart.inOut': quart.inOut,
    'quint.in': quint.in,
    'quint.out': quint.out,
    'quint.inOut': quint.inOut,

    'sine.in': sine.in,
    'sine.out': sine.out,
    'sine.inOut': sine.inOut,
    'circ.in': circ.in,
    'circ.out': circ.out,
    'circ.inOut': circ.inOut,
    'expo.in': expo.in,
    'expo.out': expo.out,
    'expo.inOut': expo.inOut,

    'elastic.in': elastic.in,
    'elastic.out': elastic.out,
    'elastic.inOut': elastic.inOut,
    'back.in': back.in,
    'back.out': back.out,
    'back.inOut': back.inOut,
    'bounce.in': bounce.in,
    'bounce.out': bounce.out,
    'bounce.inOut': bounce.inOut,

    rough,
    stepped,
  } as Record<string, EasingFunction>,
  {
    power0,
    power1,
    power2,
    power3,
    power4,
    quad,
    cubic,
    quart,
    quint,
    sine,
    circ,
    expo,
    elastic,
    back,
    bounce,
  }
);

Object.assign(Easings, {
  easeInQuad: quad.in,
  easeOutQuad: quad.out,
  easeInOutQuad: quad.inOut,
  easeInCubic: cubic.in,
  easeOutCubic: cubic.out,
  easeInOutCubic: cubic.inOut,
  easeInQuart: quart.in,
  easeOutQuart: quart.out,
  easeInOutQuart: quart.inOut,
  easeInQuint: quint.in,
  easeOutQuint: quint.out,
  easeInOutQuint: quint.inOut,
  easeInSine: sine.in,
  easeOutSine: sine.out,
  easeInOutSine: sine.inOut,
  easeInElastic: elastic.in,
  easeOutElastic: elastic.out,
  easeInOutElastic: elastic.inOut,
  easeInBack: back.in,
  easeOutBack: back.out,
  easeInOutBack: back.inOut,
  easeInBounce: bounce.in,
  easeOutBounce: bounce.out,
  easeInOutBounce: bounce.inOut,
});

export function getEasing(name: string): EasingFunction {
  return Easings[name] ?? linear;
}

export function resolveEasing(easing: string | EasingFunction | undefined): EasingFunction {
  if (!easing) return linear;
  if (typeof easing === 'function') return easing;
  return getEasing(easing);
}
