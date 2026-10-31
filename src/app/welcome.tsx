import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { Txt } from '@/components/Txt';
import { palette, radius, space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

export const ONBOARDED_KEY = 'fiqhSalahDuo.onboarded';

export default function WelcomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const start = useCallback(async () => {
    await AsyncStorage.setItem(ONBOARDED_KEY, '1').catch(() => {});
    router.replace('/');
  }, [router]);

  return (
    <View
      style={[
        styles.fill,
        {
          backgroundColor: theme.bg,
          paddingTop: insets.top + space.xxl,
          paddingBottom: insets.bottom + space.xl,
        },
      ]}
    >
      <View style={styles.content}>
        <Icon name="book" size={72} color={palette.emerald} />

        <Txt weight="black" size="hero" center>
          منهاج المسلم
        </Txt>
        <Txt size="lead" color={theme.inkSoft} center>
          تعلّم أصول الدين بأسلوب تفاعلي ممتع
        </Txt>

        <View style={styles.features}>
          <Feature
            icon="gem"
            tint={palette.sky}
            title="تعلّم بالممارسة"
            body="أسئلة متنوعة من الكتاب مع شرح كلّ إجابة"
            theme={theme}
          />
          <Feature
            icon="fire"
            tint={palette.orange}
            title="حافظ على سلسلتك"
            body="تعلّم كلّ يوم وابنِ عادة مستمرّة"
            theme={theme}
          />
          <Feature
            icon="heart"
            tint={palette.ruby}
            title="تحدَّ نفسك"
            body="خمسة قلوب تعود مع الوقت — ركّز في إجاباتك"
            theme={theme}
          />
        </View>
      </View>

      <View style={styles.bottom}>
        <Pressable
          accessibilityRole="button"
          onPress={start}
          style={[styles.btn, { backgroundColor: palette.emerald }]}
        >
          <Txt weight="black" size="lead" color="#ffffff" center>
            ابدأ التعلّم
          </Txt>
        </Pressable>
      </View>
    </View>
  );
}

function Feature({
  icon,
  tint,
  title,
  body,
  theme,
}: {
  icon: 'gem' | 'fire' | 'heart';
  tint: string;
  title: string;
  body: string;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={styles.feature}>
      <View style={[styles.featureIcon, { backgroundColor: tint + '1a' }]}>
        <Icon name={icon} size={24} color={tint} />
      </View>
      <View style={styles.featureText}>
        <Txt weight="bold">{title}</Txt>
        <Txt size="small" color={theme.inkSoft}>
          {body}
        </Txt>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xl,
    gap: space.md,
  },
  features: { marginTop: space.xl, gap: space.lg, alignSelf: 'stretch' },
  feature: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: space.md,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: { flex: 1, alignItems: 'flex-end', gap: 2 },
  bottom: { paddingHorizontal: space.xl },
  btn: {
    height: 56,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
