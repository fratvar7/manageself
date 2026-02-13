import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ExerciseService } from '../services/exercisesService';
import { useAuth } from '../contexts/AuthContext';
import { Workout, WorkoutExercise, WorkoutSet, LibraryExercise } from '../types';
import { WorkoutStyles as styles } from '../css/Components/Workout.styles';
import { NumericInput } from './NumericInput';
import { colors } from '../css/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface WorkoutFormProps {
  initialData?: Workout | null;
  onSubmit: (workout: Omit<Workout, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
  isLogMode?: boolean;
  isEditingLog?: boolean;
}

export const WorkoutForm: React.FC<WorkoutFormProps> = ({ initialData, onSubmit, onCancel, isLogMode = false, isEditingLog = false }) => {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [exercises, setExercises] = useState<WorkoutExercise[]>(initialData?.exercises || []);
  const [libraryExercises, setLibraryExercises] = useState<LibraryExercise[]>([]);
  const [showExerciseSearch, setShowExerciseSearch] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [searchTarget, setSearchTarget] = useState<{ type: 'new' | 'superset', supersetId?: string }>({ type: 'new' });

  const [searchQuery, setSearchQuery] = useState('');

  // Log Mode States
  const [logDate] = useState(new Date());
  const [logDuration, setLogDuration] = useState(
    initialData?.duration ? Math.round(initialData.duration / 60).toString() : '60'
  );
  const [isSaving, setIsSaving] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  React.useEffect(() => {
    const loadLibrary = async () => {
      if (!user) return;
      try {
        const data = await ExerciseService.getExercises(user.uid);
        setLibraryExercises(data);
      } catch {
        /* Error handled by ExerciseService or ignored for UI stability */
      }
    };
    if (showExerciseSearch) loadLibrary();
  }, [user, showExerciseSearch]);

  const importWorkout = (workout: Workout) => {
    setName(workout.name);
    setDescription(workout.description || '');
    setExercises(workout.exercises.map(ex => ({
      ...ex,
      id: Math.random().toString(36).substr(2, 9),
      sets: ex.sets.map(s => ({ ...s, id: Math.random().toString(36).substr(2, 9), completed: false }))
    })));
    setShowImportModal(false);
  };

  const filteredLibrary = useMemo(() => {
    if (!searchQuery.trim()) return libraryExercises;
    const query = searchQuery.toLowerCase();
    return libraryExercises.filter(ex =>
      ex.name.toLowerCase().includes(query) ||
      ex.muscleGroup.toLowerCase().includes(query)
    );
  }, [searchQuery, libraryExercises]);

  const addExercise = (libEx: LibraryExercise) => {
    const newEx: WorkoutExercise = {
      id: Math.random().toString(36).substr(2, 9),
      libraryExerciseId: libEx.id,
      name: libEx.name,
      muscleGroup: libEx.muscleGroup,
      type: 'strength',
      notes: '',
      sets: [{ id: Math.random().toString(36).substr(2, 9), reps: 10, weight: 0, restTime: 60, completed: false }],
      order: exercises.length,
      supersetId: searchTarget.type === 'superset' ? searchTarget.supersetId : undefined
    };

    setExercises([...exercises, newEx]);
    setShowExerciseSearch(false);
    setSearchQuery('');

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const removeExercise = (id: string) => {
    setExercises(exercises.filter(ex => ex.id !== id));
  };

  const moveExercise = (index: number, direction: 'up' | 'down') => {
    const newExs = [...exercises];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx >= 0 && targetIdx < newExs.length) {
      [newExs[index], newExs[targetIdx]] = [newExs[targetIdx], newExs[index]];
      setExercises(newExs);
    }
  };

  const addSet = (exerciseId: string) => {
    setExercises(exercises.map(ex => {
      if (ex.id !== exerciseId) return ex;
      const lastSet = ex.sets[ex.sets.length - 1];
      return {
        ...ex,
        sets: [...ex.sets, {
          id: Math.random().toString(36).substr(2, 9),
          reps: lastSet?.reps || 10,
          weight: lastSet?.weight || 0,
          restTime: lastSet?.restTime || 60,
          completed: false
        }]
      };
    }));

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const updateSet = (exerciseId: string, setId: string, updates: Partial<WorkoutSet>) => {
    const exercise = exercises.find(ex => ex.id === exerciseId);

    setExercises(exercises.map(ex => {
      // Si estamos actualizando el descanso y el ejercicio es parte de un superset,
      // actualizamos el descanso para todos los ejercicios del mismo grupo en esa serie (mismo índice)
      if (updates.restTime !== undefined && exercise?.supersetId && ex.supersetId === exercise.supersetId) {
        const targetSetIndex = exercise.sets.findIndex(s => s.id === setId);
        if (targetSetIndex !== -1) {
          return {
            ...ex,
            sets: ex.sets.map((s, idx) => idx === targetSetIndex ? { ...s, restTime: updates.restTime as number } : s)
          };
        }
      }

      if (ex.id !== exerciseId) return ex;
      return {
        ...ex,
        sets: ex.sets.map(s => s.id === setId ? { ...s, ...updates } : s)
      };
    }));
  };

  const removeSet = (exerciseId: string, setIndex: number) => {
    setExercises(exercises.map(ex => {
      if (ex.id !== exerciseId || ex.sets.length <= 1) return ex;
      const newSets = [...ex.sets];
      newSets.splice(setIndex, 1);
      return { ...ex, sets: newSets };
    }));
  };

  const handleCreateSuperset = (exercise: WorkoutExercise) => {
    let sId = exercise.supersetId;
    if (!sId) {
      sId = Math.random().toString(36).substr(2, 9);
      setExercises(exercises.map(ex => ex.id === exercise.id ? { ...ex, supersetId: sId } : ex));
    }
    setSearchTarget({ type: 'superset', supersetId: sId });
    setShowExerciseSearch(true);
  };

  const handleSave = async () => {
    if (isSaving) return;
    if (!name.trim()) return Alert.alert('Error', 'La rutina debe tener un nombre');
    if (exercises.length === 0) return Alert.alert('Error', 'Añade al menos un ejercicio');

    try {
      setIsSaving(true);
      const payload: any = {
        name: name.trim(),
        description: description.trim(),
        exercises: exercises.map((ex, idx) => ({ ...ex, order: idx })),
        muscleGroups: Array.from(new Set(exercises.map(ex => ex.muscleGroup)))
      };

      if (isLogMode) {
        payload.date = logDate;
        payload.duration = parseInt(logDuration) * 60; // to seconds
      }

      await onSubmit(payload);
    } catch {
      Alert.alert('Error', 'No se pudo guardar la rutina');
    } finally {
      setIsSaving(false);
    }
  };

  // Agrupar visualmente
  const renderList = () => {
    const groups: (WorkoutExercise | WorkoutExercise[])[] = [];
    const processedIds = new Set<string>();

    exercises.forEach((ex) => {
      if (processedIds.has(ex.id)) return;

      if (!ex.supersetId) {
        groups.push(ex);
        processedIds.add(ex.id);
      } else {
        const group = exercises.filter(e => e.supersetId === ex.supersetId);
        groups.push(group);
        group.forEach(e => processedIds.add(e.id));
      }
    });

    return groups.map((item, idx) => {
      if (Array.isArray(item)) {
        return (
          <View key={`group-${idx}`} style={styles.supersetBlock}>
            <View style={styles.supersetHeader}>
              <Text style={styles.supersetHeaderText}>
                {item.length === 2 ? 'BISERIE' : 'TRISERIE'}
              </Text>
            </View>
            {item.map((ex, exIdx) => (
              <React.Fragment key={ex.id}>
                {exIdx > 0 && <View style={styles.supersetDivider} />}
                <View style={styles.exerciseInSuperset}>
                  {renderExerciseItem(ex, true, exIdx === item.length - 1)}
                </View>
              </React.Fragment>
            ))}
          </View>
        );
      }
      return <View key={item.id} style={styles.exerciseItem}>{renderExerciseItem(item, false, false)}</View>;
    });
  };

  const renderExerciseItem = (ex: WorkoutExercise, inSuperset: boolean, isLastInSuperset: boolean) => {
    const groupCount = exercises.filter(e => e.supersetId === ex.supersetId).length;

    return (
      <View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>{ex.name}</Text>
            <Text style={{ color: colors.text.tertiary, fontSize: 12 }}>{ex.muscleGroup}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {!inSuperset && (
              <View style={{ flexDirection: 'row', gap: 5, marginRight: 10 }}>
                <TouchableOpacity onPress={() => moveExercise(exercises.indexOf(ex), 'up')} disabled={exercises.indexOf(ex) === 0}>
                  <Ionicons name="chevron-up" size={20} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => moveExercise(exercises.indexOf(ex), 'down')} disabled={exercises.indexOf(ex) === exercises.length - 1}>
                  <Ionicons name="chevron-down" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity onPress={() => removeExercise(ex.id)}>
              <Ionicons name="trash-outline" size={20} color={colors.status.error} />
            </TouchableOpacity>
          </View>
        </View>

        {ex.sets.map((set, setIdx) => (
          <View key={set.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Text style={{ color: colors.text.tertiary, width: 25, fontWeight: '700', marginTop: setIdx === 0 ? 15 : 0 }}>{setIdx + 1}</Text>

            <View style={{ flex: 1 }}>
              {setIdx === 0 && <Text style={{ fontSize: 10, color: colors.text.tertiary, marginBottom: 4, fontWeight: '700' }}>PESO (KG)</Text>}
              <NumericInput
                style={{ backgroundColor: colors.background.secondary, color: '#fff', padding: 8, borderRadius: 8, textAlign: 'center' }}
                value={set.weight}
                onChangeValue={(val) => updateSet(ex.id, set.id, { weight: val })}
              />
            </View>

            <View style={{ flex: 1 }}>
              {setIdx === 0 && <Text style={{ fontSize: 10, color: colors.text.tertiary, marginBottom: 4, fontWeight: '700' }}>REPETICIONES</Text>}
              <TextInput
                style={{ backgroundColor: colors.background.secondary, color: '#fff', padding: 8, borderRadius: 8, textAlign: 'center' }}
                keyboardType="numeric"
                value={set.reps.toString()}
                onChangeText={(val) => updateSet(ex.id, set.id, { reps: parseInt(val) || 0 })}
              />
            </View>

            {(!inSuperset || isLastInSuperset) && (
              <View style={{ flex: 1 }}>
                {setIdx === 0 && (
                  <Text style={{ fontSize: 10, color: colors.text.tertiary, marginBottom: 4, fontWeight: '700' }}>
                    {isLogMode ? 'DESC. REAL (S)' : 'DESCANSO (S)'}
                  </Text>
                )}
                <TextInput
                  style={{ backgroundColor: colors.background.secondary, color: '#fff', padding: 8, borderRadius: 8, textAlign: 'center' }}
                  keyboardType="numeric"
                  value={isLogMode ? (set.actualRestTime ?? set.restTime).toString() : set.restTime.toString()}
                  onChangeText={(val) => {
                    const numVal = parseInt(val) || 0;
                    if (isLogMode) {
                      updateSet(ex.id, set.id, { actualRestTime: numVal });
                    } else {
                      updateSet(ex.id, set.id, { restTime: numVal });
                    }
                  }}
                />
              </View>
            )}

            {inSuperset && !isLastInSuperset && <View style={{ flex: 1 }} />}

            <TouchableOpacity style={{ marginTop: setIdx === 0 ? 15 : 0 }} onPress={() => removeSet(ex.id, setIdx)}>
              <Ionicons name="remove-circle-outline" size={20} color={colors.text.tertiary} />
            </TouchableOpacity>
          </View>
        ))}

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} onPress={() => addSet(ex.id)}>
            <Ionicons name="add-circle-outline" size={18} color={colors.button.primary} />
            <Text style={{ color: colors.button.primary, marginLeft: 5, fontSize: 13, fontWeight: '600' }}>Añadir Serie</Text>
          </TouchableOpacity>

          {groupCount < 3 && (
            <TouchableOpacity
              style={{ backgroundColor: colors.accent.yellow + '20', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}
              onPress={() => handleCreateSuperset(ex)}
            >
              <Text style={{ color: colors.accent.yellow, fontSize: 12, fontWeight: '700' }}>
                {groupCount === 1 ? '+ BISERIE' : '+ TRISERIE'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <TouchableOpacity onPress={onCancel}><Ionicons name="close" size={28} color="#fff" /></TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>
          {isEditingLog ? 'Editar Entrenamiento' : (isLogMode ? 'Nuevo Entrenamiento' : (initialData ? 'Editar Rutina' : 'Nueva Rutina'))}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      {isLogMode && (
        <View style={{ marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', gap: 15, marginBottom: 15 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text.secondary, fontSize: 12, marginBottom: 5 }}>DURACIÓN (MIN)</Text>
              <TextInput
                style={{ backgroundColor: colors.background.tertiary, color: '#fff', padding: 12, borderRadius: 12, fontSize: 16 }}
                keyboardType="numeric"
                value={logDuration}
                onChangeText={setLogDuration}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text.secondary, fontSize: 12, marginBottom: 5 }}>FECHA</Text>
              <View style={{ backgroundColor: colors.background.tertiary, padding: 12, borderRadius: 12, justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 16 }}>{logDate.toLocaleDateString()}</Text>
              </View>
            </View>
          </View>
          <View style={{ height: 1, backgroundColor: colors.border.default }} />
        </View>
      )}

      <ScrollView ref={scrollViewRef} showsVerticalScrollIndicator={false}>
        <TextInput
          style={{ fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 10 }}
          placeholder="Nombre de la rutina" placeholderTextColor={colors.text.tertiary}
          value={name} onChangeText={setName}
        />
        <TextInput
          style={{ fontSize: 16, color: colors.text.secondary, marginBottom: 25 }}
          placeholder="Descripción (opcional)" placeholderTextColor={colors.text.tertiary}
          value={description} onChangeText={setDescription} multiline
        />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
          <Text style={{ color: colors.text.secondary, fontSize: 14, fontWeight: '700', textTransform: 'uppercase' }}>Ejercicios</Text>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.button.primary + '20', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}
            onPress={() => { setSearchTarget({ type: 'new' }); setShowExerciseSearch(true); }}
          >
            <Ionicons name="search" size={16} color={colors.button.primary} /><Text style={{ color: colors.button.primary, marginLeft: 5, fontWeight: '600' }}>Buscar ejercicio</Text>
          </TouchableOpacity>
        </View>

        {renderList()}
        <View style={{ height: 135 }} />
      </ScrollView>

      {/* Floating Actions */}
      <View style={{ position: 'absolute', bottom: 30, left: 20, right: 20, flexDirection: 'row', gap: 12 }}>
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 16,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.accent.primary,
          }}
          onPress={() => { setSearchTarget({ type: 'new' }); setShowExerciseSearch(true); }}
        >
            <Ionicons name="add" size={22} color={colors.accent.primary} />
            <Text style={{ color: colors.accent.primary, fontSize: 13, fontWeight: '900', marginLeft: 8, letterSpacing: 1 }}>AÑADIR</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            {
              flex: 1.4,
              backgroundColor: 'rgba(59, 130, 246, 0.25)',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 16,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.button.primary,
            },
            isSaving && { opacity: 0.7 }
          ]}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Text style={{ color: colors.accent.primary, fontSize: 16, fontWeight: '800' }}>
            {isSaving ? 'GUARDANDO...' : 'GUARDAR'}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showExerciseSearch} animationType="slide">
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
            <TouchableOpacity onPress={() => setShowExerciseSearch(false)}><Ionicons name="chevron-back" size={28} color="#fff" /></TouchableOpacity>
            <TextInput
              style={{ flex: 1, backgroundColor: colors.background.tertiary, color: '#fff', marginLeft: 15, padding: 12, borderRadius: 12, fontSize: 16 }}
              placeholder="Buscar..." placeholderTextColor={colors.text.tertiary} value={searchQuery} onChangeText={setSearchQuery}
            />
          </View>
          <FlatList
            data={filteredLibrary}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border.default }} onPress={() => addExercise(item)}>
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>{item.name}</Text>
                <Text style={{ color: colors.text.tertiary, fontSize: 12 }}>{item.muscleGroup} • {item.equipment}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={{ color: colors.text.tertiary, textAlign: 'center', marginTop: 50 }}>No se encontraron ejercicios</Text>}
          />
        </View>
      </Modal>

      {/* Import Modal */}
      <Modal visible={showImportModal} animationType="slide">
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
            <TouchableOpacity onPress={() => setShowImportModal(false)}><Ionicons name="chevron-back" size={28} color="#fff" /></TouchableOpacity>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700', marginLeft: 15 }}>Seleccionar Rutina</Text>
          </View>
          <FlatList
            data={[] as Workout[]} // Cast to avoid 'never' type errors
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border.default }} onPress={() => importWorkout(item)}>
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>{item.name}</Text>
                <Text style={{ color: colors.text.tertiary, fontSize: 12 }}>{item.exercises.length} ejercicios</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={{ color: colors.text.tertiary, textAlign: 'center', marginTop: 50 }}>No tienes rutinas para importar</Text>}
          />
        </View>
      </Modal>
      </View>
    </KeyboardAvoidingView>
  );
};
