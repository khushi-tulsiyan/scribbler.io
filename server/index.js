const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));

const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  connectTimeout: 10000,
  maxHttpBufferSize: 1e8,
  allowEIO3: true,
  path: '/socket.io/',
  cookie: false
});

// Add error handling for the server
server.on('error', (error) => {
  console.error('Server error:', error);
});

// Game state
const gameRooms = new Map();
const words = {
  animals: ['elephant', 'giraffe', 'lion', 'penguin', 'dolphin', 'kangaroo', 'zebra', 'rhinoceros'],
  food: ['pizza', 'sushi', 'hamburger', 'ice cream', 'spaghetti', 'sandwich', 'taco', 'donut'],
  sports: ['football', 'basketball', 'tennis', 'soccer', 'baseball', 'volleyball', 'hockey', 'rugby'],
  countries: ['france', 'japan', 'brazil', 'australia', 'egypt', 'india', 'canada', 'italy'],
  professions: ['doctor', 'teacher', 'chef', 'artist', 'pilot', 'engineer', 'lawyer', 'firefighter']
};

// Room cleanup interval
setInterval(() => {
  const now = Date.now();
  gameRooms.forEach((room, roomCode) => {
    // Remove empty rooms or rooms that haven't been active for 1 hour
    if (room.players.length === 0 || (room.lastActivity && now - room.lastActivity > 3600000)) {
      console.log(`Cleaning up room: ${roomCode}`);
      gameRooms.delete(roomCode);
    }
  });
}, 300000); // Check every 5 minutes

// Helper functions
const generateRoomCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

