export interface Category {
  id: string;
  name: string;
  type: 'expense' | 'income';
  icon?: string;
  color?: string;
  isDefault: boolean;
  userId?: string; // null si es categoría por defecto del sistema
  createdAt: Date;
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
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Habit {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  color?: string;
  isDefault: boolean;
  userId: string;
  createdAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  date: string; // YYYY-MM-DD format
  habitId?: string; // Si viene de un hábito
  userId: string;
  createdAt: Date;
  completedAt?: Date;
}
