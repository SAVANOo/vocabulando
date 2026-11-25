import { useEffect, useRef, useState } from "react";
import { Bookmark, Check, Share2, Sparkles, Volume2 } from "lucide-react";
import type { RegisterLevel, WordEntry } from "@vocabulando/domain";
import { apiFetch, recordEvent } from "../apiClient.ts";

const REGISTER_SCALE: Record<RegisterLevel, number> = {
  coloquial: 1,
  neutro: 2,
  executivo: 3,
  literario: 4,
  erudito: 5,
};

export interface WordCardCollection {
  id: string;
  name: string;
  wordIds: string[];
}

interface Props {
  userId: string;
  word: WordEntry;
  collections: WordCardCollection[];
  onToggleSave: (wordId: string, collectionId: string) => void;
  onWordStudied: (dwellTimeMs: number) => void;
}

export function WordCard({ userId, word, collections, onToggleSave, onWordStudied }: Props) {
  const [aiExample, setAiExample] = useState<string | null>(null);
  const [sentence, setSentence] = useState("");
  const [sentenceFeedback, setSentenceFeedback] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>("");
  const mountedAtRef = useRef<number | null>(null);

  useEffect(() => {
    mountedAtRef.current = Date.now();
  }, []);

  const activeCollection =
    collections.find((c) => c.id === selectedCollectionId) ?? collections[0];
  const isSaved = activeCollection ? activeCollection.wordIds.includes(word.id) : false;

  const level = REGISTER_SCALE[word.register] ?? 2;

  function playPronunciation() {
    if ("vibrate" in navigator) navigator.vibrate(10);
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(word.word);
      utter.lang = word.languageCode;
      window.speechSynthesis.speak(utter);
    }
  }

  async function markViewed() {
    const startedAt = mountedAtRef.current ?? Date.now();
    const dwellTimeMs = Math.max(200, Math.min(600_000, Date.now() - startedAt));
    await recordEvent(userId, "WORD_VIEWED", word.id, { dwellTimeMs });
    onWordStudied(dwellTimeMs);
  }

  async function generateContext(profile: "corporativo" | "academico" | "literario" | "cotidiano") {
    const res = await apiFetch<{ generatedExample: string }>(userId, "/api/ai/context", {
      method: "POST",
      body: JSON.stringify({ wordId: word.id, contextProfile: profile }),
    });
    setAiExample(res.generatedExample);
  }

  async function submitSentence() {
    if (sentence.trim().length < 6) return;
    const res = await apiFetch<{ accepted: boolean; feedback: string }>(
      userId,
      "/api/ai/evaluate-sentence",
      {
        method: "POST",
        body: JSON.stringify({ wordId: word.id, sentence }),
      },
    );
    setSentenceFeedback(res.feedback);
    if (res.accepted) {
      await recordEvent(userId, "ACTIVE_SENTENCE_SUBMITTED", word.id);
      onWordStudied(5000);
    }
  }

  async function shareCard() {
    const shareText = `${word.word} (${word.phoneticIpa}) — ${word.shortDefinition}\n\nAprenda no Vocabulando`;
    await navigator.clipboard?.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  function downloadWordPng() {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#0b0c10";
    ctx.fillRect(0, 0, 1080, 1080);

    ctx.strokeStyle = "#e8b86d";
    ctx.lineWidth = 6;
    ctx.strokeRect(48, 48, 984, 984);

    ctx.fillStyle = "#e8b86d";
    ctx.font = "bold 28px sans-serif";
    ctx.fillText("VOCABULANDO • PALAVRA DO DIA", 96, 130);

    ctx.fillStyle = "#f4f1ea";
    ctx.font = "bold 84px Georgia, serif";
    ctx.fillText(word.word, 96, 290);

    ctx.fillStyle = "#e8b86d";
    ctx.font = "32px monospace";
    ctx.fillText(`${word.phoneticIpa} • ${word.partOfSpeech}`, 96, 355);

    ctx.fillStyle = "#f4f1ea";
    ctx.font = "38px sans-serif";
    const words = word.shortDefinition.split(" ");
    let line = "";
    let y = 470;
    for (const w of words) {
      const test = `${line}${w} `;
      if (ctx.measureText(test).width > 880) {
        ctx.fillText(line.trim(), 96, y);
        line = `${w} `;
        y += 54;
      } else {
        line = test;
      }
    }
    if (line.trim()) ctx.fillText(line.trim(), 96, y);

    ctx.fillStyle = "#b2b7c4";
    ctx.font = "italic 30px Georgia, serif";
    ctx.fillText(word.etymologySummary.slice(0, 68), 96, 940);

    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `vocabulando-${word.id}.png`;
    a.click();
  }

  return (
    <article className="word-card" aria-label={`Palavra ${word.word}`}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <h2 className="word-title">{word.word}</h2>
            <button type="button" className="btn" onClick={playPronunciation} aria-label="Ouvir pronúncia">
              <Volume2 size={16} /> Ouvir
            </button>
          </div>
          <div className="ipa">
            {word.phoneticIpa} • {word.partOfSpeech}
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap", alignItems: "center" }}>
          {collections.length > 1 && activeCollection && (
            <select
              aria-label={`Selecionar coleção para ${word.word}`}
              value={activeCollection.id}
              onChange={(e) => setSelectedCollectionId(e.target.value)}
              style={{ width: "auto", padding: "0.4rem 0.6rem", fontSize: "0.82rem" }}
            >
              {collections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            className={`btn ${isSaved ? "active" : ""}`}
            onClick={() => activeCollection && onToggleSave(word.id, activeCollection.id)}
            aria-label={isSaved ? "Remover dos favoritos" : "Salvar palavra"}
          >
            <Bookmark size={16} /> {isSaved ? "Salva" : "Salvar"}
          </button>
          <button type="button" className="btn" onClick={shareCard} aria-label="Compartilhar palavra">
            {copied ? <Check size={16} /> : <Share2 size={16} />}
            {copied ? "Copiado" : "Compartilhar"}
          </button>
          <button type="button" className="btn" onClick={downloadWordPng} aria-label="Baixar card PNG">
            PNG
          </button>
        </div>
      </div>

      {/* Termômetro de Registro */}
      <div className="register-meter" title={`Registro: ${word.register}`}>
        <span>Registro ({word.register}):</span>
        {[1, 2, 3, 4, 5].map((dot) => (
          <span key={dot} className={`meter-dot ${dot <= level ? "filled" : ""}`} />
        ))}
      </div>

      <p style={{ fontSize: "1.06rem" }}>{word.shortDefinition}</p>

      <blockquote className="panel" style={{ borderLeft: "3px solid var(--accent)" }}>
        "{word.exampleSentence}"
      </blockquote>

      {word.paronymPair && (
        <div className="panel" style={{ borderColor: "rgba(232,184,109,0.45)" }}>
          <strong>Atenção (Parônimo — não confunda com "{word.paronymPair.confusableWith}"):</strong>{" "}
          <span style={{ color: "var(--muted)" }}>{word.paronymPair.differenceNote}</span>
        </div>
      )}

      {/* Etimologia Visual */}
      <div className="panel">
        <strong style={{ color: "var(--accent)", fontSize: "0.86rem" }}>ETIMOLOGIA VISUAL</strong>
        <p style={{ fontSize: "0.9rem", color: "var(--muted)", margin: "0.3rem 0 0.6rem" }}>
          {word.etymologySummary}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {word.etymologyParts.map((part) => (
            <div
              key={`${word.id}-${part.part}`}
              style={{
                background: "var(--bg)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                padding: "0.45rem 0.7rem",
                fontSize: "0.82rem",
              }}
            >
              <strong>{part.part}</strong> ({part.originLanguage}): {part.meaning}
              {part.relatedWords.length > 0 && (
                <div style={{ color: "var(--muted)", marginTop: "0.2rem" }}>
                  Irmãs: {part.relatedWords.join(", ")}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Sinônimos por Nuance */}
      {word.synonyms.length > 0 && (
        <div className="panel">
          <strong style={{ color: "var(--accent)", fontSize: "0.86rem" }}>SINÔNIMOS POR CONTEXTO</strong>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", marginTop: "0.4rem" }}>
            {word.synonyms.map((s) => (
              <div key={s.word} style={{ fontSize: "0.88rem" }}>
                <strong>{s.word}</strong>{" "}
                <span style={{ color: "var(--accent)" }}>[{s.register} • {s.tone}]</span> —{" "}
                <span style={{ color: "var(--muted)" }}>{s.nuanceNote}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modo Palavra no Contexto + Prática Ativa */}
      <div className="panel">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
          <strong style={{ fontSize: "0.86rem", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
            <Sparkles size={15} color="var(--accent)" /> Palavra no Contexto &amp; Prática Ativa
          </strong>
          <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
            {(["corporativo", "academico", "literario", "cotidiano"] as const).map((ctx) => (
              <button key={ctx} type="button" className="btn" onClick={() => generateContext(ctx)}>
                {ctx}
              </button>
            ))}
          </div>
        </div>
        {aiExample && (
          <p style={{ marginTop: "0.65rem", fontSize: "0.92rem", color: "var(--text)" }}>{aiExample}</p>
        )}

        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
          <input
            className="input"
            placeholder={`Escreva uma frase usando "${word.word}"...`}
            value={sentence}
            onChange={(e) => setSentence(e.target.value)}
          />
          <button type="button" className="btn primary" onClick={submitSentence}>
            Avaliar (+25 XP)
          </button>
        </div>
        {sentenceFeedback && (
          <p style={{ marginTop: "0.45rem", fontSize: "0.86rem", color: "var(--green)" }}>
            {sentenceFeedback}
          </p>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button type="button" className="btn" onClick={markViewed}>
          Marcar como estudada (+5 XP)
        </button>
      </div>
    </article>
  );
}
