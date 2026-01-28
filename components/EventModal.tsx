import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, TextInput, StyleSheet, Alert, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CalendarEvent } from '../types';
import { colors } from '../css/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalendarService } from '../services/calendarService';
import { useAuth } from '../contexts/AuthContext';
import { ensureDate } from '../utils/dateUtils';
import { ConfirmModal } from './ConfirmModal';

export interface EventFormData {
  title: string;
  description: string;
  location: string;
  type: CalendarEvent['type'];
  isAllDay: boolean;
  time: string;
  isRecurring: boolean;
  recurringPattern: CalendarEvent['recurringPattern'];
  recurringEndDate: Date | null;
}

interface EventModalProps {
  visible: boolean;
  onClose: () => void;
  event: CalendarEvent | null;
  selectedDate?: Date;
  onSave?: (eventData: EventFormData) => Promise<void>;
  onDelete?: (event: CalendarEvent) => Promise<void>;
}

export const EventModal: React.FC<EventModalProps> = ({ visible, onClose, event, selectedDate, onSave, onDelete }) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const [formData, setFormData] = useState<EventFormData>({
      title: '',
      description: '',
      location: '',
      type: 'appointment',
      isAllDay: false,
      time: '09:00',
      isRecurring: false,
      recurringPattern: 'yearly',
      recurringEndDate: null,
  });

  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        description: event.description || '',
        location: event.location || '',
        type: event.type,
        isAllDay: event.isAllDay,
        time: event.time || '09:00',
        isRecurring: event.isRecurring || false,
        recurringPattern: event.recurringPattern || 'yearly',
        recurringEndDate: event.recurringEndDate ? ensureDate(event.recurringEndDate) : null,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        location: '',
        type: 'appointment',
        isAllDay: false,
        time: '09:00',
        isRecurring: false,
        recurringPattern: 'yearly',
        recurringEndDate: null,
      });
    }
  }, [event, visible]);

  const handleSave = async () => {
      if (!user) return;
      if (!formData.title.trim()) {
          Alert.alert('Error', 'El título es obligatorio');
          return;
      }

      try {
          if (onSave) {
              await onSave(formData);
          }
          onClose();
      } catch (error) {
          console.error('Error saving event:', error);
          Alert.alert('Error', 'No se pudo guardar el evento');
      }
  };

  const handleDelete = async () => {
     setShowConfirmDelete(true);
  };

  const confirmDeleteLogic = async () => {
      if (!event) return;
      try {
           const rawId = event.id.split('_recurring_')[0];
           await CalendarService.deleteEvent(rawId);
           if (onDelete) onDelete(event);
           onClose();
      } catch {
          Alert.alert('Error', 'No se pudo eliminar');
      }
      setShowConfirmDelete(false);
  };

  const eventTypes: { value: CalendarEvent['type']; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
    { value: 'appointment', label: 'Cita', icon: 'calendar', color: colors.accent.primary },
    { value: 'birthday', label: 'Cumpleaños', icon: 'gift', color: colors.status.error },
    { value: 'reminder', label: 'Recordatorio', icon: 'notifications', color: colors.status.warning },
    { value: 'administrative', label: 'Gestión', icon: 'briefcase', color: colors.accent.purple },
    { value: 'personal', label: 'Personal', icon: 'person', color: colors.accent.mint },
    { value: 'work', label: 'Trabajo', icon: 'business', color: colors.accent.coral },
    { value: 'health', label: 'Salud', icon: 'heart', color: colors.status.error },
    { value: 'social', label: 'Social', icon: 'people', color: colors.accent.violet },
    { value: 'event', label: 'Evento', icon: 'star', color: colors.accent.pink },
    { value: 'other', label: 'Otro', icon: 'bookmark', color: colors.text.secondary },
  ];

  const recurringPatterns: { value: CalendarEvent['recurringPattern']; label: string }[] = [
    { value: 'daily', label: 'Diario' },
    { value: 'weekly', label: 'Semanal' },
    { value: 'monthly', label: 'Mensual' },
    { value: 'yearly', label: 'Anual' },
  ];

  const displayDate = event ? ensureDate(event.date) : (selectedDate || new Date());

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.headerIconButton}>
            <Ionicons name="close" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.modalTitle}>{event ? 'Editar Evento' : 'Nuevo Evento'}</Text>
            <Text style={styles.modalSubtitle}>
              {displayDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
          </View>
          <TouchableOpacity onPress={handleSave} style={styles.headerSaveButton}>
            <Text style={styles.saveButtonText}>Guardar</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <TextInput
              style={styles.titleInput}
              placeholder="Título del evento"
              placeholderTextColor={colors.text.tertiary}
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
            />

            <View style={styles.inputGroup}>
              <View style={styles.inputIcon}>
                <Ionicons name="document-text-outline" size={20} color={colors.text.tertiary} />
              </View>
              <TextInput
                style={styles.descriptionInput}
                placeholder="Descripción (opcional)"
                placeholderTextColor={colors.text.tertiary}
                multiline
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.inputIcon}>
                <Ionicons name="location-outline" size={20} color={colors.text.tertiary} />
              </View>
              <TextInput
                style={styles.locationInput}
                placeholder="Añadir ubicación"
                placeholderTextColor={colors.text.tertiary}
                value={formData.location}
                onChangeText={(text) => setFormData({ ...formData, location: text })}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Categoría</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeSelector}>
              {eventTypes.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.typeItem,
                    formData.type === type.value && { backgroundColor: type.color + '20', borderColor: type.color }
                  ]}
                  onPress={() => setFormData({ ...formData, type: type.value })}
                >
                  <Ionicons
                    name={type.icon}
                    size={18}
                    color={formData.type === type.value ? type.color : colors.text.tertiary}
                  />
                  <Text style={[
                    styles.typeItemText,
                    formData.type === type.value && { color: type.color, fontWeight: '700' }
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Horario</Text>
            <View style={styles.row}>
              <View style={styles.rowInfo}>
                <Ionicons name="time-outline" size={22} color={colors.accent.primary} />
                <Text style={styles.rowLabel}>Todo el día</Text>
              </View>
              <Switch
                value={formData.isAllDay}
                onValueChange={(value) => setFormData({ ...formData, isAllDay: value })}
                trackColor={{ false: colors.background.tertiary, true: colors.accent.primary + '80' }}
                thumbColor={formData.isAllDay ? colors.accent.primary : colors.text.tertiary}
              />
            </View>

            {!formData.isAllDay && (
              <TouchableOpacity style={styles.timeSelectorButton} onPress={() => setShowTimePicker(true)}>
                <View style={[styles.timeDisplay, { backgroundColor: colors.background.tertiary }]}>
                   <Text style={styles.timeDisplayText}>{formData.time}</Text>
                   <Ionicons name="chevron-down" size={16} color={colors.text.tertiary} />
                </View>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Repetición</Text>
            <View style={styles.row}>
              <View style={styles.rowInfo}>
                <Ionicons name="repeat-outline" size={22} color={colors.accent.violet} />
                <Text style={styles.rowLabel}>Evento periódico</Text>
              </View>
              <Switch
                value={formData.isRecurring}
                onValueChange={(value) => setFormData({ ...formData, isRecurring: value })}
                trackColor={{ false: colors.background.tertiary, true: colors.accent.violet + '80' }}
                thumbColor={formData.isRecurring ? colors.accent.violet : colors.text.tertiary}
              />
            </View>

            {formData.isRecurring && (
              <View style={styles.patternsGrid}>
                {recurringPatterns.map((pattern) => (
                  <TouchableOpacity
                    key={pattern.value}
                    style={[
                      styles.patternItem,
                      formData.recurringPattern === pattern.value && styles.patternItemSelected
                    ]}
                    onPress={() => setFormData({ ...formData, recurringPattern: pattern.value as any })}
                  >
                    <Text style={[
                      styles.patternItemText,
                      formData.recurringPattern === pattern.value && styles.patternItemTextSelected
                    ]}>
                      {pattern.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {formData.isRecurring && (
              <Text style={styles.recurringHint}>
                {formData.recurringPattern === 'yearly' ? 'Se repetirá el mismo día cada año (ideal para cumpleaños).' :
                 formData.recurringPattern === 'monthly' ? 'Se repetirá el mismo día cada mes.' :
                 formData.recurringPattern === 'weekly' ? 'Se repetirá el mismo día cada semana.' :
                 'Se repetirá todos los días.'}
              </Text>
            )}
          </View>

          {event && (
            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={20} color={colors.status.error} />
              <Text style={styles.deleteButtonText}>Eliminar evento</Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

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
                    const isSelected = formData.time.startsWith(h);
                    return (
                      <TouchableOpacity
                        key={h}
                        style={[styles.wheelOption, isSelected && styles.wheelOptionSelected]}
                        onPress={() => {
                          const m = formData.time.split(':')[1] || '00';
                          setFormData({ ...formData, time: `${h}:${m}` });
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
                    const isSelected = formData.time.endsWith(m);
                    return (
                      <TouchableOpacity
                        key={m}
                        style={[styles.wheelOption, isSelected && styles.wheelOptionSelected]}
                        onPress={() => {
                          const h = formData.time.split(':')[0] || '09';
                          setFormData({ ...formData, time: `${h}:${m}` });
                        }}
                      >
                        <Text style={[styles.wheelText, isSelected && styles.wheelTextSelected]}>{m}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
              <TouchableOpacity style={styles.pickerConfirmButton} onPress={() => setShowTimePicker(false)}>
                <Text style={styles.pickerConfirmButtonText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <ConfirmModal
          visible={showConfirmDelete}
          title="Eliminar Evento"
          message="¿Estás seguro de que quieres eliminar este evento? Si es un evento periódico, se eliminará toda la serie."
          onConfirm={confirmDeleteLogic}
          onCancel={() => setShowConfirmDelete(false)}
          confirmText="Eliminar"
          isDestructive={true}
          type="delete"
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: -0.5,
  },
  modalSubtitle: {
    fontSize: 12,
    color: colors.text.tertiary,
    textTransform: 'capitalize',
    marginTop: 2,
  },
  headerSaveButton: {
    backgroundColor: colors.accent.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  modalContent: {
    flex: 1,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 15,
  },
  titleInput: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  inputIcon: {
    width: 32,
    alignItems: 'center',
  },
  descriptionInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text.primary,
    marginLeft: 10,
    minHeight: 40,
  },
  locationInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text.primary,
    marginLeft: 10,
  },
  typeSelector: {
    flexDirection: 'row',
  },
  typeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border.light,
    backgroundColor: colors.background.secondary,
    marginRight: 10,
  },
  typeItemText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginLeft: 8,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowLabel: {
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: '600',
    marginLeft: 12,
  },
  timeSelectorButton: {
    marginTop: 15,
    alignSelf: 'flex-start',
  },
  timeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  timeDisplayText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text.primary,
  },
  patternsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 15,
  },
  patternItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.background.tertiary,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  patternItemSelected: {
    backgroundColor: colors.accent.violet + '20',
    borderColor: colors.accent.violet,
  },
  patternItemText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  patternItemTextSelected: {
    color: colors.accent.violet,
    fontWeight: '800',
  },
  recurringHint: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginTop: 12,
    fontStyle: 'italic',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 20,
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.status.errorSoft,
    borderWidth: 1,
    borderColor: colors.status.error + '40',
  },
  deleteButtonText: {
    color: colors.status.error,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 10,
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
});
