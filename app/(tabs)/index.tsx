import React, { useState, useEffect } from 'react';
import Head from 'expo-router/head';
import { View, Text, Alert } from 'react-native';
import { IndexScreenStyles } from '../../css/Screens/IndexScreen.styles';
import { useAuth } from '../../contexts/AuthContext';
import { useTasks } from '../../hooks/useTasks';
import Calendar from '../../components/Calendar';
import TodoList from '../../components/TodoList';
import { globalStyles } from '../../css/globalStyles';
import { CalendarEvent } from '../../types';
import { CalendarService } from '../../services/calendarService';



export default function Index() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);

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
    clearTasks,

  } = useTasks(selectedDate);

  const { user } = useAuth();

  // Cargar eventos del día actual
  useEffect(() => {
    const loadEvents = async () => {
      if (!user) return;
      try {
        const todayEvents = await CalendarService.getEventsByDay(user.uid, new Date());
        setEvents(todayEvents);
      } catch {
        Alert.alert('Error', 'No se pudieron cargar los eventos');
      }
    };

    loadEvents();
  }, [user]);

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

  React.useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
    }
  }, [error]);

  if (!user) {
    return (
      <View style={globalStyles.container}>
        <Text style={styles.errorText}>Usuario no autenticado</Text>
      </View>
    );
  }

  return (
    <>
      <Head>
        <title>ManageSelf - Gestión de Tareas y Hábitos</title>
        <meta
          name="description"
          content="Organiza tu vida con ManageSelf. Gestiona tus tareas diarias, sigue tus hábitos y mejora tu productividad personal de forma sencilla."
        />
        <meta property="og:title" content="ManageSelf - Tu Organizador Personal" />
        <meta
          property="og:description"
          content="Toma el control de tu día a día con ManageSelf. Tareas, hábitos y estadísticas en un solo lugar."
        />
        <meta property="og:type" content="website" />
      </Head>
      <View style={globalStyles.container}>

      {/* Calendario */}
      <Calendar selectedDate={selectedDate} onDateChange={handleDateChange} />


      {/* Lista de tareas */}
      <TodoList
        tasks={tasks}
        habits={habits}
        events={events}
        userId={user.uid}
        onCreateTask={handleCreateTask}
        onToggleTask={toggleTask}
        onDeleteTask={deleteTask}
        onCreateHabit={handleCreateHabit}
        onDeleteHabit={handleDeleteHabit}
        onUpdateHabit={handleUpdateHabit}
        onClearTasks={() => {
          Alert.alert(
            'Limpiar lista',
            '¿Estás seguro de que quieres eliminar todas las tareas de este día?',
            [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Eliminar', style: 'destructive', onPress: clearTasks }
            ]
          );
        }}
        loading={loading}
      />
    </View>
    </>
  );
}


const styles = IndexScreenStyles;

