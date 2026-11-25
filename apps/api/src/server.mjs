import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import {
  ActiveSentenceRequestSchema,
  CollectionCreateSchema,
  ContextPromptRequestSchema,
  OnboardingPreferencesSchema,
  TextRefineRequestSchema,
  UserEventSchema,
  buildQuizBlank,
  getLexiconRank,
  isDailyGoalMet,
  isDueForReview,
  sanitizePromptInput,
} from "../../../packages/domain/src/index.ts";
import {
  evaluateActiveSentence,
  generateContextualExample,
  refineTextSuggestions,
} from "./ai-service.mjs";
import {
  assertJwtConfig,
  hashPassword,
  signJwt,
  verifyJwt,
  verifyPassword,
} from "./auth.mjs";
import {
  createGuestUser,
  deleteUserData,
  ensureLexiconSeeded,
  exportUserData,
  getAdminStats,
  getHabitState,
  getUserById,
  openDatabase,
  recordIdempotentEvent,
} from "./db.mjs";
import { CURATED_WORDS } from "./lexicon.mjs";
import { createLogger } from "./logger.mjs";
import { lookupPublicDictionary } from "./public-dictionary.mjs";

const RATE_BUCKETS = new Map();

function checkRateLimit(key, limit, windowMs = 60_000) {
  const now = Date.now();
  if (RATE_BUCKETS.size > 1000) {
    for (const [k, v] of RATE_BUCKETS.entries()) {
      if (v.resetAt <= now) RATE_BUCKETS.delete(k);
    }
  }
  const entry = RATE_BUCKETS.get(key);
  if (!entry || entry.resetAt <= now) {
    RATE_BUCKETS.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count += 1;
  return true;
}

function shuffleArray(items) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = crypto.randomInt(0, i + 1);
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

function setDefensiveHeaders(res, origin, requestId) {
  res.setHeader("X-Request-Id", requestId);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'");

  const allowedOrigin = process.env.VOCAB_CORS_ORIGIN;
  if (origin && (origin === allowedOrigin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

async function readJsonBody(req, maxBytes = 64_000) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > maxBytes) {
      throw Object.assign(new Error("Payload excede o limite permitido."), { statusCode: 413 });
    }
    chunks.push(chunk);
  }
  if (chunks.length === 0) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw Object.assign(new Error("JSON inválido."), { statusCode: 400 });
  }
}

