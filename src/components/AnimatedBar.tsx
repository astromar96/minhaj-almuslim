import { useEffect, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { radius } from '@/theme/tokens';

type Props = {
  pct: number;
  height?: number;
  trackColor: string;
  fillColor: string;
  fillOpacity?: number;
  style?: ViewStyle;
};

export function AnimatedBar({ pct, height = 10, trackColor, fillColor, fillOpacity = 0.9, style }: Props) {
  const [tw, setTw] = useState(0);
  const fw = useSharedValue(0);

  useEffect(() => {
    const target = tw * (Math.max(0, Math.min(100, pct)) / 100);
    fw.value = tw > 0 ? withTiming(target, { duration: 600 }) : 0;
  }, [pct, tw]);

  const fill = useAnimatedStyle(() => ({ width: fw.value }));

  return (
    <View
      onLayout={(e: LayoutChangeEvent) => setTw(e.nativeEvent.layout.width)}
      style={[styles.track, { height, backgroundColor: trackColor }, style]}
    >
      <Animated.View style={[styles.fill, { backgroundColor: fillColor, opacity: fillOpacity }, fill]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: '100%', borderRadius: radius.pill, overflow: 'hidden' },
  fill: { position: 'absolute', right: 0, top: 0, bottom: 0, borderRadius: radius.pill },
});
