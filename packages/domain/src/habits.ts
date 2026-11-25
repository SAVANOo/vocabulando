export interface HabitState {
  currentStreak: number;
  longestStreak: number;
  freezeShields: number;
  totalXp: number;
  lastActiveDay: string | null; // YYYY-MM-DD (UTC)
  todayWordsViewed: number;
  todayQuizzesCompleted: number;
}

export type LexiconRank = "Aprendiz" | "Articulado" | "Eloquente" | "Erudito";

export const DAILY_GOAL_WORDS = 3;
export const DAILY_GOAL_QUIZZES = 1;

export function createInitialHabitState(): HabitState {
  return {
    currentStreak: 0,
    longestStreak: 0,
    freezeShields: 1, // Todo usuário começa com 1 escudo gentil
    totalXp: 0,
    lastActiveDay: null,
    todayWordsViewed: 0,
    todayQuizzesCompleted: 0,
  };
}

export function toUtcDay(isoTimestamp: string): string {
  const parsed = new Date(isoTimestamp);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid timestamp: ${isoTimestamp}`);
  }
  return parsed.toISOString().slice(0, 10);
}

function diffDaysUtc(fromDay: string, toDay: string): number {
  const a = Date.parse(`${fromDay}T00:00:00.000Z`);
  const b = Date.parse(`${toDay}T00:00:00.000Z`);
  return Math.round((b - a) / 86_400_000);
}

export function getLexiconRank(totalXp: number): LexiconRank {
  if (totalXp >= 1500) return "Erudito";
  if (totalXp >= 600) return "Eloquente";
  if (totalXp >= 150) return "Articulado";
  return "Aprendiz";
}

export function isDailyGoalMet(
  state: HabitState,
  goalWords: number = DAILY_GOAL_WORDS,
): boolean {
  return (
    state.todayWordsViewed >= goalWords ||
    state.todayQuizzesCompleted >= DAILY_GOAL_QUIZZES
  );
}

/**
 * Atualiza XP, progresso diário e ofensiva gentil (com uso automático de Escudo de Pausa).
 */
export function applyHabitAction(
  prev: HabitState,
  action: "WORD_VIEWED" | "QUIZ_CORRECT" | "QUIZ_WRONG" | "ACTIVE_SENTENCE",
  occurredAtIso: string,
  goalWords: number = DAILY_GOAL_WORDS,
): HabitState {
  const day = toUtcDay(occurredAtIso);
  let {
    currentStreak,
    longestStreak,
    freezeShields,
    totalXp,
    lastActiveDay,
    todayWordsViewed,
    todayQuizzesCompleted,
  } = prev;

  const isNewDay = lastActiveDay !== null && day !== lastActiveDay;
  if (isNewDay && lastActiveDay !== null) {
    const gap = diffDaysUtc(lastActiveDay, day);
    if (gap > 1) {
      const missedDays = gap - 1;
      if (freezeShields >= missedDays) {
        freezeShields -= missedDays;
      } else {
        currentStreak = 0;
      }
    }
    todayWordsViewed = 0;
    todayQuizzesCompleted = 0;
  }

  const goalWasMetToday =
    !isNewDay &&
    lastActiveDay === day &&
    (todayWordsViewed >= goalWords || todayQuizzesCompleted >= DAILY_GOAL_QUIZZES);

  const xpByAction: Record<typeof action, number> = {
    WORD_VIEWED: 5,
    QUIZ_CORRECT: 15,
    QUIZ_WRONG: 5,
    ACTIVE_SENTENCE: 25,
  };
  totalXp += xpByAction[action];

  if (action === "WORD_VIEWED") todayWordsViewed += 1;
  if (action === "QUIZ_CORRECT" || action === "QUIZ_WRONG") todayQuizzesCompleted += 1;

  const goalMetNow =
    todayWordsViewed >= goalWords || todayQuizzesCompleted >= DAILY_GOAL_QUIZZES;

  if (!goalWasMetToday && goalMetNow) {
    currentStreak += 1;
    longestStreak = Math.max(longestStreak, currentStreak);
    if (currentStreak > 0 && currentStreak % 7 === 0 && freezeShields < 3) {
      freezeShields += 1;
    }
  }

  return {
    currentStreak,
    longestStreak,
    freezeShields,
    totalXp,
    lastActiveDay: day,
    todayWordsViewed,
    todayQuizzesCompleted,
  };
}
