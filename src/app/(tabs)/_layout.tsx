import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { Icon } from '@/components/Icon';
import { font, palette } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

export default function TabLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.bg,
          borderTopColor: theme.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          elevation: 0,
        },
        tabBarActiveTintColor: palette.emerald,
        tabBarInactiveTintColor: theme.inkFaint,
        tabBarLabelStyle: { fontFamily: font.bold, fontSize: 12 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'تعلّم',
          tabBarIcon: ({ color, size }) => <Icon name="home" size={size} color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'إحصائيات',
          tabBarIcon: ({ color, size }) => <Icon name="chart" size={size} color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'حسابي',
          tabBarIcon: ({ color, size }) => <Icon name="profile" size={size} color={color as string} />,
        }}
      />
    </Tabs>
  );
}
