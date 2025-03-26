import React, { useState } from 'react';
import './HintButton.css';

const HintButton = ({ onRequestHint, disabled }) => {
  const [cooldown, setCooldown] = useState(false);
  const cooldownTime = 30000; // 30 seconds

  const handleClick = () => {
    if (cooldown || disabled) return;

    onRequestHint();
    setCooldown(true);

    setTimeout(() => {
      setCooldown(false);
    }, cooldownTime);
  };

  return (
    <button
      className={`hint-button ${cooldown ? 'cooldown' : ''}`}
      onClick={handleClick}
      disabled={cooldown || disabled}
    >
      {cooldown ? 'Wait for next hint' : 'Get Hint'}
    </button>
  );
};

export default HintButton; 