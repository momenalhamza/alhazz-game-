const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const {
  createRoom,
  joinRoom,
  leaveRoom,
  startGame,
  reconnectToRoom,
  getRoom,
  playerToRoom,
} = require('./roomManager');

const {
  validatePickNumber,
  validateGuessCount,
  validateGuessSuits,
  getPublicGameState,
  hasCardsOfNumber,
  countCardsOfNumber,
  transferCards,
  findNextActivePlayerIndex,
  checkGameOver,
  checkCompletedSets,
  removeCompletedSet,
  getWinner,
  SUITS,
} = require('./gameLogic');

const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['polling', 'websocket'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
});

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

// Health check endpoint
app.get('/ping', (req, res) => res.json({ ok: true }));

// Helper to emit game state to all players in a room
function emitGameState(io, room) {
  if (!room || !room.gameState) return;

  const publicState = getPublicGameState(room.gameState);

  // Emit public state to all players
  io.to(room.code).emit('game_state', publicState);

  // Emit private hands to each player
  room.gameState.players.forEach((player, index) => {
    const socket = io.sockets.sockets.get(player.id);
    if (socket) {
      socket.emit('your_hand', {
        cards: room.gameState.hands[index],
        completedSets: room.gameState.completedSets[index],
      });
    }
  });
}

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  // Create a new room
  socket.on('create_room', ({ playerName }) => {
    try {
      const room = createRoom(playerName);
      const result = joinRoom(room.code, playerName, socket.id);

      if (result.success) {
        socket.join(room.code);
        socket.emit('room_created', {
          code: room.code,
          players: room.players.map(p => p.name),
        });
        console.log(`Room ${room.code} created by ${playerName}`);
      }
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Join an existing room
  socket.on('join_room', ({ code, playerName }) => {
    try {
      const result = joinRoom(code, playerName, socket.id);

      if (result.success) {
        if (result.reconnected) {
          // Reconnecting to ongoing game
          socket.join(code);
          socket.emit('reconnected', {
            code,
            playerIndex: result.playerIndex,
            gameState: getPublicGameState(result.room.gameState),
          });
          emitGameState(io, result.room);
          io.to(code).emit('player_rejoined', { playerName });
        } else {
          // Normal join
          socket.join(code);
          const playersList = result.room.players.map(p => p.name);
          socket.emit('room_joined', {
            code,
            players: playersList,
          });
          // Emit to ALL players in room INCLUDING the new player
          io.to(code).emit('player_joined', {
            players: playersList,
            newPlayer: playerName,
          });
        }
        console.log(`${playerName} joined room ${code}`);
      } else {
        socket.emit('error', { message: result.error });
      }
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Start the game
  socket.on('start_game', ({ code }) => {
    try {
      const room = getRoom(code);
      if (!room) {
        socket.emit('error', { message: 'الغرفة غير موجودة' });
        return;
      }

      // Check if requester is the host (first player)
      const player = room.players.find(p => p.id === socket.id);
      if (!player || player.playerIndex !== 0) {
        socket.emit('error', { message: 'فقط صاحب الغرفة يمكنه بدء اللعبة' });
        return;
      }

      const result = startGame(code);
      if (result.success) {
        io.to(code).emit('game_started', {
          drawCount: room.gameState.drawPile.length,
        });
        emitGameState(io, room);
        console.log(`Game started in room ${code}`);
      } else {
        socket.emit('error', { message: result.error });
      }
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Pick target player for asking
  socket.on('pick_target', ({ code, targetIndex }) => {
    try {
      const room = getRoom(code);
      if (!room || !room.gameState) return;

      const state = room.gameState;
      const playerIndex = state.players.findIndex(p => p.id === socket.id);

      if (playerIndex !== state.currentPlayerIndex) {
        socket.emit('error', { message: 'ليس دورك' });
        return;
      }

      if (targetIndex === playerIndex) {
        socket.emit('error', { message: 'لا يمكنك اختيار نفسك' });
        return;
      }

      if (state.hands[targetIndex].length === 0) {
        socket.emit('error', { message: 'هذا اللاعب ليس لديه أوراق' });
        return;
      }

      state.turn.targetIndex = targetIndex;
      state.phase = 'pick_number';

      emitGameState(io, room);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Pick number to ask for
  socket.on('pick_number', ({ code, number }) => {
    try {
      const room = getRoom(code);
      if (!room || !room.gameState) return;

      const state = room.gameState;
      const playerIndex = state.players.findIndex(p => p.id === socket.id);

      const validation = validatePickNumber(state, playerIndex, number);
      if (!validation.valid) {
        socket.emit('error', { message: validation.error });
        return;
      }

      const targetIndex = state.turn.targetIndex;
      const targetPlayer = state.players[targetIndex];
      const targetCards = state.hands[targetIndex].filter(c => c.number === number);
      const cardCount = targetCards.length;

      state.turn.number = number;

      if (cardCount === 0) {
        // Target doesn't have the card
        io.to(code).emit('ask_result', {
          hasIt: false,
          targetName: targetPlayer.name,
          number,
        });

        // Current player draws
        if (state.drawPile.length > 0) {
          const drawnCard = state.drawPile.pop();
          state.hands[playerIndex].push(drawnCard);

          // Check for completed sets after drawing
          const sets = checkCompletedSets(state.hands[playerIndex]);
          for (const setNumber of sets) {
            state.completedSets[playerIndex].push(setNumber);
            state.hands[playerIndex] = removeCompletedSet(state.hands[playerIndex], setNumber);
          }
        }

        // Move to next player
        const nextPlayer = findNextActivePlayerIndex(state, playerIndex);
        if (nextPlayer !== -1) {
          state.currentPlayerIndex = nextPlayer;
          state.phase = 'pick_target';
          state.turn = { targetIndex: null, number: null, targetCards: null, guessedCount: null };
          io.to(code).emit('turn_changed', { currentPlayer: nextPlayer, phase: 'pick_target' });
        }
      } else {
        // Target has cards
        state.turn.targetCards = targetCards;
        state.turn.guessedCount = null;
        state.phase = 'guess_count';

        io.to(code).emit('ask_result', {
          hasIt: true,
          targetName: targetPlayer.name,
          number,
          count: cardCount,
        });
      }

      emitGameState(io, room);

      // Check game over
      if (checkGameOver(state)) {
        const { winners, maxSets } = getWinner(state);
        io.to(code).emit('game_over', {
          scores: state.completedSets.map((sets, i) => ({
            name: state.players[i]?.name || `Player ${i + 1}`,
            sets: sets.length,
            setNumbers: sets,
          })),
          winners: winners.map(i => state.players[i]?.name || `Player ${i + 1}`),
          winnerSetCount: maxSets,
        });
        room.gameState.gameOver = true;
      }
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Guess count of cards
  socket.on('guess_count', ({ code, count }) => {
    try {
      const room = getRoom(code);
      if (!room || !room.gameState) return;

      const state = room.gameState;
      const playerIndex = state.players.findIndex(p => p.id === socket.id);

      const validation = validateGuessCount(state, playerIndex, count);
      if (!validation.valid) {
        socket.emit('error', { message: validation.error });
        return;
      }

      const targetIndex = state.turn.targetIndex;
      const targetPlayer = state.players[targetIndex];
      const actualCount = countCardsOfNumber(state.hands[targetIndex], state.turn.number);

      if (count !== actualCount) {
        // Wrong guess, draw and end turn
        io.to(code).emit('count_result', {
          correct: false,
          actual: actualCount,
          guessed: count,
        });

        if (state.drawPile.length > 0) {
          const drawnCard = state.drawPile.pop();
          state.hands[playerIndex].push(drawnCard);

          const sets = checkCompletedSets(state.hands[playerIndex]);
          for (const setNumber of sets) {
            state.completedSets[playerIndex].push(setNumber);
            state.hands[playerIndex] = removeCompletedSet(state.hands[playerIndex], setNumber);
          }
        }

        const nextPlayer = findNextActivePlayerIndex(state, playerIndex);
        if (nextPlayer !== -1) {
          state.currentPlayerIndex = nextPlayer;
          state.phase = 'pick_target';
          state.turn = { targetIndex: null, number: null, targetCards: null, guessedCount: null };
          io.to(code).emit('turn_changed', { currentPlayer: nextPlayer, phase: 'pick_target' });
        }
      } else {
        // Correct guess
        state.turn.guessedCount = count;
        state.phase = 'guess_suits';

        io.to(code).emit('count_result', {
          correct: true,
          guessed: count,
        });
      }

      emitGameState(io, room);

      if (checkGameOver(state)) {
        const { winners, maxSets } = getWinner(state);
        io.to(code).emit('game_over', {
          scores: state.completedSets.map((sets, i) => ({
            name: state.players[i]?.name || `Player ${i + 1}`,
            sets: sets.length,
            setNumbers: sets,
          })),
          winners: winners.map(i => state.players[i]?.name || `Player ${i + 1}`),
          winnerSetCount: maxSets,
        });
        room.gameState.gameOver = true;
      }
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Guess suits
  socket.on('guess_suits', ({ code, suits }) => {
    try {
      const room = getRoom(code);
      if (!room || !room.gameState) return;

      const state = room.gameState;
      const playerIndex = state.players.findIndex(p => p.id === socket.id);

      const validation = validateGuessSuits(state, playerIndex, suits);
      if (!validation.valid) {
        socket.emit('error', { message: validation.error });
        return;
      }

      const targetIndex = state.turn.targetIndex;
      const targetPlayer = state.players[targetIndex];
      const targetCards = getCardsByNumber(state.hands[targetIndex], state.turn.number);
      const actualSuits = targetCards.map(c => c.suit);

      const suitsMatch = suits.every(s => actualSuits.includes(s)) && suits.length === actualSuits.length;

      if (!suitsMatch) {
        // Wrong suits guess
        io.to(code).emit('suit_result', {
          correct: false,
          actual: actualSuits,
          guessed: suits,
        });

        if (state.drawPile.length > 0) {
          const drawnCard = state.drawPile.pop();
          state.hands[playerIndex].push(drawnCard);

          const sets = checkCompletedSets(state.hands[playerIndex]);
          for (const setNumber of sets) {
            state.completedSets[playerIndex].push(setNumber);
            state.hands[playerIndex] = removeCompletedSet(state.hands[playerIndex], setNumber);
          }
        }

        const nextPlayer = findNextActivePlayerIndex(state, playerIndex);
        if (nextPlayer !== -1) {
          state.currentPlayerIndex = nextPlayer;
          state.phase = 'pick_target';
          state.turn = { targetIndex: null, number: null, targetCards: null, guessedCount: null };
          io.to(code).emit('turn_changed', { currentPlayer: nextPlayer, phase: 'pick_target' });
        }
      } else {
        // Correct suits - transfer cards
        const { cards, fromHand, toHand } = transferCards(
          state.hands[targetIndex],
          state.hands[playerIndex],
          state.turn.number
        );

        state.hands[targetIndex] = fromHand;
        state.hands[playerIndex] = toHand;

        // Check for completed sets
        const newSets = checkCompletedSets(state.hands[playerIndex]);
        for (const setNumber of newSets) {
          if (!state.completedSets[playerIndex].includes(setNumber)) {
            state.completedSets[playerIndex].push(setNumber);
            state.hands[playerIndex] = removeCompletedSet(state.hands[playerIndex], setNumber);
          }
        }

        io.to(code).emit('cards_transferred', {
          from: targetPlayer.name,
          to: state.players[playerIndex].name,
          cards,
          newSets,
        });

        // Player continues their turn
        state.phase = 'pick_target';
        state.turn = { targetIndex: null, number: null, targetCards: null, guessedCount: null };
        io.to(code).emit('turn_changed', { currentPlayer: playerIndex, phase: 'pick_target' });
      }

      emitGameState(io, room);

      if (checkGameOver(state)) {
        const { winners, maxSets } = getWinner(state);
        io.to(code).emit('game_over', {
          scores: state.completedSets.map((sets, i) => ({
            name: state.players[i]?.name || `Player ${i + 1}`,
            sets: sets.length,
            setNumbers: sets,
          })),
          winners: winners.map(i => state.players[i]?.name || `Player ${i + 1}`),
          winnerSetCount: maxSets,
        });
        room.gameState.gameOver = true;
      }
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Leave room
  socket.on('leave_room', ({ code }) => {
    try {
      const result = leaveRoom(socket.id);
      if (result) {
        socket.leave(code);
        if (result.disconnected && result.room) {
          // Player disconnected mid-game
          io.to(code).emit('player_disconnected', {
            playerName: result.playerName,
            message: `اللاعب ${result.playerName} انقطع الاتصال`,
          });
        } else if (result.room) {
          // Normal leave
          io.to(code).emit('player_left', {
            players: result.room.players.map(p => p.name),
          });
        }
      }
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Kick player (host only)
  socket.on('kick_player', ({ code, playerName }) => {
    try {
      const room = getRoom(code);
      if (!room) {
        socket.emit('error', { message: 'الغرفة غير موجودة' });
        return;
      }

      // Check if requester is the host (first player)
      const requester = room.players.find(p => p.id === socket.id);
      if (!requester || requester.playerIndex !== 0) {
        socket.emit('error', { message: 'فقط صاحب الغرفة يمكنه طرد اللاعبين' });
        return;
      }

      // Find the player to kick
      const playerToKick = room.players.find(p => p.name === playerName);
      if (!playerToKick) {
        socket.emit('error', { message: 'اللاعب غير موجود' });
        return;
      }

      // Emit kicked event to the player
      const targetSocket = io.sockets.sockets.get(playerToKick.id);
      if (targetSocket) {
        targetSocket.emit('kicked', { message: 'تم طردك من الغرفة' });
        targetSocket.leave(code);
      }

      // Remove player from room
      room.players = room.players.filter(p => p.name !== playerName);
      playerToRoom.delete(playerToKick.id);

      // Renumber remaining players
      room.players.forEach((p, i) => {
        p.playerIndex = i;
      });

      // Notify remaining players
      io.to(code).emit('player_left', {
        players: room.players.map(p => p.name),
      });

      console.log(`Player ${playerName} kicked from room ${code}`);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    const result = leaveRoom(socket.id);
    if (result && result.disconnected) {
      const { code, room, playerName } = result;
      if (room) {
        io.to(code).emit('player_disconnected', {
          playerName,
          message: `اللاعب ${playerName} انقطع الاتصال`,
        });
      }
    }
  });
});

function getCardsByNumber(hand, number) {
  return hand.filter(card => card.number === number);
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Al-Hazz server running on port ${PORT}`);
});
