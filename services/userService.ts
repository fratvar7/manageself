import {
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { UserProfile, UserMetricLog } from '../types';

const USERS_COLLECTION = 'users';

export class UserService {
  // Crear o actualizar usuario
  static async createUserProfile(userId: string, data: Partial<UserProfile>): Promise<void> {
    try {
      const userRef = doc(db, USERS_COLLECTION, userId);
      const now = Timestamp.now();

      await setDoc(userRef, {
        ...data,
        id: userId,
        createdAt: now,
        updatedAt: now,
      }, { merge: true });
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }

  // Obtener perfil de usuario
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const userRef = doc(db, USERS_COLLECTION, userId);
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  // Actualizar perfil de usuario
  static async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      console.log('UserService: Updating profile for', userId);
      const userRef = doc(db, USERS_COLLECTION, userId);
      await setDoc(userRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      }, { merge: true });
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  // --- HISTORIAL DE MÉTRICAS (PROGRESO) ---

  // Registrar nueva medición (snapshot)
  static async addUserMetrics(userId: string, metrics: Partial<UserMetricLog>): Promise<void> {
    try {
      // Guardar en subcolección 'metrics' para historial
      const metricsRef = collection(db, USERS_COLLECTION, userId, 'metrics');
      await addDoc(metricsRef, {
        ...metrics,
        userId,
        date: Timestamp.now(),
      });

      // Opcional: Actualizar también el perfil principal para acceso rápido si se desea
      // Pero el requerimiento principal es el historial.
    } catch (error) {
      console.error('Error creating metric log:', error);
      throw error;
    }
  }

  // Obtener última medición conocida
  static async getLatestUserMetrics(userId: string): Promise<UserMetricLog | null> {
    try {
      const metricsRef = collection(db, USERS_COLLECTION, userId, 'metrics');
      const q = query(metricsRef, orderBy('date', 'desc'), limit(1));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() } as UserMetricLog;
      }
      return null;
    } catch (error) {
      console.error('Error getting latest metrics:', error);
      throw error;
    }
  }
}
