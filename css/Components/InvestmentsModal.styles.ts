import { StyleSheet } from 'react-native';
import { colors } from '../colors';


export const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  summaryCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.accent.primary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 16,
  },
  investmentList: {
    flex: 1,
  },
  investmentItem: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  investmentInfo: {
    flex: 1,
  },
  investmentDescription: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  investmentDate: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  investmentAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    marginRight: 12,
  },
  closeBtn: {
    backgroundColor: colors.accent.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  closeBtnText: {
    color: colors.accent.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.text.secondary,
    marginTop: 12,
  },
  addButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: colors.accent.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  // Form styles
  formContainer: {
    marginTop: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 14,
    color: colors.text.primary,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  inputFilled: {
    borderColor: colors.accent.primary,
    backgroundColor: colors.background.secondary,
  },
  submitButton: {
    backgroundColor: colors.accent.primary,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButton: {
    alignItems: 'center',
    marginTop: 16,
    padding: 8,
  },
  cancelButtonText: {
    color: colors.text.secondary,
    fontSize: 14,
  },
  // Close investment specific form
  returnCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  returnLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  returnAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
  },
  profitText: {
    color: colors.status.success,
  },
  lossText: {
    color: colors.status.error,
  },
  // New styles for tabs and chart
  viewSelector: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  viewTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  viewTabActive: {
    backgroundColor: colors.accent.primary,
  },
  viewTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  viewTabTextActive: {
    color: '#fff',
  },
  chartCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  closedInvestmentItem: {
    backgroundColor: colors.background.tertiary,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  closedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  closedDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  closedLabel: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  closedValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  historyEmpty: {
    padding: 40,
    alignItems: 'center',
  },
  // Additional requested styles
  investmentEntryPrice: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  infoBtn: {
    padding: 8,
    marginRight: -4,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.tertiary,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border.default,
    gap: 10,
  },
  dateButtonText: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'right',
    flex: 1,
    marginLeft: 20,
  },
  notesBox: {
    backgroundColor: colors.background.tertiary,
    borderRadius: 12,
    padding: 16,
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.tertiary,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  notesText: {
    fontSize: 14,
    color: colors.text.primary,
    lineHeight: 20,
  },
  actionBtnSmall: {
    padding: 6,
    backgroundColor: colors.background.tertiary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.default,
  }
});
