import React, { useRef, useEffect, useState, useCallback, useMemo, memo } from 'react';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  containerHeight?: number | string;
  overscan?: number;
  className?: string;
  emptyComponent?: React.ReactNode;
}

function VirtualListInner<T>({
  items,
  itemHeight,
  renderItem,
  keyExtractor,
  containerHeight = '100%',
  overscan = 5,
  className = '',
  emptyComponent,
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerH, setContainerH] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerH(entry.contentRect.height);
      }
    });
    observer.observe(el);
    setContainerH(el.clientHeight);

    return () => observer.disconnect();
  }, []);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const totalHeight = items.length * itemHeight;

  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerH) / itemHeight) + overscan
    );
    return { startIndex, endIndex };
  }, [scrollTop, containerH, itemHeight, items.length, overscan]);

  const visibleItems = useMemo(() => {
    const result: { item: T; index: number; key: string }[] = [];
    for (let i = visibleRange.startIndex; i <= visibleRange.endIndex; i++) {
      if (i >= 0 && i < items.length) {
        const item = items[i];
        result.push({ item, index: i, key: keyExtractor(item, i) });
      }
    }
    return result;
  }, [visibleRange, items, keyExtractor]);

  const offsetY = visibleRange.startIndex * itemHeight;

  if (items.length === 0 && emptyComponent) {
    return (
      <div
        ref={containerRef}
        className={`overflow-auto ${className}`}
        style={{ height: containerHeight }}
      >
        {emptyComponent}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            top: offsetY,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map(({ item, index, key }) => (
            <div key={key} style={{ height: itemHeight }}>
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export const VirtualList = memo(VirtualListInner) as typeof VirtualListInner;

interface VirtualGridProps<T> {
  items: T[];
  itemWidth: number;
  itemHeight: number;
  gap?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  containerHeight?: number | string;
  overscan?: number;
  className?: string;
  emptyComponent?: React.ReactNode;
}

function VirtualGridInner<T>({
  items,
  itemWidth,
  itemHeight,
  gap = 0,
  renderItem,
  keyExtractor,
  containerHeight = '100%',
  overscan = 2,
  className = '',
  emptyComponent,
}: VirtualGridProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerW, setContainerW] = useState(0);
  const [containerH, setContainerH] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerW(entry.contentRect.width);
        setContainerH(entry.contentRect.height);
      }
    });
    observer.observe(el);
    setContainerW(el.clientWidth);
    setContainerH(el.clientHeight);

    return () => observer.disconnect();
  }, []);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const cols = Math.max(1, Math.floor(containerW / (itemWidth + gap)));
  const rows = Math.ceil(items.length / cols);
  const totalHeight = rows * (itemHeight + gap) + gap;

  const visibleRange = useMemo(() => {
    const startRow = Math.max(0, Math.floor(scrollTop / (itemHeight + gap)) - overscan);
    const endRow = Math.min(
      rows - 1,
      Math.ceil((scrollTop + containerH) / (itemHeight + gap)) + overscan
    );
    return { startRow, endRow };
  }, [scrollTop, containerH, itemHeight, gap, rows, overscan]);

  const visibleItems = useMemo(() => {
    const result: { item: T; index: number; key: string; row: number; col: number }[] = [];
    for (let row = visibleRange.startRow; row <= visibleRange.endRow; row++) {
      for (let col = 0; col < cols; col++) {
        const index = row * cols + col;
        if (index < items.length) {
          const item = items[index];
          result.push({ item, index, key: keyExtractor(item, index), row, col });
        }
      }
    }
    return result;
  }, [visibleRange, cols, items, keyExtractor]);

  const offsetY = visibleRange.startRow * (itemHeight + gap);

  if (items.length === 0 && emptyComponent) {
    return (
      <div
        ref={containerRef}
        className={`overflow-auto ${className}`}
        style={{ height: containerHeight }}
      >
        {emptyComponent}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            top: offsetY,
            left: 0,
            right: 0,
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, ${itemWidth}px)`,
            gap: `${gap}px`,
            justifyContent: 'center',
          }}
        >
          {visibleItems.map(({ item, index, key }) => (
            <div key={key} style={{ width: itemWidth, height: itemHeight }}>
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export const VirtualGrid = memo(VirtualGridInner) as typeof VirtualGridInner;
