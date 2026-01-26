import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Easing
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Workout, WorkoutExercise, WorkoutSet } from '../types';
import { WorkoutStyles as styles } from '../css/Components/Workout.styles';
import { colors } from '../css/colors';
import { NumericInput } from './NumericInput';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WorkoutService } from '../services/workoutService';
import { Timestamp } from 'firebase/firestore';

interface WorkoutSessionProps {
  workout: Workout;
  onClose: () => void;
  onComplete: () => void;
}

interface GroupStep {
  exercises: {
    exercise: WorkoutExercise;
    setIndex: number;
    set: WorkoutSet;
  }[];
  restTime: number;
}

export const WorkoutSession: React.FC<WorkoutSessionProps> = ({ workout, onClose, onComplete }) => {
  const insets = useSafeAreaInsets();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [prepTimeLeft, setPrepTimeLeft] = useState(10);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [localWorkout, setLocalWorkout] = useState<Workout>(workout);
  const [isSaving, setIsSaving] = useState(false);

  // Animation values
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Generar la cola de pasos (aplanada, agrupando supersets por rondas)
  const steps = useMemo(() => {
    const queue: GroupStep[] = [];
    const processedIds = new Set<string>();

    localWorkout.exercises.forEach((ex) => {
      if (processedIds.has(ex.id)) return;

      if (!ex.supersetId) {
        // Ejercicio normal: cada serie es un paso
        ex.sets.forEach((set, sIdx) => {
          queue.push({
            exercises: [{ exercise: ex, setIndex: sIdx, set }],
            restTime: set.restTime
          });
        });
        processedIds.add(ex.id);
      } else {
        // Supersets: Agrupamos rondas (S1 de A, S1 de B, S1 de C)
        const group = localWorkout.exercises.filter(e => e.supersetId === ex.supersetId);
        const maxSets = Math.max(...group.map(e => e.sets.length));

        for (let s = 0; s < maxSets; s++) {
          const stepExercises: GroupStep['exercises'] = [];
          let roundRestTime = 0;

          group.forEach(groupEx => {
            const set = groupEx.sets[s];
            if (set) {
              stepExercises.push({ exercise: groupEx, setIndex: s, set });
              roundRestTime = set.restTime; // El último descanso del grupo manda
            }
          });

          if (stepExercises.length > 0) {
            queue.push({ exercises: stepExercises, restTime: roundRestTime });
          }
        }
        group.forEach(e => processedIds.add(e.id));
      }
    });

    return queue;
  }, [localWorkout]);

  const currentStep = steps[currentStepIndex];

  const updateSetInWorkout = async (exerciseId: string, setIndex: number, updates: Partial<WorkoutSet>) => {
    const updatedExs = localWorkout.exercises.map(ex => {
      if (ex.id !== exerciseId) return ex;
      const newSets = [...ex.sets];
      newSets[setIndex] = { ...newSets[setIndex], ...updates };
      return { ...ex, sets: newSets };
    });

    const newWorkout = { ...localWorkout, exercises: updatedExs };
    setLocalWorkout(newWorkout);

    // Persistir en Firebase inmediatamente
    try {
      await WorkoutService.updateWorkout(workout.id, { exercises: updatedExs });
    } catch (error) {
      console.error("Error updating field during session:", error);
    }
  };

  const nextStep = useCallback(() => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      setCompleted(true);
      WorkoutService.updateWorkout(workout.id, { lastPerformedAt: Timestamp.now() }).catch(() => {});
    }
  }, [currentStepIndex, steps.length, workout.id]);

  // Pulse animation for active/rest state (cycles 0 to 1)
  useEffect(() => {
    if (isStarted && !completed) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: isResting ? 500 : 1500,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: isResting ? 500 : 1500,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(0);
    }
  }, [isStarted, completed, isResting, pulseAnim]);

  // Interpolations for movement/scale
  const translateY = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -4]
  });

  const restScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1]
  });

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isStarted && !completed && !isPreparing) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isStarted, completed, isPreparing]);

  // Preparation timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPreparing && prepTimeLeft > 0) {
      timer = setInterval(() => setPrepTimeLeft(prev => prev - 1), 1000);
    } else if (isPreparing && prepTimeLeft === 0) {
      setIsPreparing(false);
    }
    return () => clearInterval(timer);
  }, [isPreparing, prepTimeLeft]);

  // Rest timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isResting && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (isResting && timeLeft === 0) {
      setIsResting(false);
      nextStep();
    }
    return () => clearInterval(timer);
  }, [isResting, timeLeft, nextStep]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleStart = () => {
    setIsStarted(true);
    setIsPreparing(true);
    setPrepTimeLeft(10);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const handleDone = () => {
    // Si es el último paso de toda la rutina, no hay descanso, terminamos
    if (currentStepIndex === steps.length - 1) {
      nextStep();
      return;
    }

    if (currentStep.restTime > 0) {
      setTimeLeft(currentStep.restTime);
      setIsResting(true);
    } else {
      nextStep();
    }
  };

  const handleSaveSession = async () => {
    try {
      setIsSaving(true);
      const duration = elapsedTime; // Use actual tracked duration

      // Construir el log
      const logData = {
        userId: workout.userId,
        workoutId: workout.id,
        name: workout.name,
        date: Timestamp.now(),
        duration,
        exercises: localWorkout.exercises.map(ex => ({
          id: ex.id,
          name: ex.name,
          muscleGroup: ex.muscleGroup,
          supersetId: ex.supersetId,
          sets: ex.sets.map(s => ({
            id: s.id,
            reps: s.reps,
            weight: s.weight,
            completed: true // Asumimos completado si llegó al final
          }))
        }))
      };

      await WorkoutService.saveWorkoutLog(logData);
      onComplete();
      onClose();
    } catch (error) {
      console.error("Error saving workout session:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isStarted) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <View style={{ marginBottom: 40, alignItems: 'center' }}>
          <Ionicons name="barbell" size={60} color={colors.accent.yellow} style={{ marginBottom: 20 }} />
          <Text style={styles.title}>{workout.name}</Text>
          <Text style={{ color: colors.text.secondary, marginTop: 10 }}>
            {workout.exercises.length} Ejercicios • {steps.length} Pasos
          </Text>
        </View>

        <TouchableOpacity
          style={{
            width: '100%',
            backgroundColor: colors.button.primary,
            paddingVertical: 18,
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: colors.button.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 5
          }}
          onPress={handleStart}
        >
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800', textAlign: 'center' }}>COMENZAR ENTRENAMIENTO</Text>
        </TouchableOpacity>

        <TouchableOpacity style={{ marginTop: 20, padding: 10 }} onPress={onClose}>
          <Text style={{ color: colors.text.tertiary }}>CANCELAR</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isPreparing) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <Ionicons name="timer" size={60} color={colors.accent.yellow} style={{ marginBottom: 30 }} />
        <Text style={{ color: colors.text.secondary, fontSize: 18, marginBottom: 10 }}>Prepárate, el entrenamiento empieza en...</Text>
        <Animated.Text
          style={{
            color: colors.accent.yellow,
            fontSize: 100,
            fontWeight: '900',
            transform: [{ scale: restScale }]
          }}
        >
          {prepTimeLeft}
        </Animated.Text>

        <TouchableOpacity
          style={{ marginTop: 60, padding: 15 }}
          onPress={() => setIsPreparing(false)}
        >
          <Text style={{ color: colors.text.tertiary, fontWeight: '700' }}>SALTAR CUENTA ATRÁS</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (completed) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <Ionicons name="trophy" size={80} color={colors.accent.yellow} />
        <Text style={[styles.title, { textAlign: 'center', marginTop: 20 }]}>RUTINA COMPLETADA</Text>
        <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900', marginBottom: 10, textAlign: 'center' }}>LIGHTWEIGHT BABY!</Text>
        <Text style={{ color: colors.text.secondary, textAlign: 'center', marginBottom: 40 }}>
          ¿Deseas guardar este entrenamiento para registrar tu progreso?
        </Text>

        <TouchableOpacity
          style={[styles.fab, { position: 'relative', right: 0, bottom: 0, width: '100%', borderRadius: 12, marginBottom: 15, backgroundColor: colors.button.primary }]}
          onPress={handleSaveSession}
          disabled={isSaving}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>{isSaving ? 'GUARDANDO...' : 'GUARDAR PROGRESO'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{ padding: 15 }}
          onPress={() => { onComplete(); onClose(); }}
        >
          <Text style={{ color: colors.text.tertiary, fontWeight: '700' }}>SALIR SIN GUARDAR</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <TouchableOpacity onPress={onClose}><Ionicons name="close" size={28} color="#fff" /></TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: colors.text.tertiary, fontWeight: '700', fontSize: 12 }}>PASO {currentStepIndex + 1} / {steps.length}</Text>
            <Text style={{ color: colors.accent.yellow, fontWeight: '900', fontSize: 18, marginTop: 2 }}>{formatTime(elapsedTime)}</Text>
          </View>
          <View style={{ width: 28 }} />
        </View>

        {!isResting ? (
          <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
            {currentStep.exercises.map((item, idx) => (
              <Animated.View
                key={item.exercise.id}
                style={{
                  marginBottom: idx === currentStep.exercises.length - 1 ? 40 : 30,
                  transform: [{ translateY }]
                }}
              >
                {currentStep.exercises.length > 1 && (
                  <Text style={{ color: colors.accent.yellow, fontSize: 10, fontWeight: '800', marginBottom: 5 }}>
                    {currentStep.exercises.length === 2 ? 'BISERIE' : currentStep.exercises.length === 3 ? 'TRISERIE' : 'GRUPO'} - PARTE {idx + 1}
                  </Text>
                )}
                <Text style={{ color: colors.button.primary, fontSize: 14, fontWeight: '700', textTransform: 'uppercase' }}>{item.exercise.muscleGroup}</Text>
                <Text style={{ color: '#fff', fontSize: 28, fontWeight: '900', marginBottom: 5 }}>{item.exercise.name}</Text>
                <Text style={{ color: colors.text.secondary, fontSize: 16, marginBottom: 20 }}>Serie {item.setIndex + 1} de {item.exercise.sets.length}</Text>

                <View style={{ flexDirection: 'row', gap: 15 }}>
                  <View style={{ flex: 1, backgroundColor: colors.background.tertiary, padding: 15, borderRadius: 16 }}>
                    <Text style={{ color: colors.text.tertiary, fontSize: 11, fontWeight: '700', marginBottom: 5 }}>PESO (KG)</Text>
                    <NumericInput
                      style={{ color: '#fff', fontSize: 24, fontWeight: '800' }}
                      value={item.set.weight}
                      onChangeValue={(val) => updateSetInWorkout(item.exercise.id, item.setIndex, { weight: val })}
                    />
                  </View>
                  <View style={{ flex: 1, backgroundColor: colors.background.tertiary, padding: 15, borderRadius: 16 }}>
                    <Text style={{ color: colors.text.tertiary, fontSize: 11, fontWeight: '700', marginBottom: 5 }}>REPETICIONES</Text>
                    <TextInput
                      style={{ color: '#fff', fontSize: 24, fontWeight: '800' }}
                      keyboardType="numeric"
                      value={item.set.reps.toString()}
                      onChangeText={(val) => updateSetInWorkout(item.exercise.id, item.setIndex, { reps: parseInt(val) || 0 })}
                    />
                  </View>
                </View>
              </Animated.View>
            ))}

            <TouchableOpacity
              style={{ backgroundColor: colors.button.primary, padding: 25, borderRadius: 20, alignItems: 'center', marginTop: 'auto', marginBottom: 20 }}
              onPress={handleDone}
            >
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800' }}>HECHO</Text>
            </TouchableOpacity>
          </ScrollView>
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: colors.text.secondary, fontSize: 18, marginBottom: 20 }}>DESCANSO</Text>
            <Animated.Text style={{ color: colors.accent.yellow, fontSize: 80, fontWeight: '900', transform: [{ scale: restScale }] }}>{timeLeft}s</Animated.Text>
            <View style={{ width: '80%', height: 6, backgroundColor: colors.background.tertiary, borderRadius: 3, marginTop: 40, overflow: 'hidden' }}>
              <Animated.View style={{ width: `${(timeLeft / currentStep.restTime) * 100}%`, height: '100%', backgroundColor: colors.accent.yellow }} />
            </View>
            <TouchableOpacity style={{ marginTop: 60, padding: 15 }} onPress={() => setTimeLeft(0)}>
              <Text style={{ color: colors.text.tertiary, fontWeight: '700' }}>SALTAR DESCANSO</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};
