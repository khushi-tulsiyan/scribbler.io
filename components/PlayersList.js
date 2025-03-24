import React from 'react';
import './PlayersList.css';

const PlayersList = ({ players, currentDrawer, currentPlayerId }) => {
  // Sort players by score in descending order
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  
  return (
    <div className="players-list">
      <h3>Players</h3>
      <ul>
        {sortedPlayers.map((player) => {
          let playerClass = 'player';
          if (player.id === currentDrawer) {
            playerClass += ' drawing';
          }
          if (player.id === currentPlayerId) {
            playerClass += ' current-player';
          }
          
          return (
            <li key={player.id} className={playerClass}>
              <div className="player-name">
                {player.id === currentDrawer && '✏️ '}
                {player.name}
                {player.id === currentPlayerId && ' (You)'}
              </div>
              <div className="player-score">{player.score}</div>
              {player.hasGuessedCorrect && <span className="guessed-indicator">✓</span>}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default PlayersList; 