import { useState, useEffect, useCallback } from 'react';
import { CategoriesService } from '../services/categoriesService';
import { Category } from '../types';
import { useAuth } from '../contexts/AuthContext';

export const useCategories = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar categorías
  const loadCategories = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const userCategories = await CategoriesService.getCategories(user.uid);
      setCategories(userCategories);
    } catch (err) {
      setError('Error al cargar categorías');
      console.error('Error loading categories:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Inicializar categorías por defecto para nuevo usuario
  const initializeCategories = useCallback(async () => {
    if (!user) return;

    try {
      await CategoriesService.initializeDefaultCategories(user.uid);
      await loadCategories();
    } catch (err) {
      setError('Error al inicializar categorías');
      console.error('Error initializing categories:', err);
    }
  }, [user, loadCategories]);

  // Obtener categorías por tipo
  const getCategoriesByType = useCallback((type: 'expense' | 'income') => {
    return categories.filter(cat => cat.type === type);
  }, [categories]);

  // Crear nueva categoría
  const createCategory = useCallback(async (categoryData: Omit<Category, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) throw new Error('Usuario no autenticado');

    try {
      const newCategory = await CategoriesService.createCategory(user.uid, categoryData);
      setCategories(prev => [...prev, newCategory]);
      return newCategory;
    } catch (err) {
      setError('Error al crear categoría');
      throw err;
    }
  }, [user]);

  // Eliminar categoría
  const deleteCategory = useCallback(async (categoryId: string) => {
    try {
      await CategoriesService.deleteCategory(categoryId);
      setCategories(prev => prev.filter(cat => cat.id !== categoryId));
    } catch (err) {
      setError('Error al eliminar categoría');
      throw err;
    }
  }, []);

  // Efecto para cargar categorías cuando el usuario cambia
  useEffect(() => {
    if (user) {
      loadCategories();
    } else {
      setCategories([]);
      setLoading(false);
    }
  }, [user, loadCategories]);

  return {
    categories,
    loading,
    error,
    loadCategories,
    initializeCategories,
    getCategoriesByType,
    createCategory,
    deleteCategory,
  };
};
