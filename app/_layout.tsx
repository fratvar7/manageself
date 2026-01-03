import { Stack } from 'expo-router';
import { StatusBar, View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Account from '../components/Account';

export default function Layout() {
  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <Stack
          screenOptions={{
            headerShown: true,
            headerLargeTitleEnabled: true,
            headerTitle: 'ManageSelf',
            headerTitleAlign: 'center',
            headerStyle: { backgroundColor: '#000' },
            headerTitleStyle: { color: '#fff' },
            headerLargeTitleStyle: { color: '#fff' },
            headerTintColor: '#fff',
            headerRight: () => <Account />,
            headerLeft: () => null,
            headerShadowVisible: true
          }}
        />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});
