// Game logic for لعبة الحزر (Al-Hazz)

const SUITS = ['♣', '♦', '♥', '♠'];
const SUIT_NAMES = { '♣': 'سنك', '♦': 'ديناري', '♥': 'كبة', '♠': 'بستوني' };
const NUMBERS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function createDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const number of NUMBERS) {
      deck.push({ suit, number, id: `${number}-${suit}` });
    }
  }
  return shuffle(deck);
}

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function createGameState() {
  const deck = createDeck();
  const hands = [[], [], [], []];

  // Deal 4 cards to each of 4 players
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      hands[j].push(deck.pop());
    }
  }

  return {
    hands,
    drawPile: deck,
    currentPlayerIndex: 0,
    phase: 'pick_target',
    turn: {
      targetIndex: null,
      number: null,
      targetCards: null,
      guessedCount: null,
    },
    players: [],
    completedSets: [[], [], [], []], // Array of sets per player
    gameOver: false,
  };
}

function checkInitialSets(hand) {
  const sets = [];
  const numberCounts = {};

  for (const card of hand) {
    numberCounts[card.number] = numberCounts[card.number] || [];
    numberCounts[card.number].push(card.suit);
  }

  for (const [number, suits] of Object.entries(numberCounts)) {
    if (suits.length === 4) {
      sets.push(number);
    }
  }

  return sets;
}

function checkCompletedSets(hand) {
  const sets = [];
  const numberCounts = {};

  for (const card of hand) {
    numberCounts[card.number] = numberCounts[card.number] || 0;
    numberCounts[card.number]++;
  }

  for (const [number, count] of Object.entries(numberCounts)) {
    if (count === 4) {
      sets.push(number);
    }
  }

  return sets;
}

function removeCompletedSet(hand, number) {
  return hand.filter(card => card.number !== number);
}

function getCardsByNumber(hand, number) {
  return hand.filter(card => card.number === number);
}

function hasCardsOfNumber(hand, number) {
  return hand.some(card => card.number === number);
}

function countCardsOfNumber(hand, number) {
  return hand.filter(card => card.number === number).length;
}

function transferCards(fromHand, toHand, number) {
  const cards = fromHand.filter(card => card.number === number);
  const remaining = fromHand.filter(card => card.number !== number);
  return { cards, fromHand: remaining, toHand: [...toHand, ...cards] };
}

function findNextActivePlayerIndex(state, startIndex) {
  let attempts = 0;
  let index = (startIndex + 1) % 4;

  while (attempts < 4) {
    if (state.hands[index].length > 0) {
      return index;
    }
    index = (index + 1) % 4;
    attempts++;
  }

  return -1; // All players out
}

function checkGameOver(state) {
  const totalCards = state.hands.flat().length;
  return totalCards === 0 || state.drawPile.length === 0 && totalCards === 0;
}

function calculateScores(state) {
  return state.completedSets.map((sets, index) => ({
    playerIndex: index,
    sets: sets.length,
    setNumbers: sets,
  }));
}

function getWinner(state) {
  const scores = calculateScores(state);
  let maxSets = -1;
  let winners = [];

  for (const score of scores) {
    if (score.sets > maxSets) {
      maxSets = score.sets;
      winners = [score.playerIndex];
    } else if (score.sets === maxSets) {
      winners.push(score.playerIndex);
    }
  }

  return { winners, maxSets };
}

// Validation functions
function validatePickNumber(state, playerIndex, number) {
  if (state.phase !== 'pick_target') {
    return { valid: false, error: 'ليس دورك لاختيار الرقم' };
  }
  if (playerIndex !== state.currentPlayerIndex) {
    return { valid: false, error: 'ليس دورك' };
  }
  if (!hasCardsOfNumber(state.hands[playerIndex], number)) {
    return { valid: false, error: 'لا تملك هذا الرقم' };
  }
  return { valid: true };
}

function validateGuessCount(state, playerIndex, count) {
  if (state.phase !== 'guess_count') {
    return { valid: false, error: 'ليس وقت تخمين العدد' };
  }
  if (playerIndex !== state.currentPlayerIndex) {
    return { valid: false, error: 'ليس دورك' };
  }
  if (![1, 2, 3].includes(count)) {
    return { valid: false, error: 'العدد يجب أن يكون 1 أو 2 أو 3' };
  }
  return { valid: true };
}

function validateGuessSuits(state, playerIndex, suits) {
  if (state.phase !== 'guess_suits') {
    return { valid: false, error: 'ليس وقت تخمين النقشات' };
  }
  if (playerIndex !== state.currentPlayerIndex) {
    return { valid: false, error: 'ليس دورك' };
  }
  if (!state.turn.guessedCount) {
    return { valid: false, error: 'لم تخمن العدد بعد' };
  }
  if (suits.length !== state.turn.guessedCount) {
    return { valid: false, error: `يجب اختيار ${state.turn.guessedCount} نقشة` };
  }
  const uniqueSuits = [...new Set(suits)];
  if (uniqueSuits.length !== suits.length) {
    return { valid: false, error: 'لا يمكن تكرار النقشات' };
  }
  for (const suit of suits) {
    if (!SUITS.includes(suit)) {
      return { valid: false, error: 'نقشة غير صالحة' };
    }
  }
  return { valid: true };
}

function getPublicGameState(state) {
  return {
    currentPlayerIndex: state.currentPlayerIndex,
    phase: state.phase,
    turn: state.turn,
    completedSets: state.completedSets,
    drawPileCount: state.drawPile.length,
    gameOver: state.gameOver,
    playerCardCounts: state.hands.map(h => h.length),
  };
}

module.exports = {
  SUITS,
  SUIT_NAMES,
  NUMBERS,
  createDeck,
  createGameState,
  checkInitialSets,
  checkCompletedSets,
  removeCompletedSet,
  getCardsByNumber,
  hasCardsOfNumber,
  countCardsOfNumber,
  transferCards,
  findNextActivePlayerIndex,
  checkGameOver,
  calculateScores,
  getWinner,
  validatePickNumber,
  validateGuessCount,
  validateGuessSuits,
  getPublicGameState,
};
