import { create } from 'zustand';
import { Card, GameState, Player, GameLogEntry } from '@/constants/game';

type Toast = {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
};

interface GameStore {
  // Connection
  connected: boolean;
  setConnected: (value: boolean) => void;

  // Room
  roomCode: string | null;
  setRoomCode: (code: string | null) => void;

  // Player
  playerName: string;
  setPlayerName: (name: string) => void;
  playerIndex: number | null;
  setPlayerIndex: (index: number | null) => void;

  // Lobby
  lobbyPlayers: string[];
  setLobbyPlayers: (players: string[]) => void;
  isHost: boolean;
  setIsHost: (value: boolean) => void;

  // Game
  gameState: GameState | null;
  setGameState: (state: GameState | null) => void;
  gameStarted: boolean;
  setGameStarted: (started: boolean) => void;

  // Cards (private hand)
  myHand: Card[];
  setMyHand: (cards: Card[]) => void;
  mySets: string[];
  setMySets: (sets: string[]) => void;

  // Players
  players: Player[];
  setPlayers: (players: Player[]) => void;

  // UI Toast
  toast: Toast | null;
  showToast: (message: string, type?: Toast['type']) => void;
  clearToast: () => void;

  // Loading
  loading: boolean;
  setLoading: (value: boolean) => void;
  loadingMessage: string;
  setLoadingMessage: (message: string) => void;

  // Error
  error: string | null;
  setError: (error: string | null) => void;

  // Game Log
  gameLog: GameLogEntry[];
  addLogEntry: (message: string, type?: GameLogEntry['type']) => void;
  clearGameLog: () => void;

  // Voice
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  speakingPlayers: Set<number>;
  setSpeaking: (index: number, speaking: boolean) => void;

  // Reset
  reset: () => void;
  resetForNewGame: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

export const useGameStore = create<GameStore>((set, get) => ({
  connected: false,
  setConnected: (value) => set({ connected: value }),

  roomCode: null,
  setRoomCode: (code) => set({ roomCode: code }),

  playerName: '',
  setPlayerName: (name) => set({ playerName: name }),
  playerIndex: null,
  setPlayerIndex: (index) => set({ playerIndex: index }),

  lobbyPlayers: [],
  setLobbyPlayers: (players) => {
    const currentName = get().playerName;
    const isFirst = players.length > 0 && players[0] === currentName;
    set({ lobbyPlayers: players, isHost: isFirst });
  },
  isHost: false,
  setIsHost: (value) => set({ isHost: value }),

  gameState: null,
  setGameState: (state) => set({ gameState: state }),
  gameStarted: false,
  setGameStarted: (started) => set({ gameStarted: started }),

  myHand: [],
  setMyHand: (cards) => set({ myHand: cards }),
  mySets: [],
  setMySets: (sets) => set({ mySets: sets }),

  players: [],
  setPlayers: (players) => set({ players }),

  toast: null,
  showToast: (message, type = 'info') => {
    const id = generateId();
    set({ toast: { id, message, type } });
    setTimeout(() => {
      const current = get().toast;
      if (current?.id === id) {
        set({ toast: null });
      }
    }, 3000);
  },
  clearToast: () => set({ toast: null }),

  loading: false,
  setLoading: (value) => set({ loading: value }),
  loadingMessage: '',
  setLoadingMessage: (message) => set({ loadingMessage: message }),

  error: null,
  setError: (error) => set({ error }),

  gameLog: [],
  addLogEntry: (message, type = 'info') => {
    const entry: GameLogEntry = {
      id: generateId(),
      message,
      timestamp: Date.now(),
      type,
    };
    set((state) => ({ gameLog: [...state.gameLog.slice(-49), entry] }));
  },
  clearGameLog: () => set({ gameLog: [] }),

  isMuted: false,
  setIsMuted: (muted) => set({ isMuted: muted }),
  speakingPlayers: new Set(),
  setSpeaking: (index, speaking) => {
    const current = new Set(get().speakingPlayers);
    if (speaking) {
      current.add(index);
    } else {
      current.delete(index);
    }
    set({ speakingPlayers: current });
  },

  reset: () => set({
    connected: false,
    roomCode: null,
    playerIndex: null,
    lobbyPlayers: [],
    isHost: false,
    gameState: null,
    gameStarted: false,
    myHand: [],
    mySets: [],
    players: [],
    gameLog: [],
    error: null,
    toast: null,
    isMuted: false,
    speakingPlayers: new Set(),
  }),

  resetForNewGame: () => set({
    gameState: null,
    myHand: [],
    mySets: [],
    players: [],
    gameLog: [],
    error: null,
  }),
}));
