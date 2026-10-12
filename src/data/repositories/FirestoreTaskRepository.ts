import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../../core/firebase/firebaseConfig';
import type {
  CreateTaskInput,
  Task,
  UpdateTaskInput,
} from '../../domain/entities/Task';
import type { TaskRepository } from '../../domain/repositories/TaskRepository';
import {
  taskFromSnapshot,
  taskToFirestoreData,
  taskUpdateToFirestoreData,
} from '../mappers/taskMapper';

const tasksCollection = (userId: string) =>
  collection(db, 'users', userId, 'tasks');

export class FirestoreTaskRepository implements TaskRepository {
  async getTasks(userId: string): Promise<Task[]> {
    const snapshot = await getDocs(tasksCollection(userId));

    return snapshot.docs
      .map(taskFromSnapshot)
      .filter((task): task is Task => task !== null);
  }

  async createTask(userId: string, task: CreateTaskInput): Promise<Task> {
    const createdAt = new Date();
    const reference = await addDoc(
      tasksCollection(userId),
      taskToFirestoreData({ ...task, createdAt }),
    );

    return { ...task, id: reference.id, createdAt };
  }

  async updateTask(
    userId: string,
    taskId: string,
    changes: UpdateTaskInput,
  ): Promise<void> {
    const data = taskUpdateToFirestoreData(changes);
    if (Object.keys(data).length === 0) return;

    await updateDoc(doc(db, 'users', userId, 'tasks', taskId), data);
  }

  async deleteTask(userId: string, taskId: string): Promise<void> {
    await deleteDoc(doc(db, 'users', userId, 'tasks', taskId));
  }

  async toggleTaskStatus(
    userId: string,
    taskId: string,
    isCompleted: boolean,
  ): Promise<void> {
    await updateDoc(doc(db, 'users', userId, 'tasks', taskId), { isCompleted });
  }
}
