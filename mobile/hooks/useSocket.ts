import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useGameStore } from '@/store/gameStore';
import { SOCKET_URL, GameState, Card } from '@/constants/game';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const store = useGameStore();
  const [socketReady, setSocketReady] = useState(false);

  // Connect only once when component mounts
  useEffect(() => {
    if (socketRef.current?.connected) return;

    console.log('Socket connecting to:', SOCKET_URL);

    const socket = io(SOCKET_URL, {
      transports: ['polling'],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      store.setConnected(true);
      setSocketReady(true);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      store.setConnected(false);
      setSocketReady(false);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket error:', error.message);
      store.setError('فشل الاتصال بالخادم');
    });

    // Room events
    socket.on('room_created', ({ code, players }) => {
      store.setRoomCode(code);
      store.setLobbyPlayers(players);
      store.setIsHost(true);
      store.setLoading(false);
      store.showToast('تم إنشاء الغرفة بنجاح', 'success');
    });

    socket.on('room_joined', ({ code, players }) => {
      store.setRoomCode(code);
      store.setLobbyPlayers(players);
      store.setLoading(false);
    });

    socket.on('player_joined', ({ players, newPlayer }) => {
      store.setLobbyPlayers(players);
      store.addLogEntry(`انضم اللاعب ${newPlayer}`, 'info');
    });

    socket.on('player_left', ({ players }) => {
      store.setLobbyPlayers(players);
      store.addLogEntry('غادر لاعب الغرفة', 'warning');
    });

    socket.on('reconnected', ({ code, playerIndex, gameState }) => {
      store.setRoomCode(code);
      store.setPlayerIndex(playerIndex);
      store.setGameState(gameState);
      store.setLoading(false);
      store.showToast('تم إعادة الاتصال', 'success');
    });

    socket.on('player_rejoined', ({ playerName }) => {
      store.addLogEntry(`عاد اللاعب ${playerName} للعبة`, 'success');
    });

    socket.on('player_disconnected', ({ playerName, message }) => {
      store.addLogEntry(message, 'warning');
    });

    socket.on('kicked', ({ message }) => {
      console.log('Kicked from room:', message);
      store.showToast(message, 'error');
      store.reset();
      // Navigate to home - we use a simple approach
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    });

    // Game events
    socket.on('game_started', (data) => {
      console.log('game_started received!', data);
      store.setLoading(false);
      store.setGameStarted(true);
      store.setGameState(data);
      store.addLogEntry('بدأت اللعبة!', 'success');
    });

    socket.on('game_state', (state: GameState) => {
      store.setGameState(state);
    });

    socket.on('your_hand', ({ cards, completedSets }: { cards: Card[]; completedSets: string[] }) => {
      store.setMyHand(cards);
      store.setMySets(completedSets);
    });

    socket.on('ask_result', ({ hasIt, targetName, number, count }) => {
      if (hasIt) {
        store.showToast(`نعم! ${targetName} يملك ${count} من ${number}`, 'success');
        store.addLogEntry(`${targetName} يملك ${count} من ${number}`, 'info');
      } else {
        store.showToast(`لا ما معي! ${targetName} ليس لديه ${number}`, 'warning');
        store.addLogEntry(`${targetName}: لا ما معي، ${number}`, 'warning');
      }
    });

    socket.on('count_result', ({ correct, actual, guessed }) => {
      if (correct) {
        store.showToast('صحيح! اختر النقشات', 'success');
        store.addLogEntry(`تخمين العدد صحيح (${guessed})`, 'success');
      } else {
        store.showToast(`خطأ! العدد الصحيح ${actual}`, 'error');
        store.addLogEntry(`تخمين خاطئ: ظن أن ${guessed} والصحيح ${actual}`, 'error');
      }
    });

    socket.on('suit_result', ({ correct, actual, guessed }) => {
      if (correct) {
        store.showToast('أحسنت! حصلت على الأوراق', 'success');
        store.addLogEntry('تخمين النقشات صحيح!', 'success');
      } else {
        store.showToast(`النقشات الصحيحة: ${actual?.join(' ')}`, 'error');
        store.addLogEntry(`تخمين الأنقشة خاطئ: ${guessed?.join(', ')}`, 'error');
      }
    });

    socket.on('cards_transferred', ({ from, to, cards, newSets }) => {
      const cardStr = cards.map((c: Card) => `${c.number}${c.suit}`).join(', ');
      store.addLogEntry(`حصل ${to} على ${cards.length} ورقة من ${from}: ${cardStr}`, 'success');
      if (newSets?.length > 0) {
        store.addLogEntry(`جمع ${to} مجموعة جديدة: ${newSets.join('-')}`, 'success');
        store.showToast(`تهانينا! جمعت مجموعة ${newSets[0]}`, 'success');
      }
    });

    socket.on('turn_changed', ({ currentPlayer, phase }) => {
      const playerName = store.players[currentPlayer]?.name || `Player ${currentPlayer + 1}`;
      store.addLogEntry(`دور ${playerName}`, 'info');
    });

    socket.on('game_over', ({ scores, winners, winnerSetCount }) => {
      store.addLogEntry(`انتهت اللعبة! الفائز: ${winners.join(', ')}`, 'success');
      store.showToast(`تهانينا! ${winners.join(', ')}`, 'success');
    });

    socket.on('error', ({ message }) => {
      store.setError(message);
      store.showToast(message, 'error');
      store.setLoading(false);
    });

    // Cleanup on unmount
    return () => {
      console.log('Cleaning up socket...');
      socket.disconnect();
      socketRef.current = null;
      setSocketReady(false);
    };
  }, []); // Only run once on mount

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocketReady(false);
    }
  }, []);

  const emitSafe = useCallback((event: string, data: any) => {
    const socket = socketRef.current;
    if (socket && socket.connected) {
      socket.emit(event, data);
      console.log(`Emitted ${event}:`, data);
      return true;
    } else {
      console.error(`Cannot emit ${event}: socket not connected`);
      store.showToast('غير متصل بالخادم', 'error');
      return false;
    }
  }, [store]);

  const createRoom = useCallback((playerName: string) => {
    console.log('createRoom called with:', playerName);
    store.setLoading(true);
    store.setLoadingMessage('جار إنشاء الغرفة...');
    store.setPlayerName(playerName);
    emitSafe('create_room', { playerName });
  }, [store, emitSafe]);

  const joinRoom = useCallback((code: string, playerName: string) => {
    console.log('joinRoom called with:', code, playerName);
    store.setLoading(true);
    store.setLoadingMessage('جار الانضمام للغرفة...');
    store.setPlayerName(playerName);
    emitSafe('join_room', { code: code.toUpperCase(), playerName });
  }, [store, emitSafe]);

  const leaveRoom = useCallback(() => {
    const code = store.roomCode;
    if (code) {
      emitSafe('leave_room', { code });
    }
    disconnect();
    store.reset();
  }, [store, disconnect, emitSafe]);

  const startGame = useCallback(() => {
    const code = store.roomCode;
    if (code) {
      store.setLoading(true);
      console.log('startGame emitting for room:', code);
      emitSafe('start_game', { code });
    }
  }, [store, emitSafe]);

  const pickTarget = useCallback((targetIndex: number) => {
    const code = store.roomCode;
    if (code) {
      emitSafe('pick_target', { code, targetIndex });
    }
  }, [store, emitSafe]);

  const pickNumber = useCallback((number: string) => {
    const code = store.roomCode;
    if (code) {
      emitSafe('pick_number', { code, number });
    }
  }, [store, emitSafe]);

  const guessCount = useCallback((count: number) => {
    const code = store.roomCode;
    if (code) {
      emitSafe('guess_count', { code, count });
    }
  }, [store, emitSafe]);

  const guessSuits = useCallback((suits: string[]) => {
    const code = store.roomCode;
    if (code) {
      emitSafe('guess_suits', { code, suits });
    }
  }, [store, emitSafe]);

  const sendPing = useCallback(() => {
    emitSafe('ping', {});
  }, [emitSafe]);

  return {
    socket: socketRef.current,
    socketReady,
    connected: store.connected,
    disconnect,
    emitSafe,
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
    pickTarget,
    pickNumber,
    guessCount,
    guessSuits,
    sendPing,
  };
}
