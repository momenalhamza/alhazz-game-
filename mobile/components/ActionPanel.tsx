import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useState } from 'react';
import { Phase, COLORS, SUIT_NAMES, SUITS } from '@/constants/game';

interface ActionPanelProps {
  phase: Phase;
  isMyTurn: boolean;
  currentPlayerName: string;
  numbersInHand?: string[];
  numberCounts?: Record<string, number>;
  guessedCount?: number | null;
  selectedSuits?: string[];
  onPickNumber?: (number: string) => void;
  onGuessCount?: (count: number) => void;
  onGuessSuits?: (suits: string[]) => void;
}

export function ActionPanel({
  phase,
  isMyTurn,
  currentPlayerName,
  numbersInHand = [],
  numberCounts = {},
  guessedCount,
  onPickNumber,
  onGuessCount,
  onGuessSuits,
}: ActionPanelProps) {
  const [selectedSuits, setSelectedSuits] = useState<string[]>([]);

  const handleSuitToggle = (suit: string) => {
    if (!guessedCount) return;

    setSelectedSuits(prev => {
      if (prev.includes(suit)) {
        return prev.filter(s => s !== suit);
      }
      if (prev.length >= guessedCount) {
        return prev;
      }
      return [...prev, suit];
    });
  };

  const handleConfirmSuits = () => {
    if (!guessedCount || selectedSuits.length !== guessedCount) return;
    onGuessSuits?.(selectedSuits);
    setSelectedSuits([]);
  };

  if (!isMyTurn) {
    return (
      <View style={styles.container}>
        <Text style={styles.phaseTitle}>في الانتظار...</Text>
        <Text style={styles.waitingText}>دور {currentPlayerName}</Text>
      </View>
    );
  }

  switch (phase) {
    case 'pick_target':
      return (
        <View style={styles.container}>
          <Text style={styles.phaseTitle}>اختار لاعب تسأله</Text>
          <Text style={styles.hintText}>اضغط على منافسك أعلاه</Text>
        </View>
      );

    case 'pick_number':
      return (
        <View style={styles.container}>
          <Text style={styles.phaseTitle}>اختر الرقم الذي تريده</Text>
          <ScrollView horizontal contentContainerStyle={styles.numberGrid}>
            {numbersInHand.map((number) => (
              <Pressable
                key={number}
                style={styles.numberButton}
                onPress={() => onPickNumber?.(number)}
              >
                <Text style={styles.numberButtonText}>
                  {number}
                </Text>
                <Text style={styles.countText}>
                  ({numberCounts[number]})
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      );

    case 'guess_count':
      return (
        <View style={styles.container}>
          <Text style={styles.phaseTitle}>كم ورقة معه؟</Text>
          <View style={styles.countButtons}>
            {[1, 2, 3].map((count) => (
              <Pressable
                key={count}
                style={styles.countButton}
                onPress={() => onGuessCount?.(count)}
              >
                <Text style={styles.countButtonText}>{count}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      );

    case 'guess_suits':
      return (
        <View style={styles.container}>
          <Text style={styles.phaseTitle}>
            اختر {guessedCount} نقشة ({selectedSuits.length}/{guessedCount || 0})
          </Text>
          <View style={styles.suitButtons}>
            {SUITS.map((suit) => (
              <Pressable
                key={suit}
                style={[
                  styles.suitButton,
                  selectedSuits.includes(suit) && styles.suitButtonSelected,
                  selectedSuits.length >= (guessedCount || 0) &&
                  !selectedSuits.includes(suit) && styles.suitButtonDisabled,
                ]}
                onPress={() => handleSuitToggle(suit)}
                disabled={
                  selectedSuits.length >= (guessedCount || 0) &&
                  !selectedSuits.includes(suit)
                }
              >
                <Text style={[
                  styles.suitButtonText,
                  (suit === '♥' || suit === '♦') && styles.redSuit,
                ]}>
                  {suit}
                </Text>
                <Text style={styles.suitNameText}>{SUIT_NAMES[suit]}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            style={[
              styles.confirmButton,
              selectedSuits.length !== guessedCount && styles.confirmButtonDisabled,
            ]}
            onPress={handleConfirmSuits}
            disabled={selectedSuits.length !== guessedCount}
          >
            <Text style={styles.confirmButtonText}>تأكيد</Text>
          </Pressable>
        </View>
      );

    default:
      return null;
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  phaseTitle: {
    color: COLORS.accent,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  hintText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  waitingText: {
    color: COLORS.textPrimary,
    fontSize: 18,
  },
  numberGrid: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 8,
  },
  numberButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 60,
  },
  numberButtonText: {
    color: COLORS.darkSuit,
    fontSize: 20,
    fontWeight: 'bold',
  },
  countText: {
    color: COLORS.darkSuit,
    fontSize: 12,
    marginTop: 2,
  },
  countButtons: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  countButton: {
    backgroundColor: COLORS.accent,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countButtonText: {
    color: COLORS.darkSuit,
    fontSize: 28,
    fontWeight: 'bold',
  },
  suitButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  suitButton: {
    backgroundColor: COLORS.surfaceLight,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  suitButtonSelected: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.textPrimary,
  },
  suitButtonDisabled: {
    opacity: 0.4,
  },
  suitButtonText: {
    fontSize: 32,
    color: COLORS.darkSuit,
  },
  redSuit: {
    color: COLORS.redSuit,
  },
  suitNameText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  confirmButton: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  confirmButtonDisabled: {
    backgroundColor: COLORS.textSecondary,
  },
  confirmButtonText: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
