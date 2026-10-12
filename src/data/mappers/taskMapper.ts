import { Timestamp as FirestoreTimestamp } from 'firebase/firestore';
import type { DocumentData, DocumentSnapshot, Timestamp } from 'firebase/firestore';
import { priorities, type Priority } from '../../core/constants/priorities';
import type { CreateTaskInput, Task, UpdateTaskInput } from '../../domain/entities/Task';

export interface FirestoreTaskData {
  title: string;
  description: string;
  dueDate: Timestamp;
  priority: Priority;
  isCompleted: boolean;
  createdAt: Timestamp;
}

const toDate = (value: unknown): Date => {
  if (value instanceof FirestoreTimestamp) return value.toDate();
  if (value instanceof Date) return value;
  return new Date();
};

const toPriority = (value: unknown): Priority => {
  const candidate = typeof value === 'string' ? value : '';
  return priorities.includes(candidate as Priority) ? (candidate as Priority) : 'medium';
};

export const taskFromSnapshot = (
  snapshot: DocumentSnapshot<DocumentData>,
): Task | null => {
  const data = snapshot.data();
  if (!data) return null;

  return {
    id: snapshot.id,
    title: typeof data.title === 'string' ? data.title : '',
    description: typeof data.description === 'string' ? data.description : '',
    dueDate: toDate(data.dueDate),
    priority: toPriority(data.priority),
    isCompleted: data.isCompleted === true,
    createdAt: toDate(data.createdAt),
  };
};

export const taskToFirestoreData = (
  task: CreateTaskInput & Pick<Task, 'createdAt'>,
): FirestoreTaskData => ({
  title: task.title,
  description: task.description,
  dueDate: FirestoreTimestamp.fromDate(task.dueDate),
  priority: task.priority,
  isCompleted: task.isCompleted,
  createdAt: FirestoreTimestamp.fromDate(task.createdAt),
});

export const taskUpdateToFirestoreData = (
  changes: UpdateTaskInput,
): Partial<FirestoreTaskData> => {
  const data: Partial<FirestoreTaskData> = {};

  if (changes.title !== undefined) data.title = changes.title;
  if (changes.description !== undefined) data.description = changes.description;
  if (changes.dueDate !== undefined) {
    data.dueDate = FirestoreTimestamp.fromDate(changes.dueDate);
  }
  if (changes.priority !== undefined) data.priority = changes.priority;
  if (changes.isCompleted !== undefined) data.isCompleted = changes.isCompleted;

  return data;
};

export const taskMapper = {
  fromSnapshot: taskFromSnapshot,
  toFirestoreData: taskToFirestoreData,
  updateToFirestoreData: taskUpdateToFirestoreData,
};
