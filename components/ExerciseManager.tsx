import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ExerciseService } from '../services/exercisesService';
import { LibraryExercise } from '../types';
import { WorkoutStyles as styles } from '../css/Components/Workout.styles';
import { colors } from '../css/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useCallback } from 'react';
import { ConfirmModal } from './ConfirmModal';

interface ExerciseManagerProps {
  visible: boolean;
  onClose: () => void;
}

interface ExerciseItemProps {
  item: LibraryExercise;
  onEdit: (item: LibraryExercise) => void;
  onDelete: (id: string, name: string) => void;
}

const ExerciseItem = React.memo(({ item, onEdit, onDelete }: ExerciseItemProps) => (
  <View style={styles.managerItem}>
    <View style={styles.managerItemContent}>
      <Text style={styles.managerItemName}>{item.name}</Text>
      <Text style={styles.managerItemSub}>{item.muscleGroup} • {item.equipment}</Text>
    </View>
    <View style={styles.managerActions}>
      <TouchableOpacity onPress={() => onEdit(item)}>
        <Ionicons name="pencil" size={20} color={colors.text.secondary} />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => onDelete(item.id, item.name)}>
        <Ionicons name="trash-outline" size={20} color={colors.status.error} />
      </TouchableOpacity>
    </View>
  </View>
));

const MUSCLE_GROUPS = ['Todos', 'Pecho', 'Espalda', 'Pierna', 'Hombro', 'Bíceps', 'Tríceps', 'Abdomen'];