export function createApiServer(options = {}) {
  assertJwtConfig();
  const db = openDatabase(options.dbPath);
  const logger = createLogger({
    errorLogPath: options.errorLogPath,
    appLogPath: options.appLogPath,
  });

  const server = http.createServer(async (req, res) => {
    const requestId = crypto.randomUUID();
    const startedAt = Date.now();
    setDefensiveHeaders(res, req.headers.origin, requestId);

    res.on("finish", () => {
      if (res.statusCode >= 500) return;
      logger.info("http_request", {
        requestId,
        method: req.method,
        path: req.url?.split("?")[0] ?? "/",
        status: res.statusCode,
        durationMs: Date.now() - startedAt,
      });
    });

    if (req.method === "OPTIONS") {
      res.statusCode = 204;
      res.end();
      return;
    }

    const clientIp = req.socket.remoteAddress ?? "unknown";
    const url = new URL(req.url ?? "/", "http://127.0.0.1");
    const isAiRoute = url.pathname.startsWith("/api/ai/");
    const limit = isAiRoute ? 30 : 180;

    if (!checkRateLimit(`${clientIp}:${isAiRoute ? "ai" : "std"}`, limit)) {
      sendJson(res, 429, { error: "Rate limit excedido. Tente novamente em instantes." });
      return;
    }

    try {
      // 1. Healthcheck
      if (req.method === "GET" && url.pathname === "/api/health") {
        sendJson(res, 200, {
          status: "ok",
          service: "vocabulando-api",
          wordsCount: CURATED_WORDS.length,
          supportedLanguages: ["pt-BR", "en-US", "es-ES"],
        });
        return;
      }

      // 2. Guest Auth (sem fricção, com JWT HS256 assinado)
      if (req.method === "POST" && url.pathname === "/api/auth/guest") {
        const userId = `usr_${crypto.randomUUID()}`;
        createGuestUser(db, userId);
        const token = signJwt({ sub: userId, kind: "guest", role: "user", plan: "free" });
        sendJson(res, 201, { userId, token, authKind: "guest", role: "user", plan: "free" });
        return;
      }

      // 2b. Registro com E-mail e Senha (scrypt)
      if (req.method === "POST" && url.pathname === "/api/auth/register") {
        const body = await readJsonBody(req);
        const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
        const password = typeof body.password === "string" ? body.password : "";
        const displayName =
          typeof body.displayName === "string" && body.displayName.trim().length >= 2
            ? body.displayName.trim().slice(0, 60)
            : "Estudante";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 6) {
          sendJson(res, 400, { error: "E-mail válido e senha com mínimo 6 caracteres são obrigatórios." });
          return;
        }
        const existing = db.prepare(`SELECT id FROM users WHERE email = ?`).get(email);
        if (existing) {
          sendJson(res, 409, { error: "E-mail já cadastrado." });
          return;
        }
        const userId = `usr_${crypto.randomUUID()}`;
        const nowIso = new Date().toISOString();
        const passwordHash = hashPassword(password);
        createGuestUser(db, userId, nowIso);
        db.prepare(
          `UPDATE users SET auth_kind = 'account', role = 'user', email = ?, password_hash = ?, display_name = ?, updated_at = ? WHERE id = ?`,
        ).run(email, passwordHash, displayName, nowIso, userId);
        const token = signJwt({ sub: userId, kind: "account", role: "user", plan: "free" });
        sendJson(res, 201, { userId, token, authKind: "account", role: "user", displayName, plan: "free" });
        return;
      }

      // 2c. Login com E-mail e Senha
      if (req.method === "POST" && url.pathname === "/api/auth/login") {
        const body = await readJsonBody(req);
        const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
        const password = typeof body.password === "string" ? body.password : "";
        const found = db.prepare(`SELECT * FROM users WHERE email = ?`).get(email);
        if (!found || !verifyPassword(password, found.password_hash)) {
          sendJson(res, 401, { error: "Credenciais inválidas." });
          return;
        }
        const role = found.role || "user";
        const token = signJwt({ sub: found.id, kind: "account", role, plan: found.plan });
        sendJson(res, 200, {
          userId: found.id,
          token,
          authKind: "account",
          role,
          displayName: found.display_name,
          plan: found.plan,
        });
        return;
      }

      // 3. Preview de Widget (público para extensão nativa / cache de 14 dias)
      if (req.method === "GET" && url.pathname === "/api/widget/preview") {
        const lang = url.searchParams.get("lang") || "pt-BR";
        const pool = CURATED_WORDS.filter((w) => w.languageCode === lang);
        const days = pool.slice(0, 14).map((w, idx) => ({
          dayOffset: idx,
          id: w.id,
          word: w.word,
          phoneticIpa: w.phoneticIpa,
          shortDefinition: w.shortDefinition,
        }));
        sendJson(res, 200, { languageCode: lang, days });
        return;
      }

      // 3b. Telemetria sanitizada de erro do cliente (Mobile/Web SafeErrorBoundary)
      if (req.method === "POST" && url.pathname === "/api/telemetry/client-error") {
        const body = await readJsonBody(req, 8_000);
        const surface = body.surface === "mobile" || body.surface === "web" ? body.surface : "unknown";
        const code = typeof body.code === "string" ? sanitizePromptInput(body.code, 64) : "UNEXPECTED_UI_ERROR";
        logger.warn("client_error_captured", { requestId, surface, code });
        sendJson(res, 202, { accepted: true, requestId });
        return;
      }

      // 3b. Catálogo completo & pacotes temáticos sob demanda
      if (req.method === "GET" && url.pathname === "/api/packs") {
        const manifestPath = path.resolve("data/lexicon-manifest.json");
        if (!fs.existsSync(manifestPath)) {
          sendJson(res, 200, { totalWords: 0, themes: {} });
          return;
        }
        sendJson(res, 200, JSON.parse(fs.readFileSync(manifestPath, "utf8")));
        return;
      }

      if (req.method === "GET" && url.pathname.startsWith("/api/packs/")) {
        const themeId = url.pathname.replace("/api/packs/", "").replace(/[^a-z0-9-]/g, "");
        const fileName = themeId === "core" ? "core.json" : `theme-${themeId}.json`;
        const packPath = path.resolve("data/packs", fileName);
        if (!fs.existsSync(packPath)) {
          sendJson(res, 404, { error: "Pacote temático não encontrado." });
          return;
        }
        const items = JSON.parse(fs.readFileSync(packPath, "utf8"));
        sendJson(res, 200, { theme: themeId, total: items.length, items });
        return;
      }

      if (req.method === "GET" && url.pathname === "/api/lexicon/words") {
        ensureLexiconSeeded(db);
        const track = url.searchParams.get("track") || "";
        const theme = url.searchParams.get("theme") || "";
        const difficulty = url.searchParams.get("difficulty") || "";
        const q = (url.searchParams.get("q") || "").trim().toLowerCase();
        const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") || 25)));
        const offset = Math.max(0, Number(url.searchParams.get("offset") || 0));

        const conditions = [];
        const params = [];
        if (track) {
          conditions.push("category = ?");
          params.push(track);
        }
        if (theme) {
          conditions.push("theme = ?");
          params.push(theme);
        }
        if (difficulty) {
          conditions.push("difficulty = ?");
          params.push(difficulty);
        }
        if (q) {
          conditions.push("(LOWER(word) LIKE ? OR LOWER(definition) LIKE ?)");
          params.push(`%${q}%`, `%${q}%`);
        }
        const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
        const total = db.prepare(`SELECT COUNT(*) as c FROM lexicon_words ${whereSql}`).get(...params)?.c ?? 0;
        const activitiesTotal = db.prepare(`SELECT COUNT(*) as c FROM learning_activities`).get()?.c ?? 0;
        const rows = db
          .prepare(`SELECT * FROM lexicon_words ${whereSql} LIMIT ? OFFSET ?`)
          .all(...params, limit, offset);
        sendJson(res, 200, {
          total,
          activitiesTotal,
          limit,
          offset,
          items: rows.map((r) => ({ ...r, synonyms: JSON.parse(r.synonyms_json || "[]") })),
        });
        return;
      }

      if (req.method === "GET" && url.pathname === "/api/activities") {
        ensureLexiconSeeded(db);
        const track = url.searchParams.get("track") || "";
        const type = url.searchParams.get("type") || "";
        const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") || 24)));
        const offset = Math.max(0, Number(url.searchParams.get("offset") || 0));

        const conditions = [];
        const params = [];
        if (track) {
          conditions.push("track = ?");
          params.push(track);
        }
        if (type) {
          conditions.push("activity_type = ?");
          params.push(type);
        }
        const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
        const total = db.prepare(`SELECT COUNT(*) as c FROM learning_activities ${whereSql}`).get(...params)?.c ?? 0;
        const items = db
          .prepare(`SELECT * FROM learning_activities ${whereSql} LIMIT ? OFFSET ?`)
          .all(...params, limit, offset);
        sendJson(res, 200, { total, limit, offset, items });
        return;
      }

      // Rotas autenticadas via JWT Bearer
      const authHeader = req.headers.authorization;
      const bearerToken =
        typeof authHeader === "string" && authHeader.startsWith("Bearer ")
          ? authHeader.slice(7).trim()
          : "";
      const claims = verifyJwt(bearerToken);
      if (!claims) {
        sendJson(res, 401, { error: "Token Bearer ausente, inválido ou expirado." });
        return;
      }
      const userId = claims.sub;

      const user = getUserById(db, userId);
      if (!user) {
        sendJson(res, 404, { error: "Usuário não encontrado." });
        return;
      }

      // Namespace dedicado /api/admin/* protegido por role === 'admin' (403 para não-admin)
      if (url.pathname.startsWith("/api/admin/")) {
        if ((user.role || claims.role) !== "admin") {
          sendJson(res, 403, { error: "Acesso restrito a administradores." });
          return;
        }
        if (req.method === "GET" && url.pathname === "/api/admin/stats") {
          sendJson(res, 200, getAdminStats(db));
          return;
        }
        if (req.method === "GET" && url.pathname === "/api/admin/logs/errors") {
          const errPath = options.errorLogPath ?? path.resolve("data/logs/api-errors.log");
          let items = [];
          if (fs.existsSync(errPath)) {
            items = fs
              .readFileSync(errPath, "utf8")
              .trim()
              .split("\n")
              .filter(Boolean)
              .slice(-50)
              .map((line) => JSON.parse(line));
          }
          sendJson(res, 200, { items });
          return;
        }
        sendJson(res, 404, { error: "Rota admin não encontrada." });
        return;
      }

      // Tracking analítico (tempo de interação, flips, trocas de aba - sem PII)
      if (req.method === "POST" && url.pathname === "/api/analytics/track") {
        const body = await readJsonBody(req, 16_000);
        const eventName =
          typeof body.eventName === "string" ? sanitizePromptInput(body.eventName, 60) : "";
        if (!eventName) {
          sendJson(res, 400, { error: "eventName obrigatório." });
          return;
        }
        const durationMs =
          typeof body.durationMs === "number" && body.durationMs >= 0
            ? Math.min(600_000, Math.round(body.durationMs))
            : null;
        const meta = typeof body.meta === "object" && body.meta ? body.meta : {};
        db.prepare(
          `INSERT INTO analytics_events (user_id, event_name, duration_ms, meta_json, occurred_at) VALUES (?, ?, ?, ?, ?)`,
        ).run(userId, eventName, durationMs, JSON.stringify(meta), new Date().toISOString());
        sendJson(res, 202, { ok: true });
        return;
      }

      // 4. Upgrade Guest -> Conta
      if (req.method === "POST" && url.pathname === "/api/auth/upgrade") {
        const body = await readJsonBody(req);
        const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
        const displayName = typeof body.displayName === "string" ? body.displayName.trim() : "Estudante";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          sendJson(res, 400, { error: "E-mail inválido." });
          return;
        }
        db.prepare(
          `UPDATE users SET auth_kind = 'account', email = ?, display_name = ?, updated_at = ? WHERE id = ?`,
        ).run(email, displayName.slice(0, 60), new Date().toISOString(), userId);
        const token = signJwt({ sub: userId, kind: "account", plan: user.plan });
        sendJson(res, 200, { userId, token, authKind: "account", email, displayName });
        return;
      }

      // 5. Onboarding
      if (req.method === "POST" && url.pathname === "/api/me/onboarding") {
        const body = await readJsonBody(req);
        const parsed = OnboardingPreferencesSchema.safeParse(body);
        if (!parsed.success) {
          sendJson(res, 400, { error: "Preferências inválidas.", details: parsed.error.flatten() });
          return;
        }
        db.prepare(`UPDATE users SET preferences_json = ?, updated_at = ? WHERE id = ?`).run(
          JSON.stringify(parsed.data),
          new Date().toISOString(),
          userId,
        );
        sendJson(res, 200, { ok: true, preferences: parsed.data });
        return;
      }

      // 6. Estado do usuário + Hábito + Entitlements
      if (req.method === "GET" && url.pathname === "/api/me") {
        const habit = getHabitState(db, userId);
        sendJson(res, 200, {
          id: user.id,
          authKind: user.auth_kind,
          displayName: user.display_name,
          plan: user.plan,
          preferences: JSON.parse(user.preferences_json || "{}"),
          habit,
          rank: getLexiconRank(habit.totalXp),
          dailyGoalMet: isDailyGoalMet(habit),
        });
        return;
      }

      // 6b. Sync bidirecional Mobile <-> Web
      if (req.method === "GET" && url.pathname === "/api/me/sync") {
        const data = exportUserData(db, userId);
        const savedIds = Array.from(
          new Set((data.collections ?? []).flatMap((c) => c.wordIds ?? [])),
        );
        const srsCards = {};
        for (const c of data.srsCards ?? []) {
          srsCards[c.word_id] = {
            wordId: c.word_id,
            repetitions: c.repetitions,
            intervalDays: c.interval_days,
            easeFactor: c.ease_factor,
            lapses: c.lapses,
            lastReviewedAt: c.last_reviewed_at,
            nextReviewAt: c.next_review_at,
          };
        }
        sendJson(res, 200, {
          totalXp: data.habit?.totalXp ?? 0,
          savedIds,
          srsCards,
        });
        return;
      }

      // 7. LGPD Export & Delete
      if (req.method === "GET" && url.pathname === "/api/me/export") {
        sendJson(res, 200, exportUserData(db, userId));
        return;
      }
      if (req.method === "DELETE" && url.pathname === "/api/me") {
        deleteUserData(db, userId);
        sendJson(res, 200, { deleted: true });
        return;
      }

      // 8. Feed filtrado por idioma / categoria / nível
      if (req.method === "GET" && url.pathname === "/api/feed") {
        const lang = url.searchParams.get("lang") || "pt-BR";
        const category = url.searchParams.get("category");
        const difficulty = url.searchParams.get("difficulty");

        const items = CURATED_WORDS.filter((w) => {
          if (w.languageCode !== lang) return false;
          if (category && w.category !== category) return false;
          if (difficulty && w.difficulty !== difficulty) return false;
          return true;
        });

        sendJson(res, 200, { items, total: items.length });
        return;
      }

      // 9. Eventos idempotentes (Sync Offline-First)
      if (req.method === "POST" && url.pathname === "/api/events") {
        const body = await readJsonBody(req);
        const parsed = UserEventSchema.safeParse(body);
        if (!parsed.success) {
          sendJson(res, 400, { error: "Evento inválido.", details: parsed.error.flatten() });
          return;
        }
        const result = recordIdempotentEvent(db, userId, parsed.data);
        sendJson(res, 200, {
          ok: true,
          duplicate: result.duplicate,
          habit: result.habit,
          rank: getLexiconRank(result.habit.totalXp),
          dailyGoalMet: isDailyGoalMet(result.habit),
        });
        return;
      }

      // 10. Fila SRS (Palavras pendentes de revisão)
      if (req.method === "GET" && url.pathname === "/api/srs/due") {
        const nowIso = new Date().toISOString();
        const rows = db.prepare(`SELECT * FROM srs_cards WHERE user_id = ?`).all(userId);
        const due = rows
          .map((r) => ({
            wordId: r.word_id,
            repetitions: r.repetitions,
            intervalDays: r.interval_days,
            easeFactor: r.ease_factor,
            lapses: r.lapses,
            lastReviewedAt: r.last_reviewed_at,
            nextReviewAt: r.next_review_at,
          }))
          .filter((card) => isDueForReview(card, nowIso));

        sendJson(res, 200, { due, totalCards: rows.length });
        return;
      }

      // 11. Coleções
      if (req.method === "GET" && url.pathname === "/api/collections") {
        const cols = db.prepare(`SELECT * FROM collections WHERE user_id = ?`).all(userId);
        const enriched = cols.map((c) => {
          const words = db
            .prepare(`SELECT word_id FROM collection_words WHERE collection_id = ?`)
            .all(c.id)
            .map((w) => w.word_id);
          return { id: c.id, name: c.name, wordIds: words };
        });
        sendJson(res, 200, { collections: enriched });
        return;
      }

      if (req.method === "POST" && url.pathname === "/api/collections") {
        const body = await readJsonBody(req);
        const parsed = CollectionCreateSchema.safeParse(body);
        if (!parsed.success) {
          sendJson(res, 400, { error: "Nome de coleção inválido." });
          return;
        }
        const id = `col_${crypto.randomUUID().slice(0, 8)}`;
        db.prepare(`INSERT INTO collections (id, user_id, name, created_at) VALUES (?, ?, ?, ?)`).run(
          id,
          userId,
          parsed.data.name,
          new Date().toISOString(),
        );
        sendJson(res, 201, { id, name: parsed.data.name, wordIds: [] });
        return;
      }

      const colWordMatch = url.pathname.match(/^\/api\/collections\/([^/]+)\/words$/);
      if (colWordMatch && (req.method === "POST" || req.method === "DELETE")) {
        const collectionId = colWordMatch[1];
        const col = db
          .prepare(`SELECT id FROM collections WHERE id = ? AND user_id = ?`)
          .get(collectionId, userId);
        if (!col) {
          sendJson(res, 404, { error: "Coleção não encontrada." });
          return;
        }
        const body = await readJsonBody(req);
        const wordId = typeof body.wordId === "string" ? body.wordId : "";
        if (!CURATED_WORDS.some((w) => w.id === wordId)) {
          sendJson(res, 400, { error: "Palavra inválida." });
          return;
        }
        if (req.method === "POST") {
          db.prepare(
            `INSERT OR IGNORE INTO collection_words (collection_id, word_id, added_at) VALUES (?, ?, ?)`,
          ).run(collectionId, wordId, new Date().toISOString());
        } else {
          db.prepare(`DELETE FROM collection_words WHERE collection_id = ? AND word_id = ?`).run(
            collectionId,
            wordId,
          );
        }
        sendJson(res, 200, { ok: true, collectionId, wordId });
        return;
      }

      // 12. Micro-Quiz Generator (prioriza palavras vencidas no SRS + embaralhamento real)
      if (req.method === "GET" && url.pathname === "/api/quiz/generate") {
        const lang = url.searchParams.get("lang") || "pt-BR";
        const pool = CURATED_WORDS.filter((w) => w.languageCode === lang);
        const nowIso = new Date().toISOString();
        const srsRows = db.prepare(`SELECT * FROM srs_cards WHERE user_id = ?`).all(userId);
        const dueIds = new Set(
          srsRows
            .filter((r) => isDueForReview({ nextReviewAt: r.next_review_at }, nowIso))
            .map((r) => r.word_id),
        );

        const prioritized = [
          ...shuffleArray(pool.filter((w) => dueIds.has(w.id))),
          ...shuffleArray(pool.filter((w) => !dueIds.has(w.id))),
        ].slice(0, 3);

        const questions = prioritized.map((target) => {
          const distractors = shuffleArray(pool.filter((w) => w.id !== target.id)).slice(0, 2);
          const options = shuffleArray([target.word, ...distractors.map((d) => d.word)]);
          const { prompt } = buildQuizBlank(
            target.exampleSentence,
            target.word,
            target.shortDefinition,
          );
          return {
            wordId: target.id,
            isSrsDue: dueIds.has(target.id),
            prompt,
            hint: target.shortDefinition,
            options,
            correctAnswer: target.word,
          };
        });
        sendJson(res, 200, { questions });
        return;
      }

      // 12b. Conector de Dicionários Públicos (freedictionaryapi + dicionario-aberto com cache SQLite)
      if (req.method === "GET" && url.pathname === "/api/dictionary/lookup") {
        const word = url.searchParams.get("word") || "";
        const lang = url.searchParams.get("lang") || "pt-BR";
        if (word.trim().length < 2) {
          sendJson(res, 400, { error: "Informe uma palavra com pelo menos 2 caracteres." });
          return;
        }
        const entry = await lookupPublicDictionary(db, word, lang);
        sendJson(res, 200, entry);
        return;
      }

      // 13. IA Contextual (Exemplos + Escrita Ativa + Refinador de Texto)
      if (req.method === "POST" && url.pathname === "/api/ai/context") {
        const body = await readJsonBody(req);
        const parsed = ContextPromptRequestSchema.safeParse(body);
        if (!parsed.success) {
          sendJson(res, 400, { error: "Requisição inválida." });
          return;
        }
        const wordEntry = CURATED_WORDS.find((w) => w.id === parsed.data.wordId);
        if (!wordEntry) {
          sendJson(res, 404, { error: "Palavra não encontrada." });
          return;
        }
        sendJson(res, 200, await generateContextualExample(db, wordEntry, parsed.data.contextProfile));
        return;
      }

      if (req.method === "POST" && url.pathname === "/api/ai/evaluate-sentence") {
        const body = await readJsonBody(req);
        const parsed = ActiveSentenceRequestSchema.safeParse(body);
        if (!parsed.success) {
          sendJson(res, 400, { error: "Frase inválida (mínimo 6 e máximo 280 caracteres)." });
          return;
        }
        const wordEntry = CURATED_WORDS.find((w) => w.id === parsed.data.wordId);
        if (!wordEntry) {
          sendJson(res, 404, { error: "Palavra não encontrada." });
          return;
        }
        sendJson(res, 200, evaluateActiveSentence(wordEntry, parsed.data.sentence));
        return;
      }

      if (req.method === "POST" && url.pathname === "/api/ai/refine-text") {
        const body = await readJsonBody(req);
        const parsed = TextRefineRequestSchema.safeParse(body);
        if (!parsed.success) {
          sendJson(res, 400, { error: "Texto inválido (entre 10 e 2000 caracteres)." });
          return;
        }
        sendJson(
          res,
          200,
          refineTextSuggestions(parsed.data.text, parsed.data.targetRegister),
        );
        return;
      }

      sendJson(res, 404, { error: "Rota não encontrada." });
    } catch (err) {
      const status = typeof err?.statusCode === "number" ? err.statusCode : 500;
      if (status >= 500) {
        logger.error("http_unhandled_error", err, {
          requestId,
          method: req.method,
          path: url.pathname,
          status,
        });
      }
      sendJson(res, status, {
        error: status >= 500 ? "Erro interno no servidor." : err.message,
        requestId,
      });
    }
  });

  return { server, db };
}

const isDirectRun =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"));

if (isDirectRun) {
  const port = Number.parseInt(process.env.VOCAB_API_PORT || "4180", 10);
  const { server } = createApiServer();
  server.listen(port, "127.0.0.1", () => {
    console.log(`Vocabulando API rodando em http://127.0.0.1:${port}`);
  });
}
