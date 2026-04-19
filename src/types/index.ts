/**
 * Global Type Definitions for Hand Figma
 */

export type ToolType =
  | 'pencil'
  | 'rectangle'
  | 'square'
  | 'circle'
  | 'triangle'
  | 'star'
  | 'pentagon'
  | 'line'
  | 'text'
  | 'eraser'
  | 'select'
  | 'color-picker';

export interface Point {
  x: number;
  y: number;
}

export interface DrawingObject {
  id: string;
  type: 'freehand' | 'rectangle' | 'square' | 'circle' | 'triangle' | 'star' | 'pentagon' | 'line' | 'text';
  points: Point[];
  color: string;
  strokeWidth: number;
  fillColor?: string;
  text?: string;
  fontSize?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  timestamp: number;
}

export interface CanvasLayer {
  id: string;
  name: string;
  objects: DrawingObject[];
  visible: boolean;
  opacity: number;
}

export interface HandPose {
  landmarks: Point[];
  confidence: number;
  handedness: 'Left' | 'Right';
}

export interface GestureResult {
  type: 'pinch' | 'open' | 'fist' | 'point' | 'pointing-up' | 'none';
  confidence: number;
}

export interface CanvasState {
  layers: CanvasLayer[];
  activeLayerId: string;
  activeTool: ToolType;
  activeColor: string;
  strokeWidth: number;
  isDrawing: boolean;
  history: CanvasLayer[][];
  historyIndex: number;
}

export interface HandTrackingState {
  enabled: boolean;
  handPose: HandPose | null;
  cursorPosition: Point;
  currentGesture: GestureResult;
  isVisible: boolean;
}

export interface UIState {
  isHandGestureEnabled: boolean;
  showLayers: boolean;
  showColorPicker: boolean;
  zoom: number;
  panX: number;
  panY: number;
  theme: 'light' | 'dark';
  selectedObjectIds: string[];
}

export interface AppState extends CanvasState, HandTrackingState, UIState {}