export const ExerciseManager: React.FC<ExerciseManagerProps> = ({ visible, onClose }) => {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [exercises, setExercises] = useState<LibraryExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState('Todos');
  const [editingExercise, setEditingExercise] = useState<LibraryExercise | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [exerciseToDelete, setExerciseToDelete] = useState<{ id: string; name: string } | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formMuscle, setFormMuscle] = useState('Pecho');
  const [formEquipment, setFormEquipment] = useState('Mancuernas');

  const loadExercises = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await ExerciseService.getExercises(user.uid);
      setExercises(data);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar los ejercicios');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (visible) loadExercises();
  }, [visible, loadExercises]);

  const filteredExercises = useMemo(() => {
    return exercises.filter(ex => {
      const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMuscle = selectedMuscle === 'Todos' || ex.muscleGroup === selectedMuscle;
      return matchesSearch && matchesMuscle;
    });
  }, [exercises, searchQuery, selectedMuscle]);

  const handleDelete = useCallback((id: string, name: string) => {
    setExerciseToDelete({ id, name });
  }, []);

  const confirmDeleteExercise = async () => {
    if (!exerciseToDelete) return;
    try {
      await ExerciseService.deleteExercise(exerciseToDelete.id);
      setExercises(prev => prev.filter(ex => ex.id !== exerciseToDelete.id));
      setExerciseToDelete(null);
    } catch {
      Alert.alert('Error', 'No se pudo eliminar el ejercicio');
    }
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }

    try {
      if (editingExercise) {
        await ExerciseService.updateExercise(editingExercise.id, {
          name: formName.trim(),
          muscleGroup: formMuscle,
          equipment: formEquipment,
        });
      } else {
        await ExerciseService.createExercise(user!.uid, {
          name: formName.trim(),
          muscleGroup: formMuscle,
          equipment: formEquipment,
        });
      }
      setShowForm(false);
      loadExercises();
    } catch {
      Alert.alert('Error', 'No se pudo guardar el ejercicio');
    }
  };

  const openForm = useCallback((ex?: LibraryExercise) => {
    if (ex) {
      setEditingExercise(ex);
      setFormName(ex.name);
      setFormMuscle(ex.muscleGroup);
      setFormEquipment(ex.equipment || 'Mancuernas');
    } else {
      setEditingExercise(null);
      setFormName('');
      setFormMuscle('Pecho');
      setFormEquipment('Mancuernas');
    }
    setShowForm(true);
  }, []);

  const renderExercise = useCallback(({ item }: { item: LibraryExercise }) => (
    <ExerciseItem
      item={item}
      onEdit={openForm}
      onDelete={handleDelete}
    />
  ), [openForm, handleDelete]);

  const exerciseKeyExtractor = useCallback((item: LibraryExercise) => item.id, []);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700' }}>Biblioteca de Ejercicios</Text>
          <TouchableOpacity onPress={() => openForm()}>
            <Ionicons name="add" size={30} color={colors.button.primary} />
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.searchInput}
          placeholder="Buscar ejercicio..."
          placeholderTextColor={colors.text.tertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        <View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {MUSCLE_GROUPS.map(mg => (
              <TouchableOpacity
                key={mg}
                style={[styles.filterTag, selectedMuscle === mg && styles.filterTagSelected]}
                onPress={() => setSelectedMuscle(mg)}
              >
                <Text style={[styles.filterTagText, selectedMuscle === mg && styles.filterTagTextSelected]}>
                  {mg}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.button.primary} style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={filteredExercises}
            keyExtractor={exerciseKeyExtractor}
            renderItem={renderExercise}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            removeClippedSubviews={true}
            ListEmptyComponent={
              <Text style={{ color: colors.text.tertiary, textAlign: 'center', marginTop: 50 }}>No hay ejercicios que coincidan</Text>
            }
          />
        )}

        {/* Formulario Modal (Anidado para crear/editar) */}
        <Modal visible={showForm} transparent animationType="fade">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 }}>
            <View style={{ backgroundColor: colors.background.elevated, borderRadius: 20, padding: 20 }}>
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 20 }}>
                {editingExercise ? 'Editar Ejercicio' : 'Nuevo Ejercicio'}
              </Text>

              <Text style={{ color: colors.text.secondary, marginBottom: 8, fontSize: 13 }}>NOMBRE</Text>
              <TextInput
                style={styles.searchInput}
                value={formName}
                onChangeText={setFormName}
                placeholder="Ej. Press Militar con Barra"
                placeholderTextColor={colors.text.tertiary}
              />

              <Text style={{ color: colors.text.secondary, marginBottom: 8, fontSize: 13 }}>GRUPO MUSCULAR</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                {MUSCLE_GROUPS.filter(m => m !== 'Todos').map(m => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.filterTag, formMuscle === m && styles.filterTagSelected]}
                    onPress={() => setFormMuscle(m)}
                  >
                    <Text style={[styles.filterTagText, formMuscle === m && styles.filterTagTextSelected]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={{ color: colors.text.secondary, marginBottom: 8, fontSize: 13 }}>EQUIPAMIENTO</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                {['Mancuernas', 'Barra', 'Polea', 'Máquina', 'Peso Corporal', 'Banda'].map(eq => (
                  <TouchableOpacity
                    key={eq}
                    style={[styles.filterTag, formEquipment === eq && styles.filterTagSelected]}
                    onPress={() => setFormEquipment(eq)}
                  >
                    <Text style={[styles.filterTagText, formEquipment === eq && styles.filterTagTextSelected]}>{eq}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  style={{ flex: 1, backgroundColor: colors.background.tertiary, padding: 15, borderRadius: 12, alignItems: 'center' }}
                  onPress={() => setShowForm(false)}
                >
                  <Text style={{ color: '#fff', fontWeight: '700' }}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ flex: 1, backgroundColor: colors.button.primary, padding: 15, borderRadius: 12, alignItems: 'center' }}
                  onPress={handleSave}
                >
                  <Text style={{ color: '#fff', fontWeight: '700' }}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>

      <ConfirmModal
        visible={!!exerciseToDelete}
        title="Eliminar ejercicio"
        message={`¿Estás seguro de que quieres eliminar "${exerciseToDelete?.name}" de tu biblioteca?`}
        onConfirm={confirmDeleteExercise}
        onCancel={() => setExerciseToDelete(null)}
        confirmText="Eliminar"
        isDestructive={true}
      />
    </Modal>
  );
};
