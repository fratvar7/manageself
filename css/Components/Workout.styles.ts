import { StyleSheet } from 'react-native';
import { colors } from '../colors';

export const WorkoutStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  list: {
    paddingBottom: 80,
  },
  workoutCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border.light,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  workoutName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    flex: 1,
  },
  muscleGroupsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  muscleTag: {
    backgroundColor: colors.button.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  muscleTagText: {
    color: colors.button.primary,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  workoutMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  exerciseCount: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  lastPerformed: {
    fontSize: 12,
    color: colors.text.tertiary,
    fontStyle: 'italic',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyStateText: {
    color: colors.text.secondary,
    fontSize: 16,
    marginTop: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: colors.button.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.button.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  fabSecondary: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    backgroundColor: colors.background.tertiary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: colors.border.light,
  },

  // Workout Header Details
  detailsHeader: {
    marginBottom: 25,
  },
  detailsName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
  },
  detailsDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },

  // Exercise List in Detail
  exerciseItem: {
    backgroundColor: colors.background.tertiary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: colors.button.primary,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 12,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    padding: 10,
    borderRadius: 10,
    marginBottom: 6,
  },
  setNumber: {
    width: 30,
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text.tertiary,
  },
  setDetails: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  setDetailText: {
    fontSize: 14,
    color: colors.text.primary,
  },
  setDetailLabel: {
    fontSize: 11,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
  },
  setCompleted: {
    backgroundColor: colors.status.success + '20',
  },

  // Rest Timer
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent.yellow + '15',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  timerText: {
    color: colors.accent.yellow,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 5,
  },

  // Exercise Manager
  managerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.tertiary,
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  managerItemContent: {
    flex: 1,
  },
  managerItemName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  managerItemSub: {
    color: colors.text.tertiary,
    fontSize: 12,
    marginTop: 2,
  },
  managerActions: {
    flexDirection: 'row',
    gap: 15,
  },
  searchInput: {
    backgroundColor: colors.background.tertiary,
    color: '#fff',
    padding: 12,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border.light,
    marginBottom: 15,
  },
  filterScroll: {
    marginBottom: 15,
  },
  filterTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.background.tertiary,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  filterTagSelected: {
    backgroundColor: colors.button.primary,
    borderColor: colors.button.primary,
  },
  filterTagText: {
    color: colors.text.secondary,
    fontSize: 12,
    fontWeight: '600',
  },
  filterTagTextSelected: {
    color: '#fff',
  },

  // Supersets
  supersetBlock: {
    backgroundColor: colors.background.tertiary,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.accent.yellow + '40',
    marginBottom: 20,
    overflow: 'hidden',
  },
  supersetHeader: {
    backgroundColor: colors.accent.yellow + '10',
    padding: 10,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.accent.yellow + '30',
  },
  supersetHeaderText: {
    color: colors.accent.yellow,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  exerciseInSuperset: {
    padding: 16,
  },
  supersetDivider: {
    height: 1,
    backgroundColor: colors.accent.yellow + '20',
    marginHorizontal: 15,
  },
});
