import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Platform, useColorScheme } from 'react-native';
import { schemes, type Scheme } from './tokens';

/** «النظام» يتبع الجهاز، والآخران يثبّتان النسق مهما كان إعداد الجهاز. */
export type ThemePref = 'system' | 'light' | 'dark';

const PREF_KEY = 'fiqhSalahDuo.theme';
const isPref = (v: string | null): v is ThemePref =>
  v === 'system' || v === 'light' || v === 'dark';

/** مُضاعِف حجم النصّ — الكتاب مشكولٌ والحركات تدقّ على العيون الضعيفة. */
export const TEXT_SCALES = [1, 1.15, 1.3] as const;
const SCALE_KEY = 'fiqhSalahDuo.textScale';

/**
 * تُصدَّر صفحات الويب مسبقًا بالنسق الفاتح — لا يعرف المُصدِّر نسقَ الجهاز.
 * وReact عند الإرواء (hydration) لا يصحّح أصناف الأنماط في HTML المصدَّر،
 * فلو أعاد `useColorScheme` «داكن» من أول رسمة لبقيت العقد المصدَّرة فاتحة
 * بينما يُرسم ما يُركَّب بعدها داكنًا، فيختلط النسقان في صفحة واحدة.
 * لذا نُرجِع «فاتح» في رسمة الإرواء وحدها — فتطابق HTML المصدَّر — ثم نرفع
 * هذه الراية بعد التركيب فتُعاد الرسمة ويُحدَّث النسق كلّه دفعة واحدة.
 * على الأجهزة لا إرواء، فالراية مرفوعة من البداية ولا رسمة زائدة.
 */
type ThemeState = {
  hydrated: boolean;
  pref: ThemePref;
  setPref: (pref: ThemePref) => void;
  scale: number;
  setScale: (scale: number) => void;
};

const ThemeContext = createContext<ThemeState>({
  hydrated: Platform.OS !== 'web',
  pref: 'system',
  setPref: () => {},
  scale: 1,
  setScale: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(Platform.OS !== 'web');
  const [pref, setStored] = useState<ThemePref>('system');
  const [scale, setScaleState] = useState(1);

  // القاعدة تمنع ضبط الحالة في جسم الأثر لأنه يُعيد الرسم. وهو المقصود هنا:
  // «تمّ الإرواء» حدثٌ لا يُعرف إلا بتنفيذ أوّل أثر، فلا سبيل إلى اشتقاقه من
  // الخصائص. والرسمة الزائدة واحدة عند الإقلاع على الويب وحده.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setHydrated(true), []);

  useEffect(() => {
    AsyncStorage.multiGet([PREF_KEY, SCALE_KEY])
      .then((pairs) => {
        const stored = Object.fromEntries(pairs);
        if (isPref(stored[PREF_KEY])) setStored(stored[PREF_KEY] as ThemePref);
        const n = Number(stored[SCALE_KEY]);
        if (TEXT_SCALES.includes(n as (typeof TEXT_SCALES)[number])) setScaleState(n);
      })
      .catch(() => {});
  }, []);

  const setPref = (next: ThemePref) => {
    setStored(next);
    AsyncStorage.setItem(PREF_KEY, next).catch(() => {});
  };

  const setScale = (next: number) => {
    setScaleState(next);
    AsyncStorage.setItem(SCALE_KEY, String(next)).catch(() => {});
  };

  return (
    <ThemeContext.Provider value={{ hydrated, pref, setPref, scale, setScale }}>
      {children}
    </ThemeContext.Provider>
  );
}

/** ألوان النسق الحالي (فاتح/داكن). */
export function useTheme(): Scheme {
  return schemes[useIsDark() ? 'dark' : 'light'];
}

/** التفضيل المحفوظ ومبدّله — لشاشة الإعدادات. */
export function useThemePref(): { pref: ThemePref; setPref: (pref: ThemePref) => void } {
  const { pref, setPref } = useContext(ThemeContext);
  return { pref, setPref };
}

export function useTextScale(): { scale: number; setScale: (scale: number) => void } {
  const { scale, setScale } = useContext(ThemeContext);
  return { scale, setScale };
}

export function useIsDark(): boolean {
  const system = useColorScheme() === 'dark';
  const { hydrated, pref } = useContext(ThemeContext);
  if (!hydrated) return false;
  return pref === 'system' ? system : pref === 'dark';
}
