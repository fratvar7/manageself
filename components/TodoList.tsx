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
import { EventModal } from './EventModal';

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
  onLoadHabits?: () => void;
  loading: boolean;
  upcomingEvents?: CalendarEvent[];
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
  upcomingEvents = []
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
  const [itemToDelete, setItemToDelete] = useState<{ id: string; type: 'task' | 'goal' | 'event'; title?: string } | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState<{ id: string; type: 'task' | 'goal'; title: string; currentNote: string } | null>(null);
  const [tempNote, setTempNote] = useState('');
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
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

  const handleSaveNote = async () => {
    if (!showNoteModal) return;

    try {
      if (showNoteModal.type === 'task') {
        if (onUpdateTask) {
          await onUpdateTask(showNoteModal.id, { description: tempNote.trim() });
        }
      } else {
        if (onUpdateGoal) {
          await onUpdateGoal(showNoteModal.id, { description: tempNote.trim() });
        }
      }
      setShowNoteModal(null);
      setTempNote('');
    } catch {
      Alert.alert('Error', 'No se pudo guardar la nota');
    }
  };

  const handleLongPress = (item: Task | Goal, type: 'task' | 'goal') => {
    setTempNote(item.description || '');
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
          onLongPress={() => handleLongPress(task, 'task')}
          delayLongPress={500}
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
        {pendingRegularTasks.length > 0 && (
           <View style={styles.taskSection}>
             <Text style={[styles.sectionTitle, { fontSize: 14, color: colors.accent.primary, marginBottom: 12 }]}>TAREAS PERSONALES</Text>
             {pendingRegularTasks.map(renderTask)}
           </View>
        )}

        {allHabitTasks.length > 0 && pendingHabitTasks.length === 0 && (
           <View style={[
             styles.taskSection,
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
                 textAlign: 'center'
               }
             ]}>
               {failedHabitTasks.length > 0 ? 'RESUMEN DE HÁBITOS DE HOY' : '¡HÁBITOS COMPLETADOS!'}
             </Text>
             <Text style={{ color: colors.text.secondary, fontSize: 12, textAlign: 'center' }}>
               {failedHabitTasks.length > 0
                 ? `Has completado ${allHabitTasks.filter(t => t.completed).length} de los ${allHabitTasks.length} hábitos que tenías para hoy`
                 : 'Has cumplido todos tus hábitos para hoy'}
             </Text>
           </View>
        )}

        {pendingHabitTasks.length > 0 && (
           <View style={styles.taskSection}>
             <Text style={[styles.sectionTitle, { fontSize: 14, color: colors.accent.violet, marginBottom: 12 }]}>HÁBITOS DIARIOS</Text>
             {pendingHabitTasks.map(renderTask)}
           </View>
        )}

        {goals.length > 0 && (
          <View style={styles.taskSection}>
            <Text style={[styles.sectionTitle, { fontSize: 14, color: colors.accent.yellow, marginBottom: 12 }]}>OBJETIVOS Y METAS</Text>
            {goals.map(renderGoal)}
          </View>
        )}

        {/* Botón para cargar hábitos si no hay tareas de hábitos */}
        {allHabitTasks.length === 0 && (
           <TouchableOpacity
             style={{
               flexDirection: 'row',
               alignItems: 'center',
               justifyContent: 'center',
               padding: 16,
               backgroundColor: colors.background.tertiary,
               borderRadius: 12,
               borderWidth: 1,
               borderStyle: 'dashed',
               borderColor: colors.accent.violet + '40',
               marginBottom: 24,
               gap: 10
             }}
             onPress={onLoadHabits}
           >
             <Ionicons name="refresh" size={18} color={colors.accent.violet} />
             <Text style={{ color: colors.accent.violet, fontWeight: '700', fontSize: 14 }}>CARGAR HÁBITOS DE HOY</Text>
           </TouchableOpacity>
        )}



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
              Anotaciones
            </Text>
            <Text style={{ fontSize: 14, color: colors.text.secondary, marginBottom: 15 }}>
              {showNoteModal?.title}
            </Text>

            <TextInput
              style={[styles.input, { height: 120, textAlignVertical: 'top' }]}
              placeholder="Escribe una nota o anotación..."
              placeholderTextColor={colors.text.secondary}
              value={tempNote}
              onChangeText={setTempNote}
              multiline
              autoFocus
            />

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
