import { Timestamp } from 'firebase/firestore';

export interface Category {
  id: string;
  name: string;
  type: 'expense' | 'income';
  icon?: string;
  color?: string;
  isDefault: boolean;
  userId?: string; // null si es categoría por defecto del sistema
  createdAt: Timestamp;
}

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  categoryId: string;
  type: 'expense' | 'income';
  satisfaction?: number; // 1-5 para gastos
  empresa?: string;
  userId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Habit {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  color?: string;
  isDefault: boolean;
  frequency: number[]; // Array de 0-6 (0=Domingo, 1=Lunes, ...)
  userId: string;
  createdAt: Timestamp;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  date: string; // YYYY-MM-DD format
  habitId?: string; // Si viene de un hábito
  userId: string;
  createdAt: Timestamp;
  completedAt?: Timestamp | null;
}

export interface PasswordEntry {
  id: string;
  userId: string;
  company: string; // e.g. Gmail
  username: string; // e.g. user@gmail.com
  encryptedPassword: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  userId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: Timestamp; // Fecha y hora del evento
  endDate?: Timestamp; // Fecha y hora de fin (opcional)
  isAllDay: boolean;
  time: string; // Hora en formato HH:MM
  location?: string;
  type: 'event' | 'birthday' | 'reminder' | 'appointment' | 'administrative' | 'personal' | 'work' | 'health' | 'social' | 'other';
  isRecurring: boolean;
  recurringPattern?: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'quarterly';
  recurringEndDate?: Timestamp; // Fecha hasta la que se repite (opcional)
  userId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
