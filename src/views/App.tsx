/**
 * Main App Component
 * Root component that orchestrates the entire application
 */

import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '@/store/store';
import { initializeHandTracking, detectHandPose, stopWebcam } from '@/services/handTracking';
import { detectGestureSmoothed, getIndexFingerTip } from '@/services/gestureDetector';
import {
  initCanvasRenderer,
  drawLayers,
  drawCursor,
  cleanupCanvasRenderer,
  drawSelection,
  drawMarqueeBox,
  drawHandLandmarks,
  drawTransparentMode,
} from '@/services/canvasRenderer';
import { startAutoSave, stopAutoSave, loadCanvasFromLocalStorage } from '@/services/storageService';
import { handleGesture, handleGestureReleased } from '@/controllers/gestureController';
import { startDrawing, continueDrawing, finishDrawing, addText, getObjectAtPoint, startDraggingObject, dragObject, stopDraggingObject } from '@/controllers/drawingController';
import { processAirMouseCursor } from '@/controllers/cursorController';
import {
  getSelectionBox,
  updateBoxSelectionPoint,
} from '@/controllers/selectionController';
import Toolbar from '@/views/components/Toolbar';
import ColorPicker from '@/views/components/ColorPicker';
import LayersPanel from '@/views/components/LayersPanel';
import CameraToggle from '@/views/components/CameraToggle';
import TextInputBox from '@/views/components/TextInputBox';
import './App.css';

interface TextInputState {
  isVisible: boolean;
  x: number;
  y: number;
}

