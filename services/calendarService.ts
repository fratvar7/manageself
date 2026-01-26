import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  getDocs,
  getDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { CalendarEvent } from '../types';

const EVENTS_COLLECTION = 'events';

export class CalendarService {
  // Generar eventos periódicos
  static generateRecurringEvents(baseEvent: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>): Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>[] {
    if (!baseEvent.isRecurring || !baseEvent.recurringPattern) {
      return [baseEvent];
    }

    const events: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>[] = [];
    const startDate = baseEvent.date.toDate();
    const endDate = baseEvent.recurringEndDate?.toDate() || new Date(startDate.getFullYear() + 10, startDate.getMonth(), startDate.getDate());

    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      events.push({
        ...baseEvent,
        date: Timestamp.fromDate(new Date(currentDate)),
      });

      // Avanzar a la siguiente fecha según el patrón
      switch (baseEvent.recurringPattern) {
        case 'daily':
          currentDate.setDate(currentDate.getDate() + 1);
          break;
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
        case 'quarterly':
          currentDate.setMonth(currentDate.getMonth() + 3);
          break;
        case 'yearly':
          currentDate.setFullYear(currentDate.getFullYear() + 1);
          break;
      }
    }

    return events;
  }

  // Obtener todos los eventos de un usuario (incluyendo eventos periódicos generados)
  static async getEvents(userId: string): Promise<CalendarEvent[]> {
    try {
      const eventsQuery = query(
        collection(db, EVENTS_COLLECTION),
        where('userId', '==', userId),
        orderBy('date', 'asc')
      );

      const snapshot = await getDocs(eventsQuery);
      const baseEvents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as CalendarEvent[];

      // Generar eventos periódicos
      const allEvents: CalendarEvent[] = [];
      for (const baseEvent of baseEvents) {
        if (baseEvent.isRecurring) {
          const recurringEvents = this.generateRecurringEvents(baseEvent);
          allEvents.push(...recurringEvents.map((event, index) => ({
            ...event,
            id: `${baseEvent.id}_recurring_${index}`,
            createdAt: baseEvent.createdAt,
            updatedAt: baseEvent.updatedAt,
          })) as CalendarEvent[]);
        } else {
          allEvents.push(baseEvent);
        }
      }

      return allEvents;
    } catch (error) {
      console.error('Error getting events:', error);
      throw error;
    }
  }

  // Obtener eventos de un mes específico
  static async getEventsByMonth(userId: string, year: number, month: number): Promise<CalendarEvent[]> {
    try {
      // Crear timestamps para el inicio y fin del mes
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59); // Último día del mes

      const startTimestamp = Timestamp.fromDate(startDate);
      const endTimestamp = Timestamp.fromDate(endDate);

      const eventsQuery = query(
        collection(db, EVENTS_COLLECTION),
        where('userId', '==', userId),
        where('date', '>=', startTimestamp),
        where('date', '<=', endTimestamp),
        orderBy('date', 'asc')
      );

      const snapshot = await getDocs(eventsQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as CalendarEvent[];
    } catch (error) {
      console.error('Error getting events by month:', error);
      throw error;
    }
  }

  // Obtener próximos eventos (limitado a un número)
  static async getUpcomingEvents(userId: string, limit: number = 10): Promise<CalendarEvent[]> {
    try {
      const now = Timestamp.now();
      const eventsQuery = query(
        collection(db, EVENTS_COLLECTION),
        where('userId', '==', userId),
        where('date', '>=', now),
        orderBy('date', 'asc'),
        where('date', '<=', Timestamp.fromDate(new Date(now.toDate().getTime() + 365 * 24 * 60 * 60 * 1000))) // Próximo año
      );

      const snapshot = await getDocs(eventsQuery);
      const events = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as CalendarEvent[];

      return events.slice(0, limit);
    } catch (error) {
      console.error('Error getting upcoming events:', error);
      throw error;
    }
  }

  // Obtener eventos de un día específico
  static async getEventsByDay(userId: string, date: Date): Promise<CalendarEvent[]> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const eventsQuery = query(
        collection(db, EVENTS_COLLECTION),
        where('userId', '==', userId),
        where('date', '>=', Timestamp.fromDate(startOfDay)),
        where('date', '<=', Timestamp.fromDate(endOfDay)),
        orderBy('date', 'asc')
      );

      const snapshot = await getDocs(eventsQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as CalendarEvent[];
    } catch (error) {
      console.error('Error getting events by day:', error);
      throw error;
    }
  }

  // Obtener un evento específico
  static async getEvent(eventId: string): Promise<CalendarEvent | null> {
    try {
      const eventDoc = await getDoc(doc(db, EVENTS_COLLECTION, eventId));

      if (!eventDoc.exists()) {
        return null;
      }

      return {
        id: eventDoc.id,
        ...eventDoc.data(),
      } as CalendarEvent;
    } catch (error) {
      console.error('Error getting event:', error);
      throw error;
    }
  }

  // Crear nuevo evento
  static async createEvent(userId: string, event: Omit<CalendarEvent, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<CalendarEvent> {
    try {
      const now = Timestamp.now();

      // Filtrar campos undefined para evitar error de Firebase
      const filteredEvent: any = {};
      Object.keys(event).forEach(key => {
        const value = event[key as keyof CalendarEvent];
        if (value !== undefined) {
          filteredEvent[key] = value;
        }
      });

      const docRef = await addDoc(collection(db, EVENTS_COLLECTION), {
        ...filteredEvent,
        userId,
        createdAt: now,
        updatedAt: now,
      });

      const newDoc = await getDoc(docRef);
      return {
        id: docRef.id,
        ...newDoc.data(),
      } as CalendarEvent;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  }

  // Actualizar evento
  static async updateEvent(eventId: string, updates: Partial<Omit<CalendarEvent, 'id' | 'userId' | 'createdAt'>>): Promise<void> {
    try {
      const eventRef = doc(db, EVENTS_COLLECTION, eventId);
      await updateDoc(eventRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  }

  // Eliminar evento
  static async deleteEvent(eventId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, EVENTS_COLLECTION, eventId));
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }

  // Buscar eventos por texto
  static async searchEvents(userId: string, searchText: string): Promise<CalendarEvent[]> {
    try {
      const allEvents = await this.getEvents(userId);
      const searchLower = searchText.toLowerCase();

      return allEvents.filter(event =>
        event.title.toLowerCase().includes(searchLower) ||
        (event.description && event.description.toLowerCase().includes(searchLower)) ||
        (event.location && event.location.toLowerCase().includes(searchLower))
      );
    } catch (error) {
      console.error('Error searching events:', error);
      throw error;
    }
  }

  // Obtener eventos por tipo
  static async getEventsByType(userId: string, type: CalendarEvent['type']): Promise<CalendarEvent[]> {
    try {
      const eventsQuery = query(
        collection(db, EVENTS_COLLECTION),
        where('userId', '==', userId),
        where('type', '==', type),
        orderBy('date', 'asc')
      );

      const snapshot = await getDocs(eventsQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as CalendarEvent[];
    } catch (error) {
      console.error('Error getting events by type:', error);
      throw error;
    }
  }

  // Suscribirse a eventos en tiempo real
  static subscribeToEvents(userId: string, callback: (events: CalendarEvent[]) => void): () => void {
    const eventsQuery = query(
      collection(db, EVENTS_COLLECTION),
      where('userId', '==', userId),
      orderBy('date', 'asc')
    );

    return onSnapshot(eventsQuery, (snapshot) => {
      const baseEvents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as CalendarEvent[];

      // Generar eventos periódicos
      const allEvents: CalendarEvent[] = [];
      for (const baseEvent of baseEvents) {
        if (baseEvent.isRecurring) {
          const recurringEvents = this.generateRecurringEvents(baseEvent);
          allEvents.push(...recurringEvents.map((event, index) => ({
            ...event,
            id: `${baseEvent.id}_recurring_${index}`,
            createdAt: baseEvent.createdAt,
            updatedAt: baseEvent.updatedAt,
          })) as CalendarEvent[]);
        } else {
          allEvents.push(baseEvent);
        }
      }

      callback(allEvents);
    }, (error) => {
      console.error('Error in event subscription:', error);
    });
  }

  static async wipeUserEvents(userId: string): Promise<void> {
    try {
      const q = query(
        collection(db, EVENTS_COLLECTION),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map(d => deleteDoc(d.ref));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error wiping user events:', error);
      throw error;
    }
  }
}
