/**
 * Utility Helper Functions
 */

import { Point, DrawingObject, CanvasLayer } from '@/types';

/**
 * Generate a unique ID
 */
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Calculate distance between two points
 */
export const distance = (p1: Point, p2: Point): number => {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Debounce function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Clamp a value between min and max
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

/**
 * Convert canvas coordinates to screen coordinates
 */
export const canvasToScreenCoords = (
  canvasPoint: Point,
  zoom: number = 1,
  panX: number = 0,
  panY: number = 0
): Point => {
  return {
    x: canvasPoint.x * zoom + panX,
    y: canvasPoint.y * zoom + panY,
  };
};

/**
 * Convert screen coordinates to canvas coordinates
 */
export const screenToCanvasCoords = (
  screenPoint: Point,
  zoom: number = 1,
  panX: number = 0,
  panY: number = 0
): Point => {
  return {
    x: (screenPoint.x - panX) / zoom,
    y: (screenPoint.y - panY) / zoom,
  };
};

/**
 * Create a new empty layer
 */
export const createLayer = (name: string): CanvasLayer => ({
  id: generateId(),
  name,
  objects: [],
  visible: true,
  opacity: 1,
});

/**
 * Create a new drawing object
 */
export const createDrawingObject = (
  type: DrawingObject['type'],
  points: Point[],
  color: string,
  strokeWidth: number
): DrawingObject => ({
  id: generateId(),
  type,
  points,
  color,
  strokeWidth,
  timestamp: Date.now(),
});

/**
 * Deep clone an object
 */
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Check if point is inside rectangle
 */
export const pointInRect = (
  point: Point,
  rectX: number,
  rectY: number,
  rectWidth: number,
  rectHeight: number
): boolean => {
  return (
    point.x >= rectX &&
    point.x <= rectX + rectWidth &&
    point.y >= rectY &&
    point.y <= rectY + rectHeight
  );
};

/**
 * Smooth array of points using simple smoothing
 */
export const smoothPoints = (points: Point[], factor: number = 0.3): Point[] => {
  if (points.length < 3) return points;

  const smoothed: Point[] = [points[0]];

  for (let i = 1; i < points.length - 1; i++) {
    smoothed.push({
      x: points[i].x * (1 - factor) + (points[i - 1].x + points[i + 1].x) * (factor / 2),
      y: points[i].y * (1 - factor) + (points[i - 1].y + points[i + 1].y) * (factor / 2),
    });
  }

  smoothed.push(points[points.length - 1]);
  return smoothed;
};
