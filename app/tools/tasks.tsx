import React, { useState, useEffect, useCallback } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import TodoList from '../../components/TodoList';
import { TasksService } from '../../services/tasksService';
import { Task, Habit, Goal } from '../../types';
import { useEvents } from '../../hooks/useEvents';

export default function TasksScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const { events } = useEvents(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Cargar tareas
      const today = new Date().toISOString().split('T')[0];
      const tasksData = await TasksService.getTasksByDate(user.uid, today);
      setTasks(tasksData);

      // Cargar hábitos
      const habitsData = await TasksService.getHabits(user.uid);
      setHabits(habitsData);

      // Cargar objetivos
      const goalsData = await TasksService.getActiveGoals(user.uid);
      setGoals(goalsData);
    } catch {
      // Error silencioso para no romper la UI
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateTask = async (task: { title: string; description?: string }) => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    await TasksService.createTask(user.uid, {
      ...task,
      date: today,
      completed: false,
    });
    loadData();
  };

  const handleToggleTask = async (taskId: string) => {
    if (!user) return;
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      await TasksService.updateTask(taskId, { completed: !task.completed });
      loadData();
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!user) return;
    await TasksService.deleteTask(taskId);
    loadData();
  };

  const handleCreateHabit = async (habit: { title: string; description?: string; icon?: string; color?: string; frequency?: number[] }) => {
    if (!user) return;
    await TasksService.createHabit(user.uid, {
      ...habit,
      isDefault: false,
      frequency: habit.frequency || [],
    });
    loadData();
  };

  const handleDeleteHabit = async (habitId: string) => {
    if (!user) return;
    await TasksService.deleteHabit(habitId);
    loadData();
  };

  const handleUpdateHabit = async (habitId: string, updates: { title?: string; description?: string; icon?: string; color?: string; frequency?: number[] }) => {
    if (!user) return;
    await TasksService.updateHabit(habitId, updates);
    loadData();
  };

  const handleCreateGoal = async (goal: { title: string; description?: string; deadline: Date }) => {
    if (!user) return;
    await TasksService.createGoal(user.uid, {
      ...goal,
      completed: false,
      deadline: Timestamp.fromDate(goal.deadline),
    });
    loadData();
  };

  const handleToggleGoal = async (goalId: string) => {
    if (!user) return;
    const goal = goals.find(g => g.id === goalId);
    if (goal) {
      await TasksService.updateGoal(goalId, {
        completed: !goal.completed,
        completedAt: !goal.completed ? Timestamp.now() : null
      });
      loadData();
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!user) return;
    await TasksService.deleteGoal(goalId);
    loadData();
  };

  const handleClearTasks = async () => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    await TasksService.clearDailyTasks(user.uid, today);
    loadData();
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0D1117', paddingTop: insets.top }}>
      <TodoList
        tasks={tasks}
        habits={habits}
        goals={goals}
        events={events}
        userId={user?.uid || ''}
        onCreateTask={handleCreateTask}
        onToggleTask={handleToggleTask}
        onDeleteTask={handleDeleteTask}
        onCreateHabit={handleCreateHabit}
        onDeleteHabit={handleDeleteHabit}
        onUpdateHabit={handleUpdateHabit}
        onCreateGoal={async (g) => { await handleCreateGoal(g); }}
        onToggleGoal={handleToggleGoal}
        onDeleteGoal={handleDeleteGoal}
        onClearTasks={handleClearTasks}
        loading={loading}
      />
    </View>
  );
}
