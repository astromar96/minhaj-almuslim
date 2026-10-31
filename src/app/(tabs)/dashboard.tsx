import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedBar } from '@/components/AnimatedBar';
import { Icon, type IconName } from '@/components/Icon';
import { Txt } from '@/components/Txt';
import { curriculum } from '@/content';
import { counted, LESSON } from '@/engine/arabic';
import { allLessons, flatten } from '@/engine/types';
import { useProgress } from '@/store/progress';
import { palette, radius, space, unitColors } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

export default function DashboardScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { xp, hearts, streak, doneCount, isDone, ready } = useProgress();

  const total = useMemo(() => allLessons(curriculum).length, []);
  const pct = total ? Math.round((doneCount / total) * 100) : 0;

  const sectionStats = useMemo(
    () =>
      curriculum.sections.map((section) => {
        const nodes = flatten(section);
        const done = nodes.filter((n) => isDone(n.key)).length;
        return {
          id: section.id,
          title: section.title,
          color: (unitColors[section.color] ?? unitColors.green).base,
          done,
          total: nodes.length,
          pct: nodes.length ? Math.round((done / nodes.length) * 100) : 0,
        };
      }),
    [isDone],
  );

  if (!ready) return <View style={[styles.fill, { backgroundColor: theme.bg }]} />;

  return (
    <View style={[styles.fill, { backgroundColor: theme.bg }]}>
      <View style={[styles.head, { paddingTop: insets.top + space.md, borderBottomColor: theme.border }]}>
        <Txt weight="black" size="title">
          إحصائياتي
        </Txt>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + space.xxl }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsRow}>
          <StatCard icon="gem" label="النقاط" value={String(xp)} tint={palette.sky} theme={theme} />
          <StatCard icon="fire" label="السلسلة" value={String(streak)} tint={palette.orange} theme={theme} />
          <StatCard icon="heart" label="القلوب" value={String(hearts)} tint={palette.ruby} theme={theme} />
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.cardHead}>
            <Txt weight="bold" size="lead">
              التقدّم الكلّي
            </Txt>
            <Txt weight="black" size="title" color={palette.emerald}>
              {pct}%
            </Txt>
          </View>
          <AnimatedBar
            pct={pct}
            height={12}
            trackColor={theme.surfaceAlt}
            fillColor={palette.emerald}
            fillOpacity={1}
          />
          <Txt size="caption" color={theme.inkSoft}>
            أتممتَ {doneCount} من {counted(total, LESSON)}
          </Txt>
        </View>

        <Txt weight="bold" size="lead" style={styles.sectionTitle}>
          تقدّم الأبواب
        </Txt>

        {sectionStats.map((s) => (
          <View key={s.id} style={[styles.sectionRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.sectionInfo}>
              <View style={styles.sectionLabel}>
                <View style={[styles.dot, { backgroundColor: s.color }]} />
                <Txt weight="bold">{s.title}</Txt>
              </View>
              <Txt size="caption" color={theme.inkSoft}>
                {s.done} / {s.total}
              </Txt>
            </View>
            <AnimatedBar
              pct={s.pct}
              height={8}
              trackColor={theme.surfaceAlt}
              fillColor={s.color}
              fillOpacity={1}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function StatCard({
  icon,
  label,
  value,
  tint,
  theme,
}: {
  icon: IconName;
  label: string;
  value: string;
  tint: string;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={[styles.stat, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Icon name={icon} size={28} color={tint} />
      <Txt weight="black" size="title" color={tint}>
        {value}
      </Txt>
      <Txt size="caption" color={theme.inkSoft}>
        {label}
      </Txt>
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
  statsRow: { flexDirection: 'row-reverse', gap: space.sm },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: space.xs,
    paddingVertical: space.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: space.lg,
    gap: space.sm,
  },
  cardHead: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: { marginTop: space.xs },
  sectionRow: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: space.lg,
    gap: space.sm,
  },
  sectionInfo: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionLabel: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: space.sm,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
