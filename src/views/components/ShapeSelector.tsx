/**
 * Shape Selector Component
 * Dropdown menu to select different shapes
 */

import React, { useState } from 'react';
import { ChevronDown, Square, Circle, Triangle, Star, Minus } from 'lucide-react';
import '../styles/ShapeSelector.css';

interface ShapeSelectorProps {
  onSelect: (shapeType: string) => void;
  active?: boolean;
}

const ShapeSelector: React.FC<ShapeSelectorProps> = ({ onSelect, active = false }) => {
  const [isOpen, setIsOpen] = useState(false);

  const shapes = [
    { id: 'rectangle', label: 'Rectangle', icon: Square },
    { id: 'square', label: 'Square', icon: Square },
    { id: 'circle', label: 'Circle', icon: Circle },
    { id: 'triangle', label: 'Triangle', icon: Triangle },
    { id: 'star', label: 'Star', icon: Star },
    { id: 'pentagon', label: 'Pentagon', icon: Circle },
    { id: 'line', label: 'Line', icon: Minus },
  ];

  const handleSelect = (shapeId: string) => {
    onSelect(shapeId);
    setIsOpen(false);
  };

  return (
    <div className="shape-selector">
      <button
        className={`shape-selector-toggle ${active ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Select Shape"
      >
        <Square size={20} />
        <span>Shapes</span>
        <ChevronDown size={16} className={isOpen ? 'open' : ''} />
      </button>

      {isOpen && (
        <div className="shape-dropdown">
          {shapes.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className="shape-option"
              onClick={() => handleSelect(id)}
              title={label}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ShapeSelector;
