import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Category } from '../types';

const CATEGORIES_COLLECTION = 'categories';

// Categorías por defecto del sistema
const DEFAULT_CATEGORIES: Omit<Category, 'id' | 'createdAt'>[] = [
  // Gastos por defecto
  { name: 'Comida', type: 'expense', icon: 'utensils', color: '#FF6B6B', isDefault: true },
  { name: 'Transporte', type: 'expense', icon: 'car', color: '#4ECDC4', isDefault: true },
  { name: 'Hogar', type: 'expense', icon: 'home', color: '#45B7D1', isDefault: true },
  { name: 'Salud', type: 'expense', icon: 'heart', color: '#96CEB4', isDefault: true },
  { name: 'Ocio', type: 'expense', icon: 'gamepad', color: '#FFEAA7', isDefault: true },
  { name: 'Compras', type: 'expense', icon: 'shopping-bag', color: '#DDA0DD', isDefault: true },
  { name: 'Educación', type: 'expense', icon: 'book', color: '#98D8C8', isDefault: true },
  { name: 'Servicios', type: 'expense', icon: 'tools', color: '#F7DC6F', isDefault: true },

  // Ingresos por defecto
  { name: 'Sueldo', type: 'income', icon: 'briefcase', color: '#52C234', isDefault: true },
  { name: 'Venta', type: 'income', icon: 'tag', color: '#27AE60', isDefault: true },
  { name: 'Intereses', type: 'income', icon: 'chart-line', color: '#2980B9', isDefault: true },
  { name: 'Regalo', type: 'income', icon: 'gift', color: '#E74C3C', isDefault: true },
  { name: 'Inversión', type: 'income', icon: 'trending-up', color: '#F39C12', isDefault: true },
  { name: 'Freelance', type: 'income', icon: 'laptop', color: '#8E44AD', isDefault: true },
];

export class CategoriesService {
  // Inicializar categorías por defecto para un nuevo usuario
  static async initializeDefaultCategories(userId: string): Promise<void> {
    try {
      // Verificar si ya tiene categorías
      const userCategoriesQuery = query(
        collection(db, CATEGORIES_COLLECTION),
        where('userId', '==', userId)
      );
      const userCategoriesSnapshot = await getDocs(userCategoriesQuery);

      if (!userCategoriesSnapshot.empty) {
        return; // Ya tiene categorías, no inicializar
      }

      // Añadir categorías por defecto para este usuario
      const now = Timestamp.now();
      for (const category of DEFAULT_CATEGORIES) {
        await addDoc(collection(db, CATEGORIES_COLLECTION), {
          ...category,
          userId,
          createdAt: now,
        });
      }
    } catch (error) {
      console.error('Error initializing default categories:', error);
      throw error;
    }
  }

  // Obtener todas las categorías de un usuario (incluyendo las del sistema)
  static async getCategories(userId: string): Promise<Category[]> {
    try {
      const categoriesQuery = query(
        collection(db, CATEGORIES_COLLECTION),
        where('userId', '==', userId),
        orderBy('name')
      );

      const snapshot = await getDocs(categoriesQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Category[];
    } catch (error) {
      console.error('Error getting categories:', error);
      throw error;
    }
  }

  // Obtener categorías por tipo
  static async getCategoriesByType(userId: string, type: 'expense' | 'income'): Promise<Category[]> {
    try {
      const categoriesQuery = query(
        collection(db, CATEGORIES_COLLECTION),
        where('userId', '==', userId),
        where('type', '==', type),
        orderBy('name')
      );

      const snapshot = await getDocs(categoriesQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Category[];
    } catch (error) {
      console.error('Error getting categories by type:', error);
      throw error;
    }
  }

  // Crear nueva categoría
  static async createCategory(userId: string, category: Omit<Category, 'id' | 'userId' | 'createdAt'>): Promise<Category> {
    try {
      const now = Timestamp.now();
      const docRef = await addDoc(collection(db, CATEGORIES_COLLECTION), {
        ...category,
        userId,
        isDefault: false, // Las creadas por usuario nunca son por defecto
        createdAt: now,
      });

      const newDoc = await getDoc(docRef);
      return {
        id: docRef.id,
        ...newDoc.data(),
      } as Category;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }

  // Eliminar categoría (solo si no es por defecto y no tiene transacciones)
  static async deleteCategory(categoryId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, CATEGORIES_COLLECTION, categoryId));
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }
}
