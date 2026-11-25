import { useState } from "react";
import type {
  DifficultyLevel,
  OnboardingPreferences,
  TrackCategory,
} from "@vocabulando/domain";
import { apiFetch } from "../apiClient.ts";

interface Props {
  userId: string;
  onComplete: (prefs: OnboardingPreferences) => void;
}

const TRACK_OPTIONS: Array<{ value: TrackCategory; label: string }> = [
  { value: "essencial-culto", label: "Essencial Culto" },
  { value: "comunicacao-executiva", label: "Comunicação Executiva" },
  { value: "redacao-argumentacao", label: "Redação & Argumentação" },
  { value: "literario-poetico", label: "Literário & Poético" },
  { value: "paronimos", label: "Parônimos (Não confunda)" },
];

export function OnboardingModal({ userId, onComplete }: Props) {
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState<OnboardingPreferences["goal"]>("carreira");
  const [tracks, setTracks] = useState<TrackCategory[]>(["essencial-culto", "comunicacao-executiva"]);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("intermediario");
  const [notificationHour, setNotificationHour] = useState(9);
  const [saving, setSaving] = useState(false);

  function toggleTrack(value: TrackCategory) {
    setTracks((prev) =>
      prev.includes(value)
        ? prev.length > 1
          ? prev.filter((t) => t !== value)
          : prev
        : [...prev, value],
    );
  }

  async function finish() {
    setSaving(true);
    const prefs: OnboardingPreferences = {
      goal,
      tracks,
      difficulty,
      notificationHour,
      languageCode: "pt-BR",
    };
    try {
      await apiFetch(userId, "/api/me/onboarding", {
        method: "POST",
        body: JSON.stringify(prefs),
      });
      onComplete(prefs);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.78)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        zIndex: 50,
      }}
    >
      <div className="word-card" style={{ maxWidth: "520px", width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "var(--accent)", fontSize: "0.8rem", fontWeight: 700 }}>
            PASSO {step} DE 4 • SEM PAYWALL BLOQUEANTE
          </span>
          <button
            type="button"
            className="btn"
            onClick={() => void finish()}
            disabled={saving}
          >
            Pular
          </button>
        </div>

        <h2 id="onboarding-title" style={{ fontFamily: "Georgia, serif", fontSize: "1.6rem" }}>
          {step === 1 && "Qual é o seu objetivo principal?"}
          {step === 2 && "Quais trilhas mais combinam com você?"}
          {step === 3 && "Qual nível de desafio prefere?"}
          {step === 4 && "Melhor horário para a Palavra do Dia"}
        </h2>

        {step === 1 && (
          <div className="grid-2">
            {(
              [
                ["carreira", "Comunicação no Trabalho"],
                ["redacao", "Redação, Provas & Concursos"],
                ["oratoria", "Oratória & Argumentação"],
                ["cultura", "Leitura & Repertório Cultural"],
              ] as const
            ).map(([val, label]) => (
              <button
                key={val}
                type="button"
                className={`btn ${goal === val ? "active" : ""}`}
                onClick={() => setGoal(val)}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {TRACK_OPTIONS.map((t) => (
              <button
                key={t.value}
                type="button"
                className={`btn ${tracks.includes(t.value) ? "active" : ""}`}
                onClick={() => toggleTrack(t.value)}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {step === 3 && (
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {(
              [
                ["intermediario", "Intermediário (Uso diário culto)"],
                ["avancado", "Avançado (Precisão & Nuance)"],
                ["erudito", "Erudito (Literário & Raro)"],
              ] as const
            ).map(([val, label]) => (
              <button
                key={val}
                type="button"
                className={`btn ${difficulty === val ? "active" : ""}`}
                onClick={() => setDifficulty(val)}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {step === 4 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            <label htmlFor="notif-hour" style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
              Horário do lembrete diário: <strong>{notificationHour}:00</strong>
            </label>
            <input
              id="notif-hour"
              type="range"
              min={6}
              max={22}
              value={notificationHour}
              onChange={(e) => setNotificationHour(Number(e.target.value))}
            />
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem" }}>
          <button
            type="button"
            className="btn"
            disabled={step === 1}
            onClick={() => setStep((s) => Math.max(1, s - 1))}
          >
            Voltar
          </button>
          {step < 4 ? (
            <button type="button" className="btn primary" onClick={() => setStep((s) => s + 1)}>
              Continuar
            </button>
          ) : (
            <button
              type="button"
              className="btn primary"
              disabled={saving}
              onClick={() => void finish()}
            >
              {saving ? "Salvando..." : "Começar grátis"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
