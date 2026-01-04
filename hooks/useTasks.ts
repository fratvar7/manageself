import { useState, useEffect, useCallback, useRef } from 'react';
import { TasksService } from '../services/tasksService';
import { Task, Habit } from '../types';
import { useAuth } from '../contexts/AuthContext';

export const useTasks = (selectedDate: string = new Date().toISOString().split('T')[0]) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isGeneratingTasksRef = useRef(false);

  // Cargar tareas del día
  const loadTasks = useCallback(async (date: string) => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const userTasks = await TasksService.getTasksByDate(user.uid, date);
      setTasks(userTasks);
    } catch (err) {
      setError('Error al cargar tareas');
      console.error('Error loading tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Cargar hábitos
  const loadHabits = useCallback(async () => {
    if (!user) return;

    try {
      const userHabits = await TasksService.getHabits(user.uid);
      setHabits(userHabits);
    } catch (err) {
      console.error('Error loading habits:', err);
    }
  }, [user]);

  // Inicializar hábitos por defecto para nuevo usuario
  const initializeHabits = useCallback(async () => {
    if (!user) return;

    try {
      await TasksService.initializeDefaultHabits(user.uid);
      await loadHabits();
    } catch (err) {
      setError('Error al inicializar hábitos');
      console.error('Error initializing habits:', err);
    }
  }, [user, loadHabits]);

  // Generar tareas diarias desde hábitos
  const generateDailyTasks = useCallback(async (date: string) => {
    if (!user || isGeneratingTasksRef.current) return;

    try {
      isGeneratingTasksRef.current = true;
      await TasksService.generateDailyTasksFromHabits(user.uid, date);
      await loadTasks(date);
    } catch (err) {
      setError('Error al generar tareas diarias');
      console.error('Error generating daily tasks:', err);
    } finally {
      isGeneratingTasksRef.current = false;
    }
  }, [user, loadTasks]);

  // Crear nueva tarea
  const createTask = useCallback(async (taskData: Omit<Task, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) throw new Error('Usuario no autenticado');

    try {
      const newTask = await TasksService.createTask(user.uid, taskData);
      setTasks(prev => [...prev, newTask]);
      return newTask;
    } catch (err) {
      setError('Error al crear tarea');
      throw err;
    }
  }, [user]);

  // Actualizar tarea
  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    try {
      await TasksService.updateTask(taskId, updates);
      setTasks(prev => prev.map(task =>
        task.id === taskId ? { ...task, ...updates } : task
      ));
    } catch (err) {
      setError('Error al actualizar tarea');
      throw err;
    }
  }, []);

  // Completar/descompletar tarea
  const toggleTask = useCallback(async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      const updates = {
        completed: !task.completed,
        completedAt: !task.completed ? new Date() : undefined,
      };
      await updateTask(taskId, updates);
    } catch (err) {
      setError('Error al cambiar estado de tarea');
      throw err;
    }
  }, [tasks, updateTask]);

  // Eliminar tarea
  const deleteTask = useCallback(async (taskId: string) => {
    try {
      await TasksService.deleteTask(taskId);
      setTasks(prev => prev.filter(task => task.id !== taskId));
    } catch (err) {
      setError('Error al eliminar tarea');
      throw err;
    }
  }, []);

  // Crear nuevo hábito
  const createHabit = useCallback(async (habitData: Omit<Habit, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) throw new Error('Usuario no autenticado');

    try {
      const newHabit = await TasksService.createHabit(user.uid, habitData);
      setHabits(prev => [...prev, newHabit]);
      return newHabit;
    } catch (err) {
      setError('Error al crear hábito');
      throw err;
    }
  }, [user]);

  // Eliminar hábito
  const deleteHabit = useCallback(async (habitId: string) => {
    try {
      await TasksService.deleteHabit(habitId);
      setHabits(prev => prev.filter(habit => habit.id !== habitId));
    } catch (err) {
      setError('Error al eliminar hábito');
      throw err;
    }
  }, []);

  // Actualizar hábito
  const updateHabit = useCallback(async (habitId: string, updates: Partial<Habit>) => {
    try {
      await TasksService.updateHabit(habitId, updates);
      setHabits(prev => prev.map(habit =>
        habit.id === habitId ? { ...habit, ...updates } : habit
      ));
    } catch (err) {
      setError('Error al actualizar hábito');
      throw err;
    }
  }, []);

  // Cambiar fecha seleccionada
  const changeDate = useCallback((newDate: string) => {
    loadTasks(newDate);
    generateDailyTasks(newDate);
  }, [loadTasks, generateDailyTasks]);

  // Efecto para cargar datos cuando el usuario cambia
  useEffect(() => {
    if (user) {
      loadHabits();
      initializeHabits();
      loadTasks(selectedDate);
      generateDailyTasks(selectedDate);
    } else {
      setTasks([]);
      setHabits([]);
      setLoading(false);
    }
  }, [user, loadHabits, initializeHabits, loadTasks, generateDailyTasks]);

  // Estadísticas del día
  const dayStats = {
    total: tasks.length,
    completed: tasks.filter(task => task.completed).length,
    pending: tasks.filter(task => !task.completed).length,
    completionRate: tasks.length > 0 ? (tasks.filter(task => task.completed).length / tasks.length) * 100 : 0,
  };

  return {
    // Estado
    tasks,
    habits,
    loading,
    error,

    // Métodos de tareas
    loadTasks,
    createTask,
    updateTask,
    toggleTask,
    deleteTask,

    // Métodos de hábitos
    loadHabits,
    createHabit,
    deleteHabit,
    updateHabit,

    // Métodos de fecha
    changeDate,
    generateDailyTasks,

    // Estadísticas
    dayStats,
  };
};
