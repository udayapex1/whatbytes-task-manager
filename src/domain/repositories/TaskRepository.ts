import type {
  CreateTaskInput,
  Task,
  UpdateTaskInput,
} from '../entities/Task';

export interface TaskRepository {
  getTasks(userId: string): Promise<Task[]>;
  createTask(userId: string, task: CreateTaskInput): Promise<Task>;
  updateTask(userId: string, taskId: string, changes: UpdateTaskInput): Promise<void>;
  deleteTask(userId: string, taskId: string): Promise<void>;
  toggleTaskStatus(userId: string, taskId: string, isCompleted: boolean): Promise<void>;
}
