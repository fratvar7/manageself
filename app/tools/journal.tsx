import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
  BackHandler,
  SectionList,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { JournalStyles as styles } from '../../css/Screens/Journal.styles';
import { colors } from '../../css/colors';
import { useAuth } from '../../contexts/AuthContext';
import { JournalService } from '../../services/journalService';
import { JournalEntry } from '../../types';
import { ConfirmModal } from '../../components/ConfirmModal';
import { CalendarView } from '../../components/CalendarView'; // Importado
import { formatDateISO } from '../../utils/dateUtils';

const MOODS = [
  { id: 1, emoji: '😢' },
  { id: 2, emoji: '😕' },
  { id: 3, emoji: '😐' },
  { id: 4, emoji: '😊' },
  { id: 5, emoji: '🤩' },
];

const ExpandableText = ({ text, style }: { text: string, style: any }) => {
  const [limit, setLimit] = useState(500);
  const shouldTruncate = text.length > limit;

  const showMore = () => {
      setLimit(prev => prev + 500);
  };

  return (
    <View>
      <Text style={style}>{shouldTruncate ? text.slice(0, limit) + '...' : text}</Text>
      {shouldTruncate && (
        <TouchableOpacity onPress={showMore}>
          <Text style={{color: colors.accent.primary, marginTop: 8, fontWeight: '600'}}>Leer más</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default function JournalScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const scrollRef = React.useRef<KeyboardAwareScrollView>(null);
  const contentInputRef = React.useRef<TextInput>(null);
  const cursorPositionRef = React.useRef(0);

  // Vista principal (Editor vs Historial)
  const [view, setView] = useState<'editor' | 'history'>('editor');

  // Estado del Editor
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [goodThings, setGoodThings] = useState('');
  const [toImprove, setToImprove] = useState('');
  const [mood, setMood] = useState<number | undefined>(undefined);

  const [isReadingMode, setIsReadingMode] = useState(false); // Nuevo estado lectura

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Estado del Historial
  const [history, setHistory] = useState<JournalEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [isEditingFromHistory, setIsEditingFromHistory] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<{ id: string; date: string } | null>(null);

  const dateStr = formatDateISO(selectedDate);


  const handleAuthentication = useCallback(async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        setIsAuthenticated(true);
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Accede a tu diario personal',
        fallbackLabel: 'Usar PIN del dispositivo',
        disableDeviceFallback: false,
      });

      if (result.success) {
        setIsAuthenticated(true);
      } else {
        Alert.alert('Autenticación fallida', 'No se ha podido verificar tu identidad.');
        router.back();
      }
    } catch {
      setIsAuthenticated(true);
    }
  }, [router]);

  useEffect(() => {
    handleAuthentication();
  }, [handleAuthentication]);

  // Manejar botón atrás físico (Android)
  useEffect(() => {
    const onBackPress = () => {
      if (view === 'history') {
        setView('editor');
        return true;
      }
      if (view === 'editor' && isEditingFromHistory) {
        setIsEditingFromHistory(false);
        setView('history');
        return true;
      }
      return false;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [view, isEditingFromHistory]);

  const loadEntry = useCallback(async () => {
    if (!user || !isAuthenticated || view !== 'editor') return;

    try {
      setLoading(true);
      const entry = await JournalService.getEntryByDate(user.uid, dateStr);
      if (entry) {
        setTitle(entry.title || '');
        setContent(entry.content || '');
        setGoodThings(entry.goodThings || '');
        setToImprove(entry.toImprove || '');
        setMood(entry.mood);
        setIsReadingMode(true);
      } else {
        setTitle('');
        setContent('');
        setGoodThings('');
        setToImprove('');
        setMood(undefined);
        setIsReadingMode(false);
      }
    } catch {
      // Error loading entry
    } finally {
      setLoading(false);
    }
  }, [user, dateStr, isAuthenticated, view]);

  useEffect(() => {
    loadEntry();
  }, [loadEntry]);

  const loadHistory = useCallback(async () => {
    if (!user || !isAuthenticated || view !== 'history') return;

    try {
      setHistoryLoading(true);
      const entries = await JournalService.getEntries(user.uid);
      setHistory(entries);
    } catch {
      // Error loading history
    } finally {
      setHistoryLoading(false);
    }
  }, [user, isAuthenticated, view]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleSave = async () => {
    if (!user) return;
    if (!content.trim() && !mood && !title.trim()) {
      Alert.alert('Diario vacío', 'Por favor, introduce al menos un título o contenido antes de guardar.');
      return;
    }

    try {
      setSaving(true);
      await JournalService.saveEntry(user.uid, {
        date: dateStr,
        title: title.trim(),
        content: content.trim(),
        goodThings: goodThings.trim(),
        toImprove: toImprove.trim(),
        mood: mood,
      });
      Alert.alert('Guardado', 'Tu día ha sido registrado con éxito.');

      if (isEditingFromHistory) {
        setIsEditingFromHistory(false);
        setView('history');
      }
    } catch {
      Alert.alert('Error', 'No se pudo guardar la entrada del diario.');
    } finally {
      setSaving(false);
    }
  };

  // Removed OCR analysis logic

  const handleDeleteEntry = (id: string, date: string) => {
    setEntryToDelete({ id, date });
  };

  const confirmDeleteEntry = async () => {
    if (!entryToDelete) return;
    try {
      await JournalService.deleteEntry(entryToDelete.id);
      setHistory(prev => prev.filter(e => e.id !== entryToDelete.id));
      setEntryToDelete(null);
    } catch {
      Alert.alert('Error', 'No se pudo eliminar la entrada.');
    }
  };

  const openEntryFromHistory = (entry: JournalEntry) => {
    const [y, m, d] = entry.date.split('-').map(Number);
    setSelectedDate(new Date(y, m - 1, d));
    setIsEditingFromHistory(true);
    setView('editor');
    setIsReadingMode(true);
  };

  // Calcular puntos para el calendario
  const extraMarkedDates = useMemo(() => {
    const marks: Record<string, { color: string }> = {};
    history.forEach(entry => {
       marks[entry.date] = { color: colors.accent.primary }; // Punto azul para días con entrada
    });
    return marks;
  }, [history]);

  if (!isAuthenticated) {
    return (
      <View style={styles.authContainer}>
        <Ionicons name="lock-closed" size={80} color={colors.accent.primary} />
        <Text style={styles.authTitle}>Diario Protegido</Text>
        <Text style={styles.authDesc}>Este espacio es solo para tus ojos. Por favor, identifícate para entrar.</Text>
        <TouchableOpacity style={styles.authButton} onPress={handleAuthentication}>
          <Text style={styles.authButtonText}>Desbloquear</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View
      style={styles.container}
    >
      <Stack.Screen
        options={{
          title: view === 'editor' ? 'Escribir Diario' : 'Mis Recuerdos',
          headerLeft: (view === 'history' || (view === 'editor' && isEditingFromHistory)) ? () => (
            <TouchableOpacity
              onPress={() => {
                if (view === 'history') {
                    setView('editor');
                } else {
                    setIsEditingFromHistory(false);
                    setView('history');
                }
              }}
              style={{ marginLeft: Platform.OS === 'ios' ? 0 : 4, padding: 8 }}
            >
              <Ionicons
                name={Platform.OS === 'ios' ? "chevron-back" : "arrow-back"}
                size={24}
                color={colors.text.primary}
              />
            </TouchableOpacity>
          ) : undefined,
          headerRight: () => (
            <TouchableOpacity
              onPress={() => {
                const targetView = view === 'editor' ? 'history' : 'editor';
                if (targetView === 'history') setIsEditingFromHistory(false);
                setView(targetView);
              }}
              style={styles.headerAction}
            >
              <Ionicons
                name={view === 'editor' ? "book-outline" : "create-outline"}
                size={20}
                color={colors.accent.primary}
              />
            </TouchableOpacity>
          )
        }}
      />

      {view === 'history' ? (
        <View style={{ flex: 1 }}>
          {historyLoading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color={colors.accent.primary} />
            </View>
          ) : (
            <SectionList
              sections={history.reduce((acc, entry) => {
                const date = new Date(entry.date);
                const monthYear = date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

                const existingSection = acc.find(section => section.title === monthYear);
                if (existingSection) {
                  existingSection.data.push(entry);
                } else {
                  acc.push({ title: monthYear, data: [entry] });
                }
                return acc;
              }, [] as { title: string; data: JournalEntry[] }[])}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.historyList}
              keyboardShouldPersistTaps="handled"
              stickySectionHeadersEnabled={true}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Ionicons name="journal-outline" size={60} color={colors.text.tertiary} />
                  <Text style={styles.emptyStateText}>No hay entradas registradas aún</Text>
                </View>
              }
              renderSectionHeader={({ section: { title } }) => (
                <View style={styles.monthSectionHeader}>
                  <Text style={styles.monthSectionText}>{title}</Text>
                </View>
              )}
              renderItem={({ item }) => {
                const moodEmoji = MOODS.find(m => m.id === item.mood)?.emoji || '📝';
                return (
                  <TouchableOpacity
                    style={styles.entryCard}
                    onPress={() => openEntryFromHistory(item)}
                  >
                    <View style={styles.entryContent}>
                      <View style={styles.entryHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text style={styles.entryDate}>
                            {new Date(item.date).toLocaleDateString('es-ES', {
                              day: '2-digit', month: 'short', year: 'numeric'
                            })}
                          </Text>
                          <Text style={styles.entryMood}>{moodEmoji}</Text>
                        </View>
                      </View>
                      <Text style={styles.entryTitleHistory} numberOfLines={1}>
                        {item.title || '(Sin título)'}
                      </Text>
                      <Text style={styles.entryPreview} numberOfLines={2}>
                        {item.content || item.goodThings || '(Sin contenido detallado)'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteAction}
                      onPress={() => handleDeleteEntry(item.id, item.date)}
                    >
                      <Ionicons name="trash-outline" size={18} color={colors.status.error} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      ) : (
        <CalendarView
          date={selectedDate}
          onDateChange={setSelectedDate}
          extraMarkedDates={extraMarkedDates}
          collapsible={true}
          hideHeader={true}
          hideEvents={true}
          style={{ flex: 1, backgroundColor: colors.background.primary }}
        >
          <KeyboardAwareScrollView
            ref={scrollRef}
            style={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 150 }}
            enableOnAndroid={true}
            enableAutomaticScroll={true}
            extraHeight={150}
          >
            {/* Mood Selector / Display */}
            {isReadingMode ? (
                mood ? (
                    <View style={{ alignItems: 'center', marginBottom: 20 }}>
                        <Text style={{ fontSize: 40 }}>{MOODS.find(m => m.id === mood)?.emoji}</Text>
                        <Text style={{ color: colors.text.secondary, marginTop: 5 }}>Así te sentiste este día</Text>
                    </View>
                ) : null
            ) : (
                <>
                    <Text style={{ color: colors.text.secondary, fontSize: 11, fontWeight: '800', marginBottom: 15, textAlign: 'center', letterSpacing: 1.5 }}>¿CÓMO VA TU DÍA?</Text>
                    <View style={styles.moodContainer}>
                        {MOODS.map(m => (
                        <TouchableOpacity
                            key={m.id}
                            style={[styles.moodButton, mood === m.id && styles.moodButtonActive]}
                            onPress={() => setMood(m.id)}
                        >
                            <Text style={{ fontSize: 24 }}>{m.emoji}</Text>
                        </TouchableOpacity>
                        ))}
                    </View>
                </>
            )}

            {/* Content Area */}
            {loading ? (
              <View style={{ padding: 100 }}>
                <ActivityIndicator size="large" color={colors.accent.primary} />
              </View>
            ) : isReadingMode ? (
              <View style={{ gap: 20, paddingHorizontal: 5 }}>
                 <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.text.primary, textAlign: 'center', marginBottom: 10 }}>
                    {title || 'Sin título'}
                 </Text>

                 {content ? (
                    <View style={[styles.inputCard, { minHeight: 0, paddingVertical: 20, backgroundColor: 'rgba(255,255,255,0.03)' }]}>
                        <Text style={[styles.sectionLabel, { marginTop: 0 }]}>REFLEXIÓN</Text>
                        <ExpandableText text={content} style={{ color: colors.text.primary, fontSize: 16, lineHeight: 24 }} />
                    </View>
                 ) : null}

                 {goodThings ? (
                    <View style={[styles.smallInputCard, { minHeight: 0, paddingVertical: 15, backgroundColor: 'rgba(76, 175, 80, 0.05)', borderColor: 'rgba(76, 175, 80, 0.2)' }]}>
                        <Text style={styles.sectionLabel}>✨ LO BUENO (GRATITUD)</Text>
                        <ExpandableText text={goodThings} style={{ color: colors.text.primary, fontSize: 15, lineHeight: 22 }} />
                    </View>
                 ) : null}

                 {toImprove ? (
                    <View style={[styles.smallInputCard, { minHeight: 0, paddingVertical: 15, backgroundColor: 'rgba(244, 67, 54, 0.05)', borderColor: 'rgba(244, 67, 54, 0.2)' }]}>
                         <Text style={styles.sectionLabel}>🚀 A MEJORAR</Text>
                         <ExpandableText text={toImprove} style={{ color: colors.text.primary, fontSize: 15, lineHeight: 22 }} />
                    </View>
                 ) : null}

                 <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: colors.button.secondary, marginTop: 20 }]}
                    onPress={() => setIsReadingMode(false)}
                 >
                    <Ionicons name="create-outline" size={20} color="#fff" />
                    <Text style={styles.saveButtonText}>Modificar reflexión</Text>
                 </TouchableOpacity>
              </View>
            ) : (
              <View style={{ gap: 5 }}>
                <TextInput
                  style={styles.titleInput}
                  placeholder="Título del día (Hito, Resumen...)"
                  placeholderTextColor={colors.text.tertiary}
                  value={title}
                  onChangeText={setTitle}
                />

                  <Text style={[styles.sectionLabel, { marginTop: 15, marginBottom: 5 }]}>🧘‍♀️ REFLEXIÓN DIARIA</Text>

                  <View style={[styles.inputCard, { minHeight: 200 }]}>
                      <TextInput
                      ref={contentInputRef}
                      style={styles.contentInput}
                      placeholder="Escribe libremente aquí..."
                      placeholderTextColor={colors.text.tertiary}
                      multiline
                      value={content}
                      onChangeText={setContent}
                      onSelectionChange={(event) => {
                        cursorPositionRef.current = event.nativeEvent.selection.end;
                      }}
                      onContentSizeChange={() => {
                        // Si el cursor está casi al final (escribiendo nuevo texto), hacemos scroll al final
                        if (contentInputRef.current && cursorPositionRef.current >= (content.length - 20)) {
                           // Usamos un pequeño timeout para asegurar que el renderizado se ha completado
                           setTimeout(() => {
                             scrollRef.current?.scrollToEnd(true);
                           }, 100);
                        }
                      }}
                      scrollEnabled={false}
                      />
                  </View>

                  <Text style={styles.sectionLabel}>✨ LO BUENO DEL DÍA (GRATITUD)</Text>
                  <View style={styles.smallInputCard}>
                      <TextInput
                      style={styles.contentInput}
                      placeholder="¿Qué ha salido bien hoy?"
                      placeholderTextColor={colors.text.tertiary}
                      multiline
                      value={goodThings}
                      onChangeText={setGoodThings}
                      scrollEnabled={false}
                      />
                  </View>

                  <Text style={styles.sectionLabel}>🚀 A MEJORAR</Text>
                  <View style={styles.smallInputCard}>
                      <TextInput
                      style={styles.contentInput}
                      placeholder="¿En qué puedes mejorar mañana?"
                      placeholderTextColor={colors.text.tertiary}
                      multiline
                      value={toImprove}
                      onChangeText={setToImprove}
                      scrollEnabled={false}
                      />
                  </View>

                  <TouchableOpacity
                    style={[styles.saveButton, saving && { opacity: 0.7 }]}
                    onPress={handleSave}
                    disabled={saving}
                  >
                    {saving ? (
                    <ActivityIndicator color="#fff" size="small" />
                    ) : (
                    <>
                        <Ionicons name="save-outline" size={20} color="#fff" />
                        <Text style={styles.saveButtonText}>Guardar reflexión</Text>
                    </>
                    )}
                  </TouchableOpacity>
              </View>
            )}

            <View style={{ height: 40 }} />
          </KeyboardAwareScrollView>
        </CalendarView>
      )}
      <ConfirmModal
        visible={!!entryToDelete}
        title="Eliminar Entrada"
        message={`¿Estás seguro de que quieres borrar la entrada del ${entryToDelete ? new Date(entryToDelete.date).toLocaleDateString() : ''}? Esta acción no se puede deshacer.`}
        onConfirm={confirmDeleteEntry}
        onCancel={() => setEntryToDelete(null)}
        confirmText="Eliminar"
        isDestructive={true}
      />
    </View>
  );
}
