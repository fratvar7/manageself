import React, { useState } from 'react';
import Head from 'expo-router/head';
import { View, Text, Alert } from 'react-native';
import { IndexScreenStyles } from '../../css/Screens/IndexScreen.styles';
import { useAuth } from '../../contexts/AuthContext';
import { useTasks } from '../../hooks/useTasks';
import { CalendarView } from '../../components/CalendarView';
import TodoList from '../../components/TodoList';
import { globalStyles } from '../../css/globalStyles';
import { useEvents } from '../../hooks/useEvents';
import { ConfirmModal } from '../../components/ConfirmModal';

import { colors } from '../../css/colors';

export default function Index() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const { upcomingEvents } = useEvents(selectedDate);

  const {
    tasks,
    habits,
    loading,
    createTask,
    toggleTask,
    deleteTask,
    updateTask,
    createHabit,
    deleteHabit,
    updateHabit,
    changeDate,
    clearTasks,
    goals,
    createGoal,
    toggleGoal,
    deleteGoal,
    generateDailyTasks,
    allTasks
  } = useTasks(selectedDate);

  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const { user } = useAuth();

  const handleDateChange = (newDateStr: string) => {
    setSelectedDate(newDateStr);
    changeDate(newDateStr);
  };

  const extraMarkedDates = React.useMemo(() => {
    const marks: Record<string, { color: string }> = {};
    if (allTasks) {
        allTasks.forEach(task => {
            if (!task.completed) {
                 marks[task.date] = { color: colors.status.warning };
            } else if (!marks[task.date]) {
                 marks[task.date] = { color: colors.status.success };
            }
        });
    }
    return marks;
  }, [allTasks]);

  const handleCreateTask = async (taskData: { title: string; description?: string }) => {
    try {
      await createTask({
        ...taskData,
        date: selectedDate,
        completed: false,
      });
    } catch {
      Alert.alert('Error', 'No se pudo crear la tarea');
    }
  };

  const handleCreateHabit = async (habitData: { title: string; description?: string; icon?: string; color?: string; frequency: number[] }) => {
    try {
      await createHabit({
        ...habitData,
        isDefault: false,
      });
    } catch {
      Alert.alert('Error', 'No se pudo crear el hábito');
    }
  };

  const handleDeleteHabit = async (habitId: string) => {
    try {
      await deleteHabit(habitId);
    } catch {
      Alert.alert('Error', 'No se pudo eliminar el hábito');
    }
  };

  const handleUpdateHabit = async (habitId: string, updates: { title?: string; description?: string; icon?: string; color?: string; frequency?: number[] }) => {
    try {
      await updateHabit(habitId, updates);
    } catch {
      Alert.alert('Error', 'No se pudo actualizar el hábito');
    }
  };

  if (!user) {
    return (
      <View style={globalStyles.container}>
        <Text style={styles.errorText}>Usuario no autenticado</Text>
      </View>
    );
  }

  return (
    <View style={[globalStyles.container, { paddingBottom: 0 }]}>
      <Head>
        <title>Vitacore - Gestión de Tareas y Hábitos</title>
        <meta name="description" content="Organiza tu vida con Vitacore." />
      </Head>

      <CalendarView
        date={new Date(selectedDate + 'T00:00:00')}
        onDateChange={(date) => {
          handleDateChange(date.toISOString().split('T')[0]);
        }}
        extraMarkedDates={extraMarkedDates}
        collapsible={true}
        hideHeader={true}
        hideEvents={true}
      />

      <TodoList
        tasks={tasks}
        habits={habits}
        goals={goals}
        userId={user.uid}
        onCreateTask={handleCreateTask}
        onToggleTask={toggleTask}
        onUpdateTask={updateTask}
        onDeleteTask={deleteTask}
        onCreateHabit={handleCreateHabit}
        onDeleteHabit={handleDeleteHabit}
        onUpdateHabit={handleUpdateHabit}
        onCreateGoal={async (g) => { await createGoal(g); }}
        onToggleGoal={toggleGoal}
        onDeleteGoal={deleteGoal}
        onClearTasks={() => setShowClearConfirm(true)}
        onLoadHabits={() => generateDailyTasks(selectedDate)}
        loading={loading}
        upcomingEvents={upcomingEvents}
      />

      <ConfirmModal
        visible={showClearConfirm}
        title="Limpiar lista"
        message="¿Estás seguro de que quieres eliminar todas las tareas de este día?"
        onConfirm={() => {
            clearTasks();
            setShowClearConfirm(false);
        }}
        onCancel={() => setShowClearConfirm(false)}
        confirmText="Eliminar todo"
        isDestructive={true}
      />
    </View>
  );
}

const styles = IndexScreenStyles;
