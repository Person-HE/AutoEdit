import React, { useMemo } from 'react';
import type { ReactNode } from 'react';
import { TemplateProvider, useTemplateContext } from './TemplateContext';
import templateEngine, {
  type AnyTemplate,
  type ReactTemplate,
  type CanvasTemplate,
} from './TemplateEngine';

export interface TemplateRendererProps {
  templateId: string;
  params?: Record<string, any>;
  width?: number;
  height?: number;
  mode?: 'preview' | 'render';
  frame?: number;
  fps?: number;
}

function TemplateContent({ templateId }: { templateId: string }) {
  const ctx = useTemplateContext();
  const template = templateEngine.getTemplate(templateId) as AnyTemplate;

  if (!template) {
    return (
      <div style={{ color: '#ff4444', padding: 20 }}>
        Template not found: {templateId}
      </div>
    );
  }

  const templateType = templateEngine.detectTemplateType(template);

  if (templateType === 'react') {
    const reactTemplate = template as ReactTemplate;
    return reactTemplate.component({
      frame: ctx.frame,
      fps: ctx.fps,
      params: ctx.params,
      width: ctx.width,
      height: ctx.height,
    }) as ReactNode;
  }

  const canvasTemplate = template as CanvasTemplate;
  const wrappedTemplate = templateEngine.createTemplateWrapper(canvasTemplate);
  return wrappedTemplate.component({
    frame: ctx.frame,
    fps: ctx.fps,
    params: ctx.params,
    width: ctx.width,
    height: ctx.height,
  }) as ReactNode;
}

const TemplateRenderer: React.FC<TemplateRendererProps> = ({
  templateId,
  params = {},
  width = 1920,
  height = 1080,
  mode = 'preview',
  frame = 0,
  fps = 30,
}) => {
  const mergedParams = useMemo(() => {
    const defaults = templateEngine.getDefaultParams(templateId);
    return { ...defaults, ...params };
  }, [templateId, params]);

  return (
    <div
      style={{
        width,
        height,
        position: 'relative',
        overflow: 'hidden',
        background: '#000',
      }}
      data-template-id={templateId}
      data-render-mode={mode}
    >
      <TemplateProvider
        frame={frame}
        fps={fps}
        params={mergedParams}
        width={width}
        height={height}
      >
        <TemplateContent templateId={templateId} />
      </TemplateProvider>
    </div>
  );
};

export default TemplateRenderer;
export { TemplateRenderer };
