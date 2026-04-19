import { View, Text, StyleSheet, Pressable } from 'react-native';
import { CardStack } from './PlayingCard';
import { Player, Phase, COLORS } from '@/constants/game';
import { useGameStore } from '@/store/gameStore';

interface OpponentPanelProps {
  player: Player;
  isMyTurn: boolean;
  canPick: boolean;
  position: 'top' | 'right' | 'left';
  onPick?: () => void;
}

export function OpponentPanel({
  player,
  isMyTurn,
  canPick,
  position,
  onPick,
}: OpponentPanelProps) {
  const { phase, playerIndex: myIndex } = useGameStore();
  const isCurrentPlayer = isMyTurn;
  const isTarget = phase === 'pick_target' && canPick;
  const isSpeaking = player.isSpeaking;

  return (
    <Pressable
      style={[
        styles.container,
        position === 'top' && styles.top,
        position === 'right' && styles.right,
        position === 'left' && styles.left,
        isCurrentPlayer && styles.currentPlayer,
        isTarget && styles.targetable,
        player.handCount === 0 && styles.out,
      ]}
      onPress={isTarget ? onPick : undefined}
      disabled={!isTarget}
    >
      {/* Voice indicator */}
      <View style={[styles.voiceIndicator, isSpeaking && styles.speaking]}>
        <Text style={styles.micIcon}>🎤</Text>
      </View>

      {/* Player name */}
      <Text style={styles.name} numberOfLines={1}>
        {player.name}
      </Text>

      {/* Card stack */}
      <CardStack count={player.handCount} size="small" />

      {/* Sets display */}
      {player.completedSets.length > 0 && (
        <View style={styles.setsContainer}>
          <Text style={styles.setsLabel}>✓ {player.completedSets.join(' ')}</Text>
        </View>
      )}

      {/* Turn indicator */}
      {isCurrentPlayer && (
        <View style={styles.turnIndicator}>
          <Text style={styles.turnText}>دوره!</Text>
        </View>
      )}

      {/* Target hint */}
      {isTarget && (
        <View style={styles.targetHint}>
          <Text style={styles.hintText}>اضغط للسؤال</Text>
        </View>
      )}

      {/* Out indicator */}
      {player.handCount === 0 && (
        <View style={styles.outOverlay}>
          <Text style={styles.outText}>انتهى</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 90,
  },
  top: {
    marginBottom: 8,
  },
  right: {
    marginLeft: 8,
  },
  left: {
    marginRight: 8,
  },
  currentPlayer: {
    borderColor: COLORS.success,
    backgroundColor: COLORS.surfaceLight,
  },
  targetable: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.warning,
    transform: [{ scale: 1.05 }],
  },
  out: {
    opacity: 0.4,
  },
  voiceIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.textSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  speaking: {
    backgroundColor: COLORS.success,
  },
  micIcon: {
    fontSize: 12,
  },
  name: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  setsContainer: {
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: COLORS.background,
    borderRadius: 4,
  },
  setsLabel: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: 'bold',
  },
  turnIndicator: {
    position: 'absolute',
    top: -8,
    backgroundColor: COLORS.success,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  turnText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  targetHint: {
    position: 'absolute',
    bottom: -10,
    backgroundColor: COLORS.accent,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  hintText: {
    color: COLORS.darkSuit,
    fontSize: 10,
    fontWeight: 'bold',
  },
  outOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
  },
  outText: {
    color: COLORS.textSecondary,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
