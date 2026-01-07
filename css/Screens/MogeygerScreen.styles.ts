import { StyleSheet } from 'react-native';
import { colors } from '../colors';
import { globalStyles } from '../globalStyles';

export const MoneygerScreenStyles = StyleSheet.create({
  container: {
    ...globalStyles.container,
    backgroundColor: colors.background.primary,
  },
  buttonsView: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  buttonSelected: {
    backgroundColor: colors.button.primary,
    borderRadius: 65,
    marginHorizontal: 10,
    width: '45%',
  },
  button: {
    backgroundColor: colors.button.primaryHover,
    borderRadius: 65,
    marginHorizontal: 10,
    width: '45%',
  },
  textButton: {
    color: colors.text.dark,
    fontSize: 18,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    fontWeight: '900',
  },
  card: {
    backgroundColor: colors.background.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  titlePrimary: {
    ...globalStyles.titlePrimary,
    marginBottom: 24,
    color: colors.text.primary,
  },
  label: {
    ...globalStyles.label
  },
  input: {
    backgroundColor: colors.background.secondary,
    color: colors.text.primary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  inputFilled: {
    backgroundColor: colors.background.secondary,
    color: colors.text.primary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.accent.mint,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  catButton: {
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    margin: 4,
  },
  catButtonActive: {
    backgroundColor: colors.accent.mint,
  },
  catText: {
    color: colors.text.primary,
  },
  catTextActive: {
    color: colors.shadow,
    fontWeight: '700',
  },
  addButton: {
    backgroundColor: colors.accent.mint,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 40,
  },
  satContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  faceButton: {
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    padding: 8,
  },
  faceButtonActive: {
    backgroundColor: colors.accent.mint,
  },
  saveButton: {
    backgroundColor: colors.button.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: colors.shadow,
    fontSize: 16,
    fontWeight: '700',
  },
});
