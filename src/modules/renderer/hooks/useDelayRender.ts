import { useCallback, useEffect, useRef } from 'react';

interface DelayHandle {
  id: number;
  label: string;
}

let handleCounter = 0;
const pendingHandles = new Map<number, DelayHandle>();

export function delayRender(label: string = 'Loading'): number {
  const handleId = ++handleCounter;
  pendingHandles.set(handleId, { id: handleId, label });
  return handleId;
}

export function continueRender(handle: number): void {
  pendingHandles.delete(handle);
}

export function getPendingHandles(): DelayHandle[] {
  return Array.from(pendingHandles.values());
}

export function hasPendingHandles(): boolean {
  return pendingHandles.size > 0;
}

export interface UseDelayRenderReturn {
  delayRender: (label?: string) => number;
  continueRender: (handle: number) => void;
}

export function useDelayRender(): UseDelayRenderReturn {
  const handlesRef = useRef<Set<number>>(new Set());

  const handleDelayRender = useCallback((label: string = 'Loading'): number => {
    const handle = delayRender(label);
    handlesRef.current.add(handle);
    return handle;
  }, []);

  const handleContinueRender = useCallback((handle: number): void => {
    continueRender(handle);
    handlesRef.current.delete(handle);
  }, []);

  useEffect(() => {
    return () => {
      handlesRef.current.forEach((handle) => {
        continueRender(handle);
      });
      handlesRef.current.clear();
    };
  }, []);

  return {
    delayRender: handleDelayRender,
    continueRender: handleContinueRender,
  };
}

export default useDelayRender;
