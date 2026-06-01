export interface SpringConfig {
  mass: number;
  tension: number;
  friction: number;
  velocity?: number;
  restDelta?: number;
  restSpeed?: number;
}

export interface SpringResult {
  value: number;
  velocity: number;
  settled: boolean;
}

export interface SpringState {
  value: number;
  velocity: number;
}

const DEFAULT_CONFIG: Required<SpringConfig> = {
  mass: 1,
  tension: 170,
  friction: 26,
  velocity: 0,
  restDelta: 0.001,
  restSpeed: 0.001,
};

export function createSpringConfig(config: Partial<SpringConfig> = {}): Required<SpringConfig> {
  const merged = { ...DEFAULT_CONFIG, ...config };
  return {
    mass: Math.max(0.0001, merged.mass),
    tension: Math.max(0.0001, merged.tension),
    friction: Math.max(0.0001, merged.friction),
    velocity: merged.velocity ?? 0,
    restDelta: Math.max(1e-10, merged.restDelta),
    restSpeed: Math.max(1e-10, merged.restSpeed),
  };
}

export type DampingMode = 'underdamped' | 'critically-damped' | 'overdamped';

function getSpringDynamics(
  config: Required<SpringConfig>
): {
  omega: number;
  zeta: number;
  mode: DampingMode;
} {
  const { mass, tension, friction } = config;
  const omega = Math.sqrt(Math.max(tension / mass, 1e-10));
  const zeta = friction / (2 * Math.sqrt(Math.max(tension * mass, 1e-10)));

  let mode: DampingMode;
  if (zeta < 1) mode = 'underdamped';
  else if (Math.abs(zeta - 1) < 1e-6) mode = 'critically-damped';
  else mode = 'overdamped';

  return { omega, zeta, mode };
}

function springStepUnderdamped(
  state: SpringState,
  target: number,
  config: Required<SpringConfig>,
  dt: number
): SpringState {
  const { omega, zeta } = getSpringDynamics(config);
  const omegaDamped = omega * Math.sqrt(Math.max(1 - zeta * zeta, 1e-10));
  const decay = Math.exp(-zeta * omega * dt);

  const displacement = state.value - target;

  const cosTerm = Math.cos(omegaDamped * dt);
  const sinTerm = Math.sin(omegaDamped * dt);

  const newValue =
    target +
    decay *
      (displacement * cosTerm +
        ((state.velocity + zeta * omega * displacement) / Math.max(omegaDamped, 1e-10)) *
          sinTerm);

  const newVelocity =
    decay *
      (-displacement * omegaDamped * sinTerm +
        ((state.velocity + zeta * omega * displacement) * cosTerm)) -
    zeta * omega *
      (decay *
        (displacement * cosTerm +
          ((state.velocity + zeta * omega * displacement) / Math.max(omegaDamped, 1e-10)) *
            sinTerm) -
        target +
        target);

  return { value: newValue, velocity: newVelocity };
}

function springStepCriticallyDamped(
  state: SpringState,
  target: number,
  config: Required<SpringConfig>,
  dt: number
): SpringState {
  const { omega } = getSpringDynamics(config);
  const decay = Math.exp(-omega * dt);

  const displacement = state.value - target;
  const combinedVel = state.velocity + omega * displacement;

  const newValue = target + decay * (displacement + combinedVel * dt);
  const newVelocity = decay * (state.velocity - combinedVel * omega * dt);

  return { value: newValue, velocity: newVelocity };
}

function springStepOverdamped(
  state: SpringState,
  target: number,
  config: Required<SpringConfig>,
  dt: number
): SpringState {
  const { omega, zeta } = getSpringDynamics(config);
  const discriminant = Math.sqrt(Math.max(zeta * zeta - 1, 1e-10));

  const r1 = omega * (zeta - discriminant);
  const r2 = omega * (zeta + discriminant);

  const expR1 = Math.exp(r1 * dt);
  const expR2 = Math.exp(r2 * dt);

  const displacement = state.value - target;

  const c1 = (state.velocity - r2 * displacement) / (r1 - r2 + 1e-10);
  const c2 = (r1 * displacement - state.velocity) / (r1 - r2 + 1e-10);

  const newValue = target + c1 * expR1 + c2 * expR2;
  const newVelocity = c1 * r1 * expR1 + c2 * r2 * expR2;

  return { value: newValue, velocity: newVelocity };
}

export function springStep(
  current: SpringState,
  target: number,
  config: Partial<SpringConfig> = {},
  dt: number = 1 / 60
): SpringState {
  const resolvedConfig = createSpringConfig(config);
  const { mode } = getSpringDynamics(resolvedConfig);

  switch (mode) {
    case 'underdamped':
      return springStepUnderdamped(current, target, resolvedConfig, dt);
    case 'critically-damped':
      return springStepCriticallyDamped(current, target, resolvedConfig, dt);
    case 'overdamped':
      return springStepOverdamped(current, target, resolvedConfig, dt);
    default:
      return springStepUnderdamped(current, target, resolvedConfig, dt);
  }
}

export function isSpringAtRest(
  state: SpringState,
  target: number,
  config: Partial<SpringConfig> = {}
): boolean {
  const resolvedConfig = createSpringConfig(config);
  return (
    Math.abs(state.value - target) <= resolvedConfig.restDelta &&
    Math.abs(state.velocity) <= resolvedConfig.restSpeed
  );
}

export function simulateSpring(
  from: number,
  to: number,
  config: Partial<SpringConfig> = {},
  fps: number = 60,
  maxDuration: number = 10
): { values: SpringResult[]; settled: boolean; duration: number; mode: DampingMode } {
  const resolvedConfig = createSpringConfig(config);
  const { mode } = getSpringDynamics(resolvedConfig);
  let state: SpringState = { value: from, velocity: resolvedConfig.velocity };
  const results: SpringResult[] = [];
  const dt = 1 / fps;
  const maxFrames = Math.ceil(maxDuration * fps);

  for (let frame = 0; frame <= maxFrames; frame++) {
    const settled = isSpringAtRest(state, to, resolvedConfig);
    results.push({
      value: state.value,
      velocity: state.velocity,
      settled,
    });

    if (settled && frame > 0) {
      return {
        values: results,
        settled: true,
        duration: frame * dt,
        mode,
      };
    }

    if (frame < maxFrames) {
      state = springStep(state, to, resolvedConfig, dt);
    }
  }

  return {
    values: results,
    settled: false,
    duration: maxDuration,
    mode,
  };
}

export function springAnimation(
  frame: number,
  fps: number = 60,
  config: Partial<SpringConfig> = {},
  from: number = 0,
  to: number = 1
): SpringResult {
  const resolvedConfig = createSpringConfig(config);
  let state: SpringState = { value: from, velocity: resolvedConfig.velocity };
  const dt = 1 / fps;

  for (let i = 0; i < frame; i++) {
    state = springStep(state, to, resolvedConfig, dt);
  }

  return {
    value: state.value,
    velocity: state.velocity,
    settled: isSpringAtRest(state, to, resolvedConfig),
  };
}
