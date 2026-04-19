/**
 * Layers Panel Component
 * Layer management
 */

import React, { useState } from 'react';
import { Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import { useStore } from '@/store/store';
import '../styles/LayersPanel.css';

const LayersPanel: React.FC = () => {
  const state = useStore();
  const [newLayerName, setNewLayerName] = useState('');

  const handleAddLayer = () => {
    if (newLayerName.trim()) {
      state.addLayer(newLayerName);
      setNewLayerName('');
    }
  };

  const toggleLayerVisibility = (layerId: string) => {
    const layer = state.layers.find((l) => l.id === layerId);
    if (layer) {
      const updatedLayers = state.layers.map((l) =>
        l.id === layerId ? { ...l, visible: !l.visible } : l
      );
      state.setAllLayers(updatedLayers);
    }
  };

  return (
    <div className="layers-panel">
      <div className="layers-header">
        <h2>Layers</h2>
        <button
          className="add-layer-button"
          onClick={() => handleAddLayer()}
          title="Add Layer"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="new-layer-input">
        <input
          type="text"
          value={newLayerName}
          onChange={(e) => setNewLayerName(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAddLayer()}
          placeholder="New layer name"
          className="layer-name-input"
        />
      </div>

      <div className="layers-list">
        {state.layers.map((layer) => (
          <div
            key={layer.id}
            className={`layer-item ${state.activeLayerId === layer.id ? 'active' : ''}`}
            onClick={() => state.setActiveLayer(layer.id)}
          >
            <button
              className="layer-visibility"
              onClick={(e) => {
                e.stopPropagation();
                toggleLayerVisibility(layer.id);
              }}
              title={layer.visible ? 'Hide' : 'Show'}
            >
              {layer.visible ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>

            <div className="layer-info">
              <span className="layer-name">{layer.name}</span>
              <span className="layer-objects">{layer.objects.length} objects</span>
            </div>

            <button
              className="delete-layer-button"
              onClick={(e) => {
                e.stopPropagation();
                state.removeLayer(layer.id);
              }}
              title="Delete Layer"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <div className="layers-stats">
        <p>Total: {state.layers.reduce((sum, l) => sum + l.objects.length, 0)} objects</p>
      </div>
    </div>
  );
};

export default LayersPanel;
