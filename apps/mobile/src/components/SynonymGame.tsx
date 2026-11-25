import React, { useState } from "react";
import { Pressable, StyleSheet, Text, Vibration, View } from "react-native";
import { SYNONYM_ROUNDS } from "../data/mobileLexicon";
import type { VocabPalette } from "../theme/palettes";
import { playUiSound } from "../utils/soundEffects";

interface Props {
  palette: VocabPalette;
  soundEnabled: boolean;
  initialSeed?: number;
  onScore: (correct: boolean) => void;
}

export function SynonymGame({ palette, soundEnabled, initialSeed = 0, onScore }: Props) {
  const [index, setIndex] = useState(initialSeed);
  const [combo, setCombo] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);

  const round = SYNONYM_ROUNDS[index % SYNONYM_ROUNDS.length]!;
  const isCorrect = selected === round.correctSynonym;

  function choose(option: string) {
    if (selected) return;
    setSelected(option);
    const hit = option === round.correctSynonym;
    Vibration.vibrate(hit ? 15 : [0, 30, 40, 30]);
    playUiSound(hit ? "success" : "softError", soundEnabled);
    setCombo((c) => (hit ? c + 1 : 0));
    onScore(hit);
  }

  function nextRound() {
    setSelected(null);
    setIndex((i) => i + 1);
  }

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Text style={[styles.eyebrow, { color: palette.accent }]}>JOGO DE SINÔNIMOS</Text>
        <Text
          style={[
            styles.combo,
            { backgroundColor: palette.surfaceAlt, color: palette.text, borderColor: palette.border },
          ]}
        >
          Combo: {combo}x
        </Text>
      </View>

      <View
        style={[
          styles.targetCard,
          { backgroundColor: palette.surface, borderColor: palette.border },
        ]}
      >
        <Text style={[styles.promptLabel, { color: palette.muted }]}>
          Qual palavra é sinônimo mais preciso de:
        </Text>
        <Text style={[styles.targetWord, { color: palette.text }]}>{round.targetWord}</Text>
        <Text style={[styles.targetDef, { color: palette.muted }]}>{round.targetDefinition}</Text>
      </View>

      <View style={styles.optionsGrid}>
        {round.options.map((opt) => {
          const picked = selected === opt;
          const right = selected !== null && opt === round.correctSynonym;
          const wrong = picked && opt !== round.correctSynonym;
          return (
            <Pressable
              key={opt}
              style={[
                styles.optionBtn,
                { backgroundColor: palette.surface, borderColor: palette.border },
                right && { borderColor: palette.success, backgroundColor: palette.accentSoft },
                wrong && { borderColor: palette.danger },
              ]}
              onPress={() => choose(opt)}
            >
              <Text style={[styles.optionText, { color: palette.text }]}>{opt}</Text>
            </Pressable>
          );
        })}
      </View>

      {selected && (
        <View
          style={[
            styles.feedbackBox,
            { backgroundColor: palette.surface, borderColor: palette.border },
          ]}
        >
          <Text
            style={[
              styles.feedbackTitle,
              { color: isCorrect ? palette.success : palette.danger },
            ]}
          >
            {isCorrect ? "Acertou! +15 XP" : `Quase! O sinônimo exato é "${round.correctSynonym}"`}
          </Text>
          <Text style={[styles.feedbackHint, { color: palette.muted }]}>{round.nuanceHint}</Text>
          <Pressable
            style={[styles.nextBtn, { backgroundColor: palette.accent }]}
            onPress={nextRound}
          >
            <Text style={[styles.nextBtnText, { color: palette.accentInk }]}>Próxima rodada →</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 18, gap: 14 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  eyebrow: { fontSize: 12, fontWeight: "700", letterSpacing: 1.2 },
  combo: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: "600",
  },
  targetCard: { borderWidth: 1, borderRadius: 18, padding: 18, gap: 6 },
  promptLabel: { fontSize: 13 },
  targetWord: { fontSize: 30, fontWeight: "700" },
  targetDef: { fontSize: 14, lineHeight: 20 },
  optionsGrid: { gap: 9 },
  optionBtn: { borderWidth: 1.5, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16 },
  optionText: { fontSize: 16, fontWeight: "600" },
  feedbackBox: { borderWidth: 1, borderRadius: 14, padding: 15, gap: 8 },
  feedbackTitle: { fontSize: 15, fontWeight: "700" },
  feedbackHint: { fontSize: 13, lineHeight: 19 },
  nextBtn: { borderRadius: 10, paddingVertical: 12, alignItems: "center", marginTop: 4 },
  nextBtnText: { fontWeight: "700", fontSize: 14 },
});
