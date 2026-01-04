import { StyleSheet } from 'react-native';
import { colors } from '../colors';

export const IndexScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
  },
});
