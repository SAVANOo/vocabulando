import * as SQLite from "expo-sqlite";
import type { DifficultyLevel, HabitState, SrsCardState, TrackCategory, UserEvent } from "@vocabulando/domain";
import { createInitialHabitState } from "@vocabulando/domain";
import type { UserPreferences } from "../components/OnboardingFlow";
import { MOBILE_LEXICON, type MobileWordEntry } from "../data/mobileLexicon";
import type { ThemeMode } from "../theme/palettes";

export interface PersistedMobileState {
  prefs: UserPreferences;
  themeMode: ThemeMode;
  autoNightMode: boolean;
  preferredReminderHour: number;
  soundEnabled: boolean;
  seenOnboarding: boolean;
  seenTutorial: boolean;
  habit: HabitState;
  savedIds: string[];
  studiedIds: string[];
  completedNodeIds: string[];
  srsCards: Record<string, SrsCardState>;
  quizTotal: number;
  quizCorrect: number;
  weeklyXp: number[];
}

const DEFAULT_STATE: PersistedMobileState = {
  prefs: {
    userName: "",
    goal: "carreira",
    tracks: ["essencial-culto", "comunicacao-executiva"],
    difficulty: "intermediario",
    dailyGoalWords: 3,
  },
  themeMode: "day",
  autoNightMode: false,
  preferredReminderHour: 9,
  soundEnabled: true,
  seenOnboarding: false,
  seenTutorial: false,
  habit: createInitialHabitState(),
  savedIds: [],
  studiedIds: [],
  completedNodeIds: [],
  srsCards: {},
  quizTotal: 0,
  quizCorrect: 0,
  weeklyXp: [0, 0, 0, 0, 0, 0, 0],
};

let dbInstance: SQLite.SQLiteDatabase | null = null;

function getDb(): SQLite.SQLiteDatabase | null {
  if (dbInstance) return dbInstance;
  try {
    const db = SQLite.openDatabaseSync("vocabulando.db");
    db.execSync(`
      CREATE TABLE IF NOT EXISTS kv_state (
        key TEXT PRIMARY KEY,
        value_json TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS pending_events (
        event_id TEXT PRIMARY KEY,
        payload_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS analytics_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_name TEXT NOT NULL,
        duration_ms INTEGER NOT NULL DEFAULT 0,
        meta_json TEXT NOT NULL DEFAULT '{}',
        occurred_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS lexicon_words (
        id TEXT PRIMARY KEY,
        word TEXT NOT NULL,
        ipa TEXT NOT NULL,
        pos TEXT NOT NULL,
        category TEXT NOT NULL,
        category_label TEXT NOT NULL,
        theme TEXT NOT NULL DEFAULT 'geral',
        theme_label TEXT NOT NULL DEFAULT 'Uso Geral',
        difficulty TEXT NOT NULL,
        definition TEXT NOT NULL,
        example TEXT NOT NULL,
        etymology TEXT NOT NULL,
        roots_json TEXT NOT NULL DEFAULT '[]',
        synonyms_json TEXT NOT NULL DEFAULT '[]'
      );
      CREATE TABLE IF NOT EXISTS learning_activities (
        id TEXT PRIMARY KEY,
        word_id TEXT NOT NULL,
        activity_type TEXT NOT NULL,
        track TEXT NOT NULL,
        difficulty TEXT NOT NULL
      );
    `);
    const lexCols = db
      .getAllSync<{ name: string }>("PRAGMA table_info(lexicon_words)")
      .map((c) => c.name);
    if (!lexCols.includes("theme")) {
      db.execSync("ALTER TABLE lexicon_words ADD COLUMN theme TEXT NOT NULL DEFAULT 'geral';");
    }
    if (!lexCols.includes("theme_label")) {
      db.execSync("ALTER TABLE lexicon_words ADD COLUMN theme_label TEXT NOT NULL DEFAULT 'Uso Geral';");
    }
    dbInstance = db;
    return db;
  } catch {
    return null;
  }
}

