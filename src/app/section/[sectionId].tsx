import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type ScrollViewInstance,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedBar } from '@/components/AnimatedBar';
import { Hud } from '@/components/Hud';
import { Icon } from '@/components/Icon';
import { PathNodeButton, type NodeState } from '@/components/PathNodeButton';
import { Txt } from '@/components/Txt';
import { curriculum } from '@/content';
import { counted, LESSON } from '@/engine/arabic';
import { routeId } from '@/lib/route';
import { flatten, type Unit } from '@/engine/types';
import { useProgress } from '@/store/progress';
import { radius, space, unitColors } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

const WEAVE = [0, 1, 0, -1];
const WEAVE_PX = 56;

export async function generateStaticParams(): Promise<Record<string, string>[]> {
  return curriculum.sections.map((section) => ({ sectionId: section.id }));
}

export default function SectionScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { sectionId } = useLocalSearchParams<{ sectionId: string }>();
  const { isDone, ready } = useProgress();

  const section = useMemo(
    () => curriculum.sections.find((s) => s.id === routeId(sectionId)) ?? null,
    [sectionId],
  );
  const nodes = useMemo(() => (section ? flatten(section) : []), [section]);
  const currentIndex = useMemo(() => {
    const i = nodes.findIndex((n) => !isDone(n.key));
    return i === -1 ? nodes.length : i;
  }, [nodes, isDone]);

  const scroller = useRef<ScrollViewInstance>(null);
  const unitTops = useRef<Record<string, number>>({});
  const currentRow = useRef<{ unitId: string; y: number } | null>(null);
  const jumped = useRef(false);
  const [measured, setMeasured] = useState(0);

  const noteUnitTop = useCallback((unitId: string, y: number) => {
    unitTops.current[unitId] = y;
    setMeasured((n) => n + 1);
  }, []);
  const noteCurrentRow = useCallback((unitId: string, y: number) => {
    currentRow.current = { unitId, y };
    setMeasured((n) => n + 1);
  }, []);

  useEffect(() => {
    if (jumped.current) return;
    const row = currentRow.current;
    if (!row) return;
    const top = unitTops.current[row.unitId];
    if (top === undefined) return;
    jumped.current = true;
    const id = requestAnimationFrame(() =>
      scroller.current?.scrollTo({ y: Math.max(0, top + row.y - 160), animated: false }),
    );
    return () => cancelAnimationFrame(id);
  }, [measured]);

  const back = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  if (!section) {
    return (
      <View style={[styles.fill, styles.center, { backgroundColor: theme.bg }]}>
        <Txt weight="bold" size="title" center>
          تعذّر العثور على هذا الباب
        </Txt>
        <Pressable accessibilityRole="button" onPress={back} style={styles.backLink}>
          <Txt weight="bold" color={unitColors.green.base}>
            رجوع إلى الأبواب
          </Txt>
        </Pressable>
      </View>
    );
  }

  if (!ready) return <View style={[styles.fill, { backgroundColor: theme.bg }]} />;

  const done = nodes.filter((n) => isDone(n.key)).length;
  const tint = unitColors[section.color] ?? unitColors.green;
  const pct = nodes.length ? Math.round((done / nodes.length) * 100) : 0;

  return (
    <View style={[styles.fill, { backgroundColor: theme.bg }]}>
      <Hud />
      <ScrollView
        ref={scroller}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + space.xxl }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { backgroundColor: tint.base }]}>
          <View style={styles.headerTop}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="رجوع إلى الأبواب"
              onPress={back}
              hitSlop={12}
            >
              <Icon name="arrow-back" size={24} color="#ffffff" />
            </Pressable>
            <Txt weight="black" size="title" color="#ffffff">
              {section.title}
            </Txt>
          </View>
          <Txt size="caption" weight="semibold" color="rgba(255,255,255,0.75)">
            {section.subtitle} · ص {section.pages[0]}–{section.pages[1]}
          </Txt>
          <AnimatedBar
            pct={pct}
            height={10}
            trackColor="rgba(0,0,0,0.18)"
            fillColor="#ffffff"
            fillOpacity={0.9}
            style={{ marginTop: space.sm }}
          />
          <Txt size="caption" color="rgba(255,255,255,0.85)">
            أتممتَ {done} من {counted(nodes.length, LESSON)}
          </Txt>
        </View>

        {section.units.map((unit, unitIndex) => (
          <UnitSection
            key={unit.id}
            unit={unit}
            unitIndex={unitIndex}
            nodes={nodes}
            currentIndex={currentIndex}
            onUnitTop={noteUnitTop}
            onCurrentRow={noteCurrentRow}
            onOpen={(unitId, lessonId) => router.push(`/lesson/${unitId}/${lessonId}`)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function UnitSection({
  unit,
  unitIndex,
  nodes,
  currentIndex,
  onUnitTop,
  onCurrentRow,
  onOpen,
}: {
  unit: Unit;
  unitIndex: number;
  nodes: ReturnType<typeof flatten>;
  currentIndex: number;
  onUnitTop: (unitId: string, y: number) => void;
  onCurrentRow: (unitId: string, y: number) => void;
  onOpen: (unitId: string, lessonId: string) => void;
}) {
  const theme = useTheme();
  const tint = unitColors[unit.color] ?? unitColors.green;

  return (
    <View
      style={styles.unit}
      onLayout={(e: LayoutChangeEvent) => onUnitTop(unit.id, e.nativeEvent.layout.y)}
    >
      <View style={[styles.banner, { backgroundColor: tint.base }]}>
        <Txt size="caption" weight="semibold" color="rgba(255,255,255,0.85)">
          الوحدة {unitIndex + 1} · {unit.subtitle}
        </Txt>
        <Txt weight="bold" size="lead" color="#ffffff">
          {unit.title}
        </Txt>
        <Txt size="caption" color="rgba(255,255,255,0.75)">
          ص {unit.source.pages[0]}–{unit.source.pages[1]}
        </Txt>
      </View>

      {unit.lessons.map((lesson, lessonIndex) => {
        const flatIndex = nodes.findIndex((n) => n.unit.id === unit.id && n.lesson.id === lesson.id);
        const state: NodeState =
          flatIndex < currentIndex ? 'done' : flatIndex === currentIndex ? 'current' : 'locked';
        const offset = WEAVE[lessonIndex % WEAVE.length] * WEAVE_PX;
        return (
          <View
            key={lesson.id}
            style={[styles.row, { transform: [{ translateX: offset }] }]}
            onLayout={
              flatIndex === currentIndex && currentIndex > 0
                ? (e: LayoutChangeEvent) => onCurrentRow(unit.id, e.nativeEvent.layout.y)
                : undefined
            }
          >
            <PathNodeButton
              index={lessonIndex}
              label={lesson.title}
              state={state}
              tint={tint.base}
              onPress={() => onOpen(unit.id, lesson.id)}
            />
          </View>
        );
      })}

      <View style={[styles.divider, { backgroundColor: theme.border }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center', gap: space.lg },
  backLink: { padding: space.md },
  scroll: { paddingHorizontal: space.lg },
  header: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    borderRadius: radius.lg,
    padding: space.lg,
    marginTop: space.lg,
    alignItems: 'flex-end',
    gap: space.xs,
  },
  headerTop: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: space.sm,
  },
  unit: { alignItems: 'center' },
  banner: {
    width: '100%',
    maxWidth: 480,
    borderRadius: radius.lg,
    padding: space.lg,
    marginTop: space.lg,
    marginBottom: space.md,
    alignItems: 'flex-end',
    gap: 2,
  },
  row: { marginVertical: space.sm },
  divider: { height: 1, alignSelf: 'stretch', marginTop: space.lg, opacity: 0.6 },
});
