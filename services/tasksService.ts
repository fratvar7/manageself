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

// Hábitos por defecto del sistema
const DEFAULT_HABITS = [
  { title: 'Ejercicio físico', description: 'Mover el cuerpo diariamente', icon: 'physics', color: '#e74c3c', isDefault: true },
  { title: 'Meditación', description: 'Tiempo para la mente', icon: 'mental', color: '#9b59b6', isDefault: true },
  { title: 'Expresar emociones', description: 'Reconocer y expresar sentimientos', icon: 'emotional', color: '#e91e63', isDefault: true },
  { title: 'Conexión espiritual', description: 'Práctica espiritual diaria', icon: 'spiritual', color: '#fabb0a', isDefault: true },
  { title: 'Contacto social', description: 'Conectar con otros', icon: 'social', color: '#ff9800', isDefault: true },
  { title: 'Desarrollo profesional', description: 'Aprender algo nuevo', icon: 'professional', color: '#4caf50', isDefault: true },
  { title: 'Gestión financiera', description: 'Revisar finanzas', icon: 'economic', color: '#f39c12', isDefault: true },
  { title: 'Creación artística', description: 'Tiempo para crear', icon: 'creative', color: '#e74c3c', isDefault: true },
];

export class TasksService {
  // Inicializar hábitos por defecto para un nuevo usuario
  static async initializeDefaultHabits(userId: string): Promise<void> {
    try {
      // Verificar si ya tiene hábitos
      const userHabitsQuery = query(
        collection(db, HABITS_COLLECTION),
        where('userId', '==', userId)
      );
      const userHabitsSnapshot = await getDocs(userHabitsQuery);

      if (!userHabitsSnapshot.empty) {
        return; // Ya tiene hábitos, no inicializar
      }

      // Añadir hábitos por defecto para este usuario
      const now = Timestamp.now();
      for (const habit of DEFAULT_HABITS) {
        await addDoc(collection(db, HABITS_COLLECTION), {
          ...habit,
          userId,
          createdAt: now,
        });
      }
    } catch (error) {
      console.error('Error initializing default habits:', error);
      throw error;
    }
  }

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
      // Verificar si es hábito por defecto
      const habitDoc = await getDoc(doc(db, HABITS_COLLECTION, habitId));
      if (!habitDoc.exists()) {
        throw new Error('Hábito no encontrado');
      }

      const habit = habitDoc.data() as Habit;
      if (habit.isDefault) {
        throw new Error('No se pueden eliminar hábitos por defecto');
      }

      await deleteDoc(doc(db, HABITS_COLLECTION, habitId));
    } catch (error) {
      console.error('Error deleting habit:', error);
      throw error;
    }
  }

  // Actualizar hábito (solo si no es por defecto)
  static async updateHabit(habitId: string, updates: Partial<Habit>): Promise<void> {
    try {
      // Verificar si es hábito por defecto
      const habitDoc = await getDoc(doc(db, HABITS_COLLECTION, habitId));
      if (!habitDoc.exists()) {
        throw new Error('Hábito no encontrado');
      }

      const habit = habitDoc.data() as Habit;
      if (habit.isDefault) {
        throw new Error('No se pueden modificar hábitos por defecto');
      }

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
      await updateDoc(taskRef, {
        ...updates,
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
      for (const habit of habits) {
        if (!existingTasksByHabitId.has(habit.id)) {
          tasksToCreate.push({
            title: habit.title,
            description: habit.description,
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
