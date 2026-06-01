import React, { forwardRef, useEffect } from 'react';
import { RenderProvider, useRenderConfig } from '../core/RenderContext';
import { TimelineProvider } from '../core/TimelineContext';

export interface CompositionProps {
  id: string;
  component?: React.ComponentType;
  width?: number;
  height?: number;
  fps?: number;
  durationInFrames?: number;
  backgroundColor?: string;
  children: React.ReactNode;
}

const compositions = new Map<string, {
  id: string;
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
  component?: React.ComponentType;
}>();

export function registerComposition(config: {
  id: string;
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
  component?: React.ComponentType;
}): void {
  compositions.set(config.id, config);
}

export function getComposition(id: string) {
  return compositions.get(id);
}

export function getAllCompositions() {
  return Array.from(compositions.values());
}

export function clearCompositions(): void {
  compositions.clear();
}

const CompositionInner = forwardRef<HTMLDivElement, Omit<CompositionProps, 'component'>>(
  ({ id, width = 1920, height = 1080, fps = 30, durationInFrames = 90, backgroundColor = '#000', children }, ref) => {
    const renderConfig = useRenderConfig();

    useEffect(() => {
      registerComposition({
        id,
        width,
        height,
        fps,
        durationInFrames,
      });
    }, [id, width, height, fps, durationInFrames]);

    const finalWidth = renderConfig?.width ?? width;
    const finalHeight = renderConfig?.height ?? height;

    return (
      <TimelineProvider fps={fps} durationInFrames={durationInFrames}>
        <div
          ref={ref}
          data-composition-id={id}
          style={{
            width: finalWidth,
            height: finalHeight,
            position: 'relative',
            overflow: 'hidden',
            backgroundColor,
            flexShrink: 0,
          }}
        >
          {children}
        </div>
      </TimelineProvider>
    );
  }
);

CompositionInner.displayName = 'CompositionInner';

export const Composition = forwardRef<HTMLDivElement, CompositionProps>(
  ({ children, ...props }, ref) => {
    return (
      <RenderProvider
        width={props.width ?? 1920}
        height={props.height ?? 1080}
        backgroundColor={props.backgroundColor ?? '#000'}
      >
        <CompositionInner ref={ref} {...props}>
          {children}
        </CompositionInner>
      </RenderProvider>
    );
  }
);

Composition.displayName = 'Composition';

export default Composition;
