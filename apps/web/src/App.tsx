import { useCallback, useEffect, useState } from "react";
import { Download, Flame, Plus, Shield, Sparkles, Trash2, UserCheck } from "lucide-react";
import type {
  LanguageCode,
  RegisterLevel,
  TrackCategory,
  WordEntry,
} from "@vocabulando/domain";
import {
  apiFetch,
  clearAuthToken,
  ensureAuthToken,
  fetchFeed,
  recordEvent,
  refineText,
  setAuthToken,
  type MeResponse,
} from "./apiClient.ts";
import { OnboardingModal } from "./components/OnboardingModal.tsx";
import { WordCard } from "./components/WordCard.tsx";

type Tab = "feed" | "quiz" | "collections" | "refiner" | "account" | "admin";

interface QuizQuestion {
  wordId: string;
  prompt: string;
  hint: string;
  options: string[];
  correctAnswer: string;
}

interface CollectionItem {
  id: string;
  name: string;
  wordIds: string[];
}

interface SrsDueItem {
  wordId: string;
  repetitions: number;
  intervalDays: number;
  easeFactor: number;
  lapses: number;
}

export function App() {
  const [authToken, setTokenState] = useState<string | null>(null);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [tab, setTab] = useState<Tab>("feed");
  const [lang, setLang] = useState<LanguageCode>("pt-BR");
  const [category, setCategory] = useState<TrackCategory | "">("");
  const [words, setWords] = useState<WordEntry[]>([]);
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizResult, setQuizResult] = useState<Record<string, string>>({});
  const [dueItems, setDueItems] = useState<SrsDueItem[]>([]);
  const [draftText, setDraftText] = useState(
    "Precisamos confirmar o novo acordo sem enrolação.",
  );
  const [targetRegister, setTargetRegister] = useState<RegisterLevel>("executivo");
  const [refineResult, setRefineResult] = useState<{
    suggestions: Array<{ original: string; suggestion: string; note: string }>;
    refinedPreview: string;
  } | null>(null);

  const [upgradeEmail, setUpgradeEmail] = useState("");
  const [upgradeName, setUpgradeName] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMode, setAuthMode] = useState<"upgrade" | "register" | "login">("upgrade");
  const [accountStatus, setAccountStatus] = useState<string | null>(null);
  const [adminStats, setAdminStats] = useState<{
    usersCount: number;
    eventsCount: number;
    srsCount: number;
    analyticsCount: number;
    lexiconWordsCount: number;
    activitiesCount: number;
  } | null>(null);
  const [adminLogs, setAdminLogs] = useState<string[]>([]);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [fastSkimCount, setFastSkimCount] = useState(0);
  const [dictQuery, setDictQuery] = useState("");
  const [dictResult, setDictResult] = useState<{
    word: string;
    found: boolean;
    phoneticIpa: string;
    partOfSpeech: string;
    definitions: string[];
    synonyms: string[];
    etymology: string;
    source: string;
  } | null>(null);

  const refreshProfile = useCallback(async (token: string) => {
    const [meData, colsData, dueData] = await Promise.all([
      apiFetch<MeResponse>(token, "/api/me"),
      apiFetch<{ collections: CollectionItem[] }>(token, "/api/collections"),
      apiFetch<{ due: SrsDueItem[] }>(token, "/api/srs/due"),
    ]);
    setMe(meData);
    setCollections(colsData.collections);
    setDueItems(dueData.due);
    if (Object.keys(meData.preferences ?? {}).length === 0) {
      setShowOnboarding(true);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      const token = await ensureAuthToken();
      setTokenState(token);
      await refreshProfile(token);
    })();
  }, [refreshProfile]);

  useEffect(() => {
    if (!authToken) return;
    void (async () => {
      const items = await fetchFeed(authToken, lang, category);
      const preferredTracks = Array.isArray(me?.preferences?.tracks)
        ? (me.preferences.tracks as string[])
        : [];
      if (!category && preferredTracks.length > 0) {
        const filtered = items.filter((w) => preferredTracks.includes(w.category));
        setWords(filtered.length > 0 ? filtered : items);
      } else {
        setWords(items);
      }
    })();
  }, [authToken, lang, category, me?.preferences]);

  async function toggleFavorite(wordId: string, collectionId: string) {
    if (!authToken) return;
    const col = collections.find((c) => c.id === collectionId);
    if (!col) return;
    const exists = col.wordIds.includes(wordId);
    await apiFetch(authToken, `/api/collections/${col.id}/words`, {
      method: exists ? "DELETE" : "POST",
      body: JSON.stringify({ wordId }),
    });
    await refreshProfile(authToken);
  }

  function handleWordStudied(dwellTimeMs: number) {
    setFastSkimCount((prev) => (dwellTimeMs < 2000 ? prev + 1 : 0));
    if (authToken) void refreshProfile(authToken);
  }

  async function handleDictionaryLookup() {
    if (!authToken || dictQuery.trim().length < 2) return;
    const res = await apiFetch<NonNullable<typeof dictResult>>(
      authToken,
      `/api/dictionary/lookup?word=${encodeURIComponent(dictQuery.trim())}&lang=${lang}`,
    );
    setDictResult(res);
  }

  async function handleCreateCollection() {
    if (!authToken || newCollectionName.trim().length < 2) return;
    await apiFetch(authToken, "/api/collections", {
      method: "POST",
      body: JSON.stringify({ name: newCollectionName.trim() }),
    });
    setNewCollectionName("");
    await refreshProfile(authToken);
  }

  async function loadQuiz() {
    if (!authToken) return;
    const data = await apiFetch<{ questions: QuizQuestion[] }>(
      authToken,
      `/api/quiz/generate?lang=${lang}`,
    );
    setQuizQuestions(data.questions);
    setQuizResult({});
  }

  async function answerQuiz(q: QuizQuestion, chosen: string) {
    if (!authToken) return;
    const correct = chosen === q.correctAnswer;
    setQuizResult((prev) => ({
      ...prev,
      [q.wordId]: correct
        ? "Correto! (+15 XP)"
        : `A resposta correta é "${q.correctAnswer}" (agendada no SRS).`,
    }));
    await recordEvent(authToken, "QUIZ_ANSWERED", q.wordId, { correct });
    await refreshProfile(authToken);
  }

  async function handleRefine() {
    if (!authToken) return;
    const res = await refineText(authToken, draftText, targetRegister);
    setRefineResult(res);
  }

  async function handleUpgradeAccount() {
    if (!authToken) return;
    try {
      const endpoint =
        authMode === "register"
          ? "/api/auth/register"
          : authMode === "login"
            ? "/api/auth/login"
            : "/api/auth/upgrade";
      const payload =
        authMode === "login"
          ? { email: upgradeEmail, password: authPassword }
          : authMode === "register"
            ? { email: upgradeEmail, password: authPassword, displayName: upgradeName }
            : { email: upgradeEmail, displayName: upgradeName };
      const res = await apiFetch<{ token: string }>(authToken, endpoint, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setAuthToken(res.token);
      setTokenState(res.token);
      setAccountStatus(
        authMode === "login"
          ? "Login realizado com sucesso!"
          : authMode === "register"
            ? "Conta registrada com sucesso!"
            : "Conta vinculada com sucesso! Seu progresso foi preservado.",
      );
      await refreshProfile(res.token);
    } catch (err) {
      setAccountStatus(err instanceof Error ? err.message : "Erro na autenticação.");
    }
  }

  async function loadAdminPanel() {
    if (!authToken) return;
    setAdminError(null);
    try {
      const [stats, logs] = await Promise.all([
        apiFetch<{
          usersCount: number;
          eventsCount: number;
          srsCount: number;
          analyticsCount: number;
          lexiconWordsCount: number;
          activitiesCount: number;
        }>(authToken, "/api/admin/stats"),
        apiFetch<{ items: string[] }>(authToken, "/api/admin/logs/errors"),
      ]);
      setAdminStats(stats);
      setAdminLogs(logs.items);
    } catch (err) {
      setAdminStats(null);
      setAdminError(err instanceof Error ? err.message : "Acesso restrito a administradores.");
    }
  }

  async function handleExportLgpd() {
    if (!authToken || !me) return;
    const data = await apiFetch<Record<string, unknown>>(authToken, "/api/me/export");
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vocabulando-lgpd-${me.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setAccountStatus("Exportação LGPD gerada.");
  }

  async function handleDeleteLgpd() {
    if (!authToken) return;
    await apiFetch(authToken, "/api/me", { method: "DELETE" });
    clearAuthToken();
    const newToken = await ensureAuthToken();
    setTokenState(newToken);
    await refreshProfile(newToken);
    setAccountStatus("Dados anteriores removidos permanentemente (LGPD).");
  }

  if (!authToken || !me) {
    return (
      <div className="container" style={{ paddingTop: "4rem", textAlign: "center" }}>
        <h1 className="brand">Vocabulando</h1>
        <p style={{ color: "var(--muted)", marginTop: "0.5rem" }}>Preparando seu léxico...</p>
      </div>
    );
  }

  const savedIds = new Set(collections[0]?.wordIds ?? []);

  return (
    <div className="app-shell">
      {showOnboarding && (
        <OnboardingModal
          userId={authToken}
          onComplete={() => {
            setShowOnboarding(false);
            void refreshProfile(authToken);
          }}
        />
      )}

      <header className="topbar">
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          <span className="brand">Vocabulando</span>
          <nav className="nav-tabs" aria-label="Navegação principal">
            <button type="button" className={`btn ${tab === "feed" ? "active" : ""}`} onClick={() => setTab("feed")}>
              Feed
            </button>
            <button
              type="button"
              className={`btn ${tab === "quiz" ? "active" : ""}`}
              onClick={() => {
                setTab("quiz");
                void loadQuiz();
              }}
            >
              Quiz &amp; SRS ({dueItems.length})
            </button>
            <button
              type="button"
              className={`btn ${tab === "collections" ? "active" : ""}`}
              onClick={() => setTab("collections")}
            >
              Coleções ({savedIds.size})
            </button>
            <button
              type="button"
              className={`btn ${tab === "refiner" ? "active" : ""}`}
              onClick={() => setTab("refiner")}
            >
              <Sparkles size={14} /> Refinador Web
            </button>
            <button
              type="button"
              className={`btn ${tab === "account" ? "active" : ""}`}
              onClick={() => setTab("account")}
            >
              Conta &amp; Planos
            </button>
            <button
              type="button"
              className={`btn ${tab === "admin" ? "active" : ""}`}
              onClick={() => {
                setTab("admin");
                void loadAdminPanel();
              }}
            >
              Admin
            </button>
          </nav>
        </div>

        <div className="hud">
          <select
            aria-label="Idioma do léxico"
            value={lang}
            onChange={(e) => setLang(e.target.value as LanguageCode)}
            style={{ width: "auto", padding: "0.35rem 0.6rem" }}
          >
            <option value="pt-BR">PT-BR</option>
            <option value="en-US">EN-US (Preview)</option>
            <option value="es-ES">ES-ES (Preview)</option>
          </select>
          <span className="pill" title="Ofensiva atual">
            <Flame size={15} color="var(--accent)" /> {me.habit.currentStreak}d
          </span>
          <span className="pill" title="Escudos de proteção">
            <Shield size={15} color="var(--green)" /> {me.habit.freezeShields}
          </span>
          <span className="pill">
            {me.rank} • {me.habit.totalXp} XP
          </span>
        </div>
      </header>

      <main className="container">
        {tab === "feed" && (
          <section className="feed-snap">
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
              <input
                className="input"
                style={{ flex: 1, minWidth: "220px" }}
                placeholder="Buscar qualquer palavra em dicionários públicos..."
                value={dictQuery}
                onChange={(e) => setDictQuery(e.target.value)}
              />
              <button type="button" className="btn" onClick={() => void handleDictionaryLookup()}>
                Consultar Dicionário
              </button>
            </div>

            {dictResult && (
              <div className="panel" style={{ borderColor: "var(--accent)" }}>
                <strong>
                  {dictResult.word} {dictResult.phoneticIpa && `(${dictResult.phoneticIpa})`}
                </strong>{" "}
                <span style={{ color: "var(--muted)", fontSize: "0.82rem" }}>
                  • fonte: {dictResult.source}
                </span>
                {dictResult.found ? (
                  <div style={{ marginTop: "0.4rem", fontSize: "0.92rem" }}>
                    <p>{dictResult.definitions[0]}</p>
                    {dictResult.etymology && (
                      <p style={{ color: "var(--muted)", marginTop: "0.25rem" }}>
                        Etimologia: {dictResult.etymology}
                      </p>
                    )}
                    {dictResult.synonyms.length > 0 && (
                      <p style={{ color: "var(--accent)", marginTop: "0.25rem" }}>
                        Sinônimos: {dictResult.synonyms.join(", ")}
                      </p>
                    )}
                  </div>
                ) : (
                  <p style={{ color: "var(--muted)", marginTop: "0.3rem" }}>
                    Palavra não encontrada nas fontes públicas no momento.
                  </p>
                )}
              </div>
            )}

            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ color: "var(--muted)", fontSize: "0.88rem" }}>Trilha:</span>
              {(
                [
                  ["", "Todas"],
                  ["essencial-culto", "Essencial Culto"],
                  ["comunicacao-executiva", "Comunicação Executiva"],
                  ["redacao-argumentacao", "Redação & Argumentação"],
                  ["literario-poetico", "Literário"],
                  ["paronimos", "Parônimos"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={label}
                  type="button"
                  className={`btn ${category === value ? "active" : ""}`}
                  onClick={() => setCategory(value)}
                >
                  {label}
                </button>
              ))}
            </div>

            {fastSkimCount >= 3 && (
              <div className="panel" style={{ borderColor: "var(--accent)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                <span>
                  Você passou rápido por {fastSkimCount} palavras! Que tal um Micro-Quiz de 20s para fixar de verdade?
                </span>
                <button
                  type="button"
                  className="btn primary"
                  onClick={() => {
                    setFastSkimCount(0);
                    setTab("quiz");
                    void loadQuiz();
                  }}
                >
                  Fazer Micro-Quiz
                </button>
              </div>
            )}

            {words.map((w) => (
              <WordCard
                key={w.id}
                userId={authToken}
                word={w}
                collections={collections}
                onToggleSave={toggleFavorite}
                onWordStudied={handleWordStudied}
              />
            ))}
          </section>
        )}

        {tab === "quiz" && (
          <section className="feed-snap">
            <h2>Micro-Quiz Contextual &amp; Revisão SRS</h2>
            <p style={{ color: "var(--muted)" }}>
              Erros entram automaticamente na fila de Repetição Espaçada ({dueItems.length} pendente(s) hoje).
            </p>
            {dueItems.length > 0 && (
              <div className="panel">
                <strong style={{ color: "var(--accent)", fontSize: "0.86rem" }}>FILA DE REVISÃO SRS</strong>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                  {dueItems.map((item) => (
                    <span key={item.wordId} className="pill">
                      {item.wordId} • intervalo {item.intervalDays}d • falhas {item.lapses}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {quizQuestions.map((q) => (
              <div key={q.wordId} className="word-card">
                <p style={{ fontSize: "1.08rem" }}>{q.prompt}</p>
                <p style={{ fontSize: "0.86rem", color: "var(--muted)" }}>Dica: {q.hint}</p>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  {q.options.map((opt) => (
                    <button key={opt} type="button" className="btn" onClick={() => void answerQuiz(q, opt)}>
                      {opt}
                    </button>
                  ))}
                </div>
                {quizResult[q.wordId] && (
                  <p style={{ color: "var(--accent)", fontSize: "0.92rem" }}>{quizResult[q.wordId]}</p>
                )}
              </div>
            ))}
          </section>
        )}

        {tab === "collections" && (
          <section className="feed-snap">
            <h2>Suas Coleções</h2>
            <div className="word-card" style={{ flexDirection: "row", alignItems: "center" }}>
              <input
                className="input"
                placeholder="Nome da nova coleção (ex: Redação ENEM)..."
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
              />
              <button type="button" className="btn primary" onClick={() => void handleCreateCollection()}>
                <Plus size={16} /> Criar coleção
              </button>
            </div>
            {collections.map((c) => (
              <div key={c.id} className="word-card">
                <h3>{c.name}</h3>
                <p style={{ color: "var(--muted)" }}>
                  {c.wordIds.length === 0
                    ? "Nenhuma palavra salva ainda nesta coleção."
                    : `Palavras salvas: ${c.wordIds.join(", ")}`}
                </p>
              </div>
            ))}
          </section>
        )}

        {tab === "refiner" && (
          <section className="feed-snap">
            <h2>Refinador Lexical (Plataforma Web)</h2>
            <p style={{ color: "var(--muted)" }}>
              Cole um parágrafo ou e-mail e receba sugestões de substituição por registro sem perder naturalidade.
            </p>
            <div className="word-card">
              <textarea rows={4} value={draftText} onChange={(e) => setDraftText(e.target.value)} />
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                <select
                  value={targetRegister}
                  onChange={(e) => setTargetRegister(e.target.value as RegisterLevel)}
                  style={{ maxWidth: "220px" }}
                >
                  <option value="executivo">Registro Executivo</option>
                  <option value="literario">Registro Literário</option>
                  <option value="erudito">Registro Erudito</option>
                </select>
                <button type="button" className="btn primary" onClick={() => void handleRefine()}>
                  Refinar texto
                </button>
              </div>
              {refineResult && (
                <div className="panel">
                  <strong>Prévia Refinada:</strong>
                  <p style={{ margin: "0.4rem 0 0.8rem" }}>{refineResult.refinedPreview}</p>
                  {refineResult.suggestions.map((s) => (
                    <div key={s.original} style={{ fontSize: "0.88rem", color: "var(--muted)" }}>
                      <strong>{s.original}</strong> → <span style={{ color: "var(--accent)" }}>{s.suggestion}</span> ({s.note})
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {tab === "account" && (
          <section className="feed-snap">
            <h2>Conta, Planos &amp; Privacidade (LGPD)</h2>

            <div className="grid-2">
              <div className="word-card">
                <h3>Plano Gratuito (Sem Paywall Agressivo)</h3>
                <p style={{ color: "var(--muted)", fontSize: "0.92rem" }}>
                  Feed diário completo, áudio, favoritos, micro-quizzes, revisão SRS e ofensiva gentil 100% gratuitos.
                </p>
                <span className="pill" style={{ width: "fit-content" }}>
                  Seu plano atual: {me.plan.toUpperCase()}
                </span>
              </div>

              <div className="word-card" style={{ borderColor: "rgba(232,184,109,0.5)" }}>
                <h3>Vocabulando Pro (V2)</h3>
                <p style={{ color: "var(--muted)", fontSize: "0.92rem" }}>
                  IA Contextual ilimitada, coleções ilimitadas, pacotes offline completos e refinador avançado na Web.
                </p>
                <button type="button" className="btn" onClick={() => setShowOnboarding(true)}>
                  Refazer preferências de Onboarding
                </button>
              </div>
            </div>

            <div className="word-card">
              <h3 style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                <UserCheck size={18} color="var(--accent)" /> Conta &amp; Autenticação ({me.authKind})
              </h3>
              <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                <button
                  type="button"
                  className={`btn ${authMode === "upgrade" ? "active" : ""}`}
                  onClick={() => setAuthMode("upgrade")}
                >
                  Vincular Convidado
                </button>
                <button
                  type="button"
                  className={`btn ${authMode === "register" ? "active" : ""}`}
                  onClick={() => setAuthMode("register")}
                >
                  Criar Conta (Senha)
                </button>
                <button
                  type="button"
                  className={`btn ${authMode === "login" ? "active" : ""}`}
                  onClick={() => setAuthMode("login")}
                >
                  Entrar (Login)
                </button>
              </div>
              <div className="grid-2">
                {authMode !== "login" && (
                  <input
                    className="input"
                    placeholder="Seu nome"
                    value={upgradeName}
                    onChange={(e) => setUpgradeName(e.target.value)}
                  />
                )}
                <input
                  className="input"
                  type="email"
                  placeholder="seu@email.com"
                  value={upgradeEmail}
                  onChange={(e) => setUpgradeEmail(e.target.value)}
                />
                {authMode !== "upgrade" && (
                  <input
                    className="input"
                    type="password"
                    placeholder="Senha (mín. 6 caracteres)"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                  />
                )}
              </div>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <button type="button" className="btn primary" onClick={() => void handleUpgradeAccount()}>
                  {authMode === "login"
                    ? "Entrar na conta"
                    : authMode === "register"
                      ? "Registrar conta"
                      : "Salvar e sincronizar progresso"}
                </button>
                <button type="button" className="btn" onClick={() => void handleExportLgpd()}>
                  <Download size={15} /> Exportar dados (LGPD)
                </button>
                <button type="button" className="btn" onClick={() => void handleDeleteLgpd()}>
                  <Trash2 size={15} color="var(--red)" /> Excluir minha conta
                </button>
              </div>
              {accountStatus && (
                <p style={{ color: "var(--green)", fontSize: "0.9rem" }}>{accountStatus}</p>
              )}
            </div>
          </section>
        )}

        {tab === "admin" && (
          <section className="feed-snap">
            <h2>Painel Administrativo (RBAC)</h2>
            {adminError ? (
              <div className="word-card">
                <p style={{ color: "var(--red)" }}>{adminError}</p>
                <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
                  Apenas usuários com perfil <code>admin</code> podem consultar métricas agregadas e logs de erro.
                </p>
              </div>
            ) : adminStats ? (
              <>
                <div className="grid-2">
                  <div className="word-card">
                    <h3>Acervo &amp; Atividades</h3>
                    <p>Palavras catalogadas: <strong>{adminStats.lexiconWordsCount}</strong></p>
                    <p>Atividades geradas (6/palavra): <strong>{adminStats.activitiesCount}</strong></p>
                  </div>
                  <div className="word-card">
                    <h3>Engajamento &amp; Telemetria</h3>
                    <p>Usuários: <strong>{adminStats.usersCount}</strong></p>
                    <p>Eventos de estudo: <strong>{adminStats.eventsCount}</strong></p>
                    <p>Eventos de telemetria: <strong>{adminStats.analyticsCount}</strong></p>
                  </div>
                </div>
                <div className="word-card">
                  <h3>Logs de Erro Recentes</h3>
                  {adminLogs.length === 0 ? (
                    <p style={{ color: "var(--muted)" }}>Nenhum erro registrado.</p>
                  ) : (
                    adminLogs.map((l, idx) => (
                      <pre key={idx} style={{ fontSize: "0.8rem", overflowX: "auto" }}>{l}</pre>
                    ))
                  )}
                </div>
              </>
            ) : (
              <p style={{ color: "var(--muted)" }}>Carregando painel administrativo...</p>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
