import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, Alert, ScrollView, StyleSheet, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PlusIcon, TrashIcon, XIcon, EditIcon } from './Icons';
import { colors } from '../css/colors';
import { Habit } from '../types';


interface HabitsModalProps {
  visible: boolean;
  habits: Habit[];
  userId: string;
  onClose: () => void;
  onCreateHabit: (habit: { title: string; description?: string; icon?: string; color?: string; frequency: number[] }) => Promise<void>;
  onDeleteHabit: (habitId: string) => Promise<void>;
  onUpdateHabit?: (habitId: string, updates: { title?: string; description?: string; icon?: string; color?: string; frequency?: number[] }) => Promise<void>;
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
  const [selectedIcon, setSelectedIcon] = useState('physics');
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);

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
    setSelectedIcon('physics');
    setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
  };

  const startEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setNewHabitTitle(habit.title);
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
    if (!newHabitTitle.trim()) {
      Alert.alert('Error', 'Por favor ingresa un título para el hábito');
      return;
    }

    try {
      const habitData = {
        title: newHabitTitle.trim(),
        icon: selectedIcon,
        color: CATEGORY_COLORS[selectedIcon as keyof typeof CATEGORY_COLORS],
        frequency: selectedDays,
      };

      if (editingHabit && onUpdateHabit) {
        await onUpdateHabit(editingHabit.id, habitData);
      } else {
        await onCreateHabit(habitData);
      }

      resetForm();
    } catch {
      Alert.alert('Error', `No se pudo ${editingHabit ? 'actualizar' : 'crear'} el hábito`);
    }
  };

  const handleDeleteHabit = async (habitId: string, habitTitle: string) => {
    Alert.alert(
      'Eliminar hábito',
      `¿Estás seguro de que quieres eliminar "${habitTitle}"? Esto también eliminará las tareas generadas desde este hábito.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await onDeleteHabit(habitId);
            } catch {
              Alert.alert('Error', 'No se pudo eliminar el hábito');
            }
          }
        }
      ]
    );
  };

  const renderHabit = (habit: Habit) => (
    <View key={habit.id} style={styles.habitItem}>
      <View style={styles.habitContent}>
        <View style={[styles.habitIcon, { backgroundColor: CATEGORY_COLORS[habit.icon as keyof typeof CATEGORY_COLORS] || '#3498db' }]}>
          <Text style={styles.habitIconText}>
            {ICON_EMOJIS[habit.icon as keyof typeof ICON_EMOJIS] || '💪'}
          </Text>
        </View>
        <View style={styles.habitInfo}>
          <Text style={styles.habitTitle}>{habit.title}</Text>
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
          <View key={icon} style={{ alignItems: 'center', gap: 4 }}>
            <Pressable
              style={[
                styles.iconOption,
                selectedIcon === icon && styles.iconOptionSelected,
                { backgroundColor: selectedIcon === icon ? CATEGORY_COLORS[icon as keyof typeof CATEGORY_COLORS] : colors.background.secondary }
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
      <View style={[styles.container, { paddingTop: insets.top }]}>
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
              {habits.map(renderHabit)}

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
            </ScrollView>

            <View style={styles.formFooter}>
              <Pressable
                style={[styles.formButton, styles.cancelButton]}
                onPress={resetForm}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.formButton, styles.saveButton]}
                onPress={handleSaveHabit}
              >
                <Text style={styles.saveButtonText}>Guardar</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
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
    gap: 12,
    paddingRight: 20,
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
});
