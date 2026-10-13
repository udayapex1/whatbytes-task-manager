import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
  writeBatch,
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
import { appLogger } from '../../core/utils/appLogger';

const tasksCollection = () => collection(db, 'tasks');

const userTasksQuery = (userId: string) =>
  query(tasksCollection(), where('userId', '==', userId));

const legacyTasksCollection = (userId: string) =>
  collection(db, 'users', userId, 'tasks');

const legacyMigrationPromises = new Map<string, Promise<number>>();
const taskReadPromises = new Map<string, Promise<Task[]>>();

const migrateLegacyTasks = (userId: string): Promise<number> => {
  const existingMigration = legacyMigrationPromises.get(userId);
  if (existingMigration) return existingMigration;

  const migration = (async () => {
    const legacySnapshot = await getDocs(legacyTasksCollection(userId));
    const legacyTasks = legacySnapshot.docs
      .map(taskFromSnapshot)
      .filter((task): task is Task => task !== null);

    if (legacyTasks.length === 0) return 0;

    // Firestore batches are limited to 500 writes. Keep a safety margin so
    // this remains safe if migration metadata is added later.
    for (let index = 0; index < legacyTasks.length; index += 400) {
      const batch = writeBatch(db);
      legacyTasks.slice(index, index + 400).forEach((task) => {
        const { id: _legacyId, ...taskData } = task;
        batch.set(
          doc(db, 'tasks', task.id),
          taskToFirestoreData(taskData, userId),
        );
      });
      await batch.commit();
    }

    appLogger.success('firestore.tasks.migration', { count: legacyTasks.length });
    return legacyTasks.length;
  })();

  legacyMigrationPromises.set(userId, migration);
  migration.catch(() => legacyMigrationPromises.delete(userId));
  return migration;
};

const readTasks = async (userId: string): Promise<Task[]> => {
  const snapshot = await getDocs(userTasksQuery(userId));

  // New users and already-migrated users pay for only one read. Legacy data
  // is checked only when the new collection is empty.
  if (snapshot.empty) {
    const migratedCount = await migrateLegacyTasks(userId);
    if (migratedCount > 0) {
      return readTasks(userId);
    }
  }

  return snapshot.docs
    .map(taskFromSnapshot)
    .filter((task): task is Task => task !== null);
};

export class FirestoreTaskRepository implements TaskRepository {
  async getTasks(userId: string): Promise<Task[]> {
    const existingRead = taskReadPromises.get(userId);
    if (existingRead) return existingRead;

    appLogger.action('firestore.tasks.read.request');

    const read = (async () => {
      try {
        const tasks = await readTasks(userId);

        appLogger.success('firestore.tasks.read', { count: tasks.length });
        return tasks;
      } catch (error) {
        appLogger.failure('firestore.tasks.read', error);
        throw error;
      }
    })();

    taskReadPromises.set(userId, read);
    void read.then(() => {
      if (taskReadPromises.get(userId) === read) taskReadPromises.delete(userId);
    }, () => {
      if (taskReadPromises.get(userId) === read) taskReadPromises.delete(userId);
    });
    return read;
  }

  async createTask(userId: string, task: CreateTaskInput): Promise<Task> {
    appLogger.action('firestore.task.create.request');
    const createdAt = new Date();

    try {
      const reference = await addDoc(
        tasksCollection(),
        taskToFirestoreData({ ...task, createdAt }, userId),
      );

      appLogger.success('firestore.task.create');
      return { ...task, id: reference.id, createdAt };
    } catch (error) {
      appLogger.failure('firestore.task.create', error);
      throw error;
    }
  }

  async updateTask(
    userId: string,
    taskId: string,
    changes: UpdateTaskInput,
  ): Promise<void> {
    const data = taskUpdateToFirestoreData(changes);
    if (Object.keys(data).length === 0) return;

    await updateDoc(doc(db, 'tasks', taskId), data);
  }

  async deleteTask(userId: string, taskId: string): Promise<void> {
    appLogger.action('firestore.task.delete.request');

    try {
      await deleteDoc(doc(db, 'tasks', taskId));
      appLogger.success('firestore.task.delete');
    } catch (error) {
      appLogger.failure('firestore.task.delete', error);
      throw error;
    }
  }

  async toggleTaskStatus(
    userId: string,
    taskId: string,
    isCompleted: boolean,
  ): Promise<void> {
    await updateDoc(doc(db, 'tasks', taskId), { isCompleted });
  }
}
