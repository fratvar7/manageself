import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, Alert, ScrollView, Modal, TouchableOpacity } from 'react-native';
import { PlusIcon, TrashIcon, SettingsIcon } from './Icons';
import { TodoListStyles } from '../css/Components/TodoList.styles';
import { colors } from '../css/colors';
import { ICON_EMOJIS } from '../constants/icons';
import { Task, Habit, CalendarEvent } from '../types';
import HabitsModal from './HabitsModal';
import { EventsList } from './EventsList';
import { Ionicons } from '@expo/vector-icons';


interface TodoListProps {
  tasks: Task[];
  habits: Habit[];
  userId: string;
  onCreateTask: (task: { title: string; description?: string }) => Promise<void>;
  onToggleTask: (taskId: string) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onCreateHabit: (habit: { title: string; description?: string; icon?: string; color?: string; frequency: number[] }) => Promise<void>;
  onDeleteHabit: (habitId: string) => Promise<void>;
  onUpdateHabit?: (habitId: string, updates: { title?: string; description?: string; icon?: string; color?: string; frequency?: number[] }) => Promise<void>;
  onClearTasks?: () => void;
  loading: boolean;
  events?: CalendarEvent[];
}


export default function TodoList({
  tasks,
  habits,
  userId,
  onCreateTask,
  onToggleTask,
  onDeleteTask,
  onCreateHabit,
  onDeleteHabit,
  onUpdateHabit,
  onClearTasks,
  loading,
  events = [],
}: TodoListProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showHabitsModal, setShowHabitsModal] = useState(false);
  const [showEventsModal, setShowEventsModal] = useState(false);

  // ... (handlers keep same) ...
  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) {
      Alert.alert('Error', 'Por favor ingresa un título para la tarea');
      return;
    }

    try {
      await onCreateTask({
        title: newTaskTitle.trim(),
      });

      // Limpiar formulario
      setNewTaskTitle('');
      setShowAddForm(false);
    } catch {
      Alert.alert('Error', 'No se pudo crear la tarea');
    }
  };


  const handleToggleTask = async (taskId: string) => {
    try {
      await onToggleTask(taskId);
    } catch {
      Alert.alert('Error', 'No se pudo actualizar la tarea');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    Alert.alert(
      'Eliminar tarea',
      '¿Estás seguro de que quieres eliminar esta tarea?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await onDeleteTask(taskId);
            } catch {
              Alert.alert('Error', 'No se pudo eliminar la tarea');
            }
          }
        }
      ]
    );
  };

  const completedTasks = tasks.filter(task => task.completed);
  const pendingTasks = tasks.filter(task => !task.completed);

  const renderTask = (task: Task) => {
    // Determine emoji
    let emoji = ICON_EMOJIS.default;
    if (task.habitId) {
      const habit = habits.find(h => h.id === task.habitId);
      if (habit && habit.icon && ICON_EMOJIS[habit.icon]) {
        emoji = ICON_EMOJIS[habit.icon];
      }
    }

    return (
      <View key={task.id} style={[styles.taskItem, task.habitId && styles.habitTaskItem]}>
        <Pressable
          style={[styles.taskCheckbox, task.completed && styles.taskCheckboxCompleted]}
          onPress={() => handleToggleTask(task.id)}
        >
          <Text style={[styles.checkboxText, task.completed && styles.checkboxTextCompleted]}>
            {task.completed ? '✓' : ''}
          </Text>
        </Pressable>

        <View style={styles.taskContent}>
          <Text style={[styles.taskTitle, task.completed && styles.taskTitleCompleted]}>
            <Text style={{ marginRight: 8 }}>{emoji} </Text>
            {task.title}
          </Text>
        </View>

        <Pressable
          style={styles.deleteButton}
          onPress={() => handleDeleteTask(task.id)}
        >
          <TrashIcon color={colors.status.error} />
        </Pressable>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Cargando tareas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Botones de acción compactos */}
      <View style={styles.buttonsRow}>
        <Pressable
          style={[styles.actionButton, styles.habitsButton]}
          onPress={() => setShowHabitsModal(true)}
        >
          <SettingsIcon color={colors.text.secondary} size={20} />
        </Pressable>

        <Pressable
          style={styles.actionButton}
          onPress={() => setShowAddForm(!showAddForm)}
        >
          <PlusIcon color="#000" size={20} />
        </Pressable>

        <Pressable
            style={[styles.actionButton, styles.clearButton]}
            onPress={onClearTasks}
        >
           <TrashIcon color={colors.status.error} size={20} />
        </Pressable>
      </View>

      {/* Formulario agregar tarea */}
      {showAddForm && (
        <View style={styles.addForm}>
          <TextInput
            style={styles.input}
            placeholder="Título de la tarea"
            placeholderTextColor={colors.text.secondary}
            value={newTaskTitle}
            onChangeText={setNewTaskTitle}
            maxLength={100}
          />

          <View style={styles.formButtons}>
            <Pressable
              style={[styles.formButton, styles.cancelButton]}
              onPress={() => {
                setShowAddForm(false);
                setShowAddForm(false);
                setNewTaskTitle('');
              }}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </Pressable>
            <Pressable
              style={[styles.formButton, styles.saveButton]}
              onPress={handleAddTask}
            >
              <Text style={styles.saveButtonText}>Guardar</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Header Fijo de Tareas */}
      <View style={styles.fixedHeader}>
        <View>
          <Text style={styles.sectionTitle}>Pendientes ({pendingTasks.length})</Text>
          {tasks.length > 0 && (
            <Text style={styles.miniStatsText}>
              {Math.round((completedTasks.length / tasks.length) * 100)}% completado
            </Text>
          )}
        </View>

        {events.length > 0 && (
          <Pressable
            style={styles.eventCountButton}
            onPress={() => setShowEventsModal(true)}
          >
            <Text style={styles.eventCountText}>Ver eventos ({events.length})</Text>
          </Pressable>
        )}
      </View>

      {/* Lista de tareas */}
      <ScrollView style={styles.tasksList} showsVerticalScrollIndicator={false}>
        {/* Tareas pendientes */}
        {pendingTasks.length > 0 && (
          <View style={styles.taskSection}>
            {pendingTasks.map(renderTask)}
          </View>
        )}

        {/* Tareas completadas */}
        {completedTasks.length > 0 && (
          <View style={styles.taskSection}>
            <Text style={styles.completedTitle}>Completadas ({completedTasks.length})</Text>
            {completedTasks.map(renderTask)}
          </View>
        )}

        {/* Mensaje si no hay tareas */}
        {tasks.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No tienes tareas para este día. ¡Agrega una para comenzar!
            </Text>
          </View>
        )}
      </ScrollView>



      {/* Modal de eventos */}
      <Modal
        visible={showEventsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEventsModal(false)}
      >
        <View style={styles.eventsModalContainer}>
          <View style={styles.eventsModalHeader}>
            <TouchableOpacity onPress={() => setShowEventsModal(false)}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.eventsModalTitle}>Eventos del día</Text>
            <View style={{ width: 24 }} />
          </View>
          <ScrollView
            style={styles.eventsModalScroll}
            contentContainerStyle={styles.eventsModalScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {events && <EventsList events={events} plain={true} />}
          </ScrollView>
        </View>
      </Modal>

      {/* Modal de gestión de hábitos */}
      <HabitsModal
        visible={showHabitsModal}
        habits={habits}
        userId={userId}
        onClose={() => setShowHabitsModal(false)}
        onCreateHabit={onCreateHabit}
        onDeleteHabit={onDeleteHabit}
        onUpdateHabit={onUpdateHabit}
      />
    </View>
  );
};


const styles = TodoListStyles;

