/**
 * Gesture Controller
 * Handles hand gesture recognition and corresponding actions
 */

import { useStore } from '@/store/store';
import { GestureResult, Point, ToolType } from '@/types';
import {
  startDrawing,
  continueDrawing,
  finishDrawing,
  getObjectAtPoint,
  startDraggingObject,
  dragObject,
  stopDraggingObject,
} from './drawingController';

let lastDiscreteGestureTime = 0;
let lastDiscreteGestureType: GestureResult['type'] = 'none';
const GESTURE_DEBOUNCE = 180; // ms

let isDrawingWithGesture = false;
let pinchHoldCounter = 0;
const PINCH_HOLD_THRESHOLD = 3; // Frames to hold pinch state

let isDraggingWithGesture = false;
let draggingObjectId: string | null = null;

const GESTURE_TOOL_SEQUENCE: ToolType[] = [
  'select',
  'drag',
  'pencil',
  'rectangle',
  'square',
  'circle',
  'triangle',
  'star',
  'pentagon',
  'line',
  'text',
  'eraser',
  'color-picker',
];

export const handleGesture = (
  gesture: GestureResult,
  cursorPosition: Point
): void => {
  const state = useStore.getState();

  if (!state.isHandGestureEnabled) return;

  // Update pinch hold counter
  if (gesture.type === 'pinch') {
    pinchHoldCounter = PINCH_HOLD_THRESHOLD;
  } else {
    pinchHoldCounter = Math.max(0, pinchHoldCounter - 1);
  }

  if (pinchHoldCounter > 0) {
    handlePinch(cursorPosition);
    return;
  }

  if (isDrawingWithGesture || isDraggingWithGesture) {
    handleGestureReleased(cursorPosition);
  }

  if (gesture.type === 'none') {
    lastDiscreteGestureType = 'none';
    return;
  }

  const now = Date.now();
  if (gesture.type === lastDiscreteGestureType || now - lastDiscreteGestureTime < GESTURE_DEBOUNCE) {
    return;
  }

  lastDiscreteGestureType = gesture.type;
  lastDiscreteGestureTime = now;

  if (gesture.type === 'fist') {
    state.undo();
    return;
  }

  if (gesture.type === 'open') {
    state.redo();
    return;
  }

  if (gesture.type === 'pointing-up') {
    const currentToolIndex = GESTURE_TOOL_SEQUENCE.indexOf(state.activeTool as ToolType);
    const nextToolIndex = currentToolIndex >= 0 ? (currentToolIndex + 1) % GESTURE_TOOL_SEQUENCE.length : 0;
    switchToolByGesture(nextToolIndex);
  }
};

/**
 * Pinch gesture = Click/Draw
 */
const handlePinch = (cursorPosition: Point): void => {
  const state = useStore.getState();

  if (
    state.activeTool === 'pencil' ||
    state.activeTool === 'eraser' ||
    state.activeTool === 'rectangle' ||
    state.activeTool === 'square' ||
    state.activeTool === 'circle' ||
    state.activeTool === 'triangle' ||
    state.activeTool === 'star' ||
    state.activeTool === 'pentagon' ||
    state.activeTool === 'line'
  ) {
    // Start or continue drawing
    if (!isDrawingWithGesture) {
      startDrawing(cursorPosition);
      isDrawingWithGesture = true;
    } else {
      // Continue drawing for smooth lines
      continueDrawing(cursorPosition);
    }
  } else if (state.activeTool === 'select') {
    // Handle selection - only on initial pinch, not continuous
    if (!isDrawingWithGesture) {
      const obj = getObjectAtPoint(cursorPosition, 15);
      if (obj) {
        state.selectObject(obj.id);
      } else {
        state.deselectObject();
      }
      isDrawingWithGesture = true; // Prevent repeated selections
    }
  } else if (state.activeTool === 'drag') {
    // Handle dragging - start or continue dragging
    if (!isDraggingWithGesture) {
      const obj = getObjectAtPoint(cursorPosition, 15);
      if (obj) {
        startDraggingObject(cursorPosition);
        isDraggingWithGesture = true;
        draggingObjectId = obj.id;
      }
    } else if (draggingObjectId) {
      dragObject(cursorPosition, draggingObjectId);
    }
  } else if (state.activeTool === 'text') {
    // For text tool, we'll handle it in App.tsx since it needs to set state
    console.log('Text tool pinch at', cursorPosition);
  }
};

export const handleGestureReleased = (cursorPosition: Point): void => {
  // If gesture was pinch and now it's not, finish drawing
  if (isDrawingWithGesture) {
    finishDrawing(cursorPosition);
    isDrawingWithGesture = false;
  }

  // Stop dragging if we were dragging
  if (isDraggingWithGesture && draggingObjectId) {
    stopDraggingObject();
    isDraggingWithGesture = false;
    draggingObjectId = null;
  }

  pinchHoldCounter = 0;
  lastDiscreteGestureType = 'none';
};

/**
 * Update cursor position continuously
 */
export const updateCursorPosition = (position: Point): void => {
  const state = useStore.getState();
  state.setCursorPosition(position);

  // If actively drawing with pinch gesture, continue drawing
  if (isDrawingWithGesture && state.isDrawing) {
    continueDrawing(position);
  }

  // If actively dragging with pinch gesture, continue dragging
  if (isDraggingWithGesture && draggingObjectId) {
    dragObject(position, draggingObjectId);
  }
};

/**
 * Switch drawing tool via gesture
 * Can be triggered by specific multi-finger gestures
 */
export const switchToolByGesture = (toolIndex: number): void => {
  if (toolIndex >= 0 && toolIndex < GESTURE_TOOL_SEQUENCE.length) {
    const state = useStore.getState();
    state.setTool(GESTURE_TOOL_SEQUENCE[toolIndex]);
  }
};

/**
 * Clear all drawings
 */
export const clearAllViaGesture = (): void => {
  const state = useStore.getState();
  const confirmed = window.confirm('Clear all drawings? This cannot be undone.');

  if (confirmed) {
    state.clearAll();
    console.log('Canvas cleared via gesture');
  }
};

/**
 * Export canvas via gesture
 */
export const exportCanvasViaGesture = (): void => {
  // This will be handled by the UI component
  console.log('Export canvas triggered');
};

/**
 * Get drawing state
 */
export const getIsDrawingWithGesture = (): boolean => {
  return isDrawingWithGesture;
};

/**
 * Reset gesture controller state
 */
export const resetGestureController = (): void => {
  isDrawingWithGesture = false;
  lastDiscreteGestureTime = 0;
  lastDiscreteGestureType = 'none';
  pinchHoldCounter = 0;
  isDraggingWithGesture = false;
  draggingObjectId = null;
};
