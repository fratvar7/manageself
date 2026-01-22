import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Transaction } from '../types';
import { colors } from '../css/colors';

const { height: screenHeight } = Dimensions.get('window');

interface RecentTransactionsProps {
  transactions: Transaction[];
  onViewAll?: () => void; // Optional now as it is unused, kept for compatibility if needed or can be removed entirely
  categories?: { id: string; name: string; type: string }[];
}

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({
  transactions,
  categories = []
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [height] = useState(new Animated.Value(60));
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    Animated.timing(height, {
      toValue: isExpanded ? 60 : screenHeight * 0.8, // 80% de la altura de la pantalla
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const getFilteredTransactions = () => {
    let filtered = transactions;

    // Filtrar por tipo
    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.type === filterType);
    }

    // Filtrar por categoría
    if (selectedCategory) {
      filtered = filtered.filter(t => t.categoryId === selectedCategory);
    }

    return filtered;
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
    }).format(Math.abs(amount));
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'income': return 'arrow-down-circle';
      case 'expense': return 'arrow-up-circle';
      default: return 'swap-horizontal';
    }
  };

  const getTransactionColor = (type: Transaction['type']) => {
    switch (type) {
      case 'income': return colors.status.success;
      case 'expense': return colors.status.error;
      default: return colors.text.secondary;
    }
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : categoryId;
  };

  const renderTransaction = (transaction: Transaction) => (
    <View key={transaction.id} style={styles.transactionItem}>
      <View style={styles.transactionHeader}>
        <View style={styles.transactionMainInfo}>
          <Ionicons
            name={getTransactionIcon(transaction.type)}
            size={16}
            color={getTransactionColor(transaction.type)}
          />
          <Text style={styles.transactionTitle} numberOfLines={1}>
            {transaction.description}
          </Text>
        </View>
        <View style={styles.transactionMeta}>
          <Text style={[
            styles.transactionAmount,
            { color: getTransactionColor(transaction.type) }
          ]}>
            {transaction.type === 'expense' ? '-' : '+'}{formatAmount(transaction.amount)}
          </Text>
        </View>
      </View>

      <View style={styles.transactionFooter}>
        <Text style={styles.transactionDate}>
          {formatDate(transaction.createdAt.toDate())}
        </Text>
        <Text style={styles.transactionCategory}>
          {getCategoryName(transaction.categoryId)}
        </Text>
      </View>
    </View>
  );

  const filteredTransactions = getFilteredTransactions();

  // No mostrar si no hay transacciones
  if (transactions.length === 0) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, { height }]}>
      <TouchableOpacity style={styles.header} onPress={toggleExpanded}>
        <View style={styles.headerLeft}>
          <Ionicons name="receipt-outline" size={20} color={colors.text.secondary} />
          <Text style={styles.title}>
            Últimas transacciones ({filteredTransactions.length})
          </Text>
        </View>
        <View style={styles.headerRight}>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.text.secondary}
          />
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
            <TouchableOpacity
              style={[styles.filterButton, filterType === 'all' && styles.filterButtonActive]}
              onPress={() => setFilterType('all')}
            >
              <Text style={[styles.filterText, filterType === 'all' && styles.filterTextActive]}>
                Todos
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filterType === 'income' && styles.filterButtonActive]}
              onPress={() => setFilterType('income')}
            >
              <Text style={[styles.filterText, filterType === 'income' && styles.filterTextActive]}>
                Ingresos
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filterType === 'expense' && styles.filterButtonActive]}
              onPress={() => setFilterType('expense')}
            >
              <Text style={[styles.filterText, filterType === 'expense' && styles.filterTextActive]}>
                Gastos
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {selectedCategory && (
            <TouchableOpacity
              style={styles.categoryFilter}
              onPress={() => setSelectedCategory(null)}
            >
              <Text style={styles.categoryFilterText}>
                {getCategoryName(selectedCategory)} ✕
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {isExpanded && (
        <ScrollView style={styles.transactionsList} showsVerticalScrollIndicator={false}>
          {filteredTransactions.slice(0, 10).map(renderTransaction)}
          {filteredTransactions.length > 10 && (
             <View style={styles.showMoreButton}>
              <Text style={styles.showMoreText}>
                Mostrando 10 de {filteredTransactions.length} transacciones
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    marginVertical: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
    backgroundColor: colors.background.secondary,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    marginLeft: 10,
  },
  viewAllButton: {
    backgroundColor: colors.background.tertiary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  viewAllText: {
    fontSize: 12,
    color: colors.button.primary,
    fontWeight: '500',
  },
  transactionsList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: colors.background.secondary, // Added to ensure continuity
  },
  transactionItem: {
    backgroundColor: colors.background.tertiary,
    borderLeftWidth: 3,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderStyle: 'solid',
    borderLeftColor: colors.text.secondary,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionMainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginLeft: 10,
    flex: 1,
  },
  transactionMeta: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: '600',
  },
  transactionDescription: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 4,
    marginBottom: 4,
    lineHeight: 14,
  },
  transactionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  transactionDate: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  transactionCategory: {
    fontSize: 11,
    color: colors.text.secondary,
    backgroundColor: colors.background.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
    backgroundColor: colors.background.tertiary,
    borderRadius: 12,
    marginTop: 8,
  },
  showMoreText: {
    fontSize: 14,
    color: colors.button.primary,
    fontWeight: '600',
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: colors.background.secondary,
  },
  filtersScroll: {
    marginBottom: 10,
  },
  filterButton: {
    backgroundColor: colors.background.tertiary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  filterButtonActive: {
    backgroundColor: colors.button.primary,
    borderColor: colors.button.primary,
  },
  filterText: {
    fontSize: 13,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  categoryFilter: {
    backgroundColor: colors.accent.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.accent.primary,
  },
  categoryFilterText: {
    fontSize: 12,
    color: colors.accent.primary,
    fontWeight: '600',
  },
});
