import React, { useEffect, useRef, useState } from 'react';
import './DrawingCanvas.css';

const DrawingCanvas = ({ isDrawing, onSendDrawing }) => {
  const canvasRef = useRef(null);
  const [context, setContext] = useState(null);
  const [drawing, setDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    setContext(ctx);
    
    // Clear canvas initially
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);
  
  const startDrawing = (e) => {
    if (!isDrawing) return;
    
    const { offsetX, offsetY } = getCoordinates(e);
    context.beginPath();
    context.moveTo(offsetX, offsetY);
    setDrawing(true);
    
    // Send drawing data to server
    onSendDrawing({
      type: 'start',
      x: offsetX,
      y: offsetY,
      color,
      brushSize
    });
  };
  
  const draw = (e) => {
    if (!isDrawing || !drawing) return;
    
    const { offsetX, offsetY } = getCoordinates(e);
    context.lineTo(offsetX, offsetY);
    context.stroke();
    context.strokeStyle = color;
    context.lineWidth = brushSize;
    
    // Send drawing data to server
    onSendDrawing({
      type: 'draw',
      x: offsetX,
      y: offsetY,
      color,
      brushSize
    });
  };
  
  const stopDrawing = () => {
    if (!drawing) return;
    context.closePath();
    setDrawing(false);
    
    // Send drawing data to server
    onSendDrawing({
      type: 'end'
    });
  };
  
  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (e.touches && e.touches[0]) {
      const rect = canvas.getBoundingClientRect();
      return {
        offsetX: e.touches[0].clientX - rect.left,
        offsetY: e.touches[0].clientY - rect.top
      };
    }
    return {
      offsetX: e.nativeEvent.offsetX,
      offsetY: e.nativeEvent.offsetY
    };
  };
  
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Send clear action to server
    onSendDrawing({
      type: 'clear'
    });
  };
  
  return (
    <div className="drawing-container">
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
      
      {isDrawing && (
        <div className="drawing-controls">
          <div className="color-picker">
            <input 
              type="color" 
              value={color} 
              onChange={(e) => setColor(e.target.value)} 
            />
          </div>
          <div className="brush-size">
            <input
              type="range"
              min="1"
              max="20"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
            />
          </div>
          <button onClick={clearCanvas}>Clear</button>
        </div>
      )}
    </div>
  );
};

export default DrawingCanvas; 