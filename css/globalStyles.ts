import { StyleSheet } from 'react-native';

import { colors } from './colors';

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  textPrimary: {
    color: colors.text.primary,
  },
  textSecondary: {
    color: colors.text.secondary,
  },
  titlePrimary: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 16,
  },
  titleSecondary: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    color: colors.text.primary,
    marginBottom: 8,
    fontWeight: '600',
  },
});
