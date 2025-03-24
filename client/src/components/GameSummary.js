import React from 'react';
import './GameSummary.css';

const GameSummary = ({ finalScores, winner, rounds, onContinue }) => {
  return (
    <div className="game-summary-overlay">
      <div className="game-summary-card">
        <h2>Game Complete!</h2>
        
        <div className="winner-section">
          <div className="crown-icon">👑</div>
          <div className="winner-name">{winner.name}</div>
          <div className="winner-score">{winner.score} points</div>
        </div>
        
        <div className="final-scores">
          <h3>Final Scores</h3>
          <div className="scores-table">
            <div className="table-header">
              <div>Rank</div>
              <div>Player</div>
              <div>Score</div>
            </div>
            
            <div className="table-body">
              {finalScores.map((player, index) => (
                <div key={player.player.id} className={`table-row ${player.player.id === winner.id ? 'winner-row' : ''}`}>
                  <div className="rank">#{index + 1}</div>
                  <div className="player-name">{player.player.name}</div>
                  <div className="player-score">{player.score}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="game-stats">
          <div className="stat-item">
            <div className="stat-label">Rounds Played</div>
            <div className="stat-value">{rounds}</div>
          </div>
        </div>
        
        <button className="continue-btn" onClick={onContinue}>
          Play Again
        </button>
      </div>
    </div>
  );
};

export default GameSummary; 