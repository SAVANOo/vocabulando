import type { LanguageCode, RegisterLevel, TrackCategory, WordEntry } from "@vocabulando/domain";

const TOKEN_STORAGE_KEY = "vocabulando_auth_token";

export interface MeResponse {
  id: string;
  authKind: "guest" | "account";
  displayName: string;
  plan: "free" | "pro";
  preferences: Record<string, unknown>;
  habit: {
    currentStreak: number;
    longestStreak: number;
    freezeShields: number;
    totalXp: number;
    todayWordsViewed: number;
    todayQuizzesCompleted: number;
  };
  rank: string;
  dailyGoalMet: boolean;
}

export async function ensureAuthToken(): Promise<string> {
  const cached = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (cached) {
    const check = await fetch("/api/me", {
      headers: { Authorization: `Bearer ${cached}` },
    });
    if (check.ok) return cached;
  }
  const res = await fetch("/api/auth/guest", { method: "POST" });
  const data = (await res.json()) as { token: string };
  localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
  return data.token;
}

export function setAuthToken(token: string) {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export async function apiFetch<T>(
  token: string,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? `Erro HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function fetchFeed(
  token: string,
  lang: LanguageCode,
  category?: TrackCategory | "",
): Promise<WordEntry[]> {
  const qs = new URLSearchParams({ lang });
  if (category) qs.set("category", category);
  const data = await apiFetch<{ items: WordEntry[] }>(token, `/api/feed?${qs.toString()}`);
  return data.items;
}

export async function recordEvent(
  token: string,
  type: "WORD_VIEWED" | "QUIZ_ANSWERED" | "ACTIVE_SENTENCE_SUBMITTED",
  wordId: string,
  payload: Record<string, unknown> = {},
): Promise<{ habit: MeResponse["habit"]; rank: string; dailyGoalMet: boolean }> {
  return apiFetch(token, "/api/events", {
    method: "POST",
    body: JSON.stringify({
      eventId: crypto.randomUUID(),
      type,
      wordId,
      occurredAt: new Date().toISOString(),
      payload,
    }),
  });
}

export async function refineText(
  token: string,
  text: string,
  targetRegister: RegisterLevel,
) {
  return apiFetch<{
    suggestions: Array<{ original: string; suggestion: string; note: string }>;
    refinedPreview: string;
  }>(token, "/api/ai/refine-text", {
    method: "POST",
    body: JSON.stringify({ text, targetRegister }),
  });
}
