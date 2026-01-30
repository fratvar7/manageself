import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, Alert, ScrollView, StyleSheet, Modal, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PlusIcon, TrashIcon, XIcon, EditIcon } from './Icons';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../css/colors';
import { Habit } from '../types';
import { ConfirmModal } from './ConfirmModal';


interface HabitsModalProps {
  visible: boolean;
  habits: Habit[];
  userId: string;
  onClose: () => void;
  onCreateHabit: (habit: { title: string; description?: string; icon?: string; color?: string; frequency: number[] }) => Promise<void>;
  onDeleteHabit: (habitId: string) => Promise<void>;
  onUpdateHabit?: (habitId: string, updates: { title?: string; description?: string; icon?: string; color?: string; frequency?: number[]; time?: string }) => Promise<void>;
}


import { DEFAULT_ICONS, ICON_EMOJIS, CATEGORY_COLORS, ICON_LABELS } from '../constants/icons';

export default function HabitsModal({
  visible,
  habits,
  onClose,
  onCreateHabit,
  onDeleteHabit,
  onUpdateHabit,
}: HabitsModalProps) {
  const insets = useSafeAreaInsets();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [newHabitTime, setNewHabitTime] = useState<string | undefined>(undefined);
  const [selectedIcon, setSelectedIcon] = useState('physics');
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [habitToDelete, setHabitToDelete] = useState<{ id: string; title: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (!visible) {
      resetForm();
    }
  }, [visible]);

  const resetForm = () => {
    setShowAddForm(false);
    setEditingHabit(null);
    setNewHabitTitle('');
    setNewHabitTime(undefined);
    setSelectedIcon('physics');
    setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
    setIsSaving(false);
    setShowTimePicker(false);
  };

  const startEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setNewHabitTitle(habit.title);
    setNewHabitTime(habit.time);
    setSelectedIcon(habit.icon || 'physics');
    // Si no tiene frecuencia (legacy), asumimos todos los días
    setSelectedDays(habit.frequency || [0, 1, 2, 3, 4, 5, 6]);
    setShowAddForm(true);
  };

  const toggleDay = (dayIndex: number) => {
    setSelectedDays(prev => {
      if (prev.includes(dayIndex)) {
        return prev.filter(d => d !== dayIndex);
      } else {
        return [...prev, dayIndex].sort();
      }
    });
  };

  const handleSaveHabit = async () => {
    if (isSaving) return;
    if (!newHabitTitle.trim()) {
      Alert.alert('Error', 'Por favor ingresa un título para el hábito');
      return;
    }

    try {
      setIsSaving(true);
      const habitData = {
        title: newHabitTitle.trim(),
        icon: selectedIcon,
        color: CATEGORY_COLORS[selectedIcon as keyof typeof CATEGORY_COLORS],
        frequency: selectedDays,
        time: newHabitTime,
      };

      if (editingHabit && onUpdateHabit) {
        await onUpdateHabit(editingHabit.id, habitData);
      } else {
        await onCreateHabit(habitData);
      }

      resetForm();
    } catch {
      Alert.alert('Error', `No se pudo ${editingHabit ? 'actualizar' : 'crear'} el hábito`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteHabit = async (habitId: string, habitTitle: string) => {
    setHabitToDelete({ id: habitId, title: habitTitle });
  };

  const confirmDeleteHabit = async () => {
    if (!habitToDelete) return;
    try {
      await onDeleteHabit(habitToDelete.id);
      setHabitToDelete(null);
    } catch {
      Alert.alert('Error', 'No se pudo eliminar el hábito');
    }
  };

  const renderHabit = (habit: Habit) => (
    <View key={habit.id} style={styles.habitItem}>
      <View style={styles.habitContent}>
        <View style={[
          styles.habitIcon,
          {
            backgroundColor: colors.background.tertiary,
            borderWidth: 2,
            borderColor: CATEGORY_COLORS[habit.icon as keyof typeof CATEGORY_COLORS] || colors.border.default
          }
        ]}>
          <Text style={styles.habitIconText}>
            {ICON_EMOJIS[habit.icon as keyof typeof ICON_EMOJIS] || '💪'}
          </Text>
        </View>
        <View style={styles.habitInfo}>
          <Text style={styles.habitTitle}>{habit.title}</Text>
          {habit.time && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
              <Ionicons name="time-outline" size={12} color={colors.text.tertiary} />
              <Text style={{ fontSize: 12, color: colors.text.tertiary, marginLeft: 4 }}>{habit.time}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.habitActions}>
        {onUpdateHabit && (
          <Pressable
            style={[styles.actionButton, styles.editButton]}
            onPress={() => startEdit(habit)}
          >
            <EditIcon color={colors.text.secondary} size={18} />
          </Pressable>
        )}

        <Pressable
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteHabit(habit.id, habit.title)}
        >
          <TrashIcon color={colors.status.error} size={18} />
        </Pressable>
      </View>
    </View>
  );

  const renderIconSelector = () => (
    <View style={styles.selectorContainer}>
      <Text style={styles.selectorLabel}>Icono:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.iconSelectorContent}>
        {DEFAULT_ICONS.map(icon => (
          <View key={icon} style={{ alignItems: 'center', gap: 6 }}>
            <Pressable
              style={[
                styles.iconOption,
                selectedIcon === icon && styles.iconOptionSelected,
                {
                  backgroundColor: colors.background.tertiary,
                  borderColor: selectedIcon === icon
                    ? CATEGORY_COLORS[icon as keyof typeof CATEGORY_COLORS]
                    : colors.border.default
                }
              ]}
              onPress={() => setSelectedIcon(icon)}
            >
              <Text style={styles.iconOptionText}>
                {ICON_EMOJIS[icon as keyof typeof ICON_EMOJIS]}
              </Text>
            </Pressable>
            <Text style={{ fontSize: 10, color: colors.text.secondary }}>
              {ICON_LABELS[icon as keyof typeof ICON_LABELS] || icon}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: Platform.OS === 'ios' ? 0 : Math.max(0, insets.top - 30) }]}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {showAddForm ? (editingHabit ? 'Editar Hábito' : 'Nuevo Hábito') : 'Mis Hábitos'}
          </Text>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <XIcon color={colors.text.secondary} />
          </Pressable>
        </View>

        {!showAddForm ? (
          <>
            <ScrollView style={styles.habitsList} showsVerticalScrollIndicator={false}>
              {(() => {
                const sortedHabits = [...habits].sort((a, b) => {
                  // 1. Ordenar por tiempo
                  if (a.time && !b.time) return -1;
                  if (!a.time && b.time) return 1;
                  if (a.time && b.time) {
                    const timeCompare = a.time.localeCompare(b.time);
                    if (timeCompare !== 0) return timeCompare;
                  }

                  // 2. Si el tiempo es igual o ambos no tienen, ordenar por icono (categoría)
                  const iconA = a.icon || '';
                  const iconB = b.icon || '';
                  return iconA.localeCompare(iconB);
                });
                return sortedHabits.map(renderHabit);
              })()}

              {habits.length === 0 && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>
                    No tienes hábitos configurados.
                  </Text>
                  <Text style={styles.emptyStateSubtext}>
                    Los hábitos se crean automáticamente como tareas cada día.
                  </Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.footer}>
              <Pressable
                style={styles.addButton}
                onPress={() => setShowAddForm(true)}
              >
                <PlusIcon color="white" size={16} />
                <Text style={styles.addButtonText}>Crear nuevo hábito</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <View style={styles.formContainer}>
            <ScrollView style={styles.formScroll}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Título</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej. Leer 30 minutos"
                  placeholderTextColor={colors.text.secondary}
                  value={newHabitTitle}
                  onChangeText={setNewHabitTitle}
                  maxLength={50}
                  autoFocus
                />
              </View>



              {renderIconSelector()}

              <View style={styles.selectorContainer}>
                <Text style={styles.selectorLabel}>Frecuencia:</Text>
                <View style={styles.daysSelector}>
                  {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map((day, index) => {
                    const isSelected = selectedDays.includes(index);
                    return (
                      <Pressable
                        key={index}
                        style={[
                          styles.dayOption,
                          isSelected && styles.dayOptionSelected
                        ]}
                        onPress={() => toggleDay(index)}
                      >
                        <Text style={[
                          styles.dayOptionText,
                          isSelected && styles.dayOptionTextSelected
                        ]}>
                          {day}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <Text style={styles.frequencySummary}>
                  {selectedDays.length === 7 ? 'Todos los días' :
                   selectedDays.length === 0 ? 'Nunca' :
                   selectedDays.length === 2 && selectedDays.includes(0) && selectedDays.includes(6) ? 'Fines de semana' :
                   selectedDays.length === 5 && !selectedDays.includes(0) && !selectedDays.includes(6) ? 'Entre semana' :
                   `${selectedDays.length} días a la semana`}
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Hora (Opcional)</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Pressable
                    style={[styles.input, { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
                    onPress={() => setShowTimePicker(true)}
                  >
                    <Text style={{ color: newHabitTime ? colors.text.primary : colors.text.tertiary, fontSize: 16 }}>
                      {newHabitTime || 'Sin hora'}
                    </Text>
                    <Ionicons name="time-outline" size={20} color={newHabitTime ? colors.button.primary : colors.text.tertiary} />
                  </Pressable>
                  {newHabitTime && (
                    <Pressable
                      style={[styles.input, { paddingHorizontal: 12, justifyContent: 'center' }]}
                      onPress={() => setNewHabitTime(undefined)}
                    >
                      <Ionicons name="close-circle" size={20} color={colors.status.error} />
                    </Pressable>
                  )}
                </View>
              </View>
            </ScrollView>

            <View style={styles.formFooter}>
              <Pressable
                style={[styles.formButton, styles.cancelButton]}
                onPress={resetForm}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.formButton, styles.saveButton, isSaving && { opacity: 0.7 }]}
                onPress={handleSaveHabit}
                disabled={isSaving}
              >
                <Text style={styles.saveButtonText}>{isSaving ? 'Guardando...' : 'Guardar'}</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
      <ConfirmModal
        visible={!!habitToDelete}
        title="Eliminar Hábito"
        message={`¿Estás seguro de que quieres eliminar el hábito "${habitToDelete?.title}"? Esto también eliminará sus tareas diarias.`}
        onConfirm={confirmDeleteHabit}
        onCancel={() => setHabitToDelete(null)}
        confirmText="Eliminar"
        isDestructive={true}
      />

      {/* Custom Time Picker */}
      <Modal visible={showTimePicker} transparent animationType="fade">
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerTitle}>Seleccionar Hora</Text>
            <View style={styles.pickerContent}>
              <ScrollView
                style={styles.wheel}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingVertical: 80 }}
              >
                {Array.from({ length: 24 }).map((_, i) => {
                  const h = i.toString().padStart(2, '0');
                  const isSelected = (newHabitTime || '09:00').startsWith(h);
                  return (
                    <TouchableOpacity
                      key={h}
                      style={[styles.wheelOption, isSelected && styles.wheelOptionSelected]}
                      onPress={() => {
                        const m = (newHabitTime || '09:00').split(':')[1] || '00';
                        setNewHabitTime(`${h}:${m}`);
                      }}
                    >
                      <Text style={[styles.wheelText, isSelected && styles.wheelTextSelected]}>{h}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              <Text style={styles.pickerSeparator}>:</Text>
              <ScrollView
                style={styles.wheel}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingVertical: 80 }}
              >
                {['00', '15', '30', '45'].map((m) => {
                  const isSelected = (newHabitTime || '09:00').endsWith(m);
                  return (
                    <TouchableOpacity
                      key={m}
                      style={[styles.wheelOption, isSelected && styles.wheelOptionSelected]}
                      onPress={() => {
                        const h = (newHabitTime || '09:00').split(':')[0] || '09';
                        setNewHabitTime(`${h}:${m}`);
                      }}
                    >
                      <Text style={[styles.wheelText, isSelected && styles.wheelTextSelected]}>{m}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
            <TouchableOpacity
              style={styles.pickerConfirmButton}
              onPress={() => {
                if (!newHabitTime) setNewHabitTime('09:00');
                setShowTimePicker(false);
              }}
            >
              <Text style={styles.pickerConfirmButtonText}>Confirmar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  closeButton: {
    padding: 4,
  },
  habitsList: {
    flex: 1,
    padding: 16,
  },
  habitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  habitContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  habitIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  habitIconText: {
    fontSize: 22,
  },
  habitInfo: {
    flex: 1,
  },
  habitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  habitDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 2,
  },
  habitActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  editButton: {
    //
  },
  deleteButton: {
    backgroundColor: colors.background.primary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    maxWidth: '80%',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.button.primary,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  formContainer: {
    flex: 1,
    display: 'flex',
  },
  formScroll: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  selectorContainer: {
    marginBottom: 24,
  },
  selectorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  iconSelectorContent: {
    gap: 20,
    paddingRight: 24,
    paddingLeft: 4,
    paddingVertical: 8, // Añadir margen vertical para que la sombra/escala no se corte
  },
  iconOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconOptionSelected: {
    borderColor: colors.button.primary,
    transform: [{ scale: 1.1 }],
  },
  iconOptionText: {
    fontSize: 24,
    lineHeight: 30, // Añadir margen vertical interno
  },
  daysSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dayOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  dayOptionSelected: {
    backgroundColor: colors.button.primary,
    borderColor: colors.button.primary,
  },
  dayOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  dayOptionTextSelected: {
    color: 'white',
  },
  frequencySummary: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 8,
  },
  formFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
    flexDirection: 'row',
    gap: 12,
  },
  formButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.background.secondary,
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
    fontWeight: 'bold',
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    paddingBottom: 40,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 20,
  },
  pickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 200,
    justifyContent: 'center',
  },
  wheel: {
    flex: 1,
    maxWidth: 80,
  },
  wheelOption: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wheelOptionSelected: {
    backgroundColor: colors.accent.primary + '20',
    borderRadius: 12,
  },
  wheelText: {
    fontSize: 24,
    color: colors.text.tertiary,
    fontWeight: '600',
  },
  wheelTextSelected: {
    fontSize: 28,
    color: colors.accent.primary,
    fontWeight: '800',
  },
  pickerSeparator: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text.primary,
    marginHorizontal: 10,
  },
  pickerConfirmButton: {
    backgroundColor: colors.accent.primary,
    padding: 16,
    borderRadius: 16,
    marginTop: 20,
    alignItems: 'center',
  },
  pickerConfirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  wheelOptionUnselected: {
    //
  },
  // Reusable touchable components for the wheel
  TouchableOpacity: {
    //
  }
});
