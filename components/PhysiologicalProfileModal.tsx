import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  StyleSheet,
  Dimensions,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { UserService } from '../services/userService';
import { useAuth } from '../contexts/AuthContext';
import { UserProfile, UserMetricLog } from '../types';
import { colors } from '../css/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ensureDate } from '../utils/dateUtils';

interface PhysiologicalProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

export const PhysiologicalProfileModal: React.FC<PhysiologicalProfileModalProps> = ({ visible, onClose }) => {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [cameFromHistory, setCameFromHistory] = useState(false);
  const [activeTab, setActiveTab] = useState<'weight' | 'composition' | 'perimeters'>('weight');
  const [historyData, setHistoryData] = useState<UserMetricLog[]>([]);
  const [latestMetrics, setLatestMetrics] = useState<UserMetricLog | null>(null);
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    age: undefined,
    weight: undefined,
    height: undefined,
    bodyFat: undefined,
    muscleMass: undefined,
    waist: undefined,
    arm: undefined,
    country: '',
    city: '',
    gender: 'other',
    activityLevel: 'moderate'
  });

  const ACTIVITY_LEVEL_OPTIONS = [
    { value: 'sedentary', label: 'Sedentario' },
    { value: 'light', label: 'Ligero' },
    { value: 'moderate', label: 'Moderado' },
    { value: 'active', label: 'Activo' },
    { value: 'very_active', label: 'Muy Activo' },
  ];

  const getActivityLevelText = (value?: string) => {
    return ACTIVITY_LEVEL_OPTIONS.find(opt => opt.value === value)?.label || 'Moderado';
  };

  const loadProfile = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const metrics = await UserService.getLatestUserMetrics(user.uid);
      setLatestMetrics(metrics);
      if (metrics) {
        setFormData({
          age: metrics.age,
          weight: metrics.weight,
          height: metrics.height,
          bodyFat: metrics.bodyFat,
          muscleMass: metrics.muscleMass,
          waist: metrics.waist,
          arm: metrics.arm,
          country: metrics.country || '',
          city: metrics.city || '',
          gender: metrics.gender || 'other',
          activityLevel: metrics.activityLevel || 'moderate'
        });
        setIsEditing(false);
        setEditingId(null);
        setCameFromHistory(false);
      } else {
        setIsEditing(false); // Mode reading but with null metrics = empty state
      }
    } catch {
      // Error handled
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadHistory = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await UserService.getAllUserMetrics(user.uid);
      setHistoryData(data);
    } catch {
      // Error handled
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (visible && user) {
      loadProfile();
    }
  }, [visible, user, loadProfile]);

  const handleSave = async () => {
    if (!user) return;
    try {
      setLoading(true);

      // Limpiar datos para Firebase (evitar undefined)
      const sanitizedData = Object.entries(formData).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && (typeof value !== 'number' || !isNaN(value))) {
          (acc as any)[key] = value;
        }
        return acc;
      }, {} as Record<string, unknown>);

      if (editingId) {
        await UserService.updateMetricLog(user.uid, editingId, sanitizedData);
      } else {
        await UserService.addUserMetrics(user.uid, sanitizedData);
      }

      const metrics = await UserService.getLatestUserMetrics(user.uid);
      setLatestMetrics(metrics);
      if (showHistory || cameFromHistory) {
        await loadHistory();
        setShowHistory(true);
      }

      setIsEditing(false);
      setEditingId(null);
      setCameFromHistory(false);
      Alert.alert('Éxito', 'Registro guardado correctamente');
    } catch {
      Alert.alert('Error', 'No se pudo guardar el registro');
    } finally {
      setLoading(false);
    }
  };

  const handleEditHistory = (record: UserMetricLog) => {
    setFormData({
      age: record.age,
      weight: record.weight,
      height: record.height,
      bodyFat: record.bodyFat,
      muscleMass: record.muscleMass,
      waist: record.waist,
      arm: record.arm,
      country: record.country || '',
      city: record.city || '',
      gender: record.gender || 'other',
      activityLevel: record.activityLevel || 'moderate'
    });
    setEditingId(record.id);
    setShowHistory(false);
    setCameFromHistory(true);
    setIsEditing(true);
  };

  const handleDeleteHistory = (recordId: string) => {
    Alert.alert(
      'Eliminar Registro',
      '¿Estás seguro de que quieres eliminar esta medición?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            if (!user) return;
            try {
              setLoading(true);
              await UserService.deleteMetricLog(user.uid, recordId);
              await loadHistory();
              const metrics = await UserService.getLatestUserMetrics(user.uid);
              setLatestMetrics(metrics);
            } catch {
              Alert.alert('Error', 'No se pudo eliminar el registro');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const updateNumericField = (field: keyof UserProfile, value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    setFormData(prev => ({ ...prev, [field]: numValue }));
  };

  const renderReadOnly = () => {
    if (!latestMetrics) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="body-outline" size={80} color={colors.text.tertiary} />
          <Text style={styles.emptyText}>No tienes medidas registradas</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => setIsEditing(true)}>
            <Text style={styles.primaryButtonText}>Introducir medidas</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.lastUpdateCard}>
          <Text style={styles.lastUpdateLabel}>Última toma de medidas:</Text>
          <Text style={styles.metricValue}>
            {ensureDate(latestMetrics.date).toLocaleDateString('es-ES', {
              day: 'numeric', month: 'long', year: 'numeric'
            })}
          </Text>
        </View>

        <View style={styles.metricsList}>
          <View style={styles.metricRow}>
            <View style={styles.metricRowLeft}>
              <View style={[styles.iconBox, { backgroundColor: colors.accent.purple + '20' }]}>
                 <Ionicons name="calendar-outline" size={18} color={colors.accent.purple} />
              </View>
              <Text style={styles.metricLabel}>Edad</Text>
            </View>
            <Text style={styles.metricValue}>{latestMetrics.age || '-'} <Text style={styles.unitText}> años</Text></Text>
          </View>

          <View style={styles.metricRow}>
            <View style={styles.metricRowLeft}>
              <View style={[styles.iconBox, { backgroundColor: colors.accent.primary + '20' }]}>
                 <Ionicons name="resize-outline" size={18} color={colors.accent.primary} />
              </View>
              <Text style={styles.metricLabel}>Altura</Text>
            </View>
            <Text style={styles.metricValue}>{latestMetrics.height || '-'} <Text style={styles.unitText}> cm</Text></Text>
          </View>

          <View style={styles.metricRow}>
            <View style={styles.metricRowLeft}>
              <View style={[styles.iconBox, { backgroundColor: colors.accent.yellow + '20' }]}>
                 <Ionicons name="scale-outline" size={18} color={colors.accent.yellow} />
              </View>
              <Text style={styles.metricLabel}>Peso Actual</Text>
            </View>
            <Text style={styles.metricValue}>{latestMetrics.weight || '-'} <Text style={styles.unitText}> kg</Text></Text>
          </View>

          {latestMetrics.bodyFat !== undefined && (
            <View style={styles.metricRow}>
              <View style={styles.metricRowLeft}>
                <View style={[styles.iconBox, { backgroundColor: colors.status.error + '20' }]}>
                   <Ionicons name="flame-outline" size={18} color={colors.status.error} />
                </View>
                <Text style={styles.metricLabel}>Grasa Corporal</Text>
              </View>
              <Text style={styles.metricValue}>{latestMetrics.bodyFat}<Text style={styles.unitText}> %</Text></Text>
            </View>
          )}

          {latestMetrics.muscleMass !== undefined && (
            <View style={styles.metricRow}>
              <View style={styles.metricRowLeft}>
                <View style={[styles.iconBox, { backgroundColor: colors.status.success + '20' }]}>
                   <Ionicons name="fitness-outline" size={18} color={colors.status.success} />
                </View>
                <Text style={styles.metricLabel}>Masa Muscular</Text>
              </View>
              <Text style={styles.metricValue}>{latestMetrics.muscleMass}<Text style={styles.unitText}> kg</Text></Text>
            </View>
          )}

          {latestMetrics.waist !== undefined && (
            <View style={styles.metricRow}>
              <View style={styles.metricRowLeft}>
                <View style={[styles.iconBox, { backgroundColor: colors.accent.mint + '20' }]}>
                   <Ionicons name="analytics-outline" size={18} color={colors.accent.mint} />
                </View>
                <Text style={styles.metricLabel}>Cintura</Text>
              </View>
              <Text style={styles.metricValue}>{latestMetrics.waist}<Text style={styles.unitText}> cm</Text></Text>
            </View>
          )}

          {latestMetrics.arm !== undefined && (
            <View style={styles.metricRow}>
              <View style={styles.metricRowLeft}>
                <View style={[styles.iconBox, { backgroundColor: colors.accent.coral + '20' }]}>
                   <Ionicons name="accessibility-outline" size={18} color={colors.accent.coral} />
                </View>
                <Text style={styles.metricLabel}>Contorno Brazo</Text>
              </View>
              <Text style={styles.metricValue}>{latestMetrics.arm}<Text style={styles.unitText}> cm</Text></Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Otros Datos</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ubicación</Text>
            <Text style={styles.infoValue}>
              {latestMetrics.city || latestMetrics.country
                ? `${latestMetrics.city || ''}${latestMetrics.city && latestMetrics.country ? ', ' : ''}${latestMetrics.country || ''}`
                : 'No especificada'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Género</Text>
            <Text style={styles.infoValue}>
              {latestMetrics.gender === 'male' ? 'Hombre' : latestMetrics.gender === 'female' ? 'Mujer' : 'Otro'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nivel de Actividad</Text>
            <Text style={styles.infoValue}>
              {getActivityLevelText(latestMetrics.activityLevel)}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.updateButton} onPress={() => {
          setIsEditing(true);
          setCameFromHistory(false);
        }}>
          <Ionicons name="add-outline" size={20} color={colors.button.primary} />
          <Text style={styles.updateButtonText}>Registrar nuevas medidas</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.updateButton, { marginTop: 12, borderColor: colors.accent.yellow + '40', backgroundColor: colors.accent.yellow + '10' }]}
          onPress={() => {
            loadHistory();
            setShowHistory(true);
          }}
        >
          <Ionicons name="stats-chart" size={20} color={colors.accent.yellow} />
          <Text style={[styles.updateButtonText, { color: colors.accent.yellow }]}>Ver histórico</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  const renderHistory = () => {
    const sortedHistory = [...historyData].reverse(); // Oldest to newest
    const labels = sortedHistory.map(h => {
        const d = ensureDate(h.date);
        return `${d.getDate()}/${d.getMonth() + 1}`;
    }).slice(-6);

    const getChartData = () => {
      if (activeTab === 'weight') {
        return {
          labels,
          datasets: [{
            data: sortedHistory.map(h => h.weight || 0).slice(-6),
            color: (opacity = 1) => `rgba(255, 230, 0, ${opacity})`,
            strokeWidth: 2
          }],
          legend: ["Peso (kg)"]
        };
      } else if (activeTab === 'composition') {
        return {
          labels,
          datasets: [
            {
              data: sortedHistory.map(h => h.bodyFat || 0).slice(-6),
              color: (opacity = 1) => `rgba(255, 80, 80, ${opacity})`,
              strokeWidth: 2
            },
            {
              data: sortedHistory.map(h => h.muscleMass || 0).slice(-6),
              color: (opacity = 1) => `rgba(80, 255, 80, ${opacity})`,
              strokeWidth: 2
            }
          ],
          legend: ["% Grasa", "Músculo (kg)"]
        };
      } else {
        return {
          labels,
          datasets: [
            {
              data: sortedHistory.map(h => h.waist || 0).slice(-6),
              color: (opacity = 1) => `rgba(80, 200, 255, ${opacity})`,
              strokeWidth: 2
            },
            {
              data: sortedHistory.map(h => h.arm || 0).slice(-6),
              color: (opacity = 1) => `rgba(200, 80, 255, ${opacity})`,
              strokeWidth: 2
            }
          ],
          legend: ["Cintura (cm)", "Brazo (cm)"]
        };
      }
    };

    const firstRecord = historyData[historyData.length - 1];
    const lastRecord = historyData[0];
    const totalWeightDiff = (lastRecord?.weight || 0) - (firstRecord?.weight || 0);
    const totalFatDiff = (lastRecord?.bodyFat || 0) - (firstRecord?.bodyFat || 0);

    return (
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.tabContainer}>
          {(['weight', 'composition', 'perimeters'] as const).map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'weight' ? 'Peso' : tab === 'composition' ? 'Cuerpo' : 'Medidas'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.lastUpdateCard}>
          <Text style={styles.lastUpdateLabel}>Evolución Temporal</Text>
          {sortedHistory.length > 1 ? (
             <LineChart
                data={getChartData()}
                width={Dimensions.get("window").width - 40}
                height={200}
                chartConfig={{
                    backgroundColor: colors.background.secondary,
                    backgroundGradientFrom: colors.background.tertiary,
                    backgroundGradientTo: colors.background.tertiary,
                    decimalPlaces: 1,
                    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(200, 200, 200, ${opacity})`,
                    style: { borderRadius: 16 },
                    propsForDots: { r: "4", strokeWidth: "2", stroke: colors.accent.yellow }
                }}
                bezier
                style={{ marginVertical: 8, borderRadius: 16 }}
            />
          ) : (
             <Text style={{ color: colors.text.tertiary, marginVertical: 60 }}>Faltan datos para mostrar la gráfica</Text>
          )}
        </View>

        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Cambio Peso</Text>
            <Text style={[styles.summaryValue, { color: totalWeightDiff <= 0 ? colors.status.success : colors.status.error }]}>
              {totalWeightDiff > 0 ? '+' : ''}{totalWeightDiff.toFixed(1)}kg
            </Text>
            <Text style={styles.summaryPeriod}>Desde el inicio</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Cambio Grasa</Text>
            <Text style={[styles.summaryValue, { color: totalFatDiff <= 0 ? colors.status.success : colors.status.error }]}>
              {totalFatDiff > 0 ? '+' : ''}{totalFatDiff.toFixed(1)}%
            </Text>
            <Text style={styles.summaryPeriod}>Global</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Balance Histórico</Text>
          {historyData.map((record, idx) => {
            const nextRecord = historyData[idx + 1];
            const weightDiff = nextRecord && record.weight && nextRecord.weight ? record.weight - nextRecord.weight : 0;

            const details = [
              record.weight ? `${record.weight}kg` : null,
              record.bodyFat ? `${record.bodyFat}% grasa` : null,
              record.muscleMass ? `${record.muscleMass}kg músc.` : null,
              record.waist ? `${record.waist}cm cint.` : null,
              record.arm ? `${record.arm}cm brazo` : null,
            ].filter(Boolean).join(' • ');

            return (
              <View key={record.id} style={styles.historyItem}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={styles.historyDate}>{ensureDate(record.date).toLocaleDateString()}</Text>
                  <Text style={styles.historyDetails}>{details || 'Sin medidas'}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                  {weightDiff !== 0 && (
                    <View style={[styles.diffBadge, { backgroundColor: weightDiff > 0 ? colors.status.error + '20' : colors.status.success + '20' }]}>
                      <Text style={{ color: weightDiff > 0 ? colors.status.error : colors.status.success, fontWeight: '700', fontSize: 12 }}>
                        {weightDiff > 0 ? '+' : ''}{weightDiff.toFixed(1)}kg
                      </Text>
                    </View>
                  )}
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity onPress={() => handleEditHistory(record)}>
                      <Ionicons name="pencil-outline" size={18} color={colors.text.secondary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteHistory(record.id)}>
                      <Ionicons name="trash-outline" size={18} color={colors.status.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, { paddingTop: Platform.OS === 'ios' ? 0 : insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => {
            if (showHistory) setShowHistory(false);
            else if (isEditing) {
              if (cameFromHistory) {
                setShowHistory(true);
                setIsEditing(false);
                setEditingId(null);
                setCameFromHistory(false);
                loadProfile(); // Reset formData
              } else {
                setIsEditing(false);
                setEditingId(null);
                loadProfile(); // Reset to latest
              }
            }
            else onClose();
          }}>
            <Text style={styles.cancelButton}>{(isEditing || showHistory) ? 'Atrás' : 'Cerrar'}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>
            {showHistory ? 'Historial Físico' : (editingId ? 'Editar Medida' : 'Perfil Físico')}
          </Text>
          {isEditing ? (
            <TouchableOpacity onPress={handleSave} disabled={loading}>
              <Text style={styles.saveButton}>Guardar</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 60 }} />
          )}
        </View>

        {showHistory ? renderHistory() : (!isEditing ? renderReadOnly() : (
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Medidas Básicas</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Edad</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="Años"
                  placeholderTextColor={colors.text.tertiary}
                  value={formData.age?.toString() || ''}
                  onChangeText={(text) => updateNumericField('age', text)}
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.label}>Peso (kg)</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    placeholder="kg"
                    placeholderTextColor={colors.text.tertiary}
                    value={formData.weight?.toString() || ''}
                    onChangeText={(text) => updateNumericField('weight', text)}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 10 }]}>
                  <Text style={styles.label}>Altura (cm)</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    placeholder="cm"
                    placeholderTextColor={colors.text.tertiary}
                    value={formData.height?.toString() || ''}
                    onChangeText={(text) => updateNumericField('height', text)}
                  />
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Composición y Perímetros (Opcional)</Text>
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.label}>Grasa (%)</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    placeholder="%"
                    placeholderTextColor={colors.text.tertiary}
                    value={formData.bodyFat?.toString() || ''}
                    onChangeText={(text) => updateNumericField('bodyFat', text)}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 10 }]}>
                  <Text style={styles.label}>Músculo (kg)</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    placeholder="kg"
                    placeholderTextColor={colors.text.tertiary}
                    value={formData.muscleMass?.toString() || ''}
                    onChangeText={(text) => updateNumericField('muscleMass', text)}
                  />
                </View>
              </View>
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.label}>Cintura (cm)</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    placeholder="cm"
                    placeholderTextColor={colors.text.tertiary}
                    value={formData.waist?.toString() || ''}
                    onChangeText={(text) => updateNumericField('waist', text)}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 10 }]}>
                  <Text style={styles.label}>Brazo (cm)</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    placeholder="cm"
                    placeholderTextColor={colors.text.tertiary}
                    value={formData.arm?.toString() || ''}
                    onChangeText={(text) => updateNumericField('arm', text)}
                  />
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ubicación</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>País</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej. España"
                  placeholderTextColor={colors.text.tertiary}
                  value={formData.country}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, country: text }))}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Ciudad</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej. Madrid"
                  placeholderTextColor={colors.text.tertiary}
                  value={formData.city}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, city: text }))}
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Género</Text>
              <View style={styles.genderContainer}>
                {(['male', 'female', 'other'] as const).map((gender) => (
                  <TouchableOpacity
                    key={gender}
                    style={[
                      styles.genderButton,
                      formData.gender === gender && styles.genderButtonSelected
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, gender }))}
                  >
                    <Text style={[
                      styles.genderText,
                      formData.gender === gender && styles.genderTextSelected
                    ]}>
                      {gender === 'male' ? 'Hombre' : gender === 'female' ? 'Mujer' : 'Otro'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Nivel de Actividad</Text>
              <View style={styles.pickerContainer}>
                {ACTIVITY_LEVEL_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.pickerButton,
                      formData.activityLevel === opt.value && styles.pickerButtonSelected
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, activityLevel: opt.value as UserProfile['activityLevel'] }))}
                  >
                    <Text style={[
                      styles.pickerText,
                      formData.activityLevel === opt.value && styles.pickerTextSelected
                    ]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={{ height: 50 }} />
          </ScrollView>
        ))}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  cancelButton: {
    color: colors.text.secondary,
    fontSize: 16,
  },
  saveButton: {
    color: colors.button.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.accent.yellow,
    marginBottom: 15,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    color: colors.text.secondary,
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.background.tertiary,
    borderRadius: 12,
    padding: 15,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  row: {
    flexDirection: 'row',
  },
  genderContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background.tertiary,
    borderRadius: 12,
    padding: 4,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  genderButtonSelected: {
    backgroundColor: colors.button.primary,
  },
  genderText: {
    color: colors.text.secondary,
    fontWeight: '600',
  },
  genderTextSelected: {
    color: '#fff',
  },
  // New ReadOnly Styles
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 60,
  },
  emptyText: {
    color: colors.text.secondary,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  primaryButton: {
    backgroundColor: colors.button.primary,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  lastUpdateCard: {
    backgroundColor: colors.background.tertiary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border.light,
    alignItems: 'center',
  },
  lastUpdateLabel: {
    color: colors.text.tertiary,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  metricsList: {
    backgroundColor: colors.background.secondary,
    borderRadius: 24,
    padding: 10,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light + '40',
  },
  metricRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  metricValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  unitText: {
    fontSize: 12,
    color: colors.text.tertiary,
    fontWeight: '600',
  },
  metricLabel: {
    color: colors.text.secondary,
    fontSize: 15,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  infoLabel: {
    color: colors.text.secondary,
    fontSize: 15,
  },
  infoValue: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    maxWidth: '60%',
    textAlign: 'right',
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.button.primary + '40',
    backgroundColor: colors.button.primary + '10',
  },
  updateButtonText: {
    color: colors.button.primary,
    fontWeight: '700',
    marginLeft: 10,
  },
  // Picker Styles
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pickerButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.background.tertiary,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  pickerButtonSelected: {
    backgroundColor: colors.button.primary,
    borderColor: colors.button.primary,
  },
  pickerText: {
    color: colors.text.secondary,
    fontSize: 13,
    fontWeight: '600',
  },
  pickerTextSelected: {
    color: '#fff',
  },
  // History Styles
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  historyDate: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  historyDetails: {
    color: colors.text.tertiary,
    fontSize: 13,
    marginTop: 2,
  },
  diffBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  // New Analytics Styles
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    backgroundColor: colors.background.tertiary,
    borderRadius: 12,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  tabText: {
    color: colors.text.tertiary,
    fontSize: 12,
    fontWeight: '700',
  },
  tabTextActive: {
    color: colors.accent.yellow,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 25,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.background.tertiary,
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  summaryTitle: {
    color: colors.text.tertiary,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '900',
    marginVertical: 4,
  },
  summaryPeriod: {
    color: colors.text.tertiary,
    fontSize: 10,
    fontStyle: 'italic',
  }
});
