import { useEffect, useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSocket } from '@/hooks/useSocket';
import { useGameStore } from '@/store/gameStore';
import { useVoice } from '@/hooks/useVoice';
import { COLORS, Card as CardType, Phase } from '@/constants/game';
import { PlayingCard } from '@/components/PlayingCard';
import { OpponentPanel } from '@/components/OpponentPanel';
import { ActionPanel } from '@/components/ActionPanel';
import { GameLog } from '@/components/GameLog';
import { VoiceBar } from '@/components/VoiceBar';

export default function GameScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const router = useRouter();
  const { disconnect, pickTarget, pickNumber, guessCount, guessSuits } = useSocket();
  const { joined, isMuted, toggleMute } = useVoice(code || null);

  const {
    gameState,
    playerIndex,
    myHand,
    mySets,
    lobbyPlayers,
    gameLog,
    speakingPlayers,
  } = useGameStore();

  // Redirect if not in game
  useEffect(() => {
    if (!gameState && lobbyPlayers.length === 0) {
      router.replace('/');
    }
  }, [gameState, lobbyPlayers]);

  const handleLeave = useCallback(() => {
    Alert.alert(
      'مغادرة اللعبة',
      'هل أنت متأكد أنك تريد مغادرة اللعبة؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'مغادرة',
          style: 'destructive',
          onPress: () => {
            disconnect();
            router.replace('/');
          },
        },
      ]
    );
  }, [disconnect, router]);

  if (!gameState || playerIndex === null) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>جار التحميل...</Text>
      </SafeAreaView>
    );
  }

  const currentPlayer = gameState.currentPlayerIndex;
  const isMyTurn = currentPlayer === playerIndex;
  const phase: Phase = gameState.phase;
  const turn = gameState.turn;

  // Organize opponents relative to player
  const opponentIndices: number[] = [];
  for (let i = 1; i < 4; i++) {
    opponentIndices.push((playerIndex + i) % 4);
  }

  const allPlayers = lobbyPlayers.length > 0 ? lobbyPlayers : ['أنت', 'لاعب 2', 'لاعب 3', 'لاعب 4'];

  const opponents = opponentIndices.map((idx) => ({
    index: idx,
    name: allPlayers[idx] || `لاعب ${idx + 1}`,
    handCount: gameState.playerCardCounts[idx] || 0,
    completedSets: gameState.completedSets[idx] || [],
    isSpeaking: speakingPlayers.has(idx),
    isMe: false,
  }));

  const voicePlayers = [
    {
      name: 'أنت',
      isSpeaking: speakingPlayers.has(playerIndex),
      isMe: true,
    },
    ...opponentIndices.map((idx) => ({
      name: allPlayers[idx] || `لاعب ${idx + 1}`,
      isSpeaking: speakingPlayers.has(idx),
      isMe: false,
    })),
  ];

  // Get unique numbers from hand
  const numbersInHand = [...new Set(myHand.map((card: CardType) => card.number))].sort();

  // Count cards of each number
  const numberCounts: Record<string, number> = {};
  for (const card of myHand) {
    numberCounts[card.number] = (numberCounts[card.number] || 0) + 1;
  }

  const currentPlayerName = allPlayers[currentPlayer] || `لاعب ${currentPlayer + 1}`;

  return (
    <SafeAreaView style={styles.container}>
      {/* Voice Bar */}
      <VoiceBar players={voicePlayers} isMuted={isMuted} onToggleMute={toggleMute} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleLeave}>
          <Text style={styles.leaveButton}>خروج</Text>
        </Pressable>
        <Text style={styles.roomCode}>{code}</Text>
        <Text style={styles.drawPile}>المخزن: {gameState.drawPileCount}</Text>
      </View>

      {/* Opponents */}
      <View style={styles.opponentsRow}>
        {opponents.map((opp, i) => (
          <OpponentPanel
            key={opp.index}
            player={opp}
            isMyTurn={currentPlayer === opp.index}
            canPick={isMyTurn && phase === 'pick_target' && opp.handCount > 0}
            position={['top', 'left', 'right'][i] as 'top' | 'left' | 'right'}
            onPick={() => pickTarget(opp.index)}
          />
        ))}
      </View>

      {/* Action Panel */}
      <ActionPanel
        phase={phase}
        isMyTurn={isMyTurn}
        currentPlayerName={currentPlayerName}
        numbersInHand={numbersInHand}
        numberCounts={numberCounts}
        guessedCount={turn.guessedCount}
        onPickNumber={pickNumber}
        onGuessCount={guessCount}
        onGuessSuits={guessSuits}
      />

      {/* Game Log */}
      <GameLog entries={gameLog} maxEntries={8} />

      {/* Completed Sets */}
      {mySets.length > 0 && (
        <View style={styles.setsContainer}>
          <Text style={styles.setsLabel}>مجموعاتك: {mySets.join(' • ')}</Text>
        </View>
      )}

      {/* My Hand */}
      <View style={styles.handContainer}>
        <Text style={styles.handLabel}>وراقك ({myHand.length})</Text>
        <ScrollView horizontal contentContainerStyle={styles.handCards}>
          {myHand.map((card: CardType, index: number) => (
            <View
              key={card.id}
              style={[
                styles.cardWrapper,
                { marginLeft: index === 0 ? 0 : -30 },
              ]}
            >
              <PlayingCard card={card} size="medium" />
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Game Over Overlay */}
      {gameState.gameOver && (
        <View style={styles.gameOverlay}>
          <Text style={styles.gameOverTitle}>انتهت اللعبة!</Text>
          <Pressable style={styles.closeButton} onPress={handleLeave}>
            <Text style={styles.closeButtonText}>العودة للقائمة</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  leaveButton: {
    color: COLORS.error,
    fontSize: 16,
  },
  roomCode: {
    color: COLORS.accent,
    fontSize: 18,
    fontWeight: 'bold',
  },
  drawPile: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  opponentsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 8,
    minHeight: 100,
  },
  setsContainer: {
    padding: 8,
    alignItems: 'center',
  },
  setsLabel: {
    color: COLORS.success,
    fontSize: 16,
    fontWeight: 'bold',
  },
  handContainer: {
    padding: 16,
    backgroundColor: COLORS.surfaceLight,
  },
  handLabel: {
    color: COLORS.textPrimary,
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  handCards: {
    paddingBottom: 8,
    paddingLeft: 16,
    gap: 4,
  },
  cardWrapper: {
    elevation: 2,
  },
  loadingText: {
    color: COLORS.accent,
    fontSize: 24,
    textAlign: 'center',
    marginTop: 100,
  },
  gameOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameOverTitle: {
    color: COLORS.accent,
    fontSize: 42,
    fontWeight: 'bold',
    marginBottom: 32,
  },
  closeButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 12,
  },
  closeButtonText: {
    color: COLORS.darkSuit,
    fontSize: 20,
    fontWeight: 'bold',
  },
});
