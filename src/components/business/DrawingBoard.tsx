import React, { useRef, useState, useEffect, useCallback } from 'react';
import { DrawingTool, DrawingElement, DrawingLayer, DrawingFrame, DrawingProject } from '../../types/core';
import { assetService } from '../../services/assetService';
import { useProjectStore } from '../../store/useProjectStore';
import { renderDrawingElement, renderDrawingScene } from '../../engine/utils/drawingRenderer';
import clsx from 'clsx';
import { v4 as uuidv4 } from 'uuid';

const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;

interface Point {
  x: number;
  y: number;
  pressure: number;
}

interface DrawingState {
  isDrawing: boolean;
  startPoint: Point | null;
  currentPoint: Point | null;
}

interface SelectionState {
  isSelecting: boolean;
  isMoving: boolean;
  isResizing: boolean;
  startPoint: Point | null;
  selectedElements: string[];
  moveOffset: { x: number; y: number };
  resizeHandle: string | null;
  resizeStartElement: DrawingElement | null;
}

interface DrawingBoardProps {
  onClose?: () => void;
}

export const DrawingBoard: React.FC<DrawingBoardProps> = ({ onClose }) => {
  const addAssets = useProjectStore((s) => s.addAssets);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [project, setProject] = useState<DrawingProject>({
    id: uuidv4(),
    name: '新画板项目',
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    backgroundColor: '#ffffff',
    layers: [{ id: 'layer-1', name: '图层 1', visible: true, locked: false, opacity: 100 }],
    activeLayerId: 'layer-1',
    frames: [{ id: 'frame-1', name: '帧 1', elements: [], visible: true }],
    activeFrameIndex: 0,
    currentTool: 'brush',
    brushColor: '#000000',
    brushSize: 5,
    brushOpacity: 100,
    fillColor: '#ffffff',
    fillStyle: 'none',
    strokeStyle: 'solid',
    roughness: 1,
    strokeSharpness: 'round',
    fps: 12,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  const [drawingState, setDrawingState] = useState<DrawingState>({
    isDrawing: false,
    startPoint: null,
    currentPoint: null,
  });

  const [selectionState, setSelectionState] = useState<SelectionState>({
    isSelecting: false,
    isMoving: false,
    isResizing: false,
    startPoint: null,
    selectedElements: [],
    moveOffset: { x: 0, y: 0 },
    resizeHandle: null,
    resizeStartElement: null,
  });

  const [previewElement, setPreviewElement] = useState<DrawingElement | null>(null);
  const [editingTextElement, setEditingTextElement] = useState<DrawingElement | null>(null);
  const [eraserPos, setEraserPos] = useState({ x: -100, y: -100 });
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInputValue, setTextInputValue] = useState('');
  const [textInputPos, setTextInputPos] = useState({ x: 0, y: 0 });
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlayFrame, setCurrentPlayFrame] = useState(0);
  const playRef = useRef<number | null>(null);
  
  const [isExporting, setIsExporting] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFillColorPicker, setShowFillColorPicker] = useState(false);

  const getCurrentFrame = useCallback(() => {
    return project.frames[project.activeFrameIndex] || project.frames[0];
  }, [project.frames, project.activeFrameIndex]);

  const getCurrentElements = useCallback(() => {
    const frame = getCurrentFrame();
    return frame.elements.filter(el => {
      const layer = project.layers.find(l => l.id === el.layerId);
      return layer?.visible && el.visible;
    });
  }, [project, getCurrentFrame]);

  const getActiveLayerElements = useCallback(() => {
    const frame = getCurrentFrame();
    return frame.elements.filter(el => el.layerId === project.activeLayerId);
  }, [project.activeLayerId, getCurrentFrame]);

  const renderElement = (ctx: CanvasRenderingContext2D, element: DrawingElement, scale: number = 1) => {
    // 使用新的手绘风格渲染器
    renderDrawingElement(ctx, element);
  };

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = project.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const elements = getCurrentElements();
    elements.forEach(el => renderElement(ctx, el));

    if (previewElement) {
      renderElement(ctx, previewElement);
    }

    if (selectionState.selectedElements.length > 0) {
      ctx.save();
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      
      elements.filter(el => selectionState.selectedElements.includes(el.id)).forEach(el => {
        ctx.strokeRect(el.x - 5, el.y - 5, el.width + 10, el.height + 10);
      });
      
      ctx.restore();
    }
  }, [project, previewElement, selectionState.selectedElements, getCurrentElements]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, pressure: 1 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
      pressure: 1
    };
  };

  const updateFrame = (updater: (frame: DrawingFrame) => DrawingFrame) => {
    setProject(prev => ({
      ...prev,
      frames: prev.frames.map((frame, idx) => 
        idx === prev.activeFrameIndex ? updater(frame) : frame
      ),
      updatedAt: Date.now(),
    }));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const point = getCanvasCoords(e);
    
    if (project.currentTool === 'text') {
      setTextInputPos({ x: point.x, y: point.y });
      setTextInputValue('');
      setShowTextInput(true);
      setTimeout(() => textInputRef.current?.focus(), 0);
      return;
    }

    if (project.currentTool === 'image') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (readerEvent) => {
          const img = new Image();
          img.onload = () => {
            let width = img.naturalWidth;
            let height = img.naturalHeight;
            const maxSize = 500;
            
            if (width > maxSize || height > maxSize) {
              const ratio = width / height;
              if (width > height) {
                width = maxSize;
                height = maxSize / ratio;
              } else {
                height = maxSize;
                width = maxSize * ratio;
              }
            }

            const newElement: DrawingElement = {
              id: uuidv4(),
              type: 'image',
              x: point.x - width / 2,
              y: point.y - height / 2,
              width,
              height,
              strokeColor: 'transparent',
              fillColor: 'transparent',
              strokeWidth: 0,
              fillStyle: 'none',
              opacity: 100,
              angle: 0,
              cornerRadius: 0,
              imageUrl: readerEvent.target?.result as string,
              roughness: 0,
              layerId: project.activeLayerId,
              visible: true,
              locked: false,
            };

            updateFrame(frame => ({
              ...frame,
              elements: [...frame.elements, newElement]
            }));
          };
          img.src = readerEvent.target?.result as string;
        };
        reader.readAsDataURL(file);
      };
      input.click();
      return;
    }

    if (project.currentTool === 'selection') {
      const elements = getActiveLayerElements();
      const clickedEl = elements.find(el => 
        point.x >= el.x && point.x <= el.x + el.width &&
        point.y >= el.y && point.y <= el.y + el.height
      );

      if (clickedEl) {
        if (!selectionState.selectedElements.includes(clickedEl.id)) {
          setSelectionState(prev => ({ ...prev, selectedElements: [clickedEl.id] }));
        }
        setSelectionState(prev => ({
          ...prev,
          isMoving: true,
          startPoint: point,
          moveOffset: { x: 0, y: 0 }
        }));
      } else {
        setSelectionState(prev => ({
          ...prev,
          isSelecting: true,
          startPoint: point,
          selectedElements: []
        }));
      }
      return;
    }

    if (project.currentTool === 'eraser') {
      setEraserPos({ x: point.x, y: point.y });
      eraseAtPoint(point);
      setDrawingState({ isDrawing: true, startPoint: point, currentPoint: point });
      return;
    }

    const toolType = project.currentTool === 'brush' ? 'free_draw' : project.currentTool;
    
    const newElement: DrawingElement = {
      id: uuidv4(),
      type: toolType as DrawingTool | 'free_draw',
      x: point.x,
      y: point.y,
      width: 0,
      height: 0,
      points: toolType === 'free_draw' ? [point] : undefined,
      strokeColor: project.brushColor,
      fillColor: project.fillStyle !== 'none' ? project.fillColor : 'transparent',
      strokeWidth: project.brushSize,
      fillStyle: project.fillStyle,
      opacity: project.brushOpacity,
      angle: 0,
      cornerRadius: 0,
      roughness: project.roughness,
      layerId: project.activeLayerId,
      visible: true,
      locked: false,
    };

    setPreviewElement(newElement);
    setDrawingState({ isDrawing: true, startPoint: point, currentPoint: point });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const point = getCanvasCoords(e);

    if (project.currentTool === 'eraser' && drawingState.isDrawing) {
      setEraserPos({ x: point.x, y: point.y });
      eraseAtPoint(point);
      return;
    }

    if (!drawingState.isDrawing || !drawingState.startPoint) return;

    if (project.currentTool === 'selection') {
      if (selectionState.isMoving && selectionState.startPoint) {
        const dx = point.x - selectionState.startPoint.x;
        const dy = point.y - selectionState.startPoint.y;
        
        setSelectionState(prev => ({
          ...prev,
          moveOffset: { x: dx, y: dy }
        }));

        updateFrame(frame => ({
          ...frame,
          elements: frame.elements.map(el => 
            selectionState.selectedElements.includes(el.id)
              ? { ...el, x: el.x + dx - selectionState.moveOffset.x, y: el.y + dy - selectionState.moveOffset.y }
              : el
          )
        }));
        
        setSelectionState(prev => ({ ...prev, startPoint: point }));
      }
      return;
    }

    if (!previewElement) return;

    const startPoint = drawingState.startPoint;
    const width = point.x - startPoint.x;
    const height = point.y - startPoint.y;

    if (previewElement.type === 'free_draw') {
      const newPoints = [...(previewElement.points || []), point];
      
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      newPoints.forEach(p => {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
      });

      setPreviewElement({
        ...previewElement,
        points: newPoints,
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
      });
    } else if (previewElement.type === 'line' || previewElement.type === 'arrow') {
      setPreviewElement({
        ...previewElement,
        width: point.x - startPoint.x,
        height: point.y - startPoint.y
      });
    } else {
      setPreviewElement({
        ...previewElement,
        width: Math.abs(width),
        height: Math.abs(height),
        x: width >= 0 ? startPoint.x : point.x,
        y: height >= 0 ? startPoint.y : point.y
      });
    }

    setDrawingState(prev => ({ ...prev, currentPoint: point }));
  };

  const handleMouseUp = () => {
    if (project.currentTool === 'selection') {
      setSelectionState(prev => ({
        ...prev,
        isMoving: false,
        isSelecting: false,
        moveOffset: { x: 0, y: 0 }
      }));
      return;
    }

    if (!drawingState.isDrawing || !previewElement) {
      setDrawingState({ isDrawing: false, startPoint: null, currentPoint: null });
      return;
    }

    if (previewElement.type === 'free_draw' && previewElement.points && previewElement.points.length < 2) {
      setPreviewElement(null);
      setDrawingState({ isDrawing: false, startPoint: null, currentPoint: null });
      return;
    }

    updateFrame(frame => ({
      ...frame,
      elements: [...frame.elements, previewElement]
    }));

    setPreviewElement(null);
    setDrawingState({ isDrawing: false, startPoint: null, currentPoint: null });
  };

  const eraseAtPoint = (point: Point) => {
    const eraserRadius = project.brushSize * 3;
    updateFrame(frame => ({
      ...frame,
      elements: frame.elements.filter(el => {
        if (el.layerId !== project.activeLayerId) return true;
        
        if (el.type === 'free_draw' && el.points) {
          return !el.points.some(p => {
            const dx = p.x - point.x;
            const dy = p.y - point.y;
            return Math.sqrt(dx * dx + dy * dy) <= eraserRadius;
          });
        }
        
        const dx = Math.min(Math.abs(point.x - el.x), Math.abs(point.x - el.x - el.width));
        const dy = Math.min(Math.abs(point.y - el.y), Math.abs(point.y - el.y - el.height));
        return dx > eraserRadius || dy > eraserRadius;
      })
    }));
  };

  const handleTextComplete = () => {
    if (!textInputValue.trim()) {
      setShowTextInput(false);
      return;
    }

    const newElement: DrawingElement = {
      id: uuidv4(),
      type: 'text',
      x: textInputPos.x,
      y: textInputPos.y,
      width: 100,
      height: 30,
      strokeColor: project.brushColor,
      fillColor: 'transparent',
      strokeWidth: 1,
      fillStyle: 'none',
      opacity: project.brushOpacity,
      angle: 0,
      cornerRadius: 0,
      text: textInputValue,
      fontSize: 24,
      fontFamily: 'sans-serif',
      roughness: 0,
      layerId: project.activeLayerId,
      visible: true,
      locked: false,
    };

    updateFrame(frame => ({
      ...frame,
      elements: [...frame.elements, newElement]
    }));

    setShowTextInput(false);
    setTextInputValue('');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.naturalWidth;
        let height = img.naturalHeight;
        const maxSize = 500;
        
        if (width > maxSize || height > maxSize) {
          const ratio = width / height;
          if (width > height) {
            width = maxSize;
            height = maxSize / ratio;
          } else {
            height = maxSize;
            width = maxSize * ratio;
          }
        }

        const point = drawingState.currentPoint || { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 };

        const newElement: DrawingElement = {
          id: uuidv4(),
          type: 'image',
          x: point.x - width / 2,
          y: point.y - height / 2,
          width,
          height,
          strokeColor: 'transparent',
          fillColor: 'transparent',
          strokeWidth: 0,
          fillStyle: 'none',
          opacity: 100,
          angle: 0,
          cornerRadius: 0,
          imageUrl: event.target?.result as string,
          roughness: 0,
          layerId: project.activeLayerId,
          visible: true,
          locked: false,
        };

        updateFrame(frame => ({
          ...frame,
          elements: [...frame.elements, newElement]
        }));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const deleteSelectedElements = () => {
    if (selectionState.selectedElements.length === 0) return;
    
    updateFrame(frame => ({
      ...frame,
      elements: frame.elements.filter(el => !selectionState.selectedElements.includes(el.id))
    }));
    
    setSelectionState(prev => ({ ...prev, selectedElements: [] }));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Backspace' || e.key === 'Delete') && selectionState.selectedElements.length > 0) {
        deleteSelectedElements();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectionState.selectedElements]);

  const addLayer = () => {
    const newLayer: DrawingLayer = {
      id: uuidv4(),
      name: `图层 ${project.layers.length + 1}`,
      visible: true,
      locked: false,
      opacity: 100
    };
    
    setProject(prev => ({
      ...prev,
      layers: [...prev.layers, newLayer],
      activeLayerId: newLayer.id
    }));
  };

  const deleteLayer = (layerId: string) => {
    if (project.layers.length <= 1) return;
    
    const newLayers = project.layers.filter(l => l.id !== layerId);
    const newActiveLayerId = project.activeLayerId === layerId ? newLayers[0].id : project.activeLayerId;
    
    setProject(prev => ({
      ...prev,
      layers: newLayers,
      activeLayerId: newActiveLayerId
    }));
  };

  const addFrame = () => {
    const currentFrame = getCurrentFrame();
    const newFrame: DrawingFrame = {
      id: uuidv4(),
      name: `帧 ${project.frames.length + 1}`,
      elements: currentFrame.elements.map(el => ({ ...el, id: uuidv4() })),
      visible: true
    };
    
    setProject(prev => ({
      ...prev,
      frames: [...prev.frames, newFrame],
      activeFrameIndex: prev.frames.length
    }));
  };

  const deleteFrame = (index: number) => {
    if (project.frames.length <= 1) return;
    
    const newFrames = project.frames.filter((_, idx) => idx !== index);
    const newActiveIndex = project.activeFrameIndex >= newFrames.length 
      ? newFrames.length - 1 
      : project.activeFrameIndex;
    
    setProject(prev => ({
      ...prev,
      frames: newFrames,
      activeFrameIndex: newActiveIndex
    }));
  };

  const copyFrame = (index: number) => {
    const frame = project.frames[index];
    const newFrame: DrawingFrame = {
      id: uuidv4(),
      name: `${frame.name} (副本)`,
      elements: frame.elements.map(el => ({ ...el, id: uuidv4() })),
      visible: true
    };
    
    setProject(prev => ({
      ...prev,
      frames: [...prev.frames, newFrame],
      activeFrameIndex: prev.frames.length
    }));
  };

  const playAnimation = () => {
    if (isPlaying) {
      if (playRef.current) {
        cancelAnimationFrame(playRef.current);
      }
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    setCurrentPlayFrame(0);

    let lastTime = 0;
    const frameDuration = 1000 / project.fps;

    const animate = (timestamp: number) => {
      if (!isPlaying) return;
      
      if (timestamp - lastTime >= frameDuration) {
        setCurrentPlayFrame(prev => {
          const next = (prev + 1) % project.frames.length;
          if (next === 0) {
            if (playRef.current) {
              cancelAnimationFrame(playRef.current);
            }
            setIsPlaying(false);
          }
          return next;
        });
        lastTime = timestamp;
      }
      
      playRef.current = requestAnimationFrame(animate);
    };

    playRef.current = requestAnimationFrame(animate);
  };

  const calculateContentBounds = (elements: DrawingElement[]) => {
    if (elements.length === 0) {
      return { minX: CANVAS_WIDTH / 2, minY: CANVAS_HEIGHT / 2, maxX: CANVAS_WIDTH / 2, maxY: CANVAS_HEIGHT / 2 };
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    elements.forEach(el => {
      if (el.type === 'free_draw' && el.points) {
        el.points.forEach(p => {
          minX = Math.min(minX, p.x);
          minY = Math.min(minY, p.y);
          maxX = Math.max(maxX, p.x);
          maxY = Math.max(maxY, p.y);
        });
      } else {
        minX = Math.min(minX, el.x);
        minY = Math.min(minY, el.y);
        maxX = Math.max(maxX, el.x + el.width);
        maxY = Math.max(maxY, el.y + el.height);
      }
    });

    return { minX, minY, maxX, maxY };
  };

  const exportToPng = async () => {
    setIsExporting(true);
    
    try {
      const elements = getCurrentElements();
      const bounds = calculateContentBounds(elements);
      
      const contentWidth = bounds.maxX - bounds.minX;
      const contentHeight = bounds.maxY - bounds.minY;
      const centerX = CANVAS_WIDTH / 2;
      const centerY = CANVAS_HEIGHT / 2;
      const offsetX = centerX - (bounds.minX + contentWidth / 2);
      const offsetY = centerY - (bounds.minY + contentHeight / 2);

      const canvas = document.createElement('canvas');
      canvas.width = CANVAS_WIDTH;
      canvas.height = CANVAS_HEIGHT;
      const ctx = canvas.getContext('2d')!;
      
      ctx.fillStyle = project.backgroundColor;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      const centeredElements = elements.map(el => {
        if (el.type === 'free_draw' && el.points) {
          return {
            ...el,
            points: el.points.map(p => ({ ...p, x: p.x + offsetX, y: p.y + offsetY })),
            x: el.x + offsetX,
            y: el.y + offsetY
          };
        }
        return { ...el, x: el.x + offsetX, y: el.y + offsetY };
      });
      
      centeredElements.forEach(el => renderElement(ctx, el));

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        
        const file = new File([blob], `drawing_${Date.now()}.png`, { type: 'image/png' });
        const assets = await assetService.uploadAssets([file]);
        addAssets(assets);
        
        alert('图片已导出并添加到素材库！');
        setIsExporting(false);
      }, 'image/png');
    } catch (error) {
      console.error('Export error:', error);
      alert('导出失败，请重试');
      setIsExporting(false);
    }
  };

  const exportToVideo = async () => {
    setIsExporting(true);
    
    try {
      const canvas = document.createElement('canvas');
      canvas.width = CANVAS_WIDTH;
      canvas.height = CANVAS_HEIGHT;
      const ctx = canvas.getContext('2d')!;

      const stream = canvas.captureStream(project.fps);
      
      let mimeType = 'video/mp4';
      if (!MediaRecorder.isTypeSupported('video/mp4')) {
        mimeType = 'video/webm;codecs=vp9';
      }

      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 8000000
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
        const blob = new Blob(chunks, { type: mimeType });
        const file = new File([blob], `animation_${Date.now()}.${ext}`, { type: mimeType });
        
        const assets = await assetService.uploadAssets([file]);
        addAssets(assets);
        
        alert('视频已导出并添加到素材库！');
        setIsExporting(false);
      };

      recorder.start();
      
      const frameDuration = 1000 / project.fps;
      
      for (let i = 0; i < project.frames.length; i++) {
        const frame = project.frames[i];
        
        ctx.fillStyle = project.backgroundColor;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        const bounds = calculateContentBounds(frame.elements);
        const contentWidth = bounds.maxX - bounds.minX;
        const contentHeight = bounds.maxY - bounds.minY;
        const centerX = CANVAS_WIDTH / 2;
        const centerY = CANVAS_HEIGHT / 2;
        const offsetX = centerX - (bounds.minX + contentWidth / 2);
        const offsetY = centerY - (bounds.minY + contentHeight / 2);
        
        const centeredElements = frame.elements.map(el => {
          if (el.type === 'free_draw' && el.points) {
            return {
              ...el,
              points: el.points.map(p => ({ ...p, x: p.x + offsetX, y: p.y + offsetY })),
              x: el.x + offsetX,
              y: el.y + offsetY
            };
          }
          return { ...el, x: el.x + offsetX, y: el.y + offsetY };
        });
        
        centeredElements.forEach(el => renderElement(ctx, el));
        
        await new Promise(resolve => setTimeout(resolve, frameDuration));
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
      recorder.stop();
    } catch (error) {
      console.error('Video export error:', error);
      alert('视频导出失败，请重试');
      setIsExporting(false);
    }
  };

