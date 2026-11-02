import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { AnimatedBar } from '@/components/AnimatedBar';
import { Button } from '@/components/Button';
import { Confetti } from '@/components/Confetti';
import { Glossary, GlossaryNote } from '@/components/Glossary';
import { Icon } from '@/components/Icon';
import { Txt } from '@/components/Txt';
import { isAnswerComplete, QuestionView } from '@/components/questions';
import { curriculum } from '@/content';
import { correctAnswerText, grade, type Answer } from '@/engine/grade';
import {
  advance,
  currentItem,
  finalXp,
  isComplete,
  itemKey,
  progress as sessionProgress,
  startSession,
  stepNumber,
  type Session,
} from '@/engine/session';
import { allUnits, isQuestion } from '@/engine/types';
import { routeId } from '@/lib/route';
import { useProgress } from '@/store/progress';
import { palette, radius, space, unitColors } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

export async function generateStaticParams(): Promise<Record<string, string>[]> {
  return allUnits(curriculum).flatMap((unit) =>
    unit.lessons.map((lesson) => ({ unitId: unit.id, lessonId: lesson.id })),
  );
}

type Phase =
  | { kind: 'answering' }
  | { kind: 'checked'; correct: boolean }
  | { kind: 'finished' };

export default function LessonScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { unitId, lessonId } = useLocalSearchParams<{ unitId: string; lessonId: string }>();
  const { hearts, loseHeart, completeLesson } = useProgress();

  const found = useMemo(() => {
    const uid = routeId(unitId);
    const lid = routeId(lessonId);
    const unit = allUnits(curriculum).find((u) => u.id === uid);
    const lesson = unit?.lessons.find((l) => l.id === lid);
    return unit && lesson ? { unit, lesson } : null;
  }, [unitId, lessonId]);

  const [session, setSession] = useState<Session | null>(() =>
    found ? startSession(found.lesson) : null,
  );
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [phase, setPhase] = useState<Phase>({ kind: 'answering' });

  const feedbackAnim = useSharedValue(0);
  useEffect(() => {
    if (phase.kind === 'checked') {
      feedbackAnim.value = withTiming(1, { duration: 300 });
    } else {
      feedbackAnim.value = 0;
    }
  }, [phase.kind]);
  const feedbackStyle = useAnimatedStyle(() => ({
    opacity: feedbackAnim.value,
    transform: [{ translateY: (1 - feedbackAnim.value) * 12 }],
  }));

  const close = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }, [router]);

  if (!found || !session) {
    return (
      <Centered>
        <Txt weight="bold" size="title" center>
          تعذّر العثور على هذا الدرس
        </Txt>
        <Button label="رجوع" onPress={close} style={styles.wide} />
      </Centered>
    );
  }

  const { unit, lesson } = found;
  const tint = (unitColors[unit.color] ?? unitColors.green).base;
  const item = currentItem(session);
  const seed = `${lesson.id}:${item ? lesson.items.indexOf(item) : 0}`;

  if (hearts <= 0 && phase.kind !== 'finished') {
    return (
      <Centered>
        <Icon name="heart-broken" size={64} color={palette.ruby} />
        <Txt weight="bold" size="title" center>
          نفدت القلوب
        </Txt>
        <Txt color={theme.inkSoft} center>
          يعود قلب كل عشرين دقيقة. استرح قليلًا ثم عُد.
        </Txt>
        <Button label="رجوع إلى المسار" onPress={close} tint={tint} style={styles.wide} />
      </Centered>
    );
  }

  if (phase.kind === 'finished' || !item) {
    const gained = finalXp(session);
    return (
      <Centered>
        <Confetti />
        <Icon
          name={session.mistakes === 0 ? 'medal' : 'sparkle'}
          size={64}
          color={session.mistakes === 0 ? palette.gold : tint}
        />
        <Txt weight="black" size="display" center>
          أتممتَ الدرس
        </Txt>
        <Txt color={theme.inkSoft} center>
          {lesson.title}
        </Txt>
        <View style={styles.scoreRow}>
          <Score label="نقاط مكتسبة" value={String(gained)} tint={tint} />
          <Score label="أخطاء" value={String(session.mistakes)} tint={theme.inkSoft} />
        </View>
        {session.mistakes === 0 ? (
          <Txt size="small" color={theme.correctInk} center>
            بلا خطأ — مكافأة إضافية
          </Txt>
        ) : null}
        <Button
          label="متابعة"
          tint={tint}
          style={styles.wide}
          onPress={() => {
            completeLesson(`${unit.id}/${lesson.id}`, gained);
            close();
          }}
        />
      </Centered>
    );
  }

  const onInfoNext = () => {
    const next = advance(session, { kind: 'info' });
    setSession(next);
    setAnswer(null);
    setPhase(isComplete(next) ? { kind: 'finished' } : { kind: 'answering' });
  };

  const onCheck = () => {
    if (!isQuestion(item) || !answer) return;
    const correct = grade(item, answer);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(
        correct ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error,
      ).catch(() => {});
    }
    if (!correct) loseHeart();
    setPhase({ kind: 'checked', correct });
  };

  const onContinue = () => {
    if (phase.kind !== 'checked' || !isQuestion(item)) return;
    const key = itemKey(lesson.id, item, lesson.items.indexOf(item));
    const next = advance(
      session,
      phase.correct ? { kind: 'correct' } : { kind: 'wrong', key },
    );
    setSession(next);
    setAnswer(null);
    setPhase(isComplete(next) ? { kind: 'finished' } : { kind: 'answering' });
  };

  const revealed = phase.kind === 'checked';
  const pct = Math.round(sessionProgress(session) * 100);

  return (
    <View style={[styles.fill, { backgroundColor: theme.bg, paddingTop: insets.top + space.sm }]}>
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" accessibilityLabel="إغلاق الدرس" onPress={close} hitSlop={12}>
          <Icon name="close" size={22} color={theme.inkFaint} />
        </Pressable>
        <View style={styles.trackWrap}>
          <AnimatedBar pct={pct} height={14} trackColor={theme.surfaceAlt} fillColor={tint} fillOpacity={1} />
        </View>
        <View style={styles.heartsRow}>
          <Icon name="heart" size={18} color={hearts <= 2 ? palette.ruby : theme.inkSoft} />
          <Txt weight="bold" size="small" color={hearts <= 2 ? palette.ruby : theme.inkSoft}>
            {hearts}
          </Txt>
        </View>
      </View>

      <ScrollView
        style={styles.fill}
        contentContainerStyle={[styles.body, { paddingBottom: space.xxl }]}
        showsVerticalScrollIndicator={false}
      >
        <Txt size="caption" color={theme.inkFaint}>
          {unit.title} · {item.t === 'info' ? 'بطاقة' : 'سؤال'} {stepNumber(session)} من{' '}
          {session.totalSteps}
        </Txt>

        {item.t === 'info' ? (
          <View style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: tint }]}>
            <Txt weight="bold" size="title" color={tint}>
              {item.h}
            </Txt>
            <Txt size="lead" style={styles.infoBody}>
              {item.b}
            </Txt>
            <Txt size="caption" color={theme.inkFaint}>
              منهاج المسلم، ص {item.src}
            </Txt>
          </View>
        ) : (
          <>
            <Txt weight="bold" size="title" style={styles.prompt}>
              {item.q}
            </Txt>
            <QuestionView
              question={item}
              seed={seed}
              value={answer}
              onChange={setAnswer}
              revealed={revealed}
            />
          </>
        )}

        <Glossary item={item} tint={tint} />
      </ScrollView>

      <View
        style={[
          styles.footer,
          { paddingBottom: insets.bottom + space.lg, borderTopColor: theme.border },
          revealed && {
            backgroundColor: phase.correct ? theme.correctBg : theme.wrongBg,
            borderTopColor: 'transparent',
          },
        ]}
      >
        {revealed && isQuestion(item) ? (
          <Animated.View style={feedbackStyle}>
            <View style={styles.feedback}>
              <View style={styles.feedbackTitle}>
                <Icon
                  name={phase.correct ? 'check' : 'close'}
                  size={20}
                  color={phase.correct ? theme.correctInk : theme.wrongInk}
                />
                <Txt weight="black" size="lead" color={phase.correct ? theme.correctInk : theme.wrongInk}>
                  {phase.correct ? 'أحسنت' : `الصواب: ${correctAnswerText(item)}`}
                </Txt>
              </View>
              <Txt size="small" color={phase.correct ? theme.correctInk : theme.wrongInk}>
                {item.e}
              </Txt>
              <GlossaryNote item={item} ink={phase.correct ? theme.correctInk : theme.wrongInk} />
              <Txt size="caption" color={phase.correct ? theme.correctInk : theme.wrongInk} style={styles.src}>
                منهاج المسلم، ص {item.src}
              </Txt>
            </View>
          </Animated.View>
        ) : null}

        {item.t === 'info' ? (
          <Button label="فهمت" onPress={onInfoNext} tint={tint} />
        ) : revealed ? (
          <Button
            label="متابعة"
            onPress={onContinue}
            variant={phase.correct ? 'primary' : 'danger'}
            tint={phase.correct ? palette.emerald : undefined}
          />
        ) : (
          <Button
            label="تحقّق"
            onPress={onCheck}
            tint={tint}
            disabled={!isAnswerComplete(item, answer)}
          />
        )}
      </View>
    </View>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.centered,
        { backgroundColor: theme.bg, paddingTop: insets.top + space.xxl, paddingBottom: insets.bottom + space.xl },
      ]}
    >
      {children}
    </View>
  );
}

