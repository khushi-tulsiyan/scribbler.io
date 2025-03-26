import React, { useState, useEffect } from 'react';
import './WordSelection.css';

const WordSelection = ({ words, onSelectWord, timeLeft, isDrawer }) => {
  const [selectedWord, setSelectedWord] = useState(null);
  const [hints, setHints] = useState({});

  useEffect(() => {
    // Reset selection when words change
    setSelectedWord(null);
    setHints({});
  }, [words]);

  const handleWordSelect = (word) => {
    setSelectedWord(word);
    onSelectWord(word);
  };

  const getHint = (word) => {
    const vowels = word.match(/[aeiou]/g) || [];
    const consonants = word.match(/[bcdfghjklmnpqrstvwxyz]/g) || [];
    
    if (vowels.length > 0) {
      return `Contains the vowel: ${vowels[0]}`;
    } else if (consonants.length > 0) {
      return `Contains the consonant: ${consonants[0]}`;
    }
    return 'No hints available';
  };

  const toggleHint = (word) => {
    setHints(prev => ({
      ...prev,
      [word]: !prev[word]
    }));
  };

  if (!isDrawer) {
    return (
      <div className="word-selection waiting">
        <h2>Waiting for the drawer to select a word...</h2>
        <div className="timer">Time left: {timeLeft}s</div>
      </div>
    );
  }

  return (
    <div className="word-selection">
      <h2>Select a Word to Draw</h2>
      <div className="timer">Time left: {timeLeft}s</div>
      <div className="words-grid">
        {words.map((word) => (
          <div key={word} className="word-card">
            <button
              className={`word-button ${selectedWord === word ? 'selected' : ''}`}
              onClick={() => handleWordSelect(word)}
              disabled={selectedWord !== null}
            >
              {word}
            </button>
            <button
              className="hint-button"
              onClick={() => toggleHint(word)}
              disabled={selectedWord !== null}
            >
              {hints[word] ? 'Hide Hint' : 'Show Hint'}
            </button>
            {hints[word] && (
              <div className="hint-text">
                {getHint(word)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WordSelection; 