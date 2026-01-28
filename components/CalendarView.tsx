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
  FlatList,
  StyleProp,
  ViewStyle,
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
import { EventModal } from './EventModal';
import { EventsList } from './EventsList';

interface CalendarViewProps {
  onEventSelect?: (event: CalendarEvent) => void;
  date?: Date;
  onDateChange?: (date: Date) => void;
  children?: React.ReactNode;
  extraMarkedDates?: Record<string, { color: string }>;
  style?: StyleProp<ViewStyle>;
  hideHeader?: boolean;
  collapsible?: boolean;
  hideEvents?: boolean;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ onEventSelect, date, onDateChange, children, extraMarkedDates, style, hideHeader, collapsible, hideEvents }) => {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [currentDate, setCurrentDate] = useState(date || new Date());
  const [internalSelectedDate, setInternalSelectedDate] = useState<Date>(date || new Date());
  const selectedDate = date || internalSelectedDate;

  const { allEvents } = useEvents();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUpcomingModal, setShowUpcomingModal] = useState(false);
  const [markedDates, setMarkedDates] = useState<Record<string, CalendarEvent[]>>({});
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [eventToDelete, setEventToDelete] = useState<CalendarEvent | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
     if (date) {
         setCurrentDate(date);
     }
  }, [date]);

  const getDaysInMonthForCalendar = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return day === 0 ? 6 : day - 1; // 0=Sun -> 6, 1=Mon -> 0
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonthForCalendar(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  };

  const formatDateKey = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

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

  const eventsForSelectedDate = allEvents.filter(event => {
    const eventDate = ensureDate(event.date);
    const targetDate = new Date(selectedDate);
    return eventDate.getFullYear() === targetDate.getFullYear() &&
           eventDate.getMonth() === targetDate.getMonth() &&
           eventDate.getDate() === targetDate.getDate();
  });

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

  const handleDeleteEvent = (event: CalendarEvent) => {
    setEventToDelete(event);
  };

  const confirmDeleteEvent = async () => {
    if (!eventToDelete) return;

    try {
      const rawId = eventToDelete.id.split('_recurring_')[0];
      await CalendarService.deleteEvent(rawId);
      setEventToDelete(null);
    } catch (error) {
      console.error('Error deleting event:', error);
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
    if (onDateChange) {
        onDateChange(selected);
    } else {
        setInternalSelectedDate(selected);
    }
    if (collapsible) {
        setIsExpanded(false);
    }
  };

  const handleDateSelect = () => {
    const newDate = new Date(selectedYear, selectedMonth, selectedDay);
    setCurrentDate(newDate);
    if (onDateChange) {
      onDateChange(newDate);
    } else {
      setInternalSelectedDate(newDate);
    }
    setShowDatePicker(false);
    if (collapsible) {
      setIsExpanded(false);
    }
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
      delayLongPress={500}
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
          <Ionicons name="trash-outline" size={20} color={colors.status.error} />
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

  const renderCalendarDay = (day: number | null) => {
    if (!day) {
      return <View style={styles.emptyDay} />;
    }

    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateKey = formatDateKey(date);
    const hasEvents = markedDates[dateKey] && markedDates[dateKey].length > 0;
    const hasExtra = extraMarkedDates && extraMarkedDates[dateKey];
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
        <View style={styles.dotContainer}>
            {hasEvents && (
            <View style={[styles.eventDot, { backgroundColor: getEventColor(markedDates[dateKey][0].type) }]} />
            )}
            {hasExtra && (
            <View style={[styles.eventDot, { backgroundColor: hasExtra.color }]} />
            )}
        </View>
      </TouchableOpacity>
    );
  };

  const monthYearStr = currentDate.toLocaleDateString('es-ES', {
    month: 'long',
    year: 'numeric',
  });

  const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  return (
    <View style={[styles.container, !collapsible && { flex: 1 }, style]}>
      {!hideHeader && (
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
      )}

      {collapsible && !isExpanded && (
        <View style={{ marginBottom: 15, paddingHorizontal: 15 }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.background.secondary,
            borderRadius: 20,
            padding: 4,
            borderWidth: 1,
            borderColor: colors.border.light,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 5,
          }}>
            <TouchableOpacity
              style={{ padding: 12 }}
              onPress={() => {
                const d = new Date(selectedDate);
                d.setDate(d.getDate() - 1);
                onDateChange?.(d);
              }}
            >
              <Ionicons name="chevron-back" size={24} color={colors.accent.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 10
              }}
              onPress={() => setIsExpanded(!isExpanded)}
            >
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 10, color: colors.text.tertiary, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {isExpanded ? 'Cerrar calendario' : 'Fecha seleccionada'}
                </Text>
                <Text style={{ fontSize: 16, color: colors.text.primary, fontWeight: '800', textTransform: 'capitalize' }}>
                  {selectedDate.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'long' })}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ padding: 12 }}
              onPress={() => {
                const d = new Date(selectedDate);
                d.setDate(d.getDate() + 1);
                onDateChange?.(d);
              }}
            >
              <Ionicons name="chevron-forward" size={24} color={colors.accent.primary} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {(!collapsible || isExpanded) && (
        <View style={styles.calendarContainer}>
          <View style={styles.monthHeader}>
            <TouchableOpacity onPress={() => navigateMonth('prev')}>
              <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowDatePicker(true)}>
              <Text style={styles.monthTitle}>{monthYearStr}</Text>
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
      )}

      {children || (!hideEvents && selectedDate && (
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
      ))}

      <EventModal
        visible={showAddModal || !!editingEvent}
        event={editingEvent}
        selectedDate={selectedDate}
        onClose={() => {
            setShowAddModal(false);
            setEditingEvent(null);
        }}
        onSave={async (data) => {
             try {
               if (editingEvent) {
                  const rawId = editingEvent.id.split('_recurring_')[0];
                  await CalendarService.updateEvent(rawId, {
                    title: data.title,
                    description: data.description,
                    location: data.location,
                    type: data.type,
                    isAllDay: data.isAllDay,
                    time: data.time,
                    isRecurring: data.isRecurring,
                    recurringPattern: data.recurringPattern
                  });
               } else {
                  if (!user) return;
                  const eventDate = new Date(selectedDate);
                  if (data.time && !data.isAllDay) {
                    const [hours, minutes] = data.time.split(':');
                    eventDate.setHours(parseInt(hours), parseInt(minutes));
                  }

                  await CalendarService.createEvent(user.uid, {
                    title: data.title,
                    description: data.description,
                    location: data.location,
                    date: Timestamp.fromDate(eventDate),
                    time: data.time || '09:00',
                    type: data.type,
                    isAllDay: data.isAllDay,
                    isRecurring: data.isRecurring,
                    recurringPattern: data.recurringPattern,
                    recurringEndDate: data.isRecurring ? Timestamp.fromDate(new Date(new Date(eventDate).setFullYear(eventDate.getFullYear() + 1))) : undefined
                  });
               }
               setShowAddModal(false);
               setEditingEvent(null);
             } catch (error) {
               console.error('Error saving event:', error);
               Alert.alert('Error', 'No se pudo guardar el evento');
             }
        }}
        onDelete={async () => {
             setEditingEvent(null);
        }}
      />

      <ConfirmModal
        visible={!!eventToDelete}
        title="Eliminar Evento"
        message={`¿Estás seguro de que quieres eliminar el evento "${eventToDelete?.title}"?`}
        onConfirm={confirmDeleteEvent}
        onCancel={() => setEventToDelete(null)}
        confirmText="Eliminar"
        isDestructive={true}
        type="delete"
      />

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
          <ScrollView
            style={{ flex: 1, padding: 15 }}
            showsVerticalScrollIndicator={false}
          >
            <EventsList
              events={allEvents}
              plain={true}
              onEventLongPress={(event) => setEditingEvent(event)}
              onDeleteEvent={(event) => setEventToDelete(event)}
              allowYearNavigation={true}
            />
          </ScrollView>
        </View>
      </Modal>

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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
    justifyContent: 'flex-start',
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
  dotContainer: {
    flexDirection: 'row',
    gap: 3,
    position: 'absolute',
    bottom: 6,
    justifyContent: 'center',
    width: '100%',
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  selectedDateContainer: {
    padding: 20,
    flex: 1,
  },
  selectedDateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 15,
  },
  addEventButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.button.primary,
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  addEventButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    marginLeft: 8,
  },
  eventsList: {
    flex: 1,
  },
  eventItem: {
    backgroundColor: colors.background.secondary,
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
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
  deleteButton: {
    padding: 5,
  },
  eventDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 8,
  },
  eventLocation: {
    fontSize: 13,
    color: colors.text.tertiary,
    marginBottom: 8,
  },
  eventDate: {
    fontSize: 12,
    color: colors.text.tertiary,
    fontWeight: '600',
  },
  noEventsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  noEventsText: {
    color: colors.text.secondary,
    fontSize: 16,
    marginTop: 10,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text.primary,
  },
  modalContent: {
    flex: 1,
  },
  datePickerContainer: {
    padding: 20,
  },
  datePickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 300,
    marginBottom: 20,
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
  },
  datePickerConfirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