function Score({ label, value, tint }: { label: string; value: string; tint: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.score, { borderColor: tint }]}>
      <Txt size="caption" color={theme.inkSoft}>
        {label}
      </Txt>
      <Txt weight="black" size="title" color={tint}>
        {value}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.md,
    paddingHorizontal: space.xl,
  },
  wide: { alignSelf: 'stretch', marginTop: space.lg, maxWidth: 420, width: '100%' },
  topBar: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingBottom: space.md,
  },
  trackWrap: { flex: 1 },
  heartsRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: space.xs },
  body: { paddingHorizontal: space.lg, gap: space.lg },
  prompt: { marginBottom: space.xs },
  infoCard: { borderRadius: radius.lg, borderWidth: 2, padding: space.lg, gap: space.sm },
  infoBody: { marginBottom: space.xs },
  footer: {
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
    gap: space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  feedback: { gap: space.xs },
  feedbackTitle: { flexDirection: 'row-reverse', alignItems: 'center', gap: space.sm },
  src: { opacity: 0.75 },
  scoreRow: { flexDirection: 'row-reverse', gap: space.lg, marginTop: space.sm },
  score: {
    borderWidth: 2,
    borderRadius: radius.lg,
    paddingVertical: space.md,
    paddingHorizontal: space.xl,
    alignItems: 'center',
    minWidth: 110,
  },
});
