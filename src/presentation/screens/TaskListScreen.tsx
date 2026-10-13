import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, IconButton, Snackbar, Text } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { formatDate, formatToday } from '../../core/utils/dateUtils';
import { priorityLabels } from '../../core/constants/priorities';
import { palette } from '../../core/theme/theme';
import { appLogger } from '../../core/utils/appLogger';
import BottomChipBar from '../components/BottomChipBar';
import EmptyState from '../components/EmptyState';
import FilterBar from '../components/FilterBar';
import LoadingView from '../components/LoadingView';
import TaskItem from '../components/TaskItem';
import type { Task } from '../../domain/entities/Task';
import type { AppStackParamList } from '../navigation/AppStack';
import { useAuthStore } from '../store/authStore';
import {
  selectVisibleTasks,
  useTaskStore,
} from '../store/taskStore';

type Props = NativeStackScreenProps<AppStackParamList, 'Tasks'>;

// Adjust to match your task model if completed tasks use a different value.
const isDone = (task: Task): boolean => task.isCompleted;

export default function TaskListScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const tasks = useTaskStore((state) => state.tasks);
  const priorityFilter = useTaskStore((state) => state.priorityFilter);
  const statusFilter = useTaskStore((state) => state.statusFilter);
  const isLoading = useTaskStore((state) => state.isLoading);
  const loadedUserId = useTaskStore((state) => state.loadedUserId);
  const fetchTasks = useTaskStore((state) => state.fetchTasks);
  const deleteTask = useTaskStore((state) => state.deleteTask);
  const toggleTaskStatus = useTaskStore((state) => state.toggleTaskStatus);
  const setPriorityFilter = useTaskStore((state) => state.setPriorityFilter);
  const setStatusFilter = useTaskStore((state) => state.setStatusFilter);
  const resetFilters = useTaskStore((state) => state.resetFilters);
  const storeError = useTaskStore((state) => state.error);
  const clearTaskError = useTaskStore((state) => state.clearError);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? null;
  const waitingForTasks = user != null && loadedUserId !== user.id;
  const showTaskSkeleton = (isLoading || waitingForTasks) && tasks.length === 0;

  const visibleTasks = useMemo(
    () => selectVisibleTasks(tasks, priorityFilter, statusFilter),
    [tasks, priorityFilter, statusFilter],
  );

  const doneCount = useMemo(() => tasks.filter(isDone).length, [tasks]);
  const remaining = tasks.length - doneCount;
  const progress = tasks.length > 0 ? doneCount / tasks.length : 0;

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      void fetchTasks(user.id, { silent: true });
    }, [fetchTasks, user]),
  );

  useEffect(() => {
    if (storeError) setMessage(storeError);
  }, [storeError]);

  const refresh = async () => {
    appLogger.action('button.refreshTasks');
    if (!user) return;
    setRefreshing(true);
    await fetchTasks(user.id, { silent: true });
    setRefreshing(false);
  };

  const handleToggle = async (taskId: string) => {
    appLogger.action('button.toggleTask');
    if (!user) return;

    try {
      await toggleTaskStatus(user.id, taskId);
    } catch {
      appLogger.action('taskList.toggleFailed');
      setMessage('Could not update that task. Please try again.');
    }
  };

  const handleDelete = (taskId: string, title: string) => {
    appLogger.action('button.deleteTask');
    Alert.alert(
      'Delete task?',
      `“${title}” will be permanently removed.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => appLogger.action('button.cancelDeleteTask'),
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            appLogger.action('button.confirmDeleteTask');
            if (!user) return;
            void deleteTask(user.id, taskId).catch(() => {
              appLogger.action('taskList.deleteFailed');
              setMessage('Could not delete that task. Please try again.');
            });
          },
        },
      ],
    );
  };

  const handleLogout = () => {
    appLogger.action('button.logout');
    Alert.alert('Log out?', 'You can sign back in any time.', [
      {
        text: 'Cancel',
        style: 'cancel',
        onPress: () => appLogger.action('button.cancelLogout'),
      },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: () => {
          appLogger.action('button.confirmLogout');
          void logout().catch((error) => {
            appLogger.failure('auth.logout', error);
            setMessage('Could not log out. Please try again.');
          });
        },
      },
    ]);
  };

  const filtersAreActive = priorityFilter !== 'all' || statusFilter !== 'all';
  const allDone = tasks.length > 0 && remaining === 0;

  const listHeader = (
    <View>
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <View style={styles.flex}>
          <Text style={styles.today}>Today, {formatToday()}</Text>
          <Text style={styles.heading}>My tasks</Text>
        </View>
        <IconButton
          icon="logout"
          iconColor={palette.ink}
          size={20}
          onPress={handleLogout}
          accessibilityLabel="Log out"
          style={styles.logoutButton}
        />
      </View>

      {tasks.length > 0 ? (
        <View style={styles.card}>
          <View style={styles.cardTop}>
            <View>
              <Text style={styles.cardLabel}>Progress</Text>
              <Text style={styles.cardCount}>
                {doneCount}
                <Text style={styles.cardTotal}>/{tasks.length}</Text>
              </Text>
            </View>
            <View style={styles.chip}>
              <Text style={styles.chipText}>{allDone ? 'All done' : `${remaining} left`}</Text>
            </View>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
        </View>
      ) : null}

      <FilterBar
        priorityFilter={priorityFilter}
        statusFilter={statusFilter}
        onPriorityChange={setPriorityFilter}
        onStatusChange={setStatusFilter}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <FlatList
        data={visibleTasks}
        keyExtractor={(task) => task.id}
        ListHeaderComponent={listHeader}
        renderItem={({ item }) => (
          <TaskItem
            task={item}
            onPress={() => {
              appLogger.action('button.viewTask');
              setSelectedTaskId(item.id);
            }}
            onToggle={() => void handleToggle(item.id)}
            onDelete={() => handleDelete(item.id, item.title)}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void refresh()}
            tintColor={palette.orange}
            colors={[palette.orange]}
            progressViewOffset={insets.top}
          />
        }
        ListEmptyComponent={
          showTaskSkeleton ? (
            <LoadingView />
          ) : (
            <EmptyState
              filtered={filtersAreActive || tasks.length > 0}
              onClearFilters={resetFilters}
              onAddTask={() => {
                appLogger.action('button.addTaskFromEmptyState');
                navigation.navigate('TaskForm', { taskId: null });
              }}
            />
          )
        }
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />

      <BottomChipBar
        active="tasks"
        onTasksPress={() => appLogger.action('button.openTasks')}
        onNewTaskPress={() => {
          appLogger.action('button.addTask');
          navigation.navigate('TaskForm', { taskId: null });
        }}
      />

      <Modal
        visible={Boolean(selectedTask)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedTaskId(null)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => {
            appLogger.action('button.dismissTaskDetails');
            setSelectedTaskId(null);
          }}
        >
          <Pressable style={styles.modalCard} onPress={() => undefined}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleWrap}>
                <Text style={styles.modalEyebrow}>Task details</Text>
                <Text style={styles.modalTitle}>{selectedTask?.title}</Text>
              </View>
              <IconButton
                icon="close"
                iconColor={palette.ink}
                size={20}
                onPress={() => {
                  appLogger.action('button.dismissTaskDetails');
                  setSelectedTaskId(null);
                }}
                accessibilityLabel="Close task details"
                style={styles.modalClose}
              />
            </View>

            <View style={styles.modalStatusRow}>
              <Text style={styles.modalLabel}>Status</Text>
              <Text style={styles.modalValue}>
                {selectedTask?.isCompleted ? 'Completed' : 'Incomplete'}
              </Text>
            </View>
            <View style={styles.modalStatusRow}>
              <Text style={styles.modalLabel}>Priority</Text>
              <Text style={styles.modalValue}>
                {selectedTask ? priorityLabels[selectedTask.priority] : ''}
              </Text>
            </View>
            <View style={styles.modalStatusRow}>
              <Text style={styles.modalLabel}>Due date</Text>
              <Text style={styles.modalValue}>
                {selectedTask ? formatDate(selectedTask.dueDate) : ''}
              </Text>
            </View>

            <Text style={styles.modalSectionLabel}>Description</Text>
            <Text style={styles.modalDescription}>
              {selectedTask?.description || 'No description added.'}
            </Text>

            <View style={styles.modalActions}>
              <Button
                mode="outlined"
                onPress={() => setSelectedTaskId(null)}
                style={styles.modalAction}
              >
                Close
              </Button>
              <Button
                mode="contained"
                onPress={() => {
                  if (!selectedTask) return;
                  appLogger.action('button.editTask');
                  const taskId = selectedTask.id;
                  setSelectedTaskId(null);
                  navigation.navigate('TaskForm', { taskId });
                }}
                style={[styles.modalAction, styles.modalEditAction]}
              >
                Edit task
              </Button>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Snackbar
        visible={Boolean(message)}
        onDismiss={() => {
          appLogger.action('button.dismissMessage');
          setMessage('');
          clearTaskError();
        }}
        duration={4500}
      >
        {message}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: palette.mist },
  flex: { flex: 1 },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  today: { color: palette.ink, opacity: 0.7, fontSize: 13, fontWeight: '600' },
  heading: { marginTop: 2, color: palette.ink, fontSize: 32, fontWeight: '800', lineHeight: 38 },
  logoutButton: {
    margin: 0,
    backgroundColor: palette.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.slate,
  },

  card: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 20,
    borderRadius: 24,
    backgroundColor: palette.ink,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardLabel: { color: palette.slate, fontSize: 13, fontWeight: '600' },
  cardCount: { marginTop: 2, color: '#FFFFFF', fontSize: 40, fontWeight: '800', lineHeight: 46 },
  cardTotal: { color: palette.slate, fontSize: 22, fontWeight: '700' },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,155,81,0.22)',
  },
  chipText: { color: palette.orange, fontSize: 12, fontWeight: '700' },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: 'rgba(191,201,209,0.35)',
  },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: palette.orange },

  listContent: { flexGrow: 1, paddingBottom: 20 },

  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(15, 25, 32, 0.58)',
  },
  modalCard: {
    padding: 22,
    borderRadius: 26,
    backgroundColor: palette.white,
    elevation: 8,
    shadowColor: palette.ink,
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  modalHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  modalTitleWrap: { flex: 1, paddingRight: 8 },
  modalEyebrow: { color: palette.orange, fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  modalTitle: { marginTop: 4, color: palette.ink, fontSize: 24, fontWeight: '800', lineHeight: 30 },
  modalClose: { margin: -8, marginRight: -10 },
  modalStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.slate,
  },
  modalLabel: { color: palette.ink, fontSize: 14, opacity: 0.64 },
  modalValue: { color: palette.ink, fontSize: 14, fontWeight: '800' },
  modalSectionLabel: { marginTop: 20, color: palette.ink, fontSize: 13, fontWeight: '800' },
  modalDescription: { marginTop: 6, color: palette.ink, fontSize: 15, lineHeight: 22, opacity: 0.78 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 24 },
  modalAction: { flex: 1, borderRadius: 12 },
  modalEditAction: { backgroundColor: palette.orange },
});
