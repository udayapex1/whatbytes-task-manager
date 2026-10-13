import { ScrollView, StyleSheet, View } from 'react-native';
import { Chip, Text } from 'react-native-paper';
import { priorityLabels, priorities, type Priority } from '../../core/constants/priorities';
import { appLogger } from '../../core/utils/appLogger';
import type { PriorityFilter, StatusFilter } from '../store/taskStore';

interface Props {
  priorityFilter: PriorityFilter;
  statusFilter: StatusFilter;
  onPriorityChange: (filter: PriorityFilter) => void;
  onStatusChange: (filter: StatusFilter) => void;
}

const statusOptions: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'completed', label: 'Completed' },
  { value: 'incomplete', label: 'Incomplete' },
];

const chipStyle = (selected: boolean) => [styles.chip, selected && styles.selectedChip];

export default function FilterBar({
  priorityFilter,
  statusFilter,
  onPriorityChange,
  onStatusChange,
}: Props) {
  return (
    <View style={styles.container}>
      <Text variant="labelMedium" style={styles.label}>Priority</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        <Chip
          compact
          selected={priorityFilter === 'all'}
          onPress={() => {
            appLogger.action('button.filterPriorityAll');
            onPriorityChange('all');
          }}
          style={chipStyle(priorityFilter === 'all')}
        >
          All
        </Chip>
        {priorities.map((priority: Priority) => (
          <Chip
            key={priority}
            compact
            selected={priorityFilter === priority}
            onPress={() => {
            appLogger.action('button.filterPriority', { filter: priority });
              onPriorityChange(priority);
            }}
            style={chipStyle(priorityFilter === priority)}
          >
            {priorityLabels[priority]}
          </Chip>
        ))}
      </ScrollView>

      <Text variant="labelMedium" style={[styles.label, styles.statusLabel]}>Status</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {statusOptions.map((option) => (
          <Chip
            key={option.value}
            compact
            selected={statusFilter === option.value}
            onPress={() => {
              appLogger.action('button.filterStatus', { filter: option.value });
              onStatusChange(option.value);
            }}
            style={chipStyle(statusFilter === option.value)}
          >
            {option.label}
          </Chip>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 },
  label: { marginBottom: 6, color: '#73788D', fontWeight: '800' },
  statusLabel: { marginTop: 10 },
  row: { gap: 8, paddingRight: 16 },
  chip: { borderRadius: 10, backgroundColor: '#EEF0F6' },
  selectedChip: { backgroundColor: '#E8E6FF' },
});
