import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, Vibration, View } from "react-native";
import { MOBILE_LEXICON, type MobileWordEntry } from "../data/mobileLexicon";
import type { VocabPalette } from "../theme/palettes";
import { playUiSound } from "../utils/soundEffects";

interface Props {
  palette: VocabPalette;
  soundEnabled: boolean;
  words?: MobileWordEntry[];
  onScore: (wordId: string, hit: boolean) => void;
}

export function TimedSprintChallenge({
  palette,
  soundEnabled,
  words = MOBILE_LEXICON,
  onScore,
}: Props) {
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [running, setRunning] = useState(false);
  const [idx, setIdx] = useState(0);
  const [hits, setHits] = useState(0);

  const pool = words.length > 0 ? words : MOBILE_LEXICON;
  const target = pool[idx % pool.length]!;
  const distractor1 = MOBILE_LEXICON[(idx + 3) % MOBILE_LEXICON.length]!;
  const distractor2 = MOBILE_LEXICON[(idx + 7) % MOBILE_LEXICON.length]!;
  const options = [target.word, distractor1.word, distractor2.word].sort();

  useEffect(() => {
    if (!running || secondsLeft <= 0) return;
    const timer = setTimeout(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          setRunning(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [running, secondsLeft]);

  function startSprint() {
    setSecondsLeft(60);
    setHits(0);
    setIdx(0);
    setRunning(true);
  }

  function answer(opt: string) {
    if (!running || secondsLeft <= 0) return;
    const hit = opt === target.word;
    Vibration.vibrate(hit ? 10 : 25);
    playUiSound(hit ? "success" : "softError", soundEnabled);
    if (hit) setHits((h) => h + 1);
    onScore(target.id, hit);
    setIdx((i) => i + 1);
  }

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Text style={[styles.eyebrow, { color: palette.accent }]}>DESAFIO 60 SEGUNDOS</Text>
        <Text style={{ color: secondsLeft <= 10 ? palette.danger : palette.gold, fontWeight: "800", fontSize: 15 }}>
          {secondsLeft}s • {hits} acertos
        </Text>
      </View>

      {!running ? (
        <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <Text style={{ color: palette.text, fontSize: 18, fontWeight: "700", textAlign: "center" }}>
            {secondsLeft === 0 ? `Tempo esgotado! ${hits} acertos.` : "Treino rápido de reflexo lexical"}
          </Text>
          <Text style={{ color: palette.muted, fontSize: 13, textAlign: "center" }}>
            Associe o máximo de definições em 60 segundos sem perder vidas.
          </Text>
          <Pressable style={[styles.btn, { backgroundColor: palette.accent }]} onPress={startSprint}>
            <Text style={{ color: palette.accentInk, fontWeight: "700" }}>
              {secondsLeft === 0 ? "Jogar novamente" : "Começar 60s →"}
            </Text>
          </Pressable>
        </View>
      ) : (
        <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <Text style={{ color: palette.text, fontSize: 16, lineHeight: 23 }}>{target.definition}</Text>
          <View style={{ gap: 8 }}>
            {options.map((opt) => (
              <Pressable
                key={opt}
                style={[styles.optBtn, { backgroundColor: palette.surfaceAlt, borderColor: palette.border }]}
                onPress={() => answer(opt)}
              >
                <Text style={{ color: palette.text, fontWeight: "700", fontSize: 15 }}>{opt}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 18, gap: 12 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  eyebrow: { fontSize: 12, fontWeight: "700", letterSpacing: 1.1 },
  card: { borderWidth: 1, borderRadius: 18, padding: 18, gap: 14 },
  optBtn: { borderWidth: 1, borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  btn: { borderRadius: 12, paddingVertical: 12, alignItems: "center" },
});
