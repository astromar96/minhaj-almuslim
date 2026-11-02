import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { type IconName } from '@/components/Icon';
import { Txt } from '@/components/Txt';
import { counted, LESSON } from '@/engine/arabic';
import { useAuth, type SocialProvider } from '@/store/auth';
import { useProgress } from '@/store/progress';
import { palette, radius, space } from '@/theme/tokens';
import {
  TEXT_SCALES,
  useTextScale,
  useTheme,
  useThemePref,
  type ThemePref,
} from '@/theme/useTheme';

const PROVIDER_LABEL: Record<SocialProvider, string> = {
  google: 'المتابعة بحساب Google',
  apple: 'المتابعة بحساب Apple',
};

/** زرّ جوجل بسطح محايد وعلامته الأصلية — إرشادات جوجل تمنع زرًّا أزرق بلا علامة. */
const PROVIDER_ICON: Record<SocialProvider, IconName | undefined> = {
  google: 'google',
  apple: undefined,
};

export default function AccountScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { account, ready, busy, error, social, clearError, leave } = useAuth();
  const { doneCount, xp, streak } = useProgress();

  const goHome = () => router.navigate('/');

  return (
    <View style={[styles.fill, { backgroundColor: theme.bg }]}>
      <View style={[styles.head, { paddingTop: insets.top + space.md, borderBottomColor: theme.border }]}>
        <Txt weight="black" size="title">
          {account && !account.guest ? 'حسابي' : 'احفظ تقدّمك'}
        </Txt>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + space.xxl }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.summary, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
          <Txt size="small" color={theme.inkSoft}>
            أتممتَ {counted(doneCount, LESSON)} · {xp} نقطة · سلسلة {streak}
          </Txt>
        </View>

        {error ? (
          <View style={[styles.alert, { backgroundColor: theme.wrongBg }]}>
            <Txt size="small" color={theme.wrongInk}>
              {error}
            </Txt>
          </View>
        ) : null}

        {!ready ? (
          <Txt size="small" color={theme.inkFaint} center>
            لحظة…
          </Txt>
        ) : account && !account.guest ? (
          <SignedIn
            name={account.name}
            email={account.email}
            busy={busy}
            onLeave={async () => {
              await leave();
            }}
          />
        ) : (
          <SignIn guest={!!account?.guest} busy={busy} social={social} onDone={goHome} onTyping={clearError} />
        )}

        <Settings />
      </ScrollView>
    </View>
  );
}

function SignedIn({
  name,
  email,
  busy,
  onLeave,
}: {
  name: string | null;
  email: string | null;
  busy: boolean;
  onLeave: () => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.block}>
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Txt weight="bold" size="lead">
          {name || email || 'حسابك'}
        </Txt>
        {email && name ? (
          <Txt size="small" color={theme.inkSoft} style={styles.ltr}>
            {email}
          </Txt>
        ) : null}
        <Txt size="small" color={theme.inkSoft}>
          تقدّمك محفوظ في حسابك، ويصل إلى أيّ جهاز تدخل منه.
        </Txt>
      </View>
      <Button label="تسجيل الخروج" variant="ghost" disabled={busy} onPress={onLeave} />
      <Txt size="caption" color={theme.inkFaint} center>
        الخروج لا يمحو تقدّمك — يعود كما هو عند دخولك ثانيةً.
      </Txt>
    </View>
  );
}

function SignIn({
  guest,
  busy,
  social,
  onDone,
  onTyping,
}: {
  guest: boolean;
  busy: boolean;
  social: SocialProvider[];
  onDone: () => void;
  onTyping: () => void;
}) {
  const theme = useTheme();
  const { signInWithProvider, signInWithEmail, registerWithEmail, resetPassword, continueAsGuest } =
    useAuth();
  const [newAccount, setNewAccount] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [sent, setSent] = useState(false);

  const change = (set: (value: string) => void) => (value: string) => {
    onTyping();
    setSent(false);
    set(value);
  };

  const submit = async () => {
    const ok = newAccount
      ? await registerWithEmail(name, email, password)
      : await signInWithEmail(email, password);
    if (ok) onDone();
  };

  return (
    <View style={styles.block}>
      <Txt size="small" color={theme.inkSoft}>
        {guest
          ? 'أنت تلعب كضيف. اربط حسابًا ليبقى تقدّمك إن بدّلت الجهاز أو مسحت بيانات المتصفّح.'
          : 'ادخل ليُحفظ تقدّمك في حسابك ويصل إلى أجهزتك كلّها.'}
      </Txt>

      {social.map((provider) => (
        <Button
          key={provider}
          label={PROVIDER_LABEL[provider]}
          variant="outline"
          icon={PROVIDER_ICON[provider]}
          disabled={busy}
          onPress={async () => {
            if (await signInWithProvider(provider)) onDone();
          }}
        />
      ))}

      <View style={styles.rule}>
        <View style={[styles.line, { backgroundColor: theme.border }]} />
        <Txt size="caption" color={theme.inkFaint}>
          أو بالبريد
        </Txt>
        <View style={[styles.line, { backgroundColor: theme.border }]} />
      </View>

      {newAccount ? (
        <Field
          label="الاسم"
          placeholder="اسمك"
          value={name}
          onChange={change(setName)}
          autoComplete="name"
        />
      ) : null}
      <Field
        label="البريد"
        placeholder="name@example.com"
        value={email}
        onChange={change(setEmail)}
        keyboardType="email-address"
        autoComplete="email"
        latin
      />
      <Field
        label="كلمة المرور"
        placeholder="ستّة أحرف فأكثر"
        value={password}
        onChange={change(setPassword)}
        secureTextEntry
        autoComplete={newAccount ? 'new-password' : 'current-password'}
        latin
      />

      <Button
        label={newAccount ? 'إنشاء حساب' : 'دخول'}
        disabled={busy || !email.trim() || !password}
        onPress={submit}
      />

      <View style={styles.links}>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            onTyping();
            setSent(false);
            setNewAccount((value) => !value);
          }}
        >
          <Txt size="small" color={theme.inkSoft}>
            {newAccount ? 'لي حساب — أدخل' : 'لا حساب لي — أنشئ واحدًا'}
          </Txt>
        </Pressable>
        {newAccount ? null : (
          <Pressable
            accessibilityRole="button"
            disabled={busy || !email.trim()}
            onPress={async () => {
              if (await resetPassword(email)) setSent(true);
            }}
          >
            <Txt size="small" color={email.trim() ? theme.inkSoft : theme.inkFaint}>
              نسيت كلمة المرور
            </Txt>
          </Pressable>
        )}
      </View>

      {sent ? (
        <Txt size="small" color={theme.correctInk}>
          أرسلنا رابط إعادة التعيين إلى بريدك.
        </Txt>
      ) : null}

      {guest ? null : (
        <>
          <View style={[styles.line, { backgroundColor: theme.border, marginVertical: space.md }]} />
          <Button
            label="المتابعة كضيف"
            variant="neutral"
            disabled={busy}
            onPress={async () => {
              if (await continueAsGuest()) onDone();
            }}
          />
          <Txt size="caption" color={theme.inkFaint} center>
            الضيف يُحفظ تقدّمه كذلك، ويبقى على هذا الجهاز حتى تربط به حسابًا.
          </Txt>
        </>
      )}
    </View>
  );
}

