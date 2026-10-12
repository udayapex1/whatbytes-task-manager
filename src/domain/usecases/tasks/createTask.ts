import type { CreateTaskInput, Task } from '../../entities/Task';
import type { TaskRepository } from '../../repositories/TaskRepository';

export const createTask = (
  repository: TaskRepository,
  userId: string,
  task: CreateTaskInput,
): Promise<Task> => repository.createTask(userId, task);
