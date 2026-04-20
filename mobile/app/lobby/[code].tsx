import { View, Text, StyleSheet, Pressable, Alert, ActivityIndicator, Platform } from 'react-native';
import { useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useSocket } from '@/hooks/useSocket';
import { useGameStore } from '@/store/gameStore';
import { COLORS } from '@/constants/game';

export default function LobbyScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const router = useRouter();
  const { socket } = useSocket();
  const {
    lobbyPlayers,
    isHost,
    gameState,
    gameStarted,
    roomCode,
    loading,
    loadingMessage,
    playerName: myPlayerName,
  } = useGameStore();

  // Navigate to game when started
  useEffect(() => {
    if (gameState || gameStarted) {
      router.replace('/game/' + (roomCode || code));
    }
  }, [gameState, gameStarted, roomCode, code]);

  // Handle kicked event
  useEffect(() => {
    if (!socket) return;

    const handleKicked = ({ message }: { message: string }) => {
      if (Platform.OS === 'web') {
        window.alert(message);
      } else {
        Alert.alert('تم الطرد', message);
      }
      router.replace('/');
    };

    socket.on('kicked', handleKicked);
    return () => {
      socket.off('kicked', handleKicked);
    };
  }, [socket, router]);

  const handleCopyCode = async () => {
    const currentCode = roomCode || (code as string);
    if (Platform.OS === 'web') {
      try {
        await navigator.clipboard.writeText(currentCode);
        window.alert('تم نسخ رمز الغرفة: ' + currentCode);
      } catch {
        window.alert('رمز الغرفة: ' + currentCode);
      }
    } else {
      await Clipboard.setStringAsync(currentCode);
      Alert.alert('✅', 'تم نسخ رمز الغرفة: ' + currentCode);
    }
  };

  // Copy button
  const handleShare = async () => {
    const currentCode = roomCode || (code as string);
    if (Platform.OS === 'web') {
      try {
        await navigator.clipboard.writeText(currentCode);
        window.alert('تم نسخ رمز الغرفة: ' + currentCode);
      } catch {
        window.alert('رمز الغرفة: ' + currentCode);
      }
    } else {
      await Clipboard.setStringAsync(currentCode);
      Alert.alert('✅', 'تم نسخ رمز الغرفة: ' + currentCode);
    }
  };

  // Kick player handler (host only)
  const handleKickPlayer = (playerToKick: string) => {
    const currentCode = roomCode || (code as string);
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('هل تريد طرد ' + playerToKick + '؟');
      if (confirmed) {
        socket?.emit('kick_player', { code: currentCode, playerName: playerToKick });
      }
    } else {
      Alert.alert('طرد', 'هل تريد طرد ' + playerToKick, [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'طرد', style: 'destructive', onPress: () => {
          socket?.emit('kick_player', { code: currentCode, playerName: playerToKick });
        }},
      ]);
    }
  };

  // Back button - leave room
  const handleBack = () => {
    const currentCode = roomCode || (code as string);
    socket?.emit('leave_room', { code: currentCode });
    router.replace('/');
  };

  // Start game button
  const handleStartGame = () => {
    const currentCode = roomCode || (code as string);
    console.log('Starting game for room:', currentCode);
    socket?.emit('start_game', { code: currentCode });
  };

  return (
    <View style={styles.container}>
      {/* Back button */}
      <Pressable style={styles.backButton} onPress={handleBack}>
        <Text style={styles.backButtonText}>← خروج</Text>
      </Pressable>

      <Text style={styles.title}>الانتظار</Text>

      {/* Room code display */}
      <Pressable style={styles.codeContainer} onPress={handleCopyCode}>
        <Text style={styles.codeLabel}>رمز الغرفة</Text>
        <Text style={styles.code}>{roomCode || code}</Text>
        <Text style={styles.tapHint}>اضغط للنسخ</Text>
      </Pressable>

      {/* Share button */}
      <Pressable style={styles.shareButton} onPress={handleShare}>
        <Text style={styles.shareText}>📋 نسخ رمز الغرفة</Text>
      </Pressable>

      {/* Players list */}
      <View style={styles.playersContainer}>
        <Text style={styles.playersLabel}>اللاعبون ({lobbyPlayers.length}/4)</Text>
        {lobbyPlayers.map((player, index) => (
          <View
            key={index}
            style={[
              styles.playerSlot,
              styles.playerReady,
            ]}
          >
            <View style={styles.playerInfo}>
              <Text style={styles.playerName}>{player}</Text>
              {index === 0 && <Text style={styles.hostBadge}>👑 صاحب الغرفة</Text>}
            </View>
            {/* Kick button (host only, can't kick self) */}
            {isHost && player !== myPlayerName && (
              <Pressable
                style={styles.kickButton}
                onPress={() => handleKickPlayer(player)}
              >
                <Text style={styles.kickButtonText}>❌ طرد</Text>
              </Pressable>
            )}
          </View>
        ))}
        {/* Empty slots */}
        {Array.from({ length: 4 - lobbyPlayers.length }).map((_, index) => (
          <View key={`empty-${index}`} style={[styles.playerSlot, styles.playerEmpty]}>
            <Text style={styles.emptyText}>فارغ</Text>
          </View>
        ))}
      </View>

      {/* Status messages */}
      {lobbyPlayers.length < 4 ? (
        <Text style={styles.waitingText}>في انتظار اللاعبين... ({lobbyPlayers.length}/4)</Text>
      ) : (
        <Text style={styles.readyText}>✅ الجميع جاهز! تبدأ اللعبة تلقائياً...</Text>
      )}

      {/* Manual start (fallback) */}
      {isHost && lobbyPlayers.length >= 4 && (
        <Pressable
          style={({ pressed }) => [
            styles.startButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleStartGame}
        >
          <Text style={styles.startButtonText}>ابدأ اللعبة الآن</Text>
        </Pressable>
      )}

      {/* Loading overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loadingText}>{loadingMessage}</Text>
        </View>
      )}

      {/* Tips */}
      <View style={styles.tipsContainer}>
        <Text style={styles.tipText}>💡 انسخ رمز الغرفة وأرسله لأصدقائك للانضمام</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 24,
    alignItems: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#cc3333',
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.accent,
    marginBottom: 24,
  },
  codeContainer: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.accent,
    marginBottom: 16,
    width: '100%',
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
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  shareText: {
    fontSize: 16,
    color: COLORS.accent,
    fontWeight: 'bold',
  },
  playersContainer: {
    width: '100%',
    marginBottom: 24,
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
    justifyContent: 'center',
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerName: {
    fontSize: 18,
    color: COLORS.textPrimary,
    fontWeight: 'bold',
  },
  hostBadge: {
    fontSize: 12,
    color: COLORS.accent,
    marginLeft: 8,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  readyBadge: {
    fontSize: 14,
    color: COLORS.success,
    fontWeight: 'bold',
  },
  kickButton: {
    backgroundColor: COLORS.error,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  kickButtonText: {
    color: COLORS.textPrimary,
    fontSize: 14,
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
  startButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  buttonPressed: {
    opacity: 0.8,
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
  tipsContainer: {
    marginTop: 'auto',
    paddingTop: 24,
  },
  tipText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
