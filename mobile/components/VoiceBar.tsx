import { View, Text, StyleSheet, Pressable } from 'react-native';
import { COLORS } from '@/constants/game';

interface VoiceBarProps {
  players: { name: string; isSpeaking: boolean; isMe: boolean }[];
  isMuted: boolean;
  onToggleMute: () => void;
}

export function VoiceBar({ players, isMuted, onToggleMute }: VoiceBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.playersRow}>
        {players.map((player, index) => (
          <View key={index} style={styles.playerIndicator}>
            <View
              style={[
                styles.micContainer,
                player.isMe && styles.myMicContainer,
                player.isMe && player.isSpeaking && styles.mySpeaking,
                !player.isMe && player.isSpeaking && styles.playerSpeaking,
              ]}
            >
              <Text style={styles.micIcon}>🎤</Text>
            </View>
            <Text style={[styles.playerName, player.isMe && styles.myName]}>
              {player.name}
            </Text>
            <Text style={styles.statusText}>
              {player.isSpeaking ? 'يتكلم' : 'صامت'}
            </Text>
          </View>
        ))}
      </View>

      {/* My mute button */}
      <Pressable
        style={[styles.muteButton, isMuted && styles.mutedButton]}
        onPress={onToggleMute}
      >
        <Text style={styles.muteButtonText}>
          {isMuted ? '🔇 كتم الصوت' : '🎤 الصوت مفتوح'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLight,
  },
  playersRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  playerIndicator: {
    alignItems: 'center',
  },
  micContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  myMicContainer: {
    backgroundColor: COLORS.accent,
    borderWidth: 2,
    borderColor: COLORS.textPrimary,
  },
  playerSpeaking: {
    backgroundColor: COLORS.success,
    shadowColor: '#00ff00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
  mySpeaking: {
    backgroundColor: COLORS.success,
  },
  micIcon: {
    fontSize: 18,
  },
  playerName: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginBottom: 2,
  },
  myName: {
    color: COLORS.accent,
    fontWeight: 'bold',
  },
  statusText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    opacity: 0.7,
  },
  muteButton: {
    backgroundColor: COLORS.surfaceLight,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },
  mutedButton: {
    backgroundColor: COLORS.error,
  },
  muteButtonText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: 'bold',
  },
});
