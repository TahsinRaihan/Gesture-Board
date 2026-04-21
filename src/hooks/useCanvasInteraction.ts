import { useState, useEffect, useRef, useCallback } from 'react'
import { DrawingObject, Point, ToolType } from '../types'
import { initCanvasRenderer, clearCanvas, drawObject } from '../services/canvasRenderer'

interface UseCanvasInteractionProps {
  canvasData: any
  onSave: (data: any) => void
  isEditable: boolean
}

export const useCanvasInteraction = ({ canvasData, onSave, isEditable }: UseCanvasInteractionProps) => {
  const [currentTool, setCurrentTool] = useState<ToolType>('pencil')
  const [currentColor, setCurrentColor] = useState('#ffffff')
  const [strokeWidth, setStrokeWidth] = useState(2)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPath, setCurrentPath] = useState<Point[]>([])
  const [layers, setLayers] = useState<any[]>(canvasData?.layers || [])
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Initialize canvas
  useEffect(() => {
    if (canvasRef.current && isEditable) {
      initCanvasRenderer(canvasRef.current)
      redrawCanvas()
    }
  }, [layers, isEditable])

  // Redraw canvas when layers change
  const redrawCanvas = useCallback(() => {
    if (!canvasRef.current) return

    clearCanvas()
    layers.forEach(layer => {
      if (layer.visible) {
        layer.objects.forEach((obj: DrawingObject) => {
          drawObject(obj)
        })
      }
    })
  }, [layers])

  // Handle gesture-based drawing
  const handleGesture = useCallback((gesture: any, handPose: any) => {
    if (!isEditable || !handPose?.landmarks) return

    const indexFinger = handPose.landmarks[8] // Index finger tip

    switch (gesture.type) {
      case 'pinch':
        if (!isDrawing) {
          setIsDrawing(true)
          setCurrentPath([indexFinger])
        } else {
          setCurrentPath(prev => [...prev, indexFinger])
        }
        break

      case 'pinch_end':
        if (isDrawing && currentPath.length > 1) {
          // Map tool types to drawing object types
          let drawingType: DrawingObject['type']
          if (currentTool === 'pencil' || currentTool === 'eraser') {
            drawingType = 'freehand'
          } else if (['rectangle', 'square', 'circle', 'triangle', 'star', 'pentagon', 'line', 'text'].includes(currentTool)) {
            drawingType = currentTool as DrawingObject['type']
          } else {
            drawingType = 'freehand' // fallback
          }

          const newObject: DrawingObject = {
            id: Date.now().toString(),
            type: drawingType,
            points: [...currentPath],
            color: currentColor,
            strokeWidth: strokeWidth,
            timestamp: Date.now()
          }

          const updatedLayers = [...layers]
          if (updatedLayers.length === 0) {
            updatedLayers.push({
              id: 'default',
              name: 'Layer 1',
              objects: [],
              visible: true,
              opacity: 1
            })
          }
          updatedLayers[0].objects.push(newObject)
          setLayers(updatedLayers)

          // Save to database
          onSave({ layers: updatedLayers })
        }
        setIsDrawing(false)
        setCurrentPath([])
        break

      case 'fist':
        // Undo last action
        const updatedLayers = [...layers]
        if (updatedLayers.length > 0 && updatedLayers[0].objects.length > 0) {
          updatedLayers[0].objects.pop()
          setLayers(updatedLayers)
          onSave({ layers: updatedLayers })
        }
        break

      case 'open_palm':
        // Redo (simplified - just clear and redraw)
        redrawCanvas()
        break
    }
  }, [isEditable, isDrawing, currentPath, currentTool, currentColor, strokeWidth, layers, onSave, redrawCanvas])

  // Mouse/touch fallback for development
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isEditable) return

    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const point: Point = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }

    setIsDrawing(true)
    setCurrentPath([point])
  }, [isEditable])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDrawing || !isEditable) return

    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const point: Point = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }

    setCurrentPath(prev => [...prev, point])
  }, [isDrawing, isEditable])

  const handleMouseUp = useCallback(() => {
    if (!isDrawing || !isEditable) return

    if (currentPath.length > 1) {
      // Map tool types to drawing object types
      let drawingType: DrawingObject['type']
      if (currentTool === 'pencil' || currentTool === 'eraser') {
        drawingType = 'freehand'
      } else if (['rectangle', 'square', 'circle', 'triangle', 'star', 'pentagon', 'line', 'text'].includes(currentTool)) {
        drawingType = currentTool as DrawingObject['type']
      } else {
        drawingType = 'freehand' // fallback
      }

      const newObject: DrawingObject = {
        id: Date.now().toString(),
        type: drawingType,
        points: [...currentPath],
        color: currentColor,
        strokeWidth: strokeWidth,
        timestamp: Date.now()
      }

      const updatedLayers = [...layers]
      if (updatedLayers.length === 0) {
        updatedLayers.push({
          id: 'default',
          name: 'Layer 1',
          objects: [],
          visible: true,
          opacity: 1
        })
      }
      updatedLayers[0].objects.push(newObject)
      setLayers(updatedLayers)
      onSave({ layers: updatedLayers })
    }

    setIsDrawing(false)
    setCurrentPath([])
  }, [isDrawing, isEditable, currentPath, currentTool, currentColor, strokeWidth, layers, onSave])

  return {
    canvasRef,
    currentTool,
    setCurrentTool,
    currentColor,
    setCurrentColor,
    strokeWidth,
    setStrokeWidth,
    isDrawing,
    handleGesture,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    layers
  }
}