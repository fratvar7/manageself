import { useState, useEffect, useCallback } from 'react';
import { TransactionsService } from '../services/transactionsService';
import { Transaction } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { onSnapshot, query, collection, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

export const useTransactions = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Efecto para escuchar transacciones en tiempo real
  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userTransactions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transaction[];
      setTransactions(userTransactions);
      setLoading(false);
    }, (err) => {
      console.error('Error in transactions snapshot:', err);
      setError('Error al conectar con el historial');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Obtener transacciones por tipo
  const getTransactionsByType = useCallback(async (type: 'expense' | 'income', limitCount?: number) => {
    if (!user) return [];
    try {
      return await TransactionsService.getTransactionsByType(user.uid, type, limitCount);
    } catch (err) {
      setError('Error al obtener transacciones por tipo');
      throw err;
    }
  }, [user]);

  // Obtener resumen mensual
  const getMonthlySummary = useCallback(async (year: number, month: number) => {
    if (!user) throw new Error('Usuario no autenticado');
    try {
      return await TransactionsService.getMonthlySummary(user.uid, year, month);
    } catch (err) {
      setError('Error al obtener resumen mensual');
      throw err;
    }
  }, [user]);

  // Crear nueva transacción
  const createTransaction = useCallback(async (transactionData: Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'> & { createdAt?: Timestamp, updatedAt?: Timestamp }) => {
    if (!user) throw new Error('Usuario no autenticado');
    try {
      return await TransactionsService.createTransaction(user.uid, transactionData);
    } catch (err) {
      setError('Error al crear transacción');
      throw err;
    }
  }, [user]);

  // Actualizar transacción
  const updateTransaction = useCallback(async (transactionId: string, updates: Partial<Transaction>) => {
    try {
      await TransactionsService.updateTransaction(transactionId, updates);
    } catch (err) {
      setError('Error al actualizar transacción');
      throw err;
    }
  }, []);

  // Eliminar transacción
  const deleteTransaction = useCallback(async (transactionId: string) => {
    try {
      await TransactionsService.deleteTransaction(transactionId);
    } catch (err) {
      setError('Error al eliminar transacción');
      throw err;
    }
  }, []);

  // Obtener estadísticas por categoría
  const getCategoryStats = useCallback(async (type: 'expense' | 'income') => {
    if (!user) return [];
    try {
      return await TransactionsService.getCategoryStats(user.uid, type);
    } catch (err) {
      setError('Error al obtener estadísticas por categoría');
      throw err;
    }
  }, [user]);

  return {
    transactions,
    loading,
    error,
    getTransactionsByType,
    getMonthlySummary,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    getCategoryStats,
  };
};
