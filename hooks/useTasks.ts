import { useState, useEffect, useCallback, useRef } from 'react';
import { Timestamp } from 'firebase/firestore';
import { TasksService } from '../services/tasksService';
import { Task, Habit, Goal } from '../types';
import { useAuth } from '../contexts/AuthContext';

export const useTasks = (selectedDate: string = new Date().toISOString().split('T')[0]) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isGeneratingTasksRef = useRef(false);

  // Cargar tareas del día
  const loadTasks = useCallback(async (date: string) => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const [userTasks, allUserTasks] = await Promise.all([
        TasksService.getTasksByDate(user.uid, date),
        TasksService.getTasks(user.uid) // Fetch all tasks for calendar dots
      ]);

      setTasks(userTasks);
      setAllTasks(allUserTasks);
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

  // Cargar objetivos
  const loadGoals = useCallback(async () => {
    if (!user) return;

    try {
      const userGoals = await TasksService.getActiveGoals(user.uid);
      setGoals(userGoals);
    } catch (err) {
      console.error('Error loading goals:', err);
    }
  }, [user]);

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
      // Also update allTasks if needed, though usually valid for current day view mostly
      setAllTasks(prev => [...prev, newTask]);
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
       setAllTasks(prev => prev.map(task =>
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
      if (task.failed) {
        // Si estaba fallida, al darle vuelve a pendiente
        await updateTask(taskId, {
          failed: false,
          failReason: null,
          completed: false,
          completedAt: null,
        });
      } else {
        const updates = {
          completed: !task.completed,
          completedAt: !task.completed ? Timestamp.now() : null,
          failed: false, // Asegurar que no está fallida si se completa
          failReason: null,
        };
        await updateTask(taskId, updates);
      }
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
      setAllTasks(prev => prev.filter(task => task.id !== taskId));
    } catch (err) {
      setError('Error al eliminar tarea');
      throw err;
    }
  }, []);

  // Eliminar todas las tareas del día actual
  const clearTasks = useCallback(async () => {
    if (!user) return;
    try {
      await TasksService.clearDailyTasks(user.uid, selectedDate);
      setTasks([]); // Limpiar estado local
      // Filter out tasks from allTasks that match current date
      setAllTasks(prev => prev.filter(t => t.date !== selectedDate));
    } catch (err) {
      setError('Error al limpiar tareas');
      throw err;
    }
  }, [user, selectedDate]);

  // Crear nuevo hábito
  const createHabit = useCallback(async (habitData: Omit<Habit, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) throw new Error('Usuario no autenticado');

    try {
      const newHabit = await TasksService.createHabit(user.uid, habitData);
      setHabits(prev => [...prev, newHabit]);

      // Verificar si el hábito debe ejecutarse en la fecha seleccionada
      const [year, month, day] = selectedDate.split('-').map(Number);
      const dayOfWeek = new Date(year, month - 1, day).getDay();

      const shouldCreateTask = !newHabit.frequency || newHabit.frequency.includes(dayOfWeek);

      // Si corresponde, crear la tarea inmediatamente
      if (shouldCreateTask) {
        await TasksService.createTask(user.uid, {
          title: newHabit.title,
          ...(newHabit.description ? { description: newHabit.description } : {}),
          completed: false,
          date: selectedDate, // Usa la fecha seleccionada en el hook
          habitId: newHabit.id,
        });

        // Recargar tareas para reflejar el cambio
        await loadTasks(selectedDate);
      }

      return newHabit;
    } catch (err) {
      setError('Error al crear hábito');
      throw err;
    }
  }, [user, selectedDate, loadTasks]);

  // Eliminar hábito
  const deleteHabit = useCallback(async (habitId: string) => {
    try {
      await TasksService.deleteHabit(habitId);
      setHabits(prev => prev.filter(habit => habit.id !== habitId));

      // Buscar si hay una tarea asociada a este hábito en el día seleccionado
      const taskToDelete = tasks.find(t => t.habitId === habitId);
      if (taskToDelete) {
        await TasksService.deleteTask(taskToDelete.id);
        setTasks(prev => prev.filter(t => t.id !== taskToDelete.id));
        setAllTasks(prev => prev.filter(t => t.id !== taskToDelete.id));
      }
    } catch (err) {
      setError('Error al eliminar hábito');
      throw err;
    }
  }, [tasks]);

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

  // --- MÉTODOS DE OBJETIVOS ---

  const createGoal = useCallback(async (goalData: { title: string; description?: string; deadline: Date }) => {
    if (!user) throw new Error('Usuario no autenticado');

    try {
      const newGoal = await TasksService.createGoal(user.uid, {
        ...goalData,
        completed: false,
        deadline: Timestamp.fromDate(goalData.deadline),
      });
      setGoals(prev => [...prev, newGoal]);
      return newGoal;
    } catch (err) {
      setError('Error al crear objetivo');
      throw err;
    }
  }, [user]);

  const updateGoal = useCallback(async (goalId: string, updates: Partial<Goal>) => {
    try {
      await TasksService.updateGoal(goalId, updates);
      setGoals(prev => prev.map(goal =>
        goal.id === goalId ? { ...goal, ...updates } : goal
      ));
    } catch (err) {
      setError('Error al actualizar objetivo');
      throw err;
    }
  }, []);

  const toggleGoal = useCallback(async (goalId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    try {
      const updates = {
        completed: !goal.completed,
        completedAt: !goal.completed ? Timestamp.now() : null,
      };
      await updateGoal(goalId, updates);
    } catch (err) {
      setError('Error al cambiar estado de objetivo');
      throw err;
    }
  }, [goals, updateGoal]);

  const deleteGoal = useCallback(async (goalId: string) => {
    try {
      await TasksService.deleteGoal(goalId);
      setGoals(prev => prev.filter(goal => goal.id !== goalId));
    } catch (err) {
      setError('Error al eliminar objetivo');
      throw err;
    }
  }, []);

  // Cambiar fecha seleccionada
  const changeDate = useCallback((newDate: string) => {
    loadTasks(newDate);
  }, [loadTasks]);

  // Efecto para cargar datos cuando el usuario cambia
  useEffect(() => {
    if (user) {
      loadHabits();
      loadGoals();
      loadTasks(selectedDate);
    } else {
      setTasks([]);
      setAllTasks([]);
      setHabits([]);
      setGoals([]);
      setLoading(false);
    }
  }, [user, loadHabits, loadGoals, loadTasks, generateDailyTasks]);

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
    allTasks,
    habits,
    loading,
    error,

    // Métodos de tareas
    loadTasks,
    createTask,
    updateTask,
    toggleTask,
    deleteTask,
    clearTasks,

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

    // Objetivos
    goals,
    createGoal,
    updateGoal,
    toggleGoal,
    deleteGoal,
    loadGoals,
  };
};
