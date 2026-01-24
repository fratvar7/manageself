import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Workout, WorkoutExercise } from '../types';
import { colors } from '../css/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface WorkoutDetailViewProps {
  workout: Workout;
  onClose: () => void;
  onEdit: () => void;
  onStart: () => void;
}

export const WorkoutDetailView: React.FC<WorkoutDetailViewProps> = ({ workout, onClose, onEdit, onStart }) => {
  const insets = useSafeAreaInsets();

  const renderSets = (ex: WorkoutExercise) => {
    return (
      <View style={styles.setsContainer}>
        <View style={styles.setHeader}>
          <Text style={styles.colHeader}>SET</Text>
          <Text style={styles.colHeader}>KG</Text>
          <Text style={styles.colHeader}>REPS</Text>
          <Text style={styles.colHeader}>REST</Text>
        </View>
        {ex.sets.map((set, idx) => (
          <View key={set.id} style={[styles.setRow, idx % 2 !== 0 && styles.setRowAlt]}>
            <Text style={styles.setVal}>{idx + 1}</Text>
            <Text style={styles.setVal}>{set.weight > 0 ? set.weight : '-'}</Text>
            <Text style={styles.setVal}>{set.reps}</Text>
            <Text style={styles.setVal}>{set.restTime}s</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderExerciseList = () => {
    const groups: (WorkoutExercise | WorkoutExercise[])[] = [];
    const processedIds = new Set<string>();

    workout.exercises.forEach((ex) => {
      if (processedIds.has(ex.id)) return;

      if (!ex.supersetId) {
        groups.push(ex);
        processedIds.add(ex.id);
      } else {
        const group = workout.exercises.filter(e => e.supersetId === ex.supersetId);
        groups.push(group);
        group.forEach(e => processedIds.add(e.id));
      }
    });

    return groups.map((item, idx) => {
      if (Array.isArray(item)) {
        return (
          <View key={`group-${idx}`} style={styles.supersetContainer}>
            <View style={styles.supersetBadge}>
              <Ionicons name="link" size={12} color={colors.accent.yellow} />
              <Text style={styles.supersetText}>
                {item.length === 2 ? 'BISERIE' : item.length === 3 ? 'TRISERIE' : 'SUPERSET'}
              </Text>
            </View>
            <View style={styles.supersetConnector} />
            {item.map((ex, gIdx) => (
              <View key={ex.id} style={{ marginBottom: gIdx === item.length - 1 ? 0 : 20 }}>
                <View style={styles.exerciseHeader}>
                  <Text style={styles.exerciseName}>{ex.name}</Text>
                  <Text style={styles.muscleBadge}>{ex.muscleGroup.toUpperCase()}</Text>
                </View>
                {renderSets(ex)}
              </View>
            ))}
          </View>
        );
      }

      return (
        <View key={item.id} style={styles.exerciseCard}>
          <View style={styles.exerciseHeader}>
            <Text style={styles.exerciseName}>{item.name}</Text>
            <Text style={styles.muscleBadge}>{item.muscleGroup.toUpperCase()}</Text>
          </View>
          {renderSets(item)}
        </View>
      );
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={onClose} style={styles.navButton}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={onEdit} style={styles.navButton}>
          <Text style={styles.editText}>Editar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{workout.name}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          {workout.description ? (
            <Text style={[styles.description, { marginBottom: 0 }]}>{workout.description}</Text>
          ) : <View />}

          {workout.duration && (
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.accent.pink + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
              <Ionicons name="time" size={14} color={colors.accent.pink} />
              <Text style={{ color: colors.accent.pink, fontSize: 12, fontWeight: '700', marginLeft: 6 }}>{Math.round(workout.duration / 60)} min</Text>
            </View>
          )}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="fitness" size={16} color={colors.text.tertiary} />
            <Text style={styles.statText}>{workout.exercises.length} Ejercicios</Text>
          </View>
          <View style={[styles.statItem, { flex: 1, overflow: 'hidden' }]}>
            <Ionicons name="body" size={16} color={colors.text.tertiary} />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 6, paddingRight: 20 }}
            >
              {workout.muscleGroups.map((mg, index) => (
                <View key={index} style={styles.muscleBadge}>
                  <Text style={{ color: colors.text.tertiary, fontSize: 10, fontWeight: '700' }}>{mg.toUpperCase()}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Resumen del entrenamiento</Text>
        {renderExerciseList()}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Start Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.startButton} onPress={onStart}>
          <Ionicons name="play" size={24} color="#fff" />
          <Text style={styles.startButtonText}>EMPEZAR ENTRENAMIENTO</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary, // Using defined theme color
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  navButton: {
    padding: 8,
  },
  editText: {
    color: colors.button.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: colors.text.secondary,
    lineHeight: 22,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 20,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    color: colors.text.tertiary,
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.default,
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 15,
  },
  exerciseCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
  },
  supersetContainer: {
    backgroundColor: colors.background.tertiary, // Consistent with app cards
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  supersetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 6,
  },
  supersetText: {
    color: colors.accent.yellow,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  supersetConnector: {
    position: 'absolute',
    left: 24,
    top: 40,
    bottom: 40,
    width: 2,
    backgroundColor: colors.border.default,
    zIndex: -1,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  exerciseName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    marginRight: 10,
  },
  muscleBadge: {
    fontSize: 10,
    color: colors.text.tertiary,
    backgroundColor: colors.background.tertiary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
    fontWeight: '700',
  },
  setsContainer: {
    backgroundColor: colors.background.tertiary,
    borderRadius: 12,
    padding: 12,
  },
  setHeader: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  colHeader: {
    flex: 1,
    color: colors.text.tertiary,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  setRow: {
    flexDirection: 'row',
    paddingVertical: 6,
  },
  setRowAlt: {
    backgroundColor: colors.background.secondary, // Subtle alternation
  },
  setVal: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
  },
  startButton: {
    backgroundColor: colors.button.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: colors.button.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 10,
  },
});
