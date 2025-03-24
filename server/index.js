const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const { v4: uuidv4 } = require('uuid');

// Word list for the game
const words = [
  'apple', 'banana', 'castle', 'dragon', 'elephant', 'flower',
  'guitar', 'helicopter', 'island', 'jungle', 'kangaroo', 'lighthouse',
  'mountain', 'notebook', 'octopus', 'penguin', 'queen', 'rainbow',
  'sandwich', 'tiger', 'umbrella', 'volcano', 'waterfall', 'xylophone',
  'yacht', 'zebra'
];

// Game state
const games = {
  default: {
    players: [],
    status: 'waiting',
    currentDrawer: null,
    currentWord: null,
    wordOptions: [],
    timeLeft: 0,
    round: 0,
    maxRounds: 3,
    timer: null,
    correctGuesses: 0
  }
};

// Initialize Express app and Socket.IO
const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Serve static files (if needed)
app.use(express.static('../client/build'));

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // Handle player joining
  socket.on('join-game', ({ playerName }) => {
    const gameId = 'default'; // For simplicity, only one game room
    const player = {
      id: socket.id,
      name: playerName || `Player ${socket.id.substring(0, 5)}`,
      score: 0,
      hasGuessedCorrect: false
    };
    
    // Add player to game
    games[gameId].players.push(player);
    socket.join(gameId);
    
    // Send player info
    socket.emit('player-info', player);
    
    // Send welcome message
    io.to(gameId).emit('new-message', {
      type: 'system',
      content: `${player.name} has joined the game!`
    });
    
    // Update game state for all players
    io.to(gameId).emit('game-state', games[gameId]);
    
    // If we have at least 2 players and game is waiting, start the game
    if (games[gameId].players.length >= 2 && games[gameId].status === 'waiting') {
      startNewRound(gameId);
    }
  });
  
  // Handle drawing data
  socket.on('drawing', (drawingData) => {
    const gameId = 'default';
    const game = games[gameId];
    
    // Only allow current drawer to send drawing data
    if (game.currentDrawer === socket.id && game.status === 'drawing') {
      // Broadcast drawing data to all clients except sender
      socket.to(gameId).emit('drawing-update', drawingData);
    }
  });
  
  // Handle word selection
  socket.on('select-word', (word) => {
    const gameId = 'default';
    const game = games[gameId];
    
    // Only allow current drawer to select word
    if (game.currentDrawer === socket.id && game.status === 'selecting') {
      game.currentWord = word;
      game.status = 'drawing';
      game.timeLeft = 80; // 80 seconds for drawing
      game.wordOptions = [];
      
      // Reset correct guesses
      game.correctGuesses = 0;
      game.players.forEach(player => {
        player.hasGuessedCorrect = false;
      });
      
      // Notify all players that drawing has started
      io.to(gameId).emit('new-message', {
        type: 'system',
        content: `${getPlayerById(gameId, socket.id).name} is now drawing!`
      });
      
      // Update game state
      io.to(gameId).emit('game-state', game);
      
      // Start drawing timer
      clearInterval(game.timer);
      game.timer = setInterval(() => updateGameTimer(gameId), 1000);
    }
  });
  
  // Handle chat messages / guesses
  socket.on('chat-message', (message) => {
    const gameId = 'default';
    const game = games[gameId];
    const player = getPlayerById(gameId, socket.id);
    
    // Skip if player doesn't exist
    if (!player) return;
    
    // If player is the drawer, just send as regular chat
    if (socket.id === game.currentDrawer || game.status !== 'drawing') {
      io.to(gameId).emit('new-message', {
        type: 'chat',
        playerName: player.name,
        content: message
      });
      return;
    }
    
    // Check if message is a correct guess
    if (message.toLowerCase().trim() === game.currentWord.toLowerCase() && !player.hasGuessedCorrect) {
      // Mark player as guessed correctly
      player.hasGuessedCorrect = true;
      
      // Calculate score (more time left = more points)
      const scoreGained = Math.round(20 + (game.timeLeft * 0.5));
      player.score += scoreGained;
      
      // Send correct guess message
      io.to(gameId).emit('new-message', {
        type: 'correct-guess',
        playerName: player.name,
        content: `${player.name} guessed the word correctly! (+${scoreGained} points)`
      });
      
      // Award points to drawer
      if (game.correctGuesses === 0) {
        const drawer = getPlayerById(gameId, game.currentDrawer);
        if (drawer) {
          drawer.score += 10;
        }
      }
      
      // Count correct guesses
      game.correctGuesses++;
      
      // If all players except drawer have guessed correctly, end the round early
      if (game.correctGuesses >= game.players.length - 1) {
        endRound(gameId);
      }
      
      // Update game state
      io.to(gameId).emit('game-state', game);
    } else {
      // Regular chat message (could be wrong guess)
      io.to(gameId).emit('new-message', {
        type: 'chat',
        playerName: player.name,
        content: message
      });
    }
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    const gameId = 'default';
    const game = games[gameId];
    const playerIndex = game.players.findIndex(p => p.id === socket.id);
    
    if (playerIndex !== -1) {
      const player = game.players[playerIndex];
      game.players.splice(playerIndex, 1);
      
      // Send disconnect message
      io.to(gameId).emit('new-message', {
        type: 'system',
        content: `${player.name} has left the game.`
      });
      
      // If the disconnected player was drawing, end the round
      if (game.currentDrawer === socket.id && game.status !== 'waiting') {
        endRound(gameId);
      }
      
      // If not enough players, reset to waiting
      if (game.players.length < 2) {
        game.status = 'waiting';
        game.round = 0;
        clearInterval(game.timer);
      }
      
      // Update game state
      io.to(gameId).emit('game-state', game);
    }
    
    console.log('Client disconnected:', socket.id);
  });
});

