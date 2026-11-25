import React, { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  Vibration,
  View,
} from "react-native";
import { buildQuizBlank } from "@vocabulando/domain";
import { MOBILE_LEXICON, SYNONYM_ROUNDS, type MobileWordEntry } from "../data/mobileLexicon";
import type { VocabPalette } from "../theme/palettes";
import { playUiSound } from "../utils/soundEffects";
import { speakPtBr } from "../utils/speechPtBr";
import { AppIcon, MascotLikeSvg } from "./AppIcon";
import type { PathExerciseKind } from "./LearningPath";

interface LessonQuestion {
  key: string;
  wordId: string;
  mode: "listening" | "synonyms" | "upgrade" | "writing" | "radar" | "quiz";
  badge: string;
  prompt: string;
  hint?: string;
  audioText?: string;
  options?: string[];
  correct: string;
  explanation: string;
}

interface Props {
  nodeId: string;
  kind: PathExerciseKind;
  seedOffset: number;
  words: MobileWordEntry[];
  palette: VocabPalette;
  soundEnabled: boolean;
  onRecordAnswer: (wordId: string, hit: boolean) => void;
  onCompleteLesson: (nodeId: string, xpEarned: number) => void;
  onExit: () => void;
}

function norm(s: string): string {
  return s.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function buildLessonQuestions(
  kind: PathExerciseKind,
  seed: number,
  words: MobileWordEntry[],
): LessonQuestion[] {
  const pool = words.length >= 8 ? words : MOBILE_LEXICON;
  const out: LessonQuestion[] = [];
  const usedWords = new Set<string>();

  for (let i = 0; i < 4; i++) {
    let pickIdx = (seed + i * 3) % pool.length;
    let w = pool[pickIdx]!;
    let attempts = 0;
    while (usedWords.has(w.word) && attempts < pool.length) {
      attempts += 1;
      pickIdx = (pickIdx + 1) % pool.length;
      w = pool[pickIdx]!;
    }
    usedWords.add(w.word);
    const d1 = pool[(pickIdx + 2) % pool.length]!;
    const d2 = pool[(pickIdx + 4) % pool.length]!;
    const uniqueOpts = Array.from(new Set([w.word, d1.word, d2.word])).sort();
    while (uniqueOpts.length < 3) {
      const extra = MOBILE_LEXICON[(uniqueOpts.length + i) % MOBILE_LEXICON.length]!.word;
      if (!uniqueOpts.includes(extra)) uniqueOpts.push(extra);
    }

    if (kind === "listening") {
      out.push({
        key: `q-${i}`,
        wordId: w.id,
        mode: "listening",
        badge: "ESCUTA ATIVA",
        prompt: "Ouça a pronúncia e escolha a palavra correta:",
        hint: `Pronúncia: ${w.ipa}`,
        audioText: w.word,
        options: uniqueOpts,
        correct: w.word,
        explanation: `"${w.word}" significa: ${w.definition}`,
      });
    } else if (kind === "synonyms") {
      const sr = SYNONYM_ROUNDS[(seed + i) % SYNONYM_ROUNDS.length]!;
      const synWord = w.synonyms[0]?.word;
      if (synWord && !usedWords.has(w.word) && i >= 2) {
        usedWords.add(w.word);
        out.push({
          key: `q-${i}`,
          wordId: w.id,
          mode: "synonyms",
          badge: "SINÔNIMOS",
          prompt: `Qual palavra tem sentido próximo de "${w.word}"?`,
          hint: w.definition,
          options: [synWord, d1.word, d2.word].sort(),
          correct: synWord,
          explanation: `"${synWord}" relaciona-se com "${w.word}".`,
        });
      } else {
        out.push({
          key: `q-${i}`,
          wordId: sr.id,
          mode: "synonyms",
          badge: "SINÔNIMOS",
          prompt: `Qual opção é sinônimo de "${sr.targetWord}"?`,
          hint: sr.nuanceHint,
          options: sr.options,
          correct: sr.correctSynonym,
          explanation: sr.nuanceHint,
        });
      }
    } else if (kind === "writing") {
      const blank = buildQuizBlank(w.example, w.word, w.definition);
      out.push({
        key: `q-${i}`,
        wordId: w.id,
        mode: "writing",
        badge: "ESCRITA EM CONTEXTO",
        prompt: blank.prompt,
        hint: `${w.definition} (começa com "${w.word[0]?.toUpperCase()}")`,
        correct: w.word,
        explanation: `Frase completa: "${w.example}"`,
      });
    } else if (kind === "radar") {
      const pairs = [
        { word: "ratificar", alt: "retificar", s: "O conselho decidiu _______ o acordo.", exp: "Ratificar = confirmar; Retificar = corrigir." },
        { word: "iminente", alt: "eminente", s: "A tempestade parece _______.", exp: "Iminente = prestes a ocorrer; Eminente = ilustre." },
        { word: "discrição", alt: "descrição", s: "O tema exige total _______.", exp: "Discrição = reserva; Descrição = detalhamento." },
        { word: "deferir", alt: "diferir", s: "O relator decidiu _______ o pedido.", exp: "Deferir = aprovar; Diferir = ser diferente ou adiar." },
      ];
      const p = pairs[(seed + i) % pairs.length]!;
      out.push({
        key: `q-${i}`,
        wordId: p.word,
        mode: "radar",
        badge: "RADAR DE CONFUSÃO",
        prompt: p.s,
        hint: p.exp,
        options: [p.word, p.alt],
        correct: p.word,
        explanation: p.exp,
      });
    } else if (kind === "upgrade") {
      const blank = buildQuizBlank(w.example, w.word, w.definition);
      out.push({
        key: `q-${i}`,
        wordId: w.id,
        mode: "upgrade",
        badge: "PRECISÃO LEXICAL",
        prompt: blank.prompt,
        hint: w.definition,
        options: uniqueOpts,
        correct: w.word,
        explanation: `"${w.word}": ${w.definition}`,
      });
    } else {
      const blank = buildQuizBlank(w.example, w.word, w.definition);
      out.push({
        key: `q-${i}`,
        wordId: w.id,
        mode: "quiz",
        badge: "COMPLETE A FRASE",
        prompt: blank.prompt,
        hint: w.definition,
        options: uniqueOpts,
        correct: w.word,
        explanation: `"${w.word}": ${w.definition}`,
      });
    }
  }
  return out;
}

export function LessonSessionRunner({
  nodeId,
  kind,
  seedOffset,
  words,
  palette,
  soundEnabled,
  onRecordAnswer,
  onCompleteLesson,
  onExit,
}: Props) {
  const initialQuestions = useMemo(
    () => buildLessonQuestions(kind, seedOffset, words),
    [kind, seedOffset, words],
  );

  const [queue, setQueue] = useState<LessonQuestion[]>(initialQuestions);
  const [cursor, setCursor] = useState(0);
  const [isCorrectionPhase, setIsCorrectionPhase] = useState(false);
  const [errorQueue, setErrorQueue] = useState<LessonQuestion[]>([]);
  const [firstPassHits, setFirstPassHits] = useState(0);
  const [totalWrong, setTotalWrong] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [correctionBannerVisible, setCorrectionBannerVisible] = useState(false);
  const [done, setDone] = useState(false);

  const current = queue[cursor];
  const progressPct = done
    ? 100
    : Math.round(((cursor + (picked ? 1 : 0)) / Math.max(1, queue.length)) * 100);

  function submitAnswer(val: string) {
    if (!current || picked) return;
    const hit = norm(val) === norm(current.correct);
    setPicked(val);
    Vibration.vibrate(hit ? 14 : 32);
    playUiSound(hit ? "success" : "softError", soundEnabled);
    onRecordAnswer(current.wordId, hit);

    if (hit) {
      if (!isCorrectionPhase) setFirstPassHits((h) => h + 1);
    } else {
      setTotalWrong((w) => w + 1);
      setErrorQueue((prev) =>
        prev.some((q) => q.key === current.key) ? prev : [...prev, current],
      );
    }
  }

  function advance() {
    setPicked(null);
    setTyped("");
    setShowHint(false);

    if (cursor + 1 < queue.length) {
      setCursor((c) => c + 1);
      return;
    }

    if (errorQueue.length > 0) {
      setQueue(errorQueue);
      setErrorQueue([]);
      setCursor(0);
      setIsCorrectionPhase(true);
      setCorrectionBannerVisible(true);
      return;
    }

    playUiSound("success", soundEnabled);
    setDone(true);
  }

  if (done) {
    const accuracy = Math.round((firstPassHits / Math.max(1, initialQuestions.length)) * 100);
    const xpEarned = firstPassHits * 15 + 10;
    return (
      <View style={styles.doneWrap}>
        <MascotLikeSvg accent={palette.accent} gold={palette.gold} mood="combo" />
        <Text style={[styles.doneTitle, { color: palette.text }]}>Lição concluída!</Text>
        <Text style={{ color: palette.muted, fontSize: 13, textAlign: "center" }}>
          Você completou todas as etapas{totalWrong > 0 ? " e corrigiu os erros no final" : " sem erros"}.
        </Text>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <Text style={{ color: palette.accent, fontSize: 20, fontWeight: "800" }}>+{xpEarned}</Text>
            <Text style={{ color: palette.muted, fontSize: 11 }}>XP Ganho</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <Text style={{ color: palette.success, fontSize: 20, fontWeight: "800" }}>{accuracy}%</Text>
            <Text style={{ color: palette.muted, fontSize: 11 }}>Precisão</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <Text style={{ color: palette.gold, fontSize: 20, fontWeight: "800" }}>{totalWrong}</Text>
            <Text style={{ color: palette.muted, fontSize: 11 }}>Corrigidos</Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          style={[styles.primaryBtn, { backgroundColor: palette.accent, width: "100%" }]}
          onPress={() => onCompleteLesson(nodeId, xpEarned)}
        >
          <Text style={{ color: palette.accentInk, fontWeight: "800", fontSize: 15 }}>
            Concluir e voltar à Trilha ✓
          </Text>
        </Pressable>
      </View>
    );
  }

  if (!current) return null;

  const isHit = picked !== null && norm(picked) === norm(current.correct);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Barra de acompanhamento da lição */}
      <View style={styles.topHeader}>
        <Pressable accessibilityRole="button" onPress={onExit} style={styles.exitBtn}>
          <Text style={{ color: palette.muted, fontSize: 15, fontWeight: "700" }}>✕</Text>
        </Pressable>
        <View style={[styles.progressTrack, { backgroundColor: palette.surfaceAlt }]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: isCorrectionPhase ? palette.gold : palette.accent,
                width: `${progressPct}%`,
              },
            ]}
          />
        </View>
        <Text style={{ color: palette.muted, fontSize: 12, fontWeight: "700" }}>
          {cursor + 1}/{queue.length}
        </Text>
      </View>

      {correctionBannerVisible ? (
        <View style={styles.doneWrap}>
          <MascotLikeSvg accent={palette.gold} gold={palette.accent} mood="encourage" />
          <Text style={[styles.doneTitle, { color: palette.text }]}>Hora de corrigir!</Text>
          <Text style={{ color: palette.muted, fontSize: 14, textAlign: "center", lineHeight: 20 }}>
            Vamos revisar {queue.length}{" "}
            {queue.length === 1 ? "questão que precisa de reforço" : "questões que precisam de reforço"} antes de concluir a lição.
          </Text>
          <Pressable
            accessibilityRole="button"
            style={[styles.primaryBtn, { backgroundColor: palette.gold, width: "100%" }]}
            onPress={() => setCorrectionBannerVisible(false)}
          >
            <Text style={{ color: "#14181D", fontWeight: "800", fontSize: 15 }}>
              Começar correção →
            </Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.centerBody, { flexGrow: 1 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        <View
          style={[
            styles.badgePill,
            { backgroundColor: isCorrectionPhase ? palette.surfaceAlt : palette.accentSoft },
          ]}
        >
          <Text
            style={{
              color: isCorrectionPhase ? palette.gold : palette.accent,
              fontSize: 11,
              fontWeight: "800",
              letterSpacing: 0.8,
            }}
          >
            {isCorrectionPhase ? `CORREÇÃO DE ERRO • ${current.badge}` : current.badge}
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <Text style={[styles.prompt, { color: palette.text }]}>{current.prompt}</Text>

          {current.audioText && (
            <Pressable
              accessibilityRole="button"
              style={[styles.audioBtn, { backgroundColor: palette.accentSoft, borderColor: palette.accent }]}
              onPress={() => void speakPtBr(current.audioText!, { rate: 0.88 })}
            >
              <AppIcon name="volume" size={18} color={palette.accent} />
              <Text style={{ color: palette.accent, fontWeight: "700", fontSize: 14 }}>
                Ouvir pronúncia (PT-BR)
              </Text>
            </Pressable>
          )}

          {current.hint && (
            <Pressable onPress={() => setShowHint((v) => !v)} style={{ alignSelf: "flex-start" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                <AppIcon name="lightbulb" size={14} color={palette.accent} />
                <Text style={{ color: palette.accent, fontSize: 12, fontWeight: "700" }}>
                  {showHint ? "Ocultar dica" : "Ver dica"}
                </Text>
              </View>
            </Pressable>
          )}
          {showHint && current.hint && (
            <Text style={{ color: palette.muted, fontSize: 13 }}>{current.hint}</Text>
          )}

          {current.mode === "writing" ? (
            <View style={{ gap: 10 }}>
              <TextInput
                placeholder="Digite a palavra..."
                placeholderTextColor={palette.muted}
                value={typed}
                onChangeText={setTyped}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!picked}
                style={[
                  styles.input,
                  { backgroundColor: palette.surfaceAlt, borderColor: palette.border, color: palette.text },
                ]}
              />
              {!picked && (
                <Pressable
                  style={[styles.primaryBtn, { backgroundColor: palette.accent }]}
                  onPress={() => {
                    if (typed.trim().length > 0) submitAnswer(typed);
                  }}
                >
                  <Text style={{ color: palette.accentInk, fontWeight: "700" }}>Verificar</Text>
                </Pressable>
              )}
            </View>
          ) : (
            <View style={{ gap: 9 }}>
              {(current.options ?? []).map((opt) => {
                const selected = picked === opt;
                const rightOpt = norm(opt) === norm(current.correct);
                let bg = palette.surfaceAlt;
                let border = palette.border;
                if (picked && rightOpt) {
                  bg = palette.accentSoft;
                  border = palette.success;
                } else if (selected && !rightOpt) {
                  bg = palette.surfaceAlt;
                  border = palette.danger;
                }
                return (
                  <Pressable
                    key={opt}
                    accessibilityRole="button"
                    style={[styles.optBtn, { backgroundColor: bg, borderColor: border }]}
                    onPress={() => submitAnswer(opt)}
                  >
                    <Text style={{ color: palette.text, fontSize: 15, fontWeight: "600" }}>
                      {opt}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
        </ScrollView>
      )}

      {!correctionBannerVisible && picked && (
        <View
          style={[
            styles.feedbackFooter,
            {
              backgroundColor: palette.surface,
              borderTopColor: isHit ? palette.success : palette.danger,
            },
          ]}
        >
          <Text
            style={{
              color: isHit ? palette.success : palette.danger,
              fontWeight: "800",
              fontSize: 14,
            }}
          >
            {isHit ? "Correto!" : `Quase! Resposta: "${current.correct}" (volta no final)`}
          </Text>
          <Text style={{ color: palette.muted, fontSize: 12 }}>{current.explanation}</Text>
          <Pressable
            style={[
              styles.primaryBtn,
              { backgroundColor: isHit ? palette.accent : palette.danger },
            ]}
            onPress={advance}
          >
            <Text style={{ color: palette.accentInk, fontWeight: "800" }}>Continuar →</Text>
          </Pressable>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  exitBtn: { paddingHorizontal: 6, paddingVertical: 4 },
  progressTrack: { flex: 1, height: 8, borderRadius: 999, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 999 },
  centerBody: { flex: 1, justifyContent: "center", paddingHorizontal: 16, gap: 10 },
  badgePill: { alignSelf: "center", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  card: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 12 },
  prompt: { fontSize: 17, lineHeight: 24, fontWeight: "600" },
  audioBtn: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 16 },
  optBtn: { borderWidth: 1.5, borderRadius: 12, padding: 13, alignItems: "center" },
  primaryBtn: { borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  feedbackFooter: {
    borderTopWidth: 2,
    padding: 16,
    gap: 8,
  },
  doneWrap: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, gap: 14 },
  doneTitle: { fontSize: 24, fontWeight: "800" },
  statsRow: { flexDirection: "row", gap: 10, width: "100%", marginVertical: 6 },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    gap: 2,
  },
});
