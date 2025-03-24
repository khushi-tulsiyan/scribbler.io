import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import io from 'socket.io-client';
import Layout from './components/Layout';
import Auth from './components/Auth';
import GameRooms from './components/GameRooms';
import Game from './components/Game';
import './App.css';

const App = () => {
  const [socket, setSocket] = useState(null);
  const [user, setUser] = useState(null);
  const [isConnecting, setIsConnecting] = useState(true);
  
  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
    
    // Initialize socket connection
    const newSocket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:3001');
    
    newSocket.on('connect', () => {
      console.log('Connected to server');
      setSocket(newSocket);
      setIsConnecting(false);
    });
    
    newSocket.on('connect_error', (err) => {
      console.error('Connection error:', err);
      setIsConnecting(false);
    });
    
    // Clean up on unmount
    return () => {
      newSocket.disconnect();
    };
  }, []);
  
  const handleLogin = (userData) => {
    setUser(userData);
    
    if (!userData.isGuest) {
      localStorage.setItem('user', JSON.stringify(userData));
    }
    
    // Authenticate with server
    if (socket) {
      socket.emit('authenticate', {
        username: userData.username,
        isGuest: userData.isGuest
      });
    }
  };
  
  const handleLogout = () => {
    if (socket) {
      socket.emit('leave-room');
    }
    
    setUser(null);
    localStorage.removeItem('user');
  };
  
  if (isConnecting) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Connecting to server...</p>
      </div>
    );
  }
  
  return (
    <Router>
      <Layout>
        <Routes>
          <Route
            path="/"
            element={
              user ? (
                <GameRooms socket={socket} user={user} onLogout={handleLogout} />
              ) : (
                <Auth onLogin={handleLogin} />
              )
            }
          />
          <Route
            path="/game/:roomId"
            element={
              user ? (
                <Game socket={socket} user={user} onLeave={handleLogout} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App; 