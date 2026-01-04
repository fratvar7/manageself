import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { Redirect } from 'expo-router';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requireAuth = true
}) => {
  const { user, loading } = useAuth();

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

  if (!requireAuth && user) {
    return <Redirect href="/(tabs)" />;
  }

  return <>{children}</>;
};
