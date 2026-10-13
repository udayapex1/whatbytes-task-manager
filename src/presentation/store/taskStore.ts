import { create } from 'zustand';
import type { Priority } from '../../core/constants/priorities';
import type {
  CreateTaskInput,
  Task,
  UpdateTaskInput,
} from '../../domain/entities/Task';
import type { TaskRepository } from '../../domain/repositories/TaskRepository';
import { createTask as createTaskUseCase } from '../../domain/usecases/tasks/createTask';
import { deleteTask as deleteTaskUseCase } from '../../domain/usecases/tasks/deleteTask';
import { getTasks as getTasksUseCase } from '../../domain/usecases/tasks/getTasks';
import { toggleTaskStatus as toggleTaskStatusUseCase } from '../../domain/usecases/tasks/toggleTaskStatus';
import { updateTask as updateTaskUseCase } from '../../domain/usecases/tasks/updateTask';
import { appLogger } from '../../core/utils/appLogger';

export type PriorityFilter = 'all' | Priority;
export type StatusFilter = 'all' | 'completed' | 'incomplete';

interface FetchTasksOptions {
  silent?: boolean;
}

interface TaskState {
  tasks: Task[];
  loadedUserId: string | null;
  priorityFilter: PriorityFilter;
  statusFilter: StatusFilter;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  fetchTasks: (userId: string, options?: FetchTasksOptions) => Promise<void>;
  createTask: (userId: string, task: CreateTaskInput) => Promise<Task>;
  updateTask: (userId: string, taskId: string, changes: UpdateTaskInput) => Promise<void>;
  deleteTask: (userId: string, taskId: string) => Promise<void>;
  toggleTaskStatus: (userId: string, taskId: string) => Promise<void>;
  setPriorityFilter: (filter: PriorityFilter) => void;
  setStatusFilter: (filter: StatusFilter) => void;
  resetFilters: () => void;
  getVisibleTasks: () => Task[];
  clearError: () => void;
  reset: () => void;
}

let taskRepository: TaskRepository | null = null;
let latestFetchRequest = 0;
let mutationGeneration = 0;

const noteMutation = () => {
  mutationGeneration += 1;
};

export const configureTaskStore = (repository: TaskRepository): void => {
  taskRepository = repository;
};

const getRepository = (): TaskRepository => {
  if (!taskRepository) {
    throw new Error('Task store has not been configured.');
  }

  return taskRepository;
};

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Something went wrong. Please try again.';

const isTimeoutError = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  error.code === 'app/timeout';

export const selectVisibleTasks = (
  tasks: Task[],
  priorityFilter: PriorityFilter,
  statusFilter: StatusFilter,
): Task[] =>
  tasks
    .filter((task) => priorityFilter === 'all' || task.priority === priorityFilter)
    .filter((task) => {
      if (statusFilter === 'completed') return task.isCompleted;
      if (statusFilter === 'incomplete') return !task.isCompleted;
      return true;
    })
    .sort((firstTask, secondTask) =>
      firstTask.dueDate.getTime() - secondTask.dueDate.getTime(),
    );

