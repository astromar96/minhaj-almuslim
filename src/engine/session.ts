import type { Item, Lesson } from './types';
import { isQuestion } from './types';

export const XP_PER_CORRECT = 10;
export const XP_LESSON_BONUS = 20;

/** حالة جلسة درس واحد. */
export type Session = {
  lessonId: string;
  /** طابور العناصر المتبقية — العنصر الأول هو المعروض الآن. */
  queue: Item[];
  /** عدد الأسئلة وحدها — لترقيم السؤال وحساب الإتقان. */
  totalQuestions: number;
  /** كل خطوات الدرس: البطاقات والأسئلة. الشريط يتقدّم بها جميعًا. */
  totalSteps: number;
  /** الأسئلة التي أُجيبت صحيحًا ولن تعود. */
  cleared: number;
  /** الخطوات التي غادرت الطابور — بطاقةً كانت أو سؤالًا محسومًا. */
  clearedSteps: number;
  /** إجابات خاطئة في هذه الجلسة — تُستعمل في شاشة النهاية. */
  mistakes: number;
  xp: number;
  /** معرّفات الأسئلة التي أُخطئت ولو مرة — للمراجعة لاحقًا. */
  missed: string[];
};

/** مفتاح ثابت للعنصر داخل الدرس — للخلط ولتتبّع الأخطاء. */
export const itemKey = (lessonId: string, item: Item, index: number) =>
  `${lessonId}:${index}:${item.t}`;

export function startSession(lesson: Lesson): Session {
  return {
    lessonId: lesson.id,
    queue: lesson.items.slice(),
    totalQuestions: lesson.items.filter(isQuestion).length,
    totalSteps: lesson.items.length,
    cleared: 0,
    clearedSteps: 0,
    mistakes: 0,
    xp: 0,
    missed: [],
  };
}

export type Advance =
  | { kind: 'info' }
  | { kind: 'correct' }
  | { kind: 'wrong'; key: string };

/**
 * ينقل الجلسة إلى العنصر التالي.
 * - `info` و`correct` يُخرجان العنصر من الطابور.
 * - `wrong` يعيده إلى آخر الطابور حتى يُجاب صحيحًا.
 */
export function advance(session: Session, outcome: Advance): Session {
  const [current, ...rest] = session.queue;
  if (!current) return session;

  if (outcome.kind === 'wrong') {
    return {
      ...session,
      queue: [...rest, current],
      mistakes: session.mistakes + 1,
      missed: session.missed.includes(outcome.key)
        ? session.missed
        : [...session.missed, outcome.key],
    };
  }

  return {
    ...session,
    queue: rest,
    cleared: outcome.kind === 'correct' ? session.cleared + 1 : session.cleared,
    clearedSteps: session.clearedSteps + 1,
    xp: outcome.kind === 'correct' ? session.xp + XP_PER_CORRECT : session.xp,
  };
}

export const currentItem = (session: Session): Item | undefined => session.queue[0];

export const isComplete = (session: Session): boolean => session.queue.length === 0;

/**
 * نسبة الإنجاز بين ٠ و١، محسوبة على كلّ الخطوات لا على الأسئلة وحدها:
 * كلّ درس يبدأ ببطاقة أو بطاقتين، فلو عُدَّت الأسئلة فقط لبقي الشريط
 * على الصفر في أوّل شاشتين من كلّ درس وبدا معطّلًا.
 */
export function progress(session: Session): number {
  if (session.totalSteps === 0) return isComplete(session) ? 1 : 0;
  return Math.min(1, session.clearedSteps / session.totalSteps);
}

/** ترتيب الخطوة المعروضة الآن، ابتداءً من واحد. */
export const stepNumber = (session: Session): number =>
  Math.min(session.clearedSteps + 1, session.totalSteps);

/** النقاط النهائية: نقاط الإجابات + مكافأة إتمام بلا أخطاء. */
export function finalXp(session: Session): number {
  return session.xp + (session.mistakes === 0 ? XP_LESSON_BONUS : 0);
}
