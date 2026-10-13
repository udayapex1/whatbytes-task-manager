import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Button,
  HelperText,
  IconButton,
  Snackbar,
  Text,
  TextInput,
} from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { priorityLabels, priorities, type Priority } from '../../core/constants/priorities';
import { formatDate } from '../../core/utils/dateUtils';
import { palette } from '../../core/theme/theme';
import { appLogger } from '../../core/utils/appLogger';
import BottomChipBar from '../components/BottomChipBar';
import type { AppStackParamList } from '../navigation/AppStack';
import { useAuthStore } from '../store/authStore';
import { useTaskStore } from '../store/taskStore';

type Props = NativeStackScreenProps<AppStackParamList, 'TaskForm'>;

const PRIORITY_DOT: Record<string, string> = {
  low: palette.slate,
  medium: palette.orange,
  high: palette.ink,
};

const isTimeoutError = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  error.code === 'app/timeout';

export default function TaskFormScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const taskId = route.params?.taskId ?? null;
  const user = useAuthStore((state) => state.user);
  const tasks = useTaskStore((state) => state.tasks);
  const isSaving = useTaskStore((state) => state.isSaving);
  const createTask = useTaskStore((state) => state.createTask);
  const updateTask = useTaskStore((state) => state.updateTask);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(() => new Date());
  const [priority, setPriority] = useState<Priority>('medium');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [titleError, setTitleError] = useState('');
  const [error, setError] = useState('');

  const returnToTasks = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Tasks');
    }
  };

  const existingTask = taskId ? tasks.find((task) => task.id === taskId) : undefined;
  const isEditing = Boolean(taskId);

  useEffect(() => {
    if (taskId) return;

    setTitle('');
    setDescription('');
    setDueDate(new Date());
    setPriority('medium');
    setTitleError('');
    setError('');
  }, [taskId]);

  useEffect(() => {
    if (!existingTask) return;

    setTitle(existingTask.title);
    setDescription(existingTask.description);
    setDueDate(existingTask.dueDate);
    setPriority(existingTask.priority);
  }, [existingTask?.id]);

  const handleDateChange = (event: { type?: string }, selectedDate?: Date) => {
    if (event.type === 'dismissed' || !selectedDate) {
      if (Platform.OS !== 'ios') setShowDatePicker(false);
      return;
    }

    appLogger.action('taskForm.dateChanged', { selected: true });
    setDueDate(selectedDate);
    if (Platform.OS !== 'ios') setShowDatePicker(false);
  };

  const handleDateDismiss = () => {
    appLogger.action('taskForm.dateDismissed');
    if (Platform.OS !== 'ios') setShowDatePicker(false);
  };

  const save = async () => {
    appLogger.action(isEditing ? 'button.saveTaskChanges' : 'button.createTask');
    const nextTitleError = title.trim() ? '' : 'Title is required.';
    setTitleError(nextTitleError);

    if (nextTitleError || !user) {
      if (!user) {
        appLogger.action('taskForm.saveBlocked', { signedIn: false });
        setError('You need to be signed in to save a task.');
      } else {
        appLogger.action('taskForm.validationFailed', { title: true });
      }
      return;
    }

    setError('');

    try {
      if (isEditing && taskId) {
        await updateTask(user.id, taskId, {
          title: title.trim(),
          description: description.trim(),
          dueDate,
          priority,
        });
      } else {
        await createTask(user.id, {
          title: title.trim(),
          description: description.trim(),
          dueDate,
          priority,
          isCompleted: false,
        });
      }

      appLogger.success(isEditing ? 'taskForm.update' : 'taskForm.create');
      returnToTasks();
    } catch (error) {
      appLogger.failure(isEditing ? 'taskForm.update' : 'taskForm.create', error);

      // A Firestore write can be accepted by the backend while the client
      // request itself times out. Return to the list so it can reconcile from
      // Firestore when the screen regains focus instead of trapping the user
      // on the form.
      if (isTimeoutError(error)) {
        appLogger.action('taskForm.saveTimedOut');
        returnToTasks();
        return;
      }

      setError('Could not save your task. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <IconButton
          icon="arrow-left"
          iconColor={palette.white}
          size={22}
          onPress={() => {
            appLogger.action('button.backFromTaskForm');
            returnToTasks();
          }}
          accessibilityLabel="Go back"
          style={styles.backButton}
        />
        <Text style={styles.title}>{isEditing ? 'Edit task' : 'New task'}</Text>
        <Text style={styles.subtitle}>
          {isEditing ? 'Update the details below.' : 'Add what needs to get done.'}
        </Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {isEditing && !existingTask ? (
            <Text style={styles.notFound}>That task could not be found.</Text>
          ) : null}

          <TextInput
            label="Title"
            mode="outlined"
            value={title}
            onChangeText={(value) => {
              setTitle(value);
              if (titleError) setTitleError('');
            }}
            error={Boolean(titleError)}
            style={styles.input}
            outlineStyle={styles.inputOutline}
            outlineColor={palette.slate}
            activeOutlineColor={palette.orange}
            autoFocus={!isEditing}
          />
          <HelperText type="error" visible={Boolean(titleError)}>{titleError}</HelperText>

          <TextInput
            label="Description"
            mode="outlined"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            style={[styles.input, styles.descriptionInput]}
            outlineStyle={styles.inputOutline}
            outlineColor={palette.slate}
            activeOutlineColor={palette.orange}
          />

          <Text style={styles.fieldLabel}>Due date</Text>
          <Pressable
            onPress={() => {
              appLogger.action('button.openDatePicker');
              setShowDatePicker(true);
            }}
            style={styles.dateField}
            accessibilityRole="button"
            accessibilityLabel="Choose due date"
          >
            <IconButton icon="calendar-blank-outline" size={20} iconColor={palette.ink} style={styles.dateIcon} />
            <Text style={styles.dateText}>{formatDate(dueDate)}</Text>
            <IconButton icon="chevron-down" size={20} iconColor={palette.ink} style={styles.dateIcon} />
          </Pressable>
          {showDatePicker ? (
            <DateTimePicker
              value={dueDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={handleDateChange}
              onDismiss={handleDateDismiss}
              minimumDate={new Date(2000, 0, 1)}
            />
          ) : null}

          <Text style={styles.fieldLabel}>Priority</Text>
          <View style={styles.priorityRow}>
            {priorities.map((value) => {
              const selected = value === priority;
              return (
                <Pressable
                  key={value}
                  onPress={() => {
                    appLogger.action('button.changePriority', { priority: value });
                    setPriority(value);
                  }}
                  style={[styles.priorityChip, selected && styles.priorityChipSelected]}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                >
                  <View
                    style={[
                      styles.priorityDot,
                      { backgroundColor: PRIORITY_DOT[value] ?? palette.slate },
                    ]}
                  />
                  <Text style={[styles.priorityText, selected && styles.priorityTextSelected]}>
                    {priorityLabels[value]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Button
            mode="contained"
            onPress={() => void save()}
            disabled={isSaving || (isEditing && !existingTask)}
            contentStyle={styles.saveContent}
            style={styles.saveButton}
            labelStyle={styles.saveLabel}
          >
            {isSaving ? 'Saving…' : isEditing ? 'Save changes' : 'Create task'}
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomChipBar
        active="taskForm"
        onTasksPress={() => {
          appLogger.action('button.openTasks');
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            navigation.navigate('Tasks');
          }
        }}
        onNewTaskPress={() => {
          appLogger.action('button.openNewTask');
          if (taskId) {
            navigation.navigate('TaskForm', { taskId: null });
          }
        }}
      />

      <Snackbar
        visible={Boolean(error)}
        onDismiss={() => {
          appLogger.action('button.dismissTaskFormError');
          setError('');
        }}
        duration={4500}
      >
        {error}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: palette.mist },
  flex: { flex: 1 },

  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    backgroundColor: palette.ink,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  backButton: {
    alignSelf: 'flex-start',
    margin: 0,
    marginLeft: -4,
    marginBottom: 12,
    backgroundColor: 'rgba(255,155,81,0.22)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,155,81,0.5)',
  },
  title: { color: '#FFFFFF', fontSize: 32, fontWeight: '800', lineHeight: 38 },
  subtitle: { marginTop: 4, color: palette.slate, fontSize: 15, lineHeight: 22 },

  content: { padding: 16, paddingTop: 20, paddingBottom: 32 },
  input: { backgroundColor: palette.white },
  inputOutline: { borderRadius: 14, borderWidth: 1.5 },
  descriptionInput: { minHeight: 112, textAlignVertical: 'top' },

  fieldLabel: { marginTop: 18, marginBottom: 8, color: palette.ink, fontSize: 14, fontWeight: '800' },
  dateField: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: palette.slate,
    backgroundColor: palette.white,
  },
  dateIcon: { margin: 0 },
  dateText: { flex: 1, color: palette.ink, fontSize: 15, fontWeight: '600' },

  priorityRow: { flexDirection: 'row', gap: 10 },
  priorityChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: palette.slate,
    backgroundColor: palette.white,
  },
  priorityChipSelected: { borderColor: palette.orange, backgroundColor: palette.orange },
  priorityDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  priorityText: { color: palette.ink, fontSize: 14, fontWeight: '700' },
  priorityTextSelected: { color: palette.ink },

  saveButton: { marginTop: 28, borderRadius: 16, backgroundColor: palette.orange },
  saveContent: { height: 54 },
  saveLabel: { color: palette.ink, fontSize: 16, fontWeight: '800' },
  notFound: { marginBottom: 16, color: palette.orange },
});
