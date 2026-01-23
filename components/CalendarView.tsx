import React, { useState, useEffect, useCallback } from 'react';
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
import { colors } from '../css/colors';

interface CalendarViewProps {
  onEventSelect?: (event: CalendarEvent) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ onEventSelect }) => {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [eventsForSelectedDate, setEventsForSelectedDate] = useState<CalendarEvent[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
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

  const loadEvents = useCallback(async () => {
    if (!user) return;

    try {
      const userEvents = await CalendarService.getEvents(user.uid);

      // Agrupar eventos por fecha
      const eventsByDate: Record<string, CalendarEvent[]> = {};
      userEvents.forEach(event => {
        const dateKey = formatDateKey(event.date.toDate());
        if (!eventsByDate[dateKey]) {
          eventsByDate[dateKey] = [];
        }
        eventsByDate[dateKey].push(event);
      });
      setMarkedDates(eventsByDate);

      // Cargar próximos eventos
      const upcoming = await CalendarService.getUpcomingEvents(user.uid, 10);
      setUpcomingEvents(upcoming);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar los eventos');
    }
  }, [user]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const loadEventsForDate = useCallback(async (date: Date) => {
    if (!user) return;

    try {
      const dayEvents = await CalendarService.getEventsByDay(user.uid, date);
      setEventsForSelectedDate(dayEvents);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar los eventos del día');
    }
  }, [user]);

  useEffect(() => {
    if (selectedDate) {
      loadEventsForDate(selectedDate);
    }
  }, [selectedDate, loadEventsForDate]);

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
      loadEvents();
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

      setEditingEvent(null);
      loadEvents();
    } catch {
      Alert.alert('Error', 'No se pudo actualizar el evento');
    }
  };

  const handleDeleteEvent = (event: CalendarEvent) => {
    Alert.alert(
      'Eliminar evento',
      `¿Estás seguro de que quieres eliminar "${event.title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await CalendarService.deleteEvent(event.id);
              loadEvents();
            } catch {
              Alert.alert('Error', 'No se pudo eliminar el evento');
            }
          },
        },
      ]
    );
  };

  const formatEventDate = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
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
          isSelected && styles.selectedDayText,
          isToday && styles.todayDayText,
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
            />
          ) : (
            <View style={styles.noEventsContainer}>
              <Ionicons name="calendar-outline" size={48} color={colors.text.secondary} />
              <Text style={styles.noEventsText}>No hay eventos para este día</Text>
            </View>
          )}
        </View>
      )}

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

            <View style={styles.timeContainer}>
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
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowTimePicker(false)}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Seleccionar hora</Text>
            <View style={{ width: 50 }} />
          </View>
          <ScrollView style={styles.modalContent}>
            <View style={styles.timePickerContainer}>
              <Text style={styles.timePickerSectionTitle}>Hora del evento</Text>
              <View style={styles.timePickerGrid}>
                {generateHours().map(hour => (
                  <TouchableOpacity
                    key={hour}
                    style={[
                      styles.timePickerOption,
                      newEvent.time.split(':')[0] === hour && styles.timePickerOptionSelected
                    ]}
                    onPress={() => {
                      const [currentMinutes] = newEvent.time.split(':');
                      setNewEvent({ ...newEvent, time: `${hour}:${currentMinutes}` });
                    }}
                  >
                    <Text style={[
                      styles.timePickerOptionText,
                      newEvent.time.split(':')[0] === hour && styles.timePickerOptionTextSelected
                    ]}>
                      {hour}:00
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.timePickerGrid}>
                {generateMinutes().map(minute => (
                  <TouchableOpacity
                    key={minute}
                    style={[
                      styles.timePickerOption,
                      newEvent.time.split(':')[1] === minute && styles.timePickerOptionSelected
                    ]}
                    onPress={() => {
                      const [currentHours] = newEvent.time.split(':');
                      setNewEvent({ ...newEvent, time: `${currentHours}:${minute}` });
                    }}
                  >
                    <Text style={[
                      styles.timePickerOptionText,
                      newEvent.time.split(':')[1] === minute && styles.timePickerOptionTextSelected
                    ]}>
                      {minute}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.datePickerConfirmButton} onPress={() => setShowTimePicker(false)}>
                <Text style={styles.datePickerConfirmButtonText}>Confirmar hora</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Modal para editar evento */}
      <Modal
        visible={!!editingEvent}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
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
              value={editingEvent?.title || ''}
              onChangeText={(text) => setEditingEvent(editingEvent ? { ...editingEvent, title: text } : null)}
            />
            <TextInput
              style={styles.descriptionInput}
              placeholder="Descripción (opcional)"
              placeholderTextColor={colors.text.secondary}
              multiline
              value={editingEvent?.description || ''}
              onChangeText={(text) => setEditingEvent(editingEvent ? { ...editingEvent, description: text } : null)}
              textAlignVertical="top"
            />
            <TextInput
              style={styles.locationInput}
              placeholder="Ubicación (opcional)"
              placeholderTextColor={colors.text.secondary}
              value={editingEvent?.location || ''}
              onChangeText={(text) => setEditingEvent(editingEvent ? { ...editingEvent, location: text } : null)}
            />
          </ScrollView>
        </View>
      </Modal>
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
  },
  upcomingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.background.card,
  },
  upcomingButtonText: {
    color: colors.button.primary,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  calendarContainer: {
    backgroundColor: colors.background.card,
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  weekDays: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayContainer: {
    width: '14.28%',
    aspectRatio: 1,
  },
  emptyDay: {
    flex: 1,
  },
  day: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    margin: 1,
  },
  selectedDay: {
    backgroundColor: colors.button.primary,
  },
  todayDay: {
    borderWidth: 1.5,
    borderColor: colors.button.primary,
  },
  dayText: {
    fontSize: 14,
    color: colors.text.primary,
  },
  selectedDayText: {
    color: '#fff',
    fontWeight: '600',
  },
  todayDayText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
  selectedDateContainer: {
    flex: 1,
    padding: 16,
  },
  selectedDateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 16,
  },
  addEventButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.button.primary,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  addEventButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  eventsList: {
    flex: 1,
  },
  eventItem: {
    backgroundColor: colors.background.card,
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.button.primary,
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
    fontWeight: '600',
    color: colors.text.primary,
    marginLeft: 8,
    flex: 1,
  },
  deleteButton: {
    padding: 4,
  },
  eventDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  eventLocation: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 12,
    color: colors.text.disabled,
  },
  noEventsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  noEventsText: {
    fontSize: 16,
    color: colors.text.secondary,
    marginTop: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  saveButton: {
    fontSize: 16,
    color: colors.button.primary,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  titleInput: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
    paddingBottom: 12,
    marginBottom: 20,
  },
  descriptionInput: {
    fontSize: 16,
    color: colors.text.primary,
    backgroundColor: colors.background.card,
    padding: 12,
    borderRadius: 8,
    minHeight: 100,
    marginBottom: 16,
    textAlignVertical: 'top',
  },
  locationInput: {
    fontSize: 16,
    color: colors.text.primary,
    backgroundColor: colors.background.card,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  typeContainer: {
    marginBottom: 20,
  },
  typeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  typeButtonSelected: {
    backgroundColor: colors.button.primary,
    borderColor: colors.button.primary,
  },
  typeButtonText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginLeft: 4,
  },
  typeButtonTextSelected: {
    color: '#fff',
  },
  upcomingEventsList: {
    padding: 16,
  },
  upcomingEventItem: {
    backgroundColor: colors.background.card,
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
  },
  upcomingEventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  upcomingEventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginLeft: 8,
    flex: 1,
  },
  upcomingEventDate: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  noUpcomingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  noUpcomingText: {
    fontSize: 16,
    color: colors.text.secondary,
    marginTop: 12,
  },
  datePickerContainer: {
    paddingVertical: 20,
  },
  datePickerRow: {
    flexDirection: 'row',
    height: 300,
    marginBottom: 20,
  },
  datePickerColumn: {
    flex: 1,
    paddingHorizontal: 8,
  },
  datePickerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 10,
  },
  datePickerScroll: {
    flex: 1,
    backgroundColor: colors.background.card,
    borderRadius: 12,
  },
  datePickerOptions: {
    paddingVertical: 10,
  },
  datePickerOption: {
    paddingVertical: 15,
    paddingHorizontal: 12,
    marginVertical: 2,
    borderRadius: 8,
    alignItems: 'center',
  },
  datePickerOptionSelected: {
    backgroundColor: colors.button.primary,
  },
  datePickerOptionText: {
    fontSize: 16,
    color: colors.text.primary,
  },
  datePickerOptionTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  datePickerConfirmButton: {
    backgroundColor: colors.button.primary,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  datePickerConfirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  recurringContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  recurringToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  recurringText: {
    fontSize: 16,
    color: colors.text.primary,
    marginLeft: 8,
  },
  recurringOptions: {
    marginTop: 16,
    paddingLeft: 28,
  },
  recurringLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  recurringButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recurringButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  recurringButtonSelected: {
    backgroundColor: colors.button.primary,
    borderColor: colors.button.primary,
  },
  recurringButtonText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  recurringButtonTextSelected: {
    color: '#fff',
  },
  timeContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  allDayToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  allDayText: {
    fontSize: 16,
    color: colors.text.primary,
    marginLeft: 8,
  },
  timePickerContainer: {
    paddingVertical: 20,
  },
  timePickerSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  timePickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 20,
  },
  timePickerOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: 'center',
    minWidth: 60,
  },
  timePickerOptionSelected: {
    backgroundColor: colors.button.primary,
    borderColor: colors.button.primary,
  },
  timePickerOptionText: {
    fontSize: 16,
    color: colors.text.primary,
  },
  timePickerOptionTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  timePickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  timeButtonText: {
    fontSize: 16,
    color: colors.button.primary,
    marginLeft: 8,
  },
  timeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
});
