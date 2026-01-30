import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../css/colors';
import { TaskStatsDashboardStyles as styles } from '../css/Components/TaskStatsDashboard.styles';
import { Task, Habit, Goal } from '../types';
import { ensureDate } from '../utils/dateUtils';
import { ICON_EMOJIS } from '../constants/icons';
import { TasksService } from '../services/tasksService';

interface TaskStatsDashboardProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
}

export const TaskStatsDashboard: React.FC<TaskStatsDashboardProps> = ({
  visible,
  onClose,
  userId
}) => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = React.useState(true);
  const [allTasks, setAllTasks] = React.useState<Task[]>([]);
  const [allHabits, setAllHabits] = React.useState<Habit[]>([]);
  const [allGoals, setAllGoals] = React.useState<Goal[]>([]);

  React.useEffect(() => {
    if (visible && userId) {
      const loadAllData = async () => {
        try {
          setLoading(true);
          const [tasks, habits, goals] = await Promise.all([
             TasksService.getTasks(userId),
             TasksService.getHabits(userId),
             TasksService.getGoals(userId)
          ]);
          setAllTasks(tasks);
          setAllHabits(habits);
          setAllGoals(goals);
        } catch {
          // Silently handle error for better UX
        } finally {
          setLoading(false);
        }
      };
      loadAllData();
    }
  }, [visible, userId]);

  // --- CÁLCULOS GLOBALES ---

  // Tareas Regulares (no hábitos)
  const regularTasks = allTasks.filter(t => !t.habitId);
  const totalRegular = regularTasks.length;
  const completedRegular = regularTasks.filter(t => t.completed).length;
  const globalTaskRate = totalRegular > 0 ? Math.round((completedRegular / totalRegular) * 100) : 0;

  // Hábitos
  const habitTasks = allTasks.filter(t => t.habitId);
  const totalHabitInstances = habitTasks.length;
  const completedHabitInstances = habitTasks.filter(t => t.completed).length;
  const globalHabitRate = totalHabitInstances > 0 ? Math.round((completedHabitInstances / totalHabitInstances) * 100) : 0;

  // Objetivos
  const totalGoals = allGoals.length;
  const achievedGoals = allGoals.filter(g => g.completed);
  const activeGoals = allGoals.filter(g => !g.completed);
  const globalGoalRate = totalGoals > 0 ? Math.round((achievedGoals.length / totalGoals) * 100) : 0;

  const renderGoalStat = (goal: Goal) => {
    const deadline = ensureDate(goal.deadline);
    const now = new Date();
    now.setHours(0,0,0,0);
    const goalDate = new Date(deadline);
    goalDate.setHours(0,0,0,0);

    const diffTime = goalDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const isOverdue = !goal.completed && diffDays < 0;

    // Cálculo de 'Presión Temporal' para la barra
    // Si quedan 14 días o más, la barra está vacía. Si queda 0, está llena.
    const pressureWindow = 14;
    let progressPercent = 0;

    if (goal.completed) {
      progressPercent = 100;
    } else {
      if (diffDays <= 0) {
        progressPercent = 100;
      } else if (diffDays < pressureWindow) {
        progressPercent = ((pressureWindow - diffDays) / pressureWindow) * 100;
      } else {
        progressPercent = 5; // Un mínimo visible
      }
    }

    // Color dinámico basado en proximidad al límite
    let progressColor = colors.accent.yellow; // > 7 días
    if (goal.completed) {
      progressColor = colors.status.success;
    } else if (isOverdue || diffDays <= 3) {
      progressColor = colors.status.error;   // < 3 días o vencido
    } else if (diffDays <= 7) {
      progressColor = colors.accent.coral;   // < 7 días
    }

    return (
      <View key={goal.id} style={[styles.goalCard, goal.completed && { borderLeftColor: colors.status.success }]}>
        <View style={styles.goalHeader}>
          <Text style={[styles.goalTitle, goal.completed && { color: colors.text.secondary, textDecorationLine: 'line-through' }]} numberOfLines={1}>{goal.title}</Text>
          <Text style={[
            styles.goalStatus,
            {
              backgroundColor: goal.completed ? colors.status.successSoft : isOverdue ? colors.status.errorSoft : colors.accent.primarySoft,
              color: goal.completed ? colors.status.success : isOverdue ? colors.status.error : colors.accent.primary
            }
          ]}>
            {goal.completed ? 'LOGRADO' : isOverdue ? 'VENCIDO' : 'EN CURSO'}
          </Text>
        </View>

        <View style={styles.goalProgressBar}>
          <View style={[styles.goalProgressFill, {
            width: `${progressPercent}%`,
            backgroundColor: progressColor
          }]} />
        </View>

        <View style={styles.goalFooter}>
          <View>
            <Text style={styles.goalDate}>Límite: {deadline.toLocaleDateString('es-ES')}</Text>
            {goal.completed && (
              <Text style={[styles.goalDate, { color: colors.status.success, marginTop: 2, fontWeight: 'bold' }]}>
                Logrado: {ensureDate(goal.completedAt || goal.updatedAt).toLocaleDateString()}
              </Text>
            )}
          </View>
          {!goal.completed && (
            <Text style={[styles.goalDate, { color: isOverdue ? colors.status.error : colors.text.tertiary, fontWeight: 'bold' }]}>
              {isOverdue ? 'Vencido' : diffDays === 0 ? '¡Hoy mismo!' : `${diffDays} d. rest.`}
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.modalContainer, { paddingTop: Platform.OS === 'ios' ? 0 : insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={{ padding: 5 }}>
            <Ionicons name="chevron-down" size={28} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Análisis de Desempeño</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {loading ? (
             <View style={{ padding: 40, alignItems: 'center' }}>
               <ActivityIndicator size="large" color={colors.accent.primary} />
               <Text style={{ color: colors.text.secondary, marginTop: 15 }}>Compilando historial...</Text>
             </View>
          ) : (
            <>
              {/* Card Resumen Total */}
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>RENDIMIENTO GLOBAL</Text>

                <View style={[styles.statsGrid, { marginBottom: 15 }]}>
                  <View style={styles.statBox}>
                    <Text style={[styles.percentageText, { fontSize: 32 }]}>{globalTaskRate}%</Text>
                    <Text style={styles.statLabel}>Tareas</Text>
                  </View>
                  <View style={[styles.statBox, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.border.light }]}>
                    <Text style={[styles.percentageText, { fontSize: 32, color: colors.accent.violet }]}>{globalHabitRate}%</Text>
                    <Text style={styles.statLabel}>Hábitos</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={[styles.percentageText, { fontSize: 32, color: colors.accent.yellow }]}>{globalGoalRate}%</Text>
                    <Text style={styles.statLabel}>Objetivos</Text>
                  </View>
                </View>

                <Text style={[styles.emptyText, { fontSize: 12 }]}>
                  Análisis basado en {allTasks.length} registros y {allGoals.length} proyectos.
                </Text>
              </View>

              {/* Sección de Objetivos Realizados */}
              {achievedGoals.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.status.success }]}>LOGROS ALCANZADOS ({achievedGoals.length})</Text>
                    <View style={styles.separator} />
                  </View>
                  {achievedGoals.map(renderGoalStat)}
                </View>
              )}

              {/* Sección de Hábitos (Performance) */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>CONSISTENCIA EN HÁBITOS</Text>
                  <View style={styles.separator} />
                </View>

                {allHabits.length > 0 ? [...allHabits].sort((a, b) => {
                   const emojiA = a?.icon && ICON_EMOJIS[a.icon] ? ICON_EMOJIS[a.icon] : '✨';
                   const emojiB = b?.icon && ICON_EMOJIS[b.icon] ? ICON_EMOJIS[b.icon] : '✨';
                   return emojiA.localeCompare(emojiB);
                }).map((habit) => {
                   const instances = habitTasks.filter(t => t.habitId === habit.id);
                   const completedCount = instances.filter(t => t.completed).length;
                   const rate = instances.length > 0 ? Math.round((completedCount / instances.length) * 100) : 0;
                   const emoji = habit?.icon && ICON_EMOJIS[habit.icon] ? ICON_EMOJIS[habit.icon] : '✨';

                   return (
                     <View key={habit.id} style={styles.habitRow}>
                       <View style={styles.habitIconContainer}>
                         <Text style={{ fontSize: 20 }}>{emoji}</Text>
                       </View>
                       <View style={styles.habitInfo}>
                         <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={styles.habitTitle}>{habit.title}</Text>
                            <Text style={{ fontSize: 11, color: colors.text.tertiary }}>({completedCount}/{instances.length})</Text>
                         </View>
                         <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                            <View style={{ flex: 1, height: 4, backgroundColor: colors.background.elevated, borderRadius: 2, marginRight: 10 }}>
                              <View style={{ width: `${rate}%`, height: '100%', backgroundColor: colors.accent.violet, borderRadius: 2 }} />
                            </View>
                            <Text style={{ fontSize: 11, color: colors.text.secondary, fontWeight: '700' }}>{rate}%</Text>
                         </View>
                       </View>
                     </View>
                   );
                }) : (
                  <Text style={styles.emptyText}>No has definido hábitos permanentes</Text>
                )}
              </View>

              {/* Sección de Objetivos En Curso */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>METAS EN CURSO</Text>
                  <View style={styles.separator} />
                </View>

                {activeGoals.length > 0 ? activeGoals.map(renderGoalStat) : (
                  <Text style={styles.emptyText}>No hay objetivos activos en este momento</Text>
                )}
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};
