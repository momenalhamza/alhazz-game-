// Room manager for لعبة الحزر (Al-Hazz)

const { createGameState, checkInitialSets, removeCompletedSet } = require('./gameLogic');

const rooms = new Map();
const playerToRoom = new Map();

const ROOM_CODE_LENGTH = 6;
const ROOM_LIFETIME_MS = 2 * 60 * 60 * 1000; // 2 hours
const RECONNECT_TIMEOUT_MS = 30 * 1000; // 30 seconds

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding similar-looking chars
  let code = '';
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function getRoom(code) {
  return rooms.get(code);
}

function createRoom(hostName) {
  const code = generateRoomCode();
  const room = {
    code,
    players: [],
    gameState: null,
    gameStarted: false,
    createdAt: Date.now(),
    disconnectedPlayers: new Map(), // socketId -> { name, playerIndex, timeoutId }
  };
  rooms.set(code, room);
  return room;
}

function cleanupRoom(code) {
  const room = rooms.get(code);
  if (room) {
    // Clear any pending reconnect timeouts
    for (const [_, disconnectData] of room.disconnectedPlayers) {
      if (disconnectData.timeoutId) {
        clearTimeout(disconnectData.timeoutId);
      }
    }
    room.disconnectedPlayers.clear();

    // Remove player mappings
    for (const player of room.players) {
      playerToRoom.delete(player.id);
    }

    rooms.delete(code);
    console.log(`Room ${code} cleaned up`);
  }
}

function joinRoom(code, playerName, socketId) {
  const room = rooms.get(code);
  if (!room) {
    return { success: false, error: 'الغرفة غير موجودة' };
  }

  if (room.gameStarted) {
    // Check if this player is reconnecting
    const dcPlayer = room.disconnectedPlayers.get(socketId);
    if (dcPlayer && dcPlayer.name === playerName) {
      // Reconnecting player
      room.disconnectedPlayers.delete(socketId);
      return {
        success: true,
        room,
        reconnected: true,
        playerIndex: dcPlayer.playerIndex,
      };
    }
    return { success: false, error: 'اللعبة قد بدأت بالفعل' };
  }

  if (room.players.length >= 4) {
    return { success: false, error: 'الغرفة ممتلئة' };
  }

  if (room.players.some(p => p.name === playerName)) {
    return { success: false, error: 'هذا الاسم مستخدم بالفعل في الغرفة' };
  }

  room.players.push({
    id: socketId,
    name: playerName,
    ready: false,
    playerIndex: room.players.length,
  });

  playerToRoom.set(socketId, code);

  return { success: true, room, playerIndex: room.players.length - 1 };
}

function leaveRoom(socketId) {
  const code = playerToRoom.get(socketId);
  if (!code) {
    return null;
  }

  const room = rooms.get(code);
  if (!room) {
    playerToRoom.delete(socketId);
    return null;
  }

  const playerIndex = room.players.findIndex(p => p.id === socketId);
  if (playerIndex === -1) {
    playerToRoom.delete(socketId);
    return null;
  }

  const playerName = room.players[playerIndex].name;

  if (room.gameStarted) {
    // Mark player as disconnected, give reconnect time
    room.disconnectedPlayers.set(socketId, {
      name: playerName,
      playerIndex,
      disconnectedAt: Date.now(),
    });

    // Set timeout for auto-cleanup
    const timeoutId = setTimeout(() => {
      if (room.disconnectedPlayers.has(socketId)) {
        room.disconnectedPlayers.delete(socketId);
        // End the game due to disconnection
        room.gameState = null;
        cleanupRoom(code);
      }
    }, RECONNECT_TIMEOUT_MS);

    room.disconnectedPlayers.get(socketId).timeoutId = timeoutId;

    return { code, room, playerName, playerIndex, disconnected: true };
  }

  // Remove player from lobby
  room.players.splice(playerIndex, 1);
  playerToRoom.delete(socketId);

  // Renumber remaining players
  room.players.forEach((p, i) => {
    p.playerIndex = i;
  });

  // Cleanup empty room
  if (room.players.length === 0) {
    cleanupRoom(code);
    return { code, room: null, playerName };
  }

  return { code, room, playerName, disconnected: false };
}

function startGame(code) {
  const room = rooms.get(code);
  if (!room) {
    return { success: false, error: 'الغرفة غير موجودة' };
  }

  if (room.players.length !== 4) {
    return { success: false, error: 'يجب أن يكون هناك 4 لاعبين' };
  }

  if (room.gameStarted) {
    return { success: false, error: 'اللعبة قد بدأت بالفعل' };
  }

  // Initialize game state
  const gameState = createGameState();
  room.gameState = gameState;
  room.gameStarted = true;

  // Assign players to game state
  gameState.players = room.players.map(p => ({
    ...p,
    hand: gameState.hands[p.playerIndex],
    originalIndex: p.playerIndex,
  }));

  // Check for initial sets
  for (let i = 0; i < 4; i++) {
    const sets = checkInitialSets(gameState.hands[i]);
    if (sets.length > 0) {
      for (const number of sets) {
        gameState.completedSets[i].push(number);
        gameState.hands[i] = removeCompletedSet(gameState.hands[i], number);
      }
    }
  }

  // Find first player with cards
  let firstPlayer = 0;
  while (firstPlayer < 4 && gameState.hands[firstPlayer].length === 0) {
    firstPlayer++;
  }
  gameState.currentPlayerIndex = firstPlayer;
  gameState.phase = 'pick_target';

  return { success: true, room, gameState };
}

function reconnectToRoom(code, socketId, playerName) {
  const room = rooms.get(code);
  if (!room) {
    return { success: false, error: 'الغرفة غير موجودة' };
  }

  if (!room.gameStarted) {
    return { success: false, error: 'اللعبة لم تبدأ بعد' };
  }

  // Find disconnected player by name
  for (const [oldSocketId, dcData] of room.disconnectedPlayers) {
    if (dcData.name === playerName) {
      const playerIndex = dcData.playerIndex;

      // Clear reconnect timeout
      if (dcData.timeoutId) {
        clearTimeout(dcData.timeoutId);
      }
      room.disconnectedPlayers.delete(oldSocketId);

      // Update player socket ID
      const player = room.gameState.players.find(p => p.name === playerName);
      if (player) {
        player.id = socketId;
      }

      // Map new socket to room
      playerToRoom.set(socketId, code);

      return { success: true, room, playerIndex, gameState: room.gameState };
    }
  }

  return { success: false, error: 'لم يتم العثور على اللاعب' };
}

// Periodic cleanup of old rooms
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms) {
    if (now - room.createdAt > ROOM_LIFETIME_MS) {
      cleanupRoom(code);
    }
  }
}, 10 * 60 * 1000); // Check every 10 minutes

module.exports = {
  getRoom,
  createRoom,
  joinRoom,
  leaveRoom,
  startGame,
  reconnectToRoom,
  cleanupRoom,
  playerToRoom,
};