// Helper function to get player by ID
function getPlayerById(gameId, playerId) {
  return games[gameId].players.find(p => p.id === playerId);
}

// Start a new round
function startNewRound(gameId) {
  const game = games[gameId];
  
  game.round++;
  
  if (game.round > game.maxRounds) {
    // End game if all rounds completed
    endGame(gameId);
    return;
  }
  
  // Select next drawer
  const drawerIndex = game.players.findIndex(p => p.id === game.currentDrawer);
  const nextDrawerIndex = (drawerIndex + 1) % game.players.length;
  game.currentDrawer = game.players[nextDrawerIndex].id;
  
  // Set up word selection
  game.status = 'selecting';
  game.timeLeft = 15; // 15 seconds to select a word
  game.wordOptions = getRandomWords(3);
  
  // Reset has guessed flag for all players
  game.players.forEach(player => {
    player.hasGuessedCorrect = false;
  });
  
  // Send round start message
  io.to(gameId).emit('new-message', {
    type: 'system',
    content: `Round ${game.round} of ${game.maxRounds} started!`
  });
  
  // Send new game state
  io.to(gameId).emit('game-state', game);
  
  // Start selection timer
  clearInterval(game.timer);
  game.timer = setInterval(() => updateGameTimer(gameId), 1000);
}

// End the current round
function endRound(gameId) {
  const game = games[gameId];
  
  // Clear the timer
  clearInterval(game.timer);
  
  // Reveal the word
  io.to(gameId).emit('new-message', {
    type: 'system',
    content: `The word was: ${game.currentWord}`
  });
  
  // Set round end state
  game.status = 'roundEnd';
  
  // Prepare round summary
  const roundSummary = {
    word: game.currentWord,
    drawer: {
      id: game.currentDrawer,
      name: users[game.currentDrawer]?.name || 'Unknown'
    },
    scores: game.players.map(playerId => ({
      player: {
        id: playerId,
        name: users[playerId]?.name || 'Unknown'
      },
      isDrawer: playerId === game.currentDrawer,
      roundScore: game.scores[playerId].roundScore,
      totalScore: game.scores[playerId].totalScore,
      guessTime: game.scores[playerId].guessTime
    })).sort((a, b) => b.totalScore - a.totalScore),
    roundNumber: game.round,
    totalRounds: game.settings.rounds
  };
  
  // Send round summary
  io.to(gameId).emit('round-summary', roundSummary);
  
  // Update game state
  io.to(gameId).emit('game-state', getGameState(game, null));
}

