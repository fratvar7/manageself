import { Tabs } from 'expo-router';
import { HomeIcon, ClipboardIcon, MoneygerIcon } from '../../components/Icons';
import { colors } from '../../css/colors';
import Account from '../../components/Account';
import { AuthGuard } from '../../components/AuthGuard';

export default function Layout() {
  return (
    <AuthGuard>
      <Tabs
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: '#000' },
          headerTitleStyle: { color: '#fff' },
          headerTintColor: '#fff',
          tabBarActiveBackgroundColor: colors.background.secondary,
          tabBarInactiveBackgroundColor: colors.background.secondary,
          headerRight: () => <Account />,
          headerLeft: () => null,
        }}
      >
        <Tabs.Screen
          name="moneyger"
          options={{
            title: 'Moneyger',
            tabBarIcon: ({ color }) => <MoneygerIcon color={color} />,
            tabBarActiveTintColor: colors.button.primary,
            tabBarInactiveTintColor: colors.button.secondary,
          }}
        />
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color }) => <HomeIcon color={color} />,
            tabBarActiveTintColor: colors.button.primary,
            tabBarInactiveTintColor: colors.button.secondary,
          }}
        />
        <Tabs.Screen
          name="personal"
          options={{
            title: 'Personal',
            tabBarIcon: ({ color }) => <ClipboardIcon color={color} />,
            tabBarActiveTintColor: colors.button.primary,
            tabBarInactiveTintColor: colors.button.secondary,
          }}
        />
      </Tabs>
    </AuthGuard>
  );
}
