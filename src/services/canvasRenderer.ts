/**
 * Canvas Rendering Service
 * Handles rendering of drawing objects to canvas
 */

import { DrawingObject, Point, CanvasLayer, HandPose } from '@/types';
import { smoothPoints } from '@/utils/helpers';

let canvasContext: CanvasRenderingContext2D | null = null;
let canvas: HTMLCanvasElement | null = null;

/**
 * Initialize canvas rendering
 */
export const initCanvasRenderer = (canvasElement: HTMLCanvasElement): void => {
  canvas = canvasElement;
  canvasContext = canvas.getContext('2d', { willReadFrequently: true });

  if (!canvasContext) {
    throw new Error('Failed to get 2D context from canvas');
  }

  // Set canvas size to window size
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
};

/**
 * Resize canvas to window size
 */
const resizeCanvas = (): void => {
  if (!canvas) return;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
};

/**
 * Clear the entire canvas
 */
export const clearCanvas = (): void => {
  if (!canvasContext || !canvas) return;
  
  // Get the theme from the document
  const theme = document.documentElement.getAttribute('data-theme') || 'light';
  const backgroundColor = theme === 'dark' ? '#0f172a' : '#ffffff';
  
  canvasContext.fillStyle = backgroundColor;
  canvasContext.fillRect(0, 0, canvas.width, canvas.height);
};

/**
 * Draw a single drawing object
 */
export const drawObject = (obj: DrawingObject): void => {
  if (!canvasContext) return;

  canvasContext.strokeStyle = obj.color;
  canvasContext.fillStyle = obj.fillColor || obj.color;
  canvasContext.lineWidth = obj.strokeWidth;
  canvasContext.lineCap = 'round';
  canvasContext.lineJoin = 'round';

  switch (obj.type) {
    case 'freehand':
      drawFreehand(obj.points);
      break;

    case 'rectangle':
      if (obj.points.length === 2) {
        drawRectangle(obj.points[0], obj.points[1], obj.color, obj.strokeWidth);
      }
      break;

    case 'square':
      if (obj.points.length === 2) {
        drawSquare(obj.points[0], obj.points[1], obj.color, obj.strokeWidth);
      }
      break;

    case 'circle':
      if (obj.points.length === 2) {
        drawCircle(obj.points[0], obj.points[1], obj.color, obj.strokeWidth);
      }
      break;

    case 'triangle':
      if (obj.points.length === 2) {
        drawTriangle(obj.points[0], obj.points[1], obj.color, obj.strokeWidth);
      }
      break;

    case 'star':
      if (obj.points.length === 2) {
        drawStar(obj.points[0], obj.points[1], obj.color, obj.strokeWidth);
      }
      break;

    case 'pentagon':
      if (obj.points.length === 2) {
        drawPentagon(obj.points[0], obj.points[1], obj.color, obj.strokeWidth);
      }
      break;

    case 'line':
      if (obj.points.length === 2) {
        drawLine(obj.points[0], obj.points[1], obj.color, obj.strokeWidth);
      }
      break;

    case 'text':
      if (obj.x !== undefined && obj.y !== undefined) {
        drawText(
          obj.text || '',
          obj.x,
          obj.y,
          obj.fontSize || 16,
          obj.color
        );
      }
      break;

    default:
      break;
  }
};

/**
 * Draw freehand path
 */
const drawFreehand = (points: Point[]): void => {
  if (!canvasContext || points.length === 0) return;

  // Smooth the points for better visual quality
  const smoothedPoints = smoothPoints(points, 0.2);

  canvasContext.beginPath();
  canvasContext.moveTo(smoothedPoints[0].x, smoothedPoints[0].y);

  for (let i = 1; i < smoothedPoints.length; i++) {
    canvasContext.lineTo(smoothedPoints[i].x, smoothedPoints[i].y);
  }

  canvasContext.stroke();
};

/**
 * Draw rectangle
 */
