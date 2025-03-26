import React from 'react';
import './PlayersList.css';

const PlayersList = ({ players, currentDrawer, currentPlayerId }) => {
  // Sort players by score in descending order
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="players-list">
      <h3>Players</h3>
      <div className="players">
        {sortedPlayers.map((player) => (
          <div
            key={player.id}
            className={`player ${player.id === currentDrawer ? 'drawing' : ''} ${
              player.id === currentPlayerId ? 'current' : ''
            } ${player.hasGuessedCorrectly ? 'correct' : ''}`}
          >
            <div className="player-info">
              <span className="player-name">{player.name}</span>
              <span className="player-score">{player.score}</span>
            </div>
            {player.id === currentDrawer && (
              <span className="drawing-indicator">✏️</span>
            )}
            {player.hasGuessedCorrectly && (
              <span className="correct-indicator">✓</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlayersList; 