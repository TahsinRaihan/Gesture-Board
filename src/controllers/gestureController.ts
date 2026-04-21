/**
 * Gesture Controller
 * Handles hand gesture recognition and corresponding actions
 */

import { useStore } from '@/store/store';
import { GestureResult, Point } from '@/types';
import {
  startDrawing,
  continueDrawing,
  finishDrawing,
  getObjectAtPoint,
  startDraggingObject,
  dragObject,
  stopDraggingObject,
} from './drawingController';

let lastGestureTime = 0;
const GESTURE_DEBOUNCE = 200; // ms

let isDrawingWithGesture = false;
let pinchHoldCounter = 0;
const PINCH_HOLD_THRESHOLD = 3; // Frames to hold pinch state

let isDraggingWithGesture = false;
let draggingObjectId: string | null = null;

export const handleGesture = (
  gesture: GestureResult,
  cursorPosition: Point
): void => {
  const state = useStore.getState();
  const now = Date.now();

  if (!state.isHandGestureEnabled) return;

  // Update pinch hold counter
  if (gesture.type === 'pinch') {
    pinchHoldCounter = PINCH_HOLD_THRESHOLD;
  } else {
    pinchHoldCounter = Math.max(0, pinchHoldCounter - 1);
  }

  // Use stable pinch state
  const stablePinch = pinchHoldCounter > 0;

  // Debounce clicks to prevent rapid-fire actions
  if (now - lastGestureTime < GESTURE_DEBOUNCE) {
    return;
  }

  if (stablePinch) {
    handlePinch(cursorPosition);
  } else {
    // Only release if pinch has been gone for a while
    if (pinchHoldCounter === 0 && isDrawingWithGesture) {
      handleGestureReleased(cursorPosition);
    }
  }

  lastGestureTime = now;
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
  const tools = [
    'select',
    'pencil',
    'rectangle',
    'circle',
    'line',
    'eraser',
    'color-picker',
  ];

  if (toolIndex >= 0 && toolIndex < tools.length) {
    const state = useStore.getState();
    state.setTool(tools[toolIndex] as any);
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
  lastGestureTime = 0;
};
