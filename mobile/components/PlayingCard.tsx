import { Pressable, StyleSheet, Text, View, Platform } from 'react-native';
import { Card, COLORS, RED_SUITS, SUIT_NAMES } from '@/constants/game';

interface PlayingCardProps {
  card: Card;
  selected?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  size?: 'small' | 'medium' | 'large';
  faceDown?: boolean;
}

export function PlayingCard({
  card,
  selected = false,
  disabled = false,
  onPress,
  size = 'medium',
  faceDown = false,
}: PlayingCardProps) {
  const isRed = RED_SUITS.includes(card.suit);
  const color = isRed ? COLORS.redSuit : COLORS.darkSuit;

  const sizeStyles = {
    small: { width: 40, height: 56, fontSize: 14, suitSize: 16 },
    medium: { width: 60, height: 84, fontSize: 18, suitSize: 24 },
    large: { width: 80, height: 112, fontSize: 22, suitSize: 32 },
  }[size];

  if (faceDown) {
    return (
      <View
        style={[
          styles.card,
          sizeStyles,
          styles.faceDown,
          { borderColor: COLORS.accent },
        ]}
      >
        <View style={styles.faceDownPattern} />
      </View>
    );
  }

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        sizeStyles,
        { borderColor: selected ? COLORS.accent : color },
        selected && styles.selected,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
      onPress={!disabled ? onPress : undefined}
      disabled={disabled}
    >
      {/* Top left corner */}
      <View style={styles.cornerTop}>
        <Text style={[styles.number, { color, fontSize: sizeStyles.fontSize }]}>
          {card.number}
        </Text>
        <Text style={[styles.suit, { color, fontSize: sizeStyles.suitSize }]}>
          {card.suit}
        </Text>
      </View>

      {/* Center suit */}
      <View style={styles.center}>
        <Text style={[styles.centerSuit, { color, fontSize: sizeStyles.suitSize * 1.5 }]}>
          {card.suit}
        </Text>
      </View>

      {/* Bottom right corner (rotated) */}
      <View style={styles.cornerBottom}>
        <Text
          style={[
            styles.number,
            { color, fontSize: sizeStyles.fontSize, transform: [{ rotate: '180deg' }] },
          ]}
        >
          {card.number}
        </Text>
        <Text
          style={[
            styles.suit,
            { color, fontSize: sizeStyles.suitSize, transform: [{ rotate: '180deg' }] },
          ]}
        >
          {card.suit}
        </Text>
      </View>
    </Pressable>
  );
}

export function CardStack({
  count,
  size = 'small',
}: {
  count: number;
  size?: 'small' | 'medium' | 'large';
}) {
  const sizeStyles = {
    small: { width: 40, height: 56 },
    medium: { width: 60, height: 84 },
    large: { width: 80, height: 112 },
  }[size];

  return (
    <View style={styles.stackContainer}>
      {/* Stack effect */}
      <View
        style={[
          styles.stackCard,
          sizeStyles,
          { backgroundColor: COLORS.surface, marginTop: 6, marginLeft: 6 },
        ]}
      />
      <View
        style={[
          styles.stackCard,
          sizeStyles,
          { backgroundColor: COLORS.surfaceLight, marginTop: 3, marginLeft: 3 },
        ]}
      />
      <View
        style={[
          styles.card,
          sizeStyles,
          styles.faceDown,
          { borderColor: COLORS.accent, position: 'absolute', top: 0, left: 0 },
        ]}
      >
        <Text style={styles.countLabel}>{count}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardWhite,
    borderRadius: 8,
    borderWidth: 2,
    padding: 4,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  selected: {
    transform: [{ translateY: -8 }],
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
  },
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.5,
  },
  faceDown: {
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceDownPattern: {
    width: '70%',
    height: '70%',
    borderRadius: 4,
    backgroundColor: COLORS.accent,
    opacity: 0.3,
  },
  cornerTop: {
    alignItems: 'flex-start',
  },
  cornerBottom: {
    alignItems: 'flex-end',
    alignSelf: 'flex-end',
  },
  center: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerSuit: {
    fontWeight: 'bold',
  },
  number: {
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  suit: {
    fontWeight: 'bold',
    lineHeight: 20,
  },
  stackContainer: {
    position: 'relative',
    width: 100,
    height: 90,
  },
  stackCard: {
    position: 'absolute',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  countLabel: {
    color: COLORS.accent,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
