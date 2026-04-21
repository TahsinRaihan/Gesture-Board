import React, { useEffect, useRef, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { useStore } from "../store/store"
import { ArrowLeft, Save, UserPlus } from "lucide-react"

import { initializeHandTracking, detectHandPose, stopWebcam } from "../services/handTracking"
import { detectGestureSmoothed, getIndexFingerTip } from "../services/gestureDetector"
import { initCanvasRenderer, drawLayers, drawCursor, cleanupCanvasRenderer, drawHandLandmarksOverlay } from "../services/canvasRenderer"
import { startAutoSave, stopAutoSave } from "../services/storageService"
import { collaborationService } from "../services/collaborationService"

import { handleGesture, handleGestureReleased, resetGestureController } from "../controllers/gestureController"
import { startDrawing, continueDrawing, finishDrawing, getObjectAtPoint, startDraggingObject, dragObject, stopDraggingObject, dragStartPoint } from "../controllers/drawingController"
import { processAirMouseCursor, resetCursorSmoothing } from "../controllers/cursorController"
import { updateBoxSelectionPoint } from "../controllers/selectionController"

import Toolbar from "../views/components/Toolbar"
import ColorPicker from "../views/components/ColorPicker"
import LayersPanel from "../views/components/LayersPanel"
import CameraToggle from "../views/components/CameraToggle"

interface Project {
  id: string
  title: string
  canvas_data: any
  created_at: string
  updated_at: string
  owner_id: string
}

const BoardWorkspace: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const state = useStore()

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const landmarkCanvasRef = useRef<HTMLCanvasElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const animationRef = useRef<number>()
  const isDraggingRef = useRef(false)
  const draggingObjectIdRef = useRef<string | null>(null)
  const projectLoadedRef = useRef(false)

  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [appReady, setAppReady] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  const [isDraggingPanel, setIsDraggingPanel] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [toolbarPosition, setToolbarPosition] = useState({ x: 24, y: 112 }) // left-6, top-28 in pixels
  const [colorPickerPosition, setColorPickerPosition] = useState({ x: window.innerWidth - 320 - 24, y: 112 }) // right-6, top-28

  // Helper function for cursor styles
  const getCursorForTool = (tool: string, draggingPanel: string | null): string => {
    if (draggingPanel === 'pan') return 'grab'
    if (draggingPanel) return 'grabbing'

    switch (tool) {
      case 'pencil': return 'crosshair'
      case 'drag': return 'grab'
      case 'select': return 'default'
      default: return 'crosshair'
    }
  }

  // Load project from localStorage
  useEffect(() => {
    if (!projectId || !user || projectLoadedRef.current) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const stored = localStorage.getItem("gesture-board-projects")
      const allProjects = stored ? JSON.parse(stored) : []
      const foundProject = allProjects.find((p: Project) => p.id === projectId)

      if (!foundProject) {
        setError("Project not found")
        setProject(null)
      } else if (foundProject.owner_id !== user.id) {
        setError("You do not have access to this project")
        setProject(null)
      } else {
        setProject(foundProject)
        if (foundProject.canvas_data?.layers) {
          state.setAllLayers(foundProject.canvas_data.layers)
        }
        setError(null)
        projectLoadedRef.current = true
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load project")
      setProject(null)
    } finally {
      setLoading(false)
    }
  }, [projectId, user])

  // Initialize app
  useEffect(() => {
    setAppReady(true)
    startAutoSave(() => useStore.getState().layers, 5000)

    return () => {
      stopAutoSave()
      cleanupCanvasRenderer()
      collaborationService.disconnect()
    }
  }, [])

  // Initialize collaboration when user and project are ready
  useEffect(() => {
    if (projectId && user?.id && !collaborationService.isActive()) {
      collaborationService.initialize(projectId, user.id).catch((error) => {
        console.error('Failed to initialize collaboration:', error)
      })
    }
  }, [projectId, user?.id])

  // Initialize canvas renderer
  useEffect(() => {
    if (!appReady || !canvasRef.current) return

    try {
      initCanvasRenderer(canvasRef.current)
    } catch (error) {
      console.error("Failed to initialize canvas renderer:", error)
    }
  }, [appReady])

  // Initialize hand tracking
  useEffect(() => {
    if (!state.isHandGestureEnabled || !videoRef.current || !canvasRef.current || !appReady) {
      return
    }

    const setupHandTracking = async () => {
      try {
        console.log('Hand Tracking Setup: starting initializeHandTracking immediately', {
          readyState: videoRef.current?.readyState,
          hasVideoElement: !!videoRef.current,
        })
        await initializeHandTracking(videoRef.current!)
      } catch (error) {
        console.error("Failed to initialize hand tracking:", error)
        state.setHandGestureEnabled(false)
      }
    }

    setupHandTracking()

    console.log('Hand Tracking Init Requested: waiting for active MediaStream on videoRef')

    return () => {
      stopWebcam()
      resetGestureController()
      resetCursorSmoothing()
    }
  }, [state.isHandGestureEnabled, appReady])

  // Mouse event handlers
  useEffect(() => {
    if (!canvasRef.current || !appReady || state.isHandGestureEnabled) return

    const canvas = canvasRef.current

    const handleMouseDown = (e: MouseEvent) => {
      const currentState = useStore.getState()

      // Check for panel drag handles first
      const target = e.target as HTMLElement
      if (target.closest('.panel-drag-handle')) {
        const panelType = target.closest('.panel-drag-handle')?.getAttribute('data-panel')
        if (panelType) {
          setIsDraggingPanel(panelType)
          setDragOffset({
            x: e.clientX - (panelType === 'toolbar' ? toolbarPosition.x : colorPickerPosition.x),
            y: e.clientY - (panelType === 'toolbar' ? toolbarPosition.y : colorPickerPosition.y),
          })
          return
        }
      }

      if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
        setDragOffset({
          x: e.clientX - panX,
          y: e.clientY - panY,
        })
        setIsDraggingPanel("pan")
        return
      }

      const rect = canvas.getBoundingClientRect()
      const point = {
        x: (e.clientX - rect.left) / zoom - panX,
        y: (e.clientY - rect.top) / zoom - panY,
      }

      if (currentState.activeTool === "select") {
        const obj = getObjectAtPoint(point, 15)
        if (obj) {
          currentState.selectObject(obj.id)
          startDraggingObject(point)
          isDraggingRef.current = true
          draggingObjectIdRef.current = obj.id
        } else {
          currentState.deselectObject()
        }
      } else if (currentState.activeTool === "drag") {
        console.log('Drag Tool: Checking for collision at', point.x, point.y)
        const obj = getObjectAtPoint(point, 15)
        if (obj) {
          console.log('Drag Tool: Collision found for object', obj.id)
          currentState.selectObject(obj.id)
          startDraggingObject(point)
          isDraggingRef.current = true
          draggingObjectIdRef.current = obj.id
        } else {
          currentState.deselectObject()
          console.log('Drag Tool: No collision found at', point.x, point.y)
        }
      } else {
        currentState.deselectObject()
        startDrawing(point)
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      const currentState = useStore.getState()

      if (isDraggingPanel === "pan") {
        setPanX(e.clientX - dragOffset.x)
        setPanY(e.clientY - dragOffset.y)
        return
      }

      if (isDraggingPanel === "toolbar") {
        setToolbarPosition({
          x: Math.max(0, Math.min(window.innerWidth - 288, e.clientX - dragOffset.x)),
          y: Math.max(80, Math.min(window.innerHeight - 200, e.clientY - dragOffset.y)),
        })
        return
      }

      if (isDraggingPanel === "colorPicker") {
        setColorPickerPosition({
          x: Math.max(0, Math.min(window.innerWidth - 320, e.clientX - dragOffset.x)),
          y: Math.max(80, Math.min(window.innerHeight - 200, e.clientY - dragOffset.y)),
        })
        return
      }

      const rect = canvas.getBoundingClientRect()
      const point = {
        x: (e.clientX - rect.left) / zoom - panX,
        y: (e.clientY - rect.top) / zoom - panY,
      }

      if (!currentState.isHandGestureEnabled) {
        currentState.setCanvasCursorPosition(point)
      }

      if (currentState.activeTool === "select" && isDraggingRef.current && draggingObjectIdRef.current) {
        dragObject(point, draggingObjectIdRef.current)
      } else if (currentState.activeTool === "drag" && isDraggingRef.current && draggingObjectIdRef.current) {
        const selectedObject = currentState.layers
          .flatMap((layer) => layer.objects)
          .find((object) => object.id === draggingObjectIdRef.current)

        const deltaX = dragStartPoint ? point.x - dragStartPoint.x : 0
        const deltaY = dragStartPoint ? point.y - dragStartPoint.y : 0
        const baseX = selectedObject?.x ?? selectedObject?.points[0]?.x ?? 0
        const baseY = selectedObject?.y ?? selectedObject?.points[0]?.y ?? 0
        console.log('Dragging object ID:', draggingObjectIdRef.current, 'New X/Y:', baseX + deltaX, baseY + deltaY)
        dragObject(point, draggingObjectIdRef.current)
      } else {
        if (!isDraggingRef.current) {
          updateBoxSelectionPoint(point)
        }
        continueDrawing(point)
      }
    }

    const handleMouseUp = (e: MouseEvent) => {
      const currentState = useStore.getState()

      if (isDraggingPanel === "pan") {
        setIsDraggingPanel(null)
        return
      }

      const rect = canvas.getBoundingClientRect()
      const point = {
        x: (e.clientX - rect.left) / zoom - panX,
        y: (e.clientY - rect.top) / zoom - panY,
      }

      if (currentState.activeTool === "drag" && isDraggingRef.current) {
        stopDraggingObject()
        isDraggingRef.current = false
        draggingObjectIdRef.current = null
        currentState.pushHistory()
      } else if (currentState.activeTool === "select" && isDraggingRef.current) {
        stopDraggingObject()
        isDraggingRef.current = false
        draggingObjectIdRef.current = null
        currentState.pushHistory()
      } else {
        finishDrawing(point)
      }
    }

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        const delta = e.deltaY > 0 ? 0.9 : 1.1
        setZoom((prevZoom) => Math.min(Math.max(prevZoom * delta, 0.1), 10))
      }
    }

    canvas.addEventListener("mousedown", handleMouseDown)
    canvas.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
    canvas.addEventListener("wheel", handleWheel, { passive: false })

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown)
      canvas.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      canvas.removeEventListener("wheel", handleWheel)
    }
  }, [appReady, state.activeTool, state.isHandGestureEnabled, zoom, panX, panY, isDraggingPanel, dragOffset])

  // Animation loop
  useEffect(() => {
    const animate = () => {
      const currentState = useStore.getState()

      if (!canvasRef.current) {
        animationRef.current = requestAnimationFrame(animate)
        return
      }

      drawLayers(currentState.layers)

      const videoElement = videoRef.current
      const overlayCanvas = landmarkCanvasRef.current
      const sourceWidth = videoElement?.videoWidth || 1280
      const sourceHeight = videoElement?.videoHeight || 720

      let cursorScreenPoint = currentState.cursorPosition
      let canvasPoint = currentState.canvasCursorPosition

      if (currentState.isHandGestureEnabled) {
        console.log('Detection Loop Running, Video ReadyState:', videoElement?.readyState, 'Has MediaStream:', !!videoElement?.srcObject, 'Paused:', videoElement?.paused)
        const handPose = detectHandPose()
        currentState.setHandPose(handPose)

        drawHandLandmarksOverlay(overlayCanvas, handPose, sourceWidth, sourceHeight)

        if (handPose) {
          console.log('Hand detected:', handPose)
          const indexTip = getIndexFingerTip(handPose)
          if (indexTip && videoElement) {
            console.log('Index tip:', indexTip)
            cursorScreenPoint = processAirMouseCursor(indexTip, videoElement)

            const canvasRect = canvasRef.current.getBoundingClientRect()
            canvasPoint = {
              x: (cursorScreenPoint.x - canvasRect.left - panX) / zoom,
              y: (cursorScreenPoint.y - canvasRect.top - panY) / zoom,
            }
            currentState.setCursorPosition(cursorScreenPoint)
            currentState.setCanvasCursorPosition(canvasPoint)
          }

          console.log('Hand Tracking Video Source:', {
            hasSrcObject: !!videoElement?.srcObject,
            paused: videoElement?.paused,
            readyState: videoElement?.readyState,
            videoWidth: videoElement?.videoWidth,
            videoHeight: videoElement?.videoHeight,
          })

          const gesture = detectGestureSmoothed(handPose)
          currentState.setCurrentGesture(gesture)

          let uiClickHandled = false
          if (gesture.type === "pinch") {
            const elementUnderCursor = document.elementFromPoint(cursorScreenPoint.x, cursorScreenPoint.y)

            if (
              elementUnderCursor &&
              elementUnderCursor !== canvasRef.current &&
              (elementUnderCursor.classList.contains("toolbar-button") ||
                elementUnderCursor.classList.contains("color-button") ||
                elementUnderCursor.classList.contains("layer-item"))
            ) {
              ;(elementUnderCursor as HTMLElement).click()
              uiClickHandled = true
            }
          }

          if (gesture.type !== "none" && !uiClickHandled) {
            handleGesture(gesture, canvasPoint)
          } else if (gesture.type === "none") {
            handleGestureReleased(canvasPoint)
          }

          drawCursor(cursorScreenPoint, 12, '#FF0000', gesture.type)
        } else {
          console.log('No hand detected')
          currentState.setCurrentGesture({ type: 'none', confidence: 0 })
          handleGestureReleased(currentState.canvasCursorPosition)
          resetGestureController()
          resetCursorSmoothing()
        }
      } else {
        drawHandLandmarksOverlay(overlayCanvas, null, sourceWidth, sourceHeight)
        drawCursor(currentState.canvasCursorPosition)
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    if (appReady) {
      animationRef.current = requestAnimationFrame(animate)
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [appReady, zoom, panX, panY])

  const handleSave = () => {
    if (!projectId || !user) return

    const currentState = useStore.getState()

    try {
      const stored = localStorage.getItem("gesture-board-projects")
      const allProjects = stored ? JSON.parse(stored) : []

      const updatedProjects = allProjects.map((p: Project) =>
        p.id === projectId
          ? { ...p, canvas_data: { layers: currentState.layers }, updated_at: new Date().toISOString() }
          : p
      )

      localStorage.setItem("gesture-board-projects", JSON.stringify(updatedProjects))
      alert("Project saved successfully!")
    } catch (err) {
      console.error("Failed to save project:", err)
      alert("Failed to save project")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Project Not Found</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button onClick={() => navigate("/dashboard")} className="btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 w-screen h-screen bg-white overflow-hidden" style={{ zIndex: 0 }}>
      {/* INFINITE WHITEBOARD CANVAS - Z: 1 */}
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          background: `
            linear-gradient(0deg, #f9f9f9 1px, transparent 1px),
            linear-gradient(90deg, #f9f9f9 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
          zIndex: 1,
          overflow: 'hidden',
        }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{
            transform: `scale(${zoom}) translate(${panX}px, ${panY}px)`,
            pointerEvents: 'auto', // Always allow canvas events
            transformOrigin: '0 0',
            cursor: getCursorForTool(state.activeTool, isDraggingPanel),
            zIndex: 1,
          }}
        />
      </div>

      {/* VIDEO FEED - Z: 1000 */}
      {state.isHandGestureEnabled && (
        <div
          className="fixed bottom-5 right-5 w-48 h-36 pointer-events-none"
          style={{
            zIndex: 1000,
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          }}
        >
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full border-2 border-green-500 rounded-lg"
            style={{
              transform: 'scaleX(-1)',
              pointerEvents: 'none',
              objectFit: 'cover',
            }}
            playsInline
            muted
          />
          <canvas
            ref={landmarkCanvasRef}
            className="absolute inset-0 w-full h-full rounded-lg"
            style={{
              transform: 'scaleX(-1)',
              pointerEvents: 'none',
            }}
          />
        </div>
      )}

      {/* HEADER - Z: 100 */}
      <div
        className="fixed top-0 left-0 right-0 h-20 bg-gradient-to-b from-slate-900 to-slate-800 border-b border-white/10 px-6 py-4 flex items-center justify-between"
        style={{
          zIndex: 100,
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">{project.title}</h1>
            <p className="text-xs text-gray-400">Last edited {new Date(project.updated_at).toLocaleDateString()}</p>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Save className="w-4 h-4" />
          Save Project
        </button>

        <button
          onClick={async () => {
            const shareUrl = window.location.href

            try {
              await navigator.clipboard.writeText(shareUrl)
              alert('Board link copied. Share it with collaborators to join this project.')
            } catch {
              window.prompt('Copy this board link to share with collaborators:', shareUrl)
            }
          }}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Invite Collaborators
          {collaborationService.isActive() && (
            <span className="ml-2 px-2 py-1 bg-green-500 text-xs rounded-full">
              {collaborationService.getOnlineUsers().length} online
            </span>
          )}
        </button>
      </div>

      {/* TOOLBAR - Z: 100 (LEFT SIDE) */}
      <div
        className="absolute w-72 bg-slate-800/95 backdrop-blur-md border border-white/10 rounded-xl overflow-y-auto max-h-[calc(100vh-150px)]"
        style={{
          left: toolbarPosition.x,
          top: toolbarPosition.y,
          zIndex: 100,
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          pointerEvents: 'none', // Allow events to pass through to canvas
        }}
      >
        <div className="panel-drag-handle" data-panel="toolbar" style={{ pointerEvents: 'auto' }}> {/* Enable events for content */}
          <div className="flex items-center justify-between p-2 border-b border-white/10 cursor-move">
            <span className="text-xs text-gray-400 font-medium">Toolbar</span>
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
              <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
              <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
            </div>
          </div>
          <Toolbar />
        </div>
      </div>

      {/* COLOR PICKER & LAYERS - Z: 100 (RIGHT SIDE) */}
      <div
        className="absolute w-80 bg-slate-800/95 backdrop-blur-md border border-white/10 rounded-xl overflow-y-auto max-h-[calc(100vh-150px)]"
        style={{
          left: colorPickerPosition.x,
          top: colorPickerPosition.y,
          zIndex: 100,
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          pointerEvents: 'none', // Allow events to pass through to canvas
        }}
      >
        <div className="panel-drag-handle" data-panel="colorPicker" style={{ pointerEvents: 'auto' }}> {/* Enable events for content */}
          <div className="flex items-center justify-between p-2 border-b border-white/10 cursor-move">
            <span className="text-xs text-gray-400 font-medium">Tools</span>
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
              <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
              <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
            </div>
          </div>
          <div className="border-b border-white/10 p-4">
            <ColorPicker />
          </div>

          {state.showLayers && (
            <div className="flex-1 overflow-y-auto p-4">
              <LayersPanel />
            </div>
          )}
        </div>
      </div>

      {/* CAMERA TOGGLE - Z: 100 (BOTTOM LEFT) */}
      <div className="fixed bottom-6 left-6 z-100" style={{ zIndex: 100, pointerEvents: 'auto' }}>
        <CameraToggle />
      </div>

      {/* CLOSE GESTURE BUTTON - Z: 100 */}
      {state.isHandGestureEnabled && (
        <button
          onClick={() => {
            state.setHandGestureEnabled(false)
            stopWebcam()
          }}
          className="fixed top-24 left-6 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
          style={{
            zIndex: 100,
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            pointerEvents: 'auto',
          }}
        >
          ✕ Close Gestures
        </button>
      )}

      {/* GESTURE INDICATOR - Z: 100 (BOTTOM RIGHT) */}
      {state.isHandGestureEnabled && (
        <div
          className="fixed bottom-6 right-6 bg-slate-800/95 backdrop-blur-md border border-white/10 text-white px-4 py-2 rounded-lg text-sm font-mono"
          style={{
            zIndex: 100,
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            pointerEvents: 'auto',
          }}
        >
          {state.currentGesture.type} ({(state.currentGesture.confidence * 100).toFixed(0)}%)
        </div>
      )}
    </div>
  )
}

export default BoardWorkspace
