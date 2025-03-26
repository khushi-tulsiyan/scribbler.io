import React, { useEffect, useRef, useState } from 'react';
import ColorPicker from './ColorPicker';
import './DrawingCanvas.css';

const DrawingCanvas = ({ isDrawing, onSendDrawing, socket }) => {
  const canvasRef = useRef(null);
  const [context, setContext] = useState(null);
  const [drawing, setDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const [tool, setTool] = useState('brush'); // brush, eraser, fill
  const [lastPoint, setLastPoint] = useState(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    setContext(ctx);
    
    // Clear canvas initially
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Set up socket listeners for drawing from other users
    if (socket && !isDrawing) {
      socket.on('drawing-update', (drawingData) => {
        handleIncomingDrawing(drawingData, ctx);
      });
      
      return () => {
        socket.off('drawing-update');
      };
    }
  }, [socket, isDrawing]);
  
  const handleIncomingDrawing = (drawingData, ctx) => {
    if (!ctx) return;
    
    if (drawingData.type === 'start') {
      ctx.beginPath();
      ctx.moveTo(drawingData.x, drawingData.y);
      ctx.strokeStyle = drawingData.color;
      ctx.lineWidth = drawingData.brushSize;
    } else if (drawingData.type === 'draw') {
      ctx.lineTo(drawingData.x, drawingData.y);
      ctx.stroke();
    } else if (drawingData.type === 'clear') {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    } else if (drawingData.type === 'fill') {
      fillArea(drawingData.x, drawingData.y, drawingData.color, ctx);
    }
  };
  
  const startDrawing = (e) => {
    if (!isDrawing) return;
    
    const { offsetX, offsetY } = getCoordinates(e);
    
    if (tool === 'fill') {
      fillArea(offsetX, offsetY, color, context);
      onSendDrawing({
        type: 'fill',
        x: offsetX,
        y: offsetY,
        color
      });
      return;
    }
    
    context.beginPath();
    context.moveTo(offsetX, offsetY);
    context.strokeStyle = tool === 'eraser' ? 'white' : color;
    context.lineWidth = brushSize;
    setDrawing(true);
    setLastPoint({ x: offsetX, y: offsetY });
    
    // Send drawing data to server
    onSendDrawing({
      type: 'start',
      x: offsetX,
      y: offsetY,
      color: tool === 'eraser' ? 'white' : color,
      brushSize
    });
  };
  
  const draw = (e) => {
    if (!isDrawing || !drawing) return;
    
    const { offsetX, offsetY } = getCoordinates(e);
    
    // Calculate distance between points for smoother lines
    if (lastPoint) {
      const dx = offsetX - lastPoint.x;
      const dy = offsetY - lastPoint.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 0) {
        // Draw multiple points between last and current point for smoother lines
        const step = 2; // Adjust for line smoothness
        const steps = Math.ceil(distance / step);
        
        for (let i = 1; i <= steps; i++) {
          const x = lastPoint.x + (dx * i) / steps;
          const y = lastPoint.y + (dy * i) / steps;
          
          context.lineTo(x, y);
          context.stroke();
          
          // Send drawing data to server for each step
          if (i % 2 === 0 || i === steps) { // Send fewer points to reduce network traffic
            onSendDrawing({
              type: 'draw',
              x,
              y,
              color: tool === 'eraser' ? 'white' : color,
              brushSize
            });
          }
        }
      }
    }
    
    setLastPoint({ x: offsetX, y: offsetY });
  };
  
  const stopDrawing = () => {
    if (!drawing) return;
    context.closePath();
    setDrawing(false);
    setLastPoint(null);
    
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
  
  // Fill tool implementation
  const fillArea = (startX, startY, fillColor, ctx) => {
    const canvas = canvasRef.current;
    const width = canvas.width;
    const height = canvas.height;
    
    // Get image data
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Get the color at the clicked position
    const targetColor = getColorAtPixel(imageData, startX, startY);
    
    // Convert fill color to RGBA
    const fillRGBA = hexToRgba(fillColor);
    
    // If target color is the same as fill color, no need to fill
    if (colorsEqual(targetColor, fillRGBA)) {
      return;
    }
    
    // Flood fill algorithm
    const pixelsToCheck = [{x: startX, y: startY}];
    const visited = new Set();
    
    while (pixelsToCheck.length > 0) {
      const {x, y} = pixelsToCheck.pop();
      const pos = (y * width + x) * 4;
      
      // Skip if out of bounds or already visited
      if (x < 0 || y < 0 || x >= width || y >= height || visited.has(`${x},${y}`)) {
        continue;
      }
      
      // Check if the current pixel color matches the target color
      if (colorsEqual([data[pos], data[pos + 1], data[pos + 2], data[pos + 3]], targetColor)) {
        // Set the new color
        data[pos] = fillRGBA[0];
        data[pos + 1] = fillRGBA[1];
        data[pos + 2] = fillRGBA[2];
        data[pos + 3] = fillRGBA[3];
        
        // Mark as visited
        visited.add(`${x},${y}`);
        
        // Add adjacent pixels to check
        pixelsToCheck.push({x: x + 1, y: y});
        pixelsToCheck.push({x: x - 1, y: y});
        pixelsToCheck.push({x: x, y: y + 1});
        pixelsToCheck.push({x: x, y: y - 1});
      }
    }
    
    // Update the canvas with the filled area
    ctx.putImageData(imageData, 0, 0);
  };
  
  const getColorAtPixel = (imageData, x, y) => {
    const position = (y * imageData.width + x) * 4;
    return [
      imageData.data[position],
      imageData.data[position + 1],
      imageData.data[position + 2],
      imageData.data[position + 3]
    ];
  };
  
  const colorsEqual = (a, b) => {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
  };
  
  const hexToRgba = (hex) => {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Parse the hex values
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    return [r, g, b, 255]; // Full opacity
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
        className={tool === 'fill' ? 'fill-tool' : ''}
      />
      
      {isDrawing && (
        <div className="drawing-controls">
          <div className="tools">
            <button 
              className={`tool-button ${tool === 'brush' ? 'active' : ''}`}
              onClick={() => setTool('brush')}
              title="Brush"
            >
              ✏️
            </button>
            <button 
              className={`tool-button ${tool === 'eraser' ? 'active' : ''}`}
              onClick={() => setTool('eraser')}
              title="Eraser"
            >
              🧽
            </button>
            <button 
              className={`tool-button ${tool === 'fill' ? 'active' : ''}`}
              onClick={() => setTool('fill')}
              title="Fill"
            >
              🪣
            </button>
          </div>
          
          <ColorPicker 
            color={color}
            onColorChange={setColor}
          />
          
          <div className="brush-size-control">
            <label>Brush Size: {brushSize}px</label>
            <input
              type="range"
              min="1"
              max="50"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
            />
          </div>
          
          <button className="clear-button" onClick={clearCanvas}>Clear Canvas</button>
        </div>
      )}
    </div>
  );
};

export default DrawingCanvas; 