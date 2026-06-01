import React from 'react';
import type { ReactElement, ReactNode } from 'react';
import type {
  TemplateDefinition as LegacyTemplateDefinition,
  TemplateRenderContext,
  TemplateCategory,
} from '../../../engine/templates/types';

export { TemplateCategory };

export interface RenderResult {
  success: boolean;
  error?: string;
  data?: unknown;
}

export interface TemplateRenderContextExtended extends TemplateRenderContext {
  frame: number;
  fps: number;
}

export interface CanvasTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  description?: string;
  thumbnail?: string;
  schema: Array<{
    key: string;
    label: string;
    type: string;
    default: any;
    min?: number;
    max?: number;
    step?: number;
    options?: { label: string; value: string }[];
    placeholder?: string;
  }>;
  render: (context: TemplateRenderContext) => void;
  initParams?: (duration: number) => Record<string, any>;
  validateParams?: (params: Record<string, any>) => boolean;
}

export interface ReactTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  description?: string;
  thumbnail?: string;
  schema: Array<{
    key: string;
    label: string;
    type: string;
    default: any;
    min?: number;
    max?: number;
    step?: number;
    options?: { label: string; value: string }[];
    placeholder?: string;
  }>;
  component: (props: {
    frame: number;
    fps: number;
    params: Record<string, any>;
    width: number;
    height: number;
  }) => ReactElement;
  initParams?: (duration: number) => Record<string, any>;
  validateParams?: (params: Record<string, any>) => boolean;
}

export type AnyTemplate = CanvasTemplate | ReactTemplate;

export type TemplateDefinition = LegacyTemplateDefinition | ReactTemplate;

class TemplateEngine {
  private templates: Map<string, AnyTemplate> = new Map();

  registerTemplate(template: AnyTemplate): void {
    if (!template.id || !template.name) {
      throw new Error('Invalid template: must have id and name');
    }
    this.templates.set(template.id, template);
  }

  unregisterTemplate(templateId: string): void {
    this.templates.delete(templateId);
  }

  getTemplate(templateId: string): AnyTemplate | undefined {
    return this.templates.get(templateId);
  }

  getAllTemplates(): AnyTemplate[] {
    return Array.from(this.templates.values());
  }

  getTemplatesByCategory(category: TemplateCategory): AnyTemplate[] {
    return this.getAllTemplates().filter(t => t.category === category);
  }

  detectTemplateType(template: AnyTemplate): 'canvas' | 'react' {
    if ('component' in template && typeof template.component === 'function') {
      return 'react';
    }
    if ('render' in template && typeof template.render === 'function') {
      return 'canvas';
    }
    throw new Error('Unknown template type');
  }

  createTemplateWrapper(canvasTemplate: CanvasTemplate): ReactTemplate {
    const WrappedCanvasTemplate: ReactTemplate['component'] = ({
      frame,
      fps,
      params,
      width,
      height,
    }) => {
      const canvasRef = React.useRef<HTMLCanvasElement>(null);

      React.useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const duration = 3;
        const time = frame / fps;
        const progress = Math.min(1, Math.max(0, time / duration));

        ctx.clearRect(0, 0, width, height);
        canvasTemplate.render({
          ctx,
          width,
          height,
          progress,
          time,
          duration,
          params,
        });
      }, [frame, fps, params, width, height]);

      return React.createElement('canvas', {
        ref: canvasRef,
        width,
        height,
        style: { display: 'block' },
      });
    };

    return {
      ...canvasTemplate,
      component: WrappedCanvasTemplate,
    };
  }

  renderTemplate(
    templateId: string,
    context: TemplateRenderContextExtended
  ): RenderResult {
    const template = this.templates.get(templateId);
    if (!template) {
      return { success: false, error: `Template not found: ${templateId}` };
    }

    const type = this.detectTemplateType(template);

    if (type === 'canvas') {
      try {
        (template as CanvasTemplate).render(context);
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : String(err),
        };
      }
    }

    return { success: false, error: 'React templates cannot be rendered to canvas directly' };
  }

  getDefaultParams(templateId: string): Record<string, any> {
    const template = this.templates.get(templateId);
    if (!template) return {};

    const defaults: Record<string, any> = {};
    template.schema.forEach(param => {
      defaults[param.key] = param.default;
    });
    return defaults;
  }
}

const templateEngineInstance = new TemplateEngine();

export default templateEngineInstance;
export { TemplateEngine };
