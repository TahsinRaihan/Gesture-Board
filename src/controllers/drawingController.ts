/**
 * Drawing Controller
 * Manages drawing interactions and state updates
 */

import { useStore } from '@/store/store';
import { Point, DrawingObject } from '@/types';
import { createDrawingObject } from '@/utils/helpers';
import { collaborationService } from '@/services/collaborationService';

let isDrawing = false;
let currentPath: Point[] = [];
let startPoint: Point | null = null;
let currentDrawingObjectId: string | null = null;

/**
 * Start drawing
 */
export const startDrawing = (point: Point): void => {
  const state = useStore.getState();

  if (state.activeTool === 'color-picker') {
    return; // Color picker handled differently
  }

  isDrawing = true;
  startPoint = point;
  currentPath = [point];
  currentDrawingObjectId = null;

  // For freehand tools, create the object immediately so it renders as you draw
  if (state.activeTool === 'pencil' || state.activeTool === 'eraser') {
    const toolType = state.activeTool === 'eraser' ? 'freehand' : 'freehand';
    const color = state.activeTool === 'eraser' ? '#FFFFFF' : state.activeColor;
    const width = state.activeTool === 'eraser' ? state.strokeWidth * 2 : state.strokeWidth;
    
    const drawingObject = createDrawingObject(
      toolType,
      [point],
      color,
      width
    );
    
    state.addObjectToLayer(drawingObject);
    currentDrawingObjectId = drawingObject.id;

    // Broadcast to collaborators
    if (collaborationService.isActive()) {
      collaborationService.addObject(drawingObject);
    }
  } 
  // For shape tools, also create object immediately for preview
  else if (['rectangle', 'square', 'circle', 'triangle', 'star', 'pentagon', 'line'].includes(state.activeTool)) {
    const shapeType = state.activeTool;
    const drawingObject = createDrawingObject(
      shapeType as any,
      [point, point], // Use same point twice initially
      state.activeColor,
      state.strokeWidth
    );
    
    state.addObjectToLayer(drawingObject);
    currentDrawingObjectId = drawingObject.id;

    // Broadcast to collaborators
    if (collaborationService.isActive()) {
      collaborationService.addObject(drawingObject);
    }
  }

  state.startDrawing();
  state.pushHistory();
};

/**
 * Continue drawing (mouse move / hand tracking)
 */
export const continueDrawing = (point: Point): void => {
  if (!isDrawing || !startPoint) return;

  const state = useStore.getState();

  if (state.activeTool === 'pencil' || state.activeTool === 'eraser') {
    currentPath.push(point);
    
    // Update the drawing object in real-time
    if (currentDrawingObjectId) {
      state.updateObjectInLayer(currentDrawingObjectId, {
        points: [...currentPath],
      });

      // Broadcast real-time updates for freehand drawing
      if (collaborationService.isActive()) {
        collaborationService.updateObject(currentDrawingObjectId, {
          points: [...currentPath],
        });
      }
    }
  } 
  // For shape tools, show preview while dragging
  else if (['rectangle', 'square', 'circle', 'triangle', 'star', 'pentagon', 'line'].includes(state.activeTool)) {
    if (currentDrawingObjectId && startPoint) {
      state.updateObjectInLayer(currentDrawingObjectId, {
        points: [startPoint, point],
      });

      // Broadcast real-time updates for shape preview
      if (collaborationService.isActive()) {
        collaborationService.updateObject(currentDrawingObjectId, {
          points: [startPoint, point],
        });
      }
    }
  }
};

/**
 * Finish drawing
 */
export const finishDrawing = (endPoint: Point): void => {
  if (!isDrawing || !startPoint) return;

  const state = useStore.getState();

  isDrawing = false;
  
  // For freehand tools (pencil, eraser), object was already created and updated
  if (state.activeTool === 'pencil' || state.activeTool === 'eraser') {
    if (currentDrawingObjectId) {
      // Add the end point to finalize
      currentPath.push(endPoint);
      state.updateObjectInLayer(currentDrawingObjectId, {
        points: [...currentPath],
      });
    }
  } 
  // For shape tools, object was already created with preview, just finalize
  else if (['rectangle', 'square', 'circle', 'triangle', 'star', 'pentagon', 'line'].includes(state.activeTool)) {
    if (currentDrawingObjectId) {
      // Already updated during mousemove, no further action needed
      // Object is already in the layer with final points
    }
  }

  state.stopDrawing();

  // Reset
  currentPath = [];
  startPoint = null;
  currentDrawingObjectId = null;
};

/**
 * Cancel current drawing
 */
export const cancelDrawing = (): void => {
  if (!isDrawing) return;

  const state = useStore.getState();
  state.stopDrawing();

  isDrawing = false;
  currentPath = [];
  startPoint = null;
};

/**
 * Add text to canvas
 */
