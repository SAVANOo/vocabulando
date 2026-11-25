import React, { useState } from "react";
import { Pressable, StyleSheet, Text, Vibration, View } from "react-native";
import type { VocabPalette } from "../theme/palettes";
import { playUiSound } from "../utils/soundEffects";

interface ParonymItem {
  id: string;
  sentence: string;
  options: [string, string];
  correct: string;
  explanation: string;
}

const PARONYM_ITEMS: ParonymItem[] = [
  {
    id: "par-1",
    sentence: "O conselho se reuniu para _______ o acordo assinado na semana passada.",
    options: ["ratificar", "retificar"],
    correct: "ratificar",
    explanation: "Ratificar = confirmar formalmente. Retificar = corrigir um erro.",
  },
  {
    id: "par-2",
    sentence: "A equipe precisou _______ os valores errados na planilha antes do envio.",
    options: ["ratificar", "retificar"],
    correct: "retificar",
    explanation: "Retificar significa tornar reto, corrigir uma falha.",
  },
  {
    id: "par-3",
    sentence: "Os alertas indicavam uma tempestade _______ na região serrana.",
    options: ["iminente", "eminente"],
    correct: "iminente",
    explanation: "Iminente = prestes a acontecer. Eminente = ilustre, elevado.",
  },
  {
    id: "par-4",
    sentence: "O evento recebeu uma _______ pesquisadora da área de linguística.",
    options: ["iminente", "eminente"],
    correct: "eminente",
    explanation: "Eminente refere-se a prestígio, notabilidade ou elevação.",
  },
];

interface Props {
  palette: VocabPalette;
  soundEnabled: boolean;
  initialSeed?: number;
  onScore: (wordId: string, correct: boolean) => void;
}

export function ParonymChallenge({ palette, soundEnabled, initialSeed = 0, onScore }: Props) {
  const [idx, setIdx] = useState(initialSeed);
  const [chosen, setChosen] = useState<string | null>(null);

  const item = PARONYM_ITEMS[idx % PARONYM_ITEMS.length]!;
  const isRight = chosen === item.correct;

  function pick(opt: string) {
    if (chosen) return;
    setChosen(opt);
    const hit = opt === item.correct;
    Vibration.vibrate(hit ? 14 : 35);
    playUiSound(hit ? "success" : "softError", soundEnabled);
    onScore(item.correct, hit);
  }

  return (
    <View style={styles.wrap}>
      <Text style={[styles.eyebrow, { color: palette.accent }]}>DESAFIO DE PARÔNIMOS</Text>
      <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <Text style={[styles.sentence, { color: palette.text }]}>{item.sentence}</Text>
        <View style={styles.row}>
          {item.options.map((opt) => {
            const right = chosen !== null && opt === item.correct;
            const wrong = chosen === opt && opt !== item.correct;
            return (
              <Pressable
                key={opt}
                style={[
                  styles.optBtn,
                  { backgroundColor: palette.surfaceAlt, borderColor: palette.border },
                  right && { borderColor: palette.success, backgroundColor: palette.accentSoft },
                  wrong && { borderColor: palette.danger },
                ]}
                onPress={() => pick(opt)}
              >
                <Text style={[styles.optText, { color: palette.text }]}>{opt}</Text>
              </Pressable>
            );
          })}
        </View>
        {chosen && (
          <View style={styles.feedback}>
            <Text style={{ color: isRight ? palette.success : palette.danger, fontWeight: "700" }}>
              {isRight ? "Exato! +15 XP" : `A escolha certa é "${item.correct}".`}
            </Text>
            <Text style={{ color: palette.muted, fontSize: 13 }}>{item.explanation}</Text>
            <Pressable
              style={[styles.nextBtn, { backgroundColor: palette.accent }]}
              onPress={() => {
                setChosen(null);
                setIdx((i) => i + 1);
              }}
            >
              <Text style={{ color: palette.accentInk, fontWeight: "700" }}>Próximo par →</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: "center", padding: 18, gap: 12 },
  eyebrow: { fontSize: 12, fontWeight: "700", letterSpacing: 1.1, textAlign: "center" },
  card: { borderWidth: 1, borderRadius: 18, padding: 18, gap: 14 },
  sentence: { fontSize: 17, lineHeight: 25 },
  row: { flexDirection: "row", gap: 10 },
  optBtn: { flex: 1, borderWidth: 1.5, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  optText: { fontSize: 16, fontWeight: "700" },
  feedback: { gap: 8, paddingTop: 4 },
  nextBtn: { borderRadius: 10, paddingVertical: 12, alignItems: "center", marginTop: 4 },
});
