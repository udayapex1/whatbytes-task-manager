import { Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, spacing } from '../../core/theme/theme';

type Destination = 'tasks' | 'taskForm';

type Props = {
  active: Destination;
  onTasksPress: () => void;
  onNewTaskPress: () => void;
};

export default function BottomChipBar({ active, onTasksPress, onNewTaskPress }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: spacing.sm + insets.bottom }]}>
      <View style={styles.bar}>
        <NavChip
          active={active === 'tasks'}
          icon="format-list-checks"
          label="Tasks"
          onPress={onTasksPress}
        />
        <NavChip
          active={active === 'taskForm'}
          icon="plus-circle-outline"
          label="New task"
          onPress={onNewTaskPress}
        />
      </View>
    </View>
  );
}

function NavChip({
  active,
  icon,
  label,
  onPress,
}: {
  active: boolean;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, active && styles.activeChip, pressed && styles.pressedChip]}
    >
      <MaterialCommunityIcons
        name={icon}
        size={19}
        color={active ? palette.ink : palette.slate}
      />
      <Text style={[styles.label, active && styles.activeLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    backgroundColor: palette.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.slate,
  },
  bar: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.xs,
    borderRadius: 24,
    backgroundColor: palette.mist,
  },
  chip: {
    flex: 1,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: 20,
  },
  activeChip: { backgroundColor: palette.orange },
  pressedChip: { opacity: 0.75 },
  label: { color: palette.ink, fontSize: 13, fontWeight: '700' },
  activeLabel: { color: palette.ink },
});
