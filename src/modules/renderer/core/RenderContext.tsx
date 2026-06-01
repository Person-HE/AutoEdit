import React, { createContext, useContext } from 'react';

export interface RenderConfig {
  width: number;
  height: number;
  backgroundColor?: string;
}

const DEFAULT_RENDER_CONFIG: RenderConfig = {
  width: 1920,
  height: 1080,
  backgroundColor: '#000000',
};

const RenderContext = createContext<RenderConfig>(DEFAULT_RENDER_CONFIG);

export interface RenderProviderProps {
  children: React.ReactNode;
  width?: number;
  height?: number;
  backgroundColor?: string;
}

export function RenderProvider({
  children,
  width = 1920,
  height = 1080,
  backgroundColor = '#000000',
}: RenderProviderProps) {
  const value: RenderConfig = {
    width,
    height,
    backgroundColor,
  };

  return (
    <RenderContext.Provider value={value}>
      {children}
    </RenderContext.Provider>
  );
}

export function useRenderConfig(): RenderConfig {
  return useContext(RenderContext);
}

export const useRender = useRenderConfig;

export { RenderContext };
