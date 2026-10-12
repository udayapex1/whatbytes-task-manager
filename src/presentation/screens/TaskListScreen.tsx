import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { FAB, IconButton, Snackbar, Text } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { formatToday } from '../../core/utils/dateUtils';
import EmptyState from '../components/EmptyState';
import FilterBar from '../components/FilterBar';
import LoadingView from '../components/LoadingView';
import TaskItem from '../components/TaskItem';
import type { AppStackParamList } from '../navigation/AppStack';
import { useAuthStore } from '../store/authStore';
import {
  selectVisibleTasks,
  useTaskStore,
} from '../store/taskStore';

type Props = NativeStackScreenProps<AppStackParamList, 'Tasks'>;

export default function TaskListScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const tasks = useTaskStore((state) => state.tasks);
  const priorityFilter = useTaskStore((state) => state.priorityFilter);
  const statusFilter = useTaskStore((state) => state.statusFilter);
  const isLoading = useTaskStore((state) => state.isLoading);
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

  const visibleTasks = useMemo(
    () => selectVisibleTasks(tasks, priorityFilter, statusFilter),
    [tasks, priorityFilter, statusFilter],
  );

  useEffect(() => {
    if (user) void fetchTasks(user.id);
  }, [fetchTasks, user]);

  useEffect(() => {
    if (storeError) setMessage(storeError);
  }, [storeError]);

  const refresh = async () => {
    if (!user) return;
    setRefreshing(true);
    await fetchTasks(user.id);
    setRefreshing(false);
  };

  const handleToggle = async (taskId: string) => {
    if (!user) return;

    try {
      await toggleTaskStatus(user.id, taskId);
    } catch {
      setMessage('Could not update that task. Please try again.');
    }
  };

  const handleDelete = (taskId: string, title: string) => {
    Alert.alert(
      'Delete task?',
      `“${title}” will be permanently removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (!user) return;
            void deleteTask(user.id, taskId).catch(() => {
              setMessage('Could not delete that task. Please try again.');
            });
          },
        },
      ],
    );
  };

  const handleLogout = () => {
    Alert.alert('Log out?', 'You can sign back in any time.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: () => {
          void logout().catch(() => setMessage('Could not log out. Please try again.'));
        },
      },
    ]);
  };

  const filtersAreActive = priorityFilter !== 'all' || statusFilter !== 'all';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View>
          <Text style={styles.today}>Today, {formatToday()}</Text>
          <Text variant="headlineMedium" style={styles.heading}>My tasks</Text>
        </View>
        <IconButton
          icon={() => <Text style={styles.logoutIcon}>⇥</Text>}
          iconColor="#FFFFFF"
          onPress={handleLogout}
          accessibilityLabel="Log out"
          style={styles.logoutButton}
        />
      </View>

      <FilterBar
        priorityFilter={priorityFilter}
        statusFilter={statusFilter}
        onPriorityChange={setPriorityFilter}
        onStatusChange={setStatusFilter}
      />

      {isLoading && tasks.length === 0 ? (
        <LoadingView />
      ) : (
        <FlatList
          data={visibleTasks}
          keyExtractor={(task) => task.id}
          renderItem={({ item }) => (
            <TaskItem
              task={item}
              onPress={() => navigation.navigate('TaskForm', { taskId: item.id })}
              onToggle={() => void handleToggle(item.id)}
              onDelete={() => handleDelete(item.id, item.title)}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor="#6C63FF" />
          }
          ListEmptyComponent={
            <EmptyState
              filtered={filtersAreActive || tasks.length > 0}
              onClearFilters={resetFilters}
              onAddTask={() => navigation.navigate('TaskForm')}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      <FAB
        label="+"
        onPress={() => navigation.navigate('TaskForm')}
        style={[styles.fab, { bottom: insets.bottom + 20 }]}
        color="#FFFFFF"
        customSize={58}
        accessibilityLabel="Add task"
      />

      <Snackbar
        visible={Boolean(message)}
        onDismiss={() => {
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
  safeArea: { flex: 1, backgroundColor: '#F6F7FB' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 22, backgroundColor: '#6C63FF',
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  today: { color: '#DCD9FF', fontSize: 13, fontWeight: '700' },
  heading: { marginTop: 3, color: '#FFFFFF', fontWeight: '800' },
  logoutButton: { margin: 0, backgroundColor: 'rgba(255,255,255,0.16)' },
  logoutIcon: { color: '#FFFFFF', fontSize: 25, fontWeight: '800' },
  listContent: { flexGrow: 1, paddingTop: 10, paddingBottom: 110 },
  fab: { position: 'absolute', alignSelf: 'center', backgroundColor: '#6C63FF', borderRadius: 20 },
});
