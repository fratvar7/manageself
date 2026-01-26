import React, { useState } from 'react';
import { View, Modal, Text, TouchableOpacity, Alert } from 'react-native';
import { WorkoutList } from '../../components/WorkoutList';
import { WorkoutForm } from '../../components/WorkoutForm';
import { WorkoutDetailView } from '../../components/WorkoutDetailView';
import { ExerciseManager } from '../../components/ExerciseManager';
import { WorkoutSession } from '../../components/WorkoutSession';
import { PhysiologicalProfileModal } from '../../components/PhysiologicalProfileModal';
import { Workout, WorkoutLog } from '../../types';
import { WorkoutService } from '../../services/workoutService';
import { useAuth } from '../../contexts/AuthContext';
import { colors } from '../../css/colors';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ensureDate } from '../../utils/dateUtils';
import { ConfirmModal } from '../../components/ConfirmModal';

export default function WorkoutsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isManagerVisible, setIsManagerVisible] = useState(false);
  const [isProfileVisible, setIsProfileVisible] = useState(false);
  const [isLogMode, setIsLogMode] = useState(false);
  const [isEditingLog, setIsEditingLog] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [activeSession, setActiveSession] = useState<Workout | null>(null);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [recentLogs, setRecentLogs] = useState<WorkoutLog[]>([]);
  const [logToDelete, setLogToDelete] = useState<{ id: string; name: string } | null>(null);
  const [saveAsRoutineData, setSaveAsRoutineData] = useState<any | null>(null);

  const loadLogs = React.useCallback(async () => {
    if (!user) return;
    try {
      const logs = await WorkoutService.getWorkoutLogs(user.uid);
      setRecentLogs(logs);
    } catch {
      // Error handled
    }
  }, [user]);

  React.useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleCreateNew = () => {
    setEditingWorkout(null);
    setIsLogMode(false);
    setIsEditingLog(false);
    setIsReadOnly(false);
    setIsFormVisible(true);
  };

  const handleEdit = (workout: Workout) => {
    setEditingWorkout(workout);
    setIsLogMode(false);
    setIsEditingLog(false);
    setIsReadOnly(false);
    setIsFormVisible(true);
  };

  const handleView = (workout: Workout) => {
    setEditingWorkout(workout);
    setIsLogMode(false);
    setIsReadOnly(true);
    setIsFormVisible(true);
  };

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const handleSubmit = async (workoutData: any) => {
    if (!user) return;

    try {
      if (isLogMode) {
        if (isEditingLog && editingWorkout) {
          const logUpdate = {
            name: workoutData.name,
            date: workoutData.date,
            duration: workoutData.duration,
            exercises: workoutData.exercises.map((ex: any) => ({
              id: ex.id,
              name: ex.name,
              muscleGroup: ex.muscleGroup,
              supersetId: ex.supersetId,
              sets: ex.sets.map((s: any) => ({
                id: s.id,
                reps: s.reps,
                weight: s.weight,
                completed: true
              }))
            }))
          };
          await WorkoutService.updateWorkoutLog(editingWorkout.id, logUpdate);
        } else {
          const logData = {
            userId: user.uid,
            workoutId: editingWorkout?.id || undefined,
            name: workoutData.name,
            date: workoutData.date,
            duration: workoutData.duration,
            exercises: workoutData.exercises.map((ex: any) => ({
              id: ex.id,
              name: ex.name,
              muscleGroup: ex.muscleGroup,
              supersetId: ex.supersetId,
              sets: ex.sets.map((s: any) => ({
                id: s.id,
                reps: s.reps,
                weight: s.weight,
                completed: true
              }))
            }))
          };
          await WorkoutService.saveWorkoutLog(logData);

          if (!editingWorkout) {
            setSaveAsRoutineData(workoutData);
            return;
          }
        }
      } else {
        if (editingWorkout) {
          await WorkoutService.updateWorkout(editingWorkout.id, workoutData);
        } else {
          await WorkoutService.createWorkout(user.uid, workoutData);
        }
      }
      setIsFormVisible(false);
      loadLogs();
    } catch {
      // Error handled
    }
  };

  const handleViewLog = (log: WorkoutLog) => {
    const logAsWorkout: Workout = {
      id: log.id,
      userId: log.userId,
      name: log.name,
      description: `Realizado el ${ensureDate(log.date).toLocaleDateString()}`,
      muscleGroups: Array.from(new Set(log.exercises.map(e => e.muscleGroup))),
      exercises: log.exercises.map(ex => ({
        id: ex.id,
        name: ex.name,
        muscleGroup: ex.muscleGroup,
        supersetId: ex.supersetId,
        sets: ex.sets.map(s => ({
          id: s.id,
          reps: s.reps,
          weight: s.weight,
          restTime: 60,
          completed: true
        })),
        libraryExerciseId: '',
        type: 'strength',
        notes: '',
        order: 0
      })),
      createdAt: log.date,
      updatedAt: log.date,
      duration: log.duration
    };

    setEditingWorkout(logAsWorkout);
    setIsLogMode(true);
    setIsEditingLog(true);
    setIsReadOnly(true);
    setIsFormVisible(true);
  };

  const handleLogWorkout = () => {
    setIsPickerVisible(true);
  };

  const onConfirmLogSelection = (workout?: Workout) => {
    setIsPickerVisible(false);
    setEditingWorkout(workout || null);
    setIsLogMode(true);
    setIsEditingLog(false);
    setIsReadOnly(false);
    setIsFormVisible(true);
  };

  const handleDeleteLog = (logId: string, logName: string) => {
    setLogToDelete({ id: logId, name: logName });
  };

  const confirmSaveAsRoutine = async () => {
    if (!saveAsRoutineData || !user) return;
    try {
      await WorkoutService.createWorkout(user.uid, {
        name: saveAsRoutineData.name,
        description: saveAsRoutineData.description || '',
        muscleGroups: saveAsRoutineData.muscleGroups || [],
        exercises: saveAsRoutineData.exercises || []
      });
    } finally {
      setSaveAsRoutineData(null);
      setIsFormVisible(false);
    }
  };

  const confirmDeleteLog = async () => {
    if (!logToDelete) return;
    try {
      await WorkoutService.deleteWorkoutLog(logToDelete.id);
      setLogToDelete(null);
      loadLogs();
    } catch {
      Alert.alert('Error', 'No se pudo eliminar el registro');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0D1117' }}>
      <WorkoutList
        onViewWorkout={handleView}
        onEditWorkout={handleEdit}
        onCreateNew={handleCreateNew}
        onOpenManager={() => setIsManagerVisible(true)}
        onOpenSession={setActiveSession}
        onLogWorkout={handleLogWorkout}
        onOpenProfile={() => setIsProfileVisible(true)}
        recentLogs={recentLogs}
        onViewLog={handleViewLog}
        onDeleteLog={handleDeleteLog}
      />

      <PhysiologicalProfileModal
        visible={isProfileVisible}
        onClose={() => setIsProfileVisible(false)}
      />

      <ExerciseManager
        visible={isManagerVisible}
        onClose={() => setIsManagerVisible(false)}
      />

      {activeSession && (
        <Modal visible animationType="fade" presentationStyle="fullScreen">
          <WorkoutSession
            workout={activeSession}
            onClose={() => setActiveSession(null)}
            onComplete={() => setActiveSession(null)}
          />
        </Modal>
      )}

      <Modal visible={isFormVisible} animationType="slide" presentationStyle="fullScreen">
        {isReadOnly && editingWorkout ? (
          <WorkoutDetailView
            workout={editingWorkout}
            onClose={() => setIsFormVisible(false)}
            onEdit={() => setIsReadOnly(false)}
            onStart={() => {
              setIsFormVisible(false);
              setActiveSession(editingWorkout);
            }}
          />
        ) : (
          <WorkoutForm
            initialData={editingWorkout}
            onSubmit={handleSubmit}
            onCancel={() => setIsFormVisible(false)}
            isLogMode={isLogMode}
            isEditingLog={isEditingLog}
          />
        )}
      </Modal>

      <Modal visible={isPickerVisible} animationType="slide" presentationStyle="fullScreen">
        <View style={{ flex: 1, backgroundColor: '#0B0C15', padding: 20, paddingTop: insets.top + 20 }}>
          <WorkoutList
            mode="picker"
            onSelectWorkout={onConfirmLogSelection}
            onCreateNew={() => onConfirmLogSelection(undefined)}
            onOpenManager={() => {}}
            onOpenSession={() => {}}
            onLogWorkout={() => {}}
            onOpenProfile={() => {}}
            ListHeaderComponent={
              <View style={{ marginBottom: 20 }}>
                <TouchableOpacity
                  style={{
                    backgroundColor: colors.accent.primary + '15',
                    padding: 18,
                    borderRadius: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: colors.accent.primary,
                    borderStyle: 'dashed'
                  }}
                  onPress={() => onConfirmLogSelection(undefined)}
                >
                  <Ionicons name="add-circle-outline" size={24} color={colors.accent.primary} />
                  <Text style={{ color: colors.accent.primary, fontWeight: 'bold', fontSize: 16, marginLeft: 10 }}>
                    Registrar Entrenamiento Libre
                  </Text>
                </TouchableOpacity>
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800', marginTop: 30, marginBottom: 15, letterSpacing: -0.5 }}>
                  Seleccionar Rutina Base
                </Text>
              </View>
            }
          />

          <TouchableOpacity
            style={{
              position: 'absolute',
              bottom: 40,
              alignSelf: 'center',
              backgroundColor: '#fff',
              paddingHorizontal: 35,
              paddingVertical: 14,
              borderRadius: 30,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 5
            }}
            onPress={() => setIsPickerVisible(false)}
          >
            <Text style={{ fontWeight: '800', color: '#000', fontSize: 15 }}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <ConfirmModal
        visible={!!logToDelete}
        title="Eliminar Registro"
        message={`¿Estás seguro de que quieres eliminar el registro de "${logToDelete?.name}"? Esta acción no se puede deshacer.`}
        onConfirm={confirmDeleteLog}
        onCancel={() => setLogToDelete(null)}
        confirmText="Eliminar"
        isDestructive={true}
      />

      <ConfirmModal
        visible={!!saveAsRoutineData}
        title="Guardar como Rutina"
        message="¿Quieres guardar este entrenamiento como una nueva rutina para usarla más adelante?"
        onConfirm={confirmSaveAsRoutine}
        onCancel={() => {
            setSaveAsRoutineData(null);
            setIsFormVisible(false);
        }}
        confirmText="Sí, guardar"
        cancelText="No"
        type="info"
      />
    </View>
  );
}