const drawRectangle = (
  start: Point,
  end: Point,
  color: string,
  strokeWidth: number
): void => {
  if (!canvasContext) return;

  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);
  const width = Math.abs(end.x - start.x);
  const height = Math.abs(end.y - start.y);

  canvasContext.strokeStyle = color;
  canvasContext.lineWidth = strokeWidth;
  canvasContext.strokeRect(x, y, width, height);
};

/**
 * Draw circle
 */
const drawCircle = (
  center: Point,
  edgePoint: Point,
  color: string,
  strokeWidth: number
): void => {
  if (!canvasContext) return;

  const radius = Math.sqrt(
    Math.pow(edgePoint.x - center.x, 2) + Math.pow(edgePoint.y - center.y, 2)
  );

  canvasContext.strokeStyle = color;
  canvasContext.lineWidth = strokeWidth;
  canvasContext.beginPath();
  canvasContext.arc(center.x, center.y, radius, 0, 2 * Math.PI);
  canvasContext.stroke();
};

/**
 * Draw square
 */
const drawSquare = (
  start: Point,
  end: Point,
  color: string,
  strokeWidth: number
): void => {
  if (!canvasContext) return;

  const width = Math.abs(end.x - start.x);
  const height = Math.abs(end.y - start.y);
  const side = Math.min(width, height);

  const x = end.x > start.x ? start.x : start.x - side;
  const y = end.y > start.y ? start.y : start.y - side;

  canvasContext.strokeStyle = color;
  canvasContext.lineWidth = strokeWidth;
  canvasContext.strokeRect(x, y, side, side);
};

/**
 * Draw triangle
 */
const drawTriangle = (
  start: Point,
  end: Point,
  color: string,
  strokeWidth: number
): void => {
  if (!canvasContext) return;

  const centerX = (start.x + end.x) / 2;
  const centerY = Math.min(start.y, end.y);
  const radius = Math.abs(end.x - start.x) / 2;

  canvasContext.strokeStyle = color;
  canvasContext.lineWidth = strokeWidth;
  canvasContext.beginPath();

  // Top vertex
  canvasContext.moveTo(centerX, centerY);
  // Bottom left
  canvasContext.lineTo(centerX - radius, centerY + radius * 1.5);
  // Bottom right
  canvasContext.lineTo(centerX + radius, centerY + radius * 1.5);
  // Back to top
  canvasContext.closePath();
  canvasContext.stroke();
};

/**
 * Draw star (5-point)
 */
const drawStar = (
  start: Point,
  end: Point,
  color: string,
  strokeWidth: number
): void => {
  if (!canvasContext) return;

  const centerX = (start.x + end.x) / 2;
  const centerY = (start.y + end.y) / 2;
  const radius = Math.abs(end.x - start.x) / 2;
  const points = 5;

  canvasContext.strokeStyle = color;
  canvasContext.lineWidth = strokeWidth;
  canvasContext.beginPath();

  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const r = i % 2 === 0 ? radius : radius / 2;
    const x = centerX + r * Math.cos(angle);
    const y = centerY + r * Math.sin(angle);

    if (i === 0) {
      canvasContext.moveTo(x, y);
    } else {
      canvasContext.lineTo(x, y);
    }
  }

  canvasContext.closePath();
  canvasContext.stroke();
};

/**
 * Draw pentagon
 */
const drawPentagon = (
  start: Point,
  end: Point,
  color: string,
  strokeWidth: number
): void => {
  if (!canvasContext) return;

  const centerX = (start.x + end.x) / 2;
  const centerY = (start.y + end.y) / 2;
  const radius = Math.abs(end.x - start.x) / 2;
  const sides = 5;

  canvasContext.strokeStyle = color;
  canvasContext.lineWidth = strokeWidth;
  canvasContext.beginPath();

  for (let i = 0; i < sides; i++) {
    const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);

    if (i === 0) {
      canvasContext.moveTo(x, y);
    } else {
      canvasContext.lineTo(x, y);
    }
  }

  canvasContext.closePath();
  canvasContext.stroke();
};

/**
 * Draw line
 */
