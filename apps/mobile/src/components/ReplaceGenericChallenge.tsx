import React, { useState } from "react";
import { Pressable, StyleSheet, Text, Vibration, View } from "react-native";
import type { VocabPalette } from "../theme/palettes";
import { playUiSound } from "../utils/soundEffects";

interface UpgradeRound {
  id: string;
  wordId: string;
  tone: "Natural" | "Executivo" | "Literário";
  before: string;
  genericWord: string;
  after: string;
  options: string[];
  correct: string;
  why: string;
}

const UPGRADE_ROUNDS: UpgradeRound[] = [
  {
    id: "upg-1",
    wordId: "ratificar",
    tone: "Executivo",
    before: "Precisamos",
    genericWord: "confirmar",
    after: "o acordo ainda hoje.",
    options: ["ratificar", "retificar", "hesitar"],
    correct: "ratificar",
    why: "Ratificar significa confirmar formalmente uma decisão ou acordo.",
  },
  {
    id: "upg-2",
    wordId: "concisao",
    tone: "Executivo",
    before: "O relatório teve muita",
    genericWord: "clareza curta",
    after: "na reunião.",
    options: ["prolixidade", "concisão", "melancolia"],
    correct: "concisão",
    why: "Concisão é dizer o essencial com economia de palavras e precisão.",
  },
  {
    id: "upg-3",
    wordId: "perspicacia",
    tone: "Natural",
    before: "Ela percebeu o detalhe com muita",
    genericWord: "esperteza",
    after: "no debate.",
    options: ["perspicácia", "candura", "sinergia"],
    correct: "perspicácia",
    why: "Perspicácia expressa agudeza de espírito para notar nuances sutis.",
  },
  {
    id: "upg-4",
    wordId: "efemero",
    tone: "Literário",
    before: "O sucesso daquele filme foi bem",
    genericWord: "passageiro",
    after: "nas salas.",
    options: ["inexorável", "efêmero", "tácito"],
    correct: "efêmero",
    why: "Efêmero descreve algo breve e transitório com elegância.",
  },
  {
    id: "upg-5",
    wordId: "pragmatico",
    tone: "Executivo",
    before: "Adotamos um plano mais",
    genericWord: "prático",
    after: "para entregar no prazo.",
    options: ["pragmático", "ubíquo", "magnânimo"],
    correct: "pragmático",
    why: "Pragmático enfatiza foco em resultado concreto e viabilidade real.",
  },
];

interface Props {
  palette: VocabPalette;
  soundEnabled: boolean;
  initialSeed?: number;
  onScore: (wordId: string, hit: boolean) => void;
}

export function ReplaceGenericChallenge({ palette, soundEnabled, initialSeed = 0, onScore }: Props) {
  const [roundIdx, setRoundIdx] = useState(initialSeed);
  const [picked, setPicked] = useState<string | null>(null);

  const round = UPGRADE_ROUNDS[roundIdx % UPGRADE_ROUNDS.length]!;
  const isRight = picked === round.correct;

  function choose(opt: string) {
    if (picked) return;
    setPicked(opt);
    const hit = opt === round.correct;
    Vibration.vibrate(hit ? 14 : 30);
    playUiSound(hit ? "success" : "softError", soundEnabled);
    onScore(round.wordId, hit);
  }

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Text style={[styles.eyebrow, { color: palette.accent }]}>SUBSTITUA O GENÉRICO</Text>
        <View style={[styles.tonePill, { backgroundColor: palette.accentSoft, borderColor: palette.accent }]}>
          <Text style={{ color: palette.accent, fontSize: 11, fontWeight: "700" }}>
            Tom: {round.tone}
          </Text>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <Text style={{ color: palette.muted, fontSize: 12 }}>
          Eleve a precisão da frase trocando o termo destacado:
        </Text>
        <Text style={[styles.sentence, { color: palette.text }]}>
          {round.before}{" "}
          <Text style={{ color: palette.gold, textDecorationLine: "underline", fontWeight: "700" }}>
            {round.genericWord}
          </Text>{" "}
          {round.after}
        </Text>

        <View style={{ gap: 10 }}>
          {round.options.map((opt) => {
            const isPicked = picked === opt;
            const isCorrect = opt === round.correct;
            let bg = palette.surfaceAlt;
            let border = palette.border;
            if (picked && isCorrect) {
              bg = palette.accentSoft;
              border = palette.success;
            } else if (isPicked && !isCorrect) {
              bg = palette.surfaceAlt;
              border = palette.danger;
            }
            return (
              <Pressable
                key={opt}
                accessibilityRole="button"
                style={[styles.optBtn, { backgroundColor: bg, borderColor: border }]}
                onPress={() => choose(opt)}
              >
                <Text style={{ color: palette.text, fontSize: 15, fontWeight: "600" }}>{opt}</Text>
              </Pressable>
            );
          })}
        </View>

        {picked && (
          <View style={{ gap: 10 }}>
            <Text style={{ color: isRight ? palette.success : palette.danger, fontWeight: "700", fontSize: 13 }}>
              {isRight ? "Escolha precisa! " : `Melhor opção: "${round.correct}". `}
              {round.why}
            </Text>
            <Pressable
              style={[styles.nextBtn, { backgroundColor: palette.accent }]}
              onPress={() => {
                setPicked(null);
                setRoundIdx((r) => r + 1);
              }}
            >
              <Text style={{ color: palette.accentInk, fontWeight: "700" }}>Próxima frase →</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 18, gap: 12 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  eyebrow: { fontSize: 12, fontWeight: "700", letterSpacing: 1.1 },
  tonePill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  card: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 14 },
  sentence: { fontSize: 18, lineHeight: 26 },
  optBtn: { borderWidth: 1.5, borderRadius: 12, padding: 13, alignItems: "center" },
  nextBtn: { borderRadius: 12, paddingVertical: 12, alignItems: "center" },
});
