import { useState, useEffect } from 'react';
import { CalendarEvent } from '../types';
import { CalendarService } from '../services/calendarService';
import { useAuth } from '../contexts/AuthContext';
import { formatDateISO } from '../utils/dateUtils';

export const useEvents = (selectedDate: string = formatDateISO(new Date())) => {
  const { user } = useAuth();
  const [allEvents, setAllEvents] = useState<CalendarEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Suscribirse a todos los eventos del usuario
  useEffect(() => {
    if (!user) {
      setAllEvents([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = CalendarService.subscribeToEvents(user.uid, (events) => {
      setAllEvents(events);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Filtrar eventos por la fecha seleccionada
  useEffect(() => {
    const filterEvents = () => {
      if (!selectedDate) {
        setFilteredEvents([]);
        return;
      }

      const [y, m, d] = selectedDate.split('-').map(Number);
      const targetDate = new Date(y, m - 1, d);
      targetDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);

      const filtered = allEvents.filter(event => {
        const eventDate = event.date.toDate();
        return eventDate >= targetDate && eventDate < nextDay;
      });

      setFilteredEvents(filtered);
    };

    filterEvents();
  }, [allEvents, selectedDate]);

  return {
    events: filteredEvents,
    allEvents,
    // Provide a helper for the 2-month view if needed, or consumers can filter `allEvents`
    upcomingEvents: allEvents.filter(e => {
        const d = e.date.toDate();
        const now = new Date();
        now.setHours(0,0,0,0);
        const twoMonths = new Date(now);
        twoMonths.setMonth(now.getMonth() + 2);
        return d >= now && d <= twoMonths;
    }),
    loading,
  };
};
