import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import io from 'socket.io-client';
import Auth from './components/Auth';
import Game from './components/Game';
import GameRooms from './components/GameRooms';
import './App.css';

function App() {
  const [player, setPlayer] = useState(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Check for stored player data
    const storedPlayer = localStorage.getItem('player');
    if (storedPlayer) {
      setPlayer(JSON.parse(storedPlayer));
    }

    // Initialize socket connection with optimized settings
    const newSocket = io('http://localhost:3001', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
      forceNew: true,
      autoConnect: true,
      withCredentials: true,
      path: '/socket.io/',
      query: {
        timestamp: Date.now()
      }
    });

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('Connected to server with ID:', newSocket.id);
      setIsConnecting(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnecting(false);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason);
      setIsConnecting(true);
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
      setIsConnecting(false);
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('Reconnected to server after', attemptNumber, 'attempts');
      setIsConnecting(false);
    });

    newSocket.on('reconnect_error', (error) => {
      console.error('Reconnection error:', error);
    });

    newSocket.on('reconnect_failed', () => {
      console.error('Failed to reconnect to server');
      setIsConnecting(false);
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.disconnect();
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