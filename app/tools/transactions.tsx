import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { TransactionsService } from '../../services/transactionsService';
import { CategoriesService } from '../../services/categoriesService';
import { Transaction } from '../../types';
import { colors } from '../../css/colors';
import { Svg, Rect, G, Text as SvgText, Path } from 'react-native-svg';

const { width: screenWidth } = Dimensions.get('window');

export default function TransactionsScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [todayExpenses, setTodayExpenses] = useState(0);
  const [todayIncome, setTodayIncome] = useState(0);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [rawData, setRawData] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; type: string }[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'quarter' | 'semester' | 'year'>('month');
  const [navigationKey, setNavigationKey] = useState(0);

  const anim = useRef(new Animated.Value(0));

  type CategoryBreakdown = {
    categoryId: string;
    categoryName: string;
    amount: number;
    percent?: number;
  };

  const formatNumber = (n: number) => {
    if (typeof n !== 'number') n = Number(n) || 0;
    return n.toFixed(2).replace('.', ',');
  };

  const formatCurrency = (amount: number) => {
    return `€${formatNumber(Math.abs(amount))}`;
  };

  const getContrastTextColor = (hexBg: string) => {
    try {
      const hex = hexBg.replace('#', '');
      const bigint = parseInt(hex.length === 3 ? hex.split('').map((c: string) => c + c).join('') : hex, 16);
      const r = (bigint >> 16) & 255;
      const g = (bigint >> 8) & 255;
      const b = bigint & 255;
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 1000;
      return luminance > 0.5 ? '#000' : '#fff';
    } catch (e) {
      return '#000';
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const transactions = await TransactionsService.getTransactions(user.uid);
        const categoriesData = await CategoriesService.getCategories(user.uid);

        setRawData(transactions);
        setCategories(categoriesData);

        // Datos de hoy
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
        const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

        const todayTransactions = transactions.filter(t => {
          if (!t.createdAt) return false;
          const date = t.createdAt.toDate();
          return date >= todayStart && date <= todayEnd;
        });

        const todayExp = todayTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + (typeof t.amount === 'number' ? t.amount : parseFloat(t.amount) || 0), 0);
        const todayInc = todayTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + (typeof t.amount === 'number' ? t.amount : parseFloat(t.amount) || 0), 0);

        setTodayExpenses(todayExp);
        setTodayIncome(todayInc);
        setCurrentBalance(todayInc - todayExp);

        // Datos del mes actual
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 0, 0, -1);

        const monthTransactions = transactions.filter(t => {
          if (!t.createdAt) return false;
          const date = t.createdAt.toDate();
          return date >= monthStart && date < monthEnd;
        });

        const monthExp = monthTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + (typeof t.amount === 'number' ? t.amount : parseFloat(t.amount) || 0), 0);
        const monthInc = monthTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + (typeof t.amount === 'number' ? t.amount : parseFloat(t.amount) || 0), 0);

        setMonthlyExpenses(monthExp);
        setMonthlyIncome(monthInc);
      } catch (e) {
        // Error silencioso
      } finally {
        setLoading(false);
      }
    })();
  }, [user, selectedPeriod, navigationKey]);

  useEffect(() => {
    if (!loading) {
      anim.current.setValue(0);
      Animated.timing(anim.current, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }).start();
    }
  }, [loading]);

  const getPeriodData = () => {
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();

    switch (selectedPeriod) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        break;
      case 'week':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay(), 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + 6, 23, 59, 59, 999);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 0, 0, -1);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        endDate = new Date((quarter + 1) * 3, 1, 0, 0, -1);
        break;
      case 'semester':
        const semester = now.getMonth() < 6 ? 0 : 6;
        startDate = new Date(now.getFullYear(), semester, 1);
        endDate = new Date(semester === 0 ? 6 : 12, 1, 0, 0, -1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear() + 1, 0, 1, 0, 0, -1);
        break;
    }

    return { startDate, endDate };
  };

  const getPeriodLabel = () => {
    const { startDate, endDate } = getPeriodData();
    const monthsES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    if (selectedPeriod === 'today') return 'Hoy';
    if (selectedPeriod === 'week') return 'Esta Semana';
    if (selectedPeriod === 'month') return monthsES[startDate.getMonth()];
    if (selectedPeriod === 'quarter') {
      const quarter = Math.floor(startDate.getMonth() / 3);
      return `Q${quarter + 1} ${startDate.getFullYear()}`;
    }
    if (selectedPeriod === 'semester') {
      const semester = startDate.getMonth() < 6 ? 1 : 2;
      return `${semester}S ${startDate.getFullYear()}`;
    }
    return String(startDate.getFullYear());
  };

  const getPeriodTransactions = () => {
    const { startDate, endDate } = getPeriodData();
    return rawData.filter(t => {
      if (!t.createdAt) return false;
      const date = t.createdAt.toDate();
      return date >= startDate && date <= endDate;
    });
  };

  const calculatePeriodStats = () => {
    const periodTransactions = getPeriodTransactions();
    let expenses = 0;
    let income = 0;

    periodTransactions.forEach((row) => {
      const monto = typeof row.amount === 'number' ? row.amount : parseFloat(row.amount) || 0;
      if (row.type === 'expense') expenses += monto;
      else if (row.type === 'income') income += monto;
    });

    return { expenses, income, balance: income - expenses };
  };

  const periodStats = calculatePeriodStats();
  const { expenses: periodExpenses, income: periodIncome, balance: periodBalance } = periodStats;

  const computeCategoryBreakdown = (type: 'income' | 'expense'): { list: CategoryBreakdown[]; totalForType: number } => {
    const periodTransactions = getPeriodTransactions();
    const byCat: { [key: string]: number } = {};

    periodTransactions.forEach((row) => {
      if (row.type !== type) return;
      const monto = typeof row.amount === 'number' ? row.amount : parseFloat(row.amount) || 0;
      const cat = row.categoryId || 'Sin categoría';
      byCat[cat] = (byCat[cat] || 0) + monto;
    });

    const arr: CategoryBreakdown[] = Object.keys(byCat).map((k) => ({
      categoryId: k,
      categoryName: categories.find(c => c.id === k)?.name || k,
      amount: byCat[k]
    })).filter((r) => r.amount > 0);

    const totalForType = arr.reduce((s, r) => s + r.amount, 0);
    arr.forEach((r) => { r.percent = totalForType > 0 ? r.amount / totalForType : 0; });
    arr.sort((a, b) => b.amount - a.amount);

    return { list: arr, totalForType };
  };

  const categoryPalette = {
    income: ['#2e7d32', '#43a047', '#66bb6a', '#9ccc65', '#a5d6a7', '#c8e6c9'],
    expense: ['#c62828', '#e53935', '#ef5350', '#ef9a9a', '#f48fb1', '#ffcccb'],
  };

  // Componente de gráfico circular bancario
  const BankPieChart = ({ data, title, pieColors, size = 120 }: { data: CategoryBreakdown[], title: string, pieColors: string[], size?: number }) => {
    const radius = size / 2;
    const centerX = size / 2;
    const centerY = size / 2;

    let currentAngle = -Math.PI / 2;
    const total = data.reduce((sum, item) => sum + item.amount, 0);

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>{title}</Text>
        <Svg height={size} width={size}>
          {data.map((item, index) => {
            const percentage = item.amount / total;
            const angle = percentage * 2 * Math.PI;
            const endAngle = currentAngle + angle;

            const x1 = centerX + Math.cos(currentAngle) * radius;
            const y1 = centerY + Math.sin(currentAngle) * radius;
            const x2 = centerX + Math.cos(endAngle) * radius;
            const y2 = centerY + Math.sin(endAngle) * radius;

            const largeArcFlag = angle > Math.PI ? 1 : 0;

            const pathData = [
              `M ${centerX} ${centerY}`,
              `L ${x1} ${y1}`,
              `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
              'Z'
            ].join(' ');

            currentAngle = endAngle;

            return (
              <Path
                key={index}
                d={pathData}
                fill={pieColors[index % pieColors.length]}
              />
            );
          })}
        </Svg>
        <View style={styles.pieLegend}>
          {data.slice(0, 4).map((item, index) => (
            <View key={index} style={styles.pieLegendItem}>
              <View style={[styles.pieLegendDot, { backgroundColor: pieColors[index % pieColors.length] }]} />
              <Text style={styles.pieLegendText}>{item.categoryName}</Text>
              <Text style={[styles.pieLegendValue, { color: colors.text.primary }]}>{formatCurrency(item.amount)}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Componente de tarjeta de resumen bancario
  const BankCard = ({ title, amount, color, icon, trend, trendValue }: {
    title: string;
    amount: number;
    color: string;
    icon: string;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: number;
  }) => {
    const trendColor = trend === 'up' ? colors.status.success : trend === 'down' ? colors.status.error : colors.text.secondary;

    return (
      <View style={[styles.bankCard, { borderLeftWidth: 4, borderLeftColor: color }]}>
        <View style={styles.bankCardHeader}>
          <Text style={styles.bankCardIcon}>{icon}</Text>
          <Text style={styles.bankCardTitle}>{title}</Text>
        </View>
        <Text style={[styles.bankCardAmount, { color }]}>{formatCurrency(amount)}</Text>
        {trend && trendValue !== undefined && (
          <View style={styles.trendContainer}>
            <Text style={[styles.trendText, { color: trendColor }]}>
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {Math.abs(trendValue)}%
            </Text>
          </View>
        )}
      </View>
    );
  };

  // Componente de lista de transacciones bancarias
  const TransactionList = ({ title, transactions, type }: { title: string; transactions: Transaction[]; type: 'income' | 'expense' }) => {
    const sortedTransactions = [...transactions].sort((a, b) =>
      new Date(b.createdAt?.toDate?.() || 0).getTime() - new Date(a.createdAt?.toDate?.() || 0).getTime()
    );

    return (
      <View style={styles.transactionListContainer}>
        <Text style={styles.transactionListTitle}>{title}</Text>
        {sortedTransactions.slice(0, 5).map((transaction, index) => (
          <View key={transaction.id} style={styles.transactionItem}>
            <View style={styles.transactionInfo}>
              <Text style={styles.transactionDate}>
                {transaction.createdAt?.toDate().toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
              </Text>
              <Text style={styles.transactionDescription}>
                {transaction.description || transaction.categoryId || 'Sin descripción'}
              </Text>
              <Text style={[styles.transactionAmount, { color: type === 'income' ? colors.status.success : colors.status.error }]}>
                {type === 'income' ? '+' : '-'}{formatNumber(transaction.amount)}
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header bancario */}
        <View style={styles.bankHeader}>
          <Text style={styles.bankTitle}>Panel Financiero</Text>
          <Text style={styles.bankSubtitle}>Resumen de tu situación financiera</Text>
        </View>

        {/* Tarjetas de resumen */}
        <View style={styles.summaryCards}>
          <BankCard
            title="Saldo Actual"
            amount={currentBalance}
            color={currentBalance >= 0 ? colors.status.success : colors.status.error}
            icon="💰"
          />
          <BankCard
            title="Ingresos del Mes"
            amount={monthlyIncome}
            color={colors.status.success}
            icon="💵"
            trend="up"
            trendValue={monthlyIncome > 0 ? ((monthlyIncome - (monthlyIncome * 0.9)) / (monthlyIncome * 0.9)) * 100 : 0}
          />
          <BankCard
            title="Gastos del Mes"
            amount={monthlyExpenses}
            color={colors.status.error}
            icon="💸"
            trend="down"
            trendValue={monthlyExpenses > 0 ? ((monthlyExpenses - (monthlyExpenses * 1.1)) / (monthlyExpenses * 1.1)) * 100 : 0}
          />
        </View>

        {/* Tarjeta de hoy */}
        <View style={styles.todayCard}>
          <View style={styles.todayHeader}>
            <Text style={styles.todayTitle}>Hoy</Text>
            <Text style={styles.todayDate}>{new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</Text>
          </View>
          <View style={styles.todayStats}>
            <View style={styles.todayStat}>
              <Text style={styles.todayStatLabel}>Ingresos</Text>
              <Text style={[styles.todayStatValue, { color: colors.status.success }]}>
                +{formatNumber(todayIncome)}
              </Text>
            </View>
            <View style={styles.todayStat}>
              <Text style={styles.todayStatLabel}>Gastos</Text>
              <Text style={[styles.todayStatValue, { color: colors.status.error }]}>
                -{formatNumber(todayExpenses)}
              </Text>
            </View>
            <View style={styles.todayStat}>
              <Text style={styles.todayStatLabel}>Balance</Text>
              <Text style={[styles.todayStatValue, { color: currentBalance >= 0 ? colors.status.success : colors.status.error }]}>
                {formatNumber(currentBalance)}
              </Text>
            </View>
          </View>
        </View>

        {/* Selector de período */}
        <View style={styles.periodSelector}>
          <Text style={styles.periodLabel}>Período: {getPeriodLabel()}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.periodButtons}>
            {[
              { key: 'today', label: 'Hoy' },
              { key: 'week', label: 'Semana' },
              { key: 'month', label: 'Mes' },
              { key: 'quarter', label: 'Trimestre' },
              { key: 'semester', label: 'Semestre' },
              { key: 'year', label: 'Año' },
            ].map((period) => (
              <TouchableOpacity
                key={period.key}
                style={[
                  styles.periodButton,
                  { backgroundColor: selectedPeriod === period.key ? colors.button.primary : colors.background.card }
                ]}
                onPress={() => setSelectedPeriod(period.key as any)}
              >
                <Text style={[
                  styles.periodButtonText,
                  { color: selectedPeriod === period.key ? getContrastTextColor(colors.button.primary) : colors.text.primary }
                ]}>
                  {period.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.button.primary} />
        ) : (
          <View style={styles.content}>
            <Animated.View
              style={{
                transform: [{ scale: anim.current.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) }],
                opacity: anim.current,
              }}
            >
              {/* Gráficos circulares */}
              <View style={styles.chartsGrid}>
                <BankPieChart
                  data={computeCategoryBreakdown('income').list}
                  title="Ingresos"
                  pieColors={categoryPalette.income}
                  size={140}
                />
                <BankPieChart
                  data={computeCategoryBreakdown('expense').list}
                  title="Gastos"
                  pieColors={categoryPalette.expense}
                  size={140}
                />
              </View>

              {/* Lista de transacciones recientes */}
              <View style={styles.transactionsGrid}>
                <TransactionList
                  title="Ingresos Recientes"
                  transactions={getPeriodTransactions().filter(t => t.type === 'income').slice(0, 3)}
                  type="income"
                />
                <TransactionList
                  title="Gastos Recientes"
                  transactions={getPeriodTransactions().filter(t => t.type === 'expense').slice(0, 3)}
                  type="expense"
                />
              </View>

              {/* Análisis por categorías */}
              <View style={styles.categoriesSection}>
                <Text style={styles.sectionTitle}>Análisis por Categorías</Text>
                <View style={styles.categoriesGrid}>
                  <View style={[styles.categoryCard, { borderLeftWidth: 4, borderLeftColor: colors.status.success }]}>
                    <Text style={styles.categoryTitle}>Top Ingresos</Text>
                    <View style={styles.categoryContent}>
                      {computeCategoryBreakdown('income').list.slice(0, 3).map((item, index) => (
                        <View key={item.categoryId} style={styles.categoryItem}>
                          <Text style={styles.categoryName}>{item.categoryName}</Text>
                          <Text style={[styles.categoryAmount, { color: colors.status.success }]}>
                            {formatNumber(item.amount)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                  <View style={[styles.categoryCard, { borderLeftWidth: 4, borderLeftColor: colors.status.error }]}>
                    <Text style={styles.categoryTitle}>Top Gastos</Text>
                    <View style={styles.categoryContent}>
                      {computeCategoryBreakdown('expense').list.slice(0, 3).map((item, index) => (
                        <View key={item.categoryId} style={styles.categoryItem}>
                          <Text style={styles.categoryName}>{item.categoryName}</Text>
                          <Text style={[styles.categoryAmount, { color: colors.status.error }]}>
                            {formatNumber(item.amount)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              </View>
            </Animated.View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
  },
  bankHeader: {
    backgroundColor: colors.background.card,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  bankTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
  },
  bankSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 4,
  },
  summaryCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  bankCard: {
    flex: 1,
    backgroundColor: colors.background.card,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    elevation: 2,
  },
  bankCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  bankCardIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  bankCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  bankCardAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  todayCard: {
    backgroundColor: colors.background.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
  },
  todayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  todayTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  todayDate: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  todayStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  todayStat: {
    flex: 1,
    alignItems: 'center',
  },
  todayStatLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  todayStatValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  periodSelector: {
    marginBottom: 20,
  },
  periodLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  periodButtons: {
    flexDirection: 'row',
    paddingHorizontal: 4,
  },
  periodButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  periodButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  chartsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  transactionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  chartContainer: {
    flex: 1,
    backgroundColor: colors.background.card,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  pieLegend: {
    marginTop: 12,
  },
  pieLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  pieLegendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  pieLegendText: {
    flex: 1,
    fontSize: 11,
    color: colors.text.secondary,
  },
  pieLegendValue: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'right',
  },
  transactionListContainer: {
    flex: 1,
    backgroundColor: colors.background.card,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
  },
  transactionListTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDate: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  transactionDescription: {
    fontSize: 14,
    color: colors.text.primary,
    marginBottom: 2,
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoriesSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 12,
  },
  categoriesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryCard: {
    flex: 1,
    backgroundColor: colors.background.card,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  categoryContent: {
    gap: 8,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 12,
    color: colors.text.primary,
    maxWidth: '80%',
  },
  categoryAmount: {
    fontSize: 12,
    fontWeight: '600',
  },
});