interface PanelPosition {
  toolbarX: number;
  toolbarY: number;
  layersX: number;
  layersY: number;
  colorPickerX: number;
  colorPickerY: number;
}

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const animationRef = useRef<number>();
  const isDraggingRef = useRef(false);
  const draggingObjectIdRef = useRef<string | null>(null);
  const [appReady, setAppReady] = useState(false);
  const [lastHoveredElement, setLastHoveredElement] = useState<Element | null>(null);
  const [textInput, setTextInput] = useState<TextInputState>({
    isVisible: false,
    x: 0,
    y: 0,
  });
  const [panelPositions, setPanelPositions] = useState<PanelPosition>({
    toolbarX: 10,
    toolbarY: 10,
    layersX: 10,
    layersY: 500,
    colorPickerX: window.innerWidth - 220,
    colorPickerY: 10,
  });
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDraggingPanel, setIsDraggingPanel] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const state = useStore();

  // Initialize app
  useEffect(() => {
    // Apply theme from store
    document.documentElement.setAttribute('data-theme', state.theme);

    // Load saved canvas
    const savedLayers = loadCanvasFromLocalStorage();
    if (savedLayers) {
      state.setAllLayers(savedLayers);
    }

    // Start auto-save
    startAutoSave(state.layers, 10000);

    setAppReady(true);

    return () => {
      stopAutoSave();
      cleanupCanvasRenderer();
    };
  }, [state.theme]);

  // Initialize canvas renderer
  useEffect(() => {
    if (!appReady || !canvasRef.current) return;

    try {
      initCanvasRenderer(canvasRef.current);
    } catch (error) {
      console.error('Failed to initialize canvas renderer:', error);
    }
  }, [appReady]);

  // Initialize hand tracking when enabled
  useEffect(() => {
    if (
      !state.isHandGestureEnabled ||
      !videoRef.current ||
      !canvasRef.current ||
      !appReady
    ) {
      return;
    }

    const setupHandTracking = async () => {
      try {
        await initializeHandTracking(videoRef.current!);
        console.log('Hand tracking initialized');
      } catch (error) {
        console.error('Failed to initialize hand tracking:', error);
        // Don't disable, show error but keep enabled for retry
        alert(`Hand tracking initialization failed: ${(error as Error).message || 'Unknown error'}. Please check camera permissions and try again.`);
        // Keep enabled so user can retry by toggling
      }
    };

    setupHandTracking();

    return () => {
      stopWebcam();
    };
  }, [state.isHandGestureEnabled, appReady]);

  // Mouse event handlers for drawing + Infinite Canvas (Pan/Zoom)
  useEffect(() => {
    if (!canvasRef.current || !appReady || state.isHandGestureEnabled) return;

    const canvas = canvasRef.current;

    const handleMouseDown = (e: MouseEvent) => {
      // Check if spacebar is held for panning
      if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
        // Middle click or Shift+Left click for pan
        const rect = canvas.getBoundingClientRect();
        setDragOffset({
          x: e.clientX - panX * rect.width,
          y: e.clientY - panY * rect.height,
        });
        setIsDraggingPanel('pan');
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const point = {
        x: (e.clientX - rect.left - panX * rect.width) / zoom,
        y: (e.clientY - rect.top - panY * rect.height) / zoom,
      };

      // Handle SELECT tool
      if (state.activeTool === 'select') {
        const obj = getObjectAtPoint(point, 15);
        if (obj) {
          state.selectObject(obj.id);
          startDraggingObject(point);
          isDraggingRef.current = true;
          draggingObjectIdRef.current = obj.id;
        } else {
          state.deselectObject();
          isDraggingRef.current = false;
          draggingObjectIdRef.current = null;
        }
      }
      // Handle text tool separately
      else if (state.activeTool === 'text') {
        setTextInput({
          isVisible: true,
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      } else {
        state.deselectObject();
        startDrawing(point);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingPanel === 'pan') {
        setPanX((e.clientX - dragOffset.x) / canvasRef.current!.getBoundingClientRect().width);
        setPanY((e.clientY - dragOffset.y) / canvasRef.current!.getBoundingClientRect().height);
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const point = {
        x: (e.clientX - rect.left - panX * rect.width) / zoom,
        y: (e.clientY - rect.top - panY * rect.height) / zoom,
      };

      // If dragging an object with SELECT tool
      if (state.activeTool === 'select' && isDraggingRef.current && draggingObjectIdRef.current) {
        dragObject(point, draggingObjectIdRef.current);
      } else {
        // Update box selection point only when not dragging
        if (!isDraggingRef.current) {
          updateBoxSelectionPoint(point);
        }
        continueDrawing(point);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (isDraggingPanel === 'pan') {
        setIsDraggingPanel(null);
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const point = {
        x: (e.clientX - rect.left - panX * rect.width) / zoom,
        y: (e.clientY - rect.top - panY * rect.height) / zoom,
      };

      if (state.activeTool === 'select' && isDraggingRef.current) {
        stopDraggingObject();
        isDraggingRef.current = false;
        draggingObjectIdRef.current = null;
        state.pushHistory();
      } else {
        finishDrawing(point);
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setZoom((prevZoom) => Math.min(Math.max(prevZoom * delta, 0.1), 10));
      }
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [appReady, state.activeTool, zoom, panX, panY, isDraggingPanel, dragOffset]);

  // Main rendering loop
  useEffect(() => {
    const animate = () => {
      // Detect hand pose
      let handPose = null;
      if (state.isHandGestureEnabled) {
        handPose = detectHandPose();
        state.setHandPose(handPose);

        // Get cursor position from index finger tip with smoothing
        if (handPose) {
          const indexTip = getIndexFingerTip(handPose);
          if (indexTip) {
            // Apply air mouse smoothing and acceleration
            const videoWidth = videoRef.current?.videoWidth || 1280;
            const videoHeight = videoRef.current?.videoHeight || 720;
            const smoothedPos = processAirMouseCursor(indexTip, videoWidth, videoHeight);
            state.setCursorPosition(smoothedPos);
              // Transform screen coordinates to canvas coordinates (accounting for zoom and pan)
              const canvasPoint = {
                x: (smoothedPos.x - panX * window.innerWidth) / zoom,
                y: (smoothedPos.y - panY * window.innerHeight) / zoom,
              };
              state.setCanvasCursorPosition(canvasPoint);          }

          // Detect gesture
          const gesture = detectGestureSmoothed(handPose);
          state.setCurrentGesture(gesture);
          console.log('Gesture:', gesture.type, 'Confidence:', gesture.confidence.toFixed(2));

          let uiClickHandled = false;

          // Handle UI clicks with pinch gesture
          if (gesture.type === 'pinch') {
            // Check if cursor is over a UI element
            const elementUnderCursor = document.elementFromPoint(state.cursorPosition.x, state.cursorPosition.y);
            
            // Handle hover effect
            if (lastHoveredElement && lastHoveredElement !== elementUnderCursor) {
              lastHoveredElement.classList.remove('virtual-hover');
            }
            if (elementUnderCursor && elementUnderCursor !== canvasRef.current && elementUnderCursor !== videoRef.current && elementUnderCursor !== document.body) {
              const clickable = elementUnderCursor.closest('button, [role="button"], input, select, textarea, .toolbar-button, .color-button, .shape-option, .camera-toggle, .toggle-custom-button');
              if (clickable) {
                clickable.classList.add('virtual-hover');
                setLastHoveredElement(clickable);
              } else {
                setLastHoveredElement(null);
              }
            } else {
              if (lastHoveredElement) {
                lastHoveredElement.classList.remove('virtual-hover');
                setLastHoveredElement(null);
              }
            }
            
            if (elementUnderCursor && elementUnderCursor !== document.body && elementUnderCursor !== document.documentElement) {
              // Check if it's a clickable element
              const clickableElement = elementUnderCursor.closest('button, .toolbar-button, .color-button, .shape-option, .camera-toggle, .toggle-custom-button');
              
              if (clickableElement && !clickableElement.hasAttribute('data-hand-clicked')) {
                // Simulate click on UI element
                (clickableElement as HTMLElement).click();
                clickableElement.setAttribute('data-hand-clicked', 'true');
                
                // Remove the attribute after a short delay to allow repeated clicks
                setTimeout(() => {
                  clickableElement.removeAttribute('data-hand-clicked');
                }, 500);
                
                console.log('Hand click on UI element:', clickableElement);
                uiClickHandled = true;
              }
            } else if (state.activeTool === 'text') {
              // Handle text tool on canvas
              setTextInput({
                isVisible: true,
                x: state.cursorPosition.x,
                y: state.cursorPosition.y,
              });
              uiClickHandled = true;
            }
          }

          // Handle gesture for drawing (only if not UI click)
          if (gesture.type !== 'none' && !uiClickHandled) {
              handleGesture(gesture, state.canvasCursorPosition);
            } else if (gesture.type === 'none') {
              // If no gesture detected but was drawing, might have released
              handleGestureReleased(state.canvasCursorPosition);
          }
        }
      }

      // Draw canvas
      drawLayers(state.layers);

      // Draw selection if an object is selected
      if (state.selectedObjectIds.length > 0) {
        for (const layer of state.layers) {
          const selectedObj = layer.objects.find((o) => o.id === state.selectedObjectIds[0]);
          if (selectedObj) {
            drawSelection(selectedObj);
            break;
          }
        }
      }

      // Draw marquee selection box if active
      const selectionBox = getSelectionBox();
      if (selectionBox) {
        drawMarqueeBox(selectionBox.startX, selectionBox.startY, selectionBox.endX, selectionBox.endY);
      }

      // Draw transparent mode overlay and hand landmarks when tracking
      if (state.isHandGestureEnabled) {
        const handDetected = handPose !== null;
        drawTransparentMode(true, handDetected, true);
        
        if (handPose) {
          drawHandLandmarks(handPose);
          console.log('✓ Hand detected with', handPose.landmarks.length, 'landmarks');
        } else {
          console.log('✗ No hand pose detected');
        }
      }

      // Draw cursor if hand tracking is active
      if (state.isHandGestureEnabled && handPose) {
        drawCursor(
          state.cursorPosition,
          12,
          '#FF0000',
          state.currentGesture.type
        );
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    if (appReady) {
      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [appReady, state.layers, state.isHandGestureEnabled, state.currentGesture, state.selectedObjectIds, state.handPose]);

  if (!appReady) {
    return <div className="loading">Loading Hand Figma...</div>;
  }

  return (
    <div 
      className="app" 
      style={{
        backgroundColor: state.theme === 'light' ? '#ffffff' : '#0f172a',
        color: state.theme === 'light' ? '#000000' : '#ffffff',
      }}
    >
      <canvas 
        ref={canvasRef} 
        className="main-canvas"
        style={{
          backgroundColor: state.isHandGestureEnabled ? 'transparent' : (state.theme === 'light' ? '#ffffff' : '#0f172a'),
          transform: `scale(${zoom}) translate(${panX}px, ${panY}px)`,
          pointerEvents: state.isHandGestureEnabled ? 'none' : 'auto',
          transformOrigin: '0 0',
          cursor: isDraggingPanel === 'pan' ? 'grab' : 'crosshair',
        }}
      />

      {state.isHandGestureEnabled && (
        <video
          ref={videoRef}
          className="camera-feed"
          style={{
            display: 'block',
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '200px',
            height: '150px',
            border: '2px solid #00FF00',
            borderRadius: '8px',
            zIndex: 1000,
            transform: 'scaleX(-1)', // Flip for natural self-view
            pointerEvents: 'none', // Allow elementFromPoint to see through
          }}
        />
      )}

      {/* Draggable Toolbar */}
      <div
        className="toolbar-wrapper"
        style={{
          position: 'absolute',
          left: `${panelPositions.toolbarX}px`,
          top: `${panelPositions.toolbarY}px`,
          zIndex: isDraggingPanel === 'toolbar' ? 1000 : 100,
        }}
        onMouseDown={(e) => {
          if (e.target instanceof HTMLElement && e.target.classList.contains('toolbar-header')) {
            setIsDraggingPanel('toolbar');
            setDragOffset({
              x: e.clientX - panelPositions.toolbarX,
              y: e.clientY - panelPositions.toolbarY,
            });
          }
        }}
        onMouseMove={(e) => {
          if (isDraggingPanel === 'toolbar') {
            setPanelPositions((prev) => ({
              ...prev,
              toolbarX: e.clientX - dragOffset.x,
              toolbarY: e.clientY - dragOffset.y,
            }));
          }
        }}
        onMouseUp={() => isDraggingPanel === 'toolbar' && setIsDraggingPanel(null)}
      >
        <Toolbar />
      </div>

      {/* Color Picker */}
      <div
        style={{
          position: 'absolute',
          right: '20px',
          top: '20px',
          zIndex: 99,
        }}
      >
        <ColorPicker />
      </div>

      {/* Draggable Layers Panel */}
      {state.showLayers && (
        <div
          className="layers-panel-wrapper"
          style={{
            position: 'absolute',
            left: `${panelPositions.layersX}px`,
            top: `${panelPositions.layersY}px`,
            zIndex: isDraggingPanel === 'layers' ? 1000 : 99,
          }}
          onMouseDown={(e) => {
            if (e.target instanceof HTMLElement && e.target.classList.contains('layers-header')) {
              setIsDraggingPanel('layers');
              setDragOffset({
                x: e.clientX - panelPositions.layersX,
                y: e.clientY - panelPositions.layersY,
              });
            }
          }}
          onMouseMove={(e) => {
            if (isDraggingPanel === 'layers') {
              setPanelPositions((prev) => ({
                ...prev,
                layersX: e.clientX - dragOffset.x,
                layersY: e.clientY - dragOffset.y,
              }));
            }
          }}
          onMouseUp={() => isDraggingPanel === 'layers' && setIsDraggingPanel(null)}
        >
          <LayersPanel />
        </div>
      )}

      <CameraToggle />

      {/* Close Gesture Mode Button */}
      {state.isHandGestureEnabled && (
        <button
          className="close-gesture-button"
          onClick={() => {
            if (lastHoveredElement) {
              lastHoveredElement.classList.remove('virtual-hover');
              setLastHoveredElement(null);
            }
            state.setHandGestureEnabled(false);
            // Ensure webcam is stopped
            stopWebcam();
          }}
          style={{
            position: 'fixed',
            top: '20px',
            left: '20px',
            zIndex: 1001,
            background: '#FF6B6B',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '10px 16px',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
          title="Close Gesture Mode"
        >
          ✕ Close Gesture Mode
        </button>
      )}

      {/* Text Input Box */}
      {textInput.isVisible && (
        <TextInputBox
          x={textInput.x}
          y={textInput.y}
          onSubmit={(text, fontSize) => {
            addText(text, { x: textInput.x, y: textInput.y }, fontSize);
            setTextInput({ isVisible: false, x: 0, y: 0 });
          }}
          onCancel={() => setTextInput({ isVisible: false, x: 0, y: 0 })}
        />
      )}

      {state.isHandGestureEnabled && (
        <div className="gesture-indicator">
          Gesture: {state.currentGesture.type}{' '}
          ({(state.currentGesture.confidence * 100).toFixed(0)}%)
        </div>
      )}

      {/* Hand Tracking Debug Info */}
      {state.isHandGestureEnabled && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '20px',
            background: 'rgba(0, 0, 0, 0.85)',
            color: state.handPose ? '#00FF00' : '#FF6B6B',
            padding: '12px 16px',
            borderRadius: '6px',
            fontFamily: 'monospace',
            fontSize: '11px',
            border: state.handPose ? '2px solid #00FF00' : '2px solid #FF6B6B',
            zIndex: 200,
            lineHeight: '1.5',
          }}
        >
          <div><strong>Hand Tracking:</strong></div>
          <div>{state.handPose ? '✓ DETECTED' : '✗ Searching...'}</div>
          {state.handPose && (
            <>
              <div>Landmarks: {state.handPose.landmarks.length}</div>
              <div>Confidence: {(state.handPose.confidence * 100).toFixed(0)}%</div>
            </>
          )}
        </div>
      )}

      {/* Zoom/Pan indicator */}
      <div className="zoom-indicator">
        Zoom: {(zoom * 100).toFixed(0)}% | Pan: ({panX.toFixed(2)}, {panY.toFixed(2)})
      </div>
    </div>
  );
};

export default App;
