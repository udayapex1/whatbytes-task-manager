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

interface TaskState {
  tasks: Task[];
  priorityFilter: PriorityFilter;
  statusFilter: StatusFilter;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  fetchTasks: (userId: string) => Promise<void>;
  createTask: (userId: string, task: CreateTaskInput) => Promise<Task>;
  updateTask: (userId: string, taskId: string, changes: UpdateTaskInput) => Promise<void>;
  deleteTask: (userId: string, taskId: string) => Promise<void>;
  toggleTaskStatus: (userId: string, taskId: string) => Promise<void>;
  setPriorityFilter: (filter: PriorityFilter) => void;
  setStatusFilter: (filter: StatusFilter) => void;
  resetFilters: () => void;
  getVisibleTasks: () => Task[];
  clearError: () => void;
}

let taskRepository: TaskRepository | null = null;

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

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  priorityFilter: 'all',
  statusFilter: 'all',
  isLoading: false,
  isSaving: false,
  error: null,

  fetchTasks: async (userId) => {
    appLogger.action('tasks.fetch');
    set({ isLoading: true, error: null });

    try {
      const tasks = await getTasksUseCase(getRepository(), userId);
      set({ tasks, isLoading: false });
      appLogger.success('tasks.fetch', { count: tasks.length });
    } catch (error) {
      set({ isLoading: false, error: getErrorMessage(error) });
      appLogger.failure('tasks.fetch', error);
    }
  },

  createTask: async (userId, task) => {
    appLogger.action('tasks.create');
    set({ isSaving: true, error: null });

    try {
      const createdTask = await createTaskUseCase(getRepository(), userId, task);
      set((state) => ({ tasks: [...state.tasks, createdTask], isSaving: false }));
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
    const previousTasks = get().tasks;
    set({ tasks: previousTasks.filter((task) => task.id !== taskId), error: null });

    try {
      await deleteTaskUseCase(getRepository(), userId, taskId);
      appLogger.success('tasks.delete');
    } catch (error) {
      set({ tasks: previousTasks, error: getErrorMessage(error) });
      appLogger.failure('tasks.delete', error);
      throw error;
    }
  },

  toggleTaskStatus: async (userId, taskId) => {
    appLogger.action('tasks.toggleStatus');
    const previousTasks = get().tasks;
    const task = previousTasks.find((item) => item.id === taskId);

    if (!task) return;

    const isCompleted = !task.isCompleted;
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
}));

export const taskStore = useTaskStore;
