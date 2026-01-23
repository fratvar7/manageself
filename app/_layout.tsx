import { Stack } from 'expo-router';
import { StatusBar, View, StyleSheet, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../contexts/AuthContext';
import { useEffect } from 'react';
import * as NavigationBar from 'expo-navigation-bar';
import { colors } from '../css/colors';
import { router } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Layout() {
  useEffect(() => {
    if (Platform.OS === 'android') {
      const configureNavigationBar = async () => {
        try {
          // setPositionAsync, setBehaviorAsync y setBackgroundColorAsync no son compatibles
          // cuando el modo edge-to-edge está activado por defecto en versiones recientes de Expo.
          await NavigationBar.setVisibilityAsync('hidden');
        } catch (e) {
          console.error('Error configuring NavigationBar:', e);
        }
      };
      configureNavigationBar();
    }
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <View style={styles.container}>
          <StatusBar barStyle="light-content" />
          <Stack
            screenOptions={{
              headerShown: false,
              headerStyle: { backgroundColor: colors.background.primary },
              headerTintColor: colors.button.primary,
              headerTitleStyle: { color: colors.text.primary },
              headerTitleAlign: 'center',
              contentStyle: { backgroundColor: colors.background.primary },
            }}
          >
            <Stack.Screen
              name="account"
              options={{
                headerShown: true,
                title: 'Cuenta',
                headerLeft: () => (
                  <TouchableOpacity
                    onPress={() => router.replace('/(tabs)/personal')}
                    style={{ marginLeft: 10 }}
                  >
                    <Ionicons name="arrow-back" size={24} color={colors.button.primary} />
                  </TouchableOpacity>
                )
              }}
            />
          </Stack>
        </View>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});
