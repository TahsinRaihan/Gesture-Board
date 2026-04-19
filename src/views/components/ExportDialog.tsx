/**
 * Export Dialog Component
 * Allows users to export canvas with format and background options
 */

import React, { useState } from 'react';
import '../styles/ExportDialog.css';

interface ExportDialogProps {
  onExport: (format: string, background: string) => void;
  onCancel: () => void;
}

const ExportDialog: React.FC<ExportDialogProps> = ({ onExport, onCancel }) => {
  const [format, setFormat] = useState<'png' | 'jpg' | 'json'>('png');
  const [background, setBackground] = useState<'white' | 'dark' | 'transparent'>('white');

  const handleExport = () => {
    onExport(format, background);
  };

  return (
    <div className="export-dialog-overlay">
      <div className="export-dialog">
        <h2>Export Canvas</h2>
        
        <div className="export-option">
          <label>Format:</label>
          <div className="option-group">
            <label className="radio-label">
              <input
                type="radio"
                name="format"
                value="png"
                checked={format === 'png'}
                onChange={(e) => setFormat(e.target.value as any)}
              />
              PNG (Transparent background)
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="format"
                value="jpg"
                checked={format === 'jpg'}
                onChange={(e) => setFormat(e.target.value as any)}
              />
              JPG (Quality export)
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="format"
                value="json"
                checked={format === 'json'}
                onChange={(e) => setFormat(e.target.value as any)}
              />
              JSON (Project file)
            </label>
          </div>
        </div>

        {format !== 'json' && (
          <div className="export-option">
            <label>Background:</label>
            <div className="option-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="background"
                  value="white"
                  checked={background === 'white'}
                  onChange={(e) => setBackground(e.target.value as any)}
                />
                White
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="background"
                  value="dark"
                  checked={background === 'dark'}
                  onChange={(e) => setBackground(e.target.value as any)}
                />
                Dark
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="background"
                  value="transparent"
                  checked={background === 'transparent'}
                  onChange={(e) => setBackground(e.target.value as any)}
                />
                Transparent
              </label>
            </div>
          </div>
        )}

        <div className="export-actions">
          <button className="export-cancel-btn" onClick={onCancel}>
            Cancel
          </button>
          <button className="export-submit-btn" onClick={handleExport}>
            Export
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportDialog;
