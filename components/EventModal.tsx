import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, TextInput, StyleSheet, Alert, Switch, Platform } from 'react-native';
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
  date: Date;
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
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<EventFormData>({
      title: '',
      description: '',
      location: '',
      type: 'appointment',
      isAllDay: false,
      time: '09:00',
      date: new Date(),
      isRecurring: false,
      recurringPattern: 'yearly',
      recurringEndDate: null,
  });

  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [tempDate, setTempDate] = useState({
      day: new Date().getDate(),
      month: new Date().getMonth(),
      year: new Date().getFullYear(),
  });

  useEffect(() => {
    if (event) {
      const d = ensureDate(event.date);
      setFormData({
        title: event.title,
        description: event.description || '',
        location: event.location || '',
        type: event.type,
        isAllDay: event.isAllDay,
        time: event.time || '09:00',
        date: d,
        isRecurring: event.isRecurring || false,
        recurringPattern: event.recurringPattern || 'yearly',
        recurringEndDate: event.recurringEndDate ? ensureDate(event.recurringEndDate) : null,
      });
      setTempDate({ day: d.getDate(), month: d.getMonth(), year: d.getFullYear() });
    } else {
      const d = selectedDate || new Date();
      setFormData({
        title: '',
        description: '',
        location: '',
        type: 'appointment',
        isAllDay: false,
        time: '09:00',
        date: d,
        isRecurring: false,
        recurringPattern: 'yearly',
        recurringEndDate: null,
      });
      setTempDate({ day: d.getDate(), month: d.getMonth(), year: d.getFullYear() });
    }
  }, [event, visible, selectedDate]);

  const handleSave = async () => {
      if (isSaving) return;
      if (!user) return;
      if (!formData.title.trim()) {
          Alert.alert('Error', 'El título es obligatorio');
          return;
      }

      try {
          setIsSaving(true);
          if (onSave) {
              await onSave(formData);
          }
          onClose();
      } catch {
          Alert.alert('Error', 'No se pudo guardar el evento');
      } finally {
          setIsSaving(false);
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

  const handleDateConfirm = () => {
    const newDate = new Date(tempDate.year, tempDate.month, tempDate.day);
    setFormData({ ...formData, date: newDate });
    setShowDatePicker(false);
  };

  const generateDays = () => {
    const daysInMonth = new Date(tempDate.year, tempDate.month + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  };

  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const years = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i);

  const displayDate = formData.date;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, { paddingTop: Platform.OS === 'ios' ? 0 : insets.top }]}>
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
          <TouchableOpacity
            onPress={handleSave}
            style={[styles.headerSaveButton, isSaving && { opacity: 0.7 }]}
            disabled={isSaving}
          >
            <Text style={styles.saveButtonText}>{isSaving ? 'Cargando...' : 'Guardar'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
          {/* Card: Detalles Básicos */}
          <View style={styles.card}>
            <TextInput
              style={styles.titleInput}
              placeholder="Título del evento"
              placeholderTextColor={colors.text.tertiary}
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
            />

            <View style={styles.inputContainer}>
              <Ionicons name="document-text-outline" size={20} color={colors.accent.primary} />
              <TextInput
                style={styles.textInput}
                placeholder="Descripción (opcional)"
                placeholderTextColor={colors.text.tertiary}
                multiline
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
              />
            </View>

            <View style={[styles.inputContainer, { marginTop: 12 }]}>
              <Ionicons name="location-outline" size={20} color={colors.accent.primary} />
              <TextInput
                style={styles.textInput}
                placeholder="Añadir ubicación"
                placeholderTextColor={colors.text.tertiary}
                value={formData.location}
                onChangeText={(text) => setFormData({ ...formData, location: text })}
              />
            </View>
          </View>

          {/* Card: Categoría */}
          <View style={[styles.card, { marginTop: 20 }]}>
            <Text style={styles.cardTitle}>Categoría</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeSelector}>
              {eventTypes.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.typeItem,
                    formData.type === type.value && { backgroundColor: type.color + '20', borderColor: type.color }
                  ]}
                  onPress={() => {
                    const isBirthday = type.value === 'birthday';
                    setFormData({
                      ...formData,
                      type: type.value,
                      isAllDay: isBirthday ? true : formData.isAllDay,
                      isRecurring: isBirthday ? true : formData.isRecurring,
                      recurringPattern: isBirthday ? 'yearly' : formData.recurringPattern
                    });
                  }}
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

          {/* Card: Fecha y Horario */}
          <View style={[styles.card, { marginTop: 20 }]}>
            <Text style={styles.cardTitle}>Fecha y Horario</Text>

            <TouchableOpacity style={styles.settingRow} onPress={() => setShowDatePicker(true)}>
              <View style={styles.settingLabel}>
                <View style={[styles.iconBox, { backgroundColor: colors.accent.primary + '15' }]}>
                  <Ionicons name="calendar" size={20} color={colors.accent.primary} />
                </View>
                <Text style={styles.settingText}>Fecha</Text>
              </View>
              <View style={styles.settingValue}>
                <Text style={styles.valueText}>
                  {formData.date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
              </View>
            </TouchableOpacity>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingLabel}>
                <View style={[styles.iconBox, { backgroundColor: colors.accent.primary + '15' }]}>
                  <Ionicons name="time" size={20} color={colors.accent.primary} />
                </View>
                <Text style={styles.settingText}>Todo el día</Text>
              </View>
              <Switch
                value={formData.isAllDay}
                onValueChange={(value) => setFormData({ ...formData, isAllDay: value })}
                trackColor={{ false: colors.background.tertiary, true: colors.accent.primary + '80' }}
                thumbColor={formData.isAllDay ? colors.accent.primary : colors.text.tertiary}
              />
            </View>

            {!formData.isAllDay && (
              <>
                <View style={styles.divider} />
                <TouchableOpacity style={styles.settingRow} onPress={() => setShowTimePicker(true)}>
                  <View style={styles.settingLabel}>
                    <View style={[styles.iconBox, { backgroundColor: colors.accent.primary + '15' }]}>
                      <Ionicons name="alarm" size={20} color={colors.accent.primary} />
                    </View>
                    <Text style={styles.settingText}>Hora de inicio</Text>
                  </View>
                  <View style={styles.settingValue}>
                    <Text style={styles.valueText}>{formData.time}</Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
                  </View>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Card: Repetición */}
          <View style={[styles.card, { marginTop: 20 }]}>
            <Text style={styles.cardTitle}>Repetición</Text>
            <View style={styles.settingRow}>
              <View style={styles.settingLabel}>
                <View style={[styles.iconBox, { backgroundColor: colors.accent.violet + '15' }]}>
                  <Ionicons name="repeat" size={20} color={colors.accent.violet} />
                </View>
                <Text style={styles.settingText}>Evento periódico</Text>
              </View>
              <Switch
                value={formData.isRecurring}
                onValueChange={(value) => setFormData({ ...formData, isRecurring: value })}
                trackColor={{ false: colors.background.tertiary, true: colors.accent.violet + '80' }}
                thumbColor={formData.isRecurring ? colors.accent.violet : colors.text.tertiary}
              />
            </View>

            {formData.isRecurring && (
              <>
                <View style={styles.divider} />
                <View style={styles.patternsGrid}>
                  {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((pattern) => (
                    <TouchableOpacity
                      key={pattern}
                      style={[
                        styles.patternItem,
                        formData.recurringPattern === pattern && styles.patternItemSelected
                      ]}
                      onPress={() => setFormData({ ...formData, recurringPattern: pattern })}
                    >
                      <Text style={[
                        styles.patternItemText,
                        formData.recurringPattern === pattern && styles.patternItemTextSelected
                      ]}>
                        {pattern === 'daily' ? 'Diario' : pattern === 'weekly' ? 'Semanal' : pattern === 'monthly' ? 'Mensual' : 'Anual'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.recurringHint}>
                  {formData.recurringPattern === 'yearly' ? 'Se repetirá el mismo día cada año.' :
                   formData.recurringPattern === 'monthly' ? 'Se repetirá el mismo día cada mes.' :
                   formData.recurringPattern === 'weekly' ? 'Se repetirá el mismo día cada semana.' :
                   'Se repetirá todos los días.'}
                </Text>
              </>
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

        {/* Custom Date Picker */}
        <Modal visible={showDatePicker} transparent animationType="fade">
          <View style={styles.pickerOverlay}>
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerTitle}>Seleccionar Fecha</Text>
              <View style={styles.pickerContent}>
                {/* Wheel Día */}
                <ScrollView style={styles.wheel} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 80 }}>
                  {generateDays().map(d => (
                    <TouchableOpacity
                      key={d}
                      style={[styles.wheelOption, tempDate.day === d && styles.wheelOptionSelected]}
                      onPress={() => setTempDate({ ...tempDate, day: d })}
                    >
                      <Text style={[styles.wheelText, tempDate.day === d && styles.wheelTextSelected]}>{d.toString().padStart(2, '0')}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                {/* Wheel Mes */}
                <ScrollView style={styles.wheel} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 80 }}>
                  {months.map((m, i) => (
                    <TouchableOpacity
                      key={m}
                      style={[styles.wheelOption, tempDate.month === i && styles.wheelOptionSelected]}
                      onPress={() => setTempDate({ ...tempDate, month: i })}
                    >
                      <Text style={[styles.wheelText, tempDate.month === i && styles.wheelTextSelected, { fontSize: 16 }]}>{m.substring(0, 3)}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                {/* Wheel Año */}
                <ScrollView style={styles.wheel} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 80 }}>
                  {years.map(y => (
                    <TouchableOpacity
                      key={y}
                      style={[styles.wheelOption, tempDate.year === y && styles.wheelOptionSelected]}
                      onPress={() => setTempDate({ ...tempDate, year: y })}
                    >
                      <Text style={[styles.wheelText, tempDate.year === y && styles.wheelTextSelected]}>{y}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <TouchableOpacity style={styles.pickerConfirmButton} onPress={handleDateConfirm}>
                <Text style={styles.pickerConfirmButtonText}>Confirmar Fecha</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

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
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
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
  card: {
    backgroundColor: colors.background.secondary,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 20,
  },
  titleInput: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 24,
    letterSpacing: -0.8,
    paddingHorizontal: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.tertiary,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.border.light + '20',
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text.primary,
    marginLeft: 12,
    minHeight: 24,
  },
  typeSelector: {
    flexDirection: 'row',
    marginHorizontal: -5,
  },
  typeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.border.light,
    backgroundColor: colors.background.tertiary,
    marginHorizontal: 6,
  },
  typeItemText: {
    fontSize: 13,
    color: colors.text.secondary,
    marginLeft: 8,
    fontWeight: '600',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  settingLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: '600',
    marginLeft: 14,
  },
  settingValue: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.tertiary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 8,
  },
  valueText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginVertical: 4,
  },
  patternsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
  },
  patternItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: colors.background.tertiary,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  patternItemSelected: {
    backgroundColor: colors.accent.violet + '20',
    borderColor: colors.accent.violet,
  },
  patternItemText: {
    fontSize: 13,
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
    marginTop: 8,
    fontStyle: 'italic',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    padding: 18,
    borderRadius: 20,
    backgroundColor: colors.status.errorSoft,
    borderWidth: 1,
    borderColor: colors.status.error + '30',
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
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
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
    fontSize: 22,
    color: colors.text.tertiary,
    fontWeight: '600',
  },
  wheelTextSelected: {
    fontSize: 26,
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
    padding: 18,
    borderRadius: 18,
    marginTop: 20,
    alignItems: 'center',
    shadowColor: colors.accent.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  pickerConfirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
});
