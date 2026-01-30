import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, Pressable, Alert, StyleSheet, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useRouter } from 'expo-router';
import { colors } from '../css/colors';
import { AuthGuard } from '../components/AuthGuard';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [rememberCredentials, setRememberCredentials] = useState(false);
  const [autoLoggingIn, setAutoLoggingIn] = useState(true);
  const router = useRouter();

  const attemptAutoLogin = useCallback(async () => {
    try {
      let savedEmail: string | null = null;
      let savedPassword: string | null = null;
      let hasSavedCredentials: string | null = null;

      // React Native: usar AsyncStorage
      savedEmail = await AsyncStorage.getItem('savedEmail');
      savedPassword = await AsyncStorage.getItem('savedPassword');
      hasSavedCredentials = await AsyncStorage.getItem('rememberCredentials');

      if (savedEmail && savedPassword && hasSavedCredentials === 'true') {
        // Hacer login automático
        setAutoLoggingIn(true);
        await signInWithEmailAndPassword(auth, savedEmail, savedPassword).then((userCredential) => {
          if(userCredential.user.emailVerified){
            router.replace('/(tabs)');
          }else{
            router.replace('/auth');
          }
        }).catch((error) => {
          Alert.alert('Error', error.message);
        });
      } else {
        // No hay credenciales guardadas, mostrar formulario
        setAutoLoggingIn(false);
        // Limpiar campos para asegurar que no hay residuos
        setEmail(savedEmail || '');
        setPassword(savedPassword || '');
        setRememberCredentials(hasSavedCredentials === 'true');
      }
    } catch {
      // Error en login automático, mostrar formulario
      setAutoLoggingIn(false);
    }
  }, [router]);

  // Cargar credenciales guardadas al iniciar y hacer login automático
  useEffect(() => {
    attemptAutoLogin();
  }, [attemptAutoLogin]);

  // Mostrar spinner durante login automático
  if (autoLoggingIn) {
    return (
      <AuthGuard requireAuth={false}>
        <View style={styles.container}>
          <View style={styles.card}>
            <Text style={styles.title}>Iniciando sesión automáticamente...</Text>
            <Text style={styles.subtitle}>Usando credenciales guardadas</Text>
          </View>
        </View>
      </AuthGuard>
    );
  }

  const saveCredentials = async (email: string, password: string) => {
    try {
      // React Native: usar AsyncStorage
      await AsyncStorage.setItem('savedEmail', email);
      await AsyncStorage.setItem('savedPassword', password);
      await AsyncStorage.setItem('rememberCredentials', 'true');
    } catch {
      // Error silencioso al guardar credenciales
    }
  };

  const clearCredentials = async () => {
    try {
      // React Native: usar AsyncStorage
      await AsyncStorage.removeItem('savedEmail');
      await AsyncStorage.removeItem('savedPassword');
      await AsyncStorage.removeItem('rememberCredentials');
    } catch {
      // Error silencioso al limpiar credenciales
    }
  };

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password).then(async (userCredential) => {
          if(userCredential.user.emailVerified){
            if(rememberCredentials){
              await saveCredentials(email, password);
            }else {
              await clearCredentials();
            }
            router.replace('/(tabs)');
          }else{
            Alert.alert('Verificación de correo', 'Debes verificar tu correo electrónico para iniciar sesión.');
          }
        });
      } else {
        await createUserWithEmailAndPassword(auth, email, password).then(async (userCredential) => {

          // Enviar email de verificación
          await sendEmailVerification(userCredential.user);
          Alert.alert('Verificación de correo', 'Se ha enviado un correo de verificación a tu correo electrónico. Por favor, verifica tu correo antes de iniciar sesión. Revisa la carpeta de spam si no lo encuentras.');

          // Cerrar sesión inmediatamente para forzar verificación
          await auth.signOut();

          // No guardar credenciales hasta que verifique el correo
          if (rememberCredentials) {
            await clearCredentials();
          }

        }).catch((error) => {
          Alert.alert('Error', error.message);
        });

        // Redirigir a login, no a tabs
        router.replace('/auth');
      }
    } catch (error: unknown) {
      const firebaseError = error as { code?: string };
      Alert.alert('Error', getErrorMessage(firebaseError.code || 'unknown'));
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (code: string): string => {
    switch (code) {
      case 'auth/user-not-found':
        return 'Usuario no encontrado';
      case 'auth/wrong-password':
        return 'Contraseña incorrecta';
      case 'auth/email-already-in-use':
        return 'El email ya está en uso';
      case 'auth/weak-password':
        return 'La contraseña debe tener al menos 6 caracteres';
      case 'auth/invalid-email':
        return 'Email inválido';
      default:
        return 'Error de autenticación';
    }
  };

  return (
    <AuthGuard requireAuth={false}>
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.card}>
          <Text style={styles.title}>{isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}</Text>

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="tu@email.com"
            placeholderTextColor={colors.text.disabled}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            style={styles.input}
            placeholder="Mínimo 6 caracteres"
            placeholderTextColor={colors.text.disabled}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {/* Opción de recordar credenciales (solo en login) */}
          {isLogin && (
            <View style={styles.rememberContainer}>
              <Switch
                value={rememberCredentials}
                onValueChange={setRememberCredentials}
                trackColor={{ false: colors.border.default, true: colors.button.primary }}
                thumbColor={rememberCredentials ? colors.button.primary : colors.text.secondary}
              />
              <Text style={styles.rememberText}>Permanecer con sesión activa</Text>
            </View>
          )}

          <Pressable
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleAuth}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Cargando...' : (isLogin ? 'Iniciar Sesión' : 'Crear Cuenta')}
            </Text>
          </Pressable>

          <Pressable onPress={() => setIsLogin(!isLogin)}>
            <Text style={styles.switchText}>
              {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
            </Text>
          </Pressable>
        </View>
      </View>
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: colors.background.card,
    borderRadius: 16,
    padding: 30,
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 30,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    color: colors.text.primary,
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    color: colors.text.primary,
    fontSize: 16,
  },
  button: {
    backgroundColor: colors.button.primary,
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: colors.button.secondary,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchText: {
    color: colors.accent.primary,
    textAlign: 'center',
    fontSize: 14,
  },
  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  rememberText: {
    color: colors.text.primary,
    fontSize: 14,
    flex: 1,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 10,
  },
});