export const addText = (text: string, position: Point, fontSize: number = 16): void => {
  const state = useStore.getState();

  if (!text || text.trim() === '') {
    return;
  }

  const drawingObject = createDrawingObject('text', [], state.activeColor, 0);
  
  // For text objects, store position and text content
  const textObject: DrawingObject = {
    ...drawingObject,
    text,
    fontSize,
    x: position.x,
    y: position.y,
  };

  state.addObjectToLayer(textObject);
  state.pushHistory();

  // Broadcast to collaborators
  if (collaborationService.isActive()) {
    collaborationService.addObject(textObject);
  }
};

/**
 * Initiate text entry - called when text tool is clicked
 * Now just returns the position for the text input box to be displayed
 */
export const initiateTextEntry = (position: Point): Point => {
  const state = useStore.getState();

  if (state.activeTool !== 'text') {
    return position;
  }

  // Return position for App.tsx to show the text input box
  return position;
};

/**
 * Get current preview object (for rendering preview while drawing)
 */
export const getDrawingPreview = (): DrawingObject | null => {
  if (!isDrawing || !startPoint) {
    return null;
  }

  const state = useStore.getState();

  switch (state.activeTool) {
    case 'pencil':
    case 'eraser':
      return createDrawingObject(
        'freehand',
        currentPath,
        state.activeTool === 'eraser' ? '#FFFFFF' : state.activeColor,
        state.strokeWidth
      );

    default:
      return null;
  }
};

/**
 * Get all current drawing points
 */
export const getCurrentPath = (): Point[] => {
  return [...currentPath];
};

/**
 * Check if currently drawing
 */
export const getIsDrawing = (): boolean => {
  return isDrawing;
};

/**
 * Find object at point (for selection)
 */
export const getObjectAtPoint = (point: Point, tolerance: number = 10): DrawingObject | null => {
  const state = useStore.getState();

  // Search in reverse order (top to bottom) to get the topmost object
  for (let i = state.layers.length - 1; i >= 0; i--) {
    const layer = state.layers[i];
    if (!layer.visible) continue;

    for (let j = layer.objects.length - 1; j >= 0; j--) {
      const obj = layer.objects[j];
      
      // Check if point is within object bounds with tolerance
      if (isPointInObject(point, obj, tolerance)) {
        return obj;
      }
    }
  }

  return null;
};

/**
 * Check if point is inside/near an object
 */
export const isPointInObject = (point: Point, obj: DrawingObject, tolerance: number = 10): boolean => {
  if (obj.points.length === 0) return false;

  switch (obj.type) {
    case 'freehand':
      // For freehand, check if point is close to any path point
      return obj.points.some((p) => {
        const dx = p.x - point.x;
        const dy = p.y - point.y;
        return Math.sqrt(dx * dx + dy * dy) < tolerance;
      });

    case 'rectangle':
    case 'square':
    case 'circle':
    case 'triangle':
    case 'star':
    case 'pentagon':
    case 'line':
      // For shapes, check bounding box
      if (obj.points.length >= 2) {
        const minX = Math.min(obj.points[0].x, obj.points[1].x) - tolerance;
        const maxX = Math.max(obj.points[0].x, obj.points[1].x) + tolerance;
        const minY = Math.min(obj.points[0].y, obj.points[1].y) - tolerance;
        const maxY = Math.max(obj.points[0].y, obj.points[1].y) + tolerance;

        return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY;
      }
      return false;

    case 'text':
      // For text, check bounding box
      if (obj.x !== undefined && obj.y !== undefined && obj.fontSize) {
        const width = (obj.text?.length || 0) * (obj.fontSize * 0.6);
        const height = obj.fontSize * 1.2;
        return (
          point.x >= obj.x - tolerance &&
          point.x <= obj.x + width + tolerance &&
          point.y >= obj.y - tolerance &&
          point.y <= obj.y + height + tolerance
        );
      }
      return false;

    default:
      return false;
  }
};

/**
 * Drag selected object
 */
export let dragStartPoint: Point | null = null;
export let dragStartObjectPos: Point | null = null;

export const startDraggingObject = (point: Point): void => {
  dragStartPoint = point;
  dragStartObjectPos = point;
};

export const dragObject = (point: Point, objectId: string): void => {
  if (!dragStartPoint || !dragStartObjectPos) return;

  const state = useStore.getState();

  // Calculate delta
  const deltaX = point.x - dragStartPoint.x;
  const deltaY = point.y - dragStartPoint.y;

  // Find the object and move it
  for (const layer of state.layers) {
    const obj = layer.objects.find((o) => o.id === objectId);
    if (obj) {
      // Move all points in the object
      const newPoints = obj.points.map((p) => ({
        x: p.x + deltaX,
        y: p.y + deltaY,
      }));

      // Also move x, y coordinates for text objects
      const updates: Partial<DrawingObject> = {
        points: newPoints,
      };

      if (obj.x !== undefined) {
        (updates as any).x = obj.x + deltaX;
      }
      if (obj.y !== undefined) {
        (updates as any).y = obj.y + deltaY;
      }

      state.updateObjectInLayer(objectId, updates);
      dragStartPoint = point;
      return;
    }
  }
};

export const stopDraggingObject = (): void => {
  dragStartPoint = null;
  dragStartObjectPos = null;
};
