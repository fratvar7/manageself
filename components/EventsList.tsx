import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CalendarEvent } from '../types';
import { colors } from '../css/colors';
import { ensureDate } from '../utils/dateUtils';

const { height: screenHeight } = Dimensions.get('window');

interface EventsListProps {
  events: CalendarEvent[];
  initiallyExpanded?: boolean;
  plain?: boolean;
  onEventLongPress?: (event: CalendarEvent) => void;
  onDeleteEvent?: (event: CalendarEvent) => void;
  monthLimit?: number | null;
  allowYearNavigation?: boolean;
}

export const EventsList: React.FC<EventsListProps> = ({
  events,
  initiallyExpanded = false,
  plain = false,
  onEventLongPress,
  onDeleteEvent,
  monthLimit = null,
  allowYearNavigation = false
}) => {
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);
  const [height] = useState(new Animated.Value(initiallyExpanded ? screenHeight * 0.8 : 60));
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

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

  const formatTime = (time: string) => time;

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    Animated.timing(height, {
      toValue: isExpanded ? 60 : screenHeight * 0.8,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  // Filtrar y agrupar eventos
  const groupedEvents = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const filtered = events.filter(e => {
        const d = ensureDate(e.date);

        if (allowYearNavigation) {
            // Solo eventos del año seleccionado
            return d.getFullYear() === currentYear;
        }

        if (monthLimit) {
            const limitDate = new Date(now);
            limitDate.setMonth(now.getMonth() + monthLimit);
            return d >= now && d <= limitDate;
        }
        return d >= now;
    }).sort((a, b) => ensureDate(a.date).getTime() - ensureDate(b.date).getTime());

    const groups: { [key: string]: CalendarEvent[] } = {};
    filtered.forEach(e => {
        const d = ensureDate(e.date);
        const monthName = d.toLocaleDateString('es-ES', { month: 'long' });
        const monthYear = `${monthName} ${d.getFullYear()}`;
        if (!groups[monthYear]) groups[monthYear] = [];
        groups[monthYear].push(e);
    });
    return groups;
  }, [events, monthLimit, allowYearNavigation, currentYear]);

  const hasEvents = Object.keys(groupedEvents).length > 0;

  const renderEvent = (event: CalendarEvent) => {
    const date = ensureDate(event.date);
    return (
      <TouchableOpacity
        key={event.id}
        style={[styles.eventItem, { borderLeftColor: getEventColor(event.type) }]}
        onLongPress={() => onEventLongPress?.(event)}
        delayLongPress={500}
        activeOpacity={0.7}
      >
        <View style={styles.eventHeader}>
          <View style={styles.eventMainInfo}>
            <Ionicons name={getEventIcon(event.type)} size={14} color={getEventColor(event.type)} />
            <Text style={styles.eventTitle} numberOfLines={1}>
              {event.title}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={styles.eventMeta}>
               <Text style={{ fontSize: 10, color: colors.text.tertiary, fontWeight: '700', marginRight: 4 }}>
                  {date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }).toUpperCase()}
               </Text>
              {!event.isAllDay && (
                <Text style={styles.eventTime}>{formatTime(event.time)}</Text>
              )}
              {event.isAllDay && (
                <Text style={styles.eventTimeAllDay}>Todo el día</Text>
              )}
              {event.isRecurring && (
                <Text style={styles.eventRecurringCompact}>
                  {event.recurringPattern === 'daily' ? 'D' :
                   event.recurringPattern === 'weekly' ? 'S' :
                   event.recurringPattern === 'monthly' ? 'M' :
                   event.recurringPattern === 'quarterly' ? 'T' :
                   event.recurringPattern === 'yearly' ? 'A' : ''}
                </Text>
              )}
            </View>
            {onDeleteEvent && (
              <TouchableOpacity
                onPress={() => onDeleteEvent(event)}
                style={{ marginLeft: 10, padding: 4 }}
              >
                <Ionicons name="trash-outline" size={16} color={colors.status.error} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {(event.description || event.location) && (
          <View style={styles.eventDetails}>
            {event.description && (
              <Text style={styles.eventDescription} numberOfLines={1}>
                {event.description}
              </Text>
            )}
            {event.location && (
              <View style={styles.eventLocation}>
                <Ionicons name="location-outline" size={12} color={colors.text.secondary} />
                <Text style={styles.eventLocationText}>{event.location}</Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderContent = () => (
    <View style={styles.plainList}>
        {allowYearNavigation && (
          <View style={styles.yearNavigation}>
            <TouchableOpacity onPress={() => setCurrentYear(prev => prev - 1)} style={styles.navButton}>
              <Ionicons name="chevron-back" size={24} color={colors.accent.primary} />
            </TouchableOpacity>
            <Text style={styles.yearText}>{currentYear}</Text>
            <TouchableOpacity onPress={() => setCurrentYear(prev => prev + 1)} style={styles.navButton}>
              <Ionicons name="chevron-forward" size={24} color={colors.accent.primary} />
            </TouchableOpacity>
          </View>
        )}

        {hasEvents ? (
          Object.entries(groupedEvents).map(([month, monthEvents]) => (
              <View key={month} style={{ marginBottom: 20 }}>
                  <Text style={styles.monthHeader}>{month}</Text>
                  {monthEvents.map(renderEvent)}
              </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-clear-outline" size={48} color={colors.text.tertiary} />
            <Text style={styles.emptyText}>No hay eventos para este período</Text>
          </View>
        )}
    </View>
  );

  if (plain) return renderContent();

  return (
    <Animated.View style={[styles.container, { height }]}>
      <TouchableOpacity style={styles.header} onPress={toggleExpanded}>
        <View style={styles.headerLeft}>
          <Ionicons name="calendar-outline" size={20} color={colors.text.secondary} />
          <Text style={styles.title}>
            Próximos Eventos
          </Text>
        </View>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.text.secondary}
        />
      </TouchableOpacity>

      {isExpanded && (
        <ScrollView style={styles.eventsList} showsVerticalScrollIndicator={false}>
          {renderContent()}
        </ScrollView>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  yearNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.tertiary,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  yearText: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text.primary,
    marginHorizontal: 30,
  },
  navButton: {
    padding: 5,
  },
  plainList: {
    padding: 0,
  },
  monthHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.accent.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 5,
    paddingLeft: 4
  },
  container: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    marginVertical: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
    backgroundColor: colors.background.tertiary,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    marginLeft: 8,
    flex: 1,
  },
  eventsList: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 12,
  },
  eventItem: {
    backgroundColor: colors.background.tertiary,
    borderLeftWidth: 4,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderStyle: 'solid',
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventMainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginLeft: 10,
    flex: 1,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventTime: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  eventTimeAllDay: {
    fontSize: 12,
    color: colors.text.tertiary,
    fontStyle: 'italic',
  },
  eventRecurringCompact: {
    fontSize: 10,
    color: colors.button.primary,
    backgroundColor: colors.background.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: '700',
  },
  eventDetails: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  eventDescription: {
    fontSize: 13,
    color: colors.text.secondary,
    marginBottom: 6,
    lineHeight: 18,
  },
  eventLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventLocationText: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    color: colors.text.tertiary,
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  }
});
