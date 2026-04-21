/**
 * Zustand State Store
 * Central state management for the application
 */

import { create } from 'zustand';
import {
  CanvasState,
  DrawingObject,
  CanvasLayer,
  ToolType,
  Point,
  HandTrackingState,
  UIState,
  GestureResult,
  HandPose,
} from '@/types';
import { createLayer, deepClone } from '@/utils/helpers';
import { DEFAULT_COLOR, DEFAULT_STROKE_WIDTH, DEFAULT_TOOL } from '@/utils/constants';

type State = CanvasState & HandTrackingState & UIState;

interface Actions {
  // Canvas actions
  addLayer: (name: string) => void;
  removeLayer: (id: string) => void;
  setActiveLayer: (id: string) => void;
  addObjectToLayer: (object: DrawingObject) => void;
  updateObjectInLayer: (objectId: string, updates: Partial<DrawingObject>) => void;
  removeObject: (objectId: string) => void;
  clearLayer: (layerId: string) => void;
  clearAll: () => void;

  // Tool & color actions
  setTool: (tool: ToolType) => void;
  setColor: (color: string) => void;
  setStrokeWidth: (width: number) => void;

  // Drawing state
  startDrawing: () => void;
  stopDrawing: () => void;

  // History (Undo/Redo)
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;

  // Hand tracking actions
  setHandPose: (pose: HandPose | null) => void;
  setCursorPosition: (position: Point) => void;
  setCanvasCursorPosition: (position: Point) => void;
  setCurrentGesture: (gesture: GestureResult) => void;
  setHandGestureEnabled: (enabled: boolean) => void;

  // UI actions
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  toggleLayers: () => void;
  toggleColorPicker: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  selectObject: (objectId: string, multi?: boolean) => void;
  selectMultipleObjects: (objectIds: string[]) => void;
  deselectObject: () => void;
  deselectAll: () => void;
  deleteSelectedObject: () => void;

  // Batch operations
  setAllLayers: (layers: CanvasLayer[]) => void;
}

const createInitialState = (): State => {
  const defaultLayer = createLayer('Layer 1');
  return {
    // Canvas state
    layers: [defaultLayer],
    activeLayerId: defaultLayer.id,
    activeTool: DEFAULT_TOOL,
    activeColor: DEFAULT_COLOR,
    strokeWidth: DEFAULT_STROKE_WIDTH,
    isDrawing: false,
    history: [],
    historyIndex: -1,

    // Hand tracking state
    enabled: false,
    handPose: null,
    cursorPosition: { x: 0, y: 0 },
    canvasCursorPosition: { x: 0, y: 0 },
    currentGesture: { type: 'none', confidence: 0 },
    isVisible: false,

    // UI state
    isHandGestureEnabled: false,
    showLayers: true,
    showColorPicker: false,
    zoom: 1,
    panX: 0,
    panY: 0,
    theme: 'light',
    selectedObjectIds: [],
  };
};

