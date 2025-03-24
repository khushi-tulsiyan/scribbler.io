import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './GameRooms.css';

const GameRooms = ({ socket }) => {
  const [rooms, setRooms] = useState([]);
  const [newRoomName, setNewRoomName] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!socket) return;
    
    // Request rooms list
    socket.emit('get-rooms');
    
    // Listen for rooms list
    socket.on('rooms-list', (roomsList) => {
      setRooms(roomsList);
      setIsLoading(false);
    });
    
    // Clean up
    return () => {
      socket.off('rooms-list');
    };
  }, [socket]);
  
  const handleCreateRoom = (e) => {
    e.preventDefault();
    
    if (!newRoomName.trim() || !playerName.trim()) return;
    
    socket.emit('create-room', {
      roomName: newRoomName,
      playerName
    });
    
    localStorage.setItem('playerName', playerName);
    navigate(`/game/${encodeURIComponent(newRoomName)}`);
  };
  
  const handleJoinRoom = (roomId) => {
    if (!playerName.trim()) {
      alert('Please enter your player name');
      return;
    }
    
    localStorage.setItem('playerName', playerName);
    navigate(`/game/${encodeURIComponent(roomId)}`);
  };
  
  return (
    <div className="game-rooms-container">
      <h1>Draw and Guess Game Rooms</h1>
      
      <div className="player-name-input">
        <input
          type="text"
          placeholder="Your name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          required
        />
      </div>
      
      <div className="rooms-list-container">
        <h2>Available Rooms</h2>
        {isLoading ? (
          <div className="loading">Loading rooms...</div>
        ) : rooms.length > 0 ? (
          <div className="rooms-list">
            {rooms.map((room) => (
              <div key={room.id} className="room-card">
                <div className="room-info">
                  <h3>{room.name}</h3>
                  <div className="room-status">
                    <span className="players-count">
                      Players: {room.playerCount}/{room.maxPlayers}
                    </span>
                    <span className={`room-state ${room.status}`}>
                      {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleJoinRoom(room.id)}
                  disabled={room.playerCount >= room.maxPlayers}
                >
                  {room.playerCount >= room.maxPlayers ? 'Full' : 'Join'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-rooms">No rooms available. Create one!</div>
        )}
      </div>
      
      <div className="create-room-container">
        <h2>Create New Room</h2>
        <form onSubmit={handleCreateRoom}>
          <input
            type="text"
            placeholder="Room name"
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
            required
          />
          <button type="submit">Create Room</button>
        </form>
      </div>
    </div>
  );
};

export default GameRooms; 