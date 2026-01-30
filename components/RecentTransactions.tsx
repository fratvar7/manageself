import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, TextInput, Dimensions, LayoutAnimation, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Transaction } from '../types';
import { colors } from '../css/colors';
import { ensureDate } from '../utils/dateUtils';
import { useTransactions } from '../hooks/useTransactions';
import { FaceIcon } from './Icons';
import { ConfirmModal } from './ConfirmModal';

const { height: screenHeight } = Dimensions.get('window');
const FACES = [1, 2, 3, 4, 5];

interface TransactionItemProps {
  transaction: Transaction;
  showActions?: boolean;
  onEdit?: (t: Transaction) => void;
  onDelete?: (id: string, desc: string) => void;
  onShowDetails?: (t: Transaction) => void;
  categories: { id: string; name: string; type: string }[];
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  showActions,
  onEdit,
  onDelete,
  onShowDetails,
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

  const getTransactionIcon = () => {
    if (transaction.isInvestment) {
        return transaction.investmentStatus === 'closed' ? 'lock-closed' : 'trending-up';
    }
    return transaction.type === 'income' ? 'arrow-down-circle' : 'arrow-up-circle';
  };

  const getTransactionColor = () => {
    if (transaction.isInvestment) {
        if (transaction.investmentStatus === 'closed') {
            return (transaction.investmentReturn || 0) >= 0 ? colors.status.success : colors.status.error;
        }
        return colors.accent.primary;
    }
    return transaction.type === 'income' ? colors.status.success : colors.status.error;
  };

  const title = transaction.empresa || transaction.description || (transaction.type === 'income' ? 'Ingreso' : 'Gasto');

