import React, { useState } from 'react';
import { View, Pressable, BackHandler, StyleSheet } from 'react-native';
import { LogoutIcon } from './Icons';
import { ConfirmModal } from './ConfirmModal';

export default function HeaderRight() {
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const handleExit = () => {
    setShowExitConfirm(true);
  };

  const confirmExit = () => {
    BackHandler.exitApp();
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={handleExit} style={styles.iconButton}>
        <LogoutIcon size={24} color="#ff4444" />
      </Pressable>

      <ConfirmModal
        visible={showExitConfirm}
        title="Salir de la aplicación"
        message="¿Estás seguro de que quieres cerrar la aplicación?"
        onConfirm={confirmExit}
        onCancel={() => setShowExitConfirm(false)}
        confirmText="Salir"
        isDestructive={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  iconButton: {
    padding: 5,
  },
});
