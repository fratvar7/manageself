import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Workout, WorkoutLog } from '../types';
import { sanitizeData } from '../utils/firebaseUtils';

const WORKOUTS_COLLECTION = 'workouts';
const WORKOUT_LOGS_COLLECTION = 'workoutLogs';


export class WorkoutService {
  // Crear nueva rutina
  static async createWorkout(userId: string, workout: Omit<Workout, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Workout> {
    try {
      const now = Timestamp.now();
      const docRef = await addDoc(collection(db, WORKOUTS_COLLECTION), {
        ...(sanitizeData(workout) as any),
        userId,
        createdAt: now,
        updatedAt: now,
      });

      return {
        id: docRef.id,
        userId,
        ...workout,
        createdAt: now,
        updatedAt: now,
      } as Workout;
    } catch (error) {
      console.error('Error creating workout:', error);
      throw error;
    }
  }

  // Obtener todas las rutinas del usuario
  static async getWorkouts(userId: string): Promise<Workout[]> {
    try {
      const workoutsQuery = query(
        collection(db, WORKOUTS_COLLECTION),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(workoutsQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Workout[];
    } catch (error) {
      console.error('Error getting workouts:', error);
      throw error;
    }
  }

  // Suscribirse a rutinas en tiempo real
  static subscribeToWorkouts(userId: string, callback: (workouts: Workout[]) => void): () => void {
    const workoutsQuery = query(
      collection(db, WORKOUTS_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(workoutsQuery, (snapshot) => {
      const workouts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Workout[];
      callback(workouts);
    }, (error) => {
      console.error('Error subscribing to workouts:', error);
    });
  }

  // Actualizar rutina
  static async updateWorkout(workoutId: string, updates: Partial<Workout>): Promise<void> {
    try {
      const workoutRef = doc(db, WORKOUTS_COLLECTION, workoutId);
      await updateDoc(workoutRef, {
        ...(sanitizeData(updates) as any),
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating workout:', error);
      throw error;
    }
  }

  // Eliminar rutina
  static async deleteWorkout(workoutId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, WORKOUTS_COLLECTION, workoutId));
    } catch (error) {
      console.error('Error deleting workout:', error);
      throw error;
    }
  }

  // --- LOGGING METHODS ---

  // Guardar log de entrenamiento
  static async saveWorkoutLog(log: Omit<WorkoutLog, 'id'>): Promise<void> {
    try {
      await addDoc(collection(db, WORKOUT_LOGS_COLLECTION), sanitizeData(log) as any);
    } catch (error) {
      console.error('Error saving workout log:', error);
      throw error;
    }
  }

  // Actualizar log de entrenamiento existente
  static async updateWorkoutLog(logId: string, updates: Partial<WorkoutLog>): Promise<void> {
    try {
      const logRef = doc(db, WORKOUT_LOGS_COLLECTION, logId);
      await updateDoc(logRef, sanitizeData(updates) as any);
    } catch (error) {
      console.error('Error updating workout log:', error);
      throw error;
    }
  }

  // Eliminar historial de entrenamiento
  static async deleteWorkoutLog(logId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, WORKOUT_LOGS_COLLECTION, logId));
    } catch (error) {
      console.error('Error deleting workout log:', error);
      throw error;
    }
  }

  // Obtener historial de entrenamientos
  static async getWorkoutLogs(userId: string): Promise<WorkoutLog[]> {
    try {
      const logsQuery = query(
        collection(db, WORKOUT_LOGS_COLLECTION),
        where('userId', '==', userId),
        orderBy('date', 'desc')
      );

      const snapshot = await getDocs(logsQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as WorkoutLog[];
    } catch (error) {
      console.error('Error getting workout logs:', error);
      throw error;
    }
  }
}
