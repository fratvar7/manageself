import { StyleSheet } from 'react-native';
import { colors } from '../colors';

export const TodoListStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    gap: 20,
  },
  actionButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.button.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  habitsButton: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  clearButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.status.error,
  },
  addButtonText: {
    display: 'none',
  },
  addForm: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border.light,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  input: {
    backgroundColor: colors.background.primary,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text.primary,
    marginBottom: 12,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    display: 'none', // Ocultar input de descripción
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  formButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  cancelButtonText: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: colors.button.primary,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  tasksList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  fixedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  taskSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  completedTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  completedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: colors.background.secondary,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  toggleIcon: {
    marginLeft: 8,
  },
  eventCountButton: {
    backgroundColor: colors.background.tertiary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  eventCountText: {
    color: colors.button.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  eventsModalContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  eventsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  eventsModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  eventsModalScroll: {
    flex: 1,
  },
  eventsModalScrollContent: {
    padding: 16,
  },
  statsText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.button.primary,
    backgroundColor: colors.background.secondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  miniStatsText: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
    fontWeight: '500',
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  habitTaskItem: {
    backgroundColor: '#1E1E1E', // Un color ligeramente diferente para distinguir hábitos
    borderLeftWidth: 3,
    borderLeftColor: colors.button.primary,
  },
  taskCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border.default,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  taskCheckboxCompleted: {
    backgroundColor: colors.button.primary,
    borderColor: colors.button.primary,
  },
  checkboxText: {
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkboxTextCompleted: {
    color: 'white',
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: 4,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: colors.text.secondary,
  },
  taskDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  taskDescriptionCompleted: {
    textDecorationLine: 'line-through',
  },
  habitBadge: {
    fontSize: 12,
    color: colors.button.primary,
    backgroundColor: colors.background.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  loadingText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 40,
  },
});
