import type { TaskRepository } from '../../repositories/TaskRepository';

export const toggleTaskStatus = (
  repository: TaskRepository,
  userId: string,
  taskId: string,
  isCompleted: boolean,
): Promise<void> => repository.toggleTaskStatus(userId, taskId, isCompleted);