  return (
    <View style={[styles.transactionItem, { borderLeftColor: getTransactionColor() }]}>
      <View style={styles.transactionHeader}>
        <View style={styles.transactionMainInfo}>
          <Ionicons
            name={getTransactionIcon()}
            size={16}
            color={getTransactionColor()}
          />
          <Text style={styles.transactionTitle} numberOfLines={1}>
            {transaction.isInvestment && transaction.investmentStatus === 'closed' ? `Cierre: ${transaction.description}` : title}
          </Text>
        </View>
        <View style={styles.transactionMeta}>
          <Text style={[
            styles.transactionAmount,
            { color: getTransactionColor() }
          ]}>
            {transaction.isInvestment && transaction.investmentStatus === 'closed' ?
                ((transaction.investmentReturn || 0) >= 0 ? '+' : '-') + formatAmount(Math.abs(transaction.investmentReturn || 0)) :
                (transaction.type === 'expense' ? '-' : '+') + formatAmount(transaction.amount)
            }
          </Text>
        </View>
      </View>

      <View style={styles.transactionFooter}>
        <View style={styles.footerInfo}>
          <Text style={styles.transactionDate}>
            {formatDate(ensureDate(transaction.isInvestment && transaction.investmentStatus === 'closed' ? (transaction.liquidationDate || transaction.updatedAt) : transaction.createdAt))}
          </Text>
          {transaction.isInvestment ? (
             <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: getTransactionColor() + '20', paddingHorizontal: 6, borderRadius: 4 }}>
                <Ionicons name={transaction.investmentStatus === 'closed' ? "lock-closed" : "trending-up"} size={10} color={getTransactionColor()} />
                <Text style={{ fontSize: 10, color: getTransactionColor(), fontWeight: '700', marginLeft: 2 }}>{transaction.investmentStatus === 'closed' ? 'LIQUIDADA' : 'INVERSIÓN'}</Text>
             </View>
          ) : (
            <Text style={styles.transactionCategory}>
              {categories.find(c => c.id === transaction.categoryId)?.name || transaction.categoryId}
            </Text>
          )}
        </View>

        <View style={styles.actions}>
            <TouchableOpacity onPress={() => onShowDetails?.(transaction)} style={styles.actionBtn}>
                <Ionicons name="information-circle-outline" size={18} color={colors.button.primary} />
            </TouchableOpacity>
            {showActions && (
                <>
                {!transaction.isInvestment && (
                    <TouchableOpacity onPress={() => onEdit?.(transaction)} style={styles.actionBtn}>
                        <Ionicons name="pencil" size={18} color={colors.button.primary} />
                    </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => onDelete?.(transaction.id, transaction.description)} style={styles.actionBtn}>
                    <Ionicons name="trash" size={18} color={colors.status.error} />
                </TouchableOpacity>
                </>
            )}
        </View>
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
  const [feedback, setFeedback] = useState<{ visible: boolean; title: string; message: string; type: 'success' | 'error' | 'warning' } | null>(null);

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
        setFeedback({ visible: true, title: 'Error', message: 'Por favor introduce una cantidad válida', type: 'error' });
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
      setFeedback({ visible: true, title: 'Error', message: 'No se pudo actualizar la transacción', type: 'error' });
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
            />
            <Text style={styles.inputLabel}>Empresa / Negocio</Text>
            <TextInput
              style={styles.editInput}
              value={empresa}
              onChangeText={setEmpresa}
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
            <Text style={styles.inputLabel}>Notas adicionales</Text>
            <TextInput
              style={styles.editInput}
              value={description}
              onChangeText={setDescription}
              multiline
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
                      <FaceIcon level={n} size={28} active={satisfaction === n} color={satisfaction === n ? colors.button.primary : colors.text.disabled} />
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
      <ConfirmModal
        visible={!!feedback}
        title={feedback?.title || ''}
        message={feedback?.message || ''}
        type={feedback?.type as 'success' | 'error' | 'warning'}
        onConfirm={() => setFeedback(null)}
      />
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
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense' | 'investment'>('all');

  const [showFullHistory, setShowFullHistory] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<{ id: string; description: string } | null>(null);
  const [transactionDetails, setTransactionDetails] = useState<Transaction | null>(null);
  const [feedback, setFeedback] = useState<{ visible: boolean; title: string; message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(Math.abs(amount));
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }).format(date);
  };



  const handleDelete = (id: string, description: string) => {
    setTransactionToDelete({ id, description });
  };

  const confirmDeleteTransaction = async () => {
    if (!transactionToDelete) return;
    try {
      await deleteTransaction(transactionToDelete.id);
      setTransactionToDelete(null);
      setFeedback({ visible: true, title: 'Eliminado', message: 'Transacción borrada con éxito', type: 'success' });
    } catch {
      setFeedback({ visible: true, title: 'Error', message: 'No se pudo eliminar la transacción', type: 'error' });
    }
  };

  if (transactions.length === 0) return null;

  const getFilteredTransactions = (list: Transaction[]) => {
    const interactionDate = (t: Transaction) => ensureDate(t.liquidationDate || t.createdAt).getTime();
    let sorted = [...list].sort((a, b) => interactionDate(b) - interactionDate(a));
    if (filterType === 'investment') sorted = sorted.filter(t => t.isInvestment);
    else if (filterType !== 'all') sorted = sorted.filter(t => t.type === filterType && !t.isInvestment);
    return sorted;
  };

  const filteredAll = getFilteredTransactions(transactions);
  const filteredRecent = filteredAll.slice(0, 5);

  const getDetailMessage = (t: Transaction) => {
    if (!t) return '';
    if (t.isInvestment) {
        let msg = `Activo: ${t.description}\nInversión: ${formatAmount(t.amount)}\nEstado: ${t.investmentStatus === 'active' ? 'Activa' : 'Cerrada'}\n` +
               (t.investmentStatus === 'closed' ? `Cierre: ${formatAmount(t.liquidationAmount || 0)}\nResultado: ${t.investmentReturn?.toFixed(2)}€\n` : '') +
               `Fecha: ${formatDate(ensureDate(t.createdAt))}`;
        if (t.notes) msg += `\n\nNotas: ${t.notes}`;
        return msg;
    }
    let msg = `Empresa: ${t.empresa || 'N/A'}\nCategoría: ${categories.find(c => c.id === t.categoryId)?.name || t.categoryId}\nMonto: ${formatAmount(t.amount)}\nFecha: ${formatDate(ensureDate(t.createdAt))}`;
    if (t.description) msg += `\n\nNotas: ${t.description}`;
    return msg;
  };

  return (
    <View style={styles.container}>
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
            {[{ id: 'all', label: 'Todos' }, { id: 'income', label: 'Ingresos' }, { id: 'expense', label: 'Gastos' }, { id: 'investment', label: 'Inversión' }].map(type => (
              <TouchableOpacity
                key={type.id}
                style={[styles.filterButton, filterType === type.id && styles.filterButtonActive]}
                onPress={() => setFilterType(type.id as 'all' | 'income' | 'expense' | 'investment')}
              >
                <Text style={[styles.filterText, filterType === type.id && styles.filterTextActive]}>{type.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {isExpanded && (
        <View style={styles.transactionsList}>
          {filteredRecent.map(t => (
            <TransactionItem key={t.id} transaction={t} categories={categories} showActions={true} onEdit={setEditingTransaction} onDelete={handleDelete} onShowDetails={setTransactionDetails} />
          ))}
          {filteredAll.length > 5 && (
            <TouchableOpacity style={styles.showMoreButton} onPress={() => setShowFullHistory(true)}>
              <Text style={styles.showMoreText}>Ver historial completo ({filteredAll.length})</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <Modal visible={showFullHistory} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowFullHistory(false)}>
        <View style={styles.modalContainer}>
          <View style={[styles.modalHeader, { paddingTop: Platform.OS === 'ios' ? 0 : insets.top }]}>
            <TouchableOpacity onPress={() => setShowFullHistory(false)} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Historial de Transacciones</Text>
            <View style={{ width: 40 }} />
          </View>
          <ScrollView contentContainerStyle={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
            {filteredAll.map(t => (
              <TransactionItem key={t.id} transaction={t} showActions onEdit={setEditingTransaction} onDelete={handleDelete} onShowDetails={setTransactionDetails} categories={categories} />
            ))}
          </ScrollView>
        </View>
      </Modal>

      <TransactionEditModal visible={!!editingTransaction} transaction={editingTransaction} categories={categories} onClose={() => setEditingTransaction(null)} />

      <ConfirmModal
        visible={!!transactionToDelete}
        title="Eliminar Transacción"
        message={`¿Estás seguro de que quieres eliminar esta transacción?`}
        onConfirm={confirmDeleteTransaction}
        onCancel={() => setTransactionToDelete(null)}
        confirmText="Eliminar"
        type="delete"
      />

      <ConfirmModal
        visible={!!transactionDetails}
        title={transactionDetails?.isInvestment ? 'Detalles de Inversión' : 'Detalles de Transacción'}
        message={transactionDetails ? getDetailMessage(transactionDetails) : ''}
        type="info"
        onConfirm={() => setTransactionDetails(null)}
      />

      <ConfirmModal
        visible={!!feedback}
        title={feedback?.title || ''}
        message={feedback?.message || ''}
        type={feedback?.type as 'success' | 'error' | 'warning'}
        onConfirm={() => setFeedback(null)}
      />
    </View>
  );
};

export const styles = StyleSheet.create({
  container: { backgroundColor: colors.background.secondary, borderRadius: 16, marginVertical: 12, overflow: 'hidden', borderWidth: 1, borderColor: colors.border.default },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border.default, backgroundColor: colors.background.secondary },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontSize: 15, fontWeight: '600', color: colors.text.primary, marginLeft: 10 },
  viewAllButton: { backgroundColor: colors.background.tertiary, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  viewAllText: { fontSize: 12, color: colors.button.primary, fontWeight: '600' },
  transactionsList: { paddingHorizontal: 16, paddingBottom: 16 },
  transactionItem: { backgroundColor: colors.background.tertiary, borderLeftWidth: 4, borderRadius: 12, padding: 14, marginBottom: 8, borderStyle: 'solid' },
  transactionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  transactionMainInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  transactionTitle: { fontSize: 14, fontWeight: '600', color: colors.text.primary, marginLeft: 10, flex: 1 },
  transactionMeta: { alignItems: 'flex-end' },
  transactionAmount: { fontSize: 15, fontWeight: '700' },
  transactionFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  footerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  transactionDate: { fontSize: 12, color: colors.text.tertiary },
  transactionCategory: { fontSize: 11, color: colors.text.secondary, backgroundColor: colors.background.primary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  actions: { flexDirection: 'row', gap: 12 },
  actionBtn: { padding: 6, backgroundColor: colors.background.primary, borderRadius: 8 },
  showMoreButton: { alignItems: 'center', justifyContent: 'center', paddingVertical: 14, backgroundColor: colors.background.tertiary, borderRadius: 12, marginTop: 8 },
  showMoreText: { fontSize: 14, color: colors.button.primary, fontWeight: '600' },
  filtersContainer: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  filtersScroll: { marginBottom: 4 },
  filterButton: { backgroundColor: colors.background.tertiary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, marginRight: 10, borderWidth: 1, borderColor: colors.border.default },
  filterButtonActive: { backgroundColor: colors.button.primary, borderColor: colors.button.primary },
  filterText: { fontSize: 12, color: colors.text.secondary, fontWeight: '600' },
  filterTextActive: { color: '#fff' },
  infoIcon: { padding: 4 },
  modalContainer: { flex: 1, backgroundColor: colors.background.primary },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.border.default },
  closeBtn: { padding: 8 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: colors.text.primary },
  modalScrollContent: { padding: 16, paddingBottom: 40 },
  editModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  editModalContent: { backgroundColor: colors.background.secondary, width: '100%', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  editModalTitle: { fontSize: 20, fontWeight: '800', color: colors.text.primary, marginBottom: 20, textAlign: 'center' },
  inputLabel: { fontSize: 12, fontWeight: '700', color: colors.text.tertiary, marginBottom: 6, marginLeft: 4, marginTop: 16 },
  editInput: { backgroundColor: colors.background.tertiary, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: colors.text.primary, fontSize: 15, borderWidth: 1, borderColor: colors.border.default },
  categoriesScroll: { marginVertical: 4 },
  catEditBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.background.tertiary, marginRight: 8, borderWidth: 1, borderColor: colors.border.default },
  catEditBtnActive: { backgroundColor: colors.button.primary, borderColor: colors.button.primary },
  catEditBtnText: { fontSize: 13, color: colors.text.secondary, fontWeight: '600' },
  catEditBtnTextActive: { color: '#fff' },
  satContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  faceButton: { padding: 8, borderRadius: 12, backgroundColor: colors.background.tertiary },
  faceButtonActive: { backgroundColor: colors.button.primary + '20' },
  editActions: { flexDirection: 'row', gap: 12, marginTop: 32 },
  editBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  cancelBtn: { backgroundColor: colors.background.tertiary },
  saveBtn: { backgroundColor: colors.button.primary },
  cancelBtnText: { color: colors.text.primary, fontWeight: '700' },
  saveBtnText: { color: '#fff', fontWeight: '700' }
});
