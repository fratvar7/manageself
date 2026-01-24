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
import { useSafeAreaInsets } from 'react-native-safe-area-context';


interface TodoListProps {
  tasks: Task[];
  habits: Habit[];
  userId: string;
  onCreateTask: (task: { title: string; description?: string }) => Promise<void>;
  onToggleTask: (taskId: string) => Promise<void>;
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => Promise<void>;
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
  onUpdateTask,
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
  const [showFailModal, setShowFailModal] = useState<{ taskId: string; title: string } | null>(null);
  const [failReason, setFailReason] = useState('');
  const [showInfoModal, setShowInfoModal] = useState<Task | null>(null);
  const insets = useSafeAreaInsets();

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
      const task = tasks.find(t => t.id === taskId);
      if (task?.failed) {
        // Si estaba fallida, al darle volvemos a pendiente (o completada si lo prefieres, pero usualmente es un toggle de estado)
        await onToggleTask(taskId);
      } else {
        await onToggleTask(taskId);
      }
    } catch {
      Alert.alert('Error', 'No se pudo actualizar la tarea');
    }
  };

  const handleFailTask = async () => {
    if (!showFailModal || !failReason.trim()) {
      Alert.alert('Error', 'Por favor ingresa un motivo');
      return;
    }

    try {
      if (onUpdateTask) {
        await onUpdateTask(showFailModal.taskId, {
          failed: true,
          completed: false,
          failReason: failReason.trim(),
        });
        setShowFailModal(null);
        setFailReason('');
      }
    } catch {
      Alert.alert('Error', 'No se pudo marcar como fallida');
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
  const failedTasks = tasks.filter(task => task.failed && !task.completed);
  const pendingTasks = tasks.filter(task => !task.completed && !task.failed);

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
      <View key={task.id} style={[
        styles.taskItem,
        task.habitId && styles.habitTaskItem,
        task.failed && { borderLeftColor: colors.status.error, borderLeftWidth: 3 }
      ]}>
        <Pressable
          style={[
            styles.taskCheckbox,
            task.completed && styles.taskCheckboxCompleted,
            task.failed && { borderColor: colors.status.error, backgroundColor: 'transparent' }
          ]}
          onPress={() => handleToggleTask(task.id)}
        >
          <Text style={[
            styles.checkboxText,
            task.completed && styles.checkboxTextCompleted,
            task.failed && { color: colors.status.error }
          ]}>
            {task.completed ? '✓' : task.failed ? '✕' : ''}
          </Text>
        </Pressable>

        <Pressable
          style={styles.taskContent}
          onPress={() => handleToggleTask(task.id)}
        >
          <Text style={[
            styles.taskTitle,
            task.completed && styles.taskTitleCompleted,
            task.failed && { color: colors.status.error, textDecorationLine: 'line-through' }
          ]}>
            <Text style={{ marginRight: 8 }}>{emoji} </Text>
            {task.title}
          </Text>
        </Pressable>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {!task.completed && !task.failed && (
            <Pressable
              style={{ padding: 8 }}
              onPress={() => setShowFailModal({ taskId: task.id, title: task.title })}
            >
              <Ionicons name="close-circle-outline" size={24} color={colors.status.error} />
            </Pressable>
          )}

          {(task.failed || task.description) && (
            <Pressable
              style={{ padding: 8 }}
              onPress={() => setShowInfoModal(task)}
            >
              <Ionicons name="information-circle-outline" size={24} color={colors.button.primary} />
            </Pressable>
          )}

          <Pressable
            style={styles.deleteButton}
            onPress={() => handleDeleteTask(task.id)}
          >
            <TrashIcon color={colors.status.error} />
          </Pressable>
        </View>
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
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
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

        {/* Tareas no realizadas */}
        {failedTasks.length > 0 && (
          <View style={styles.taskSection}>
            <Text style={[styles.completedTitle, { color: colors.status.error }]}>No realizadas ({failedTasks.length})</Text>
            {failedTasks.map(renderTask)}
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



      {/* Modal para motivo de no cumplimiento */}
      <Modal
        visible={!!showFailModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFailModal(null)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: colors.background.secondary, borderRadius: 16, padding: 20, width: '100%', maxWidth: 400 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text.primary, marginBottom: 10 }}>Motivo de incumplimiento</Text>
            <Text style={{ fontSize: 14, color: colors.text.secondary, marginBottom: 15 }}>{showFailModal?.title}</Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              placeholder="¿Por qué no se hizo?"
              placeholderTextColor={colors.text.secondary}
              value={failReason}
              onChangeText={setFailReason}
              multiline
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              <Pressable style={[styles.formButton, styles.cancelButton]} onPress={() => setShowFailModal(null)}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </Pressable>
              <Pressable style={[styles.formButton, styles.saveButton]} onPress={handleFailTask}>
                <Text style={styles.saveButtonText}>Guardar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Info */}
      <Modal
        visible={!!showInfoModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowInfoModal(null)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: colors.background.secondary, borderRadius: 16, padding: 20, width: '100%', maxWidth: 400 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text.primary }}>Detalles de Tarea</Text>
              <Pressable onPress={() => setShowInfoModal(null)}>
                <Ionicons name="close" size={24} color={colors.text.secondary} />
              </Pressable>
            </View>

            <View style={{ gap: 12 }}>
              <View>
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.text.secondary, textTransform: 'uppercase' }}>Título</Text>
                <Text style={{ fontSize: 16, color: colors.text.primary }}>{showInfoModal?.title}</Text>
              </View>

              <View>
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.text.secondary, textTransform: 'uppercase' }}>Estado</Text>
                <Text style={{ fontSize: 14, color: showInfoModal?.completed ? colors.status.success : showInfoModal?.failed ? colors.status.error : colors.text.secondary }}>
                  {showInfoModal?.completed ? '✅ Completada' : showInfoModal?.failed ? '❌ No cumplida' : '⏳ Pendiente'}
                </Text>
              </View>

              <View>
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.text.secondary, textTransform: 'uppercase' }}>Fecha de creación</Text>
                <Text style={{ fontSize: 14, color: colors.text.primary }}>
                  {showInfoModal?.createdAt ? new Date(showInfoModal.createdAt.toDate()).toLocaleString() : 'N/A'}
                </Text>
              </View>

              {showInfoModal?.failed && (
                <View>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: colors.text.secondary, textTransform: 'uppercase' }}>Motivo de incumplimiento</Text>
                  <Text style={{ fontSize: 14, color: colors.status.error, fontStyle: 'italic' }}>"{showInfoModal?.failReason}"</Text>
                </View>
              )}

              {showInfoModal?.description && (
                <View>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: colors.text.secondary, textTransform: 'uppercase' }}>Descripción</Text>
                  <Text style={{ fontSize: 14, color: colors.text.primary }}>{showInfoModal?.description}</Text>
                </View>
              )}
            </View>

            <Pressable
              style={[styles.formButton, styles.saveButton, { marginTop: 20 }]}
              onPress={() => setShowInfoModal(null)}
            >
              <Text style={styles.saveButtonText}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Modal de eventos */}
      <Modal
        visible={showEventsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEventsModal(false)}
      >
        <View style={[styles.eventsModalContainer, { paddingTop: insets.top }]}>
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

