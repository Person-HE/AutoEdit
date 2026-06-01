export { TemplateProvider, useTemplateFrame, useTemplateParams, useTemplateSize, useTemplateContext, TemplateContext } from './TemplateContext';
export type { TemplateContextValue, TemplateProviderProps } from './TemplateContext';

export { default as templateEngine, TemplateEngine } from './TemplateEngine';
export type {
  RenderResult,
  TemplateRenderContextExtended,
  CanvasTemplate,
  ReactTemplate,
  AnyTemplate,
  TemplateDefinition as EngineTemplateDefinition,
} from './TemplateEngine';

export { default as TemplateRenderer } from './TemplateRenderer';
export type { TemplateRendererProps } from './TemplateRenderer';

export { default as templateRegistry, TemplateRegistry } from './TemplateRegistry';
export type { TemplateDefinition as RegistryTemplateDefinition } from './TemplateRegistry';
