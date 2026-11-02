import { Pressable, StyleSheet, View } from 'react-native';
import { Icon } from '../Icon';
import { Txt } from '../Txt';
import { LIP, palette, radius, space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

export type ChoiceTone = 'idle' | 'selected' | 'correct' | 'wrong';

type Props = {
  label: string;
  tone: ChoiceTone;
  onPress: () => void;
  disabled?: boolean;
  badge?: 'check' | 'cross' | 'dot';
};

export function Choice({ label, tone, onPress, disabled, badge }: Props) {
  const theme = useTheme();
  const look = {
    idle: { bg: theme.surface, border: theme.border, ink: theme.ink },
    selected: { bg: theme.surface, border: palette.emerald, ink: palette.emerald },
    correct: { bg: theme.correctBg, border: theme.correctInk, ink: theme.correctInk },
    wrong: { bg: theme.wrongBg, border: theme.wrongInk, ink: theme.wrongInk },
  }[tone];

  return (
    <View style={styles.wrap}>
      <View style={[styles.lip, { backgroundColor: look.border, opacity: 0.45 }]} />
      <Pressable
        accessibilityRole="radio"
        accessibilityState={{ selected: tone !== 'idle', disabled: !!disabled }}
        disabled={disabled}
        onPress={onPress}
        style={[styles.face, { backgroundColor: look.bg, borderColor: look.border }]}
      >
        {badge ? (
          <View style={[styles.badge, { borderColor: look.border }]}>
            {badge === 'dot' ? (
              <Txt size="caption" weight="bold" color={look.ink}>
                •
              </Txt>
            ) : (
              <Icon name={badge === 'check' ? 'true' : 'false'} size={14} color={look.ink} />
            )}
          </View>
        ) : null}
        <Txt weight="medium" color={look.ink} style={styles.label}>
          {label}
        </Txt>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative' },
  lip: { position: 'absolute', left: 0, right: 0, top: LIP, bottom: 0, borderRadius: radius.lg },
  face: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: space.md,
    borderRadius: radius.lg,
    borderWidth: 2,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    minHeight: 56,
  },
  badge: {
    width: 26,
    height: 26,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { flex: 1 },
});
