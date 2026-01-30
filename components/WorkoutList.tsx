import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WorkoutService } from '../services/workoutService';
import { Workout, WorkoutLog } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { WorkoutStyles as styles } from '../css/Components/Workout.styles';
import { colors } from '../css/colors';
import { ensureDate } from '../utils/dateUtils';
import { ConfirmModal } from './ConfirmModal';

interface WorkoutListProps {
  onViewWorkout?: (workout: Workout) => void;
  onEditWorkout?: (workout: Workout) => void;
  onSelectWorkout?: (workout: Workout) => void; // Keeps compatibility for picker mode
  onCreateNew: () => void;
  onOpenManager: () => void;
  onOpenSession: (workout: Workout) => void;
  onLogWorkout: () => void;
  onOpenProfile: () => void;
  mode?: 'default' | 'picker';
  ListHeaderComponent?: React.ReactElement;
  recentLogs?: WorkoutLog[];
  onViewLog?: (log: WorkoutLog) => void;
  onDeleteLog?: (logId: string, logName: string) => void;
}

interface WorkoutItemProps {
  item: Workout;
  onPress: (workout: Workout) => void;
  onLongPress?: (workout: Workout) => void;
  onDelete: (id: string, name: string) => void;
  onPlay: (workout: Workout) => void;
}

const WorkoutItem = React.memo(({ item, onPress, onLongPress, onDelete, onPlay }: WorkoutItemProps) => (
  <TouchableOpacity
    style={styles.workoutCard}
    onPress={() => onPress(item)}
    onLongPress={() => onLongPress && onLongPress(item)}
    delayLongPress={500}
  >
    <View style={styles.workoutHeader}>
      <View style={{ flex: 1 }}>
        <Text style={styles.workoutName}>{item.name}</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 15, alignItems: 'center' }}>
        <TouchableOpacity onPress={() => onPlay(item)}>
          <Ionicons name="play-circle" size={28} color={colors.button.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDelete(item.id, item.name)}>
          <Ionicons name="trash-outline" size={20} color={colors.status.error} />
        </TouchableOpacity>
      </View>
    </View>

    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.muscleGroupsContainer}
      contentContainerStyle={{ gap: 6 }}
    >
      {item.muscleGroups.map((mg, index) => (
        <View key={index} style={styles.muscleTag}>
          <Text style={styles.muscleTagText}>{mg}</Text>
        </View>
      ))}
    </ScrollView>

    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12, gap: 4 }}>
      {item.exercises.map((ex) => (
        <Text key={ex.id} style={{ color: colors.text.tertiary, fontSize: 13 }}>
          · {ex.name}{'  '}
        </Text>
      ))}
    </View>

    <View style={styles.workoutMeta}>
      <Text style={styles.exerciseCount}>
        <Ionicons name="fitness-outline" size={14} /> {item.exercises.length} ejercicios
      </Text>
      {item.lastPerformedAt && (
        <Text style={styles.lastPerformed}>
          Último: {ensureDate(item.lastPerformedAt).toLocaleDateString()}
        </Text>
      )}
    </View>
  </TouchableOpacity>
));

