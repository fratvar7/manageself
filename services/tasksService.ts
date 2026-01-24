import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Task, Habit } from '../types';

const TASKS_COLLECTION = 'tasks';
const HABITS_COLLECTION = 'habits';


export class TasksService {



  // Obtener todos los hábitos de un usuario
  static async getHabits(userId: string): Promise<Habit[]> {
    try {
      const habitsQuery = query(
        collection(db, HABITS_COLLECTION),
        where('userId', '==', userId),
        orderBy('title')
      );

      const snapshot = await getDocs(habitsQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Habit[];
    } catch (error) {
      console.error('Error getting habits:', error);
      throw error;
    }
  }

  // Crear nuevo hábito
  static async createHabit(userId: string, habit: Omit<Habit, 'id' | 'userId' | 'createdAt'>): Promise<Habit> {
    try {
      const docRef = await addDoc(collection(db, HABITS_COLLECTION), {
        ...habit,
        userId,
        createdAt: Timestamp.now(),
      });

      const newDoc = await getDoc(docRef);
      return {
        id: docRef.id,
        ...newDoc.data(),
      } as Habit;
    } catch (error) {
      console.error('Error creating habit:', error);
      throw error;
    }
  }

  // Eliminar hábito (solo si no es por defecto)
  static async deleteHabit(habitId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, HABITS_COLLECTION, habitId));
    } catch (error) {
      console.error('Error deleting habit:', error);
      throw error;
    }
  }

  // Actualizar hábito (solo si no es por defecto)
  static async updateHabit(habitId: string, updates: Partial<Habit>): Promise<void> {
    try {
      const habitRef = doc(db, HABITS_COLLECTION, habitId);
      await updateDoc(habitRef, {
        ...updates,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error updating habit:', error);
      throw error;
    }
  }

  // Obtener tareas de un día específico
  static async getTasksByDate(userId: string, date: string): Promise<Task[]> {
    try {
      const tasksQuery = query(
        collection(db, TASKS_COLLECTION),
        where('userId', '==', userId),
        where('date', '==', date),
        orderBy('createdAt')
      );

      const snapshot = await getDocs(tasksQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Task[];
    } catch (error) {
      console.error('Error getting tasks by date:', error);
      throw error;
    }
  }

  // Crear nueva tarea
  static async createTask(userId: string, task: Omit<Task, 'id' | 'userId' | 'createdAt'>): Promise<Task> {
    try {
      const docRef = await addDoc(collection(db, TASKS_COLLECTION), {
        ...task,
        userId,
        createdAt: Timestamp.now(),
      });

      const newDoc = await getDoc(docRef);
      return {
        id: docRef.id,
        ...newDoc.data(),
      } as Task;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }

  // Actualizar tarea
  static async updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
    try {
      const taskRef = doc(db, TASKS_COLLECTION, taskId);

      // Filtrar campos undefined para evitar errores de Firebase
      const filteredUpdates: Record<string, unknown> = {};
      Object.keys(updates).forEach(key => {
        const value = (updates as Record<string, unknown>)[key];
        if (value !== undefined) {
          filteredUpdates[key] = value;
        }
      });

      await updateDoc(taskRef, {
        ...filteredUpdates,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }

  // Eliminar tarea
  static async deleteTask(taskId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, TASKS_COLLECTION, taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }

  // Eliminar todas las tareas de un día
  static async clearDailyTasks(userId: string, date: string): Promise<void> {
    try {
      const dailyTasks = await this.getTasksByDate(userId, date);
      const deletePromises = dailyTasks.map(task => this.deleteTask(task.id));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error clearing daily tasks:', error);
      throw error;
    }
  }

  // Generar tareas diarias desde hábitos
  static async generateDailyTasksFromHabits(userId: string, date: string): Promise<void> {
    try {
      // Obtener todos los hábitos del usuario
      const habits = await this.getHabits(userId);

      // Obtener tareas existentes para ese día
      const existingTasks = await this.getTasksByDate(userId, date);

      // Crear un mapa de tareas existentes por habitId para búsqueda eficiente
      const existingTasksByHabitId = new Map();
      existingTasks.forEach(task => {
        if (task.habitId) {
          existingTasksByHabitId.set(task.habitId, task);
        }
      });

      // Crear tareas para hábitos que no tienen tarea ese día
      const tasksToCreate = [];
      const [year, month, day] = date.split('-').map(Number);
      const currentDate = new Date(year, month - 1, day);
      const dayOfWeek = currentDate.getDay(); // 0 (Domingo) - 6 (Sábado)

      for (const habit of habits) {
        // Verificar si el hábito debe ejecutarse hoy
        // Si no tiene frecuencia, asumimos diario (por compatibilidad)
        const shouldRunToday = !habit.frequency || habit.frequency.includes(dayOfWeek);

        if (shouldRunToday && !existingTasksByHabitId.has(habit.id)) {
          tasksToCreate.push({
            title: habit.title,
            ...(habit.description ? { description: habit.description } : {}),
            completed: false,
            date,
            habitId: habit.id,
          });
        }
      }

      // Crear todas las tareas en batch para evitar duplicaciones
      if (tasksToCreate.length > 0) {
        await Promise.all(tasksToCreate.map(taskData =>
          this.createTask(userId, taskData)
        ));
      }
    } catch (error) {
      console.error('Error generating daily tasks from habits:', error);
      throw error;
    }
  }

  // Obtener estadísticas de tareas
  static async getTaskStats(userId: string, startDate: string, endDate: string): Promise<{
    total: number;
    completed: number;
    completionRate: number;
  }> {
    try {
      const tasksQuery = query(
        collection(db, TASKS_COLLECTION),
        where('userId', '==', userId),
        where('date', '>=', startDate),
        where('date', '<=', endDate)
      );

      const snapshot = await getDocs(tasksQuery);
      const tasks = snapshot.docs.map(doc => doc.data()) as Task[];

      const total = tasks.length;
      const completed = tasks.filter(task => task.completed).length;
      const completionRate = total > 0 ? (completed / total) * 100 : 0;

      return { total, completed, completionRate };
    } catch (error) {
      console.error('Error getting task stats:', error);
      throw error;
    }
  }
}
