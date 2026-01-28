import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PieChart } from 'react-native-chart-kit';
import { useAuth } from '../contexts/AuthContext';
import { useTransactions } from '../hooks/useTransactions';
import { CategoriesService } from '../services/categoriesService';
import { SpendingDashboardStyles as styles } from '../css/Components/SpendingDashboard.styles';
import { ensureDate } from '../utils/dateUtils';
import { colors } from '../css/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TransactionItem, TransactionEditModal, styles as historyStyles } from './RecentTransactions';
import { Transaction } from '../types';
import { ConfirmModal } from './ConfirmModal';

const { width: screenWidth } = Dimensions.get('window');

type PeriodType = 'month' | 'quarter' | 'year' | 'all';

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

const CATEGORY_COLORS = [
  '#FF6384', '#3B82F6', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#7C4DFF', '#00E676', '#FF5252', '#448AFF',
];

interface SpendingDashboardProps {
  onOpenInvestments?: () => void;
}

export const SpendingDashboard: React.FC<SpendingDashboardProps> = ({ onOpenInvestments }) => {
  const { user } = useAuth();
  const { transactions, loading: transactionsLoading, deleteTransaction } = useTransactions();
  const [loading, setLoading] = useState(true);
  const [periodType, setPeriodType] = useState<PeriodType>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [categoryView, setCategoryView] = useState<'expense' | 'income' | 'investments'>('expense');
  const [summary, setSummary] = useState<PeriodSummary | null>(null);
  const [expenseStats, setExpenseStats] = useState<CategoryStat[]>([]);
  const [incomeStats, setIncomeStats] = useState<CategoryStat[]>([]);
  const [investmentStats, setInvestmentStats] = useState<CategoryStat[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; type: string }[]>([]);
  const [feedback, setFeedback] = useState<{ visible: boolean; title: string; message: string; type: 'success' | 'error' | 'warning' | 'info' | 'delete' } | null>(null);
  const [selectedCategoryHistory, setSelectedCategoryHistory] = useState<{ id: string; name: string } | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [showValues, setShowValues] = useState(true);
  const [transactionToDelete, setTransactionToDelete] = useState<{ id: string; description: string } | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const insets = useSafeAreaInsets();

  // No IA state

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
    } else if (type === 'all') {
      // Para "Todo", usamos un rango muy amplio que cubra todas las transacciones
      startDate = new Date(2000, 0, 1);
      endDate = new Date(2099, 11, 31, 23, 59, 59);
    }
    return { startDate, endDate };
  }, []);

  useEffect(() => {
    if (!user || transactionsLoading) return;
    const calculateDashboard = () => {
      setLoading(true);
      const { startDate, endDate } = getPeriodRange(currentDate, periodType);
      const filtered = transactions.filter(t => {
        const createDate = ensureDate(t.createdAt);
        const liqDate = t.liquidationDate ? ensureDate(t.liquidationDate) : null;
        return (createDate >= startDate && createDate <= endDate) || (liqDate && liqDate >= startDate && liqDate <= endDate);
      });
      const normalIncome = filtered.filter(t => t.type === 'income' && !t.isInvestment).reduce((s, t) => s + t.amount, 0);
      const investmentIncome = filtered.filter(t => t.isInvestment && t.investmentStatus === 'closed' && t.liquidationDate && ensureDate(t.liquidationDate) >= startDate && ensureDate(t.liquidationDate) <= endDate).reduce((s, t) => s + (t.liquidationAmount || 0), 0);
      const totalIncome = normalIncome + investmentIncome;
      const totalExpense = filtered.filter(t => t.type === 'expense' && ensureDate(t.createdAt) >= startDate && ensureDate(t.createdAt) <= endDate).reduce((s, t) => s + t.amount, 0);
      setSummary({ totalIncome, totalExpense, balance: totalIncome - totalExpense, transactionCount: filtered.length });
      const getStats = (type: 'expense' | 'income') => {
        const typeTransClean = type === 'expense' ? filtered.filter(t => t.type === 'expense' && !t.isInvestment) : filtered.filter(t => t.type === 'income');
        const totals = new Map<string, number>();
        typeTransClean.forEach(t => totals.set(t.categoryId, (totals.get(t.categoryId) || 0) + t.amount));
        const totalAmount = Array.from(totals.values()).reduce((a, b) => a + b, 0);
        return Array.from(totals.entries()).map(([categoryId, total], index) => {
          const cat = categories.find(c => c.id === categoryId);
          return { categoryId, categoryName: cat?.name || 'Sin categoría', total, percentage: totalAmount > 0 ? (total / totalAmount) * 100 : 0, color: CATEGORY_COLORS[index % CATEGORY_COLORS.length] };
        }).sort((a, b) => b.total - a.total);
      };
      setExpenseStats(getStats('expense'));
      setIncomeStats(getStats('income'));
      const investmentsCreated = filtered.filter(t => t.isInvestment && ensureDate(t.createdAt) >= startDate && ensureDate(t.createdAt) <= endDate);
      const investmentsLiquidated = filtered.filter(t => t.isInvestment && t.liquidationDate && ensureDate(t.liquidationDate) >= startDate && ensureDate(t.liquidationDate) <= endDate);
      const totalInvBase = investmentsCreated.reduce((s, t) => s + t.amount, 0);
      const totalRecovered = investmentsLiquidated.reduce((s, t) => s + (t.liquidationAmount || 0), 0);
      const totalReturn = investmentsLiquidated.reduce((s, t) => s + (t.investmentReturn || 0), 0);
      setInvestmentStats([
        { categoryId: 'inv_base', categoryName: 'Monto Invertido', total: totalInvBase, percentage: 0, color: colors.accent.primary },
        { categoryId: 'inv_recovered', categoryName: 'Monto Recuperado', total: totalRecovered, percentage: 0, color: colors.status.success },
        { categoryId: 'inv_net', categoryName: 'Resultado Neto', total: totalReturn, percentage: totalInvBase > 0 ? (totalReturn / totalInvBase) * 100 : 0, color: totalReturn >= 0 ? colors.status.success : colors.status.error }
      ]);
      setLoading(false);
    };
    calculateDashboard();
  }, [user, transactions, transactionsLoading, currentDate, periodType, categories, getPeriodRange]);

  useEffect(() => {
    if (!user) return;
    CategoriesService.getCategories(user.uid).then(setCategories).catch(() => {});
  }, [user]);

  const confirmDeleteTransaction = async () => {
    if (!transactionToDelete) return;
    try {
      await deleteTransaction(transactionToDelete.id);
      setTransactionToDelete(null);
      setFeedback({ visible: true, title: 'Éxito', message: 'Transacción eliminada correctamente', type: 'success' });
    } catch {
      setFeedback({ visible: true, title: 'Error', message: 'No se pudo eliminar la transacción', type: 'error' });
    }
  };

  // Removed IA analysis logic

  const getFilteredTransactionsForSelectedCategory = () => {
    if (!selectedCategoryHistory) return [];
    const { startDate, endDate } = getPeriodRange(currentDate, periodType);
    return transactions.filter(t => t.categoryId === selectedCategoryHistory.id && ensureDate(t.createdAt) >= startDate && ensureDate(t.createdAt) <= endDate);
  };

  const groupedHistory = useMemo(() => {
    const { startDate, endDate } = getPeriodRange(currentDate, periodType);
    const filtered = transactions.filter(t => {
      const createDate = ensureDate(t.createdAt);
      const liqDate = t.liquidationDate ? ensureDate(t.liquidationDate) : null;
      if (categoryView === 'investments') return t.isInvestment && ((createDate >= startDate && createDate <= endDate) || (liqDate && liqDate >= startDate && liqDate <= endDate));
      if (categoryView === 'income') return (t.type === 'income' && !t.isInvestment && (createDate >= startDate && createDate <= endDate)) || (t.isInvestment && t.investmentStatus === 'closed' && liqDate && liqDate >= startDate && liqDate <= endDate);
      return t.type === 'expense' && !t.isInvestment && createDate >= startDate && createDate <= endDate;
    });

    const groups: { [key: string]: Transaction[] } = {};
    filtered.forEach(t => {
      const date = t.isInvestment && t.investmentStatus === 'closed' && t.liquidationDate ? ensureDate(t.liquidationDate) : ensureDate(t.createdAt);
      const monthYear = date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
      if (!groups[monthYear]) groups[monthYear] = [];
      groups[monthYear].push(t);
    });
    return Object.entries(groups).sort((a, b) => {
        const dateA = a[1][0].isInvestment && a[1][0].investmentStatus === 'closed' && a[1][0].liquidationDate ? ensureDate(a[1][0].liquidationDate) : ensureDate(a[1][0].createdAt);
        const dateB = b[1][0].isInvestment && b[1][0].investmentStatus === 'closed' && b[1][0].liquidationDate ? ensureDate(b[1][0].liquidationDate) : ensureDate(b[1][0].createdAt);
        return dateB.getTime() - dateA.getTime();
    });
  }, [transactions, currentDate, periodType, categoryView, getPeriodRange]);

  const formatCurrency = (amount: number) => {
    if (!showValues) return '****';
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(amount);
  };

  const activeStats = categoryView === 'expense' ? expenseStats : (categoryView === 'income' ? incomeStats : investmentStats);
  const pieChartData = activeStats.slice(0, 5).map(cat => ({ name: cat.categoryName, amount: cat.total, color: cat.color, legendFontColor: colors.text.primary, legendFontSize: 12 }));

  if (loading || transactionsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent.primary} />
        <Text style={styles.loadingText}>Cargando datos...</Text>
      </View>
    );
  }

  const renderInvestmentRow = (t: Transaction) => {
    const isClosed = t.investmentStatus === 'closed';
    const profit = t.investmentReturn || 0;

    return (
        <View key={t.id} style={[historyStyles.transactionItem, { borderLeftColor: isClosed ? (profit >= 0 ? colors.status.success : colors.status.error) : colors.accent.primary }]}>
            <View style={historyStyles.transactionHeader}>
                <View style={historyStyles.transactionMainInfo}>
                    <Ionicons name={isClosed ? "lock-closed" : "trending-up"} size={16} color={isClosed ? (profit >= 0 ? colors.status.success : colors.status.error) : colors.accent.primary} />
                    <Text style={historyStyles.transactionTitle} numberOfLines={1}>{t.description}</Text>
                </View>
                <View style={historyStyles.transactionMeta}>
                    <Text style={[historyStyles.transactionAmount, { color: isClosed ? (profit >= 0 ? colors.status.success : colors.status.error) : colors.accent.primary }]}>
                        {isClosed ? (profit >= 0 ? '+' : '') + formatCurrency(profit) : formatCurrency(t.amount)}
                    </Text>
                </View>
            </View>
            <View style={{ marginTop: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1, gap: 2 }}>
                    <Text style={{ fontSize: 10, color: colors.text.tertiary, fontWeight: '600' }}>
                        APERTURA: {ensureDate(t.createdAt).toLocaleDateString('es-ES')}
                    </Text>
                    {isClosed && t.liquidationDate && (
                        <Text style={{ fontSize: 10, color: colors.text.tertiary, fontWeight: '600' }}>
                            CIERRE: {ensureDate(t.liquidationDate).toLocaleDateString('es-ES')}
                        </Text>
                    )}
                </View>
                <View style={{ backgroundColor: (isClosed ? (profit >= 0 ? colors.status.success : colors.status.error) : colors.accent.primary) + '15', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: isClosed ? (profit >= 0 ? colors.status.success : colors.status.error) : colors.accent.primary }}>
                        {isClosed ? 'LIQUIDADA' : 'ACTIVA'}
                    </Text>
                </View>
            </View>
        </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.periodSelectorContainer}>
        {(['month', 'quarter', 'year', 'all'] as PeriodType[]).map(type => (
          <TouchableOpacity key={type} style={[styles.periodOption, periodType === type && styles.periodOptionActive]} onPress={() => setPeriodType(type)}>
            <Text style={[styles.periodOptionText, periodType === type && styles.periodOptionTextActive]}>{type === 'month' ? 'Mensual' : type === 'quarter' ? 'Trimestral' : type === 'year' ? 'Anual' : 'Todo'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.monthSelector}>
        {periodType !== 'all' && (
          <TouchableOpacity onPress={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth()-1)))} style={styles.monthArrow}><Ionicons name="chevron-back" size={24} color={colors.text.primary} /></TouchableOpacity>
        )}
        {periodType === 'all' ? (
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <Ionicons name="infinite" size={24} color={colors.accent.primary} />
            <Text style={[styles.monthTitle, { fontSize: 18, color: colors.accent.primary, textAlign: 'center' }]}>
              Histórico Completo
            </Text>
            <Ionicons name="infinite" size={24} color={colors.accent.primary} />
          </View>
        ) : (
          <Text style={styles.monthTitle}>
            {periodType === 'month'
              ? currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
              : periodType === 'quarter'
                ? `T${Math.floor(currentDate.getMonth()/3)+1} ${currentDate.getFullYear()}`
                : currentDate.getFullYear()
            }
          </Text>
        )}
        {periodType !== 'all' && (
          <TouchableOpacity onPress={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth()+1)))} style={styles.monthArrow}><Ionicons name="chevron-forward" size={24} color={colors.text.primary} /></TouchableOpacity>
        )}
      </View>

      {/* IA Analysis button removed */}

      <View style={styles.summaryCard}>
        <TouchableOpacity style={styles.balanceContainer} onPress={() => setShowValues(!showValues)}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Ionicons name={showValues ? "eye-outline" : "eye-off-outline"} size={14} color={colors.text.tertiary} />
            <Text style={[styles.balanceLabel, { marginBottom: 0 }]}>Balance Neto del Periodo</Text>
          </View>
          <Text style={[styles.balanceAmount, (summary?.balance || 0) >= 0 ? styles.balancePositive : styles.balanceNegative]}>{formatCurrency(summary?.balance || 0)}</Text>
        </TouchableOpacity>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}><Text style={styles.summaryItemLabel}>Ingresos</Text><Text style={[styles.summaryItemAmount, styles.incomeAmount]}>{formatCurrency(summary?.totalIncome || 0)}</Text></View>
          <View style={styles.summaryItem}><Text style={styles.summaryItemLabel}>Gastos</Text><Text style={[styles.summaryItemAmount, styles.expenseAmount]}>{formatCurrency(summary?.totalExpense || 0)}</Text></View>
        </View>
      </View>

      <View style={[styles.periodSelectorContainer, { marginBottom: 16 }]}>
        <TouchableOpacity style={[styles.periodOption, categoryView === 'expense' && styles.periodOptionActive]} onPress={() => setCategoryView('expense')}><Text style={[styles.periodOptionText, categoryView === 'expense' && styles.periodOptionTextActive]}>Gastos</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.periodOption, categoryView === 'income' && styles.periodOptionActive]} onPress={() => setCategoryView('income')}><Text style={[styles.periodOptionText, categoryView === 'income' && styles.periodOptionTextActive]}>Ingresos</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.periodOption, categoryView === 'investments' && styles.periodOptionActive]} onPress={() => setCategoryView('investments')}><Text style={[styles.periodOptionText, categoryView === 'investments' && styles.periodOptionTextActive]}>Inversión</Text></TouchableOpacity>
      </View>

      {activeStats.length > 0 ? (
        <View style={styles.chartCard}>
          {categoryView === 'investments' ? (
                <View style={{ alignItems: 'center', width: '100%' }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 200, width: '100%', paddingTop: 20, marginBottom: 10 }}>
                        <View style={{ alignItems: 'center', flex: 1 }}>
                            <Text style={{ fontSize: 10, fontWeight: '700', color: colors.text.tertiary, marginBottom: 8 }}>INVERTIDO</Text>
                            <View style={{ width: 45, height: investmentStats[0].total === 0 ? 4 : (investmentStats[0].total / Math.max(investmentStats[0].total, investmentStats[1].total)) * 150, backgroundColor: colors.accent.primary, borderRadius: 12, shadowColor: colors.accent.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 }} />
                            <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text.primary, marginTop: 10 }}>{formatCurrency(investmentStats[0].total)}</Text>
                        </View>
                        <View style={{ alignItems: 'center', flex: 1 }}>
                            <Text style={{ fontSize: 10, fontWeight: '700', color: colors.text.tertiary, marginBottom: 8 }}>RECUPERADO</Text>
                            <View style={{ width: 45, height: investmentStats[1].total === 0 ? 4 : (investmentStats[1].total / Math.max(investmentStats[0].total, investmentStats[1].total)) * 150, backgroundColor: colors.status.success, borderRadius: 12, shadowColor: colors.status.success, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 }} />
                            <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text.primary, marginTop: 10 }}>{formatCurrency(investmentStats[1].total)}</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={{ marginTop: 20, width: '100%', padding: 18, backgroundColor: colors.background.tertiary, borderRadius: 20, borderWidth: 1, borderColor: colors.border.default }}
                        onPress={onOpenInvestments}
                    >
                         <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={{ fontSize: 11, color: colors.text.tertiary, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>Rendimiento del periodo (Ver Cartera)</Text>
                            <View style={{ backgroundColor: investmentStats[2].color + '20', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                                <Text style={{ fontSize: 10, fontWeight: '800', color: investmentStats[2].color }}>{investmentStats[2].total >= 0 ? 'PROFIT' : 'LOSS'}</Text>
                            </View>
                         </View>
                         <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 12 }}>
                            <Text style={{ fontSize: 28, fontWeight: '900', color: investmentStats[2].color }}>{investmentStats[2].total >= 0 ? '+' : ''}{formatCurrency(investmentStats[2].total)}</Text>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={{ fontSize: 16, fontWeight: '700', color: investmentStats[2].color }}>{investmentStats[2].total >= 0 ? '↑' : '↓'} {Math.abs(investmentStats[2].percentage).toFixed(1)}%</Text>
                                <Text style={{ fontSize: 9, color: colors.text.tertiary, fontWeight: '600' }}>vs Invertido</Text>
                            </View>
                         </View>
                    </TouchableOpacity>
                </View>
          ) : (
            <>
                <View style={styles.pieChartContainer}>
                    <PieChart data={pieChartData} width={screenWidth - 80} height={180} chartConfig={{ backgroundColor: 'transparent', backgroundGradientFrom: colors.background.secondary, backgroundGradientTo: colors.background.secondary, color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})` }} accessor="amount" backgroundColor="transparent" paddingLeft="0" center={[screenWidth / 4.5, 0]} absolute={false} hasLegend={false} />
                </View>
                <Text style={[styles.chartTitle, { alignSelf: 'center', marginBottom: 20, marginTop: -10 }]}>{categoryView === 'expense' ? 'Gastos' : 'Ingresos'} por categoría</Text>
                <View style={styles.legendContainer}>
                    {activeStats.slice(0, 5).map(cat => (
                    <View key={cat.categoryId} style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: cat.color }]} /><Text style={styles.legendText}>{cat.categoryName}</Text><Text style={styles.legendPercent}>{cat.percentage.toFixed(0)}%</Text></View>
                    ))}
                </View>
            </>
          )}
        </View>
      ) : (
        <View style={styles.emptyState}><Ionicons name="pie-chart-outline" size={64} color={colors.text.disabled} /><Text style={styles.emptyStateText}>Sin datos</Text><Text style={styles.emptyStateSubtext}>No hay {categoryView === 'expense' ? 'gastos' : categoryView === 'income' ? 'ingresos' : 'inversiones'} registrados en este periodo</Text></View>
      )}

      {activeStats.length > 0 && (
        <View style={styles.topCategoriesCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <Text style={[styles.topCategoriesTitle, { marginBottom: 0 }]}>Top {categoryView === 'expense' ? 'Categorías (Gastos)' : (categoryView === 'income' ? 'Fuentes (Ingresos)' : 'Balance de inversiones')}</Text>
            <TouchableOpacity style={{ backgroundColor: colors.accent.primary + '20', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }} onPress={() => setShowHistoryModal(true)}>
                <Ionicons name="list" size={14} color={colors.accent.primary} />
                <Text style={{ fontSize: 12, fontWeight: '800', color: colors.accent.primary }}>Historial</Text>
            </TouchableOpacity>
          </View>
          {activeStats.slice(0, 5).map(cat => (
            <View key={cat.categoryId} style={styles.categoryItem}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryName}>{cat.categoryName}</Text>
                <Text style={styles.categoryAmount}>{formatCurrency(cat.total)}</Text>
                <Text style={styles.categoryPercent}>{cat.percentage.toFixed(1)}%</Text>
              </View>
              <View style={styles.progressBarContainer}><View style={[styles.progressBar, { width: `${cat.percentage}%`, backgroundColor: cat.color }]} /></View>
            </View>
          ))}
        </View>
      )}

      {/* Modal Historial de Movimientos por Meses */}
      <Modal visible={showHistoryModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowHistoryModal(false)}>
        <View style={[historyStyles.modalContainer, { paddingTop: insets.top }]}>
          <View style={historyStyles.modalHeader}>
            <TouchableOpacity onPress={() => setShowHistoryModal(false)} style={historyStyles.closeBtn}><Ionicons name="close" size={24} color={colors.text.primary} /></TouchableOpacity>
            <Text style={historyStyles.modalTitle}>Historial de Movimientos</Text>
            <View style={{ width: 40 }} />
          </View>
          <ScrollView contentContainerStyle={historyStyles.modalScrollContent} showsVerticalScrollIndicator={false}>
            {groupedHistory.map(([month, transList]) => (
                <View key={month} style={{ marginBottom: 32 }}>
                    <Text style={{ fontSize: 12, fontWeight: '800', color: colors.accent.primary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.border.default, paddingBottom: 8 }}>{month}</Text>
                    {transList.map(t => {
                        if (t.isInvestment) return renderInvestmentRow(t);
                        return <TransactionItem key={t.id} transaction={t} categories={categories} />;
                    })}
                </View>
            ))}
            {groupedHistory.length === 0 && (
                <View style={{ alignItems: 'center', marginTop: 60 }}>
                    <Ionicons name="document-text-outline" size={64} color={colors.text.disabled} />
                    <Text style={{ textAlign: 'center', color: colors.text.secondary, marginTop: 16, fontSize: 16 }}>No hay movimientos para mostrar en este periodo.</Text>
                </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Modal Historial de Categoría (Fallback for sub-items if needed) */}
      <Modal visible={!!selectedCategoryHistory} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelectedCategoryHistory(null)}>
        <View style={[historyStyles.modalContainer, { paddingTop: insets.top }]}>
          <View style={historyStyles.modalHeader}>
            <TouchableOpacity onPress={() => setSelectedCategoryHistory(null)} style={historyStyles.closeBtn}><Ionicons name="close" size={24} color={colors.text.primary} /></TouchableOpacity>
            <Text style={historyStyles.modalTitle}>Historial: {selectedCategoryHistory?.name}</Text>
            <View style={{ width: 40 }} />
          </View>
          <ScrollView contentContainerStyle={historyStyles.modalScrollContent} showsVerticalScrollIndicator={false}>
            {getFilteredTransactionsForSelectedCategory().map(t => (
              <TransactionItem key={t.id} transaction={t} showActions onEdit={setEditingTransaction} onDelete={(id, description) => setTransactionToDelete({ id, description })} categories={categories} />
            ))}
          </ScrollView>
        </View>
      </Modal>



      {/* Modal Análisis Financiero IA removed */}

      <TransactionEditModal visible={!!editingTransaction} transaction={editingTransaction} categories={categories} onClose={() => setEditingTransaction(null)} />
      <ConfirmModal visible={!!transactionToDelete} title="Eliminar Transacción" message={`¿Estás seguro de que quieres eliminar esta transacción?`} onConfirm={confirmDeleteTransaction} onCancel={() => setTransactionToDelete(null)} confirmText="Eliminar" type="delete" />
      <ConfirmModal visible={!!feedback} title={feedback?.title || ''} message={feedback?.message || ''} type={feedback?.type as 'success' | 'error' | 'warning' | 'info' | 'delete'} onConfirm={() => setFeedback(null)} />
    </View>
  );
};
