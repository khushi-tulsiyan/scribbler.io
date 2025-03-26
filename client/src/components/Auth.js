import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

const Auth = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username.trim()) return;

    const userData = {
      username: username.trim(),
      isGuest: true
    };

    onLogin(userData);

    if (isCreating) {
      // Create new room
      navigate('/game/new');
    } else if (roomCode.trim()) {
      // Join existing room
      navigate(`/game/${roomCode.trim()}`);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Welcome to Skribbler!</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Your Name</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="roomCode">Room Code (Optional)</label>
            <input
              type="text"
              id="roomCode"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              placeholder="Enter room code to join"
              disabled={isCreating}
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              className={`toggle-btn ${!isCreating ? 'active' : ''}`}
              onClick={() => setIsCreating(false)}
            >
              Join Room
            </button>
            <button
              type="button"
              className={`toggle-btn ${isCreating ? 'active' : ''}`}
              onClick={() => setIsCreating(true)}
            >
              Create Room
            </button>
          </div>

          <button type="submit" className="submit-btn">
            {isCreating ? 'Create Room' : 'Join Room'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Auth; 