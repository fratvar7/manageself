import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, Alert, ScrollView, Modal, TouchableOpacity } from 'react-native';
import { TrashIcon } from './Icons';
import { TodoListStyles } from '../css/Components/TodoList.styles';
import { colors } from '../css/colors';
import { ICON_EMOJIS } from '../constants/icons';
import { Task, Habit, CalendarEvent, Goal } from '../types';
import HabitsModal from './HabitsModal';
import { EventsList } from './EventsList';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ensureDate } from '../utils/dateUtils';
import { TaskStatsDashboard } from './TaskStatsDashboard';
import { ConfirmModal } from './ConfirmModal';
import { DatePickerModal } from './DatePickerModal';


interface TodoListProps {
  tasks: Task[];
  habits: Habit[];
  goals: Goal[];
  userId: string;
  onCreateTask: (task: { title: string; description?: string }) => Promise<void>;
  onToggleTask: (taskId: string) => Promise<void>;
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onCreateHabit: (habit: { title: string; description?: string; icon?: string; color?: string; frequency: number[] }) => Promise<void>;
  onDeleteHabit: (habitId: string) => Promise<void>;
  onUpdateHabit?: (habitId: string, updates: { title?: string; description?: string; icon?: string; color?: string; frequency?: number[] }) => Promise<void>;
  onCreateGoal: (goal: { title: string; description?: string; deadline: Date }) => Promise<void>;
  onToggleGoal: (goalId: string) => Promise<void>;
  onUpdateGoal?: (goalId: string, updates: Partial<Goal>) => Promise<void>;
  onDeleteGoal: (goalId: string) => Promise<void>;
  onClearTasks?: () => void;
  loading: boolean;
  events?: CalendarEvent[];
}

const styles = TodoListStyles;

