/**
 * Canvas Component
 * Main drawing canvas
 */

import React from 'react';

interface CanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

const Canvas: React.FC<CanvasProps> = ({ canvasRef }) => {
  return <canvas ref={canvasRef} className="main-canvas" />;
};

export default Canvas;