export const WorkoutList: React.FC<WorkoutListProps> = ({
  onSelectWorkout,
  onViewWorkout,
  onEditWorkout,
  onCreateNew,
  onOpenManager,
  onOpenSession,
  onLogWorkout,
  onOpenProfile,
  mode = 'default',
  ListHeaderComponent,
  recentLogs,
  onViewLog,
  onDeleteLog
}) => {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [workoutToDelete, setWorkoutToDelete] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = WorkoutService.subscribeToWorkouts(user.uid, (data) => {
      setWorkouts(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleDeleteWorkout = useCallback((id: string, name: string) => {
    setWorkoutToDelete({ id, name });
  }, []);

  const confirmDelete = async () => {
    if (!workoutToDelete) return;
    try {
      await WorkoutService.deleteWorkout(workoutToDelete.id);
      setWorkoutToDelete(null);
    } catch {
      Alert.alert('Error', 'No se pudo eliminar la rutina');
    }
  };

  const renderWorkout = useCallback(({ item }: { item: Workout }) => (
    <WorkoutItem
      item={item}
      onPress={mode === 'picker' ? (onSelectWorkout || (() => {})) : (onViewWorkout || (() => {}))}
      onLongPress={mode === 'default' ? onEditWorkout : undefined}
      onDelete={handleDeleteWorkout}
      onPlay={onOpenSession}
    />
  ), [mode, onSelectWorkout, onViewWorkout, onEditWorkout, handleDeleteWorkout, onOpenSession]);

  const workoutKeyExtractor = useCallback((item: Workout) => item.id, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={{ color: '#fff', textAlign: 'center', marginTop: 50 }}>Cargando rutinas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {mode === 'default' && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <Text style={[styles.title, { marginBottom: 0 }]}>Mis Rutinas</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              style={{ padding: 8, backgroundColor: colors.background.tertiary, borderRadius: 10, borderWidth: 1, borderColor: colors.border.light }}
              onPress={onOpenProfile}
            >
              <Ionicons name="person-circle-outline" size={24} color={colors.text.secondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background.tertiary, paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: colors.border.light }}
              onPress={onOpenManager}
            >
              <Ionicons name="library-outline" size={18} color={colors.button.primary} />
              <Text style={{ color: '#fff', marginLeft: 8, fontWeight: '600' }}>Ejercicios</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <FlatList
        ListHeaderComponent={ListHeaderComponent}
        data={workouts}
        renderItem={renderWorkout}
        keyExtractor={workoutKeyExtractor}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={3}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="fitness-outline" size={64} color={colors.text.tertiary} />
            <Text style={styles.emptyStateText}>No tienes rutinas creadas</Text>
            <TouchableOpacity
              style={[styles.muscleTag, { marginTop: 20, paddingHorizontal: 20, paddingVertical: 10 }]}
              onPress={onCreateNew}
            >
              <Text style={styles.muscleTagText}>Crear mi primera rutina</Text>
            </TouchableOpacity>
          </View>
        }
        ListFooterComponent={
          mode === 'default' && recentLogs && recentLogs.length > 0 ? (
            <View style={{ marginTop: 25, paddingBottom: 100 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                <Text style={{ color: colors.text.secondary, fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5 }}>HISTORIAL DE ENTRENOS</Text>
              </View>
              {recentLogs.map((log) => {
                const uniqueMuscles = Array.from(new Set(log.exercises.map(ex => ex.muscleGroup))).join(' • ');
                return (
                  <TouchableOpacity
                    key={log.id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 14,
                      paddingHorizontal: 16,
                      backgroundColor: colors.background.tertiary,
                      borderRadius: 14,
                      marginBottom: 10,
                      borderWidth: 1,
                      borderColor: colors.border.light,
                      borderLeftWidth: 4,
                      borderLeftColor: colors.accent.primary,
                    }}
                    onPress={() => { if (onViewLog) onViewLog(log); }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }} numberOfLines={1}>{log.name}</Text>
                      <Text style={{ color: colors.accent.primary, fontSize: 10, fontWeight: '700', marginTop: 1, textTransform: 'uppercase' }}>{uniqueMuscles}</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 }}>
                        {log.exercises.map((ex, index) => (
                          <Text
                            key={index}
                            style={{ color: colors.text.secondary, fontSize: 12, fontStyle: 'italic' }}
                          >
                            · {ex.name}{'  '}
                          </Text>
                        ))}
                      </View>
                      <Text style={{ color: colors.text.tertiary, fontSize: 11, marginTop: 4 }}>
                        {ensureDate(log.date).toLocaleDateString()} • {Math.round((log.duration || 0) / 60)} min
                      </Text>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                      <TouchableOpacity
                        style={{ padding: 8 }}
                        onPress={(e) => {
                          e.stopPropagation();
                          if (onDeleteLog) onDeleteLog(log.id, log.name);
                        }}
                      >
                        <Ionicons name="trash-outline" size={16} color={colors.status.error + '90'} />
                      </TouchableOpacity>
                      <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : <View style={{ height: 100 }} />
        }
      />

      {mode === 'default' && (
        <>
          <TouchableOpacity style={styles.fabSecondary} onPress={onLogWorkout}>
            <Ionicons name="clipboard-outline" size={24} color={colors.button.primary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.fab} onPress={onCreateNew}>
            <Ionicons name="add" size={30} color="#fff" />
          </TouchableOpacity>
        </>
      )}

      <ConfirmModal
        visible={!!workoutToDelete}
        title="Eliminar Rutina"
        message={`¿Estás seguro de que quieres eliminar "${workoutToDelete?.name}"? Esta acción no se puede deshacer.`}
        onConfirm={confirmDelete}
        onCancel={() => setWorkoutToDelete(null)}
        confirmText="Eliminar"
        isDestructive={true}
      />
    </View>
  );
};
