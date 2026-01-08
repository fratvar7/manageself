import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CalendarEvent } from '../types';
import { colors } from '../css/colors';

const { height: screenHeight } = Dimensions.get('window');

interface EventsListProps {
  events: CalendarEvent[];
}

export const EventsList: React.FC<EventsListProps> = ({ events }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [height] = useState(new Animated.Value(60)); // Altura inicial minimizada

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
      case 'appointment': return colors.accent.blue;
      case 'administrative': return colors.accent.purple;
      case 'personal': return colors.accent.mint;
      case 'work': return colors.accent.coral;
      case 'health': return colors.status.error;
      case 'social': return colors.accent.purple;
      default: return colors.button.primary;
    }
  };

  const formatTime = (time: string) => {
    return time;
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    Animated.timing(height, {
      toValue: isExpanded ? 60 : screenHeight * 0.8, // 80% de la altura de la pantalla
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  // No mostrar si no hay eventos
  if (events.length === 0) {
    return null;
  }

  const renderEvent = (event: CalendarEvent) => (
    <View key={event.id} style={[styles.eventItem, { borderLeftColor: getEventColor(event.type) }]}>
      <View style={styles.eventHeader}>
        <View style={styles.eventMainInfo}>
          <Ionicons name={getEventIcon(event.type)} size={14} color={getEventColor(event.type)} />
          <Text style={styles.eventTitle} numberOfLines={1}>
            {event.title}
          </Text>
        </View>
        <View style={styles.eventMeta}>
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
    </View>
  );

  return (
    <Animated.View style={[styles.container, { height }]}>
      <TouchableOpacity style={styles.header} onPress={toggleExpanded}>
        <View style={styles.headerLeft}>
          <Ionicons name="calendar-outline" size={20} color={colors.text.secondary} />
          <Text style={styles.title}>
            Eventos de hoy ({events.length})
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
          {events.map(renderEvent)}
        </ScrollView>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a', // Más oscuro para mejor contraste
    borderRadius: 8,
    marginVertical: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333333',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    backgroundColor: '#161616',
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
  },
  eventsList: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  eventItem: {
    backgroundColor: '#141414',
    borderLeftWidth: 3,
    borderRadius: 6,
    padding: 10,
    marginBottom: 6,
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
    marginLeft: 6,
    flex: 1,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventTime: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  eventTimeAllDay: {
    fontSize: 11,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  eventRecurringCompact: {
    fontSize: 10,
    color: colors.button.primary,
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
    fontWeight: '600',
  },
  eventDetails: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  eventDescription: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 4,
    lineHeight: 14,
  },
  eventLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventLocationText: {
    fontSize: 12,
    color: colors.text.secondary,
    marginLeft: 3,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  eventType: {
    fontSize: 12,
    color: colors.text.secondary,
    backgroundColor: colors.background.secondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    overflow: 'hidden',
  },
  eventRecurring: {
    fontSize: 12,
    color: colors.button.primary,
    backgroundColor: colors.background.secondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    overflow: 'hidden',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: colors.text.secondary,
    marginTop: 12,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 4,
    textAlign: 'center',
  },
});
