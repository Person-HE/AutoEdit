// Template 模块导出
export { default as templateEngine, TemplateEngine } from './core/TemplateEngine';
export { TemplateProvider, useTemplateContext, TemplateContext } from './core/TemplateContext';
export { default as TemplateRenderer } from './core/TemplateRenderer';
export { default as templateRegistry, TemplateRegistry } from './core/TemplateRegistry';

export type { TemplateDefinition } from './core/TemplateEngine';

export { default as textTemplates } from './categories/text/index';
export { default as uiTemplates } from './categories/ui/index';
export { default as backgroundTemplates } from './categories/background/index';
export { default as effectTemplates } from './categories/effect/index';
export { default as transitionTemplates } from './categories/transition/index';
