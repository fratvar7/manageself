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
  isInvestment?: boolean;
  investmentStatus?: 'active' | 'closed';
  investmentReturn?: number;
  relatedTransactionId?: string;
  purchasePrice?: number;
  notes?: string;
  liquidationAmount?: number;
  liquidationDate?: Timestamp;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  age?: number;
  weight?: number; // kg
  height?: number; // cm
  country?: string;
  city?: string;
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  gender?: 'male' | 'female' | 'other';
  bodyFat?: number;
  muscleMass?: number;
  waist?: number;
  arm?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface UserMetricLog {
  id: string;
  userId: string;
  age?: number;
  weight?: number;
  height?: number;
  country?: string;
  city?: string;
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  gender?: 'male' | 'female' | 'other';
  bodyFat?: number;
  muscleMass?: number;
  waist?: number;
  arm?: number;
  date: Timestamp;
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
  time?: string; // Formato HH:MM
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  failed?: boolean;
  failReason?: string | null;
  date: string; // YYYY-MM-DD format
  habitId?: string; // Si viene de un hábito
  userId: string;
  createdAt: Timestamp;
  completedAt?: Timestamp | null;
  order?: number;
  time?: string; // Formato HH:MM
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  failed?: boolean;
  deadline: Timestamp;
  userId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp | null;
  order?: number;
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

export interface Workout {
  id: string;
  userId: string;
  name: string;      // e.g. "Empuje A", "Pierna Pesado"
  description?: string;
  muscleGroups: string[]; // e.g. ["Pectoral", "Triceps", "Hombro"]
  exercises: WorkoutExercise[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastPerformedAt?: Timestamp;
  duration?: number; // Duración en segundos (para registros realizados)
}

export interface WorkoutExercise {
  id: string;
  libraryExerciseId: string; // ID de la biblioteca
  name: string;      // ej. "Press de Banca" (puede ser editado)
  muscleGroup: string;
  type: 'strength' | 'bodyweight' | 'cardio';
  notes?: string;
  sets: WorkoutSet[];
  order: number;      // Orden en la rutina
  supersetId?: string; // ID para agrupar en biseries/triseries
}

export interface WorkoutSet {
  id: string;
  reps: number;
  weight: number;    // en kg o lbs
  restTime: number;  // en segundos
  completed: boolean;
  intensity?: number; // 1-10 (RPE)
}

export interface LibraryExercise {
  id: string;
  name: string;
  muscleGroup: string;
  alternateNames?: string[];
  description?: string;
  equipment?: string;
  userId?: string; // null para base del sistema, uid para personalizados
}

export interface WorkoutLog {
  id: string;
  userId: string;
  workoutId?: string; // Si se basó en una rutina existente
  name: string;       // Nombre de la rutina o "Entrenamiento Libre"
  date: Timestamp;
  duration?: number;  // Duración en segundos
  exercises: WorkoutLogExercise[];
}

export interface WorkoutLogExercise {
  id: string;
  name: string;
  muscleGroup: string;
  supersetId?: string;
  sets: WorkoutLogSet[];
}

export interface WorkoutLogSet {
  id: string;
  reps: number;
  weight: number;
  completed: boolean;
}

export interface JournalEntry {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  title?: string;
  content: string;
  goodThings?: string;
  toImprove?: string;
  mood?: number; // 1-5
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