// End the game
function endGame(gameId) {
  const game = games[gameId];
  
  // Clear the timer
  clearInterval(game.timer);
  
  // Sort players by score
  const sortedPlayers = [...game.players].sort(
    (a, b) => game.scores[b].totalScore - game.scores[a].totalScore
  );
  
  const winner = sortedPlayers[0];
  
  // Send game end message
  io.to(gameId).emit('new-message', {
    type: 'system',
    content: `Game over! Winner: ${users[winner]?.name || 'Unknown'} with ${game.scores[winner].totalScore} points!`
  });
  
  // Prepare game summary
  const gameSummary = {
    finalScores: sortedPlayers.map(playerId => ({
      player: {
        id: playerId,
        name: users[playerId]?.name || 'Unknown'
      },
      score: game.scores[playerId].totalScore
    })),
    winner: {
      id: winner,
      name: users[winner]?.name || 'Unknown',
      score: game.scores[winner].totalScore
    },
    rounds: game.settings.rounds
  };
  
  // Send game summary
  io.to(gameId).emit('game-summary', gameSummary);
  
  // Set game end state
  game.status = 'gameEnd';
  io.to(gameId).emit('game-state', getGameState(game, null));
  
  // Update rooms list for all clients
  io.emit('rooms-updated');
}

// Update game timer
function updateGameTimer(gameId) {
  const game = games[gameId];
  
  if (game.timeLeft > 0) {
    game.timeLeft--;
    io.to(gameId).emit('game-state', getGameState(game, null));
    
    // Notify at certain intervals during drawing
    if (game.status === 'drawing') {
      if (game.timeLeft === 60 || game.timeLeft === 30 || game.timeLeft === 10) {
        io.to(gameId).emit('new-message', {
          type: 'system',
          content: `${game.timeLeft} seconds remaining!`
        });
      }
      
      // Provide automatic hints at specific times if enabled
      if (game.settings.hints) {
        if (game.timeLeft === Math.floor(game.settings.drawTime * 0.6) || 
            game.timeLeft === Math.floor(game.settings.drawTime * 0.3)) {
          provideHintForAll(gameId);
        }
      }
    }
  } else {
    // Time's up
    clearInterval(game.timer);
    
    if (game.status === 'selectingCategory') {
      // If drawer didn't select a category, choose one randomly
      game.selectedCategory = game.categories[Math.floor(Math.random() * game.categories.length)];
      game.status = 'selecting';
      game.timeLeft = 15;
      game.wordOptions = getRandomWords(game, 3);
      
      io.to(gameId).emit('new-message', {
        type: 'system',
        content: `Time's up! A random category was selected: ${game.selectedCategory}`
      });
      
      io.to(gameId).emit('game-state', getGameState(game, null));
      game.timer = setInterval(() => updateGameTimer(gameId), 1000);
    } else if (game.status === 'selecting') {
      // If drawer didn't select a word, choose one randomly
      game.currentWord = game.wordOptions[Math.floor(Math.random() * game.wordOptions.length)];
      game.status = 'drawing';
      game.timeLeft = game.settings.drawTime;
      game.drawingActions = [];
      
      io.to(gameId).emit('new-message', {
        type: 'system',
        content: `Time's up! A random word was selected.`
      });
      
      io.to(gameId).emit('game-state', getGameState(game, null));
      game.timer = setInterval(() => updateGameTimer(gameId), 1000);
    } else if (game.status === 'drawing') {
      // End of drawing time
      io.to(gameId).emit('new-message', {
        type: 'system',
        content: `Time's up!`
      });
      
      endRound(gameId);
    }
  }
}

