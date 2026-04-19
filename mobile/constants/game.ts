// Game constants for لعبة الحزر
export const SUITS = ['♣', '♦', '♥', '♠'] as const;

export const SUIT_NAMES: Record<string, string> = {
  '♣': 'سنك',
  '♦': 'ديناري',
  '♥': 'كبة',
  '♠': 'بستوني',
};

export const NUMBERS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] as const;

export const NUMBER_NAMES: Record<string, string> = {
  'A': 'آس',
  '2': 'اثنان',
  '3': 'ثلاثة',
  '4': 'أربعة',
  '5': 'خمسة',
  '6': 'ستة',
  '7': 'سبعة',
  '8': 'ثمانية',
  '9': 'تسعة',
  '10': 'عشرة',
  'J': 'الوزير',
  'Q': 'الملكة',
  'K': 'الملك',
};

export const RED_SUITS = ['♦', '♥'];
export const DARK_SUITS = ['♣', '♠'];

export const COLORS = {
  background: '#0e3520',
  surface: '#1a4a2e',
  surfaceLight: '#2a5a42',
  accent: '#d4a843',
  cardWhite: '#fffef0',
  textPrimary: '#ffffff',
  textSecondary: '#b0c4b1',
  redSuit: '#cc1111',
  darkSuit: '#111111',
  success: '#4caf50',
  error: '#f44336',
  warning: '#ff9800',
};

// Server URL - Railway or local
// For testing locally with phone on same wifi, use your computer's IP
export const SOCKET_URL = 'http://192.168.100.17:3000';

// For Railway deployment:
// export const SOCKET_URL = 'wss://overflowing-dream-production-74fb.up.railway.app';

export const AGORA_APP_ID = '763d6511555e4b7fac3be44f077372bb';

export type Phase = 'pick_target' | 'pick_number' | 'guess_count' | 'guess_suits' | 'game_over' | 'waiting';

export interface Card {
  suit: string;
  number: string;
  id: string;
}

export interface Player {
  id: string;
  name: string;
  playerIndex: number;
  handCount: number;
  completedSets: string[];
  isSpeaking?: boolean;
  isMuted?: boolean;
}

export interface Turn {
  targetIndex: number | null;
  number: string | null;
  targetCards: Card[] | null;
  guessedCount: number | null;
}

export interface GameState {
  currentPlayerIndex: number;
  phase: Phase;
  turn: Turn;
  completedSets: string[][];
  drawPileCount: number;
  gameOver: boolean;
  playerCardCounts: number[];
}

export interface GameLogEntry {
  id: string;
  message: string;
  timestamp: number;
  type: 'info' | 'success' | 'error' | 'warning';
}

// Phase display names in Arabic
export const PHASE_NAMES: Record<Phase, string> = {
  pick_target: 'اختيار اللاعب',
  pick_number: 'اختيار الرقم',
  guess_count: 'تخمين العدد',
  guess_suits: 'تخمين النقشات',
  game_over: 'انتهت اللعبة',
  waiting: 'في الانتظار',
};