const drawLine = (
  start: Point,
  end: Point,
  color: string,
  strokeWidth: number
): void => {
  if (!canvasContext) return;

  canvasContext.strokeStyle = color;
  canvasContext.lineWidth = strokeWidth;
  canvasContext.beginPath();
  canvasContext.moveTo(start.x, start.y);
  canvasContext.lineTo(end.x, end.y);
  canvasContext.stroke();
};

/**
 * Draw text
 */
const drawText = (
  text: string,
  x: number,
  y: number,
  fontSize: number,
  color: string
): void => {
  if (!canvasContext) return;

  canvasContext.fillStyle = color;
  canvasContext.font = `${fontSize}px Arial`;
  canvasContext.fillText(text, x, y);
};

/**
 * Draw all layers
 */
export const drawLayers = (layers: CanvasLayer[]): void => {
  clearCanvas();

  layers.forEach((layer) => {
    if (layer.visible) {
      if (!canvasContext) return;
      canvasContext.globalAlpha = layer.opacity;

      layer.objects.forEach((obj) => {
        drawObject(obj);
      });

      canvasContext.globalAlpha = 1;
    }
  });
};

/**
 * Draw a preview of current drawing (for ghost preview)
 */
export const drawPreview = (
  preview: DrawingObject | null,
  layers: CanvasLayer[]
): void => {
  if (!preview) {
    drawLayers(layers);
    return;
  }

  // Draw existing layers
  drawLayers(layers);

  // Draw preview on top with reduced opacity
  if (canvasContext) {
    canvasContext.globalAlpha = 0.5;
    drawObject(preview);
    canvasContext.globalAlpha = 1;
  }
};

/**
 * Draw cursor (hand position)
 */
export const drawCursor = (
  position: Point,
  size: number = 10,
  color: string = '#FF0000',
  gestureType: string = 'none'
): void => {
  if (!canvasContext) return;

  // Draw circle for cursor position
  canvasContext.save();
  canvasContext.strokeStyle = color;
  canvasContext.lineWidth = 2;
  canvasContext.beginPath();
  canvasContext.arc(position.x, position.y, size, 0, 2 * Math.PI);
  canvasContext.stroke();

  // Draw gesture indicator
  if (gestureType === 'pinch') {
    canvasContext.fillStyle = color;
    canvasContext.beginPath();
    canvasContext.arc(position.x, position.y, size / 2, 0, 2 * Math.PI);
    canvasContext.fill();
  }

  canvasContext.restore();
};

/**
 * Get pixel data from canvas for color picker
 */
export const getCanvasPixelColor = (x: number, y: number): string => {
  if (!canvasContext) return '#000000';

  const imageData = canvasContext.getImageData(x, y, 1, 1);
  const data = imageData.data;

  return `#${((1 << 24) + (data[0] << 16) + (data[1] << 8) + data[2])
    .toString(16)
    .slice(1)
    .toUpperCase()}`;
};

/**
 * Export canvas as image
 */
export const exportCanvasAsImage = (filename: string = 'hand-figma.png', format: 'png' | 'jpg' = 'png', background: 'white' | 'dark' | 'transparent' = 'white'): void => {
  if (!canvas || !canvasContext) return;

  // Create temporary canvas for export with background
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  const tempCtx = tempCanvas.getContext('2d');

  if (!tempCtx) return;

  // Fill background
  if (background === 'white') {
    tempCtx.fillStyle = '#FFFFFF';
  } else if (background === 'dark') {
    tempCtx.fillStyle = '#1e293b';
  } else {
    tempCtx.fillStyle = 'transparent';
  }
  tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

  // Draw canvas content
  tempCtx.drawImage(canvas, 0, 0);

  // Export
  const link = document.createElement('a');
  
  if (format === 'jpg') {
    link.href = tempCanvas.toDataURL('image/jpeg', 0.95);
    link.download = filename.replace(/\.png$/, '.jpg');
  } else {
    link.href = tempCanvas.toDataURL('image/png');
    link.download = filename;
  }
  
  link.click();
};

