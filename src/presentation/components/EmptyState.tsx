import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { appLogger } from '../../core/utils/appLogger';
import { palette } from '../../core/theme/theme';

interface Props {
  filtered: boolean;
  onClearFilters: () => void;
  onAddTask: () => void;
}

export default function EmptyState({ filtered, onClearFilters, onAddTask }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Text style={styles.icon}>{filtered ? '⌕' : '+'}</Text>
      </View>
      <Text variant="titleMedium" style={styles.title}>
        {filtered ? 'No tasks found' : 'No tasks yet'}
      </Text>
      <Text style={styles.message}>
        {filtered
          ? 'Try adjusting your filters to see more tasks.'
          : 'Tap New task to add your first task.'}
      </Text>
      {filtered ? (
        <Button
          mode="text"
          onPress={() => {
            appLogger.action('button.clearFilters');
            onClearFilters();
          }}
        >
          Clear filters
        </Button>
      ) : (
        <Button
          mode="contained"
          onPress={() => {
            appLogger.action('button.addTaskFromEmptyState');
            onAddTask();
          }}
          style={styles.button}
        >
          Add a task
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: 32, minHeight: 280 },
  iconCircle: { alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: 32, backgroundColor: palette.slate },
  icon: { color: palette.ink, fontSize: 32, fontWeight: '700' },
  title: { marginTop: 16, color: palette.ink, fontWeight: '800' },
  message: { marginTop: 8, color: palette.ink, opacity: 0.72, textAlign: 'center' },
  button: { marginTop: 18, borderRadius: 12, backgroundColor: palette.orange },
});
