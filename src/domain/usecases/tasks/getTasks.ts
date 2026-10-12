import type { Task } from '../../entities/Task';
import type { TaskRepository } from '../../repositories/TaskRepository';

export const getTasks = (
  repository: TaskRepository,
  userId: string,
): Promise<Task[]> => repository.getTasks(userId);
