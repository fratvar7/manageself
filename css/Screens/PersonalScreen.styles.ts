import { StyleSheet } from 'react-native';
import { colors } from '../colors';

export const PersonalScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 20,
  },
  card: {
    backgroundColor: colors.background.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 10,
  },
  cardText: {
    fontSize: 16,
    color: colors.text.secondary,
    lineHeight: 24,
  },
});
