import type { UpdateTaskInput } from '../../entities/Task';
import type { TaskRepository } from '../../repositories/TaskRepository';

export const updateTask = (
  repository: TaskRepository,
  userId: string,
  taskId: string,
  changes: UpdateTaskInput,
): Promise<void> => repository.updateTask(userId, taskId, changes);
