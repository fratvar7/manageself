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
  writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { LibraryExercise } from '../types';
import { GYM_EXERCISES } from '../constants/exercises';
import { sanitizeData } from '../utils/firebaseUtils';

const EXERCISES_COLLECTION = 'exercises';

export class ExerciseService {
  // Obtener todos los ejercicios del usuario
  static async getExercises(userId: string): Promise<LibraryExercise[]> {
    try {
      const q = query(
        collection(db, EXERCISES_COLLECTION),
        where('userId', '==', userId),
        orderBy('name', 'asc')
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        // Sembrar ejercicios por defecto si no tiene ninguno
        return await this.seedDefaultExercises(userId);
      }

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as LibraryExercise[];
    } catch (error) {
      console.error('Error getting exercises:', error);
      throw error;
    }
  }

  // Sembrar ejercicios iniciales
  private static async seedDefaultExercises(userId: string): Promise<LibraryExercise[]> {
    try {
      const batch = writeBatch(db);
      const seededExercises: LibraryExercise[] = [];

      for (const ex of GYM_EXERCISES) {
        const docRef = doc(collection(db, EXERCISES_COLLECTION));
        const newEx = {
          ...sanitizeData(ex),
          id: docRef.id, // Sobrescribimos el ID de la constante con el de Firestore
          userId,
          createdAt: Timestamp.now(),
        };
        batch.set(docRef, newEx);
        seededExercises.push(newEx as LibraryExercise);
      }

      await batch.commit();
      return seededExercises.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Error seeding exercises:', error);
      throw error;
    }
  }

  // Crear nuevo ejercicio personalizado
  static async createExercise(userId: string, exercise: Omit<LibraryExercise, 'id' | 'userId'>): Promise<LibraryExercise> {
    try {
      const docRef = await addDoc(collection(db, EXERCISES_COLLECTION), {
        ...sanitizeData(exercise),
        userId,
        createdAt: Timestamp.now(),
      });

      return {
        id: docRef.id,
        userId,
        ...exercise,
      } as LibraryExercise;
    } catch (error) {
      console.error('Error creating exercise:', error);
      throw error;
    }
  }

  // Actualizar ejercicio
  static async updateExercise(id: string, updates: Partial<LibraryExercise>): Promise<void> {
    try {
      const docRef = doc(db, EXERCISES_COLLECTION, id);
      await updateDoc(docRef, {
        ...sanitizeData(updates),
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating exercise:', error);
      throw error;
    }
  }

  // Eliminar ejercicio
  static async deleteExercise(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, EXERCISES_COLLECTION, id));
    } catch (error) {
      console.error('Error deleting exercise:', error);
      throw error;
    }
  }
}