/**
 * Export as PDF (using canvas screenshot)
 */
export const exportCanvasAsPDF = (filename: string = 'hand-figma.pdf', background: 'white' | 'dark' = 'white'): void => {
  if (!canvas || !canvasContext) return;

  // Note: This requires a PDF library. For now, we'll prompt user and use canvas export
  // In a real app, you'd use a library like jsPDF or PDFKit
  const response = window.confirm(
    'PDF export requires a library. Do you want to export as PNG instead?'
  );
  
  if (response) {
    exportCanvasAsImage(filename.replace(/\.pdf$/, '.png'), 'png', background);
  }
};

/**
 * Draw selection box around object
 */
export const drawSelection = (obj: DrawingObject): void => {
  if (!canvasContext || obj.points.length === 0) return;

  canvasContext.strokeStyle = '#2563eb';
  canvasContext.lineWidth = 2;
  canvasContext.setLineDash([5, 5]);

  switch (obj.type) {
    case 'freehand':
      // Draw bounding box for freehand
      let minX = obj.points[0].x;
      let maxX = obj.points[0].x;
      let minY = obj.points[0].y;
      let maxY = obj.points[0].y;

      obj.points.forEach((p) => {
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
      });

      canvasContext.strokeRect(minX - 5, minY - 5, maxX - minX + 10, maxY - minY + 10);
      break;

    case 'rectangle':
    case 'square':
    case 'circle':
    case 'triangle':
    case 'star':
    case 'pentagon':
    case 'line':
      if (obj.points.length >= 2) {
        const x = Math.min(obj.points[0].x, obj.points[1].x) - 5;
        const y = Math.min(obj.points[0].y, obj.points[1].y) - 5;
        const width = Math.abs(obj.points[1].x - obj.points[0].x) + 10;
        const height = Math.abs(obj.points[1].y - obj.points[0].y) + 10;
        canvasContext.strokeRect(x, y, width, height);
      }
      break;

    case 'text':
      if (obj.x !== undefined && obj.y !== undefined && obj.fontSize) {
        const width = (obj.text?.length || 0) * (obj.fontSize * 0.6) + 10;
        const height = obj.fontSize * 1.5;
        canvasContext.strokeRect(obj.x - 5, obj.y - 5, width, height);
      }
      break;

    default:
      break;
  }

  canvasContext.setLineDash([]);
};

/**
 * Draw marquee selection box
 */
export const drawMarqueeBox = (startX: number, startY: number, endX: number, endY: number): void => {
  if (!canvasContext) return;

  const x = Math.min(startX, endX);
  const y = Math.min(startY, endY);
  const width = Math.abs(endX - startX);
  const height = Math.abs(endY - startY);

  // Fill with semi-transparent color
  canvasContext.fillStyle = 'rgba(37, 99, 235, 0.1)';
  canvasContext.fillRect(x, y, width, height);

  // Draw border
  canvasContext.strokeStyle = '#2563eb';
  canvasContext.lineWidth = 2;
  canvasContext.setLineDash([5, 5]);
  canvasContext.strokeRect(x, y, width, height);
  canvasContext.setLineDash([]);
};

/**
 * Draw hand landmarks and skeleton
 */
