export interface SrsCardState {
  wordId: string;
  repetitions: number;
  intervalDays: number;
  easeFactor: number;
  lapses: number;
  lastReviewedAt: string;
  nextReviewAt: string;
}

export type ReviewQuality = 1 | 2 | 3 | 4; // 1: Errei, 2: Difícil, 3: Bom, 4: Fácil

const MS_PER_DAY = 86_400_000;

export function createInitialSrsState(wordId: string, nowIso: string): SrsCardState {
  return {
    wordId,
    repetitions: 0,
    intervalDays: 0,
    easeFactor: 2.5,
    lapses: 0,
    lastReviewedAt: nowIso,
    nextReviewAt: nowIso,
  };
}

/**
 * Calcula o próximo estado SRS (baseado em SM-2 calibrado para micro-hábitos).
 * Função pura e determinística para facilitar testes unitários e sync entre Mobile/Web.
 */
export function scheduleSrsReview(
  current: SrsCardState,
  quality: ReviewQuality,
  nowIso: string,
): SrsCardState {
  const nowMs = Date.parse(nowIso);
  if (Number.isNaN(nowMs)) {
    throw new Error(`Invalid ISO timestamp: ${nowIso}`);
  }

  let repetitions = current.repetitions;
  let intervalDays = current.intervalDays;
  let easeFactor = current.easeFactor;
  let lapses = current.lapses;

  if (quality === 1) {
    // Errou: reinicia sequência sem punir drasticamente o ease factor
    repetitions = 0;
    intervalDays = 1;
    lapses += 1;
    easeFactor = Math.max(1.3, Number((easeFactor - 0.2).toFixed(2)));
  } else {
    if (repetitions === 0) {
      intervalDays = quality === 4 ? 3 : 1;
    } else if (repetitions === 1) {
      intervalDays = quality === 4 ? 6 : 3;
    } else {
      const multiplier = quality === 2 ? 1.2 : quality === 4 ? easeFactor * 1.25 : easeFactor;
      intervalDays = Math.max(1, Math.round(intervalDays * multiplier));
    }
    repetitions += 1;
    const delta = quality === 2 ? -0.1 : quality === 3 ? 0 : 0.12;
    easeFactor = Math.max(1.3, Math.min(3.0, Number((easeFactor + delta).toFixed(2))));
  }

  const nextReviewAt = new Date(nowMs + intervalDays * MS_PER_DAY).toISOString();

  return {
    wordId: current.wordId,
    repetitions,
    intervalDays,
    easeFactor,
    lapses,
    lastReviewedAt: nowIso,
    nextReviewAt,
  };
}

export function isDueForReview(state: SrsCardState, nowIso: string): boolean {
  return Date.parse(state.nextReviewAt) <= Date.parse(nowIso);
}
