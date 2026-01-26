import React, { useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  ScrollView,
  TextInput,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Timestamp } from 'firebase/firestore';
import { CalendarEvent } from '../types';
import { CalendarService } from '../services/calendarService';
import { useAuth } from '../contexts/AuthContext';
import { useEvents } from '../hooks/useEvents';
import { colors } from '../css/colors';
import { ensureDate } from '../utils/dateUtils';
import { ConfirmModal } from './ConfirmModal';

interface CalendarViewProps {
  onEventSelect?: (event: CalendarEvent) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ onEventSelect }) => {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { allEvents } = useEvents();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUpcomingModal, setShowUpcomingModal] = useState(false);
  const [markedDates, setMarkedDates] = useState<Record<string, CalendarEvent[]>>({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    location: '',
    type: 'appointment' as CalendarEvent['type'],
    isAllDay: false,
    time: '09:00',
    isRecurring: false,
    recurringPattern: 'yearly' as CalendarEvent['recurringPattern'],
    recurringEndDate: null as Date | null,
  });
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [eventToDelete, setEventToDelete] = useState<CalendarEvent | null>(null);

  const getDaysInMonthForCalendar = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonthForCalendar(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Añadir días vacíos al principio
    for (let i = 0; i < firstDay; i++) {
        days.push(null);
    }

    // Añadir días del mes
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(i);
    }

    return days;
  };

  const formatDateKey = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  // Actualizar fechas marcadas cuando cambian los eventos
  useEffect(() => {
    const eventsByDate: Record<string, CalendarEvent[]> = {};
    allEvents.forEach(event => {
      const dateKey = formatDateKey(ensureDate(event.date));
      if (!eventsByDate[dateKey]) {
        eventsByDate[dateKey] = [];
      }
      eventsByDate[dateKey].push(event);
    });
    setMarkedDates(eventsByDate);
  }, [allEvents]);

  // Filtrar eventos para la fecha seleccionada
  const eventsForSelectedDate = allEvents.filter(event => {
    const eventDate = ensureDate(event.date);
    const targetDate = new Date(selectedDate);
    return eventDate.getFullYear() === targetDate.getFullYear() &&
           eventDate.getMonth() === targetDate.getMonth() &&
           eventDate.getDate() === targetDate.getDate();
  });

  // Próximos eventos
  const upcomingEvents = allEvents
    .filter(event => ensureDate(event.date) >= new Date())
    .sort((a, b) => a.date.seconds - b.date.seconds)
    .slice(0, 10);

  const getEventColor = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'birthday': return colors.status.error;
      case 'reminder': return colors.status.warning;
      case 'appointment': return colors.accent.primary;
      case 'administrative': return colors.accent.purple;
      case 'personal': return colors.accent.mint;
      case 'work': return colors.accent.coral;
      case 'health': return colors.status.error;
      case 'social': return colors.accent.purple;
      default: return colors.button.primary;
    }
  };

  const getEventIcon = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'birthday': return 'gift';
      case 'reminder': return 'notifications';
      case 'appointment': return 'calendar';
      case 'administrative': return 'briefcase';
      case 'personal': return 'person';
      case 'work': return 'business';
      case 'health': return 'heart';
      case 'social': return 'people';
      default: return 'bookmark';
    }
  };

  const handleAddEvent = async () => {
    if (!user) {
      Alert.alert('Error', 'Debes iniciar sesión para crear eventos');
      return;
    }

    if (!newEvent.title.trim()) {
      Alert.alert('Campo requerido', 'Por favor, introduce un título para el evento');
      return;
    }

    try {
      const eventDate = new Date(selectedDate);
      if (!newEvent.isAllDay) {
        const [hours, minutes] = newEvent.time.split(':');
        eventDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      }

      await CalendarService.createEvent(user.uid, {
        title: newEvent.title.trim(),
        description: newEvent.description.trim(),
        location: newEvent.location.trim(),
        type: newEvent.type,
        isAllDay: newEvent.isAllDay,
        time: newEvent.time,
        date: Timestamp.fromDate(eventDate),
        isRecurring: newEvent.isRecurring,
        recurringPattern: newEvent.isRecurring ? newEvent.recurringPattern : undefined,
        recurringEndDate: newEvent.recurringEndDate ? Timestamp.fromDate(newEvent.recurringEndDate) : undefined,
      });

      setNewEvent({
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
      setShowAddModal(false);
    } catch {
      Alert.alert('Error', 'No se pudo crear el evento');
    }
  };

  const handleUpdateEvent = async () => {
    if (!editingEvent || !editingEvent.title.trim()) return;

    try {
      await CalendarService.updateEvent(editingEvent.id, {
        title: editingEvent.title.trim(),
        description: editingEvent.description?.trim(),
        location: editingEvent.location?.trim(),
        type: editingEvent.type,
        isAllDay: editingEvent.isAllDay,
      });

    } catch {
      Alert.alert('Error', 'No se pudo actualizar el evento');
    }
  };

  const handleDeleteEvent = (event: CalendarEvent) => {
    setEventToDelete(event);
  };

  const confirmDeleteEvent = async () => {
    if (!eventToDelete) return;
    try {
      await CalendarService.deleteEvent(eventToDelete.id);
      setEventToDelete(null);
    } catch {
      Alert.alert('Error', 'No se pudo eliminar el evento');
    }
  };

  const formatEventDate = (timestamp: Timestamp) => {
    const date = ensureDate(timestamp);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const handleDayPress = (day: number) => {
    const selected = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(selected);
  };

  const generateHours = () => {
  const hours = [];
  for (let i = 0; i < 24; i++) {
    hours.push(i.toString().padStart(2, '0'));
  }
  return hours;
};

const generateMinutes = () => {
    const minutes = [];
    for (let i = 0; i < 60; i += 15) {
        minutes.push(i.toString().padStart(2, '0'));
    }
    return minutes;
};

const handleDateSelect = () => {
    const newDate = new Date(selectedYear, selectedMonth, selectedDay);
    setCurrentDate(newDate);
    setSelectedDate(newDate);
    setShowDatePicker(false);
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear - 50; year <= currentYear + 50; year++) {
      years.push(year);
    }
    return years;
  };

  const generateMonths = () => {
    return [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
  };

  const generateDays = () => {
    const maxDay = getDaysInMonth(selectedYear, selectedMonth);
    const days = [];
    for (let day = 1; day <= maxDay; day++) {
      days.push(day);
    }
    return days;
  };

  useEffect(() => {
    const maxDay = getDaysInMonth(selectedYear, selectedMonth);
    if (selectedDay > maxDay) {
        setSelectedDay(maxDay);
    }
  }, [selectedYear, selectedMonth, selectedDay]);

  const renderEvent = ({ item }: { item: CalendarEvent }) => (
    <TouchableOpacity
      style={styles.eventItem}
      onPress={() => onEventSelect?.(item)}
      onLongPress={() => setEditingEvent(item)}
    >
      <View style={styles.eventHeader}>
        <View style={styles.eventTitleContainer}>
          <Ionicons
            name={getEventIcon(item.type)}
            size={20}
            color={getEventColor(item.type)}
          />
          <Text style={styles.eventTitle}>{item.title}</Text>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteEvent(item)}
        >
          <Ionicons name="trash-outline" size={20} color="#ff4444" />
        </TouchableOpacity>
      </View>
      {item.description && (
        <Text style={styles.eventDescription}>{item.description}</Text>
      )}
      {item.location && (
        <Text style={styles.eventLocation}>
          <Ionicons name="location-outline" size={14} color={colors.text.secondary} />
          {' '}{item.location}
        </Text>
      )}
      <Text style={styles.eventDate}>
        {formatEventDate(item.date)}
        {item.isAllDay && ' (Todo el día)'}
      </Text>
    </TouchableOpacity>
  );

  const renderUpcomingEvent = ({ item }: { item: CalendarEvent }) => (
    <TouchableOpacity
      style={styles.upcomingEventItem}
      onPress={() => onEventSelect?.(item)}
    >
      <View style={styles.upcomingEventHeader}>
        <Ionicons
          name={getEventIcon(item.type)}
          size={16}
          color={getEventColor(item.type)}
        />
        <Text style={styles.upcomingEventTitle}>{item.title}</Text>
      </View>
      <Text style={styles.upcomingEventDate}>
        {formatEventDate(item.date)}
      </Text>
    </TouchableOpacity>
  );

  const renderCalendarDay = (day: number | null) => {
    if (!day) {
      return <View style={styles.emptyDay} />;
    }

    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateKey = formatDateKey(date);
    const hasEvents = markedDates[dateKey] && markedDates[dateKey].length > 0;
    const isSelected = selectedDate &&
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === currentDate.getMonth() &&
      selectedDate.getFullYear() === currentDate.getFullYear();
    const isToday = new Date().toDateString() === date.toDateString();

    return (
      <TouchableOpacity
        style={[
          styles.day,
          isSelected && styles.selectedDay,
          isToday && styles.todayDay,
        ]}
        onPress={() => handleDayPress(day)}
      >
        <Text style={[
          styles.dayText,
          isToday && styles.todayDayText,
          isSelected && styles.selectedDayText,
        ]}>
          {day}
        </Text>
        {hasEvents && (
          <View style={[styles.eventDot, { backgroundColor: getEventColor(markedDates[dateKey][0].type) }]} />
        )}
      </TouchableOpacity>
    );
  };

  const monthYear = currentDate.toLocaleDateString('es-ES', {
    month: 'long',
    year: 'numeric',
  });

  const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Calendario</Text>
        <TouchableOpacity
          style={styles.upcomingButton}
          onPress={() => setShowUpcomingModal(true)}
        >
          <Ionicons name="list-outline" size={20} color={colors.button.primary} />
          <Text style={styles.upcomingButtonText}>Próximos</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.calendarContainer}>
        <View style={styles.monthHeader}>
          <TouchableOpacity onPress={() => navigateMonth('prev')}>
            <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowDatePicker(true)}>
            <Text style={styles.monthTitle}>{monthYear}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigateMonth('next')}>
            <Ionicons name="chevron-forward" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.weekDays}>
          {weekDays.map(day => (
            <Text key={day} style={styles.weekDayText}>{day}</Text>
          ))}
        </View>

        <View style={styles.daysGrid}>
          {generateCalendarDays().map((day, index) => (
            <View key={index} style={styles.dayContainer}>
              {renderCalendarDay(day)}
            </View>
          ))}
        </View>
      </View>

      {selectedDate && (
        <View style={styles.selectedDateContainer}>
          <Text style={styles.selectedDateTitle}>
            Eventos para {selectedDate.toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>

          <TouchableOpacity
            style={styles.addEventButton}
            onPress={() => setShowAddModal(true)}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addEventButtonText}>Añadir evento</Text>
          </TouchableOpacity>

          {eventsForSelectedDate.length > 0 ? (
            <FlatList
              data={eventsForSelectedDate}
              renderItem={renderEvent}
              keyExtractor={(item) => item.id}
              style={styles.eventsList}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.noEventsContainer}>
              <Ionicons name="calendar-outline" size={48} color={colors.text.secondary} />
              <Text style={styles.noEventsText}>No hay eventos para este día</Text>
            </View>
          )}
        </View>
      )}

      <ConfirmModal
        visible={!!eventToDelete}
        title="Eliminar Evento"
        message={`¿Estás seguro de que quieres eliminar el evento "${eventToDelete?.title}"?`}
        onConfirm={confirmDeleteEvent}
        onCancel={() => setEventToDelete(null)}
        confirmText="Eliminar"
        isDestructive={true}
      />

      {/* Modal para añadir evento */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Nuevo evento</Text>
            <TouchableOpacity onPress={handleAddEvent}>
              <Text style={styles.saveButton}>Guardar</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <TextInput
              style={styles.titleInput}
              placeholder="Título del evento"
              placeholderTextColor={colors.text.secondary}
              value={newEvent.title}
              onChangeText={(text) => setNewEvent({ ...newEvent, title: text })}
            />
            <TextInput
              style={styles.descriptionInput}
              placeholder="Descripción (opcional)"
              placeholderTextColor={colors.text.secondary}
              multiline
              value={newEvent.description}
              onChangeText={(text) => setNewEvent({ ...newEvent, description: text })}
              textAlignVertical="top"
            />
            <TextInput
              style={styles.locationInput}
              placeholder="Ubicación (opcional)"
              placeholderTextColor={colors.text.secondary}
              value={newEvent.location}
              onChangeText={(text) => setNewEvent({ ...newEvent, location: text })}
            />

            <View style={styles.typeContainer}>
              <Text style={styles.typeLabel}>Tipo de evento:</Text>
              <View style={styles.typeButtons}>
                {([
                  { value: 'appointment', label: 'Cita', icon: 'calendar' },
                  { value: 'administrative', label: 'Administrativo', icon: 'briefcase' },
                  { value: 'personal', label: 'Personal', icon: 'person' },
                  { value: 'work', label: 'Trabajo', icon: 'business' },
                  { value: 'health', label: 'Salud', icon: 'heart' },
                  { value: 'social', label: 'Social', icon: 'people' },
                  { value: 'birthday', label: 'Cumpleaños', icon: 'gift' },
                  { value: 'reminder', label: 'Recordatorio', icon: 'notifications' },
                  { value: 'other', label: 'Otro', icon: 'bookmark' },
                ] as const).map(({ value, label, icon }) => (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.typeButton,
                      newEvent.type === value && styles.typeButtonSelected,
                    ]}
                    onPress={() => setNewEvent({ ...newEvent, type: value })}
                  >
                    <Ionicons
                      name={icon}
                      size={16}
                      color={newEvent.type === value ? '#fff' : colors.text.secondary}
                    />
                    <Text style={[
                      styles.typeButtonText,
                      newEvent.type === value && styles.typeButtonTextSelected,
                    ]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.timePickerContainer}>
              <TouchableOpacity
                style={styles.allDayToggle}
                onPress={() => setNewEvent({ ...newEvent, isAllDay: !newEvent.isAllDay })}
              >
                <Ionicons
                  name={newEvent.isAllDay ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={colors.button.primary}
                />
                <Text style={styles.allDayText}>Todo el día</Text>
              </TouchableOpacity>

              {!newEvent.isAllDay && (
                <View style={styles.timePickerContainer}>
                  <Text style={styles.timeLabel}>Hora del evento:</Text>
                  <View style={styles.timePickerRow}>
                    <TouchableOpacity
                      style={styles.timeButton}
                      onPress={() => setShowTimePicker(true)}
                    >
                      <Ionicons name="time-outline" size={20} color={colors.button.primary} />
                      <Text style={styles.timeButtonText}>{newEvent.time}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.recurringContainer}>
              <TouchableOpacity
                style={styles.recurringToggle}
                onPress={() => setNewEvent({ ...newEvent, isRecurring: !newEvent.isRecurring })}
              >
                <Ionicons
                  name={newEvent.isRecurring ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={colors.button.primary}
                />
                <Text style={styles.recurringText}>Evento periódico</Text>
              </TouchableOpacity>

              {newEvent.isRecurring && (
                <View style={styles.recurringOptions}>
                  <Text style={styles.recurringLabel}>Repetir:</Text>
                  <View style={styles.recurringButtons}>
                    {([
                      { value: 'daily', label: 'Diario' },
                      { value: 'weekly', label: 'Semanal' },
                      { value: 'monthly', label: 'Mensual' },
                      { value: 'quarterly', label: 'Trimestral' },
                      { value: 'yearly', label: 'Anual' },
                    ] as const).map(({ value, label }) => (
                      <TouchableOpacity
                        key={value}
                        style={[
                          styles.recurringButton,
                          newEvent.recurringPattern === value && styles.recurringButtonSelected,
                        ]}
                        onPress={() => setNewEvent({ ...newEvent, recurringPattern: value })}
                      >
                        <Text style={[
                          styles.recurringButtonText,
                          newEvent.recurringPattern === value && styles.recurringButtonTextSelected,
                        ]}>
                          {label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Modal de próximos eventos */}
      <Modal
        visible={showUpcomingModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowUpcomingModal(false)}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Próximos eventos</Text>
            <View style={{ width: 50 }} />
          </View>
          <FlatList
            data={upcomingEvents}
            renderItem={renderUpcomingEvent}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.upcomingEventsList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.noUpcomingContainer}>
                <Ionicons name="calendar-outline" size={48} color={colors.text.secondary} />
                <Text style={styles.noUpcomingText}>No hay próximos eventos</Text>
              </View>
            }
          />
        </View>
      </Modal>

      {/* Modal selector de fecha */}
      <Modal
        visible={showDatePicker}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowDatePicker(false)}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Seleccionar fecha</Text>
            <View style={{ width: 50 }} />
          </View>
          <ScrollView style={styles.modalContent}>
            <View style={styles.datePickerContainer}>
              <View style={styles.datePickerRow}>
                <View style={styles.datePickerColumn}>
                  <Text style={styles.datePickerLabel}>Día</Text>
                  <ScrollView style={styles.datePickerScroll}>
                    <View style={styles.datePickerOptions}>
                      {generateDays().map(day => (
                        <TouchableOpacity
                          key={day}
                          style={[
                            styles.datePickerOption,
                            selectedDay === day && styles.datePickerOptionSelected
                          ]}
                          onPress={() => setSelectedDay(day)}
                        >
                          <Text style={[
                            styles.datePickerOptionText,
                            selectedDay === day && styles.datePickerOptionTextSelected
                          ]}>
                            {day}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>

                <View style={styles.datePickerColumn}>
                  <Text style={styles.datePickerLabel}>Mes</Text>
                  <ScrollView style={styles.datePickerScroll}>
                    <View style={styles.datePickerOptions}>
                      {generateMonths().map((month, index) => (
                        <TouchableOpacity
                          key={index}
                          style={[
                            styles.datePickerOption,
                            selectedMonth === index && styles.datePickerOptionSelected
                          ]}
                          onPress={() => setSelectedMonth(index)}
                        >
                          <Text style={[
                            styles.datePickerOptionText,
                            selectedMonth === index && styles.datePickerOptionTextSelected
                          ]}>
                            {month}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>

                <View style={styles.datePickerColumn}>
                  <Text style={styles.datePickerLabel}>Año</Text>
                  <ScrollView style={styles.datePickerScroll}>
                    <View style={styles.datePickerOptions}>
                      {generateYears().map(year => (
                        <TouchableOpacity
                          key={year}
                          style={[
                            styles.datePickerOption,
                            selectedYear === year && styles.datePickerOptionSelected
                          ]}
                          onPress={() => setSelectedYear(year)}
                        >
                          <Text style={[
                            styles.datePickerOptionText,
                            selectedYear === year && styles.datePickerOptionTextSelected
                          ]}>
                            {year}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              </View>

              <TouchableOpacity style={styles.datePickerConfirmButton} onPress={handleDateSelect}>
                <Text style={styles.datePickerConfirmButtonText}>Confirmar fecha</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Modal selector de hora */}
      <Modal
        visible={showTimePicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTimePicker(false)}
      >
        <View style={styles.timePickerOverlay}>
          <View style={styles.timePickerModal}>
            <Text style={styles.timePickerTitle}>Seleccionar hora</Text>
            <View style={styles.timePickerWheels}>
              <ScrollView style={styles.timeWheel}>
                {generateHours().map(h => (
                  <TouchableOpacity
                    key={h}
                    onPress={() => {
                        const [, m] = newEvent.time.split(':');
                        setNewEvent({ ...newEvent, time: `${h}:${m}` });
                    }}
                    style={[styles.timeWheelOption, newEvent.time.startsWith(h) && styles.timeWheelOptionSelected]}
                  >
                    <Text style={[styles.timeWheelText, newEvent.time.startsWith(h) && styles.timeWheelTextSelected]}>{h}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Text style={styles.timeSeparator}>:</Text>
              <ScrollView style={styles.timeWheel}>
                {generateMinutes().map(m => (
                  <TouchableOpacity
                    key={m}
                    onPress={() => {
                        const [h] = newEvent.time.split(':');
                        setNewEvent({ ...newEvent, time: `${h}:${m}` });
                    }}
                    style={[styles.timeWheelOption, newEvent.time.endsWith(m) && styles.timeWheelOptionSelected]}
                  >
                    <Text style={[styles.timeWheelText, newEvent.time.endsWith(m) && styles.timeWheelTextSelected]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <TouchableOpacity
                style={styles.timeConfirmButton}
                onPress={() => setShowTimePicker(false)}
            >
              <Text style={styles.timeConfirmButtonText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal para editar evento */}
      {editingEvent && (
        <Modal
          visible={!!editingEvent}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setEditingEvent(null)}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Editar evento</Text>
              <TouchableOpacity onPress={handleUpdateEvent}>
                <Text style={styles.saveButton}>Actualizar</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent}>
              <TextInput
                style={styles.titleInput}
                placeholder="Título del evento"
                placeholderTextColor={colors.text.secondary}
                value={editingEvent.title}
                onChangeText={(text) => setEditingEvent({ ...editingEvent, title: text })}
              />
              <TextInput
                style={styles.descriptionInput}
                placeholder="Descripción (opcional)"
                placeholderTextColor={colors.text.secondary}
                multiline
                value={editingEvent.description}
                onChangeText={(text) => setEditingEvent({ ...editingEvent, description: text })}
                textAlignVertical="top"
              />
              <TextInput
                style={styles.locationInput}
                placeholder="Ubicación (opcional)"
                placeholderTextColor={colors.text.secondary}
                value={editingEvent.location}
                onChangeText={(text) => setEditingEvent({ ...editingEvent, location: text })}
              />
              <View style={styles.typeContainer}>
                <Text style={styles.typeLabel}>Tipo de evento:</Text>
                <View style={styles.typeButtons}>
                  {([
                    { value: 'appointment', label: 'Cita', icon: 'calendar' },
                    { value: 'administrative', label: 'Administrativo', icon: 'briefcase' },
                    { value: 'personal', label: 'Personal', icon: 'person' },
                    { value: 'work', label: 'Trabajo', icon: 'business' },
                    { value: 'health', label: 'Salud', icon: 'heart' },
                    { value: 'social', label: 'Social', icon: 'people' },
                    { value: 'birthday', label: 'Cumpleaños', icon: 'gift' },
                    { value: 'reminder', label: 'Recordatorio', icon: 'notifications' },
                    { value: 'other', label: 'Otro', icon: 'bookmark' },
                  ] as const).map(({ value, label, icon }) => (
                    <TouchableOpacity
                      key={value}
                      style={[
                        styles.typeButton,
                        editingEvent.type === value && styles.typeButtonSelected,
                      ]}
                      onPress={() => setEditingEvent({ ...editingEvent, type: value })}
                    >
                      <Ionicons
                        name={icon}
                        size={16}
                        color={editingEvent.type === value ? '#fff' : colors.text.secondary}
                      />
                      <Text style={[
                        styles.typeButtonText,
                        editingEvent.type === value && styles.typeButtonTextSelected,
                      ]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  upcomingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.tertiary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  upcomingButtonText: {
    color: colors.button.primary,
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 14,
  },
  calendarContainer: {
    backgroundColor: colors.background.secondary,
    marginHorizontal: 15,
    borderRadius: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: colors.border.light,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    textTransform: 'capitalize',
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  weekDayText: {
    color: colors.text.tertiary,
    fontSize: 12,
    fontWeight: '600',
    width: 40,
    textAlign: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  dayContainer: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  day: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  dayText: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: '500',
  },
  emptyDay: {
    width: '100%',
    height: '100%',
  },
  selectedDay: {
    backgroundColor: colors.button.primary,
  },
  selectedDayText: {
    color: '#fff',
    fontWeight: '700',
  },
  todayDay: {
    borderWidth: 1,
    borderColor: colors.button.primary,
  },
  todayDayText: {
    color: colors.button.primary,
    fontWeight: '700',
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    bottom: 5,
  },
  selectedDateContainer: {
    flex: 1,
    padding: 20,
    marginTop: 10,
  },
  selectedDateTitle: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 15,
  },
  addEventButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.button.primary,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  addEventButtonText: {
    color: '#fff',
    fontWeight: '700',
    marginLeft: 8,
  },
  eventsList: {
    flex: 1,
  },
  eventItem: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    marginLeft: 10,
  },
  eventDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  eventLocation: {
    fontSize: 13,
    color: colors.text.tertiary,
    marginBottom: 10,
  },
  eventDate: {
    fontSize: 12,
    color: colors.text.tertiary,
    fontWeight: '500',
  },
  deleteButton: {
    padding: 5,
  },
  noEventsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.5,
  },
  noEventsText: {
    color: colors.text.secondary,
    marginTop: 15,
    fontSize: 16,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  saveButton: {
    color: colors.button.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  modalContent: {
    padding: 20,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 20,
  },
  descriptionInput: {
    fontSize: 16,
    color: colors.text.secondary,
    minHeight: 100,
    marginBottom: 20,
  },
  locationInput: {
    fontSize: 16,
    color: colors.text.primary,
    backgroundColor: colors.background.secondary,
    padding: 12,
    borderRadius: 12,
    marginBottom: 25,
  },
  typeContainer: {
    marginBottom: 25,
  },
  typeLabel: {
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  typeButtonSelected: {
    backgroundColor: colors.button.primary,
    borderColor: colors.button.primary,
  },
  typeButtonText: {
    color: colors.text.secondary,
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '500',
  },
  typeButtonTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  timePickerContainer: {
    marginBottom: 25,
  },
  allDayToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  allDayText: {
    color: colors.text.primary,
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '500',
  },
  timePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeLabel: {
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.tertiary,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  timeButtonText: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 10,
  },
  recurringContainer: {
    marginBottom: 25,
  },
  recurringToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  recurringText: {
    color: colors.text.primary,
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '500',
  },
  recurringOptions: {
    backgroundColor: colors.background.secondary,
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  recurringLabel: {
    color: colors.text.secondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
  },
  recurringButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recurringButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.background.tertiary,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  recurringButtonSelected: {
    backgroundColor: colors.button.primary,
    borderColor: colors.button.primary,
  },
  recurringButtonText: {
    color: colors.text.secondary,
    fontSize: 12,
    fontWeight: '600',
  },
  recurringButtonTextSelected: {
    color: '#fff',
  },
  upcomingEventItem: {
    backgroundColor: colors.background.secondary,
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  upcomingEventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  upcomingEventTitle: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },
  upcomingEventDate: {
    color: colors.text.secondary,
    fontSize: 12,
    marginLeft: 24,
  },
  upcomingEventsList: {
    padding: 20,
  },
  noUpcomingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    opacity: 0.5,
  },
  noUpcomingText: {
    color: colors.text.secondary,
    marginTop: 15,
  },
  datePickerContainer: {
    padding: 10,
  },
  datePickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 300,
  },
  datePickerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  datePickerLabel: {
    color: colors.text.secondary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  datePickerScroll: {
    width: '100%',
  },
  datePickerOptions: {
    paddingHorizontal: 10,
  },
  datePickerOption: {
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 4,
  },
  datePickerOptionSelected: {
    backgroundColor: colors.button.primary,
  },
  datePickerOptionText: {
    color: colors.text.primary,
    fontSize: 16,
  },
  datePickerOptionTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  datePickerConfirmButton: {
    backgroundColor: colors.accent.primary,
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  datePickerConfirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  timePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timePickerModal: {
    backgroundColor: colors.background.secondary,
    width: '80%',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  timePickerTitle: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
  },
  timePickerWheels: {
    flexDirection: 'row',
    height: 200,
    alignItems: 'center',
  },
  timeWheel: {
    flex: 1,
  },
  timeWheelOption: {
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  timeWheelOptionSelected: {
    backgroundColor: colors.button.primary + '20',
  },
  timeWheelText: {
    color: colors.text.secondary,
    fontSize: 20,
  },
  timeWheelTextSelected: {
    color: colors.button.primary,
    fontWeight: '700',
  },
  timeSeparator: {
    color: colors.text.primary,
    fontSize: 30,
    fontWeight: '700',
    marginHorizontal: 10,
  },
  timeConfirmButton: {
    marginTop: 20,
    backgroundColor: colors.button.primary,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 12,
  },
  timeConfirmButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
