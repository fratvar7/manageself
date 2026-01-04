import { Stack } from 'expo-router';
import { StatusBar, View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../contexts/AuthContext';

export default function Layout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <View style={styles.container}>
          <StatusBar barStyle="light-content" />
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          />
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
