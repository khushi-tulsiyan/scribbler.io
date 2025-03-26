import React, { useState, useRef, useEffect } from 'react';
import './ChatBox.css';

const ChatBox = ({ messages, onSendMessage, currentPlayer, currentWord, isDrawing }) => {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    onSendMessage(message);
    setMessage('');
  };

  return (
    <div className="chat-box">
      <div className="messages">
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`message ${msg.type} ${msg.playerId === currentPlayer?.id ? 'own' : ''}`}
          >
            {msg.type === 'system' ? (
              <span className="system-message">{msg.content}</span>
            ) : msg.type === 'correct-guess' ? (
              <span className="correct-guess">{msg.playerName} guessed correctly!</span>
            ) : (
              <>
                <span className="player-name">{msg.playerName}:</span>
                <span className="message-content">{msg.content}</span>
              </>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="message-input">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={isDrawing ? "You're drawing!" : "Type your guess here..."}
          disabled={isDrawing || !currentWord}
        />
        <button type="submit" disabled={isDrawing || !currentWord}>
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatBox; 