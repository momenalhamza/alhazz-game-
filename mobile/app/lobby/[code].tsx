import { View, Text, StyleSheet, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import { useSocket } from '@/hooks/useSocket';
import { useGameStore } from '@/store/gameStore';
import { COLORS } from '@/constants/game';

export default function LobbyScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const router = useRouter();
  const { startGame, disconnect } = useSocket();
  const {
    lobbyPlayers,
    isHost,
    gameState,
    roomCode,
    loading,
    loadingMessage,
  } = useGameStore();

  useEffect(() => {
    if (gameState) {
      // Game started, navigate to game screen
      router.replace(`/game/${code}`);
    }
  }, [gameState, code]);

  const handleCopyCode = async () => {
    if (roomCode) {
      await Clipboard.setStringAsync(roomCode);
      Alert.alert('تم النسخ', `تم نسخ رمز الغرفة: ${roomCode}`);
    }
  };

  const handleShare = async () => {
    if (roomCode) {
      await Sharing.shareAsync(`انضم لي في لعبة الحزر!\nرمز الغرفة: ${roomCode}\n\nalhazz://join/${roomCode}`);
    }
  };

  const handleStartGame = () => {
    if (lobbyPlayers.length !== 4) {
      Alert.alert('تنبيه', 'اللعبة تحتاج إلى 4 لاعبين');
      return;
    }
    startGame();
  };

  const handleLeave = () => {
    disconnect();
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>الانتظار</Text>

      {/* Room code display */}
      <Pressable style={styles.codeContainer} onPress={handleCopyCode}>
        <Text style={styles.codeLabel}>رمز الغرفة</Text>
        <Text style={styles.code}>{roomCode || code}</Text>
        <Text style={styles.tapHint}>اضغط للنسخ</Text>
      </Pressable>

      {/* Share button */}
      <Pressable style={styles.shareButton} onPress={handleShare}>
        <Text style={styles.shareText}>مشاركة الدعوة</Text>
      </Pressable>

      {/* Players list */}
      <View style={styles.playersContainer}>
        <Text style={styles.playersLabel}>اللاعبون ({lobbyPlayers.length}/4)</Text>
        {Array.from({ length: 4 }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.playerSlot,
              lobbyPlayers[index] ? styles.playerReady : styles.playerEmpty,
            ]}
          >
            <Text style={styles.playerName}>
              {lobbyPlayers[index] || 'فارغ'}
            </Text>
            {lobbyPlayers[index] && (
              <Text style={styles.readyBadge}>جاهز</Text>
            )}
          </View>
        ))}
      </View>

      {/* Waiting or Ready message */}
      {lobbyPlayers.length < 4 ? (
        <Text style={styles.waitingText}>في انتظار اللاعبين...</Text>
      ) : (
        <Text style={styles.readyText}>الجميع جاهز!</Text>
      )}

      {/* Start button (host only) */}
      {isHost && (
        <Pressable
          style={({ pressed }) => [
            styles.startButton,
            lobbyPlayers.length !== 4 && styles.startButtonDisabled,
            pressed && lobbyPlayers.length === 4 && styles.buttonPressed,
          ]}
          onPress={handleStartGame}
          disabled={lobbyPlayers.length !== 4}
        >
          <Text style={styles.startButtonText}>ابدأ اللعبة!</Text>
        </Pressable>
      )}

      {/* Leave button */}
      <Pressable style={styles.leaveButton} onPress={handleLeave}>
        <Text style={styles.leaveButtonText}>مغادرة الغرفة</Text>
      </Pressable>

      {/* Loading overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loadingText}>{loadingMessage}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.accent,
    marginBottom: 32,
  },
  codeContainer: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.accent,
    marginBottom: 16,
  },
  codeLabel: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  code: {
    fontSize: 42,
    fontWeight: 'bold',
    color: COLORS.accent,
    letterSpacing: 8,
  },
  tapHint: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  shareButton: {
    padding: 12,
    marginBottom: 32,
  },
  shareText: {
    fontSize: 16,
    color: COLORS.accent,
    textDecorationLine: 'underline',
  },
  playersContainer: {
    width: '100%',
    marginBottom: 32,
  },
  playersLabel: {
    fontSize: 18,
    color: COLORS.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  playerSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
  },
  playerReady: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.success,
  },
  playerEmpty: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.textSecondary,
    borderStyle: 'dashed',
  },
  playerName: {
    fontSize: 18,
    color: COLORS.textPrimary,
  },
  readyBadge: {
    fontSize: 14,
    color: COLORS.success,
    fontWeight: 'bold',
  },
  waitingText: {
    fontSize: 18,
    color: COLORS.textSecondary,
    marginBottom: 24,
  },
  readyText: {
    fontSize: 18,
    color: COLORS.success,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  startButton: {
    backgroundColor: COLORS.success,
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 12,
    marginBottom: 16,
  },
  startButtonDisabled: {
    backgroundColor: COLORS.textSecondary,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  startButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  leaveButton: {
    padding: 12,
  },
  leaveButtonText: {
    fontSize: 16,
    color: COLORS.error,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    color: COLORS.accent,
  },
});
