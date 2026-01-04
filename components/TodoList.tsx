
import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, Alert, ScrollView, StyleSheet } from 'react-native';
import { PlusIcon, TrashIcon, SettingsIcon } from './Icons';
import { colors } from '../css/colors';
import { Task, Habit } from '../types';
import HabitsModal from './HabitsModal';


interface TodoListProps {
  tasks: Task[];
  habits: Habit[];
  userId: string;
  onCreateTask: (task: { title: string; description?: string }) => Promise<void>;
  onToggleTask: (taskId: string) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onCreateHabit: (habit: { title: string; description?: string; icon?: string; color?: string }) => Promise<void>;
  onDeleteHabit: (habitId: string) => Promise<void>;
  onUpdateHabit?: (habitId: string, updates: { title?: string; description?: string; icon?: string; color?: string }) => Promise<void>;
  loading: boolean;
}


const TodoList: React.FC<TodoListProps> = ({
  tasks,
  habits,
  userId,
  onCreateTask,
  onToggleTask,
  onDeleteTask,
  onCreateHabit,
  onDeleteHabit,
  onUpdateHabit,
  loading
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [showHabitsModal, setShowHabitsModal] = useState(false);

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) {
      Alert.alert('Error', 'Por favor ingresa un título para la tarea');
      return;
    }

    try {
      await onCreateTask({
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim() || undefined,
      });

      // Limpiar formulario
      setNewTaskTitle('');
      setNewTaskDescription('');
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

  const renderTask = (task: Task) => (
    <View key={task.id} style={styles.taskItem}>
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
          {task.title}
        </Text>
        {task.description && (
          <Text style={[styles.taskDescription, task.completed && styles.taskDescriptionCompleted]}>
            {task.description}
          </Text>
        )}
        {task.habitId && (
          <Text style={styles.habitBadge}>Hábito</Text>
        )}
      </View>

      <Pressable
        style={styles.deleteButton}
        onPress={() => handleDeleteTask(task.id)}
      >
        <TrashIcon color={colors.status.error} />
      </Pressable>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Cargando tareas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Estadísticas */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{tasks.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{completedTasks.length}</Text>
          <Text style={styles.statLabel}>Completadas</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{pendingTasks.length}</Text>
          <Text style={styles.statLabel}>Pendientes</Text>
        </View>
      </View>

      {/* Botón agregar tarea */}
      <View style={styles.buttonsRow}>
        <Pressable
          style={[styles.addButton, styles.halfWidth]}
          onPress={() => setShowAddForm(!showAddForm)}
        >
          <PlusIcon />
          <Text style={styles.addButtonText}>Agregar tarea</Text>
        </Pressable>

        <Pressable
          style={[styles.addButton, styles.halfWidth, styles.habitsButton]}
          onPress={() => setShowHabitsModal(true)}
        >
          <SettingsIcon />
          <Text style={styles.addButtonText}>Configurar hábitos</Text>
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
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Descripción (opcional)"
            placeholderTextColor={colors.text.secondary}
            value={newTaskDescription}
            onChangeText={setNewTaskDescription}
            multiline
            maxLength={300}
          />
          <View style={styles.formButtons}>
            <Pressable
              style={[styles.formButton, styles.cancelButton]}
              onPress={() => {
                setShowAddForm(false);
                setNewTaskTitle('');
                setNewTaskDescription('');
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

      {/* Lista de tareas */}
      <ScrollView style={styles.tasksList} showsVerticalScrollIndicator={false}>
        {/* Tareas pendientes */}
        {pendingTasks.length > 0 && (
          <View style={styles.taskSection}>
            <Text style={styles.sectionTitle}>Pendientes ({pendingTasks.length})</Text>
            {pendingTasks.map(renderTask)}
          </View>
        )}

        {/* Tareas completadas */}
        {completedTasks.length > 0 && (
          <View style={styles.taskSection}>
            <Text style={styles.sectionTitle}>Completadas ({completedTasks.length})</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.button.primary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 8,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  halfWidth: {
    flex: 1,
  },
  habitsButton: {
    backgroundColor: colors.accent.blue,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  addForm: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  input: {
    backgroundColor: colors.background.primary,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text.primary,
    marginBottom: 12,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  formButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  cancelButtonText: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: colors.button.primary,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  tasksList: {
    flex: 1,
  },
  taskSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  taskCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  taskCheckboxCompleted: {
    backgroundColor: colors.button.primary,
    borderColor: colors.button.primary,
  },
  checkboxText: {
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkboxTextCompleted: {
    color: 'white',
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: 4,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: colors.text.secondary,
  },
  taskDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  taskDescriptionCompleted: {
    textDecorationLine: 'line-through',
  },
  habitBadge: {
    fontSize: 12,
    color: colors.button.primary,
    backgroundColor: colors.background.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  loadingText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 40,
  },
});

 

export default TodoList;
