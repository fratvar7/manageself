import { View, Text, Pressable, Alert } from 'react-native';
import { router } from 'expo-router';
import { BackIcon, PersonIcon, LockIcon, SettingsIcon, HelpIcon, LogoutIcon, AccountCircleIcon } from '../components/Icons';
import { AccountScreenStyles } from '../css/Screens/AccountScreen.styles';
import { useAuth } from '../contexts/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';

export default function AccountScreen() {
  const { user } = useAuth();

  const handleBack = () => {
    router.back();
  };
  const handleProfile = () => {
    Alert.alert('Perfil', 'Función de perfil en desarrollo');
  };

  const handleChangePassword = () => {
    Alert.alert('Cambiar Contraseña', 'Función de cambio de contraseña en desarrollo');
  };

  const handleSettings = () => {
    Alert.alert('Configuración', 'Función de configuración en desarrollo');
  };

  const handleHelp = () => {
    Alert.alert('Ayuda', 'Función de ayuda en desarrollo');
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            try {
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

  const MenuItem = ({ icon, title, onPress, color = '#fff' }) => (
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
          title="Perfil"
          onPress={handleProfile}
        />
        <MenuItem
          icon={<LockIcon />}
          title="Cambiar Contraseña"
          onPress={handleChangePassword}
        />
        <MenuItem
          icon={<SettingsIcon />}
          title="Configuración"
          onPress={handleSettings}
        />
        <MenuItem
          icon={<HelpIcon />}
          title="Ayuda"
          onPress={handleHelp}
        />
        <MenuItem
          icon={<LogoutIcon />}
          title="Cerrar Sesión"
          onPress={handleLogout}
          color="#ff4444"
        />
      </View>
    </View>
  );
}

