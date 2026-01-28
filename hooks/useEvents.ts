import { useState, useEffect } from 'react';
import { CalendarEvent } from '../types';
import { CalendarService } from '../services/calendarService';
import { useAuth } from '../contexts/AuthContext';

export const useEvents = (selectedDate: string = new Date().toISOString().split('T')[0]) => {
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

      const targetDate = new Date(selectedDate);
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
