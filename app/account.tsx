import * as React from 'react';
import { useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView, TextInput, ActivityIndicator, Image } from 'react-native';
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
  const [confirmWipe, setConfirmWipe] = useState<{ type: 'finances' | 'tasks' | 'journal' | 'calendar' } | null>(null);
  const [confirmLogout, setConfirmLogout] = useState(false);

  // Form states
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [uploading, setUploading] = useState(false);

  const MenuItem = ({ icon, title, onPress, color = colors.text.primary }: { icon: React.ReactNode; title: string; onPress: () => void; color?: string; }) => (
    <Pressable style={AccountScreenStyles.menuItem} onPress={onPress}>
      {icon}
      <Text style={[AccountScreenStyles.menuItemText, { color }]}>{title}</Text>
    </Pressable>
  );

  const handleWipe = async (type: 'finances' | 'tasks' | 'journal' | 'calendar') => {
    if (!user) return;
    setLoading(true);
    const titles = {
        finances: 'Finanzas (Gastos, Ingresos, Inversiones)',
        tasks: 'Tareas (Tareas, Hábitos, Objetivos)',
        journal: 'Diario (Entradas)',
        calendar: 'Agenda (Eventos)'
    };

    try {
        if (type === 'finances') await TransactionsService.wipeUserTransactions(user.uid);
        else if (type === 'tasks') await TasksService.wipeUserData(user.uid);
        else if (type === 'journal') await JournalService.wipeUserJournal(user.uid);
        else if (type === 'calendar') await CalendarService.wipeUserEvents(user.uid);

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
      if (error?.code === 'auth/wrong-password') {
        setFeedback({ visible: true, title: 'Error', message: 'La contraseña actual es incorrecta', type: 'error' });
      } else {
        setFeedback({ visible: true, title: 'Error', message: 'No se pudo actualizar la contraseña.', type: 'error' });
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
            <View style={AccountScreenStyles.inputGroup}><Text style={AccountScreenStyles.label}>Contraseña Actual</Text><TextInput style={AccountScreenStyles.input} value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry placeholder="********" placeholderTextColor={colors.text.tertiary} /></View>
            <View style={AccountScreenStyles.inputGroup}><Text style={AccountScreenStyles.label}>Nueva Contraseña</Text><TextInput style={AccountScreenStyles.input} value={newPassword} onChangeText={setNewPassword} secureTextEntry placeholder="********" placeholderTextColor={colors.text.tertiary} /></View>
            <View style={AccountScreenStyles.inputGroup}><Text style={AccountScreenStyles.label}>Confirmar Nueva</Text><TextInput style={AccountScreenStyles.input} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry placeholder="********" placeholderTextColor={colors.text.tertiary} /></View>
            <Pressable style={[AccountScreenStyles.saveButton, loading && { opacity: 0.7 }]} onPress={handleChangePassword} disabled={loading}>
                {loading ? <ActivityIndicator color="white" /> : <Text style={AccountScreenStyles.saveButtonText}>Actualizar</Text>}
            </Pressable>
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
            <Text style={[AccountScreenStyles.helpText, { marginBottom: 30 }]}>Reinicia tus datos de forma permanente:</Text>
            <MenuItem icon={<Ionicons name="cash-outline" size={22} color={colors.status.error} />} title="Limpiar Finanzas" onPress={() => setConfirmWipe({ type: 'finances' })} color={colors.status.error} />
            <MenuItem icon={<Ionicons name="checkbox-outline" size={22} color={colors.status.error} />} title="Limpiar Tareas" onPress={() => setConfirmWipe({ type: 'tasks' })} color={colors.status.error} />
            <MenuItem icon={<Ionicons name="book-outline" size={22} color={colors.status.error} />} title="Limpiar Diario" onPress={() => setConfirmWipe({ type: 'journal' })} color={colors.status.error} />
            <MenuItem icon={<Ionicons name="calendar-outline" size={22} color={colors.status.error} />} title="Limpiar Agenda" onPress={() => setConfirmWipe({ type: 'calendar' })} color={colors.status.error} />
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
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
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

      <Modal visible={!!currentModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setCurrentModal(null)}>
        <View style={[AccountScreenStyles.modalContainer, { paddingTop: insets.top }]}>
          <View style={AccountScreenStyles.modalHeader}>
            <Text style={AccountScreenStyles.modalTitle}>{getModalTitle()}</Text>
            <Pressable onPress={() => setCurrentModal(null)}><XIcon color={colors.text.primary} /></Pressable>
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
                await signOut(auth);
                router.replace('/auth');
            } catch (error) {
                console.error("Error al cerrar sesión:", error);
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
