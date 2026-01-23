import React from 'react';
import { View, Pressable, BackHandler, StyleSheet, Alert } from 'react-native';
import { LogoutIcon } from './Icons';

export default function HeaderRight() {
  const handleExit = () => {
    Alert.alert(
      'Salir de la aplicación',
      '¿Estás seguro de que quieres cerrar la aplicación?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Salir', onPress: () => BackHandler.exitApp(), style: 'destructive' }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={handleExit} style={styles.iconButton}>
        <LogoutIcon size={24} color="#ff4444" />
      </Pressable>
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
