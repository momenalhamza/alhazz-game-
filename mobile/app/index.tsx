import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { useSocket } from '@/hooks/useSocket';
import { useGameStore } from '@/store/gameStore';
import { COLORS } from '@/constants/game';

export default function HomeScreen() {
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [skipConnection, setSkipConnection] = useState(false);
  const router = useRouter();
  const isSubmitting = useRef(false);
  const { createRoom, joinRoom } = useSocket();
  const { connected, playerName: savedName } = useGameStore();

  // Skip connection check after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setSkipConnection(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Handle deep link
    const subscription = Linking.addEventListener('url', (event) => {
      const url = event.url;
      if (url.includes('/join/')) {
        const code = url.split('/join/')[1];
        if (code) {
          setRoomCode(code.toUpperCase());
          setShowJoinInput(true);
        }
      }
    });

    // Check initial URL
    Linking.getInitialURL().then((url) => {
      if (url && url.includes('/join/')) {
        const code = url.split('/join/')[1];
        if (code) {
          setRoomCode(code.toUpperCase());
          setShowJoinInput(true);
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleCreateRoom = () => {
    if (isSubmitting.current) return;
    console.log('handleCreateRoom called, playerName:', playerName);
    if (!playerName.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال اسم اللاعب');
      return;
    }
    isSubmitting.current = true;
    createRoom(playerName.trim());
    setTimeout(() => {
      isSubmitting.current = false;
    }, 3000);
  };

  const handleJoinRoom = () => {
    if (!playerName.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال اسم اللاعب');
      return;
    }
    if (roomCode.trim().length !== 6) {
      Alert.alert('خطأ', 'رمز الغرفة يجب أن يكون 6 أحرف');
      return;
    }
    joinRoom(roomCode.trim().toUpperCase(), playerName.trim());
  };

  // Navigate to lobby when room is created or joined
  const { roomCode: storeRoomCode, lobbyPlayers } = useGameStore();
  useEffect(() => {
    if (storeRoomCode && lobbyPlayers.length > 0) {
      console.log('Navigating to lobby:', storeRoomCode);
      router.push(`/lobby/${storeRoomCode}`);
    }
  }, [storeRoomCode, lobbyPlayers]);

  const allowAction = connected || skipConnection;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>لعبة الحزر 🃏</Text>
        <Text style={styles.subtitle}>لعنة البلوت العربية</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>اسم اللاعب</Text>
          <TextInput
            style={styles.input}
            value={playerName}
            onChangeText={setPlayerName}
            placeholder="أدخل اسمك..."
            placeholderTextColor={COLORS.textSecondary}
            maxLength={20}
            textAlign="center"
            autoCapitalize="none"
          />
        </View>

        {!showJoinInput ? (
          <View style={styles.buttonContainer}>
            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
              onPress={() => {
                if (!playerName.trim()) {
                  Alert.alert('خطأ', 'يرجى إدخال اسم اللاعب');
                  return;
                }
                createRoom(playerName.trim());
              }}
            >
              <Text style={styles.buttonText}>أنشئ غرفة</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.button,
                styles.secondaryButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => setShowJoinInput(true)}
            >
              <Text style={styles.secondaryButtonText}>انضم لغرفة</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.joinContainer}>
            <Text style={styles.label}>رمز الغرفة</Text>
            <TextInput
              style={styles.input}
              value={roomCode}
              onChangeText={(text) => setRoomCode(text.toUpperCase())}
              placeholder="XXXXXX"
              placeholderTextColor={COLORS.textSecondary}
              maxLength={6}
              textAlign="center"
              autoCapitalize="characters"
            />

            <Pressable
              style={({ pressed }) => [
                styles.button,
                styles.primaryButton,
                (roomCode.length !== 6) && { opacity: 0.5 },
                pressed && styles.buttonPressed,
              ]}
              onPress={() => {
                console.log('Join button pressed, roomCode:', roomCode);
                if (roomCode.length !== 6) {
                  Alert.alert('خطأ', 'رمز الغرفة يجب أن يكون 6 أحرف');
                  return;
                }
                handleJoinRoom();
              }}
            >
              <Text style={styles.buttonText}>انضم الآن</Text>
            </Pressable>

            <Pressable
              style={styles.backButton}
              onPress={() => setShowJoinInput(false)}
            >
              <Text style={styles.backButtonText}>عودة</Text>
            </Pressable>
          </View>
        )}

        {!allowAction && (
          <Text style={styles.connectingText}>
            جار الاتصال بالخادم...
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 32,
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: COLORS.accent,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 48,
  },
  inputContainer: {
    marginBottom: 32,
  },
  label: {
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 20,
    color: COLORS.textPrimary,
    borderWidth: 2,
    borderColor: COLORS.surfaceLight,
  },
  buttonContainer: {
    gap: 16,
  },
  button: {
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: COLORS.accent,
  },
  secondaryButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.darkSuit,
  },
  secondaryButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.accent,
  },
  joinContainer: {
    gap: 16,
  },
  backButton: {
    padding: 12,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  connectingText: {
    marginTop: 24,
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
