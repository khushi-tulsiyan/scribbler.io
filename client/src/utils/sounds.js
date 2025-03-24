// Sound effects for various game events
const soundEffects = {
  correctGuess: new Audio('/sounds/correct-guess.mp3'),
  wrongGuess: new Audio('/sounds/wrong-guess.mp3'),
  newRound: new Audio('/sounds/new-round.mp3'),
  timeWarning: new Audio('/sounds/time-warning.mp3'),
  gameEnd: new Audio('/sounds/game-end.mp3'),
  yourTurn: new Audio('/sounds/your-turn.mp3'),
  message: new Audio('/sounds/message.mp3')
};

// Preload all sounds
Object.values(soundEffects).forEach(sound => {
  sound.load();
});

// Set all volumes to 0.5
Object.values(soundEffects).forEach(sound => {
  sound.volume = 0.5;
});

// Method to play a sound
const playSound = (soundName) => {
  // Check if sound exists
  if (!soundEffects[soundName]) {
    console.error(`Sound "${soundName}" doesn't exist`);
    return;
  }
  
  // Stop and reset if already playing
  soundEffects[soundName].pause();
  soundEffects[soundName].currentTime = 0;
  
  // Play the sound
  soundEffects[soundName].play().catch(err => {
    // Browser might block autoplay
    console.warn('Error playing sound:', err);
  });
};

// Method to toggle mute all sounds
const setMuted = (muted) => {
  Object.values(soundEffects).forEach(sound => {
    sound.muted = muted;
  });
};

// Set volume for all sounds (0 to 1)
const setVolume = (volume) => {
  Object.values(soundEffects).forEach(sound => {
    sound.volume = Math.max(0, Math.min(1, volume));
  });
};

export { playSound, setMuted, setVolume }; 