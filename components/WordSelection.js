import React, { useState, useEffect } from 'react';
import './WordSelection.css';

const WordSelection = ({ isSelecting, words, onSelectWord, timeLeft }) => {
  const [selectedIndex, setSelectedIndex] = useState(null);
  
  useEffect(() => {
    if (!isSelecting) {
      setSelectedIndex(null);
    }
  }, [isSelecting]);
  
  if (!isSelecting || !words || words.length === 0) {
    return null;
  }
  
  const handleSelectWord = (index) => {
    setSelectedIndex(index);
    onSelectWord(words[index]);
  };
  
  return (
    <div className="word-selection">
      <h3>Choose a word to draw</h3>
      <div className="timer">Time to choose: {timeLeft}s</div>
      <div className="word-options">
        {words.map((word, index) => (
          <button
            key={index}
            className={selectedIndex === index ? 'selected' : ''}
            onClick={() => handleSelectWord(index)}
            disabled={selectedIndex !== null}
          >
            {word}
          </button>
        ))}
      </div>
    </div>
  );
};

export default WordSelection; 