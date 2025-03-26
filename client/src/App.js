import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import io from 'socket.io-client';
import Auth from './components/Auth';
import Game from './components/Game';
import GameRooms from './components/GameRooms';
import './App.css';

const socket = io(window.SOCKET_URL, {
  transports: ['polling', 'websocket'],
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 10000,
  autoConnect: true
});

function App() {
  const [player, setPlayer] = useState(null);
  const [isConnecting, setIsConnecting] = useState(true);

  useEffect(() => {
    // Check for stored player data
    const storedPlayer = localStorage.getItem('player');
    if (storedPlayer) {
      setPlayer(JSON.parse(storedPlayer));
    }

    // Connection event handlers
    socket.on('connect', () => {
      console.log('Connected to server with ID:', socket.id);
      setIsConnecting(false);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnecting(false);
    });

    socket.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason);
      setIsConnecting(true);
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
      setIsConnecting(false);
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('Reconnected to server after', attemptNumber, 'attempts');
      setIsConnecting(false);
    });

    socket.on('reconnect_error', (error) => {
      console.error('Reconnection error:', error);
    });

    socket.on('reconnect_failed', () => {
      console.error('Failed to reconnect to server');
      setIsConnecting(false);
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const handleLogin = (playerData) => {
    setPlayer(playerData);
    localStorage.setItem('player', JSON.stringify(playerData));
  };

  const handleLogout = () => {
    setPlayer(null);
    localStorage.removeItem('player');
    socket.emit('leave-room');
  };

  if (isConnecting) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Connecting to server...</p>
      </div>
    );
  }

  return (
    <Router>
      <div className="app">
        <Routes>
          <Route
            path="/"
            element={
              player ? (
                <GameRooms socket={socket} player={player} onLogout={handleLogout} />
              ) : (
                <Auth onLogin={handleLogin} />
              )
            }
          />
          <Route
            path="/game/:roomId"
            element={
              player ? (
                <Game socket={socket} user={player} onLeave={handleLogout} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App; 