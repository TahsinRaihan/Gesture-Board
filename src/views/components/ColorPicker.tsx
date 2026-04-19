/**
 * Color Picker Component
 * Color selection interface
 */

import React, { useState } from 'react';
import { useStore } from '@/store/store';
import { DEFAULT_COLORS } from '@/utils/constants';
import '../styles/ColorPicker.css';

const ColorPicker: React.FC = () => {
  const state = useStore();
  const [showCustom, setShowCustom] = useState(false);

  return (
    <div className="color-picker">
      <div className="color-picker-header">
        <h3>Color</h3>
        <div className="current-color" style={{ backgroundColor: state.activeColor }} />
      </div>

      <div className="color-palette">
        {DEFAULT_COLORS.map((color) => (
          <button
            key={color}
            className={`color-button ${state.activeColor === color ? 'active' : ''}`}
            style={{ backgroundColor: color }}
            onClick={() => state.setColor(color)}
            title={color}
          />
        ))}
      </div>

      <div className="color-picker-custom">
        <button
          className="toggle-custom-button"
          onClick={() => setShowCustom(!showCustom)}
        >
          {showCustom ? 'Hide' : 'Custom'}
        </button>

        {showCustom && (
          <div className="custom-color-input">
            <input
              type="color"
              value={state.activeColor}
              onChange={(e) => state.setColor(e.target.value)}
              className="color-input"
            />
            <input
              type="text"
              value={state.activeColor}
              onChange={(e) => {
                const val = e.target.value;
                if (val.match(/^#[0-9A-F]{6}$/i)) {
                  state.setColor(val);
                }
              }}
              placeholder="#000000"
              className="color-text-input"
            />
          </div>
        )}
      </div>

      <div className="stroke-width-picker">
        <h4>Stroke Width</h4>
        <input
          type="range"
          min="1"
          max="20"
          value={state.strokeWidth}
          onChange={(e) => state.setStrokeWidth(parseInt(e.target.value))}
          className="stroke-slider"
        />
        <span className="stroke-value">{state.strokeWidth}px</span>
      </div>
    </div>
  );
};

export default ColorPicker;
