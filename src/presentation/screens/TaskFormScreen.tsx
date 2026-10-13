import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Appbar,
  Button,
  HelperText,
  SegmentedButtons,
  Snackbar,
  Text,
  TextInput,
} from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { priorityLabels, priorities, type Priority } from '../../core/constants/priorities';
import { formatDate } from '../../core/utils/dateUtils';
import { appLogger } from '../../core/utils/appLogger';
import type { AppStackParamList } from '../navigation/AppStack';
import { useAuthStore } from '../store/authStore';
import { useTaskStore } from '../store/taskStore';

type Props = NativeStackScreenProps<AppStackParamList, 'TaskForm'>;

export default function TaskFormScreen({ navigation, route }: Props) {
  const taskId = route.params?.taskId;
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

  const existingTask = taskId ? tasks.find((task) => task.id === taskId) : undefined;
  const isEditing = Boolean(taskId);

  useEffect(() => {
    if (!existingTask) return;

    setTitle(existingTask.title);
    setDescription(existingTask.description);
    setDueDate(existingTask.dueDate);
    setPriority(existingTask.priority);
  }, [existingTask]);

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    appLogger.action('taskForm.dateChanged', { selected: event.type === 'set' });
    setShowDatePicker(Platform.OS === 'ios');
    if (event.type === 'set' && selectedDate) setDueDate(selectedDate);
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
      navigation.goBack();
    } catch (error) {
      appLogger.failure(isEditing ? 'taskForm.update' : 'taskForm.create', error);
      setError('Could not save your task. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Appbar.Header style={styles.appbar}>
        <Appbar.BackAction
          onPress={() => {
            appLogger.action('button.backFromTaskForm');
            navigation.goBack();
          }}
          iconColor="#2D3250"
        />
        <Appbar.Content
          title={isEditing ? 'Edit task' : 'New task'}
          titleStyle={styles.appbarTitle}
        />
      </Appbar.Header>

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
          />

          <Text variant="labelLarge" style={styles.fieldLabel}>Due date</Text>
          <Button
            mode="outlined"
            onPress={() => {
              appLogger.action('button.openDatePicker');
              setShowDatePicker(true);
            }}
            style={styles.dateButton}
            contentStyle={styles.dateContent}
            labelStyle={styles.dateLabel}
          >
            {formatDate(dueDate)}
          </Button>
          {showDatePicker ? (
            <DateTimePicker
              value={dueDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={handleDateChange}
              minimumDate={new Date(2000, 0, 1)}
            />
          ) : null}

          <Text variant="labelLarge" style={styles.fieldLabel}>Priority</Text>
          <SegmentedButtons
            value={priority}
            onValueChange={(value) => {
              if (priorities.includes(value as Priority)) {
                appLogger.action('button.changePriority', { priority: value });
                setPriority(value as Priority);
              }
            }}
            buttons={priorities.map((value) => ({ value, label: priorityLabels[value] }))}
            style={styles.segmented}
          />

          <Button
            mode="contained"
            onPress={() => void save()}
            loading={isSaving}
            disabled={isSaving || (isEditing && !existingTask)}
            contentStyle={styles.saveContent}
            style={styles.saveButton}
          >
            {isEditing ? 'Save changes' : 'Create task'}
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>

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
  safeArea: { flex: 1, backgroundColor: '#F6F7FB' },
  flex: { flex: 1 },
  appbar: { backgroundColor: '#F6F7FB', elevation: 0 },
  appbarTitle: { color: '#2D3250', fontWeight: '800' },
  content: { padding: 16, paddingBottom: 40 },
  input: { marginBottom: 2, backgroundColor: '#FFFFFF' },
  descriptionInput: { minHeight: 112, textAlignVertical: 'top' },
  inputOutline: { borderRadius: 14, borderColor: '#E1E3EC' },
  fieldLabel: { marginTop: 18, marginBottom: 8, color: '#2D3250', fontWeight: '800' },
  dateButton: { borderRadius: 13, borderColor: '#D9DBE7' },
  dateContent: { height: 50, justifyContent: 'flex-start' },
  dateLabel: { marginLeft: 12, color: '#2D3250' },
  segmented: { borderRadius: 13 },
  saveButton: { marginTop: 30, borderRadius: 14 },
  saveContent: { height: 54 },
  notFound: { marginBottom: 16, color: '#D84C4C' },
});
