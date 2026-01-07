import { Stack } from 'expo-router';
import { colors } from '../../css/colors';

export default function ToolsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.background.primary },
        headerTitleStyle: { color: colors.text.primary },
        headerTintColor: colors.button.primary,
        headerTitleAlign: 'center',
        contentStyle: { backgroundColor: colors.background.primary },
      }}
    />
  );
}
