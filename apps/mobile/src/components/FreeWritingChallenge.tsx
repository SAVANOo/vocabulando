import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, Vibration, View } from "react-native";
import { MOBILE_LEXICON, type MobileWordEntry } from "../data/mobileLexicon";
import type { VocabPalette } from "../theme/palettes";
import { playUiSound } from "../utils/soundEffects";

interface Props {
  palette: VocabPalette;
  soundEnabled: boolean;
  words?: MobileWordEntry[];
  initialSeed?: number;
  onScore: (wordId: string, hit: boolean) => void;
}

function stripAccents(t: string): string {
  return t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function FreeWritingChallenge({
  palette,
  soundEnabled,
  words = MOBILE_LEXICON,
  initialSeed = 0,
  onScore,
}: Props) {
  const [round, setRound] = useState(0);
  const [sentence, setSentence] = useState("");
  const [feedback, setFeedback] = useState<{ hit: boolean; text: string } | null>(null);

  const pool = words.length > 0 ? words : MOBILE_LEXICON;
  const target = pool[(initialSeed + round * 3) % pool.length]!;

  function evaluate() {
    if (feedback) return;
    const clean = sentence.trim();
    const normSentence = stripAccents(clean);
    const stem = stripAccents(target.word).slice(0, Math.max(4, target.word.length - 2));
    const hasWord = normSentence.includes(stem);
    const wordCount = clean.split(/\s+/).filter(Boolean).length;

    if (!hasWord) {
      Vibration.vibrate(25);
      playUiSound("softError", soundEnabled);
      setFeedback({
        hit: false,
        text: `Tente incluir "${target.word}" na sua frase para praticar o uso real.`,
      });
      return;
    }

    if (wordCount < 4) {
      Vibration.vibrate(25);
      playUiSound("softError", soundEnabled);
      setFeedback({
        hit: false,
        text: `Escreva uma frase mais completa (pelo menos 4 palavras) usando "${target.word}".`,
      });
      return;
    }

    Vibration.vibrate(15);
    playUiSound("success", soundEnabled);
    setFeedback({
      hit: true,
      text: `Ótima construção! Você aplicou "${target.word}" em um contexto próprio (+15 XP).`,
    });
    onScore(target.id, true);
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.eyebrow, { color: palette.accent }]}>
        PRÁTICA LIVRE • USE NA SUA FRASE
      </Text>
      <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <Text style={{ color: palette.text, fontSize: 24, fontWeight: "800" }}>{target.word}</Text>
        <Text style={{ color: palette.muted, fontSize: 13, lineHeight: 19 }}>{target.definition}</Text>

        <TextInput
          accessibilityLabel={`Escreva uma frase usando ${target.word}`}
          placeholder={`Ex.: Escreva uma frase sua com "${target.word}"...`}
          placeholderTextColor={palette.muted}
          multiline
          numberOfLines={3}
          value={sentence}
          onChangeText={setSentence}
          editable={!feedback?.hit}
          style={[
            styles.input,
            {
              backgroundColor: palette.surfaceAlt,
              borderColor: palette.border,
              color: palette.text,
            },
          ]}
        />

        {!feedback?.hit ? (
          <Pressable
            accessibilityRole="button"
            style={[styles.btn, { backgroundColor: palette.accent }]}
            onPress={() => {
              if (feedback && !feedback.hit) setFeedback(null);
              evaluate();
            }}
          >
            <Text style={{ color: palette.accentInk, fontWeight: "700" }}>Avaliar minha frase</Text>
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            style={[styles.btn, { backgroundColor: palette.accent }]}
            onPress={() => {
              setSentence("");
              setFeedback(null);
              setRound((r) => r + 1);
            }}
          >
            <Text style={{ color: palette.accentInk, fontWeight: "700" }}>Próxima palavra →</Text>
          </Pressable>
        )}

        {feedback && (
          <Text
            style={{
              color: feedback.hit ? palette.success : palette.danger,
              fontSize: 13,
              fontWeight: "700",
            }}
          >
            {feedback.text}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 18, gap: 12 },
  eyebrow: { fontSize: 12, fontWeight: "700", letterSpacing: 1.1, textAlign: "center" },
  card: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 12 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    minHeight: 84,
    textAlignVertical: "top",
  },
  btn: { borderRadius: 12, paddingVertical: 12, alignItems: "center" },
});
