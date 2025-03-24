import React, { useState, useEffect } from 'react';
import './HintButton.css';

const HintButton = ({ onRequestHint }) => {
  const [cooldown, setCooldown] = useState(0);
  
  useEffect(() => {
    if (cooldown <= 0) return;
    
    const interval = setInterval(() => {
      setCooldown(prev => prev - 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [cooldown]);
  
  const handleClick = () => {
    if (cooldown > 0) return;
    
    onRequestHint();
    setCooldown(30); // 30 seconds cooldown between hints
  };
  
  return (
    <button 
      className={`hint-button ${cooldown > 0 ? 'cooling' : ''}`}
      onClick={handleClick}
      disabled={cooldown > 0}
    >
      {cooldown > 0 ? `Hint (${cooldown}s)` : 'Get Hint'}
    </button>
  );
};

export default HintButton; 