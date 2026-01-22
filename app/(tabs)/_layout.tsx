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
          headerStyle: {
            backgroundColor: colors.background.primary,
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 0,
          },
          headerTitleStyle: {
            color: colors.text.primary,
            fontSize: 17,
            fontWeight: '600',
          },
          headerTintColor: colors.text.primary,
          headerTitleAlign: 'center',
          tabBarStyle: {
            backgroundColor: colors.background.primary,
            borderTopWidth: 0,
            elevation: 0,
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarActiveTintColor: colors.accent.primary,
          tabBarInactiveTintColor: colors.text.tertiary,
          headerRight: () => <Account />,
        }}
      >
        <Tabs.Screen
          name="moneyger"
          options={{
            title: 'Finanzas',
            tabBarIcon: ({ color }) => <MoneygerIcon color={color} />,
          }}
        />
        <Tabs.Screen
          name="index"
          options={{
            title: 'Tareas',
            tabBarIcon: ({ color }) => <HomeIcon color={color} />,
          }}
        />
        <Tabs.Screen
          name="personal"
          options={{
            title: 'Personal',
            tabBarIcon: ({ color }) => <ClipboardIcon color={color} />,
          }}
        />
      </Tabs>
    </AuthGuard>
  );
}