export default function TodoList({
  tasks,
  habits,
  goals,
  userId,
  onCreateTask,
  onToggleTask,
  onUpdateTask,
  onDeleteTask,
  onCreateHabit,
  onDeleteHabit,
  onUpdateHabit,
  onCreateGoal,
  onToggleGoal,
  onUpdateGoal,
  onDeleteGoal,
  onClearTasks,
  loading,
  events = [],
}: TodoListProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [addType, setAddType] = useState<'task' | 'goal'>('task');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [goalDeadline, setGoalDeadline] = useState(new Date());
  const [showHabitsModal, setShowHabitsModal] = useState(false);
  const [showEventsModal, setShowEventsModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showFailModal, setShowFailModal] = useState<{ taskId: string; title: string } | null>(null);
  const [failReason, setFailReason] = useState('');
  const [showInfoModal, setShowInfoModal] = useState<Task | Goal | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showFailed, setShowFailed] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; type: 'task' | 'goal' } | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const insets = useSafeAreaInsets();


  const handleAddAction = async () => {
    if (!newTaskTitle.trim()) {
      Alert.alert('Error', 'Por favor ingresa un título');
      return;
    }

    try {
      if (addType === 'task') {
        await onCreateTask({ title: newTaskTitle.trim() });
      } else {
        await onCreateGoal({ title: newTaskTitle.trim(), deadline: goalDeadline });
      }

      // Limpiar formulario
      setNewTaskTitle('');
      setShowAddForm(false);
    } catch {
      Alert.alert('Error', 'No se pudo crear el elemento');
    }
  };


  const handleToggleTask = async (taskId: string) => {
    try {
      await onToggleTask(taskId);
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
    setItemToDelete({ id: taskId, type: 'task' });
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      if (itemToDelete.type === 'task') {
        await onDeleteTask(itemToDelete.id);
      } else {
        await onDeleteGoal(itemToDelete.id);
      }
      setItemToDelete(null);
    } catch {
      Alert.alert('Error', 'No se pudo eliminar el elemento');
    }
  };

  const completedTasks = [...tasks].filter(task => task.completed);
  const failedTasks = [...tasks].filter(task => task.failed && !task.completed);
  const pendingHabitTasks = [...tasks].filter(task => !task.completed && !task.failed && task.habitId);
  const pendingRegularTasks = [...tasks].filter(task => !task.completed && !task.failed && !task.habitId);
  const pendingTasksCount = pendingHabitTasks.length + pendingRegularTasks.length;

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
            <Text style={{ marginRight: 8, fontSize: 16 }}>{emoji} </Text>
            {task.title}
          </Text>
          {task.habitId && (
            <Text style={{ fontSize: 10, color: colors.accent.primary, fontWeight: '700', marginTop: 2, textTransform: 'uppercase' }}>HÁBITO DIARIO</Text>
          )}
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

  const renderGoal = (goal: Goal) => {
    const deadlineDate = ensureDate(goal.deadline);

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const deadlineReset = new Date(deadlineDate);
    deadlineReset.setHours(0, 0, 0, 0);

    const diffTime = deadlineReset.getTime() - now.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    const isOverdue = !goal.completed && diffDays < 0;

    const getDeadlineText = () => {
      const dateStr = deadlineDate.toLocaleDateString('es-ES');
      if (goal.completed) return `Meta: ${dateStr}`;
      if (diffDays === 0) return `Meta: ${dateStr} (Hoy)`;
      if (diffDays === 1) return `Meta: ${dateStr} (Mañana)`;
      if (diffDays > 1) return `Meta: ${dateStr} (${diffDays} días restantes)`;
      return `Meta: ${dateStr} (Vencido)`;
    };

    return (
      <View key={goal.id} style={[
        styles.taskItem,
        { backgroundColor: colors.background.tertiary, borderLeftWidth: 4, borderLeftColor: isOverdue ? colors.status.error : colors.accent.yellow, paddingVertical: 18 }
      ]}>
        <Pressable
          style={[
            styles.taskCheckbox,
            goal.completed && { backgroundColor: colors.accent.yellow, borderColor: colors.accent.yellow }
          ]}
          onPress={() => onToggleGoal(goal.id)}
        >
          <Text style={[
            styles.checkboxText,
            goal.completed && { color: '#000' }
          ]}>
            {goal.completed ? '✓' : ''}
          </Text>
        </Pressable>

        <Pressable
          style={styles.taskContent}
          onPress={() => onToggleGoal(goal.id)}
        >
          <Text style={[
            styles.taskTitle,
            { fontWeight: '800', fontSize: 16 },
            goal.completed && styles.taskTitleCompleted
          ]}>
            <Ionicons name="flag" size={14} color={isOverdue ? colors.status.error : colors.accent.yellow} /> {goal.title}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <Ionicons name="calendar-outline" size={12} color={isOverdue ? colors.status.error : colors.text.tertiary} />
            <Text style={{ fontSize: 11, color: isOverdue ? colors.status.error : colors.text.tertiary, marginLeft: 4, fontWeight: '600' }}>
              {getDeadlineText()}
            </Text>
          </View>
        </Pressable>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Pressable
            style={styles.deleteButton}
            onPress={() => setItemToDelete({ id: goal.id, type: 'goal' })}
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
      <View style={{ height: 10 }} />

      {/* Formulario agregar tarea/objetivo */}
      {showAddForm && (
        <View style={styles.addForm}>
          <View style={{ flexDirection: 'row', marginBottom: 15, backgroundColor: colors.background.tertiary, borderRadius: 10, padding: 4 }}>
            <TouchableOpacity
              onPress={() => setAddType('task')}
              style={{ flex: 1, paddingVertical: 8, alignItems: 'center', backgroundColor: addType === 'task' ? colors.button.primary : 'transparent', borderRadius: 8 }}
            >
              <Text style={{ color: addType === 'task' ? '#fff' : colors.text.secondary, fontWeight: '700', fontSize: 12 }}>TAREA</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setAddType('goal')}
              style={{ flex: 1, paddingVertical: 8, alignItems: 'center', backgroundColor: addType === 'goal' ? colors.accent.yellow : 'transparent', borderRadius: 8 }}
            >
              <Text style={{ color: addType === 'goal' ? '#000' : colors.text.secondary, fontWeight: '700', fontSize: 12 }}>OBJETIVO</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder={addType === 'task' ? "Título de la tarea" : "Nombre del objetivo (ej: Leer libro)"}
            placeholderTextColor={colors.text.secondary}
            value={newTaskTitle}
            onChangeText={setNewTaskTitle}
            maxLength={100}
          />

          {addType === 'goal' && (
            <View style={{ marginTop: 10 }}>
              <Text style={{ color: colors.text.tertiary, fontSize: 11, marginBottom: 5, fontWeight: '700' }}>FECHA LÍMITE</Text>
              <TouchableOpacity
                style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={{ color: colors.text.primary, fontSize: 14 }}>
                  {goalDeadline.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </Text>
                <Ionicons name="calendar-outline" size={18} color={colors.accent.yellow} />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.formButtons}>
            <Pressable
              style={[styles.formButton, styles.cancelButton]}
              onPress={() => {
                setShowAddForm(false);
                setNewTaskTitle('');
              }}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </Pressable>
            <Pressable
              style={[styles.formButton, styles.saveButton, addType === 'goal' && { backgroundColor: colors.accent.yellow }]}
              onPress={handleAddAction}
            >
              <Text style={[styles.saveButtonText, addType === 'goal' && { color: '#000' }]}>Guardar</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Header Fijo de Tareas */}
      <View style={styles.fixedHeader}>
        <View>
          <Text style={styles.sectionTitle}>Mi Jornada</Text>
          {tasks.length > 0 && (
            <Text style={styles.miniStatsText}>
              {pendingTasksCount} pendientes • {Math.round((completedTasks.length / tasks.length) * 100)}%
            </Text>
          )}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.accent.violet }]}
            onPress={() => setShowHabitsModal(true)}
          >
            <Ionicons name="bulb-outline" color="#fff" size={18} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.accent.primary }]}
            onPress={() => setShowAddForm(!showAddForm)}
          >
            <Ionicons name="add" color="#fff" size={20} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.status.error + '20' }]}
            onPress={onClearTasks}
          >
             <Ionicons name="trash-outline" color={colors.status.error} size={18} />
          </TouchableOpacity>

          <View style={{ width: 1, height: 24, backgroundColor: colors.border.light, marginHorizontal: 5 }} />

          <Pressable
            style={{
              padding: 8,
              backgroundColor: colors.background.tertiary,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: colors.border.light
            }}
            onPress={() => setShowStatsModal(true)}
          >
            <Ionicons name="stats-chart" size={18} color={colors.accent.primary} />
          </Pressable>

          {events.length > 0 && (
            <Pressable
              style={styles.eventCountButton}
              onPress={() => setShowEventsModal(true)}
            >
              <Text style={styles.eventCountText}>{events.length}</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Lista de tareas */}
      <ScrollView style={styles.tasksList} showsVerticalScrollIndicator={false}>
        {goals && goals.length > 0 && (
          <View style={[styles.taskSection, { marginBottom: 30, marginTop: 25 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15, gap: 10 }}>
               <View style={{ height: 1, flex: 1, backgroundColor: colors.accent.yellow + '30' }} />
               <Text style={{ color: colors.accent.yellow, fontSize: 13, fontWeight: '800', letterSpacing: 1.5 }}>OBJETIVOS ACTIVOS</Text>
               <View style={{ height: 1, flex: 1, backgroundColor: colors.accent.yellow + '30' }} />
            </View>
            {[...goals].sort((a, b) => {
               const diffA = ensureDate(a.deadline).getTime() - Date.now();
               const diffB = ensureDate(b.deadline).getTime() - Date.now();
               return diffA - diffB;
            }).map(renderGoal)}
          </View>
        )}

        {/* Sección de Hábitos */}
        {pendingHabitTasks.length > 0 && (
          <View style={[styles.taskSection, { marginBottom: 30 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15, gap: 10 }}>
               <View style={{ height: 1, flex: 1, backgroundColor: colors.accent.primary + '30' }} />
               <Text style={{ color: colors.accent.primary, fontSize: 11, fontWeight: '800', letterSpacing: 1.5 }}>HÁBITOS DEL DÍA</Text>
               <View style={{ height: 1, flex: 1, backgroundColor: colors.accent.primary + '30' }} />
            </View>
            {pendingHabitTasks.map(renderTask)}
          </View>
        )}

        {/* Tareas pendientes */}
        {pendingRegularTasks.length > 0 && (
          <View style={styles.taskSection}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15, gap: 10 }}>
               <View style={{ height: 1, flex: 1, backgroundColor: colors.text.tertiary + '30' }} />
               <Text style={{ color: colors.text.secondary, fontSize: 11, fontWeight: '800', letterSpacing: 1.5 }}>TAREAS PENDIENTES</Text>
               <View style={{ height: 1, flex: 1, backgroundColor: colors.text.tertiary + '30' }} />
            </View>
            {pendingRegularTasks.map(renderTask)}
          </View>
        )}

        {/* Tareas completadas */}
        {completedTasks.length > 0 && (
          <View style={styles.taskSection}>
            <Pressable
              style={styles.completedHeader}
              onPress={() => setShowCompleted(!showCompleted)}
            >
              <Text style={styles.completedTitle}>Completadas ({completedTasks.length})</Text>
              <Ionicons
                name={showCompleted ? "chevron-up" : "chevron-down"}
                size={20}
                color={colors.text.secondary}
                style={styles.toggleIcon}
              />
            </Pressable>
            {showCompleted && completedTasks.map(renderTask)}
          </View>
        )}

        {/* Tareas no realizadas */}
        {failedTasks.length > 0 && (
          <View style={styles.taskSection}>
            <Pressable
              style={styles.completedHeader}
              onPress={() => setShowFailed(!showFailed)}
            >
              <Text style={[styles.completedTitle, { color: colors.status.error }]}>
                No realizadas ({failedTasks.length})
              </Text>
              <Ionicons
                name={showFailed ? "chevron-up" : "chevron-down"}
                size={20}
                color={colors.status.error}
                style={styles.toggleIcon}
              />
            </Pressable>
            {showFailed && failedTasks.map(renderTask)}
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
                  {showInfoModal?.createdAt ? ensureDate(showInfoModal.createdAt).toLocaleString('es-ES') : 'N/A'}
                </Text>
              </View>

              {showInfoModal && 'failReason' in showInfoModal && showInfoModal.failed && (
                <View>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: colors.text.secondary, textTransform: 'uppercase' }}>Motivo de incumplimiento</Text>
                  <Text style={{ fontSize: 14, color: colors.status.error, fontStyle: 'italic' }}>"{showInfoModal.failReason}"</Text>
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

      {/* Dashboard de Estadísticas */}
      <TaskStatsDashboard
        visible={showStatsModal}
        onClose={() => setShowStatsModal(false)}
        userId={userId}
      />

      {/* Modal de confirmación global */}
      <ConfirmModal
        visible={!!itemToDelete}
        title={itemToDelete?.type === 'task' ? 'Eliminar Tarea' : 'Eliminar Objetivo'}
        message={`¿Estás seguro de que quieres eliminar este ${itemToDelete?.type === 'task' ? 'tarea' : 'objetivo'}? Esta acción no se puede deshacer.`}
        onConfirm={confirmDelete}
        onCancel={() => setItemToDelete(null)}
        confirmText="Eliminar"
        isDestructive={true}
      />

      <DatePickerModal
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onSelectDate={setGoalDeadline}
        initialDate={goalDeadline}
        title="Seleccionar meta"
      />
    </View>
  );
}
