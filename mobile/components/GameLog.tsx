import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { COLORS } from '@/constants/game';

interface GameLogEntry {
  id: string;
  message: string;
  timestamp: number;
  type: 'info' | 'success' | 'error' | 'warning';
}

interface GameLogProps {
  entries: GameLogEntry[];
  maxEntries?: number;
}

const typeColors = {
  info: COLORS.textSecondary,
  success: COLORS.success,
  error: COLORS.error,
  warning: COLORS.warning,
};

export function GameLog({ entries, maxEntries = 10 }: GameLogProps) {
  const displayEntries = entries.slice(-maxEntries);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>آخر الأحداث</Text>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {displayEntries.map((entry) => (
          <View key={entry.id} style={styles.entry}>
            <Text style={[styles.message, { color: typeColors[entry.type] || COLORS.textSecondary }]}>
              {entry.message}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    margin: 16,
    maxHeight: 150,
  },
  title: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  scrollView: {
    maxHeight: 100,
  },
  content: {
    gap: 4,
  },
  entry: {
    paddingVertical: 2,
  },
  message: {
    fontSize: 13,
    textAlign: 'right',
  },
});
