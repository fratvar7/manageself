import React, { useState, useEffect } from 'react';
import { View, Text, Modal, ScrollView, TextInput, TouchableOpacity, Switch, StyleSheet, Platform, KeyboardAvoidingView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../css/colors';
import { TradingJournalEntry } from '../types';
import { Timestamp, collection, addDoc, query, where, onSnapshot, doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { ConfirmModal } from './ConfirmModal';

const SECTIONS_TECHNICAL = [
  { id: 'execution', title: 'Setup e Inversión', icon: 'stats-chart-outline' },
  { id: 'context', title: 'Mercado y Análisis', icon: 'globe-outline' },
  { id: 'risk', title: 'Riesgo y Psicología', icon: 'shield-checkmark-outline' },
];

const DEFAULT_PLAN_TEMPLATE = `1. FILOSOFÍA Y ESTILO
- Activos:
- Timeframes:
- Horario operativo:

2. SETUP DE ENTRADA (REGLAS)
- Confirmación 1:
- Confirmación 2:
- Gatillo (Trigger):

3. GESTIÓN DE RIESGO
- Riesgo por operación:
- Máximo de operaciones abiertas:
- Regla de Stop Loss:

4. GESTIÓN DE SALIDA (TAKE PROFIT)
- Objetivo 1 (Ratio RR):
- Gestión de Break Even:

5. REGLAS PSICOLÓGICAS
- Parar de operar tras X pérdidas:
- Estado mental requerido: `;

interface TradingJournalModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
}

export const TradingJournalModal: React.FC<TradingJournalModalProps> = ({ visible, onClose, userId }) => {
  const [insets = { top: 0, bottom: 0 }] = [useSafeAreaInsets()];
  const [viewMode, setViewMode] = useState<'dashboard' | 'form' | 'plan' | 'close' | 'edit' | 'details'>('dashboard');
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState<TradingJournalEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [currentSection, setCurrentSection] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteEntryId, setDeleteEntryId] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<TradingJournalEntry | null>(null);

  // Plan Técnico State
  const [tradingPlan, setTradingPlan] = useState<string | null>(null);
  const [isPlanEditing, setIsPlanEditing] = useState(false);
  const [planText, setPlanText] = useState('');
  const [savingPlan, setSavingPlan] = useState(false);

  // Form State (New/Edit)
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [entryTime, setEntryTime] = useState(new Date().toTimeString().substring(0, 5));
  const [asset, setAsset] = useState('');
  const [orderType, setOrderType] = useState<TradingJournalEntry['orderType']>('long');
  const [horizon, setHorizon] = useState<TradingJournalEntry['horizon']>('intraday');
  const [timeframe, setTimeframe] = useState('H1');
  const [setup, setSetup] = useState('');

  const [entryPrice, setEntryPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [riskRewardRatio, setRiskRewardRatio] = useState('');

  const [marketRegime, setMarketRegime] = useState<TradingJournalEntry['marketRegime']>('ranging');
  const [volatility, setVolatility] = useState<TradingJournalEntry['volatility']>('medium');
  const [fearGreedIndex, setFearGreedIndex] = useState('50');
  const [marketSentiment, setMarketSentiment] = useState<TradingJournalEntry['marketSentiment']>('neutral');

  const [confluences, setConfluences] = useState('');
  const [narrative, setNarrative] = useState('');
  const [invalidationLevel, setInvalidationLevel] = useState('');

  const [positionSize, setPositionSize] = useState('');
  const [riskAmount, setRiskAmount] = useState('');
  const [sizingRulesMet, setSizingRulesMet] = useState(false);

  const [mentalState, setMentalState] = useState<TradingJournalEntry['mentalState']>('neutral');
  const [disciplineScore, setDisciplineScore] = useState(5);
  const [planAdherence, setPlanAdherence] = useState(true);

  const [exitPrice, setExitPrice] = useState('');
  const [resultPnl, setResultPnl] = useState('');
  const [resultType, setResultType] = useState<TradingJournalEntry['resultType']>('breakeven');
  const [closingMentalState, setClosingMentalState] = useState<TradingJournalEntry['mentalState']>('neutral');
  const [closingDiscipline, setClosingDiscipline] = useState(5);
  const [closingPlanAdherence, setClosingPlanAdherence] = useState(true);
  const [closingNotes, setClosingNotes] = useState('');

  // Auto-calculate Risk/Reward Ratio
  useEffect(() => {
    const entry = parseFloat(entryPrice);
    const sl = parseFloat(stopLoss);
    const tp = parseFloat(takeProfit);

    if (entry && sl && tp && entry !== sl) {
      const risk = Math.abs(entry - sl);
      const reward = Math.abs(tp - entry);
      const rr = (reward / risk).toFixed(2);
      setRiskRewardRatio(rr);
    }
  }, [entryPrice, stopLoss, takeProfit]);

  // Load entry for editing or closing
  const loadEntryData = (entry: TradingJournalEntry) => {
    setEditingEntry(entry);
    setAsset(entry.asset);
    setOrderType(entry.orderType);
    setHorizon(entry.horizon);
    setTimeframe(entry.timeframe);
    setSetup(entry.setup);
    setEntryPrice(entry.entryPrice || '');
    setStopLoss(entry.stopLoss || '');
    setTakeProfit(entry.takeProfit || '');
    setRiskRewardRatio(entry.riskRewardRatio || '');
    setMarketRegime(entry.marketRegime);
    setVolatility(entry.volatility);
    setFearGreedIndex(entry.fearGreedIndex?.toString() || '50');
    setMarketSentiment(entry.marketSentiment);
    setConfluences(entry.confluences.join(', '));
    setNarrative(entry.narrative);
    setInvalidationLevel(entry.invalidationLevel || '');
    setPositionSize(entry.positionSize);
    setRiskAmount(entry.riskAmount);
    setSizingRulesMet(entry.sizingRulesMet);
    setMentalState(entry.mentalState);
    setDisciplineScore(entry.disciplineScore);
    setPlanAdherence(entry.planAdherence);
    setEntryDate(entry.date);
    setEntryTime(entry.time);

    // If closing, set defaults
    setExitPrice('');
    setResultPnl('');
    setResultType('breakeven');
    setClosingMentalState('neutral');
    setClosingDiscipline(5);
    setClosingPlanAdherence(true);
    setClosingNotes('');
  };

  // Fetch entries
  useEffect(() => {
    if (visible && userId) {
      const q = query(collection(db, 'trading_journal'), where('userId', '==', userId));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TradingJournalEntry));
        data.sort((a, b) => new Date(b.date + 'T' + b.time).getTime() - new Date(a.date + 'T' + a.time).getTime());
        setEntries(data);
        setLoadingEntries(false);
      });
      return () => unsubscribe();
    }
  }, [visible, userId]);

  // Fetch Trading Plan
  useEffect(() => {
    if (visible && userId) {
      const fetchPlan = async () => {
        try {
          const docRef = doc(db, 'trading_plans', userId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const planData = docSnap.data();
            const content = planData.content || DEFAULT_PLAN_TEMPLATE;
            setTradingPlan(content);
            setPlanText(content);
          } else {
            setTradingPlan(null);
            setPlanText(DEFAULT_PLAN_TEMPLATE);
          }
        } catch {
          // Error handling
        }
      };
      fetchPlan();
    }
  }, [visible, userId]);

  const activeEntries = entries.filter(e => e.status === 'open' || e.status === 'pending');
  const closedEntries = entries.filter(e => e.status === 'closed');

  const handleUpdateTrade = async () => {
    if (!editingEntry) return;
    setLoading(true);
    try {
      const updatedEntry: Partial<TradingJournalEntry> = {
        date: entryDate,
        time: entryTime,
        asset: asset.toUpperCase(),
        orderType,
        horizon,
        timeframe,
        setup,
        entryPrice,
        stopLoss,
        takeProfit,
        riskRewardRatio,
        marketRegime,
        volatility,
        fearGreedIndex: parseInt(fearGreedIndex) || 50,
        marketSentiment,
        confluences: confluences.split(',').map(c => c.trim()).filter(c => c !== ''),
        narrative,
        invalidationLevel,
        positionSize,
        riskAmount,
        sizingRulesMet,
        mentalState,
        disciplineScore,
        planAdherence,
      };

      await updateDoc(doc(db, 'trading_journal', editingEntry.id), updatedEntry);
      resetForm();
      setViewMode('dashboard');
    } catch {
      alert('Error al actualizar el registro');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntry = (entryId: string) => {
    setDeleteEntryId(entryId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteEntryId) return;
    try {
      await deleteDoc(doc(db, 'trading_journal', deleteEntryId));
      setShowDeleteConfirm(false);
      setDeleteEntryId(null);
    } catch {
      alert('Error al eliminar el registro');
    }
  };

  const handleCloseEntry = async () => {
    if (!editingEntry) return;
    if (!exitPrice.trim()) {
        alert('Debe especificar el precio de salida.');
        return;
    }

    setLoading(true);
    try {
      const closingData: Partial<TradingJournalEntry> = {
        status: 'closed',
        exitPrice,
        resultPnl,
        resultType,
        mentalState: closingMentalState, // Record the state at closing
        disciplineScore: closingDiscipline,
        planAdherence: closingPlanAdherence,
        notes: closingNotes,
      };

      await updateDoc(doc(db, 'trading_journal', editingEntry.id), closingData);
      resetForm();
      setViewMode('dashboard');
    } catch {
      alert('Error al cerrar la operación');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (viewMode === 'edit') {
        handleUpdateTrade();
        return;
    }

    if (!asset.trim()) {
      alert('Error: Debe especificar un activo/ticker.');
      return;
    }

    setLoading(true);
    try {
      const newEntry: Omit<TradingJournalEntry, 'id'> = {
        userId,
        createdAt: Timestamp.now(),
        date: entryDate,
        time: entryTime,
        asset: asset.toUpperCase(),
        orderType,
        horizon,
        timeframe,
        setup,
        entryPrice,
        stopLoss,
        takeProfit,
        riskRewardRatio,
        marketRegime,
        volatility,
        fearGreedIndex: parseInt(fearGreedIndex) || 50,
        marketSentiment,
        confluences: confluences.split(',').map(c => c.trim()).filter(c => c !== ''),
        narrative,
        invalidationLevel,
        positionSize,
        riskAmount,
        sizingRulesMet,
        mentalState,
        disciplineScore,
        status: orderType === 'observation' ? 'pending' : 'open',
        planAdherence,
        tags: [],
      };

      await addDoc(collection(db, 'trading_journal'), newEntry);
      resetForm();
      setViewMode('dashboard');
    } catch {
      alert('Error al guardar el registro técnico');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePlan = async () => {
    if (!userId) return;
    setSavingPlan(true);
    try {
      await setDoc(doc(db, 'trading_plans', userId), {
        content: planText,
        updatedAt: Timestamp.now()
      });
      setTradingPlan(planText);
      setIsPlanEditing(false);
    } catch {
      alert('Error al guardar el plan técnico');
    } finally {
      setSavingPlan(false);
    }
  };

  const resetForm = () => {
    setAsset('');
    setOrderType('long');
    setHorizon('intraday');
    setTimeframe('H1');
    setSetup('');
    setEntryPrice(''); setStopLoss(''); setTakeProfit(''); setRiskRewardRatio('');
    setMarketRegime('ranging'); setVolatility('medium'); setFearGreedIndex('50'); setMarketSentiment('neutral');
    setConfluences(''); setNarrative(''); setInvalidationLevel('');
    setPositionSize(''); setRiskAmount(''); setSizingRulesMet(false);
    setMentalState('neutral'); setDisciplineScore(5); setPlanAdherence(true);
    setCurrentSection(0);
    setEditingEntry(null);
    setEntryDate(new Date().toISOString().split('T')[0]);
    setEntryTime(new Date().toTimeString().substring(0, 5));

    // Reset closing fields
    setExitPrice('');
    setResultPnl('');
    setResultType('breakeven');
    setClosingMentalState('neutral');
    setClosingDiscipline(5);
    setClosingPlanAdherence(true);
    setClosingNotes('');
  };

  const renderSectionHeader = (title: string, icon: string) => (
    <View style={styles.sectionHeaderContainer}>
        <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBg}>
                <Ionicons name={icon as any} size={18} color={colors.accent.primary} />
            </View>
            <Text style={styles.sectionTitle}>{title}</Text>
        </View>
    </View>
  );

  const renderDashboard = () => (
    <View style={{ flex: 1, backgroundColor: colors.background.primary }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        <View style={styles.dashboardTopActions}>
            <TouchableOpacity
                style={styles.planButton}
                onPress={() => setViewMode('plan')}
            >
                <Ionicons name="document-text-outline" size={20} color={colors.accent.primary} />
                <Text style={styles.planButtonText}>PLAN TÉCNICO / REGLAS</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
            </TouchableOpacity>
        </View>

        <View style={styles.dashboardHeader}>
            <Text style={styles.dashboardSubheader}>ÓRDENES EN EJECUCIÓN</Text>
        </View>

        <View style={{ paddingHorizontal: 20, gap: 12 }}>
          {activeEntries.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="analytics-outline" size={32} color={colors.text.tertiary + '80'} style={{ marginBottom: 12 }} />
              <Text style={styles.emptyText}>Sin operaciones abiertas en este momento.</Text>
            </View>
          ) : (
            activeEntries.map(entry => (
              <TouchableOpacity
                key={entry.id}
                style={styles.historyItem}
                onPress={() => {
                    loadEntryData(entry);
                    setViewMode('close');
                }}
                onLongPress={() => {
                    loadEntryData(entry);
                    setViewMode('edit');
                    setCurrentSection(0);
                }}
              >
                <View style={[styles.historyIndicator, { backgroundColor: entry.orderType === 'long' ? colors.status.success : entry.orderType === 'short' ? colors.status.error : colors.text.tertiary }]} />
                <View style={styles.historyMain}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.historyHeader}>
                      <Text style={styles.historyAsset}>{entry.asset} <Text style={styles.horizonText}>({entry.horizon.toUpperCase()} - {entry.timeframe})</Text></Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <TouchableOpacity
                          onPress={() => handleDeleteEntry(entry.id)}
                          style={{ padding: 4 }}
                        >
                          <Ionicons name="trash-outline" size={18} color={colors.status.error} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => {
                            loadEntryData(entry);
                            setViewMode('details');
                          }}
                          style={{ padding: 4 }}
                        >
                          <Ionicons name="information-circle-outline" size={20} color={colors.text.tertiary} />
                        </TouchableOpacity>
                        <View style={[styles.resultBadge, { backgroundColor: (entry.orderType === 'long' ? colors.status.success : entry.orderType === 'short' ? colors.status.error : colors.text.tertiary) + '15' }]}>
                          <Text style={[styles.resultText, { color: entry.orderType === 'long' ? colors.status.success : entry.orderType === 'short' ? colors.status.error : colors.text.tertiary }]}>
                            {entry.orderType.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <Text style={styles.historySub} numberOfLines={1}>{entry.setup || 'Technical Setup'}</Text>

                    <View style={styles.levelsRow}>
                      <View style={styles.levelItem}>
                        <Text style={styles.levelLabel}>ENTRY</Text>
                        <Text style={styles.levelValue}>{entry.entryPrice || '--'}</Text>
                      </View>
                      <View style={styles.levelItem}>
                        <Text style={styles.levelLabel}>SL</Text>
                        <Text style={[styles.levelValue, { color: colors.status.error }]}>{entry.stopLoss || '--'}</Text>
                      </View>
                      <View style={styles.levelItem}>
                        <Text style={styles.levelLabel}>TP</Text>
                        <Text style={[styles.levelValue, { color: colors.status.success }]}>{entry.takeProfit || '--'}</Text>
                      </View>
                      <View style={styles.levelItem}>
                        <Text style={styles.levelLabel}>R/R</Text>
                        <Text style={[styles.levelValue, { color: colors.accent.primary }]}>{entry.riskRewardRatio || '--'}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={[styles.dashboardHeader, { marginTop: 25 }]}>
            <Text style={styles.dashboardSubheader}>REGISTRO DE EJECUCIÓN (BITÁCORA)</Text>
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          {closedEntries.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="book-outline" size={32} color={colors.text.tertiary + '80'} style={{ marginBottom: 12 }} />
              <Text style={styles.emptyText}>El historial está vacío.</Text>
              <Text style={styles.emptySubtext}>Tus operaciones cerradas aparecerán aquí.</Text>
            </View>
          ) : (
            closedEntries.map(entry => (
              <TouchableOpacity
                key={entry.id}
                style={styles.historyItem}
                onLongPress={() => {
                  loadEntryData(entry);
                  setViewMode('edit');
                  setCurrentSection(0);
                }}
              >
                <View style={[styles.historyIndicator, { backgroundColor: entry.resultType === 'win' ? colors.status.success : entry.resultType === 'loss' ? colors.status.error : colors.text.tertiary }]} />
                <View style={styles.historyMain}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.historyHeader}>
                      <Text style={styles.historyAsset}>{entry.asset} <Text style={styles.horizonText}>({entry.horizon.toUpperCase()} - {entry.timeframe})</Text></Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <TouchableOpacity
                          onPress={() => handleDeleteEntry(entry.id)}
                          style={{ padding: 4 }}
                        >
                          <Ionicons name="trash-outline" size={18} color={colors.status.error} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => {
                            loadEntryData(entry);
                            setViewMode('details');
                          }}
                          style={{ padding: 4 }}
                        >
                          <Ionicons name="information-circle-outline" size={20} color={colors.text.tertiary} />
                        </TouchableOpacity>
                        <View style={[styles.resultBadge, { backgroundColor: (entry.resultType === 'win' ? colors.status.success : entry.resultType === 'loss' ? colors.status.error : colors.text.tertiary) + '15' }]}>
                          <Text style={[styles.resultText, { color: entry.resultType === 'win' ? colors.status.success : entry.resultType === 'loss' ? colors.status.error : colors.text.tertiary }]}>
                            {entry.resultType?.toUpperCase() || 'PNL'}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <Text style={styles.historySub}>{entry.date} · {entry.resultPnl || '0.00'}</Text>

                    <View style={styles.levelsRow}>
                      <View style={styles.levelItem}>
                        <Text style={styles.levelLabel}>ENTRY</Text>
                        <Text style={styles.levelValue}>{entry.entryPrice || '--'}</Text>
                      </View>
                      <View style={styles.levelItem}>
                        <Text style={styles.levelLabel}>EXIT</Text>
                        <Text style={styles.levelValue}>{entry.exitPrice || '--'}</Text>
                      </View>
                      <View style={styles.levelItem}>
                        <Text style={styles.levelLabel}>RESULT</Text>
                        <Text style={[styles.levelValue, { color: entry.resultType === 'win' ? colors.status.success : entry.resultType === 'loss' ? colors.status.error : colors.text.primary }]}>{entry.resultPnl || '--'}</Text>
                      </View>
                      <View style={styles.levelItem}>
                        <Text style={styles.levelLabel}>R/R</Text>
                        <Text style={styles.levelValue}>{entry.riskRewardRatio || '--'}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setViewMode('form')}>
        <Ionicons name="add" size={24} color="#fff" />
        <Text style={styles.fabText}>AÑADIR LOG</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPlanView = () => (
    <View style={{ flex: 1, padding: 20 }}>
        <View style={styles.planHeader}>
            <Text style={styles.planTitle}>MI ESTRATEGIA Y REGLAS</Text>
            <TouchableOpacity onPress={() => setIsPlanEditing(!isPlanEditing)}>
                <Ionicons name={isPlanEditing ? "eye-outline" : "create-outline"} size={22} color={colors.accent.primary} />
            </TouchableOpacity>
        </View>

        {isPlanEditing ? (
            <View style={{ flex: 1 }}>
                <TextInput
                    style={[styles.input, styles.planTextArea]}
                    multiline
                    placeholder="Escribe aquí tu plan técnico, reglas de entrada, salida y gestión..."
                    placeholderTextColor={colors.text.tertiary}
                    value={planText}
                    onChangeText={setPlanText}
                />
                <View style={styles.planEditorActions}>
                    <TouchableOpacity
                        style={styles.savePlanButton}
                        onPress={handleSavePlan}
                        disabled={savingPlan}
                    >
                        <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginRight: 10 }} />
                        <Text style={styles.savePlanButtonText}>
                            {savingPlan ? 'GUARDANDO PLAN...' : 'GUARDAR PLAN TÉCNICO'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
                {tradingPlan ? (
                    <Text style={styles.planContent}>{tradingPlan}</Text>
                ) : (
                    <View style={styles.emptyCard}>
                        <Text style={styles.emptyText}>Aún no has definido un plan técnico.</Text>
                        <TouchableOpacity style={{ marginTop: 10 }} onPress={() => setIsPlanEditing(true)}>
                            <Text style={{ color: colors.accent.primary, fontWeight: '700' }}>CREAR PLAN AHORA</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        )}
    </View>
  );

  const renderClosingForm = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
            <View style={styles.sectionHeaderContainer}>
                <View style={styles.sectionHeader}>
                    <View style={[styles.sectionIconBg, { backgroundColor: colors.status.success + '15' }]}>
                        <Ionicons name="checkmark-done-circle-outline" size={18} color={colors.status.success} />
                    </View>
                    <Text style={styles.sectionTitle}>CIERRE DE OPERACIÓN</Text>
                </View>
            </View>

            <View style={styles.sectionContent}>
                <View style={styles.row}>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={styles.label}>Precio de Salida</Text>
                        <TextInput style={styles.input} keyboardType="numeric" placeholder="0.00" placeholderTextColor={colors.text.tertiary} value={exitPrice} onChangeText={setExitPrice} />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={styles.label}>Resultado PnL ($ / %)</Text>
                        <TextInput style={styles.input} placeholder="+$150 o +2%" placeholderTextColor={colors.text.tertiary} value={resultPnl} onChangeText={setResultPnl} />
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Tipo de Resultado</Text>
                    <View style={styles.chipContainer}>
                        {[
                            { id: 'win', label: 'WIN' },
                            { id: 'loss', label: 'LOSS' },
                            { id: 'breakeven', label: 'B/E' }
                        ].map((r) => (
                            <TouchableOpacity key={r.id} style={[styles.chip, resultType === r.id && styles.chipSelected]} onPress={() => setResultType(r.id as any)}>
                                <Text style={[styles.chipText, resultType === r.id && styles.chipTextSelected]}>{r.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Sensaciones al Cerrar</Text>
                    <View style={styles.chipContainer}>
                        {['focused', 'anxious', 'neutral', 'overconfident', 'revenge'].map(m => (
                            <TouchableOpacity key={m} style={[styles.chip, closingMentalState === m && styles.chipSelected]} onPress={() => setClosingMentalState(m as any)}>
                                <Text style={[styles.chipText, closingMentalState === m && styles.chipTextSelected]}>{m.toUpperCase()}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.switchContainer}>
                    <View style={styles.switchRow}>
                        <Text style={styles.switchLabel}>¿Seguiste el plan al cerrar?</Text>
                        <Switch value={closingPlanAdherence} onValueChange={setClosingPlanAdherence} trackColor={{ false: colors.text.disabled, true: colors.accent.primary }} thumbColor={colors.text.primary} />
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Notas Finales / Aprendizaje</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        multiline
                        placeholder="¿Qué aprendiste de esta operación? ¿Hubo errores emocionales?"
                        placeholderTextColor={colors.text.tertiary}
                        value={closingNotes}
                        onChangeText={setClosingNotes}
                    />
                </View>

                <TouchableOpacity style={[styles.savePlanButton, { marginTop: 10 }]} onPress={handleCloseEntry} disabled={loading}>
                    <Text style={styles.savePlanButtonText}>{loading ? 'CERRANDO...' : 'FINALIZAR Y ARCHIVAR'}</Text>
                </TouchableOpacity>
            </View>
        </View>
    </ScrollView>
  );

  const renderDetailsView = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.card}>
        <View style={styles.sectionHeaderContainer}>
            <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconBg, { backgroundColor: colors.accent.primary + '15' }]}>
                    <Ionicons name="document-text-outline" size={18} color={colors.accent.primary} />
                </View>
                <Text style={styles.sectionTitle}>DETALLES DE LA OPERACIÓN</Text>
            </View>
        </View>

        <View style={styles.sectionContent}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>ACTIVO</Text>
            <Text style={styles.detailValue}>{asset}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>SETUP / ESTRATEGIA</Text>
            <Text style={styles.detailValueText}>{setup || 'No especificado'}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>TESIS / NARRATIVA</Text>
            <Text style={styles.detailValueText}>{narrative || 'Sin descripción detallada'}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>CONFLUENCIAS</Text>
            <Text style={styles.detailValueText}>{confluences || 'Sin confluencias registradas'}</Text>
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.detailLabel}>SENTIMIENTO</Text>
              <Text style={styles.detailValue}>{marketSentiment.toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.detailLabel}>VOLATILIDAD</Text>
              <Text style={styles.detailValue}>{volatility.toUpperCase()}</Text>
            </View>
          </View>

          {editingEntry?.status === 'closed' && (
            <>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>NOTAS DE CIERRE / APRENDIZAJE</Text>
                <Text style={styles.detailValueText}>{closingNotes || 'Sin notas de cierre'}</Text>
              </View>
            </>
          )}

          <TouchableOpacity
            style={[styles.savePlanButton, { marginTop: 20 }]}
            onPress={() => setViewMode('dashboard')}
          >
            <Text style={styles.savePlanButtonText}>VOLVER AL DASHBOARD</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  const renderCurrentSection = () => {
    switch (currentSection) {
      case 0: // Setup e Inversión
        return (
          <View style={styles.sectionContent}>
            <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Fecha (YYYY-MM-DD)</Text>
                    <TextInput style={styles.input} placeholder="2024-01-01" placeholderTextColor={colors.text.tertiary} value={entryDate} onChangeText={setEntryDate} />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Hora (HH:MM)</Text>
                    <TextInput style={styles.input} placeholder="12:00" placeholderTextColor={colors.text.tertiary} value={entryTime} onChangeText={setEntryTime} />
                </View>
            </View>

            <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Activo / Ticker</Text>
                    <TextInput style={styles.input} placeholder="e.g. BTCUSDT" placeholderTextColor={colors.text.tertiary} value={asset} onChangeText={setAsset} />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Timeframe</Text>
                    <TextInput style={styles.input} placeholder="m15, H1, D1..." placeholderTextColor={colors.text.tertiary} value={timeframe} onChangeText={setTimeframe} />
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Dirección de la Orden</Text>
                <View style={styles.chipContainer}>
                    {['long', 'short', 'observation'].map((type) => (
                        <TouchableOpacity key={type} style={[styles.chip, orderType === type && styles.chipSelected]} onPress={() => setOrderType(type as any)}>
                        <Text style={[styles.chipText, orderType === type && styles.chipTextSelected]}>{type.toUpperCase()}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Horizonte Temporal</Text>
                <View style={styles.chipContainer}>
                    {['scalping', 'intraday', 'swing', 'position'].map((h) => (
                        <TouchableOpacity key={h} style={[styles.chip, horizon === h && styles.chipSelected]} onPress={() => setHorizon(h as any)}>
                        <Text style={[styles.chipText, horizon === h && styles.chipTextSelected]}>{h.toUpperCase()}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Setup de Entrada</Text>
                <TextInput style={styles.input} placeholder="e.g. Resistencia Diaria + FVG" placeholderTextColor={colors.text.tertiary} value={setup} onChangeText={setSetup} />
            </View>

            <View style={styles.divider} />

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Niveles Operativos</Text>
                <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.inputLabelSmall}>ENTRY</Text>
                        <TextInput style={styles.input} keyboardType="numeric" placeholder="0.00" placeholderTextColor={colors.text.tertiary} value={entryPrice} onChangeText={setEntryPrice} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.inputLabelSmall}>SL</Text>
                        <TextInput style={styles.input} keyboardType="numeric" placeholder="0.00" placeholderTextColor={colors.text.tertiary} value={stopLoss} onChangeText={setStopLoss} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.inputLabelSmall}>TP</Text>
                        <TextInput style={styles.input} keyboardType="numeric" placeholder="0.00" placeholderTextColor={colors.text.tertiary} value={takeProfit} onChangeText={setTakeProfit} />
                    </View>
                </View>
            </View>

            <View style={styles.rrContainer}>
                <Text style={styles.rrLabel}>RATIO RISK / REWARD:</Text>
                <Text style={styles.rrValue}>{riskRewardRatio || '0.00'}</Text>
            </View>
          </View>
        );
      case 1: // Mercado y Análisis
        return (
          <View style={styles.sectionContent}>
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Régimen Actual del Mercado</Text>
                <View style={styles.chipContainer}>
                {[
                    { id: 'bullish_trend', label: 'BULLISH' },
                    { id: 'bearish_trend', label: 'BEARISH' },
                    { id: 'ranging', label: 'RANGE' },
                    { id: 'volatile', label: 'VOLATILE' }
                ].map((r) => (
                    <TouchableOpacity key={r.id} style={[styles.chip, marketRegime === r.id && styles.chipSelected]} onPress={() => setMarketRegime(r.id as any)}>
                    <Text style={[styles.chipText, marketRegime === r.id && styles.chipTextSelected]}>{r.label}</Text>
                    </TouchableOpacity>
                ))}
                </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>F&G Index</Text>
                <TextInput style={styles.input} keyboardType="numeric" placeholder="0-100" placeholderTextColor={colors.text.tertiary} value={fearGreedIndex} onChangeText={setFearGreedIndex} />
              </View>
              <View style={[styles.inputGroup, { flex: 2 }]}>
                <Text style={styles.label}>Volatilidad</Text>
                <View style={styles.chipContainer}>
                  {['low', 'medium', 'high'].map(v => (
                    <TouchableOpacity key={v} style={[styles.chip, volatility === v && styles.chipSelected]} onPress={() => setVolatility(v as any)}>
                      <Text style={[styles.chipText, volatility === v && styles.chipTextSelected]}>{v.toUpperCase()}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Argumentación de Tesis (Narrativa)</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    multiline
                    placeholder="Explica los motivos técnicos y fundamentales de la operación..."
                    placeholderTextColor={colors.text.tertiary}
                    value={narrative}
                    onChangeText={setNarrative}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Nivel de Invalidación Estricto</Text>
                <TextInput style={styles.input} placeholder="Nivel exacto donde la tesis se anula" placeholderTextColor={colors.text.tertiary} value={invalidationLevel} onChangeText={setInvalidationLevel} />
            </View>
          </View>
        );
      case 2: // Riesgo y Psicología
        return (
          <View style={styles.sectionContent}>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Sizing (%)</Text>
                <TextInput style={styles.input} placeholder="e.g. 2%" placeholderTextColor={colors.text.tertiary} value={positionSize} onChangeText={setPositionSize} />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Total Riesgo</Text>
                <TextInput style={styles.input} placeholder="e.g. $500" placeholderTextColor={colors.text.tertiary} value={riskAmount} onChangeText={setRiskAmount} />
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Condición Psicológica</Text>
                <View style={styles.chipContainer}>
                {['focused', 'anxious', 'neutral', 'overconfident', 'revenge'].map(m => (
                    <TouchableOpacity key={m} style={[styles.chip, mentalState === m && styles.chipSelected]} onPress={() => setMentalState(m as any)}>
                    <Text style={[styles.chipText, mentalState === m && styles.chipTextSelected]}>{m.toUpperCase()}</Text>
                    </TouchableOpacity>
                ))}
                </View>
            </View>

            <View style={styles.switchContainer}>
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Acepto las reglas de gestión de riesgo</Text>
                  <Switch value={sizingRulesMet} onValueChange={setSizingRulesMet} trackColor={{ false: colors.text.disabled, true: colors.accent.primary }} thumbColor={colors.text.primary} />
                </View>
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Operación alineada con el Plan Técnico</Text>
                  <Switch value={planAdherence} onValueChange={setPlanAdherence} trackColor={{ false: colors.text.disabled, true: colors.accent.primary }} thumbColor={colors.text.primary} />
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Confluencias Adicionales</Text>
                <TextInput style={styles.input} placeholder="RSI Div, Volume Spike, VWAP..." placeholderTextColor={colors.text.tertiary} value={confluences} onChangeText={setConfluences} />
            </View>
          </View>
        );
      default: return null;
    }
  };

  return (
    <>
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={[styles.container, { paddingTop: Platform.OS === 'ios' ? 0 : insets.top }]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.backButton}>
              <Ionicons name="close" size={22} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
                {viewMode === 'dashboard' ? 'JOURNAL DE TRADING' :
                 viewMode === 'plan' ? 'PLAN TÉCNICO' :
                 viewMode === 'close' ? 'CERRAR TRADE' :
                 viewMode === 'edit' ? 'EDITAR TRADE' :
                 viewMode === 'details' ? 'DETALLES TRADE' : 'LOG DE EJECUCIÓN'}
            </Text>
            {viewMode !== 'dashboard' ? (
              <TouchableOpacity onPress={() => { setViewMode('dashboard'); resetForm(); }} style={styles.backButton}>
                <Ionicons name="apps-outline" size={20} color={colors.accent.primary} />
              </TouchableOpacity>
            ) : <View style={{ width: 44 }} />}
          </View>

          {loadingEntries && viewMode === 'dashboard' ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color={colors.accent.primary} />
            </View>
          ) : viewMode === 'dashboard' ? (
            renderDashboard()
          ) : viewMode === 'plan' ? (
            renderPlanView()
          ) : viewMode === 'details' ? (
            renderDetailsView()
          ) : viewMode === 'close' ? (
            renderClosingForm()
          ) : (
            <>
              <View style={styles.progressBar}>
                {SECTIONS_TECHNICAL.map((_, idx) => (
                  <View key={idx} style={[styles.progressStep, idx <= currentSection ? styles.progressStepActive : {}]} />
                ))}
              </View>

              <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.card}>
                  {renderSectionHeader(SECTIONS_TECHNICAL[currentSection]?.title || 'Registro', SECTIONS_TECHNICAL[currentSection]?.icon || 'document-text-outline')}
                  {renderCurrentSection()}
                </View>
              </ScrollView>

              <View style={styles.footer}>
                {currentSection > 0 ? (
                  <TouchableOpacity style={styles.navButton} onPress={() => setCurrentSection(prev => Math.max(0, prev - 1))}>
                    <Text style={styles.navButtonText}>VOLVER</Text>
                  </TouchableOpacity>
                ) : (
                   <TouchableOpacity style={styles.navButton} onPress={() => setViewMode('dashboard')}>
                    <Text style={styles.navButtonText}>CANCELAR</Text>
                  </TouchableOpacity>
                )}

                {currentSection < SECTIONS_TECHNICAL.length - 1 ? (
                  <TouchableOpacity style={[styles.navButton, styles.navButtonPrimary]} onPress={() => setCurrentSection(prev => Math.min(SECTIONS_TECHNICAL.length - 1, prev + 1))}>
                    <Text style={[styles.navButtonText, { color: '#fff' }]}>CONTINUAR</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={[styles.navButton, styles.navButtonSuccess]} onPress={handleSave}>
                    <Text style={[styles.navButtonText, { color: '#fff' }]}>{loading ? 'REGISTRANDO...' : 'GUARDAR LOG'}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>

    <ConfirmModal
      visible={showDeleteConfirm}
      title="Eliminar Registro"
      message="¿Estás seguro de que quieres eliminar esta operación?"
      type="delete"
      confirmText="Eliminar"
      cancelText="Cancelar"
      onConfirm={confirmDelete}
      onCancel={() => {
        setShowDeleteConfirm(false);
        setDeleteEntryId(null);
      }}
    />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.text.primary,
    letterSpacing: 1.5,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBar: {
    flexDirection: 'row',
    height: 3,
    width: '100%',
  },
  progressStep: {
    flex: 1,
    backgroundColor: colors.background.tertiary,
    marginHorizontal: 1,
  },
  progressStepActive: {
    backgroundColor: colors.accent.primary,
  },
  scrollContent: {
    padding: 20,
  },
  card: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border.light,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    overflow: 'hidden',
  },
  sectionHeaderContainer: {
    marginHorizontal: -24,
    marginTop: -24,
    marginBottom: 24,
    backgroundColor: colors.background.tertiary + '80',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionIconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.accent.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text.primary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  sectionContent: {
    gap: 22,
  },
  inputGroup: {
    flexDirection: 'column',
  },
  label: {
    fontSize: 10,
    color: colors.text.tertiary,
    fontWeight: '800',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginLeft: 2,
  },
  input: {
    backgroundColor: colors.background.tertiary,
    borderRadius: 8,
    padding: 14,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.default,
    fontSize: 14,
  },
  inputLabelSmall: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.text.tertiary,
    marginBottom: 4,
    marginLeft: 2,
  },
  textArea: {
    height: 110,
    textAlignVertical: 'top',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 6,
    backgroundColor: colors.background.tertiary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  chipSelected: {
    backgroundColor: colors.accent.primary + '15',
    borderColor: colors.accent.primary,
  },
  chipText: {
    fontSize: 10,
    color: colors.text.tertiary,
    fontWeight: '700',
  },
  chipTextSelected: {
    color: colors.accent.primary,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.default,
    marginVertical: 5,
  },
  rrContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.tertiary,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.accent.primary + '50',
  },
  rrLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.text.tertiary,
    marginRight: 10,
  },
  rrValue: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.accent.primary,
  },
  switchContainer: {
    gap: 10,
    backgroundColor: colors.background.tertiary,
    padding: 15,
    borderRadius: 10,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    flex: 1,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    backgroundColor: colors.background.secondary,
    gap: 12,
  },
  navButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  navButtonPrimary: {
    backgroundColor: colors.button.primary,
    borderColor: colors.button.primary,
  },
  navButtonSuccess: {
    backgroundColor: colors.status.success,
    borderColor: colors.status.success,
  },
  navButtonText: {
    color: colors.text.primary,
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  // Dashboard Refined
  dashboardHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  dashboardSubheader: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.text.tertiary,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
  dashboardTopActions: {
    padding: 20,
    paddingBottom: 10,
  },
  planButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.accent.primary + '30',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  planButtonText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: 1,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  planTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.text.primary,
    letterSpacing: 1.5,
  },
  planContent: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 22,
    backgroundColor: colors.background.secondary,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  planTextArea: {
    height: 380,
    textAlignVertical: 'top',
    fontSize: 14,
    lineHeight: 20,
    padding: 16,
    backgroundColor: colors.background.tertiary,
    borderRadius: 12,
    color: colors.text.primary,
  },
  planEditorActions: {
    marginTop: 20,
    width: '100%',
  },
  savePlanButton: {
    backgroundColor: colors.status.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: colors.status.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  savePlanButtonText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: colors.accent.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 15,
    borderRadius: 14,
    elevation: 8,
    shadowColor: colors.accent.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabText: {
    color: '#fff',
    fontWeight: '900',
    marginLeft: 10,
    fontSize: 13,
    letterSpacing: 0.5,
  },
  activeCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: 18,
    width: 240,
    marginRight: 15,
    borderWidth: 1,
    borderColor: colors.border.light,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  activeAsset: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.text.primary,
    letterSpacing: 0.5,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '900',
  },
  cardDivider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginVertical: 12,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.text.tertiary,
  },
  cardValue: {
    fontSize: 12,
    color: colors.text.primary,
    fontWeight: '500',
  },
  cardSetupFooter: {
    fontSize: 11,
    color: colors.text.tertiary,
    fontStyle: 'italic',
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    paddingTop: 8,
  },
  historyItem: {
    backgroundColor: colors.background.secondary,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  historyIndicator: {
    width: 6,
    height: '100%',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  historyMain: {
    flex: 1,
    padding: 16,
  },
  levelsRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 15,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border.light + '40',
  },
  levelItem: {
    flex: 1,
  },
  levelLabel: {
    fontSize: 8,
    color: colors.text.tertiary,
    fontWeight: '800',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  levelValue: {
    fontSize: 11,
    color: colors.text.primary,
    fontWeight: '700',
  },
  infoButton: {
    paddingLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.text.tertiary,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.text.primary,
  },
  detailRow: {
    marginBottom: 15,
  },
  detailLabel: {
    fontSize: 9,
    color: colors.text.tertiary,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '700',
  },
  detailValueText: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  historyInfo: {
    flex: 1,
  },
  historyAsset: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text.primary,
  },
  historySub: {
    fontSize: 11,
    color: colors.text.tertiary,
    marginTop: 3,
    fontWeight: '600',
  },
  historyStatus: {
    alignItems: 'flex-end',
    gap: 4,
  },
  resultBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  resultText: {
    fontSize: 9,
    fontWeight: '900',
  },
  historyPnl: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '800',
  },
  horizonText: {
    fontSize: 11,
    color: colors.text.tertiary,
    fontWeight: '600',
  },
  emptyCard: {
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: 20,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    borderColor: colors.border.default,
    marginTop: 8,
    padding: 20,
  },
  emptyText: {
    color: colors.text.secondary,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtext: {
    color: colors.text.tertiary,
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
});
