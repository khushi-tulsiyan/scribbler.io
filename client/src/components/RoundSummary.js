import React from 'react';
import './RoundSummary.css';

const RoundSummary = ({ word, drawer, scores, roundNumber, totalRounds, onContinue }) => {
  return (
    <div className="round-summary-overlay">
      <div className="round-summary-card">
        <h2>Round {roundNumber} Complete!</h2>
        
        <div className="round-word">
          The word was: <span>{word}</span>
        </div>
        
        <div className="round-drawer">
          Drawn by: <span>{drawer.name}</span>
        </div>
        
        <div className="scores-table">
          <div className="scores-header">
            <div>Player</div>
            <div>Score</div>
            <div>+/-</div>
          </div>
          
          {scores.map((playerScore, index) => (
            <div key={index} className="score-row">
              <div className="player-name">
                {playerScore.player.name}
                {playerScore.isDrawer && <span className="drawer-tag">Drawer</span>}
              </div>
              <div className="total-score">{playerScore.totalScore}</div>
              <div className={`score-change ${playerScore.roundScore > 0 ? 'positive' : ''}`}>
                {playerScore.roundScore > 0 ? '+' : ''}{playerScore.roundScore}
              </div>
            </div>
          ))}
        </div>
        
        <div className="round-progress">
          Round {roundNumber} of {totalRounds}
        </div>
        
        <button className="continue-btn" onClick={onContinue}>
          Continue
        </button>
      </div>
    </div>
  );
};

export default RoundSummary; 