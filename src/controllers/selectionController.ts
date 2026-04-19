/**
 * Selection Controller
 * Handles object selection and box selection (marquee select)
 */

import { useStore } from '@/store/store';
import { Point, DrawingObject } from '@/types';

export interface SelectionBox {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export let isDraggingObject = false;
export let dragStartPoint: Point | null = null;
export let selectedObjectForDrag: DrawingObject | null = null;

export let isBoxSelecting = false;
export let boxSelectionStart: Point | null = null;
export let boxSelectionCurrentPoint: Point = { x: 0, y: 0 };

/**
 * Start dragging an object
 */
export const startDraggingObject = (point: Point, object: DrawingObject): void => {
  isDraggingObject = true;
  dragStartPoint = point;
  selectedObjectForDrag = object;
};

/**
 * Drag object (update position)
 */
export const dragObject = (point: Point): void => {
  if (!isDraggingObject || !dragStartPoint || !selectedObjectForDrag) return;

  const state = useStore.getState();

  // Calculate delta
  const deltaX = point.x - dragStartPoint.x;
  const deltaY = point.y - dragStartPoint.y;

  // Move all points in the object
  const newPoints = selectedObjectForDrag.points.map((p) => ({
    x: p.x + deltaX,
    y: p.y + deltaY,
  }));

  // Also move x, y coordinates for text objects
  const updates: any = {
    points: newPoints,
  };

  if (selectedObjectForDrag.x !== undefined) {
    updates.x = selectedObjectForDrag.x + deltaX;
  }
  if (selectedObjectForDrag.y !== undefined) {
    updates.y = selectedObjectForDrag.y + deltaY;
  }

  state.updateObjectInLayer(selectedObjectForDrag.id, updates);
  dragStartPoint = point;
};

/**
 * Stop dragging object
 */
export const stopDraggingObject = (): void => {
  isDraggingObject = false;
  dragStartPoint = null;
  selectedObjectForDrag = null;
};

/**
 * Start box selection
 */
export const startBoxSelection = (point: Point): void => {
  isBoxSelecting = true;
  boxSelectionStart = point;
  boxSelectionCurrentPoint = point;
};

/**
 * Update the current point for box selection (call during mousemove)
 */
export const updateBoxSelectionPoint = (point: Point): void => {
  boxSelectionCurrentPoint = point;
};

/**
 * Get current selection box
 */
export const getSelectionBox = (): SelectionBox | null => {
  if (!isBoxSelecting || !boxSelectionStart) return null;

  return {
    startX: Math.min(boxSelectionStart.x, boxSelectionCurrentPoint.x),
    startY: Math.min(boxSelectionStart.y, boxSelectionCurrentPoint.y),
    endX: Math.max(boxSelectionStart.x, boxSelectionCurrentPoint.x),
    endY: Math.max(boxSelectionStart.y, boxSelectionCurrentPoint.y),
  };
};

/**
 * Check if object is within selection box
 */
export const isObjectInSelectionBox = (obj: DrawingObject, box: SelectionBox): boolean => {
  if (obj.points.length === 0) return false;

  // For each point type, check if bounds intersect with box
  switch (obj.type) {
    case 'freehand':
      // Check if any point is inside box
      return obj.points.some(
        (p) =>
          p.x >= box.startX &&
          p.x <= box.endX &&
          p.y >= box.startY &&
          p.y <= box.endY
      );

    case 'rectangle':
    case 'square':
    case 'circle':
    case 'triangle':
    case 'star':
    case 'pentagon':
    case 'line':
      // For shapes, check if start or end point is in box
      if (obj.points.length >= 2) {
        const hasPointInBox =
          (obj.points[0].x >= box.startX &&
            obj.points[0].x <= box.endX &&
            obj.points[0].y >= box.startY &&
            obj.points[0].y <= box.endY) ||
          (obj.points[1].x >= box.startX &&
            obj.points[1].x <= box.endX &&
            obj.points[1].y >= box.startY &&
            obj.points[1].y <= box.endY);
        return hasPointInBox;
      }
      return false;

    case 'text':
      // For text, check if position is in box
      if (obj.x !== undefined && obj.y !== undefined) {
        return obj.x >= box.startX && obj.x <= box.endX && obj.y >= box.startY && obj.y <= box.endY;
      }
      return false;

    default:
      return false;
  }
};

/**
 * Get all objects in selection box
 */
export const getObjectsInSelectionBox = (box: SelectionBox): DrawingObject[] => {
  const state = useStore.getState();
  const objects: DrawingObject[] = [];

  for (const layer of state.layers) {
    if (!layer.visible) continue;
    for (const obj of layer.objects) {
      if (isObjectInSelectionBox(obj, box)) {
        objects.push(obj);
      }
    }
  }

  return objects;
};

/**
 * End box selection and select all objects in box
 */
export const endBoxSelection = (): DrawingObject[] => {
  isBoxSelecting = false;
  boxSelectionStart = null;
  boxSelectionCurrentPoint = { x: 0, y: 0 };
  return [];
};
