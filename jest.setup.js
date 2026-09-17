// Jest 全局 mock — 解决 import.meta.env 在 jsdom 中为 undefined 的问题
// ts-jest 不注入 Vite 的 import.meta，需要手动 polyfill

const viteEnv = { DEV: true, PROD: false, MODE: 'test' };

// 方案1：在 Object 原型上注入（ts-jest 编译后代码会访问这个）
const _origDefineProperty = Object.defineProperty;
Object.defineProperty = function(obj, prop, descriptor) {
  if (prop === 'import.meta' || prop === 'import') {
    return _origDefineProperty.call(this, obj, prop, descriptor);
  }
  return _origDefineProperty.call(this, obj, prop, descriptor);
};

// 方案2：直接在全局挂载 __viteMetadata 供代码引用
globalThis.__viteMetadata__ = { env: viteEnv };

// 方案3：给 module 对象加 meta（CJS 模式下 jest 的 module 对象）
// 由于 ts-jest 编译为 ESM，import.meta 是关键字，无法直接赋值
// 所以我们在 AIService.ts 里通过全局变量绕过

// 方案4：最可靠的 — 修改 AIService 中的判断
// 在测试环境中强制使用 DEV 分支
