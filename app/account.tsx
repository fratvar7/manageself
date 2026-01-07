import React, { useState } from 'react';
import { View, Text, Pressable, Alert, Modal, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { BackIcon, PersonIcon, LockIcon, SettingsIcon, HelpIcon, LogoutIcon, AccountCircleIcon, XIcon } from '../components/Icons';
import { AccountScreenStyles } from '../css/Screens/AccountScreen.styles';
import { useAuth } from '../contexts/AuthContext';
import { signOut, updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AccountScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Modals state
  const [currentModal, setCurrentModal] = useState<'profile' | 'password' | 'settings' | 'help' | null>(null);

  // Form states
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleBack = () => {
    router.back();
  };

  const clearSavedCredentials = async () => {
    try {
      await AsyncStorage.removeItem('savedEmail');
      await AsyncStorage.removeItem('savedPassword');
      await AsyncStorage.removeItem('rememberCredentials');
      return true;
    } catch {
      return false;
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión? Se eliminarán las credenciales guardadas.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearSavedCredentials();
              await signOut(auth);
              router.replace('/auth');
            } catch {
              Alert.alert('Error', 'No se pudo cerrar sesión');
            }
          },
        },
      ]
    );
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    if (!displayName.trim()) {
      Alert.alert('Error', 'El nombre no puede estar vacío');
      return;
    }

    setLoading(true);
    try {
      await updateProfile(user, {
        displayName: displayName.trim(),
        photoURL: photoURL.trim() || null,
      });
      setCurrentModal(null);
      Alert.alert('Éxito', 'Perfil actualizado correctamente');
    } catch {
      Alert.alert('Error', 'No se pudo actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user || !user.email) return;
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Todos los campos son obligatorios');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'las contraseñas nuevas no coinciden');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      // Re-autenticar al usuario
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      await updatePassword(user, newPassword);

      setCurrentModal(null);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Éxito', 'Contraseña actualizada correctamente');
    } catch (err: unknown) {
      const error = err as { code?: string };
      if (error?.code === 'auth/wrong-password') {
        Alert.alert('Error', 'La contraseña actual es incorrecta');
      } else {
        Alert.alert('Error', 'No se pudo actualizar la contraseña. Por favor intenta iniciar sesión nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderModalContent = () => {
    switch (currentModal) {
      case 'profile':
        return (
          <View style={AccountScreenStyles.formContainer}>
            <View style={AccountScreenStyles.inputGroup}>
              <Text style={AccountScreenStyles.label}>Nombre</Text>
              <TextInput
                style={AccountScreenStyles.input}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Tu nombre"
                placeholderTextColor="#888"
              />
            </View>
            <View style={AccountScreenStyles.inputGroup}>
              <Text style={AccountScreenStyles.label}>URL de Foto (Avatar)</Text>
              <TextInput
                style={AccountScreenStyles.input}
                value={photoURL}
                onChangeText={setPhotoURL}
                placeholder="https://..."
                placeholderTextColor="#888"
                autoCapitalize="none"
              />
            </View>
            <Pressable
              style={[AccountScreenStyles.saveButton, loading && { opacity: 0.7 }]}
              onPress={handleUpdateProfile}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="white" /> : <Text style={AccountScreenStyles.saveButtonText}>Guardar Cambios</Text>}
            </Pressable>
          </View>
        );

      case 'password':
        return (
          <View style={AccountScreenStyles.formContainer}>
            <View style={AccountScreenStyles.inputGroup}>
              <Text style={AccountScreenStyles.label}>Contraseña Actual</Text>
              <TextInput
                style={AccountScreenStyles.input}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="********"
                placeholderTextColor="#888"
                secureTextEntry
              />
            </View>
            <View style={AccountScreenStyles.inputGroup}>
              <Text style={AccountScreenStyles.label}>Nueva Contraseña</Text>
              <TextInput
                style={AccountScreenStyles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="********"
                placeholderTextColor="#888"
                secureTextEntry
              />
            </View>
            <View style={AccountScreenStyles.inputGroup}>
              <Text style={AccountScreenStyles.label}>Confirmar Nueva Contraseña</Text>
              <TextInput
                style={AccountScreenStyles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="********"
                placeholderTextColor="#888"
                secureTextEntry
              />
            </View>
            <Pressable
              style={[AccountScreenStyles.saveButton, loading && { opacity: 0.7 }]}
              onPress={handleChangePassword}
              disabled={loading}
            >
               {loading ? <ActivityIndicator color="white" /> : <Text style={AccountScreenStyles.saveButtonText}>Actualizar Contraseña</Text>}
            </Pressable>
          </View>
        );

      case 'settings':
        return (
          <View style={AccountScreenStyles.helpContent}>
            <Text style={AccountScreenStyles.helpText}>Configuración de la aplicación v1.0.0</Text>
            <View style={AccountScreenStyles.inputGroup}>
              <Text style={AccountScreenStyles.label}>Tema</Text>
              <Text style={AccountScreenStyles.helpText}>Oscuro (Predeterminado)</Text>
            </View>
            <View style={AccountScreenStyles.inputGroup}>
              <Text style={AccountScreenStyles.label}>Notificaciones</Text>
              <Text style={AccountScreenStyles.helpText}>Activadas</Text>
            </View>
          </View>
        );

      case 'help':
        return (
          <View style={AccountScreenStyles.helpContent}>
            <Text style={AccountScreenStyles.helpText}>Bienvenido a ManageSelf.</Text>
            <Text style={AccountScreenStyles.helpText}>Aquí puedes organizar tus tareas diarias y crear hábitos para mejorar tu productividad.</Text>
            <Text style={AccountScreenStyles.helpText}>Si necesitas ayuda adicional, contáctanos en soporte@manageself.app</Text>
          </View>
        );

      default:
        return null;
    }
  };

  const getModalTitle = () => {
    switch (currentModal) {
      case 'profile': return 'Datos de Perfil';
      case 'password': return 'Cambiar Contraseña';
      case 'settings': return 'Configuración';
      case 'help': return 'Ayuda';
      default: return '';
    }
  };

  const MenuItem = ({ icon, title, onPress, color = '#fff' }: { icon: React.ReactNode; title: string; onPress: () => void; color?: string; }) => (
    <Pressable style={AccountScreenStyles.menuItem} onPress={onPress}>
      {icon}
      <Text style={[AccountScreenStyles.menuItemText, { color }]}>{title}</Text>
    </Pressable>
  );

  return (
    <View style={AccountScreenStyles.container}>
      <View style={AccountScreenStyles.header}>
        <Pressable style={AccountScreenStyles.backButton} onPress={handleBack}>
          <BackIcon />
        </Pressable>
        <View style={AccountScreenStyles.headerContent}>
          <View style={AccountScreenStyles.avatarContainer}>
            <AccountCircleIcon />
          </View>
          <Text style={AccountScreenStyles.username}>{user?.displayName || 'Usuario'}</Text>
          <Text style={AccountScreenStyles.email}>{user?.email || 'usuario@ejemplo.com'}</Text>
        </View>
      </View>

      <View style={AccountScreenStyles.menuContainer}>
        <MenuItem
          icon={<PersonIcon />}
          title="Datos de Perfil"
          onPress={() => {
            setDisplayName(user?.displayName || '');
            setPhotoURL(user?.photoURL || '');
            setCurrentModal('profile');
          }}
        />
        <MenuItem
          icon={<LockIcon />}
          title="Cambiar Contraseña"
          onPress={() => {
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setCurrentModal('password');
          }}
        />
        <MenuItem
          icon={<SettingsIcon />}
          title="Configuración"
          onPress={() => setCurrentModal('settings')}
        />
        <MenuItem
          icon={<HelpIcon />}
          title="Ayuda"
          onPress={() => setCurrentModal('help')}
        />
        <MenuItem
          icon={<LogoutIcon />}
          title="Cerrar Sesión"
          onPress={handleLogout}
          color="#ff4444"
        />
      </View>

      <Modal
        visible={!!currentModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setCurrentModal(null)}
      >
        <View style={AccountScreenStyles.modalContainer}>
          <View style={AccountScreenStyles.modalHeader}>
            <Text style={AccountScreenStyles.modalTitle}>{getModalTitle()}</Text>
            <Pressable style={AccountScreenStyles.closeButton} onPress={() => setCurrentModal(null)}>
              <XIcon color="#fff" />
            </Pressable>
          </View>
          <ScrollView>
            {renderModalContent()}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
