import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CalendarEvent } from '../types';
import { colors } from '../css/colors';

const { height: screenHeight } = Dimensions.get('window');

interface EventsListProps {
  events: CalendarEvent[];
  initiallyExpanded?: boolean;
  plain?: boolean;
}

export const EventsList: React.FC<EventsListProps> = ({ events, initiallyExpanded = false, plain = false }) => {
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);
  const [height] = useState(new Animated.Value(initiallyExpanded ? screenHeight * 0.8 : 60)); // Altura inicial minimizada o expandida

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

  // No mostrar si no hay eventos
  if (events.length === 0) {
    return null;
  }

  if (plain) {
    return (
      <View style={styles.plainList}>
        {events.map(renderEvent)}
      </View>
    );
  }

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
  plainList: {
    padding: 0,
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
  },
  eventsList: {
    paddingHorizontal: 12,
    paddingBottom: 12,
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
    borderRadius: 6,
  },
  eventRecurring: {
    fontSize: 12,
    color: colors.button.primary,
    backgroundColor: colors.background.secondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
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
    color: colors.text.tertiary,
    marginTop: 4,
    textAlign: 'center',
  },
});
