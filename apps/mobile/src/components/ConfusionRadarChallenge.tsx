import React, { useState } from "react";
import { Pressable, StyleSheet, Text, Vibration, View } from "react-native";
import type { VocabPalette } from "../theme/palettes";
import { playUiSound } from "../utils/soundEffects";

interface ContrastPair {
  id: string;
  pairTitle: string;
  wordA: string;
  meaningA: string;
  sentenceA: string;
  wordB: string;
  meaningB: string;
  sentenceB: string;
  askWord: "A" | "B";
}

const CONTRAST_PAIRS: ContrastPair[] = [
  {
    id: "rad-1",
    pairTitle: "Ratificar vs. Retificar",
    wordA: "ratificar",
    meaningA: "confirmar formalmente",
    sentenceA: "A diretoria vai _______ o contrato assinado ontem.",
    wordB: "retificar",
    meaningB: "corrigir um erro",
    sentenceB: "Precisamos _______ os números errados na tabela.",
    askWord: "A",
  },
  {
    id: "rad-2",
    pairTitle: "Iminente vs. Eminente",
    wordA: "iminente",
    meaningA: "prestes a acontecer",
    sentenceA: "O céu escuro indica chuva _______.",
    wordB: "eminente",
    meaningB: "ilustre, notável",
    sentenceB: "Recebemos uma _______ pesquisadora no simpósio.",
    askWord: "B",
  },
  {
    id: "rad-3",
    pairTitle: "Discrição vs. Descrição",
    wordA: "discrição",
    meaningA: "reserva, modéstia",
    sentenceA: "O assunto exige total _______ da equipe.",
    wordB: "descrição",
    meaningB: "ato de detalhar algo",
    sentenceB: "A _______ do cenário no livro é muito vívida.",
    askWord: "A",
  },
  {
    id: "rad-4",
    pairTitle: "Deferir vs. Diferir",
    wordA: "deferir",
    meaningA: "conceder, aprovar",
    sentenceA: "O juiz decidiu _______ o pedido da defesa.",
    wordB: "diferir",
    meaningB: "ser diferente ou adiar",
    sentenceB: "Nossas opiniões costumam _______ sobre esse tema.",
    askWord: "B",
  },
];

interface Props {
  palette: VocabPalette;
  soundEnabled: boolean;
  initialSeed?: number;
  onScore: (wordId: string, hit: boolean) => void;
}

export function ConfusionRadarChallenge({ palette, soundEnabled, initialSeed = 0, onScore }: Props) {
  const [idx, setIdx] = useState(initialSeed);
  const [picked, setPicked] = useState<string | null>(null);

  const pair = CONTRAST_PAIRS[idx % CONTRAST_PAIRS.length]!;
  const targetSentence = pair.askWord === "A" ? pair.sentenceA : pair.sentenceB;
  const correctWord = pair.askWord === "A" ? pair.wordA : pair.wordB;
  const isRight = picked === correctWord;

  function choose(opt: string) {
    if (picked) return;
    setPicked(opt);
    const hit = opt === correctWord;
    Vibration.vibrate(hit ? 14 : 32);
    playUiSound(hit ? "success" : "softError", soundEnabled);
    onScore(correctWord, hit);
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.eyebrow, { color: palette.accent }]}>
        RADAR DE CONFUSÃO • NÃO CONFUNDA
      </Text>
      <Text style={[styles.title, { color: palette.text }]}>{pair.pairTitle}</Text>

      <View style={styles.compareRow}>
        <View style={[styles.miniCard, { backgroundColor: palette.surfaceAlt, borderColor: palette.border }]}>
          <Text style={{ color: palette.accent, fontWeight: "700", fontSize: 13 }}>{pair.wordA}</Text>
          <Text style={{ color: palette.muted, fontSize: 12 }}>{pair.meaningA}</Text>
        </View>
        <View style={[styles.miniCard, { backgroundColor: palette.surfaceAlt, borderColor: palette.border }]}>
          <Text style={{ color: palette.accent, fontWeight: "700", fontSize: 13 }}>{pair.wordB}</Text>
          <Text style={{ color: palette.muted, fontSize: 12 }}>{pair.meaningB}</Text>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <Text style={[styles.sentence, { color: palette.text }]}>{targetSentence}</Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          {[pair.wordA, pair.wordB].map((opt) => {
            const isPicked = picked === opt;
            const isCorrect = opt === correctWord;
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
                <Text style={{ color: palette.text, fontWeight: "700", fontSize: 15 }}>{opt}</Text>
              </Pressable>
            );
          })}
        </View>

        {picked && (
          <View style={{ gap: 10 }}>
            <Text style={{ color: isRight ? palette.success : palette.danger, fontWeight: "700", fontSize: 13 }}>
              {isRight ? "Contraste dominado!" : `Aqui o correto é "${correctWord}".`}
            </Text>
            <Pressable
              style={[styles.nextBtn, { backgroundColor: palette.accent }]}
              onPress={() => {
                setPicked(null);
                setIdx((i) => i + 1);
              }}
            >
              <Text style={{ color: palette.accentInk, fontWeight: "700" }}>Próximo contraste →</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 18, gap: 12 },
  eyebrow: { fontSize: 11, fontWeight: "700", letterSpacing: 1.1, textAlign: "center" },
  title: { fontSize: 20, fontWeight: "700", textAlign: "center" },
  compareRow: { flexDirection: "row", gap: 8 },
  miniCard: { flex: 1, borderWidth: 1, borderRadius: 14, padding: 10, gap: 4 },
  card: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 14 },
  sentence: { fontSize: 17, lineHeight: 24 },
  optBtn: { flex: 1, borderWidth: 1.5, borderRadius: 12, paddingVertical: 13, alignItems: "center" },
  nextBtn: { borderRadius: 12, paddingVertical: 12, alignItems: "center" },
});
