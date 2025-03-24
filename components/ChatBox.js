import React, { useState, useRef, useEffect } from 'react';
import './ChatBox.css';

const ChatBox = ({ messages, onSendMessage, currentPlayer, currentWord, isDrawing }) => {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() === '') return;
    
    onSendMessage(message);
    setMessage('');
  };
  
  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  return (
    <div className="chat-box">
      <div className="messages">
        {messages.map((msg, index) => {
          let messageClass = 'message';
          
          // Add special styling for system messages and correct guesses
          if (msg.type === 'system') {
            messageClass += ' system';
          } else if (msg.type === 'correct-guess') {
            messageClass += ' correct-guess';
          }
          
          return (
            <div key={index} className={messageClass}>
              {msg.type !== 'system' && (
                <span className="player-name">{msg.playerName}: </span>
              )}
              <span className="message-content">{msg.content}</span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSubmit} className="message-form">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={isDrawing ? "You're drawing..." : "Type your guess here..."}
          disabled={isDrawing}
        />
        <button type="submit" disabled={isDrawing}>Send</button>
      </form>
    </div>
  );
};

export default ChatBox;