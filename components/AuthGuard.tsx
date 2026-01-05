import React from 'react';
import { View, Text, ActivityIndicator, Pressable } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { Redirect, useRouter } from 'expo-router';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export function AuthGuard({
  children,
  requireAuth = true
}: AuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000'
      }}>
        <ActivityIndicator size="large" color="#FABB0A" />
        <Text style={{ color: '#fff', marginTop: 10 }}>Cargando...</Text>
      </View>
    );
  }

  if (requireAuth && !user) {
    return <Redirect href="/auth" />;
  }

  // Solo mostrar verificación si el usuario existe y su correo NO está verificado
  // Y solo después de un pequeño delay para dar tiempo a Firebase a actualizar
  if (requireAuth && user && !user.emailVerified) {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
        padding: 20
      }}>
        <Text style={{ color: '#fff', fontSize: 18, textAlign: 'center', marginBottom: 20 }}>
          Por favor, verifica tu correo electrónico antes de continuar.
        </Text>
        <Text style={{ color: '#ccc', fontSize: 14, textAlign: 'center', marginBottom: 30 }}>
          Revisa tu bandeja de entrada y sigue el enlace de verificación.
        </Text>
        <Pressable
          style={{
            backgroundColor: '#FABB0A',
            paddingHorizontal: 30,
            paddingVertical: 12,
            borderRadius: 8,
            marginBottom: 15
          }}
          onPress={() => router.replace('/auth')}
        >
          <Text style={{ color: '#000', fontSize: 16, fontWeight: 'bold' }}>
            Volver a Login
          </Text>
        </Pressable>
        <Pressable
          style={{
            backgroundColor: 'transparent',
            paddingHorizontal: 20,
            paddingVertical: 8,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: '#FABB0A'
          }}
          onPress={async () => {
            // Recargar el usuario para verificar si ya fue verificado
            await user.reload();
          }}
        >
          <Text style={{ color: '#FABB0A', fontSize: 14 }}>
            Ya verifiqué mi correo
          </Text>
        </Pressable>
      </View>
    );
  }

  if (!requireAuth && user && user.emailVerified) {
    return <Redirect href="/(tabs)" />;
  }

  return <>{children}</>;
};
