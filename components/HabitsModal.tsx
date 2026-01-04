import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, Alert, ScrollView, StyleSheet, Modal } from 'react-native';
import { PlusIcon, TrashIcon, XIcon, EditIcon } from './Icons';
import { colors } from '../css/colors';
import { Habit } from '../types';
import { TasksService } from '../services/tasksService';

 
interface HabitsModalProps {
  visible: boolean;
  habits: Habit[];
  userId: string;
  onClose: () => void;
  onCreateHabit: (habit: { title: string; description?: string; icon?: string; color?: string }) => Promise<void>;
  onDeleteHabit: (habitId: string) => Promise<void>;
  onUpdateHabit?: (habitId: string, updates: { title?: string; description?: string; icon?: string; color?: string }) => Promise<void>;
}
 

const DEFAULT_ICONS = ['physics', 'mental', 'emotional', 'spiritual', 'social', 'professional', 'economic', 'creative'];
const ICON_EMOJIS = {
  physics: '💪',
  mental: '🧠',
  emotional: '❤️',
  spiritual: '✨',
  social: '👥',
  professional: '💼',
  economic: '💰',
  creative: '🎨'
};

const CATEGORY_COLORS = {
  physics: '#e74c3c',    // Rojo intenso para fuerza física
  mental: '#9b59b6',     // Púrpura para mente/mente
  emotional: '#e91e63',  // Rosa para emociones
  spiritual: '#fabb0a',  // Amarillo dorado para aura espiritual
  social: '#ff9800',    // Naranja para conexión social
  professional: '#4caf50', // Verde para crecimiento profesional
  economic: '#f39c12',  // Ámbar para finanzas
  creative: '#e74c3c'   // Rojo creativo
};

