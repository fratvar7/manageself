import { StyleSheet } from 'react-native';
import { colors } from '../colors';

export const MoneygerScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
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
    backgroundColor: colors.accent.primary,
    borderRadius: 12,
    marginHorizontal: 8,
    flex: 1,
  },
  button: {
    backgroundColor: colors.background.tertiary,
    borderRadius: 12,
    marginHorizontal: 8,
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  textButton: {
    color: colors.text.primary,
    fontSize: 14,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    fontWeight: '600',
  },

  // Tarjeta del formulario - estilo glassmorphism
  card: {
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

  titlePrimary: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 24,
    color: colors.text.primary,
    letterSpacing: -0.5,
  },

  // Labels
  label: {
    fontSize: 13,
    color: colors.text.secondary,
    marginBottom: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Inputs - estilo moderno con bordes sutiles
  input: {
    backgroundColor: colors.background.tertiary,
    color: colors.text.primary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  inputFilled: {
    backgroundColor: colors.background.tertiary,
    color: colors.text.primary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    fontSize: 16,
    borderWidth: 1.5,
    borderColor: colors.accent.primary,
  },

  // Categorías - chips modernos
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    gap: 8,
  },
  catButton: {
    backgroundColor: colors.background.tertiary,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  catButtonActive: {
    backgroundColor: colors.accent.primarySoft,
    borderColor: colors.accent.primary,
  },
  catText: {
    color: colors.text.secondary,
    fontSize: 13,
    fontWeight: '500',
  },
  catTextActive: {
    color: colors.accent.primaryLight,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: colors.accent.primarySoft,
    borderColor: colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 44,
  },

  // Satisfacción - estilo moderno
  satContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 8,
  },
  faceButton: {
    backgroundColor: colors.background.tertiary,
    borderRadius: 12,
    padding: 12,
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  faceButtonActive: {
    backgroundColor: colors.accent.primarySoft,
    borderColor: colors.accent.primary,
  },

  // Botón de guardar - estilo premium
  saveButton: {
    backgroundColor: colors.accent.primary,
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
