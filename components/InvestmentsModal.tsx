import React, { useState, useMemo, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { useTransactions } from '../hooks/useTransactions';
import { useCategories } from '../hooks/useCategories';
import { colors } from '../css/colors';
import { styles } from '../css/Components/InvestmentsModal.styles';
import { NumericInput } from './NumericInput';
import { Transaction } from '../types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Timestamp } from 'firebase/firestore';
import { formatDateTime, formatDate, ensureDate } from '../utils/dateUtils';
import { ConfirmModal } from './ConfirmModal';
import { DatePickerModal } from './DatePickerModal';

interface InvestmentsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const InvestmentsModal: React.FC<InvestmentsModalProps> = ({ visible, onClose }) => {
  const { transactions, createTransaction, updateTransaction, deleteTransaction, loading: transactionsLoading } = useTransactions();
  const { categories, createCategory, loading: categoriesLoading } = useCategories();
  const [view, setView] = useState<'list' | 'add' | 'close' | 'detail'>('list');
  const [listMode, setListMode] = useState<'active' | 'history'>('active');
  const [selectedInvestment, setSelectedInvestment] = useState<Transaction | null>(null);
  const [showValues, setShowValues] = useState(true);
  const [investmentToDelete, setInvestmentToDelete] = useState<Transaction | null>(null);
  const [feedback, setFeedback] = useState<{ visible: boolean; title: string; message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const insets = useSafeAreaInsets();

  // Form states
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState(''); // Activo
  const [purchasePrice, setPurchasePrice] = useState(0);
  const [notes, setNotes] = useState('');
  const [returnAmount, setReturnAmount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Date states
  const [investmentDate, setInvestmentDate] = useState(new Date());
  const [liquidationDate, setLiquidationDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateType, setDateType] = useState<'investment' | 'liquidation'>('investment');

  // Load visibility preference
  useEffect(() => {
    AsyncStorage.getItem('investments_show_values').then(val => {
      if (val !== null) setShowValues(val === 'true');
    });
  }, []);

  // Save visibility preference
  useEffect(() => {
    AsyncStorage.setItem('investments_show_values', showValues.toString());
  }, [showValues]);

  // Filter active investments
  const activeInvestments = useMemo(() =>
    transactions.filter((t: Transaction) => t.isInvestment && t.investmentStatus === 'active'),
  [transactions]);

  // Filter closed investments
  const closedInvestments = useMemo(() =>
    transactions
      .filter((t: Transaction) => t.isInvestment && t.investmentStatus === 'closed')
      .sort((a: Transaction, b: Transaction) => {
        const dateA = ensureDate(a.liquidationDate || a.updatedAt).getTime();
        const dateB = ensureDate(b.liquidationDate || b.updatedAt).getTime();
        return dateA - dateB; // Sort Chronologically for chart
      }),
  [transactions]);

  const activeInvested = useMemo(() =>
    activeInvestments.reduce((sum: number, t: Transaction) => sum + t.amount, 0),
  [activeInvestments]);

  const allTimeInvested = useMemo(() =>
    transactions.filter((t: Transaction) => t.isInvestment && t.type === 'expense').reduce((sum: number, t: Transaction) => sum + t.amount, 0),
  [transactions]);

  const allTimeLiquidated = useMemo(() =>
    closedInvestments.reduce((sum: number, t: Transaction) => sum + (t.liquidationAmount || (t.amount + (t.investmentReturn || 0))), 0),
  [closedInvestments]);

  const totalClosedProfit = useMemo(() =>
    closedInvestments.reduce((sum: number, inv: Transaction) => sum + (inv.investmentReturn || 0), 0),
  [closedInvestments]);

  const allTimeProfitPercent = useMemo(() => {
    if (allTimeInvested === 0) return 0;
    const totalCurrentValue = activeInvested + allTimeLiquidated;
    return ((totalCurrentValue - allTimeInvested) / allTimeInvested) * 100;
  }, [activeInvested, allTimeInvested, allTimeLiquidated]);

  // Chart data calculation
  const chartData = useMemo(() => {
    if (closedInvestments.length === 0) return null;
    const lastInvestments = closedInvestments.slice(-8);
    const labels = lastInvestments.map((inv: Transaction, idx: number) => {
      if (idx % (lastInvestments.length > 4 ? 2 : 1) !== 0 && idx !== lastInvestments.length - 1) return '';
      const d = ensureDate(inv.liquidationDate || inv.updatedAt);
      return `${d.getDate()}/${d.getMonth() + 1}`;
    });
    let currentCumulative = 0;
    const data = lastInvestments.map((inv: Transaction) => {
      currentCumulative += (inv.investmentReturn || 0);
      return currentCumulative;
    });
    if (data.length > 0) {
        data.unshift(0);
        labels.unshift('');
    }
    return {
      labels: labels,
      datasets: [{ data: data, color: () => (currentCumulative >= 0 ? colors.status.success : colors.status.error), strokeWidth: 3 }]
    };
  }, [closedInvestments]);

  const formatCurrency = (amount: number) => {
    if (!showValues) return '****';
    return amount.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '€';
  };

  const handleAddInvestment = async () => {
    if (amount <= 0 || !description.trim()) {
      setFeedback({ visible: true, title: 'Error', message: 'Por favor ingresa un monto válido y una descripción', type: 'error' });
      return;
    }
    setIsSubmitting(true);
    const cat = categories.find(c => c.name === 'Inversión' && c.type === 'expense');
    let categoryId = cat?.id;
    if (!categoryId) {
        try {
            const newCat = await createCategory({ name: 'Inversión', type: 'expense', isDefault: true, icon: 'trending-up', color: '#2ECC71' });
            categoryId = newCat.id;
        } catch { categoryId = categories[0]?.id || 'general'; }
    }
    try {
      await createTransaction({
        amount, description: description.trim(), purchasePrice: purchasePrice > 0 ? purchasePrice : undefined, notes: notes.trim() || undefined,
        type: 'expense', categoryId: categoryId || 'general', isInvestment: true, investmentStatus: 'active',
        createdAt: Timestamp.fromDate(investmentDate), updatedAt: Timestamp.fromDate(investmentDate),
      });
      resetForm();
      setView('list');
      setListMode('active');
      setFeedback({ visible: true, title: 'Éxito', message: 'Inversión registrada correctamente', type: 'success' });
    } catch { setFeedback({ visible: true, title: 'Error', message: 'No se pudo registrar la inversión', type: 'error' }); }
    finally { setIsSubmitting(false); }
  };

  const handleCloseInvestment = async () => {
    if (!selectedInvestment) return;
    setIsSubmitting(true);
    try {
      await updateTransaction(selectedInvestment.id, {
        investmentStatus: 'closed',
        investmentReturn: returnAmount - selectedInvestment.amount,
        liquidationAmount: returnAmount,
        liquidationDate: Timestamp.fromDate(liquidationDate),
        updatedAt: Timestamp.fromDate(liquidationDate),
      });
      resetForm();
      setView('list');
      setListMode('history');
      setFeedback({ visible: true, title: 'Éxito', message: 'Inversión cerrada correctamente', type: 'success' });
    } catch { setFeedback({ visible: true, title: 'Error', message: 'No se pudo cerrar la inversión', type: 'error' }); }
    finally { setIsSubmitting(false); }
  };

  const handleDeleteInvestment = async () => {
    if (!investmentToDelete) return;
    try {
        await deleteTransaction(investmentToDelete.id);
        setInvestmentToDelete(null);
        setFeedback({ visible: true, title: 'Eliminado', message: 'Registro eliminado con éxito', type: 'success' });
    } catch { setFeedback({ visible: true, title: 'Error', message: 'No se pudo eliminar la inversión', type: 'error' }); }
  };

  const resetForm = () => {
    setAmount(0); setDescription(''); setPurchasePrice(0); setNotes(''); setReturnAmount(0);
    setSelectedInvestment(null); setInvestmentDate(new Date()); setLiquidationDate(new Date());
  };

  const openDatePicker = (type: 'investment' | 'liquidation') => {
    setDateType(type);
    setShowDatePicker(true);
  };

  const renderContent = () => {
    if (transactionsLoading || categoriesLoading) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
        </View>
      );
    }

    if (view === 'add') {
      return (
        <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>Nueva Inversión</Text>
          <Text style={styles.label}>Fecha de Inversión</Text>
          <TouchableOpacity style={styles.dateButton} onPress={() => openDatePicker('investment')}>
            <Ionicons name="calendar-outline" size={20} color={colors.accent.primary} />
            <Text style={styles.dateButtonText}>{formatDate(investmentDate)}</Text>
          </TouchableOpacity>

          <Text style={styles.label}>Cantidad a invertir</Text>
          <NumericInput value={amount} onChangeValue={setAmount} placeholder="0.00" placeholderTextColor={colors.text.tertiary} style={[styles.input, amount > 0 && styles.inputFilled]} />

          <Text style={styles.label}>Activo</Text>
          <TextInput value={description} onChangeText={setDescription} placeholder="Ej: Acciones Apple, Fondo Indexado..." placeholderTextColor={colors.text.tertiary} style={[styles.input, description !== '' && styles.inputFilled]} />

          <Text style={styles.label}>Precio de compra (opcional)</Text>
          <NumericInput value={purchasePrice} onChangeValue={setPurchasePrice} placeholder="0.00" placeholderTextColor={colors.text.tertiary} style={[styles.input, purchasePrice > 0 && styles.inputFilled]} />

          <Text style={styles.label}>Notas adicionales</Text>
          <TextInput value={notes} onChangeText={setNotes} placeholder="Añade detalles del activo..." placeholderTextColor={colors.text.tertiary} multiline style={[styles.input, notes !== '' && styles.inputFilled, { height: 80, textAlignVertical: 'top' }]} />

          <TouchableOpacity style={[styles.submitButton, isSubmitting && { opacity: 0.7 }]} onPress={handleAddInvestment} disabled={isSubmitting}>
            {isSubmitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.submitButtonText}>Confirmar Inversión</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={() => { setView('list'); resetForm(); }}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </ScrollView>
      );
    }

    if (view === 'close' && selectedInvestment) {
      const profit = returnAmount - selectedInvestment.amount;
      const profitPercent = (profit / selectedInvestment.amount) * 100;
      return (
        <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>Cerrar Inversión</Text>
          <Text style={styles.label}>Fecha de Liquidación</Text>
          <TouchableOpacity style={styles.dateButton} onPress={() => openDatePicker('liquidation')}>
            <Ionicons name="calendar-outline" size={20} color={colors.accent.primary} />
            <Text style={styles.dateButtonText}>{formatDate(liquidationDate)}</Text>
          </TouchableOpacity>

          <View style={[styles.returnCard, { marginTop: 20 }]}>
            <Text style={styles.returnLabel}>Inversión original ({selectedInvestment.description})</Text>
            <Text style={styles.returnAmount}>{selectedInvestment.amount.toFixed(2)}€</Text>
          </View>

          <Text style={styles.label}>Monto recuperado final</Text>
          <NumericInput value={returnAmount} onChangeValue={setReturnAmount} placeholder="0.00" placeholderTextColor={colors.text.tertiary} style={[styles.input, returnAmount > 0 && styles.inputFilled]} />

          <View style={{ marginTop: 20, alignItems: 'center', backgroundColor: colors.background.tertiary, padding: 15, borderRadius: 12 }}>
            <Text style={styles.returnLabel}>Resultado estimado</Text>
            <Text style={[styles.returnAmount, profit >= 0 ? styles.profitText : styles.lossText]}>
                {profit >= 0 ? '+' : ''}{profit.toFixed(2)}€ ({profitPercent.toFixed(2)}%)
            </Text>
          </View>

          <TouchableOpacity style={[styles.submitButton, isSubmitting && { opacity: 0.7 }]} onPress={handleCloseInvestment} disabled={isSubmitting}>
            {isSubmitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.submitButtonText}>Confirmar y Cerrar</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={() => { setView('list'); resetForm(); }}>
            <Text style={styles.cancelButtonText}>Atrás</Text>
          </TouchableOpacity>
        </ScrollView>
      );
    }

    if (view === 'detail' && selectedInvestment) {
        return (
            <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
                <View style={{ alignItems: 'center', marginBottom: 24 }}>
                    <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.accent.primary + '20', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
                        <Ionicons name="stats-chart-outline" size={32} color={colors.accent.primary} />
                    </View>
                    <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text.primary, textAlign: 'center' }}>{selectedInvestment.description}</Text>
                    <Text style={{ color: colors.text.tertiary, marginTop: 4 }}>ID: {selectedInvestment.id.substring(0, 8)}</Text>
                </View>

                <View style={styles.detailItem}><Text style={styles.detailLabel}>Estado</Text><Text style={[styles.detailValue, { color: selectedInvestment.investmentStatus === 'active' ? colors.accent.primary : colors.text.secondary }]}>{selectedInvestment.investmentStatus === 'active' ? '⚡ Activo' : '🔒 Cerrado'}</Text></View>
                <View style={styles.detailItem}><Text style={styles.detailLabel}>Monto Invertido</Text><Text style={styles.detailValue}>{formatCurrency(selectedInvestment.amount)}</Text></View>
                {selectedInvestment.purchasePrice && (<View style={styles.detailItem}><Text style={styles.detailLabel}>Precio de Entrada</Text><Text style={styles.detailValue}>{selectedInvestment.purchasePrice.toFixed(2)}€</Text></View>)}
                <View style={styles.detailItem}><Text style={styles.detailLabel}>Fecha Apertura</Text><Text style={styles.detailValue}>{formatDateTime(selectedInvestment.createdAt)}</Text></View>

                {selectedInvestment.investmentStatus === 'closed' && (
                    <>
                        <View style={styles.detailItem}><Text style={styles.detailLabel}>Fecha Cierre</Text><Text style={styles.detailValue}>{formatDateTime(selectedInvestment.liquidationDate || selectedInvestment.updatedAt)}</Text></View>
                        <View style={styles.detailItem}><Text style={styles.detailLabel}>Monto Cierre</Text><Text style={styles.detailValue}>{formatCurrency(selectedInvestment.liquidationAmount || (selectedInvestment.amount + (selectedInvestment.investmentReturn || 0)))}</Text></View>
                        <View style={styles.detailItem}><Text style={styles.detailLabel}>Beneficio Neto</Text><Text style={[styles.detailValue, (selectedInvestment.investmentReturn || 0) >= 0 ? styles.profitText : styles.lossText]}>{showValues ? `${(selectedInvestment.investmentReturn || 0) >= 0 ? '+' : ''}${(selectedInvestment.investmentReturn || 0).toFixed(2)}€` : '****'}</Text></View>
                    </>
                )}
                {selectedInvestment.notes && (<View style={styles.notesBox}><Text style={styles.notesLabel}>Notas</Text><Text style={styles.notesText}>{selectedInvestment.notes}</Text></View>)}

                <View style={{ flexDirection: 'row', gap: 12, marginTop: 40 }}>
                    <TouchableOpacity style={[styles.submitButton, { flex: 1, backgroundColor: colors.status.error + '20', marginTop: 0 }]} onPress={() => setInvestmentToDelete(selectedInvestment)}><Ionicons name="trash-outline" size={20} color={colors.status.error} /></TouchableOpacity>
                    <TouchableOpacity style={[styles.submitButton, { flex: 4, backgroundColor: colors.background.tertiary, marginTop: 0 }]} onPress={() => setView('list')}><Text style={[styles.submitButtonText, { color: colors.text.primary }]}>Volver</Text></TouchableOpacity>
                </View>
            </ScrollView>
        );
    }

    return (
      <View style={{ flex: 1 }}>
        <View style={styles.viewSelector}>
          <TouchableOpacity style={[styles.viewTab, listMode === 'active' && styles.viewTabActive]} onPress={() => setListMode('active')}><Text style={[styles.viewTabText, listMode === 'active' && styles.viewTabTextActive]}>Activas</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.viewTab, listMode === 'history' && styles.viewTabActive]} onPress={() => setListMode('history')}><Text style={[styles.viewTabText, listMode === 'history' && styles.viewTabTextActive]}>Historial</Text></TouchableOpacity>
        </View>

        {listMode === 'active' ? (
          <View style={{ flex: 1 }}>
            <View style={styles.summaryCard}><Text style={styles.summaryLabel}>Capital en Activos</Text><Text style={styles.summaryValue}>{formatCurrency(activeInvested)}</Text>
              <View style={{ flexDirection: 'row', marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: colors.border.light, width: '100%', gap: 20 }}>
                <View style={{ flex: 1 }}><Text style={[styles.summaryLabel, { fontSize: 10, marginBottom: 2 }]}>Total Invertido</Text><Text style={{ color: colors.text.primary, fontWeight: '700', fontSize: 14 }}>{formatCurrency(allTimeInvested)}</Text></View>
                <View style={{ flex: 1, alignItems: 'flex-end' }}><Text style={[styles.summaryLabel, { fontSize: 10, marginBottom: 2 }]}>Total Liquidado</Text><Text style={{ color: colors.text.primary, fontWeight: '700', fontSize: 14 }}>{formatCurrency(allTimeLiquidated)}</Text></View>
              </View>
            </View>
            <Text style={styles.sectionTitle}>Inversiones Activas</Text>
            <ScrollView style={styles.investmentList} showsVerticalScrollIndicator={false}>
              {activeInvestments.length === 0 ? (
                <View style={styles.emptyState}><Ionicons name="briefcase-outline" size={48} color={colors.text.disabled} /><Text style={styles.emptyStateText}>No tienes inversiones activas</Text></View>
              ) : (
                activeInvestments.map(inv => (
                  <View key={inv.id} style={styles.investmentItem}>
                    <TouchableOpacity style={styles.investmentInfo} onPress={() => { setSelectedInvestment(inv); setView('detail'); }}>
                      <Text style={styles.investmentDescription} numberOfLines={1}>{inv.description}</Text>
                      <Text style={styles.investmentDate}>{formatDateTime(inv.createdAt)}</Text>
                      {inv.purchasePrice && (<Text style={styles.investmentEntryPrice}>Entrada: {inv.purchasePrice.toFixed(2)}€</Text>)}
                    </TouchableOpacity>
                    <View style={{ alignItems: 'flex-end', gap: 4 }}><Text style={styles.investmentAmount}>{formatCurrency(inv.amount)}</Text>
                        <View style={{ flexDirection: 'row', gap: 6 }}>
                            <TouchableOpacity style={styles.actionBtnSmall} onPress={() => setInvestmentToDelete(inv)}><Ionicons name="trash-outline" size={16} color={colors.status.error} /></TouchableOpacity>
                            <TouchableOpacity style={styles.closeBtn} onPress={() => { setSelectedInvestment(inv); setReturnAmount(inv.amount); setView('close'); }}><Text style={styles.closeBtnText}>Cerrar</Text></TouchableOpacity>
                        </View>
                    </View>
                  </View>
                ))
              )}
              <View style={{ height: 100 }} />
            </ScrollView>
          </View>
        ) : (
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <View style={styles.chartCard}><View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: 15 }}><Text style={[styles.chartTitle, { marginBottom: 0 }]}>Beneficio Acumulado</Text><View style={{ backgroundColor: totalClosedProfit >= 0 ? colors.status.success + '20' : colors.status.error + '20', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}><Text style={{ color: totalClosedProfit >= 0 ? colors.status.success : colors.status.error, fontWeight: '700', fontSize: 12 }}>{showValues ? `${totalClosedProfit >= 0 ? '+' : ''}${totalClosedProfit.toFixed(2)}€` : '****'}</Text></View></View>
              {chartData ? (
                <LineChart data={chartData} width={340} height={200}
                  chartConfig={{ backgroundColor: colors.background.secondary, backgroundGradientFrom: colors.background.secondary, backgroundGradientTo: colors.background.secondary, decimalPlaces: 0, color: () => colors.accent.primary, labelColor: () => colors.text.tertiary, style: { borderRadius: 16 }, propsForDots: { r: '4', strokeWidth: '2', stroke: colors.accent.primary }, formatYLabel: (yValue) => showValues ? `${yValue}€` : '***', propsForBackgroundLines: { strokeDasharray: '', stroke: colors.border.light, strokeWidth: 0.5 } }}
                  bezier withVerticalLines={false} withHorizontalLines={true} withShadow={false} fromZero={false} style={{ marginVertical: 8, borderRadius: 16, marginLeft: -15 }}
                />
              ) : (<View style={{ height: 180, justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: colors.text.tertiary, fontSize: 12 }}>Sin datos históricos suficientes</Text></View>)}
              <View style={{ flexDirection: 'row', width: '100%', marginTop: 10, justifyContent: 'space-around' }}><View style={{ alignItems: 'center' }}><Text style={{ color: colors.text.tertiary, fontSize: 10 }}>ROI GLOBAL</Text><Text style={{ color: allTimeProfitPercent >= 0 ? colors.status.success : colors.status.error, fontWeight: '800', fontSize: 16 }}>{allTimeProfitPercent >= 0 ? '+' : ''}{allTimeProfitPercent.toFixed(2)}%</Text></View></View>
            </View>
            <Text style={styles.sectionTitle}>Inversiones Cerradas</Text>
            {closedInvestments.length === 0 ? (
              <View style={styles.historyEmpty}><Ionicons name="time-outline" size={48} color={colors.text.disabled} /><Text style={styles.emptyStateText}>No hay inversiones cerradas</Text></View>
            ) : (
              [...closedInvestments].reverse().map(inv => (
                <TouchableOpacity key={inv.id} style={[styles.closedInvestmentItem, { borderLeftColor: (inv.investmentReturn || 0) >= 0 ? colors.status.success : colors.status.error, borderLeftWidth: 4 }]} onPress={() => { setSelectedInvestment(inv); setView('detail'); }}>
                  <View style={styles.closedHeader}><Text style={styles.investmentDescription}>{inv.description}</Text><View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}><View style={{ backgroundColor: ((inv.investmentReturn || 0) >= 0 ? colors.status.success : colors.status.error) + '15', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}><Text style={[styles.investmentAmount, { color: (inv.investmentReturn || 0) >= 0 ? colors.status.success : colors.status.error, marginRight: 0, fontSize: 13 }]}>{showValues ? `${(inv.investmentReturn || 0) >= 0 ? '+' : ''}${(inv.investmentReturn || 0).toFixed(2)}€` : '****'}</Text></View><TouchableOpacity onPress={() => setInvestmentToDelete(inv)} style={{ padding: 6, backgroundColor: colors.background.tertiary, borderRadius: 10 }}><Ionicons name="trash-outline" size={16} color={colors.status.error} /></TouchableOpacity></View></View>
                  <View style={styles.closedDetails}><View><Text style={styles.closedLabel}>Inversión</Text><Text style={styles.closedValue}>{formatCurrency(inv.amount)}</Text></View><View style={{ alignItems: 'flex-end' }}><Text style={styles.closedLabel}>Fecha Cierre</Text><Text style={styles.closedValue}>{formatDate(inv.liquidationDate || inv.updatedAt)}</Text></View></View>
                </TouchableOpacity>
              ))
            )}
            <View style={{ height: 100 }} />
          </ScrollView>
        )}
        {view === 'list' && (<TouchableOpacity style={styles.addButton} onPress={() => setView('add')}><Ionicons name="add" size={30} color="#fff" /></TouchableOpacity>)}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? 0 : Math.max(0, insets.top - 20) }]}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}><Ionicons name="close" size={24} color={colors.text.primary} /></TouchableOpacity>
            <Text style={styles.headerTitle}>Cartera de Inversión</Text>
            <TouchableOpacity onPress={() => setShowValues(!showValues)} style={styles.closeButton}><Ionicons name={showValues ? "eye-outline" : "eye-off-outline"} size={24} color={colors.text.secondary} /></TouchableOpacity>
        </View>
        <View style={styles.content}>{renderContent()}</View>
      </View>

      <ConfirmModal visible={!!investmentToDelete} title="Eliminar Inversión" message={`¿Estás seguro de que quieres eliminar "${investmentToDelete?.description}"? Esta acción borrará el registro permanentemente.`} onConfirm={handleDeleteInvestment} onCancel={() => setInvestmentToDelete(null)} confirmText="Eliminar" type="delete" />
      <ConfirmModal visible={!!feedback} title={feedback?.title || ''} message={feedback?.message || ''} type={feedback?.type} onConfirm={() => setFeedback(null)} />

      <DatePickerModal
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onSelectDate={(date) => {
            if (dateType === 'investment') setInvestmentDate(date);
            else setLiquidationDate(date);
        }}
        initialDate={dateType === 'investment' ? investmentDate : liquidationDate}
        title={dateType === 'investment' ? "Fecha de inversión" : "Fecha de liquidación"}
      />
    </Modal>
  );
};
