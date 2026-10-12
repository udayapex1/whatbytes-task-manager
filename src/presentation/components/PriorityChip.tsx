import { StyleSheet } from 'react-native';
import { Chip } from 'react-native-paper';
import {
  priorityBackgroundColors,
  priorityColors,
  priorityLabels,
  type Priority,
} from '../../core/constants/priorities';

interface Props {
  priority: Priority;
  compact?: boolean;
}

export default function PriorityChip({ priority, compact = false }: Props) {
  return (
    <Chip
      compact={compact}
      style={[styles.chip, { backgroundColor: priorityBackgroundColors[priority] }]}
      textStyle={[styles.text, { color: priorityColors[priority] }]}
      accessibilityLabel={`${priorityLabels[priority]} priority`}
    >
      {priorityLabels[priority]}
    </Chip>
  );
}

const styles = StyleSheet.create({
  chip: { borderRadius: 8 },
  text: { fontSize: 11, fontWeight: '800' },
});
