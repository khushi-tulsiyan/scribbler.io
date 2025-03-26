import React from 'react';
import './RoundSummary.css';

const RoundSummary = ({ 
  players, 
  currentWord, 
  currentDrawer, 
  onStartNextRound, 
  isDrawer,
  round,
  maxRounds 
}) => {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const correctGuessers = players.filter(p => p.hasGuessed);
  const timeLeft = 10; // 10 seconds to view summary

  return (
    <div className="round-summary">
      <h2>Round {round} Summary</h2>
      
      <div className="word-reveal">
        <h3>The word was:</h3>
        <div className="word">{currentWord}</div>
      </div>

      <div className="results-section">
        <h3>Who got it right?</h3>
        <div className="correct-guessers">
          {correctGuessers.map(player => (
            <div key={player.id} className="player-result correct">
              <span className="player-name">{player.name}</span>
              <span className="score">+{player.score}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="leaderboard">
        <h3>Current Leaderboard</h3>
        <div className="players-list">
          {sortedPlayers.map((player, index) => (
            <div key={player.id} className={`player-score ${player.id === currentDrawer.id ? 'drawer' : ''}`}>
              <span className="rank">{index + 1}</span>
              <span className="name">{player.name}</span>
              <span className="score">{player.score}</span>
            </div>
          ))}
        </div>
      </div>

      {isDrawer && round < maxRounds && (
        <button 
          className="next-round-button"
          onClick={onStartNextRound}
        >
          Start Next Round
        </button>
      )}
    </div>
  );
};

export default RoundSummary; 