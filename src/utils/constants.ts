/**
 * Application Constants
 */

import { ToolType } from '@/types';

export const TOOL_TYPES: ToolType[] = [
  'select',
  'drag',
  'pencil',
  'rectangle',
  'circle',
  'line',
  'text',
  'eraser',
  'color-picker',
];

export const DEFAULT_COLORS = [
  '#000000', // Black
  '#FFFFFF', // White
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#FFE66D', // Yellow
  '#95E1D3', // Mint
  '#F38181', // Pink
  '#AA96DA', // Purple
  '#FCBAD3', // Light Pink
  '#A8D8EA', // Light Blue
];

export const STROKE_WIDTHS = [1, 2, 4, 6, 8, 12, 16];

export const DEFAULT_STROKE_WIDTH = 2;
export const DEFAULT_COLOR = '#000000';
export const DEFAULT_TOOL: ToolType = 'pencil';

export const CANVAS_WIDTH = 1920;
export const CANVAS_HEIGHT = 1080;

export const HAND_TRACKING_CONFIG = {
  MODEL_ASSET_PATH:
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm',
  DETECTION_CONFIDENCE: 0.3,
  TRACKING_CONFIDENCE: 0.3,
  RUN_MODE: 'VIDEO' as const,
};

export const GESTURE_CONFIG = {
  PINCH_THRESHOLD: 0.3, // Increased to 30% for easier pinch detection
  POINT_THRESHOLD: 0.1,
};

export const DEBOUNCE_DELAY = 100;

export const STORAGE_KEY = 'hand-figma-canvas';
