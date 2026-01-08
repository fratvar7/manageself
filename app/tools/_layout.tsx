import { Stack } from 'expo-router';
import { colors } from '../../css/colors';

export default function ToolsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.background.primary },
        headerTintColor: colors.button.primary,
        headerTitleStyle: { color: colors.text.primary },
        headerTitleAlign: 'center',
        contentStyle: { backgroundColor: colors.background.primary },
      }}
    >
      <Stack.Screen
        name="transactions"
        options={{
          title: 'Dashboard',
          headerShown: true,
          headerStyle: { backgroundColor: colors.background.primary },
          headerTintColor: colors.button.primary,
          headerTitleStyle: { color: colors.text.primary },
        }}
      />
      <Stack.Screen
        name="agenda"
        options={{
          title: 'Agenda',
          headerShown: true,
          headerStyle: { backgroundColor: colors.background.primary },
          headerTintColor: colors.button.primary,
          headerTitleStyle: { color: colors.text.primary },
        }}
      />
      <Stack.Screen
        name="passwords"
        options={{
          title: 'Contraseñas',
          headerShown: true,
          headerStyle: { backgroundColor: colors.background.primary },
          headerTintColor: colors.button.primary,
          headerTitleStyle: { color: colors.text.primary },
        }}
      />
      <Stack.Screen
        name="notes"
        options={{
          title: 'Notas',
          headerShown: true,
          headerStyle: { backgroundColor: colors.background.primary },
          headerTintColor: colors.button.primary,
          headerTitleStyle: { color: colors.text.primary },
        }}
      />
    </Stack>
  );
}
