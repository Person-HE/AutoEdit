import rough from 'roughjs';
import { getStroke } from 'perfect-freehand';
import { DrawingElement, DrawingPoint } from '../../types/core';

// 生成 rough.js 选项
const generateRoughOptions = (element: DrawingElement, opacity: number = 1) => {
  return {
    seed: element.roughness * 1000,
    roughness: element.roughness,
    stroke: element.strokeColor,
    strokeWidth: element.strokeWidth,
    fill: 'transparent',
    fillStyle: 'solid',
    fillWeight: element.strokeWidth / 2,
    hachureGap: element.strokeWidth * 4,
    curveFitting: 1,
    bowing: element.type === 'line' || element.type === 'arrow' ? 0 : 1,
    cornerRadius: element.cornerRadius,
    opacity: opacity * (element.opacity / 100)
  };
};

// 渲染手绘线条（使用 perfect-freehand）- 与 webcreate 完全一致
const renderFreeDraw = (
  ctx: CanvasRenderingContext2D,
  element: DrawingElement
) => {
  if (!element.points || element.points.length < 2) {
    return;
  }
  
  // 提取点坐标 - 使用绝对坐标
  const points = element.points.map((p) => ({ 
    x: p.x, 
    y: p.y, 
    pressure: p.pressure || 1 
  }));
  
  // 使用 perfect-freehand 生成平滑笔触 - 与 webcreate 相同参数
  const stroke = getStroke(points, {
    size: element.strokeWidth,
    thinning: 0.5,
    smoothing: 0.5,
    streamline: 0.5,
    simulatePressure: true
  });
  
  // 获取当前全局透明度
  const currentAlpha = ctx.globalAlpha;
  
  // 绘制填充（如果需要）
  if (element.fillStyle !== 'none' && element.points.length > 2) {
    ctx.fillStyle = element.fillColor;
    ctx.globalAlpha = currentAlpha * (element.opacity / 100) * 0.3;
    ctx.beginPath();
    element.points.forEach((p, i) => {
      if (i === 0) {
        ctx.moveTo(p.x, p.y);
      } else {
        ctx.lineTo(p.x, p.y);
      }
    });
    ctx.closePath();
    ctx.fill();
  }
  
  // 绘制笔触 - 使用 fill 方法
  ctx.fillStyle = element.strokeColor;
  ctx.globalAlpha = currentAlpha * (element.opacity / 100);
  ctx.beginPath();
  
  stroke.forEach(([x, y], i) => {
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  
  ctx.closePath();
  ctx.fill();
};

// 绘制箭头头部
const drawArrowhead = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  color: string,
  strokeWidth: number,
  alpha: number = 1
) => {
  const arrowSize = strokeWidth * 3;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-arrowSize, -arrowSize / 2);
  ctx.lineTo(-arrowSize, arrowSize / 2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
};

// 主渲染函数 - 与 webcreate 的 renderElement 保持一致
export const renderDrawingElement = (
  ctx: CanvasRenderingContext2D,
  element: DrawingElement
) => {
  if (!element.visible) return;
  
  // 跳过无效尺寸的元素（除了手绘、线条、箭头、文字和图片）
  if (element.type !== 'brush' && element.type !== 'free_draw' && 
      element.type !== 'line' && element.type !== 'arrow' && 
      element.type !== 'text' && element.type !== 'image' && 
      (element.width <= 0 || element.height <= 0)) return;

  ctx.save();
  
  // 应用变换 - 与 webcreate 完全一致
  if (element.type === 'brush' || element.type === 'free_draw' || 
      element.type === 'image' || element.type === 'text') {
    // 对于手绘、图片、文字：平移到元素位置并旋转
    ctx.translate(element.x + element.width / 2, element.y + element.height / 2);
    ctx.rotate((element.angle * Math.PI) / 180);
    ctx.translate(-(element.x + element.width / 2), -(element.y + element.height / 2));
  } else if (element.type !== 'line' && element.type !== 'arrow') {
    // 对于几何形状，居中并旋转
    ctx.translate(element.x + element.width / 2, element.y + element.height / 2);
    ctx.rotate((element.angle * Math.PI) / 180);
    ctx.translate(-element.width / 2, -element.height / 2);
  } else {
    // 对于线条和箭头，平移到起始位置
    ctx.translate(element.x, element.y);
  }

  // 创建 rough.js 渲染器
  const rc = rough.canvas(ctx.canvas);
  const currentAlpha = ctx.globalAlpha;
  
  // 处理不同类型的元素
  if (element.type === 'text') {
    // 渲染文字
    ctx.font = `${element.fontSize || 24}px ${element.fontFamily || 'Virgil, Arial, sans-serif'}`;
    ctx.fillStyle = element.strokeColor;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.globalAlpha = currentAlpha * (element.opacity / 100);
    
    if (element.text) {
      const lines = element.text.split('\n');
      const lineHeight = (element.fontSize || 24) * 1.2;
      lines.forEach((line, index) => {
        ctx.fillText(line, element.x, element.y + index * lineHeight);
      });
    }
  } else if (element.type === 'image') {
    // 渲染图片
    if (element.imageUrl) {
      const img = new Image();
      img.src = element.imageUrl;
      if (img.complete) {
        ctx.globalAlpha = currentAlpha * (element.opacity / 100);
        ctx.drawImage(img, element.x, element.y, element.width, element.height);
      }
    }
  } else if (element.type === 'brush' || element.type === 'free_draw') {
    // 手绘笔触使用 perfect-freehand
    renderFreeDraw(ctx, element);
  } else {
    // 其他形状使用 rough.js
    const roughOptions = generateRoughOptions(element, currentAlpha);
    
    switch (element.type) {
      case 'rectangle':
        // 填充
        if (element.fillStyle !== 'none') {
          const fillOptions = {
            ...roughOptions,
            fill: element.fillColor,
            fillStyle: element.fillStyle === 'hachure' ? 'hachure' : 
                      element.fillStyle === 'cross-hatch' ? 'cross-hatch' : 'solid',
            stroke: 'transparent',
            strokeWidth: 0
          };
          rc.rectangle(0, 0, element.width, element.height, fillOptions);
        }
        // 描边
        rc.rectangle(0, 0, element.width, element.height, roughOptions);
        break;
        
      case 'ellipse':
        if (element.fillStyle !== 'none') {
          const fillOptions = {
            ...roughOptions,
            fill: element.fillColor,
            fillStyle: element.fillStyle === 'hachure' ? 'hachure' : 
                      element.fillStyle === 'cross-hatch' ? 'cross-hatch' : 'solid',
            stroke: 'transparent',
            strokeWidth: 0
          };
          rc.ellipse(element.width / 2, element.height / 2, element.width, element.height, fillOptions);
        }
        rc.ellipse(element.width / 2, element.height / 2, element.width, element.height, roughOptions);
        break;
        
      case 'diamond':
        {
          const centerX = element.width / 2;
          const centerY = element.height / 2;
          const diamondPoints = [
            [centerX, 0] as [number, number],
            [element.width, centerY] as [number, number],
            [centerX, element.height] as [number, number],
            [0, centerY] as [number, number]
          ];
          if (element.fillStyle !== 'none') {
            const fillOptions = {
              ...roughOptions,
              fill: element.fillColor,
              fillStyle: element.fillStyle === 'hachure' ? 'hachure' : 
                        element.fillStyle === 'cross-hatch' ? 'cross-hatch' : 'solid',
              stroke: 'transparent',
              strokeWidth: 0
            };
            rc.polygon(diamondPoints, fillOptions);
          }
          rc.polygon(diamondPoints, roughOptions);
        }
        break;
        
      case 'line':
      case 'arrow':
        rc.line(0, 0, element.width, element.height, roughOptions);
        
        // 绘制箭头头部
        if (element.type === 'arrow') {
          const angle = Math.atan2(element.height, element.width);
          drawArrowhead(ctx, element.width, element.height, angle, 
            element.strokeColor, element.strokeWidth, currentAlpha * (element.opacity / 100));
        }
        break;
    }
  }
  
  ctx.restore();
};

// 渲染整个场景
export const renderDrawingScene = (
  ctx: CanvasRenderingContext2D,
  elements: DrawingElement[],
  backgroundColor: string = '#ffffff'
) => {
  // 清空画布并填充背景
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  
  // 渲染所有元素
  elements.forEach(element => {
    if (element.visible) {
      ctx.save();
      renderDrawingElement(ctx, element);
      ctx.restore();
    }
  });
};
