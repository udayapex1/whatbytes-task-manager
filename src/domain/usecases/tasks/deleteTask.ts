import type { TaskRepository } from '../../repositories/TaskRepository';

export const deleteTask = (
  repository: TaskRepository,
  userId: string,
  taskId: string,
): Promise<void> => repository.deleteTask(userId, taskId);
