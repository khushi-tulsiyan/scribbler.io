import React, { useEffect, useRef } from 'react';
import './DrawingReplay.css';

const DrawingReplay = ({ drawingActions, duration = 3000 }) => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    if (!drawingActions || drawingActions.length === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas initially
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Group actions by stroke
    const strokes = [];
    let currentStroke = [];
    
    drawingActions.forEach(action => {
      if (action.type === 'start') {
        currentStroke = [action];
      } else if (action.type === 'draw') {
        currentStroke.push(action);
      } else if (action.type === 'end') {
        if (currentStroke.length > 0) {
          strokes.push([...currentStroke]);
        }
      } else if (action.type === 'clear') {
        strokes.push([{ type: 'clear' }]);
      }
    });
    
    // Calculate timing for each stroke
    const timePerStroke = duration / strokes.length;
    
    // Play strokes with timing
    let currentTime = 0;
    
    strokes.forEach((stroke, strokeIndex) => {
      setTimeout(() => {
        if (stroke[0].type === 'clear') {
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          return;
        }
        
        const pointCount = stroke.length;
        ctx.beginPath();
        
        stroke.forEach((point, pointIndex) => {
          if (point.type === 'start') {
            ctx.strokeStyle = point.color;
            ctx.lineWidth = point.brushSize;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(point.x, point.y);
          } else if (point.type === 'draw') {
            ctx.lineTo(point.x, point.y);
            ctx.stroke();
          }
        });
      }, currentTime);
      
      currentTime += timePerStroke;
    });
    
  }, [drawingActions, duration]);
  
  return (
    <div className="drawing-replay">
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
      />
    </div>
  );
};

export default DrawingReplay; 