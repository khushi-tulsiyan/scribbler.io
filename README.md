# Skribbler - Real-time Drawing Game

A multiplayer drawing and guessing game where players take turns drawing words while others try to guess them. Built with React, Node.js, and Socket.IO.

## Features

- 🎨 Real-time drawing with multiple colors and brush sizes
- 👥 Multiplayer rooms with up to 8 players
- 🎯 Word categories: Animals, Food, Sports, Countries, and Professions
- 💬 In-game chat system
- 🏆 Score tracking and leaderboards
- 🔄 Drawing replay functionality
- 🎮 Responsive design for all devices
- 🔍 Word hint system
- 🎲 Multiple rounds with different drawers

## Tech Stack

### Frontend
- React.js
- Socket.IO Client
- CSS3 with Flexbox and Grid
- Canvas API for drawing

### Backend
- Node.js
- Express.js
- Socket.IO
- JavaScript (ES6+)

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/skribbler.git
cd skribbler
```

2. Install server dependencies:
```bash
cd server
npm install
```

3. Install client dependencies:
```bash
cd ../client
npm install
```

## Running the Application

1. Start the server:
```bash
cd server
npm start
```
The server will run on http://localhost:3001

2. Start the client (in a new terminal):
```bash
cd client
npm start
```
The client will run on http://localhost:3000

## How to Play

1. Enter your username and create a new room or join an existing one
2. Wait for the host to start the game
3. Each round:
   - A player is selected to draw
   - They choose a category and word
   - They draw the word while others guess
   - Points are awarded for correct guesses
4. After multiple rounds, the player with the most points wins!

## Game Rules

- Each round lasts 60 seconds
- Players can only guess once per word
- Points are awarded based on how quickly players guess correctly
- The drawer cannot guess their own word
- Players take turns being the drawer
- The game ends after all players have had a chance to draw

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by popular drawing games like Pictionary and Skribbl.io
- Built with modern web technologies for real-time interaction
- Special thanks to all contributors and players!

## Support

For support, please open an issue in the GitHub repository or contact the maintainers.
