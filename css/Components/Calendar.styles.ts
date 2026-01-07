import { StyleSheet } from 'react-native';
import { colors } from '../colors';

export const CalendarStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.background.primary,
  },
  dateDisplay: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: colors.text.primary,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  placeholder: {
    width: 32,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  monthText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  weekDays: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emptyDay: {
    width: '14.28%',
    height: 40,
  },
  day: {
    width: '14.28%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  selectedDay: {
    backgroundColor: colors.button.primary,
  },
  todayDay: {
    borderWidth: 2,
    borderColor: colors.button.primary,
  },
  dayText: {
    fontSize: 14,
    color: colors.text.primary,
  },
  selectedDayText: {
    color: 'white',
    fontWeight: '600',
  },
  todayDayText: {
    color: colors.button.primary,
    fontWeight: '600',
  },
});
