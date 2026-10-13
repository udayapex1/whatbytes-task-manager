import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { palette } from '../../core/theme/theme';

export type TaskFlowAlertAction = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
};

interface Props {
  visible: boolean;
  title: string;
  message: string;
  actions: TaskFlowAlertAction[];
  onDismiss: () => void;
}

export default function TaskFlowAlert({
  visible,
  title,
  message,
  actions,
  onDismiss,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <Pressable
          style={styles.card}
          onPress={() => undefined}
          accessibilityRole="alert"
          accessibilityViewIsModal
        >
          <View style={styles.accent} />
          <Text style={styles.eyebrow}>TaskFlow</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.actions}>
            {actions.map((action) => (
              <Pressable
                key={action.label}
                accessibilityRole="button"
                onPress={action.onPress}
                style={[
                  styles.action,
                  action.variant === 'primary' && styles.primaryAction,
                  action.variant === 'danger' && styles.dangerAction,
                ]}
              >
                <Text
                  style={[
                    styles.actionLabel,
                    action.variant === 'primary' && styles.primaryLabel,
                  ]}
                >
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: 22,
    backgroundColor: 'rgba(15, 25, 32, 0.62)',
  },
  card: {
    overflow: 'hidden',
    padding: 22,
    borderRadius: 26,
    backgroundColor: palette.white,
    elevation: 10,
    shadowColor: palette.ink,
    shadowOpacity: 0.24,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  accent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: palette.orange,
  },
  eyebrow: {
    marginTop: 4,
    color: palette.orange,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    marginTop: 5,
    color: palette.ink,
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 30,
  },
  message: {
    marginTop: 10,
    color: palette.ink,
    fontSize: 15,
    lineHeight: 22,
    opacity: 0.78,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 24,
  },
  action: {
    minHeight: 46,
    flexGrow: 1,
    flexBasis: 120,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: palette.slate,
    backgroundColor: palette.white,
  },
  primaryAction: {
    borderColor: palette.orange,
    backgroundColor: palette.orange,
  },
  dangerAction: {
    borderColor: palette.orange,
    backgroundColor: 'rgba(255, 155, 81, 0.12)',
  },
  actionLabel: {
    color: palette.ink,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  primaryLabel: { color: palette.ink },
});
