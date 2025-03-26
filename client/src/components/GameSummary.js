import React from 'react';
import './GameSummary.css';

const GameSummary = ({ data, onReadyForNext }) => {
  // Sort players by final score in descending order
  const sortedPlayers = [...data.players].sort((a, b) => b.score - a.score);
  const winner = sortedPlayers[0];

  return (
    <div className="game-summary">
      <h2>Game Over!</h2>
      
      <div className="winner-section">
        <h3>Winner</h3>
        <div className="winner">
          <span className="winner-name">{winner.name}</span>
          <span className="winner-score">{winner.score} points</span>
          <span className="winner-crown">👑</span>
        </div>
      </div>

      <div className="final-standings">
        <h3>Final Standings</h3>
        <div className="standings-list">
          {sortedPlayers.map((player, index) => (
            <div key={player.id} className="standing-item">
              <span className="position">#{index + 1}</span>
              <span className="player-name">{player.name}</span>
              <span className="player-score">{player.score}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="game-stats">
        <h3>Game Stats</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">Total Rounds</span>
            <span className="stat-value">{data.totalRounds}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Words Drawn</span>
            <span className="stat-value">{data.wordsDrawn}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Guesses</span>
            <span className="stat-value">{data.totalGuesses}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Correct Guesses</span>
            <span className="stat-value">{data.correctGuesses}</span>
          </div>
        </div>
      </div>

      <button className="play-again-button" onClick={onReadyForNext}>
        Play Again
      </button>
    </div>
  );
};

export default GameSummary; 