export function loadLocalState(): PersistedMobileState {
  const db = getDb();
  if (!db) return DEFAULT_STATE;
  try {
    const row = db
      .getFirstSync<{ value_json: string }>(
        "SELECT value_json FROM kv_state WHERE key = ?",
        ["app_state"],
      );
    if (!row) return DEFAULT_STATE;
    const parsed = JSON.parse(row.value_json) as Partial<PersistedMobileState>;
    return {
      ...DEFAULT_STATE,
      ...parsed,
      prefs: { ...DEFAULT_STATE.prefs, ...(parsed.prefs ?? {}) },
      habit: { ...DEFAULT_STATE.habit, ...(parsed.habit ?? {}) },
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export function saveLocalState(state: PersistedMobileState): void {
  const db = getDb();
  if (!db) return;
  try {
    db.runSync(
      "INSERT OR REPLACE INTO kv_state (key, value_json) VALUES (?, ?)",
      ["app_state", JSON.stringify(state)],
    );
  } catch {
    // Falha silenciosa de disco não interrompe o aprendizado
  }
}

export function enqueueOfflineEvent(event: UserEvent): void {
  const db = getDb();
  if (!db) return;
  try {
    db.runSync(
      "INSERT OR IGNORE INTO pending_events (event_id, payload_json, created_at) VALUES (?, ?, ?)",
      [event.eventId, JSON.stringify(event), event.occurredAt],
    );
  } catch {
    // Ignora falha local
  }
}

export function countPendingEvents(): number {
  const db = getDb();
  if (!db) return 0;
  try {
    const row = db.getFirstSync<{ total: number }>(
      "SELECT COUNT(*) as total FROM pending_events",
    );
    return row?.total ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Tenta sincronizar eventos offline com a API local (ex: 10.0.2.2:4180 no emulador Android).
 * Falha silenciosamente se estiver offline.
 */
export async function flushOfflineEvents(apiBaseUrl: string): Promise<number> {
  const db = getDb();
  if (!db) return 0;

  try {
    let tokenRow = db.getFirstSync<{ value_json: string }>(
      "SELECT value_json FROM kv_state WHERE key = ?",
      ["api_jwt"],
    );
    let token = tokenRow ? (JSON.parse(tokenRow.value_json) as string) : null;

    if (!token) {
      const authRes = await fetch(`${apiBaseUrl}/api/auth/guest`, { method: "POST" });
      if (!authRes.ok) return 0;
      const authData = (await authRes.json()) as { token?: string };
      if (!authData.token) return 0;
      token = authData.token;
      db.runSync("INSERT OR REPLACE INTO kv_state (key, value_json) VALUES (?, ?)", [
        "api_jwt",
        JSON.stringify(token),
      ]);
    }

    const rows = db.getAllSync<{ event_id: string; payload_json: string }>(
      "SELECT event_id, payload_json FROM pending_events ORDER BY created_at ASC LIMIT 25",
    );

    let synced = 0;
    for (const r of rows) {
      const res = await fetch(`${apiBaseUrl}/api/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: r.payload_json,
      });
      if (res.ok) {
        db.runSync("DELETE FROM pending_events WHERE event_id = ?", [r.event_id]);
        synced += 1;
      } else {
        break;
      }
    }
    return synced;
  } catch {
    return 0;
  }
}

export async function pullRemoteProgress(apiBaseUrl: string): Promise<{
  totalXp?: number;
  savedIds?: string[];
  srsCards?: Record<string, SrsCardState>;
} | null> {
  const db = getDb();
  if (!db) return null;
  try {
    const tokenRow = db.getFirstSync<{ value_json: string }>(
      "SELECT value_json FROM kv_state WHERE key = ?",
      ["api_jwt"],
    );
    const token = tokenRow ? (JSON.parse(tokenRow.value_json) as string) : null;
    if (!token) return null;
    const res = await fetch(`${apiBaseUrl}/api/me/sync`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return (await res.json()) as {
      totalXp?: number;
      savedIds?: string[];
      srsCards?: Record<string, SrsCardState>;
    };
  } catch {
    return null;
  }
}

export function trackAnalyticsEvent(
  eventName: string,
  durationMs = 0,
  meta: Record<string, unknown> = {},
): void {
  const db = getDb();
  if (!db) return;
  try {
    db.runSync(
      "INSERT INTO analytics_events (event_name, duration_ms, meta_json, occurred_at) VALUES (?, ?, ?, ?)",
      [eventName, Math.max(0, Math.round(durationMs)), JSON.stringify(meta), new Date().toISOString()],
    );
  } catch {
    // Telemetria local best-effort
  }
}

export function getLocalAnalyticsSummary(): { totalEvents: number; avgDwellMs: number } {
  const db = getDb();
  if (!db) return { totalEvents: 0, avgDwellMs: 0 };
  try {
    const countRow = db.getFirstSync<{ total: number }>(
      "SELECT COUNT(*) as total FROM analytics_events",
    );
    const avgRow = db.getFirstSync<{ avg_ms: number | null }>(
      "SELECT AVG(duration_ms) as avg_ms FROM analytics_events WHERE duration_ms > 0",
    );
    return {
      totalEvents: countRow?.total ?? 0,
      avgDwellMs: Math.round(avgRow?.avg_ms ?? 0),
    };
  } catch {
    return { totalEvents: 0, avgDwellMs: 0 };
  }
}

interface SeedWordRaw {
  id: string;
  word: string;
  ipa: string;
  pos: string;
  category: TrackCategory;
  categoryLabel: string;
  theme?: string;
  themeLabel?: string;
  difficulty: DifficultyLevel;
  definition: string;
  example: string;
  etymology: string;
  roots?: Array<{ part: string; meaning: string; related: string[] }>;
  synonyms?: string[];
}

const MOBILE_ACTIVITY_TYPES = ["reading", "listening", "quiz", "writing", "synonyms", "review"];
let seededInSession = false;

function upsertWordsIntoSqlite(db: SQLite.SQLiteDatabase, list: SeedWordRaw[]): void {
  db.withTransactionSync(() => {
    for (const w of list) {
      db.runSync(
        `INSERT OR IGNORE INTO lexicon_words
         (id, word, ipa, pos, category, category_label, theme, theme_label, difficulty, definition, example, etymology, roots_json, synonyms_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          w.id,
          w.word,
          w.ipa ?? "",
          w.pos ?? "substantivo",
          w.category,
          w.categoryLabel ?? w.category,
          w.theme ?? "geral",
          w.themeLabel ?? "Uso Geral",
          w.difficulty ?? "intermediario",
          w.definition,
          w.example ?? "",
          w.etymology ?? "",
          JSON.stringify(w.roots ?? []),
          JSON.stringify(w.synonyms ?? []),
        ],
      );
      for (const t of MOBILE_ACTIVITY_TYPES) {
        db.runSync(
          `INSERT OR IGNORE INTO learning_activities (id, word_id, activity_type, track, difficulty)
           VALUES (?, ?, ?, ?, ?)`,
          [`${w.id}:${t}`, w.id, t, w.category, w.difficulty ?? "intermediario"],
        );
      }
    }
  });
}

export function ensureMobileLexiconSeeded(): number {
  const db = getDb();
  if (!db) return 0;
  try {
    const row = db.getFirstSync<{ total: number }>("SELECT COUNT(*) as total FROM lexicon_words");
    if ((row?.total ?? 0) > 0) {
      seededInSession = true;
      return row?.total ?? 0;
    }
    if (seededInSession) return 0;

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const seedWords = require("../../assets/lexicon-core.json") as SeedWordRaw[];
    upsertWordsIntoSqlite(db, seedWords);
    seededInSession = true;
    return seedWords.length;
  } catch {
    return 0;
  }
}

export async function downloadThemePack(apiBaseUrl: string, themeId: string): Promise<number> {
  const db = getDb();
  if (!db) return 0;
  try {
    const res = await fetch(`${apiBaseUrl}/api/packs/${encodeURIComponent(themeId)}`);
    if (!res.ok) return 0;
    const data = (await res.json()) as { items?: SeedWordRaw[] };
    if (!Array.isArray(data.items) || data.items.length === 0) return 0;
    upsertWordsIntoSqlite(db, data.items);
    return data.items.length;
  } catch {
    return 0;
  }
}

export function getLocalCatalogCounts(): { wordsCount: number; activitiesCount: number } {
  const db = getDb();
  if (!db) return { wordsCount: 0, activitiesCount: 0 };
  try {
    const w = db.getFirstSync<{ c: number }>("SELECT COUNT(*) as c FROM lexicon_words")?.c ?? 0;
    const a = db.getFirstSync<{ c: number }>("SELECT COUNT(*) as c FROM learning_activities")?.c ?? 0;
    return { wordsCount: w, activitiesCount: a };
  } catch {
    return { wordsCount: 0, activitiesCount: 0 };
  }
}

export function queryLocalLexicon(options: {
  tracks?: string[];
  theme?: string;
  difficulty?: string;
  query?: string;
  limit?: number;
} = {}): MobileWordEntry[] {
  const db = getDb();
  if (!db) return [];
  try {
    const conditions: string[] = [];
    const params: (string | number)[] = [];
    if (options.tracks && options.tracks.length > 0) {
      conditions.push(`category IN (${options.tracks.map(() => "?").join(",")})`);
      params.push(...options.tracks);
    }
    if (options.theme && options.theme !== "all") {
      conditions.push("theme = ?");
      params.push(options.theme);
    }
    if (options.difficulty) {
      conditions.push("difficulty = ?");
      params.push(options.difficulty);
    }
    if (options.query && options.query.trim().length > 0) {
      const q = `%${options.query.trim().toLowerCase()}%`;
      conditions.push("(LOWER(word) LIKE ? OR LOWER(definition) LIKE ?)");
      params.push(q, q);
    }
    const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const limit = Math.min(200, Math.max(1, options.limit ?? 60));
    const rows = db.getAllSync<{
      id: string;
      word: string;
      ipa: string;
      pos: string;
      category: TrackCategory;
      category_label: string;
      theme?: string | null;
      theme_label?: string | null;
      difficulty: DifficultyLevel;
      definition: string;
      example: string;
      etymology: string;
      roots_json: string;
      synonyms_json: string;
    }>(`SELECT * FROM lexicon_words ${whereSql} LIMIT ?`, [...params, limit]);

    return rows.map((r) => {
      const syns = JSON.parse(r.synonyms_json || "[]") as string[];
      return {
        id: r.id,
        word: r.word,
        ipa: r.ipa,
        pos: r.pos,
        category: r.category,
        categoryLabel: r.category_label,
        theme: r.theme ?? undefined,
        themeLabel: r.theme_label ?? undefined,
        difficulty: r.difficulty,
        register: "neutro",
        registerScore: 3,
        definition: r.definition,
        example: r.example,
        etymology: r.etymology,
        roots: JSON.parse(r.roots_json || "[]") as Array<{ part: string; meaning: string; related: string[] }>,
        synonyms: syns.map((s) => ({ word: s, register: "neutro" as const, note: "Sinônimo relacionado" })),
      };
    });
  } catch {
    return [];
  }
}

export function getLocalWordsByIds(ids: string[]): MobileWordEntry[] {
  if (ids.length === 0) return [];
  const byId = new Map<string, MobileWordEntry>();
  for (const item of MOBILE_LEXICON) {
    if (ids.includes(item.id)) byId.set(item.id, item);
  }
  try {
    const db = getDb();
    if (db) {
      const placeholders = ids.map(() => "?").join(", ");
      const rows = db.getAllSync<{
        id: string;
        word: string;
        ipa: string;
        pos: string;
        category: TrackCategory;
        category_label: string;
        theme?: string | null;
        theme_label?: string | null;
        difficulty: DifficultyLevel;
        definition: string;
        example: string;
        etymology: string;
        roots_json: string;
        synonyms_json: string;
      }>(`SELECT * FROM lexicon_words WHERE id IN (${placeholders})`, ids);
      for (const r of rows) {
        const syns = JSON.parse(r.synonyms_json || "[]") as string[];
        byId.set(r.id, {
          id: r.id,
          word: r.word,
          ipa: r.ipa,
          pos: r.pos,
          category: r.category,
          categoryLabel: r.category_label,
          theme: r.theme ?? undefined,
          themeLabel: r.theme_label ?? undefined,
          difficulty: r.difficulty,
          register: "neutro",
          registerScore: 3,
          definition: r.definition,
          example: r.example,
          etymology: r.etymology,
          roots: JSON.parse(r.roots_json || "[]") as Array<{ part: string; meaning: string; related: string[] }>,
          synonyms: syns.map((s) => ({ word: s, register: "neutro" as const, note: "Sinônimo relacionado" })),
        });
      }
    }
  } catch {
    // Fallback to MOBILE_LEXICON matches only
  }
  return ids.map((id) => byId.get(id)).filter((item): item is MobileWordEntry => Boolean(item));
}

export function getLocalTrackCounts(studiedIds: string[] = []): Record<string, { total: number; done: number }> {
  const out: Record<string, { total: number; done: number }> = {};
  try {
    const db = getDb();
    if (!db) return out;
    const rows = db.getAllSync<{ category: string; c: number }>(
      "SELECT category, COUNT(*) AS c FROM lexicon_words GROUP BY category",
    );
    for (const r of rows) {
      out[r.category] = { total: r.c, done: 0 };
    }
    if (studiedIds.length > 0) {
      const placeholders = studiedIds.map(() => "?").join(", ");
      const doneRows = db.getAllSync<{ category: string; c: number }>(
        `SELECT category, COUNT(*) AS c FROM lexicon_words WHERE id IN (${placeholders}) GROUP BY category`,
        studiedIds,
      );
      for (const r of doneRows) {
        if (!out[r.category]) out[r.category] = { total: r.c, done: 0 };
        out[r.category]!.done = r.c;
      }
    }
  } catch {
    // ignore
  }
  return out;
}
