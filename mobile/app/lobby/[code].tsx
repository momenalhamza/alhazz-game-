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
  const { emitSafe, socketReady } = useSocket();
  const {
    lobbyPlayers,
    isHost,
    gameState,
    gameStarted,
    roomCode,
    loading,
    loadingMessage,
    playerName: myPlayerName,
    connected,
  } = useGameStore();

  // Navigate to game when started
  useEffect(() => {
    if (gameState || gameStarted) {
      const gameCode = roomCode || code;
      console.log('Navigating to game:', gameCode);
      router.replace('/game/' + gameCode);
    }
  }, [gameState, gameStarted, roomCode, code]);

  // Handle kicked event - register on socket
  useEffect(() => {
    const handleKicked = ({ message }: { message: string }) => {
      if (Platform.OS === 'web') {
        window.alert(message);
      } else {
        Alert.alert('تم الطرد', message);
      }
      useGameStore.getState().reset();
      router.replace('/');
    };

    // We need to listen on the actual socket from the store
    // The kicked handler is already set up in useSocket, but we also
    // need the navigation to happen here
  }, [router]);

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

  // Share button
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
        console.log('Kicking player:', playerToKick, 'from room:', currentCode);
        emitSafe('kick_player', { code: currentCode, playerName: playerToKick });
      }
    } else {
      Alert.alert('طرد', 'هل تريد طرد ' + playerToKick, [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'طرد', style: 'destructive', onPress: () => {
          console.log('Kicking player:', playerToKick, 'from room:', currentCode);
          emitSafe('kick_player', { code: currentCode, playerName: playerToKick });
        }},
      ]);
    }
  };

  // Back button - leave room
  const handleBack = () => {
    const currentCode = roomCode || (code as string);
    console.log('Leaving room:', currentCode);
    emitSafe('leave_room', { code: currentCode });
    useGameStore.getState().reset();
    router.replace('/');
  };

  // Start game button
  const handleStartGame = () => {
    const currentCode = roomCode || (code as string);
    console.log('Starting game for room:', currentCode, 'socketReady:', socketReady);
    emitSafe('start_game', { code: currentCode });
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
        <Text style={styles.readyText}>✅ الجميع جاهز! اضغط "ابدأ اللعبة الآن"</Text>
      )}

      {/* Start game button - visible when 4 players, host only */}
      {isHost && lobbyPlayers.length >= 4 && (
        <Pressable
          style={styles.startButton}
          onPress={handleStartGame}
        >
          <Text style={styles.startButtonText}>ابدأ اللعبة الآن ▶</Text>
        </Pressable>
      )}

      {/* Non-host waiting message */}
      {!isHost && lobbyPlayers.length >= 4 && (
        <Text style={styles.waitingHostText}>بانتظار أن يبدأ صاحب الغرفة اللعبة...</Text>
      )}

      {/* Loading overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loadingText}>{loadingMessage}</Text>
        </View>
      )}

      {/* Connection status */}
      {!connected && (
        <Text style={styles.connectingText}>جار الاتصال بالخادم...</Text>
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
  kickButton: {
    backgroundColor: COLORS.error,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  kickButtonText: {
    color: 'white',
    fontSize: 14,
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
  waitingHostText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  startButton: {
    backgroundColor: '#22aa44',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    marginBottom: 16,
    width: '100%',
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
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
  connectingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 16,
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