const toolIconMap: Record<string, React.ReactNode> = {
  brush: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>,
  eraser: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 20H7L3 16l9-9 8 8-4 4z"/><path d="M6.5 13.5l5-5"/></svg>,
  select: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="M13 13l6 6"/></svg>,
  rect: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>,
  circle: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/></svg>,
  diamond: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 12l10 10 10-10L12 2z"/></svg>,
  line: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="19" x2="19" y2="5"/></svg>,
  arrow: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  text: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>,
  image: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg>,
};

const tools = [
    { id: 'brush', icon: 'brush', label: '画笔' },
    { id: 'eraser', icon: 'eraser', label: '橡皮擦' },
    { id: 'selection', icon: 'select', label: '选择' },
    { id: 'rectangle', icon: 'rect', label: '矩形' },
    { id: 'ellipse', icon: 'circle', label: '椭圆' },
    { id: 'diamond', icon: 'diamond', label: '菱形' },
    { id: 'line', icon: 'line', label: '直线' },
    { id: 'arrow', icon: 'arrow', label: '箭头' },
    { id: 'text', icon: 'text', label: '文字' },
    { id: 'image', icon: 'image', label: '图片' },
  ];

  return (
    <div ref={containerRef} className="flex flex-col h-full bg-[#1a1a1f] select-none">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
      />

      <div className="flex-shrink-0 p-2 border-b border-white/10 bg-[#25252b]">
        <div className="flex items-center gap-1 flex-wrap">
          {tools.map(tool => (
            <button
              key={tool.id}
              onClick={() => setProject(prev => ({ ...prev, currentTool: tool.id }))}
              className={clsx(
                "px-3 py-1.5 rounded text-xs transition-colors",
                project.currentTool === tool.id
                  ? "bg-brand-500 text-white"
                  : "bg-white/5 text-gray-400 hover:bg-white/10"
              )}
              title={tool.label}
            >
              <span className="mr-1">{toolIconMap[tool.icon]}</span>
              {tool.label}
            </button>
          ))}
          
          <div className="w-px h-6 bg-white/10 mx-2" />
          
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="w-8 h-8 rounded border-2 border-white/20"
              style={{ backgroundColor: project.brushColor }}
              title="画笔颜色"
            />
            {showColorPicker && (
              <div className="absolute top-full left-0 mt-1 p-2 bg-[#2a2a30] rounded-lg shadow-xl z-50 border border-white/10">
                <input
                  type="color"
                  value={project.brushColor}
                  onChange={(e) => setProject(prev => ({ ...prev, brushColor: e.target.value }))}
                  className="w-32 h-8 cursor-pointer"
                />
                <div className="mt-2 flex gap-1">
                  {['#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'].map(color => (
                    <button
                      key={color}
                      onClick={() => {
                        setProject(prev => ({ ...prev, brushColor: color }));
                        setShowColorPicker(false);
                      }}
                      className="w-6 h-6 rounded border border-white/20"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="relative">
            <button
              onClick={() => setShowFillColorPicker(!showFillColorPicker)}
              className="w-8 h-8 rounded border-2 border-white/20"
              style={{ backgroundColor: project.fillStyle !== 'none' ? project.fillColor : 'transparent' }}
              title="填充颜色"
            />
            {showFillColorPicker && (
              <div className="absolute top-full left-0 mt-1 p-2 bg-[#2a2a30] rounded-lg shadow-xl z-50 border border-white/10">
                <div className="mb-2">
                  <label className="text-[10px] text-gray-400">填充样式</label>
                  <select
                    value={project.fillStyle}
                    onChange={(e) => setProject(prev => ({ ...prev, fillStyle: e.target.value as any }))}
                    className="w-full mt-1 bg-black/30 border border-white/10 rounded px-2 py-1 text-xs"
                  >
                    <option value="none">无</option>
                    <option value="solid">纯色</option>
                    <option value="hachure">影线</option>
                    <option value="cross-hatch">交叉线</option>
                  </select>
                </div>
                {project.fillStyle !== 'none' && (
                  <>
                    <input
                      type="color"
                      value={project.fillColor}
                      onChange={(e) => setProject(prev => ({ ...prev, fillColor: e.target.value }))}
                      className="w-32 h-8 cursor-pointer"
                    />
                    <div className="mt-2 flex gap-1">
                      {['#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'].map(color => (
                        <button
                          key={color}
                          onClick={() => {
                            setProject(prev => ({ ...prev, fillColor: color }));
                            setShowFillColorPicker(false);
                          }}
                          className="w-6 h-6 rounded border border-white/20"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 ml-2">
            <span className="text-[10px] text-gray-400">大小</span>
            <input
              type="range"
              min="1"
              max="50"
              value={project.brushSize}
              onChange={(e) => setProject(prev => ({ ...prev, brushSize: parseInt(e.target.value) }))}
              className="w-20"
            />
            <span className="text-[10px] text-gray-400 w-4">{project.brushSize}</span>
          </div>
          
          <div className="flex items-center gap-2 ml-2">
            <span className="text-[10px] text-gray-400">透明度</span>
            <input
              type="range"
              min="10"
              max="100"
              value={project.brushOpacity}
              onChange={(e) => setProject(prev => ({ ...prev, brushOpacity: parseInt(e.target.value) }))}
              className="w-20"
            />
            <span className="text-[10px] text-gray-400 w-4">{project.brushOpacity}%</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-48 flex-shrink-0 border-r border-white/10 bg-[#1e1e24] overflow-y-auto">
          <div className="p-2">
            <div className="text-[10px] text-gray-500 uppercase mb-2 px-2">图层</div>
            <div className="space-y-1">
              {project.layers.map(layer => (
                <div
                  key={layer.id}
                  onClick={() => setProject(prev => ({ ...prev, activeLayerId: layer.id }))}
                  className={clsx(
                    "p-2 rounded cursor-pointer text-xs flex items-center gap-2 group",
                    project.activeLayerId === layer.id
                      ? "bg-brand-500/20 border border-brand-500/50"
                      : "bg-white/5 hover:bg-white/10 border border-transparent"
                  )}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setProject(prev => ({
                        ...prev,
                        layers: prev.layers.map(l => l.id === layer.id ? { ...l, visible: !l.visible } : l)
                      }));
                    }}
                    className="text-gray-400 hover:text-white"
                  >
                    {layer.visible ? '👁️' : '🔲'}
                  </button>
                  <span className="flex-1 truncate">{layer.name}</span>
                  {project.layers.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteLayer(layer.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={addLayer}
              className="w-full mt-2 py-1.5 text-xs border border-dashed border-white/20 text-gray-400 hover:text-white hover:border-brand-500/50 rounded transition-colors"
            >
              + 添加图层
            </button>
          </div>
        </div>

        <div className="flex-1 relative overflow-hidden bg-[#2a2a30]">
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className="max-w-full max-h-full shadow-2xl bg-white"
              style={{ cursor: project.currentTool === 'eraser' ? 'none' : 'crosshair' }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
            
            {project.currentTool === 'eraser' && drawingState.isDrawing && (
              <div
                className="absolute pointer-events-none border-2 border-red-500 rounded-full opacity-70"
                style={{
                  left: `${(eraserPos.x / CANVAS_WIDTH) * 100}%`,
                  top: `${(eraserPos.y / CANVAS_HEIGHT) * 100}%`,
                  width: `${project.brushSize * 6}px`,
                  height: `${project.brushSize * 6}px`,
                  transform: 'translate(-50%, -50%)'
                }}
              />
            )}
          </div>

          {showTextInput && (
            <textarea
              ref={textInputRef}
              value={textInputValue}
              onChange={(e) => setTextInputValue(e.target.value)}
              onBlur={handleTextComplete}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleTextComplete();
                }
              }}
              className="absolute bg-transparent border border-dashed border-blue-500 outline-none resize-none text-black"
              style={{
                left: `${(textInputPos.x / CANVAS_WIDTH) * 100}%`,
                top: `${(textInputPos.y / CANVAS_HEIGHT) * 100}%`,
                fontSize: '24px',
                minWidth: '100px',
                minHeight: '30px'
              }}
              placeholder="输入文字..."
            />
          )}
        </div>

        <div className="w-48 flex-shrink-0 border-l border-white/10 bg-[#1e1e24] overflow-y-auto">
          <div className="p-2">
            <div className="flex items-center justify-between mb-2 px-2">
              <span className="text-[10px] text-gray-500 uppercase">帧</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={playAnimation}
                  className={clsx(
                    "px-2 py-1 rounded text-xs",
                    isPlaying ? "bg-red-500 text-white" : "bg-green-500 text-white"
                  )}
                >
                  {isPlaying ? '⏹️' : '▶️'}
                </button>
                <button
                  onClick={addFrame}
                  className="px-2 py-1 rounded text-xs bg-white/10 text-gray-300 hover:bg-white/20"
                >
                  +
                </button>
              </div>
            </div>
            
            <div className="space-y-1">
              {project.frames.map((frame, index) => (
                <div
                  key={frame.id}
                  onClick={() => {
                    if (isPlaying) return;
                    setProject(prev => ({ ...prev, activeFrameIndex: index }));
                  }}
                  className={clsx(
                    "p-2 rounded cursor-pointer text-xs flex items-center gap-2 group",
                    project.activeFrameIndex === index && !isPlaying
                      ? "bg-brand-500/20 border border-brand-500/50"
                      : "bg-white/5 hover:bg-white/10 border border-transparent"
                  )}
                >
                  <span className="w-6 h-6 bg-black/30 rounded flex items-center justify-center text-[10px]">
                    {isPlaying && currentPlayFrame === index ? '▶️' : index + 1}
                  </span>
                  <span className="flex-1 truncate">{frame.name}</span>
                  <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyFrame(index);
                      }}
                      className="text-gray-400 hover:text-white"
                      title="复制"
                    >
                      📋
                    </button>
                    {project.frames.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteFrame(index);
                        }}
                        className="text-gray-400 hover:text-red-400"
                        title="删除"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="text-[10px] text-gray-500 uppercase mb-2 px-2">导出</div>
              <div className="space-y-2">
                <button
                  onClick={exportToPng}
                  disabled={isExporting}
                  className="w-full py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 disabled:opacity-50 text-white text-xs rounded transition-colors"
                >
                  📷 导出PNG图片
                </button>
                <button
                  onClick={exportToVideo}
                  disabled={isExporting}
                  className="w-full py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 disabled:opacity-50 text-white text-xs rounded transition-colors"
                >
                  <svg className="inline w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>导出MP4视频
                </button>
                <div className="flex items-center gap-2 px-2">
                  <span className="text-[10px] text-gray-400">帧率:</span>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={project.fps}
                    onChange={(e) => setProject(prev => ({ ...prev, fps: parseInt(e.target.value) || 12 }))}
                    className="w-14 bg-black/30 border border-white/10 rounded px-2 py-1 text-xs"
                  />
                  <span className="text-[10px] text-gray-400">FPS</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isExporting && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-[#2a2a30] rounded-xl p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500 mx-auto mb-4" />
            <p className="text-white">正在导出...</p>
          </div>
        </div>
      )}
    </div>
  );
};
