import { StyleSheet } from 'react-native';
import { colors } from '../colors';

export const SpendingDashboardStyles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Selector de mes - estilo flotante y destacado
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    backgroundColor: colors.background.secondary,
    padding: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  monthArrow: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.background.tertiary, // Botón más claro
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    textTransform: 'capitalize',
    letterSpacing: 0.5,
  },

  // Tarjeta de resumen - estilo 'Glow'
  summaryCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border.light,
    // Sombra con color del acento (Glow effect)
    shadowColor: colors.accent.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  summaryTitle: {
    fontSize: 13,
    color: colors.text.secondary,
    marginBottom: 24,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  balanceContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  balanceLabel: {
    fontSize: 14,
    color: colors.text.tertiary,
    marginBottom: 8,
    fontWeight: '500',
  },
  balanceAmount: {
    fontSize: 48, // Mucho más grande
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: -1.5,
    textShadowColor: colors.accent.primarySoft,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  balancePositive: {
    color: colors.status.success,
    textShadowColor: 'rgba(16, 185, 129, 0.4)',
  },
  balanceNegative: {
    color: colors.status.error,
    textShadowColor: 'rgba(239, 68, 68, 0.4)',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 16,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 18,
    backgroundColor: colors.background.tertiary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  summaryItemLabel: {
    fontSize: 11,
    color: colors.text.secondary,
    marginBottom: 8,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryItemAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  incomeAmount: {
    color: colors.status.success,
  },
  expenseAmount: {
    color: colors.status.error,
  },

  // Gráfico - fondo oscuro limpio
  chartCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  chartTitle: {
    fontSize: 16,
    color: colors.text.primary,
    marginBottom: 24,
    fontWeight: '700',
    alignSelf: 'flex-start',
  },
  pieChartContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  legendContainer: {
    width: '100%',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.background.tertiary,
    borderRadius: 14,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 14,
  },
  legendText: {
    flex: 1,
    fontSize: 15,
    color: colors.text.primary,
    fontWeight: '500',
  },
  legendPercent: {
    fontSize: 15,
    color: colors.text.primary,
    fontWeight: '700',
  },

  // Top categorías
  topCategoriesCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  topCategoriesTitle: {
    fontSize: 16,
    color: colors.text.primary,
    marginBottom: 24,
    fontWeight: '700',
  },
  categoryItem: {
    marginBottom: 20,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 15,
    color: colors.text.primary,
    fontWeight: '500',
    flex: 1,
  },
  categoryAmount: {
    fontSize: 15,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  categoryPercent: {
    fontSize: 14,
    color: colors.accent.primary,
    fontWeight: '700',
    marginLeft: 12,
    minWidth: 48,
    textAlign: 'right',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: colors.background.tertiary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    backgroundColor: colors.background.secondary,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderStyle: 'dashed',
  },
  emptyStateText: {
    fontSize: 18,
    color: colors.text.primary,
    marginTop: 20,
    fontWeight: '600',
  },
  emptyStateSubtext: {
    fontSize: 15,
    color: colors.text.secondary,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 22,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  loadingText: {
    fontSize: 16,
    color: colors.text.secondary,
    marginTop: 20,
    fontWeight: '500',
  },
  // Period Selector (Segment Control)
  periodSelectorContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background.tertiary,
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  periodOption: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  periodOptionActive: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  periodOptionText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text.secondary,
    textTransform: 'capitalize',
  },
  periodOptionTextActive: {
    color: colors.text.primary,
    fontWeight: '700',
  },
});
