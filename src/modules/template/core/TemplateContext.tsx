import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

export interface TemplateContextValue {
  frame: number;
  fps: number;
  params: Record<string, any>;
  width: number;
  height: number;
}

const DEFAULT_CONTEXT_VALUE: TemplateContextValue = {
  frame: 0,
  fps: 30,
  params: {},
  width: 1920,
  height: 1080,
};

const TemplateContext = createContext<TemplateContextValue>(DEFAULT_CONTEXT_VALUE);

export interface TemplateProviderProps {
  children: ReactNode;
  frame?: number;
  fps?: number;
  params?: Record<string, any>;
  width?: number;
  height?: number;
}

export function TemplateProvider({
  children,
  frame = 0,
  fps = 30,
  params = {},
  width = 1920,
  height = 1080,
}: TemplateProviderProps) {
  const value: TemplateContextValue = { frame, fps, params, width, height };

  return (
    <TemplateContext.Provider value={value}>
      {children}
    </TemplateContext.Provider>
  );
}

export function useTemplateFrame(): number {
  const ctx = useContext(TemplateContext);
  return ctx.frame;
}

export function useTemplateParams(): Record<string, any> {
  const ctx = useContext(TemplateContext);
  return ctx.params;
}

export function useTemplateSize(): { width: number; height: number } {
  const ctx = useContext(TemplateContext);
  return { width: ctx.width, height: ctx.height };
}

export function useTemplateContext(): TemplateContextValue {
  return useContext(TemplateContext);
}

export { TemplateContext };