const getRandomWords = (category, count = 3) => {
  const categoryWords = words[category] || [];
  const shuffled = [...categoryWords].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

const calculateScore = (timeLeft) => {
  return Math.max(1, Math.floor(timeLeft / 10));
};

// Socket connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Create room
  socket.on('createRoom', async ({ playerName }, callback) => {
    try {
      console.log(`Creating room for player: ${playerName} (${socket.id})`);
      const roomCode = generateRoomCode();
      
      // Check if room code already exists
      if (gameRooms.has(roomCode)) {
        console.log('Room code already exists, retrying...');
        if (callback) callback({ error: 'Failed to create room. Please try again.' });
        return;
      }

      const room = {
        code: roomCode,
        players: [],
        status: 'waiting',
        currentRound: 0,
        maxRounds: 5,
        currentDrawer: null,
        currentWord: null,
        wordOptions: [],
        timeLeft: 60,
        roundStartTime: null,
        messages: [],
        drawingHistory: [],
        categories: Object.keys(words),
        selectedCategory: null,
        lastActivity: Date.now(),
        createdBy: socket.id
      };

      const player = {
        id: socket.id,
        name: playerName,
        score: 0,
        hasGuessed: false,
        isHost: true
      };

      room.players.push(player);
      gameRooms.set(roomCode, room);
      
      // Join the socket room
      await socket.join(roomCode);
      console.log(`Room created: ${roomCode} by ${playerName}`);

      // Emit success events
      socket.emit('roomJoined', { roomCode });
      io.emit('roomsList', Array.from(gameRooms.values()));

      // Send acknowledgment
      if (callback) {
        callback({ success: true, roomCode });
      }
    } catch (error) {
      console.error('Error creating room:', error);
      if (callback) {
        callback({ error: 'Failed to create room. Please try again.' });
      }
    }
  });

  // Get rooms list
  socket.on('getRooms', (callback) => {
    try {
      const roomsList = Array.from(gameRooms.values()).map(room => ({
        code: room.code,
        status: room.status,
        players: room.players,
        currentRound: room.currentRound,
        maxRounds: room.maxRounds
      }));
      socket.emit('roomsList', roomsList);
      if (callback) callback({ success: true, rooms: roomsList });
    } catch (error) {
      console.error('Error getting rooms:', error);
      if (callback) callback({ error: 'Failed to get rooms list.' });
    }
  });

  // Join room
  socket.on('joinRoom', async ({ roomCode, playerName }, callback) => {
    try {
      console.log(`Player ${playerName} attempting to join room ${roomCode}`);
      const room = gameRooms.get(roomCode);
      
      // Quick validation checks
      if (!room) {
        console.log(`Room ${roomCode} not found`);
        if (callback) callback({ error: 'Room not found. Please check the room code.' });
        return;
      }

      if (room.status !== 'waiting') {
        console.log(`Room ${roomCode} is not in waiting state`);
        if (callback) callback({ error: 'Room is already in progress.' });
        return;
      }

      if (room.players.some(p => p.name === playerName)) {
        console.log(`Player ${playerName} is already in room ${roomCode}`);
        if (callback) callback({ error: 'You are already in this room.' });
        return;
      }

      // Create player object
      const player = {
        id: socket.id,
        name: playerName,
        score: 0,
        hasGuessed: false
      };

      // Join socket room first
      await socket.join(roomCode);
      
      // Add player to room
      room.players.push(player);
      
      // Emit events in parallel
      await Promise.all([
        new Promise(resolve => socket.emit('roomJoined', { roomCode }, resolve)),
        new Promise(resolve => io.to(roomCode).emit('gameState', room, resolve)),
        new Promise(resolve => io.emit('roomsList', Array.from(gameRooms.values()), resolve))
      ]);

      console.log(`Player ${playerName} successfully joined room ${roomCode}`);

      // Send acknowledgment
      if (callback) {
        callback({ success: true, roomCode });
      }
    } catch (error) {
      console.error('Error joining room:', error);
      if (callback) {
        callback({ error: 'Failed to join room. Please try again.' });
      }
    }
  });

  // Start game
  socket.on('startGame', ({ roomCode }) => {
    const room = gameRooms.get(roomCode);
    if (!room) return;

    room.status = 'categorySelection';
    io.to(roomCode).emit('gameState', room);
  });

  // Select category
  socket.on('selectCategory', ({ roomCode, category }) => {
    const room = gameRooms.get(roomCode);
    if (!room) return;

    room.selectedCategory = category;
    room.status = 'wordSelection';
    room.wordOptions = getRandomWords(category);
    room.currentDrawer = room.players[room.currentRound % room.players.length];
    io.to(roomCode).emit('gameState', room);
  });

  // Select word
  socket.on('selectWord', ({ roomCode, word }) => {
    const room = gameRooms.get(roomCode);
    if (!room) return;

    room.currentWord = word;
    room.status = 'drawing';
    room.timeLeft = 60;
    room.roundStartTime = Date.now();
    room.drawingHistory = [];
    room.players.forEach(p => p.hasGuessed = false);
    io.to(roomCode).emit('gameState', room);
  });

  // Drawing events
  socket.on('drawStart', ({ roomCode, x, y }) => {
    const room = gameRooms.get(roomCode);
    if (!room || room.status !== 'drawing') return;

    room.drawingHistory.push({ type: 'start', x, y });
    socket.to(roomCode).emit('drawStart', { x, y });
  });

  socket.on('draw', ({ roomCode, x, y }) => {
    const room = gameRooms.get(roomCode);
    if (!room || room.status !== 'drawing') return;

    room.drawingHistory.push({ type: 'draw', x, y });
    socket.to(roomCode).emit('draw', { x, y });
  });

  socket.on('drawEnd', ({ roomCode }) => {
    const room = gameRooms.get(roomCode);
    if (!room || room.status !== 'drawing') return;

    room.drawingHistory.push({ type: 'end' });
    socket.to(roomCode).emit('drawEnd');
  });

  socket.on('clearCanvas', ({ roomCode }) => {
    const room = gameRooms.get(roomCode);
    if (!room || room.status !== 'drawing') return;

    room.drawingHistory.push({ type: 'clear' });
    socket.to(roomCode).emit('clearCanvas');
  });

  // Guess word
  socket.on('guessWord', ({ roomCode, guess }) => {
    const room = gameRooms.get(roomCode);
    if (!room || room.status !== 'drawing') return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player || player.hasGuessed) return;

    const isCorrect = guess.toLowerCase() === room.currentWord.toLowerCase();
    if (isCorrect) {
      player.hasGuessed = true;
      player.score += calculateScore(room.timeLeft);
      room.messages.push({
        type: 'correct',
        player: player.name,
        word: room.currentWord
      });

      // Check if round should end
      if (room.players.filter(p => p.hasGuessed).length === room.players.length - 1) {
        room.status = 'roundSummary';
        room.timeLeft = 0;
      }
    } else {
      room.messages.push({
        type: 'guess',
        player: player.name,
        guess
      });
    }

    io.to(roomCode).emit('gameState', room);
  });

  // Chat message
  socket.on('chatMessage', ({ roomCode, message }) => {
    const room = gameRooms.get(roomCode);
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;

    room.messages.push({
      type: 'chat',
      player: player.name,
      message
    });

    io.to(roomCode).emit('gameState', room);
  });

  // Start next round
  socket.on('startNextRound', ({ roomCode }) => {
    const room = gameRooms.get(roomCode);
    if (!room) return;

    room.currentRound++;
    if (room.currentRound >= room.maxRounds) {
      room.status = 'gameSummary';
    } else {
      room.status = 'wordSelection';
      room.wordOptions = getRandomWords(room.selectedCategory);
      room.currentDrawer = room.players[room.currentRound % room.players.length];
    }

    io.to(roomCode).emit('gameState', room);
  });

  // Disconnect handling
  socket.on('disconnect', () => {
    gameRooms.forEach((room, roomCode) => {
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      if (playerIndex !== -1) {
        room.players.splice(playerIndex, 1);
        if (room.players.length === 0) {
          gameRooms.delete(roomCode);
        } else {
          io.to(roomCode).emit('gameState', room);
        }
      }
    });
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});