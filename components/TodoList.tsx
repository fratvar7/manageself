import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, Alert, ScrollView, Modal, TouchableOpacity, Platform } from 'react-native';
import { TrashIcon } from './Icons';
import { TodoListStyles } from '../css/Components/TodoList.styles';
import { colors } from '../css/colors';
import { ICON_EMOJIS, CATEGORY_COLORS } from '../constants/icons';
import { Task, Habit, CalendarEvent, Goal } from '../types';
import HabitsModal from './HabitsModal';
import { EventsList } from './EventsList';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ensureDate, formatDateISO } from '../utils/dateUtils';
import { TaskStatsDashboard } from './TaskStatsDashboard';
import { ConfirmModal } from './ConfirmModal';
import { DatePickerModal } from './DatePickerModal';
import { EventModal } from './EventModal';

interface TodoListProps {
  tasks: Task[];
  habits: Habit[];
  goals: Goal[];
  userId: string;
  onCreateTask: (task: { title: string; description?: string; time?: string }) => Promise<void>;
  onToggleTask: (taskId: string) => Promise<void>;
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onCreateHabit: (habit: { title: string; description?: string; icon?: string; color?: string; frequency: number[] }) => Promise<void>;
  onDeleteHabit: (habitId: string) => Promise<void>;
  onUpdateHabit?: (habitId: string, updates: { title?: string; description?: string; icon?: string; color?: string; frequency?: number[]; time?: string }) => Promise<void>;
  onCreateGoal: (goal: { title: string; description?: string; deadline: Date }) => Promise<void>;
  onToggleGoal: (goalId: string) => Promise<void>;
  onUpdateGoal?: (goalId: string, updates: Partial<Goal>) => Promise<void>;
  onDeleteGoal: (goalId: string) => Promise<void>;
  onClearTasks?: () => void;
  onLoadHabits?: () => void;
  loading: boolean;
  upcomingEvents?: CalendarEvent[];
  selectedDate: string;
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
  onLoadHabits,
  loading,
  upcomingEvents = [],
  selectedDate,
}: TodoListProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [addType, setAddType] = useState<'task' | 'goal'>('task');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskTime, setNewTaskTime] = useState<string | undefined>(undefined);
  const [goalDeadline, setGoalDeadline] = useState(new Date());
  const [showHabitsModal, setShowHabitsModal] = useState(false);
  const [showEventsModal, setShowEventsModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showFailModal, setShowFailModal] = useState<{ taskId: string; title: string } | null>(null);
  const [failReason, setFailReason] = useState('');
  const [showInfoModal, setShowInfoModal] = useState<Task | Goal | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showFailed, setShowFailed] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; type: 'task' | 'goal' | 'event'; title?: string } | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState<{ id: string; type: 'task' | 'goal'; title: string; currentNote: string } | null>(null);
  const [tempNote, setTempNote] = useState('');
  const [tempTitle, setTempTitle] = useState('');
  const [tempTime, setTempTime] = useState<string | undefined>(undefined);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const insets = useSafeAreaInsets();


  const handleAddAction = async () => {
    if (isSaving) return;
    if (!newTaskTitle.trim()) {
      Alert.alert('Error', 'Por favor ingresa un título');
      return;
    }

    try {
      setIsSaving(true);
      if (addType === 'task') {
        await onCreateTask({ title: newTaskTitle.trim(), time: newTaskTime });
      } else {
        await onCreateGoal({ title: newTaskTitle.trim(), deadline: goalDeadline });
      }

      // Limpiar formulario
      setNewTaskTitle('');
      setNewTaskTime(undefined);
      setShowAddForm(false);
    } catch {
      Alert.alert('Error', 'No se pudo crear el elemento');
    } finally {
      setIsSaving(false);
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

  const handleSaveNote = async () => {
    if (!showNoteModal) return;

    try {
      if (showNoteModal.type === 'task') {
        if (onUpdateTask) {
          await onUpdateTask(showNoteModal.id, {
            title: tempTitle.trim(),
            description: tempNote.trim(),
            time: tempTime
          });
        }
      } else {
        if (onUpdateGoal) {
          await onUpdateGoal(showNoteModal.id, {
            title: tempTitle.trim(),
            description: tempNote.trim()
          });
        }
      }
      setShowNoteModal(null);
      setTempNote('');
      setTempTitle('');
      setTempTime(undefined);
    } catch {
      Alert.alert('Error', 'No se pudo guardar los cambios');
    }
  };

  const handleLongPress = (item: Task | Goal, type: 'task' | 'goal') => {
    setTempNote(item.description || '');
    setTempTitle(item.title);
    setTempTime('time' in item ? item.time : undefined);
    setShowNoteModal({
      id: item.id,
      type,
      title: item.title,
      currentNote: item.description || ''
    });
  };

  const completedTasks = [...tasks].filter(task => task.completed);
  const failedTasks = [...tasks].filter(task => task.failed && !task.completed);
  const allHabitTasks = [...tasks].filter(task => task.habitId);
  const pendingHabitTasks = allHabitTasks.filter(task => !task.completed && !task.failed);
  const failedHabitTasks = allHabitTasks.filter(task => task.failed);
  const pendingRegularTasks = [...tasks].filter(task => !task.completed && !task.failed && !task.habitId);
  const pendingTasksCount = pendingHabitTasks.length + pendingRegularTasks.length;

  const sortItemsByTime = (a: Task, b: Task) => {
    // 1. Ordenar por tiempo
    if (a.time && !b.time) return -1;
    if (!a.time && b.time) return 1;
    if (a.time && b.time) {
      const timeCompare = a.time.localeCompare(b.time);
      if (timeCompare !== 0) return timeCompare;
    }

    // 2. Ordenar por icono/categoría si es un hábito
    const habitA = a.habitId ? habits.find(h => h.id === a.habitId) : null;
    const habitB = b.habitId ? habits.find(h => h.id === b.habitId) : null;

    const iconA = habitA?.icon || '';
    const iconB = habitB?.icon || '';

    if (iconA || iconB) {
      return iconA.localeCompare(iconB);
    }

    // 3. Por defecto, orden de creación
    return 0;
  };

  const sortedPendingRegularTasks = [...pendingRegularTasks].sort(sortItemsByTime);
  const sortedPendingHabitTasks = [...pendingHabitTasks].sort(sortItemsByTime);

  const renderTask = (task: Task) => {
    // Determine emoji
    const habit = task.habitId ? habits.find(h => h.id === task.habitId) : null;
    const emoji = habit?.icon && ICON_EMOJIS[habit.icon] ? ICON_EMOJIS[habit.icon] : ICON_EMOJIS.default;
    const categoryColor = habit?.icon ? CATEGORY_COLORS[habit.icon as keyof typeof CATEGORY_COLORS] : null;

    return (
      <View key={task.id} style={[
        styles.taskItem,
        task.habitId ? styles.habitTaskItem : styles.regularTaskItem,
        task.failed && { borderLeftColor: colors.status.error, borderLeftWidth: 3 }
      ]}>
        {/* Renderizado del Icono de Hábito o Emoji de Tarea */}
        <View style={{ marginRight: 12 }}>
          {task.habitId ? (
            <View style={[
              styles.habitIconContainer,
              { borderColor: categoryColor || colors.border.default }
            ]}>
              <Text style={styles.habitIconEmoji}>{emoji}</Text>
            </View>
          ) : (
            <Text style={{ fontSize: 24 }}>{emoji}</Text>
          )}
        </View>

        <Pressable
          style={[
            styles.taskCheckbox,
            task.completed && (task.habitId ? { backgroundColor: colors.accent.violet, borderColor: colors.accent.violet } : styles.taskCheckboxCompleted),
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
          onLongPress={() => handleLongPress(task, 'task')}
          delayLongPress={500}
        >
          <Text style={[
            styles.taskTitle,
            task.completed && styles.taskTitleCompleted,
            task.failed && { color: colors.status.error, textDecorationLine: 'line-through' }
          ]}>
            {task.title}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {task.habitId && (
              <Text style={{ fontSize: 10, color: colors.accent.violet, fontWeight: '700', marginTop: 2, textTransform: 'uppercase' }}>HÁBITO DIARIO</Text>
            )}
            {task.time && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                <Ionicons
                  name="time-outline"
                  size={12}
                  color={task.habitId ? colors.accent.violet : colors.accent.primary}
                />
                <Text style={{
                  fontSize: 11,
                  color: task.habitId ? colors.accent.violet : colors.accent.primary,
                  fontWeight: '700',
                  marginLeft: 4
                }}>{task.time}</Text>
              </View>
            )}
          </View>
          {task.description && (
            <Text style={{ fontSize: 12, color: colors.text.secondary, marginTop: 4 }} numberOfLines={1}>
                <Ionicons name="document-text-outline" size={12} /> {task.description}
            </Text>
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
          onLongPress={() => handleLongPress(goal, 'goal')}
          delayLongPress={500}
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
          {goal.description && (
            <Text style={{ fontSize: 12, color: colors.text.secondary, marginTop: 4 }} numberOfLines={1}>
                <Ionicons name="document-text-outline" size={12} /> {goal.description}
            </Text>
          )}
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

          {addType === 'task' && (
            <View style={{ marginTop: 10 }}>
              <Text style={{ color: colors.text.tertiary, fontSize: 11, marginBottom: 5, fontWeight: '700' }}>HORA (OPCIONAL)</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  style={[styles.input, { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
                  onPress={() => {
                    setTempTime(newTaskTime || '09:00');
                    setShowTimePicker(true);
                  }}
                >
                  <Text style={{ color: newTaskTime ? colors.text.primary : colors.text.tertiary, fontSize: 14 }}>
                    {newTaskTime || 'Sin hora'}
                  </Text>
                  <Ionicons name="time-outline" size={18} color={newTaskTime ? colors.accent.primary : colors.text.tertiary} />
                </TouchableOpacity>
                {newTaskTime && (
                  <TouchableOpacity
                    style={[styles.input, { paddingHorizontal: 12, justifyContent: 'center' }]}
                    onPress={() => setNewTaskTime(undefined)}
                  >
                    <Ionicons name="close-circle" size={18} color={colors.status.error} />
                  </TouchableOpacity>
                )}
              </View>
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
              style={[styles.formButton, styles.saveButton, addType === 'goal' && { backgroundColor: colors.accent.yellow }, isSaving && { opacity: 0.7 }]}
              onPress={handleAddAction}
              disabled={isSaving}
            >
              <Text style={[styles.saveButtonText, addType === 'goal' && { color: '#000' }]}>
                {isSaving ? 'Guardando...' : 'Guardar'}
              </Text>
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

          {upcomingEvents && upcomingEvents.length > 0 && (
            <Pressable
              style={styles.eventCountButton}
              onPress={() => setShowEventsModal(true)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="calendar-outline" size={18} color={colors.button.primary} />
                  <Text style={styles.eventCountText}>{upcomingEvents.length}</Text>
              </View>
            </Pressable>
          )}
        </View>
      </View>

      {/* Lista de tareas */}
      <ScrollView style={styles.tasksList} showsVerticalScrollIndicator={false}>
        {/* Sección de Tareas Personales */}
        <View style={styles.taskSection}>
          <Text style={[styles.sectionTitle, { fontSize: 14, color: colors.accent.primary, marginBottom: 12 }]}>TAREAS DE HOY</Text>
          {sortedPendingRegularTasks.length > 0 ? (
            sortedPendingRegularTasks.map(renderTask)
          ) : tasks.filter(t => !t.habitId).length > 0 ? (
            /* Caso: Todas las tareas completadas */
            <View style={[
              styles.emptySectionButton,
              { borderStyle: 'dashed', borderColor: colors.status.success + '40', backgroundColor: colors.background.tertiary, flexDirection: 'column', gap: 4 }
            ]}>
              <Ionicons name="checkmark-circle" size={24} color={colors.status.success} />
              <Text style={[styles.emptyTaskText, { color: colors.status.success, marginBottom: 2 }]}>
                ¡TAREAS DE HOY COMPLETADAS!
              </Text>
              <Text style={{ color: colors.text.tertiary, fontSize: 12, textAlign: 'center' }}>
                Pulsa el icono (+) si quieres añadir más tareas.
              </Text>
            </View>
          ) : (
            /* Caso original: No hay tareas creadas */
            <TouchableOpacity
              style={[styles.emptySectionButton, styles.emptyTaskButton]}
              onPress={() => {
                setAddType('task');
                setShowAddForm(true);
              }}
            >
              <Ionicons name="add-circle-outline" size={20} color={colors.accent.primary} />
              <Text style={styles.emptyTaskText}>Crea tu primera tarea</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Sección de Hábitos */}
        <View style={styles.taskSection}>
          <Text style={[styles.sectionTitle, { fontSize: 14, color: colors.accent.violet, marginBottom: 12 }]}>HÁBITOS DE HOY</Text>

          {allHabitTasks.length > 0 && pendingHabitTasks.length === 0 ? (
            /* Mostrar resumen de completados si hay tareas y ninguna pendiente */
            <View style={[
              {
                alignItems: 'center',
                backgroundColor: colors.background.tertiary,
                padding: 20,
                borderRadius: 16,
                borderStyle: 'dashed',
                borderWidth: 1,
                borderColor: failedHabitTasks.length > 0 ? colors.accent.violet + '40' : colors.status.success + '40'
              }
            ]}>
              <Ionicons
                name={failedHabitTasks.length > 0 ? "stats-chart" : "checkmark-circle"}
                size={32}
                color={failedHabitTasks.length > 0 ? colors.accent.violet : colors.status.success}
              />
              <Text style={[
                styles.sectionTitle,
                {
                  fontSize: 14,
                  color: failedHabitTasks.length > 0 ? colors.accent.violet : colors.status.success,
                  marginTop: 10,
                  marginBottom: 4,
                  textAlign: 'center',
                  textTransform: 'uppercase'
                }
              ]}>
                {failedHabitTasks.length > 0 ? 'Resumen de hábitos' : '¡Hábitos completados!'}
              </Text>
              <Text style={{ color: colors.text.secondary, fontSize: 12, textAlign: 'center' }}>
                {failedHabitTasks.length > 0
                  ? `Has completado ${allHabitTasks.filter(t => t.completed).length} de los ${allHabitTasks.length} hábitos`
                  : 'Has cumplido todos tus hábitos para hoy'}
              </Text>
            </View>
          ) : pendingHabitTasks.length > 0 ? (
            /* Mostrar lista de hábitos pendientes */
            sortedPendingHabitTasks.map(renderTask)
          ) : habits.length === 0 ? (
            /* Caso solicitado: No hay hábitos creados */
            <TouchableOpacity
              style={[styles.emptySectionButton, styles.emptyHabitButton]}
              onPress={() => setShowHabitsModal(true)}
            >
              <Ionicons name="bulb-outline" size={20} color={colors.accent.violet} />
              <Text style={styles.emptyHabitText}>CREA TU PRIMER HÁBITO</Text>
            </TouchableOpacity>
          ) : (
            /* Hay hábitos pero no hay tareas generadas para hoy */
            <TouchableOpacity
              style={[styles.emptySectionButton, styles.emptyHabitButton]}
              onPress={onLoadHabits}
            >
              <Ionicons name="refresh" size={20} color={colors.accent.violet} />
              <Text style={styles.emptyHabitText}>CARGAR HÁBITOS DE HOY</Text>
            </TouchableOpacity>
          )}
        </View>

        {(() => {
          const visibleGoals = goals.filter(goal => {
            if (!goal.completed) return true;
            if (!goal.completedAt) return false;
            try {
              // Convertir Timestamp a string YYYY-MM-DD para comparar
              const completedDate = formatDateISO(goal.completedAt.toDate());
              return completedDate === selectedDate;
            } catch {
              return false;
            }
          });

          if (visibleGoals.length === 0) return null;

          return (
            <View style={styles.taskSection}>
              <Text style={[styles.sectionTitle, { fontSize: 14, color: colors.accent.yellow, marginBottom: 12 }]}>OBJETIVOS Y METAS</Text>
              {visibleGoals.map(renderGoal)}
            </View>
          );
        })()}



        {(completedTasks.length > 0 || failedTasks.length > 0) && (
          <View style={{ marginTop: 20 }}>
            <TouchableOpacity
              style={styles.completedHeader}
              onPress={() => setShowCompleted(!showCompleted)}
            >
              <Text style={styles.completedTitle}>Finalizadas ({completedTasks.length})</Text>
              <Ionicons
                name={showCompleted ? "chevron-up" : "chevron-down"}
                size={20}
                color={colors.text.secondary}
                style={styles.toggleIcon}
              />
            </TouchableOpacity>

            {showCompleted && completedTasks.map(renderTask)}

            {failedTasks.length > 0 && (
              <>
                <TouchableOpacity
                  style={[styles.completedHeader, { marginTop: 10 }]}
                  onPress={() => setShowFailed(!showFailed)}
                >
                  <Text style={[styles.completedTitle, { color: colors.status.error }]}>No cumplidas ({failedTasks.length})</Text>
                  <Ionicons
                    name={showFailed ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={colors.status.error}
                    style={styles.toggleIcon}
                  />
                </TouchableOpacity>

                {showFailed && failedTasks.map(renderTask)}
              </>
            )}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Modal de Fallo */}
      <Modal
        visible={!!showFailModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFailModal(null)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: colors.background.secondary, borderRadius: 16, padding: 20, width: '100%', maxWidth: 400 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text.primary, marginBottom: 5 }}>Tarea no cumplida</Text>
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

      {/* Modal de Nota (Anotaciones) */}
      <Modal
        visible={!!showNoteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowNoteModal(null)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: colors.background.secondary, borderRadius: 16, padding: 20, width: '100%', maxWidth: 400 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text.primary, marginBottom: 5 }}>
              Detalles
            </Text>
            <Text style={{ fontSize: 14, color: colors.text.secondary, marginBottom: 15 }}>
              {showNoteModal?.type === 'task' ? 'Edita el título, nota y hora' : 'Edita el título y la nota'}
            </Text>

            <View style={{ marginBottom: 15 }}>
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.text.tertiary, marginBottom: 5, textTransform: 'uppercase' }}>Título</Text>
              <TextInput
                style={styles.input}
                placeholder="Título"
                placeholderTextColor={colors.text.secondary}
                value={tempTitle}
                onChangeText={setTempTitle}
              />
            </View>

            <View style={{ marginBottom: 15 }}>
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.text.tertiary, marginBottom: 5, textTransform: 'uppercase' }}>Nota</Text>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                placeholder="Escribe una nota..."
                placeholderTextColor={colors.text.secondary}
                value={tempNote}
                onChangeText={setTempNote}
                multiline
              />
            </View>

            {showNoteModal?.type === 'task' && (
              <View style={{ marginBottom: 15 }}>
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.text.tertiary, marginBottom: 5, textTransform: 'uppercase' }}>Hora (Opcional)</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Pressable
                    style={[styles.input, { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
                    onPress={() => setShowTimePicker(true)}
                  >
                    <Text style={{ color: tempTime ? colors.text.primary : colors.text.tertiary }}>
                      {tempTime || 'Sin hora'}
                    </Text>
                    <Ionicons name="time-outline" size={18} color={tempTime ? colors.accent.primary : colors.text.tertiary} />
                  </Pressable>
                  {tempTime && (
                    <Pressable
                      style={[styles.input, { paddingHorizontal: 12, justifyContent: 'center' }]}
                      onPress={() => setTempTime(undefined)}
                    >
                      <Ionicons name="close-circle" size={18} color={colors.status.error} />
                    </Pressable>
                  )}
                </View>
              </View>
            )}

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              <Pressable style={[styles.formButton, styles.cancelButton]} onPress={() => setShowNoteModal(null)}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </Pressable>
              <Pressable style={[styles.formButton, styles.saveButton]} onPress={handleSaveNote}>
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
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text.primary }}>Detalles de la tarea</Text>
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
                  <Text style={{ fontSize: 12, fontWeight: '600', color: colors.status.error, textTransform: 'uppercase' }}>Motivo del incumplimiento</Text>
                  <Text style={{ fontSize: 14, color: colors.text.primary }}>{showInfoModal?.failReason}</Text>
                </View>
              )}

              {showInfoModal?.description && (
                <View>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: colors.text.secondary, textTransform: 'uppercase' }}>Anotaciones</Text>
                  <Text style={{ fontSize: 14, color: colors.text.primary }}>{showInfoModal?.description}</Text>
                </View>
              )}
            </View>

            <Pressable
              style={[styles.formButton, styles.saveButton, { marginTop: 20, flex: 0, width: '100%' }]}
              onPress={() => setShowInfoModal(null)}
            >
              <Text style={styles.saveButtonText}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Custom Time Picker */}
      <Modal visible={showTimePicker} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.background.secondary, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, paddingBottom: 40 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text.primary, textAlign: 'center', marginBottom: 20 }}>Seleccionar Hora</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', height: 200, justifyContent: 'center' }}>
              <ScrollView
                style={{ flex: 1, maxWidth: 80 }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingVertical: 80 }}
              >
                {Array.from({ length: 24 }).map((_, i) => {
                  const h = i.toString().padStart(2, '0');
                  const isSelected = (tempTime || '09:00').startsWith(h);
                  return (
                    <TouchableOpacity
                      key={h}
                      style={[{ height: 50, justifyContent: 'center', alignItems: 'center' }, isSelected && { backgroundColor: colors.accent.primary + '20', borderRadius: 12 }]}
                      onPress={() => {
                        const m = (tempTime || '09:00').split(':')[1] || '00';
                        setTempTime(`${h}:${m}`);
                      }}
                    >
                      <Text style={[{ fontSize: 24, color: colors.text.tertiary, fontWeight: '600' }, isSelected && { fontSize: 28, color: colors.accent.primary, fontWeight: '800' }]}>{h}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              <Text style={{ fontSize: 32, fontWeight: '800', color: colors.text.primary, marginHorizontal: 10 }}>:</Text>
              <ScrollView
                style={{ flex: 1, maxWidth: 80 }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingVertical: 80 }}
              >
                {['00', '15', '30', '45'].map((m) => {
                  const isSelected = (tempTime || '09:00').endsWith(m);
                  return (
                    <TouchableOpacity
                      key={m}
                      style={[{ height: 50, justifyContent: 'center', alignItems: 'center' }, isSelected && { backgroundColor: colors.accent.primary + '20', borderRadius: 12 }]}
                      onPress={() => {
                        const mStr = m.toString();
                        const h = (tempTime || '09:00').split(':')[0] || '09';
                        setTempTime(`${h}:${mStr}`);
                      }}
                    >
                      <Text style={[{ fontSize: 24, color: colors.text.tertiary, fontWeight: '600' }, isSelected && { fontSize: 28, color: colors.accent.primary, fontWeight: '800' }]}>{m}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
            <TouchableOpacity
              style={{ backgroundColor: colors.accent.primary, padding: 16, borderRadius: 16, marginTop: 20, alignItems: 'center' }}
              onPress={() => {
                const time = tempTime || '09:00';
                if (showNoteModal) {
                  setTempTime(time);
                } else {
                  setNewTaskTime(time);
                }
                setShowTimePicker(false);
              }}
            >
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>Confirmar</Text>
            </TouchableOpacity>
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
        <View style={[styles.eventsModalContainer, { paddingTop: Platform.OS === 'ios' ? 0 : Math.max(0, insets.top - 20) }]}>
          <View style={styles.eventsModalHeader}>
            <TouchableOpacity onPress={() => setShowEventsModal(false)}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.eventsModalTitle}>Próximos Eventos</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={{
            backgroundColor: colors.background.tertiary,
            margin: 15,
            padding: 12,
            borderRadius: 12,
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: colors.border.light
          }}>
            <Ionicons name="information-circle-outline" size={20} color={colors.accent.primary} />
            <Text style={{
              color: colors.text.secondary,
              fontSize: 13,
              marginLeft: 10,
              flex: 1,
              fontWeight: '500'
            }}>
              Solo se muestran los eventos programados para los próximos dos meses. Para ver todos los eventos, accede a la Agenda.
            </Text>
          </View>
          <ScrollView
            style={styles.eventsModalScroll}
            contentContainerStyle={styles.eventsModalScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {upcomingEvents && upcomingEvents.length > 0 ? (
                <EventsList
                    events={upcomingEvents}
                    plain={true}
                    onEventLongPress={(event) => setEditingEvent(event)}
                    monthLimit={2}
                />
            ) : (
                <View style={{ padding: 20, alignItems: 'center' }}>
                    <Text style={{ color: colors.text.secondary }}>No hay próximos eventos.</Text>
                </View>
            )}
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
      <EventModal
        visible={!!editingEvent}
        event={editingEvent}
        onClose={() => setEditingEvent(null)}
        onSave={async () => {
             // Refresh logic handled by subscription usually, but we could trigger reload if needed
             setEditingEvent(null);
        }}
        onDelete={async () => {
             setEditingEvent(null);
        }}
      />
    </View>
  );
}
