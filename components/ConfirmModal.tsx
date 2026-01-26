import React from 'react';
import { Modal, View, Text, StyleSheet, Pressable } from 'react-native';
import { colors } from '../css/colors';
import { Ionicons } from '@expo/vector-icons';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void; // Optional for single button mode
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  type?: 'success' | 'error' | 'warning' | 'info' | 'confirm' | 'delete';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Continuar',
  cancelText = 'Cancelar',
  isDestructive = false,
  type = 'confirm'
}) => {
  const getModalConfig = () => {
    switch (type) {
      case 'success':
        return { icon: 'checkmark-circle-outline', color: colors.status.success, bg: colors.status.success + '20' };
      case 'error':
        return { icon: 'close-circle-outline', color: colors.status.error, bg: colors.status.error + '20' };
      case 'warning':
        return { icon: 'warning-outline', color: colors.accent.primary, bg: colors.accent.primary + '20' };
      case 'delete':
        return { icon: 'trash-outline', color: colors.status.error, bg: colors.status.error + '20' };
      case 'info':
        return { icon: 'information-circle-outline', color: colors.button.primary, bg: colors.button.primary + '20' };
      default:
        return { icon: 'help-circle-outline', color: colors.button.primary, bg: colors.button.primary + '20' };
    }
  };

  const config = getModalConfig();
  const showCancel = !!onCancel;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel || onConfirm}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={[styles.iconContainer, { backgroundColor: config.bg }]}>
            <Ionicons
              name={config.icon as any}
              size={36}
              color={config.color}
            />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.buttonRow}>
            {showCancel && (
                <Pressable
                style={[styles.button, styles.cancelButton]}
                onPress={onCancel}
                >
                <Text style={styles.cancelButtonText}>{cancelText}</Text>
                </Pressable>
            )}

            <Pressable
              style={[
                styles.button,
                (isDestructive || type === 'delete') ? styles.confirmButtonDestructive : styles.confirmButton,
                !showCancel && { flex: 0, width: '100%' }
              ]}
              onPress={onConfirm}
            >
              <Text style={styles.confirmButtonText}>{confirmText}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    backgroundColor: colors.background.secondary,
    borderRadius: 28,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  message: {
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.background.tertiary,
  },
  cancelButtonText: {
    color: colors.text.secondary,
    fontWeight: '700',
    fontSize: 15,
  },
  confirmButton: {
    backgroundColor: colors.button.primary,
  },
  confirmButtonDestructive: {
    backgroundColor: colors.status.error,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
