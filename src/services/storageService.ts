/**
 * Storage Service
 * Handles saving and loading canvas data to/from browser storage
 */

import { CanvasLayer } from '@/types';
import { STORAGE_KEY } from '@/utils/constants';

/**
 * Save canvas to localStorage
 */
export const saveCanvasToLocalStorage = (layers: CanvasLayer[]): void => {
  try {
    const data = JSON.stringify(layers);
    localStorage.setItem(STORAGE_KEY, data);
    console.log('Canvas saved to localStorage');
  } catch (error) {
    console.error('Failed to save canvas:', error);
  }
};

/**
 * Load canvas from localStorage
 */
export const loadCanvasFromLocalStorage = (): CanvasLayer[] | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const layers = JSON.parse(data) as CanvasLayer[];
      console.log('Canvas loaded from localStorage');
      return layers;
    }
    return null;
  } catch (error) {
    console.error('Failed to load canvas:', error);
    return null;
  }
};

/**
 * Export canvas to JSON file
 */
export const exportCanvasAsJSON = (
  layers: CanvasLayer[],
  filename: string = 'hand-figma.json'
): void => {
  try {
    const data = JSON.stringify(layers, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
    console.log('Canvas exported as JSON');
  } catch (error) {
    console.error('Failed to export canvas:', error);
  }
};

/**
 * Import canvas from JSON file
 */
export const importCanvasFromJSON = (file: File): Promise<CanvasLayer[]> => {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);

          // Validate structure
          if (Array.isArray(data) && data.length > 0) {
            const layers = data as CanvasLayer[];
            console.log('Canvas imported from JSON');
            resolve(layers);
          } else {
            reject(new Error('Invalid canvas data format'));
          }
        } catch (parseError) {
          reject(new Error('Failed to parse JSON file'));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsText(file);
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Clear localStorage
 */
export const clearCanvasStorage = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('Canvas storage cleared');
  } catch (error) {
    console.error('Failed to clear canvas storage:', error);
  }
};

/**
 * Auto-save canvas periodically
 */
let autoSaveInterval: NodeJS.Timeout | null = null;

export const startAutoSave = (
  getLayers: () => CanvasLayer[],
  interval: number = 10000
): void => {
  if (autoSaveInterval) {
    clearInterval(autoSaveInterval);
  }

  autoSaveInterval = setInterval(() => {
    const layers = getLayers();
    saveCanvasToLocalStorage(layers);
  }, interval);
};

export const stopAutoSave = (): void => {
  if (autoSaveInterval) {
    clearInterval(autoSaveInterval);
    autoSaveInterval = null;
  }
};
