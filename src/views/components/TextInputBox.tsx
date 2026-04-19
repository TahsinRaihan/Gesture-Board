/**
 * Text Input Box Component
 * Allows users to input text directly on the canvas
 */

import React, { useEffect, useRef } from 'react';
import '../styles/TextInputBox.css';

interface TextInputBoxProps {
  x: number;
  y: number;
  onSubmit: (text: string, fontSize: number) => void;
  onCancel: () => void;
}

const TextInputBox: React.FC<TextInputBoxProps> = ({ x, y, onSubmit, onCancel }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fontSize, setFontSize] = React.useState(16);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = () => {
    const text = inputRef.current?.value || '';
    if (text.trim()) {
      onSubmit(text, fontSize);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="text-input-box" style={{ left: `${x}px`, top: `${y}px` }}>
      <div className="text-input-container">
        <input
          ref={inputRef}
          type="text"
          className="text-input"
          placeholder="Enter text..."
          onKeyDown={handleKeyDown}
          style={{ fontSize: `${fontSize}px` }}
        />
        <div className="text-input-controls">
          <div className="font-size-control">
            <label>Size:</label>
            <input
              type="number"
              min="8"
              max="72"
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value))}
              className="font-size-input"
            />
          </div>
          <button className="text-submit-btn" onClick={handleSubmit}>
            Add
          </button>
          <button className="text-cancel-btn" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default TextInputBox;