const SCALE_LABEL = ['عادي', 'كبير', 'أكبر'];

function Settings() {
  const theme = useTheme();
  const { pref, setPref } = useThemePref();
  const { scale, setScale } = useTextScale();

  return (
    <View style={styles.block}>
      <View style={[styles.line, { backgroundColor: theme.border, marginVertical: space.md }]} />
      <Txt weight="bold" size="lead">
        الإعدادات
      </Txt>

      <Txt size="caption" color={theme.inkSoft}>
        المظهر
      </Txt>
      <Segmented
        value={pref}
        onPick={(key) => setPref(key as ThemePref)}
        options={[
          { key: 'system', label: 'النظام' },
          { key: 'light', label: 'فاتح' },
          { key: 'dark', label: 'داكن' },
        ]}
      />

      <Txt size="caption" color={theme.inkSoft}>
        حجم النصّ
      </Txt>
      <Segmented
        value={String(scale)}
        onPick={(key) => setScale(Number(key))}
        options={TEXT_SCALES.map((s, i) => ({ key: String(s), label: SCALE_LABEL[i] }))}
      />
    </View>
  );
}

function Segmented({
  options,
  value,
  onPick,
}: {
  options: { key: string; label: string }[];
  value: string;
  onPick: (key: string) => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.segment}>
      {options.map((option) => {
        const active = option.key === value;
        return (
          <Pressable
            key={option.key}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onPick(option.key)}
            style={[
              styles.segmentItem,
              {
                backgroundColor: active ? palette.emerald : theme.surface,
                borderColor: active ? palette.emerald : theme.border,
              },
            ]}
          >
            <Txt size="small" weight="bold" center color={active ? '#ffffff' : theme.inkSoft}>
              {option.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

function Field({
  label,
  value,
  onChange,
  latin,
  ...rest
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  latin?: boolean;
} & Omit<React.ComponentProps<typeof TextInput>, 'value' | 'onChange' | 'onChangeText' | 'style'>) {
  const theme = useTheme();
  return (
    <View style={styles.field}>
      <Txt size="caption" color={theme.inkSoft}>
        {label}
      </Txt>
      <TextInput
        {...rest}
        value={value}
        onChangeText={onChange}
        autoCapitalize="none"
        placeholderTextColor={theme.inkFaint}
        style={[
          styles.input,
          latin ? styles.ltr : styles.rtl,
          { backgroundColor: theme.surface, borderColor: theme.border, color: theme.ink },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  head: {
    alignItems: 'flex-end',
    paddingHorizontal: space.lg,
    paddingBottom: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  scroll: { padding: space.lg, gap: space.lg },
  summary: { padding: space.md, borderRadius: radius.md, borderWidth: 1 },
  alert: { padding: space.md, borderRadius: radius.md },
  block: { gap: space.md },
  card: { padding: space.lg, borderRadius: radius.lg, borderWidth: 1, gap: space.xs },
  rule: { flexDirection: 'row-reverse', alignItems: 'center', gap: space.sm },
  line: { flex: 1, height: StyleSheet.hairlineWidth },
  field: { gap: space.xs },
  segment: { flexDirection: 'row-reverse', gap: space.sm },
  segmentItem: {
    flex: 1,
    borderWidth: 2,
    borderRadius: radius.md,
    paddingVertical: space.sm,
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    fontFamily: 'Cairo_400Regular',
    fontSize: 16,
    minHeight: 48,
  },
  rtl: { textAlign: 'right', writingDirection: 'rtl' },
  ltr: { textAlign: 'right', writingDirection: 'ltr' },
  links: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
});
