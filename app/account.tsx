import * as React from 'react';
import { useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView, TextInput, ActivityIndicator, Image, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { PersonIcon, LockIcon, SettingsIcon, HelpIcon, LogoutIcon, AccountCircleIcon, XIcon } from '../components/Icons';
import { AccountScreenStyles } from '../css/Screens/AccountScreen.styles';
import { useAuth } from '../contexts/AuthContext';
import { signOut, updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth, storage } from '../config/firebase';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { colors } from '../css/colors';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TransactionsService } from '../services/transactionsService';
import { TasksService } from '../services/tasksService';
import { JournalService } from '../services/journalService';
import { CalendarService } from '../services/calendarService';
import { ConfirmModal } from '../components/ConfirmModal';

export default function AccountScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();

  // Modals state
  const [currentModal, setCurrentModal] = useState<'profile' | 'password' | 'settings' | 'help' | 'wipe' | null>(null);
  const [feedback, setFeedback] = useState<{ visible: boolean; title: string; message: string; type: 'success' | 'error' | 'warning' | 'info' | 'delete' | 'confirm' } | null>(null);
  const [confirmWipe, setConfirmWipe] = useState<{ type: 'finances' | 'tasks' | 'journal' | 'calendar' | 'habits' | 'all' } | null>(null);
  const [confirmLogout, setConfirmLogout] = useState(false);

  // Form states
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleCloseModal = () => {
    setCurrentModal(null);
    // Reset password states
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    // Reset profile states to current user values
    setDisplayName(user?.displayName || '');
    setPhotoURL(user?.photoURL || '');
  };

  const MenuItem = ({ icon, title, onPress, color = colors.text.primary, hideBorder = false }: { icon: React.ReactNode; title: string; onPress: () => void; color?: string; hideBorder?: boolean; }) => (
    <Pressable style={[AccountScreenStyles.menuItem, hideBorder && { borderBottomWidth: 0 }]} onPress={onPress}>
      {icon}
      <Text style={[AccountScreenStyles.menuItemText, { color }]}>{title}</Text>
    </Pressable>
  );

  const handleWipe = async (type: 'finances' | 'tasks' | 'journal' | 'calendar' | 'habits' | 'all') => {
    if (!user) return;
    setLoading(true);
    const titles = {
        finances: 'Finanzas (Gastos, Ingresos, Inversiones)',
        tasks: 'Tareas (Historial y registros diarios)',
        journal: 'Diario (Entradas)',
        calendar: 'Agenda (Eventos)',
        habits: 'Hábitos (Configuraciones)',
        all: 'TODO (La aplicación quedará como nueva)'
    };

    try {
        if (type === 'finances') await TransactionsService.wipeUserTransactions(user.uid);
        else if (type === 'tasks') await TasksService.wipeUserTaskRecords(user.uid);
        else if (type === 'journal') await JournalService.wipeUserJournal(user.uid);
        else if (type === 'calendar') await CalendarService.wipeUserEvents(user.uid);
        else if (type === 'habits') await TasksService.wipeUserHabits(user.uid);
        else if (type === 'all') {
            await Promise.all([
                TransactionsService.wipeUserTransactions(user.uid),
                TasksService.wipeUserData(user.uid), // This deletes tasks, habits, goals
                JournalService.wipeUserJournal(user.uid),
                CalendarService.wipeUserEvents(user.uid)
            ]);
        }

        setFeedback({ visible: true, title: 'Éxito', message: `Tus registros de ${titles[type]} han sido eliminados.`, type: 'success' });
    } catch {
        setFeedback({ visible: true, title: 'Error', message: 'No se pudieron eliminar los datos', type: 'error' });
    } finally {
        setLoading(false);
        setConfirmWipe(null);
    }
  };



  const pickImage = async () => {
    if (!user) return;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setFeedback({ visible: true, title: 'Permiso denegado', message: 'Necesitamos acceso a tu galería para cambiar la foto de perfil.', type: 'warning' });
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

            // Convertir URI a Blob de forma más compatible para web y mobile
            const response = await fetch(uri);
            const blob = await response.blob();

            const storageRef = ref(storage, `profiles/${user.uid}`);
            await uploadBytes(storageRef, blob);

            // Cerrar el blob para liberar memoria
            const blobWithClose = blob as unknown as { close?: () => void };
            if (typeof blobWithClose.close === 'function') {
                blobWithClose.close();
            }

            const downloadURL = await getDownloadURL(storageRef);
            setPhotoURL(downloadURL);
            await updateProfile(user, { photoURL: downloadURL });
            setFeedback({ visible: true, title: 'Éxito', message: 'Imagen actualizada correctamente', type: 'success' });
        } catch (error: unknown) {
            // eslint-disable-next-line no-console
            console.error("Error al subir imagen:", error);
            setFeedback({ visible: true, title: 'Error', message: 'No se pudo subir la imagen. Asegúrate de configurar CORS si estás en web.', type: 'error' });
        } finally {
            setUploading(false);
        }
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    if (!displayName.trim()) {
      setFeedback({ visible: true, title: 'Error', message: 'El nombre no puede estar vacío', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      await updateProfile(user, {
        displayName: displayName.trim(),
        photoURL: photoURL.trim() || null,
      });
      setCurrentModal(null);
      setFeedback({ visible: true, title: 'Éxito', message: 'Perfil actualizado correctamente', type: 'success' });
    } catch {
      setFeedback({ visible: true, title: 'Error', message: 'No se pudo actualizar el perfil', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user || !user.email) return;
    if (!currentPassword || !newPassword || !confirmPassword) {
      setFeedback({ visible: true, title: 'Error', message: 'Todos los campos son obligatorios', type: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setFeedback({ visible: true, title: 'Error', message: 'Las contraseñas nuevas no coinciden', type: 'error' });
      return;
    }
    if (newPassword.length < 6) {
      setFeedback({ visible: true, title: 'Error', message: 'La nueva contraseña debe tener al menos 6 caracteres', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setCurrentModal(null);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setFeedback({ visible: true, title: 'Éxito', message: 'Contraseña actualizada correctamente', type: 'success' });
    } catch (err: unknown) {
      const error = err as { code?: string };
      // Normalizamos el error de contraseña incorrecta que puede variar entre versiones de Firebase
      if (error?.code === 'auth/wrong-password' || error?.code === 'auth/invalid-credential') {
        setFeedback({ visible: true, title: 'Error', message: 'La contraseña actual es incorrecta', type: 'error' });
      } else if (error?.code === 'auth/too-many-requests') {
        setFeedback({ visible: true, title: 'Acceso Bloqueado', message: 'Demasiados intentos fallidos. Reintenta más tarde por seguridad.', type: 'error' });
      } else {
        setFeedback({ visible: true, title: 'Error', message: 'No se pudo actualizar la contraseña. Revisa tu conexión o reintenta.', type: 'error' });
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
                <Pressable style={{ backgroundColor: colors.background.tertiary, paddingHorizontal: 15, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.border.light }} onPress={pickImage} disabled={uploading}>
                  <Text style={{ color: colors.accent.primary, fontWeight: '600' }}>{uploading ? 'Subiendo...' : 'Seleccionar'}</Text>
                </Pressable>
              </View>
            </View>
            <View style={AccountScreenStyles.inputGroup}>
              <Text style={AccountScreenStyles.label}>Nombre</Text>
              <TextInput style={AccountScreenStyles.input} value={displayName} onChangeText={setDisplayName} placeholder="Tu nombre" placeholderTextColor={colors.text.tertiary} />
            </View>
            <Pressable style={[AccountScreenStyles.saveButton, loading && { opacity: 0.7 }]} onPress={handleUpdateProfile} disabled={loading}>
              {loading ? <ActivityIndicator color="white" /> : <Text style={AccountScreenStyles.saveButtonText}>Guardar Cambios</Text>}
            </Pressable>
          </View>
        );
      case 'password':
        return (
          <View style={AccountScreenStyles.formContainer}>
            <View style={AccountScreenStyles.inputGroup}>
              <Text style={AccountScreenStyles.label}>Contraseña Actual</Text>
              <View style={{ position: 'relative' }}>
                <TextInput
                  style={AccountScreenStyles.input}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry={!showCurrentPassword}
                  placeholder="********"
                  placeholderTextColor={colors.text.tertiary}
                />
                <Pressable
                  style={{ position: 'absolute', right: 15, top: 15 }}
                  onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  <Ionicons name={showCurrentPassword ? "eye-off-outline" : "eye-outline"} size={22} color={colors.text.tertiary} />
                </Pressable>
              </View>
            </View>

            <View style={AccountScreenStyles.inputGroup}>
              <Text style={AccountScreenStyles.label}>Nueva Contraseña</Text>
              <View style={{ position: 'relative' }}>
                <TextInput
                  style={AccountScreenStyles.input}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showNewPassword}
                  placeholder="********"
                  placeholderTextColor={colors.text.tertiary}
                />
                <Pressable
                  style={{ position: 'absolute', right: 15, top: 15 }}
                  onPress={() => setShowNewPassword(!showNewPassword)}
                >
                  <Ionicons name={showNewPassword ? "eye-off-outline" : "eye-outline"} size={22} color={colors.text.tertiary} />
                </Pressable>
              </View>
              <Text style={{ fontSize: 12, color: colors.text.tertiary, marginTop: 5 }}>
                Mínimo 6 caracteres.
              </Text>
            </View>

            <View style={AccountScreenStyles.inputGroup}>
              <Text style={AccountScreenStyles.label}>Confirmar Nueva</Text>
              <View style={{ position: 'relative' }}>
                <TextInput
                  style={AccountScreenStyles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  placeholder="********"
                  placeholderTextColor={colors.text.tertiary}
                />
                <Pressable
                  style={{ position: 'absolute', right: 15, top: 15 }}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={22} color={colors.text.tertiary} />
                </Pressable>
              </View>
            </View>

            <Pressable
              style={[AccountScreenStyles.saveButton, (loading || !currentPassword || !newPassword || !confirmPassword) && { opacity: 0.7 }]}
              onPress={handleChangePassword}
              disabled={loading || !currentPassword || !newPassword || !confirmPassword}
            >
                {loading ? <ActivityIndicator color="white" /> : <Text style={AccountScreenStyles.saveButtonText}>Actualizar Contraseña</Text>}
            </Pressable>

            <View style={{ marginTop: 20, alignItems: 'center' }}>
                <Text style={{ color: colors.text.tertiary, fontSize: 12, textAlign: 'center' }}>
                    Por seguridad, se te pedirá re-autenticar con tu contraseña actual.
                </Text>
            </View>
          </View>
        );
      case 'settings':
        return (
          <View style={AccountScreenStyles.helpContent}>
            <Text style={AccountScreenStyles.helpText}>Versión 1.0.0</Text>
            <Text style={AccountScreenStyles.label}>Notificaciones</Text>
            <Text style={AccountScreenStyles.helpText}>Configura tus alertas diarias en la vista de Agenda.</Text>
          </View>
        );
      case 'wipe':
        return (
          <View style={AccountScreenStyles.formContainer}>
            <Text style={[AccountScreenStyles.helpText, { marginBottom: 20 }]}>Reinicia tus datos de forma permanente:</Text>

            <View style={{ backgroundColor: colors.background.secondary, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: colors.border.light }}>
                <MenuItem icon={<Ionicons name="cash-outline" size={22} color={colors.status.error} />} title="Limpiar Finanzas" onPress={() => setConfirmWipe({ type: 'finances' })} color={colors.status.error} />
                <MenuItem icon={<Ionicons name="checkbox-outline" size={22} color={colors.status.error} />} title="Limpiar Tareas" onPress={() => setConfirmWipe({ type: 'tasks' })} color={colors.status.error} />
                <MenuItem icon={<Ionicons name="bulb-outline" size={22} color={colors.status.error} />} title="Limpiar Hábitos" onPress={() => setConfirmWipe({ type: 'habits' })} color={colors.status.error} />
                <MenuItem icon={<Ionicons name="book-outline" size={22} color={colors.status.error} />} title="Limpiar Diario" onPress={() => setConfirmWipe({ type: 'journal' })} color={colors.status.error} />
                <MenuItem icon={<Ionicons name="calendar-outline" size={22} color={colors.status.error} />} title="Limpiar Agenda" onPress={() => setConfirmWipe({ type: 'calendar' })} color={colors.status.error} hideBorder={true} />
            </View>

            <View style={{ marginVertical: 35, alignItems: 'center' }}>
                <View style={{ height: 1, backgroundColor: colors.border.light, width: '100%' }} />
                <View style={{ position: 'absolute', top: -10, backgroundColor: colors.background.primary, paddingHorizontal: 15 }}>
                    <Text style={{ color: colors.status.error, fontSize: 12, fontWeight: '800', letterSpacing: 1.5 }}>ZONA PELIGROSA</Text>
                </View>
            </View>

            <View style={{ backgroundColor: colors.status.error + '10', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: colors.status.error + '30' }}>
                <MenuItem icon={<Ionicons name="trash-bin-outline" size={22} color={colors.status.error} />} title="ELIMINAR TODO" onPress={() => setConfirmWipe({ type: 'all' })} color={colors.status.error} hideBorder={true} />
            </View>

            <Text style={{ marginTop: 15, color: colors.text.tertiary, fontSize: 12, textAlign: 'center' }}>
                Esto reseteará la aplicación a su estado inicial.
            </Text>
          </View>
        );
      case 'help':
        return (
          <View style={AccountScreenStyles.helpContent}>
            <Text style={AccountScreenStyles.helpText}>Para soporte contacta con nosotros.</Text>
          </View>
        );
      default: return null;
    }
  };

  const getModalTitle = () => {
    switch (currentModal) {
      case 'profile': return 'Perfil';
      case 'password': return 'Contraseña';
      case 'settings': return 'Configuración';
      case 'help': return 'Ayuda';
      case 'wipe': return 'Seguridad y Datos';
      default: return '';
    }
  };

  return (
    <View style={AccountScreenStyles.container}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 40 }}>
        <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 25 }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.background.tertiary, justifyContent: 'center', alignItems: 'center' }}>
              {user?.photoURL ? <Image source={{ uri: user.photoURL }} style={{ width: 80, height: 80, borderRadius: 40 }} /> : <AccountCircleIcon size={50} color={colors.text.tertiary} />}
            </View>
            <Text style={AccountScreenStyles.username}>{user?.displayName || 'Usuario'}</Text>
        </View>

        <View style={AccountScreenStyles.menuContainer}>
          <MenuItem icon={<PersonIcon />} title="Perfil" onPress={() => setCurrentModal('profile')} />
          <MenuItem icon={<LockIcon />} title="Cambiar contraseña" onPress={() => setCurrentModal('password')} />
          <MenuItem icon={<SettingsIcon />} title="Ajustes" onPress={() => setCurrentModal('settings')} />
          <MenuItem icon={<Ionicons name="shield-checkmark-outline" size={24} color={colors.text.primary} />} title="Seguridad y Datos" onPress={() => setCurrentModal('wipe')} />
          <MenuItem icon={<HelpIcon />} title="Ayuda" onPress={() => setCurrentModal('help')} />
          <MenuItem icon={<LogoutIcon />} title="Cerrar Sesión" onPress={() => setConfirmLogout(true)} color="#ff4444" />
        </View>
      </ScrollView>

      <Modal visible={!!currentModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleCloseModal}>
        <View style={[AccountScreenStyles.modalContainer, { paddingTop: Platform.OS === 'ios' ? 0 : insets.top }]}>
          <View style={AccountScreenStyles.modalHeader}>
            <Text style={AccountScreenStyles.modalTitle}>{getModalTitle()}</Text>
            <Pressable onPress={handleCloseModal}><XIcon color={colors.text.primary} /></Pressable>
          </View>
          <ScrollView>{renderModalContent()}</ScrollView>
        </View>
      </Modal>

      <ConfirmModal
        visible={!!feedback}
        title={feedback?.title || ''}
        message={feedback?.message || ''}
        type={feedback?.type as 'success' | 'error' | 'warning' | 'info' | 'delete' | 'confirm'}
        onConfirm={() => setFeedback(null)}
      />

      <ConfirmModal
        visible={!!confirmLogout}
        title="Cerrar Sesión"
        message="¿Estás seguro de que deseas cerrar tu sesión actual?"
        type="confirm"
        onConfirm={async () => {
            setConfirmLogout(false);
            try {
                // 1. Limpiar credenciales guardadas en storage
                await AsyncStorage.multiRemove([
                    'savedEmail',
                    'savedPassword',
                    'rememberCredentials'
                ]);

                // 2. Cerrar sesión en Firebase
                await signOut(auth);

                // 3. Redirigir a auth y asegurar que no hay reemplazo infinito
                router.replace('/auth');
            } catch {
                // Log error if needed in future analytics
                setFeedback({ visible: true, title: 'Error', message: 'No se pudo cerrar la sesión correctamente', type: 'error' });
            }
        }}
        onCancel={() => setConfirmLogout(false)}
      />

      <ConfirmModal
        visible={!!confirmWipe}
        title="¿Eliminar registros?"
        message="Esta acción borrará permanentemente todos tus registros. No se puede deshacer."
        type="delete"
        onConfirm={() => confirmWipe && handleWipe(confirmWipe.type)}
        onCancel={() => setConfirmWipe(null)}
      />
    </View>
  );
}
