import React, { useState } from 'react';
import './ColorPicker.css';

// Predefined color palette
const COLORS = [
  '#000000', '#FFFFFF', '#F44336', '#E91E63', '#9C27B0', '#673AB7', 
  '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50',
  '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722',
  '#795548', '#9E9E9E', '#607D8B'
];

const ColorPicker = ({ color, onColorChange }) => {
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  
  const handleColorClick = (newColor) => {
    onColorChange(newColor);
  };
  
  const handleCustomColorChange = (e) => {
    onColorChange(e.target.value);
  };
  
  return (
    <div className="color-picker">
      <div className="color-grid">
        {COLORS.map((colorOption, index) => (
          <div 
            key={index}
            className={`color-option ${colorOption === color ? 'selected' : ''}`}
            style={{ backgroundColor: colorOption }}
            onClick={() => handleColorClick(colorOption)}
          />
        ))}
        
        <div 
          className={`color-option custom ${showCustomPicker ? 'selected' : ''}`}
          onClick={() => setShowCustomPicker(!showCustomPicker)}
        >
          <span>+</span>
        </div>
      </div>
      
      {showCustomPicker && (
        <div className="custom-color-picker">
          <input 
            type="color" 
            value={color}
            onChange={handleCustomColorChange}
          />
        </div>
      )}
      
      <div className="current-color">
        <div 
          className="color-preview" 
          style={{ backgroundColor: color }}
        />
        <div className="color-value">{color}</div>
      </div>
    </div>
  );
};

export default ColorPicker; 