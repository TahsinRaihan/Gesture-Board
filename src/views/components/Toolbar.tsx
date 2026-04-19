/**
 * Toolbar Component
 * Tool selection and actions
 */

import React, { useState } from 'react';
import {
  Pencil,
  Type,
  Eraser,
  Undo2,
  Redo2,
  Trash2,
  Download,
  Layers,
  Sun,
  Moon,
  MousePointer,
} from 'lucide-react';
import { useStore } from '@/store/store';
import { exportCanvasAsImage } from '@/services/canvasRenderer';
import { exportCanvasAsJSON } from '@/services/storageService';
import ShapeSelector from './ShapeSelector';
import ExportDialog from './ExportDialog';
import '../styles/Toolbar.css';

const Toolbar: React.FC = () => {
  const state = useStore();
  const [showExportDialog, setShowExportDialog] = useState(false);

  const basicTools = [
    { id: 'select', label: 'Select', icon: MousePointer },
    { id: 'pencil', label: 'Pencil', icon: Pencil },
    { id: 'text', label: 'Text', icon: Type },
    { id: 'eraser', label: 'Eraser', icon: Eraser },
  ];

  const handleShapeSelect = (shapeId: string) => {
    state.setTool(shapeId as any);
  };

  const handleExport = (format: string, background: string) => {
    setShowExportDialog(false);

    if (format === 'json') {
      exportCanvasAsJSON(state.layers, 'hand-figma.json');
    } else {
      const ext = format === 'jpg' ? '.jpg' : '.png';
      exportCanvasAsImage(`hand-figma${ext}`, format as 'png' | 'jpg', background as any);
    }
  };

  return (
    <div className="toolbar">
      <div className="toolbar-header">
        <h2>Tools</h2>
      </div>
      
      <div className="toolbar-section">
        <h3>Draw</h3>
        {basicTools.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`toolbar-button ${state.activeTool === id ? 'active' : ''}`}
            onClick={() => state.setTool(id as any)}
            title={label}
          >
            <Icon size={20} />
            <span>{label}</span>
          </button>
        ))}

        {/* Shapes Dropdown */}
        <ShapeSelector
          onSelect={handleShapeSelect}
          active={[
            'rectangle',
            'square',
            'circle',
            'triangle',
            'star',
            'pentagon',
            'line',
          ].includes(state.activeTool)}
        />
      </div>

      <div className="toolbar-section">
        <h3>Actions</h3>
        <button
          className="toolbar-button"
          onClick={() => state.undo()}
          title="Undo"
        >
          <Undo2 size={20} />
          Undo
        </button>
        <button
          className="toolbar-button"
          onClick={() => state.redo()}
          title="Redo"
        >
          <Redo2 size={20} />
          Redo
        </button>
        {state.selectedObjectIds.length > 0 && (
          <button
            className="toolbar-button danger"
            onClick={() => {
              state.deleteSelectedObject();
              state.pushHistory();
            }}
            title={`Delete ${state.selectedObjectIds.length} selected object(s)`}
          >
            <Trash2 size={20} />
            Delete ({state.selectedObjectIds.length})
          </button>
        )}
        <button
          className="toolbar-button"
          onClick={() => {
            if (window.confirm('Clear all drawings?')) {
              state.clearAll();
            }
          }}
          title="Clear All"
        >
          <Trash2 size={20} />
          Clear
        </button>
      </div>

      <div className="toolbar-section">
        <h3>File</h3>
        <button
          className="toolbar-button"
          onClick={() => setShowExportDialog(true)}
          title="Export"
        >
          <Download size={20} />
          Export
        </button>
        <button
          className="toolbar-button"
          onClick={() => state.toggleLayers()}
          title="Layers"
        >
          <Layers size={20} />
          Layers
        </button>
      </div>

      <div className="toolbar-section">
        <h3>Theme</h3>
        <button
          className="toolbar-button"
          onClick={() => state.toggleTheme()}
          title={`Switch to ${state.theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {state.theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          {state.theme === 'light' ? 'Dark' : 'Light'}
        </button>
      </div>

      {showExportDialog && (
        <ExportDialog
          onExport={handleExport}
          onCancel={() => setShowExportDialog(false)}
        />
      )}
    </div>
  );
};

export default Toolbar;
