import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Alert, StyleSheet } from 'react-native';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useRouter } from 'expo-router';
import { colors } from '../css/colors';
import { AuthGuard } from '../components/AuthGuard';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      router.replace('/(tabs)');
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
      <View style={styles.container}>
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
    color: colors.accent.blue,
    textAlign: 'center',
    fontSize: 14,
  },
});