// Provide a hint to a specific player
function provideHint(gameId, playerId) {
  const game = games[gameId];
  
  // Only provide hint if player hasn't used max hints (2)
  if (game.scores[playerId].hintsUsed >= 2) {
    io.to(playerId).emit('new-message', {
      type: 'system',
      content: `You've used all your hints for this round.`
    });
    return;
  }
  
  game.scores[playerId].hintsUsed++;
  
  // Generate hint (reveal a letter)
  const word = game.currentWord;
  let currentHint = game.scores[playerId].wordHint;
  
  // If no hint yet, create initial hint with all blank spaces
  if (!currentHint) {
    currentHint = word.replace(/[a-zA-Z]/g, '_');
  }
  
  // Find positions of unrevealed letters
  const hiddenIndices = [];
  for (let i = 0; i < word.length; i++) {
    if (currentHint[i] === '_' && /[a-zA-Z]/.test(word[i])) {
      hiddenIndices.push(i);
    }
  }
  
  // Reveal a random letter
  if (hiddenIndices.length > 0) {
    const randomIndex = hiddenIndices[Math.floor(Math.random() * hiddenIndices.length)];
    const hintArray = currentHint.split('');
    hintArray[randomIndex] = word[randomIndex];
    currentHint = hintArray.join('');
    game.scores[playerId].wordHint = currentHint;
    
    // Send hint to player
    io.to(playerId).emit('word-hint', {
      hint: currentHint
    });
    
    io.to(playerId).emit('new-message', {
      type: 'system',
      content: `Hint: ${currentHint.split('').join(' ')}`
    });
  } else {
    // No more letters to reveal
    io.to(playerId).emit('new-message', {
      type: 'system',
      content: `No more hints available.`
    });
  }
}

// Provide hint to all players except drawer
function provideHintForAll(gameId) {
  const game = games[gameId];
  
  // For each player except drawer
  game.players.forEach(playerId => {
    if (playerId !== game.currentDrawer && !game.scores[playerId].hasGuessedCorrect) {
      provideHint(gameId, playerId);
    }
  });
}

// Get random words for selection
function getRandomWords(game, count) {
  const selectedWords = [];
  
  // Determine word source
  let wordSource;
  
  // First, try custom words if available
  if (game.settings.customWords && game.settings.customWords.trim() !== '') {
    const customWordList = game.settings.customWords
      .split('\n')
      .map(word => word.trim())
      .filter(word => word.length > 0);
      
    if (customWordList.length >= count) {
      wordSource = customWordList;
    }
  }
  
  // If no custom words, use the selected category from word lists
  if (!wordSource) {
    wordSource = wordLists[game.settings.language][game.selectedCategory];
  }
  
  // Fallback to English mixed category if needed
  if (!wordSource || wordSource.length < count) {
    wordSource = wordLists.english.mixed;
  }
  
  // Select random words
  const wordsCopy = [...wordSource];
  
  for (let i = 0; i < count; i++) {
    if (wordsCopy.length === 0) break;
    
    const randomIndex = Math.floor(Math.random() * wordsCopy.length);
    selectedWords.push(wordsCopy[randomIndex]);
    wordsCopy.splice(randomIndex, 1);
  }
  
  return selectedWords;
}

// Get game state for a specific player
function getGameState(game, playerId) {
  // Base game state (shared by all players)
  const gameState = {
    id: game.id,
    name: game.name,
    status: game.status,
    players: game.players.map(id => ({
      id,
      name: users[id]?.name || 'Unknown',
      score: game.scores[id].totalScore,
      roundScore: game.scores[id].roundScore,
      hasGuessedCorrect: game.scores[id].hasGuessedCorrect,
      isReady: game.scores[id].isReady
    })),
    currentDrawer: game.currentDrawer,
    round: game.round,
    maxRounds: game.settings.rounds,
    timeLeft: game.timeLeft,
    categories: game.categories,
    selectedCategory: game.selectedCategory,
    settings: game.settings
  };
  
  // Add player-specific information
  if (playerId) {
    // If player is drawer, add word options
    if (playerId === game.currentDrawer && game.status === 'selecting') {
      gameState.wordOptions = game.wordOptions;
    }
    
    // If player is drawer or has guessed correctly, show the word
    if (playerId === game.currentDrawer || 
        (game.scores[playerId] && game.scores[playerId].hasGuessedCorrect)) {
      gameState.currentWord = game.currentWord;
    } else if (game.status === 'drawing' && game.currentWord) {
      // For other players, show word hint if available
      if (game.scores[playerId] && game.scores[playerId].wordHint) {
        gameState.wordHint = game.scores[playerId].wordHint;
      } else {
        // Otherwise show blanks for letters
        gameState.wordHint = game.currentWord.replace(/[a-zA-Z]/g, '_');
      }
    }
    
    // Add drawing actions history for late joiners
    if (game.status === 'drawing' && playerId !== game.currentDrawer) {
      gameState.drawingActions = game.drawingActions;
    }
  }
  
  return gameState;
}

// Start the server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 