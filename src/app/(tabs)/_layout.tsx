import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { font, palette } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

/** أيقونة وسطر عربي بـ lineHeight ١٨ لا يسعهما ارتفاع الشريط الافتراضي (٤٩). */
const BAR_CONTENT_HEIGHT = 68;
const ITEM_HEIGHT = 56;

export default function TabLayout() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.emerald,
        tabBarInactiveTintColor: theme.inkFaint,
        // بلا flexShrink: 0 ينكمش السطر إلى ٩ بكسل داخل العنصر ويُقصّ، لأنّ
        // overflow: hidden مضروب عليه من numberOfLines={1}.
        // حروف Cairo العربية تطلب ٢٠ بكسل عند حجم ١٢، لا ١٨.
        tabBarLabelStyle: { fontFamily: font.bold, fontSize: 12, lineHeight: 22, flexShrink: 0 },
        tabBarIconStyle: { marginTop: 2, flexShrink: 0 },
        tabBarItemStyle: { height: ITEM_HEIGHT, paddingTop: 3, paddingBottom: 3 },
        tabBarStyle: {
          backgroundColor: theme.bg,
          borderTopColor: theme.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          elevation: 0,
          // الحشو السفلي يُحسب داخل الارتفاع، فيُضاف إليه لا يُقتطع منه.
          height: BAR_CONTENT_HEIGHT + insets.bottom,
          paddingBottom: insets.bottom + 6,
          paddingTop: 6,
        },
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
        name="account"
        options={{
          title: 'حسابي',
          tabBarIcon: ({ color, size }) => <Icon name="profile" size={size} color={color as string} />,
        }}
      />
    </Tabs>
  );
}
