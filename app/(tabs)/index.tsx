import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useTasks } from '../../hooks/useTasks';
import Calendar from '../../components/Calendar';
import TodoList from '../../components/TodoList';
import { globalStyles } from '../../css/globalStyles';
import { colors } from '../../css/colors';

export default function Index() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const {
    tasks,
    habits,
    loading,
    error,
    createTask,
    toggleTask,
    deleteTask,
    createHabit,
    deleteHabit,
    updateHabit,
    changeDate,
    dayStats,
  } = useTasks(selectedDate);

  const { user } = useAuth();

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    changeDate(newDate);
  };

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

  const handleCreateHabit = async (habitData: { title: string; description?: string; icon?: string; color?: string }) => {
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

  const handleUpdateHabit = async (habitId: string, updates: { title?: string; description?: string; icon?: string; color?: string }) => {
    try {
      await updateHabit(habitId, updates);
    } catch {
      Alert.alert('Error', 'No se pudo actualizar el hábito');
    }
  };

  if (error) {
    return (
      <View style={globalStyles.container}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={globalStyles.container}>
        <Text style={styles.errorText}>Usuario no autenticado</Text>
      </View>
    );
  }

  return (
    <View style={globalStyles.container}>
      {/* Header con estadísticas */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Tareas</Text>
        <View style={styles.headerStats}>
          <Text style={styles.headerStatsText}>
            {dayStats.completed}/{dayStats.total} completadas
          </Text>
          <Text style={styles.headerStatsPercentage}>
            {Math.round(dayStats.completionRate)}%
          </Text>
        </View>
      </View>

      {/* Calendario */}
      <Calendar selectedDate={selectedDate} onDateChange={handleDateChange} />

      {/* Lista de tareas */}
      <TodoList
        tasks={tasks}
        habits={habits}
        userId={user.uid}
        onCreateTask={handleCreateTask}
        onToggleTask={toggleTask}
        onDeleteTask={deleteTask}
        onCreateHabit={handleCreateHabit}
        onDeleteHabit={handleDeleteHabit}
        onUpdateHabit={handleUpdateHabit}
        loading={loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    margin: 16,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  headerStats: {
    alignItems: 'flex-end',
  },
  headerStatsText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  headerStatsPercentage: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.button.primary,
  },
  errorText: {
    fontSize: 16,
    color: colors.status.error,
    textAlign: 'center',
    marginTop: 40,
  },
});
