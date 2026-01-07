import { StyleSheet } from 'react-native';
import { colors } from '../colors';

export const IndexScreenStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  headerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 8,
  },
  headerStatsText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  headerStatsPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.button.primary,
  },
  errorText: {
    fontSize: 16,
    color: colors.status.error,
    textAlign: 'center',
    marginTop: 40,
  },
});
