/**
 * Canvas Component
 * Main drawing canvas
 */

import React from 'react';

interface CanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  pointerEvents?: React.CSSProperties['pointerEvents'];
}

const Canvas: React.FC<CanvasProps> = ({ canvasRef, pointerEvents = 'auto' }) => {
  return <canvas ref={canvasRef} className="main-canvas" style={{ pointerEvents: pointerEvents as React.CSSProperties['pointerEvents'] }} />;
};

export default Canvas;
