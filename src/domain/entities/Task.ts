import type { Priority } from '../../core/constants/priorities';

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  priority: Priority;
  isCompleted: boolean;
  createdAt: Date;
}

export type CreateTaskInput = Omit<Task, 'id' | 'createdAt'>;
export type UpdateTaskInput = Partial<CreateTaskInput>;
