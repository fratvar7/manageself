import { StyleSheet } from 'react-native';
import { colors } from '../colors';

export const CategoriesModalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.background.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 30,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 15,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.card,
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  defaultBadge: {
    fontSize: 12,
    color: colors.accent.mint,
    backgroundColor: colors.background.secondary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 5,
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  addSection: {
    backgroundColor: colors.background.card,
    padding: 20,
    borderRadius: 8,
    margin: 15,
  },
  addTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 15,
  },
  input: {
    backgroundColor: colors.background.secondary,
    borderRadius: 6,
    padding: 12,
    color: colors.text.primary,
    marginBottom: 15,
  },
  addButton: {
    backgroundColor: colors.button.primary,
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
