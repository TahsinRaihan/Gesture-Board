/**
 * Cursor Controller
 * Handles air mouse cursor smoothing and positioning
 */

import { Point } from '@/types';

const CURSOR_SMOOTHING = 0.5; // Balanced smoothing
const ACCELERATION = 2.0; // Higher = more responsive to fast movements

let lastCursorPos: Point = { x: 0, y: 0 };
let lastRawPos: Point = { x: 0, y: 0 };

/**
 * Process raw hand position into smooth air mouse cursor
 * Applies smoothing, dead zone, and acceleration
 */
export const processAirMouseCursor = (rawPosition: Point, videoElement: HTMLVideoElement): Point => {
  const videoWidth = videoElement.videoWidth || 1280;
  const videoHeight = videoElement.videoHeight || 720;

  // Map the source video coordinates into the global viewport, not the popup bounds.
  // The preview is mirrored, so the X axis is flipped before projecting into screen space.
  const normalizedX = Math.max(0, Math.min(1, rawPosition.x / videoWidth));
  const normalizedY = Math.max(0, Math.min(1, rawPosition.y / videoHeight));
  const mappedPosition = {
    x: (1 - normalizedX) * window.innerWidth,
    y: normalizedY * window.innerHeight,
  };

  // Step 1: Calculate velocity for acceleration
  const deltaX = mappedPosition.x - lastRawPos.x;
  const deltaY = mappedPosition.y - lastRawPos.y;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

  // Initialize lastCursorPos on first call
  if (lastCursorPos.x === 0 && lastCursorPos.y === 0) {
    lastCursorPos = mappedPosition;
  }

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