const emptyFilters = {
  priorityFilter: 'all' as PriorityFilter,
  statusFilter: 'all' as StatusFilter,
};

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  loadedUserId: null,
  priorityFilter: 'all',
  statusFilter: 'all',
  isLoading: false,
  isSaving: false,
  error: null,

  fetchTasks: async (userId, options) => {
    appLogger.action('tasks.fetch');
    const requestId = ++latestFetchRequest;
    const generationAtStart = mutationGeneration;
    const isFirstLoad = get().loadedUserId !== userId;
    const showLoading = isFirstLoad || !options?.silent;

    if (isFirstLoad) {
      set({ tasks: [], isLoading: true, error: null, loadedUserId: userId });
    } else if (showLoading) {
      set({ isLoading: true, error: null });
    } else {
      set({ error: null });
    }

    try {
      const tasks = await getTasksUseCase(getRepository(), userId);

      // Focus refreshes and pull-to-refresh can overlap. Only the latest
      // request is allowed to replace the store, preventing stale responses
      // from bringing deleted or older tasks back into the list.
      if (requestId !== latestFetchRequest) return;

      // A create/update/delete/toggle happened while this read was in flight.
      // Keep the local list instead of rolling the UI back to stale server data.
      if (generationAtStart !== mutationGeneration) {
        set({ isLoading: false, loadedUserId: userId });
        return;
      }

      set({ tasks, isLoading: false, loadedUserId: userId });
      appLogger.success('tasks.fetch', { count: tasks.length });
    } catch (error) {
      if (requestId === latestFetchRequest) {
        set({ isLoading: false, error: getErrorMessage(error) });
      }
      appLogger.failure('tasks.fetch', error);
    }
  },

  createTask: async (userId, task) => {
    appLogger.action('tasks.create');
    set({ isSaving: true, error: null });

    try {
      const createdTask = await createTaskUseCase(getRepository(), userId, task);
      noteMutation();
      set((state) => ({
        tasks: [...state.tasks, createdTask],
        isSaving: false,
        loadedUserId: userId,
      }));
      appLogger.success('tasks.create');
      return createdTask;
    } catch (error) {
      set({ isSaving: false, error: getErrorMessage(error) });
      appLogger.failure('tasks.create', error);
      throw error;
    }
  },

  updateTask: async (userId, taskId, changes) => {
    appLogger.action('tasks.update');
    set({ isSaving: true, error: null });

    try {
      await updateTaskUseCase(getRepository(), userId, taskId, changes);
      noteMutation();
      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === taskId ? { ...task, ...changes } : task,
        ),
        isSaving: false,
      }));
      appLogger.success('tasks.update');
    } catch (error) {
      set({ isSaving: false, error: getErrorMessage(error) });
      appLogger.failure('tasks.update', error);
      throw error;
    }
  },

  deleteTask: async (userId, taskId) => {
    appLogger.action('tasks.delete');
    const task = get().tasks.find((item) => item.id === taskId);
    if (!task) return;

    noteMutation();
    set((state) => ({
      tasks: state.tasks.filter((item) => item.id !== taskId),
      error: null,
    }));

    try {
      await deleteTaskUseCase(getRepository(), userId, taskId);
      appLogger.success('tasks.delete');
    } catch (error) {
      appLogger.failure('tasks.delete', error);

      // The Firestore request may have reached the backend even when the
      // client-side timeout fires. Keep the optimistic removal in that case;
      // restoring the task makes it appear undeleted until the next refresh.
      if (isTimeoutError(error)) return;

      set((state) => ({
        tasks: state.tasks.some((item) => item.id === taskId)
          ? state.tasks
          : [...state.tasks, task],
        error: getErrorMessage(error),
      }));
      throw error;
    }
  },

  toggleTaskStatus: async (userId, taskId) => {
    appLogger.action('tasks.toggleStatus');
    const previousTasks = get().tasks;
    const task = previousTasks.find((item) => item.id === taskId);

    if (!task) return;

    const isCompleted = !task.isCompleted;
    noteMutation();
    set({
      tasks: previousTasks.map((item) =>
        item.id === taskId ? { ...item, isCompleted } : item,
      ),
      error: null,
    });

    try {
      await toggleTaskStatusUseCase(getRepository(), userId, taskId, isCompleted);
      appLogger.success('tasks.toggleStatus', { completed: isCompleted });
    } catch (error) {
      set({ tasks: previousTasks, error: getErrorMessage(error) });
      appLogger.failure('tasks.toggleStatus', error);
      throw error;
    }
  },

  setPriorityFilter: (priorityFilter) => set({ priorityFilter }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  resetFilters: () => set({ priorityFilter: 'all', statusFilter: 'all' }),
  getVisibleTasks: () => {
    const { tasks, priorityFilter, statusFilter } = get();
    return selectVisibleTasks(tasks, priorityFilter, statusFilter);
  },
  clearError: () => set({ error: null }),
  reset: () => {
    latestFetchRequest += 1;
    mutationGeneration += 1;
    set({
      tasks: [],
      loadedUserId: null,
      isLoading: false,
      isSaving: false,
      error: null,
      ...emptyFilters,
    });
  },
}));

export const taskStore = useTaskStore;