const HabitsModal: React.FC<HabitsModalProps> = ({
  visible,
  habits,
  userId,
  onClose,
  onCreateHabit,
  onDeleteHabit,
  onUpdateHabit,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [newHabitDescription, setNewHabitDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('physics');

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
    setNewHabitDescription('');
    setSelectedIcon('physics');
  };

  const startEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setNewHabitTitle(habit.title);
    setNewHabitDescription(habit.description || '');
    setSelectedIcon(habit.icon || 'physics');
    setShowAddForm(true);
  };

  const createExampleHabits = async () => {
    const exampleHabits = [
      { title: 'Correr 5km', description: 'Correr 5 kilómetros por la mañana', icon: 'physics', isDefault: false },
      { title: 'Leer 20 páginas', description: 'Leer un libro durante 20 minutos', icon: 'mental', isDefault: false },
      { title: 'Escribir diario', description: 'Escribir sobre mis emociones del día', icon: 'emotional', isDefault: false },
      { title: 'Meditar con música', description: 'Meditar 10 minutos con música relajante', icon: 'spiritual', isDefault: false },
      { title: 'Llamar a un amigo', description: 'Contactar con un ser querido', icon: 'social', isDefault: false },
      { title: 'Curso online', description: 'Avanzar en mi curso profesional', icon: 'professional', isDefault: false },
      { title: 'Revisar presupuesto', description: 'Revisar gastos e ingresos del día', icon: 'economic', isDefault: false },
      { title: 'Dibujar algo', description: 'Crear un dibujo o sketch rápido', icon: 'creative', isDefault: false },
    ];

    try {
      for (const habit of exampleHabits) {
        await TasksService.createHabit(userId, {
          ...habit,
          color: CATEGORY_COLORS[habit.icon as keyof typeof CATEGORY_COLORS],
        });
      }
      Alert.alert('Éxito', 'Se han creado 8 hábitos de ejemplo');
    } catch {
      Alert.alert('Error', 'No se pudieron crear los hábitos de ejemplo');
    }
  };

  const handleSaveHabit = async () => {
    if (!newHabitTitle.trim()) {
      Alert.alert('Error', 'Por favor ingresa un título para el hábito');
      return;
    }

    try {
      const habitData = {
        title: newHabitTitle.trim(),
        description: newHabitDescription.trim() || undefined,
        icon: selectedIcon,
        color: CATEGORY_COLORS[selectedIcon as keyof typeof CATEGORY_COLORS],
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
          {habit.description && (
            <Text style={styles.habitDescription}>{habit.description}</Text>
          )}
          {habit.isDefault && (
            <Text style={styles.defaultBadge}>Hábito por defecto</Text>
          )}
        </View>
      </View>

      <View style={styles.habitActions}>
        {!habit.isDefault && onUpdateHabit && (
          <Pressable
            style={[styles.actionButton, styles.editButton]}
            onPress={() => startEdit(habit)}
          >
            <EditIcon color={colors.text.secondary} />
          </Pressable>
        )}

        {!habit.isDefault && (
          <Pressable
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteHabit(habit.id, habit.title)}
          >
            <TrashIcon color={colors.status.error} />
          </Pressable>
        )}
      </View>
    </View>
  );

  const renderIconSelector = () => (
    <View style={styles.selectorContainer}>
      <Text style={styles.selectorLabel}>Categoría:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.iconSelector}>
          {DEFAULT_ICONS.map(icon => (
            <Pressable
              key={icon}
              style={[
                styles.iconOption,
                selectedIcon === icon && styles.iconOptionSelected
              ]}
              onPress={() => setSelectedIcon(icon)}
            >
              <Text style={styles.iconOptionText}>
                {ICON_EMOJIS[icon as keyof typeof ICON_EMOJIS]}
              </Text>
            </Pressable>
          ))}
        </View>
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
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {editingHabit ? 'Editar Hábito' : 'Configurar Hábitos'}
          </Text>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <XIcon color={colors.text.secondary} />
          </Pressable>
        </View>

        {/* Lista de hábitos */}
        <ScrollView style={styles.habitsList} showsVerticalScrollIndicator={false}>
          {habits.map(renderHabit)}

          {habits.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No tienes hábitos configurados. ¡Agrega uno para comenzar!
              </Text>
            </View>
          )}

          {/* Botón de ejemplos */}
          {habits.length < 8 && (
            <Pressable
              style={styles.exampleButton}
              onPress={createExampleHabits}
            >
              <Text style={styles.exampleButtonText}>Crear Hábitos de Ejemplo</Text>
            </Pressable>
          )}
        </ScrollView>

        {/* Botón agregar hábito */}
        {!showAddForm && (
          <Pressable
            style={styles.addButton}
            onPress={() => setShowAddForm(true)}
          >
            <PlusIcon />
            <Text style={styles.addButtonText}>
              {editingHabit ? 'Actualizar hábito' : 'Agregar hábito'}
            </Text>
          </Pressable>
        )}

        {/* Formulario agregar hábito */}
        {showAddForm && (
          <View style={styles.addForm}>
            <TextInput
              style={styles.input}
              placeholder="Título del hábito"
              placeholderTextColor={colors.text.secondary}
              value={newHabitTitle}
              onChangeText={setNewHabitTitle}
              maxLength={100}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Descripción (opcional)"
              placeholderTextColor={colors.text.secondary}
              value={newHabitDescription}
              onChangeText={setNewHabitDescription}
              multiline
              maxLength={300}
            />

            {renderIconSelector()}

            <View style={styles.formButtons}>
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
                <Text style={styles.saveButtonText}>
                  {editingHabit ? 'Actualizar' : 'Guardar'}
                </Text>
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
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  habitContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  habitIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  habitIconText: {
    fontSize: 20,
  },
  habitInfo: {
    flex: 1,
  },
  habitTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: 4,
  },
  habitDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  defaultBadge: {
    fontSize: 12,
    color: colors.text.secondary,
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
  habitActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
  },
  editButton: {
    backgroundColor: colors.background.primary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.button.primary,
    padding: 16,
    gap: 8,
  },
  addButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  addForm: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  input: {
    backgroundColor: colors.background.secondary,
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
  selectorContainer: {
    marginBottom: 16,
  },
  selectorLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: 8,
  },
  iconSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  iconOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconOptionSelected: {
    borderColor: colors.button.primary,
  },
  iconOptionText: {
    fontSize: 20,
  },
  colorSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: colors.text.primary,
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
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  cancelButtonText: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  exampleButton: {
    backgroundColor: colors.accent.blue,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 16,
  },
  exampleButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: colors.button.primary,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default HabitsModal;
