import { Pressable, StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { formatDate, isOverdue } from '../../core/utils/dateUtils';
import { appLogger } from '../../core/utils/appLogger';
import { palette } from '../../core/theme/theme';
import type { Task } from '../../domain/entities/Task';
import PriorityChip from './PriorityChip';

interface Props {
  task: Task;
  onPress: () => void;
  onToggle: () => void;
  onDelete: () => void;
}

export default function TaskItem({ task, onPress, onToggle, onDelete }: Props) {
  const overdue = !task.isCompleted && isOverdue(task.dueDate);

  return (
    <Card
      mode="elevated"
      style={styles.card}
      onPress={() => {
        appLogger.action('button.openTask');
        onPress();
      }}
    >
      <Card.Content style={styles.content}>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: task.isCompleted }}
          accessibilityLabel={`Mark ${task.title} ${task.isCompleted ? 'incomplete' : 'complete'}`}
          onPress={() => {
            appLogger.action('button.toggleTask');
            onToggle();
          }}
          style={[styles.checkbox, task.isCompleted && styles.checked]}
        >
          {task.isCompleted ? <Text style={styles.checkmark}>✓</Text> : null}
        </Pressable>

        <View style={styles.details}>
          <Text
            numberOfLines={1}
            style={[styles.title, task.isCompleted && styles.completedTitle]}
          >
            {task.title}
          </Text>
          {task.description ? (
            <Text numberOfLines={1} style={styles.description}>{task.description}</Text>
          ) : null}
          <Text style={[styles.dueDate, overdue && styles.overdue]}>
            {overdue ? 'Overdue · ' : ''}{formatDate(task.dueDate)}
          </Text>
        </View>

        <View style={styles.trailing}>
          <PriorityChip priority={task.priority} compact />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Delete ${task.title}`}
            onPress={() => {
              appLogger.action('button.deleteTask');
              onDelete();
            }}
            hitSlop={8}
            style={styles.deleteButton}
          >
            <Text style={styles.deleteText}>×</Text>
          </Pressable>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginVertical: 5, borderRadius: 16, backgroundColor: palette.white },
  content: { flexDirection: 'row', alignItems: 'center', minHeight: 76, paddingVertical: 14 },
  checkbox: { alignItems: 'center', justifyContent: 'center', width: 25, height: 25, marginRight: 12, borderWidth: 2, borderColor: palette.slate, borderRadius: 13 },
  checked: { borderColor: palette.orange, backgroundColor: palette.orange },
  checkmark: { color: palette.ink, fontSize: 16, fontWeight: '800', lineHeight: 18 },
  details: { flex: 1, minWidth: 0 },
  title: { color: palette.ink, fontSize: 15, fontWeight: '700' },
  completedTitle: { color: palette.slate, textDecorationLine: 'line-through' },
  description: { marginTop: 3, color: palette.ink, fontSize: 12, opacity: 0.7 },
  dueDate: { marginTop: 5, color: palette.ink, fontSize: 12, opacity: 0.72 },
  overdue: { color: palette.orange, fontWeight: '700', opacity: 1 },
  trailing: { alignItems: 'flex-end', gap: 5, marginLeft: 8 },
  deleteButton: { alignItems: 'center', justifyContent: 'center', width: 24, height: 24 },
  deleteText: { color: palette.slate, fontSize: 25, lineHeight: 24 },
});
