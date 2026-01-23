import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Animated, Modal, Alert, TextInput, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Transaction } from '../types';
import { colors } from '../css/colors';
import { useTransactions } from '../hooks/useTransactions';
import { FaceIcon } from './Icons';

const { height: screenHeight } = Dimensions.get('window');
const FACES = [1, 2, 3, 4, 5];

interface TransactionItemProps {
  transaction: Transaction;
  showActions?: boolean;
  onEdit?: (t: Transaction) => void;
  onDelete?: (id: string, desc: string) => void;
  categories: { id: string; name: string; type: string }[];
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  showActions,
  onEdit,
  onDelete,
  categories
}) => {
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
      year: '2-digit',
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

  const handleShowDetails = () => {
    let details = `Empresa: ${transaction.empresa || 'N/A'}\n` +
      `Categoría: ${getCategoryName(transaction.categoryId)}\n` +
      `Cantidad: ${formatAmount(transaction.amount)}\n` +
      `Fecha: ${formatDate(transaction.createdAt.toDate())}`;

    if (transaction.description) {
      details += `\n\nDescripción: ${transaction.description}`;
    }

    Alert.alert(
      'Detalles de la transacción',
      details,
      [{ text: 'Cerrar', style: 'default' }]
    );
  };

  // Prioridad del título: Empresa -> Descripción -> Tipo
  const title = transaction.empresa || transaction.description || (transaction.type === 'income' ? 'Ingreso' : 'Gasto');

  return (
    <View style={styles.transactionItem}>
      <View style={styles.transactionHeader}>
        <View style={styles.transactionMainInfo}>
          <Ionicons
            name={getTransactionIcon(transaction.type)}
            size={16}
            color={getTransactionColor(transaction.type)}
          />
          <Text style={styles.transactionTitle} numberOfLines={1}>
            {title}
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
        <View style={styles.footerInfo}>
          <Text style={styles.transactionDate}>
            {formatDate(transaction.createdAt.toDate())}
          </Text>
          <Text style={styles.transactionCategory}>
            {getCategoryName(transaction.categoryId)}
          </Text>
        </View>

        {showActions ? (
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={handleShowDetails}
              style={styles.actionBtn}
            >
              <Ionicons name="information-circle-outline" size={18} color={colors.button.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onEdit?.(transaction)}
              style={styles.actionBtn}
            >
              <Ionicons name="pencil" size={18} color={colors.button.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onDelete?.(transaction.id, transaction.description)}
              style={styles.actionBtn}
            >
              <Ionicons name="trash" size={18} color={colors.status.error} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={handleShowDetails} style={styles.infoIcon}>
            <Ionicons name="information-circle-outline" size={18} color={colors.button.primary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

interface TransactionEditModalProps {
  visible: boolean;
  transaction: Transaction | null;
  onClose: () => void;
  categories: { id: string; name: string; type: string }[];
}

export const TransactionEditModal: React.FC<TransactionEditModalProps> = ({
  visible,
  transaction,
  onClose,
  categories
}) => {
  const { updateTransaction } = useTransactions();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [satisfaction, setSatisfaction] = useState(0);

  React.useEffect(() => {
    if (transaction) {
      setAmount(transaction.amount.toString());
      setDescription(transaction.description || '');
      setEmpresa(transaction.empresa || '');
      setCategoryId(transaction.categoryId);
      setSatisfaction(transaction.satisfaction || 0);
    }
  }, [transaction]);

  const handleSave = async () => {
    if (!transaction) return;
    try {
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount)) {
        Alert.alert('Error', 'Por favor introduce una cantidad válida');
        return;
      }

      const updates: Partial<Transaction> = {
        amount: parsedAmount,
        description,
        empresa,
        categoryId,
      };

      if (transaction.type === 'expense') {
        updates.satisfaction = satisfaction;
      }

      await updateTransaction(transaction.id, updates);
      onClose();
    } catch {
      Alert.alert('Error', 'No se pudo actualizar la transacción');
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
      <View style={styles.editModalOverlay}>
        <View style={styles.editModalContent}>
          <Text style={styles.editModalTitle}>Editar Transacción</Text>
          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: screenHeight * 0.7 }}>
            <Text style={styles.inputLabel}>Cantidad</Text>
            <TextInput
              style={styles.editInput}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholderTextColor={colors.text.disabled}
            />
            <Text style={styles.inputLabel}>Empresa / Negocio</Text>
            <TextInput
              style={styles.editInput}
              value={empresa}
              onChangeText={setEmpresa}
              placeholder="Nombre del establecimiento"
              placeholderTextColor={colors.text.disabled}
            />
            <Text style={styles.inputLabel}>Categoría</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
              {categories
                .filter(c => c.type === (transaction?.type === 'income' ? 'income' : 'expense'))
                .map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setCategoryId(cat.id)}
                    style={[styles.catEditBtn, categoryId === cat.id && styles.catEditBtnActive]}
                  >
                    <Text style={[styles.catEditBtnText, categoryId === cat.id && styles.catEditBtnTextActive]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>
            <Text style={styles.inputLabel}>Descripción</Text>
            <TextInput
              style={styles.editInput}
              value={description}
              onChangeText={setDescription}
              multiline
              placeholder="Nota adicional"
              placeholderTextColor={colors.text.disabled}
            />
            {transaction?.type === 'expense' && (
              <>
                <Text style={styles.inputLabel}>Satisfacción</Text>
                <View style={styles.satContainer}>
                  {FACES.map(n => (
                    <TouchableOpacity
                      key={n}
                      onPress={() => setSatisfaction(n)}
                      style={[styles.faceButton, satisfaction === n && styles.faceButtonActive]}
                    >
                      <FaceIcon
                        level={n}
                        size={28}
                        active={satisfaction === n}
                        color={satisfaction === n ? colors.button.primary : colors.text.disabled}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </ScrollView>
          <View style={styles.editActions}>
            <TouchableOpacity style={[styles.editBtn, styles.cancelBtn]} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.editBtn, styles.saveBtn]} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

interface RecentTransactionsProps {
  transactions: Transaction[];
  onViewAll?: () => void;
  categories?: { id: string; name: string; type: string }[];
}

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({
  transactions,
  categories = []
}) => {
  const insets = useSafeAreaInsets();
  const { deleteTransaction } = useTransactions();
  const [isExpanded, setIsExpanded] = useState(false);
  const [height] = useState(new Animated.Value(60));
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');

  // Modals state
  const [showFullHistory, setShowFullHistory] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    Animated.timing(height, {
      toValue: isExpanded ? 60 : 400,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const getFilteredTransactions = (list: Transaction[]) => {
    let filtered = list;
    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.type === filterType);
    }
    return filtered;
  };

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

  if (transactions.length === 0) return null;

  const filteredRecent = getFilteredTransactions(transactions).slice(0, 5);
  const filteredAll = getFilteredTransactions(transactions);

  return (
    <Animated.View style={[styles.container, { height }]}>
      <TouchableOpacity style={styles.header} onPress={toggleExpanded}>
        <View style={styles.headerLeft}>
          <Ionicons name="receipt-outline" size={20} color={colors.text.secondary} />
          <Text style={styles.title}>Últimas transacciones</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.viewAllButton} onPress={() => setShowFullHistory(true)}>
            <Text style={styles.viewAllText}>Ver todas</Text>
          </TouchableOpacity>
          <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={20} color={colors.text.secondary} />
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
            {[{ id: 'all', label: 'Todos' }, { id: 'income', label: 'Ingresos' }, { id: 'expense', label: 'Gastos' }].map(type => (
              <TouchableOpacity
                key={type.id}
                style={[styles.filterButton, filterType === type.id && styles.filterButtonActive]}
                onPress={() => setFilterType(type.id as 'all' | 'income' | 'expense')}
              >
                <Text style={[styles.filterText, filterType === type.id && styles.filterTextActive]}>{type.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {isExpanded && (
        <ScrollView style={styles.transactionsList} showsVerticalScrollIndicator={false}>
          {filteredRecent.map(t => (
            <TransactionItem key={t.id} transaction={t} categories={categories} />
          ))}
          {filteredAll.length > 5 && (
            <TouchableOpacity style={styles.showMoreButton} onPress={() => setShowFullHistory(true)}>
              <Text style={styles.showMoreText}>Ver historial completo ({filteredAll.length})</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}

      <Modal visible={showFullHistory} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowFullHistory(false)}>
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowFullHistory(false)} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Historial de Transacciones</Text>
            <View style={{ width: 40 }} />
          </View>
          <ScrollView contentContainerStyle={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
            {filteredAll.map(t => (
              <TransactionItem
                key={t.id}
                transaction={t}
                showActions
                onEdit={setEditingTransaction}
                onDelete={handleDelete}
                categories={categories}
              />
            ))}
          </ScrollView>
        </View>
      </Modal>

      <TransactionEditModal
        visible={!!editingTransaction}
        transaction={editingTransaction}
        categories={categories}
        onClose={() => setEditingTransaction(null)}
      />
    </Animated.View>
  );
};

export const styles = StyleSheet.create({
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
    borderRadius: 8,
  },
  viewAllText: {
    fontSize: 12,
    color: colors.button.primary,
    fontWeight: '600',
  },
  transactionsList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  transactionItem: {
    backgroundColor: colors.background.tertiary,
    borderLeftWidth: 4,
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
    fontWeight: '700',
  },
  transactionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  footerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    padding: 6,
    backgroundColor: colors.background.primary,
    borderRadius: 8,
  },
  showMoreButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
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
  },
  filtersScroll: {
    marginBottom: 4,
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
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  closeBtn: {
    padding: 4,
  },
  modalScrollContent: {
    padding: 16,
  },
  editModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  editModalContent: {
    backgroundColor: colors.background.secondary,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  editModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 8,
  },
  editInput: {
    backgroundColor: colors.background.tertiary,
    borderRadius: 12,
    padding: 16,
    color: colors.text.primary,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  editBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: colors.background.tertiary,
  },
  saveBtn: {
    backgroundColor: colors.button.primary,
  },
  cancelBtnText: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  categoriesScroll: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  catEditBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.background.tertiary,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  catEditBtnActive: {
    backgroundColor: colors.button.primary,
    borderColor: colors.button.primary,
  },
  catEditBtnText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  catEditBtnTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  satContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  faceButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: colors.background.tertiary,
  },
  faceButtonActive: {
    backgroundColor: colors.accent.primarySoft,
  },
  infoIcon: {
    marginLeft: 8,
    padding: 2,
  },
});
