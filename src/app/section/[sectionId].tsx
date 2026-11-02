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
import Svg, { Line } from 'react-native-svg';
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

/** ارتفاع الوصلة بين عقدتين، وعرض لوحتها: خليّة العقدة زائد تمايل الجانبين. */
const LINK_H = 26;
const CELL_W = 124;
const LINK_W = CELL_W + WEAVE_PX * 2;

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

  /** تُقاس كتلة الدروس لا لافتة الوحدة: صفوف الدروس تُنسب إليها. */
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

  // لافتات الوحدات تلتصق أعلى الشاشة، وذلك يوجب أن تكون أبناءً مباشرين للمِمرار.
  const body: React.ReactNode[] = [];
  const sticky: number[] = [];
  section.units.forEach((unit, unitIndex) => {
    sticky.push(body.length + 1);
    body.push(<UnitBanner key={`banner-${unit.id}`} unit={unit} unitIndex={unitIndex} />);
    body.push(
      <UnitLessons
        key={`lessons-${unit.id}`}
        unit={unit}
        nodes={nodes}
        currentIndex={currentIndex}
        isDone={isDone}
        onUnitTop={noteUnitTop}
        onCurrentRow={noteCurrentRow}
        onOpen={(unitId, lessonId) => router.push(`/lesson/${unitId}/${lessonId}`)}
      />,
    );
  });

  return (
    <View style={[styles.fill, { backgroundColor: theme.bg }]}>
      <Hud />
      <ScrollView
        ref={scroller}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + space.xxl }]}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={sticky}
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

        {body}
      </ScrollView>
    </View>
  );
}

function UnitBanner({ unit, unitIndex }: { unit: Unit; unitIndex: number }) {
  const tint = unitColors[unit.color] ?? unitColors.green;
  return (
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
  );
}

/** وصلة مائلة من العقدة السابقة إلى هذه — تُصمت ما دام ما قبلها لم يُتمّ. */
function Link({ shift, color }: { shift: number; color: string }) {
  const mid = LINK_W / 2;
  return (
    <Svg width={LINK_W} height={LINK_H} style={[styles.link, { left: (CELL_W - LINK_W) / 2 }]}>
      <Line
        x1={mid + shift}
        y1={0}
        x2={mid}
        y2={LINK_H}
        stroke={color}
        strokeWidth={6}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function UnitLessons({
  unit,
  nodes,
  currentIndex,
  isDone,
  onUnitTop,
  onCurrentRow,
  onOpen,
}: {
  unit: Unit;
  nodes: ReturnType<typeof flatten>;
  currentIndex: number;
  isDone: (key: string) => boolean;
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
      {unit.lessons.map((lesson, lessonIndex) => {
        const flatIndex = nodes.findIndex((n) => n.unit.id === unit.id && n.lesson.id === lesson.id);
        const state: NodeState =
          flatIndex < currentIndex ? 'done' : flatIndex === currentIndex ? 'current' : 'locked';
        const offset = WEAVE[lessonIndex % WEAVE.length] * WEAVE_PX;
        const prevOffset = WEAVE[(lessonIndex - 1 + WEAVE.length) % WEAVE.length] * WEAVE_PX;
        const prev = lessonIndex > 0 ? nodes[flatIndex - 1] : null;
        const linked = !!prev && isDone(prev.key);
        return (
          <View
            key={lesson.id}
            style={[
              styles.row,
              lessonIndex > 0 && { marginTop: LINK_H },
              { transform: [{ translateX: offset }] },
            ]}
            onLayout={
              flatIndex === currentIndex && currentIndex > 0
                ? (e: LayoutChangeEvent) => onCurrentRow(unit.id, e.nativeEvent.layout.y)
                : undefined
            }
          >
            {lessonIndex > 0 ? (
              <Link shift={prevOffset - offset} color={linked ? tint.base : theme.border} />
            ) : null}
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
  // بلا حشو أفقي هنا: اللافتة الملتصقة تمتدّ من حافة إلى حافة فلا يظهر خلفها شيء.
  scroll: {},
  header: {
    maxWidth: 480,
    alignSelf: 'center',
    width: '100%',
    borderRadius: radius.lg,
    padding: space.lg,
    marginTop: space.lg,
    marginHorizontal: space.lg,
    alignItems: 'flex-end',
    gap: space.xs,
  },
  headerTop: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: space.sm,
  },
  unit: { alignItems: 'center', paddingTop: space.lg, paddingHorizontal: space.lg },
  banner: {
    width: '100%',
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    marginTop: space.lg,
    alignItems: 'flex-end',
    gap: 2,
  },
  row: { marginVertical: space.sm },
  link: { position: 'absolute', top: -LINK_H, height: LINK_H },
  divider: {
    height: 1,
    alignSelf: 'stretch',
    marginTop: space.lg,
    marginHorizontal: space.lg,
    opacity: 0.6,
  },
});
