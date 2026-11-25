import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import {
  applyHabitAction,
  createInitialHabitState,
  createInitialSrsState,
  scheduleSrsReview,
} from "../../../packages/domain/src/index.ts";

export function openDatabase(dbPath = process.env.VOCAB_DB_PATH || path.resolve("data/vocabulando.db")) {
  if (dbPath !== ":memory:") {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }
  const db = new DatabaseSync(dbPath);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      auth_kind TEXT NOT NULL DEFAULT 'guest',
      role TEXT NOT NULL DEFAULT 'user',
      email TEXT UNIQUE,
      password_hash TEXT,
      display_name TEXT NOT NULL DEFAULT 'Convidado',
      plan TEXT NOT NULL DEFAULT 'free',
      preferences_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS analytics_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      event_name TEXT NOT NULL,
      duration_ms INTEGER,
      meta_json TEXT NOT NULL DEFAULT '{}',
      occurred_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS events (
      event_id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      word_id TEXT NOT NULL,
      occurred_at TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS srs_cards (
      user_id TEXT NOT NULL,
      word_id TEXT NOT NULL,
      repetitions INTEGER NOT NULL,
      interval_days INTEGER NOT NULL,
      ease_factor REAL NOT NULL,
      lapses INTEGER NOT NULL,
      last_reviewed_at TEXT NOT NULL,
      next_review_at TEXT NOT NULL,
      PRIMARY KEY (user_id, word_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS habit_state (
      user_id TEXT PRIMARY KEY,
      state_json TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS collections (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS collection_words (
      collection_id TEXT NOT NULL,
      word_id TEXT NOT NULL,
      added_at TEXT NOT NULL,
      PRIMARY KEY (collection_id, word_id),
      FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ai_cache (
      cache_key TEXT PRIMARY KEY,
      response_json TEXT NOT NULL,
      created_at TEXT NOT NULL
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
      synonyms_json TEXT NOT NULL DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS learning_activities (
      id TEXT PRIMARY KEY,
      word_id TEXT NOT NULL,
      activity_type TEXT NOT NULL,
      track TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      prompt TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_lexicon_track ON lexicon_words(category, difficulty);
    CREATE INDEX IF NOT EXISTS idx_lexicon_theme ON lexicon_words(theme);
    CREATE INDEX IF NOT EXISTS idx_activities_type ON learning_activities(activity_type, track);
  `);

  // Garante migração segura para bancos já existentes
  const userCols = db.prepare(`PRAGMA table_info(users)`).all().map((c) => c.name);
  if (!userCols.includes("role")) {
    db.exec(`ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user';`);
  }
  if (!userCols.includes("password_hash")) {
    db.exec(`ALTER TABLE users ADD COLUMN password_hash TEXT;`);
  }
  const lexCols = db.prepare(`PRAGMA table_info(lexicon_words)`).all().map((c) => c.name);
  if (!lexCols.includes("theme")) {
    db.exec(`ALTER TABLE lexicon_words ADD COLUMN theme TEXT NOT NULL DEFAULT 'geral';`);
  }
  if (!lexCols.includes("theme_label")) {
    db.exec(`ALTER TABLE lexicon_words ADD COLUMN theme_label TEXT NOT NULL DEFAULT 'Uso Geral';`);
  }

  return db;
}

export function createGuestUser(db, userId, nowIso = new Date().toISOString()) {
  db.prepare(
    `INSERT INTO users (id, auth_kind, display_name, plan, preferences_json, created_at, updated_at)
     VALUES (?, 'guest', 'Visitante', 'free', '{}', ?, ?)`,
  ).run(userId, nowIso, nowIso);

  db.prepare(`INSERT INTO habit_state (user_id, state_json) VALUES (?, ?)`).run(
    userId,
    JSON.stringify(createInitialHabitState()),
  );

  // Coleção padrão inicial
  db.prepare(`INSERT INTO collections (id, user_id, name, created_at) VALUES (?, ?, ?, ?)`).run(
    `fav-${userId}`,
    userId,
    "Favoritas",
    nowIso,
  );
}

export function getUserById(db, userId) {
  return db.prepare(`SELECT * FROM users WHERE id = ?`).get(userId) ?? null;
}

export function getHabitState(db, userId) {
  const row = db.prepare(`SELECT state_json FROM habit_state WHERE user_id = ?`).get(userId);
  if (!row) return createInitialHabitState();
  return JSON.parse(row.state_json);
}

/**
 * Processa evento de forma idempotente (ignora event_id duplicado) e atualiza SRS + Hábito.
 */
export function recordIdempotentEvent(db, userId, event) {
  const existing = db.prepare(`SELECT event_id FROM events WHERE event_id = ?`).get(event.eventId);
  if (existing) {
    return {
      duplicate: true,
      habit: getHabitState(db, userId),
    };
  }

  db.exec("BEGIN");
  try {
    db.prepare(
      `INSERT INTO events (event_id, user_id, type, word_id, occurred_at, payload_json)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(
      event.eventId,
      userId,
      event.type,
      event.wordId,
      event.occurredAt,
      JSON.stringify(event.payload ?? {}),
    );

    let habit = getHabitState(db, userId);

    if (event.type === "WORD_VIEWED") {
      habit = applyHabitAction(habit, "WORD_VIEWED", event.occurredAt);
    } else if (event.type === "QUIZ_ANSWERED") {
      const correct = Boolean(event.payload?.correct);
      habit = applyHabitAction(habit, correct ? "QUIZ_CORRECT" : "QUIZ_WRONG", event.occurredAt);

      const srsRow = db
        .prepare(`SELECT * FROM srs_cards WHERE user_id = ? AND word_id = ?`)
        .get(userId, event.wordId);

      const currentSrs = srsRow
        ? {
            wordId: srsRow.word_id,
            repetitions: srsRow.repetitions,
            intervalDays: srsRow.interval_days,
            easeFactor: srsRow.ease_factor,
            lapses: srsRow.lapses,
            lastReviewedAt: srsRow.last_reviewed_at,
            nextReviewAt: srsRow.next_review_at,
          }
        : createInitialSrsState(event.wordId, event.occurredAt);

      const nextSrs = scheduleSrsReview(currentSrs, correct ? 3 : 1, event.occurredAt);
      db.prepare(
        `INSERT INTO srs_cards (user_id, word_id, repetitions, interval_days, ease_factor, lapses, last_reviewed_at, next_review_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(user_id, word_id) DO UPDATE SET
           repetitions = excluded.repetitions,
           interval_days = excluded.interval_days,
           ease_factor = excluded.ease_factor,
           lapses = excluded.lapses,
           last_reviewed_at = excluded.last_reviewed_at,
           next_review_at = excluded.next_review_at`,
      ).run(
        userId,
        nextSrs.wordId,
        nextSrs.repetitions,
        nextSrs.intervalDays,
        nextSrs.easeFactor,
        nextSrs.lapses,
        nextSrs.lastReviewedAt,
        nextSrs.nextReviewAt,
      );
    } else if (event.type === "ACTIVE_SENTENCE_SUBMITTED") {
      habit = applyHabitAction(habit, "ACTIVE_SENTENCE", event.occurredAt);
    }

    db.prepare(`UPDATE habit_state SET state_json = ? WHERE user_id = ?`).run(
      JSON.stringify(habit),
      userId,
    );

    db.exec("COMMIT");
    return { duplicate: false, habit };
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

export function exportUserData(db, userId) {
  const user = getUserById(db, userId);
  if (!user) return null;
  const habit = getHabitState(db, userId);
  const srsCards = db.prepare(`SELECT * FROM srs_cards WHERE user_id = ?`).all(userId);
  const collections = db.prepare(`SELECT * FROM collections WHERE user_id = ?`).all(userId);
  const events = db
    .prepare(`SELECT event_id, type, word_id, occurred_at FROM events WHERE user_id = ?`)
    .all(userId);

  return {
    exportedAt: new Date().toISOString(),
    user: {
      id: user.id,
      authKind: user.auth_kind,
      email: user.email,
      displayName: user.display_name,
      plan: user.plan,
      preferences: JSON.parse(user.preferences_json || "{}"),
    },
    habit,
    srsCards,
    collections,
    eventsCount: events.length,
    events,
  };
}

export function deleteUserData(db, userId) {
  const res = db.prepare(`DELETE FROM users WHERE id = ?`).run(userId);
  return res.changes > 0;
}

const ACTIVITY_TYPES = ["reading", "listening", "quiz", "writing", "synonyms", "review"];
let cachedSeedWords = null;

function loadSeedWords() {
  if (cachedSeedWords) return cachedSeedWords;
  const packsDir = path.resolve("data/packs");
  if (fs.existsSync(packsDir)) {
    const files = fs.readdirSync(packsDir).filter((f) => f.startsWith("theme-") && f.endsWith(".json"));
    if (files.length > 0) {
      const merged = [];
      for (const file of files) {
        const chunk = JSON.parse(fs.readFileSync(path.join(packsDir, file), "utf8"));
        if (Array.isArray(chunk)) merged.push(...chunk);
      }
      cachedSeedWords = merged;
      return cachedSeedWords;
    }
  }
  const legacyPath = path.resolve("data/lexicon-5000.json");
  if (!fs.existsSync(legacyPath)) return [];
  cachedSeedWords = JSON.parse(fs.readFileSync(legacyPath, "utf8"));
  return cachedSeedWords;
}

export function ensureLexiconSeeded(db) {
  const existing = db.prepare(`SELECT COUNT(*) as c FROM lexicon_words`).get()?.c ?? 0;
  if (existing > 0) return existing;

  const words = loadSeedWords();
  if (words.length === 0) return 0;

  const insertWord = db.prepare(`
    INSERT OR IGNORE INTO lexicon_words
    (id, word, ipa, pos, category, category_label, theme, theme_label, difficulty, definition, example, etymology, synonyms_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertActivity = db.prepare(`
    INSERT OR IGNORE INTO learning_activities
    (id, word_id, activity_type, track, difficulty, prompt)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  db.exec("BEGIN;");
  try {
    for (const w of words) {
      insertWord.run(
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
        JSON.stringify(w.synonyms ?? []),
      );
      for (const actType of ACTIVITY_TYPES) {
        insertActivity.run(
          `${w.id}:${actType}`,
          w.id,
          actType,
          w.category,
          w.difficulty ?? "intermediario",
          w.definition,
        );
      }
    }
    db.exec("COMMIT;");
  } catch (err) {
    db.exec("ROLLBACK;");
    throw err;
  }
  return words.length;
}

export function getAdminStats(db) {
  ensureLexiconSeeded(db);
  const usersCount = db.prepare(`SELECT COUNT(*) as c FROM users`).get()?.c ?? 0;
  const eventsCount = db.prepare(`SELECT COUNT(*) as c FROM events`).get()?.c ?? 0;
  const srsCount = db.prepare(`SELECT COUNT(*) as c FROM srs_cards`).get()?.c ?? 0;
  const analyticsCount = db.prepare(`SELECT COUNT(*) as c FROM analytics_events`).get()?.c ?? 0;
  const lexiconWordsCount = db.prepare(`SELECT COUNT(*) as c FROM lexicon_words`).get()?.c ?? 0;
  const activitiesCount = db.prepare(`SELECT COUNT(*) as c FROM learning_activities`).get()?.c ?? 0;
  return {
    usersCount,
    eventsCount,
    srsCount,
    analyticsCount,
    lexiconWordsCount,
    activitiesCount,
  };
}
