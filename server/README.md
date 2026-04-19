# Al-Hazz Server (لعبة الحزر)

Real-time multiplayer Arabic card game server built with Node.js, Express, and Socket.io.

## Features

- 4-player real-time card game
- Turn-based game with strict validation
- Auto-complete sets when 4 cards of same number collected
- Automatic reconnection handling with 30-second timeout
- In-memory game state (no database required)
- Agora voice chat integration ready

## Tech Stack

- Node.js 18+
- Express
- Socket.io
- CORS enabled

## Game Rules

1. Deal 4 cards to each of 4 players
2. Players with 4 suits of a number complete sets automatically
3. On your turn, pick a target player and number
4. If target has the number, guess count (1-3)
5. If correct, guess the suits
6. If correct, get the cards and continue your turn
7. Wrong guesses = draw card
8. Game ends when all hands empty

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

## Production

```bash
npm start
```

## Deployment (Railway)

1. Push code to GitHub
2. Connect to Railway: `railway link`
3. Deploy: `railway up`
4. Set environment:
   - `PORT` (auto)

## Socket Events

### Client -> Server
- `create_room` { playerName }
- `join_room` { code, playerName }
- `start_game` { code }
- `pick_target` { code, targetIndex }
- `pick_number` { code, number }
- `guess_count` { code, count }
- `guess_suits` { code, suits: string[] }
- `leave_room` { code }

### Server -> Client
- `room_created` { code, players }
- `player_joined` { players, newPlayer }
- `game_started` { drawCount }
- `game_state` { ...publicState }
- `your_hand` { cards, completedSets }
- `ask_result` { hasIt, targetName, number, count }
- `count_result` { correct, actual, guessed }
- `suit_result` { correct, actual, guessed }
- `cards_transferred` { from, to, cards, newSets }
- `turn_changed` { currentPlayer, phase }
- `game_over` { scores, winners }
- `error` { message }
