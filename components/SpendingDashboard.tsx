import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PieChart } from 'react-native-chart-kit';
import { useAuth } from '../contexts/AuthContext';
import { useTransactions } from '../hooks/useTransactions';
import { CategoriesService } from '../services/categoriesService';
import { SpendingDashboardStyles as styles } from '../css/Components/SpendingDashboard.styles';
import { colors } from '../css/colors';
import { Modal, Alert, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TransactionItem, TransactionEditModal, styles as historyStyles } from './RecentTransactions';
import { Transaction } from '../types';

const { width: screenWidth } = Dimensions.get('window');

type PeriodType = 'month' | 'quarter' | 'year';

interface CategoryStat {
  categoryId: string;
  categoryName: string;
  total: number;
  percentage: number;
  color: string;
}

interface PeriodSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactionCount: number;
}

// Colores para las categorías
const CATEGORY_COLORS = [
  '#FF6384', // Rosa
  '#3B82F6', // Azul
  '#FFCE56', // Amarillo
  '#4BC0C0', // Turquesa
  '#9966FF', // Púrpura
  '#FF9F40', // Naranja
  '#7C4DFF', // Violeta
  '#00E676', // Verde
  '#FF5252', // Rojo
  '#448AFF', // Azul claro
];

export const SpendingDashboard: React.FC = () => {
  const { user } = useAuth();
  const { transactions, loading: transactionsLoading } = useTransactions();
  const [loading, setLoading] = useState(true);

  // Estado para fechas y periodo
  const [periodType, setPeriodType] = useState<PeriodType>('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Estado para vista de categorías (Gastos vs Ingresos)
  const [categoryView, setCategoryView] = useState<'expense' | 'income'>('expense');

  const [summary, setSummary] = useState<PeriodSummary | null>(null);
  const [expenseStats, setExpenseStats] = useState<CategoryStat[]>([]);
  const [incomeStats, setIncomeStats] = useState<CategoryStat[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; type: string }[]>([]);

  // Estado para el modal de historial por categoría
  const [selectedCategoryHistory, setSelectedCategoryHistory] = useState<{ id: string; name: string } | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const insets = useSafeAreaInsets();
  const { deleteTransaction } = useTransactions();

  // Helpers para calcular rangos
  const getPeriodRange = useCallback((date: Date, type: PeriodType) => {
    let startDate = new Date(date);
    let endDate = new Date(date);

    if (type === 'month') {
      startDate = new Date(date.getFullYear(), date.getMonth(), 1);
      endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
    } else if (type === 'quarter') {
      const quarter = Math.floor(date.getMonth() / 3);
      startDate = new Date(date.getFullYear(), quarter * 3, 1);
      endDate = new Date(date.getFullYear(), (quarter + 1) * 3, 0, 23, 59, 59);
    } else if (type === 'year') {
      startDate = new Date(date.getFullYear(), 0, 1);
      endDate = new Date(date.getFullYear(), 11, 31, 23, 59, 59);
    }

    return { startDate, endDate };
  }, []);

  // Cargar categorías una vez
  useEffect(() => {
    if (user) {
      CategoriesService.getCategories(user.uid).then(setCategories);
    }
  }, [user]);

  // Recalcular todo cuando cambian las transacciones o el periodo
  useEffect(() => {
    if (!user || transactionsLoading) return;

    const calculateDashboard = () => {
      setLoading(true);
      const { startDate, endDate } = getPeriodRange(currentDate, periodType);

      // Filtrar transacciones por periodo
      const filtered = transactions.filter(t => {
        const d = t.createdAt.toDate();
        return d >= startDate && d <= endDate;
      });

      // Calcular Resumen
      const totalIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const totalExpense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      setSummary({
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
        transactionCount: filtered.length
      });

      // Calcular Estadísticas por Categoría
      const getStats = (type: 'expense' | 'income') => {
        const typeTrans = filtered.filter(t => t.type === type);
        const totals = new Map<string, number>();
        typeTrans.forEach(t => totals.set(t.categoryId, (totals.get(t.categoryId) || 0) + t.amount));

        const totalAmount = Array.from(totals.values()).reduce((a, b) => a + b, 0);

        return Array.from(totals.entries())
          .map(([categoryId, total], index) => {
            const cat = categories.find(c => c.id === categoryId);
            return {
              categoryId,
              categoryName: cat?.name || 'Sin categoría',
              total,
              percentage: totalAmount > 0 ? (total / totalAmount) * 100 : 0,
              color: CATEGORY_COLORS[index % CATEGORY_COLORS.length]
            };
          })
          .sort((a, b) => b.total - a.total);
      };

      setExpenseStats(getStats('expense'));
      setIncomeStats(getStats('income'));
      setLoading(false);
    };

    calculateDashboard();
  }, [user, transactions, transactionsLoading, currentDate, periodType, categories, getPeriodRange]);

  const handleDelete = (id: string, description: string) => {
    Alert.alert(
      'Eliminar transacción',
      `¿Estás seguro de que quieres eliminar "${description}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          onPress: async () => {
            try {
              await deleteTransaction(id);
            } catch {
              Alert.alert('Error', 'No se pudo eliminar la transacción');
            }
          },
          style: 'destructive'
        }
      ]
    );
  };

  const getFilteredTransactionsForSelectedCategory = () => {
    if (!selectedCategoryHistory) return [];
    const { startDate, endDate } = getPeriodRange(currentDate, periodType);
    return transactions.filter(t =>
      t.categoryId === selectedCategoryHistory.id &&
      t.createdAt.toDate() >= startDate &&
      t.createdAt.toDate() <= endDate
    );
  };


  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);

    if (periodType === 'month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else if (periodType === 'quarter') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 3 : -3));
    } else if (periodType === 'year') {
      newDate.setFullYear(newDate.getFullYear() + (direction === 'next' ? 1 : -1));
    }

    setCurrentDate(newDate);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getPeriodLabel = () => {
    if (periodType === 'month') {
      return currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    } else if (periodType === 'quarter') {
      const quarter = Math.floor(currentDate.getMonth() / 3) + 1;
      return `T${quarter} ${currentDate.getFullYear()}`;
    } else {
      return currentDate.getFullYear().toString();
    }
  };

  // Determinar qué stats mostrar
  const activeStats = categoryView === 'expense' ? expenseStats : incomeStats;

  const pieChartData = activeStats.slice(0, 5).map(cat => ({
    name: cat.categoryName,
    amount: cat.total,
    color: cat.color,
    legendFontColor: colors.text.secondary,
    legendFontSize: 11,
  }));

  if (loading && !summary) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.button.primary} />
        <Text style={styles.loadingText}>Cargando estadísticas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Selector de Periodo */}
      <View style={styles.periodSelectorContainer}>
        <TouchableOpacity
          style={[styles.periodOption, periodType === 'month' && styles.periodOptionActive]}
          onPress={() => setPeriodType('month')}
        >
          <Text style={[styles.periodOptionText, periodType === 'month' && styles.periodOptionTextActive]}>
            Mes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.periodOption, periodType === 'quarter' && styles.periodOptionActive]}
          onPress={() => setPeriodType('quarter')}
        >
          <Text style={[styles.periodOptionText, periodType === 'quarter' && styles.periodOptionTextActive]}>
            Trimestre
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.periodOption, periodType === 'year' && styles.periodOptionActive]}
          onPress={() => setPeriodType('year')}
        >
          <Text style={[styles.periodOptionText, periodType === 'year' && styles.periodOptionTextActive]}>
            Año
          </Text>
        </TouchableOpacity>
      </View>

      {/* Navegación de Fecha */}
      <View style={styles.monthSelector}>
        <TouchableOpacity
          style={styles.monthArrow}
          onPress={() => navigateDate('prev')}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.monthTitle}>
          {getPeriodLabel()}
        </Text>
        <TouchableOpacity
          style={styles.monthArrow}
          onPress={() => navigateDate('next')}
        >
          <Ionicons name="chevron-forward" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Tarjeta de resumen */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Resumen {periodType === 'quarter' ? 'trimestral' : periodType === 'year' ? 'anual' : 'mensual'}</Text>

        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>Balance</Text>
          <Text style={[
            styles.balanceAmount,
            summary && summary.balance >= 0 ? styles.balancePositive : styles.balanceNegative
          ]}>
            {formatCurrency(summary?.balance || 0)}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryItemLabel}>Ingresos</Text>
            <Text style={[styles.summaryItemAmount, styles.incomeAmount]}>
              {formatCurrency(summary?.totalIncome || 0)}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryItemLabel}>Gastos</Text>
            <Text style={[styles.summaryItemAmount, styles.expenseAmount]}>
              {formatCurrency(summary?.totalExpense || 0)}
            </Text>
          </View>
        </View>
      </View>

      {/* Selector de Vista (Gastos / Ingresos) - Reutilizando estilos de periodSelector pero inline o adaptados */}
      <View style={[styles.periodSelectorContainer, { marginBottom: 16 }]}>
        <TouchableOpacity
          style={[styles.periodOption, categoryView === 'expense' && styles.periodOptionActive]}
          onPress={() => setCategoryView('expense')}
        >
          <Text style={[styles.periodOptionText, categoryView === 'expense' && styles.periodOptionTextActive]}>
            Gastos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.periodOption, categoryView === 'income' && styles.periodOptionActive]}
          onPress={() => setCategoryView('income')}
        >
          <Text style={[styles.periodOptionText, categoryView === 'income' && styles.periodOptionTextActive]}>
            Ingresos
          </Text>
        </TouchableOpacity>
      </View>

      {/* Gráfico de pastel */}
      {activeStats.length > 0 ? (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>{categoryView === 'expense' ? 'Gastos' : 'Ingresos'} por categoría</Text>

          <View style={styles.pieChartContainer}>
            <PieChart
              data={pieChartData}
              width={screenWidth - 80}
              height={180}
              chartConfig={{
                backgroundColor: 'transparent',
                backgroundGradientFrom: colors.background.secondary,
                backgroundGradientTo: colors.background.secondary,
                color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              }}
              accessor="amount"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute={false}
              hasLegend={false}
            />
          </View>

          {/* Leyenda personalizada */}
          <View style={styles.legendContainer}>
            {activeStats.slice(0, 5).map(cat => (
              <View key={cat.categoryId} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: cat.color }]} />
                <Text style={styles.legendText}>{cat.categoryName}</Text>
                <Text style={styles.legendPercent}>{cat.percentage.toFixed(0)}%</Text>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="pie-chart-outline" size={64} color={colors.text.disabled} />
          <Text style={styles.emptyStateText}>Sin datos</Text>
          <Text style={styles.emptyStateSubtext}>
            No hay {categoryView === 'expense' ? 'gastos' : 'ingresos'} registrados en este periodo
          </Text>
        </View>
      )}

      {/* Top categorías */}
      {activeStats.length > 0 && (
        <View style={styles.topCategoriesCard}>
          <Text style={styles.topCategoriesTitle}>Top {categoryView === 'expense' ? 'Categorías (Gastos)' : 'Fuentes (Ingresos)'}</Text>

          {activeStats.slice(0, 5).map(cat => (
            <TouchableOpacity
              key={cat.categoryId}
              style={styles.categoryItem}
              onPress={() => setSelectedCategoryHistory({ id: cat.categoryId, name: cat.categoryName })}
            >
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryName}>{cat.categoryName}</Text>
                <Text style={styles.categoryAmount}>{formatCurrency(cat.total)}</Text>
                <Text style={styles.categoryPercent}>{cat.percentage.toFixed(1)}%</Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: `${cat.percentage}%`,
                      backgroundColor: cat.color,
                    }
                  ]}
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Modal Historial de Categoría */}
      <Modal
        visible={!!selectedCategoryHistory}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedCategoryHistory(null)}
      >
        <View style={[historyStyles.modalContainer, { paddingTop: insets.top }]}>
          <View style={historyStyles.modalHeader}>
            <TouchableOpacity onPress={() => setSelectedCategoryHistory(null)} style={historyStyles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={historyStyles.modalTitle}>Historial: {selectedCategoryHistory?.name}</Text>
            <View style={{ width: 40 }} />
          </View>
          <ScrollView contentContainerStyle={historyStyles.modalScrollContent} showsVerticalScrollIndicator={false}>
            {getFilteredTransactionsForSelectedCategory().map(t => (
              <TransactionItem
                key={t.id}
                transaction={t}
                showActions
                onEdit={setEditingTransaction}
                onDelete={handleDelete}
                categories={categories}
              />
            ))}
            {getFilteredTransactionsForSelectedCategory().length === 0 && (
              <Text style={{ textAlign: 'center', color: colors.text.secondary, marginTop: 40 }}>
                No hay transacciones para esta categoría en este periodo.
              </Text>
            )}
          </ScrollView>
        </View>
      </Modal>

      <TransactionEditModal
        visible={!!editingTransaction}
        transaction={editingTransaction}
        categories={categories}
        onClose={() => setEditingTransaction(null)}
      />
    </View>
  );
};
