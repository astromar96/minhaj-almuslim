import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Icon } from './Icon';
import { Txt } from './Txt';
import { LIP, radius, space } from '@/theme/tokens';
import { useIsDark, useTheme } from '@/theme/useTheme';
import { shade } from './Button';

export type NodeState = 'done' | 'current' | 'locked';

type Props = {
  index: number;
  label: string;
  state: NodeState;
  tint: string;
  onPress: () => void;
};

const SIZE = 72;
const HALO_GAP = 6;

export function PathNodeButton({ index, label, state, tint, onPress }: Props) {
  const theme = useTheme();
  const dark = useIsDark();
  const [down, setDown] = useState(false);
  const locked = state === 'locked';

  const fill = locked ? theme.locked : tint;
  const ink = locked ? theme.lockedInk : '#ffffff';

  const pulse = useSharedValue(1);
  useEffect(() => {
    if (state === 'current') {
      pulse.value = withRepeat(
        withSequence(withTiming(1.12, { duration: 900 }), withTiming(1, { duration: 900 })),
        -1,
      );
    } else {
      pulse.value = 1;
    }
  }, [state]);
  const haloStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  return (
    <View style={styles.cell}>
      <View style={styles.circleWrap}>
        {state === 'current' ? (
          <Animated.View
            style={[styles.halo, { borderColor: tint, opacity: dark ? 0.6 : 0.35 }, haloStyle]}
          />
        ) : null}
        <View style={[styles.lip, { backgroundColor: locked ? theme.borderStrong : shade(tint) }]} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label}${locked ? ' — مُقفل' : ''}`}
          accessibilityState={{ disabled: locked }}
          disabled={locked}
          onPress={() => {
            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
            onPress();
          }}
          onPressIn={() => setDown(true)}
          onPressOut={() => setDown(false)}
          style={[
            styles.circle,
            { backgroundColor: fill, transform: [{ translateY: down && !locked ? LIP : 0 }] },
          ]}
        >
          {state === 'done' ? (
            <Icon name="check" size={28} color={ink} />
          ) : locked ? (
            <Icon name="lock" size={22} color={ink} />
          ) : (
            <Txt weight="black" size="lead" color={ink} center>
              {String(index + 1)}
            </Txt>
          )}
        </Pressable>
      </View>
      <Txt
        size="caption"
        weight={state === 'current' ? 'bold' : 'medium'}
        center
        color={locked ? theme.lockedInk : theme.inkSoft}
        numberOfLines={2}
        style={styles.label}
      >
        {label}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  cell: { alignItems: 'center', width: 124 },
  circleWrap: { width: SIZE, height: SIZE + LIP, justifyContent: 'center' },
  halo: {
    position: 'absolute',
    top: LIP / 2 - HALO_GAP,
    bottom: LIP / 2 - HALO_GAP,
    left: -HALO_GAP,
    right: -HALO_GAP,
    borderRadius: radius.pill,
    borderWidth: 3,
  },
  lip: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: LIP,
    height: SIZE,
    borderRadius: radius.pill,
  },
  circle: {
    width: SIZE,
    height: SIZE,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { marginTop: space.sm, paddingHorizontal: space.xs },
});
