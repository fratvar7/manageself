import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Transaction } from '../types';
import { colors } from '../css/colors';

const { height: screenHeight } = Dimensions.get('window');

interface RecentTransactionsProps {
  transactions: Transaction[];
  onViewAll: () => void;
  categories?: { id: string; name: string; type: string }[];
}

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({
  transactions,
  onViewAll,
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
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={onViewAll}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.viewAllText}>Ver todas</Text>
          </TouchableOpacity>
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
            <TouchableOpacity style={styles.showMoreButton} onPress={onViewAll}>
              <Text style={styles.showMoreText}>
                Ver todas las {filteredTransactions.length} transacciones
              </Text>
              <Ionicons name="arrow-forward" size={16} color={colors.button.primary} />
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    marginVertical: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333333',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    backgroundColor: '#161616',
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
    marginLeft: 8,
  },
  viewAllButton: {
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  viewAllText: {
    fontSize: 12,
    color: colors.button.primary,
    fontWeight: '500',
  },
  transactionsList: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  transactionItem: {
    backgroundColor: '#141414',
    borderLeftWidth: 3,
    borderRadius: 6,
    padding: 10,
    marginBottom: 6,
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
    marginLeft: 6,
    flex: 1,
  },
  transactionMeta: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 14,
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
    marginTop: 4,
  },
  transactionDate: {
    fontSize: 11,
    color: colors.text.secondary,
  },
  transactionCategory: {
    fontSize: 11,
    color: colors.text.secondary,
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
    backgroundColor: '#2a2a2a',
    borderRadius: 6,
    marginTop: 4,
  },
  showMoreText: {
    fontSize: 14,
    color: colors.button.primary,
    fontWeight: '500',
  },
  filtersContainer: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: '#161616',
  },
  filtersScroll: {
    marginBottom: 8,
  },
  filterButton: {
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: colors.button.primary,
  },
  filterText: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
  },
  categoryFilter: {
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  categoryFilterText: {
    fontSize: 11,
    color: colors.button.primary,
    fontWeight: '500',
  },
});
