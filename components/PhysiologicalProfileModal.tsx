import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserService } from '../services/userService';
import { useAuth } from '../contexts/AuthContext';
import { UserProfile } from '../types';
import { colors } from '../css/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface PhysiologicalProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

export const PhysiologicalProfileModal: React.FC<PhysiologicalProfileModalProps> = ({ visible, onClose }) => {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    age: undefined,
    weight: undefined,
    height: undefined,
    country: '',
    city: '',
    gender: 'other',
    activityLevel: 'moderate'
  });

  useEffect(() => {
    if (visible && user) {
      loadProfile();
    }
  }, [visible, user]);

  const loadProfile = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const latestMetrics = await UserService.getLatestUserMetrics(user.uid);
      if (latestMetrics) {
        setFormData({
          age: latestMetrics.age,
          weight: latestMetrics.weight,
          height: latestMetrics.height,
          country: latestMetrics.country || '',
          city: latestMetrics.city || '',
          gender: latestMetrics.gender || 'other',
          activityLevel: latestMetrics.activityLevel || 'moderate'
        });
      }
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    try {
      setLoading(true);
      await UserService.addUserMetrics(user.uid, formData);
      Alert.alert('Éxito', 'Registro guardado correctamente');
      onClose();
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar el registro');
    } finally {
      setLoading(false);
    }
  };

  const updateNumericField = (field: keyof UserProfile, value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    setFormData(prev => ({ ...prev, [field]: numValue }));
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelButton}>Cancelar</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Perfil Físico</Text>
          <TouchableOpacity onPress={handleSave} disabled={loading}>
            <Text style={styles.saveButton}>Guardar</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Medidas Corporales</Text>

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
        </ScrollView>
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
    paddingVertical: 15,
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
});
