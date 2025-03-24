import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import DrawingCanvas from './DrawingCanvas';
import WordSelection from './WordSelection';
import ChatBox from './ChatBox';
import PlayersList from './PlayersList';
import './Game.css';

const Game = () => {
  const [socket, setSocket] = useState(null);
  const [gameState, setGameState] = useState({
    status: 'waiting', // waiting, selecting, drawing, roundEnd, gameEnd
    players: [],
    currentDrawer: null,
    currentWord: null,
    wordOptions: [],
    timeLeft: 0,
    round: 0,
    maxRounds: 3,
  });
  const [messages, setMessages] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  
  useEffect(() => {
    // Connect to the server
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);
    
    // Handle initial connection
    newSocket.on('connect', () => {
      // Prompt for player name
      const playerName = prompt('Enter your name:');
      newSocket.emit('join-game', { playerName });
    });
    
    // Set up socket event listeners
    newSocket.on('game-state', (state) => {
      setGameState(state);
    });
    
    newSocket.on('player-info', (player) => {
      setCurrentPlayer(player);
    });
    
    newSocket.on('new-message', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });
    
    // Clean up on component unmount
    return () => {
      newSocket.disconnect();
    };
  }, []);
  
  const handleSendDrawing = (drawingData) => {
    if (!socket) return;
    socket.emit('drawing', drawingData);
  };
  
  const handleSelectWord = (word) => {
    if (!socket) return;
    socket.emit('select-word', word);
  };
  
  const handleSendMessage = (message) => {
    if (!socket) return;
    socket.emit('chat-message', message);
  };
  
  const isDrawing = currentPlayer && gameState.currentDrawer === currentPlayer.id;
  const isSelecting = isDrawing && gameState.status === 'selecting';
  
  return (
    <div className="game-container">
      <div className="game-header">
        <h1>Draw and Guess</h1>
        <div className="game-info">
          <div className="round">Round: {gameState.round}/{gameState.maxRounds}</div>
          <div className="timer">Time: {gameState.timeLeft}s</div>
          {gameState.status === 'drawing' && !isDrawing && gameState.currentWord && (
            <div className="current-word">
              Word: {currentPlayer?.hasGuessedCorrect ? gameState.currentWord : gameState.currentWord.replace(/[a-zA-Z]/g, '_ ')}
            </div>
          )}
        </div>
      </div>
      
      <div className="game-main">
        <PlayersList 
          players={gameState.players} 
          currentDrawer={gameState.currentDrawer}
          currentPlayerId={currentPlayer?.id}
        />
        
        <div className="canvas-area">
          {isSelecting && (
            <WordSelection
              isSelecting={isSelecting}
              words={gameState.wordOptions}
              onSelectWord={handleSelectWord}
              timeLeft={gameState.timeLeft}
            />
          )}
          <DrawingCanvas
            isDrawing={isDrawing && gameState.status === 'drawing'}
            onSendDrawing={handleSendDrawing}
          />
          {gameState.status === 'drawing' && isDrawing && (
            <div className="drawing-word">
              You are drawing: <strong>{gameState.currentWord}</strong>
            </div>
          )}
        </div>
        
        <ChatBox
          messages={messages}
          onSendMessage={handleSendMessage}
          currentPlayer={currentPlayer}
          currentWord={gameState.currentWord}
          isDrawing={isDrawing}
        />
      </div>
    </div>
  );
};

export default Game; 