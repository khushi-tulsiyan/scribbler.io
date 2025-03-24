import React, { useState } from 'react';
import './GameSettings.css';
import { setVolume, setMuted } from '../utils/sounds';

const GameSettings = ({ onClose, gameSettings, onUpdateSettings }) => {
  const [settings, setSettings] = useState({
    rounds: gameSettings.rounds || 3,
    drawTime: gameSettings.drawTime || 80,
    language: gameSettings.language || 'english',
    customWords: gameSettings.customWords || '',
    soundEnabled: gameSettings.soundEnabled !== false,
    soundVolume: gameSettings.soundVolume || 0.5,
    hints: gameSettings.hints !== false,
    maxPlayers: gameSettings.maxPlayers || 8
  });

  return (
    <div className="game-settings">
      {/* Render your settings form here */}
    </div>
  );
};

export default GameSettings; 