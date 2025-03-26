import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './GameRooms.css';

const GameRooms = ({ socket, player, onLogout }) => {
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!socket) return;

    // Initial rooms fetch
    const fetchRooms = () => {
      if (!socket.connected) {
        console.log('Socket not connected, attempting to reconnect...');
        socket.connect();
        return;
      }

      socket.emit('getRooms', (response) => {
        if (response.error) {
          console.error('Error fetching rooms:', response.error);
          setError(response.error);
        }
      });
    };

    // Socket event listeners
    const handleRoomsList = (roomsList) => {
      console.log('Received rooms list:', roomsList);
      setRooms(roomsList);
    };

    const handleRoomJoined = ({ roomCode }) => {
      console.log('Room joined:', roomCode);
      setIsLoading(false);
      setError(null);
      navigate(`/game/${roomCode}`);
    };

    const handleError = (error) => {
      console.error('Socket error:', error);
      setIsLoading(false);
      setError(error.message || 'An error occurred. Please try again.');
    };

    // Set up socket listeners
    socket.on('roomsList', handleRoomsList);
    socket.on('roomJoined', handleRoomJoined);
    socket.on('error', handleError);

    // Initial fetch
    fetchRooms();

    // Set up periodic room list updates
    const roomsInterval = setInterval(fetchRooms, 5000);

    // Cleanup listeners and interval
    return () => {
      socket.off('roomsList', handleRoomsList);
      socket.off('roomJoined', handleRoomJoined);
      socket.off('error', handleError);
      clearInterval(roomsInterval);
    };
  }, [socket, navigate]);

  const handleCreateRoom = () => {
    if (!socket || !socket.connected) {
      setError('Not connected to server. Please refresh the page.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setLoadingMessage('Creating new room...');
    
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
      setError('Room creation timed out. Please try again.');
    }, 5000);

    socket.emit('createRoom', { playerName: player.username }, (response) => {
      clearTimeout(timeoutId);
      
      if (response.error) {
        console.error('Room creation error:', response.error);
        setError(response.error);
        setIsLoading(false);
      } else if (!response.success) {
        console.error('Room creation failed');
        setError('Failed to create room. Please try again.');
        setIsLoading(false);
      }
      // Note: Don't set loading to false on success - wait for roomJoined event
    });
  };

  const handleJoinRoom = () => {
    if (!selectedRoom || !socket || !socket.connected) {
      setError('Not connected to server. Please refresh the page.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setLoadingMessage('Joining room...');
    
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
      setError('Failed to join room. Please try again.');
    }, 5000);

    socket.emit('joinRoom', {
      roomCode: selectedRoom,
      playerName: player.username
    }, (response) => {
      clearTimeout(timeoutId);
      
      if (response.error) {
        console.error('Room join error:', response.error);
        setError(response.error);
        setIsLoading(false);
      } else if (!response.success) {
        console.error('Room join failed');
        setError('Failed to join room. Please try again.');
        setIsLoading(false);
      }
      // Note: Don't set loading to false on success - wait for roomJoined event
    });
  };

  if (isLoading) {
    return (
      <div className="loading-overlay">
        <div className="loading-content">
          <div className="spinner"></div>
          <p>{loadingMessage}</p>
          {error && <p className="error-message">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="game-rooms">
      <div className="rooms-header">
        <h2>Game Rooms</h2>
        <div className="player-info">
          <span>Playing as: {player.username}</span>
          <button onClick={onLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="rooms-list">
        {rooms.length === 0 ? (
          <div className="no-rooms">
            <p>No rooms available. Create one to start playing!</p>
          </div>
        ) : (
          rooms.map((room) => (
            <div
              key={room.code}
              className={`room-card ${selectedRoom === room.code ? 'selected' : ''}`}
              onClick={() => setSelectedRoom(room.code)}
            >
              <div className="room-header">
                <h3>Room {room.code}</h3>
                <span className={`room-status ${room.status}`}>
                  {room.status}
                </span>
              </div>
              <div className="room-players">
                {room.players.map((player) => (
                  <span key={player.id} className="player-tag">
                    {player.name}
                    {player.isHost && ' 👑'}
                  </span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="room-actions">
        <button
          className="create-room-btn"
          onClick={handleCreateRoom}
          disabled={isLoading}
        >
          Create New Room
        </button>
        <button
          className="join-room-btn"
          onClick={handleJoinRoom}
          disabled={!selectedRoom || isLoading}
        >
          Join Selected Room
        </button>
      </div>
    </div>
  );
};

export default GameRooms; 