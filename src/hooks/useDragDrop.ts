// 拖放功能 Hook
import { useState, useCallback } from 'react';

interface DragItem {
  type: string;
  data: any;
}

export const useDragDrop = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);

  const onDragStart = useCallback((item: DragItem) => {
    setIsDragging(true);
    setDraggedItem(item);
  }, []);

  const onDragEnd = useCallback(() => {
    setIsDragging(false);
    setDraggedItem(null);
  }, []);

  return {
    isDragging,
    draggedItem,
    onDragStart,
    onDragEnd
  };
};
