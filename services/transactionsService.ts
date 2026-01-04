import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Transaction } from '../types';

const TRANSACTIONS_COLLECTION = 'transactions';

export class TransactionsService {
  // Crear nueva transacción
  static async createTransaction(userId: string, transaction: Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
    try {
      const now = new Date();
      const docRef = await addDoc(collection(db, TRANSACTIONS_COLLECTION), {
        ...transaction,
        userId,
        createdAt: now,
        updatedAt: now,
      });

      const newDoc = await getDoc(docRef);
      return {
        id: docRef.id,
        ...newDoc.data(),
        createdAt: (newDoc.data()!.createdAt as Timestamp).toDate(),
        updatedAt: (newDoc.data()!.updatedAt as Timestamp).toDate(),
      } as Transaction;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }

  // Obtener todas las transacciones de un usuario
  static async getTransactions(userId: string, limitCount?: number): Promise<Transaction[]> {
    try {
      let transactionsQuery = query(
        collection(db, TRANSACTIONS_COLLECTION),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      if (limitCount) {
        transactionsQuery = query(transactionsQuery, limit(limitCount));
      }

      const snapshot = await getDocs(transactionsQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp).toDate(),
        updatedAt: (doc.data().updatedAt as Timestamp).toDate(),
      })) as Transaction[];
    } catch (error) {
      console.error('Error getting transactions:', error);
      throw error;
    }
  }

  // Obtener transacciones por tipo
  static async getTransactionsByType(userId: string, type: 'expense' | 'income', limitCount?: number): Promise<Transaction[]> {
    try {
      let transactionsQuery = query(
        collection(db, TRANSACTIONS_COLLECTION),
        where('userId', '==', userId),
        where('type', '==', type),
        orderBy('createdAt', 'desc')
      );

      if (limitCount) {
        transactionsQuery = query(transactionsQuery, limit(limitCount));
      }

      const snapshot = await getDocs(transactionsQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp).toDate(),
        updatedAt: (doc.data().updatedAt as Timestamp).toDate(),
      })) as Transaction[];
    } catch (error) {
      console.error('Error getting transactions by type:', error);
      throw error;
    }
  }

  // Obtener transacciones por categoría
  static async getTransactionsByCategory(userId: string, categoryId: string): Promise<Transaction[]> {
    try {
      const transactionsQuery = query(
        collection(db, TRANSACTIONS_COLLECTION),
        where('userId', '==', userId),
        where('categoryId', '==', categoryId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(transactionsQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp).toDate(),
        updatedAt: (doc.data().updatedAt as Timestamp).toDate(),
      })) as Transaction[];
    } catch (error) {
      console.error('Error getting transactions by category:', error);
      throw error;
    }
  }

  // Obtener transacciones por rango de fechas
  static async getTransactionsByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Transaction[]> {
    try {
      const transactionsQuery = query(
        collection(db, TRANSACTIONS_COLLECTION),
        where('userId', '==', userId),
        where('createdAt', '>=', Timestamp.fromDate(startDate)),
        where('createdAt', '<=', Timestamp.fromDate(endDate)),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(transactionsQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp).toDate(),
        updatedAt: (doc.data().updatedAt as Timestamp).toDate(),
      })) as Transaction[];
    } catch (error) {
      console.error('Error getting transactions by date range:', error);
      throw error;
    }
  }

  // Obtener resumen mensual
  static async getMonthlySummary(userId: string, year: number, month: number): Promise<{
    totalIncome: number;
    totalExpense: number;
    balance: number;
    transactionCount: number;
  }> {
    try {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      const transactions = await this.getTransactionsByDateRange(userId, startDate, endDate);

      const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
        transactionCount: transactions.length,
      };
    } catch (error) {
      console.error('Error getting monthly summary:', error);
      throw error;
    }
  }

  // Actualizar transacción
  static async updateTransaction(transactionId: string, updates: Partial<Transaction>): Promise<void> {
    try {
      const transactionRef = doc(db, TRANSACTIONS_COLLECTION, transactionId);
      await updateDoc(transactionRef, {
        ...updates,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  }

  // Eliminar transacción
  static async deleteTransaction(transactionId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, TRANSACTIONS_COLLECTION, transactionId));
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  }

  // Obtener estadísticas por categoría
  static async getCategoryStats(userId: string, type: 'expense' | 'income'): Promise<Array<{
    categoryId: string;
    categoryName: string;
    total: number;
    count: number;
    percentage: number;
  }>> {
    try {
      const transactions = await this.getTransactionsByType(userId, type);

      // Agrupar por categoría
      const categoryTotals = new Map<string, { total: number; count: number }>();

      transactions.forEach(transaction => {
        const current = categoryTotals.get(transaction.categoryId) || { total: 0, count: 0 };
        categoryTotals.set(transaction.categoryId, {
          total: current.total + transaction.amount,
          count: current.count + 1,
        });
      });

      const totalAmount = Array.from(categoryTotals.values()).reduce((sum, cat) => sum + cat.total, 0);

      // Convertir a array y calcular porcentajes
      return Array.from(categoryTotals.entries()).map(([categoryId, data]) => ({
        categoryId,
        categoryName: '', // Se llenará después con el nombre de la categoría
        total: data.total,
        count: data.count,
        percentage: totalAmount > 0 ? (data.total / totalAmount) * 100 : 0,
      }));
    } catch (error) {
      console.error('Error getting category stats:', error);
      throw error;
    }
  }
}