export const useStore = create<State & Actions>((set) => ({
  ...createInitialState(),

  // Canvas actions
  addLayer: (name: string) => {
    set((state) => ({
      layers: [...state.layers, createLayer(name)],
    }));
  },

  removeLayer: (id: string) => {
    set((state) => {
      const newLayers = state.layers.filter((layer) => layer.id !== id);
      return {
        layers: newLayers.length > 0 ? newLayers : [createLayer('Layer 1')],
        activeLayerId:
          state.activeLayerId === id ? newLayers[0]?.id : state.activeLayerId,
      };
    });
  },

  setActiveLayer: (id: string) => {
    set({ activeLayerId: id });
  },

  addObjectToLayer: (object: DrawingObject) => {
    set((state) => {
      const newLayers = state.layers.map((layer) => {
        if (layer.id === state.activeLayerId) {
          return {
            ...layer,
            objects: [...layer.objects, object],
          };
        }
        return layer;
      });

      return { layers: newLayers };
    });
  },

  updateObjectInLayer: (objectId: string, updates: Partial<DrawingObject>) => {
    set((state) => {
      const newLayers = state.layers.map((layer) => ({
        ...layer,
        objects: layer.objects.map((obj) =>
          obj.id === objectId ? { ...obj, ...updates } : obj
        ),
      }));

      return { layers: newLayers };
    });
  },

  removeObject: (objectId: string) => {
    set((state) => {
      const newLayers = state.layers.map((layer) => ({
        ...layer,
        objects: layer.objects.filter((obj) => obj.id !== objectId),
      }));

      return { layers: newLayers };
    });
  },

  clearLayer: (layerId: string) => {
    set((state) => {
      const newLayers = state.layers.map((layer) => {
        if (layer.id === layerId) {
          return { ...layer, objects: [] };
        }
        return layer;
      });

      return { layers: newLayers };
    });
  },

  clearAll: () => {
    const defaultLayer = createLayer('Layer 1');
    set({
      layers: [defaultLayer],
      activeLayerId: defaultLayer.id,
      history: [],
      historyIndex: -1,
    });
  },

  // Tool & color actions
  setTool: (tool: ToolType) => {
    set({ activeTool: tool });
  },

  setColor: (color: string) => {
    set({ activeColor: color });
  },

  setStrokeWidth: (width: number) => {
    set({ strokeWidth: width });
  },

  // Drawing state
  startDrawing: () => {
    set({ isDrawing: true });
  },

  stopDrawing: () => {
    set({ isDrawing: false });
  },

  // History
  pushHistory: () => {
    set((state) => {
      const newHistory = state.history.slice(0, state.historyIndex + 1) as typeof state.layers[];
      newHistory.push(deepClone(state.layers));

      // Limit history to 50 steps
      const limitedHistory =
        newHistory.length > 50 ? newHistory.slice(-50) : newHistory;

      return {
        history: limitedHistory,
        historyIndex: limitedHistory.length - 1,
      } as Partial<State & Actions>;
    });
  },

  undo: () => {
    set((state) => {
      if (state.historyIndex > 0) {
        const newIndex = state.historyIndex - 1;
        return {
          layers: deepClone(state.history[newIndex]),
          historyIndex: newIndex,
        } as Partial<State & Actions>;
      }
      return state as Partial<State & Actions>;
    });
  },

  redo: () => {
    set((state) => {
      if (state.historyIndex < state.history.length - 1) {
        const newIndex = state.historyIndex + 1;
        return {
          layers: deepClone(state.history[newIndex]),
          historyIndex: newIndex,
        } as Partial<State & Actions>;
      }
      return state as Partial<State & Actions>;
    });
  },

  // Hand tracking actions
  setHandPose: (pose: HandPose | null) => {
    set({ handPose: pose });
  },

  setCursorPosition: (position: Point) => {
    set({ cursorPosition: position });
  },

  setCanvasCursorPosition: (position: Point) => {
    set({ canvasCursorPosition: position });
  },

  setCurrentGesture: (gesture: GestureResult) => {
    set({ currentGesture: gesture });
  },

  setHandGestureEnabled: (enabled: boolean) => {
    set({ isHandGestureEnabled: enabled });
  },

  // UI actions
  setZoom: (zoom: number) => {
    set({ zoom: Math.max(0.1, Math.min(5, zoom)) }); // Clamp between 0.1x and 5x
  },

  setPan: (x: number, y: number) => {
    set({ panX: x, panY: y });
  },

  toggleLayers: () => {
    set((state) => ({ showLayers: !state.showLayers }));
  },

  toggleColorPicker: () => {
    set((state) => ({ showColorPicker: !state.showColorPicker }));
  },

  setTheme: (theme: 'light' | 'dark') => {
    set({ theme });
    // Apply theme to document
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  },

  toggleTheme: () => {
    set((state) => {
      const newTheme = state.theme === 'light' ? 'dark' : 'light';
      if (newTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.setAttribute('data-theme', 'light');
      }
      return { theme: newTheme };
    });
  },

  selectObject: (objectId: string, multi?: boolean) => {
    set((state) => {
      if (multi) {
        // Multi-select: add to selection if not already selected
        if (state.selectedObjectIds.includes(objectId)) {
          return { selectedObjectIds: state.selectedObjectIds.filter((id) => id !== objectId) };
        }
        return { selectedObjectIds: [...state.selectedObjectIds, objectId] };
      }
      // Single select
      return { selectedObjectIds: [objectId] };
    });
  },

  selectMultipleObjects: (objectIds: string[]) => {
    set({ selectedObjectIds: objectIds });
  },

  deselectObject: () => {
    set({ selectedObjectIds: [] });
  },

  deselectAll: () => {
    set({ selectedObjectIds: [] });
  },

  deleteSelectedObject: () => {
    set((state) => {
      if (state.selectedObjectIds.length === 0) return state;
      const idsToDelete = new Set(state.selectedObjectIds);
      return {
        selectedObjectIds: [],
        layers: state.layers.map((layer) => ({
          ...layer,
          objects: layer.objects.filter((obj) => !idsToDelete.has(obj.id)),
        })),
      } as any;
    });
  },

  // Batch operations
  setAllLayers: (layers: CanvasLayer[]) => {
    const normalizedLayers = layers.length > 0 ? layers : [createLayer('Layer 1')];

    set({
      layers: normalizedLayers,
      activeLayerId: normalizedLayers[0].id,
    });
  },
}));
