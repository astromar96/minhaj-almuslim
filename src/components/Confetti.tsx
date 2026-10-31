import { useEffect, useMemo } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { palette } from '@/theme/tokens';

const COLORS = [palette.emerald, palette.gold, palette.sky, palette.violet, palette.rose, palette.orange];
const COUNT = 30;

type Seed = {
  cx: number;
  dx: number;
  dy: number;
  color: string;
  size: number;
  delay: number;
  spin: number;
};

export function Confetti() {
  const seeds = useMemo(() => {
    const { width } = Dimensions.get('window');
    const cx = width / 2;
    return Array.from({ length: COUNT }, (_, i) => {
      const angle = (Math.PI * 2 * i) / COUNT + (Math.random() - 0.5) * 0.4;
      const dist = 80 + Math.random() * 150;
      return {
        cx,
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist - 80,
        color: COLORS[i % COLORS.length],
        size: 6 + Math.random() * 5,
        delay: Math.random() * 250,
        spin: (Math.random() - 0.5) * 720,
      };
    });
  }, []);

  return (
    <Animated.View style={StyleSheet.absoluteFill} pointerEvents="none">
      {seeds.map((s, i) => (
        <Dot key={i} s={s} />
      ))}
    </Animated.View>
  );
}

function Dot({ s }: { s: Seed }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(s.delay, withTiming(1, { duration: 1100, easing: Easing.out(Easing.quad) }));
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: s.cx + s.dx * t.value },
      { translateY: 160 + s.dy * t.value + 280 * t.value * t.value },
      { rotate: `${s.spin * t.value}deg` },
    ],
    opacity: 1 - t.value * 0.9,
  }));

  return (
    <Animated.View
      style={[
        { position: 'absolute', width: s.size, height: s.size, borderRadius: s.size / 3, backgroundColor: s.color },
        style,
      ]}
    />
  );
}