export const drawHandLandmarks = (handPose: HandPose | null): void => {
  if (!canvasContext || !handPose) return;

  const landmarks = handPose.landmarks;

  // Hand skeleton connections (MediaPipe format)
  const connections = [
    [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
    [0, 5], [5, 6], [6, 7], [7, 8], // Index
    [0, 9], [9, 10], [10, 11], [11, 12], // Middle
    [0, 13], [13, 14], [14, 15], [15, 16], // Ring
    [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
    [5, 9], [9, 13], [13, 17], // Palm connections
  ];

  // Draw skeleton (connections)
  canvasContext.strokeStyle = '#00FF00';
  canvasContext.lineWidth = 2;
  connections.forEach(([start, end]) => {
    const startLandmark = landmarks[start];
    const endLandmark = landmarks[end];
    if (startLandmark && endLandmark) {
      canvasContext!.beginPath();
      canvasContext!.moveTo(startLandmark.x, startLandmark.y);
      canvasContext!.lineTo(endLandmark.x, endLandmark.y);
      canvasContext!.stroke();
    }
  });

  // Draw landmark points
  landmarks.forEach((landmark: Point, index: number) => {
    // Color code by finger
    let color = '#FF6B6B'; // Default red for wrist
    if (index >= 1 && index <= 4) color = '#4ECDC4'; // Thumb - teal
    if (index >= 5 && index <= 8) color = '#45B7D1'; // Index - blue
    if (index >= 9 && index <= 12) color = '#FFA07A'; // Middle - coral
    if (index >= 13 && index <= 16) color = '#98D8C8'; // Ring - mint
    if (index >= 17 && index <= 20) color = '#F7DC6F'; // Pinky - yellow

    // Wrist is larger
    const radius = index === 0 ? 8 : 5;

    // Draw filled circle
    canvasContext!.fillStyle = color;
    canvasContext!.beginPath();
    canvasContext!.arc(landmark.x, landmark.y, radius, 0, 2 * Math.PI);
    canvasContext!.fill();

    // Draw outline
    canvasContext!.strokeStyle = '#FFFFFF';
    canvasContext!.lineWidth = 1;
    canvasContext!.stroke();

    // Label important points
    if (index === 0 || index === 4 || index === 8 || index === 12 || index === 16 || index === 20) {
      canvasContext!.fillStyle = '#FFFFFF';
      canvasContext!.font = 'bold 10px Arial';
      canvasContext!.fillText(index.toString(), landmark.x + 8, landmark.y - 8);
    }
  });
};

/**
 * Draw transparent mode - semi-transparent overlay with landmarks and debug info
 */
export const drawTransparentMode = (isTransparent: boolean, handDetected: boolean = false, fullTransparent: boolean = false): void => {
  if (!canvasContext || !canvas) return;

  if (isTransparent) {
    // Create semi-transparent overlay - make it more visible or fully transparent
    const theme = document.documentElement.getAttribute('data-theme') || 'light';
    const overlayColor = fullTransparent ? 'rgba(255, 255, 255, 0.1)' : (theme === 'dark' ? 'rgba(15, 23, 42, 0.4)' : 'rgba(255, 255, 255, 0.4)');

    canvasContext.fillStyle = overlayColor;
    canvasContext.fillRect(0, 0, canvas.width, canvas.height);

    // Add border indicator - make it thick and obvious
    canvasContext.strokeStyle = handDetected ? '#00FF00' : '#FFA500';
    canvasContext.lineWidth = 4;
    canvasContext.setLineDash([10, 5]);
    canvasContext.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
    canvasContext.setLineDash([]);

    // Add main label
    canvasContext.fillStyle = handDetected ? '#00FF00' : '#FFA500';
    canvasContext.font = 'bold 16px Arial';
    const modeText = fullTransparent ? '🖐️ FULL TRANSPARENT MODE - Hand Tracking ACTIVE' : '🖐️ TRANSPARENT MODE - Hand Tracking ACTIVE';
    canvasContext.fillText(modeText, 10, 30);

    // Add hand detection status
    canvasContext.font = 'bold 14px Arial';
    if (handDetected) {
      canvasContext.fillStyle = '#00FF00';
      canvasContext.fillText('✓ Hand DETECTED - Pinch to interact', 10, 55);
    } else {
      canvasContext.fillStyle = '#FFA500';
      canvasContext.fillText('⏳ Searching for hand - Position your hand in view', 10, 55);
    }

    // Add instructions
    canvasContext.font = '12px Arial';
    canvasContext.fillStyle = '#00FF00';
    canvasContext.fillText('Pinch (👌) = Draw | Open Hand (✋) = Release', 10, 75);
  }
};

/**
 * Cleanup
 */
export const cleanupCanvasRenderer = (): void => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', resizeCanvas);
  }
  canvasContext = null;
  canvas = null;
};
