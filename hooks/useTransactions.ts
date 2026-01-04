import { useState, useEffect, useCallback } from 'react';
import { TransactionsService } from '../services/transactionsService';
import { Transaction } from '../types';
import { useAuth } from '../contexts/AuthContext';

export const useTransactions = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar transacciones
  const loadTransactions = useCallback(async (limitCount?: number) => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const userTransactions = await TransactionsService.getTransactions(user.uid, limitCount);
      setTransactions(userTransactions);
    } catch (err) {
      setError('Error al cargar transacciones');
      console.error('Error loading transactions:', err);
    } finally {
      setLoading(false);
    }
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
  const createTransaction = useCallback(async (transactionData: Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('Usuario no autenticado');

    try {
      const newTransaction = await TransactionsService.createTransaction(user.uid, transactionData);
      setTransactions(prev => [newTransaction, ...prev]);
      return newTransaction;
    } catch (err) {
      setError('Error al crear transacción');
      throw err;
    }
  }, [user]);

  // Actualizar transacción
  const updateTransaction = useCallback(async (transactionId: string, updates: Partial<Transaction>) => {
    try {
      await TransactionsService.updateTransaction(transactionId, updates);
      setTransactions(prev => prev.map(trans =>
        trans.id === transactionId ? { ...trans, ...updates, updatedAt: new Date() } : trans
      ));
    } catch (err) {
      setError('Error al actualizar transacción');
      throw err;
    }
  }, []);

  // Eliminar transacción
  const deleteTransaction = useCallback(async (transactionId: string) => {
    try {
      await TransactionsService.deleteTransaction(transactionId);
      setTransactions(prev => prev.filter(trans => trans.id !== transactionId));
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

  // Efecto para cargar transacciones cuando el usuario cambia
  useEffect(() => {
    if (user) {
      loadTransactions();
    } else {
      setTransactions([]);
      setLoading(false);
    }
  }, [user, loadTransactions]);

  return {
    transactions,
    loading,
    error,
    loadTransactions,
    getTransactionsByType,
    getMonthlySummary,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    getCategoryStats,
  };
};
