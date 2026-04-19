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
} from './drawingController';

let lastGestureTime = 0;
const GESTURE_DEBOUNCE = 200; // ms

let isDrawingWithGesture = false;

/**
 * Handle gesture events
 */
export const handleGesture = (
  gesture: GestureResult,
  cursorPosition: Point
): void => {
  const state = useStore.getState();
  const now = Date.now();

  if (!state.isHandGestureEnabled) return;

  // Debounce clicks to prevent rapid-fire actions
  if (now - lastGestureTime < GESTURE_DEBOUNCE) {
    return;
  }

  switch (gesture.type) {
    case 'pinch':
      handlePinch(cursorPosition);
      break;

    case 'pointing-up':
      handlePointingUp(cursorPosition);
      break;

    case 'fist':
      handleFist();
      break;

    case 'open':
      handlePalmOpen();
      break;

    default:
      handlePointingGesture(cursorPosition);
      break;
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
    state.activeTool === 'circle' ||
    state.activeTool === 'line'
  ) {
    // Start or continue drawing
    if (!isDrawingWithGesture) {
      startDrawing(cursorPosition);
      isDrawingWithGesture = true;
    }
  }
};

/**
 * Release pinch gesture = Release drawing
 */
export const handleGestureReleased = (gesture: GestureResult, cursorPosition: Point): void => {
  // If gesture was pinch and now it's not, finish drawing
  if (isDrawingWithGesture && gesture.type !== 'pinch') {
    finishDrawing(cursorPosition);
    isDrawingWithGesture = false;
  }
};

/**
 * Pointing up gesture = Open tool menu or select tool
 */
const handlePointingUp = (cursorPosition: Point): void => {
  console.log('Pointing up gesture detected at', cursorPosition);
  // Could be used to show/hide toolbar
};

/**
 * Fist gesture = Undo
 */
const handleFist = (): void => {
  const state = useStore.getState();
  state.undo();
  console.log('Undo triggered by fist gesture');
};

/**
 * Open palm gesture = Redo or Clear
 */
const handlePalmOpen = (): void => {
  const state = useStore.getState();
  state.redo();
  console.log('Redo triggered by open palm gesture');
};

/**
 * Pointing gesture = Move cursor, used for positioning
 */
const handlePointingGesture = (cursorPosition: Point): void => {
  const state = useStore.getState();

  // When pointing, allow cursor positioning for tools like text placement
  if (state.activeTool === 'text') {
    console.log('Text position set at', cursorPosition);
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
