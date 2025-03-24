import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DrawingCanvas from './DrawingCanvas';
import WordSelection from './WordSelection';
import CategorySelection from './CategorySelection';
import ChatBox from './ChatBox';
import PlayersList from './PlayersList';
import RoundSummary from './RoundSummary';
import GameSettings from './GameSettings';
import DrawingReplay from './DrawingReplay';
import { playSound, setMuted } from '../utils/sounds';
import './Game.css';

const Game = ({ socket, user, onLeave }) => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [gameState, setGameState] = useState(null);
  const [messages, setMessages] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showRoundSummary, setShowRoundSummary] = useState(false);
  const [roundSummaryData, setRoundSummaryData] = useState(null);
  const [showGameSummary, setShowGameSummary] = useState(false);
  const [gameSummaryData, setGameSummaryData] = useState(null);
  const [wordHint, setWordHint] = useState('');
  const wordHintRef = useRef(null);
  
  useEffect(() => {
    if (!socket || !user) return;
    
    // Join the room
    socket.emit('join-room', {
      roomId,
      playerName: user.username
    });
    
    // Set up socket event listeners
    socket.on('game-state', (state) => {
      setGameState(state);
      
      // Handle word hint
      if (state.wordHint) {
        setWordHint(state.wordHint);
      }
      
      // Play sounds for status changes
      if (state.status === 'selectingCategory' && state.currentDrawer === socket.id) {
        playSound('yourTurn');
      } else if (state.status === 'roundEnd') {
        playSound('newRound');
      } else if (state.status === 'gameEnd') {
        playSound('gameEnd');
      }
    });
    
    socket.on('new-message', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
      
      // Play sounds for messages
      if (message.type === 'correct-guess') {
        playSound('correctGuess');
      } else if (message.type === 'chat' && message.playerId !== socket.id) {
        playSound('message');
      }
    });
    
    socket.on('round-summary', (summary) => {
      setRoundSummaryData(summary);
      setShowRoundSummary(true);
    });
    
    socket.on('game-summary', (summary) => {
      setGameSummaryData(summary);
      setShowGameSummary(true);
    });
    
    socket.on('error', (error) => {
      console.error('Game error:', error);
      alert(error.message);
    });
    
    socket.on('word-hint', ({ hint }) => {
      setWordHint(hint);
      
      // Add animation to word hint
      if (wordHintRef.current) {
        wordHintRef.current.classList.add('hint-updated');
        setTimeout(() => {
          if (wordHintRef.current) {
            wordHintRef.current.classList.remove('hint-updated');
          }
        }, 1000);
      }
    });
    
    // Handle drawing updates
    socket.on('drawing-update', (drawingData) => {
      // This will be handled by the DrawingCanvas component
    });
    
    // Clean up on unmount
    return () => {
      socket.emit('leave-room');
      socket.off('game-state');
      socket.off('new-message');
      socket.off('round-summary');
      socket.off('game-summary');
      socket.off('error');
      socket.off('word-hint');
      socket.off('drawing-update');
    };
  }, [socket, user, roomId, navigate]);
  
  const handleSendDrawing = (drawingData) => {
    if (!socket) return;
    socket.emit('drawing', drawingData);
  };
  
  const handleSelectWord = (word) => {
    if (!socket) return;
    socket.emit('select-word', word);
  };
  
  const handleSelectCategory = (category) => {
    if (!socket) return;
    socket.emit('select-category', category);
  };
  
  const handleSendMessage = (message) => {
    if (!socket) return;
    socket.emit('chat-message', message);
  };
  
  const handleRequestHint = () => {
    if (!socket) return;
    socket.emit('request-hint');
  };
  
  const handleStartGame = () => {
    if (!socket) return;
    socket.emit('start-game');
  };
  
  const handleReadyForNext = () => {
    if (!socket) return;
    socket.emit('ready-for-next');
    setShowRoundSummary(false);
    setShowGameSummary(false);
  };
  
  const handleLeaveGame = () => {
    if (!socket) return;
    socket.emit('leave-room');
    navigate('/');
  };
  
  const handleUpdateSettings = (settings) => {
    if (!socket) return;
    socket.emit('update-settings', settings);
    
    // Update sound settings locally
    setMuted(!settings.soundEnabled);
  };
  
  // Determine if current user is drawing
  const isDrawing = gameState?.currentDrawer === socket?.id;
  
  // Check if game has started
  const gameStarted = gameState?.status !== 'waiting';
  
  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  if (!gameState) {
    return (
      <div className="loading-game">
        <div className="spinner"></div>
        <p>Joining game...</p>
      </div>
    );
  }
  
  return (
    <div className="game-container">
      <div className="game-header">
        <div className="game-title">
          <h1>{gameState.name}</h1>
          <div className="game-status">
            {gameState.status === 'waiting' ? 'Waiting for players' : 
             gameState.status === 'selectingCategory' ? 'Selecting category' :
             gameState.status === 'selecting' ? 'Selecting word' :
             gameState.status === 'drawing' ? 'Drawing in progress' :
             gameState.status === 'roundEnd' ? 'Round ended' : 'Game ended'}
          </div>
        </div>
        
        <div className="game-info">
          <div className="round-info">
            {gameStarted ? `Round ${gameState.round}/${gameState.maxRounds}` : 'Game not started'}
          </div>
          
          <div className="timer">
            {gameState.timeLeft > 0 && (gameState.status === 'drawing' || 
              gameState.status === 'selecting' || 
              gameState.status === 'selectingCategory') ? 
              formatTime(gameState.timeLeft) : ''}
          </div>
          
          {gameState.status === 'drawing' && !isDrawing && (
            <div className="word-hint-container" ref={wordHintRef}>
              <div className="word-hint">
                {wordHint.split('').map((char, index) => (
                  <span key={index} className={char !== '_' ? 'revealed' : ''}>
                    {char === '_' ? '_ ' : char + ' '}
                  </span>
                ))}
              </div>
              
              {gameState.settings.hints && !isDrawing && (
                <HintButton onRequestHint={handleRequestHint} />
              )}
            </div>
          )}
        </div>
        
        <div className="game-actions">
          {gameState.status === 'waiting' && gameState.players.length >= 2 && (
            <button className="start-btn" onClick={handleStartGame}>
              Start Game
            </button>
          )}
          
          {gameState.status === 'waiting' && (
            <button className="settings-btn" onClick={() => setShowSettings(true)}>
              Settings
            </button>
          )}
          
          <button className="leave-btn" onClick={handleLeaveGame}>
            Leave Game
          </button>
        </div>
      </div>
      
      <div className="game-main">
        <div className="left-column">
          <PlayersList 
            players={gameState.players} 
            currentDrawer={gameState.currentDrawer}
            currentPlayerId={socket.id}
          />
        </div>
        
        <div className="center-column">
          {gameState.status === 'selectingCategory' && isDrawing && (
            <CategorySelection
              categories={gameState.categories}
              selectedCategory={gameState.selectedCategory}
              onSelectCategory={handleSelectCategory}
            />
          )}
          
          {gameState.status === 'selecting' && isDrawing && (
            <WordSelection
              isSelecting={true}
              words={gameState.wordOptions}
              onSelectWord={handleSelectWord}
              timeLeft={gameState.timeLeft}
            />
          )}
          
          <div className="canvas-container">
            {gameState.status === 'drawing' && isDrawing && (
              <div className="drawing-word">
                You are drawing: <strong>{gameState.currentWord}</strong>
              </div>
            )}
            
            <DrawingCanvas
              isDrawing={isDrawing && gameState.status === 'drawing'}
              onSendDrawing={handleSendDrawing}
              socket={socket}
            />
            
            {gameState.status === 'drawing' && gameState.drawingActions && !isDrawing && (
              <DrawingReplay drawingActions={gameState.drawingActions} duration={1000} />
            )}
          </div>
        </div>
        
        <div className="right-column">
          <ChatBox
            messages={messages}
            onSendMessage={handleSendMessage}
            currentPlayer={user}
            currentPlayerId={socket.id}
            isDrawing={isDrawing && gameState.status === 'drawing'}
          />
        </div>
      </div>
      
      {showRoundSummary && roundSummaryData && (
        <RoundSummary
          word={roundSummaryData.word}
          drawer={roundSummaryData.drawer}
          scores={roundSummaryData.scores}
          roundNumber={roundSummaryData.roundNumber}
          totalRounds={roundSummaryData.totalRounds}
          onContinue={handleReadyForNext}
        />
      )}
      
      {showGameSummary && gameSummaryData && (
        <GameSummary
          finalScores={gameSummaryData.finalScores}
          winner={gameSummaryData.winner}
          rounds={gameSummaryData.rounds}
          onContinue={handleReadyForNext}
        />
      )}
      
      {showSettings && (
        <GameSettings
          onClose={() => setShowSettings(false)}
          gameSettings={gameState.settings}
          onUpdateSettings={handleUpdateSettings}
        />
      )}
    </div>
  );
};

export default Game; 