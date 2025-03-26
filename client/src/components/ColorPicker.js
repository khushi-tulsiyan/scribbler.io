import React, { useState } from 'react';
import './ColorPicker.css';

const ColorPicker = ({ onColorChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#000000');

  const colors = [
    '#000000', // Black
    '#FFFFFF', // White
    '#FF0000', // Red
    '#00FF00', // Green
    '#0000FF', // Blue
    '#FFFF00', // Yellow
    '#FF00FF', // Magenta
    '#00FFFF', // Cyan
    '#FFA500', // Orange
    '#800080', // Purple
    '#008000', // Dark Green
    '#800000', // Maroon
    '#808080', // Gray
    '#FFC0CB', // Pink
    '#A52A2A', // Brown
    '#FFD700'  // Gold
  ];

  const handleColorSelect = (color) => {
    setSelectedColor(color);
    onColorChange(color);
    setIsOpen(false);
  };

  return (
    <div className="color-picker">
      <button 
        className="selected-color"
        onClick={() => setIsOpen(!isOpen)}
        style={{ backgroundColor: selectedColor }}
      >
        <span className="color-indicator" style={{ backgroundColor: selectedColor }}></span>
      </button>

      {isOpen && (
        <div className="color-palette">
          {colors.map((color) => (
            <button
              key={color}
              className={`color-option ${color === selectedColor ? 'selected' : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => handleColorSelect(color)}
            >
              {color === selectedColor && <span className="check-mark">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ColorPicker; 