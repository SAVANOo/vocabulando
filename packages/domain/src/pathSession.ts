import type { SrsCardState } from "./srs.ts";

export type DynamicActivityFormat =
  | "reading"
  | "listening"
  | "synonyms"
  | "quiz"
  | "writing"
  | "paronyms";

/**
 * Calcula o peso adaptativo de aparição: palavras erradas ou com baixa facilidade
 * retornam com mais frequência do que palavras já dominadas.
 */
export function computeAdaptiveWordWeight(
  wordId: string,
  srsCards: Record<string, SrsCardState> | undefined,
  studiedSet: Set<string>,
): number {
  const card = srsCards?.[wordId];
  if (card) {
    if (card.lapses > 0 || card.easeFactor < 2.2) return 3;
    if (card.repetitions >= 3 && card.easeFactor >= 2.5) return 1;
    return 2;
  }
  return studiedSet.has(wordId) ? 1 : 2;
}

/**
 * Escolhe dinamicamente o formato da atividade para que uma mesma palavra
 * retorne em contextos e estímulos variados (áudio, escrita, sinônimo, lacuna).
 */
export function selectDynamicActivityFormat(
  stepIndex: number,
  isReview: boolean,
  hasParonym = false,
): DynamicActivityFormat {
  if (hasParonym && stepIndex % 5 === 4) return "paronyms";
  const reviewCycle: DynamicActivityFormat[] = ["quiz", "writing", "listening", "synonyms"];
  const freshCycle: DynamicActivityFormat[] = ["reading", "listening", "synonyms", "quiz", "writing"];
  const pool = isReview ? reviewCycle : freshCycle;
  return pool[stepIndex % pool.length]!;
}

/**
 * Monta uma fila adaptativa de prática combinando palavras novas da trilha ativa
 * com palavras que precisam de reforço (erros anteriores / revisão espaçada).
 */
export function buildMixedPracticeQueue<T extends { id: string }>(
  pool: T[],
  studiedIds: string[],
  dueIds: string[],
  seed: number,
  count = 4,
  srsCards?: Record<string, SrsCardState>,
): Array<{ item: T; isReview: boolean }> {
  if (pool.length === 0 || count <= 0) return [];

  const studiedSet = new Set(studiedIds);
  const dueSet = new Set(dueIds);

  const reviewPool = pool
    .filter((w) => dueSet.has(w.id) || studiedSet.has(w.id))
    .sort(
      (a, b) =>
        computeAdaptiveWordWeight(b.id, srsCards, studiedSet) -
        computeAdaptiveWordWeight(a.id, srsCards, studiedSet),
    );
  const freshPool = pool.filter((w) => !studiedSet.has(w.id));

  const result: Array<{ item: T; isReview: boolean }> = [];
  const usedIds = new Set<string>();

  for (let i = 0; i < count; i++) {
    const shouldPickReview = i % 3 === 2 && reviewPool.length > 0;
    const primary = shouldPickReview
      ? reviewPool
      : freshPool.length > 0
        ? freshPool
        : pool;

    let picked: T | undefined;
    for (let step = 0; step < primary.length; step++) {
      const candidate = primary[(seed + i + step) % primary.length]!;
      if (!usedIds.has(candidate.id)) {
        picked = candidate;
        break;
      }
    }
    if (!picked) {
      picked = pool[(seed + i) % pool.length]!;
    }
    usedIds.add(picked.id);
    result.push({
      item: picked,
      isReview: dueSet.has(picked.id) || studiedSet.has(picked.id),
    });
  }

  return result;
}
