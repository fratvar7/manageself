import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import TodoList from '../../components/TodoList';
import { TasksService } from '../../services/tasksService';
import { Task, Habit, Goal } from '../../types';
import { useEvents } from '../../hooks/useEvents';
import { CalendarView } from '../../components/CalendarView';
import { colors } from '../../css/colors';

export default function TasksScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const selectedDateStr = selectedDate.toISOString().split('T')[0];

  const [tasks, setTasks] = useState<Task[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const { allEvents } = useEvents(); // Use allEvents for the calendar range logic
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Cargar tareas del día seleccionado
      const tasksData = await TasksService.getTasksByDate(user.uid, selectedDateStr);
      setTasks(tasksData);

      // Cargar TODAS las tareas para los puntos del calendario (esto podría optimizarse por mes)
      const allTasksData = await TasksService.getTasks(user.uid);
      setAllTasks(allTasksData);

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
  }, [user, selectedDateStr]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateTask = async (task: { title: string; description?: string }) => {
    if (!user) return;
    await TasksService.createTask(user.uid, {
      ...task,
      date: selectedDateStr,
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

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    if (!user) return;
    await TasksService.updateTask(taskId, updates);
    loadData();
  };

  const handleUpdateGoal = async (goalId: string, updates: Partial<Goal>) => {
    if (!user) return;
    await TasksService.updateGoal(goalId, updates);
    loadData();
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!user) return;
    await TasksService.deleteGoal(goalId);
    loadData();
  };

  const handleClearTasks = async () => {
    if (!user) return;
    await TasksService.clearDailyTasks(user.uid, selectedDateStr);
    loadData();
  };

  const handleLoadHabits = async () => {
    if (!user) return;
    try {
        setLoading(true);
        await TasksService.generateDailyTasksFromHabits(user.uid, selectedDateStr);
        await loadData();
    } catch {
        Alert.alert('Error', 'No se pudieron cargar los hábitos');
    } finally {
        setLoading(false);
    }
  };

  // Calcular puntos para el calendario
  const extraMarkedDates = useMemo(() => {
    const marks: Record<string, { color: string }> = {};
    allTasks.forEach(task => {
        if (!task.completed) {
             marks[task.date] = { color: colors.accent.yellow }; // Amarilla si hay pendientes
        } else if (!marks[task.date]) {
             marks[task.date] = { color: colors.status.success }; // Verde si todas completas (simplificado, prioriza pendiente)
        }
    });
    return marks;
  }, [allTasks]);

  return (
    <View style={{ flex: 1, backgroundColor: '#0D1117', paddingTop: insets.top }}>
      <CalendarView
        date={selectedDate}
        onDateChange={setSelectedDate}
        extraMarkedDates={extraMarkedDates}
        collapsible={true}
        hideHeader={true}
        hideEvents={true}
      >
        <TodoList
            tasks={tasks}
            habits={habits}
            goals={goals}
            upcomingEvents={allEvents} // Pass all events so EventsList can filter upcoming ones
            userId={user?.uid || ''}
            onCreateTask={handleCreateTask}
            onToggleTask={handleToggleTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            onCreateHabit={handleCreateHabit}
            onDeleteHabit={handleDeleteHabit}
            onUpdateHabit={handleUpdateHabit}
            onCreateGoal={async (g) => { await handleCreateGoal(g); }}
            onToggleGoal={handleToggleGoal}
            onUpdateGoal={handleUpdateGoal}
            onDeleteGoal={handleDeleteGoal}
            onClearTasks={handleClearTasks}
            onLoadHabits={handleLoadHabits}
            loading={loading}
        />
      </CalendarView>
    </View>
  );
}
