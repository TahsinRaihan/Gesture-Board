/**
 * Cursor Controller
 * Handles air mouse cursor smoothing and positioning
 */

import { Point } from '@/types';

const CURSOR_SMOOTHING = 0.7; // Higher = smoother but laggy
const ACCELERATION = 1.2; // Small fast movements feel responsive

let lastCursorPos: Point = { x: 0, y: 0 };
let lastRawPos: Point = { x: 0, y: 0 };

/**
 * Process raw hand position into smooth air mouse cursor
 * Applies smoothing, dead zone, and acceleration
 */
export const processAirMouseCursor = (rawPosition: Point, videoWidth: number = 1280, videoHeight: number = 720): Point => {
  // Map video coordinates to screen coordinates
  const screenX = (rawPosition.x / videoWidth) * window.innerWidth;
  const screenY = (rawPosition.y / videoHeight) * window.innerHeight;
  
  const mappedPosition = { x: screenX, y: screenY };

  // Step 1: Calculate velocity for acceleration
  const deltaX = mappedPosition.x - lastRawPos.x;
  const deltaY = mappedPosition.y - lastRawPos.y;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

  // Step 2: Apply smoothing (exponential moving average)
  let smoothed = {
    x: lastCursorPos.x * CURSOR_SMOOTHING + mappedPosition.x * (1 - CURSOR_SMOOTHING),
    y: lastCursorPos.y * CURSOR_SMOOTHING + mappedPosition.y * (1 - CURSOR_SMOOTHING),
  };

  // Step 3: Apply acceleration for fast movements (feel snappier)
  if (distance > 5) {
    const accelerationFactor = Math.min(1 + distance / 500, ACCELERATION);
    smoothed.x = lastCursorPos.x + (smoothed.x - lastCursorPos.x) * accelerationFactor;
    smoothed.y = lastCursorPos.y + (smoothed.y - lastCursorPos.y) * accelerationFactor;
  }

  // Step 4: Clamp to screen bounds
  smoothed.x = Math.max(0, Math.min(window.innerWidth, smoothed.x));
  smoothed.y = Math.max(0, Math.min(window.innerHeight, smoothed.y));

  lastCursorPos = smoothed;
  lastRawPos = mappedPosition;

  return smoothed;
};

/**
 * Reset cursor smoothing (call on hand lost/found)
 */
export const resetCursorSmoothing = (): void => {
  lastCursorPos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  lastRawPos = lastCursorPos;
};

/**
 * Get current smooth cursor position
 */
export const getCurrentCursorPos = (): Point => {
  return lastCursorPos;
};
