import * as React from 'react';
import { useState } from 'react';
import { View, Text, Pressable, Alert, Modal, ScrollView, TextInput, ActivityIndicator, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { PersonIcon, LockIcon, SettingsIcon, HelpIcon, LogoutIcon, AccountCircleIcon, XIcon } from '../components/Icons';
import { AccountScreenStyles } from '../css/Screens/AccountScreen.styles';
import { useAuth } from '../contexts/AuthContext';
import { signOut, updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth, storage } from '../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { colors } from '../css/colors';

export default function AccountScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();

  // Modals state
  const [currentModal, setCurrentModal] = useState<'profile' | 'password' | 'settings' | 'help' | null>(null);

  // Form states
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    if (!user) return;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Necesitamos acceso a tu galería para cambiar la foto de perfil.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
        setUploading(true);
        try {
            const uri = result.assets[0].uri;
            const response = await fetch(uri);
            const blob = await response.blob();

            const storageRef = ref(storage, `profiles/${user.uid}`);
            await uploadBytes(storageRef, blob);

            const downloadURL = await getDownloadURL(storageRef);
            setPhotoURL(downloadURL);

            // Actualizar el perfil inmediatamente en Firebase Auth
            await updateProfile(user, {
              photoURL: downloadURL
            });

            Alert.alert('Éxito', 'Imagen actualizada correctamente');
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            Alert.alert('Error', `No se pudo subir la imagen: ${errorMessage}`);
        } finally {
            setUploading(false);
        }
    }
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
              <Text style={AccountScreenStyles.label}>Foto de Perfil</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: colors.background.tertiary, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: colors.border.light }}>
                    {photoURL ? (
                    <Image source={{ uri: photoURL }} style={{ width: 60, height: 60 }} />
                    ) : (
                    <AccountCircleIcon size={40} color={colors.text.tertiary} />
                    )}
                </View>
                <Pressable
                  style={{
                    backgroundColor: colors.background.tertiary,
                    paddingHorizontal: 15,
                    paddingVertical: 10,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: colors.border.light,
                    justifyContent: 'center'
                  }}
                  onPress={pickImage}
                  disabled={uploading}
                >
                  <Text style={{ color: colors.accent.primary, fontWeight: '600' }}>
                    {uploading ? 'Subiendo...' : 'Seleccionar Imagen'}
                  </Text>
                </Pressable>
              </View>
            </View>
            <View style={AccountScreenStyles.inputGroup}>
              <Text style={AccountScreenStyles.label}>Nombre</Text>
              <TextInput
                style={AccountScreenStyles.input}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Tu nombre"
                placeholderTextColor={colors.text.tertiary}
              />
            </View>
            <View style={AccountScreenStyles.inputGroup}>
              <Text style={AccountScreenStyles.label}>Email</Text>
              <TextInput
                style={[AccountScreenStyles.input, { opacity: 0.6 }]}
                value={user?.email || ''}
                editable={false}
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
                placeholderTextColor={colors.text.tertiary}
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
                placeholderTextColor={colors.text.tertiary}
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
                placeholderTextColor={colors.text.tertiary}
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
      <View style={{ alignItems: 'center', paddingVertical: 40 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.background.tertiary, justifyContent: 'center', alignItems: 'center' }}>
            {user?.photoURL ? (
                <Image source={{ uri: user.photoURL }} style={{ width: 80, height: 80, borderRadius: 40 }} />
            ) : (
                <AccountCircleIcon size={50} color={colors.text.tertiary} />
            )}
          </View>
          <Text style={AccountScreenStyles.username}>{user?.displayName || 'Usuario'}</Text>
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
        <View style={[AccountScreenStyles.modalContainer, { paddingTop: insets.top }]}>
          <View style={AccountScreenStyles.modalHeader}>
            <Text style={AccountScreenStyles.modalTitle}>{getModalTitle()}</Text>
            <Pressable style={AccountScreenStyles.closeButton} onPress={() => setCurrentModal(null)}>
              <XIcon color={colors.text.primary} />
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
